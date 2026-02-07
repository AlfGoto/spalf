# AI Prompt — Spa Management Software (SPAFL)

You are a **software architect + senior TypeScript engineer**. You must design and implement a spa management product that is **simple**, **smooth**, and **fast**, with strong **UX best practices**, and a robust **AWS serverless** backend.

The code must be **clear**, **understandable**, **tested**, and follow **SOLID**. Prefer a modular architecture with crisp boundaries (core/domain vs adapters) and strict typing.

---

## 1) Product goal

Build a multi-tenant SaaS spa management product that supports:
- Managing **employees** (full-time / freelance, variable schedules)
- Managing **rooms** (min/max capacity, max simultaneous services)
- Managing **products** (price, quantity, possibly infinite)
- Managing **services** (price, rules, required resources, service bundles)
- Managing **exceptional closure days**
- Managing **clients** (light CRM: allergies, preferences, notes, etc.)
- Managing **reservations** (internal-only for now) via calendar views (rooms/employees)

Key constraints:
- **Multi-spa**: multiple spas can sign up; each has its own management space.
- **Strict data isolation** between spas.
- **UX**: fast workflows (calendars, availability).

---

## 2) Multi-tenancy, logins, and access control

### 2.1 Spas, users, access
- A **user** (identity = email + password) can belong to **one or multiple spas**.
- A user can only access the spas they are assigned to.
- If two spas share the same login (same email), that user can access both.

### 2.2 External integrations
- **Companies** (integrations) can integrate with the platform.
- Each company has a **token** (or dedicated identity) used notably for webhooks.
- The system must identify who is calling and which spa/data to read/modify.

### 2.3 Two login types (Cognito security)
- **Website user pool**: access to the web app (frontend).
- **Integration user pool**: access to the integration API only (no access to the website).
- Both API Gateways are protected by the corresponding **Cognito authorizers**.
- If a spa wants to grant an integration access, it creates a dedicated “integration” login.

---

## 3) APIs + trigger (bidirectional)

You must implement:
- **Frontend API**: used by the Next.js app.
- **Integration API**: used by third-party software (incoming/outgoing webhooks).
- **Trigger**: when information changes (e.g., reservation created/updated/cancelled), trigger outbound delivery to integrations’ webhooks.

Rules:
- Integrations call the Integration API (incoming) using its auth mechanism.
- The trigger notifies external webhooks (outgoing).
- The trigger sends a **hash** that is “decryptable via the Integration API” (you must design, document, and test the exact mechanism).

Define clearly:
- Which events trigger webhooks (`reservation.created`, `reservation.updated`, `reservation.cancelled`, `client.updated`, etc.).
- The payload schema (OpenAPI).
- Retry/backoff and idempotency strategy.

---

## 4) Domain model

### 4.1 Main entities (per spa)
- **Spa**
- **Employee**
  - type: `full_time | freelance`
  - first name, last name, email, phone (optional)
  - variable schedule (planning)
- **Room**
  - min/max capacity
  - max simultaneous services
- **Product**
  - price
  - quantity (can be infinite)
- **Service**
  - price
  - resources: products, rooms, employees
  - can include other services (bundles)
  - preparation / recovery time
  - cancellation deadline
  - ability to move a reservation (rules to define)
  - slot granularity: 10/15/20/30/60 minutes **configurable per spa**
- **ExceptionalClosure**
  - dates/times for exceptional closures
- **Client**
  - allergies, preferences, notes, etc.
  - created manually or automatically if absent during a reservation
- **Reservation**
  - links client + service(s) + resources + time range
  - validation: room/employee/product availability
  - created/edited from calendar views (room view or employee view)

### 4.2 Reservation rules (must implement)
- Only create a reservation if:
  - room(s) are available (capacity, simultaneous constraints)
  - employee(s) are available
  - products are available (if finite quantity)
  - exceptional closures are respected
  - service preparation/recovery times are respected
- Conflicts must return actionable errors (codes + messages).

---

## 5) Frontend (Next.js + shadcn + tailwind)

### 5.1 Stack
- Next.js (App Router)
- shadcn/ui
- tailwindcss

### 5.2 Required folder organization
- `src/app/`: **routing only**. Each page file should ideally only:
  - import the page component from a feature
  - `export default` that component
- `src/features/`: features grouped by page/domain (e.g. `src/features/employee-calendar/`)
- `src/package/`: package-level things (e.g. shadcn components in `src/package/ui`, login helpers, etc.)
- `src/shared/`: shared utilities used by features but originating from packages (e.g. `openapi-typescript` types, `openapi-fetch` client)

