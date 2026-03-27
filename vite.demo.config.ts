import { defineConfig } from 'vite';
import { resolve } from 'path';
import { cpSync } from 'fs';

export default defineConfig({
  root: 'demo',
  build: {
    outDir: '../demo-dist',
    emptyOutDir: true,
  },
  plugins: [
    {
      name: 'copy-configs',
      closeBundle() {
        cpSync(
          resolve(__dirname, 'demo/configs'),
          resolve(__dirname, 'demo-dist/configs'),
          { recursive: true },
        );
      },
    },
    {
      name: 'watch-configs',
      configureServer(server) {
        const configsDir = resolve(__dirname, 'demo/configs');
        server.watcher.add(configsDir);
        server.watcher.on('change', (path) => {
          if (path.startsWith(configsDir) && path.endsWith('.json')) {
            server.ws.send({ type: 'full-reload' });
          }
        });
      },
    },
  ],
});
