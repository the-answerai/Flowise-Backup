import { ICommonObject, INode, INodeData, INodeParams } from '../../../src/Interface'
import { TextSplitter } from 'langchain/text_splitter'
import { BaseDocumentLoader } from 'langchain/document_loaders/base'
import { Document } from 'langchain/document'
import { getCredentialData, getCredentialParam } from '../../../src/utils'

class AnswerAI_DocumentLoaders implements INode {
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
        this.label = 'AnswerAI Document Loader'
        this.name = 'answeraiDocumentLoader'
        this.version = 1.0
        this.type = 'Document'
        this.icon = 'answerai.png'
        this.category = 'Document Loaders'
        this.description = `Load data you have saved in your AnswerAI knowledge base.`
        this.baseClasses = [this.type]
        this.credential = {
            label: 'Connect Credential',
            name: 'credential',
            type: 'credential',
            credentialNames: ['answerAiApi']
        }
        this.inputs = [
            {
                label: 'Text Splitter',
                name: 'textSplitter',
                type: 'TextSplitter',
                optional: true
            },
            {
                label: 'Type of Data',
                name: 'docType',
                type: 'string',
                placeholder: 'doctype',
                default: 'Text',
                description: 'The content type to query'
            }
        ]
    }
    async init(nodeData: INodeData, _: string, options: ICommonObject): Promise<any> {
        const credentialData = await getCredentialData(nodeData.credential ?? '', options)

        const docType = nodeData.inputs?.docType as string
        const textSplitter = nodeData.inputs?.textSplitter as TextSplitter

        const accessToken = getCredentialParam('apiKey', credentialData, nodeData)

        const documentOptions: Document = {
            pageContent: '',
            metadata: {
                contentType: docType
            }
        }

        const loader = new ContentfulLoader(documentOptions)

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

interface AnswerAILoaderParams {
    docType: string
    metadata: string
}

interface AnswerAILoaderResponse {
    items: AnswerAIDocument[]
    skip?: number
    limit?: number
    total?: number
}

interface AnswerAIDocument {
    content: string
    metadata: ICommonObject
}

interface IField {
    [key: string]: any
}

interface IContentObject {
    fields: IField
    sys: any // Adjust this type according to your sys object structure
}

class ContentfulLoader extends BaseDocumentLoader {
    public readonly docType: string

    public readonly metadata?: ICommonObject

    constructor({ docType, metadata }: AnswerAILoaderParams) {
        super()
        this.docType = docType
        this.metadata = {}

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
    }

    public async load(): Promise<Document[]> {
        return this.runQuery()
    }

    private processContentObject(contentObject: IContentObject): string {
        const { fields } = contentObject

        return Object.entries(fields)
            .map(([fieldName, fieldValue]) => {
                // Check if the field is a rich text field
                if (typeof fieldValue === 'object' && fieldValue.nodeType === 'document') {
                    const plainText = documentToPlainTextString(fieldValue) // TODO: add support for embedded assets and entries
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

        // Return a langchain document
        return new Document({
            pageContent: textContent,
            metadata: {
                contentType: this.contentType,
                source: entryUrl,
                entryId: entry.sys.id,
                doctype: 'contentfulEntry'
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
            console.log('Metadata', query)
            data = await client.getEntries(query)
            console.log('Items', data.items.length)
            returnPages.push.apply(returnPages, data.items)
            query.skip = (data?.skip || 0) + (data?.limit || 1)
        } while (this.includeAll && data.total !== 0)
        return returnPages.map((page) => this.createDocumentFromEntry(page))
    }
}

module.exports = {
    nodeClass: AnswerAI_DocumentLoaders
}
