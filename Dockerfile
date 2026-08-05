FROM eclipse-temurin:25-jre

WORKDIR /app
ARG JAR_FILE=target/codetogether-0.0.1-SNAPSHOT.jar
COPY ${JAR_FILE} app.jar

ENV PORT=8081
EXPOSE 8081

ENTRYPOINT ["java", "-jar", "app.jar"]

