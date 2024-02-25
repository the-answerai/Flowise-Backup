import { INodeParams, INodeCredential, INodeOptionsValue, INodeData, ICommonObject } from '../src/Interface'

class AnswerAIApi implements INodeCredential {
    label: string
    name: string
    version: number
    description: string
    inputs: INodeParams[]

    constructor() {
        this.label = 'Answer AI API'
        this.name = 'answerAIApi'
        this.version = 1.0
        this.description = 'Please choose the API key you want to use from the list of available keys'
        this.inputs = [
            {
                label: 'Answer AI API Key',
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
                name: 'apikey1'
            } as INodeOptionsValue)
            return returnData
        }
    }
}

module.exports = { credClass: AnswerAIApi }
