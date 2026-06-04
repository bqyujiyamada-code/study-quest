import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  experimental: {
    serverActions: {
      // スマホで撮影した大きめの写真（数MBクラス）も弾かれずに受け取れるよう、上限を10MBに引き上げます
      bodySizeLimit: "10mb",
    },
  },
};

export default nextConfig;
