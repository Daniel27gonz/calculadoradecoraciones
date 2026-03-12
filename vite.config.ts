import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";
import { VitePWA } from "vite-plugin-pwa";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  server: {
    host: "::",
    port: 8080,
  },
  plugins: [
    react(),
    mode === "development" && componentTagger(),
    VitePWA({
      registerType: "autoUpdate",
      includeAssets: ["app-icon.png", "robots.txt"],
      devOptions: {
        enabled: true,
      },
      manifest: {
        id: "/",
        name: "DecoControl",
        short_name: "DecoControl",
        description: "Calcula precios, costos y ganancias de tus eventos de decoración con globos. App para decoradoras emprendedoras.",
        theme_color: "#f9a8d4",
        background_color: "#fdf2f8",
        display: "standalone",
        orientation: "portrait",
        scope: "/",
        start_url: "/",
        categories: ["business", "productivity", "utilities"],
        lang: "es",
        dir: "ltr",
        icons: [
          {
            src: "/app-icon.png",
            sizes: "512x512",
            type: "image/png",
            purpose: "any",
          },
          {
            src: "/app-icon.png",
            sizes: "512x512",
            type: "image/png",
            purpose: "maskable",
          },
        ],
        screenshots: [
          {
            src: "/app-icon.png",
            sizes: "512x512",
            type: "image/png",
            form_factor: "narrow",
          },
        ],
        prefer_related_applications: false,
      },
      workbox: {
        globPatterns: ["**/*.{js,css,html,ico,png,svg,woff2,woff,ttf,webp,jpg,jpeg}"],
        cleanupOutdatedCaches: true,
        clientsClaim: true,
        skipWaiting: true,
        runtimeCaching: [
          {
            urlPattern: /^https:\/\/fonts\.googleapis\.com\/.*/i,
            handler: "CacheFirst",
            options: {
              cacheName: "google-fonts-cache",
              expiration: {
                maxEntries: 10,
                maxAgeSeconds: 60 * 60 * 24 * 365,
              },
              cacheableResponse: {
                statuses: [0, 200],
              },
            },
          },
          {
            urlPattern: /^https:\/\/fonts\.gstatic\.com\/.*/i,
            handler: "CacheFirst",
            options: {
              cacheName: "gstatic-fonts-cache",
              expiration: {
                maxEntries: 10,
                maxAgeSeconds: 60 * 60 * 24 * 365,
              },
              cacheableResponse: {
                statuses: [0, 200],
              },
            },
          },
          {
            urlPattern: /^https:\/\/.*\.supabase\.co\/.*/i,
            handler: "NetworkFirst",
            options: {
              cacheName: "supabase-cache",
              expiration: {
                maxEntries: 50,
                maxAgeSeconds: 60 * 5,
              },
              cacheableResponse: {
                statuses: [0, 200],
              },
              networkTimeoutSeconds: 10,
            },
          },
        ],
      },
    }),
  ].filter(Boolean),
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
}));