### 5.3 Expected UX
- High-performance calendar (virtualization if needed).
- Fast interactions: create/edit reservation, clear feedback.
- Robust forms and validation.

---

## 6) Backend (AWS, CDK, Effect, DynamoDB)

### 6.1 Stack
- AWS CDK (TypeScript)
- Node.js Lambdas (TypeScript)
- API Gateway
- Cognito User Pools + Authorizers
- DynamoDB with `dynamodb-toolbox`
- `effect` for:
  - typed error handling
  - structured logging/tracing
- OpenAPI + `openapi-fetch` + generated types (OpenAPI TypeScript)

### 6.2 Required backend organization
- `src/main.ts`: construct entry point
- `src/spalf.ts`: CDK construct (infra as code)
- `src/functions/`
  - `src/functions/api/index.ts`: API global rules + wiring
  - `src/functions/api/*`: routes imported into `index.ts`
  - `src/functions/trigger/`: webhook trigger logic (outgoing)
- `src/core/`
  - `dynamodb-toolbox` tables/entities
  - ports/adapters (repositories)
  - domain services (use-cases)
  - error mapping

### 6.3 Multi-tenant isolation (mandatory)
Implement an explicit strategy:
- All DynamoDB data must be partitioned by `spaId` (e.g., PK starts with `SPA#<spaId>`).
- Every request must be constrained by `spaId` derived from token/claims.
- E2E tests must verify one spa cannot read/write another spa’s data.

---

## 7) OpenAPI, contracts, and clients

You must produce an **OpenAPI** specification for:
- Frontend API
- Integration API

Then generate/consume:
- OpenAPI TypeScript types
- Clients using `openapi-fetch`

Endpoints must be consistent, versioned, and include:
- typed errors (code, message, details)
- pagination when needed
- idempotency keys for sensitive endpoints (reservations)

---

## 8) Tests (mandatory)

The backend must include:
- **Unit tests** (domain/core: availability rules, calculations, validations)
- **E2E tests** (API: auth, multi-tenant isolation, reservation scenarios, webhooks)

Also include:
- idempotency tests (reservation creation)
- simple concurrency tests (availability conflicts)
- webhook trigger tests (payload, signature/hash, retry)

---

## 9) Quality requirements

- SOLID, clean code, clear naming
- TypeScript strict
- Structured logs (correlation id / trace id)
- No “god modules”
- Hexagonal / ports-adapters architecture recommended
- A README including:
  - setup
  - commands (dev/test)
  - repo structure
  - architecture decisions

---

## 10) What you must deliver (outputs)

1. A monorepo (or clear structure) with frontend + backend.
2. A deployable CDK backend (construct + main).
3. Two separate APIs, secured via Cognito (2 user pools).
4. Outgoing webhook trigger + incoming webhook endpoints.
5. DynamoDB (table + entities + repositories) with spa-level isolation.
6. OpenAPI specs + TS clients.
7. Unit + E2E tests + documentation.

---

## 11) Getting started (recommended order)

1. Define the DynamoDB **data model** (PK/SK, GSIs).
2. Define **use-cases** (core) and errors.
3. Define OpenAPI (2 specs) and contracts.
4. Implement the frontend API (CRUD entities + reservations).
5. Implement the integration API + trigger.
6. Implement essential frontend pages (auth, spa list, calendar, CRUD).
7. Add unit/e2e tests and harden security/isolation.

---

## 12) Implicit decisions you must make (decide and document)

Without asking for confirmation, make reasonable choices and document them:
- Employee schedule storage strategy (slots vs recurring rules).
- Availability computation algorithm (spa-configurable granularity).
- Product stock handling during reservation (reserve stock vs decrement at finalization).
- Meaning of “move a reservation” and constraints.
- Format of the “hash decryptable via the Integration API” (e.g., encrypted envelope + key rotation).
- Retry, idempotency, and webhook deduplication mechanism.

# Prompt IA — Logiciel de gestion de spa (SPAFL)

Tu es un **architecte logiciel + développeur senior TypeScript**. Tu dois concevoir et implémenter un logiciel de gestion de spa **simple**, **fluide**, **rapide**, avec de **bonnes pratiques UX**, et un backend **AWS serverless** robuste.

Le code doit être **clair**, **compréhensible**, **testé**, et respecter **SOLID**. Tu privilégies une architecture modulaire, des frontières nettes (core/domain vs adapters), et des types stricts.

---

## 1) Objectif produit

