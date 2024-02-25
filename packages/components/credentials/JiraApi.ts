import { INodeParams, INodeCredential } from '../src/Interface'

class jiraApi implements INodeCredential {
    label: string
    name: string
    version: number
    description: string
    inputs: INodeParams[]

    constructor() {
        this.label = 'Jira API'
        this.name = 'jiraApi'
        this.version = 1.0
        this.description = 'Jira API'
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

module.exports = { credClass: jiraApi }
