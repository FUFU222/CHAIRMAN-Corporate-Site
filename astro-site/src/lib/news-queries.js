export function getLatestNews(articles, limit = 3) {
  return [...articles]
    .sort((left, right) => new Date(right.publishedAt).getTime() - new Date(left.publishedAt).getTime())
    .slice(0, limit);
}

export function getRelatedNews(articles, current, limit = 3) {
  const currentCategoryIds = new Set(current.categories.map((category) => category.id));
  return articles
    .filter((article) => article.slug !== current.slug)
    .filter((article) => article.categories.some((category) => currentCategoryIds.has(category.id)))
    .slice(0, limit);
}
