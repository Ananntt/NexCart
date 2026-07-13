# NexCart — Engineering Standards v1.0

**Version:** 1.0
**Status:** Active — binding for all contributors, human or AI
**Owner:** Engineering (CTO / Product Architect function)
**Last Updated:** 2026-07-13

**Companion documents (do not duplicate, cross-reference instead):**
- `docs/architecture/architecture-freeze-v1.md` — repository structure, layers, dependency rules
- `docs/database.md` — MongoDB schema design
- `docs/api.md` — REST API design
- `docs/search-engine.md` — search pipeline design
- `docs/providers.md` — provider integration design

Where the Architecture Freeze defines **where code lives and what may depend on what**, this document defines **how code is written** within that structure. If anything here appears to conflict with the Architecture Freeze, the Architecture Freeze wins — raise it as a flagged inconsistency, not a silent override.

---

## 1. Purpose

Coding standards exist so that NexCart can be built by many contributors — human and AI — over time, without the codebase degrading into something only its original author understands.

Goals:

- **Consistency** — the same kind of problem is solved the same way everywhere, so contributors spend time on the problem, not on decoding local conventions.
- **Maintainability** — code changes without fear, because responsibilities are clear and side effects are contained.
- **Scalability** — the codebase can grow from one provider to nine, from one vertical to six, without a structural rewrite.
- **Readability** — code is written to be read far more often than it is written; clarity beats cleverness.
- **Production-quality engineering** — NexCart is built as a real startup from day one. There is no "throwaway" branch of the codebase.

---

## 2. General Engineering Principles

- **Production-first engineering.** Every line is written as if it ships, because it will. No placeholder hacks, no "temporary" code — temporary code has a way of becoming permanent.
- **Strict TypeScript, always.** `strict: true` is non-negotiable. It is never loosened to unblock a feature faster.
- **SOLID principles, applied pragmatically.** Especially Single Responsibility (one module, one job) and Dependency Inversion (depend on interfaces, not concrete implementations — see `providers.md` §1).
- **Composition over inheritance.** Prefer composing small, focused functions/objects over building class hierarchies.
- **Small, reusable modules.** A module that does one thing is easier to test, replace, and reason about than one that does five.
- **Explicit typing over inference-by-convenience.** Types document intent; don't rely on the compiler silently widening or narrowing something important.
- **Avoid premature optimization.** Correctness and clarity first; optimize only against a measured bottleneck, not a guess.
- **Keep code simple.** The simplest solution that correctly satisfies the requirement is the right one until proven otherwise.
- **Readability over cleverness.** If a reviewer has to pause to decode a one-liner, it's not actually saving anyone time.

---

## 3. Folder Rules

These summarize (not replace) the fuller folder responsibility table in `architecture-freeze-v1.md` §9.

| Folder | Responsibility | Belongs there | Must never go there |
|---|---|---|---|
| `app/` | Next.js routing convention (pages, layouts, route handlers) | Route handlers, layouts, page components | Business logic, direct provider/DB access |
| `components/` | Reusable, presentational UI | Design-system + feature UI | Backend imports, provider/DB access |
| `features/` | Vertical-specific frontend composition (shopping, food, travel...) | Feature-scoped UI + client data hooks | Backend/business logic |
| `server/` | HTTP-layer concerns only | Request context, envelopes, error mapping, middleware | Business logic, search/provider code |
| `services/` | Use-case orchestration | Cross-layer coordination, business rules | Framework-specific request/response handling |
| `search/` | Search pipeline (orchestrator, selection, execution, normalization, ranking, caching) | Search-domain logic only | HTTP concerns, direct DB writes outside its own cache tier |
| `providers/` | External integrations, one adapter per provider | Adapter + normalizer per provider | Business rules unrelated to a single provider's data shape |
| `shared/` | Framework-agnostic primitives (Result, Logger, types, constants, utils) | Code with zero dependency on any other layer | Anything that imports from Server/Search/Providers/Services |
| `hooks/` | Shared React state/behavior | `useX` hooks | Business logic belonging in a Service |
| `lib/` | Frontend-only helpers | `cn()`-style utilities | Server-only or backend-shared code (goes in `shared/`) |
| `utils/` (under `shared/`) | Framework-agnostic helpers | Date/string/math helpers with no business meaning | Business rules |
| `config/` | Environment configuration | Typed, validated env export | Business logic, direct `process.env` reads elsewhere |
| `middleware/` | Cross-cutting HTTP concerns | Auth, rate limiting, logging | Business logic, provider calls |
| `types/` | Shared TypeScript types | Cross-cutting type definitions | Implementation logic |
| `docs/` | Architecture and standards source of truth | Design documents, this standard | Implementation code |

