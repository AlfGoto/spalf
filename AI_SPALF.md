# Spa Management Software - Project Specification

## Project Overview

Build a comprehensive spa management software (called "Spalf") that allows multiple spas to manage their operations efficiently. The software must be simple, fluid, fast, and follow excellent UX practices. The UI should be simple, black and white with no dark mode, with only color accent for subtle indications (like a canceled status) or CTAs

**Core Principles:**
- Follow SOLID principles
- Clear and comprehensible code
- Multi-tenant architecture
- Secure and isolated data per spa
- Integration-ready with external systems

---

## System Architecture

### High-Level Components

1. **Frontend**: Next.js web application for spa management
2. **Backend**: AWS serverless infrastructure
3. **API Layer 1**: Frontend API for web application
4. **API Layer 2**: Integration API for external systems (webhooks)
5. **Trigger System**: Outbound webhooks to external systems

### Project Root Structure

```
/
├── backend/          # AWS CDK infrastructure and Lambda functions
├── frontend/         # Next.js web application
├── AI_SPALF.md       # Project specification (this file)
├── LOOP.MD           # Agent loop instructions
└── PROGRESS.md       # Progress tracking for agents
```

### Multi-Tenancy Model

- Multiple spas can register and use the software
- Each spa has its own isolated management space
- External companies can integrate via token-based authentication
- Users can access multiple spas if they have the same login credentials (email)

---

## Authentication & Security

### User Pools (AWS Cognito)

**User Pool 1: Spa Users**
- For spa employees/managers accessing the web interface
- Authentication: email + password
- A user with the same email can access multiple spas

**User Pool 2: Integration Users**
- For external systems integrating with the API
- Token-based authentication
- Spas create integration logins to grant API access

### Security Requirements

- **API Gateway Authorizers**: Both APIs protected by Cognito authorizers
- **Data Isolation**: Strict separation of data between spas
- **Webhook Security**: Triggers send hashes decryptable via integration API
- **Token Management**: Each integration has a unique token for identification

---

## Domain Model

### 1. Employees

**Attributes:**
- First name (required)
- Last name (required)
- Email (required)
- Phone (optional)
- Employment type: Full-time or Freelance
- Variable schedules/hours

**Operations:**
- Create, Read, Update, Delete employees
- Manage employee schedules
- View employee calendar

### 2. Rooms (Salles)

**Attributes:**
- Name
- Minimum capacity
- Maximum capacity
- Maximum concurrent services allowed

**Operations:**
- CRUD operations
- View room calendar
- Check availability

### 3. Products

**Attributes:**
- Name
- Price
- Quantity (can be infinite)

**Operations:**
- CRUD operations
- Track inventory
- Associate with services

### 4. Services (Prestations)

**Attributes:**
- Name
- Description
- Price
- Duration
- Preparation time (optional)
- Recovery time (optional)
- Cancellation deadline
- Rescheduling policy (can be moved or not)

**Associations:**
- Products (consumed during service)
- Rooms (required for service)
- Employees (performing the service)
- Other services (composition - e.g., "massage + pool access")

**Configuration:**
- Time slot granularity per spa: 10, 15, 20, 30, or 60 minutes
- Not configurable per service, only per spa

**Operations:**
- CRUD operations
- Compose services from other services
- Check availability (employees, rooms, products)

### 5. Reservations

**Attributes:**
- Service(s) selected
- Client information
- Date and time
- Assigned employee(s)
- Assigned room(s)
- Status (pending, confirmed, completed, cancelled)

**Constraints:**
- Must check employee availability
- Must check room availability (considering capacity and concurrent services)
- Must check product availability
- Must respect preparation and recovery times

**Operations:**
- Create reservations (internal only for now)
- View reservations in calendar format
- Modify reservations (if policy allows)
- Cancel reservations (within cancellation deadline)
- Calendar views:
  - By employee schedule
  - By room schedule

### 6. Clients

