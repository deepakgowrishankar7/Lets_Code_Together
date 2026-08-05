Issue: Sensitive data committed in repo

Description:
- Some credentials (JDoodle, DB password) appear in project files or server.js backup.

Files:
- `letscode/mybackend/server.js` (attachment)
- [src/main/resources/application.properties](src/main/resources/application.properties)

Recommended fix:
- Remove secrets from the repo, rotate compromised credentials, and use a secrets manager or env vars.
