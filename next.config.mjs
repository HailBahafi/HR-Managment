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
  async redirects() {
    return [
      { source: '/employees', destination: '/hr/employees', permanent: true },
      { source: '/employees/:id', destination: '/hr/employees/:id', permanent: true },
      { source: '/hr/employees/list', destination: '/hr/employees', permanent: true },
      { source: '/departments', destination: '/hr/departments', permanent: true },
      { source: '/branches', destination: '/hr/branches', permanent: true },
      { source: '/dashboard', destination: '/hr/dashboard', permanent: true },
      { source: '/contacts', destination: '/hr/contacts', permanent: true },
      { source: '/attendance', destination: '/hr/attendance', permanent: true },
      { source: '/job-titles', destination: '/hr/job-titles', permanent: true },
      { source: '/organization', destination: '/hr/organization', permanent: true },
      { source: '/permissions', destination: '/hr/permissions', permanent: true },
      { source: '/settings', destination: '/hr/settings', permanent: true },
      { source: '/notifications', destination: '/hr/notifications', permanent: true },
    ];
  },
};

export default nextConfig;