---

## 4. Naming Conventions

| Category | Convention | Example |
|---|---|---|
| Files (modules/utilities) | `kebab-case.ts` | `error-mapper.ts`, `request-context.ts` |
| Folders | `kebab-case`, plural for collections | `providers/`, `services/` |
| React Components (files) | `kebab-case.tsx` | `ai-search.tsx` |
| React Components (exports) | `PascalCase`, matches file's purpose | `AiSearch` |
| Hooks | `camelCase`, prefixed `use` | `useMediaQuery`, `useRotatingValue` |
| Services | `kebab-case` folder + `PascalCase` class or `camelCase` function export | `search-service/` exporting `SearchService` or `performSearch()` |
| Interfaces | `PascalCase`, no `I` prefix | `RequestContext`, `ProviderAdapter` |
| Types | `PascalCase` | `Result<T, E>`, `Timestamp` |
| Enums / string unions | `PascalCase` name; members match the casing used in `database.md` (lowercase where the DB doc specifies lowercase wire values) | `active`, `inactive` |
| Constants | `SCREAMING_SNAKE_CASE` | `DEFAULT_CACHE_TTL_SECONDS` |
| Environment Variables | `SCREAMING_SNAKE_CASE`, prefixed by concern | `APP_VERSION`, `APP_BUILD`, `NODE_ENV` |
| API Routes | `kebab-case`, versioned, resource-plural where applicable | `/v1/search/saved`, `/v1/products/:id/offers` |
| Git Branches | `type/short-description` | `feature/sprint-6.1-api-foundation`, `fix/error-mapper-rename` |
| Git Commits | Conventional Commits | `feat(server): add request context`, `fix(search): correct cache key normalization` |

---

## 5. TypeScript Standards

- **Strict mode only.** No per-file or per-line loosening (`// @ts-ignore` is a last resort, never a first response).
- **No implicit `any`.** Every parameter, return value, and exported value has a resolvable type.
- **Prefer interfaces for object contracts.** Reserve type aliases for unions, tuples, mapped/utility types.
- **Prefer `readonly`** on properties and arrays that are not meant to be mutated after construction.
- **Avoid type assertions (`as`)** unless the alternative is genuinely more complex than the risk introduced; a type assertion is an unverified promise to the compiler.
- **Explicit return types on all exported functions.** Inferred return types are fine for private, unexported helpers only.
- **Shared types before duplicate types.** If a shape is used in more than one module, it belongs in `shared/types/`, not redefined locally.

---

## 6. React Standards

- **Functional components only.** No class components anywhere in the codebase.
- **Server Components by default.** Only opt into Client Components (`"use client"`) when interactivity, browser APIs, or hooks genuinely require it.
- **Keep components small and single-purpose.** A component that renders three unrelated concerns should be split.
- **Props are always typed**, using an explicit `Props` interface — no inline anonymous prop objects for anything beyond the most trivial component.
- **Avoid prop drilling** — prefer composition, context, or colocated state where drilling would exceed 2–3 levels.
- **Favor reusable UI components** in `components/ui/` over one-off inline JSX duplicated across features.

---

## 7. Next.js Standards

- **App Router only** — no legacy `pages/` directory usage.
- **Route organization** follows the versioned convention in `architecture-freeze-v1.md` §2/§4 (`app/api/v1/<resource>/route.ts`).
- **Metadata** is defined per-route via the App Router `metadata` export, not injected manually into `<head>`.
- **Layouts** are used for shared chrome (nav, footers) — a page should not re-implement layout structure already provided by its parent layout.
- **Error pages (`error.tsx`)** and **loading pages (`loading.tsx`)** are defined at the route-segment level where a segment has meaningfully different failure/loading behavior — not globally faked with client-side spinners.
- **API routes** stay thin per `architecture-freeze-v1.md` §4 — parse request, build context, call one Service method, format response. No business logic in a route file.

