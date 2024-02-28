import { INodeParams, INodeCredential, INodeOptionsValue, INodeData, ICommonObject } from '../src/Interface'

class YoutubeApi implements INodeCredential {
    label: string
    name: string
    version: number
    description: string
    inputs: INodeParams[]

    constructor() {
        this.label = 'Youtube API'
        this.name = 'YoutubeApi'
        this.version = 1.0
        this.description =
            'You can get a Jira APIKey from <a href="https://id.atlassian.com/manage-profile/security/api-tokens" target="_blank">here</a>'
        this.inputs = [
            {
                label: 'Youtube API Key',
                name: 'apiKey',
                type: 'password'
            }
        ]
    }
}

module.exports = { credClass: YoutubeApi }
