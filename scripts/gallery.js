(() => {
    const { categoryOrder, categoryLabels = {}, photos } = window.galleryData;
    const gallery = document.getElementById('gallery');
    const lightbox = document.getElementById('lightbox');
    const lightboxImg = document.getElementById('lightbox-img');
    const navGroup = document.getElementById('nav-group');
    const subtitle = document.querySelector('header .subtitle');
    const galleryLogo = document.getElementById('gallery-title');
    const titleCurrent = galleryLogo.querySelector('.title-layer-current');
    const likeStorageKey = 'astro-gallery-like-state-v1';

    const subcategoryLabels = {
        JUPITER: 'Jupiter',
        SATURN: 'Saturn',
        MARS: 'Mars',
        MERCURY: 'Mercury',
        URANUS: 'Uranus',
        NEPTUNE: 'Neptune',
        MOON: 'Moon',
        OVERVIEW: 'Overview',
        '2026.01.27': '2026.01.27'
    };

    const subcategoryOrders = {
        PLANETS: ['JUPITER', 'SATURN', 'MARS', 'MERCURY', 'URANUS', 'NEPTUNE', 'MOON', 'OVERVIEW'],
        PLAY: ['2026.01.27']
    };

    let currentCategory = 'ALL';
    let currentSubcategory = null;
    let likeState = loadLikeState();
    let isMessierMode = false;
    let subtitleTransitionTimer = null;

    function createStars() {
        const container = document.getElementById('stars-container');
        const starCount = 150;

        for (let i = 0; i < starCount; i++) {
            const star = document.createElement('div');
            star.className = 'star';
            const size = Math.random() * 2 + 1 + 'px';
            const x = Math.random() * 100 + '%';
            const y = Math.random() * 100 + '%';
            const duration = Math.random() * 3 + 2 + 's';
            const delay = Math.random() * 5 + 's';
            star.style.width = size;
            star.style.height = size;
            star.style.left = x;
            star.style.top = y;
            star.style.setProperty('--duration', duration);
            star.style.animationDelay = delay;
            container.appendChild(star);
        }
    }

    function shufflePhotos(items) {
        const copy = items.slice();
        for (let i = copy.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [copy[i], copy[j]] = [copy[j], copy[i]];
        }
        return copy;
    }

    function getMessierSortValue(photo) {
        const source = `${photo.title || ''} ${photo.meta || ''} ${photo.url || ''}`;
        const matches = [...source.matchAll(/M\s*(\d{1,3})/gi)]
            .map(match => Number(match[1]))
            .filter(Number.isFinite);

        if (matches.length > 0) {
            return Math.min(...matches);
        }

        return Number.MAX_SAFE_INTEGER;
    }

    function loadLikeState() {
        try {
            const raw = window.localStorage.getItem(likeStorageKey);
            if (!raw) {
                return { counts: {}, liked: {} };
            }

            const parsed = JSON.parse(raw);
            return {
                counts: parsed.counts || {},
                liked: parsed.liked || {}
            };
        } catch (error) {
            return { counts: {}, liked: {} };
        }
    }

    function saveLikeState() {
        try {
            window.localStorage.setItem(likeStorageKey, JSON.stringify(likeState));
        } catch (error) {
            // Ignore storage failures so the gallery still works without persistence.
        }
    }

    function getPhotoLikeKey(photo) {
        return photo.url;
    }

    function getPhotoLikeCount(photo) {
        return likeState.counts[getPhotoLikeKey(photo)] || 0;
    }

    function isPhotoLiked(photo) {
        return Boolean(likeState.liked[getPhotoLikeKey(photo)]);
    }

    function updateLikeButton(button, photo) {
        const liked = isPhotoLiked(photo);
        const count = getPhotoLikeCount(photo);
        const icon = button.querySelector('.like-icon');
        const countNode = button.querySelector('.like-count');

        button.classList.toggle('liked', liked);
        button.setAttribute('aria-pressed', liked ? 'true' : 'false');
        icon.textContent = liked ? '♥' : '♡';
        countNode.textContent = count;
    }

    function toggleLike(photo, button) {
        const key = getPhotoLikeKey(photo);
        const nextLiked = !Boolean(likeState.liked[key]);
        const currentCount = getPhotoLikeCount(photo);
        const nextCount = nextLiked ? currentCount + 1 : Math.max(0, currentCount - 1);

        likeState.liked[key] = nextLiked;
        likeState.counts[key] = nextCount;
        saveLikeState();
        updateLikeButton(button, photo);
    }

    function getCategoryPhotos(category, subcategory = null) {
        return photos.filter(photo =>
            Array.isArray(photo.tags)
            && photo.tags.includes(category)
            && (subcategory === null || photo.tags.includes(subcategory))
        );
    }

    function createNavButton(label, onClick, isActive = false, ariaLabel = '', index = 0, extraClass = '') {
        const button = document.createElement('button');
        button.className = 'nav-item';
        if (extraClass) {
            button.classList.add(extraClass);
        }
        button.type = 'button';
        button.textContent = label;
        button.setAttribute('aria-label', ariaLabel || label);
        button.style.setProperty('--i', index);
        if (isActive) {
            button.classList.add('active');
        }
        button.onclick = onClick;
        return button;
    }

    function setActiveNavButton(matchText) {
        navGroup.querySelectorAll('.nav-item').forEach(btn => {
            btn.classList.toggle('active', btn.textContent === matchText);
        });
    }

    function renderMainNav(activeCategory = 'ALL') {
        navGroup.innerHTML = '';

        if (isMessierMode) {
            return;
        }

        const items = [
            ['Home', 'ALL'],
            ...categoryOrder.map(category => [categoryLabels[category] || category, category])
        ];

        items.forEach(([label, value], index) => {
            navGroup.appendChild(createNavButton(
                label,
                () => filterPhotos(value),
                activeCategory === value,
                label,
                index
            ));
        });
    }

    function renderSubcategoryNav(category, activeSubcategory = null) {
        navGroup.innerHTML = '';

        const order = subcategoryOrders[category];
        if (!order || order.length === 0) {
            renderMainNav(category);
            return;
        }

        order.forEach((subcategory, index) => {
            if (getCategoryPhotos(category, subcategory).length === 0) {
                return;
            }

            navGroup.appendChild(createNavButton(
                subcategoryLabels[subcategory] || subcategory,
                () => filterPhotos(category, subcategory),
                activeSubcategory === subcategory,
                subcategoryLabels[subcategory] || subcategory,
                index + 1
            ));
        });
    }

    function getHomePhotos(limit = 4) {
        const homeCategories = categoryOrder.filter(category => category !== 'MESSIER');
        const buckets = homeCategories
            .map(category => shufflePhotos(getCategoryPhotos(category)))
            .filter(bucket => bucket.length > 0);
        const selected = [];
        const seen = new Set();

        while (selected.length < limit && buckets.some(bucket => bucket.length > 0)) {
            for (const bucket of buckets) {
                while (bucket.length > 0 && seen.has(bucket[0].url)) {
                    bucket.shift();
                }

                if (bucket.length === 0 || selected.length >= limit) {
                    continue;
                }

                const photo = bucket.shift();
                if (seen.has(photo.url)) {
                    continue;
                }

                seen.add(photo.url);
                selected.push(photo);
            }
        }

        return selected;
    }

    function renderPhotos(category = 'ALL', subcategory = null) {
        gallery.innerHTML = '';
        gallery.classList.toggle('gallery-messier', category === 'MESSIER');

        const items = category === 'ALL'
            ? getHomePhotos(4)
            : getCategoryPhotos(category, subcategory)
                .slice()
                .sort((a, b) => {
                    if (category === 'MESSIER') {
                        const messierDiff = getMessierSortValue(a) - getMessierSortValue(b);
                        if (messierDiff !== 0) {
                            return messierDiff;
                        }
                    }

                    return (a.sort || 0) - (b.sort || 0) || (a.title || '').localeCompare(b.title || '');
                });

        if (items.length === 0) {
            gallery.innerHTML = '<p style="text-align: center; color: var(--text-dim); padding: 50px 20px;">No images in this category yet.</p>';
            return;
        }

        items.forEach(photo => {
            const card = document.createElement('div');
            card.className = category === 'MESSIER' ? 'photo-card photo-card-messier' : 'photo-card';
            const isMobileMessier = category === 'MESSIER' && window.matchMedia('(max-width: 768px)').matches;
            card.innerHTML = `
                <div class="photo-media ${category === 'MESSIER' ? 'photo-media-messier' : ''}">
                    <img src="${photo.thumbnailUrl || photo.url}" alt="${photo.title}" loading="lazy" decoding="async" style="object-position: ${photo.thumbnailFocus || 'center center'};">
                </div>
                <div class="photo-info">
                    <div class="photo-header">
                        <div class="photo-title">${photo.title}</div>
                        ${isMobileMessier ? '' : `
                        <button class="like-button" type="button" aria-label="Like ${photo.title}" aria-pressed="false">
                            <span class="like-icon" aria-hidden="true"></span>
                            <span class="like-count"></span>
                        </button>
                        `}
                    </div>
                    ${isMobileMessier ? '' : `<div class="photo-meta">${photo.meta}</div>`}
                </div>
            `;
            const likeButton = card.querySelector('.like-button');
            if (likeButton) {
                updateLikeButton(likeButton, photo);
                likeButton.addEventListener('click', event => {
                    event.stopPropagation();
                    toggleLike(photo, likeButton);
                });
            }
            card.onclick = () => {
                lightboxImg.src = photo.url;
                lightbox.style.display = 'flex';
            };
            gallery.appendChild(card);
        });
    }

    function updateHeaderState(category) {
        isMessierMode = category === 'MESSIER';
        transitionSubtitle();
        syncNavState(!isMessierMode);
        galleryLogo.classList.toggle('clickable-title', isMessierMode);
    }

    function replayIntroLine(element, animationValue) {
        element.style.display = '';
        element.style.animation = 'none';
        element.style.opacity = '0';
        element.style.transform = 'translateY(20px)';
        void element.offsetWidth;
        element.style.animation = animationValue;
    }

    function transitionSubtitle() {
        if (subtitleTransitionTimer) {
            window.clearTimeout(subtitleTransitionTimer);
            subtitleTransitionTimer = null;
        }

        subtitle.classList.add('subtitle-hidden');
        subtitle.style.animation = 'none';
        void subtitle.offsetWidth;
        subtitle.classList.remove('subtitle-hidden');
        subtitle.style.animation = 'fadeInUp 1.2s 0.3s forwards';
        subtitleTransitionTimer = window.setTimeout(() => {
            subtitleTransitionTimer = null;
        }, 1250);
    }

    function syncNavState(visible) {
        if (visible) {
            navGroup.classList.remove('nav-hidden');
            navGroup.classList.remove('nav-exiting');
            navGroup.style.animation = 'none';
            void navGroup.offsetWidth;
            navGroup.style.animation = 'fadeInUp 1.2s 0.6s forwards';
            return;
        }

        navGroup.classList.add('nav-exiting');
        navGroup.classList.add('nav-hidden');
        navGroup.style.animation = '';
    }

    function replayGalleryTitle(nextTitle) {
        if (titleCurrent.textContent === nextTitle) {
            return;
        }

        titleCurrent.style.animation = 'none';
        titleCurrent.style.opacity = '0';
        titleCurrent.style.transform = 'translateY(20px)';
        titleCurrent.textContent = nextTitle;
        void titleCurrent.offsetWidth;
        titleCurrent.style.animation = 'fadeInUp 1.2s forwards';
    }

    function filterPhotos(category, subcategory = null) {
        currentCategory = category;
        currentSubcategory = subcategory;
        updateHeaderState(category);
        replayGalleryTitle(category === 'MESSIER' ? 'MESSIER CATALOG' : 'CELESTIAL GALLERY');

        if (category === 'ALL') {
            renderMainNav('ALL');
            renderPhotos('ALL');
            return;
        }

        const order = subcategoryOrders[category];
        if (order && subcategory === null) {
            const firstSubcategory = order.find(name => getCategoryPhotos(category, name).length > 0) || null;
            renderSubcategoryNav(category, firstSubcategory);
            renderPhotos(category, firstSubcategory);
            return;
        }

        if (order && subcategory !== null) {
            renderSubcategoryNav(category, subcategory);
            renderPhotos(category, subcategory);
            return;
        }

        if (category === 'MESSIER') {
            renderPhotos(category);
            return;
        }

        setActiveNavButton(category);
        renderPhotos(category);
    }

    window.filterPhotos = filterPhotos;
    galleryLogo.setAttribute('role', 'button');
    galleryLogo.setAttribute('tabindex', '0');
    galleryLogo.addEventListener('click', () => filterPhotos('ALL'));
    galleryLogo.addEventListener('keydown', event => {
        if (event.key === 'Enter' || event.key === ' ') {
            event.preventDefault();
            filterPhotos('ALL');
        }
    });
    createStars();
    renderMainNav('ALL');
    renderPhotos();
})();
