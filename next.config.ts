import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  /**
   * next build skips its own type check. `pnpm typecheck` (tsc-rs) runs it
   * instead, in the lefthook pre-commit hook. The repo has no CI.
   */
  typescript: { ignoreBuildErrors: true },
};

export default nextConfig;
