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

  function updateProgress() {
    if (video.buffered.length > 0) {
      const bufferedEnd = video.buffered.end(video.buffered.length - 1);
      const duration = video.duration;
      if (duration > 0) {
        progressBar.style.width = (bufferedEnd / duration) * 100 + "%";
      }
    }
  }

  video.addEventListener("progress", updateProgress);

  video.addEventListener("canplaythrough", () => {
    // progressBar.style.width = '100%';

    setTimeout(() => {
      loader.classList.add("progress-fade-out");
      setTimeout(() => {
        loader.style.display = "none";
        // ビデオ再生を試みる
        video.play().catch((error) => {
          console.error("ビデオの再生に失敗しました:", error);
          // 必要に応じて、エラー処理を追加
        });
      }, 1000); // 1秒の遅延でローダーを隠す
    }, 500); // 0.5秒の遅延でフェードアウトを開始
  });

  // 初期のプログレスバーの更新
  updateProgress();
});

//スクロールに応じたヘッダーの表示
document.addEventListener("DOMContentLoaded", function () {
  var header = document.getElementById("header");
  var lastScrollTop = 0;
  var scrollThreshold = 5;

  window.addEventListener(
    "scroll",
    function () {
      var currentScroll =
        window.pageYOffset || document.documentElement.scrollTop;

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
    "#service, #service .title-container"
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
          setTimeout(() => {
            entry.target.classList.add("is-visible");
            entry.target.style.opacity = 1;
          }, 200);
          entry.target.classList.add("bgextend", "bgLRextend");
          slideObserver.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.5 }
  );

  const fadeBgObserver = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          if (entry.target.classList.contains("design-b")) {
            entry.target.style.backgroundColor = "#1a5710";
            entry.target.style.color = "white";
          } else {
            entry.target.style.backgroundColor = "#953939";
            entry.target.style.color = "white";
          }
        } else {
          entry.target.style.backgroundColor = "#e5e5e5";
          entry.target.style.color = "black";
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

  // ハンバーガーボタンで開閉
  openBtn.addEventListener("click", function (e) {
    e.stopPropagation();  // 下の document.click に飛ばさない
    this.classList.toggle("active");
    menuContainer.classList.toggle("show-menu");
    overlay.classList.toggle("show");
  });

  // オーバーレイ押下で閉じる
  overlay.addEventListener("click", closeMenu);

  // メニュー項目押下で閉じる
  menuItems.forEach((item) => item.addEventListener("click", closeMenu));

  // ボタン・メニュー外クリックで閉じる
  document.addEventListener("click", function (e) {
    if (
      menuContainer.classList.contains("show-menu") &&
      !openBtn.contains(e.target) &&
      !menuContainer.contains(e.target)
    ) {
      closeMenu();
    }
  });

  function closeMenu() {
    openBtn.classList.remove("active");
    menuContainer.classList.remove("show-menu");
    overlay.classList.remove("show");
  }
});
