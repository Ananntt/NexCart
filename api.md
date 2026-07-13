# NexCart (BuyWise) — REST API Architecture

**Phase:** 5.2 — API Architecture Design
**Status:** Design only. No backend/route handlers implemented.
**Depends on:** `docs/database.md` (Phase 5.1)
**Base URL (design-time placeholder):** `https://api.nexcart.app/v1`

---

## 0. Global Conventions

These apply to every endpoint below unless explicitly overridden.

### 0.1 Versioning
All routes are prefixed `/v1`. Breaking changes ship as `/v2`; additive changes (new optional fields) do not bump version.

### 0.2 Authentication scheme
- Bearer JWT access token in `Authorization: Bearer <token>` header.
- Access token TTL: 15 minutes. Refresh token TTL: 30 days, rotated on use, stored as `Sessions.refreshTokenHash`.
- Three auth levels used throughout this doc:
  - **Public** — no token required.
  - **Optional** — works without a token (as anonymous/`sessionId`-scoped), but personalizes if a valid token is present.
  - **Required** — request rejected with `401` if missing/invalid.
  - **Admin** — Required + `role: admin` on the Users record, else `403`.

### 0.3 Standard success envelope
```json
{
  "success": true,
  "data": { },
  "meta": { "page": 1, "limit": 20, "total": 134 }
}
```
`meta` is present only on paginated list endpoints.

### 0.4 Standard error envelope
```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Human-readable summary",
    "details": [ { "field": "email", "issue": "must be a valid email address" } ]
  }
}
```

### 0.5 Common status codes (used across all endpoints)
| Code | Meaning |
|---|---|
| 200 | Success (read/update) |
| 201 | Resource created |
| 204 | Success, no body (e.g. delete) |
| 400 | Validation error |
| 401 | Missing/invalid/expired auth token |
| 403 | Authenticated but not authorized for this resource |
| 404 | Resource not found |
| 409 | Conflict (duplicate resource, e.g. email already registered) |
| 422 | Semantically invalid (e.g. `maxPrice < minPrice`) |
| 429 | Rate limit exceeded |
| 500 | Internal server error |

### 0.6 Rate limiting — general policy
Rate limits are enforced per `userId` (if authenticated) else per `IP + sessionId`. Limits below are **per-endpoint suggestions**; a global fallback of **300 requests / 5 min** per identity applies to any route not explicitly listed. All `429` responses include a `Retry-After` header (seconds).

### 0.7 Pagination convention
List endpoints accept `?page=1&limit=20` (default `limit=20`, max `limit=100`). Response includes `meta.total` for client-side page calculation.

---

## 1. Authentication

### 1.1 Register
- **Method / Route:** `POST /v1/auth/register`
- **Auth:** Public
- **Request Body:**
```json
{ "email": "anant@example.com", "password": "MinLength8Chars!", "displayName": "Anant" }
```
- **Validation Rules:**
  - `email`: required, valid RFC 5322 format, max 255 chars, normalized lowercase.
  - `password`: required, min 8 chars, must include 1 letter + 1 number.
  - `displayName`: required, 2–50 chars, sanitized (no HTML).
- **Response (201):**
```json
{ "success": true, "data": { "userId": "665...", "email": "anant@example.com", "emailVerified": false } }
```
- **Status Codes:** `201` created · `400` validation error · `409` email already registered
- **Error Responses:** `409 EMAIL_TAKEN`, `400 VALIDATION_ERROR`
- **Rate Limiting:** 5 requests / hour per IP (abuse/bot signup prevention)

