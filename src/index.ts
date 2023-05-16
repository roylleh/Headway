import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient } from "@aws-sdk/lib-dynamodb";
import { TypeBoxTypeProvider } from "@fastify/type-provider-typebox";

import Fastify from "fastify";

const ddbClient = new DynamoDBClient({ region: "us-east-1" });
const ddbDocClient = DynamoDBDocumentClient.from(ddbClient);
const fastify = Fastify({}).withTypeProvider<TypeBoxTypeProvider>();

import { buildInsuranceRoutes } from "./routes/insurance.js";
import { buildPatientsRoutes } from "./routes/patients.js";

buildInsuranceRoutes(fastify, ddbDocClient);
buildPatientsRoutes(fastify, ddbDocClient);

const start = async () => {
  try {
    console.log("Starting...");
    await fastify.listen({ port: 3000 });
  } catch (err) {
    fastify.log.error(err);
    process.exit(1);
  }
};

await start();