**Attributes:**
- First name
- Last name
- Email
- Phone
- Allergies (notes)
- Preferences (notes)
- Additional notes
- Reservation history

**Operations:**
- Add manually
- Auto-create when making a reservation (if not exists)
- CRUD operations
- View client history and preferences

### 7. Exceptional Closures

**Attributes:**
- Date(s)
- Reason (holidays, maintenance, etc.)

**Operations:**
- CRUD operations
- Block reservations on these dates

---

## Frontend Architecture

### Tech Stack
- **Framework**: Next.js (App Router)
- **UI Components**: shadcn/ui
- **Styling**: Tailwind CSS
- **Type Safety**: TypeScript with openapi-typescript types

### Directory Structure (`frontend/`)

```
frontend/
├── src/
│   ├── app/
│   │   ├── (auth)/
│   │   │   ├── login/
│   │   │   └── register/
│   │   ├── (dashboard)/
│   │   │   ├── employees/
│   │   │   ├── rooms/
│   │   │   ├── products/
│   │   │   ├── services/
│   │   │   ├── reservations/
│   │   │   ├── clients/
│   │   │   └── settings/
│   │   └── layout.tsx
│   ├── features/
│   │   ├── employee-calendar/
│   │   │   ├── components/
│   │   │   ├── hooks/
│   │   │   └── index.tsx
│   │   ├── room-calendar/
│   │   ├── reservation-management/
│   │   ├── client-management/
│   │   ├── service-management/
│   │   └── ...
│   ├── package/
│   │   ├── ui/              # shadcn components
│   │   │   ├── button.tsx
│   │   │   ├── calendar.tsx
│   │   │   ├── dialog.tsx
│   │   │   └── ...
│   │   ├── auth/            # Authentication logic
│   │   └── ...
│   └── shared/
│       ├── types/           # openapi-typescript generated types
│       ├── api/             # API client functions
│       └── utils/
├── package.json
└── ...
```

### Routing Rules (`src/app/`)
- Only contain routing logic
- Import page component from `src/features/`
- Export default the component

**Example:**
```typescript
// src/app/(dashboard)/employees/page.tsx
import { EmployeesPage } from '@/features/employee-management'

export default EmployeesPage
```

### Features Organization (`src/features/`)
- Each feature in its own folder
- Contains all components, hooks, utilities specific to that feature
- Self-contained and modular

### Package Organization (`src/package/`)
- Third-party component wrappers (shadcn UI)
- Authentication functions
- Other reusable package-based utilities

### Shared Organization (`src/shared/`)
- Types from openapi-typescript
- API client wrappers
- Utilities used across features but sourced from packages

---

## Backend Architecture

### Tech Stack
- **Infrastructure**: AWS CDK (TypeScript)
- **Runtime**: AWS Lambda
- **Database**: DynamoDB with dynamodb-toolbox
- **API**: AWS API Gateway
- **Auth**: AWS Cognito
- **Error Handling**: Effect library
- **Type Safety**: TypeScript with openapi-fetch

### Directory Structure (`backend/`)

```
backend/
├── src/
│   ├── main.ts                      # CDK app entry point
│   ├── spalf.ts                     # Main construct (IaC definition)
│   ├── functions/
│   │   ├── api/
│   │   │   ├── index.ts             # API handler entry point
│   │   │   ├── routes/
│   │   │   │   ├── employees.ts
│   │   │   │   ├── rooms.ts
│   │   │   │   ├── products.ts
│   │   │   │   ├── services.ts
│   │   │   │   ├── reservations.ts
│   │   │   │   ├── clients.ts
│   │   │   │   └── ...
│   │   │   └── middleware.ts
│   │   ├── integration-api/
│   │   │   ├── index.ts
│   │   │   └── routes/
│   │   │       └── webhook.ts
│   │   └── trigger/
│   │       ├── index.ts             # Outbound webhook handler
│   │       └── handlers/
│   │           └── send-webhook.ts
│   └── core/
│       ├── database/
│       │   ├── table.ts             # DynamoDB table definition
│       │   ├── entities/
│       │   │   ├── spa.entity.ts
│       │   │   ├── employee.entity.ts
│       │   │   ├── room.entity.ts
│       │   │   ├── product.entity.ts
│       │   │   ├── service.entity.ts
│       │   │   ├── reservation.entity.ts
│       │   │   ├── client.entity.ts
│       │   │   └── ...
│       │   └── adapters/
│       │       └── effect-adapter.ts
│       ├── domain/
│       │   ├── employee/
│       │   ├── room/
│       │   ├── service/
│       │   ├── reservation/
│       │   └── ...
│       ├── ports/                   # Interfaces/abstractions
│       └── shared/
│           ├── errors.ts
│           └── utils.ts
├── package.json
└── ...
```

