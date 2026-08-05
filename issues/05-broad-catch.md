Issue: Broad `catch (Exception)` usages

Description:
- Services like `MailService` and `SseService` had broad exception catches; prefer specific exceptions and proper logging/propagation.

Files:
- [src/main/java/com/deepak/codetogether/service/MailService.java](src/main/java/com/deepak/codetogether/service/MailService.java)
- [src/main/java/com/deepak/codetogether/service/SseService.java](src/main/java/com/deepak/codetogether/service/SseService.java)

Recommended fix:
- Catch specific exceptions or rethrow wrapped exceptions so controllers can decide.
