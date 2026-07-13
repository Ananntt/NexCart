# NexCart — Architecture Freeze v1.0

**Document type:** Permanent architectural blueprint
**Status:** Frozen — changes require explicit architectural review, not incidental drift
**Location:** `docs/architecture/architecture-freeze-v1.md`
**Companion documents (do not duplicate, cross-reference instead):**
- `docs/database.md` — Phase 5.1, MongoDB schema design
- `docs/api.md` — Phase 5.2, REST API design
- `docs/search-engine.md` — Phase 5.3, search pipeline design
- `docs/providers.md` — Phase 5.4, provider integration design

This document is the entry point. Any contributor — human or AI — should be able to read this file alone and understand where everything lives, why it lives there, and what is allowed to depend on what. Where detail already exists in one of the four documents above, this document links to it rather than restating it.

---

## 1. Vision

### 1.1 What NexCart is

NexCart (product name: **BuyWise**) is an AI-powered **Universal Commerce Platform**. A person types (or speaks) one natural-language query, and NexCart aggregates, normalizes, and ranks results across commerce verticals that today live in separate apps: shopping, food delivery, quick/instant delivery, groceries, travel, and future services (movies, cabs, coupons, cashback).

The product bet is that commerce comparison shouldn't require opening eight apps. One search surface, many providers behind it.

### 1.2 Product philosophy

- **Aggregation is the product.** NexCart doesn't compete by being a better single-vertical app; it competes by unifying verticals no one else unifies well.
- **Trust through freshness and transparency.** A comparison platform that shows stale prices or silently drops providers erodes the one thing it's selling: confidence in the comparison. Partial results are always labeled as partial (`search-engine.md` §2.10/§4), never presented as complete.
- **Provider-agnostic by design.** No single provider is structurally privileged in code. Ranking may weight by reliability or relevance, but the architecture itself treats all 8 (and future) providers through one uniform contract (`providers.md` §1).

### 1.3 Engineering philosophy

- **Production-first, not demo-first.** Every phase is built as if it ships, because it will. No placeholder hacks, no "we'll fix it later" scaffolding that becomes permanent.
- **Documentation as source of truth.** The four Phase 5 documents plus this blueprint are authoritative. Code conforms to them; code does not silently redefine them. Divergence is a discussion, not a commit.
- **Small, reviewable sprints.** Architecture is designed in large phases; it is *implemented* in small sprints (Sprint 6.1, 6.2, ...), each reviewed before merge.
- **Frozen unless justified.** Completed architecture (Phases 1–5) is not redesigned opportunistically. A real architectural issue gets surfaced, explained, and approved before it changes anything.

### 1.4 Scalability goals

- **Horizontal statelessness** for the Orchestrator and Provider Execution layers — the only shared state is MongoDB and the cache layer (`search-engine.md` §6).
- **Provider #9 is a checklist, not a redesign** — new integrations are new adapters behind the existing Provider Interface, never a change to Search Orchestrator, Ranking, or the API layer (`providers.md` §9).
- **Bounded, TTL-governed growth** on every append-heavy collection (`SearchHistory`, `AnalyticsEvents`, `PriceHistory`) so operational data doesn't unboundedly inflate the primary database (`database.md` §17).
- **Layered timeout budgets** so one slow dependency degrades gracefully instead of cascading (`providers.md` §8).

---

## 2. Repository Structure

### 2.1 Current state (verified against the live repository, `Ananntt/NexCart`, `main` branch)

As of this document, the repository contains **only** the Phase 1–2 frontend foundation:

```
NexCart/
├── app/                    # Next.js App Router — layout, landing page, global styles
├── components/
│   ├── ui/                 # Design system primitives (Button, Card, Badge, Input, ...)
│   ├── navbar/              # Sticky nav + mobile drawer
│   ├── hero/                 # Landing hero + popular searches
│   ├── search/               # AI search bar (UI only, no backend wiring yet)
│   └── categories/            # Quick-access category grid
├── constants/                # site.ts, navigation.ts, search.ts, categories.ts
├── hooks/                    # use-media-query, use-rotating-value
├── lib/                      # utils.ts (cn() class merger)
├── types/                    # index.ts — shared frontend types (ModuleId, NavItem, Category, ...)
├── public/                   # Static assets
├── components.json           # shadcn/ui config
├── next.config.mjs
├── tsconfig.json
└── package.json
```

