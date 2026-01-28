# Spa Management Software - Project Specification

## Project Overview

Build a comprehensive spa management software (called "Spalf") that allows multiple spas to manage their operations efficiently. The software must be simple, fluid, fast, and follow excellent UX practices. The UI should be simple, black and white with no dark mode, with only color accent for subtle indications (like a canceled status) or CTAs

**Core Principles:**
- Follow SOLID principles
- Clear and comprehensible code
- Multi-tenant architecture
- Secure and isolated data per spa
- Integration-ready with external systems
- No circular dependencies in code structure
- All IDs must be UUIDs v4
- Automated tests required for every backend feature implemented

**Environment Variables:**
The agent must define and document all environment variables it needs. When implementing features that require configuration:
- Define the env var name with a clear prefix (e.g., `SPALF_API_URL`, `SPALF_COGNITO_POOL_ID`)
- Log the required env vars after deployment so they can be added to `.env` and `redocly.yml`
- Frontend env vars go in `.env.local` for Next.js
- Backend env vars are set via CDK stack outputs

**Development Deployment:**
- Use AWS SSO account "sezame-perso" for development deployments
- After `cdk deploy`, capture the stack outputs (env vars) and update:
  - `frontend/.env.local`
  - `frontend/redocly.yml` (for API URL)

---

## System Architecture

### High-Level Components

1. **Frontend**: Next.js web application for spa management (server-side rendered as much as possible), includes public integration documentation pages
2. **Backend**: AWS serverless infrastructure (using projen AwsCdkTypeScriptApp)
3. **API Layer 1**: Frontend API for web application (Hono + OpenAPI)
4. **API Layer 2**: Integration API for external systems (webhooks)
5. **Trigger System**: DynamoDB Streams-based outbound webhooks to external systems

**Important**: Do NOT use AWS Amplify. Use raw AWS services via CDK.

### Project Root Structure

```
/
├── backend/          # AWS CDK infrastructure and Lambda functions (projen AwsCdkTypeScriptApp)
├── frontend/         # Next.js web application for spa management + public integration docs
├── AI_SPALF.md       # Project specification (this file)
├── LOOP.MD           # Agent loop instructions
└── PROGRESS.md       # Progress tracking for agents
```

### Multi-Tenancy Model

- Multiple spas can register and use the software
- Each spa has its own isolated management space
- External companies can integrate via token-based authentication
- Users can access multiple spas if they have the same login credentials (email)
- Each spa must configure a timezone (can be inferred from address selection during setup)
- All date/time operations must respect the spa's configured timezone

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

### Frontend Authentication

Use **Better Auth** library in the frontend to connect to AWS Cognito User Pool:
- Better Auth handles the authentication flow on the frontend
- Connects to Cognito User Pool 1 for spa user authentication
- All auth operations should be server-side (Next.js API routes or server actions)
- JWT tokens validated server-side before rendering protected pages

### Security Requirements

- **API Gateway Authorizers**: Both APIs protected by Cognito authorizers
- **Data Isolation**: Strict separation of data between spas
- **Webhook Security**: Triggers send hashes decryptable via integration API
- **Token Management**: Each integration has a unique token for identification

---

## Domain Model

### 0. Spa (Tenant)

**Attributes:**
- ID (UUID v4, required)
- Name (required)
- Timezone (IANA timezone identifier, required - e.g., "America/New_York", "Europe/Paris")
- Address (optional, can be used to infer timezone during setup)
- Time slot granularity (10, 15, 20, 30, or 60 minutes)

**Operations:**
- Create spa (during registration)
- Update spa settings
- Configure timezone (can be auto-detected from address)

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
- **Framework**: Next.js (App Router) - maximize server-side rendering (SSR/RSC)
- **UI Components**: shadcn/ui
- **Styling**: Tailwind CSS
- **Type Safety**: TypeScript with openapi-fetch types generated via redocly.yml
- **Authentication**: Better Auth (connecting to Cognito User Pool)
- **i18n**: Translations support (all UI text must be translatable)

### Internationalization (i18n)

- All user-facing text must use translation keys
- Support for multiple languages (at minimum: English, French)
- Translation files stored in `frontend/src/locales/`
- Use Next.js internationalized routing or a library like next-intl
- Language preference can be stored per user or detected from browser

### API Type Generation

Use `redocly.yml` configuration for OpenAPI type generation:

```yaml
# frontend/redocly.yml
apis:
  main:
    root: ${SPALF_API_URL}/openapi.json
    # After deployment, update this URL from CDK outputs

openapi-ts:
  output: ./src/shared/types/api.ts
```

