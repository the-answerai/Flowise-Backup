import { ICommonObject, INode, INodeData, INodeParams } from '../../../src/Interface'
import { TextSplitter } from 'langchain/text_splitter'
import { BaseDocumentLoader } from 'langchain/document_loaders/base'
import { Block, Inline, Node, helpers } from '@contentful/rich-text-types'
import { Document } from 'langchain/document'
import * as contentful from 'contentful'
// import { documentToPlainTextString } from '@contentful/rich-text-plain-text-renderer'
import { getCredentialData, getCredentialParam } from '../../../src/utils'

export function documentToPlainTextString(
    rootNode: Block | Inline,
    blockDivisor: string = ' ',
    parsingRules: any = {},
    processContentObjectMethod: Function
): string {
    if (!rootNode || !rootNode.content || !Array.isArray(rootNode.content)) {
        /**
         * Handles edge cases, such as when the value is not set in the CMA or the
         * field has not been properly validated, e.g. because of a user extension.
         * Note that we are nevertheless strictly type-casting `rootNode` as
         * Block | Inline. Valid rich text documents (and their branch block nodes)
         * should never lack a Node[] `content` property.
         */
        return ''
    }

    return (rootNode as Block).content.reduce((acc: string, node: Node, i: number): string => {
        let nodeTextValue: string = ''

        // Check against parsing rules before processing the node
        if (node.nodeType in parsingRules && parsingRules[node.nodeType] === false) {
            // Skip processing this node as per the parsing rules
            return acc
        }

        if (helpers.isText(node)) {
            nodeTextValue = node.value
        } else if (helpers.isBlock(node) || helpers.isInline(node)) {
            if (node.nodeType === 'embedded-asset-block') {
                nodeTextValue = `![${node.data.target.fields.title}](https:${node.data.target.fields.file.url})`
            } else if (node.nodeType === 'embedded-entry-block' || node.nodeType === 'embedded-entry-inline') {
                // Assuming node.data.target contains the content object for the embedded entry
                const embeddedContentObject = node.data.target
                // Call processContentObject on the embedded content object
                // You might need to adjust how you access the configuration for specific content types
                nodeTextValue = processContentObjectMethod(
                    embeddedContentObject,
                    parsingRules.embeddedContentTypes[embeddedContentObject.sys.contentType.sys.id]
                )
            } else {
                nodeTextValue = documentToPlainTextString(node, blockDivisor, parsingRules, processContentObjectMethod)
            }
            if (!nodeTextValue.length) {
                return acc
            }
        }

        const nextNode = rootNode.content[i + 1]
        const isNextNodeBlock = nextNode && helpers.isBlock(nextNode)
        const divisor = isNextNodeBlock ? blockDivisor : ''
        return acc + nodeTextValue + divisor
    }, '')
}

class Contentful_DocumentLoaders implements INode {
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

