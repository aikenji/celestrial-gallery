(() => {
    const ns = window.AstroGallery || (window.AstroGallery = {});
    const { core, likes, messier, messierData } = ns;
    const logger = ns.logger.create('ui');
    const { categoryOrder, categoryLabels, subcategoryLabels, subcategoryOrders, elements, state, getCategoryPhotos, getHomePhotos } = core;

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
        elements.navGroup.querySelectorAll('.nav-item').forEach(button => {
            button.classList.toggle('active', button.textContent === matchText);
        });
    }

    function renderMainNav(activeCategory = 'ALL') {
        elements.navGroup.innerHTML = '';

        if (state.isMessierMode) {
            logger.debug('Skipped main nav render while in messier mode');
            return;
        }

        const items = [
            ['Home', 'ALL'],
            ...categoryOrder.map(category => [categoryLabels[category] || category, category])
        ];

        items.forEach(([label, value], index) => {
            elements.navGroup.appendChild(createNavButton(
                label,
                () => filterPhotos(value),
                activeCategory === value,
                label,
                index
            ));
        });

        logger.debug('Rendered main nav', { activeCategory, itemCount: items.length });
    }

    function renderSubcategoryNav(category, activeSubcategory = null) {
        elements.navGroup.innerHTML = '';
        const order = subcategoryOrders[category];

        if (!order || order.length === 0) {
            renderMainNav(category);
            return;
        }

        order.forEach((subcategory, index) => {
            if (category !== 'MESSIER' && getCategoryPhotos(category, subcategory).length === 0) {
                return;
            }

            elements.navGroup.appendChild(createNavButton(
                subcategoryLabels[subcategory] || subcategory,
                () => filterPhotos(category, subcategory),
                activeSubcategory === subcategory,
                subcategoryLabels[subcategory] || subcategory,
                index + 1
            ));
        });

        logger.debug('Rendered subcategory nav', { category, activeSubcategory });
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

            if (messierId) {
                card.dataset.messierId = messierId;
            }

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
                            if (messierDiff !== 0) {
                                return messierDiff;
                            }
                        }
                        return (left.sort || 0) - (right.sort || 0) || (left.title || '').localeCompare(right.title || '');
                    });
        }

        logger.info('Rendering photos', {
            category,
            subcategory,
            searchQuery: state.searchQuery,
            count: items.length
        });

        if (items.length === 0) {
            renderEmptyState();
            return;
        }

        renderPhotoCards(items, category);

        if (category === 'MESSIER') {
            messier.scrollToPendingMessierCard();
        }
    }

    function transitionSubtitle() {
        if (state.subtitleTransitionTimer) {
            window.clearTimeout(state.subtitleTransitionTimer);
            state.subtitleTransitionTimer = null;
        }

        elements.subtitle.classList.add('subtitle-hidden');
        elements.subtitle.style.animation = 'none';
        void elements.subtitle.offsetWidth;
        elements.subtitle.classList.remove('subtitle-hidden');
        elements.subtitle.style.animation = 'fadeInUp 1.2s 0.3s forwards';
        state.subtitleTransitionTimer = window.setTimeout(() => {
            state.subtitleTransitionTimer = null;
        }, 1250);
    }

    function syncNavState(visible) {
        if (visible) {
            elements.navGroup.classList.remove('nav-hidden');
            elements.navGroup.classList.remove('nav-exiting');
            elements.navGroup.style.animation = 'none';
            void elements.navGroup.offsetWidth;
            elements.navGroup.style.animation = 'fadeInUp 1.2s 0.6s forwards';
            return;
        }

        elements.navGroup.classList.add('nav-exiting');
        elements.navGroup.classList.add('nav-hidden');
        elements.navGroup.style.animation = '';
    }

    function replayGalleryTitle(nextTitle) {
        if (elements.titleCurrent.textContent === nextTitle) {
            return;
        }

        elements.titleCurrent.style.animation = 'none';
        elements.titleCurrent.style.opacity = '0';
        elements.titleCurrent.style.transform = 'translateY(20px)';
        elements.titleCurrent.textContent = nextTitle;
        void elements.titleCurrent.offsetWidth;
        elements.titleCurrent.style.animation = 'fadeInUp 1.2s forwards';
    }

    function updateHeaderState(category) {
        state.isMessierMode = category === 'MESSIER';
        transitionSubtitle();
        syncNavState(true);
        elements.galleryLogo.classList.toggle('clickable-title', state.isMessierMode);
    }

    function filterPhotos(category, subcategory = null) {
        state.currentCategory = category;
        state.currentSubcategory = subcategory;

        logger.info('Filtering photos', { category, subcategory });
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
            renderSubcategoryNav(category, subcategory);
            renderPhotos(category, subcategory);
            return;
        }

        if (category === 'MESSIER') {
            renderPhotos(category, subcategory);
            return;
        }

        setActiveNavButton(category);
        renderPhotos(category);
    }

    function bindGlobalEvents() {
        window.filterPhotos = filterPhotos;

        elements.galleryLogo.setAttribute('role', 'button');
        elements.galleryLogo.setAttribute('tabindex', '0');
        elements.galleryLogo.addEventListener('click', () => filterPhotos('ALL'));
        elements.galleryLogo.addEventListener('keydown', event => {
            if (event.key === 'Enter' || event.key === ' ') {
                event.preventDefault();
                filterPhotos('ALL');
            }
        });

        messier.bindToggleEvents();

        if (elements.searchToggle) {
            elements.searchToggle.addEventListener('click', () => {
                const isActive = elements.searchContainer.classList.toggle('is-active');
                elements.searchToggle.classList.toggle('is-active');
                if (isActive) {
                    elements.searchInput.focus();
                } else {
                    elements.searchInput.value = '';
                    state.searchQuery = '';
                    filterPhotos(state.currentCategory, state.currentSubcategory);
                }
            });
        }

        if (elements.searchInput) {
            elements.searchInput.addEventListener('input', (e) => {
                state.searchQuery = e.target.value;
                if (state.searchQuery) {
                    replayGalleryTitle('SEARCH RESULTS');
                    renderPhotos(state.currentCategory, state.currentSubcategory);
                } else {
                    filterPhotos(state.currentCategory, state.currentSubcategory);
                }
            });
        }

        logger.debug('Bound global UI events');
    }

    ns.ui = {
        bindGlobalEvents,
        filterPhotos,
        renderMainNav,
        renderPhotos
    };
})();