No `server/`, `src/`, error/Result system, or search-engine code exists in the repository yet. This blueprint's job is to define where that code will live **as it is built**, sprint by sprint, so the target shape is agreed upon before implementation begins rather than improvised file-by-file.

### 2.2 Target structure (full planned tree)

This is the complete, intended repository shape once the backend foundation (Sprint 6.x) and search engine implementation (Sprint 7.x+) land. Every folder below is explained in §9. Folders are annotated `[Existing]`, `[Planned]`, or `[Reserved]` — see the Appendix (§14) for the authoritative, fully-annotated version.

```
NexCart/
├── app/                          [Existing]  Next.js App Router — pages, layouts, route handlers
│   └── api/                      [Planned]   Versioned API route handlers (thin — see §4)
│       └── v1/
│           ├── health/
│           └── search/
├── components/                   [Existing]  UI components (design system + feature UI)
├── constants/                    [Existing]  Static config-like data (nav, categories, search)
├── hooks/                        [Existing]  Shared React hooks
├── lib/                          [Existing]  Frontend-only utilities (cn, etc.)
├── types/                        [Existing]  Shared frontend TypeScript types
├── public/                       [Existing]  Static assets
│
├── src/
│   ├── server/                   [Planned]   All backend/server-only code. Never imported by client components.
│   │   ├── context/              [Planned]   RequestContext creation & propagation
│   │   ├── http/                 [Planned]   Response envelope helpers, validation helpers
│   │   ├── errors/                [Planned]   Error classes + error-mapper.ts (HTTP status mapping)
│   │   ├── serialization/          [Reserved]  Response serializers (e.g. Users/Providers field projection)
│   │   ├── middleware/             [Planned]   Auth, rate-limiting, logging middleware
│   │   ├── config/                  [Planned]   Environment-derived server configuration
│   │   └── health/                   [Planned]   Health-check service
│   │
│   ├── search/                    [Planned]   Search Engine — see §5 and `search-engine.md`
│   │   ├── orchestrator/          [Planned]   Search Orchestrator
│   │   ├── selection/              [Planned]   Provider Selection
│   │   ├── execution/               [Planned]   Provider Execution (fan-out, timeouts, retries)
│   │   ├── normalization/            [Planned]   Cross-provider normalization & entity resolution
│   │   ├── ranking/                   [Planned]   Ranking Engine
│   │   ├── caching/                    [Planned]   Search result cache
│   │   └── pipeline/                    [Planned]   Pipeline composition/wiring
│   │
│   ├── providers/                 [Planned]   Provider adapters — see `providers.md` §1
│   │   ├── contracts/              [Planned]   Provider Interface (shared contract type)
│   │   ├── registry/                [Planned]   Provider Registry (lookup, active/inactive filtering)
│   │   ├── amazon/                   [Reserved]  Amazon adapter + normalizer
│   │   ├── flipkart/                  [Reserved]  Flipkart adapter + normalizer
│   │   ├── blinkit/                    [Reserved]  Blinkit adapter + normalizer
│   │   ├── zepto/                       [Reserved]  Zepto adapter + normalizer
│   │   ├── swiggy/                       [Reserved]  Swiggy adapter + normalizer
│   │   ├── zomato/                        [Reserved]  Zomato adapter + normalizer
│   │   ├── travel/                         [Reserved]  Travel adapter + normalizer
│   │   └── hotels/                          [Reserved]  Hotels adapter + normalizer
│   │
│   ├── services/                  [Planned]   Business/domain logic, orchestrating across search/providers/db
│   │   ├── search-service/         [Planned]   Owns the search use-case end to end
│   │   ├── product-service/         [Reserved]  Product read/detail logic
│   │   ├── favorites-service/        [Reserved]
│   │   ├── notifications-service/     [Reserved]
│   │   └── auth-service/               [Reserved]
│   │
│   ├── features/                  [Reserved]  Vertical-specific feature modules (food, travel, grocery, ...)
│   │   ├── shopping/
│   │   ├── food/
│   │   ├── grocery/
│   │   └── travel/
│   │
│   ├── shared/                    [Planned]   Cross-cutting, framework-agnostic modules — see §6
│   │   ├── result/                 [Planned]   Result<T, E> pattern
│   │   ├── logger/                  [Planned]   Structured logging
│   │   ├── constants/                [Planned]   Shared backend constants
│   │   ├── types/                     [Planned]   Shared backend TypeScript types (Timestamp, etc.)
│   │   └── utils/                      [Planned]   date-utils.ts and other framework-agnostic helpers
│   │
│   ├── config/                    [Planned]   Environment variable parsing & typed config export
│   │
│   ├── validation/                 [Planned]   Shared request/schema validation helpers
│   │
│   └── db/                         [Reserved]  MongoDB client, models/schemas per `database.md`
│       ├── models/
│       └── client.ts
│
├── docs/
│   ├── database.md                [Existing]
│   ├── api.md                     [Existing]
│   ├── search-engine.md           [Existing]
│   ├── providers.md               [Existing]
│   └── architecture/
│       └── architecture-freeze-v1.md   [Existing — this document]
│
├── middleware.ts                  [Reserved]  Next.js edge middleware (auth/session bootstrap), if needed
├── package.json                   [Existing]
├── tsconfig.json                  [Existing]
└── next.config.mjs                [Existing]
```

