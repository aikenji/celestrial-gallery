(() => {
    const ns = window.AstroGallery || (window.AstroGallery = {});
    const logger = ns.logger.create('astro');

    function createObserverLocation(config = {}) {
        return {
            name: config.name || 'Unknown',
            lat: Number(config.lat) || 0,
            lon: Number(config.lon) || 0
        };
    }

    function getMoonPhaseLabel(phaseAngleDegrees) {
        const normalized = ((phaseAngleDegrees % 360) + 360) % 360;

        if (normalized < 22.5 || normalized >= 337.5) {
            return 'New Moon';
        }
        if (normalized < 67.5) {
            return 'Waxing Crescent';
        }
        if (normalized < 112.5) {
            return 'First Quarter';
        }
        if (normalized < 157.5) {
            return 'Waxing Gibbous';
        }
        if (normalized < 202.5) {
            return 'Full Moon';
        }
        if (normalized < 247.5) {
            return 'Waning Gibbous';
        }
        if (normalized < 292.5) {
            return 'Last Quarter';
        }
        return 'Waning Crescent';
    }

    function getAstroDetails(location, now = new Date()) {
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
        const lst = (gmst + location.lon + 360) % 360;
        const sunLongitudeBase = (280.46 + 0.9856474 * d) % 360;
        const solarAnomaly = (357.528 + 0.9856003 * d) % 360;
        const sunLong = sunLongitudeBase + 1.915 * Math.sin(solarAnomaly * Math.PI / 180) + 0.02 * Math.sin(2 * solarAnomaly * Math.PI / 180);
        const epsilon = 23.439 - 0.0000004 * d;
        const sunRa = (Math.atan2(Math.cos(epsilon * Math.PI / 180) * Math.sin(sunLong * Math.PI / 180), Math.cos(sunLong * Math.PI / 180)) * 180 / Math.PI + 360) % 360;
        const sunDec = Math.asin(Math.sin(epsilon * Math.PI / 180) * Math.sin(sunLong * Math.PI / 180)) * 180 / Math.PI;
        const midnightRa = (sunRa + 180) % 360;
        const phi = location.lat * Math.PI / 180;
        const delta = sunDec * Math.PI / 180;
        const hourAngle = (lst - sunRa) * Math.PI / 180;
        const sinAlt = Math.sin(phi) * Math.sin(delta) + Math.cos(phi) * Math.cos(delta) * Math.cos(hourAngle);
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
        const moonF = (93.272 + 13.22935 * d) % 360;
        const moonLong = moonL + 6.289 * Math.sin(moonM * Math.PI / 180);
        const moonLat = 5.128 * Math.sin(moonF * Math.PI / 180);
        const moonRa = Math.atan2(Math.sin(moonLong * Math.PI / 180) * Math.cos(epsilon * Math.PI / 180) - Math.tan(moonLat * Math.PI / 180) * Math.sin(epsilon * Math.PI / 180), Math.cos(moonLong * Math.PI / 180)) * 180 / Math.PI;
        const moonDec = Math.asin(Math.sin(moonLat * Math.PI / 180) * Math.cos(epsilon * Math.PI / 180) + Math.cos(moonLat * Math.PI / 180) * Math.sin(epsilon * Math.PI / 180) * Math.sin(moonLong * Math.PI / 180)) * 180 / Math.PI;
        const moonPhaseAngle = (moonLong - sunLong + 360) % 360;
        const moonIllumination = (1 - Math.cos(moonPhaseAngle * Math.PI / 180)) / 2;

        const sunR = 1.00014 - 0.01671 * Math.cos(solarAnomaly * Math.PI / 180) - 0.00014 * Math.cos(2 * solarAnomaly * Math.PI / 180);
        const sunX = sunR * Math.cos(sunLong * Math.PI / 180);
        const sunY = sunR * Math.sin(sunLong * Math.PI / 180);

        const planets = {};
        const planetData = {
            Mercury: { N: 48.3313, i: 7.0047, w: 29.1241, a: 0.387098, e: 0.205635, M0: 168.6562, M1: 4.0923344368 },
            Venus: { N: 76.6799, i: 3.3946, w: 54.8910, a: 0.723330, e: 0.006773, M0: 48.0052, M1: 1.6021302244 },
            Mars: { N: 49.5574, i: 1.8497, w: 286.5016, a: 1.523688, e: 0.093405, M0: 18.6021, M1: 0.5240207766 },
            Jupiter: { N: 100.4542, i: 1.3030, w: 273.8777, a: 5.20256, e: 0.048498, M0: 19.8950, M1: 0.0830853001 },
            Saturn: { N: 113.6634, i: 2.4886, w: 339.3939, a: 9.55475, e: 0.055546, M0: 316.9670, M1: 0.0334442282 },
            Uranus: { N: 74.0005, i: 0.7733, w: 96.6612, a: 19.18171, e: 0.047318, M0: 142.5905, M1: 0.011725806 },
            Neptune: { N: 131.7806, i: 1.7700, w: 272.8461, a: 30.05826, e: 0.008606, M0: 260.2471, M1: 0.005995147 }
        };

        for (const [name, p] of Object.entries(planetData)) {
            const M = (p.M0 + p.M1 * d) % 360;
            const E = M + (180 / Math.PI) * p.e * Math.sin(M * Math.PI / 180) * (1 + p.e * Math.cos(M * Math.PI / 180));
            const xv = p.a * (Math.cos(E * Math.PI / 180) - p.e);
            const yv = p.a * (Math.sqrt(1 - p.e * p.e) * Math.sin(E * Math.PI / 180));
            const v = Math.atan2(yv, xv) * 180 / Math.PI;
            const r = Math.sqrt(xv * xv + yv * yv);
            const xh = r * (Math.cos(p.N * Math.PI / 180) * Math.cos((v + p.w) * Math.PI / 180) - Math.sin(p.N * Math.PI / 180) * Math.sin((v + p.w) * Math.PI / 180) * Math.cos(p.i * Math.PI / 180));
            const yh = r * (Math.sin(p.N * Math.PI / 180) * Math.cos((v + p.w) * Math.PI / 180) + Math.cos(p.N * Math.PI / 180) * Math.sin((v + p.w) * Math.PI / 180) * Math.cos(p.i * Math.PI / 180));
            const zh = r * (Math.sin((v + p.w) * Math.PI / 180) * Math.sin(p.i * Math.PI / 180));
            const xg = xh + sunX;
            const yg = yh + sunY;
            const zg = zh;
            const ecl = Math.atan2(yg, xg) * 180 / Math.PI;
            const ecb = Math.atan2(zg, Math.sqrt(xg * xg + yg * yg)) * 180 / Math.PI;
            const ra = (Math.atan2(Math.sin(ecl * Math.PI / 180) * Math.cos(epsilon * Math.PI / 180) - Math.tan(ecb * Math.PI / 180) * Math.sin(epsilon * Math.PI / 180), Math.cos(ecl * Math.PI / 180)) * 180 / Math.PI + 360) % 360;
            const dec = Math.asin(Math.sin(ecb * Math.PI / 180) * Math.cos(epsilon * Math.PI / 180) + Math.cos(ecb * Math.PI / 180) * Math.sin(epsilon * Math.PI / 180) * Math.sin(ecl * Math.PI / 180)) * 180 / Math.PI;
            planets[name] = { ra, dec };
        }

        return {
            now,
            lst,
            midnightRa,
            sun: { ra: sunRa, dec: sunDec, alt: sunAlt, status: nightStatus },
            moon: {
                ra: (moonRa + 360) % 360,
                dec: moonDec,
                illumination: moonIllumination,
                phaseAngle: moonPhaseAngle,
                phaseLabel: getMoonPhaseLabel(moonPhaseAngle)
            },
            planets
        };
    }

    function getHourAngleForAltitude(location, sunDeclinationDegrees, altitudeDegrees) {
        const phi = location.lat * Math.PI / 180;
        const deltaSun = sunDeclinationDegrees * Math.PI / 180;
        const altitude = altitudeDegrees * Math.PI / 180;
        const cosH = (Math.sin(altitude) - Math.sin(phi) * Math.sin(deltaSun)) / (Math.cos(phi) * Math.cos(deltaSun));
        return Math.acos(Math.max(-1, Math.min(1, cosH))) * 180 / Math.PI;
    }

    function getEquatorialAltitude(location, raDegrees, decDegrees, lstDegrees) {
        const phi = location.lat * Math.PI / 180;
        const delta = decDegrees * Math.PI / 180;
        const hourAngle = (lstDegrees - raDegrees) * Math.PI / 180;
        const sinAlt = Math.sin(phi) * Math.sin(delta) + Math.cos(phi) * Math.cos(delta) * Math.cos(hourAngle);
        return Math.asin(sinAlt) * 180 / Math.PI;
    }

    function getTodayAltitudeSeries(location, now = new Date(), stepMinutes = 30) {
        const localStart = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0);
        const localEnd = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1, 0, 0, 0, 0);
        const points = [];

        for (let cursor = localStart.getTime(); cursor <= localEnd.getTime(); cursor += stepMinutes * 60 * 1000) {
            const sampleDate = new Date(cursor);
            const details = getAstroDetails(location, sampleDate);
            points.push({
                date: sampleDate,
                localHours: (sampleDate - localStart) / (60 * 60 * 1000),
                sunAlt: details.sun.alt,
                moonAlt: getEquatorialAltitude(location, details.moon.ra, details.moon.dec, details.lst)
            });
        }

        logger.debug('Built daily altitude series', {
            points: points.length,
            stepMinutes
        });

        return {
            start: localStart,
            end: localEnd,
            points
        };
    }

    function interpolateCrossing(leftPoint, rightPoint, altitudeKey, thresholdDegrees = 0) {
        const leftAlt = leftPoint[altitudeKey] - thresholdDegrees;
        const rightAlt = rightPoint[altitudeKey] - thresholdDegrees;
        const delta = rightAlt - leftAlt;
        const ratio = delta === 0 ? 0 : (-leftAlt) / delta;
        const localHours = leftPoint.localHours + (rightPoint.localHours - leftPoint.localHours) * ratio;
        return {
            localHours,
            altitude: 0
        };
    }

    function getAltitudeEvents(series, altitudeKey, thresholdDegrees = 0) {
        const { points } = series;
        let rise = null;
        let set = null;
        let transit = null;

        for (let index = 1; index < points.length; index += 1) {
            const leftPoint = points[index - 1];
            const rightPoint = points[index];
            const leftAlt = leftPoint[altitudeKey] - thresholdDegrees;
            const rightAlt = rightPoint[altitudeKey] - thresholdDegrees;

            if (rise === null && leftAlt < 0 && rightAlt >= 0) {
                rise = interpolateCrossing(leftPoint, rightPoint, altitudeKey, thresholdDegrees);
            }

            if (set === null && leftAlt >= 0 && rightAlt < 0) {
                set = interpolateCrossing(leftPoint, rightPoint, altitudeKey, thresholdDegrees);
            }
        }

        points.forEach(point => {
            if (!transit || point[altitudeKey] > transit.altitude) {
                transit = {
                    localHours: point.localHours,
                    altitude: point[altitudeKey]
                };
            }
        });

        return { rise, set, transit };
    }

    function getObservingNightSeries(location, now = new Date(), stepMinutes = 30) {
        // Start from 12:00 PM (noon) today
        const start = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 12, 0, 0, 0);
        // End at 12:00 PM (noon) tomorrow
        const end = new Date(start.getTime() + 24 * 60 * 60 * 1000);
        const points = [];

        for (let cursor = start.getTime(); cursor <= end.getTime(); cursor += stepMinutes * 60 * 1000) {
            const sampleDate = new Date(cursor);
            const details = getAstroDetails(location, sampleDate);
            points.push({
                date: sampleDate,
                localHours: (sampleDate - start) / (60 * 60 * 1000), // Relative to start (0 to 24)
                sunAlt: details.sun.alt,
                moonAlt: getEquatorialAltitude(location, details.moon.ra, details.moon.dec, details.lst)
            });
        }

        return { start, end, points };
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

    function formatHourLabel(localHours) {
        const normalized = ((localHours % 24) + 24) % 24;
        const wholeHours = Math.floor(normalized);
        const minutes = Math.round((normalized - wholeHours) * 60);
        const safeHours = minutes === 60 ? (wholeHours + 1) % 24 : wholeHours;
        const safeMinutes = minutes === 60 ? 0 : minutes;
        return `${String(safeHours).padStart(2, '0')}:${String(safeMinutes).padStart(2, '0')}`;
    }

    function project3D(ra, dec, viewRa, viewDec, cx, cy, rMax) {
        const raRad = (ra - viewRa) * Math.PI / 180;
        const decRad = dec * Math.PI / 180;
        const rotDecRad = viewDec * Math.PI / 180;

        const x = Math.cos(decRad) * Math.sin(raRad);
        const y = Math.sin(decRad) * Math.cos(rotDecRad) - Math.cos(decRad) * Math.sin(rotDecRad) * Math.cos(raRad);
        const z = Math.sin(decRad) * Math.sin(rotDecRad) + Math.cos(decRad) * Math.cos(rotDecRad) * Math.cos(raRad);

        return {
            x: cx + x * rMax,
            y: cy - y * rMax,
            z: z,
            visible: z > 0
        };
    }

    function boxesOverlap(a, b, paddingValue = 3) {
        return !(
            a.right + paddingValue < b.left ||
            a.left - paddingValue > b.right ||
            a.bottom + paddingValue < b.top ||
            a.top - paddingValue > b.bottom
        );
    }

    ns.astro = {
        createObserverLocation,
        getEquatorialAltitude,
        getAltitudeEvents,
        getAstroDetails,
        getHourAngleForAltitude,
        getMoonPhaseLabel,
        getTodayAltitudeSeries,
        getObservingNightSeries,
        getMoonPhaseSymbol,
        formatHourLabel,
        project3D,
        boxesOverlap
    };

    logger.info('Astro utilities initialized');
})();
