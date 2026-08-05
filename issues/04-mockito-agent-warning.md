Issue: Mockito/ByteBuddy agent warnings during tests

Description:
- Tests show runtime warnings about Mockito inline mock maker and dynamic agent loading.

Files:
- test logs (build output)

Recommended fix:
- Configure Mockito as an agent in the build per Mockito docs, or update tests to avoid inline mocking that requires an agent.
