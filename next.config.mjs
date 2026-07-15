/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    // pdf-parse's bundled PDF.js parser handles this document correctly when
    // executed as a Node dependency, but fails after Webpack inlines it.
    serverComponentsExternalPackages: ["pdf-parse"],
  },
};

export default nextConfig;
