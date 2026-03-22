import { mockNews } from "../data/mockNews";
export { getLatestNews, getRelatedNews } from "./news-queries.js";

export function getLocalNewsArticles() {
  return [...mockNews];
}
