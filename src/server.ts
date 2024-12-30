import { configSchemaType, rootSchema } from "./config-schema";
import cluster, { Worker } from "node:cluster";
import http from "node:http";
import {
  WorkerMessageType,
  workerMessageSchema,
  WorkerResponceType,
  workerResponceSchema,
} from "./server-schema";

interface createServerConfig {
  port: number;
  workerCount: number;
  config: configSchemaType;
}

export const createServer = async (config: createServerConfig) => {
  const { workerCount } = config;
  let WORKER_POOL: Worker[] = [];

  if (cluster.isPrimary) {
    console.log("Master proccess is up");

    for (let i = 0; i < workerCount; i++) {
      const workerInstance = cluster.fork({
        config: JSON.stringify(config.config),
      });
      WORKER_POOL.push(workerInstance);
      console.log(`Master proccess created worker node with id ${i}`);
    }

    const server = http.createServer((req, res) => {
      const workerIndex = Math.floor(Math.random() * WORKER_POOL.length);
      const worker = WORKER_POOL.at(workerIndex);

      if (!worker) throw new Error("No worker found");

      const workerPayload: WorkerMessageType = {
        requestType: "HTTP",
        headers: req.headers,
        body: null,
        url: `${req.url}`,
      };
      worker.send(JSON.stringify(workerPayload));
      worker.once("message", async (workerResponce: string) => {
        const responce = await workerResponceSchema.parseAsync(
          JSON.parse(workerResponce)
        );

        if (responce.errorCode) {
          res.writeHead(parseInt(responce.errorCode));
          res.end(responce.error);
          return;
        } else {
          res.writeHead(200);
          res.end(responce.data);
          return;
        }
      });
    });

    server.listen(config.port, () => {
      console.log(`BanyanProxy is listening on the port ${config.port}`);
    });
  } else {
    console.log("worker proccess is up");
    const config = await rootSchema.parseAsync(
      JSON.parse(`${process.env.config}`)
    );

    process.on("message", async (message: string) => {
      const validatedMessage = await workerMessageSchema.parseAsync(
        JSON.parse(message)
      );
      const requestUrl = validatedMessage.url;

      console.log(requestUrl);

      let rule = config.server.rules
        .slice()
        .sort((a, b) => b.path.length - a.path.length)
        .find((r) => {
          const escapedPath = r.path.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
          const regex = new RegExp(`^${escapedPath}(/|$)`);
          return regex.test(requestUrl);
        });

      // Explicit fallback to the "/" rule if no other matches
      if (!rule) {
        rule = config.server.rules.find((r) => r.path === "/");
        if (!rule) {
          console.error(
            "No matching rule or fallback rule found for requestUrl:",
            requestUrl
          );
          const responce: WorkerResponceType = {
            errorCode: "404",
            error: "Request rule not found!!",
          };

          if (process.send) return process.send(JSON.stringify(responce));
        }
      }

      const upstreamID = rule?.upstreams[0];
      const upstream = config.server.upstreams.find(
        (upstream) => upstream.id === upstreamID
      );
      console.log(upstream);

      if (!upstream) {
        const responce: WorkerResponceType = {
          errorCode: "500",
          error: "upstreams not found!!",
        };

        if (process.send) return process.send(JSON.stringify(responce));
      }

      const request = http.request(
        { host: upstream?.url, path: requestUrl, method: "GET" },
        (proxyRes) => {
          let body = "";

          proxyRes.on("data", (chunk) => {
            body += chunk;
          });

          proxyRes.on("end", () => {
            const responce: WorkerResponceType = {
              data: body,
            };

            if (process.send) return process.send(JSON.stringify(responce));
          });
        }
      );
      request.end();
    });
  }
};
