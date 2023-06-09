import {
  DynamoDBDocumentClient,
  GetCommand,
  PutCommand,
  ScanCommand,
} from "@aws-sdk/lib-dynamodb";
import { Static, Type } from "@fastify/type-provider-typebox";
import { randomUUID } from "crypto";
import { FastifyInstance } from "fastify";

const TABLE_PATIENTS = "patients";

const PatientBody = Type.Object({
  id: Type.Optional(Type.String({ format: "uuid" })),
  name: Type.String(),
  email: Type.String({ format: "email" }),
  phone: Type.String(),
  dob: Type.String({ format: "date" }),
  insurance: Type.String(),
});
type PatientBody = Static<typeof PatientBody>;

const PatientQuery = Type.Object({
  id: Type.String({ format: "uuid" }),
});
type PatientQuery = Static<typeof PatientQuery>;

export const buildPatientsRoutes = async (
  fastify: FastifyInstance,
  ddbDocClient: DynamoDBDocumentClient
) => {
  fastify.get(
    "/patients",
    {
      schema: {
        response: {
          200: {
            type: "array",
            items: PatientBody,
          },
        },
      },
    },
    async (req, res) => {
      const get = await ddbDocClient.send(
        new ScanCommand({
          TableName: TABLE_PATIENTS,
        })
      );

      return get.Items;
    }
  );

  fastify.post<{ Body: PatientBody; Reply: PatientBody }>(
    "/patients",
    {
      schema: {
        body: PatientBody,
        response: {
          200: PatientBody,
        },
      },
    },
    async (req, res) => {
      const patient = req.body;
      patient.id = randomUUID();

      await ddbDocClient.send(
        new PutCommand({
          TableName: TABLE_PATIENTS,
          Item: patient,
        })
      );

      return req.body;
    }
  );

  fastify.put<{
    Querystring: PatientQuery;
    Body: PatientBody;
    Reply: PatientBody;
  }>(
    "/patients",
    {
      schema: {
        querystring: PatientQuery,
        body: PatientBody,
        response: {
          200: PatientBody,
        },
      },
    },
    async (req, res) => {
      const patient = req.body;
      patient.id = req.query.id;

      const get = await ddbDocClient.send(
        new GetCommand({
          TableName: TABLE_PATIENTS,
          Key: { id: patient.id },
        })
      );

      if (!get.Item) {
        return res.status(404).send();
      }

      await ddbDocClient.send(
        new PutCommand({
          TableName: TABLE_PATIENTS,
          Item: patient,
        })
      );

      return req.body;
    }
  );
};
