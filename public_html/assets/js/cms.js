const CMS_API_ENDPOINT = "/script/api/news.php";
const DEFAULT_NEWS_IMAGE = "/images/CompanyLogo2.png";
const ARTICLE_HTML_ALLOWED_TAGS = [
  "p",
  "h1",
  "h2",
  "h3",
  "h4",
  "h5",
  "h6",
  "a",
  "img",
  "ul",
  "ol",
  "li",
  "strong",
  "em",
  "br",
  "div",
  "span",
  "blockquote",
  "table",
  "thead",
  "tbody",
  "tr",
  "th",
  "td",
];
const ARTICLE_HTML_ALLOWED_ATTR = ["href", "src", "alt", "class", "id", "target", "rel"];

document.addEventListener("DOMContentLoaded", () => {
  initCms().catch((error) => {
    console.error("CMS data load failed:", error);
  });
});

async function initCms() {
  const path = window.location.pathname;

  if (path === "/" || path.endsWith("index.html")) {
    await initIndexCms();
    return;
  }

  if (path.endsWith("news.html")) {
    await initNewsCms();
    return;
  }

  if (path.endsWith("news-detail.html")) {
    await initDetailCms();
  }
}

async function fetchCmsJson(action, params = {}) {
  const url = new URL(CMS_API_ENDPOINT, window.location.origin);
  url.searchParams.set("action", action);

  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== "") {
      url.searchParams.set(key, String(value));
    }
  });

  const response = await fetch(url.toString(), {
    headers: {
      Accept: "application/json",
    },
    credentials: "same-origin",
  });

  let payload = null;
  try {
    payload = await response.json();
  } catch (_error) {
    payload = null;
  }

  if (!response.ok) {
    const message =
      payload && typeof payload.error === "string"
        ? payload.error
        : `Request failed with status ${response.status}`;
    throw new Error(message);
  }

  return payload;
}

async function initIndexCms() {
  const newsList = document.querySelector(".news-list");
  if (!newsList) {
    return;
  }

  const payload = await fetchCmsJson("home");
  newsList.textContent = "";

  (payload.contents || []).forEach((content) => {
    newsList.appendChild(createHomeArticleItem(content));
  });
}

