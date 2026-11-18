import fs from "fs/promises"
import {CONFIG_DIR} from "./constant.utils.js"
import path from "path"
import axios from "axios"

export const getSettingsfile=async()=>{
   try {
    await fs.access(CONFIG_DIR)
   } catch (error) {
    await fs.mkdir(CONFIG_DIR , {recursive:true})
   }

   const settingFile = path.join(CONFIG_DIR,"setting.json")
   try {
    await fs.access(settingFile)
    const contant = await fs.readFile(settingFile,"utf-8")
    return JSON.parse(contant)
   } catch (error) {
    await fs.writeFile(settingFile,JSON.stringify({}))
    return {}
   } 
}

export async function saveApiKey(apiKey) {
    const settingFilePath = path.join(CONFIG_DIR,"setting.json")
    const settingContant = await getSettingsfile()

    await fs.writeFile(settingFilePath,JSON.stringify({
        ...settingContant,
        apiKey
    }))
}

export async function getApiKey() {
    const settingContant = await getSettingsfile()
    const apiKey = settingContant.apiKey || null
    
    if(!apiKey){
          return {
            error: "API key not found in settings file"
        }
    }

    try{
       await axios.get("https://api.groq.com/openai/v1/models",{
        headers:{
            "Authorization":`bearer ${apiKey}`
        }
      })

      return {
        apiKey
      }

    }catch(error){
        return{
            error: "Invalid API key"
        }
    }
   
}