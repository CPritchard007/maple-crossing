import { defineConfig } from "vite";
import vue from "@vitejs/plugin-vue";

const repository = process.env.GITHUB_REPOSITORY?.split("/")[1];
const owner = process.env.GITHUB_REPOSITORY?.split("/")[0];
const isUserSite = Boolean(repository && owner && repository === `${owner}.github.io`);

export default defineConfig({
  plugins: [vue()],
  base: process.env.GITHUB_ACTIONS === "true" && repository && !isUserSite ? `/${repository}/` : "/",
  server: {
    proxy: {
      "/tomtom-api": {
        target: "https://api.tomtom.com",
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/tomtom-api/, ""),
      },
      "/cbp-bwt": {
        target: "https://bwt.cbp.gov",
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/cbp-bwt/, ""),
      },
    },
  },
  preview: {
    proxy: {
      "/cbp-bwt": {
        target: "https://bwt.cbp.gov",
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/cbp-bwt/, ""),
      },
    },
  },
});
