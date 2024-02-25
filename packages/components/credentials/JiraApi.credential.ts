import { INodeParams, INodeCredential, INodeOptionsValue, INodeData, ICommonObject } from '../src/Interface'

class AnswerAIApi implements INodeCredential {
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
                label: 'Jira API Key',
                name: 'apiKey',
                type: 'password',
                loadMethod: 'listApiKeys'
            }
        ]
    }

    loadMethods = {
        async listAssistants(_: INodeData, options: ICommonObject): Promise<INodeOptionsValue[]> {
            const returnData: INodeOptionsValue[] = []

            // const appDataSource = options.appDataSource as DataSource
            // const databaseEntities = options.databaseEntities as IDatabaseEntity

            // if (appDataSource === undefined || !appDataSource) {
            //     return returnData
            // }

            // const assistants = await appDataSource.getRepository(databaseEntities['Assistant']).find()

            // for (let i = 0; i < assistants.length; i += 1) {
            //     const assistantDetails = JSON.parse(assistants[i].details)
            //     const data = {
            //         label: assistantDetails.name,
            //         name: assistants[i].id,
            //         description: assistantDetails.instructions
            //     } as INodeOptionsValue
            //     returnData.push(data)
            // }

            returnData.push({
                label: 'Api Key 1',
                name: 'listApiKeys'
            } as INodeOptionsValue)
            return returnData
        }
    }
}

module.exports = { credClass: AnswerAIApi }
