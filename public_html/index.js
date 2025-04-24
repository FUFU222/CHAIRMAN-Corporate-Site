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

// -------------デザインBに変更するアニメーション---------------
document.getElementById("design-toggle").addEventListener("click", function () {
  const curtain = document.getElementById("curtain");
  const button = this;
  const heroSection = document.getElementById("hero-section");
  const animatedText = document.getElementById("animated-text");
  let text = heroSection.classList.contains("design-b")
    ? "CHAIRMAN"
    : "KOSOLIFE";
  let index = 0;

  button.disabled = true;
  showCurtain();

  setTimeout(() => {
    window.scrollTo(0, 0);
    swiper.slideTo(0);

    toggleDesign();
    updateHeader();
    updateHeroSection();
    updateServiceSection();
    updateSwiper();
    updateTeamSection();
    updateTrackRecordSection();

    animateText();
  }, 500);

  function showCurtain() {
    curtain.style.display = "flex";
    curtain.style.animation = "slideDown 0.5s forwards";
  }

  function hideCurtain() {
    curtain.style.animation = "slideUp 0.5s forwards";
    setTimeout(() => {
      curtain.style.display = "none";
      animatedText.textContent = "";
      button.disabled = false;
    }, 500);
  }

  function toggleDesign() {
    document.body.classList.toggle("design-b");
    const elementsToToggle = [
      document.querySelector(".header-container"),
      document.querySelector(".header-menu-container"),
      heroSection,
      document.querySelector("#service"),
      document.querySelector(".openbtn7"),
      document.querySelector(".swiper"),
      document.querySelector(".team-container"),
      document.querySelector(".track-record-container"),
    ];
    elementsToToggle.forEach((el) => el.classList.toggle("design-b"));
  }

  function updateHeader() {
    const logoImage = document.querySelector(".header-logo img");
    const headerMenuItems = document.querySelectorAll(".header-menu li a");
    const designBMenuTexts = [
      "事業紹介",
      "理念",
      "長岡式酵素玄米とは",
      "私たちについて",
      "お問い合わせ",
    ];
    if (document.body.classList.contains("design-b")) {
      logoImage.src = "./images/chairman-logo-green.svg";
      button.innerHTML = '<span class="text-background">CHAIRMAN</span>';
      headerMenuItems.forEach((item, index) => {
        item.textContent = designBMenuTexts[index];
      });
    } else {
      logoImage.src = "./images/chairman-logo.svg";
      button.innerHTML = '<span class="text-background">KOSOLIFE</span>';
      const defaultMenuTexts = [
        "事業紹介",
        "チーム",
        "運用実績",
        "私たちについて",
        "お問い合わせ",
      ];
      headerMenuItems.forEach((item, index) => {
        item.textContent = defaultMenuTexts[index];
      });
    }
  }

  function updateHeroSection() {
    const companyNameImage = document.querySelector(".Company-name img");
    const companyDescription = document.querySelector(".company-description");
    if (heroSection.classList.contains("design-b")) {
      companyNameImage.src = "./images/kosolife-text.svg";
      companyDescription.innerHTML =
        "<strong>「食」</strong>で日本を健康大国に";
    } else {
      companyNameImage.src = "./images/chairman-text-white.svg";
      companyDescription.innerHTML =
        "株式会社CHAIRMANは確実性の高い<br>SNSマーケティングサービスを提供します。";
    }
  }

  function updateServiceSection() {
    const serviceTitleDescription = document.querySelector(
      "#service .title-description p"
    );
    if (document.querySelector("#service").classList.contains("design-b")) {
      serviceTitleDescription.innerHTML =
        "無添加・無農薬・無化学肥料の長岡式酵素玄米、<br>その他健康食品を開発・販売しております。";
    } else {
      serviceTitleDescription.innerHTML =
        "弊社は総合的なクリエイティブサービスで、<br>事業を次のレベルへと押し上げることに全力を尽くします。<br>各クライアントの独自のニーズに合わせて練り上げた戦略で、<br>ビジネスを成功へと導く信頼のパートナーです。";
    }
  }

  function updateSwiper() {
    const swiperSlides = document.querySelectorAll(".swiper-slide");
    if (document.querySelector(".swiper").classList.contains("design-b")) {
      updateSlidesContent([
        {
          img: "./images/kosolife-riceBall.jpg",
          h3: "長岡式酵素玄米おにぎり",
          h5: "",
        },
        { img: "./images/kosolife-rice.jpg", h3: "長岡式酵素玄米", h5: "" },
        { img: "./images/kosolife-water.jpg", h3: "尚仁沢湧水", h5: "" },
        {
          img: "./images/kosolife-online.jpg",
          h3: "Visit Online Store",
          h5: "",
        },
      ]);
    } else {
      updateSlidesContent([
        {
          img: "./images/SNS Marketing1.jpg",
          h3: "SNS<br>Total<br>Produce",
          h5: "SNSトータルプロデュース",
          p: "SNS運用代行<br>国内・海外SNSマーケティング施策",
        },
        {
          img: "./images/Event1.jpg",
          h3: "Event<br>Produce",
          h5: "イベントプロデュース",
          p: "イベント企画・運用<br>キッチンカー派遣・",
        },
        {
          img: "./images/VideoProduction2.jpg",
          h3: "Video<br>Production",
          h5: "映像制作",
          p: "各種PV・スチール撮影",
        },
        { img: "", h3: "", h5: "", p: "", display: "none" },
      ]);
    }
  }

  function updateSlidesContent(slidesContent) {
    const swiperSlides = document.querySelectorAll(".swiper-slide");
    swiperSlides.forEach((slide, index) => {
      const content = slidesContent[index] || {};
      const img = slide.querySelector("img");
      const h3 = slide.querySelector("h3");
      const h5 = slide.querySelector("h5");
      const p = slide.querySelector("p");

      if (img && content.img) img.src = content.img;
      if (h3 && content.h3 !== undefined) h3.innerHTML = content.h3;
      if (h5 && content.h5 !== undefined) h5.innerHTML = content.h5;
      if (p && content.p !== undefined) p.innerHTML = content.p;
      if (content.display !== undefined) slide.style.display = content.display;
      else slide.style.display = "block";
    });
  }

  function updateTeamSection() {
    const teamTitle = document.querySelector("#team .title h2");
    const teamJapaneseTitle = document.querySelector(
      "#team .japanese-title h4"
    );
    const teamTitleDescription = document.querySelector(
      "#team .title-description p"
    );
    const teamImageContainer = document.querySelector(
      "#team .team-images-container img"
    );
    const teamImageLink = document.querySelector(
      "#team .team-images-container a"
    );
    if (
      document.querySelector(".team-container").classList.contains("design-b")
    ) {
      teamTitle.innerHTML = "Vision";
      teamJapaneseTitle.innerHTML = "理念";
      teamTitleDescription.innerHTML =
        "私たちは自然の恵みを生かし<br>お客様の健康を支えながら<br>持続可能な食文化の形成を目指しています。";
      teamImageContainer.src = "./images/vision.png";
      if (teamImageLink) {
        teamImageLink.dataset.href = teamImageLink.href;
        teamImageLink.removeAttribute("href");
      }
    } else {
      teamTitle.innerHTML = "Team";
      teamJapaneseTitle.innerHTML = "チーム";
      teamTitleDescription.innerHTML =
        "当社チームは個々の専門知識と情熱をもって<br>カスタマイズ戦略を練り上げ、<br>お客様のビジネスの成長を加速させます。";
      teamImageContainer.src = "./images/team-image.jpg";
      if (teamImageLink && teamImageLink.dataset.href) {
        teamImageLink.href = teamImageLink.dataset.href;
        delete teamImageLink.dataset.href;
      }
    }
  }

  function updateTrackRecordSection() {
    const trackRecordTitle = document.querySelector("#track-record .title h2");
    const trackRecordJapaneseTitle = document.querySelector(
      "#track-record .japanese-title h4"
    );
    const trackRecordTitleDescription = document.querySelector(
      "#track-record .title-description p"
    );
    const trackRecordWrapper = document.querySelectorAll(
      "#track-record .record-description-wrapper"
    );
    if (
      document
        .querySelector(".track-record-container")
        .classList.contains("design-b")
    ) {
      trackRecordTitle.innerHTML = "What is";
      trackRecordJapaneseTitle.innerHTML = "長岡式酵素玄米とは";
      trackRecordTitleDescription.style.display = "none";
      if (trackRecordWrapper.length >= 3) {
        updateTrackRecordContent([
          {
            h3: "自然由来の完全栄養食",
            p: "長岡式酵素玄米は<br>無添加・無農薬・無化学肥料の<br>厳選された素材を使って<br>特別な製法で炊き上げ<br>発酵させた食品です。",
          },
          {
            h3: "",
            p: "もちもちとした食感が特徴で<br>通常の玄米よりも食べやすく<br>消化もしやすくなります。",
          },
          {
            h3: "",
            p: "身体に有益な酵素を豊富に含み<br>健康的な生活を求める<br>全てのお客様におすすめです。",
          },
        ]);
      }
    } else {
      trackRecordTitle.innerHTML = "Track<br>Record";
      trackRecordJapaneseTitle.innerHTML = "運用実績";
      trackRecordTitleDescription.style.display = "block";
      if (trackRecordWrapper.length >= 3) {
        updateTrackRecordContent([
          { h3: "制作動画<br>累計再生回数<br><span>20億回</span>以上", p: "" },
          {
            h3: "所属メンバー<br>SNS総フォロワー<br><span>96万人</span>",
            p: "",
          },
          { h3: "個人・法人<br>運用件数<br><span>118件</span>", p: "" },
        ]);
      }
    }
  }

  function updateTrackRecordContent(content) {
    const trackRecordWrapper = document.querySelectorAll(
      "#track-record .record-description-wrapper"
    );
    trackRecordWrapper.forEach((wrapper, index) => {
      const item = content[index] || {};
      wrapper.innerHTML = `<h3>${item.h3}</h3><p>${item.p}</p>`;
      wrapper.style.display = "block";
    });
  }

  function animateText() {
    if (index < text.length) {
      animatedText.textContent += text[index++];
      setTimeout(animateText, 100);
    } else {
      setTimeout(hideCurtain, 500);
    }
  }
});

