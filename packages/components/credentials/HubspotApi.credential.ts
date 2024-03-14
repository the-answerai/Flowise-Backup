import { INodeParams, INodeCredential } from '../src/Interface'

class hubspotApi implements INodeCredential {
    label: string
    name: string
    version: number
    description: string
    inputs: INodeParams[]

    constructor() {
        this.label = 'Hubspot API'
        this.name = 'hubspotApi'
        this.version = 1.0
        this.description = 'Hubspot API'
        this.inputs = [
            {
                label: 'Api Key',
                name: 'accessToken',
                type: 'password',
                placeholder: '<CONTENTFUL_DELIVERY_TOKEN>'
            }
        ]
    }
}

module.exports = { credClass: hubspotApi }
