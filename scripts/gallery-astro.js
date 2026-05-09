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
            }
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

    ns.astro = {
        createObserverLocation,
        getEquatorialAltitude,
        getAltitudeEvents,
        getAstroDetails,
        getHourAngleForAltitude,
        getMoonPhaseLabel,
        getTodayAltitudeSeries
    };

    logger.info('Astro utilities initialized');
})();