// メニューボタン
document.addEventListener("DOMContentLoaded", function () {
  const openBtn = document.querySelector(".openbtn7");
  const overlay = document.getElementById("overlay");
  const menuContainer = document.querySelector(".header-menu-container");
  const menuItems = document.querySelectorAll(".header-menu li a");

  // ハンバーガーメニューのトグル機能
  openBtn.addEventListener("click", function () {
    this.classList.toggle("active");
    menuContainer.classList.toggle("show-menu");
    overlay.style.display =
      overlay.style.display === "block" ? "none" : "block";
  });
  // オーバーレイをクリックしたときにメニューを閉じる
  overlay.addEventListener("click", closeMenu);
  // メニューアイテムのクリックイベントリスナーを設定
  menuItems.forEach((item) => {
    item.addEventListener("click", closeMenu);
  });
  // メニューを閉じる関数
  function closeMenu() {
    openBtn.classList.remove("active");
    menuContainer.classList.remove("show-menu");
    overlay.style.display = "none";
  }
});

// -----------------------------swiper-section---------------------------------
document.addEventListener("DOMContentLoaded", function () {
  const swiperContainer = document.querySelector(".swiper");
  const swiper = new Swiper(swiperContainer, {
    direction: "horizontal",
    loop: false,
    speed: 500,
    effect: "coverflow",
    centeredSlides: true,
    initialSlide: 0,
    slidesPerView: "auto",
    coverflowEffect: {
      rotate: 10,
      stretch: 20,
      depth: 30,
      modifier: 1,
      slideShadows: true,
    },
    mousewheel: {
      forceToAxis: true,
      releaseOnEdges: true,
    },
    pagination: {
      el: ".swiper-pagination",
    },
    scrollbar: {
      el: ".swiper-scrollbar",
    },
    on: {
      init: function () {
        this.slides.forEach((slide, index) => {
          const h3 = slide.querySelector("h3");
          const h5 = slide.querySelector("h5");
          const p = slide.querySelector("p");
          if (index !== this.activeIndex) {
            if (h3) h3.classList.add("fade-out-text");
            if (h5) h5.classList.add("fade-out-text");
            if (p) p.classList.add("fade-out-text");
          }
        });
        disablePageScroll();
      },
      slideChangeTransitionStart: function () {
        this.slides.forEach((slide, index) => {
          const h3 = slide.querySelector("h3");
          const h5 = slide.querySelector("h5");
          const p = slide.querySelector("p");
          if (index !== this.activeIndex) {
            if (h3) {
              h3.classList.add("fade-out-text");
              h3.classList.remove("fade-in-text");
            }
            if (h5) {
              h5.classList.add("fade-out-text");
              h5.classList.remove("fade-in-text");
            }
            if (p) {
              p.classList.add("fade-out-text");
              p.classList.remove("fade-in-text");
            }
          }
        });
      },
      slideChangeTransitionEnd: function () {
        this.slides.forEach((slide, index) => {
          const h3 = slide.querySelector("h3");
          const h5 = slide.querySelector("h5");
          const p = slide.querySelector("p");
          if (index === this.activeIndex) {
            if (h3) {
              h3.classList.remove("fade-out-text");
              h3.classList.add("fade-in-text");
            }
            if (h5) {
              setTimeout(() => {
                h5.classList.remove("fade-out-text");
                h5.classList.add("fade-in-text");
              }, 200); // この値を調整
            }
            if (p) {
              setTimeout(() => {
                p.classList.remove("fade-out-text");
                p.classList.add("fade-in-text");
              }, 400); // この値を調整
            }
          } else {
            if (h3) {
              h3.classList.add("fade-out-text");
              h3.classList.remove("fade-in-text");
            }
            if (h5) {
              h5.classList.add("fade-out-text");
              h5.classList.remove("fade-in-text");
            }
            if (p) {
              p.classList.add("fade-out-text");
              p.classList.remove("fade-in-text");
            }
          }
        });

        // 最後のスライドに到達したかをチェック
        if (this.isEnd || this.activeIndex === 0) {
          enablePageScroll();
        } else {
          disablePageScroll();
        }
      },
    },
    touchEventsTarget: "container", // タッチイベントのターゲットをコンテナ全体に設定
    touchRatio: 1, // タッチ感度を設定（1で標準）
    threshold: 30, // スワイプを認識するための最小距離
    touchMoveStopPropagation: false,
  });

  // // ページスクロールを無効にする関数
  // function disablePageScroll() {
  //   document.body.style.overflow = "hidden";
  // }

  // // ページスクロールを有効にする関数
  // function enablePageScroll() {
  //   document.body.style.overflow = "visible";
  // }

  // 初期ロード時にページスクロールを無効にする
  disablePageScroll();

  // swiper内のテキストアニメーション
  const style = document.createElement("style");
  style.innerHTML = `
    .fade-in-text {
      opacity: 1;
      transform: translateY(0);
      transition: opacity 0.5s ease-out, transform 0.5s ease-out;
    }
    .fade-out-text {
      opacity: 0;
      transform: translateY(20px);
      transition: opacity 0.5s ease-out, transform 0.5s ease-out;
    }
  `;
  document.head.appendChild(style);

  // design-toggle ボタンのクリックイベントリスナーを更新
  document
    .getElementById("design-toggle")
    .addEventListener("click", function () {
      const curtain = document.getElementById("curtain");
      const button = this;
      const heroSection = document.getElementById("hero-section");
      const animatedText = document.getElementById("animated-text");
      let text = heroSection.classList.contains("design-b")
        ? "CHAIRMAN"
        : "KOSOLIFE";
      let index = 0;

      button.disabled = true;
      showCurtain();

      setTimeout(() => {
        window.scrollTo(0, 0);
        swiper.slideTo(0);

        toggleDesign();
        updateHeader();
        updateHeroSection();
        updateServiceSection();
        updateSwiper();
        updateTeamSection();
        updateTrackRecordSection();

        animateText();
      }, 500);

      function showCurtain() {
        curtain.style.display = "flex";
        curtain.style.animation = "slideDown 0.5s forwards";
      }

      function hideCurtain() {
        curtain.style.animation = "slideUp 0.5s forwards";
        setTimeout(() => {
          curtain.style.display = "none";
          animatedText.textContent = "";
          button.disabled = false;
        }, 500);
      }

      function toggleDesign() {
        document.body.classList.toggle("design-b");
        const elementsToToggle = [
          document.querySelector(".header-container"),
          document.querySelector(".header-menu-container"),
          heroSection,
          document.querySelector("#service"),
          document.querySelector(".openbtn7"),
          document.querySelector(".swiper"),
          document.querySelector(".team-container"),
          document.querySelector(".track-record-container"),
        ];
        elementsToToggle.forEach((el) => el.classList.toggle("design-b"));
      }

      function updateHeader() {
        const logoImage = document.querySelector(".header-logo img");
        const headerMenuItems = document.querySelectorAll(".header-menu li a");
        const designBMenuTexts = [
          "事業紹介",
          "理念",
          "長岡式酵素玄米とは",
          "私たちについて",
          "ブログ",
          "お問い合わせ",
        ];
        if (document.body.classList.contains("design-b")) {
          logoImage.src = "./images/chairman-logo-green.svg";
          button.innerHTML = '<span class="text-background">CHAIRMAN</span>';
          headerMenuItems.forEach((item, index) => {
            item.textContent = designBMenuTexts[index];
          });
        } else {
          logoImage.src = "./images/chairman-logo.svg";
          button.innerHTML = '<span class="text-background">KOSOLIFE</span>';
          const defaultMenuTexts = [
            "事業紹介",
            "チーム",
            "運用実績",
            "私たちについて",
            "ブログ",
            "お問い合わせ",
          ];
          headerMenuItems.forEach((item, index) => {
            item.textContent = defaultMenuTexts[index];
          });
        }
      }

      function updateHeroSection() {
        const companyNameImage = document.querySelector(".Company-name img");
        const companyDescription = document.querySelector(
          ".company-description"
        );
        if (heroSection.classList.contains("design-b")) {
          companyNameImage.src = "./images/kosolife-text.svg";
          companyDescription.innerHTML =
            "<strong>「食」</strong>で日本を健康大国に";
        } else {
          companyNameImage.src = "./images/chairman-text-white.svg";
          companyDescription.innerHTML =
            "株式会社CHAIRMANは確実性の高い<br>SNSマーケティングサービスを提供します。";
        }
      }

      function updateServiceSection() {
        const serviceTitleDescription = document.querySelector(
          "#service .title-description p"
        );
        if (document.querySelector("#service").classList.contains("design-b")) {
          serviceTitleDescription.innerHTML =
            "無添加・無農薬・無化学肥料の長岡式酵素玄米、<br>その他健康食品を開発・販売しております。";
        } else {
          serviceTitleDescription.innerHTML =
            "弊社は総合的なクリエイティブサービスで、<br>事業を次のレベルへと押し上げることに全力を尽くします。<br>各クライアントの独自のニーズに合わせて練り上げた戦略で、<br>ビジネスを成功へと導く信頼のパートナーです。";
        }
      }

      function updateSwiper() {
        const swiperSlides = document.querySelectorAll(".swiper-slide");
        if (document.querySelector(".swiper").classList.contains("design-b")) {
          updateSlidesContent([
            {
              img: "./images/kosolife-riceBall.jpg",
              h3: "長岡式酵素玄米おにぎり",
              h5: "",
            },
            { img: "./images/kosolife-rice.jpg", h3: "長岡式酵素玄米", h5: "" },
            { img: "./images/kosolife-water.jpg", h3: "尚仁沢湧水", h5: "" },
            {
              img: "./images/kosolife-online.jpg",
              h3: "Visit Online Store",
              h5: "",
            },
          ]);
        } else {
          updateSlidesContent([
            {
              img: "./images/SNS Marketing1.jpg",
              h3: "SNS<br>Total<br>Produce",
              h5: "SNSトータルプロデュース",
              p: "SNS運用代行<br>国内・海外SNSマーケティング施策",
            },
            {
              img: "./images/Event1.jpg",
              h3: "Event<br>Produce",
              h5: "イベントプロデュース",
              p: "イベント企画・運用<br>キッチンカー派遣・",
            },
            {
              img: "./images/VideoProduction1.jpg",
              h3: "Video<br>Production",
              h5: "映像制作",
              p: "各種PV・スチール撮影",
            },
            { img: "", h3: "", h5: "", p: "", display: "none" },
          ]);
        }
      }

      function updateSlidesContent(slidesContent) {
        const swiperSlides = document.querySelectorAll(".swiper-slide");
        swiperSlides.forEach((slide, index) => {
          const content = slidesContent[index] || {};
          const img = slide.querySelector("img");
          const h3 = slide.querySelector("h3");
          const h5 = slide.querySelector("h5");
          const p = slide.querySelector("p");

          if (img && content.img) img.src = content.img;
          if (h3 && content.h3 !== undefined) h3.innerHTML = content.h3;
          if (h5 && content.h5 !== undefined) h5.innerHTML = content.h5;
          if (p && content.p !== undefined) p.innerHTML = content.p;
          if (content.display !== undefined)
            slide.style.display = content.display;
          else slide.style.display = "block";
        });
      }

      function updateTeamSection() {
        const teamTitle = document.querySelector("#team .title h2");
        const teamJapaneseTitle = document.querySelector(
          "#team .japanese-title h4"
        );
        const teamTitleDescription = document.querySelector(
          "#team .title-description p"
        );
        const teamImageContainer = document.querySelector(
          "#team .team-images-container img"
        );
        const teamImageLink = document.querySelector(
          "#team .team-images-container a"
        );
        if (
          document
            .querySelector(".team-container")
            .classList.contains("design-b")
        ) {
          teamTitle.innerHTML = "Vision";
          teamJapaneseTitle.innerHTML = "理念";
          teamTitleDescription.innerHTML =
            "私たちは自然の恵みを生かし<br>お客様の健康を支えながら<br>持続可能な食文化の形成を目指しています。";
          teamImageContainer.src = "./images/vision.png";
          if (teamImageLink) {
            teamImageLink.dataset.href = teamImageLink.href;
            teamImageLink.removeAttribute("href");
          }
        } else {
          teamTitle.innerHTML = "Team";
          teamJapaneseTitle.innerHTML = "チーム";
          teamTitleDescription.innerHTML =
            "当社チームは個々の専門知識と情熱をもって<br>カスタマイズ戦略を練り上げ、<br>お客様のビジネスの成長を加速させます。";
          teamImageContainer.src = "./images/team-image.jpg";
          if (teamImageLink && teamImageLink.dataset.href) {
            teamImageLink.href = teamImageLink.dataset.href;
            delete teamImageLink.dataset.href;
          }
        }
      }

      function updateTrackRecordSection() {
        const trackRecordTitle = document.querySelector(
          "#track-record .title h2"
        );
        const trackRecordJapaneseTitle = document.querySelector(
          "#track-record .japanese-title h4"
        );
        const trackRecordTitleDescription = document.querySelector(
          "#track-record .title-description p"
        );
        const trackRecordWrapper = document.querySelectorAll(
          "#track-record .record-description-wrapper"
        );
        if (
          document
            .querySelector(".track-record-container")
            .classList.contains("design-b")
        ) {
          trackRecordTitle.innerHTML = "What is";
          trackRecordJapaneseTitle.innerHTML = "長岡式酵素玄米とは";
          trackRecordTitleDescription.style.display = "none";
          if (trackRecordWrapper.length >= 3) {
            updateTrackRecordContent([
              {
                h3: "自然由来の完全栄養食",
                p: "長岡式酵素玄米は<br>無添加・無農薬・無化学肥料の<br>厳選された素材を使って<br>特別な製法で炊き上げ<br>発酵させた食品です。",
              },
              {
                h3: "",
                p: "もちもちとした食感が特徴で<br>通常の玄米よりも食べやすく<br>消化もしやすくなります。",
              },
              {
                h3: "",
                p: "身体に有益な酵素を豊富に含み<br>健康的な生活を求める<br>全てのお客様におすすめです。",
              },
            ]);
          }
        } else {
          trackRecordTitle.innerHTML = "Track<br>Record";
          trackRecordJapaneseTitle.innerHTML = "運用実績";
          trackRecordTitleDescription.style.display = "block";
          if (trackRecordWrapper.length >= 3) {
            updateTrackRecordContent([
              {
                h3: "制作動画<br>累計再生回数<br><span>20億回</span>以上",
                p: "",
              },
              {
                h3: "所属メンバー<br>SNS総フォロワー<br><span>96万人</span>",
                p: "",
              },
              { h3: "個人・法人<br>運用件数<br><span>118件</span>", p: "" },
            ]);
          }
        }
      }

      function updateTrackRecordContent(content) {
        const trackRecordWrapper = document.querySelectorAll(
          "#track-record .record-description-wrapper"
        );
        trackRecordWrapper.forEach((wrapper, index) => {
          const item = content[index] || {};
          wrapper.innerHTML = `<h3>${item.h3}</h3><p>${item.p}</p>`;
          wrapper.style.display = "block";
        });
      }

      function animateText() {
        if (index < text.length) {
          animatedText.textContent += text[index++];
          setTimeout(animateText, 100);
        } else {
          setTimeout(hideCurtain, 500);
        }
      }
    });
});