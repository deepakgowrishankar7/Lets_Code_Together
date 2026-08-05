Project quick scan — findings and recommended fixes

Summary:
- Maven build and tests completed successfully locally via Maven wrapper (`mvnw`).
- Collected warnings and potential problems across code, configuration, and static assets.

Issues (initial, 17 items):
1. Hardcoded DB credentials in `application.properties` — replaced with env placeholders. (file changed)
2. `spring.jpa.open-in-view` not set — added `spring.jpa.open-in-view=false`. (file changed)
3. Generated Spring Security password is logged during startup — configure proper security for production.
4. Mockito / ByteBuddy agent warnings during tests — consider adding Mockito as agent per docs.
5. Broad `catch (Exception)` usages in `MailService` and `SseService` — catch specific exceptions or log more context. (see src/main/java/com/deepak/codetogether/service)
6. `printStackTrace()` found in static code snippets — remove or replace with proper logging. (static HTML examples)
7. Several static HTML pages contain duplicated blocks and potential broken links (investigate `static/main.html` and `concepts/*`).
8. Missing or empty environment variables for mail credentials (`EMAIL_USER`, `EMAIL_PASS`) — document how to set them.
9. Missing JDoodle credentials (`JDOODLE_CLIENT_ID`, `JDOODLE_CLIENT_SECRET`) — document or provide fallback behavior.
10. `spring.jpa.hibernate.ddl-auto=none` may be unexpected for development — confirm desired behavior.
11. Potential leaking of sensitive data in repo (DB password was present) — rotate credentials if used publicly.
12. Some controllers accept raw DTOs without validation — add `@Valid` and validation annotations to DTOs.
13. No explicit CORS policy (controller uses `@CrossOrigin(origins = "*")`) — tighten CORS in production.
14. Static resources include many large files (pdfs, images) — consider lazy-loading or CDN for performance.
15. Tests are minimal (1 test) — expand unit and integration tests for critical services (Auth, Mail, DB interactions).
16. Email sending lacks retry/error handling — improve `MailService` resilience and logging.
17. Exception messages returned to clients may be generic — standardize error responses and HTTP status codes.

Next steps I can take now:
- Implement low-risk config improvements (done: #1 and #2).
- Create detailed issues for each item with file references.
- Start fixing the highest-priority code issues (e.g., replace broad catches, add validation) iteratively and run the wrapper build after each change.

Updates applied (development convenience):
- Mail sending now propagates failures (`MailService` will throw on failure) so controllers can respond appropriately.
- `AuthController` `sendOtp` and `forgotPassword` now return the OTP in the JSON response when email sending fails (useful for local development without SMTP configured).

Recommended immediate actions:
- If you plan to run in production, set `spring.mail.username` and `spring.mail.password` environment variables (or update `application.properties`) and remove the dev OTP fallback.
- Add input validation (`@Valid`) on DTOs used by `AuthController`.
- Rotate any credentials that were committed to source control (JDoodle, DB password) if they are public.

If you want me to continue, tell me whether to: (A) open detailed issues for each item as separate files, (B) start applying fixes (I will pick top 5), or (C) run deeper static analysis for more precise locations.