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
  const filterSelect = archive.querySelector("[data-filter-select]");
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

  function syncControls() {
    buttons.forEach((button) => {
      const isActive = (button.dataset.filter || "all") === activeFilter;
      button.classList.toggle("is-active", isActive);
      button.setAttribute("aria-pressed", isActive ? "true" : "false");
    });

    if (filterSelect && filterSelect.value !== activeFilter) {
      filterSelect.value = activeFilter;
    }
  }

  function setActiveFilter(nextFilter) {
    activeFilter = nextFilter || "all";
    visibleCount = pageSize;
    syncControls();
    applyState();
  }

  buttons.forEach((button) => {
    button.addEventListener("click", () => {
      setActiveFilter(button.dataset.filter || "all");
    });
  });

  filterSelect?.addEventListener("change", () => {
    setActiveFilter(filterSelect.value || "all");
  });

  loadMore?.addEventListener("click", () => {
    visibleCount += pageSize;
    applyState();
  });

  syncControls();
  applyState();
  return true;
}

if (typeof document !== "undefined") {
  initializeNewsArchive({ document });
}
