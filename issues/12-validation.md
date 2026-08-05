Issue: Controllers accept DTOs without validation

Description:
- Several controllers accepted raw DTOs without `@Valid` and DTOs lacked constraint annotations.

Files:
- [src/main/java/com/deepak/codetogether/controller/AuthController.java](src/main/java/com/deepak/codetogether/controller/AuthController.java)
- DTOs under [src/main/java/com/deepak/codetogether/dto/](src/main/java/com/deepak/codetogether/dto/)

Recommended fix:
- Add `@Valid` on controller `@RequestBody` parameters and add constraint annotations to DTO fields. (Partially implemented.)
