
/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'standalone',
  experimental: { typedRoutes: true },
  reactStrictMode: true,
  trailingSlash: false,   // 👈 ensure no redirect on /healthz
};
export default nextConfig;

