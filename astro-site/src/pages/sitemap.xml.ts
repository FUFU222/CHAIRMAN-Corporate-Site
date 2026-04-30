import type { APIRoute } from "astro";
import { getKnowhowArticles } from "../lib/article-groups";
import { getLocalNewsArticles } from "../lib/news";
import { getMicrocmsArticles } from "../lib/microcms";

export const GET: APIRoute = async () => {
  const siteUrl = import.meta.env.SITE_URL || "https://chairman-official.com";
  const staticPages = [
    "",
    "about-us/",
    "news/",
    "contact/",
    "privacy/",
    "livapon/"
  ];

  const businessArticles = getLocalNewsArticles();
  const knowhowArticles = getKnowhowArticles(await getMicrocmsArticles());
  const urls = [
    ...staticPages.map((path) => `${siteUrl}/${path}`),
    ...businessArticles.map((article) => `${siteUrl}/news/${article.slug}/`)
  ];

  const body = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls
  .map((url) => `  <url><loc>${url}</loc></url>`)
  .join("\n")}
</urlset>`;

  return new Response(body, {
    headers: {
      "Content-Type": "application/xml; charset=utf-8"
    }
  });
};