### Infrastructure Definition (`src/spalf.ts`)

Define using AWS CDK:
- DynamoDB tables
- Lambda functions
- API Gateway (2 instances: frontend API + integration API)
- Cognito User Pools (2 pools)
- EventBridge for triggers
- IAM roles and policies

### API Structure

**API 1: Frontend API** (`src/functions/api/`)
- Entry point: `index.ts` - defines global rules, middleware, error handling
- Routes imported and registered in `index.ts`
- Protected by Cognito User Pool 1 (spa users)
- Handles all CRUD operations for spa management

**API 2: Integration API** (`src/functions/integration-api/`)
- Entry point: `index.ts`
- Webhook endpoint for external systems to call
- Protected by Cognito User Pool 2 (integration users)
- Token-based identification of calling system

**Trigger System** (`src/functions/trigger/`)
- Sends webhooks to external systems
- Hash-based security (verifiable via integration API)
- Bidirectional integration support

### Core Layer (`src/core/`)

**Database Layer:**
- DynamoDB table definitions using dynamodb-toolbox
- Entity schemas for all domain models
- Effect adapters for functional error handling

**Domain Layer:**
- Business logic for each entity
- Validation rules
- Availability checking algorithms
- Reservation conflict detection

**Ports:**
- Abstractions and interfaces
- Repository patterns
- Service interfaces

### Effect Usage

Use Effect library for:
- **Error Handling**: Typed errors, error propagation
- **Tracing**: Request tracing and debugging
- **Composition**: Functional composition of operations
- **Side Effects**: Managing database operations, external calls

### Testing Requirements

**Unit Tests:**
- Test domain logic
- Test entity validation
- Test Effect adapters
- Test business rules (availability, conflicts, etc.)

**E2E Tests:**
- Test API endpoints
- Test authentication flows
- Test complete reservation flows
- Test webhook triggers
- Test data isolation between spas

---

## API Specifications

### Frontend API Endpoints

**Employees:**
- `GET /api/employees` - List all employees
- `GET /api/employees/:id` - Get employee details
- `POST /api/employees` - Create employee
- `PUT /api/employees/:id` - Update employee
- `DELETE /api/employees/:id` - Delete employee
- `GET /api/employees/:id/calendar` - Get employee calendar

**Rooms:**
- `GET /api/rooms` - List all rooms
- `GET /api/rooms/:id` - Get room details
- `POST /api/rooms` - Create room
- `PUT /api/rooms/:id` - Update room
- `DELETE /api/rooms/:id` - Delete room
- `GET /api/rooms/:id/calendar` - Get room calendar

**Products:**
- `GET /api/products` - List all products
- `GET /api/products/:id` - Get product details
- `POST /api/products` - Create product
- `PUT /api/products/:id` - Update product
- `DELETE /api/products/:id` - Delete product

**Services:**
- `GET /api/services` - List all services
- `GET /api/services/:id` - Get service details
- `POST /api/services` - Create service
- `PUT /api/services/:id` - Update service
- `DELETE /api/services/:id` - Delete service
- `GET /api/services/:id/availability` - Check availability

