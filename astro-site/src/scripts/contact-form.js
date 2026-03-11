const form = document.querySelector("[data-contact-form]");
const statusMessage = document.querySelector("[data-contact-status]");
const submit = document.querySelector("[data-contact-submit]");
const target = document.querySelector("[data-contact-target]");

if (form && statusMessage && submit) {
  let hasSubmitted = false;
  const endpoint = form.dataset.endpoint || "";

  const setStatus = (message, state) => {
    statusMessage.textContent = message;
    statusMessage.dataset.state = state;
  };

  form.addEventListener("submit", (event) => {
    if (!form.reportValidity()) {
      event.preventDefault();
      setStatus("未入力の項目があります。入力内容をご確認ください。", "error");
      return;
    }

    if (!endpoint) {
      event.preventDefault();
      submit.disabled = true;
      setStatus("デモ送信を実行しています。", "submitting");
      window.setTimeout(() => {
        form.reset();
        submit.disabled = false;
        setStatus("デモ送信が完了しました。Apps Script URL を設定すると本送信に切り替わります。", "success");
      }, 700);
      return;
    }

    hasSubmitted = true;
    submit.disabled = true;
    setStatus("送信中です。しばらくお待ちください。", "submitting");
  });

  target?.addEventListener("load", () => {
    if (!hasSubmitted) {
      return;
    }

    hasSubmitted = false;
    submit.disabled = false;
    form.reset();
    setStatus("送信を受け付けました。内容を確認のうえ担当よりご連絡します。", "success");
  });
}
