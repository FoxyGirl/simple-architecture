import { spawn } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath, URL } from 'node:url';
import { defineConfig, type Plugin } from 'vite';
import react from '@vitejs/plugin-react';

const rootDir = path.dirname(fileURLToPath(import.meta.url));
const generatorPath = path.join(rootDir, 'scripts', 'generate-css-types.mjs');

/**
 * Keeps the generated CSS Module type declarations in sync while the dev
 * server runs, so a new or renamed class is typed the moment it is saved.
 */
const cssModuleTypes = (): Plugin => {
  let timer: ReturnType<typeof setTimeout> | undefined;

  const generate = () => {
    spawn(process.execPath, [generatorPath], { stdio: 'ignore' });
  };

  const schedule = () => {
    clearTimeout(timer);
    timer = setTimeout(generate, 100);
  };

  return {
    name: 'css-module-types',
    buildStart() {
      generate();
    },
    configureServer(server) {
      server.watcher.on('all', (_event, file) => {
        if (file.endsWith('.module.css')) schedule();
      });
    },
  };
};

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), cssModuleTypes()],
  resolve: {
    alias: {
      '@api': fileURLToPath(new URL('./src/api', import.meta.url)),
      '@hooks': fileURLToPath(new URL('./src/hooks', import.meta.url)),
    },
  },
});
