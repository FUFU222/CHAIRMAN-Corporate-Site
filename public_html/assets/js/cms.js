/**
 * microCMS fetch logic for CHAIRMAN Website
 */
document.addEventListener('DOMContentLoaded', function () {
    const { createClient } = microcms;
    const client = createClient({
        serviceDomain: '6p0edejcy2',
        apiKey: 'VzmVhi0gICjPrmVJDtXS9LTCi1S7xBE3r8Ms'
    });

    const path = window.location.pathname;

    // Index page logic
    if (path === '/' || path.endsWith('index.html')) {
        initIndexCMS(client);
    } 
    // News list page logic
    else if (path.endsWith('news.html')) {
        initNewsCMS(client);
    } 
    // News detail page logic
    else if (path.endsWith('news-detail.html')) {
        initDetailCMS(client);
    }
});

/**
 * Logic for Index page
 */
function initIndexCMS(client) {
    client
        .get({
            endpoint: 'blog',
            queries: {
                limit: 3,
                orders: '-publishedAt'
            }
        })
        .then((res) => {
            const newsList = document.querySelector('.news-list');
            if (newsList) {
                res.contents.forEach((content) => {
                    const li = document.createElement('li');
                    li.classList.add('news-item');

                    const link = document.createElement('a');
                    link.href = `news-detail.html?id=${content.id}`;

                    const imgWrapper = document.createElement('div');
                    imgWrapper.classList.add('news-image-wrapper');

                    const img = document.createElement('img');
                    img.classList.add('news-image');
                    img.src = content.eyecatch ? content.eyecatch.url : '/path/to/default/image.jpg';
                    img.alt = content.title;

                    imgWrapper.appendChild(img);
                    link.appendChild(imgWrapper);

                    const date = document.createElement('div');
                    date.classList.add('news-date');
                    date.innerHTML = `${new Date(content.publishedAt).toLocaleDateString('ja-JP')}`;

                    const title = document.createElement('h3');
                    title.classList.add('news-title');
                    title.innerHTML = DOMPurify.sanitize(`<a href="news-detail.html?id=${content.id}">${content.title}</a>`);

                    const summary = document.createElement('p');
                    summary.classList.add('news-summary');
                    summary.innerHTML = DOMPurify.sanitize(content.content.slice(0, 40) + '...');

                    link.appendChild(date);
                    link.appendChild(title);
                    link.appendChild(summary);
                    li.appendChild(link);
                    newsList.appendChild(li);
                });
            }
        });
}

/**
 * Logic for News List page
 */
