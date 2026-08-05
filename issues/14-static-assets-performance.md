Issue: Large static assets may impact performance

Description:
- PDFs, images, and many static pages are shipped with the app.

Files:
- [src/main/resources/static/pdfs](src/main/resources/static/pdfs)
- [src/main/resources/static/image](src/main/resources/static/image)

Recommended fix:
- Use optimized images, lazy loading, or a CDN for static content.
