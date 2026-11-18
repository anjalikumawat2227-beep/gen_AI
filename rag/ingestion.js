import { PDFParse } from "pdf-parse"
import fs from "fs/promises"
import { CohereEmbeddings } from "@langchain/cohere"
import {RecursiveCharacterTextSplitter} from "@langchain/textsplitters"
import "dotenv/config"
import { Pinecone } from '@pinecone-database/pinecone';

const parser = new PDFParse({
    data: await fs.readFile("./story.pdf")
})

//---------- extract all the text from pdf file ------------
const text = (await parser.getText({pageJoiner:""})).text

//--------- split the  text into  chunks -----------
const textSpliter = new RecursiveCharacterTextSplitter({chunkSize:500, chunkOverlap:100})
const chunks = await textSpliter.splitText(text)

//----------- initilazie embeding modeld--------------
const embadding = new CohereEmbeddings({
    model:"embed-v5.0-fast",
    apiKey:process.env.COHERE_API_KEY
})

//------------covert chunks into vators--------------
const vectors = await embadding.embedDocuments(chunks)

//-------------initialize pinecone client--------
const pc = new Pinecone({apiKey:process.env.PINECONE_API_KEY})

//-------intialize index for storing the vectors and chunks in pinecone databse------
const index = pc.index({
    name:"testdb",
    host:"https://testdb-o67hiym.svc.aped-4627-b74a.pinecone.io"
})

await index.documents.upsert({
    documents: vectors.map((vector, index) => {
        return {
            _id: `chunk-${index}`,
            embedding: vector,
            content: chunks[ index ]
        }
    })
})