Issue: Generated Spring Security password logged on startup

Description:
- Default security configuration prints a generated password; production must configure security properly.

Files:
- [src/main/java/com/deepak/codetogether/config/SecurityConfig.java](src/main/java/com/deepak/codetogether/config/SecurityConfig.java)

Recommended fix:
- Replace default security with proper authentication (JWT or OAuth) and configure users/roles.
