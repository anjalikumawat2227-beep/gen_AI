import {ChatCohere,CohereEmbeddings} from "@langchain/cohere"
import { HumanMessage, ToolMessage, AIMessage } from "langchain";
import { Pinecone } from "@pinecone-database/pinecone"
import "dotenv/config"



const userInput = "tell me about Arav's internship"

//---------------initilazie embedding model-----------

const embedding = new CohereEmbeddings({
     model:"embed-v5.0-fast",
    apiKey:process.env.COHERE_API_KEY
})

const vectors = await embedding.embedQuery(userInput)

const pc = new Pinecone({apiKey:process.env.PINECONE_API_KEY})

const index = pc.index({
    name:"testdb",
    host:"https://testdb-o67hiym.svc.aped-4627-b74a.pinecone.io"
})

const result = await index.documents.search({
 topK:3,
 scoreBy:[
    {
        type:"dense_vector",
        values:vectors,
        field:["embedding"],
    }
 ],
 includeFields:["content"]
})

//-----------------initilazie cohere chat model ---------------
const model = new ChatCohere({
     model: "command-a-03-2025",
    apiKey:process.env.COHERE_API_KEY
}) 

const messages =[]

messages.push(new HumanMessage(userInput))
messages.push(new ToolMessage({
    content:JSON.stringify(result)
}))

const aiResponse = await model.stream(messages)


for await (const chunk of aiResponse) {
    process.stdout.write(chunk.text)
}