### 1.2 Login
- **Method / Route:** `POST /v1/auth/login`
- **Auth:** Public
- **Request Body:** `{ "email": "...", "password": "..." }`
- **Validation Rules:** both fields required; no format leakage in error (don't reveal which of email/password was wrong)
- **Response (200):**
```json
{ "success": true, "data": { "accessToken": "...", "refreshToken": "...", "expiresIn": 900 } }
```
- **Status Codes:** `200` · `400` validation · `401` invalid credentials · `403` account suspended
- **Error Responses:** `401 INVALID_CREDENTIALS`, `403 ACCOUNT_SUSPENDED`
- **Rate Limiting:** 10 requests / 15 min per IP **and** per email (progressive backoff + CAPTCHA after 5 failures, mitigates credential stuffing)

### 1.3 OAuth login (Google / GitHub)
- **Method / Route:** `POST /v1/auth/oauth/:provider`
- **Auth:** Public
- **Request Body:** `{ "idToken": "<oauth-provider-token>" }`
- **Validation Rules:** `provider` must be one of `google`, `github`; `idToken` verified server-side against provider's public keys.
- **Response (200):** same shape as Login. Creates a `Users` record on first login (`authProvider` set accordingly).
- **Status Codes:** `200` · `400` invalid provider · `401` invalid/expired idToken
- **Rate Limiting:** 20 requests / 15 min per IP

### 1.4 Refresh token
- **Method / Route:** `POST /v1/auth/refresh`
- **Auth:** Required (refresh token, not access token, sent in body or httpOnly cookie)
- **Request Body:** `{ "refreshToken": "..." }`
- **Validation Rules:** token must match a non-expired `Sessions.refreshTokenHash`; rotates token on every use (old one invalidated immediately — reuse of a rotated token revokes the whole session as a compromise signal).
- **Response (200):** `{ "accessToken": "...", "refreshToken": "...", "expiresIn": 900 }`
- **Status Codes:** `200` · `401` invalid/expired/reused token
- **Rate Limiting:** 60 requests / hour per session

### 1.5 Logout
- **Method / Route:** `POST /v1/auth/logout`
- **Auth:** Required
- **Request Body:** none (uses current session from token)
- **Response:** `204 No Content` — invalidates the `Sessions` record.
- **Status Codes:** `204` · `401`
- **Rate Limiting:** 20 requests / hour

### 1.6 Forgot / reset password
- **Method / Route:** `POST /v1/auth/forgot-password` → `{ "email": "..." }` → `200` (always returns success shape regardless of whether email exists, to avoid user enumeration)
- **Method / Route:** `POST /v1/auth/reset-password` → `{ "token": "...", "newPassword": "..." }` → `200` or `400 INVALID_OR_EXPIRED_TOKEN`
- **Rate Limiting:** 5 requests / hour per email + per IP

### 1.7 Get current session
- **Method / Route:** `GET /v1/auth/session`
- **Auth:** Required
- **Response (200):** `{ "userId": "...", "email": "...", "role": "user", "emailVerified": true }`
- **Status Codes:** `200` · `401`
- **Rate Limiting:** 120 requests / 5 min

---

## 2. Search

### 2.1 Search products
- **Method / Route:** `GET /v1/search`
- **Auth:** Optional (personalizes ranking if authenticated; logs to `SearchHistory` either way against `userId` or `sessionId`)
- **Query Params:** `q` (string, required), `category` (slug), `minPrice`, `maxPrice`, `providers` (comma-separated provider slugs), `sort` (`relevance` \| `price_asc` \| `price_desc` \| `rating`), `page`, `limit`
- **Validation Rules:**
  - `q`: required, 1–200 chars, trimmed, HTML-stripped.
  - `minPrice`/`maxPrice`: numeric ≥ 0; `422` if `minPrice > maxPrice`.
  - `sort`: must be one of the enumerated values, else `400`.
- **Response (200):**
```json
{
  "success": true,
  "data": [
    { "productId": "...", "title": "...", "lowestPrice": 18999, "providerCount": 4, "thumbnail": "..." }
  ],
  "meta": { "page": 1, "limit": 20, "total": 214 }
}
```
- **Status Codes:** `200` · `400` validation · `422` invalid range
- **Error Responses:** `400 VALIDATION_ERROR`, `422 INVALID_PRICE_RANGE`
- **Rate Limiting:** 60 requests / min per identity (search-as-you-type friendly, but capped against scraping)

### 2.2 Autocomplete / suggestions
- **Method / Route:** `GET /v1/search/suggestions?q=...`
- **Auth:** Optional
- **Validation Rules:** `q` required, 1–100 chars; returns empty array (not an error) for `q` under 2 chars.
- **Response (200):** `{ "data": ["iphone 15", "iphone 15 pro", "iphone 15 case"] }`
- **Status Codes:** `200` · `400`
- **Rate Limiting:** 120 requests / min per identity (needs to feel instant while typing)

### 2.3 Trending searches
- **Method / Route:** `GET /v1/search/trending`
- **Auth:** Public
- **Response (200):** `{ "data": [ { "query": "diwali offers", "count": 5420 } ] }` — cached, refreshed every 15 min server-side
- **Status Codes:** `200`
- **Rate Limiting:** 30 requests / min (heavily cached, cheap to serve)

### 2.4 Saved searches — list
- **Method / Route:** `GET /v1/search/saved`
- **Auth:** Required
- **Response (200):** paginated list of the user's `SavedSearches`
- **Rate Limiting:** 60 requests / min

### 2.5 Saved searches — create
- **Method / Route:** `POST /v1/search/saved`
- **Auth:** Required
- **Request Body:**
```json
{ "name": "XM5 under 20k", "query": "sony wh-1000xm5", "filters": { "maxPrice": 20000 }, "alertEnabled": true, "alertFrequency": "instant" }
```
- **Validation Rules:** `name` 1–80 chars; `query` required; `alertFrequency` ∈ {`instant`,`daily`,`weekly`}; duplicate `(userId, query, filters)` → `409`.
- **Response (201):** created SavedSearch document
- **Status Codes:** `201` · `400` · `409 DUPLICATE_SAVED_SEARCH`
- **Rate Limiting:** 20 requests / hour (prevents alert-spam setups)

### 2.6 Saved searches — update / delete
- **Method / Route:** `PATCH /v1/search/saved/:id`, `DELETE /v1/search/saved/:id`
- **Auth:** Required (must own the resource — ownership check against `userId`, else `403`)
- **Status Codes:** `200` (update) · `204` (delete) · `403` not owner · `404` not found
- **Rate Limiting:** 30 requests / hour

---

## 3. Products

### 3.1 List / browse products
- **Method / Route:** `GET /v1/products`
- **Auth:** Public
- **Query Params:** `category`, `brand`, `minPrice`, `maxPrice`, `sort`, `page`, `limit`
- **Validation Rules:** same numeric/enum rules as Search §2.1
- **Response (200):** paginated array of product summaries
- **Status Codes:** `200` · `400` · `422`
- **Rate Limiting:** 100 requests / min

### 3.2 Get product detail
- **Method / Route:** `GET /v1/products/:id`
- **Auth:** Public
- **Validation Rules:** `:id` must be a valid ObjectId format, else `400`
- **Response (200):** full `Products` document + denormalized `lowestCurrentPrice`, `avgRating`
- **Status Codes:** `200` · `400 INVALID_ID_FORMAT` · `404 PRODUCT_NOT_FOUND`
- **Rate Limiting:** 200 requests / min (product detail is the highest-traffic read path — generously cached at CDN/edge layer)

### 3.3 Get offers for a product
- **Method / Route:** `GET /v1/products/:id/offers`
- **Auth:** Public
- **Query Params:** `sort` (`price_asc` default), `providers` (filter)
- **Response (200):** array of active `Offers` joined with `Providers` (name, logo)
- **Status Codes:** `200` · `404`
- **Rate Limiting:** 150 requests / min

### 3.4 Get price history for a product
- **Method / Route:** `GET /v1/products/:id/price-history`
- **Auth:** Public
- **Query Params:** `providerId` (optional filter), `range` (`30d` \| `90d` \| `1y`, default `90d`)
- **Validation Rules:** `range` must be an enumerated value, else `400`
- **Response (200):** time-series array `[{ recordedAt, price, providerId }]`, downsampled server-side for `1y` range to keep payload small
- **Status Codes:** `200` · `400` · `404`
- **Rate Limiting:** 60 requests / min (chart rendering, not a hot path)

### 3.5 Get reviews for a product
- **Method / Route:** `GET /v1/products/:id/reviews`
- **Auth:** Public
- **Query Params:** `page`, `limit`, `sort` (`recent` \| `helpful` \| `rating_high` \| `rating_low`)
- **Response (200):** paginated approved reviews only (`status: approved`)
- **Status Codes:** `200` · `404`
- **Rate Limiting:** 100 requests / min

### 3.6 Submit a review
- **Method / Route:** `POST /v1/products/:id/reviews`
- **Auth:** Required
- **Request Body:** `{ "rating": 4, "title": "Solid pick", "body": "...", "images": ["..."] }`
- **Validation Rules:**
  - `rating`: required, integer 1–5.
  - `body`: required, 10–2000 chars, profanity/HTML sanitized.
  - `images`: optional, max 5 URLs, each pre-validated by an upload endpoint (not covered here).
  - One review per `(userId, productId)` — duplicate attempt → `409`.
- **Response (201):** created Review, `status: pending` (queued for moderation before public display)
- **Status Codes:** `201` · `400` · `404` product not found · `409 DUPLICATE_REVIEW`
- **Rate Limiting:** 10 requests / day per user (abuse/spam-review prevention)

### 3.7 Categories
- **Method / Route:** `GET /v1/categories` (tree or flat via `?flat=true`), `GET /v1/categories/:slug`
- **Auth:** Public
- **Response (200):** category tree / single category with `path`
- **Status Codes:** `200` · `404`
- **Rate Limiting:** 200 requests / min (near-static, CDN-cacheable)

### 3.8 Brands
- **Method / Route:** `GET /v1/brands`, `GET /v1/brands/:slug`
- **Auth:** Public
- **Status Codes:** `200` · `404`
- **Rate Limiting:** 200 requests / min

---

## 4. Providers

### 4.1 List providers
- **Method / Route:** `GET /v1/providers`
- **Auth:** Public
- **Query Params:** `type` (`ecommerce` \| `quick_commerce` \| `food_delivery` \| `travel` \| `other`)
- **Response (200):** array of active providers (name, logo, type) — `apiConfig` never exposed
- **Status Codes:** `200` · `400` invalid type
- **Rate Limiting:** 200 requests / min

### 4.2 Get provider detail
- **Method / Route:** `GET /v1/providers/:id`
- **Auth:** Public
- **Response (200):** public provider fields only
- **Status Codes:** `200` · `404`
- **Rate Limiting:** 200 requests / min

### 4.3 Provider sync status (internal ops visibility)
- **Method / Route:** `GET /v1/providers/:id/sync-status`
- **Auth:** Admin
- **Response (200):** `{ "syncStatus": "active", "lastSyncedAt": "...", "activeOfferCount": 12043 }`
- **Status Codes:** `200` · `403` · `404`
- **Rate Limiting:** 60 requests / min (admin dashboard, low volume)

---

## 5. Favorites

### 5.1 List favorites
- **Method / Route:** `GET /v1/favorites`
- **Auth:** Required
- **Query Params:** `page`, `limit`
- **Response (200):** paginated list joined with current `Product` summary + `priceAtSave` for delta display
- **Status Codes:** `200` · `401`
- **Rate Limiting:** 100 requests / min

### 5.2 Add favorite
- **Method / Route:** `POST /v1/favorites`
- **Auth:** Required
- **Request Body:** `{ "productId": "665...", "notes": "for birthday gift" }`
- **Validation Rules:** `productId` required, must exist and be `status: active`; duplicate `(userId, productId)` → `409` (idempotent-friendly: client can treat 409 as success)
- **Response (201):** created Favorite (with `priceAtSave` snapshotted server-side from current `lowestCurrentPrice`)
- **Status Codes:** `201` · `400` · `404 PRODUCT_NOT_FOUND` · `409 ALREADY_FAVORITED`
- **Rate Limiting:** 60 requests / min

### 5.3 Remove favorite
- **Method / Route:** `DELETE /v1/favorites/:productId`
- **Auth:** Required
- **Response:** `204 No Content`
- **Status Codes:** `204` · `401` · `404 NOT_FAVORITED`
- **Rate Limiting:** 60 requests / min

---

## 6. History

### 6.1 List search history
- **Method / Route:** `GET /v1/history/search`
- **Auth:** Required
- **Query Params:** `page`, `limit`
- **Response (200):** paginated `SearchHistory` entries for the authenticated user
- **Status Codes:** `200` · `401`
- **Rate Limiting:** 60 requests / min

### 6.2 Delete a single history entry
- **Method / Route:** `DELETE /v1/history/search/:id`
- **Auth:** Required (ownership check)
- **Status Codes:** `204` · `403` not owner · `404`
- **Rate Limiting:** 30 requests / min

### 6.3 Clear all search history
- **Method / Route:** `DELETE /v1/history/search`
- **Auth:** Required
- **Response:** `204 No Content` — deletes all `SearchHistory` rows for `userId`
- **Status Codes:** `204` · `401`
- **Rate Limiting:** 5 requests / hour (destructive, bulk operation)

---

## 7. Profile

### 7.1 Get profile
- **Method / Route:** `GET /v1/profile`
- **Auth:** Required
- **Response (200):** merged `Users` (safe fields only — no `passwordHash`) + `Profiles` document
- **Status Codes:** `200` · `401`
- **Rate Limiting:** 60 requests / min

### 7.2 Update profile
- **Method / Route:** `PATCH /v1/profile`
- **Auth:** Required
- **Request Body:** partial `{ "displayName": "...", "avatarUrl": "...", "phone": "...", "preferences": { "currency": "INR", "notifyOnPriceDrop": true } }`
- **Validation Rules:**
  - `displayName`: 2–50 chars if present.
  - `phone`: E.164 format if present.
  - Unknown/extra fields rejected (`400`) — strict schema, prevents mass-assignment into protected fields like `role`.
- **Response (200):** updated Profile
- **Status Codes:** `200` · `400` · `401`
- **Rate Limiting:** 20 requests / hour

### 7.3 Add address
- **Method / Route:** `POST /v1/profile/addresses`
- **Auth:** Required
- **Request Body:** `{ "label": "Home", "line1": "...", "city": "Gwalior", "state": "MP", "pincode": "474001", "country": "IN", "isDefault": true }`
- **Validation Rules:** `pincode` must match 6-digit Indian PIN format (or relevant country format); if `isDefault: true`, server unsets `isDefault` on all other addresses in the same transaction; max 10 addresses per user.
- **Response (201):** created address (embedded, returns full updated `addresses` array)
- **Status Codes:** `201` · `400` · `422` address limit reached
- **Rate Limiting:** 20 requests / hour

### 7.4 Update / delete address
- **Method / Route:** `PATCH /v1/profile/addresses/:addressId`, `DELETE /v1/profile/addresses/:addressId`
- **Auth:** Required
- **Status Codes:** `200` / `204` · `404` address not found in user's array
- **Rate Limiting:** 20 requests / hour

---

## 8. Notifications

### 8.1 List notifications
- **Method / Route:** `GET /v1/notifications`
- **Auth:** Required
- **Query Params:** `isRead` (filter), `page`, `limit`
- **Response (200):** paginated `Notifications`, newest first
- **Status Codes:** `200` · `401`
- **Rate Limiting:** 100 requests / min

### 8.2 Unread count
- **Method / Route:** `GET /v1/notifications/unread-count`
- **Auth:** Required
- **Response (200):** `{ "count": 7 }` — designed to be polled or used for a badge; cheap indexed count query
- **Status Codes:** `200` · `401`
- **Rate Limiting:** 120 requests / min (polling-friendly)

### 8.3 Mark one as read
- **Method / Route:** `PATCH /v1/notifications/:id/read`
- **Auth:** Required (ownership check)
- **Response (200):** updated notification
- **Status Codes:** `200` · `403` · `404`
- **Rate Limiting:** 60 requests / min

### 8.4 Mark all as read
- **Method / Route:** `PATCH /v1/notifications/read-all`
- **Auth:** Required
- **Response:** `204 No Content`
- **Status Codes:** `204` · `401`
- **Rate Limiting:** 10 requests / hour

### 8.5 Delete notification
- **Method / Route:** `DELETE /v1/notifications/:id`
- **Auth:** Required (ownership check)
- **Status Codes:** `204` · `403` · `404`
- **Rate Limiting:** 30 requests / min

---

## 9. Analytics

### 9.1 Ingest client event(s)
- **Method / Route:** `POST /v1/analytics/events`
- **Auth:** Optional (accepts anonymous `sessionId`-only events)
- **Request Body (batched — client should buffer and flush, not fire one request per click):**
```json
{
  "events": [
    { "eventType": "product_view", "entityType": "Product", "entityId": "665...", "metadata": { "source": "search_results" }, "clientTimestamp": "2026-07-12T10:15:00Z" }
  ]
}
```
- **Validation Rules:**
  - `events`: required array, max 50 per batch (larger batches rejected with `413`-style `422` to force client-side chunking).
  - `eventType`: must be one of the enumerated types in `Analytics Events` schema.
  - `metadata`: max 2KB serialized size per event, to prevent payload abuse.
  - Server stamps `createdAt`/`sessionId`/`userId` itself — `clientTimestamp` stored separately, never trusted for ordering.
- **Response (202):** `{ "accepted": 12 }` — accepted for async processing, not a full echo
- **Status Codes:** `202` · `400` · `422` batch too large
- **Error Responses:** `422 BATCH_LIMIT_EXCEEDED`
- **Rate Limiting:** 30 batch-requests / min per identity (each batch up to 50 events — effectively ~1500 events/min ceiling, tuned to real UI event volume, not scraping)

### 9.2 Dashboard aggregates (internal/admin)
- **Method / Route:** `GET /v1/analytics/dashboard`
- **Auth:** Admin
- **Query Params:** `range` (`7d` \| `30d` \| `90d`), `metric` (`views` \| `searches` \| `conversions`)
- **Response (200):** pre-aggregated time-bucketed series, served from a materialized rollup (not a live scan of raw `AnalyticsEvents`)
- **Status Codes:** `200` · `400` · `403`
- **Rate Limiting:** 30 requests / min (admin-only, low volume, but rollups are expensive if triggered live)

---

## 10. Cross-Cutting Security & Scalability Notes

- **Ownership checks are mandatory, not optional**, on every `Required`-auth endpoint that operates on a user-scoped resource (SavedSearches, Favorites, History, Notifications, Reviews-edit). Checking `role` alone is insufficient — always compare `resource.userId === req.userId` before mutating, or `403`.
- **Idempotency**: `POST /favorites` and `POST /search/saved` are designed so a duplicate call returns a deterministic `409` rather than creating a second row — safe for retry-on-timeout client logic.
- **Caching layer**: `GET /products/:id`, `/categories`, `/brands`, `/providers` are read-heavy and low-churn — strong candidates for CDN/edge caching (e.g. 60s TTL with stale-while-revalidate) rather than hitting MongoDB on every request.
- **Write amplification awareness**: `POST /analytics/events` and offer-price updates (background job, not a public endpoint) are the highest-write-volume paths — batching (as designed in §9.1) is required, not optional, to keep MongoDB write load sane at scale.
- **Sensitive field exclusion**: Every response touching `Users` or `Providers` must explicitly project out `passwordHash` / `apiConfig.credentialRef` — enforced via response serializer, not left to per-route discipline.
- **Consistent error codes**: All `code` values in error responses (e.g. `VALIDATION_ERROR`, `DUPLICATE_REVIEW`) should live in one shared enum/constants file across the API surface, so frontend error handling can switch on `error.code` rather than parsing `message` strings.
