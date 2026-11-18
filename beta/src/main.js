import { getApiKey, getSettingsfile, saveApiKey } from "./utils/files.utils.js";
import rl from "../src/utils/realline.utils.js"
import initGraph from "./ai/graph/graph.js";

export default async function main(){
    const settingContant = await getSettingsfile()

 if(!settingContant.apiKey){
    const apiKey = await rl.question("Please enter your api-key:")
    await saveApiKey(apiKey)
 }

 const response = await getApiKey()
 
  if (response.error) {
        console.error("Invalid OR Expired API key")
        const apiKey = await rl.question("Please enter your API key: ")
        await saveApiKey(apiKey)
        return main()
    }

  const apiKey = response.apiKey
  await initGraph()
  rl.close()
}