### 2.3 Why `src/` for backend code

Frontend code (`app/`, `components/`, `hooks/`, `lib/`, `types/`) stays at the repository root, matching the existing Next.js convention already in place. All backend-only code is consolidated under `src/` so that:

- Client-bundle analysis and import boundaries are easy to reason about — nothing under `src/server`, `src/search`, `src/providers`, or `src/db` should ever end up in a client bundle.
- The distinction between "Next.js app scaffolding" (existing, frontend) and "NexCart backend platform" (new, being built now) is structurally visible, not just a naming convention.

---

## 3. Layered Architecture

Each layer below has one job. Dependency direction is one-way (see §10 for the full rule). A layer may depend only on layers below it in this list.

### 3.1 UI
- **Responsibility:** Render, capture input, client-side interaction/animation. No business logic, no ranking, no provider awareness (`search-engine.md` §2.2).
- **Allowed dependencies:** Features, Shared (types only), design-system components.
- **Forbidden dependencies:** Server, Search, Providers, DB — the UI never imports backend-only modules directly. It talks to the API layer over HTTP.
- **Examples:** `components/search/ai-search.tsx`, `components/categories/*`.

### 3.2 Features
- **Responsibility:** Vertical-specific composition of UI + client data-fetching for one commerce vertical (shopping, food, travel, ...).
- **Allowed dependencies:** UI, Shared.
- **Forbidden dependencies:** Search, Providers, DB directly — features call the API layer, not backend modules directly.
- **Examples (planned):** `src/features/food/*`, `src/features/travel/*`.

