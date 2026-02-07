import { Table } from "dynamodb-toolbox/table";
import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient } from "@aws-sdk/lib-dynamodb";

const dynamoDBClient = new DynamoDBClient({});

const documentClient = DynamoDBDocumentClient.from(dynamoDBClient, {
  marshallOptions: {
    removeUndefinedValues: true,
    convertEmptyValues: false,
  },
});

export const SpalfTable = new Table({
  name: process.env.TABLE_NAME || "spalf-table",
  partitionKey: { name: "PK", type: "string" },
  sortKey: { name: "SK", type: "string" },
  documentClient,
  indexes: {
    GSI1: {
      type: "global",
      partitionKey: { name: "GSI1PK", type: "string" },
      sortKey: { name: "GSI1SK", type: "string" },
    },
    GSI2: {
      type: "global",
      partitionKey: { name: "GSI2PK", type: "string" },
      sortKey: { name: "GSI2SK", type: "string" },
    },
  },
});

export type SpalfTableType = typeof SpalfTable;
