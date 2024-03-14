import { ICommonObject, INodeOutputsValue, INode, INodeData, INodeParams } from '../../../src/Interface'
import { TextSplitter } from 'langchain/text_splitter'
import { BaseDocumentLoader } from 'langchain/document_loaders/base'
import { Document } from 'langchain/document'
import { LLMChain } from 'langchain/chains'
import { getCredentialData, getCredentialParam } from '../../../src/utils'
import { ChatPromptTemplate } from 'langchain/prompts'
import { ConsoleCallbackHandler, additionalCallbacks } from '../../../src/handler'
import axios from 'axios'

class Jira_DocumentLoaders implements INode {
    label: string
    name: string
    version: number
    description: string
    type: string
    icon: string
    category: string
    baseClasses: string[]
    credential: INodeParams
    inputs?: INodeParams[]
    outputs?: INodeOutputsValue[]

    constructor() {
        this.label = 'Jira Views'
        this.name = 'jiraViews'
        this.version = 1.0
        this.type = 'Document'
        this.icon = 'jira.png'
        this.category = 'Document Loaders'
        this.description = `Choose a Jira view to load documents from.`
        this.baseClasses = [this.type]
        this.credential = {
            label: 'Connect Credential',
            name: 'credential',
            type: 'credential',
            credentialNames: ['JiraApi'] // This should be changed to the correct credential name
        }
        this.inputs = [
            {
                label: 'Text Splitter',
                name: 'textSplitter',
                type: 'TextSplitter',
                optional: true
            },
            {
                label: 'Summarize Chain',
                name: 'summarizeChain',
                type: 'LLMChain',
                optional: true
            },
            {
                label: 'Jira JQL',
                name: 'jql',
                type: 'string'
            },
            {
                label: 'Max Results',
                name: 'maxResults',
                type: 'number',
                default: 50
            },
            {
                label: 'Fields',
                name: 'fields',
                type: 'string',
                description: 'A comma seperated list of fields to return'
            }
        ]
        this.outputs = [
            {
                label: 'Documents',
                name: 'retriever',
                baseClasses: ['Document']
            },
            {
                label: 'String',
                name: 'string',
                baseClasses: ['string']
            }
        ]
    }
    async init(nodeData: INodeData, _: string, options: ICommonObject): Promise<any> {
        const loggerHandler = new ConsoleCallbackHandler(options.logger)
        const callbacks = await additionalCallbacks(nodeData, options)
        const credentialData = await getCredentialData(nodeData.credential ?? '', options)
        const textSplitter = nodeData.inputs?.textSplitter as TextSplitter
        const summarizeChain = nodeData.inputs?.summarizeChain as LLMChain
        const jql = nodeData.inputs?.jql as string
        const fields = nodeData.inputs?.fields as string
        const maxResults = nodeData.inputs?.maxResults as number
        const email = getCredentialParam('email', credentialData, nodeData)
        const apiKey = getCredentialParam('apiKey', credentialData, nodeData)
        const domain = getCredentialParam('domain', credentialData, nodeData)

        let docs: any[] = []

        const loader = new JiraLoader({ jql, maxResults, email, apiKey, domain, fields })
        const entries = await loader.load()
        if (!entries) return []
        if (summarizeChain) {
            // Process entries in batches
            const batchSize = 20
            const delay = 1000 // Delay of 1 second between batches

            for (let i = 0; i < entries.length; i += batchSize) {
                const batch = entries.slice(i, i + batchSize)

                const batchPromises = batch.map(async (issue) => {
                    const newChatPromptTemplate = ChatPromptTemplate.fromMessages([
                        ['system', 'You are a Jira Ticket Summarizer'],
                        ['human', `I want you to create a detailed executive summary for the following issue: ${issue.details}`]
                    ])

                    const summarizerChain = new LLMChain({
                        llm: summarizeChain.llm,
                        prompt: newChatPromptTemplate
                    })

                    return summarizerChain
                        .call(options, [loggerHandler, ...callbacks])
                        .then((res) => new Document({ pageContent: res?.text, metadata: issue.metadata }))
                })

                // Wait for all promises in the batch to resolve before proceeding
                const resolvedBatch = await Promise.all(batchPromises)
                docs.push(...resolvedBatch)

                // If not the last batch, wait before proceeding to the next one
                if (i + batchSize < entries.length) {
                    await new Promise((resolve) => setTimeout(resolve, delay))
                }
            }
        } else {
            docs = entries.map(
                (issue) =>
                    new Document({
                        pageContent: issue.details,
                        metadata: issue.metadata
                    })
            )
        }

        return docs
    }
}

interface JiraLoaderParams {
    jql: string
    maxResults: number
    email: string
    apiKey: string
    domain: string
    fields: string
}

interface JiraLoaderResponse {
    data: {
        expand: string
        issues: JiraIssue[]
        maxResults: number
        startAt: number
        total: number
        warningMessages: string[]
    }
}