async function initNewsCms() {
  const newsList = document.querySelector("#article-list");
  const loadMoreButton = document.getElementById("load-more");
  const categoryMenu = document.querySelector(".category-menu");
  let categoryToggleButton = document.getElementById("toggle-categories");
  let categoryToggleItem = categoryToggleButton
    ? categoryToggleButton.closest("li")
    : null;

  if (!newsList || !loadMoreButton || !categoryMenu) {
    return;
  }

  let currentCategory = "all";
  let allArticles = [];
  const limit = 5;
  let offset = 0;
  const visibleCategoryCount = 5;
  let isCategoryExpanded = false;

  function ensureCategoryToggleButton() {
    if (!categoryToggleButton) {
      categoryToggleItem = document.createElement("li");
      categoryToggleItem.className = "category-toggle-item";

      categoryToggleButton = document.createElement("button");
      categoryToggleButton.id = "toggle-categories";
      categoryToggleButton.className = "category-toggle-button";
      categoryToggleButton.type = "button";
      categoryToggleButton.setAttribute("aria-expanded", "false");

      const icon = document.createElement("span");
      icon.className = "category-toggle-icon";
      icon.setAttribute("aria-hidden", "true");
      icon.textContent = "+";

      const text = document.createElement("span");
      text.className = "category-toggle-text";
      text.textContent = "さらに見る";

      categoryToggleButton.appendChild(icon);
      categoryToggleButton.appendChild(text);
      categoryToggleItem.appendChild(categoryToggleButton);
    }

    if (!categoryToggleItem) {
      categoryToggleItem = categoryToggleButton.closest("li");
    }

    if (categoryToggleItem && !categoryToggleItem.isConnected) {
      categoryMenu.appendChild(categoryToggleItem);
    }
  }

  function updateCategoryVisibility() {
    if (!categoryToggleButton || !categoryToggleItem) {
      return;
    }

    const categoryItems = Array.from(
      categoryMenu.querySelectorAll("li[data-tag-index]")
    );
    const hasOverflow = categoryItems.length > visibleCategoryCount;
    const icon = categoryToggleButton.querySelector(".category-toggle-icon");
    const text = categoryToggleButton.querySelector(".category-toggle-text");

    if (!hasOverflow) {
      categoryItems.forEach((item) => item.classList.remove("is-hidden"));
      categoryToggleItem.style.display = "none";
      categoryToggleButton.setAttribute("aria-expanded", "false");
      if (icon) {
        icon.textContent = "+";
      }
      if (text) {
        text.textContent = "さらに見る";
      }
      return;
    }

    categoryItems.forEach((item, index) => {
      const button = item.querySelector("button");
      const isActive = button ? button.classList.contains("active") : false;
      const shouldHide =
        !isCategoryExpanded && index >= visibleCategoryCount && !isActive;
      item.classList.toggle("is-hidden", shouldHide);
    });

    categoryToggleItem.style.display = "inline-flex";
    categoryToggleButton.setAttribute(
      "aria-expanded",
      isCategoryExpanded ? "true" : "false"
    );
    if (icon) {
      icon.textContent = isCategoryExpanded ? "−" : "+";
    }
    if (text) {
      text.textContent = isCategoryExpanded ? "閉じる" : "さらに見る";
    }
  }

  function loadArticles(category = "all", append = false) {
    if (!append) {
      newsList.textContent = "";
      offset = 0;
    }

    const articlesToShow =
      category === "all"
        ? allArticles
        : allArticles.filter(
            (article) =>
              Array.isArray(article.categories) &&
              article.categories.some((cat) => cat.name === category)
          );
    const newArticles = articlesToShow.slice(offset, offset + limit);

    newArticles.forEach((content) => {
      newsList.appendChild(createListArticleItem(content));
    });

    offset += limit;
    loadMoreButton.style.display =
      offset >= articlesToShow.length ? "none" : "block";
  }

  function updateCategoryMenu(articles) {
    const categories = new Set();
    articles.forEach((article) => {
      (article.categories || []).forEach((category) => {
        if (category && category.name) {
          categories.add(category.name);
        }
      });
    });

    categoryMenu.textContent = "";

    const allItem = document.createElement("li");
    const allButton = document.createElement("button");
    allButton.dataset.category = "all";
    allButton.className = "active";
    allButton.textContent = "すべて";
    allItem.appendChild(allButton);
    categoryMenu.appendChild(allItem);

    Array.from(categories).forEach((category, index) => {
      const item = document.createElement("li");
      item.dataset.tagIndex = String(index);

      const button = document.createElement("button");
      button.dataset.category = category;
      button.textContent = `#${category}`;

      item.appendChild(button);
      categoryMenu.appendChild(item);
    });

    ensureCategoryToggleButton();
    isCategoryExpanded = false;

    document
      .querySelectorAll(".category-menu button[data-category]")
      .forEach((button) => {
        button.addEventListener("click", function () {
          const category = this.dataset.category;
          if (category !== currentCategory) {
            document
              .querySelectorAll(".category-menu button")
              .forEach((btn) => btn.classList.remove("active"));
            this.classList.add("active");
            currentCategory = category;
            loadArticles(category);
            const articlesToShow =
              category === "all"
                ? allArticles
                : allArticles.filter(
                    (article) =>
                      Array.isArray(article.categories) &&
                      article.categories.some((cat) => cat.name === category)
                  );
            loadMoreButton.style.display =
              articlesToShow.length > limit ? "block" : "none";
          }
          updateCategoryVisibility();
        });
      });

    if (categoryToggleButton) {
      categoryToggleButton.onclick = function () {
        isCategoryExpanded = !isCategoryExpanded;
        updateCategoryVisibility();
      };
    }

    updateCategoryVisibility();
  }

  const payload = await fetchCmsJson("list");
  allArticles = payload.contents || [];
  loadArticles();
  updateCategoryMenu(allArticles);
  loadMoreButton.style.display = allArticles.length > limit ? "block" : "none";

  loadMoreButton.addEventListener("click", function () {
    loadArticles(currentCategory, true);
  });
}

