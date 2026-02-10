//テキストのカウントアップ+バーの設定
var bar = new ProgressBar.Line(splash_text, {
  //id名を指定
  easing: "easeInOut",
  duration: 1000,
  strokeWidth: 0.4,
  color: "#555",
  trailWidth: 0.9,
  trailColor: "#bbb",
  text: {
    //テキストの形状を直接指定
    style: {
      //天地中央に配置
      position: "absolute",
      left: "50%",
      top: "50%",
      padding: "0",
      margin: "-30px 0 0 0", //バーより上に配置
      transform: "translate(-50%,-50%)",
      "font-size": "1rem",
      color: "#fff",
    },
    autoStyleContainer: false, //自動付与のスタイルを切る
  },
  step: function (state, bar) {
    bar.setText(Math.round(bar.value() * 100) + " %"); //テキストの数値
  },
});
// ページスクロールを無効にする関数
function disablePageScroll() {
  document.body.style.overflow = "hidden";
}

// ページスクロールを有効にする関数
function enablePageScroll() {
  document.body.style.overflow = "visible";
  document.body.style.overflowX = "hidden";
}
//アニメーションスタート
bar.animate(1.0, function () {
  //1.0=100%描画
  $("#splash_text").fadeOut(10); //フェイドアウトでローディングテキストを削除
  $(".loader_cover-up").addClass("coveranime"); //カバーが上に上がるクラス追加
  $(".loader_cover-down").addClass("coveranime"); //カバーが下に下がるクラス追加
  $("#splash").fadeOut(); //#splashエリアをフェードアウト
  // enablePageScroll();
});

// ローディング待機
document.addEventListener("DOMContentLoaded", function () {
  const loader = document.getElementById("loader");
  const progressBar = document.querySelector(".progress-bar .progress");
  const video = document.querySelector(".iphone-mockup-container video");

  if (!loader || !video) {
    return;
  }

  let loaderHidden = false;

  function hideLoader() {
    if (loaderHidden) return;
    loaderHidden = true;
    loader.classList.add("progress-fade-out");
    setTimeout(() => {
      loader.style.display = "none";
    }, 1000);
  }

  function updateProgress() {
    if (!progressBar) return;
    if (video.buffered.length > 0) {
      const bufferedEnd = video.buffered.end(video.buffered.length - 1);
      const duration = video.duration;
      if (duration > 0) {
        progressBar.style.width = (bufferedEnd / duration) * 100 + "%";
      }
    }
  }

  video.addEventListener("progress", updateProgress);

  const onReady = () => {
    setTimeout(() => {
      hideLoader();
      // ビデオ再生を試みる
      video.play().catch((error) => {
        console.error("ビデオの再生に失敗しました:", error);
      });
    }, 500); // 0.5秒の遅延でフェードアウトを開始
  };

  video.addEventListener("loadeddata", onReady, { once: true });
  video.addEventListener("canplay", onReady, { once: true });
  video.addEventListener("canplaythrough", onReady, { once: true });

  // 初期のプログレスバーの更新
  updateProgress();

  if (video.readyState >= 2) {
    onReady();
  }
});