---

## 8. Backend Standards

- **Thin route handlers.** A handler validates input, builds a `RequestContext`, calls exactly one Service method, and formats the response. Nothing else.
- **Controllers/handlers coordinate only** — they never decide business outcomes themselves.
- **Business logic belongs in Services**, never in route handlers, UI components, or provider adapters.
- **Middleware is reusable and composable** — auth, rate limiting, and logging are implemented once and applied declaratively, not copy-pasted per route.
- **Validation happens before business logic runs** — a request that fails validation never reaches a Service method.
- **No database queries inside route handlers.** All data access goes through Services (and, beneath them, the `db/` layer) per `architecture-freeze-v1.md` §10.

---

## 9. Error Handling Standards

- **Centralized error handling.** All domain errors are typed classes defined once in `server/errors/`, not ad hoc `throw new Error("...")` strings scattered through the codebase.
- **Error mapping.** `error-mapper.ts` is the single place that maps domain errors to HTTP status codes (`api.md` §0.5) — no route re-implements this mapping locally.
- **Result Pattern.** Services and Search-layer functions return `Result<T, E>` for *expected* failure modes (validation failure, provider timeout, not-found). Exceptions are reserved for genuinely unexpected failures, not normal control flow.
- **Logging.** All errors are logged through the shared Logger (`shared/logger/`) with correlation via `requestId`/`traceId` — never a bare `console.log`/`console.error`.
- **Never expose internal errors.** Stack traces, internal messages, and raw database errors never reach the API response — only the standard error envelope (`api.md` §0.4) with a safe `code`/`message`.
- **Consistent API responses.** Every error response uses the same envelope shape regardless of which layer raised the error.

---

## 10. Search Standards

Search-specific rules are fully specified in `search-engine.md` and `providers.md` and are not restated here. In summary, and by reference only:

- **Search Orchestrator** owns the request lifecycle and timeout budget — see `search-engine.md` §2.4.
- **Providers** implement one uniform adapter interface; adapters never know they're being orchestrated — see `providers.md` §1, §9.
- **Ranking** is a pure function of the normalized list plus request context — see `search-engine.md` §2.8.
- **Registry** filters providers by relevance/health before execution — see `search-engine.md` §2.5, `providers.md` §7.
- **Pipeline** composition (Selection → Execution → Normalization → Ranking → Caching) is fixed and documented — see `search-engine.md` §1–§2.

Any change to search behavior is a change to `search-engine.md`/`providers.md` first, code second.

---

## 11. Import Rules

- **Prefer absolute imports** using the configured `@/*` path alias over relative `../../../` chains.
- **Avoid circular dependencies** — if module A imports from module B and B needs something from A, that shared thing belongs in `shared/`, not duplicated or circularly referenced.
- **Shared modules never depend on Features, Services, Search, Providers, or Server.** Dependencies only flow *into* Shared, never out of it (`architecture-freeze-v1.md` §3.6, §10.2).
- **UI/Features never import backend modules directly** (`src/server`, `src/search`, `src/providers`, `src/db`). All backend access goes through the HTTP API.
- **Route handlers never import Search or Providers directly** — always through a Service.

---

## 12. Code Review Checklist

Every pull request should be checked against:

- [ ] **Naming** — follows §4 conventions consistently.
- [ ] **Types** — no unjustified `any`, exported functions have explicit return types, shared shapes reused rather than duplicated.
- [ ] **Architecture** — respects the layer and dependency rules in `architecture-freeze-v1.md` §3/§10; nothing added to the wrong folder per §3 above.
- [ ] **Error handling** — uses the Result pattern / typed errors, no leaked internals, no swallowed errors.
- [ ] **Performance** — no obviously duplicated network/DB calls, no unnecessary re-renders introduced.
- [ ] **Security** — inputs validated, outputs sanitized, no secrets or credentials introduced (see §14).
- [ ] **Tests** — meaningful coverage for new business logic, especially Services and Search-layer pure functions.
- [ ] **Documentation** — new modules include the minimum documentation described in §16.
- [ ] **Readability** — a reviewer unfamiliar with this specific change can understand it without needing the author to explain it live.

---

## 13. Git Standards

