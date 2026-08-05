# Stage 1: Build JAR using Maven
FROM maven:3.9.6-eclipse-temurin-21 AS build
WORKDIR /app
COPY pom.xml .
COPY src ./src
RUN mvn clean package -DskipTests

# Stage 2: Run application
FROM eclipse-temurin:21-jre
WORKDIR /app
COPY --from=build /app/target/codetogether-0.0.1-SNAPSHOT.jar app.jar

ENV PORT=8081
EXPOSE 8081

ENTRYPOINT ["java", "-jar", "app.jar"]


