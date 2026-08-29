import type { NextConfig } from "next";
const nextConfig: NextConfig = {
  async redirects() {
    return [
      { source: "/:path*", has: [{ type: "host", value: "www.arjansinghpuniani.com" }], destination: "https://arjansinghpuniani.com/:path*", permanent: true },
      { source: "/reasonos", destination: "/work/vector-ekg-reasonos", permanent: true },
      { source: "/reasonos/architecture", destination: "/work/vector-ekg-reasonos#architecture-heading", permanent: true },
      { source: "/reasonos/manifesto", destination: "/work/vector-ekg-reasonos", permanent: true },
      { source: "/work/reasonos-vector-ecg", destination: "/work/vector-ekg-reasonos", permanent: true },
      { source: "/work/sonoma-emergency-operations", destination: "/work/belmont-motorsport-systems", permanent: true },
    ];
  }
};
export default nextConfig;