### 3.3 Services
- **Responsibility:** Own a use-case end to end (e.g. "perform a search," "add a favorite"). Coordinates Search/Providers/DB, applies business rules, returns a `Result<T, E>` (§6). This is where business logic lives — never in route handlers (per the project's core engineering principle).
- **Allowed dependencies:** Search, Providers, DB, Shared, Config.
- **Forbidden dependencies:** UI, Features, Next.js request/response types — services are framework-agnostic and testable outside HTTP.
- **Examples (planned):** `src/services/search-service/*`.

### 3.4 Search
- **Responsibility:** The search pipeline described fully in `search-engine.md` — Orchestrator, Provider Selection, Provider Execution, Normalization, Ranking, Caching.
- **Allowed dependencies:** Providers, Shared, Config.
- **Forbidden dependencies:** Server (HTTP concerns), UI, Features.
- **Examples (planned):** `src/search/orchestrator/*`.

### 3.5 Providers
- **Responsibility:** One adapter per external provider, implementing the uniform Provider Interface (`providers.md` §1). Adapters are "dumb" — normalization happens one layer up.
- **Allowed dependencies:** Shared, Config.
- **Forbidden dependencies:** Search (providers don't know they're being orchestrated), Server, UI.
- **Examples (planned):** `src/providers/amazon/*`.

### 3.6 Shared
- **Responsibility:** Framework-agnostic primitives used everywhere — Result pattern, logger, shared types, date utilities, constants.
- **Allowed dependencies:** None (this is the foundation layer; it depends on nothing else in the app).
- **Forbidden dependencies:** Everything above it — Shared must never import from Server, Search, Providers, Services, Features, or UI. A dependency into Shared from any of those layers is fine; a dependency out of Shared into any of those is a layering violation.
- **Examples:** `date_utils.ts` (already written, framework-agnostic — belongs here once `src/shared/utils/` exists), Result type, Logger.

### 3.7 Server
- **Responsibility:** HTTP-layer concerns only — request context, response envelopes, validation helpers, error-to-HTTP-status mapping, middleware. This is Sprint 6.1's scope.
- **Allowed dependencies:** Services, Shared, Config.
- **Forbidden dependencies:** Search, Providers, DB directly — Server calls into Services, which then reach into Search/Providers/DB. Server never bypasses Services.
- **Examples (planned):** `src/server/context/request-context.ts`, `src/server/errors/error-mapper.ts`.

### 3.8 Config
- **Responsibility:** Read and validate environment variables once, export a typed config object. No other module reads `process.env` directly.
- **Allowed dependencies:** None (leaf module, alongside Shared).
- **Forbidden dependencies:** Everything — Config is imported, it does not import application code.
- **Examples (planned):** `src/config/env.ts`.

---

## 4. Backend Architecture

Backend code lives under `src/server/` (HTTP-layer concerns) with actual route entry points thinly wired in `app/api/v1/*` (Next.js Route Handlers). The split exists so that HTTP framework specifics (Next.js `Request`/`Response`, route file conventions) stay isolated from the reusable backend logic in `src/server/`.

| Folder | Responsibility | Notes |
|---|---|---|
| `app/api/v1/*` | Route handlers — thinnest possible layer | Parses the request, builds a `RequestContext`, calls one Service method, passes the result to a response helper. No business logic. |
| `src/server/context/` | `RequestContext` construction | Generates `requestId`, accepts/derives optional `traceId`, attaches to every request lifecycle (see Sprint 6.1). |
| `src/server/http/` | Standard success/error envelope builders, validation helpers | Implements the envelope shapes already defined in `api.md` §0.3/§0.4 — one place, not per-route. |
| `src/server/errors/` | Domain error classes + `error-mapper.ts` | Maps typed domain errors (e.g. `ValidationError`, `NotFoundError`, `RateLimitError`) to the HTTP status codes in `api.md` §0.5. Renamed from the working-name `status-map.ts` during Sprint 6.1 for clarity of purpose. |
| `src/server/serialization/` | Response serializers | **Reserved, currently empty.** Will hold field-projection logic (e.g. stripping `passwordHash`, `apiConfig.credentialRef` per `database.md` §17 and `api.md` §10) once auth/DB land. |
| `src/server/middleware/` | Auth, rate limiting, request logging | Applied per-route or globally; implements the rate-limit table in `api.md` §0.6 once auth exists. |
| `src/server/config/` | Server-specific config derivation | Thin wrapper over `src/config/` for server-only values (build/version metadata, etc.). |
| `src/server/health/` | Health-check service | Backs `GET /v1/health` — process uptime, version/build from config, environment, timestamp. No `package.json` reads at runtime. |

**Principle carried over from the project's core rules:** route handlers only orchestrate — validate input, call a service, format output. If a route handler contains an `if` statement deciding business outcomes, that logic belongs in a Service instead.

---

## 5. Search Engine Architecture

Full detail lives in `docs/search-engine.md` — this section only maps the documented pipeline onto repository folders so the two documents stay in sync without duplicating content.

| Pipeline stage (`search-engine.md` §2) | Repository location |
|---|---|
| Search Orchestrator (§2.4) | `src/search/orchestrator/` |
| Provider Selection (§2.5) | `src/search/selection/` |
| Provider Execution (§2.6) | `src/search/execution/` |
| Normalization (§2.7) | `src/search/normalization/` |
| Ranking (§2.8) | `src/search/ranking/` |
| Caching Layer (§2.9) | `src/search/caching/` |
| Provider Interface / adapters (`providers.md` §1) | `src/providers/contracts/`, `src/providers/<name>/` |
| Provider Registry (active/inactive filtering, per `database.md` §7) | `src/providers/registry/` |

The **Search Service** (`src/services/search-service/`) is the seam between the HTTP layer and this pipeline: `app/api/v1/search` calls the Search Service, which invokes the Orchestrator and returns a `Result<SearchResponse, SearchError>`. Nothing in `src/search/` or `src/providers/` is ever imported directly by a route handler — always through the Service layer (§3.3, §10).

This document does not redefine timeout budgets, ranking factors, cache TTLs, or failure-handling behavior — those are fully specified in `search-engine.md` §§2–6 and remain authoritative.

---

## 6. Shared Foundation

| Module | Purpose |
|---|---|
| **Result Pattern** (`src/shared/result/`) | A `Result<T, E>` type used as the return shape for Services and Search-layer functions instead of throwing for expected failure modes (validation failure, provider timeout, not-found). Exceptions are reserved for truly unexpected errors; expected failures are values. |
| **Logger** (`src/shared/logger/`) | Structured logging (level, requestId/traceId correlation, no `console.log` scattered through the codebase). Every layer logs through this, never directly to stdout. |
| **Config** (`src/config/`) | Single source of typed, validated environment configuration. Everything else imports from here — nothing else touches `process.env`. |
| **Utilities** (`src/shared/utils/`) | Framework-agnostic helpers with no business meaning of their own — e.g. the existing `date_utils.ts` (ISO timestamp helpers, TTL math, expiry checks) belongs here verbatim once this folder is created. |
| **Constants** (`src/shared/constants/`) | Shared enums/constants (error codes matching `api.md` §10's "one shared enum" rule, TTL defaults, etc.) — single definition, imported everywhere, never re-declared per module. |
| **Shared Types** (`src/shared/types/`) | Cross-layer TypeScript types not specific to any one feature — e.g. `Timestamp`, `RequestContext`, the `Result<T,E>` generic parameters. |
| **Error System** (`src/server/errors/`) | Domain error class hierarchy + the HTTP mapping layer (§4). Logically "shared" in spirit but kept under `server/` since its mapped output (HTTP status codes) is an HTTP-layer concern; the underlying error *classes* themselves are safe for Services/Search to throw/return without knowing about HTTP at all. |

---

## 7. Coding Standards

These apply repository-wide, frontend and backend:

- **Strict TypeScript everywhere.** `strict: true` stays on (already enabled in `tsconfig.json`); no loosening it to unblock a feature.
- **No `any`** unless an existing, already-justified case requires it — new `any` usage requires explicit sign-off, not a quiet workaround.
- **SOLID principles**, applied pragmatically — most relevant here are Single Responsibility (one module, one job — this is why Search/Providers/Services/Server are separate layers) and Dependency Inversion (Services depend on Provider *interfaces*, never concrete adapters, per `providers.md` §1).
- **Composition over inheritance** where reasonable — provider adapters compose a shared normalizer/rate-limiter/circuit-breaker rather than inheriting from a shared base class hierarchy.
- **Thin route handlers.** A route handler builds context, calls one service method, formats the response. Nothing else.
- **Business logic lives in Services**, never in route handlers, never in UI components, never in provider adapters (adapters return provider-raw shapes; normalization/business rules live above them).
- **No circular dependencies** across layers — enforced by the dependency direction in §10.
- **Reuse shared utilities** — before writing a new date/time helper, string utility, or constant, check `src/shared/` first.
- **No duplicate business logic** — if two Services need the same rule (e.g. "what counts as an active offer"), that rule is extracted into one place both call, not copy-pasted.

---

## 8. Naming Conventions

| Category | Convention | Example |
|---|---|---|
| Files (modules/utilities) | `kebab-case.ts` | `error-mapper.ts`, `request-context.ts` |
| Files (React components) | `kebab-case.tsx`, default export matches component name | `ai-search.tsx` exporting `AiSearch` |
| Classes | `PascalCase` | `ValidationError`, `SearchOrchestrator` |
| Interfaces | `PascalCase`, no `I` prefix | `RequestContext`, `ProviderAdapter` |
| Type aliases | `PascalCase` | `Result<T, E>`, `Timestamp` |
| Enums | `PascalCase` name, `PascalCase` or `SCREAMING_SNAKE_CASE` members depending on whether they map to a wire-format string (match the casing already used in `database.md`'s documented enums, e.g. `active` / `inactive` stay lowercase string literal unions rather than TS `enum` where the DB doc specifies lowercase values) | — |
| Constants | `SCREAMING_SNAKE_CASE` for true constants | `DEFAULT_CACHE_TTL_SECONDS` |
| Folders | `kebab-case`, plural for collections of similar things | `providers/`, `services/` |
| Environment variables | `SCREAMING_SNAKE_CASE`, prefixed by concern | `APP_VERSION`, `APP_BUILD`, `NODE_ENV` |
| Git commits | Conventional Commits style | `feat(server): add request context`, `fix(search): correct cache key normalization` |
| Branches | `type/short-description` | `feature/sprint-6.1-api-foundation`, `fix/error-mapper-rename` |

---

## 9. Folder Responsibilities

| Folder | Why it exists | Belongs there | Must never go there |
|---|---|---|---|
| `app/` | Next.js routing convention | Pages, layouts, route handlers | Business logic, provider calls, DB queries |
| `app/api/` | HTTP entry points | Thin handlers wiring request → Service → response | Anything beyond orchestration of a single Service call |
| `components/` | Reusable UI | Presentational + lightly-stateful UI | Backend imports, direct provider/DB access |
| `constants/` (root) | Static frontend config data | Nav items, category lists, UI copy | Server secrets, backend business rules |
| `hooks/` | Shared React state/behavior | `useX` hooks | Business logic that belongs in a Service |
| `lib/` (root) | Frontend-only helpers | `cn()`-style utilities | Anything server-only or shared with backend (goes in `src/shared/` instead) |
| `types/` (root) | Frontend-facing shared types | `NavItem`, `Category`, UI-facing shapes | Backend domain types (goes in `src/shared/types/`) |
| `src/server/` | HTTP-layer backend concerns | Context, envelopes, error mapping, middleware | Business logic, provider/search code |
| `src/search/` | Search pipeline | Orchestrator, selection, execution, normalization, ranking, caching | HTTP concerns, direct DB writes outside its own caching tier |
| `src/providers/` | External integrations | One adapter + normalizer per provider | Business rules unrelated to a single provider's data shape |
| `src/services/` | Use-case orchestration | Cross-layer coordination, business rules, transactions | Framework-specific request/response handling |
| `src/features/` | Vertical-specific frontend composition | Feature-scoped UI + client data hooks | Backend logic |
| `src/shared/` | Framework-agnostic primitives | Result, Logger, shared types/constants/utils | Anything that imports from Server/Search/Providers/Services |
| `src/config/` | Environment configuration | Typed, validated env export | Business logic, `process.env` reads anywhere else |
| `src/validation/` | Reusable schema validation | Shared validators for request shapes | One-off inline validation better placed with its route |
| `src/db/` | Data access | MongoDB client + models matching `database.md` | Business rules (belongs in Services) |
| `docs/` | Architecture source of truth | Phase 5 docs + this blueprint | Implementation code |

---

## 10. Dependency Rules

### 10.1 Allowed direction

```
UI / Features
     ↓
 Server (HTTP layer)
     ↓
 Services
     ↓
 Search  →  Providers
     ↓           ↓
 Shared  ←───────┘
     ↓
 Config
```

Reading this: UI and Features call into Server (over HTTP, not a direct import) or, for client-side-only concerns, Features may use Shared types directly. Server calls Services. Services call Search and/or Providers and/or the DB layer. Search calls Providers. Everything may depend on Shared and Config; Shared and Config depend on nothing in the app.

### 10.2 What must never directly communicate

- **UI/Features must never import from `src/search/`, `src/providers/`, or `src/db/` directly.** All backend access goes through the HTTP API (`app/api/v1/*`), even for server components, to keep one consistent access path and keep the API layer honest as the actual contract boundary.
- **Route handlers (`app/api/*`) must never import from `src/search/` or `src/providers/` directly.** They call a Service. This is what keeps route handlers thin and keeps business logic testable without an HTTP context.
- **Providers must never import from Search or Services.** An adapter doesn't know it's being orchestrated — this is what makes adapters swappable per `providers.md` §1.
- **Shared must never import from any other application layer.** A violation here (e.g. the Logger importing a Service to log something "nicely") creates a circular dependency risk and defeats the purpose of a foundation layer.
- **Config must never contain logic beyond parsing/validating environment variables.** It is data, not behavior.

---

## 11. Future Reserved Modules

These folders are intentionally named and placed now, even though empty, so that future work has an agreed-upon home rather than being placed ad hoc later.

| Reserved folder | Why it's reserved now |
|---|---|
| `src/server/serialization/` | Field-projection serializers (stripping `passwordHash`, `apiConfig.credentialRef`) will be needed the moment auth/DB land — the folder exists so that requirement isn't forgotten or improvised inline in route handlers. |
| `src/services/auth-service/` | Authentication business logic (`api.md` §1) — not implemented until an explicit auth sprint, per the current sprint's explicit exclusion list. |
| `src/db/` | MongoDB client + models (`database.md`) — reserved until a DB sprint is scoped; Sprint 6.1 explicitly excludes DB work. |
| `analytics/` (future, likely `src/services/analytics-service/`) | `AnalyticsEvents` ingestion (`api.md` §9, `database.md` §14) is a documented, designed collection with no implementation yet. |
| `caching/` (future, likely `src/search/caching/` + a shared cache client) | The search-result cache (`search-engine.md` §2.9) and provider-level cache (`providers.md` §6) are both designed but unimplemented. |
| `workers/` (future) | Background sync jobs described in `providers.md` §6.2 (scheduled provider pulls) and `database.md` §17 (denormalization refresh jobs) will need a home outside the request/response cycle. |
| `notifications/` (future, likely `src/services/notifications-service/`) | `Notifications` collection and delivery channels (`database.md` §13, `api.md` §8) are designed, not built. |
| `ai/` (future) | The "AI-powered" query understanding/intent layer implied by the product vision (§1.1) — natural-language query parsing ahead of Search Orchestrator — is a named future concern, not yet designed in any Phase 5 document. |
| `recommendation/` (future) | Personalization beyond the mild re-ranking already specified in `search-engine.md` §2.8 point 5 (e.g. a dedicated recommendations surface) — future scope, not yet designed. |
| `payments/` (future) | Not part of the current aggregator model (NexCart links out to providers rather than processing payment itself), reserved only in case that changes. |

---

## 12. Sprint Roadmap

### Completed

- **Phase 1** — Project Foundation (folder structure, git, README, design system, strict TypeScript)
- **Phase 2** — Landing Page
- **Phase 3** — Search UI (search page, results UI, filters, result cards)
- **Phase 4** — Search Architecture (design: orchestrator, provider contracts, pipeline, ranking engine, provider registry, error system, Result pattern, search service, configuration — as documented design, see note in §2.1 on current repository state)
- **Phase 5** — Architecture Documentation (`database.md`, `api.md`, `search-engine.md`, `providers.md`)

### Current

- **Sprint 6.1** — Production API Foundation: versioned API routes, `RequestContext`, standard response/validation helpers, health endpoint, search endpoint stub, HTTP error mapping (`error-mapper.ts`). Explicitly excludes database, auth, provider integrations, business logic, AI, and external API calls.

### Future (high level only — detailed scoping happens per-sprint)

- **Sprint 6.2+** — Likely candidates, in rough dependency order: database client + models (`src/db/`), Provider Interface + first real adapter (`src/providers/`), Search Orchestrator wiring against a real (even if single-provider) pipeline, authentication (`src/services/auth-service/`), then progressively: Favorites, Notifications, Reviews, Analytics ingestion, background sync workers, remaining provider adapters, AI query-understanding layer.

This roadmap is intentionally high-level. Each sprint gets its own scoped plan, file list, and approval step before implementation, per the project's working process.

---

## 13. Architecture Principles

These are permanent, not sprint-specific:

1. **Never redesign completed architecture without justification.** If a real issue is found, it is explained, its impact stated, and solutions proposed — then approved — before anything changes.
2. **Documents are source of truth.** `database.md`, `api.md`, `search-engine.md`, `providers.md`, and this blueprint govern implementation, not the other way around. Code that contradicts them is a bug in the code or a flagged doc-update proposal, never a silent divergence.
3. **Small sprint development.** Large architectural phases are designed once; they are implemented incrementally, each increment reviewed before merge.
4. **Production-first engineering.** No placeholder hacks, no demo-quality shortcuts treated as "temporary" — temporary code has a way of becoming permanent, so it isn't written that way to begin with.
5. **Modular architecture.** Every layer in §3 has one job and a defined dependency boundary (§10). New code fits into an existing layer; it does not invent a new one without updating this document.
6. **Backward compatibility where possible.** API changes are additive (`api.md` §0.1) unless a breaking change is deliberate and versioned (`/v2`).
7. **One uniform contract at integration boundaries.** The Provider Interface (`providers.md` §1) is the model for how future integration points (payment processors, AI providers, notification channels) should also be designed — a single abstract contract, adapters behind it.
8. **Reserved folders are a commitment, not decoration.** A folder marked `[Reserved]` in §2.2/§14 signals "this is the agreed home when this work starts," not "this may or may not happen."

---

## 14. Appendix — Complete Repository Tree (Annotated)

Legend: **[E]** Existing · **[P]** Planned (actively being built or next in line) · **[R]** Reserved (named now, no work scheduled yet)

```
NexCart/
├── app/                                    [E]
│   ├── layout.tsx                          [E]
│   ├── page.tsx                            [E]
│   ├── globals.css                         [E]
│   └── api/                                [P]
│       └── v1/                             [P]
│           ├── health/route.ts             [P]  Sprint 6.1
│           └── search/route.ts              [P]  Sprint 6.1 (stub only)
│
├── components/                             [E]
│   ├── ui/                                 [E]
│   ├── navbar/                             [E]
│   ├── hero/                               [E]
│   ├── search/                             [E]
│   └── categories/                         [E]
│
├── constants/                              [E]
│   ├── site.ts                             [E]
│   ├── navigation.ts                       [E]
│   ├── search.ts                           [E]
│   └── categories.ts                       [E]
│
├── hooks/                                  [E]
│   ├── use-media-query.ts                  [E]
│   └── use-rotating-value.ts               [E]
│
├── lib/                                    [E]
│   └── utils.ts                            [E]
│
├── types/                                  [E]
│   └── index.ts                            [E]
│
├── public/                                 [E]
│
├── src/                                    [P]  New in Sprint 6.x
│   ├── server/                             [P]
│   │   ├── context/                        [P]  Sprint 6.1 — RequestContext
│   │   ├── http/                           [P]  Sprint 6.1 — response/validation helpers
│   │   ├── errors/                         [P]  Sprint 6.1 — error classes + error-mapper.ts
│   │   ├── serialization/                  [R]  Empty — future response serializers
│   │   ├── middleware/                     [R]  Future — auth/rate-limit/logging
│   │   ├── config/                         [P]  Sprint 6.1 — server config surface
│   │   └── health/                         [P]  Sprint 6.1 — health-check service
│   │
│   ├── search/                             [R]  Future sprint — see search-engine.md
│   │   ├── orchestrator/                   [R]
│   │   ├── selection/                      [R]
│   │   ├── execution/                      [R]
│   │   ├── normalization/                  [R]
│   │   ├── ranking/                        [R]
│   │   ├── caching/                        [R]
│   │   └── pipeline/                       [R]
│   │
│   ├── providers/                          [R]  Future sprint — see providers.md
│   │   ├── contracts/                      [R]
│   │   ├── registry/                       [R]
│   │   ├── amazon/                         [R]
│   │   ├── flipkart/                       [R]
│   │   ├── blinkit/                        [R]
│   │   ├── zepto/                          [R]
│   │   ├── swiggy/                         [R]
│   │   ├── zomato/                         [R]
│   │   ├── travel/                         [R]
│   │   └── hotels/                         [R]
│   │
│   ├── services/                           [R]  Future sprint
│   │   ├── search-service/                 [R]
│   │   ├── product-service/                [R]
│   │   ├── favorites-service/              [R]
│   │   ├── notifications-service/          [R]
│   │   └── auth-service/                   [R]
│   │
│   ├── features/                           [R]  Future — vertical frontend composition
│   │   ├── shopping/                       [R]
│   │   ├── food/                           [R]
│   │   ├── grocery/                        [R]
│   │   └── travel/                         [R]
│   │
│   ├── shared/                             [P]
│   │   ├── result/                         [P]  Sprint 6.1 or immediately after
│   │   ├── logger/                         [P]
│   │   ├── constants/                      [P]
│   │   ├── types/                          [P]  Houses RequestContext type, Timestamp, etc.
│   │   └── utils/                          [P]  date_utils.ts relocates here
│   │
│   ├── config/                             [P]  Sprint 6.1 — env parsing (APP_VERSION, APP_BUILD, ...)
│   │
│   ├── validation/                         [P]  Sprint 6.1 — shared validation helpers
│   │
│   └── db/                                 [R]  Future sprint — MongoDB client + models
│       ├── models/                         [R]
│       └── client.ts                       [R]
│
├── docs/
│   ├── database.md                         [E]
│   ├── api.md                              [E]
│   ├── search-engine.md                    [E]
│   ├── providers.md                        [E]
│   └── architecture/
│       └── architecture-freeze-v1.md       [E]  This document
│
├── middleware.ts                           [R]  Next.js edge middleware, if/when needed
├── components.json                         [E]
├── next.config.mjs                         [E]
├── postcss.config.mjs                      [E]
├── package.json                            [E]
├── tsconfig.json                           [E]
└── pnpm-lock.yaml                          [E]
```

---

*End of Architecture Freeze v1.0. This document supersedes no existing Phase 5 document — it organizes them. Future revisions require an explicit version bump (`architecture-freeze-v1.1`, `v2`, ...) and a stated reason, per §13.*