async function initDetailCms() {
  const params = new URLSearchParams(window.location.search);
  const articleId = params.get("id");
  if (!articleId) {
    return;
  }

  const payload = await fetchCmsJson("detail", { id: articleId });
  const content = payload.content;
  if (!content) {
    return;
  }

  document.getElementById("news-title").innerText = content.title || "";
  document.getElementById("news-date").innerText = formatDate(
    content.publishedAt
  );
  renderArticleContent(document.getElementById("news-content"), content);

  const fallbackText = buildExcerpt(content.content || "", 120);
  const articleDescription = content.description || fallbackText;
  const articleImage =
    getSafeUrl(content.eyecatch?.url, getAbsoluteUrl(DEFAULT_NEWS_IMAGE)) ||
    getAbsoluteUrl(DEFAULT_NEWS_IMAGE);
  const articleUrl = `${window.location.origin}${window.location.pathname}?id=${encodeURIComponent(
    articleId
  )}`;
  const articleTitle = `${content.title} | 株式会社CHAIRMAN`;

  upsertMetaTag("name", "description", articleDescription);
  upsertMetaTag("property", "og:title", articleTitle);
  upsertMetaTag("property", "og:description", articleDescription);
  upsertMetaTag("property", "og:url", articleUrl);
  upsertMetaTag("property", "og:image", articleImage);
  upsertMetaTag("name", "twitter:title", articleTitle);
  upsertMetaTag("name", "twitter:description", articleDescription);
  upsertMetaTag("name", "twitter:image", articleImage);
  upsertCanonical(articleUrl);
  document.title = articleTitle;

  const author = content.author;
  if (author) {
    document.getElementById("author-title").textContent = author.title || "";
    document.getElementById("author-name").textContent = author.name || "";
    document.getElementById("author-bio").textContent = author.bio || "";
    document.getElementById("author-image").src = getSafeUrl(
      author.imageUrl,
      DEFAULT_NEWS_IMAGE
    );
  }

  const img = document.createElement("img");
  img.src = getSafeUrl(content.eyecatch?.url, DEFAULT_NEWS_IMAGE);
  img.alt = content.title || "";
  img.classList.add("news-image");
  const metaWrapper = document.querySelector(".news-meta");
  const container = document.querySelector(".news-detail-container");
  if (container && metaWrapper) {
    container.insertBefore(img, metaWrapper.nextSibling);
  }

  renderSidebarArticles("related-articles", payload.related || []);
  renderSidebarArticles("new-articles", payload.latest || []);
  setupShareButtons(content.title || "");
  appendArticleStructuredData(articleTitle, articleDescription, articleUrl, articleImage, content);

  const pageTitle = document.getElementById("page-title");
  if (pageTitle) {
    pageTitle.textContent = articleTitle;
  }
}

function createHomeArticleItem(content) {
  const li = document.createElement("li");
  li.classList.add("news-item");

  const link = document.createElement("a");
  link.href = buildNewsDetailUrl(content.id);

  const imgWrapper = document.createElement("div");
  imgWrapper.classList.add("news-image-wrapper");

  const img = document.createElement("img");
  img.classList.add("news-image");
  img.src = getSafeUrl(content.eyecatch?.url, DEFAULT_NEWS_IMAGE);
  img.alt = content.title || "";

  imgWrapper.appendChild(img);
  link.appendChild(imgWrapper);

  const date = document.createElement("div");
  date.classList.add("news-date");
  date.textContent = formatDate(content.publishedAt);

  const title = document.createElement("h3");
  title.classList.add("news-title");
  title.textContent = content.title || "";

  const summary = document.createElement("p");
  summary.classList.add("news-summary");
  summary.textContent = content.excerpt || "";

  link.appendChild(date);
  link.appendChild(title);
  link.appendChild(summary);
  li.appendChild(link);

  return li;
}

function createListArticleItem(content) {
  const li = document.createElement("li");
  li.classList.add("news-item", "separate");

  const link = document.createElement("a");
  link.href = buildNewsDetailUrl(content.id);

  const imgWrapper = document.createElement("div");
  imgWrapper.classList.add("news-image-wrapper");

  const img = document.createElement("img");
  img.classList.add("news-image");
  img.src = getSafeUrl(content.eyecatch?.url, DEFAULT_NEWS_IMAGE);
  img.alt = content.title || "";

  imgWrapper.appendChild(img);
  link.appendChild(imgWrapper);

  const info = document.createElement("div");
  info.classList.add("article-info");

  const category = document.createElement("div");
  category.classList.add("news-category");
  const categoryNames = (content.categories || []).map((item) => `#${item.name}`);
  category.textContent = categoryNames.length > 0 ? categoryNames.join(" ") : "#Uncategorized";

  const date = document.createElement("div");
  date.classList.add("news-date");
  date.textContent = formatDate(content.publishedAt);

  const title = document.createElement("h3");
  title.classList.add("news-title");
  const titleLink = document.createElement("a");
  titleLink.href = buildNewsDetailUrl(content.id);
  titleLink.textContent = content.title || "";
  title.appendChild(titleLink);

  info.appendChild(category);
  info.appendChild(date);
  info.appendChild(title);
  li.appendChild(link);
  li.appendChild(info);

  return li;
}

function renderArticleContent(container, content) {
  if (!container) {
    return;
  }

  container.textContent = "";

  const articleBody = document.createElement("div");
  if (typeof DOMPurify !== "undefined") {
    articleBody.innerHTML = DOMPurify.sanitize(content.content || "", {
      ALLOWED_TAGS: ARTICLE_HTML_ALLOWED_TAGS,
      ALLOWED_ATTR: ARTICLE_HTML_ALLOWED_ATTR,
    });
  } else {
    articleBody.textContent = buildExcerpt(content.content || "", 5000);
  }
  container.appendChild(articleBody);

  const ctaContainer = document.createElement("div");
  ctaContainer.classList.add("cta-button-container");

  const ctaLink = document.createElement("a");
  ctaLink.href = `https://service.chairman-official.com/?utm_source=blog&utm_medium=cta&utm_campaign=news_detail&utm_content=${encodeURIComponent(
    content.title || ""
  )}&utm_term=${encodeURIComponent(content.id || "")}`;
  ctaLink.className = "cta-button";
  ctaLink.target = "_blank";
  ctaLink.rel = "noopener noreferrer";
  ctaLink.textContent = "お問い合わせはこちら";

  ctaContainer.appendChild(ctaLink);
  container.appendChild(ctaContainer);
}

