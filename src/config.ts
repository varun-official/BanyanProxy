import fs from "node:fs/promises";
import {  parse} from "yaml";
import { rootSchema } from "./config-schema";

export const parseYAMLconfig = async(filePath:string) =>{
const configFileContent = await fs.readFile(filePath,"utf8");
const yamlToJson = parse(configFileContent);
return JSON.stringify(yamlToJson);
}

export const validateConfig = async(config:string) =>{
    const validatedConfig = await rootSchema.parseAsync(JSON.parse(config));
    return validatedConfig;
}