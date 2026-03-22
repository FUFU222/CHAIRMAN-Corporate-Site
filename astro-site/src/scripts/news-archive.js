export function initializeNewsArchive(options = {}) {
  const documentRef = options.document ?? (typeof document === "undefined" ? null : document);

  if (!documentRef) {
    return false;
  }

  const archive = documentRef.querySelector("[data-news-archive]");
  if (!archive) {
    return false;
  }

  const buttons = Array.from(archive.querySelectorAll("[data-filter]"));
  const loadMore = archive.querySelector("[data-load-more]");
  const items = Array.from(archive.querySelectorAll("[data-archive-item]"));
  const pageSize = Math.max(1, Number.parseInt(archive.dataset.pageSize || "9", 10));
  const loadMoreThreshold = Math.max(
    pageSize + 1,
    Number.parseInt(archive.dataset.loadMoreThreshold || `${pageSize + 1}`, 10)
  );
  let activeFilter = "all";
  let visibleCount = pageSize;

  function applyState() {
    let matched = 0;

    items.forEach((item) => {
      const categories = (item.dataset.categories || "").split(",").filter(Boolean);
      const matches = activeFilter === "all" || categories.includes(activeFilter);

      if (!matches) {
        item.hidden = true;
        return;
      }

      matched += 1;
      item.hidden = matched > visibleCount;
    });

    if (loadMore) {
      loadMore.hidden = matched < loadMoreThreshold || matched <= visibleCount;
    }
  }

  buttons.forEach((button) => {
    button.addEventListener("click", () => {
      activeFilter = button.dataset.filter || "all";
      visibleCount = pageSize;
      buttons.forEach((candidate) => candidate.classList.toggle("is-active", candidate === button));
      applyState();
    });
  });

  loadMore?.addEventListener("click", () => {
    visibleCount += pageSize;
    applyState();
  });

  applyState();
  return true;
}

if (typeof document !== "undefined") {
  initializeNewsArchive({ document });
}