interface JiraIssue {
    id: string
    key: string
    fields: IField
}

interface IField {
    [key: string]: any
}

class JiraLoader extends BaseDocumentLoader {
    public readonly jql: string
    public readonly maxResults: number
    public readonly email: string
    public readonly apiKey: string
    public readonly domain: string
    public readonly fields: string
    public summarizeChain: LLMChain

    constructor({ jql, maxResults, email, apiKey, domain, fields }: JiraLoaderParams) {
        super()
        this.jql = jql
        this.maxResults = maxResults
        this.email = email
        this.apiKey = apiKey
        this.domain = domain
        this.fields = fields
    }

    public async load(): Promise<any[]> {
        return this.runQuery()
    }

    private processRichTextFields(contentObject: any): string {
        if (!contentObject) return ''

        if (contentObject.type === 'doc') {
            return contentObject.content.map((item: any) => `${this.processRichTextFields(item)}`).join('')
        } else if (contentObject.type === 'text') {
            return contentObject.text
        } else if (contentObject.type === 'hardBreak') {
            return ' '
        } else if (contentObject.type === 'mention') {
            return `@${contentObject.attrs.username}`
        } else if (contentObject.type === 'emoji') {
            return ''
        } else if (contentObject.type === 'link') {
            return `[${contentObject.text}](${contentObject.attrs.url})`
        } else if (contentObject.type === 'mediaGroup') {
            return contentObject.content.map(this.processRichTextFields).join('')
        } else if (contentObject.type === 'paragraph') {
            return `${contentObject.content.map(this.processRichTextFields).join('')}. `
        } else if (contentObject.type === 'bulletList') {
            return contentObject.content.map((item: any) => `${this.processRichTextFields(item)}`).join('')
        } else if (contentObject.type === 'listItem') {
            return contentObject.content.map((item: any) => `- ${this.processRichTextFields(item)}`).join('')
        } else if (contentObject.type === 'orderedList') {
            return contentObject.content.map((item: any, index: number) => `${index + 1}. ${this.processRichTextFields(item)}`).join('')
        } else if (contentObject.type === 'heading') {
            return `\n${'#'.repeat(contentObject.attrs.level)} ${contentObject.content.map(this.processRichTextFields).join('')}\n`
        } else if (contentObject.type === 'codeBlock') {
            return `\`\`\`\n${contentObject.text}\n\`\`\`\n`
        } else if (contentObject.type === 'blockquote') {
            return `> ${contentObject.content.map(this.processRichTextFields).join('')}\n`
        } else {
            return ''
        }
    }

    private processComments(comments: any[]): string {
        let commentString = ''
        comments.forEach((comment) => {
            commentString += `
            Comment by: ${comment.author.displayName}
            Date: ${comment.created}
            Comment: ${this.processRichTextFields(comment.body)}
            `
        })
        return commentString
    }

    private async runQuery(): Promise<any[]> {
        let jiraResponse: JiraLoaderResponse
        let returnPages: any[] = []
        // const loggerHandler = new ConsoleCallbackHandler(options.logger)
        // const callbacks = await additionalCallbacks(nodeData, options)

        const encodedJqlQuery = encodeURIComponent(this.jql)
        const convertedApiuKey = Buffer.from(`${this.email}:${this.apiKey}`).toString('base64')
        jiraResponse = await axios.get(
            `${this.domain}/rest/api/3/search?jql=${encodedJqlQuery}&maxResults=${this.maxResults}&expand=names,changelog`,
            {
                headers: {
                    Authorization: `Basic ${convertedApiuKey}`,
                    Accept: 'application/json'
                }
            }
        )

        const issues = jiraResponse?.data?.issues
        if (!issues) {
            return []
        }

        const cleanedIssues = []
        for (let index = 0; index < issues.length; index++) {
            const issue = issues[index]
            const fields = issue.fields
            cleanedIssues.push({
                details: `
                Key: ${issue.key}
                Summary: ${fields?.summary}
                Status: ${fields?.status?.name}
                Priority: ${fields?.priority?.name}
                Last Updated: ${fields?.updated}
                Created By; ${fields?.creator?.displayName}
                Assigned To: ${JSON.stringify(fields?.assignee?.displayName, null, 2)}
                Description: ${this.processRichTextFields(fields?.description)}
                Github URL: ${fields?.customfield_10000} // Check custom field
                Related Tickets: ${fields?.issuelinks?.map((link: any) => link?.inwardIssue?.key).join(', ')}
                Comments: 
                `,
                metadata: {
                    source: `https://${this.domain}/browse/${issue.key}`,
                    project: issue.key.trim().split('-')[0],
                    status: fields?.status?.name,
                    assignedTo: fields?.assignee?.displayName,
                    doctype: 'jiraIssue'
                }
            })
        }

        return cleanedIssues
    }
}

module.exports = {
    nodeClass: Jira_DocumentLoaders
}
