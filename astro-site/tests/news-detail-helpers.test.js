import test from "node:test";
import assert from "node:assert/strict";
import { getLatestNews, getRelatedNews } from "../src/lib/news-queries.js";

function createArticle(overrides = {}) {
  return {
    id: "article-1",
    slug: "article-1",
    title: "記事 1",
    description: "description",
    excerpt: "excerpt",
    publishedAt: "2026-03-01T00:00:00.000Z",
    categories: [{ id: "shared", name: "共通" }],
    eyecatch: null,
    contentHtml: "<p>本文</p>",
    author: {
      title: "代表取締役",
      name: "田中 透",
      bio: "bio",
      image: null
    },
    ...overrides
  };
}

test("getLatestNews sorts articles by published date descending", () => {
  const articles = [
    createArticle({ slug: "oldest", publishedAt: "2026-01-01T00:00:00.000Z" }),
    createArticle({ slug: "latest", publishedAt: "2026-03-10T00:00:00.000Z" }),
    createArticle({ slug: "middle", publishedAt: "2026-02-01T00:00:00.000Z" })
  ];

  assert.deepEqual(getLatestNews(articles, 2).map((article) => article.slug), ["latest", "middle"]);
});

test("getRelatedNews excludes the current article and keeps category matches", () => {
  const current = createArticle({
    id: "current",
    slug: "current",
    categories: [{ id: "sns", name: "SNS運用" }]
  });
  const related = createArticle({
    id: "related",
    slug: "related",
    categories: [
      { id: "sns", name: "SNS運用" },
      { id: "video", name: "動画" }
    ]
  });
  const unrelated = createArticle({
    id: "unrelated",
    slug: "unrelated",
    categories: [{ id: "livapon", name: "LIVAPON" }]
  });

  assert.deepEqual(getRelatedNews([current, related, unrelated], current, 3).map((article) => article.slug), [
    "related"
  ]);
});
