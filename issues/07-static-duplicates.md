Issue: Duplicated blocks and potential broken links in static resources

Description:
- `static/main.html` contains duplicated sections and possibly broken image/pdf links.

Files:
- [src/main/resources/static/main.html](src/main/resources/static/main.html)

Recommended fix:
- Clean up duplicates and verify resource paths (image/, pdfs/). Consider serving large assets via CDN.
