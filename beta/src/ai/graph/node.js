import {ChatGroq} from "@langchain/groq"
import { getApiKey } from "../../utils/files.utils.js"
import * as filesTools from "../tools/files.tool.js"


export async function LLMNode(state,config) {
    
    const model = new ChatGroq({
        model:"openai/gpt-oss-120b",
        apiKey:(await getApiKey()).apiKey
    })

    const modelWithTools = model.bindTools([filesTools.upsertFiles,filesTools.readFiles,filesTools.listFiles])
    const stream = await modelWithTools.stream(state.messages)
    
    process.stdout.write("[AI]:")

    let aiMessages = null
    for await(const chunk of stream){
        process.stdout.write(chunk.text)
      
        if(!aiMessages) aiMessages = chunk
        else aiMessages = aiMessages.concat(chunk)
    }
    process.stdout.write("\n")

    return {
        messages:[
            ...state.messages,
              aiMessages
        ]
    }

}

export async function ToolNode(state, config) {
    const lastMessage = state.messages[ state.messages.length - 1 ]
    const toolCalls = lastMessage.tool_calls

    const toolResults = []

    for (const toolCall of toolCalls) {

        switch (toolCall.name) {
            case "upsertFiles":
                process.stdout.write(`[Tool]: Updating/creating files ${JSON.stringify(toolCall.args.files.map(f => f.path).join(", "))}\n`)
                const userInput = await rl.question("Do you want to proceed? (yes/no): ")
                if (userInput.toLowerCase() !== "yes") {
                    process.stdout.write("Aborting file update.\n")
                    return new ToolMessage({
                        content: "User aborted file update/create.",
                        tool_call_id: toolCall.id
                    })
                }
                const result = await filesTools.upsertFiles.invoke(toolCall)
                toolResults.push(result)
                break;
                
            case "readFiles":
                process.stdout.write(`[Tool]: Reading files ${JSON.stringify(toolCall.args.files.map(f => f.path).join(", "))}\n`)
                const readResult = await filesTools.readFiles.invoke(toolCall)
                toolResults.push(readResult)
                break;

            case "listFiles":
                process.stdout.write(`[Tool]: Listing files\n`)
                const listResult = await filesTools.listFiles.invoke(toolCall)
                toolResults.push(listResult)
                break;

            default:
                process.stdout.write(`[Tool]: Unknown tool ${toolCall.name}\n`)
                break;
        }

    }


    return {
        messages: [
            ...state.messages,
            ...toolResults
        ]
    }

}