import { INodeParams, INodeCredential, INodeOptionsValue, INodeData, ICommonObject } from '../src/Interface'

class JiraApi implements INodeCredential {
    label: string
    name: string
    version: number
    description: string
    inputs: INodeParams[]

    constructor() {
        this.label = 'Jira API'
        this.name = 'JiraApi'
        this.version = 1.0
        this.description =
            'You can get a Jira APIKey from <a href="https://id.atlassian.com/manage-profile/security/api-tokens" target="_blank">here</a>'
        this.inputs = [
            {
                label: 'Jira Email',
                name: 'email',
                type: 'string'
            },
            {
                label: 'Jira API Key',
                name: 'apiKey',
                type: 'password'
            },
            {
                label: 'Jira Domain',
                name: 'domain',
                type: 'string'
            }
        ]
    }
}

module.exports = { credClass: JiraApi }