- **Commit message format:** Conventional Commits — `type(scope): short description`, e.g. `feat(search): add provider selection filter`, `fix(server): correct error-mapper status codes`.
- **Branch naming:** `type/short-description`, e.g. `feature/sprint-6.1-api-foundation`, `fix/health-endpoint-uptime`.
- **Small commits.** Each commit represents one coherent, reviewable change — not a mix of unrelated fixes.
- **One feature per commit** (or per tightly-scoped PR) — avoid bundling unrelated work so review and rollback stay clean.
- **No direct commits to `main` without review.** Every change goes through a pull request and founder/lead review before merge, per the project's working process.

---

## 14. Security Guidelines

- **Never commit secrets.** API keys, credentials, and tokens live in environment variables or a secrets manager — never in source, never in `Providers.apiConfig` directly (`database.md` §7).
- **Validate all inputs** at the API boundary before they reach business logic (`api.md` §2.1 and per-endpoint validation rules).
- **Sanitize all outputs**, especially anything derived from user-submitted content (review bodies, display names) before storage or render.
- **Environment variables only** for configuration that varies by environment — nothing environment-specific is hardcoded.
- **Least privilege principle** — a module or credential has only the access it needs, nothing broader "just in case."
- **No sensitive logging.** Passwords, tokens, full card numbers, or other sensitive fields are never written to logs, even at debug level.

---

## 15. Performance Guidelines

- **Avoid unnecessary re-renders** — memoize expensive computations and components only where profiling shows a real cost, not reflexively.
- **Lazy loading** for below-the-fold or rarely-used UI and heavy client-only dependencies.
- **Code splitting** along route and feature boundaries so initial bundle size stays lean.
- **Memoization only when needed** — premature `useMemo`/`useCallback` everywhere adds complexity without proven benefit; see §2's "avoid premature optimization."
- **Efficient API calls** — batch where the API supports it (e.g. analytics event batching per `api.md` §9.1), avoid waterfall requests where parallel fetches are possible.
- **Avoid duplicate work** — cache and reuse computed results (e.g. the search-result cache in `search-engine.md` §2.9) rather than recomputing per request.

---

## 16. Documentation Rules

Every new module should include, at minimum:

- **Purpose** — one or two sentences on what the module is responsible for.
- **Dependencies** — what it relies on (and, implicitly, what layer it belongs to per the dependency rules).
- **Public API** — the functions/types/classes it exports for consumption elsewhere.
- **Usage** — a short example, if the module's usage isn't self-evident from its signature.

Documentation is kept concise — a few lines of JSDoc or a short module-level comment is preferred over a long prose essay. Documentation is versioned alongside the code it describes; when the code changes meaningfully, the documentation is updated in the same PR, not deferred.

---

## 17. Future AI Contributor Rules

This section governs how AI coding assistants (Claude, Cursor, GitHub Copilot, ChatGPT, Gemini, and any future tool) contribute to NexCart:

- **Never redesign approved architecture.** `architecture-freeze-v1.md` and the four Phase 5 documents are authoritative. A perceived improvement is a proposal, not a unilateral change.
- **Respect the Architecture Freeze.** Folder structure, layering, and dependency direction are fixed unless an explicit, approved architectural review changes them.
- **Small, sprint-based changes only.** Work is scoped to the current sprint's explicit objective; work outside that scope is flagged, not silently done "while I'm in there."
- **No unnecessary dependencies.** A new library is justified explicitly before it's introduced — it is never added as a shortcut around writing a small amount of code.
- **Explain architectural conflicts before changing them.** If a request would contradict an existing document or this standard, the AI states the conflict, its impact, and proposes options — then waits for approval.
- **Preserve backward compatibility whenever possible.** Additive changes are preferred; breaking changes are deliberate, flagged, and versioned (`api.md` §0.1).
- **Prefer modifying existing modules over creating duplicate ones.** Before adding a new utility, type, or service, check whether one already exists that should be reused or extended instead.

---

## 18. Version Information

| Field | Value |
|---|---|
| Version | 1.0 |
| Status | Active |
| Owner | Engineering (CTO / Product Architect function) |
| Last Updated | 2026-07-13 |

---

*End of Engineering Standards v1.0. This document complements, and does not duplicate, `architecture-freeze-v1.md`, `database.md`, `api.md`, `search-engine.md`, and `providers.md`. Future revisions require an explicit version bump and a stated reason.*
