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
    return [
      { source: "/:path*", headers: securityHeaders },
      { source: "/atlas/:path*", headers: [
        { key: "X-Frame-Options", value: "DENY" },
        { key: "Content-Security-Policy", value: "default-src 'self'; script-src 'self' 'unsafe-inline' 'wasm-unsafe-eval'; style-src 'self' 'unsafe-inline'; img-src 'self' data: blob:; connect-src 'self'; font-src 'self'; object-src 'none'; base-uri 'self'; frame-ancestors 'none'; form-action 'self'" },
      ] },
    ];
  },

  async rewrites() {
    return [{ source: "/atlas", destination: "/atlas/index.html" }];
  },

  async redirects() {
    return [
      {
        source: "/:path*",
        has: [{ type: "host", value: "www.arjansinghpuniani.com" }],
        destination: "https://arjansinghpuniani.com/:path*",
        permanent: true,
      },
      { source: "/rally-house", destination: "/rally-house/index.html", permanent: true },
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