function initNewsCMS(client) {
    const newsList = document.querySelector('#article-list');
    const loadMoreButton = document.getElementById('load-more');
    if (!newsList || !loadMoreButton) return;

    let currentCategory = 'all';
    let allArticles = [];
    const limit = 5;
    let offset = 0;

    function createArticleElement(content) {
        const li = document.createElement('li');
        li.classList.add('news-item', 'separate');

        const link = document.createElement('a');
        link.href = `news-detail.html?id=${content.id}`;

        const imgWrapper = document.createElement('div');
        imgWrapper.classList.add('news-image-wrapper');

        const img = document.createElement('img');
        img.classList.add('news-image');
        img.src = content.eyecatch ? content.eyecatch.url : '/path/to/default/image.jpg';
        img.alt = content.title;

        imgWrapper.appendChild(img);
        link.appendChild(imgWrapper);

        const info = document.createElement('div');
        info.classList.add('article-info');

        const date = document.createElement('div');
        date.classList.add('news-date');
        date.innerHTML = `${new Date(content.publishedAt).toLocaleDateString('ja-JP')}`;

        const title = document.createElement('h3');
        title.classList.add('news-title');
        title.innerHTML = DOMPurify.sanitize(`<a href="news-detail.html?id=${content.id}">${content.title}</a>`);

        const category = document.createElement('div');
        category.classList.add('news-category');
        if (content.category && Array.isArray(content.category)) {
            category.innerHTML = content.category.map(cat => `#${cat.name}`).join(' ');
        } else {
            category.innerHTML = '#Uncategorized';
        }

        info.appendChild(category);
        info.appendChild(date);
        info.appendChild(title);
        li.appendChild(link);
        li.appendChild(info);
        return li;
    }

    function loadArticles(category = 'all', append = false) {
        if (!append) {
            newsList.innerHTML = '';
            offset = 0;
        }

        const articlesToShow = category === 'all' ? allArticles : allArticles.filter(article => article.category && article.category.some(cat => cat.name === category));
        const newArticles = articlesToShow.slice(offset, offset + limit);

        newArticles.forEach(content => {
            newsList.appendChild(createArticleElement(content));
        });

        offset += limit;
        loadMoreButton.style.display = (offset >= articlesToShow.length) ? 'none' : 'block';
    }

    function fetchArticles() {
        client.get({ endpoint: 'blog', queries: { limit: 100 } })
            .then(res => {
                allArticles = res.contents;
                loadArticles();
                updateCategoryMenu(allArticles);
                loadMoreButton.style.display = (res.contents.length > limit) ? 'block' : 'none';
            });
    }

    function updateCategoryMenu(articles) {
        const categoryMenu = document.querySelector('.category-menu');
        const categories = new Set();
        articles.forEach(article => {
            if (article.category && Array.isArray(article.category)) {
                article.category.forEach(cat => categories.add(cat.name));
            }
        });

        categoryMenu.innerHTML = '';
        const allButton = document.createElement('li');
        allButton.innerHTML = '<button data-category="all" class="active">すべて</button>';
        categoryMenu.appendChild(allButton);

        [...categories].forEach(category => {
            const button = document.createElement('li');
            button.innerHTML = `<button data-category="${category}">#${category}</button>`;
            categoryMenu.appendChild(button);
        });

        document.querySelectorAll('.category-menu button').forEach(button => {
            button.addEventListener('click', function () {
                const category = this.dataset.category;
                if (category !== currentCategory) {
                    document.querySelectorAll('.category-menu button').forEach(btn => btn.classList.remove('active'));
                    this.classList.add('active');
                    currentCategory = category;
                    loadArticles(category);
                    const articlesToShow = category === 'all' ? allArticles : allArticles.filter(article => article.category && article.category.some(cat => cat.name === category));
                    loadMoreButton.style.display = articlesToShow.length > limit ? 'block' : 'none';
                }
            });
        });
    }

    fetchArticles();
    loadMoreButton.addEventListener('click', function () {
        loadArticles(currentCategory, true);
    });
}

/**
 * Logic for News Detail page
 */
