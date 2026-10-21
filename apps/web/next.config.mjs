/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // monorepo: pin tracing root to the workspace (multiple lockfiles warning)
  outputFileTracingRoot: process.cwd() + '/../..',
  // API is a separate NestJS app; browser calls it directly (CORS configured there)
  env: {
    NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL ?? 'http://127.0.0.1:4000/api/v1',
  },
};

export default nextConfig;
