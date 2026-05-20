(() => {
    const ns = window.AstroGallery || (window.AstroGallery = {});
    const { core, likes, messier, messierData } = ns;
    const logger = ns.logger.create('ui');
    const { categoryOrder, categoryLabels, subcategoryLabels, subcategoryOrders, elements, state, getCategoryPhotos, getHomePhotos } = core;

    function createNavButton(label, onClick, isActive = false, ariaLabel = '') {
        const button = document.createElement('button');
        button.className = 'nav-item';
        button.type = 'button';
        button.textContent = label;
        button.setAttribute('aria-label', ariaLabel || label);
        if (isActive) {
            button.classList.add('active');
        }
        button.onclick = onClick;
        return button;
    }

    function appendSearchToNav(container) {
        const searchWrapper = document.createElement('div');
        searchWrapper.className = 'header-controls';

        const toggle = document.createElement('button');
        toggle.className = 'search-toggle';
        toggle.type = 'button';
        toggle.setAttribute('aria-label', 'Toggle Search');
        toggle.innerHTML = '<span class="search-icon"></span>';
        
        const searchBox = document.createElement('div');
        searchBox.className = 'search-container';
        
        const input = document.createElement('input');
        input.type = 'text';
        input.id = 'search-input';
        input.placeholder = 'Global search...';
        input.setAttribute('aria-label', 'Search all photos');
        
        searchBox.appendChild(input);
        searchWrapper.appendChild(toggle);
        searchWrapper.appendChild(searchBox);
        container.appendChild(searchWrapper);

        elements.searchToggle = toggle;
        elements.searchContainer = searchBox;
        elements.searchInput = input;

        toggle.addEventListener('click', () => {
            const isActive = searchBox.classList.toggle('is-active');
            toggle.classList.toggle('is-active');
            
            if (isActive) {
                input.focus();
            } else {
                input.value = '';
                state.searchQuery = '';
                renderPhotos(state.currentCategory, state.currentSubcategory);
            }
        });

        input.addEventListener('input', (e) => {
            state.searchQuery = e.target.value;
            renderPhotos(state.currentCategory, state.currentSubcategory);
        });

        if (state.searchQuery) {
            input.value = state.searchQuery;
            searchBox.classList.add('is-active');
            toggle.classList.add('is-active');
        }
    }

    function setActiveNavButton(matchText) {
        elements.navGroup.querySelectorAll('.nav-item').forEach(button => {
            const label = button.textContent;
            button.classList.toggle('active', label === matchText);
        });
    }

    function renderMainNav(activeCategory = 'ALL') {
        elements.navGroup.innerHTML = '';
        if (state.isMessierMode) return;

        const items = [
            ['Home', 'ALL'],
            ...categoryOrder.map(category => [categoryLabels[category] || category, category])
        ];

        items.forEach(([label, value]) => {
            elements.navGroup.appendChild(createNavButton(
                label,
                () => filterPhotos(value),
                activeCategory === value
            ));
        });

        appendSearchToNav(elements.navGroup);
    }

    function renderSubcategoryNav(category, activeSubcategory = null) {
        elements.navGroup.innerHTML = '';
        const order = subcategoryOrders[category];

        if (!order || order.length === 0) {
            renderMainNav(category);
            return;
        }

        order.forEach((subcategory) => {
            if (category !== 'MESSIER' && getCategoryPhotos(category, subcategory).length === 0) return;

            const label = subcategoryLabels[subcategory] || subcategory;
            elements.navGroup.appendChild(createNavButton(
                label,
                () => filterPhotos(category, subcategory),
                activeSubcategory === subcategory
            ));
        });

        appendSearchToNav(elements.navGroup);
    }

    function renderEmptyState() {
        elements.gallery.innerHTML = '<p style="text-align: center; color: var(--text-dim); padding: 50px 20px;">No images in this category yet.</p>';
    }

    function renderPhotoCards(items, category) {
        items.forEach(photo => {
            const messierId = category === 'MESSIER' ? messierData.getPhotoMessierId(photo) : null;
            const card = document.createElement('div');
            card.className = category === 'MESSIER' ? 'photo-card photo-card-messier' : 'photo-card';
            const isMobileMessier = category === 'MESSIER' && window.matchMedia('(max-width: 768px)').matches;

            if (messierId) card.dataset.messierId = messierId;

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
                likes.updateLikeButton(likeButton, photo);
                likeButton.addEventListener('click', event => {
                    event.stopPropagation();
                    likes.toggleLike(photo, likeButton);
                });
            }

            card.onclick = () => {
                elements.lightboxImg.src = photo.url;
                elements.lightbox.style.display = 'flex';
            };

            elements.gallery.appendChild(card);
        });
    }

    function renderPhotos(category = 'ALL', subcategory = null) {
        elements.gallery.innerHTML = '';
        elements.gallery.classList.toggle('gallery-messier', category === 'MESSIER');

        const isChartMode = category === 'MESSIER' && subcategory === 'CHART';
        
        if (state.searchQuery) {
            messier.showMessierChart(false);
        } else {
            messier.showMessierChart(isChartMode);
            if (isChartMode) {
                messier.renderMessierChart();
                return;
            }
        }

        let items;
        if (state.searchQuery) {
            const query = state.searchQuery.toLowerCase();
            items = core.photos.filter(photo =>
                photo.title.toLowerCase().includes(query) ||
                (photo.meta && photo.meta.toLowerCase().includes(query))
            );
        } else {
            items = category === 'ALL'
                ? getHomePhotos(4)
                : getCategoryPhotos(category, subcategory)
                    .slice()
                    .sort((left, right) => {
                        if (category === 'MESSIER') {
                            const messierDiff = messierData.getMessierSortValue(left) - messierData.getMessierSortValue(right);
                            if (messierDiff !== 0) return messierDiff;
                        }
                        return (left.sort || 0) - (right.sort || 0) || (left.title || '').localeCompare(right.title || '');
                    });
        }

        if (items.length === 0) {
            renderEmptyState();
            return;
        }

        renderPhotoCards(items, category);
        if (category === 'MESSIER') messier.scrollToPendingMessierCard();
    }

    function transitionSubtitle() {
        elements.subtitle.classList.remove('subtitle-hidden');
    }

    function syncNavState() {
        elements.navGroup.classList.remove('nav-hidden', 'nav-exiting');
    }

    function replayGalleryTitle(nextTitle) {
        elements.titleCurrent.textContent = nextTitle;
    }

    function updateHeaderState(category) {
        state.isMessierMode = category === 'MESSIER';
        transitionSubtitle();
        syncNavState();
        elements.galleryLogo.classList.toggle('clickable-title', state.isMessierMode);
    }

    function filterPhotos(category, subcategory = null) {
        state.currentCategory = category;
        state.currentSubcategory = subcategory;

        updateHeaderState(category);

        let title = 'CELESTIAL GALLERY';
        if (category === 'MESSIER') {
            title = subcategory === 'CHART' ? 'MESSIER SKY CHART' : 'MESSIER CATALOG';
        }
        replayGalleryTitle(title);

        if (category === 'ALL') {
            renderMainNav('ALL');
            renderPhotos('ALL');
            return;
        }

        const order = subcategoryOrders[category];
        if (order && subcategory === null) {
            let firstSubcategory = order.find(name => getCategoryPhotos(category, name).length > 0) || order[0];
            if (category === 'MESSIER') {
                firstSubcategory = 'CHART';
                state.currentSubcategory = 'CHART';
                replayGalleryTitle('MESSIER SKY CHART');
            }
            renderSubcategoryNav(category, firstSubcategory);
            renderPhotos(category, firstSubcategory);
            return;
        }

        if (order && subcategory !== null) {
            const label = subcategoryLabels[subcategory] || subcategory;
            setActiveNavButton(label);
            renderSubcategoryNav(category, subcategory);
            renderPhotos(category, subcategory);
            return;
        }

        if (category === 'MESSIER') {
            renderPhotos(category, subcategory);
            return;
        }

        const label = categoryLabels[category] || category;
        setActiveNavButton(label);
        renderPhotos(category);
    }

    function bindGlobalEvents() {
        window.filterPhotos = filterPhotos;
        elements.galleryLogo.addEventListener('click', () => filterPhotos('ALL'));
        messier.bindToggleEvents();
    }

    ns.ui = {
        bindGlobalEvents,
        filterPhotos,
        renderMainNav,
        renderPhotos
    };
})();
