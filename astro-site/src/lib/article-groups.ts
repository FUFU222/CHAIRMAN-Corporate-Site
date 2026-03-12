import type { NewsArticle } from "./types";

const businessKeywords = [
  "livapon",
  "越境ec",
  "越境",
  "海外展開",
  "海外市場",
  "輸出",
  "北米展開",
  "北米",
  "north-america",
  "パートナーシップ",
  "partnership",
  "独占供給",
  "canada",
  "japan expo",
  "festival",
  "展示会"
] as const;

function normalize(value: string) {
  return value.trim().toLowerCase().normalize("NFKC");
}

function articleSearchSource(article: NewsArticle) {
  return normalize(
    [
      article.title,
      article.description,
      article.excerpt,
      ...article.categories.flatMap((category) => [category.id, category.name])
    ].join(" ")
  );
}

export function isBusinessNewsArticle(article: NewsArticle) {
  const source = articleSearchSource(article);
  return businessKeywords.some((keyword) => source.includes(normalize(keyword)));
}

export function getBusinessNewsArticles(articles: NewsArticle[]) {
  return articles.filter(isBusinessNewsArticle);
}

export function getKnowhowArticles(articles: NewsArticle[]) {
  return articles.filter((article) => !isBusinessNewsArticle(article));
}
