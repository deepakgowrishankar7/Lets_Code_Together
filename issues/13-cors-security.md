Issue: Wide-open CORS and permissive security for production

Description:
- `SecurityConfig` currently permits all requests and sets `allowedOrigins` to `*`.

Files:
- [src/main/java/com/deepak/codetogether/config/SecurityConfig.java](src/main/java/com/deepak/codetogether/config/SecurityConfig.java)

Recommended fix:
- Restrict CORS origins and tighten security rules before production deployment.
