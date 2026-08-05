Issue: Minimal test coverage

Description:
- The project contains only one basic test; critical services lack unit/integration tests.

Files:
- [src/test/java/com/deepak/codetogether/CodetogetherApplicationTests.java](src/test/java/com/deepak/codetogether/CodetogetherApplicationTests.java)

Recommended fix:
- Add unit tests for `AuthService`, `MailService`, `CompileController`, and repository tests with an in-memory DB.
