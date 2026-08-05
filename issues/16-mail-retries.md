Issue: Email sending lacks retry/error handling

Description:
- `MailService` attempts a single send and throws on failure.

Files:
- [src/main/java/com/deepak/codetogether/service/MailService.java](src/main/java/com/deepak/codetogether/service/MailService.java)

Recommended fix:
- Add retries with backoff for transient SMTP errors and better logging/metrics.
