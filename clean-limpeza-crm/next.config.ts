import path from "path";
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Fixa a raiz do projeto nesta pasta (evita herdar arquivos de pastas acima).
  turbopack: { root: path.join(__dirname) },
  outputFileTracingRoot: path.join(__dirname),
  // Servidor enxuto para Docker; a Vercel usa o próprio formato de build.
  output: process.env.VERCEL ? undefined : "standalone",
  poweredByHeader: false,
};

export default nextConfig;
