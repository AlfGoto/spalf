/**
 * Domain entity types for the Spalf spa management software.
 * These types mirror the backend DynamoDB entities.
 */

// ============================================================================
// Enums
// ============================================================================

export type EmploymentType = "FULLTIME" | "FREELANCE";

export type ReservationStatus = "PENDING" | "CONFIRMED" | "COMPLETED" | "CANCELLED";

// ============================================================================
// Employee
// ============================================================================

export interface ScheduleEntry {
  start: string;
  end: string;
  isWorking: boolean;
}

export interface Employee {
  employeeId: string;
  spaId: string;
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  employmentType: EmploymentType;
  schedule?: Record<string, ScheduleEntry>;
  serviceIds: string[];
  createdAt: string;
  updatedAt: string;
}

export interface CreateEmployeeInput {
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  employmentType: EmploymentType;
  schedule?: Record<string, ScheduleEntry>;
  serviceIds?: string[];
}

export interface UpdateEmployeeInput extends Partial<CreateEmployeeInput> {}

// ============================================================================
// Room
// ============================================================================

export interface Room {
  roomId: string;
  spaId: string;
  name: string;
  minCapacity: number;
  maxCapacity: number;
  maxConcurrentServices: number;
  description?: string;
  serviceIds: string[];
  createdAt: string;
  updatedAt: string;
}

export interface CreateRoomInput {
  name: string;
  minCapacity?: number;
  maxCapacity: number;
  maxConcurrentServices?: number;
  description?: string;
  serviceIds?: string[];
}

export interface UpdateRoomInput extends Partial<CreateRoomInput> {}

// ============================================================================
// Product
// ============================================================================

export interface Product {
  productId: string;
  spaId: string;
  name: string;
  description?: string;
  price: number;
  quantity?: number;
  isInfinite: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CreateProductInput {
  name: string;
  description?: string;
  price: number;
  quantity?: number;
  isInfinite?: boolean;
}

export interface UpdateProductInput extends Partial<CreateProductInput> {}

// ============================================================================
// Service (Prestation)
// ============================================================================

export interface ProductRequirement {
  productId: string;
  quantity: number;
}

export interface Service {
  serviceId: string;
  spaId: string;
  name: string;
  description?: string;
  price: number;
  duration: number; // in minutes
  preparationTime: number; // in minutes
  recoveryTime: number; // in minutes
  cancellationDeadlineHours: number;
  canBeRescheduled: boolean;
  productIds: ProductRequirement[];
  roomIds: string[];
  employeeIds: string[];
  composedServiceIds: string[];
  isComposed: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CreateServiceInput {
  name: string;
  description?: string;
  price: number;
  duration: number;
  preparationTime?: number;
  recoveryTime?: number;
  cancellationDeadlineHours?: number;
  canBeRescheduled?: boolean;
  productIds?: ProductRequirement[];
  roomIds?: string[];
  employeeIds?: string[];
  composedServiceIds?: string[];
  isComposed?: boolean;
}

export interface UpdateServiceInput extends Partial<CreateServiceInput> {}

// ============================================================================
// Client
// ============================================================================

export interface Client {
  clientId: string;
  spaId: string;
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  allergies?: string;
  preferences?: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateClientInput {
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  allergies?: string;
  preferences?: string;
  notes?: string;
}

export interface UpdateClientInput extends Partial<CreateClientInput> {}

// ============================================================================
// Reservation
// ============================================================================

export interface Reservation {
  reservationId: string;
  spaId: string;
  serviceId: string;
  clientId: string;
  employeeId?: string;
  roomId?: string;
  date: string;
  startTime: string;
  endTime: string;
  status: ReservationStatus;
  notes?: string;
  internalNotes?: string;
  cancelledAt?: string;
  cancellationReason?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateReservationInput {
  serviceId: string;
  clientId: string;
  employeeId?: string;
  roomId?: string;
  date: string;
  startTime: string;
  notes?: string;
}

export interface UpdateReservationInput extends Partial<Omit<CreateReservationInput, "serviceId" | "clientId">> {
  status?: ReservationStatus;
}

// ============================================================================
// Closure (Exceptional Closure)
// ============================================================================

export interface Closure {
  closureId: string;
  spaId: string;
  date: string;
  reason?: string;
  isAllDay: boolean;
  startTime?: string;
  endTime?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateClosureInput {
  date: string;
  reason?: string;
  isAllDay?: boolean;
  startTime?: string;
  endTime?: string;
}

// ============================================================================
// Integration
// ============================================================================

export type IntegrationPermission =
  | "reservations:read"
  | "reservations:write"
  | "clients:read"
  | "clients:write"
  | "services:read"
  | "employees:read"
  | "rooms:read";

export type WebhookEventType =
  | "reservation.created"
  | "reservation.updated"
  | "reservation.cancelled"
  | "reservation.completed"
  | "client.created"
  | "client.updated";

export interface Integration {
  integrationId: string;
  spaId: string;
  name: string;
  description?: string;
  webhookUrl?: string;
  webhookEvents: WebhookEventType[];
  permissions: IntegrationPermission[];
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CreateIntegrationInput {
  name: string;
  description?: string;
  webhookUrl?: string;
  webhookEvents?: WebhookEventType[];
  permissions?: IntegrationPermission[];
}

export interface UpdateIntegrationInput {
  name?: string;
  description?: string;
  webhookUrl?: string;
  webhookEvents?: WebhookEventType[];
  permissions?: IntegrationPermission[];
  isActive?: boolean;
}

export interface IntegrationCreatedResponse extends Integration {
  secretToken: string;
  authorizationHeader: string;
}

export interface RegenerateSecretResponse {
  integrationId: string;
  secretToken: string;
  authorizationHeader: string;
}

// ============================================================================
// API Response Types
// ============================================================================

export interface ApiResponse<T> {
  data: T;
  message?: string;
}

export interface ApiListResponse<T> {
  data: T[];
}

export interface ApiError {
  message: string;
  code?: string;
  field?: string;
}
