import type { APIRoute } from "astro";
import { getNewsArticles } from "../lib/microcms";

export const GET: APIRoute = async () => {
  const staticPages = [
    "",
    "about-us/",
    "news/",
    "contact/",
    "privacy/",
    "livapon/"
  ];

  const articles = await getNewsArticles();
  const urls = [
    ...staticPages.map((path) => `https://chairman-official.com/${path}`),
    ...articles.map((article) => `https://chairman-official.com/news/${article.slug}/`)
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
