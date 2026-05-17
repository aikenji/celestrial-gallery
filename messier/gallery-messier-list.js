/**
 * Messier Recommendation List Module
 * Handles target sorting, ranking, and rendering the "Observing Plan" section.
 */
(() => {
    const ns = window.AstroGallery || (window.AstroGallery = {});
    const { core, astro, messierData } = ns;
    const { elements } = core;

    // --- Module State ---
    let thresholds = {
        alt: 30,
        mag: 10.0,
        ra: 3 // hours
    };
    const sortModes = ['MAG', 'ALT', 'TYPE'];
    let currentSortMode = 'MAG'; // Default: MAG

    /**
     * Binds click and input events for recommendation sliders and sorts.
     */
    function bindRecommendationEvents() {
        const { 
            filterAlt, sliderAlt, valAlt, 
            filterMag, sliderMag, valMag, 
            filterRa, sliderRa, valRa, 
            sortMagBtn, sortAltBtn, sortTypeBtn
        } = elements;

        let needsUpdate = false;

        const hideAllSliders = () => {
            let wasVisible = false;
            [sliderAlt, sliderMag, sliderRa].forEach(s => {
                if (s && s.classList.contains('is-visible')) {
                    s.classList.remove('is-visible');
                    wasVisible = true;
                }
            });
            if (wasVisible && needsUpdate) {
                ns.messier.renderMessierChart();
                needsUpdate = false;
            }
        };

        const toggleSlider = (slider) => {
            const isVisible = slider.classList.contains('is-visible');
            // Hide others first and trigger update if needed
            hideAllSliders();
            if (!isVisible) {
                slider.classList.add('is-visible');
            }
        };

        if (filterAlt && sliderAlt) {
            filterAlt.onclick = (e) => { e.stopPropagation(); toggleSlider(sliderAlt); };
            sliderAlt.oninput = () => { thresholds.alt = parseInt(sliderAlt.value); if (valAlt) valAlt.textContent = thresholds.alt; needsUpdate = true; };
        }
        if (filterMag && sliderMag) {
            filterMag.onclick = (e) => { e.stopPropagation(); toggleSlider(sliderMag); };
            sliderMag.oninput = () => { thresholds.mag = parseFloat(sliderMag.value); if (valMag) valMag.textContent = thresholds.mag.toFixed(1); needsUpdate = true; };
        }
        if (filterRa && sliderRa) {
            filterRa.onclick = (e) => { e.stopPropagation(); toggleSlider(sliderRa); };
            sliderRa.oninput = () => { thresholds.ra = parseInt(sliderRa.value); if (valRa) valRa.textContent = thresholds.ra; needsUpdate = true; };
        }

        const updateSortState = (newMode) => {
            currentSortMode = newMode;
            [sortMagBtn, sortAltBtn, sortTypeBtn].forEach(btn => {
                if (btn) btn.classList.remove('is-active');
            });
            const activeBtn = newMode === 'MAG' ? sortMagBtn : (newMode === 'ALT' ? sortAltBtn : sortTypeBtn);
            if (activeBtn) activeBtn.classList.add('is-active');
            ns.messier.renderMessierChart();
        };

        if (sortMagBtn) sortMagBtn.onclick = () => updateSortState('MAG');
        if (sortAltBtn) sortAltBtn.onclick = () => updateSortState('ALT');
        if (sortTypeBtn) sortTypeBtn.onclick = () => updateSortState('TYPE');

        // Global click to hide sliders and trigger deferred update
        window.addEventListener('click', () => {
            hideAllSliders();
        });

        // Prevent slider clicks from bubbling up to window and closing themselves
        [sliderAlt, sliderMag, sliderRa].forEach(s => {
            if (s) s.onclick = (e) => e.stopPropagation();
        });

        // Initialize active state
        updateSortState(currentSortMode);
    }

    /**
     * Renders the recommended Messier targets for the current night.
     */
    function renderRecommendations(catalog, astroDetails, capturedIds, CFG_LOC) {
        if (!elements.messierRecommendList) return;
        elements.messierRecommendList.innerHTML = '';

        const midnightRa = astroDetails.midnightRa;
        const altitudeSeries = astro.getObservingNightSeries(CFG_LOC, astroDetails.now, 10);
        const typePriority = { 'nebula': 1, 'galaxy': 2, 'cluster': 3 };

        // Map and calculate core metrics for each target
        let recommendations = catalog.map(item => {
            let raDiff = Math.abs(item.raDegrees - midnightRa);
            if (raDiff > 180) raDiff = 360 - raDiff;
            const raHours = raDiff / 15;
            const isCaptured = capturedIds.has(item.id);
            const magnitude = parseFloat(item.magnitude) || 15;
            const transitAlt = 90 - Math.abs(CFG_LOC.lat - item.decDegrees);
            const typeScore = typePriority[item.category] || 99;
            return { ...item, raDiff, raHours, isCaptured, magnitude, transitAlt, typeScore };
        });

        // Always apply filters based on current threshold state
        recommendations = recommendations.filter(item => {
            return item.transitAlt >= thresholds.alt &&
                   item.magnitude <= thresholds.mag &&
                   item.raHours <= thresholds.ra;
        });

        // Sort Stage
        recommendations.sort((a, b) => {
            if (currentSortMode === 'MAG') return a.magnitude - b.magnitude;
            if (currentSortMode === 'ALT') return b.transitAlt - a.transitAlt;
            if (currentSortMode === 'TYPE') {
                if (a.typeScore !== b.typeScore) return a.typeScore - b.typeScore;
                return a.magnitude - b.magnitude;
            }
            return a.raDiff - b.raDiff;
        });

        // Limit to top 10 results
        recommendations = recommendations.slice(0, 10);

        recommendations.forEach(target => {
            const isCaptured = target.isCaptured;
            const row = document.createElement('div');
            row.className = `messier-target-row ${isCaptured ? 'is-captured' : ''}`;
            
            const chartId = `recommend-chart-${target.id}`;
            const iconHtml = getTargetIconHtml(target.category, isCaptured);

            // Calculate altitude series for this specific target
            const targetSeries = altitudeSeries.points.map(p => {
                const details = astro.getAstroDetails(CFG_LOC, p.date);
                const alt = astro.getEquatorialAltitude(CFG_LOC, target.raDegrees, target.decDegrees, details.lst);
                return { ...p, targetAlt: alt };
            });
            const events = astro.getAltitudeEvents({ points: targetSeries }, 'targetAlt', 0);

            row.innerHTML = `
                <div class="messier-target-row-content">
                    <div class="messier-target-row-info">
                        <div class="messier-target-id-row ${isCaptured ? 'is-captured' : 'is-missing'}">
                            ${iconHtml}
                            ${target.id}
                        </div>
                        <div class="messier-target-meta-row">
                            ${target.category} &middot; ${target.constellation}<br>
                            Mag: <b>${target.magnitude.toFixed(1)}</b> &middot; 
                            Peak: <b>${target.transitAlt.toFixed(0)}°</b> &middot; 
                            RA: <b>${Math.floor(target.raDegrees / 15)}h</b>
                        </div>
                    </div>
                    <div class="messier-target-row-chart" id="${chartId}"></div>
                </div>
            `;

            row.onclick = () => {
                const photo = messierData.getMessierPhotoById(target.id);
                if (photo) {
                    ns.ui.filterPhotos('MESSIER', 'CATALOG');
                    window.setTimeout(() => {
                        ns.messier.focusMessierCard(target.id);
                    }, 100);
                }
            };

            elements.messierRecommendList.appendChild(row);
            renderDetailedMiniChart(chartId, target, astroDetails.now, altitudeSeries, events, CFG_LOC);
        });
    }

    /**
     * Generates HTML for the target type icon.
     */
    function getTargetIconHtml(category, isCaptured) {
        const statusClass = isCaptured ? 'is-captured' : 'is-missing';
        if (category === 'nebula') {
            return `<svg class="target-icon-svg" viewBox="0 0 10 10"><rect x="1" y="1" width="8" height="8" class="target-icon-shape ${statusClass}" /></svg>`;
        }
        if (category === 'galaxy') {
            return `<svg class="target-icon-svg" viewBox="0 0 10 10"><polygon points="5,1 9,9 1,9" class="target-icon-shape ${statusClass}" /></svg>`;
        }
        return `<svg class="target-icon-svg" viewBox="0 0 10 10"><circle cx="5" cy="5" r="4" class="target-icon-shape ${statusClass}" /></svg>`;
    }

    /**
     * Renders a small altitude vs time chart for a specific target.
     */
    function renderDetailedMiniChart(containerId, target, now, altitudeSeries, events, CFG_LOC) {
        const container = document.getElementById(containerId);
        if (!container) return;

        const width = container.clientWidth || 800;
        const height = 130;
        const svg = ns.messier.createSvgNode('svg', { viewBox: `0 0 ${width} ${height}`, width: '100%', height: '100%', preserveAspectRatio: 'none' });

        // Draw background twilight bands
        ns.messier.renderTwilightBands(svg, altitudeSeries, { left: 0, top: 0, width: width, height: height });

        // Draw altitude grid
        [30, 60].forEach(alt => {
            const y = height - (alt / 90) * height;
            svg.appendChild(ns.messier.createSvgNode('line', { x1: 0, y1: y, x2: width, y2: y, class: 'mini-chart-grid' }));
            svg.appendChild(ns.messier.createSvgNode('text', { x: 2, y: y - 2, class: 'mini-chart-axis-label' })).textContent = `${alt}°`;
        });

        // Calculate and draw the target's altitude path
        let path = '';
        altitudeSeries.points.forEach((p, i) => {
            const details = astro.getAstroDetails(CFG_LOC, p.date);
            const alt = astro.getEquatorialAltitude(CFG_LOC, target.raDegrees, target.decDegrees, details.lst);
            const x = (p.localHours / 24) * width;
            const y = height - (Math.max(0, alt) / 90) * height;
            if (alt >= 0) {
                const isNewSegment = path === '' || (i > 0 && astro.getEquatorialAltitude(CFG_LOC, target.raDegrees, target.decDegrees, astro.getAstroDetails(CFG_LOC, altitudeSeries.points[i-1].date).lst) < 0);
                path += (isNewSegment ? 'M' : ' L') + ` ${x} ${y}`;
            }
        });

        if (path) svg.appendChild(ns.messier.createSvgNode('path', { d: path, class: 'mini-chart-target-path' }));

        // Internal helper to render Rise/Set/Peak labels
        const renderEventLabel = (event, label, variant) => {
            if (!event || event.localHours < 0 || event.localHours > 24) return;
            const x = (event.localHours / 24) * width;
            const y = height - (Math.max(0, event.altitude) / 90) * height;
            const group = ns.messier.createSvgNode('g', { transform: `translate(${x}, ${y})` });
            group.appendChild(ns.messier.createSvgNode('circle', { r: 3, class: `mini-chart-event-dot mini-chart-event-${variant}` }));
            // Add 12h offset because getObservingNightSeries starts at Noon
            const displayTime = astro.formatHourLabel(event.localHours + 12);
            group.appendChild(ns.messier.createSvgNode('text', { y: event.altitude > 75 ? 12 : -10, 'text-anchor': 'middle', class: 'mini-chart-event-label' })).textContent = `${label} ${displayTime}`;
            svg.appendChild(group);
        };

        renderEventLabel(events.rise, 'Rise', 'rise');
        renderEventLabel(events.set, 'Set', 'set');
        renderEventLabel(events.transit, 'Peak', 'transit');

        // Draw current time vertical line
        const currentX = ((now.getTime() - altitudeSeries.start.getTime()) / (24 * 60 * 60 * 1000)) * width;
        if (currentX >= 0 && currentX <= width) {
            svg.appendChild(ns.messier.createSvgNode('line', { x1: currentX, y1: 0, x2: currentX, y2: height, class: 'mini-chart-now-line' }));
        }

        // Draw time axis labels
        for (let i = 0; i <= 24; i += 4) {
            const x = (i / 24) * width;
            const h = (12 + i) % 24;
            svg.appendChild(ns.messier.createSvgNode('text', { x, y: height - 4, 'text-anchor': i === 0 ? 'start' : i === 24 ? 'end' : 'middle', class: 'mini-chart-time-label' })).textContent = `${String(h).padStart(2, '0')}:00`;
        }

        container.appendChild(svg);
    }

    // Export to namespace
    ns.messier = ns.messier || {};
    ns.messier.renderRecommendations = renderRecommendations;
    ns.messier.bindRecommendationEvents = bindRecommendationEvents;
})();
