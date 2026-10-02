import path from "path";
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Este app vive numa subpasta do repositório: fixa a raiz para não
  // herdar arquivos (middleware, lockfile) do projeto da pasta acima.
  turbopack: { root: path.join(__dirname) },
  outputFileTracingRoot: path.join(__dirname),
  // Gera um servidor enxuto em .next/standalone (usado no Docker).
  output: "standalone",
  poweredByHeader: false,
};

export default nextConfig;
