import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { defineConfig } from 'vite';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export default defineConfig(() => {
  return {
    base: './',
    plugins: [
      react(),
      tailwindcss(),
      // Copies static assets and game files into dist/ so relative URLs
      // resolve both on static GitHub Pages and in Vite production builds.
      {
        name: 'copy-static-arcade-assets',
        apply: 'build',
        closeBundle(error) {
          if (error) {
            return;
          }
          const distDir = path.resolve(__dirname, 'dist');
          if (!fs.existsSync(distDir)) return;

          const foldersToCopy = [
            ['src/assets', 'src/assets'],
            ['css', 'css'],
            ['games', 'games'],
          ];

          for (const [fromRel, toRel] of foldersToCopy) {
            const fromPath = path.resolve(__dirname, fromRel);
            const toPath = path.resolve(distDir, toRel);
            if (fs.existsSync(fromPath)) {
              fs.cpSync(fromPath, toPath, { recursive: true, force: true });
            }
          }

          const gamesJsonFrom = path.resolve(__dirname, 'games.json');
          const gamesJsonTo = path.resolve(distDir, 'games.json');
          if (fs.existsSync(gamesJsonFrom)) {
            fs.copyFileSync(gamesJsonFrom, gamesJsonTo);
          }

          const nojekyllFrom = path.resolve(__dirname, '.nojekyll');
          const nojekyllTo = path.resolve(distDir, '.nojekyll');
          if (fs.existsSync(nojekyllFrom)) {
            fs.copyFileSync(nojekyllFrom, nojekyllTo);
          }
        },
      },
    ],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      },
    },
    server: {
      hmr: process.env.DISABLE_HMR !== 'true',
      watch: process.env.DISABLE_HMR === 'true' ? null : {},
    },
  };
});
