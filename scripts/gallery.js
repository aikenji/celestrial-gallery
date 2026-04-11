(() => {
    const { categoryOrder, subcategoryOrder = {}, photos, photosByCategory } = window.galleryData;
    const gallery = document.getElementById('gallery');
    const lightbox = document.getElementById('lightbox');
    const lightboxImg = document.getElementById('lightbox-img');
    const navGroup = document.getElementById('nav-group');

    let currentCategory = 'ALL';
    let currentSubcategory = null;

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

    function getCategoryPhotos(category, subcategory = null) {
        const categoryPhotos = photosByCategory?.[category];
        if (!categoryPhotos) {
            return [];
        }

        if (Array.isArray(categoryPhotos)) {
            return categoryPhotos.map(photo => ({
                ...photo,
                category
            }));
        }

        if (!subcategory) {
            return Object.entries(categoryPhotos).flatMap(([key, items]) =>
                items.map(item => ({
                    ...item,
                    category,
                    subcategory: key
                }))
            );
        }

        return (categoryPhotos[subcategory] || []).map(item => ({
            ...item,
            category,
            subcategory
        }));
    }

    function createNavButton(label, onClick, isActive = false, ariaLabel = '', index = 0) {
        const button = document.createElement('button');
        button.className = 'nav-item';
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

        const items = [
            ['Home', 'ALL'],
            ['Planet', 'PLANET'],
            ['Nebula', 'NEBULA'],
            ['Galaxy', 'GALAXY'],
            ['Comets', 'COMETS']
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

    function renderSubcategoryNav(category, activeSubcategory = 'ALL') {
        navGroup.innerHTML = '';

        const order = subcategoryOrder[category];
        if (!order || order.length === 0) {
            renderMainNav(category);
            return;
        }

        navGroup.appendChild(createNavButton(
            '↩ Return',
            () => filterPhotos('ALL'),
            false,
            'Back to main categories',
            0
        ));

        order.forEach((subcategory, index) => {
            navGroup.appendChild(createNavButton(
                subcategory,
                () => filterPhotos(category, subcategory),
                activeSubcategory === subcategory,
                subcategory,
                index + 1
            ));
        });
    }

    function getHomePhotos(limit = 4) {
        const buckets = categoryOrder
            .map(category => shufflePhotos(getCategoryPhotos(category)))
            .filter(bucket => bucket.length > 0);
        const selected = [];

        while (selected.length < limit && buckets.some(bucket => bucket.length > 0)) {
            for (const bucket of buckets) {
                if (bucket.length === 0 || selected.length >= limit) {
                    continue;
                }
                selected.push(bucket.shift());
            }
        }

        return selected;
    }

    function renderPhotos(category = 'ALL', subcategory = null) {
        gallery.innerHTML = '';

        const items = category === 'ALL'
            ? getHomePhotos(4)
            : getCategoryPhotos(category, subcategory)
                .slice()
                .sort((a, b) => (a.sort || 0) - (b.sort || 0));

        if (items.length === 0) {
            gallery.innerHTML = '<p style="text-align: center; color: var(--text-dim); padding: 50px 20px;">No images in this category yet.</p>';
            return;
        }

        items.forEach(photo => {
            const card = document.createElement('div');
            card.className = 'photo-card';
            card.innerHTML = `
                <img src="${photo.url}" alt="${photo.title}" loading="lazy" decoding="async">
                <div class="photo-info">
                    <div class="photo-title">${photo.title}</div>
                    <div class="photo-meta">${photo.meta}</div>
                </div>
            `;
            card.onclick = () => {
                lightboxImg.src = photo.url;
                lightbox.style.display = 'flex';
            };
            gallery.appendChild(card);
        });
    }

    function filterPhotos(category, subcategory = null) {
        const previousCategory = currentCategory;
        const previousSubcategory = currentSubcategory;

        if (category === 'ALL') {
            currentCategory = 'ALL';
            currentSubcategory = null;
            renderMainNav('ALL');
            renderPhotos('ALL');
            return;
        }

        const order = subcategoryOrder[category];
        const firstSubcategory = order && order.length > 0 ? order[0] : null;

        if (subcategory === null) {
            currentCategory = category;
            currentSubcategory = firstSubcategory;

            if (firstSubcategory) {
                renderSubcategoryNav(category, firstSubcategory);
                renderPhotos(category, firstSubcategory);
            } else {
                if (subcategoryOrder[previousCategory]?.length > 0) {
                    renderMainNav(category);
                } else {
                    setActiveNavButton(category);
                }
                renderPhotos(category, null);
            }

            return;
        }

        if (previousCategory === category) {
            if (previousSubcategory === subcategory) {
                return;
            }

            currentSubcategory = subcategory;
            setActiveNavButton(subcategory);
            renderPhotos(category, subcategory);
            return;
        }

        currentCategory = category;
        currentSubcategory = subcategory;
        renderSubcategoryNav(category, subcategory);
        renderPhotos(category, subcategory);
    }

    window.filterPhotos = filterPhotos;
    createStars();
    renderMainNav('ALL');
    renderPhotos();
})();
