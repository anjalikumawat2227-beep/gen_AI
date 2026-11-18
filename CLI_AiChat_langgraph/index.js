import {ChatGroq} from "@langchain/groq"
import dotenv from "dotenv"
dotenv.config()
import rl from "readline/promises"
import { tool} from "langchain"
import *as z from "zod"
import {StateGraph,START,END} from "@langchain/langgraph"

const events = []
const createEventsTool=tool(
    async function({date,title,description}){
        events.push({date,title,description})
        return "Event created"
    },{
        name:"createEvent",
        description:"Created a new  event with date,title and description ",
        schema:z.object({
            date:z.string(),
            title:z.string(),
            description:z.string()
        })
    }
)

const getEventsTool = tool(
    async function({}){
        console.log("retriving event: ",events)
        return events
    },{
        name:"getEvents",
        description:"Retrieves all events",
        schema: z.object({})
    }
) 

const readline =  rl.createInterface({
    input:process.stdin,
    output : process.stdout
})

const model = new ChatGroq({
    model:"openai/gpt-oss-120b",
    key:process.env.GROQ_API_KEY 
})


// _______LLM node ____________________

const LLMNode = async (state)=>{
    console.log("LLM Node Result",state)
    return {
        messages:[
            ...state.messages,
            {
                role:"assistant",
                content:"Hello User"
            }
        ]
    }
}


const graph = new StateGraph(
    z.object({
        messages:z.array(z.any())
    })
).addNode("LLMNode",LLMNode)
 .addEdge(START , "LLMNode")
 .addEdge("LLMNode",END)
 .compile()

const graphResult = await graph.invoke({
    messages:[
        {
            role:"user",
            content:"hello world"
        }
    ]
})

console.log("graphResult",graphResult)

