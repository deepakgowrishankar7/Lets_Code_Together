@echo off
setlocal enabledelayedexpansion
set "SCRIPT_DIR=%~dp0"
if "%SCRIPT_DIR:~-1%"=="\" set "SCRIPT_DIR=%SCRIPT_DIR:~0,-1%"
set "WRAPPER_JAR=%SCRIPT_DIR%\.mvn\wrapper\maven-wrapper.jar"
if not exist "%WRAPPER_JAR%" (
  echo ERROR: Maven wrapper jar not found: %WRAPPER_JAR%
  exit /b 1
)
if defined JAVA_HOME (
  set "JAVACMD=%JAVA_HOME%\bin\java"
) else (
  set "JAVACMD=java"
)
set "MAVEN_PROJECTBASEDIR=%SCRIPT_DIR%"
"%JAVACMD%" -Dmaven.multiModuleProjectDirectory="%MAVEN_PROJECTBASEDIR%" -cp "%WRAPPER_JAR%" org.apache.maven.wrapper.MavenWrapperMain %*
endlocal