function initDetailCMS(client) {
    const params = new URLSearchParams(window.location.search);
    const articleId = params.get('id');
    if (!articleId) return;

    client
        .get({
            endpoint: 'blog',
            contentId: articleId
        })
        .then((content) => {
            document.getElementById('news-title').innerText = content.title;
            document.getElementById('news-date').innerText = new Date(content.publishedAt).toLocaleDateString('ja-JP');
            document.getElementById('news-content').innerHTML = DOMPurify.sanitize(content.content, { 
                ALLOWED_TAGS: ['p', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'a', 'img', 'ul', 'ol', 'li', 'strong', 'em', 'br', 'div', 'span', 'blockquote', 'table', 'thead', 'tbody', 'tr', 'th', 'td'], 
                ALLOWED_ATTR: ['href', 'src', 'alt', 'class', 'id', 'target', 'rel'] 
            });
            
            const metaDescription = document.querySelector('meta[name="description"]');
            if (metaDescription) {
                const fallbackText = content.content.replace(/<[^>]+>/g, '').slice(0, 100);
                metaDescription.setAttribute('content', content.description || fallbackText);
            }

            const ctaButton = document.createElement('div');
            ctaButton.classList.add('cta-button-container');
            ctaButton.innerHTML = `
                <a href="https://service.chairman-official.com/?utm_source=blog&utm_medium=cta&utm_campaign=news_detail&utm_content=${encodeURIComponent(content.title)}&utm_term=${articleId}" class="cta-button" target="_blank" rel="noopener noreferrer">
                    お問い合わせはこちら
                </a>
            `;
            document.getElementById('news-content').appendChild(ctaButton);
            
            const author = content.author;
            if (author) {
                document.getElementById('author-title').textContent = author["author-title"];
                document.getElementById('author-name').textContent = author["author-name"];
                document.getElementById('author-bio').textContent = author["author-bio"];
                document.getElementById('author-image').src = author["author-image"]?.url || '/images/default-author.png';
            }

            const img = document.createElement('img');
            img.src = content.eyecatch ? content.eyecatch.url : '/path/to/default/image.jpg';
            img.alt = content.title;
            img.classList.add('news-image');
            const metaWrapper = document.querySelector('.news-meta');
            const container = document.querySelector('.news-detail-container');
            container.insertBefore(img, metaWrapper.nextSibling);

            const categoryId = content.category[0].id;
            fetchRelatedArticles(client, categoryId, articleId);
            fetchNewArticles(client);
            setupShareButtons(content.title);
            
            // Add JSON-LD
            const structuredData = {
                "@context": "https://schema.org",
                "@type": "BlogPosting",
                "headline": content.title,
                "datePublished": content.publishedAt,
                "author": { "@type": "Person", "name": content.author?.["author-name"] || "CHAIRMAN編集部" }
            };
            const scriptTag = document.createElement('script');
            scriptTag.type = 'application/ld+json';
            scriptTag.textContent = JSON.stringify(structuredData);
            document.head.appendChild(scriptTag);

            const pageTitle = document.getElementById('page-title');
            if (pageTitle) pageTitle.textContent = `${content.title} | 株式会社CHAIRMAN`;
        })
        .catch(err => console.error('Error fetching article:', err));
}

function fetchRelatedArticles(client, categoryId, currentArticleId) {
    client.get({
        endpoint: 'blog',
        queries: { filters: `category[contains]${categoryId}`, limit: 3, orders: '-publishedAt' }
    }).then((res) => {
        const container = document.getElementById('related-articles');
        if (!container) return;
        res.contents.forEach((content) => {
            if (content.id !== currentArticleId) {
                const li = createSidebarArticleItem(content);
                container.appendChild(li);
            }
        });
    });
}

function fetchNewArticles(client) {
    client.get({
        endpoint: 'blog',
        queries: { limit: 3, orders: '-publishedAt' }
    }).then((res) => {
        const container = document.getElementById('new-articles');
        if (!container) return;
        res.contents.forEach((content) => {
            const li = createSidebarArticleItem(content);
            container.appendChild(li);
        });
    });
}

function createSidebarArticleItem(content) {
    const li = document.createElement('li');
    li.classList.add('related-article-item', 'new-article-item');
    li.innerHTML = `
        <img src="${content.eyecatch ? content.eyecatch.url : '/path/to/default/image.jpg'}" class="related-article-image new-article-image" alt="${content.title}">
        <div class="article-info">
            <div class="related-article-date new-article-date">${new Date(content.publishedAt).toLocaleDateString('ja-JP')}</div>
            <h3 class="related-article-title new-article-title"><a href="news-detail.html?id=${content.id}">${content.title}</a></h3>
        </div>
    `;
    return li;
}

function setupShareButtons(title) {
    const shareButtons = document.querySelectorAll('.share-button');
    shareButtons.forEach(button => {
        button.addEventListener('click', () => {
            let url = window.location.href;
            if (button.id === 'share-twitter') window.open(`https://twitter.com/intent/tweet?text=${encodeURIComponent(title)}&url=${encodeURIComponent(url)}`, '_blank');
            else if (button.id === 'share-facebook') window.open(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`, '_blank');
            else if (button.id === 'share-line') window.open(`https://social-plugins.line.me/lineit/share?url=${encodeURIComponent(url)}`, '_blank');
            else if (button.id === 'copy-link') {
                navigator.clipboard.writeText(url).then(() => alert('リンクがコピーされました'));
            }
        });
    });
}