Construire un logiciel SaaS multi-tenant de gestion de spa permettant :
- Gestion des **employés** (FT/freelance, horaires variables)
- Gestion des **salles** (capacité min/max, nombre de prestations simultanées max)
- Gestion des **produits** (prix, quantité, quantité potentiellement infinie)
- Gestion des **prestations** (prix, règles, ressources nécessaires, groupements de prestations)
- Gestion des **jours exceptionnellement fermés**
- Gestion de **clients** (CRM simple: allergies, préférences, notes, etc.)
- Gestion des **réservations** (uniquement en interne pour l’instant) via calendrier (salles/employés)

Contraintes clés :
- **Multi-spa**: plusieurs spas s’inscrivent, chacun a son espace.
- **Isolation stricte des données** entre spas.
- **UX**: workflows rapides (calendriers, disponibilité).

---

## 2) Multi-tenant, logins et droits

### 2.1 Spas, utilisateurs, accès
- Un **utilisateur** (identité = email + mot de passe) peut être inscrit sur **un ou plusieurs spas**.
- L’utilisateur ne peut accéder qu’aux spas sur lesquels il est inscrit.
- Si deux spas partagent le même login (même email), l’utilisateur a accès aux deux.

### 2.2 Intégrations externes
- Des **entreprises** (integrations) peuvent s’intégrer à la plateforme.
- Chaque entreprise a un **token** (ou identité dédiée) utilisé notamment pour les webhooks.
- On doit pouvoir identifier qui appelle et quel spa/données consulter/modifier.

### 2.3 Deux types de logins (sécurité Cognito)
- **User pool Website**: accès à l’app web (frontend).
- **User pool Integration**: accès à l’API d’intégration uniquement (pas accès au site).
- Les **2 API Gateways** sont protégées par **authorizers Cognito** correspondants.
- Si un spa veut donner accès à une intégration, il crée un login dédié “integration”.

---

## 3) APIs + trigger (bidirectionnel)

Tu dois implémenter :
- **API Frontend**: utilisée par l’app Next.js.
- **API Integration**: utilisée par des logiciels tiers (webhooks entrants/sortants).
- **Trigger**: quand une info change (ex: réservation créée/modifiée/annulée), déclencher l’envoi vers les webhooks sortants des intégrations.

Règles :
- L’intégration appelle l’API d’intégration (entrant) via son mécanisme d’auth.
- Le trigger notifie les webhooks externes (sortant).
- Le trigger envoie un **hash** “decryptable via l’API d’intégration” (mécanisme exact à concevoir, documenter, tester).

Définis clairement :
- Quels événements déclenchent les webhooks (reservation.created, reservation.updated, reservation.cancelled, client.updated, etc.).
- Le schéma de payload (OpenAPI).
- La stratégie de retry/backoff et idempotence.

---

## 4) Modèle métier (domain)

### 4.1 Entités principales (par spa)
- **Spa**
- **Employee**
  - type: full_time | freelance
  - nom, prénom, email, tel (optionnel)
  - horaires variables (planning)
- **Room**
  - capacité min/max
  - nb de prestations simultanées max
- **Product**
  - prix
  - quantité (peut être infinie)
- **Service (Prestation)**
  - prix
  - ressources: produits, salles, employés
  - peut inclure d’autres prestations (groupement)
  - temps de préparation / récupération
  - délai d’annulation
  - possibilité de déplacer la réservation (règles à préciser)
  - granularité de créneaux: 10/15/20/30/60 minutes **configurable par spa**
- **ExceptionalClosure**
  - dates/horaires de fermeture exceptionnelle
- **Client**
  - allergies, préférences, notes, etc.
  - créé manuellement ou automatiquement si absent lors d’une réservation
- **Reservation**
  - associe client + prestation(s) + ressources + horaires
  - validation: disponibilité salles/employés/produits
  - créé/édité depuis un calendrier (vue salle ou employé)

### 4.2 Règles de réservation (à implémenter)
- Ne créer une réservation que si :
  - salle(s) disponible(s) (capacité, simultanéité)
  - employé(s) disponible(s)
  - produits disponibles (si quantité finie)
  - respecte closures exceptionnelles
  - respecte préparation/récupération de la prestation
- Les conflits doivent remonter des erreurs exploitables (codes + messages).

---

## 5) Frontend (Next.js + shadcn + tailwind)

### 5.1 Stack
- Next.js (App Router)
- shadcn/ui
- tailwindcss

### 5.2 Organisation imposée
- `src/app/` : **routing uniquement**. Chaque fichier de page fait idéalement seulement :
  - import du composant de page depuis feature
  - export default du composant
