import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  devIndicators: {
    // Defaults to bottom-left, where it sits on top of the sidebar's account
    // button. Development only — it is never rendered in production.
    position: "bottom-right",
  },
};

export default nextConfig;
