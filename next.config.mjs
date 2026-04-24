import path from 'node:path';
import { fileURLToPath } from 'node:url';

const appDir = path.dirname(fileURLToPath(import.meta.url));
const tailwindDir = path.join(appDir, 'node_modules', 'tailwindcss');

/** @type {import('next').NextConfig} */
const nextConfig = {
  /**
   * Turbopack sometimes infers a workspace root one level above this app; that breaks resolving
   * `tailwindcss` for `@import 'tailwindcss'` / the Tailwind config. Pin root + explicit aliases.
   */
  turbopack: {
    root: appDir,
    resolveAlias: {
      tailwindcss: tailwindDir,
      'tailwindcss/plugin': path.join(tailwindDir, 'dist', 'plugin.mjs'),
    },
  },
  reactStrictMode: true,
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: 'images.unsplash.com' },
      { protocol: 'https', hostname: 'i.pravatar.cc' },
    ],
  },
};

export default nextConfig;
