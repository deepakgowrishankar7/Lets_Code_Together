Issue: `spring.jpa.open-in-view` not explicitly set

Description:
- Open-in-view was enabled by default, which can cause lazy-loading during view rendering.

Files:
- [src/main/resources/application.properties](src/main/resources/application.properties)

Recommended fix:
- Set `spring.jpa.open-in-view=false` for safer behavior. (Already set.)
