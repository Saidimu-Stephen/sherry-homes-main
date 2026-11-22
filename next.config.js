const { PHASE_DEVELOPMENT_SERVER } = require("next/constants");

/**
 * @format
 * @type {import('next').NextConfig}
 */
module.exports = (phase) => ({
  output: "standalone",
  distDir: phase === PHASE_DEVELOPMENT_SERVER ? ".next-dev" : ".next",
  experimental: {
    serverComponentsExternalPackages: ["jsonwebtoken", "bcryptjs", "mongoose"],
  },
  webpack: (config) => {
    config.resolve = {
      ...config.resolve,
      fallback: {
        fs: false,
        net: false,
      },
    };
    return config;
  },
});