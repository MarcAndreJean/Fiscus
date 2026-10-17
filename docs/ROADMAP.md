# Roadmap and possible improvements

Fiscus is intentionally small: a personal, single-owner MVP (minimum viable product) built for fast iterations (see "Why it is built this way" in the [README](../README.md)). Nothing below is needed for that use. These are the improvements that would make sense if the project grows, roughly in order of value, with how each would be done.

## Security and multiple users

**Real user accounts instead of an API key plus a typed user id.**
Today the API key grants access to every record in the stack and the user id sent by the app is only a filter.
- Add an Amazon Cognito user pool and a Cognito authorizer on the API (in `template.yaml` and `openapi.yaml`).
- Read the user id from the token's claims in each handler instead of from the request (one helper in the `fiscus` layer).
- Keep API keys only for throttling, or drop them.

**Owned entities instead of hand-typed ids.**
Businesses, cars and houses are free-text ids in the app settings.
- Add an `Owners` table (id, userId, kind, name) with create/read/update routes.
- Add a settings screen to manage the ids, and validate `businessId`/`carId`/`houseId` against it on every write.

## Backend

| Improvement | How |
| --- | --- |
| Query instead of scan | Lists and reports scan whole tables with filters. Switch the read handlers to `Query` on the existing GSIs (`userId-invoiceDate-index`, `carId-invoiceDate-index`, `houseId-invoiceDate-index`), with a `scan_all`-style paginating helper for queries. |
| Real HTTP status codes | API Gateway uses non-proxy integrations and always answers 200, with the status in the body. Move to Lambda proxy integrations and return the status code directly, then simplify `unwrap()` in `mobile-app/lib/api/client.ts`. This needs the app and the API updated together. |
| Attachments as native lists | `images`, `files` and income `items` are stored as JSON text. Store them as DynamoDB lists and migrate existing items once with a script. |
| Direct uploads to S3 | Files go through API Gateway as base64 (about 33% larger and capped by the API's 10 MB payload limit). Return presigned `PUT` URLs from the API and upload straight to S3. |
| Clean up detached files | Removing an attachment only detaches it. Delete the S3 object on update, or tag uploads and add a lifecycle rule for objects that no record references. |
| Archive for travel logs and misc files | Their deletes are permanent. Add archive tables like the ones for expenses and incomes, using `archive_and_delete` from the `fiscus` layer. |
| Observability | Handlers log errors to CloudWatch. Add CloudWatch alarms on Lambda errors and API 5xx counts, and structured (JSON) logs. |
| Shared API types | Request models are written twice (Python handlers and TypeScript types). Make `openapi.yaml` complete and generate the TypeScript types from it. |

## Mobile app

| Improvement | How |
| --- | --- |
| Month filter | The API already accepts `month`. Add a month dropdown next to the year filter (`lib/ui/components/shared/ListFilters.tsx`) and pass it to the list hooks. |
| Screen tests | Logic is covered by jest; screens are not. Add React Native Testing Library and test the forms and delete flows. |
| French translation | All strings go through `Locales`. Add `lib/locales/fr.ts` and pick the language from `expo-localization`. |
| Dependency upkeep | Apply Expo patch updates with `npx expo install --fix`, and migrate ESLint to the flat config format when moving past ESLint 8. |
| CI on GitHub | Optional: the workflows kept in `mobile-app/.github/` can be moved to `/.github/workflows/` (see its README). |

## Features

- **Receipt scanning.** Read amounts and dates from a receipt photo with Amazon Textract (`AnalyzeExpense`) and prefill the expense form.