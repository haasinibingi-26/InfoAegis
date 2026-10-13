import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import fs from 'node:fs';
import path from 'node:path';

export default defineConfig({
  plugins: [
    react(),
    {
      name: 'serve-contracts-fixtures',
      configureServer(server) {
        server.middlewares.use('/contracts/fixtures', (req, res, next) => {
          const rawUrl = (req.url || '/').split('?')[0];
          const cleanRel = rawUrl.replace(/^\/+/, '');
          const fixturesRoot = path.resolve(__dirname, '../contracts/fixtures');
          const candidates = [
            path.join(fixturesRoot, cleanRel),
            path.join(fixturesRoot, `${cleanRel}.json`),
          ];
          for (const candidate of candidates) {
            if (fs.existsSync(candidate) && fs.statSync(candidate).isFile()) {
              res.setHeader('Content-Type', 'application/json; charset=utf-8');
              res.end(fs.readFileSync(candidate, 'utf-8'));
              return;
            }
          }
          next();
        });
      },
    },
  ],
  server: {
    port: 5173,
  },
});
