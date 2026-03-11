import { defineConfig } from "astro/config";

const base = process.env.SITE_BASE || "/";

export default defineConfig({
  site: "https://chairman-official.com",
  base,
  output: "static",
  trailingSlash: "always",
  build: {
    format: "directory"
  },
  scopedStyleStrategy: "class"
});
