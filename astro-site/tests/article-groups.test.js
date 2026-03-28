import test from "node:test";
import assert from "node:assert/strict";
import { getBusinessNewsArticles, getKnowhowArticles, isBusinessNewsArticle } from "../src/lib/article-groups.ts";

function createArticle(overrides = {}) {
  return {
    id: "article-1",
    slug: "article-1",
    title: "SNS運用の基本",
    description: "日々の発信設計についてまとめました。",
    excerpt: "日々の発信設計についてまとめました。",
    publishedAt: "2026-03-01T00:00:00.000Z",
    categories: [{ id: "sns", name: "SNS運用" }],
    eyecatch: null,
    contentHtml: "<p>日々の発信設計についてまとめました。</p>",
    author: {
      title: "代表取締役",
      name: "田中 透",
      bio: "bio",
      image: null
    },
    ...overrides
  };
}

test("business keywords route partnership articles away from knowhow pages", () => {
  const businessArticle = createArticle({
    id: "business",
    slug: "business",
    title: "Japan Expo Canadaとのパートナーシップ契約を締結"
  });
  const knowhowArticle = createArticle({
    id: "knowhow",
    slug: "knowhow",
    title: "ショート動画の構成メモ"
  });
  const articles = [businessArticle, knowhowArticle];

  assert.equal(isBusinessNewsArticle(businessArticle), true);
  assert.equal(isBusinessNewsArticle(knowhowArticle), false);
  assert.deepEqual(getBusinessNewsArticles(articles).map((article) => article.slug), ["business"]);
  assert.deepEqual(getKnowhowArticles(articles).map((article) => article.slug), ["knowhow"]);
});
