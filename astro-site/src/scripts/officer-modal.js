const dialog = document.querySelector("[data-officer-dialog]");
if (dialog) {
  const image = dialog.querySelector("[data-officer-image]");
  const role = dialog.querySelector("[data-officer-role]");
  const roleDetail = dialog.querySelector("[data-officer-role-detail]");
  const name = dialog.querySelector("[data-officer-name]");
  const summary = dialog.querySelector("[data-officer-summary]");
  const details = dialog.querySelector("[data-officer-details]");
  const noteLink = dialog.querySelector("[data-officer-note]");
  const closeButton = dialog.querySelector("[data-officer-close]");

  document.querySelectorAll("[data-officer-card]").forEach((card) => {
    const button = card.querySelector("[data-officer-open]");
    if (!button) {
      return;
    }

    button.addEventListener("click", () => {
      if (image) {
        image.src = card.dataset.image || "";
        image.alt = card.dataset.name || "";
      }

      if (role) {
        role.textContent = card.dataset.role || "";
      }

      if (roleDetail) {
        roleDetail.textContent = card.dataset.roleDetail || "";
        roleDetail.hidden = !card.dataset.roleDetail;
      }

      if (name) {
        name.textContent = card.dataset.name || "";
      }

      if (summary) {
        summary.textContent = card.dataset.summary || "";
      }

      if (details) {
        details.innerHTML = "";
        const lines = JSON.parse(card.dataset.details || "[]");
        lines.forEach((line) => {
          const paragraph = document.createElement("p");
          paragraph.textContent = line;
          details.appendChild(paragraph);
        });
      }

      if (noteLink) {
        const url = card.dataset.noteUrl || "";
        noteLink.hidden = !url;
        noteLink.href = url || "#";
      }

      dialog.showModal();
      document.body.classList.add("is-dialog-open");
    });
  });

  const close = () => {
    dialog.close();
    document.body.classList.remove("is-dialog-open");
  };

  closeButton?.addEventListener("click", close);
  dialog.addEventListener("click", (event) => {
    if (event.target === dialog) {
      close();
    }
  });
}
