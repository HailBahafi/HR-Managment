import path from 'node:path';
import { fileURLToPath } from 'node:url';

const projectDir = path.dirname(fileURLToPath(import.meta.url));

/**
 * Using the object (string-key) format so Turbopack loads @tailwindcss/postcss
 * and its native LightningCSS addon at runtime rather than bundling them.
 *
 * optimize:false — disables the LightningCSS → PostCSS re-parse step inside
 * @tailwindcss/postcss. In production Turbopack builds the bundled PostCSS
 * parser crashes on color-mix() inside nested @supports blocks that
 * LightningCSS produces. Skipping LightningCSS here is safe: Next.js runs its
 * own CSS minification/optimisation pass over the final output.
 */
const postcssConfig = {
  plugins: {
    '@tailwindcss/postcss': { base: projectDir, optimize: false },
  },
};

export default postcssConfig;
