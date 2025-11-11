import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import svgr from "vite-plugin-svgr";

// Wrap config so we can switch the base path when building for GitHub Pages.
export default defineConfig(({ command }) => ({
  base: "/",
  plugins: [react(), svgr()],
}));
