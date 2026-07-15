/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    // pdf-parse's bundled PDF.js parser handles this document correctly when
    // executed as a Node dependency, but fails after Webpack inlines it.
    serverComponentsExternalPackages: ["pdf-parse", "@napi-rs/canvas"],
    outputFileTracingIncludes: {
      "/api/subjects": [
        "./node_modules/.pnpm/pdfjs-dist@*/node_modules/pdfjs-dist/legacy/build/pdf.worker.mjs",
        "./node_modules/.pnpm/@napi-rs+canvas@*/node_modules/@napi-rs/canvas/**",
        "./node_modules/.pnpm/@napi-rs+canvas-linux-x64-gnu@*/node_modules/@napi-rs/canvas-linux-x64-gnu/**",
      ],
    },
  },
};

export default nextConfig;
