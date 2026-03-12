import type { APIRoute } from "astro";
import { getBusinessNewsArticles, getKnowhowArticles } from "../lib/article-groups";
import { getNewsArticles } from "../lib/microcms";

export const GET: APIRoute = async () => {
  const siteUrl = import.meta.env.SITE_URL || "https://chairman-official.com";
  const staticPages = [
    "",
    "about-us/",
    "news/",
    "sns-marketing/",
    "contact/",
    "privacy/",
    "livapon/"
  ];

  const articles = await getNewsArticles();
  const businessArticles = getBusinessNewsArticles(articles);
  const knowhowArticles = getKnowhowArticles(articles);
  const urls = [
    ...staticPages.map((path) => `${siteUrl}/${path}`),
    ...businessArticles.map((article) => `${siteUrl}/news/${article.slug}/`),
    ...knowhowArticles.map((article) => `${siteUrl}/sns-marketing/${article.slug}/`)
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
