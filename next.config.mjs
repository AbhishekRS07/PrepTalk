/** @type {import('next').NextConfig} */
const nextConfig = {
  webpack: (config) => {
    config.ignoreWarnings = [
      { module: /node_modules\/unpdf/ },
    ];
    return config;
  },
};

export default nextConfig;
