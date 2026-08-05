# CodeTogether

Quick developer guide

Run locally (requires Java 25 and Maven):

```powershell
# start app
.\mvnw spring-boot:run

# start with local test endpoints (enables /api/test/create-user)
.\mvnw "-Dspring-boot.run.profiles=local" spring-boot:run

# run tests
.\mvnw clean test

# build a runnable jar
.\mvnw clean package -DskipTests
java -jar target\codetogether-0.0.1-SNAPSHOT.jar
```

Docker

```bash
# build image
docker build -t codetogether:latest .
# run (set real DB and mail env vars)
docker run -e JDBC_URL='jdbc:mysql://host:3306/db' -e JDBC_USERNAME=user -e JDBC_PASSWORD=pass -p 8080:8080 codetogether:latest
```

Notes

- Production properties template: `src/main/resources/application-prod.properties` — configure secrets via environment variables.
- Local-only test helper controller: `/api/test/create-user` (active when `local` Spring profile is used).
