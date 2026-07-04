---
name: ss-build-api
description: Use when a requirement describes new or changed REST endpoints and the OpenAPI contract needs to be created or updated before backend work starts. Reads the requirement, reconciles it against the repository's existing API definitions, and writes or updates OpenAPI 3.0.3 YAML files that follow the project's API and error-code conventions.
---

# Build API Contracts

Generate or update OpenAPI 3.0 interface definitions from a requirement document, keeping the repository's API contracts in sync with what the service needs to expose.

## Inputs

- A requirement document: a link your document-reading tool can fetch, a local file path, or plain text describing the feature. If none is given, ask the user for one before proceeding.
- The repository's existing OpenAPI definitions — look for an `api/`, `contracts/`, or similarly named directory, or any `*.yaml`/`*.yml` file containing an `openapi:` marker.
- The project's error-code conventions, if documented — check `../ss-guardrails/core.md` or a project-specific error-code reference before inventing new codes.

## Process

1. Read the requirement in full and extract every operation the service must expose: resource, HTTP verb, request/response shape, auth requirements, pagination, and error cases.
2. Locate and read existing OpenAPI files in the repository to learn its conventions — path naming, versioning scheme, shared `components/schemas`, security scheme, and how errors are modeled.
3. For each endpoint, design or update:
   - path, method, summary, and `operationId`
   - request parameters and body schema
   - response schemas for the success case and every error case, using the project's error-code conventions
   - shared schemas under `components/schemas` where an existing one fits, instead of duplicating structures
4. Write one OpenAPI 3.0.3 YAML file per service/domain (or update the existing file), matching the repository's current file layout and naming style.
5. Validate the result with whatever OpenAPI tooling the project already uses (`openapi-generator validate`, `spectral lint`, `swagger-cli validate`, or equivalent). If nothing is configured, at minimum check the document parses as valid OpenAPI 3.0.

## Output

- OpenAPI 3.0 YAML files under the repository's API contract directory, one file per service/domain, ready for backend implementation and frontend consumption.

## Failure Handling

- If the requirement doesn't specify enough detail to define a request/response shape or error case, stop and ask the user — never invent fields or guess at semantics.
- If validation fails, fix the YAML and re-validate before reporting the task complete.
- If the repository has no existing API contract directory or convention, ask the user where new contracts should live rather than guessing a layout.
