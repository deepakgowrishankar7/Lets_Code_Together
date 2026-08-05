Issue: Missing/empty email env vars

Description:
- `spring.mail.username` and `spring.mail.password` are required for SMTP but may be empty.

Files:
- [src/main/resources/application.properties](src/main/resources/application.properties)

Recommended fix:
- Document required env vars and provide a local `.env` or example config. Do not commit real credentials.
