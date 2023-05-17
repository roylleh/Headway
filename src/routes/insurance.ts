import {
  DynamoDBDocumentClient,
  PutCommand,
  ScanCommand,
} from "@aws-sdk/lib-dynamodb";
import { Static, Type } from "@fastify/type-provider-typebox";
import { randomUUID } from "crypto";
import { FastifyInstance } from "fastify";

const TABLE_INSURANCE = "insurance";

const InsuranceBody = Type.Object({
  id: Type.Optional(Type.String({ format: "uuid" })),
  name: Type.String(),
});
type InsuranceBody = Static<typeof InsuranceBody>;

export const buildInsuranceRoutes = async (
  fastify: FastifyInstance,
  ddbDocClient: DynamoDBDocumentClient
) => {
  fastify.get(
    "/insurance",
    {
      schema: {
        response: {
          200: {
            type: "array",
            items: InsuranceBody,
          },
        },
      },
    },
    async (req, res) => {
      const get = await ddbDocClient.send(
        new ScanCommand({
          TableName: TABLE_INSURANCE,
        })
      );

      return get.Items;
    }
  );

  fastify.post<{ Body: InsuranceBody; Reply: InsuranceBody }>(
    "/insurance",
    {
      schema: {
        body: InsuranceBody,
        response: {
          200: InsuranceBody,
        },
      },
    },
    async (req, res) => {
      const insurance = req.body;
      insurance.id = randomUUID();

      await ddbDocClient.send(
        new PutCommand({
          TableName: TABLE_INSURANCE,
          Item: insurance,
        })
      );

      return req.body;
    }
  );
};
