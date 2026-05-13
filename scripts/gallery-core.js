(() => {
    const ns = window.AstroGallery || (window.AstroGallery = {});
    const logger = ns.logger.create('core');
    const { categoryOrder, categoryLabels = {}, photos } = window.galleryData;

    const subcategoryLabels = {
        SOLAR: 'Sun',
        VENUS: 'Venus',
        JUPITER: 'Jupiter',
        SATURN: 'Saturn',
        MARS: 'Mars',
        MERCURY: 'Mercury',
        URANUS: 'Uranus',
        NEPTUNE: 'Neptune',
        MOON: 'Moon',
        OVERVIEW: 'Overview',
        '2026.01.27': '2026.01.27',
        CHART: 'Chart',
        CATALOG: 'Catalog'
    };

    const subcategoryOrders = {
        PLANETS: ['SOLAR', 'MOON', 'MERCURY', 'VENUS', 'MARS', 'JUPITER', 'SATURN', 'URANUS', 'NEPTUNE', 'OVERVIEW'],
        PLAY: ['2026.01.27'],
        MESSIER: ['CHART', 'CATALOG']
    };

    const elements = {
        gallery: document.getElementById('gallery'),
        lightbox: document.getElementById('lightbox'),
        lightboxImg: document.getElementById('lightbox-img'),
        navGroup: document.getElementById('nav-group'),
        searchToggle: document.getElementById('search-toggle'),
        searchContainer: document.getElementById('search-container'),
        searchInput: document.getElementById('search-input'),
        subtitle: document.querySelector('header .subtitle'),
        galleryLogo: document.getElementById('gallery-title'),
        titleCurrent: document.querySelector('#gallery-title .title-layer-current'),
        messierChartPanel: document.getElementById('messier-chart-panel'),
        messierChart: document.getElementById('messier-chart'),
        messierAltitudeChart: document.getElementById('messier-altitude-chart'),
        messierDatePrev: document.getElementById('messier-date-prev'),
        messierDateToday: document.getElementById('messier-date-today'),
        messierDateNext: document.getElementById('messier-date-next'),
        messierDateInput: document.getElementById('messier-date-input'),
        messierChartFrame: document.querySelector('.messier-chart-frame'),
        messierCapturedCount: document.getElementById('messier-captured-count'),
        messierTotalCount: document.getElementById('messier-total-count'),
        messierHoverCard: document.getElementById('messier-hover-card'),
        messierHoverImage: document.getElementById('messier-hover-image'),
        messierHoverId: document.getElementById('messier-hover-id'),
        messierHoverMeta: document.getElementById('messier-hover-meta'),
        toggleEclipticBtn: document.getElementById('toggle-ecliptic'),
        togglePlanetsBtn: document.getElementById('toggle-planets'),
        togglePlayBtn: document.getElementById('toggle-play'),
        togglePolarBtn: document.querySelector('.messier-view-toggle'),
        toggleConstellationsBtn: document.getElementById('toggle-constellations')
    };

    const state = {
        currentCategory: 'ALL',
        currentSubcategory: null,
        searchQuery: '',
        isMessierMode: false,
        subtitleTransitionTimer: null
    };

    function createStars() {
        const container = document.getElementById('stars-container');
        const starCount = 150;

        for (let i = 0; i < starCount; i++) {
            const star = document.createElement('div');
            star.className = 'star';
            const size = `${Math.random() * 2 + 1}px`;
            const x = `${Math.random() * 100}%`;
            const y = `${Math.random() * 100}%`;
            const duration = `${Math.random() * 3 + 2}s`;
            const delay = `${Math.random() * 5}s`;
            star.style.width = size;
            star.style.height = size;
            star.style.left = x;
            star.style.top = y;
            star.style.setProperty('--duration', duration);
            star.style.animationDelay = delay;
            container.appendChild(star);
        }

        logger.debug('Created star field', { starCount });
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
        if (category === 'MESSIER') {
            if (subcategory === 'CHART') {
                return [];
            }

            return photos.filter(photo => Array.isArray(photo.tags) && photo.tags.includes('MESSIER'));
        }

        return photos.filter(photo =>
            Array.isArray(photo.tags)
            && photo.tags.includes(category)
            && (subcategory === null || photo.tags.includes(subcategory))
        );
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

        logger.debug('Selected home photos', { limit, count: selected.length });
        return selected;
    }

    ns.core = {
        categoryOrder,
        categoryLabels,
        photos,
        subcategoryLabels,
        subcategoryOrders,
        elements,
        state,
        createStars,
        getCategoryPhotos,
        getHomePhotos
    };

    logger.info('Core initialized', {
        photos: photos.length,
        categories: categoryOrder.length
    });
})();
