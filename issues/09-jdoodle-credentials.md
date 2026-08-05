Issue: Missing JDoodle credentials

Description:
- JDoodle client id/secret may be missing; `CompileController` returns an error when credentials are not configured.

Files:
- [src/main/java/com/deepak/codetogether/controller/CompileController.java](src/main/java/com/deepak/codetogether/controller/CompileController.java)
- [src/main/resources/application.properties](src/main/resources/application.properties)

Recommended fix:
- Document environment variables `jdoodle.client-id` and `jdoodle.client-secret` and avoid committing secrets.