//スクロールに応じたヘッダーの表示
document.addEventListener("DOMContentLoaded", function () {
  var header = document.getElementById("header");
  var lastScrollTop = 0;
  var scrollThreshold = 5;
  var glassThreshold = 16;

  if (!header) {
    return;
  }

  function updateHeaderMaterial(scrollTop) {
    header.classList.toggle("is-scrolled", scrollTop > glassThreshold);
  }

  window.addEventListener(
    "scroll",
    function () {
      var currentScroll =
        window.pageYOffset || document.documentElement.scrollTop;

      updateHeaderMaterial(currentScroll);

      if (header.classList.contains("menu-open")) {
        lastScrollTop = currentScroll <= 0 ? 0 : currentScroll;
        return;
      }

      if (Math.abs(currentScroll - lastScrollTop) > scrollThreshold) {
        if (currentScroll > lastScrollTop) {
          // 下にスクロールした時、ヘッダーを非表示にする
          header.style.top = "-170px";
        } else {
          // 上にスクロールした時、ヘッダーを表示する
          header.style.top = "0px";
        }
        lastScrollTop = currentScroll <= 0 ? 0 : currentScroll; // ネガティブな値を避ける
      }
    },
    false
  );

  updateHeaderMaterial(window.pageYOffset || document.documentElement.scrollTop);
});
//--------------------- fade-in,titleSlideなどのアニメーション設定-----------------------
document.addEventListener("DOMContentLoaded", function () {
  const fadeInTargets = document.querySelectorAll(
    ".title-description, .record-description-wrapper, .member-position, .member-name h3, .member-image img, .member-description dt, .member-description dd p"
  );
  const slideTargets = document.querySelectorAll(
    ".title h2, .japanese-title h4"
  );
  const fadeBgTarget = document.querySelector(
    "#service"
  );

  fadeInTargets.forEach((target) => {
    target.classList.add("fade-in");
  });

  const fadeObserver = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          setTimeout(() => {
            entry.target.classList.add("is-visible");
            fadeObserver.unobserve(entry.target);
          }, 300);
        }
      });
    },
    {
      rootMargin: "-50px 0px 50px 0px",
      threshold: [0.05, 0.5, 1],
    }
  );

  const slideObserver = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          const titleColor = window.getComputedStyle(entry.target).color;
          entry.target.style.setProperty("--title-original-color", titleColor);
          entry.target.classList.add("bgextend", "bgLRextend");
          slideObserver.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.2 }
  );

  const fadeBgObserver = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        const sectionTitles = entry.target.querySelectorAll(
          ".title h2, .japanese-title h4"
        );

        sectionTitles.forEach((title) => {
          if (!title.dataset.defaultTitleColor) {
            title.dataset.defaultTitleColor = window.getComputedStyle(title).color;
          }
        });

        if (entry.isIntersecting) {
          if (entry.target.classList.contains("design-b")) {
            entry.target.style.backgroundColor = "#1a5710";
            entry.target.style.color = "white";
          } else {
            entry.target.style.backgroundColor = "#953939";
            entry.target.style.color = "white";
          }

          sectionTitles.forEach((title) => {
            title.style.setProperty("--title-original-color", "#ffffff");
          });

          // title-descriptionのテキストも白に変更
          const titleDescription = entry.target.querySelector('.title-description p');
          if (titleDescription) {
            titleDescription.style.color = "white";
          }
        } else {
          entry.target.style.backgroundColor = "#e5e5e5";
          entry.target.style.color = "black";

          sectionTitles.forEach((title) => {
            const defaultTitleColor = title.dataset.defaultTitleColor || "#212121";
            title.style.setProperty("--title-original-color", defaultTitleColor);
          });

          // title-descriptionのテキストも元の色に戻す
          const titleDescription = entry.target.querySelector('.title-description p');
          if (titleDescription) {
            titleDescription.style.color = "#444";
          }
        }
      });
    },
    { threshold: 0.4 }
  );

  fadeInTargets.forEach((target) => fadeObserver.observe(target));
  slideTargets.forEach((target) => slideObserver.observe(target));
  if (fadeBgTarget) {
    fadeBgObserver.observe(fadeBgTarget);
  }
});

// メニューボタン
document.addEventListener("DOMContentLoaded", function () {
  const openBtn       = document.querySelector(".openbtn7");
  const overlay       = document.getElementById("menu-overlay");
  const menuContainer = document.querySelector(".header-menu-container");
  const menuItems     = document.querySelectorAll(".header-menu li a");
  const header        = document.getElementById("header");

  if (!openBtn || !overlay || !menuContainer) {
    return;
  }

  // ハンバーガーボタンで開閉
  openBtn.addEventListener("click", function (e) {
    e.stopPropagation();  // 下の document.click に飛ばさない
    const isOpen = !menuContainer.classList.contains("show-menu");
    this.classList.toggle("active", isOpen);
    menuContainer.classList.toggle("show-menu", isOpen);
    overlay.classList.toggle("show", isOpen);
    if (header) {
      header.classList.toggle("menu-open", isOpen);
      if (isOpen) {
        header.style.top = "0px";
      }
    }
  });

  // オーバーレイ押下で閉じる
  overlay.addEventListener("click", closeMenu);

  // メニュー項目押下で閉じる
  menuItems.forEach((item) => item.addEventListener("click", closeMenu));

  // メニューリンク以外の領域タップ/クリックで閉じる
  // captureで先に拾い、clickを止めて背面要素のタップスルーを防ぐ
  document.addEventListener("click", function (e) {
    if (!menuContainer.classList.contains("show-menu")) {
      return;
    }
    if (openBtn.contains(e.target)) {
      return;
    }
    if (e.target.closest(".header-menu li")) {
      return;
    }
    e.preventDefault();
    e.stopPropagation();
    closeMenu();
  }, true);

  function closeMenu() {
    openBtn.classList.remove("active");
    menuContainer.classList.remove("show-menu");
    overlay.classList.remove("show");
    if (header) {
      header.classList.remove("menu-open");
    }
  }
});

// Livapon marquee (background text loop)
document.addEventListener("DOMContentLoaded", function () {
  const marquees = document.querySelectorAll("[data-marquee]");
  if (!marquees.length) {
    return;
  }

  requestAnimationFrame(() => {
    marquees.forEach((marquee) => {
      if (marquee.dataset.marqueeReady === "true") {
        return;
      }
      const track = marquee.querySelector(".livapon-marquee-track");
      if (!track) {
        return;
      }

      const base = track.innerHTML;
      let guard = 0;
      while (track.scrollWidth < marquee.offsetWidth * 2 && guard < 20) {
        track.insertAdjacentHTML("beforeend", base);
        guard += 1;
      }

      track.insertAdjacentHTML("beforeend", track.innerHTML);
      marquee.dataset.marqueeReady = "true";
    });
  });
});