    constructor() {
        this.label = 'Contentful'
        this.name = 'contentful'
        this.version = 1.0
        this.type = 'Document'
        this.icon = 'contentful.png'
        this.category = 'Document Loaders'
        this.description = `Load data from a Contentful Space`
        this.baseClasses = [this.type]
        this.credential = {
            label: 'Connect Credential',
            name: 'credential',
            type: 'credential',
            credentialNames: ['contentfulDeliveryApi']
        }
        this.inputs = [
            {
                label: 'Text Splitter',
                name: 'textSplitter',
                type: 'TextSplitter',
                optional: true
            },
            {
                label: 'Config Utility',
                name: 'configUtility',
                type: 'json',
                acceptVariable: true
            },
            {
                label: ' Content Type',
                name: 'contentType',
                type: 'string',
                placeholder: 'pageBlog',
                default: 'pageBlog',
                description: 'The content type to query'
            },
            {
                label: 'Environment Id',
                name: 'environmentId',
                type: 'string',
                placeholder: 'master',
                default: 'master',
                additionalParams: true,
                description:
                    'If your table URL looks like: https://app.contentful.com/spaces/abjv67t9l34s/environments/master-starter-v2/views/entries, master-starter-v2 is the environment id'
            },
            {
                label: 'Include Levels',
                name: 'include',
                type: 'number',
                optional: true,
                additionalParams: true,
                description: 'The number of levels to include in the response'
            },
            {
                label: 'Include All',
                name: 'includeAll',
                type: 'boolean',
                optional: true,
                additionalParams: true,
                description: 'Include all entries in the response'
            },
            {
                label: 'Limit',
                name: 'limit',
                type: 'number',
                optional: true,
                additionalParams: true,
                description: 'The limit of items to return default is 50'
            },
            {
                label: 'Search Query',
                name: 'metadata',
                type: 'json',
                optional: true,
                additionalParams: true
            }
        ]
    }
    async init(nodeData: INodeData, _: string, options: ICommonObject): Promise<any> {
        const credentialData = await getCredentialData(nodeData.credential ?? '', options)

        const environmentId = nodeData.inputs?.environmentId as string
        const textSplitter = nodeData.inputs?.textSplitter as TextSplitter
        const configUtility = (nodeData.inputs?.configUtility as ICommonObject) ?? {}
        const metadata = nodeData.inputs?.metadata
        const include = nodeData.inputs?.include as number
        const limit = nodeData.inputs?.limit as number
        const contentType = nodeData.inputs?.contentType as string
        const includeAll = nodeData.inputs?.includeAll as boolean

        const accessToken = getCredentialParam('accessToken', credentialData, nodeData)
        const spaceId = getCredentialParam('spaceId', credentialData, nodeData)

        const contentfulOptions: ContentfulLoaderParams = {
            spaceId,
            environmentId,
            accessToken,
            include,
            includeAll,
            limit,
            metadata,
            contentType,
            configUtility
        }

        const loader = new ContentfulLoader(contentfulOptions)

        let docs = []

        if (textSplitter) {
            docs = await loader.loadAndSplit(textSplitter)
        } else {
            docs = await loader.load()
        }

        if (metadata) {
            const parsedMetadata = typeof metadata === 'object' ? metadata : JSON.parse(metadata)
            let finaldocs = []
            for (const doc of docs) {
                const newdoc = {
                    ...doc,
                    metadata: {
                        ...doc.metadata,
                        ...parsedMetadata
                    }
                }
                finaldocs.push(newdoc)
            }
            return finaldocs
        }

        return docs
    }
}

interface ContentfulLoaderParams {
    spaceId: string
    environmentId: string
    accessToken: string
    include?: number
    limit?: number
    contentType: string
    includeAll?: boolean
    metadata?: any
    configUtility: ICommonObject
}

interface ContentfulLoaderResponse {
    items: ContentfulEntry[]
    skip?: number
    limit?: number
    total?: number
}

interface ContentfulEntry {
    sys: ICommonObject
    fields: ICommonObject
}

interface IField {
    [key: string]: any
}

interface IContentObject {
    fields: IField
    sys: any // Adjust this type according to your sys object structure
}

class ContentfulLoader extends BaseDocumentLoader {
    public readonly spaceId: string

    public readonly environmentId: string

    public readonly accessToken: string

    public readonly textField?: string

    public readonly include?: number

    public readonly limit?: number

    public readonly contentType?: string

    public readonly includeAll?: boolean

    public readonly metadata?: ICommonObject

    public readonly configUtility: ICommonObject

