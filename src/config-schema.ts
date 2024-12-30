import {z} from "zod"

const upstreamsScheam = z.object({
    id: z.string(),
    url: z.string()
})

const headerSchema = z.object({
    key: z.string(),
    value: z.string()
})

const ruleSchema = z.object({
    path: z.string(),
    upstreams: z.array(z.string())
})


const serverSchema = z.object({
    listen: z.number(),
    workers: z.number().optional(),
    upstreams: z.array(upstreamsScheam),
    headers: z.array(headerSchema).optional(),
    rules: z.array(ruleSchema)
})


export const rootSchema = z.object({
    server:serverSchema
})

export type configSchemaType= z.infer<typeof rootSchema>