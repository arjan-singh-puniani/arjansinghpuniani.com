import type { NextConfig } from "next";
const nextConfig: NextConfig = {
  outputFileTracingRoot: process.cwd(),
  async redirects() {
    return [{ source: "/:path*", has: [{ type: "host", value: "www.arjansinghpuniani.com" }], destination: "https://arjansinghpuniani.com/:path*", permanent: true }];
  }
};
export default nextConfig;