**Reservations:**
- `GET /api/reservations` - List reservations
- `GET /api/reservations/:id` - Get reservation details
- `POST /api/reservations` - Create reservation
- `PUT /api/reservations/:id` - Update/reschedule reservation
- `DELETE /api/reservations/:id` - Cancel reservation
- `GET /api/reservations/calendar` - Get calendar view

**Clients:**
- `GET /api/clients` - List clients
- `GET /api/clients/:id` - Get client details
- `POST /api/clients` - Create client
- `PUT /api/clients/:id` - Update client
- `DELETE /api/clients/:id` - Delete client
- `GET /api/clients/:id/history` - Get reservation history

**Settings:**
- `GET /api/settings` - Get spa settings
- `PUT /api/settings` - Update spa settings
- `GET /api/closures` - Get exceptional closures
- `POST /api/closures` - Add closure date
- `DELETE /api/closures/:id` - Remove closure date

### Integration API Endpoints

**Webhook Receiver:**
- `POST /integration/webhook` - Receive webhooks from external systems

**Data Access:**
- `GET /integration/reservations` - Get reservations (filtered by token)
- `POST /integration/reservations` - Create reservation
- `PUT /integration/reservations/:id` - Update reservation

**Security:**
- `POST /integration/verify-hash` - Verify trigger hash

---

## Key Business Rules

### Reservation Validation

1. **Employee Availability:**
   - Check employee schedule
   - Account for preparation time before service
   - Account for recovery time after service
   - No double-booking

2. **Room Availability:**
   - Check room capacity (min/max)
   - Check concurrent service limits
   - Account for preparation and recovery times
   - No overbooking

3. **Product Availability:**
   - Check product quantity
   - Reserve products when booking
   - Handle infinite quantity products

4. **Time Slot Granularity:**
   - Enforce spa-wide time slot configuration
   - Available options: 10, 15, 20, 30, 60 minutes
   - All reservations must align to these slots

5. **Exceptional Closures:**
   - Block all reservations on closure dates
   - Notify if attempting to book on closed date

### Cancellation & Rescheduling

- Check cancellation deadline before allowing cancellation
- Check rescheduling policy before allowing moves
- Apply the same availability checks when rescheduling
- Update related resources (employees, rooms, products)

### Service Composition

- Services can include other services
- Recursive composition allowed (e.g., package deals)
- Total duration = sum of all component durations
- Total price can be custom or sum of components
- Resources needed = union of all component resources

---

## Data Model (DynamoDB)

### Single Table Design

**Primary Key Structure:**
- PK: Entity identifier (e.g., `SPA#123`, `EMP#456`)
- SK: Entity type and details (e.g., `METADATA`, `RESERVATION#789`)

**GSI (Global Secondary Indexes):**
- GSI1: For querying by spa
  - PK: `SPA#123`
  - SK: Entity type
- GSI2: For querying by date
  - PK: `DATE#2026-01-23`
  - SK: `SPA#123#RESERVATION#789`

**Entity Examples:**

```typescript
// Spa
{
  PK: "SPA#123",
  SK: "METADATA",
  name: "Relaxation Spa",
  timeSlotGranularity: 15,
  createdAt: "2026-01-01T00:00:00Z"
}

// Employee
{
  PK: "SPA#123#EMPLOYEE#456",
  SK: "METADATA",
  spaId: "SPA#123",
  firstName: "John",
  lastName: "Doe",
  email: "john@example.com",
  phone: "+1234567890",
  employmentType: "FULLTIME"
}

// Reservation
{
  PK: "SPA#123#RESERVATION#789",
  SK: "METADATA",
  spaId: "SPA#123",
  serviceId: "SERVICE#123",
  clientId: "CLIENT#456",
  employeeId: "EMPLOYEE#789",
  roomId: "ROOM#012",
  date: "2026-01-23",
  startTime: "14:00",
  endTime: "15:30",
  status: "CONFIRMED"
}
```

---

## UX Requirements

