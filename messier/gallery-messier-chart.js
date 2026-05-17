/**
 * Messier Sky Chart & Altitude Chart Rendering Module
 * Handles all SVG-based drawing for the celestial map and target tracking.
 */
(() => {
    const ns = window.AstroGallery || (window.AstroGallery = {});
    const { core, astro, messierData } = ns;
    const { elements } = core;
    /**
     * Main entry point for rendering the entire Messier chart panel.
     * @param {Object} options - Current UI state and calculation parameters.
     */
    function renderChart(options) {
        const constellationData = ns.messierConstellations ? ns.messierConstellations.data : {};
        const { showEcliptic, showPlanets, showPolar, viewRa, viewDec, showConstellations, CFG_LOC } = options;
        const catalog = messierData.getMessierSkyData();
        const capturedIds = messierData.getCapturedMessierIds();
        const astroNow = options.astroNow;
        
        // Get astronomical details for the current selected time
        const astroDetails = astro.getAstroDetails(CFG_LOC, astroNow);
        const altitudeSeries = astro.getTodayAltitudeSeries(CFG_LOC, astroDetails.now, 10);
        const currentMoonAlt = astro.getEquatorialAltitude(CFG_LOC, astroDetails.moon.ra, astroDetails.moon.dec, astroDetails.lst);
        const sunEvents = astro.getAltitudeEvents(altitudeSeries, 'sunAlt', -0.833);
        const moonEvents = astro.getAltitudeEvents(altitudeSeries, 'moonAlt', 0.125);

        // Chart dimensions and plot areas
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

        const cx = skyPlot.left + skyInnerWidth / 2;
        const cy = skyPlot.top + skyInnerHeight / 2;
        const rMax = Math.min(skyInnerWidth, skyInnerHeight) * 0.45;

        // Coordinate projection helpers
        function getChartX(raDegrees, decDegrees = 0) {
            if (showPolar) {
                return astro.project3D(raDegrees, decDegrees, viewRa, viewDec, cx, cy, rMax).x;
            }
            const wrapped = ((360 - raDegrees) % 360 + 360) % 360;
            return skyPlot.left + wrapped / 360 * skyInnerWidth;
        }

        function getChartY(decDegrees, raDegrees = 0) {
            if (showPolar) {
                return astro.project3D(raDegrees, decDegrees, viewRa, viewDec, cx, cy, rMax).y;
            }
            return skyPlot.top + (90 - decDegrees) / 180 * skyInnerHeight;
        }

        function getAltitudeChartX(localHours) {
            return altitudePlot.left + localHours / 24 * altitudeInnerWidth;
        }

        function getAltitudeChartY(altitudeDegrees) {
            const clampedAltitude = Math.min(Math.max(altitudeDegrees, 0), 90);
            return altitudePlot.top + (90 - clampedAltitude) / 90 * altitudeInnerHeight;
        }

        // SVG Drawing Helpers
        function buildVisibleAltitudePath(altitudeKey) {
            let path = '';
            altitudeSeries.points.forEach(point => {
                if (point[altitudeKey] < 0) return;
                const x = getAltitudeChartX(point.localHours);
                const y = getAltitudeChartY(point[altitudeKey]);
                const previousPoint = altitudeSeries.points[Math.max(0, altitudeSeries.points.indexOf(point) - 1)];
                const shouldMove = path === '' || previousPoint[altitudeKey] < 0;
                path += `${shouldMove ? 'M' : ' L'} ${x} ${y}`;
            });
            return path.trim();
        }

        function renderAltitudeEvent(targetSvg, event, opts) {
            if (!event || event.localHours < 0 || event.localHours > 24) return;
            const x = getAltitudeChartX(event.localHours);
            const y = getAltitudeChartY(event.altitude);
            const marker = ns.messier.createSvgNode('g', {
                class: `messier-altitude-event ${opts.variant}`,
                transform: `translate(${x}, ${y})`
            });
            marker.appendChild(ns.messier.createSvgNode('circle', { cx: 0, cy: 0, r: 3.2, class: 'messier-altitude-event-dot' }));
            const text = ns.messier.createSvgNode('text', {
                x: opts.textDx || 0,
                y: event.altitude > 78 ? 16 : -10,
                class: 'messier-altitude-event-text',
                'text-anchor': opts.anchor || 'middle'
            });
            text.textContent = `${opts.label} ${astro.formatHourLabel(event.localHours)}`;
            marker.appendChild(text);
            targetSvg.appendChild(marker);
        }

        // Smart label placement algorithm to avoid overlaps
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
                const x = Math.min(Math.max(pointX + candidate.dx, minX), maxX);
                const y = Math.min(Math.max(pointY + candidate.dy, minY), maxY);
                const left = candidate.anchor === 'end' ? x - labelWidth : candidate.anchor === 'middle' ? x - labelWidth / 2 : x;
                const box = { left, right: left + labelWidth, top: y - labelHeight, bottom: y + 1 };
                const overlapCount = occupiedBoxes.reduce((count, occupiedBox) => (
                    count + (astro.boxesOverlap(box, occupiedBox) ? 1 : 0)
                ), 0);
                const score = overlapCount * 1000 + Math.abs(candidate.dx) + Math.abs(candidate.dy);
                if (!bestCandidate || score < bestCandidate.score) {
                    bestCandidate = { ...candidate, x, y, box, score };
                }
            });
            occupiedBoxes.push(bestCandidate.box);
            return bestCandidate;
        }

        // Create distinct shapes for different celestial categories
        function createMessierPointShape(item, pointX, pointY, captured) {
            const className = `messier-point ${captured ? 'is-captured' : 'is-missing'}`;
            const radius = 3.5;
            if (item.category === 'nebula') {
                return ns.messier.createSvgNode('rect', { x: pointX - radius, y: pointY - radius, width: radius * 2, height: radius * 2, class: `${className} is-nebula` });
            }
            if (item.category === 'galaxy') {
                return ns.messier.createSvgNode('polygon', { points: `${pointX},${pointY - radius - 0.5} ${pointX + radius + 0.4},${pointY + radius + 0.2} ${pointX - radius - 0.4},${pointY + radius + 0.2}`, class: `${className} is-galaxy` });
            }
            return ns.messier.createSvgNode('circle', { cx: pointX, cy: pointY, r: radius, class: `${className} is-cluster` });
        }

        // Initialize SVG Canvas
        elements.messierCapturedCount.textContent = String(capturedIds.size);
        elements.messierTotalCount.textContent = String(catalog.length || 110);
        elements.messierChart.setAttribute('viewBox', `0 0 ${width} ${height}`);
        elements.messierChart.innerHTML = '';
        elements.messierAltitudeChart.setAttribute('viewBox', `0 0 ${altitudeWidth} ${altitudeHeight}`);
        elements.messierAltitudeChart.innerHTML = '';

        // Add SVG Filters and Gradients
        const defs = ns.messier.createSvgNode('defs');
        const softBlur = ns.messier.createSvgNode('filter', { id: 'softBlur', x: '-50%', y: '-50%', width: '200%', height: '200%' });
        softBlur.appendChild(ns.messier.createSvgNode('feGaussianBlur', { stdDeviation: '12' }));
        defs.appendChild(softBlur);
        const moonGlow = ns.messier.createSvgNode('radialGradient', { id: 'moonGlow' });
        moonGlow.appendChild(ns.messier.createSvgNode('stop', { offset: '0%', 'stop-color': 'rgba(255, 255, 255, 0.22)' }));
        moonGlow.appendChild(ns.messier.createSvgNode('stop', { offset: '60%', 'stop-color': 'rgba(255, 255, 255, 0.08)' }));
        moonGlow.appendChild(ns.messier.createSvgNode('stop', { offset: '100%', 'stop-color': 'rgba(255, 255, 255, 0)' }));
        defs.appendChild(moonGlow);
        const plotClip = ns.messier.createSvgNode('clipPath', { id: 'plotClip' });
        if (showPolar) {
            plotClip.appendChild(ns.messier.createSvgNode('circle', { cx, cy, r: rMax }));
        } else {
            plotClip.appendChild(ns.messier.createSvgNode('rect', { x: skyPlot.left, y: skyPlot.top, width: skyInnerWidth, height: skyInnerHeight }));
        }
        defs.appendChild(plotClip);
        elements.messierChart.appendChild(defs);

        const altitudeDefs = ns.messier.createSvgNode('defs');
        const altitudeClip = ns.messier.createSvgNode('clipPath', { id: 'altitudeClip' });
        altitudeClip.appendChild(ns.messier.createSvgNode('rect', { x: altitudePlot.left, y: altitudePlot.top, width: altitudeInnerWidth, height: altitudeInnerHeight }));
        altitudeDefs.appendChild(altitudeClip);
        elements.messierAltitudeChart.appendChild(altitudeDefs);

        // Draw Backgrounds
        elements.messierChart.appendChild(ns.messier.createSvgNode('rect', { x: 0, y: 0, width, height, class: 'messier-chart-backdrop' }));
        if (showPolar) {
            elements.messierChart.appendChild(ns.messier.createSvgNode('circle', { cx, cy, r: rMax, class: 'messier-chart-plot' }));
        } else {
            elements.messierChart.appendChild(ns.messier.createSvgNode('rect', { x: skyPlot.left, y: skyPlot.top, width: skyInnerWidth, height: skyInnerHeight, class: 'messier-chart-plot' }));
        }
        elements.messierAltitudeChart.appendChild(ns.messier.createSvgNode('rect', { x: 0, y: 0, width: altitudeWidth, height: altitudeHeight, class: 'messier-chart-backdrop' }));
        elements.messierAltitudeChart.appendChild(ns.messier.createSvgNode('rect', { x: altitudePlot.left, y: altitudePlot.top, width: altitudeInnerWidth, height: altitudeInnerHeight, class: 'messier-altitude-plot' }));
        
        // Render twilight bands as the plot background
        ns.messier.renderTwilightBands(elements.messierAltitudeChart, altitudeSeries, { left: altitudePlot.left, top: altitudePlot.top, width: altitudeInnerWidth, height: altitudeInnerHeight });

        // Twilight Bands on Flat Map (Local Helper, no blur)
        const drawRaBand = (altitudeThreshold, className) => {
            if (showPolar) return;
            const halfWidth = ns.astro.getHourAngleForAltitude(CFG_LOC, astroDetails.sun.dec, altitudeThreshold);
            if (halfWidth === null || isNaN(halfWidth)) return;

            const r1 = (astroDetails.sun.ra - halfWidth + 360) % 360;
            const r2 = (astroDetails.sun.ra + halfWidth + 360) % 360;
            const bandGroup = ns.messier.createSvgNode('g', { 'clip-path': 'url(#plotClip)' });
            const x1 = getChartX(r1);
            const x2 = getChartX(r2);

            if (x1 > x2) {
                bandGroup.appendChild(ns.messier.createSvgNode('rect', { x: x2, y: skyPlot.top - 20, width: x1 - x2, height: skyInnerHeight + 40, class: className }));
            } else {
                bandGroup.appendChild(ns.messier.createSvgNode('rect', { x: skyPlot.left, y: skyPlot.top - 20, width: x1 - skyPlot.left, height: skyInnerHeight + 40, class: className }));
                bandGroup.appendChild(ns.messier.createSvgNode('rect', { x: x2, y: skyPlot.top - 20, width: (skyPlot.left + skyInnerWidth) - x2, height: skyInnerHeight + 40, class: className }));
            }
            elements.messierChart.appendChild(bandGroup);
        };

        // Render nested twilight bands from widest (night) to narrowest (day)
        drawRaBand(-90, 'twilight-night');
        drawRaBand(-18, 'twilight-astronomical');
        drawRaBand(-12, 'twilight-nautical');
        drawRaBand(-6, 'twilight-civil');
        drawRaBand(-0.83, 'twilight-day');

        function getProj(ra, dec) {
            if (showPolar) return astro.project3D(ra, dec, viewRa, viewDec, cx, cy, rMax);
            const wrapped = ((360 - ra) % 360 + 360) % 360;
            const x = skyPlot.left + wrapped / 360 * skyInnerWidth;
            const y = skyPlot.top + (90 - dec) / 180 * skyInnerHeight;
            return { x, y, visible: true };
        }

        // Draw Grid Lines (RA/Dec)
        if (showPolar) {
            for (let raHour = 0; raHour < 24; raHour += 3) {
                const ra = raHour * 15;
                let d = '';
                let lastVisible = false;
                for (let dec = -90; dec <= 90; dec += 5) {
                    const proj = astro.project3D(ra, dec, viewRa, viewDec, cx, cy, rMax);
                    if (proj.visible) d += (d === '' || !lastVisible ? 'M' : ' L') + ` ${proj.x} ${proj.y}`;
                    lastVisible = proj.visible;
                }
                if (d) elements.messierChart.appendChild(ns.messier.createSvgNode('path', { d, class: 'messier-grid-line', fill: 'none' }));
                const labelProj = astro.project3D(ra, 0, viewRa, viewDec, cx, cy, rMax);
                if (labelProj.visible) {
                    const labelX = cx + (labelProj.x - cx) * 1.15;
                    const labelY = cy + (labelProj.y - cy) * 1.15;
                    const label = ns.messier.createSvgNode('text', { x: labelX, y: labelY, class: 'messier-axis-label messier-axis-label-ra', 'text-anchor': 'middle' });
                    label.textContent = `${raHour}h`;
                    elements.messierChart.appendChild(label);
                }
            }
            [-60, -30, 0, 30, 60].forEach(dec => {
                let d = '';
                let lastVisible = false;
                for (let ra = 0; ra <= 360; ra += 5) {
                    const proj = astro.project3D(ra, dec, viewRa, viewDec, cx, cy, rMax);
                    if (proj.visible) d += (d === '' || !lastVisible ? 'M' : ' L') + ` ${proj.x} ${proj.y}`;
                    lastVisible = proj.visible;
                }
                if (d) elements.messierChart.appendChild(ns.messier.createSvgNode('path', { d, class: 'messier-grid-line', fill: 'none' }));
                const labelProj = astro.project3D(viewRa, dec, viewRa, viewDec, cx, cy, rMax);
                if (labelProj.visible) {
                    const decLabel = ns.messier.createSvgNode('text', { x: labelProj.x, y: labelProj.y - 4, class: 'messier-axis-label messier-axis-label-dec', 'text-anchor': 'middle' });
                    decLabel.textContent = dec > 0 ? `+${dec}°` : `${dec}°`;
                    elements.messierChart.appendChild(decLabel);
                }
            });
        } else {
            for (let raHour = 0; raHour < 24; raHour += 3) {
                const x = getChartX(raHour * 15);
                elements.messierChart.appendChild(ns.messier.createSvgNode('line', { x1: x, y1: skyPlot.top, x2: x, y2: skyPlot.top + skyInnerHeight, class: 'messier-grid-line' }));
                const label = ns.messier.createSvgNode('text', { x, y: skyPlot.top + skyInnerHeight + 24, class: 'messier-axis-label messier-axis-label-ra', 'text-anchor': 'middle' });
                label.textContent = `${raHour}h`;
                elements.messierChart.appendChild(label);
            }
            [-60, -30, 0, 30, 60].forEach(dec => {
                const y = getChartY(dec);
                elements.messierChart.appendChild(ns.messier.createSvgNode('line', { x1: skyPlot.left, y1: y, x2: skyPlot.left + skyInnerWidth, y2: y, class: 'messier-grid-line' }));
                const decLabel = ns.messier.createSvgNode('text', { x: 24, y: y + 5, class: 'messier-axis-label messier-axis-label-dec' });
                decLabel.textContent = dec > 0 ? `+${dec}°` : `${dec}°`;
                elements.messierChart.appendChild(decLabel);
                const alt = 90 - Math.abs(CFG_LOC.lat - dec);
                const altLabel = ns.messier.createSvgNode('text', { x: width - skyPlot.right + 10, y: y + 5, class: 'messier-axis-label messier-axis-label-alt', 'text-anchor': 'start' });
                altLabel.textContent = `${alt.toFixed(0)}°`;
                elements.messierChart.appendChild(altLabel);
            });
        }

        // Draw Ecliptic
        if (showEcliptic) {
            const eclipticPath = ns.messier.createSvgNode('path', { class: 'messier-ecliptic-line', 'clip-path': 'url(#plotClip)' });
            const epsilon = 23.439 * Math.PI / 180;
            const monthStarts = [{ label: 'Jan', lambda: 280 }, { label: 'Feb', lambda: 310 }, { label: 'Mar', lambda: 340 }, { label: 'Apr', lambda: 10 }, { label: 'May', lambda: 40 }, { label: 'Jun', lambda: 70 }, { label: 'Jul', lambda: 100 }, { label: 'Aug', lambda: 130 }, { label: 'Sep', lambda: 160 }, { label: 'Oct', lambda: 190 }, { label: 'Nov', lambda: 220 }, { label: 'Dec', lambda: 250 }];
            let d = '', lastVisible = false, lastX = null;
            for (let lambda = 0; lambda <= 360; lambda += 1) {
                const lRad = lambda * Math.PI / 180;
                const raRad = Math.atan2(Math.cos(epsilon) * Math.sin(lRad), Math.cos(lRad));
                const decRad = Math.asin(Math.sin(epsilon) * Math.sin(lRad));
                const ra = (raRad * 180 / Math.PI + 360) % 360;
                const dec = decRad * 180 / Math.PI;
                const proj = getProj(ra, dec);
                if (proj.visible) {
                    const wrap = !showPolar && lastX !== null && Math.abs(proj.x - lastX) > skyInnerWidth * 0.5;
                    d += (d === '' || !lastVisible || wrap ? 'M' : ' L') + ` ${proj.x} ${proj.y}`;
                }
                if (proj.visible && (lambda === 0 || lambda === 180)) {
                    const equinoxLabel = ns.messier.createSvgNode('text', { x: proj.x, y: proj.y + 16, class: 'messier-ecliptic-equinox', 'text-anchor': 'middle', 'clip-path': 'url(#plotClip)' });
                    equinoxLabel.textContent = lambda === 0 ? '♈' : '♎';
                    elements.messierChart.appendChild(equinoxLabel);
                }
                const month = monthStarts.find(item => item.lambda === lambda);
                if (month && proj.visible) {
                    elements.messierChart.appendChild(ns.messier.createSvgNode('circle', { cx: proj.x, cy: proj.y, r: 1.5, class: 'messier-ecliptic-dot', 'clip-path': 'url(#plotClip)' }));
                    const text = ns.messier.createSvgNode('text', { x: proj.x, y: proj.y - 10, class: 'messier-ecliptic-marker', 'text-anchor': 'middle', 'clip-path': 'url(#plotClip)' });
                    text.textContent = month.label;
                    elements.messierChart.appendChild(text);
                }
                lastVisible = proj.visible; lastX = proj.x;
            }
            eclipticPath.setAttribute('d', d);
            elements.messierChart.appendChild(eclipticPath);
        }

        // Draw Constellations
        if (showConstellations) {
            Object.entries(constellationData).forEach(([name, lines]) => {
                let namePlaced = false;
                lines.forEach(line => {
                    const polyline = ns.messier.createSvgNode('path', { class: 'messier-constellation-line', 'clip-path': 'url(#plotClip)' });
                    let d = '', lastVisible = false, lastRa = null;
                    line.forEach(([ra, dec], index) => {
                        const ra360 = (ra + 360) % 360;
                        const proj = getProj(ra360, dec);
                        if (proj.visible) {
                            elements.messierChart.appendChild(ns.messier.createSvgNode('circle', { cx: proj.x, cy: proj.y, r: 1.2, class: 'messier-constellation-star', 'clip-path': 'url(#plotClip)' }));
                            const wrap = !showPolar && lastRa !== null && Math.abs(ra360 - lastRa) > 180;
                            d += (d === '' || !lastVisible || wrap ? 'M' : ' L') + ` ${proj.x} ${proj.y}`;
                            if (!namePlaced && index === Math.floor(line.length / 2)) {
                                const nameLabel = ns.messier.createSvgNode('text', { x: proj.x, y: proj.y - 10, class: 'messier-constellation-name', 'text-anchor': 'middle', 'clip-path': 'url(#plotClip)' });
                                nameLabel.textContent = name;
                                elements.messierChart.appendChild(nameLabel);
                                namePlaced = true;
                            }
                        }
                        lastVisible = proj.visible; lastRa = ra360;
                    });
                    polyline.setAttribute('d', d);
                    elements.messierChart.appendChild(polyline);
                });
            });
        }

        // Draw Reference Meridians
        if (showPolar) {
            let dLst = '', lastVisibleLst = false;
            for (let dec = -90; dec <= 90; dec += 5) {
                const proj = astro.project3D(astroDetails.lst, dec, viewRa, viewDec, cx, cy, rMax);
                if (proj.visible) dLst += (dLst === '' || !lastVisibleLst ? 'M' : ' L') + ` ${proj.x} ${proj.y}`;
                lastVisibleLst = proj.visible;
            }
            if (dLst) {
                elements.messierChart.appendChild(ns.messier.createSvgNode('path', { d: dLst, class: 'messier-lst-line', fill: 'none' }));
                const labelProj = astro.project3D(astroDetails.lst, 45, viewRa, viewDec, cx, cy, rMax);
                if (labelProj.visible) {
                    elements.messierChart.appendChild(ns.messier.createSvgNode('text', { x: labelProj.x, y: labelProj.y - 10, class: 'messier-lst-label', 'text-anchor': 'middle' })).textContent = 'Meridian';
                }
            }
            let dMid = '', lastVisibleMid = false;
            for (let dec = -90; dec <= 90; dec += 5) {
                const proj = astro.project3D(astroDetails.midnightRa, dec, viewRa, viewDec, cx, cy, rMax);
                if (proj.visible) dMid += (dMid === '' || !lastVisibleMid ? 'M' : ' L') + ` ${proj.x} ${proj.y}`;
                lastVisibleMid = proj.visible;
            }
            if (dMid) {
                elements.messierChart.appendChild(ns.messier.createSvgNode('path', { d: dMid, class: 'messier-midnight-line', fill: 'none' }));
                const labelProj = astro.project3D(astroDetails.midnightRa, -45, viewRa, viewDec, cx, cy, rMax);
                if (labelProj.visible) {
                    elements.messierChart.appendChild(ns.messier.createSvgNode('text', { x: labelProj.x, y: labelProj.y + 15, class: 'messier-midnight-label', 'text-anchor': 'middle' })).textContent = 'Midnight';
                }
            }
        } else {
            const lstX = getChartX(astroDetails.lst);
            elements.messierChart.appendChild(ns.messier.createSvgNode('line', { x1: lstX, y1: skyPlot.top, x2: lstX, y2: skyPlot.top + skyInnerHeight, class: 'messier-lst-line' }));
            elements.messierChart.appendChild(ns.messier.createSvgNode('text', { x: lstX, y: skyPlot.top - 18, class: 'messier-lst-label', 'text-anchor': 'middle' })).textContent = 'Meridian';
            const midnightX = getChartX(astroDetails.midnightRa);
            elements.messierChart.appendChild(ns.messier.createSvgNode('line', { x1: midnightX, y1: skyPlot.top, x2: midnightX, y2: skyPlot.top + skyInnerHeight, class: 'messier-midnight-line' }));
            elements.messierChart.appendChild(ns.messier.createSvgNode('text', { x: midnightX, y: skyPlot.top - 18, class: 'messier-midnight-label', 'text-anchor': 'middle' })).textContent = 'Midnight';
        }

        // Draw Chart Frame and Titles
        elements.messierChart.appendChild(ns.messier.createSvgNode(showPolar ? 'circle' : 'rect', { cx, cy, r: rMax, x: skyPlot.left, y: skyPlot.top, width: skyInnerWidth, height: skyInnerHeight, class: 'messier-chart-frame-outline' }));
        elements.messierChart.appendChild(ns.messier.createSvgNode('text', { x: 24, y: skyPlot.top - 12, class: 'messier-axis-title' })).textContent = showPolar ? '' : 'DEC';
        elements.messierChart.appendChild(ns.messier.createSvgNode('text', { x: width - skyPlot.right + 12, y: skyPlot.top - 12, class: 'messier-axis-title' })).textContent = showPolar ? '' : 'ALT';

        // Draw Altitude Chart Elements
        [0, 30, 60, 90].forEach(alt => {
            const y = getAltitudeChartY(alt);
            elements.messierAltitudeChart.appendChild(ns.messier.createSvgNode('line', { x1: altitudePlot.left, y1: y, x2: altitudePlot.left + altitudeInnerWidth, y2: y, class: 'messier-grid-line' }));
            elements.messierAltitudeChart.appendChild(ns.messier.createSvgNode('text', { x: 24, y: y + 5, class: 'messier-axis-label messier-axis-label-dec' })).textContent = alt > 0 ? `+${alt}°` : '0°';
        });

        for (let hour = 0; hour <= 24; hour += 3) {
            const x = getAltitudeChartX(hour);
            elements.messierAltitudeChart.appendChild(ns.messier.createSvgNode('line', { x1: x, y1: altitudePlot.top, x2: x, y2: altitudePlot.top + altitudeInnerHeight, class: 'messier-grid-line' }));
            elements.messierAltitudeChart.appendChild(ns.messier.createSvgNode('text', { x, y: altitudePlot.top + altitudeInnerHeight + 24, class: 'messier-axis-label messier-axis-label-ra' })).textContent = `${String(hour % 24).padStart(2, '0')}:00`;
        }
        elements.messierAltitudeChart.appendChild(ns.messier.createSvgNode('line', { x1: altitudePlot.left, y1: getAltitudeChartY(0), x2: altitudePlot.left + altitudeInnerWidth, y2: getAltitudeChartY(0), class: 'messier-grid-line' }));
        elements.messierAltitudeChart.appendChild(ns.messier.createSvgNode('path', { d: buildVisibleAltitudePath('sunAlt'), class: 'messier-altitude-curve is-sun', 'clip-path': 'url(#altitudeClip)' }));
        elements.messierAltitudeChart.appendChild(ns.messier.createSvgNode('path', { d: buildVisibleAltitudePath('moonAlt'), class: 'messier-altitude-curve is-moon', 'clip-path': 'url(#altitudeClip)' }));

        const currentHour = (astroDetails.now - altitudeSeries.start) / (60 * 60 * 1000);
        const currentSunAltX = getAltitudeChartX(currentHour);
        elements.messierAltitudeChart.appendChild(ns.messier.createSvgNode('line', { x1: currentSunAltX, y1: altitudePlot.top, x2: currentSunAltX, y2: altitudePlot.top + altitudeInnerHeight, class: 'messier-altitude-now-line' }));
        elements.messierAltitudeChart.appendChild(ns.messier.createSvgNode('circle', { cx: currentSunAltX, cy: getAltitudeChartY(astroDetails.sun.alt), r: 3.2, class: 'messier-altitude-dot is-sun' }));
        elements.messierAltitudeChart.appendChild(ns.messier.createSvgNode('circle', { cx: currentSunAltX, cy: getAltitudeChartY(currentMoonAlt), r: 3.2, class: 'messier-altitude-dot is-moon' }));
        renderAltitudeEvent(elements.messierAltitudeChart, sunEvents.rise, { label: 'Rise', variant: 'is-sun', anchor: 'start', textDx: 8 });
        renderAltitudeEvent(elements.messierAltitudeChart, sunEvents.set, { label: 'Set', variant: 'is-sun', anchor: 'end', textDx: -8 });
        renderAltitudeEvent(elements.messierAltitudeChart, sunEvents.transit, { label: `SUN ${sunEvents.transit ? sunEvents.transit.altitude.toFixed(0) : ''}° |`, variant: 'is-sun', anchor: 'middle' });
        renderAltitudeEvent(elements.messierAltitudeChart, moonEvents.rise, { label: 'Rise', variant: 'is-moon', anchor: 'start', textDx: 8 });
        renderAltitudeEvent(elements.messierAltitudeChart, moonEvents.set, { label: 'Set', variant: 'is-moon', anchor: 'end', textDx: -8 });
        renderAltitudeEvent(elements.messierAltitudeChart, moonEvents.transit, { label: `MOON ${moonEvents.transit ? moonEvents.transit.altitude.toFixed(0) : ''}° |`, variant: 'is-moon', anchor: 'middle' });

        // Information Legend
        const altitudeLegend = ns.messier.createSvgNode('g', { transform: `translate(${width - altitudePlot.right - 250}, ${altitudePlot.top + 10})` });
        altitudeLegend.appendChild(ns.messier.createSvgNode('rect', { width: 240, height: 62, rx: 2, class: 'messier-location-legend-bg' }));
        altitudeLegend.appendChild(ns.messier.createSvgNode('text', { x: 10, y: 18, class: 'messier-location-text' })).textContent = `${astroDetails.now.getHours().toString().padStart(2, '0')}:${astroDetails.now.getMinutes().toString().padStart(2, '0')} LT | ${astroDetails.now.getUTCHours().toString().padStart(2, '0')}:${astroDetails.now.getUTCMinutes().toString().padStart(2, '0')} UTC`;
        altitudeLegend.appendChild(ns.messier.createSvgNode('text', { x: 10, y: 36, class: 'messier-location-text' })).textContent = `Sun ${astroDetails.sun.alt.toFixed(1)}° | ${astroDetails.sun.status}`;
        altitudeLegend.appendChild(ns.messier.createSvgNode('text', { x: 10, y: 54, class: 'messier-location-text' })).textContent = `Moon ${currentMoonAlt.toFixed(1)}° | ${astro.getMoonPhaseSymbol(astroDetails.moon.phaseLabel)} ${astroDetails.moon.phaseLabel}`;
        elements.messierAltitudeChart.appendChild(altitudeLegend);

        // Render Sun and Moon Objects on Main Chart
        const sunProj = getProj(astroDetails.sun.ra, astroDetails.sun.dec);
        if (sunProj.visible) {
            const sunGroup = ns.messier.createSvgNode('g', { class: 'astro-object sun' });
            sunGroup.appendChild(ns.messier.createSvgNode('circle', { cx: sunProj.x, cy: sunProj.y, r: 6 }));
            sunGroup.appendChild(ns.messier.createSvgNode('text', { x: sunProj.x, y: sunProj.y + 16, 'text-anchor': 'middle' })).textContent = 'S';
            elements.messierChart.appendChild(sunGroup);
        }

        const moonProj = getProj(astroDetails.moon.ra, astroDetails.moon.dec);
        const moonRadius = (astroDetails.moon.illumination * 60 + 20) * (showPolar ? (rMax / 90) : (skyInnerWidth / 360));
        const impactGroup = ns.messier.createSvgNode('g', { 'clip-path': 'url(#plotClip)', filter: 'url(#softBlur)' });
        if (moonProj.visible) {
            impactGroup.appendChild(ns.messier.createSvgNode('circle', { cx: moonProj.x, cy: moonProj.y, r: moonRadius, fill: 'url(#moonGlow)', style: 'pointer-events: none;' }));
            if (!showPolar) {
                if (moonProj.x - moonRadius < skyPlot.left) impactGroup.appendChild(ns.messier.createSvgNode('circle', { cx: moonProj.x + skyInnerWidth, cy: moonProj.y, r: moonRadius, fill: 'url(#moonGlow)', style: 'pointer-events: none;' }));
                if (moonProj.x + moonRadius > skyPlot.left + skyInnerWidth) impactGroup.appendChild(ns.messier.createSvgNode('circle', { cx: moonProj.x - skyInnerWidth, cy: moonProj.y, r: moonRadius, fill: 'url(#moonGlow)', style: 'pointer-events: none;' }));
            }
            elements.messierChart.appendChild(impactGroup);
            const moonGroup = ns.messier.createSvgNode('g', { class: 'astro-object moon' });
            moonGroup.appendChild(ns.messier.createSvgNode('circle', { cx: moonProj.x, cy: moonProj.y, r: 5 }));
            moonGroup.appendChild(ns.messier.createSvgNode('text', { x: moonProj.x, y: moonProj.y + 15, 'text-anchor': 'middle' })).textContent = `M ${(astroDetails.moon.illumination * 100).toFixed(0)}%`;
            elements.messierChart.appendChild(moonGroup);
        }

        // Render Planets
        if (showPlanets) {
            const symbols = { Mercury: '☿', Venus: '♀', Mars: '♂', Jupiter: '♃', Saturn: '♄', Uranus: '♅', Neptune: '♆' };
            Object.entries(astroDetails.planets).forEach(([name, pos]) => {
                const proj = getProj(pos.ra, pos.dec);
                if (!proj.visible) return;
                const g = ns.messier.createSvgNode('g', { class: `astro-object planet is-${name.toLowerCase()}` });
                g.appendChild(ns.messier.createSvgNode('circle', { cx: proj.x, cy: proj.y, r: 2.0 }));
                g.appendChild(ns.messier.createSvgNode('text', { x: proj.x, y: proj.y + 11, 'text-anchor': 'middle' })).textContent = symbols[name] || '';
                elements.messierChart.appendChild(g);
            });
        }

        // Bottom Legend for Location and SID/LST
        const legendX = width - skyPlot.right - 260;
        const legendY = showPolar ? (height - skyPlot.bottom - 60) : (skyPlot.top + skyInnerHeight - 78);
        const locLegend = ns.messier.createSvgNode('g', { transform: `translate(${legendX}, ${legendY})` });
        locLegend.appendChild(ns.messier.createSvgNode('rect', { width: 250, height: 54, rx: 2, class: 'messier-location-legend-bg' }));
        locLegend.appendChild(ns.messier.createSvgNode('text', { x: 10, y: 15, class: 'messier-location-text' })).textContent = `${CFG_LOC.name} | ${CFG_LOC.lat.toFixed(2)}°N ${CFG_LOC.lon.toFixed(2)}°E`;
        locLegend.appendChild(ns.messier.createSvgNode('text', { x: 10, y: 31, class: 'messier-location-text' })).textContent = `Meridian (LST): ${Math.floor(astroDetails.lst / 15)}h ${Math.floor((astroDetails.lst % 15) * 4)}m`;
        locLegend.appendChild(ns.messier.createSvgNode('text', { x: 10, y: 47, class: 'messier-location-text' })).textContent = `Midnight: ${Math.floor(astroDetails.midnightRa / 15)}h ${Math.floor((astroDetails.midnightRa % 15) * 4).toString().padStart(2, '0')}m`;
        elements.messierChart.appendChild(locLegend);

        // Render All Messier Targets
        const occupiedLabelBoxes = [];
        const capturedLabelPoints = [];
        catalog.forEach(item => {
            const captured = capturedIds.has(item.id);
            const proj = getProj(item.raDegrees, item.decDegrees);
            if (!proj.visible) return;
            const point = createMessierPointShape(item, proj.x, proj.y, captured);
            if (captured) capturedLabelPoints.push({ item, pointX: proj.x, pointY: proj.y });
            point.appendChild(ns.messier.createSvgNode('title')).textContent = captured ? `${item.id} captured` : `${item.id} missing`;
            elements.messierChart.appendChild(point);
        });

        // Add Labels for Captured Targets (using overlap avoidance)
        capturedLabelPoints.sort((l, r) => l.pointX - r.pointX || l.pointY - r.pointY).forEach(({ item, pointX, pointY }) => {
            const placement = placeMessierLabel(item, pointX, pointY, occupiedLabelBoxes);
            const label = ns.messier.createSvgNode('text', { x: placement.x, y: placement.y, class: 'messier-point-label', 'text-anchor': placement.anchor });
            label.textContent = item.id;
            label.setAttribute('tabindex', '0'); label.setAttribute('aria-label', `${item.id} captured preview`);
            label.addEventListener('mouseenter', () => ns.messier.showMessierPreview(item.id, pointX, pointY));
            label.addEventListener('mouseleave', ns.messier.queueHideMessierPreview);
            label.addEventListener('focus', () => ns.messier.showMessierPreview(item.id, pointX, pointY));
            label.addEventListener('blur', ns.messier.queueHideMessierPreview);
            elements.messierChart.appendChild(label);
        });

        // Delegate Recommendation List Rendering
        ns.messier.renderRecommendations(catalog, astroDetails, capturedIds, CFG_LOC);
    }

    /**
     * Renders background twilight bands based on sun altitude.
     */
    function renderTwilightBands(svg, series, plotParams) {
        const twilightLevels = [
            { threshold: 0, class: 'twilight-day' },
            { threshold: -6, class: 'twilight-civil' },
            { threshold: -12, class: 'twilight-nautical' },
            { threshold: -18, class: 'twilight-astronomical' },
            { threshold: -90, class: 'twilight-night' }
        ];
        series.points.forEach((point, i) => {
            if (i === 0) return;
            const prev = series.points[i - 1];
            const x1 = plotParams.left + (prev.localHours / 24) * plotParams.width;
            const x2 = plotParams.left + (point.localHours / 24) * plotParams.width;
            const avgSunAlt = (prev.sunAlt + point.sunAlt) / 2;
            let cssClass = 'twilight-night';
            for (const level of twilightLevels) {
                if (avgSunAlt >= level.threshold) { cssClass = level.class; break; }
            }
            // Use appendChild instead of insertBefore to respect external layering logic
            svg.appendChild(ns.messier.createSvgNode('rect', { x: x1, y: plotParams.top, width: x2 - x1, height: plotParams.height, class: cssClass }));
        });
    }

    // Export to namespace
    ns.messier = ns.messier || {};
    ns.messier.renderChart = renderChart;
    ns.messier.renderTwilightBands = renderTwilightBands;
})();
