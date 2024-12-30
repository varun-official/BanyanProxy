import { program } from "commander";
import {validateConfig, parseYAMLconfig} from "./config";
import { createServer } from "./server";
import os from "node:os"




const main = async() =>{
    program.option('--config <path>');
    program.parse()

    const options = program.opts()
    
    if(options && 'config' in options){
        const validatedConfig = await validateConfig(await parseYAMLconfig(options.config));
        await createServer({port:validatedConfig.server.listen,workerCount:validatedConfig.server.workers??os.cpus().length,config:validatedConfig})
    }
}

main()