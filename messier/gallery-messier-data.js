(() => {
    const ns = window.AstroGallery || (window.AstroGallery = {});
    const logger = ns.logger.create('messier-data');
    const { photos } = ns.core;
    const messierCatalog = Array.isArray(window.messierCatalogData) ? window.messierCatalogData : [];

    function getMessierSortValue(photo) {
        const source = `${photo.title || ''} ${photo.meta || ''} ${photo.url || ''}`;
        const matches = [...source.matchAll(/M\s*(\d{1,3})/gi)]
            .map(match => Number(match[1]))
            .filter(Number.isFinite);
        return matches.length > 0 ? Math.min(...matches) : Number.MAX_SAFE_INTEGER;
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
                    category: normalizeMessierCategory(item.T),
                    constellation: item.Con || '',
                    magnitude: parseFloat(item.V) || 15
                };
            })
            .filter(Boolean)
            .sort((left, right) => Number(left.id.slice(1)) - Number(right.id.slice(1)));
    }

    ns.messierData = {
        getCapturedMessierIds,
        getMessierPhotoById,
        getMessierSkyData,
        getMessierSortValue,
        getPhotoMessierId,
        normalizeMessierId
    };

    logger.info('Messier data utilities initialized', {
        catalogSize: messierCatalog.length
    });
})();
