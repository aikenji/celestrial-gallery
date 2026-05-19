/**
 * Messier Controller Module
 * Orchestrates the UI, state, and event handling for the Messier section.
 */
(() => {
    const ns = window.AstroGallery || (window.AstroGallery = {});
    const { core, astro, messierData } = ns;
    const { elements, state } = core;
    const logger = ns.logger.create('messier');

    // --- Module State ---
    let showEcliptic = true;
    let showPlanets = true;
    let showPolar = false;
    let viewRa = 0;
    let viewDec = 0;
    let isDragging = false;
    let isAutoRotating = false;
    let rotationTimer = null;
    let lastMouseX = 0;
    let lastMouseY = 0;
    let showConstellations = false;
    let showRecommendation = true;
    let recommendationIds = [];
    let highlightedChartTargetId = null;
    let pendingMessierFocusId = null;
    let messierHoverTimer = null;
    let selectedDate = new Date();
    let dateEventsBound = false;

    // Observer location configuration
    const CFG_LOC = astro.createObserverLocation({
        name: 'Changzhou, CN',
        lat: 31.811,
        lon: 119.974
    });

    // --- Core Utilities ---

    /**
     * Creates an SVG element with given attributes in the SVG namespace.
     */
    function createSvgNode(tagName, attributes = {}) {
        const node = document.createElementNS('http://www.w3.org/2000/svg', tagName);
        Object.entries(attributes).forEach(([key, value]) => {
            node.setAttribute(key, String(value));
        });
        return node;
    }

    /**
     * Queues a messier card for focus and scrolling.
     */
    function focusMessierCard(messierId) {
        pendingMessierFocusId = messierId;
        logger.debug('Queued messier card focus', { messierId });
    }

    /**
     * Executes the actual scroll to the pending messier card if one is queued.
     */
    function scrollToPendingMessierCard() {
        if (!pendingMessierFocusId) return;
        const card = elements.gallery.querySelector(`[data-messier-id="${pendingMessierFocusId}"]`);
        if (!card) return;
        pendingMessierFocusId = null;
        card.classList.remove('photo-card-focus');
        void card.offsetWidth;
        card.classList.add('photo-card-focus');
        card.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }

    // --- Hover Preview Logic ---

    function hideMessierPreview() {
        if (messierHoverTimer) { window.clearTimeout(messierHoverTimer); messierHoverTimer = null; }
        elements.messierHoverCard.hidden = true;
        elements.messierHoverCard.classList.remove('is-visible');
    }

    function queueHideMessierPreview() {
        if (messierHoverTimer) window.clearTimeout(messierHoverTimer);
        messierHoverTimer = window.setTimeout(() => { messierHoverTimer = null; hideMessierPreview(); }, 140);
    }

    /**
     * Shows a popup preview of a Messier object relative to its chart position.
     */
    function showMessierPreview(messierId, chartX, chartY) {
        const photo = messierData.getMessierPhotoById(messierId);
        if (!photo) { hideMessierPreview(); return; }
        if (messierHoverTimer) { window.clearTimeout(messierHoverTimer); messierHoverTimer = null; }

        elements.messierHoverImage.src = photo.thumbnailUrl || photo.url;
        elements.messierHoverImage.alt = photo.title;
        elements.messierHoverId.textContent = messierId;
        elements.messierHoverMeta.textContent = photo.meta || photo.title;

        const frameRect = elements.messierChartFrame.getBoundingClientRect();
        const svgRect = elements.messierChart.getBoundingClientRect();
        const scaledX = (chartX / 1200) * svgRect.width;
        const scaledY = (chartY / 920) * svgRect.height;
        const cardWidth = 196, cardHeight = 166, gap = 18;
        
        // Dynamic side placement based on screen position
        const prefLeft = scaledX > svgRect.width * 0.72 ? scaledX - cardWidth - gap : scaledX + gap;
        const left = Math.min(Math.max(12, prefLeft), frameRect.width - cardWidth - 12);
        const top = Math.min(Math.max(12, scaledY - cardHeight / 2), frameRect.height - cardHeight - 12);

        elements.messierHoverCard.style.left = `${left}px`;
        elements.messierHoverCard.style.top = `${top}px`;
        elements.messierHoverCard.hidden = false;
        elements.messierHoverCard.classList.add('is-visible');
    }

    // --- DateTime & Rotation Logic ---

    function buildSelectedDateTime() {
        const now = new Date();
        // Keep chart background/twilight stable across rapid toggle rerenders.
        // Using minute-level precision avoids second-level sun-position jitter.
        return new Date(selectedDate.getFullYear(), selectedDate.getMonth(), selectedDate.getDate(), now.getHours(), now.getMinutes(), 0, 0);
    }

    function syncDateInput() {
        if (elements.messierDateInput) {
            const d = selectedDate;
            elements.messierDateInput.value = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
        }
    }

    function resetSelectedDateToToday() {
        selectedDate = new Date();
        syncDateInput();
        renderMessierChart();
    }

    function shiftSelectedDate(days) {
        selectedDate.setDate(selectedDate.getDate() + days);
        syncDateInput();
        renderMessierChart();
    }

    /**
     * Binds input events for the date picker.
     */
    function bindDateEvents() {
        if (dateEventsBound) return;
        syncDateInput();
        if (elements.messierDatePrev) elements.messierDatePrev.addEventListener('click', () => shiftSelectedDate(-1));
        if (elements.messierDateNext) elements.messierDateNext.addEventListener('click', () => shiftSelectedDate(1));
        if (elements.messierDateToday) elements.messierDateToday.addEventListener('click', () => resetSelectedDateToToday());
        if (elements.messierDateInput) elements.messierDateInput.addEventListener('change', e => {
            const [y, m, d] = e.target.value.split('-').map(Number);
            if (y && m && d) { selectedDate = new Date(y, m - 1, d); renderMessierChart(); }
        });
        dateEventsBound = true;
    }

    function startAutoRotation() {
        if (rotationTimer) return;
        isAutoRotating = true;
        rotationTimer = window.requestAnimationFrame(function animate() {
            if (!isAutoRotating) return;
            viewRa = (viewRa + 0.3 + 360) % 360;
            renderMessierChart();
            rotationTimer = window.requestAnimationFrame(animate);
        });
        if (elements.togglePlayBtn) elements.togglePlayBtn.classList.add('is-active');
    }

    function stopAutoRotation() {
        isAutoRotating = false;
        if (rotationTimer) { window.cancelAnimationFrame(rotationTimer); rotationTimer = null; }
        if (elements.togglePlayBtn) elements.togglePlayBtn.classList.remove('is-active');
    }

    // --- Public API & Orchestration ---

    /**
     * Top-level render call that delegates to sub-modules.
     */
    function renderMessierChart() {
        // Resolve function conflict by calling the specifically named renderer in ns.messier
        ns.messier.renderChart({
            showEcliptic, showPlanets, showPolar, viewRa, viewDec, showConstellations, showRecommendation, selectedDate, CFG_LOC,
            astroNow: buildSelectedDateTime()
        });
    }

    function setRecommendedTargets(ids) {
        recommendationIds = Array.isArray(ids) ? ids.slice() : [];
    }

    function jumpToRecommendRow(messierId) {
        if (!messierId || !elements.messierRecommendList) return;
        const row = elements.messierRecommendList.querySelector(`[data-messier-id="${messierId}"]`);
        if (!row) return;
        row.scrollIntoView({ behavior: 'smooth', block: 'center' });
        row.classList.remove('is-recommend-ping');
        void row.offsetWidth;
        row.classList.add('is-recommend-ping');
        window.setTimeout(() => row.classList.remove('is-recommend-ping'), 1800);
    }

    function focusMessierTargetInChart(messierId) {
        if (!messierId) return;
        highlightedChartTargetId = messierId;
        renderMessierChart();
        if (elements.messierChartFrame) {
            elements.messierChartFrame.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
        window.setTimeout(() => {
            if (highlightedChartTargetId === messierId) {
                highlightedChartTargetId = null;
                renderMessierChart();
            }
        }, 3000);
    }

    function showMessierChart(visible) {
        elements.messierChartPanel.hidden = !visible;
        if (!visible) hideMessierPreview();
    }

    /**
     * Binds all chart-related UI control events (toggles, drag, etc.)
     */
    function bindToggleEvents() {
        bindDateEvents();
        if (elements.toggleEclipticBtn) elements.toggleEclipticBtn.classList.toggle('is-active', showEcliptic);
        if (elements.togglePlanetsBtn) elements.togglePlanetsBtn.classList.toggle('is-active', showPlanets);
        if (elements.toggleRecommendationBtn) elements.toggleRecommendationBtn.classList.toggle('is-active', showRecommendation);
        if (typeof ns.messier.bindRecommendationEvents === 'function') {
            ns.messier.bindRecommendationEvents();
        }
        if (elements.toggleEclipticBtn) elements.toggleEclipticBtn.addEventListener('click', () => { showEcliptic = !showEcliptic; elements.toggleEclipticBtn.classList.toggle('is-active', showEcliptic); renderMessierChart(); });
        if (elements.togglePlanetsBtn) elements.togglePlanetsBtn.addEventListener('click', () => { showPlanets = !showPlanets; elements.togglePlanetsBtn.classList.toggle('is-active', showPlanets); renderMessierChart(); });
        if (elements.togglePolarBtn) elements.togglePolarBtn.addEventListener('click', () => {
            showPolar = !showPolar;
            if (showPolar) {
                const details = astro.getAstroDetails(CFG_LOC, buildSelectedDateTime());
                viewRa = details.lst; viewDec = CFG_LOC.lat;
                if (elements.togglePlayBtn) elements.togglePlayBtn.hidden = false;
            } else {
                stopAutoRotation();
                if (elements.togglePlayBtn) elements.togglePlayBtn.hidden = true;
            }
            elements.togglePolarBtn.classList.toggle('is-active', showPolar);
            renderMessierChart();
        });
        if (elements.togglePlayBtn) elements.togglePlayBtn.addEventListener('click', () => { if (isAutoRotating) stopAutoRotation(); else startAutoRotation(); });

        // Chart mouse/drag interaction for 3D view
        if (elements.messierChart) {
            elements.messierChart.style.cursor = showPolar ? 'grab' : 'default';
            elements.messierChart.addEventListener('mousedown', e => { if (!showPolar) return; isDragging = true; lastMouseX = e.clientX; lastMouseY = e.clientY; elements.messierChart.style.cursor = 'grabbing'; });
            window.addEventListener('mousemove', e => {
                if (!isDragging || !showPolar) return;
                viewRa = (viewRa - (e.clientX - lastMouseX) * 0.2 + 360) % 360;
                viewDec = Math.max(-90, Math.min(90, viewDec + (e.clientY - lastMouseY) * 0.2));
                lastMouseX = e.clientX; lastMouseY = e.clientY; renderMessierChart();
            });
            window.addEventListener('mouseup', () => { isDragging = false; if (elements.messierChart) elements.messierChart.style.cursor = showPolar ? 'grab' : 'default'; });
        }
        if (elements.toggleConstellationsBtn) elements.toggleConstellationsBtn.addEventListener('click', () => { showConstellations = !showConstellations; elements.toggleConstellationsBtn.classList.toggle('is-active', showConstellations); renderMessierChart(); });
        if (elements.toggleRecommendationBtn) elements.toggleRecommendationBtn.addEventListener('click', () => { showRecommendation = !showRecommendation; elements.toggleRecommendationBtn.classList.toggle('is-active', showRecommendation); renderMessierChart(); });
    }

    /**
     * Refreshes the chart if it's currently being viewed.
     */
    function refreshChartIfVisible() {
        if (state.isMessierMode && state.currentSubcategory === 'CHART') renderMessierChart();
    }

    // Populate the namespace for cross-module calls
    ns.messier = {
        ...ns.messier,
        createSvgNode,
        focusMessierCard,
        refreshChartIfVisible,
        renderMessierChart, // Public API
        scrollToPendingMessierCard,
        showMessierChart,
        showMessierPreview,
        queueHideMessierPreview,
        bindToggleEvents,
        setRecommendedTargets,
        jumpToRecommendRow,
        focusMessierTargetInChart,
        getRecommendationIds: () => recommendationIds.slice(),
        getHighlightedChartTargetId: () => highlightedChartTargetId
    };
})();
