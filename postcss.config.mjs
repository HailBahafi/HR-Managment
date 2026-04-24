import path from 'node:path';
import { fileURLToPath } from 'node:url';

/** Always resolve Tailwind from this app folder (not process.cwd()), so opening the repo parent does not break resolution or spam rebuilds. */
const projectDir = path.dirname(fileURLToPath(import.meta.url));

export default {
  plugins: {
    '@tailwindcss/postcss': { base: projectDir },
  },
};
