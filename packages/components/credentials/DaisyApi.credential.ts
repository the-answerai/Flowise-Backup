import { INodeParams, INodeCredential } from '../src/Interface'

class daisyApi implements INodeCredential {
    label: string
    name: string
    version: number
    description: string
    inputs: INodeParams[]

    constructor() {
        this.label = 'D.A.I.S.Y API'
        this.name = 'daisyApi'
        this.version = 1.0
        this.description =
            'Refer to <a target="_blank" href="https://www.contentful.com/developers/docs/references/content-delivery-api/">official guide</a> on how to get your delivery keys in Contentful'
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

module.exports = { credClass: daisyApi }
