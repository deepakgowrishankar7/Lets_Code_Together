# Stage 1: Build JAR using Maven
FROM maven:3.9.6-eclipse-temurin-21 AS build
WORKDIR /app
COPY pom.xml .
COPY src ./src
RUN mvn clean package -DskipTests

# Stage 2: Run application with full JDK (java + javac) and multi-language compilers
FROM eclipse-temurin:21-jdk
WORKDIR /app

# Install compilers & interpreters for online compiler execution (Python, C, C++, Node.js)
RUN apt-get update && apt-get install -y python3 python-is-python3 gcc g++ nodejs && rm -rf /var/lib/apt/lists/*

COPY --from=build /app/target/codetogether-0.0.1-SNAPSHOT.jar app.jar

ENV PORT=8081
EXPOSE 8081

ENTRYPOINT ["java", "-jar", "app.jar"]


