/** @type {import('next').NextConfig} */
const nextConfig = {
  webpack: (config) => {
    config.ignoreWarnings = [
      { module: /node_modules\/unpdf/ },
    ];
    return config;
  },
  // Deliberately no Content-Security-Policy here — the app relies on Google OAuth,
  // Google Analytics, and other third-party scripts whose exact domains/inline-script
  // needs would need a careful audit to enumerate correctly. A wrong CSP silently breaks
  // sign-in rather than failing loudly, so it's left for a dedicated pass rather than
  // guessed at here. The headers below are all safe, well-established defaults with no
  // such risk.
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "X-Frame-Options", value: "SAMEORIGIN" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          { key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains; preload" },
          // Camera/microphone stay enabled for this origin — the app uses them for
          // interview recording. Everything else the app doesn't use is disabled.
          { key: "Permissions-Policy", value: "camera=(self), microphone=(self), geolocation=(), payment=(), usb=()" },
        ],
      },
    ];
  },
};

export default nextConfig;