- `src/features/` : features par page/domaine (ex: `src/features/employee-calendar/`)
- `src/package/` : wrappers package (ex: shadcn dans `src/package/ui`, auth helpers, etc.)
- `src/shared/` : utilitaires partagés utilisés par les features mais issus de packages (ex: types `openapi-typescript`, client `openapi-fetch`)

### 5.3 UX attendue
- Calendrier performant (virtualisation si nécessaire).
- Interactions rapides: création/édition réservation, feedback clair.
- Formulaires robustes, validation.

---

## 6) Backend (AWS, CDK, Effect, DynamoDB)

### 6.1 Stack
- AWS CDK (TypeScript)
- Lambdas Node.js (TypeScript)
- API Gateway
- Cognito User Pools + Authorizers
- DynamoDB avec `dynamodb-toolbox`
- `effect` pour :
  - gestion d’erreurs typées
  - logging/tracing structuré
- OpenAPI + `openapi-fetch` + types générés (OpenAPI Typescript)

### 6.2 Organisation imposée
- `src/main.ts` : point d’entrée de la construct
- `src/spalf.ts` : construct CDK (infra as code)
- `src/functions/`
  - `src/functions/api/index.ts` : règles globales API + wiring
  - `src/functions/api/*` : routes importées dans `index.ts`
  - `src/functions/trigger/` : logique trigger webhook (sortant)
- `src/core/`
  - tables/entities `dynamodb-toolbox`
  - ports/adapters (repository)
  - services domain (use-cases)
  - mapping erreurs

### 6.3 Multi-tenant isolation (obligatoire)
Implémente une stratégie explicite :
- Toutes les données DynamoDB doivent être partitionnées par `spaId` (ex: PK commence par `SPA#<spaId>`).
- Toute requête doit être contrainte par `spaId` dérivé du token/claims.
- Tests e2e doivent vérifier qu’un spa ne peut pas lire/écrire les données d’un autre spa.

---

## 7) OpenAPI, contrats et clients

Tu dois produire une spécification **OpenAPI** pour :
- API Frontend
- API Integration

Puis générer/consommer :
- Types TypeScript OpenAPI
- Clients avec `openapi-fetch`

Les endpoints doivent être cohérents, versionnés, et avoir :
- erreurs typées (code, message, détails)
- pagination si nécessaire
- idempotency keys pour endpoints sensibles (réservation)

---

## 8) Tests (obligatoires)

Le backend doit inclure :
- **Unit tests** (domain/core: règles de disponibilité, calculs, validations)
- **E2E tests** (API: auth, isolation multi-tenant, scénarios réservation, webhooks)

Inclure aussi :
- tests d’idempotence (création réservation)
- tests de concurrence simples (conflits de disponibilité)
- tests du trigger webhook (payload, signature/hash, retry)

---

## 9) Exigences de qualité

- SOLID, clean code, naming clair
- TypeScript strict
- Logs structurés (correlation id / trace id)
- Pas de “god modules”
- Architecture hexagonale/ports-adapters recommandée
- README avec :
  - setup
  - commandes (dev/test)
  - structure de repo
  - décisions d’archi

---

## 10) Ce que tu dois produire (livrables)

1. Monorepo (ou structure claire) avec frontend + backend.
2. Backend CDK déployable (construct + main).
3. Deux APIs séparées, sécurisées via Cognito (2 user pools).
4. Trigger webhook sortant + endpoints webhook entrants.
5. DynamoDB (table + entities + repositories) avec isolation par spa.
6. OpenAPI specs + clients TS.
7. Tests unitaires + e2e + documentation.

---

## 11) Démarrage (ordre recommandé)

1. Définir le **modèle de données** DynamoDB (PK/SK, GSIs).
2. Définir les **use-cases** (core) et erreurs.
3. Définir OpenAPI (2 specs) et contrats.
4. Implémenter API frontend (CRUD entités + réservation).
5. Implémenter API intégration + trigger.
6. Implémenter frontend pages essentielles (auth, liste spa, calendrier, CRUD).
7. Ajouter tests unit/e2e et durcir sécurité/isolation.

---

## 12) Questions implicites à trancher (tu dois décider et documenter)

Sans demander confirmation, fais des choix raisonnables et documente-les :
- Stratégie de stockage des horaires employés (slots vs règles récurrentes).
- Algorithme de calcul de disponibilité (granularité configurable par spa).
- Gestion de stock produit lors de la réservation (réservation de stock vs décrément final).
- Sémantique “déplacer une réservation” et contraintes.
- Format du “hash decryptable via l’API intégration” (ex: enveloppe chiffrée + rotation clés).
- Mécanisme de retry, idempotence, et déduplication webhooks.