    constructor({
        spaceId,
        environmentId,
        accessToken,
        metadata = {},
        include,
        limit,
        contentType,
        includeAll,
        configUtility
    }: ContentfulLoaderParams) {
        super()
        this.spaceId = spaceId
        this.environmentId = environmentId
        this.accessToken = accessToken
        this.contentType = contentType
        this.includeAll = includeAll
        this.include = include
        this.limit = limit

        // Check if metadata is a non-empty string, then try to parse it.
        // If parsing fails or if metadata is not a string, use the default empty object.
        if (typeof metadata === 'string' && metadata.trim() !== '') {
            try {
                this.metadata = JSON.parse(metadata)
            } catch (error) {
                console.warn('Failed to parse metadata:', error)
                this.metadata = {}
            }
        } else if (typeof metadata === 'object') {
            this.metadata = metadata
        } else {
            this.metadata = {}
        }

        if (typeof configUtility === 'string') {
            try {
                this.configUtility = JSON.parse(JSON.parse(configUtility).config)[0]
            } catch (error) {
                console.warn('Failed to parse config:', error)
                this.configUtility = {
                    fieldsToParse: [],
                    fieldsForCitation: {
                        titleField: 'title',
                        slugField: 'slug',
                        urlPrefix: 'https://www.example.com/'
                    },
                    richTextParsingRules: {
                        embeddedContentTypes: {}
                    }
                }
            }
        }
    }

    public async load(): Promise<Document[]> {
        return this.runQuery()
    }

    private processContentObject(contentObject: IContentObject, fieldsConfig?: string[]): string {
        const { fields } = contentObject
        const fieldsToProcess = fieldsConfig || this.configUtility.fieldsToParse // Fallback to default fields if none specified

        return Object.entries(fields)
            .filter(([fieldName]) => fieldsToProcess.includes(fieldName))
            .map(([fieldName, fieldValue]) => {
                // Check if the field is a rich text field
                if (typeof fieldValue === 'object' && fieldValue.nodeType === 'document') {
                    const plainText = documentToPlainTextString(
                        fieldValue,
                        '\n',
                        this.configUtility.richTextParsingRules,
                        this.processContentObject
                    ) // TODO: add support for embedded assets and entries
                    return `${fieldName}: ${plainText}\n\n`
                }
                // For string fields
                else if (typeof fieldValue === 'string') {
                    return `${fieldName}: ${fieldValue}\n\n`
                }

                // TODO: Handle references to other entries and assets

                // TODO: Return empty for now, handle other types as needed
                return ``
            })
            .join('')
    }

    private createDocumentFromEntry(entry: ContentfulEntry): Document {
        const textContent = this.processContentObject(entry)
        const entryUrl = `https://app.contentful.com/spaces/${this.spaceId}/environments/${this.environmentId}/entries/${entry.sys.id}`
        // console.log('Entry', entry)
        const title = entry.fields[this.configUtility.fieldsForCitation.titleField] || entry.sys.id
        const slug = entry.fields[this.configUtility.fieldsForCitation.slugField] || entry.sys.id
        const url = `${this.configUtility.fieldsForCitation.urlPrefix}${slug}`

        // Return a langchain document
        return new Document({
            pageContent: textContent,
            metadata: {
                contentType: this.contentType,
                source: entryUrl,
                entryId: entry.sys.id,
                doctype: 'contentfulEntry',
                title,
                url
            }
        })
    }

    private async runQuery(): Promise<Document[]> {
        const params: ICommonObject = { pageSize: 100, skip: 0 }
        let data: ContentfulLoaderResponse
        let returnPages: ContentfulEntry[] = []
        let query = this.metadata || {}

        if (this.limit && !this.includeAll) {
            query.limit = this.limit
        }
        if (this.include) {
            query.include = this.include
        }

        if (this.contentType) {
            query.content_type = this.contentType
        }

        const client = contentful.createClient({
            space: this.spaceId,
            environment: this.environmentId,
            accessToken: this.accessToken
        })

        do {
            data = await client.getEntries(query)
            returnPages.push.apply(returnPages, data.items)
            query.skip = (data?.skip || 0) + (data?.limit || 1)
        } while (this.includeAll && data.total !== 0)
        return returnPages.map((page) => this.createDocumentFromEntry(page))
    }
}

module.exports = {
    nodeClass: Contentful_DocumentLoaders
}
