const { PHASE_DEVELOPMENT_SERVER } = require("next/constants");

/**
 * @format
 * @type {import('next').NextConfig}
 */
module.exports = (phase) => ({
  output: "standalone",
  distDir: phase === PHASE_DEVELOPMENT_SERVER ? ".next-dev" : ".next",
  webpack: (config) => {
    config.resolve = {
      ...config.resolve,
      fallback: {
        fs: false,
        //         path: false,
        //         os: false,
        net: false,
      },
    };
    return config;
  },
});
