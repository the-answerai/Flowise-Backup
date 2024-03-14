import { INodeParams, INodeCredential } from '../src/Interface'

class GoogleDriveAPI implements INodeCredential {
    label: string
    name: string
    version: number
    description: string
    inputs: INodeParams[]

    constructor() {
        this.label = 'Google Drive API'
        this.name = 'googleDriveAPI'
        this.version = 1.0
        this.inputs = [
            {
                label: 'Delivery or Preview Token',
                name: 'accessToken',
                type: 'password',
                placeholder: '<CONTENTFUL_DELIVERY_TOKEN>'
            }
        ]
    }
}

module.exports = { credClass: GoogleDriveAPI }