### Key Principles

1. **Simplicity**: Minimize clicks and cognitive load
2. **Speed**: Fast page loads, optimistic UI updates
3. **Clarity**: Clear labeling, helpful error messages
4. **Fluidity**: Smooth transitions, responsive feedback

### Calendar Interface

- **Views**: Day, Week, Month
- **Drag-and-drop**: Reschedule by dragging
- **Quick actions**: Context menu for edit/cancel/view details
- **Conflict highlighting**: Visual indicators for conflicts
- **Real-time updates**: Reflect changes immediately

### Reservation Flow

1. Select service(s)
2. System shows available time slots
3. Select employee (or auto-assign)
4. Select room (or auto-assign)
5. Select/create client
6. Confirm reservation
7. Optional: Send confirmation email

### Form Design

- Progressive disclosure (show complexity only when needed)
- Inline validation with helpful messages
- Auto-save drafts
- Clear visual hierarchy

### Mobile Responsiveness

- Fully responsive design
- Touch-friendly controls
- Simplified views for small screens

---

## Implementation Phases

### Phase 1: Foundation
- Set up infrastructure (CDK)
- Create DynamoDB tables and entities
- Implement authentication (Cognito)
- Build basic CRUD APIs

### Phase 2: Core Features
- Employee management
- Room management
- Product management
- Service management (without composition)

### Phase 3: Reservations
- Reservation creation with validation
- Calendar views (employee and room)
- Availability checking algorithm
- Client management

### Phase 4: Advanced Features
- Service composition
- Exceptional closures
- Cancellation and rescheduling policies
- Preparation and recovery times

### Phase 5: Integrations
- Integration API
- Webhook triggers
- Token management
- Hash-based security

### Phase 6: Polish & Testing
- Complete test coverage
- Performance optimization
- UX refinements
- Documentation

---

## Non-Functional Requirements

### Performance

- API response time < 200ms (p95)
- Calendar load time < 1 second
- Support 1000+ concurrent users per spa
- Database queries optimized with indexes

### Scalability

- Serverless architecture auto-scales
- Multi-tenant design supports unlimited spas
- DynamoDB on-demand scaling

### Reliability

- 99.9% uptime SLA
- Automatic error recovery with Effect
- CloudWatch monitoring and alerts
- Backup and disaster recovery

### Security

- Data encrypted at rest and in transit
- JWT tokens with short expiration
- API rate limiting
- Regular security audits

---

## Future Enhancements

- Public booking interface for clients
- Email/SMS notifications
- Payment processing integration
- Reporting and analytics dashboard
- Mobile app (React Native)
- Multi-language support
- Loyalty program management
- Inventory management for retail products
- Staff payroll integration
- Marketing campaign management

---

## Technical Constraints

- **Region**: AWS region to be determined
- **Node.js Version**: Latest LTS
- **TypeScript**: Strict mode enabled
- **Code Quality**: ESLint + Prettier configured
- **Git**: Conventional commits, feature branch workflow
- **CI/CD**: GitHub Actions for testing and deployment

---

## Glossary

- **Spa**: A business entity using the software
- **Prestation/Service**: A treatment or service offered by the spa
- **Salle/Room**: A physical space where services are performed
- **Client**: A customer of the spa
- **Integration**: External system connecting via API
- **Trigger**: Outbound webhook sent to external systems
- **Granularity**: Time slot size for reservations (e.g., 15 minutes)
- **Exceptional Closure**: Days when the spa is closed

---

## Success Criteria

1. Spa can manage all entities (employees, rooms, products, services)
2. Reservations can be created with full validation
3. Calendar views are fast and intuitive
4. Data is completely isolated between spas
5. External integrations work securely
6. Code follows SOLID principles
7. Test coverage > 80%
8. UX is smooth and responsive

---

## Contact & Questions

This document serves as the complete specification for the Spalf spa management software. All implementation decisions should align with these requirements while maintaining flexibility for future enhancements.