Run type generation after backend deployment to sync types.

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
│   │   ├── (public)/              # Public pages (no auth required)
│   │   │   └── docs/
│   │   │       ├── page.tsx       # Documentation landing page
│   │   │       ├── api-reference/ # API documentation pages
│   │   │       ├── guides/        # Integration guides
│   │   │       └── webhooks/      # Webhook documentation
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
│   ├── locales/             # Translation files
│   │   ├── en/
│   │   │   └── common.json
│   │   └── fr/
│   │       └── common.json
│   ├── package/
│   │   ├── ui/              # shadcn components
│   │   │   ├── button.tsx
│   │   │   ├── calendar.tsx
│   │   │   ├── dialog.tsx
│   │   │   └── ...
│   │   ├── auth/            # Better Auth configuration
│   │   └── ...
│   └── shared/
│       ├── types/           # openapi-fetch generated types (via redocly)
│       ├── api/             # API client functions using openapi-fetch
│       └── utils/
├── redocly.yml              # OpenAPI type generation config
├── .env.local               # Environment variables (from CDK outputs)
├── package.json
└── ...
```

### Public Documentation Pages (`src/app/(public)/docs/`)

Integration documentation is part of the main frontend but served as public pages (no authentication required):

**Route Group**: `(public)` - pages in this group bypass authentication middleware

**Purpose:**
- Document the Integration API for external developers
- Provide webhook payload examples
- Authentication guides for integration users
- Interactive API explorer (optional)

**Key Routes:**
- `/docs` - Documentation landing page
- `/docs/api-reference` - API endpoint documentation
- `/docs/guides` - Integration guides and tutorials
- `/docs/webhooks` - Webhook event documentation and payload examples

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
- **Project Management**: projen AwsCdkTypeScriptApp
- **Infrastructure**: AWS CDK (TypeScript) - NO Amplify
- **Runtime**: AWS Lambda with Middy middleware
- **API Framework**: Hono with @hono/zod-openapi for OpenAPI spec generation
- **Database**: DynamoDB with dynamodb-toolbox V2
- **API Gateway**: AWS API Gateway (REST)
- **Auth**: AWS Cognito (2 user pools)
- **Error Handling**: Effect library
- **Type Safety**: TypeScript with openapi-fetch
- **Triggers**: DynamoDB Streams (reacting to database changes, not events)

### Projen Setup

Initialize backend with projen:

```bash
cd backend
npx projen new awscdk-app-ts
```

Configure `.projenrc.ts` for the project settings, dependencies, and scripts.

### Middy Middleware

All Lambda functions should use Middy for:
- Error handling
- Input validation
- Logging
- CORS handling

```typescript
import middy from '@middy/core';
import httpErrorHandler from '@middy/http-error-handler';
// ... other middleware
```

### Hono with OpenAPI

Use Hono for API routing with OpenAPI spec generation:

```typescript
import { OpenAPIHono } from '@hono/zod-openapi';

const app = new OpenAPIHono();

// Define routes with Zod schemas for automatic OpenAPI generation
app.openapi(route, handler);

