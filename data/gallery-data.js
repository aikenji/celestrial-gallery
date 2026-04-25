const categoryOrder = ['PLANETS', 'NEBULAE', 'GALAXIES', 'COMETS', 'MESSIER', 'PLAY'];

const categoryLabels = {
    PLANETS: 'Planets',
    NEBULAE: 'Nebulae',
    GALAXIES: 'Galaxies',
    COMETS: 'Comets',
    MESSIER: 'Messier',
    PLAY: 'P.L.A.Y'
};

const photos = [
    {
        title: 'Jupiter - 2022.11.06',
        meta: 'C925 / QHY715MC',
        url: 'library/jup-2022-11-06.jpg',
        sort: 1,
        tags: ['PLANETS', 'JUPITER']
    },
    {
        title: 'Jupiter - 2023.10.24',
        meta: 'C925 / QHY715MC',
        url: 'library/jup-2023-10-24.jpg',
        sort: 2,
        tags: ['PLANETS', 'JUPITER']
    },
    {
        title: 'Jupiter - 2025.11.04',
        meta: 'C925 / QHY715MC',
        url: 'library/jup-2025-11-04.jpg',
        sort: 5,
        tags: ['PLANETS', 'JUPITER']
    },
    {
        title: 'Jupiter - 2025.11.21',
        meta: 'C925 / QHY715MC',
        url: 'library/jup-2025-11-21.jpg',
        sort: 6,
        tags: ['PLANETS', 'JUPITER']
    },
    {
        title: 'Jupiter - 2025.12.17',
        meta: 'C925 / QHY715MC',
        url: 'library/jup-2025-12-17.jpg',
        sort: 7,
        tags: ['PLANETS', 'JUPITER']
    },
    {
        title: 'Jupiter - 2026.01.14',
        meta: 'C925 / QHY715MC',
        url: 'library/jup-2026-01-14.jpg',
        sort: 8,
        tags: ['PLANETS', 'JUPITER']
    },
    {
        title: 'Jupiter - 2026.04.04',
        meta: 'C925 / QHY715MC',
        url: 'library/jup-2026-04-04.jpg',
        sort: 9,
        tags: ['PLANETS', 'JUPITER']
    },
    {
        title: 'Lunar Surface Detail',
        meta: 'Skywatcher 150f4 / Toupek 2600mc',
        url: 'library/luna.jpg',
        sort: 1,
        tags: ['PLANETS', 'MOON']
    },
    {
        title: 'Mars - 2025.01.12',
        meta: 'C925 / QHY715MC',
        url: 'library/mars-2025-01-12.jpg',
        sort: 1,
        tags: ['PLANETS', 'MARS']
    },
    {
        title: 'Mercury - 2025.08.23',
        meta: 'C925 / QHY715MC',
        url: 'library/mer-2025-08-23.jpg',
        sort: 1,
        tags: ['PLANETS', 'MERCURY']
    },
    {
        title: 'Solar System Overview',
        meta: 'Composited view / 16:9',
        url: 'library/solar system in 2025 16_9.jpg',
        sort: 1,
        tags: ['PLANETS', 'OVERVIEW']
    },
    {
        title: 'Saturn - 2025.08.19 Remake',
        meta: 'C925 / QHY715MC',
        url: 'library/sat-2025-08-19-remake.jpg',
        sort: 1,
        tags: ['PLANETS', 'SATURN']
    },
    {
        title: 'Saturn - 2025.11.04',
        meta: 'C925 / QHY715MC',
        url: 'library/sat-2025-11-04.jpg',
        sort: 2,
        tags: ['PLANETS', 'SATURN']
    },
    {
        title: 'Uranus - 2025.09.17',
        meta: 'C925 / QHY715MC',
        url: 'library/ura-2025-09-17.jpg',
        sort: 1,
        tags: ['PLANETS', 'URANUS']
    },
    {
        title: 'Uranus - 2025.10.10',
        meta: 'C925 / QHY715MC',
        url: 'library/ura-2025-10-10.jpg',
        sort: 2,
        tags: ['PLANETS', 'URANUS']
    },
    {
        title: 'Neptune - 2025.08.22 ed2',
        meta: 'C925 / QHY715MC',
        url: 'library/nep-2025-08-22 ed2.jpg',
        sort: 1,
        tags: ['PLANETS', 'NEPTUNE']
    },
    {
        title: 'M78',
        meta: 'Reflection Nebula | Messier 78',
        url: 'library/Messier catalog/M78.jpg',
        sort: 1,
        tags: ['NEBULAE', 'MESSIER']
    },
    {
        title: 'M31',
        meta: 'Andromeda Galaxy | Messier 31',
        url: 'library/Messier catalog/M31.jpg',
        sort: 1,
        tags: ['GALAXIES', 'MESSIER']
    },
    {
        title: 'M65',
        meta: 'Galaxy | Messier 65',
        url: 'library/Messier catalog/M65.jpg',
        sort: 2,
        tags: ['GALAXIES', 'MESSIER']
    },
    {
        title: 'M66',
        meta: 'Galaxy | Messier 66',
        url: 'library/Messier catalog/M66.jpg',
        sort: 3,
        tags: ['GALAXIES', 'MESSIER']
    },
    {
        title: 'M81',
        meta: 'Bode\'s Galaxy | Messier 81',
        url: 'library/Messier catalog/M81.jpg',
        sort: 4,
        tags: ['GALAXIES', 'MESSIER']
    },
    {
        title: 'M82',
        meta: 'Cigar Galaxy | Messier 82',
        url: 'library/Messier catalog/M82.jpg',
        sort: 5,
        tags: ['GALAXIES', 'MESSIER']
    },
    {
        title: 'M101',
        meta: 'Pinwheel Galaxy | Messier 101',
        url: 'library/Messier catalog/M101.jpg',
        sort: 6,
        tags: ['GALAXIES', 'MESSIER']
    },
    {
        title: 'M104',
        meta: 'Sombrero Galaxy | Messier 104',
        url: 'library/Messier catalog/M104.jpg',
        sort: 7,
        tags: ['GALAXIES', 'MESSIER']
    },
    {
        title: 'Markarian Chain',
        meta: 'M84 / M86 / M87 | Virgo Cluster | Messier target',
        url: 'library/MarkarianChain.jpg',
        sort: 8,
        tags: ['GALAXIES', 'MESSIER']
    },
    {
        title: 'Leo Triplet',
        meta: 'M65 / M66 / NGC 3628 | Leo Triplet',
        url: 'library/Leo Triplet.jpg',
        sort: 9,
        tags: ['GALAXIES']
    },
    {
        title: 'C/2024 E3 Tsuchinshan',
        meta: 'Deep Sky | 2024-10-23',
        url: 'library/C2024-E3-Tsuchinshan-2024-10-23-ed2.jpg',
        sort: 1,
        tags: ['COMETS']
    },
    {
        title: 'C/2022 E3 ZTF',
        meta: 'Deep Sky | 2023-01-18',
        url: 'library/C2022E3_ZTF-2023-01-18_v2.jpg',
        sort: 2,
        tags: ['COMETS']
    },
    {
        title: 'C/2025 R3 PanSTARRS',
        meta: 'Deep Sky | 2026-04-19',
        url: 'library/C2025R3_Panstarrs-2026-04-19.jpg',
        sort: 3,
        tags: ['COMETS']
    },
    {
        title: 'Members',
        meta: 'P.L.A.Y | 2026.01.27',
        url: 'library/P.L.A.Y/2026-01-27/members.JPG',
        sort: 1,
        tags: ['PLAY', '2026.01.27']
    },
    {
        title: 'Telescopes',
        meta: 'P.L.A.Y | 2026.01.27',
        url: 'library/P.L.A.Y/2026-01-27/telescopes.JPG',
        sort: 2,
        tags: ['PLAY', '2026.01.27']
    }
];

window.galleryData = {
    categoryOrder,
    categoryLabels,
    photos
};
