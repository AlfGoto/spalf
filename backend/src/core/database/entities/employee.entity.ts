import { Entity } from "dynamodb-toolbox/entity";
import { item } from "dynamodb-toolbox/schema/item";
import { string } from "dynamodb-toolbox/schema/string";
import { list } from "dynamodb-toolbox/schema/list";
import { map } from "dynamodb-toolbox/schema/map";
import { record } from "dynamodb-toolbox/schema/record";
import { boolean } from "dynamodb-toolbox/schema/boolean";
import { SpalfTable } from "../table";

/**
 * Employee Entity
 *
 * PK: SPA#<spaId>#EMPLOYEE#<employeeId>
 * SK: METADATA
 *
 * GSI1PK: SPA#<spaId>
 * GSI1SK: EMPLOYEE#<employeeId>
 */

const employmentTypeValues = ["FULLTIME", "FREELANCE"] as const;
export type EmploymentType = (typeof employmentTypeValues)[number];

const scheduleEntrySchema = map({
  start: string(),
  end: string(),
  isWorking: boolean().default(true),
});

const employeeSchema = item({
  // Key attributes
  employeeId: string().key(),
  spaId: string().key(),

  // Attributes
  firstName: string().required(),
  lastName: string().required(),
  email: string().required(),
  phone: string().optional(),
  employmentType: string().enum(...employmentTypeValues).required(),

  // Schedule is stored as a map of day -> hours
  schedule: record(string(), scheduleEntrySchema).optional(),

  // Services this employee can perform
  serviceIds: list(string()).default([]),

  // GSI Keys
  GSI1PK: string().optional(),
  GSI1SK: string().optional(),

  // Timestamps
  createdAt: string().default(() => new Date().toISOString()),
  updatedAt: string().required("always").putDefault(() => new Date().toISOString()).updateDefault(() => new Date().toISOString()),
});

export const EmployeeEntity = new Entity({
  name: "Employee",
  table: SpalfTable,
  schema: employeeSchema,
  timestamps: false,
  computeKey: ({ spaId, employeeId }) => ({
    PK: `SPA#${spaId}#EMPLOYEE#${employeeId}`,
    SK: "METADATA",
  }),
});

// Manual type definition
export interface ScheduleEntry {
  start: string;
  end: string;
  isWorking: boolean;
}

export interface EmployeeItem {
  employeeId: string;
  spaId: string;
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  employmentType: EmploymentType;
  schedule?: Record<string, ScheduleEntry>;
  serviceIds: string[];
  GSI1PK?: string;
  GSI1SK?: string;
  createdAt: string;
  updatedAt: string;
}
