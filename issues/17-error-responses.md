Issue: Inconsistent error responses returned to clients

Description:
- Controllers return different error structures; standardize API error responses.

Files:
- Various controllers under [src/main/java/com/deepak/codetogether/controller](src/main/java/com/deepak/codetogether/controller)

Recommended fix:
- Implement a `@ControllerAdvice` to standardize error payloads. (Added `GlobalExceptionHandler`.)
