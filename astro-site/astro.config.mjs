import { defineConfig } from "astro/config";

const base = process.env.SITE_BASE || "/";
const site = process.env.SITE_URL || "https://chairman-official.com";

export default defineConfig({
  site,
  base,
  output: "static",
  trailingSlash: "always",
  build: {
    format: "directory"
  },
  scopedStyleStrategy: "class"
});
