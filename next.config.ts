import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  output: 'export', // 静的エクスポート
  basePath: '/simple_accounting', // GitHub Pagesのサブディレクトリ
  assetPrefix: '/simple_accounting/', // 静的ファイルのパス修正
  images: {
    unoptimized: true, // 画像最適化を無効化（GitHub Pagesでは最適化機能が動作しないため）
  },
};

export default nextConfig;