// Expose OpenAPI spec at /openapi.json
app.doc('/openapi.json', { ... });
```

### Directory Structure (`backend/`)

Managed by projen AwsCdkTypeScriptApp:

```
backend/
├── .projenrc.ts                     # Projen configuration
├── src/
│   ├── main.ts                      # CDK app entry point
│   ├── spalf.ts                     # Main construct (IaC definition)
│   ├── functions/
│   │   ├── api/
│   │   │   ├── index.ts             # Hono API handler entry point
│   │   │   ├── routes/
│   │   │   │   ├── employees.ts     # Hono routes with zod-openapi
│   │   │   │   ├── rooms.ts
│   │   │   │   ├── products.ts
│   │   │   │   ├── services.ts
│   │   │   │   ├── reservations.ts
│   │   │   │   ├── clients.ts
│   │   │   │   └── ...
│   │   │   └── middleware.ts        # Middy middleware configuration
│   │   ├── integration-api/
│   │   │   ├── index.ts
│   │   │   └── routes/
│   │   │       └── webhook.ts
│   │   └── trigger/
│   │       ├── index.ts             # DynamoDB Stream handler
│   │       └── handlers/
│   │           └── send-webhook.ts  # Processes stream events, sends webhooks
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
├── test/                            # Test files (required for every feature)
│   ├── functions/
│   │   ├── api/
│   │   └── trigger/
│   └── core/
├── package.json                     # Managed by projen
└── ...
```

### Infrastructure Definition (`src/spalf.ts`)

Define using AWS CDK (NO Amplify):
- DynamoDB table with Streams enabled (NEW_AND_OLD_IMAGES)
- Lambda functions (wrapped with Middy, using Hono for HTTP)
- API Gateway (2 instances: frontend API + integration API)
- Cognito User Pools (2 pools)
- DynamoDB Streams trigger (Lambda listening to table changes)
- IAM roles and policies

**Stack Outputs (for env vars):**
After deployment, the stack should output:
- `SPALF_API_URL` - Frontend API Gateway URL
- `SPALF_INTEGRATION_API_URL` - Integration API Gateway URL
- `SPALF_USER_POOL_ID` - Cognito User Pool 1 ID
- `SPALF_USER_POOL_CLIENT_ID` - Cognito User Pool 1 Client ID
- `SPALF_INTEGRATION_POOL_ID` - Cognito User Pool 2 ID

These outputs should be logged and used to populate `frontend/.env.local` and `frontend/redocly.yml`.

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
- Triggered by DynamoDB Streams (reacts to database changes, not manual events)
- Processes INSERT, MODIFY, DELETE events from the DynamoDB table
- Sends webhooks to external systems based on configured triggers
- Hash-based security (verifiable via integration API)
- Bidirectional integration support

**DynamoDB Streams Configuration:**
- Enable streams on the main table with NEW_AND_OLD_IMAGES view type
- Lambda trigger processes stream records and dispatches webhooks
- Filter by entity type and change type to determine which webhooks to send

### Core Layer (`src/core/`)

**Database Layer:**
- DynamoDB table definitions using dynamodb-toolbox V2
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

**IMPORTANT**: Every time a feature is implemented in the backend, an automated test MUST be created for it. No feature is complete without its corresponding test.

**Unit Tests:**
- Test domain logic
- Test entity validation
- Test Effect adapters
- Test business rules (availability, conflicts, etc.)
- Test Hono route handlers
- Test Middy middleware chains

**Integration Tests:**
- Test DynamoDB operations with local DynamoDB
- Test DynamoDB Stream trigger processing
- Test webhook delivery

**E2E Tests:**
- Test API endpoints
- Test authentication flows
- Test complete reservation flows
- Test webhook triggers
- Test data isolation between spas

**Test Commands (via projen):**
```bash
cd backend
npx projen test        # Run all tests
npx projen test:watch  # Watch mode
```

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

All IDs are UUIDs v4 (e.g., `550e8400-e29b-41d4-a716-446655440000`)

```typescript
// Spa
{
  PK: "SPA#550e8400-e29b-41d4-a716-446655440000",
  SK: "METADATA",
  id: "550e8400-e29b-41d4-a716-446655440000",
  name: "Relaxation Spa",
  timezone: "America/New_York",  // IANA timezone identifier
  address: {
    street: "123 Main St",
    city: "New York",
    country: "US"
  },
  timeSlotGranularity: 15,
  createdAt: "2026-01-01T00:00:00Z"
}

// Employee
{
  PK: "SPA#550e8400-e29b-41d4-a716-446655440000#EMPLOYEE#660e8400-e29b-41d4-a716-446655440001",
  SK: "METADATA",
  id: "660e8400-e29b-41d4-a716-446655440001",
  spaId: "550e8400-e29b-41d4-a716-446655440000",
  firstName: "John",
  lastName: "Doe",
  email: "john@example.com",
  phone: "+1234567890",
  employmentType: "FULLTIME"
}

// Reservation
{
  PK: "SPA#550e8400-e29b-41d4-a716-446655440000#RESERVATION#770e8400-e29b-41d4-a716-446655440002",
  SK: "METADATA",
  id: "770e8400-e29b-41d4-a716-446655440002",
  spaId: "550e8400-e29b-41d4-a716-446655440000",
  serviceId: "880e8400-e29b-41d4-a716-446655440003",
  clientId: "990e8400-e29b-41d4-a716-446655440004",
  employeeId: "660e8400-e29b-41d4-a716-446655440001",
  roomId: "aa0e8400-e29b-41d4-a716-446655440005",
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
- **Code Quality**: ESLint + Prettier configured (managed by projen for backend)
- **Git**: Conventional commits, feature branch workflow
- **CI/CD**: GitHub Actions for testing and deployment
- **IDs**: All entity IDs must be UUIDs v4
- **No Amplify**: Use raw AWS services via CDK only
- **No Circular Dependencies**: Code must be structured to avoid circular imports
- **Backend Project**: Use projen AwsCdkTypeScriptApp
- **API Framework**: Hono with @hono/zod-openapi
- **Lambda Middleware**: Middy
- **Frontend Rendering**: Server-side as much as possible (SSR/RSC)
- **Frontend Auth**: Better Auth connected to Cognito
- **Translations**: Frontend must support i18n
- **API Types**: Generated via redocly.yml from OpenAPI spec
- **Triggers**: DynamoDB Streams (not EventBridge)

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
7. Test coverage > 80% (automated test for every feature)
8. UX is smooth and responsive
9. Frontend supports multiple languages (i18n)
10. All IDs are UUIDs v4
11. Timezone handling is correct for each spa
12. DynamoDB Streams triggers work correctly
13. Integration documentation is available at public /docs routes
14. No circular dependencies in codebase

---

## Contact & Questions

This document serves as the complete specification for the Spalf spa management software. All implementation decisions should align with these requirements while maintaining flexibility for future enhancements.
