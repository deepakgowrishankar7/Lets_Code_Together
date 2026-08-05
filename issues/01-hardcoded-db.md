Issue: Hardcoded DB credentials

Description:
- `application.properties` contained plaintext DB username/password which is unsafe.

Files:
- [src/main/resources/application.properties](src/main/resources/application.properties)

Recommended fix:
- Use environment variables or externalized config. (Already changed to `DB_USER`/`DB_PASS` placeholders.)
