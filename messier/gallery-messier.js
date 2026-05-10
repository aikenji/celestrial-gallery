(() => {
    const ns = window.AstroGallery || (window.AstroGallery = {});
    const { core } = ns;
    const logger = ns.logger.create('messier');
    const { elements, state } = core;
    const { astro, messierData } = ns;
    const constellationData = ns.messierConstellations.data;

    let showEcliptic = false;
    let showPlanets = false;
    let showConstellations = false;
    let pendingMessierFocusId = null;
    let messierHoverTimer = null;
    let selectedDate = new Date();
    let dateEventsBound = false;

    const CFG_LOC = astro.createObserverLocation({
        name: 'Changzhou, CN',
        lat: 31.811,
        lon: 119.974
    });

    function focusMessierCard(messierId) {
        pendingMessierFocusId = messierId;
        logger.debug('Queued messier card focus', { messierId });
    }

    function scrollToPendingMessierCard() {
        if (!pendingMessierFocusId) {
            return;
        }

        const card = elements.gallery.querySelector(`[data-messier-id="${pendingMessierFocusId}"]`);
        if (!card) {
            return;
        }

        const messierId = pendingMessierFocusId;
        pendingMessierFocusId = null;
        card.classList.remove('photo-card-focus');
        void card.offsetWidth;
        card.classList.add('photo-card-focus');
        card.scrollIntoView({
            behavior: 'smooth',
            block: 'center'
        });

        logger.info('Focused messier card', { messierId });
    }

    function hideMessierPreview() {
        if (messierHoverTimer) {
            window.clearTimeout(messierHoverTimer);
            messierHoverTimer = null;
        }

        elements.messierHoverCard.hidden = true;
        elements.messierHoverCard.classList.remove('is-visible');
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
        const photo = messierData.getMessierPhotoById(messierId);
        if (!photo) {
            hideMessierPreview();
            return;
        }

        if (messierHoverTimer) {
            window.clearTimeout(messierHoverTimer);
            messierHoverTimer = null;
        }

        elements.messierHoverImage.src = photo.thumbnailUrl || photo.url;
        elements.messierHoverImage.alt = photo.title;
        elements.messierHoverId.textContent = messierId;
        elements.messierHoverMeta.textContent = photo.meta || photo.title;

        const frameRect = elements.messierChartFrame.getBoundingClientRect();
        const svgRect = elements.messierChart.getBoundingClientRect();
        const scaledX = (chartX / 1200) * svgRect.width;
        const scaledY = (chartY / 920) * svgRect.height;
        const cardWidth = 196;
        const cardHeight = 166;
        const gap = 18;
        const preferredLeft = scaledX > svgRect.width * 0.72 ? scaledX - cardWidth - gap : scaledX + gap;
        const preferredTop = scaledY - cardHeight / 2;
        const left = Math.min(Math.max(12, preferredLeft), frameRect.width - cardWidth - 12);
        const top = Math.min(Math.max(12, preferredTop), frameRect.height - cardHeight - 12);

        elements.messierHoverCard.style.left = `${left}px`;
        elements.messierHoverCard.style.top = `${top}px`;
        elements.messierHoverCard.hidden = false;
        elements.messierHoverCard.classList.add('is-visible');
    }

    function createSvgNode(tagName, attributes = {}) {
        const node = document.createElementNS('http://www.w3.org/2000/svg', tagName);
        Object.entries(attributes).forEach(([key, value]) => {
            node.setAttribute(key, String(value));
        });
        return node;
    }

    function formatDateInputValue(date) {
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
    }

    function buildSelectedDateTime() {
        const now = new Date();
        return new Date(
            selectedDate.getFullYear(),
            selectedDate.getMonth(),
            selectedDate.getDate(),
            now.getHours(),
            now.getMinutes(),
            now.getSeconds(),
            now.getMilliseconds()
        );
    }

    function syncDateInput() {
        if (elements.messierDateInput) {
            elements.messierDateInput.value = formatDateInputValue(selectedDate);
        }
    }

    function resetSelectedDateToToday() {
        const today = new Date();
        selectedDate = new Date(today.getFullYear(), today.getMonth(), today.getDate());
        syncDateInput();
        renderMessierChart();
    }

    function shiftSelectedDate(days) {
        selectedDate = new Date(
            selectedDate.getFullYear(),
            selectedDate.getMonth(),
            selectedDate.getDate() + days
        );
        syncDateInput();
        renderMessierChart();
    }

    function bindDateEvents() {
        if (dateEventsBound) {
            return;
        }

        syncDateInput();

        if (elements.messierDatePrev) {
            elements.messierDatePrev.addEventListener('click', () => shiftSelectedDate(-1));
        }

        if (elements.messierDateNext) {
            elements.messierDateNext.addEventListener('click', () => shiftSelectedDate(1));
        }

        if (elements.messierDateToday) {
            elements.messierDateToday.addEventListener('click', () => resetSelectedDateToToday());
        }

        if (elements.messierDateInput) {
            elements.messierDateInput.addEventListener('change', event => {
                const nextValue = event.target.value;
                if (!nextValue) {
                    syncDateInput();
                    return;
                }

                const [year, month, day] = nextValue.split('-').map(Number);
                selectedDate = new Date(year, month - 1, day);
                renderMessierChart();
            });
        }

        dateEventsBound = true;
    }

    function getMoonPhaseSymbol(phaseLabel) {
        const phaseEmojis = {
            'New Moon': '🌑',
            'Waxing Crescent': '🌒',
            'First Quarter': '🌓',
            'Waxing Gibbous': '🌔',
            'Full Moon': '🌕',
            'Waning Gibbous': '🌖',
            'Last Quarter': '🌗',
            'Waning Crescent': '🌘'
        };

        return phaseEmojis[phaseLabel] || '🌕';
    }

    function renderMessierChart() {
        const catalog = messierData.getMessierSkyData();
        const capturedIds = messierData.getCapturedMessierIds();
        const astroNow = buildSelectedDateTime();
        const astroDetails = astro.getAstroDetails(CFG_LOC, astroNow);
        const altitudeSeries = astro.getTodayAltitudeSeries(CFG_LOC, astroDetails.now, 10);
        const currentMoonAlt = astro.getEquatorialAltitude(CFG_LOC, astroDetails.moon.ra, astroDetails.moon.dec, astroDetails.lst);
        const sunEvents = astro.getAltitudeEvents(altitudeSeries, 'sunAlt', -0.833);
        const moonEvents = astro.getAltitudeEvents(altitudeSeries, 'moonAlt', 0.125);
        const width = 1200;
        const height = 720;
        const skyPlot = { top: 52, right: 64, bottom: 62, left: 54 };
        const altitudeWidth = 1200;
        const altitudeHeight = 280;
        const altitudePlot = { top: 26, right: 64, bottom: 62, left: 54 };
        const skyInnerWidth = width - skyPlot.left - skyPlot.right;
        const skyInnerHeight = height - skyPlot.top - skyPlot.bottom;
        const altitudeInnerWidth = altitudeWidth - altitudePlot.left - altitudePlot.right;
        const altitudeInnerHeight = altitudeHeight - altitudePlot.top - altitudePlot.bottom;

        logger.info('Rendering messier chart', {
            showEcliptic,
            showConstellations,
            captured: capturedIds.size,
            altitudeSamples: altitudeSeries.points.length
        });

        function getChartX(raDegrees) {
            const wrapped = ((360 - raDegrees) % 360 + 360) % 360;
            return skyPlot.left + wrapped / 360 * skyInnerWidth;
        }

        function getChartY(decDegrees) {
            return skyPlot.top + (90 - decDegrees) / 180 * skyInnerHeight;
        }

        function getAltitudeChartX(localHours) {
            return altitudePlot.left + localHours / 24 * altitudeInnerWidth;
        }

        function getAltitudeChartY(altitudeDegrees) {
            const clampedAltitude = clamp(altitudeDegrees, 0, 90);
            return altitudePlot.top + (90 - clampedAltitude) / 90 * altitudeInnerHeight;
        }

        function formatHourLabel(localHours) {
            const normalized = ((localHours % 24) + 24) % 24;
            const wholeHours = Math.floor(normalized);
            const minutes = Math.round((normalized - wholeHours) * 60);
            const safeHours = minutes === 60 ? (wholeHours + 1) % 24 : wholeHours;
            const safeMinutes = minutes === 60 ? 0 : minutes;
            return `${String(safeHours).padStart(2, '0')}:${String(safeMinutes).padStart(2, '0')}`;
        }

        function buildVisibleAltitudePath(altitudeKey) {
            let path = '';

            altitudeSeries.points.forEach(point => {
                if (point[altitudeKey] < 0) {
                    return;
                }

                const x = getAltitudeChartX(point.localHours);
                const y = getAltitudeChartY(point[altitudeKey]);
                const previousPoint = altitudeSeries.points[Math.max(0, altitudeSeries.points.indexOf(point) - 1)];
                const shouldMove = path === '' || previousPoint[altitudeKey] < 0;
                path += `${shouldMove ? 'M' : ' L'} ${x} ${y}`;
            });

            return path.trim();
        }

        function renderAltitudeEvent(targetSvg, event, options) {
            if (!event || event.localHours < 0 || event.localHours > 24) {
                return;
            }

            const x = getAltitudeChartX(event.localHours);
            const y = getAltitudeChartY(event.altitude);
            const marker = createSvgNode('g', {
                class: `messier-altitude-event ${options.variant}`,
                transform: `translate(${x}, ${y})`
            });
            marker.appendChild(createSvgNode('circle', {
                cx: 0,
                cy: 0,
                r: 3.2,
                class: 'messier-altitude-event-dot'
            }));

            const text = createSvgNode('text', {
                x: options.textDx || 0,
                y: event.altitude > 78 ? 16 : -10,
                class: 'messier-altitude-event-text',
                'text-anchor': options.anchor || 'middle'
            });
            text.textContent = `${options.label} ${formatHourLabel(event.localHours)}`;
            marker.appendChild(text);
            targetSvg.appendChild(marker);
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
            const minX = skyPlot.left + 6;
            const maxX = width - skyPlot.right - 6;
            const minY = skyPlot.top + 8;
            const maxY = height - skyPlot.bottom - 4;
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
                const left = candidate.anchor === 'end' ? x - labelWidth : candidate.anchor === 'middle' ? x - labelWidth / 2 : x;
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
                return createSvgNode('polygon', {
                    points: `${pointX},${pointY - radius - 0.5} ${pointX + radius + 0.4},${pointY + radius + 0.2} ${pointX - radius - 0.4},${pointY + radius + 0.2}`,
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

        elements.messierCapturedCount.textContent = String(capturedIds.size);
        elements.messierTotalCount.textContent = String(catalog.length || 110);
        elements.messierChart.setAttribute('viewBox', `0 0 ${width} ${height}`);
        elements.messierChart.innerHTML = '';
        elements.messierAltitudeChart.setAttribute('viewBox', `0 0 ${altitudeWidth} ${altitudeHeight}`);
        elements.messierAltitudeChart.innerHTML = '';

        const defs = createSvgNode('defs');
        const softBlur = createSvgNode('filter', { id: 'softBlur', x: '-50%', y: '-50%', width: '200%', height: '200%' });
        softBlur.appendChild(createSvgNode('feGaussianBlur', { stdDeviation: '12' }));
        defs.appendChild(softBlur);

        const chartNoise = createSvgNode('filter', { id: 'chartNoise' });
        chartNoise.appendChild(createSvgNode('feTurbulence', { type: 'fractalNoise', baseFrequency: '0.6', numOctaves: '3', stitchTiles: 'stitch' }));
        chartNoise.appendChild(createSvgNode('feColorMatrix', { type: 'matrix', values: '0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0.04 0' }));
        defs.appendChild(chartNoise);

        const moonGlow = createSvgNode('radialGradient', { id: 'moonGlow' });
        moonGlow.appendChild(createSvgNode('stop', { offset: '0%', 'stop-color': 'rgba(255, 255, 255, 0.22)' }));
        moonGlow.appendChild(createSvgNode('stop', { offset: '60%', 'stop-color': 'rgba(255, 255, 255, 0.08)' }));
        moonGlow.appendChild(createSvgNode('stop', { offset: '100%', 'stop-color': 'rgba(255, 255, 255, 0)' }));
        defs.appendChild(moonGlow);

        const plotClip = createSvgNode('clipPath', { id: 'plotClip' });
        plotClip.appendChild(createSvgNode('rect', { x: skyPlot.left, y: skyPlot.top, width: skyInnerWidth, height: skyInnerHeight }));
        defs.appendChild(plotClip);
        elements.messierChart.appendChild(defs);

        const altitudeDefs = createSvgNode('defs');
        const altitudeClip = createSvgNode('clipPath', { id: 'altitudeClip' });
        altitudeClip.appendChild(createSvgNode('rect', { x: altitudePlot.left, y: altitudePlot.top, width: altitudeInnerWidth, height: altitudeInnerHeight }));
        altitudeDefs.appendChild(altitudeClip);
        const altitudeNoise = createSvgNode('filter', { id: 'altitudeNoise' });
        altitudeNoise.appendChild(createSvgNode('feTurbulence', { type: 'fractalNoise', baseFrequency: '0.6', numOctaves: '3', stitchTiles: 'stitch' }));
        altitudeNoise.appendChild(createSvgNode('feColorMatrix', { type: 'matrix', values: '0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0.04 0' }));
        altitudeDefs.appendChild(altitudeNoise);
        elements.messierAltitudeChart.appendChild(altitudeDefs);

        elements.messierChart.appendChild(createSvgNode('rect', { x: 0, y: 0, width, height, class: 'messier-chart-backdrop' }));
        elements.messierChart.appendChild(createSvgNode('rect', { x: skyPlot.left, y: skyPlot.top, width: skyInnerWidth, height: skyInnerHeight, class: 'messier-chart-plot' }));
        elements.messierChart.appendChild(createSvgNode('rect', { x: skyPlot.left, y: skyPlot.top, width: skyInnerWidth, height: skyInnerHeight, filter: 'url(#chartNoise)', style: 'pointer-events: none;' }));
        elements.messierAltitudeChart.appendChild(createSvgNode('rect', { x: 0, y: 0, width: altitudeWidth, height: altitudeHeight, class: 'messier-chart-backdrop' }));
        elements.messierAltitudeChart.appendChild(createSvgNode('rect', { x: altitudePlot.left, y: altitudePlot.top, width: altitudeInnerWidth, height: altitudeInnerHeight, class: 'messier-altitude-plot' }));
        elements.messierAltitudeChart.appendChild(createSvgNode('rect', { x: altitudePlot.left, y: altitudePlot.top, width: altitudeInnerWidth, height: altitudeInnerHeight, filter: 'url(#altitudeNoise)', style: 'pointer-events: none;' }));

        const drawRaBand = (centerRa, halfWidth, fill) => {
            const r1 = (centerRa - halfWidth + 360) % 360;
            const r2 = (centerRa + halfWidth + 360) % 360;
            const x1 = getChartX(r1);
            const x2 = getChartX(r2);
            const bandGroup = createSvgNode('g', { 'clip-path': 'url(#plotClip)', filter: 'url(#softBlur)' });
            if (x1 > x2) {
                bandGroup.appendChild(createSvgNode('rect', { x: x2, y: skyPlot.top - 20, width: x1 - x2, height: skyInnerHeight + 40, fill }));
            } else {
                bandGroup.appendChild(createSvgNode('rect', { x: skyPlot.left, y: skyPlot.top - 20, width: x1 - skyPlot.left, height: skyInnerHeight + 40, fill }));
                bandGroup.appendChild(createSvgNode('rect', { x: x2, y: skyPlot.top - 20, width: (skyPlot.left + skyInnerWidth) - x2, height: skyInnerHeight + 40, fill }));
            }
            elements.messierChart.appendChild(bandGroup);
        };

        drawRaBand(astroDetails.sun.ra, astro.getHourAngleForAltitude(CFG_LOC, astroDetails.sun.dec, -18), 'rgba(30, 60, 150, 0.15)');
        drawRaBand(astroDetails.sun.ra, astro.getHourAngleForAltitude(CFG_LOC, astroDetails.sun.dec, -12), 'rgba(40, 80, 180, 0.12)');
        drawRaBand(astroDetails.sun.ra, astro.getHourAngleForAltitude(CFG_LOC, astroDetails.sun.dec, -6), 'rgba(50, 110, 220, 0.12)');
        drawRaBand(astroDetails.sun.ra, astro.getHourAngleForAltitude(CFG_LOC, astroDetails.sun.dec, -0.83), 'rgba(255, 200, 80, 0.1)');

        for (let raHour = 3; raHour < 24; raHour += 3) {
            const x = getChartX(raHour * 15);
            elements.messierChart.appendChild(createSvgNode('line', { x1: x, y1: skyPlot.top, x2: x, y2: skyPlot.top + skyInnerHeight, class: 'messier-grid-line' }));
        }

        [-60, -30, 0, 30, 60].forEach(dec => {
            const y = getChartY(dec);
            elements.messierChart.appendChild(createSvgNode('line', { x1: skyPlot.left, y1: y, x2: skyPlot.left + skyInnerWidth, y2: y, class: 'messier-grid-line' }));
        });

        if (showEcliptic) {
            const eclipticPath = createSvgNode('path', { class: 'messier-ecliptic-line', 'clip-path': 'url(#plotClip)' });
            const epsilon = 23.439 * Math.PI / 180;
            const monthStarts = [
                { label: 'Jan', lambda: 280 }, { label: 'Feb', lambda: 310 }, { label: 'Mar', lambda: 340 },
                { label: 'Apr', lambda: 10 }, { label: 'May', lambda: 40 }, { label: 'Jun', lambda: 70 },
                { label: 'Jul', lambda: 100 }, { label: 'Aug', lambda: 130 }, { label: 'Sep', lambda: 160 },
                { label: 'Oct', lambda: 190 }, { label: 'Nov', lambda: 220 }, { label: 'Dec', lambda: 250 }
            ];
            let d = '';
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
                } else if (Math.abs(x - prevX) > skyInnerWidth * 0.5) {
                    d += ` M ${x} ${y}`;
                } else {
                    d += ` L ${x} ${y}`;
                }
                prevX = x;

                if (lambda === 0 || lambda === 180) {
                    const equinoxLabel = createSvgNode('text', { x, y: y + 16, class: 'messier-ecliptic-equinox', 'text-anchor': 'middle', 'clip-path': 'url(#plotClip)' });
                    equinoxLabel.textContent = lambda === 0 ? '♈' : '♎';
                    elements.messierChart.appendChild(equinoxLabel);
                }

                const month = monthStarts.find(item => item.lambda === lambda);
                if (month) {
                    elements.messierChart.appendChild(createSvgNode('circle', { cx: x, cy: y, r: 1.5, class: 'messier-ecliptic-dot', 'clip-path': 'url(#plotClip)' }));
                    const text = createSvgNode('text', { x, y: y - 10, class: 'messier-ecliptic-marker', 'text-anchor': 'middle', 'clip-path': 'url(#plotClip)' });
                    text.textContent = month.label;
                    elements.messierChart.appendChild(text);
                }
            }
            eclipticPath.setAttribute('d', d);
            elements.messierChart.appendChild(eclipticPath);
        }

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
                        const starKey = `${ra.toFixed(2)},${dec.toFixed(2)}`;

                        if (!starsAdded.has(starKey)) {
                            elements.messierChart.appendChild(createSvgNode('circle', { cx: x, cy: y, r: 1.2, class: 'messier-constellation-star', 'clip-path': 'url(#plotClip)' }));
                            starsAdded.add(starKey);
                        }

                        if (index === 0) {
                            d += `M ${x} ${y}`;
                        } else {
                            const prevRa = (line[index - 1][0] + 360) % 360;
                            d += Math.abs(ra360 - prevRa) > 180 ? ` M ${x} ${y}` : ` L ${x} ${y}`;
                        }

                        if (!namePlaced && index === Math.floor(line.length / 2)) {
                            const nameLabel = createSvgNode('text', { x, y: y - 10, class: 'messier-constellation-name', 'text-anchor': 'middle', 'clip-path': 'url(#plotClip)' });
                            nameLabel.textContent = name;
                            elements.messierChart.appendChild(nameLabel);
                            namePlaced = true;
                        }
                    });

                    polyline.setAttribute('d', d);
                    elements.messierChart.appendChild(polyline);
                });
            });
        }

        const lstX = getChartX(astroDetails.lst);
        elements.messierChart.appendChild(createSvgNode('line', { x1: lstX, y1: skyPlot.top, x2: lstX, y2: skyPlot.top + skyInnerHeight, class: 'messier-lst-line' }));
        const lstLabel = createSvgNode('text', { x: lstX, y: skyPlot.top - 18, class: 'messier-lst-label', 'text-anchor': 'middle' });
        lstLabel.textContent = 'Meridian';
        elements.messierChart.appendChild(lstLabel);

        const midnightX = getChartX(astroDetails.midnightRa);
        elements.messierChart.appendChild(createSvgNode('line', { x1: midnightX, y1: skyPlot.top, x2: midnightX, y2: skyPlot.top + skyInnerHeight, class: 'messier-midnight-line' }));
        const midnightLabel = createSvgNode('text', { x: midnightX, y: skyPlot.top - 18, class: 'messier-midnight-label', 'text-anchor': 'middle' });
        midnightLabel.textContent = 'Midnight';
        elements.messierChart.appendChild(midnightLabel);

        elements.messierChart.appendChild(createSvgNode('rect', { x: skyPlot.left, y: skyPlot.top, width: skyInnerWidth, height: skyInnerHeight, class: 'messier-chart-frame-outline' }));
        elements.messierAltitudeChart.appendChild(createSvgNode('rect', { x: altitudePlot.left, y: altitudePlot.top, width: altitudeInnerWidth, height: altitudeInnerHeight, class: 'messier-chart-frame-outline' }));
        const decTitle = createSvgNode('text', { x: 24, y: skyPlot.top - 12, class: 'messier-axis-title' });
        decTitle.textContent = 'DEC';
        elements.messierChart.appendChild(decTitle);
        const altTitle = createSvgNode('text', { x: width - skyPlot.right + 12, y: skyPlot.top - 12, class: 'messier-axis-title' });
        altTitle.textContent = 'ALT';
        elements.messierChart.appendChild(altTitle);
        for (let raHour = 0; raHour < 24; raHour += 3) {
            const x = getChartX(raHour * 15);
            const label = createSvgNode('text', { x, y: skyPlot.top + skyInnerHeight + 24, class: 'messier-axis-label messier-axis-label-ra' });
            label.textContent = `${raHour}h`;
            elements.messierChart.appendChild(label);
        }

        [-60, -30, 0, 30, 60].forEach(dec => {
            const y = getChartY(dec);
            const decLabel = createSvgNode('text', { x: 24, y: y + 5, class: 'messier-axis-label messier-axis-label-dec' });
            decLabel.textContent = dec > 0 ? `+${dec}°` : `${dec}°`;
            elements.messierChart.appendChild(decLabel);

            const alt = 90 - Math.abs(CFG_LOC.lat - dec);
            const altLabel = createSvgNode('text', { x: width - skyPlot.right + 10, y: y + 5, class: 'messier-axis-label messier-axis-label-alt', 'text-anchor': 'start' });
            altLabel.textContent = `${alt.toFixed(0)}°`;
            elements.messierChart.appendChild(altLabel);
        });

        [0, 30, 60, 90].forEach(altitude => {
            const y = getAltitudeChartY(altitude);
            elements.messierAltitudeChart.appendChild(createSvgNode('line', {
                x1: altitudePlot.left,
                y1: y,
                x2: altitudePlot.left + altitudeInnerWidth,
                y2: y,
                class: 'messier-grid-line'
            }));
            const label = createSvgNode('text', {
                x: 24,
                y: y + 5,
                class: 'messier-axis-label messier-axis-label-dec'
            });
            label.textContent = altitude > 0 ? `+${altitude}°` : '0°';
            elements.messierAltitudeChart.appendChild(label);
        });

        for (let hour = 0; hour <= 24; hour += 3) {
            const x = getAltitudeChartX(hour);
            elements.messierAltitudeChart.appendChild(createSvgNode('line', {
                x1: x,
                y1: altitudePlot.top,
                x2: x,
                y2: altitudePlot.top + altitudeInnerHeight,
                class: 'messier-grid-line'
            }));
            const label = createSvgNode('text', {
                x,
                y: altitudePlot.top + altitudeInnerHeight + 24,
                class: 'messier-axis-label messier-axis-label-ra'
            });
            label.textContent = `${String(hour % 24).padStart(2, '0')}:00`;
            elements.messierAltitudeChart.appendChild(label);
        }

        elements.messierAltitudeChart.appendChild(createSvgNode('line', {
            x1: altitudePlot.left,
            y1: getAltitudeChartY(0),
            x2: altitudePlot.left + altitudeInnerWidth,
            y2: getAltitudeChartY(0),
            class: 'messier-grid-line'
        }));

        elements.messierAltitudeChart.appendChild(createSvgNode('path', {
            d: buildVisibleAltitudePath('sunAlt'),
            class: 'messier-altitude-curve is-sun',
            'clip-path': 'url(#altitudeClip)'
        }));
        elements.messierAltitudeChart.appendChild(createSvgNode('path', {
            d: buildVisibleAltitudePath('moonAlt'),
            class: 'messier-altitude-curve is-moon',
            'clip-path': 'url(#altitudeClip)'
        }));

        const currentHour = (astroDetails.now - altitudeSeries.start) / (60 * 60 * 1000);
        const currentSunAltX = getAltitudeChartX(currentHour);
        elements.messierAltitudeChart.appendChild(createSvgNode('line', {
            x1: currentSunAltX,
            y1: altitudePlot.top,
            x2: currentSunAltX,
            y2: altitudePlot.top + altitudeInnerHeight,
            class: 'messier-altitude-now-line'
        }));

        const sunDot = createSvgNode('circle', {
            cx: currentSunAltX,
            cy: getAltitudeChartY(astroDetails.sun.alt),
            r: 3.2,
            class: 'messier-altitude-dot is-sun'
        });
        const moonDot = createSvgNode('circle', {
            cx: currentSunAltX,
            cy: getAltitudeChartY(currentMoonAlt),
            r: 3.2,
            class: 'messier-altitude-dot is-moon'
        });
        elements.messierAltitudeChart.appendChild(sunDot);
        elements.messierAltitudeChart.appendChild(moonDot);
        renderAltitudeEvent(elements.messierAltitudeChart, sunEvents.rise, { label: 'Rise', variant: 'is-sun', anchor: 'start', textDx: 8 });
        renderAltitudeEvent(elements.messierAltitudeChart, sunEvents.set, { label: 'Set', variant: 'is-sun', anchor: 'end', textDx: -8 });
        renderAltitudeEvent(elements.messierAltitudeChart, sunEvents.transit, {
            label: `SUN ${sunEvents.transit ? sunEvents.transit.altitude.toFixed(0) : ''}° |`,
            variant: 'is-sun',
            anchor: 'middle'
        });
        renderAltitudeEvent(elements.messierAltitudeChart, moonEvents.rise, { label: 'Rise', variant: 'is-moon', anchor: 'start', textDx: 8 });
        renderAltitudeEvent(elements.messierAltitudeChart, moonEvents.set, { label: 'Set', variant: 'is-moon', anchor: 'end', textDx: -8 });
        renderAltitudeEvent(elements.messierAltitudeChart, moonEvents.transit, {
            label: `MOON ${moonEvents.transit ? moonEvents.transit.altitude.toFixed(0) : ''}° |`,
            variant: 'is-moon',
            anchor: 'middle'
        });

        const formatTime = date => `${date.getUTCHours().toString().padStart(2, '0')}:${date.getUTCMinutes().toString().padStart(2, '0')} UTC`;
        const formatLocal = date => `${date.getHours().toString().padStart(2, '0')}:${date.getMinutes().toString().padStart(2, '0')} LT`;
        const altitudeLegend = createSvgNode('g', {
            transform: `translate(${width - altitudePlot.right - 250}, ${altitudePlot.top + 10})`
        });
        altitudeLegend.appendChild(createSvgNode('rect', { width: 240, height: 62, rx: 2, class: 'messier-location-legend-bg' }));
        altitudeLegend.appendChild(createSvgNode('text', { x: 10, y: 18, class: 'messier-location-text' })).textContent = `${formatLocal(astroDetails.now)} | ${formatTime(astroDetails.now)}`;
        altitudeLegend.appendChild(createSvgNode('text', { x: 10, y: 36, class: 'messier-location-text' })).textContent = `Sun ${astroDetails.sun.alt.toFixed(1)}° | ${astroDetails.sun.status}`;
        altitudeLegend.appendChild(createSvgNode('text', { x: 10, y: 54, class: 'messier-location-text' }))
            .textContent = `Moon ${currentMoonAlt.toFixed(1)}° | ${getMoonPhaseSymbol(astroDetails.moon.phaseLabel)} ${astroDetails.moon.phaseLabel}`;
        elements.messierAltitudeChart.appendChild(altitudeLegend);

        const sunX = getChartX(astroDetails.sun.ra);
        const sunY = getChartY(astroDetails.sun.dec);
        const sunGroup = createSvgNode('g', { class: 'astro-object sun' });
        sunGroup.appendChild(createSvgNode('circle', { cx: sunX, cy: sunY, r: 6 }));
        const sunText = createSvgNode('text', { x: sunX, y: sunY + 16, 'text-anchor': 'middle' });
        sunText.textContent = 'S';
        sunGroup.appendChild(sunText);
        elements.messierChart.appendChild(sunGroup);

        const moonX = getChartX(astroDetails.moon.ra);
        const moonY = getChartY(astroDetails.moon.dec);
        const moonRadius = (astroDetails.moon.illumination * 60 + 20) * (skyInnerWidth / 360);
        const impactGroup = createSvgNode('g', { 'clip-path': 'url(#plotClip)', filter: 'url(#softBlur)' });
        impactGroup.appendChild(createSvgNode('circle', { cx: moonX, cy: moonY, r: moonRadius, fill: 'url(#moonGlow)', style: 'pointer-events: none;' }));
        if (moonX - moonRadius < skyPlot.left) {
            impactGroup.appendChild(createSvgNode('circle', { cx: moonX + skyInnerWidth, cy: moonY, r: moonRadius, fill: 'url(#moonGlow)', style: 'pointer-events: none;' }));
        }
        if (moonX + moonRadius > skyPlot.left + skyInnerWidth) {
            impactGroup.appendChild(createSvgNode('circle', { cx: moonX - skyInnerWidth, cy: moonY, r: moonRadius, fill: 'url(#moonGlow)', style: 'pointer-events: none;' }));
        }
        elements.messierChart.appendChild(impactGroup);

        const moonGroup = createSvgNode('g', { class: 'astro-object moon' });
        moonGroup.appendChild(createSvgNode('circle', { cx: moonX, cy: moonY, r: 5 }));
        const moonText = createSvgNode('text', { x: moonX, y: moonY + 15, 'text-anchor': 'middle' });
        moonText.textContent = `M ${(astroDetails.moon.illumination * 100).toFixed(0)}%`;
        moonGroup.appendChild(moonText);
        elements.messierChart.appendChild(moonGroup);

        if (showPlanets) {
            const planetSymbols = {
                Mercury: '☿',
                Venus: '♀',
                Mars: '♂',
                Jupiter: '♃',
                Saturn: '♄',
                Uranus: '♅',
                Neptune: '♆'
            };
            Object.entries(astroDetails.planets).forEach(([name, pos]) => {
                const px = getChartX(pos.ra);
                const py = getChartY(pos.dec);
                if (px < skyPlot.left || px > skyPlot.left + skyInnerWidth) return;
                
                const planetGroup = createSvgNode('g', { class: `astro-object planet is-${name.toLowerCase()}` });
                planetGroup.appendChild(createSvgNode('circle', { cx: px, cy: py, r: 2.0 }));
                const planetText = createSvgNode('text', { x: px, y: py + 13, 'text-anchor': 'middle' });
                planetText.textContent = planetSymbols[name] || '';
                planetGroup.appendChild(planetText);
                elements.messierChart.appendChild(planetGroup);
            });
        }

        const legendX = width - skyPlot.right - 260;
        const legendY = skyPlot.top + skyInnerHeight - 78;
        const locationLegend = createSvgNode('g', { transform: `translate(${legendX}, ${legendY})` });
        locationLegend.appendChild(createSvgNode('rect', { width: 250, height: 54, rx: 2, class: 'messier-location-legend-bg' }));
        locationLegend.appendChild(createSvgNode('text', { x: 10, y: 15, class: 'messier-location-text' })).textContent = `${CFG_LOC.name} | ${CFG_LOC.lat.toFixed(2)}°N ${CFG_LOC.lon.toFixed(2)}°E`;
        locationLegend.appendChild(createSvgNode('text', { x: 10, y: 31, class: 'messier-location-text' })).textContent = `Meridian (LST): ${Math.floor(astroDetails.lst / 15)}h ${Math.floor((astroDetails.lst % 15) * 4)}m`;
        locationLegend.appendChild(createSvgNode('text', { x: 10, y: 47, class: 'messier-location-text' })).textContent = `Midnight: ${Math.floor(astroDetails.midnightRa / 15)}h ${Math.floor((astroDetails.midnightRa % 15) * 4).toString().padStart(2, '0')}m`;
        elements.messierChart.appendChild(locationLegend);

        const occupiedLabelBoxes = [];
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
            elements.messierChart.appendChild(point);
        });

        capturedLabelPoints
            .sort((left, right) => left.pointX - right.pointX || left.pointY - right.pointY)
            .forEach(({ item, pointX, pointY }) => {
                const placement = placeMessierLabel(item, pointX, pointY, occupiedLabelBoxes);
                const label = createSvgNode('text', { x: placement.x, y: placement.y, class: 'messier-point-label', 'text-anchor': placement.anchor });
                label.textContent = item.id;
                label.setAttribute('tabindex', '0');
                label.setAttribute('aria-label', `${item.id} captured preview`);
                label.addEventListener('mouseenter', () => showMessierPreview(item.id, pointX, pointY));
                label.addEventListener('mouseleave', queueHideMessierPreview);
                label.addEventListener('focus', () => showMessierPreview(item.id, pointX, pointY));
                label.addEventListener('blur', queueHideMessierPreview);
                elements.messierChart.appendChild(label);
            });
    }

    function showMessierChart(visible) {
        elements.messierChartPanel.hidden = !visible;
        if (!visible) {
            hideMessierPreview();
        }
    }

    function bindToggleEvents() {
        bindDateEvents();

        if (elements.toggleEclipticBtn) {
            elements.toggleEclipticBtn.addEventListener('click', () => {
                showEcliptic = !showEcliptic;
                elements.toggleEclipticBtn.classList.toggle('is-active', showEcliptic);
                logger.info('Toggled ecliptic overlay', { showEcliptic });
                renderMessierChart();
            });
        }

        if (elements.togglePlanetsBtn) {
            elements.togglePlanetsBtn.addEventListener('click', () => {
                showPlanets = !showPlanets;
                elements.togglePlanetsBtn.classList.toggle('is-active', showPlanets);
                logger.info('Toggled planets overlay', { showPlanets });
                renderMessierChart();
            });
        }

        if (elements.toggleConstellationsBtn) {
            elements.toggleConstellationsBtn.addEventListener('click', () => {
                showConstellations = !showConstellations;
                elements.toggleConstellationsBtn.classList.toggle('is-active', showConstellations);
                logger.info('Toggled constellation overlay', { showConstellations });
                renderMessierChart();
            });
        }
    }

    function refreshChartIfVisible() {
        if (state.isMessierMode && state.currentSubcategory === 'CHART') {
            logger.debug('Refreshing visible messier chart');
            renderMessierChart();
        }
    }

    ns.messier = {
        bindToggleEvents,
        focusMessierCard,
        refreshChartIfVisible,
        renderMessierChart,
        scrollToPendingMessierCard,
        showMessierChart
    };
})();
