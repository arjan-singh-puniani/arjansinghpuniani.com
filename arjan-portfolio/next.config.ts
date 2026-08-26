import type { NextConfig } from "next";
const nextConfig: NextConfig = {
  async redirects() {
    return [{ source: "/:path*", has: [{ type: "host", value: "www.arjansinghpuniani.com" }], destination: "https://arjansinghpuniani.com/:path*", permanent: true }];
  }
};
export default nextConfig;
