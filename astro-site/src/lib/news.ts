import { mockNews } from "../data/mockNews";
import type { NewsArticle } from "./types";

export function getLocalNewsArticles() {
  return [...mockNews];
}

export function getLatestNews(articles: NewsArticle[], limit = 3) {
  return [...articles]
    .sort((left, right) => new Date(right.publishedAt).getTime() - new Date(left.publishedAt).getTime())
    .slice(0, limit);
}

export function getRelatedNews(articles: NewsArticle[], current: NewsArticle, limit = 3) {
  const currentCategoryIds = new Set(current.categories.map((category) => category.id));
  return articles
    .filter((article) => article.slug !== current.slug)
    .filter((article) => article.categories.some((category) => currentCategoryIds.has(category.id)))
    .slice(0, limit);
}
