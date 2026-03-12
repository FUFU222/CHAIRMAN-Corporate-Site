const dialog = document.querySelector("[data-officer-modal]");

if (dialog instanceof HTMLDialogElement) {
  const name = dialog.querySelector("[data-officer-modal-name]");
  const role = dialog.querySelector("[data-officer-modal-role]");
  const roleDetail = dialog.querySelector("[data-officer-modal-role-detail]");
  const body = dialog.querySelector("[data-officer-modal-body]");
  const actions = dialog.querySelector("[data-officer-modal-actions]");
  const noteLink = dialog.querySelector("[data-officer-modal-note-link]");
  const noteStatus = dialog.querySelector("[data-officer-modal-note-status]");
  const image = dialog.querySelector("[data-officer-modal-image]");
  const closeButton = dialog.querySelector("[data-officer-modal-close]");
  let activeTrigger = null;
  let imageRequestId = 0;

  function setDialogLockState(locked) {
    const scrollbarWidth = Math.max(0, window.innerWidth - document.documentElement.clientWidth);
    document.documentElement.style.setProperty("--scroll-lock-offset", locked ? `${scrollbarWidth}px` : "0px");
    document.body.classList.toggle("is-dialog-open", locked);
  }

  async function syncModalImage(triggerImage, officerName) {
    if (!(image instanceof HTMLImageElement) || !(triggerImage instanceof HTMLImageElement)) {
      return false;
    }

    const nextSrc = triggerImage.currentSrc || triggerImage.src;
    const nextClassName = triggerImage.className;
    const nextAlt = triggerImage.alt || officerName || "";
    const requestId = ++imageRequestId;

    image.className = nextClassName;
    image.alt = nextAlt;
    image.classList.remove("is-ready");

    if (!nextSrc) {
      image.removeAttribute("src");
      return true;
    }

    if (image.currentSrc === nextSrc && image.complete) {
      image.classList.add("is-ready");
      return true;
    }

    const preload = new Image();
    preload.src = nextSrc;

    try {
      if (typeof preload.decode === "function") {
        await preload.decode();
      } else if (!preload.complete) {
        await new Promise((resolve) => {
          preload.onload = resolve;
          preload.onerror = resolve;
        });
      }
    } catch (_error) {
      // decode 失敗時も同じソースをそのまま使う
    }

    if (requestId !== imageRequestId) {
      return false;
    }

    image.className = nextClassName;
    image.src = nextSrc;
    image.alt = nextAlt;

    try {
      if (typeof image.decode === "function") {
        await image.decode();
      }
    } catch (_error) {
      // 表示は継続
    }

    if (requestId !== imageRequestId) {
      return false;
    }

    image.classList.add("is-ready");
    return true;
  }

  async function applyOfficerContent(trigger) {
    const card = trigger.closest(".team-minimal-item-officer");
    const copy = card?.querySelector(".team-minimal-detail-copy");
    const triggerImage = trigger.querySelector(".team-minimal-image img");

    if (
      !(card instanceof HTMLElement) ||
      !(copy instanceof HTMLElement) ||
      !(name instanceof HTMLElement) ||
      !(role instanceof HTMLElement) ||
      !(roleDetail instanceof HTMLElement) ||
      !(body instanceof HTMLElement) ||
      !(actions instanceof HTMLElement) ||
      !(noteLink instanceof HTMLAnchorElement) ||
      !(noteStatus instanceof HTMLElement) ||
      !(image instanceof HTMLImageElement) ||
      !(triggerImage instanceof HTMLImageElement)
    ) {
      return false;
    }

    name.textContent = card.dataset.officerName || "";
    role.textContent = card.dataset.officerRole || "";
    roleDetail.textContent = card.dataset.officerRoleDetail || "";
    roleDetail.hidden = !roleDetail.textContent;
    body.innerHTML = copy.innerHTML;

    const imageReady = await syncModalImage(triggerImage, card.dataset.officerName || "");
    if (!imageReady) {
      return false;
    }

    const officerNoteUrl = card.dataset.officerNoteUrl || "";
    const officerNoteLabel = card.dataset.officerNoteLabel || "note";
    const officerNoteStatus = card.dataset.officerNoteStatus || "";

    actions.hidden = !officerNoteUrl && !officerNoteStatus;
    actions.style.display = officerNoteUrl || officerNoteStatus ? "flex" : "none";

    if (officerNoteUrl) {
      noteLink.href = officerNoteUrl;
      noteLink.setAttribute("aria-label", officerNoteLabel);
      noteLink.setAttribute("title", officerNoteLabel);
      noteLink.hidden = false;
      noteLink.style.display = "inline-flex";
      noteStatus.hidden = true;
      noteStatus.style.display = "none";
      noteStatus.textContent = "";
    } else {
      noteLink.hidden = true;
      noteLink.style.display = "none";
      noteLink.removeAttribute("href");
      noteLink.removeAttribute("aria-label");
      noteLink.removeAttribute("title");
      noteStatus.hidden = !officerNoteStatus;
      noteStatus.style.display = officerNoteStatus ? "" : "none";
      noteStatus.textContent = officerNoteStatus;
    }

    return true;
  }

  async function openDialog(trigger) {
    if (!(await applyOfficerContent(trigger))) {
      return;
    }

    activeTrigger = trigger;
    setDialogLockState(true);
    if (!dialog.open) {
      dialog.showModal();
    }
  }

  function closeDialog() {
    if (dialog.open) {
      dialog.close();
    }
  }

  document.querySelectorAll("[data-officer-modal-trigger]").forEach((trigger) => {
    if (!(trigger instanceof HTMLElement)) {
      return;
    }

    trigger.addEventListener("click", () => {
      void openDialog(trigger);
    });
  });

  if (closeButton instanceof HTMLElement) {
    closeButton.addEventListener("click", closeDialog);
  }

  dialog.addEventListener("close", () => {
    setDialogLockState(false);
    if (activeTrigger instanceof HTMLElement) {
      activeTrigger.focus();
    }
  });

  dialog.addEventListener("click", (event) => {
    if (event.target === dialog) {
      closeDialog();
    }
  });
}
