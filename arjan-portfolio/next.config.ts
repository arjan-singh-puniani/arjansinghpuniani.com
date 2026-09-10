import type { NextConfig } from "next";

const securityHeaders = [
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "X-Frame-Options", value: "SAMEORIGIN" },
  {
    key: "Permissions-Policy",
    value: "camera=(), microphone=(), geolocation=(), payment=(), usb=()",
  },
  {
    key: "Content-Security-Policy",
    value: "base-uri 'self'; form-action 'self'; frame-ancestors 'self'; object-src 'none'",
  },
];

const nextConfig: NextConfig = {
  outputFileTracingRoot: process.cwd(),
  poweredByHeader: false,

  images: {
    formats: ["image/avif", "image/webp"],
  },

  async headers() {
    return [{ source: "/:path*", headers: securityHeaders }];
  },

  async redirects() {
    return [
      {
        source: "/:path*",
        has: [{ type: "host", value: "www.arjansinghpuniani.com" }],
        destination: "https://arjansinghpuniani.com/:path*",
        permanent: true,
      },
      { source: "/reasonos", destination: "/work/vector-ekg-reasonos", permanent: true },
      {
        source: "/reasonos/architecture",
        destination: "/work/vector-ekg-reasonos#architecture-heading",
        permanent: true,
      },
      { source: "/reasonos/manifesto", destination: "/work/vector-ekg-reasonos", permanent: true },
      {
        source: "/work/reasonos-vector-ecg",
        destination: "/work/vector-ekg-reasonos",
        permanent: true,
      },
      {
        source: "/work/sonoma-emergency-operations",
        destination: "/work/belmont-motorsport-systems",
        permanent: true,
      },
    ];
  },
};

export default nextConfig;
