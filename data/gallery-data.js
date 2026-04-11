const categoryOrder = ['PLANET', 'NEBULA', 'GALAXY', 'COMETS'];
const subcategoryOrder = {
    PLANET: ['JUPITER', 'MARS', 'MOON', 'OVERVIEW', 'MERCURY', 'VENUS', 'SATURN']
};

const photosByCategory = {
    PLANET: {
        JUPITER: [
            {
                title: 'Jupiter - 2022.11.06',
                meta: 'Jupiter | C925 | QHY716MC',
                url: '2026/jup-2022-11-06.png',
                sort: 1
            },
            {
                title: 'Jupiter - 2023.10.24',
                meta: 'Jupiter | C925 | QHY716MC',
                url: '2026/jup-2023-10-24.png',
                sort: 2
            },
            {
                title: 'Jupiter - 2025.12.17',
                meta: 'Jupiter | C925 | QHY716MC',
                url: '2026/jup-2025-12-17.png',
                sort: 5
            },
            {
                title: 'Jupiter - 2025.11.21',
                meta: 'Jupiter | C925 | QHY716MC',
                url: '2026/jup-2025-11-21.png',
                sort: 6
            },
            {
                title: 'Jupiter - 2025.11.04',
                meta: 'Jupiter | C925 | QHY716MC',
                url: '2026/jup-2025-11-04.png',
                sort: 7
            },
            {
                title: 'Jupiter - 2026.01.14',
                meta: 'Jupiter | C925 | QHY716MC',
                url: '2026/jup-2026-01-14.png',
                sort: 8
            },
            {
                title: 'Jupiter - 2026.03.13',
                meta: 'Jupiter | C925 | QHY716MC',
                url: '2026/jup-2026-03-13.png',
                sort: 9
            },
            {
                title: 'Jupiter - 2026.04.04',
                meta: 'Jupiter | C925 | QHY716MC',
                url: '2026/jup-2026-04-04.png',
                sort: 11
            }
        ],
        MOON: [
            {
                title: 'Lunar Surface Detail',
                meta: 'Moon | C925 | QHY716MC',
                url: '2026/luna.png',
                sort: 1
            }
        ],
        MERCURY: [],
        VENUS: [],
        MARS: [
            {
                title: 'Mars - 2025.01.12',
                meta: 'Mars | C925 | QHY716MC',
                url: '2026/mars-2025-01-12.png',
                sort: 1
            }
        ],
        OVERVIEW: [
            {
                title: 'Solar System Overview',
                meta: 'Composited view | 16:9',
                url: '2026/solar system in 2025 16_9.jpg',
                sort: 1
            }
        ],
        SATURN: []
    },
    NEBULA: [
        {
            title: 'M78 Reflection Nebula',
            meta: 'M78 | Deep Sky',
            url: '2026/M78.jpg',
            sort: 1
        }
    ],
    GALAXY: [],
    COMETS: [
        {
            title: 'C/2024 E3 Tsuchinshan',
            meta: 'Comet | Deep Sky',
            url: '2026/C2024-E3-Tsuchinshan-2024-10-23-ed2.jpg',
            sort: 1
        }
    ]
};

window.galleryData = {
    categoryOrder,
    subcategoryOrder,
    photosByCategory,
    photos: categoryOrder.flatMap(category => {
        const categoryPhotos = photosByCategory[category];
        if (Array.isArray(categoryPhotos)) {
            return categoryPhotos.map(photo => ({
                ...photo,
                category
            }));
        }

        return Object.entries(categoryPhotos).flatMap(([subcategory, items]) =>
            items.map(item => ({
                ...item,
                category,
                subcategory
            }))
        );
    })
};
