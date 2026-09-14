import { defineConfig } from "vite";
import vue from "@vitejs/plugin-vue";
import { VitePWA } from "vite-plugin-pwa";

const repository = process.env.GITHUB_REPOSITORY?.split("/")[1];
const owner = process.env.GITHUB_REPOSITORY?.split("/")[0];
const isUserSite = Boolean(repository && owner && repository === `${owner}.github.io`);

export default defineConfig({
  plugins: [
    vue(),
    VitePWA({
      registerType: "autoUpdate",
      injectRegister: "auto",
      includeAssets: ["favicon.ico", "favicon.svg", "apple-touch-icon.png", "icons/*.png"],
      devOptions: {
        enabled: true,
        type: "module",
        navigateFallback: "index.html",
      },
      manifest: {
        name: "Maple Crossing",
        short_name: "Maple Crossing",
        description: "Live Windsor–Detroit border wait times and maps.",
        theme_color: "#f4f1ea",
        background_color: "#f4f1ea",
        display: "standalone",
        start_url: "./",
        scope: "./",
        lang: "en",
        categories: ["navigation", "travel"],
        prefer_related_applications: false,
        icons: [
          {
            src: "icons/pwa-192x192.png",
            sizes: "192x192",
            type: "image/png",
            purpose: "any",
          },
          {
            src: "icons/pwa-512x512.png",
            sizes: "512x512",
            type: "image/png",
            purpose: "any",
          },
          {
            src: "icons/pwa-512x512-maskable.png",
            sizes: "512x512",
            type: "image/png",
            purpose: "maskable",
          },
        ],
      },
      workbox: {
        navigateFallback: "index.html",
        globPatterns: ["**/*.{js,css,html,ico,png,svg,woff,woff2,webmanifest}"],
        runtimeCaching: [
          {
            urlPattern: /^https:\/\/[a-c]\.tile\.openstreetmap\.org\/.*/i,
            handler: "CacheFirst",
            options: {
              cacheName: "osm-tiles",
              expiration: {
                maxEntries: 200,
                maxAgeSeconds: 60 * 60 * 24 * 7,
              },
            },
          },
          {
            urlPattern: /^https:\/\/api\.tomtom\.com\/maps\/.*/i,
            handler: "CacheFirst",
            options: {
              cacheName: "tomtom-tiles",
              expiration: {
                maxEntries: 200,
                maxAgeSeconds: 60 * 60 * 24,
              },
            },
          },
          {
            urlPattern: /^https:\/\/api\.frankfurter\.dev\/.*/i,
            handler: "NetworkFirst",
            options: {
              cacheName: "usd-cad-rate",
              expiration: {
                maxEntries: 4,
                maxAgeSeconds: 60 * 60 * 24,
              },
            },
          },
          {
            urlPattern: /^https:\/\/transitbarometer\.com\/api\/.*/i,
            handler: "NetworkFirst",
            options: {
              cacheName: "border-waits",
              expiration: {
                maxEntries: 4,
                maxAgeSeconds: 60 * 15,
              },
            },
          },
        ],
      },
    }),
  ],
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
      "/frankfurter": {
        target: "https://api.frankfurter.dev",
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/frankfurter/, ""),
      },
      "/transit-barometer": {
        target: "https://transitbarometer.com",
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/transit-barometer/, ""),
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
      "/frankfurter": {
        target: "https://api.frankfurter.dev",
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/frankfurter/, ""),
      },
      "/transit-barometer": {
        target: "https://transitbarometer.com",
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/transit-barometer/, ""),
      },
    },
  },
});
