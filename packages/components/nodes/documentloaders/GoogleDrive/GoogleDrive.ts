import { ICommonObject, INode, INodeData, INodeParams } from '../../../src/Interface'
import { TextSplitter } from 'langchain/text_splitter'
import { BaseDocumentLoader } from 'langchain/document_loaders/base'
import { Document } from 'langchain/document'

class GoogleDrive_DocumentLoaders implements INode {
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
        this.label = 'Google Drive'
        this.name = 'googleDrive'
        this.version = 1.0
        this.type = 'Document'
        this.icon = 'drive.png'
        this.category = 'Document Loaders'
        this.description = `Summarize, analyze and visualize your Google Drive data`
        this.baseClasses = [this.type]
        this.credential = {
            label: 'Connect Credential',
            name: 'credential',
            type: 'credential',
            credentialNames: ['contetnfulDeliveryApi'] // This should be changed to the correct credential name
        }
        this.inputs = [
            {
                label: 'Text Splitter',
                name: 'textSplitter',
                type: 'TextSplitter',
                optional: true
            }
        ]
    }
    async init(nodeData: INodeData, _: string, options: ICommonObject): Promise<any> {
        let docs: any[] = []

        return docs
    }
}

interface IField {
    [key: string]: any
}

interface IContentObject {
    fields: IField
    sys: any // Adjust this type according to your sys object structure
}

class DasiyLoader extends BaseDocumentLoader {
    public readonly metadata?: ICommonObject

    constructor() {
        super()
        // Get metadata from the nodeData

        // Check if metadata is a non-empty string, then try to parse it.
        // If parsing fails or if metadata is not a string, use the default empty object.
        // if (typeof metadata === 'string' && metadata.trim() !== '') {
        //     try {
        //         this.metadata = JSON.parse(metadata)
        //     } catch (error) {
        //         console.warn('Failed to parse metadata:', error)
        //         this.metadata = {}
        //     }
        // } else if (typeof metadata === 'object') {
        //     this.metadata = metadata
        // } else {
        //     this.metadata = {}
        // }
    }

    public async load(): Promise<Document[]> {
        return this.runQuery()
    }

    private async runQuery(): Promise<Document[]> {
        let returnPages: any[] = []
        return returnPages
    }
}

module.exports = {
    nodeClass: GoogleDrive_DocumentLoaders
}
