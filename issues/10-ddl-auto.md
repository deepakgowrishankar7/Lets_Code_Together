Issue: `spring.jpa.hibernate.ddl-auto=none` may be unexpected for development

Description:
- The setting disables schema auto-update; useful in production but inconvenient for local dev.

Files:
- [src/main/resources/application.properties](src/main/resources/application.properties)

Recommended fix:
- For development, consider `update` or use a migration tool (Flyway/Liquibase) for schema management.
