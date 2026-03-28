document.querySelectorAll("[data-copy-url]").forEach((button) => {
  button.addEventListener("click", async () => {
    const value = button.dataset.copyUrl;
    if (!value) {
      return;
    }

    try {
      await navigator.clipboard.writeText(value);
      button.textContent = "コピーしました";
      window.setTimeout(() => {
        button.textContent = "URLをコピー";
      }, 1800);
    } catch (error) {
      console.error(error);
    }
  });
});
