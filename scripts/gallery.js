(() => {
    const { categoryOrder, categoryLabels = {}, photos } = window.galleryData;
    const gallery = document.getElementById('gallery');
    const lightbox = document.getElementById('lightbox');
    const lightboxImg = document.getElementById('lightbox-img');
    const navGroup = document.getElementById('nav-group');
    const subtitle = document.querySelector('header .subtitle');
    const galleryLogo = document.getElementById('gallery-title');
    const titleCurrent = galleryLogo.querySelector('.title-layer-current');
    const messierChartPanel = document.getElementById('messier-chart-panel');
    const messierChart = document.getElementById('messier-chart');
    const messierChartFrame = document.querySelector('.messier-chart-frame');
    const messierCapturedCount = document.getElementById('messier-captured-count');
    const messierTotalCount = document.getElementById('messier-total-count');
    const messierHoverCard = document.getElementById('messier-hover-card');
    const messierHoverImage = document.getElementById('messier-hover-image');
    const messierHoverId = document.getElementById('messier-hover-id');
    const messierHoverMeta = document.getElementById('messier-hover-meta');
    const toggleEclipticBtn = document.getElementById('toggle-ecliptic');
    const toggleConstellationsBtn = document.getElementById('toggle-constellations');
    const likeStorageKey = 'astro-gallery-like-state-v1';
    const messierCatalog = Array.isArray(window.messierCatalogData) ? window.messierCatalogData : [];

    // Chart Settings
    let showEcliptic = false;
    let showConstellations = false;

    const constellationData = {
        "Andromeda": [
            [[30.9748, 42.3297], [17.433, 35.6206], [9.832, 30.861], [2.0969, 29.0904]],
            [[14.3017, 23.4176], [11.8347, 24.2672], [9.6389, 29.3118], [9.832, 30.861], [9.2202, 33.7193], [-5.4658, 43.2681], [-14.5197, 42.326]],
            [[-5.4658, 43.2681], [-4.8979, 44.3339], [-5.609, 46.4582]],
            [[17.433, 35.6206], [14.1884, 38.4993], [12.4535, 41.0789], [17.3755, 47.2418], [24.4982, 48.6282]],
            [[-4.8979, 44.3339], [-3.4915, 46.4203]]
        ],
        "Cassiopeia": [
            [[28.5989, 63.6701], [21.454, 60.2353], [14.1772, 60.7167], [10.1268, 56.5373], [2.2945, 59.1498]]
        ],
        "Cygnus": [
            [[-41.7659, 30.2269], [-48.4472, 33.9703], [-54.4429, 40.2567], [-63.7563, 45.1308], [-67.5735, 51.7298], [-70.7243, 53.3685]],
            [[-49.642, 45.2803], [-54.4429, 40.2567], [-60.9235, 35.0834], [-67.3197, 27.9597]]
        ],
        "Hercules": [
            [[-114.5199, 19.1531], [-112.445, 21.4896], [-109.6785, 31.6027], [-109.276, 38.9223], [-111.4742, 42.437], [-115.0648, 46.3134], [-117.8076, 44.9349], [-121.8311, 42.4515]],
            [[-109.6785, 31.6027], [-104.9276, 30.9264]],
            [[-109.276, 38.9223], [-101.2382, 36.8092]],
            [[-90.9367, 37.2505], [-99.0794, 37.1459], [-101.2382, 36.8092], [-104.9276, 30.9264], [-101.242, 24.8392], [-93.3853, 27.7207], [-90.5588, 29.2479], [-88.1144, 28.7625]],
            [[-101.3381, 14.3903], [-112.445, 21.4896]]
        ],
        "Leo": [
            [[152.093, 11.9672], [151.8331, 16.7627], [154.9931, 19.8415], [168.5271, 20.5237], [177.2649, 14.5721], [168.56, 15.4296], [152.093, 11.9672]],
            [[154.9931, 19.8415], [154.1726, 23.4173], [148.1909, 26.007], [146.4628, 23.7743]]
        ],
        "Lyra": [
            [[-78.8068, 37.6051], [-78.9051, 39.6127], [-80.7653, 38.7837], [-78.8068, 37.6051], [-76.3738, 36.8986], [-75.2641, 32.6896], [-77.48, 33.3627], [-78.8068, 37.6051]]
        ],
        "Orion": [
            [[91.893, 14.7685], [88.5958, 20.2762], [90.9799, 20.1385], [92.985, 14.2088], [90.5958, 9.6473], [88.7929, 7.4071], [81.2828, 6.3497], [73.7239, 10.1508]],
            [[74.6371, 1.714], [73.5629, 2.4407], [72.8015, 5.6051], [72.46, 6.9613], [72.653, 8.9002], [73.7239, 10.1508], [74.0928, 13.5145], [76.1423, 15.4041], [77.4248, 15.5972]],
            [[78.6345, -8.2016], [81.1192, -2.3971], [83.0017, -0.2991], [81.2828, 6.3497], [83.7845, 9.9342], [88.7929, 7.4071], [85.1897, -1.9426], [86.9391, -9.6696]],
            [[85.1897, -1.9426], [84.0534, -1.2019], [83.0017, -0.2991]]
        ],
        "Sagittarius": [
            [[-85.5932, -36.7617], [-83.957, -34.3846], [-84.7515, -29.8281], [-83.0073, -25.4217], [-86.5591, -21.0588]],
            [[-69.3404, -44.459], [-69.0284, -40.6159], [-74.347, -29.8801], [-78.5859, -26.9908], [-83.0073, -25.4217]],
            [[-61.1846, -41.8683], [-60.0659, -35.2763], [-61.0402, -26.2995], [-65.8232, -24.8836], [-68.6813, -24.5086], [-71.1149, -25.2567], [-76.1836, -26.2967], [-78.5859, -26.9908], [-84.7515, -29.8281], [-88.548, -30.4241], [-83.957, -34.3846], [-74.347, -29.8801], [-73.265, -27.6704], [-76.1836, -26.2967], [-73.8292, -21.7415], [-72.559, -21.0236], [-70.5913, -18.9529], [-69.5818, -17.8472], [-69.5682, -15.955]],
            [[-73.8292, -21.7415], [-75.5675, -21.1067], [-76.4576, -22.7448], [-76.1836, -26.2967]]
        ],
        "Scorpio": [
            [[-120.287, -26.1141], [-119.9166, -22.6217], [-118.6407, -19.8055]],
            [[-119.9166, -22.6217], [-114.7028, -25.5928], [-112.6481, -26.432], [-111.0294, -28.216], [-107.4591, -34.2932], [-107.0324, -38.0474], [-106.3541, -42.3613], [-101.9617, -43.2392], [-95.6703, -42.9978], [-93.1038, -40.127], [-94.378, -39.03], [-96.5978, -37.1038]]
        ],
        "Taurus": [
            [[84.4112, 21.1425], [68.9802, 16.5093], [67.1656, 15.8709], [64.9483, 15.6276], [65.7337, 17.5425], [67.1542, 19.1804], [81.573, 28.6075]],
            [[64.9483, 15.6276], [60.1701, 12.4903], [51.7923, 9.7327], [60.7891, 5.9893]],
            [[51.7923, 9.7327], [51.2033, 9.0289], [54.2183, 0.4017]]
        ],
        "Ursa Major": [
            [[-176.1435, 57.0326], [165.932, 61.751], [165.4603, 56.3824], [178.4577, 53.6948], [-176.1435, 57.0326], [-166.4927, 55.9598], [-159.0186, 54.9254], [-153.1148, 49.3133]],
            [[178.4577, 53.6948], [176.5126, 47.7794], [169.6197, 33.0943], [169.5468, 31.5308]],
            [[176.5126, 47.7794], [167.4159, 44.4985], [155.5823, 41.4995]],
            [[167.4159, 44.4985], [154.2741, 42.9144]],
            [[165.932, 61.751], [142.8821, 63.0619], [127.5661, 60.7182], [147.7473, 59.0387], [165.4603, 56.3824]],
            [[165.4603, 56.3824], [148.0265, 54.0643], [143.2143, 51.6773], [134.8019, 48.0418]],
            [[135.9064, 47.1565], [143.2143, 51.6773]]
        ],
        "Virgo": [
            [[176.4648, 6.5294], [177.6738, 1.7647], [-175.0235, -0.6668], [-169.5848, -1.4494], [-162.5125, -5.539], [-158.7018, -11.1613], [-145.9964, -6.0005], [-139.2349, -5.6582]],
            [[-164.4558, 10.9592], [-166.0991, 3.3975], [-169.5848, -1.4494]],
            [[-162.5125, -5.539], [-156.3267, -0.5958], [-149.5884, 1.5445], [-138.4378, 1.8929]]
        ]
    };

    // Location Config
    const CFG_LOC = {
        name: 'Changzhou, CN',
        lat: 31.811,
        lon: 119.974
    };

    function getAstroDetails() {
        const now = new Date();
        const year = now.getUTCFullYear();
        const month = now.getUTCMonth() + 1;
        const day = now.getUTCDate();
        const hours = now.getUTCHours();
        const minutes = now.getUTCMinutes();
        const seconds = now.getUTCSeconds();
        const ut = hours + minutes / 60 + seconds / 3600;

        const jd = 367 * year - Math.floor(7 * (year + Math.floor((month + 9) / 12)) / 4) + Math.floor(275 * month / 9) + day + 1721013.5 + ut / 24;
        const d = jd - 2451545.0;

        const gmst = (280.46061837 + 360.98564736629 * d) % 360;
        const lst = (gmst + CFG_LOC.lon + 360) % 360;

        const L = (280.460 + 0.9856474 * d) % 360;
        const g = (357.528 + 0.9856003 * d) % 360;
        const sunLong = L + 1.915 * Math.sin(g * Math.PI / 180) + 0.020 * Math.sin(2 * g * Math.PI / 180);
        const epsilon = 23.439 - 0.0000004 * d;
        const sunRa = (Math.atan2(Math.cos(epsilon * Math.PI / 180) * Math.sin(sunLong * Math.PI / 180), Math.cos(sunLong * Math.PI / 180)) * 180 / Math.PI + 360) % 360;
        const sunDec = Math.asin(Math.sin(epsilon * Math.PI / 180) * Math.sin(sunLong * Math.PI / 180)) * 180 / Math.PI;

        const midnightRa = (sunRa + 180) % 360;

        // Sun Altitude
        const phi = CFG_LOC.lat * Math.PI / 180;
        const delta = sunDec * Math.PI / 180;
        const H = (lst - sunRa) * Math.PI / 180;
        const sinAlt = Math.sin(phi) * Math.sin(delta) + Math.cos(phi) * Math.cos(delta) * Math.cos(H);
        const sunAlt = Math.asin(sinAlt) * 180 / Math.PI;

        let nightStatus = 'Day';
        if (sunAlt <= -18) {
            nightStatus = 'Night';
        } else if (sunAlt <= -12) {
            nightStatus = 'A.Twilight';
        } else if (sunAlt <= -6) {
            nightStatus = 'N.Twilight';
        } else if (sunAlt <= 0) {
            nightStatus = 'C.Twilight';
        }

        const moonL = (218.316 + 13.176396 * d) % 360;
        const moonM = (134.963 + 13.064993 * d) % 360;
        const moonF = (93.272 + 13.229350 * d) % 360;
        const moonLong = moonL + 6.289 * Math.sin(moonM * Math.PI / 180);
        const moonLat = 5.128 * Math.sin(moonF * Math.PI / 180);
        const moonRa = Math.atan2(Math.sin(moonLong * Math.PI / 180) * Math.cos(epsilon * Math.PI / 180) - Math.tan(moonLat * Math.PI / 180) * Math.sin(epsilon * Math.PI / 180), Math.cos(moonLong * Math.PI / 180)) * 180 / Math.PI;
        const moonDec = Math.asin(Math.sin(moonLat * Math.PI / 180) * Math.cos(epsilon * Math.PI / 180) + Math.cos(moonLat * Math.PI / 180) * Math.sin(epsilon * Math.PI / 180) * Math.sin(moonLong * Math.PI / 180)) * 180 / Math.PI;

        const moonPhaseAngle = (moonLong - sunLong + 360) % 360;
        const moonIllumination = (1 - Math.cos(moonPhaseAngle * Math.PI / 180)) / 2;

        return {
            now,
            lst,
            midnightRa,
            sun: { ra: sunRa, dec: sunDec, alt: sunAlt, status: nightStatus },
            moon: { ra: (moonRa + 360) % 360, dec: moonDec, phase: moonPhaseAngle, illumination: moonIllumination }
        };
    }

    const subcategoryLabels = {
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
        PLANETS: ['JUPITER', 'SATURN', 'MARS', 'MERCURY', 'URANUS', 'NEPTUNE', 'MOON', 'OVERVIEW'],
        PLAY: ['2026.01.27'],
        MESSIER: ['CHART', 'CATALOG']
    };

    let currentCategory = 'ALL';
    let currentSubcategory = null;
    let likeState = loadLikeState();
    let isMessierMode = false;
    let subtitleTransitionTimer = null;
    let pendingMessierFocusId = null;
    let messierHoverTimer = null;

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

    function normalizeMessierId(rawValue) {
        const match = String(rawValue || '').toUpperCase().match(/M\s*(\d{1,3})/);
        return match ? `M${Number(match[1])}` : null;
    }

    function getPhotoMessierId(photo) {
        return normalizeMessierId(`${photo.title || ''} ${photo.meta || ''} ${photo.url || ''}`);
    }

    function parseMessierRa(rawValue) {
        const normalized = String(rawValue || '')
            .replace(/[^\d.+-]+/g, ' ')
            .trim()
            .split(/\s+/)
            .map(Number)
            .filter(Number.isFinite);

        if (normalized.length === 0) {
            return null;
        }

        const [hours = 0, minutes = 0, seconds = 0] = normalized;
        return (hours + minutes / 60 + seconds / 3600) * 15;
    }

    function parseMessierDec(rawValue) {
        const raw = String(rawValue || '').trim();
        const sign = raw.startsWith('-') ? -1 : 1;
        const normalized = raw
            .replace(/[^\d.+-]+/g, ' ')
            .trim()
            .split(/\s+/)
            .map(Number)
            .filter(Number.isFinite);

        if (normalized.length === 0) {
            return null;
        }

        const [degrees = 0, minutes = 0, seconds = 0] = normalized;
        return sign * (Math.abs(degrees) + minutes / 60 + seconds / 3600);
    }

    function getCapturedMessierIds() {
        const captured = new Set();

        photos.forEach(photo => {
            if (!Array.isArray(photo.tags) || !photo.tags.includes('MESSIER')) {
                return;
            }

            const messierId = getPhotoMessierId(photo);
            if (messierId) {
                captured.add(messierId);
            }
        });

        return captured;
    }

    function getMessierPhotoById(messierId) {
        return photos.find(photo =>
            Array.isArray(photo.tags)
            && photo.tags.includes('MESSIER')
            && getPhotoMessierId(photo) === messierId
        ) || null;
    }

    function getMessierSkyData() {
        function normalizeMessierCategory(typeCode) {
            const value = String(typeCode || '').toUpperCase();

            if (['GC', 'OC', 'AS'].includes(value)) {
                return 'cluster';
            }

            if (['SG', 'EG', 'IG', 'LG', 'BG'].includes(value)) {
                return 'galaxy';
            }

            return 'nebula';
        }

        return messierCatalog
            .map(item => {
                const id = normalizeMessierId(item.M);
                const raDegrees = parseMessierRa(item.RA);
                const decDegrees = parseMessierDec(item.Dec);

                if (!id || !Number.isFinite(raDegrees) || !Number.isFinite(decDegrees)) {
                    return null;
                }

                return {
                    id,
                    raDegrees,
                    decDegrees,
                    category: normalizeMessierCategory(item.T)
                };
            })
            .filter(Boolean)
            .sort((left, right) => Number(left.id.slice(1)) - Number(right.id.slice(1)));
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
        if (category === 'MESSIER') {
            if (subcategory === 'CHART') return [];
            return photos.filter(photo =>
                Array.isArray(photo.tags) && photo.tags.includes('MESSIER')
            );
        }

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
            if (category !== 'MESSIER' && getCategoryPhotos(category, subcategory).length === 0) {
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

    function showMessierChart(visible) {
        messierChartPanel.hidden = !visible;
    }

    function focusMessierCard(messierId) {
        pendingMessierFocusId = messierId;

        if (currentCategory !== 'MESSIER') {
            filterPhotos('MESSIER');
            return;
        }

        scrollToPendingMessierCard();
    }

    function scrollToPendingMessierCard() {
        if (!pendingMessierFocusId) {
            return;
        }

        const card = gallery.querySelector(`[data-messier-id="${pendingMessierFocusId}"]`);
        if (!card) {
            return;
        }

        pendingMessierFocusId = null;
        card.classList.remove('photo-card-focus');
        void card.offsetWidth;
        card.classList.add('photo-card-focus');
        card.scrollIntoView({
            behavior: 'smooth',
            block: 'center'
        });
    }

    function hideMessierPreview() {
        if (messierHoverTimer) {
            window.clearTimeout(messierHoverTimer);
            messierHoverTimer = null;
        }

        messierHoverCard.hidden = true;
        messierHoverCard.classList.remove('is-visible');
    }

    function queueHideMessierPreview() {
        if (messierHoverTimer) {
            window.clearTimeout(messierHoverTimer);
        }

        messierHoverTimer = window.setTimeout(() => {
            messierHoverTimer = null;
            hideMessierPreview();
        }, 140);
    }

    function showMessierPreview(messierId, chartX, chartY) {
        const photo = getMessierPhotoById(messierId);
        if (!photo) {
            hideMessierPreview();
            return;
        }

        if (messierHoverTimer) {
            window.clearTimeout(messierHoverTimer);
            messierHoverTimer = null;
        }

        messierHoverImage.src = photo.thumbnailUrl || photo.url;
        messierHoverImage.alt = photo.title;
        messierHoverId.textContent = messierId;
        messierHoverMeta.textContent = photo.meta || photo.title;

        const frameRect = messierChartFrame.getBoundingClientRect();
        const svgRect = messierChart.getBoundingClientRect();
        const scaledX = (chartX / 1200) * svgRect.width;
        const scaledY = (chartY / 760) * svgRect.height;
        const cardWidth = 196;
        const cardHeight = 166;
        const gap = 18;
        const preferredLeft = scaledX > svgRect.width * 0.72
            ? scaledX - cardWidth - gap
            : scaledX + gap;
        const preferredTop = scaledY - cardHeight / 2;
        const left = Math.min(Math.max(12, preferredLeft), frameRect.width - cardWidth - 12);
        const top = Math.min(Math.max(12, preferredTop), frameRect.height - cardHeight - 12);

        messierHoverCard.style.left = `${left}px`;
        messierHoverCard.style.top = `${top}px`;
        messierHoverCard.hidden = false;
        messierHoverCard.classList.add('is-visible');
    }

    function renderMessierChart() {
        const catalog = getMessierSkyData();
        const capturedIds = getCapturedMessierIds();
        const astro = getAstroDetails();
        const width = 1200;
        const height = 760;
        const padding = { top: 52, right: 64, bottom: 62, left: 54 };
        const innerWidth = width - padding.left - padding.right;
        const innerHeight = height - padding.top - padding.bottom;
        const svgNamespace = 'http://www.w3.org/2000/svg';

        function createSvgNode(tagName, attributes = {}) {
            const node = document.createElementNS(svgNamespace, tagName);
            Object.entries(attributes).forEach(([key, value]) => {
                node.setAttribute(key, String(value));
            });
            return node;
        }

        function createMessierPointShape(item, pointX, pointY, captured) {
            const className = `messier-point ${captured ? 'is-captured' : 'is-missing'}`;
            const radius = 3.5;

            if (item.category === 'nebula') {
                return createSvgNode('rect', {
                    x: pointX - radius,
                    y: pointY - radius,
                    width: radius * 2,
                    height: radius * 2,
                    class: `${className} is-nebula`
                });
            }

            if (item.category === 'galaxy') {
                const topY = pointY - radius - 0.5;
                const leftX = pointX - radius - 0.4;
                const rightX = pointX + radius + 0.4;
                const bottomY = pointY + radius + 0.2;
                return createSvgNode('polygon', {
                    points: `${pointX},${topY} ${rightX},${bottomY} ${leftX},${bottomY}`,
                    class: `${className} is-galaxy`
                });
            }

            return createSvgNode('circle', {
                cx: pointX,
                cy: pointY,
                r: radius,
                class: `${className} is-cluster`
            });
        }

        function getChartX(raDegrees) {
            const wrapped = ((360 - raDegrees) % 360 + 360) % 360;
            return padding.left + wrapped / 360 * innerWidth;
        }

        function getChartY(decDegrees) {
            return padding.top + (90 - decDegrees) / 180 * innerHeight;
        }

        function clamp(value, min, max) {
            return Math.min(Math.max(value, min), max);
        }

        function boxesOverlap(a, b, paddingValue = 3) {
            return !(
                a.right + paddingValue < b.left ||
                a.left - paddingValue > b.right ||
                a.bottom + paddingValue < b.top ||
                a.top - paddingValue > b.bottom
            );
        }

        function placeMessierLabel(item, pointX, pointY, occupiedBoxes) {
            const labelWidth = Math.max(16, item.id.length * 5.4);
            const labelHeight = 8;
            const minX = padding.left + 6;
            const maxX = width - padding.right - 6;
            const minY = padding.top + 8;
            const maxY = height - padding.bottom - 4;
            const candidates = [
                { dx: 9, dy: -6, anchor: 'start' },
                { dx: 9, dy: 7, anchor: 'start' },
                { dx: -9, dy: -6, anchor: 'end' },
                { dx: -9, dy: 7, anchor: 'end' },
                { dx: 0, dy: -9, anchor: 'middle' },
                { dx: 0, dy: 11, anchor: 'middle' }
            ];

            let bestCandidate = null;

            candidates.forEach(candidate => {
                const x = clamp(pointX + candidate.dx, minX, maxX);
                const y = clamp(pointY + candidate.dy, minY, maxY);
                const left = candidate.anchor === 'end'
                    ? x - labelWidth
                    : candidate.anchor === 'middle'
                        ? x - labelWidth / 2
                        : x;
                const box = {
                    left,
                    right: left + labelWidth,
                    top: y - labelHeight,
                    bottom: y + 1
                };
                const overlapCount = occupiedBoxes.reduce((count, occupiedBox) => (
                    count + (boxesOverlap(box, occupiedBox) ? 1 : 0)
                ), 0);
                const score = overlapCount * 1000 + Math.abs(candidate.dx) + Math.abs(candidate.dy);

                if (!bestCandidate || score < bestCandidate.score) {
                    bestCandidate = { ...candidate, x, y, box, score };
                }
            });

            occupiedBoxes.push(bestCandidate.box);
            return bestCandidate;
        }

        messierCapturedCount.textContent = String(capturedIds.size);
        messierTotalCount.textContent = String(catalog.length || 110);
        messierChart.setAttribute('viewBox', `0 0 ${width} ${height}`);
        messierChart.innerHTML = '';

        // Definitions: Filters and Gradients
        const defs = createSvgNode('defs');
        
        // Soft blur for regions
        const softBlur = createSvgNode('filter', { id: 'softBlur', x: '-50%', y: '-50%', width: '200%', height: '200%' });
        softBlur.appendChild(createSvgNode('feGaussianBlur', { stdDeviation: '12' }));
        defs.appendChild(softBlur);

        // Chart texture (grain)
        const chartNoise = createSvgNode('filter', { id: 'chartNoise' });
        chartNoise.appendChild(createSvgNode('feTurbulence', { type: 'fractalNoise', baseFrequency: '0.6', numOctaves: '3', stitchTiles: 'stitch' }));
        chartNoise.appendChild(createSvgNode('feColorMatrix', { type: 'matrix', values: '0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0.04 0' }));
        defs.appendChild(chartNoise);

        // Moonlight Gradient
        const moonGlow = createSvgNode('radialGradient', { id: 'moonGlow' });
        moonGlow.appendChild(createSvgNode('stop', { offset: '0%', 'stop-color': 'rgba(255, 255, 255, 0.22)' }));
        moonGlow.appendChild(createSvgNode('stop', { offset: '60%', 'stop-color': 'rgba(255, 255, 255, 0.08)' }));
        moonGlow.appendChild(createSvgNode('stop', { offset: '100%', 'stop-color': 'rgba(255, 255, 255, 0)' }));
        defs.appendChild(moonGlow);

        // Plot Clipping
        const plotClip = createSvgNode('clipPath', { id: 'plotClip' });
        plotClip.appendChild(createSvgNode('rect', { x: padding.left, y: padding.top, width: innerWidth, height: innerHeight }));
        defs.appendChild(plotClip);

        messierChart.appendChild(defs);

        messierChart.appendChild(createSvgNode('rect', {
            x: 0,
            y: 0,
            width,
            height,
            class: 'messier-chart-backdrop'
        }));

        messierChart.appendChild(createSvgNode('rect', {
            x: padding.left,
            y: padding.top,
            width: innerWidth,
            height: innerHeight,
            class: 'messier-chart-plot'
        }));

        // Texture overlay
        messierChart.appendChild(createSvgNode('rect', {
            x: padding.left,
            y: padding.top,
            width: innerWidth,
            height: innerHeight,
            filter: 'url(#chartNoise)',
            style: 'pointer-events: none;'
        }));

        // Night/Twilight/Day Regions
        const phi = CFG_LOC.lat * Math.PI / 180;
        const deltaSun = astro.sun.dec * Math.PI / 180;
        const getHa = (hDeg) => {
            const h = hDeg * Math.PI / 180;
            const cosH = (Math.sin(h) - Math.sin(phi) * Math.sin(deltaSun)) / (Math.cos(phi) * Math.cos(deltaSun));
            return Math.acos(Math.max(-1, Math.min(1, cosH))) * 180 / Math.PI;
        };

        const haDay = getHa(-0.83);
        const haCivil = getHa(-6);
        const haNautical = getHa(-12);
        const haAstro = getHa(-18);

        const drawRaBand = (centerRa, halfWidth, fill) => {
            const r1 = (centerRa - halfWidth + 360) % 360;
            const r2 = (centerRa + halfWidth + 360) % 360;
            const x1 = getChartX(r1);
            const x2 = getChartX(r2);
            const bandGroup = createSvgNode('g', { 'clip-path': 'url(#plotClip)', filter: 'url(#softBlur)' });
            
            if (x1 > x2) {
                bandGroup.appendChild(createSvgNode('rect', { x: x2, y: padding.top - 20, width: x1 - x2, height: innerHeight + 40, fill }));
            } else {
                bandGroup.appendChild(createSvgNode('rect', { x: padding.left, y: padding.top - 20, width: x1 - padding.left, height: innerHeight + 40, fill }));
                bandGroup.appendChild(createSvgNode('rect', { x: x2, y: padding.top - 20, width: (padding.left + innerWidth) - x2, height: innerHeight + 40, fill }));
            }
            messierChart.appendChild(bandGroup);
        };

        // Layered twilight for depth
        drawRaBand(astro.sun.ra, haAstro, 'rgba(30, 60, 150, 0.15)');
        drawRaBand(astro.sun.ra, haNautical, 'rgba(40, 80, 180, 0.12)');
        drawRaBand(astro.sun.ra, haCivil, 'rgba(50, 110, 220, 0.12)');
        drawRaBand(astro.sun.ra, haDay, 'rgba(255, 200, 80, 0.1)');

        for (let raHour = 3; raHour < 24; raHour += 3) {
            const x = getChartX(raHour * 15);
            messierChart.appendChild(createSvgNode('line', {
                x1: x,
                y1: padding.top,
                x2: x,
                y2: padding.top + innerHeight,
                class: 'messier-grid-line'
            }));
        }

        [-60, -30, 0, 30, 60].forEach(dec => {
            const y = getChartY(dec);
            messierChart.appendChild(createSvgNode('line', {
                x1: padding.left,
                y1: y,
                x2: padding.left + innerWidth,
                y2: y,
                class: 'messier-grid-line'
            }));
        });

        // Ecliptic Line
        if (showEcliptic) {
            const eclipticPath = createSvgNode('path', { class: 'messier-ecliptic-line', 'clip-path': 'url(#plotClip)' });
            let d = '';
            const epsilon = 23.439 * Math.PI / 180;
            
            // Scientific month start points (Solar Longitude lambda)
            // Approx values for the 1st of each month
            const monthStarts = [
                { label: 'Jan', lambda: 280 },
                { label: 'Feb', lambda: 310 },
                { label: 'Mar', lambda: 340 },
                { label: 'Apr', lambda: 10 },
                { label: 'May', lambda: 40 },
                { label: 'Jun', lambda: 70 },
                { label: 'Jul', lambda: 100 },
                { label: 'Aug', lambda: 130 },
                { label: 'Sep', lambda: 160 },
                { label: 'Oct', lambda: 190 },
                { label: 'Nov', lambda: 220 },
                { label: 'Dec', lambda: 250 }
            ];

            let prevX = null;
            
            for (let lambda = 0; lambda <= 360; lambda += 1) {
                const lRad = lambda * Math.PI / 180;
                const raRad = Math.atan2(Math.cos(epsilon) * Math.sin(lRad), Math.cos(lRad));
                const decRad = Math.asin(Math.sin(epsilon) * Math.sin(lRad));
                const ra = (raRad * 180 / Math.PI + 360) % 360;
                const dec = decRad * 180 / Math.PI;
                const x = getChartX(ra);
                const y = getChartY(dec);
                
                if (lambda === 0 || prevX === null) {
                    d += `M ${x} ${y}`;
                } else {
                    // Critical fix: If the X coordinate jumps significantly (RA crosses 0/360), break the line.
                    if (Math.abs(x - prevX) > innerWidth * 0.5) {
                        d += ` M ${x} ${y}`;
                    } else {
                        d += ` L ${x} ${y}`;
                    }
                }
                prevX = x;

                // Add Equinox markers
                if (lambda === 0 || lambda === 180) {
                    const symbol = lambda === 0 ? '♈' : '♎';
                    const equinoxLabel = createSvgNode('text', {
                        x: x,
                        y: y + 16,
                        class: 'messier-ecliptic-equinox',
                        'text-anchor': 'middle',
                        'clip-path': 'url(#plotClip)'
                    });
                    equinoxLabel.textContent = symbol;
                    messierChart.appendChild(equinoxLabel);
                }

                // Add Month markers based on scientific start points
                const month = monthStarts.find(m => m.lambda === lambda);
                if (month) {
                    const dot = createSvgNode('circle', {
                        cx: x,
                        cy: y,
                        r: 1.5,
                        class: 'messier-ecliptic-dot',
                        'clip-path': 'url(#plotClip)'
                    });
                    messierChart.appendChild(dot);

                    const text = createSvgNode('text', {
                        x: x,
                        y: y - 10,
                        class: 'messier-ecliptic-marker',
                        'text-anchor': 'middle',
                        'clip-path': 'url(#plotClip)'
                    });
                    text.textContent = month.label;
                    messierChart.appendChild(text);
                }
            }
            eclipticPath.setAttribute('d', d);
            messierChart.appendChild(eclipticPath);
        }

        // Constellation Lines
        if (showConstellations) {
            Object.entries(constellationData).forEach(([name, lines]) => {
                let namePlaced = false;
                const starsAdded = new Set();

                lines.forEach(line => {
                    const polyline = createSvgNode('path', { class: 'messier-constellation-line', 'clip-path': 'url(#plotClip)' });
                    let d = '';
                    line.forEach(([ra, dec], index) => {
                        const ra360 = (ra + 360) % 360;
                        const x = getChartX(ra360);
                        const y = getChartY(dec);
                        
                        // Draw star
                        const starKey = `${ra.toFixed(2)},${dec.toFixed(2)}`;
                        if (!starsAdded.has(starKey)) {
                            const star = createSvgNode('circle', {
                                cx: x,
                                cy: y,
                                r: 1.2,
                                class: 'messier-constellation-star',
                                'clip-path': 'url(#plotClip)'
                            });
                            messierChart.appendChild(star);
                            starsAdded.add(starKey);
                        }

                        if (index === 0) {
                            d += `M ${x} ${y}`;
                        } else {
                            const prevRa = (line[index - 1][0] + 360) % 360;
                            if (Math.abs(ra360 - prevRa) > 180) {
                                d += ` M ${x} ${y}`;
                            } else {
                                d += ` L ${x} ${y}`;
                            }
                        }

                        // Place name once per constellation
                        if (!namePlaced && index === Math.floor(line.length / 2)) {
                            const nameLabel = createSvgNode('text', {
                                x: x,
                                y: y - 10,
                                class: 'messier-constellation-name',
                                'text-anchor': 'middle',
                                'clip-path': 'url(#plotClip)'
                            });
                            nameLabel.textContent = name;
                            messierChart.appendChild(nameLabel);
                            namePlaced = true;
                        }
                    });
                    polyline.setAttribute('d', d);
                    messierChart.appendChild(polyline);
                });
            });
        }

        const lstX = getChartX(astro.lst);
        messierChart.appendChild(createSvgNode('line', {
            x1: lstX,
            y1: padding.top,
            x2: lstX,
            y2: padding.top + innerHeight,
            class: 'messier-lst-line'
        }));

        const lstLabel = createSvgNode('text', {
            x: lstX,
            y: padding.top - 18,
            class: 'messier-lst-label',
            'text-anchor': 'middle'
        });
        const lstH = Math.floor(astro.lst / 15);
        const lstM = Math.floor((astro.lst % 15) * 4);
        lstLabel.textContent = `Meridian`;
        messierChart.appendChild(lstLabel);

        const midnightX = getChartX(astro.midnightRa);
        messierChart.appendChild(createSvgNode('line', {
            x1: midnightX,
            y1: padding.top,
            x2: midnightX,
            y2: padding.top + innerHeight,
            class: 'messier-midnight-line'
        }));

        const midnightLabel = createSvgNode('text', {
            x: midnightX,
            y: padding.top - 18,
            class: 'messier-midnight-label',
            'text-anchor': 'middle'
        });
        midnightLabel.textContent = 'Midnight';
        messierChart.appendChild(midnightLabel);

        messierChart.appendChild(createSvgNode('rect', {
            x: padding.left,
            y: padding.top,
            width: innerWidth,
            height: innerHeight,
            class: 'messier-chart-frame-outline'
        }));

        const decTitle = createSvgNode('text', {
            x: 24,
            y: padding.top - 12,
            class: 'messier-axis-title'
        });
        decTitle.textContent = 'DEC';
        messierChart.appendChild(decTitle);

        const altTitle = createSvgNode('text', {
            x: width - padding.right + 12,
            y: padding.top - 12,
            class: 'messier-axis-title'
        });
        altTitle.textContent = 'ALT';
        messierChart.appendChild(altTitle);

        for (let raHour = 0; raHour < 24; raHour += 3) {
            const x = getChartX(raHour * 15);
            const label = createSvgNode('text', {
                x,
                y: height - 22,
                class: 'messier-axis-label messier-axis-label-ra'
            });
            label.textContent = `${raHour}h`;
            messierChart.appendChild(label);
        }

        [-60, -30, 0, 30, 60].forEach(dec => {
            const y = getChartY(dec);
            const label = createSvgNode('text', {
                x: 24,
                y: y + 5,
                class: 'messier-axis-label messier-axis-label-dec'
            });
            label.textContent = dec > 0 ? `+${dec}°` : `${dec}°`;
            messierChart.appendChild(label);

            const alt = 90 - Math.abs(CFG_LOC.lat - dec);
            const altLabel = createSvgNode('text', {
                x: width - padding.right + 10,
                y: y + 5,
                class: 'messier-axis-label messier-axis-label-alt',
                'text-anchor': 'start'
            });
            altLabel.textContent = `${alt.toFixed(0)}°`;
            messierChart.appendChild(altLabel);
        });

        // Sun
        const sunX = getChartX(astro.sun.ra);
        const sunY = getChartY(astro.sun.dec);
        const sunGroup = createSvgNode('g', { class: 'astro-object sun' });
        sunGroup.appendChild(createSvgNode('circle', { cx: sunX, cy: sunY, r: 6 }));
        const sunText = createSvgNode('text', { x: sunX, y: sunY + 16, 'text-anchor': 'middle' });
        sunText.textContent = 'S';
        sunGroup.appendChild(sunText);
        messierChart.appendChild(sunGroup);

        // Moon
        const moonX = getChartX(astro.moon.ra);
        const moonY = getChartY(astro.moon.dec);

        // Moonlight Impact Region (Enhanced Visibility)
        const moonRadius = (astro.moon.illumination * 60 + 20) * (innerWidth / 360);
        const drawMoonImpact = (mx, my, mr) => {
            const impactGroup = createSvgNode('g', { 'clip-path': 'url(#plotClip)', filter: 'url(#softBlur)' });
            impactGroup.appendChild(createSvgNode('circle', { cx: mx, cy: my, r: mr, fill: 'url(#moonGlow)', style: 'pointer-events: none;' }));
            if (mx - mr < padding.left) impactGroup.appendChild(createSvgNode('circle', { cx: mx + innerWidth, cy: my, r: mr, fill: 'url(#moonGlow)', style: 'pointer-events: none;' }));
            if (mx + mr > padding.left + innerWidth) impactGroup.appendChild(createSvgNode('circle', { cx: mx - innerWidth, cy: my, r: mr, fill: 'url(#moonGlow)', style: 'pointer-events: none;' }));
            messierChart.appendChild(impactGroup);
        };
        drawMoonImpact(moonX, moonY, moonRadius);

        const moonGroup = createSvgNode('g', { class: 'astro-object moon' });
        moonGroup.appendChild(createSvgNode('circle', { cx: moonX, cy: moonY, r: 5 }));
        const moonText = createSvgNode('text', { x: moonX, y: moonY + 15, 'text-anchor': 'middle' });
        moonText.textContent = `M ${(astro.moon.illumination * 100).toFixed(0)}%`;
        moonGroup.appendChild(moonText);
        messierChart.appendChild(moonGroup);

        // Location Legend
        const legendX = width - padding.right - 260;
        const legendY = height - padding.bottom - 78;
        const locationLegend = createSvgNode('g', { transform: `translate(${legendX}, ${legendY})` });
        locationLegend.appendChild(createSvgNode('rect', { width: 250, height: 72, rx: 2, class: 'messier-location-legend-bg' }));
        
        const formatTime = (date) => date.getUTCHours().toString().padStart(2, '0') + ':' + date.getUTCMinutes().toString().padStart(2, '0') + ' UTC';
        const formatLocal = (date) => date.getHours().toString().padStart(2, '0') + ':' + date.getMinutes().toString().padStart(2, '0') + ' LT';

        locationLegend.appendChild(createSvgNode('text', { x: 10, y: 15, class: 'messier-location-text' })).textContent = `${CFG_LOC.name} | ${CFG_LOC.lat.toFixed(2)}°N ${CFG_LOC.lon.toFixed(2)}°E`;
        locationLegend.appendChild(createSvgNode('text', { x: 10, y: 28, class: 'messier-location-text' })).textContent = `${formatLocal(astro.now)} | ${formatTime(astro.now)}`;
        locationLegend.appendChild(createSvgNode('text', { x: 10, y: 41, class: 'messier-location-text' })).textContent = `Sun Alt: ${astro.sun.alt.toFixed(1)}° | ${astro.sun.status}`;
        locationLegend.appendChild(createSvgNode('text', { x: 10, y: 54, class: 'messier-location-text' })).textContent = `Meridian (LST): ${Math.floor(astro.lst / 15)}h ${Math.floor((astro.lst % 15) * 4)}m`;
        locationLegend.appendChild(createSvgNode('text', { x: 10, y: 67, class: 'messier-location-text' })).textContent = `Midnight: ${Math.floor(astro.midnightRa / 15)}h`;
        
        messierChart.appendChild(locationLegend);

        const capturedLabelPoints = [];

        catalog.forEach(item => {
            const captured = capturedIds.has(item.id);
            const pointX = getChartX(item.raDegrees);
            const pointY = getChartY(item.decDegrees);
            const point = createMessierPointShape(item, pointX, pointY, captured);

            if (captured) {
                capturedLabelPoints.push({ item, pointX, pointY });
            }

            const title = createSvgNode('title');
            title.textContent = captured ? `${item.id} captured` : `${item.id} missing`;
            point.appendChild(title);
            messierChart.appendChild(point);
        });

        const occupiedLabelBoxes = [];

        capturedLabelPoints
            .sort((a, b) => a.pointX - b.pointX || a.pointY - b.pointY)
            .forEach(({ item, pointX, pointY }) => {
                const placement = placeMessierLabel(item, pointX, pointY, occupiedLabelBoxes);
                const label = createSvgNode('text', {
                    x: placement.x,
                    y: placement.y,
                    class: 'messier-point-label',
                    'text-anchor': placement.anchor
                });
                label.textContent = item.id;
                label.setAttribute('tabindex', '0');
                label.setAttribute('aria-label', `${item.id} captured preview`);
                label.addEventListener('mouseenter', () => showMessierPreview(item.id, pointX, pointY));
                label.addEventListener('mouseleave', queueHideMessierPreview);
                label.addEventListener('focus', () => showMessierPreview(item.id, pointX, pointY));
                label.addEventListener('blur', queueHideMessierPreview);
                messierChart.appendChild(label);
        });
    }

    function renderPhotos(category = 'ALL', subcategory = null) {
        gallery.innerHTML = '';
        gallery.classList.toggle('gallery-messier', category === 'MESSIER');
        
        const isChartMode = category === 'MESSIER' && subcategory === 'CHART';
        showMessierChart(isChartMode);

        if (isChartMode) {
            renderMessierChart();
            return;
        }

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
            const messierId = category === 'MESSIER' ? getPhotoMessierId(photo) : null;
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

        if (category === 'MESSIER') {
            scrollToPendingMessierCard();
        }
    }

    function updateHeaderState(category) {
        isMessierMode = category === 'MESSIER';
        transitionSubtitle();
        syncNavState(true);
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
            
            // Default to CHART for MESSIER category
            if (category === 'MESSIER') {
                firstSubcategory = 'CHART';
                currentSubcategory = 'CHART';
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

    if (toggleEclipticBtn) {
        toggleEclipticBtn.addEventListener('click', () => {
            showEcliptic = !showEcliptic;
            toggleEclipticBtn.classList.toggle('is-active', showEcliptic);
            renderMessierChart();
        });
    }

    if (toggleConstellationsBtn) {
        toggleConstellationsBtn.addEventListener('click', () => {
            showConstellations = !showConstellations;
            toggleConstellationsBtn.classList.toggle('is-active', showConstellations);
            renderMessierChart();
        });
    }

    createStars();
    renderMainNav('ALL');
    renderPhotos();

    setInterval(() => {
        if (isMessierMode && currentSubcategory === 'CHART') {
            renderMessierChart();
        }
    }, 60000);
})();
