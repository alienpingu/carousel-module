/**
 * Development server using Bun.serve()
 * 
 * Usage: bun run server.ts
 *        bun server.ts
 */

const server = Bun.serve({
  port: 3000,
  async fetch(req) {
    const url = new URL(req.url);
    const path = url.pathname;

    // Serve static files from current directory
    let filePath = path === '/' ? '/example.html' : path;
    
    // Try to read the file
    try {
      const file = Bun.file(`.${filePath}`);
      const exists = await file.exists();
      
      if (!exists) {
        return new Response('Not Found', { status: 404 });
      }

      // Determine content type
      const ext = filePath.split('.').pop() || '';
      const contentTypes: Record<string, string> = {
        'html': 'text/html',
        'js': 'application/javascript',
        'ts': 'application/javascript',
        'css': 'text/css',
        'json': 'application/json',
        'map': 'application/json',
      };
      
      const contentType = contentTypes[ext] || 'text/plain';
      
      return new Response(file, {
        headers: {
          'Content-Type': contentType,
        },
      });
    } catch (error) {
      return new Response('Internal Server Error', { status: 500 });
    }
  },
});

console.log(`🚀 Server running at http://localhost:${server.port}/`);
console.log(`📁 Serving files from: ${process.cwd()}`);