function renderSidebarArticles(containerId, articles) {
  const container = document.getElementById(containerId);
  if (!container) {
    return;
  }

  container.textContent = "";
  articles.forEach((content) => {
    container.appendChild(createSidebarArticleItem(content));
  });
}

function createSidebarArticleItem(content) {
  const li = document.createElement("li");
  li.classList.add("related-article-item", "new-article-item");

  const image = document.createElement("img");
  image.src = getSafeUrl(content.eyecatch?.url, DEFAULT_NEWS_IMAGE);
  image.className = "related-article-image new-article-image";
  image.alt = content.title || "";

  const info = document.createElement("div");
  info.classList.add("article-info");

  const date = document.createElement("div");
  date.classList.add("related-article-date", "new-article-date");
  date.textContent = formatDate(content.publishedAt);

  const title = document.createElement("h3");
  title.classList.add("related-article-title", "new-article-title");

  const link = document.createElement("a");
  link.href = buildNewsDetailUrl(content.id);
  link.textContent = content.title || "";

  title.appendChild(link);
  info.appendChild(date);
  info.appendChild(title);
  li.appendChild(image);
  li.appendChild(info);

  return li;
}

function setupShareButtons(title) {
  const shareButtons = document.querySelectorAll(".share-button");
  shareButtons.forEach((button) => {
    button.addEventListener("click", () => {
      const url = window.location.href;
      if (button.id === "share-twitter") {
        window.open(
          `https://twitter.com/intent/tweet?text=${encodeURIComponent(title)}&url=${encodeURIComponent(
            url
          )}`,
          "_blank"
        );
      } else if (button.id === "share-facebook") {
        window.open(
          `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(
            url
          )}`,
          "_blank"
        );
      } else if (button.id === "share-line") {
        window.open(
          `https://social-plugins.line.me/lineit/share?url=${encodeURIComponent(
            url
          )}`,
          "_blank"
        );
      } else if (button.id === "copy-link") {
        navigator.clipboard
          .writeText(url)
          .then(() => alert("リンクがコピーされました"));
      }
    });
  });
}

function appendArticleStructuredData(title, description, articleUrl, articleImage, content) {
  const structuredData = {
    "@context": "https://schema.org",
    "@type": "BlogPosting",
    headline: content.title || title,
    description,
    datePublished: content.publishedAt,
    mainEntityOfPage: articleUrl,
    image: [articleImage],
    author: {
      "@type": "Person",
      name: content.author?.name || "CHAIRMAN編集部",
    },
  };

  const scriptTag = document.createElement("script");
  scriptTag.type = "application/ld+json";
  scriptTag.textContent = JSON.stringify(structuredData);
  document.head.appendChild(scriptTag);
}

function upsertMetaTag(attrName, attrValue, content) {
  if (!content) {
    return;
  }

  let element = document.querySelector(`meta[${attrName}="${attrValue}"]`);
  if (!element) {
    element = document.createElement("meta");
    element.setAttribute(attrName, attrValue);
    document.head.appendChild(element);
  }
  element.setAttribute("content", content);
}

function upsertCanonical(href) {
  let canonical = document.querySelector('link[rel="canonical"]');
  if (!canonical) {
    canonical = document.createElement("link");
    canonical.setAttribute("rel", "canonical");
    document.head.appendChild(canonical);
  }
  canonical.setAttribute("href", href);
}

function buildNewsDetailUrl(id) {
  return `news-detail.html?id=${encodeURIComponent(id || "")}`;
}

function formatDate(value) {
  if (!value) {
    return "";
  }

  try {
    return new Date(value).toLocaleDateString("ja-JP");
  } catch (_error) {
    return "";
  }
}

function buildExcerpt(html, limit) {
  const plainText = String(html || "")
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ")
    .trim();

  if (plainText.length <= limit) {
    return plainText;
  }

  return `${plainText.slice(0, limit)}...`;
}

function getAbsoluteUrl(path) {
  return new URL(path, window.location.origin).href;
}

function getSafeUrl(url, fallback = "") {
  if (typeof url !== "string" || url.length === 0) {
    return fallback;
  }

  try {
    const normalized = new URL(url, window.location.origin);
    if (normalized.protocol === "http:" || normalized.protocol === "https:") {
      return normalized.href;
    }
  } catch (_error) {
    return fallback;
  }

  return fallback;
}
