const categoryOrder = ['PLANETS', 'NEBULAE', 'GALAXIES', 'COMETS', 'PLAY'];
const subcategoryOrder = {
    PLANETS: ['JUPITER', 'SATURN', 'MARS', 'MERCURY', 'URANUS', 'NEPTUNE', 'MOON', 'OVERVIEW'],
    PLAY: ['2026.01.27']
};

const photosByCategory = {
    PLANETS: {
        JUPITER: [
            {
                title: 'Jupiter - 2022.11.06',
                meta: 'Jupiter | C925 | QHY715MC',
                url: 'library/jup-2022-11-06.jpg',
                sort: 1
            },
            {
                title: 'Jupiter - 2023.10.24',
                meta: 'Jupiter | C925 | QHY715MC',
                url: 'library/jup-2023-10-24.jpg',
                sort: 2
            },
            {
                title: 'Jupiter - 2025.11.04',
                meta: 'Jupiter | C925 | QHY715MC',
                url: 'library/jup-2025-11-04.jpg',
                sort: 5
            },
            {
                title: 'Jupiter - 2025.11.21',
                meta: 'Jupiter | C925 | QHY715MC',
                url: 'library/jup-2025-11-21.jpg',
                sort: 6
            },
            {
                title: 'Jupiter - 2025.12.17',
                meta: 'Jupiter | C925 | QHY715MC',
                url: 'library/jup-2025-12-17.jpg',
                sort: 7
            },
            {
                title: 'Jupiter - 2026.01.14',
                meta: 'Jupiter | C925 | QHY715MC',
                url: 'library/jup-2026-01-14.jpg',
                sort: 8
            },
            {
                title: 'Jupiter - 2026.04.04',
                meta: 'Jupiter | C925 | QHY715MC',
                url: 'library/jup-2026-04-04.jpg',
                sort: 9
            }
        ],
        MOON: [
            {
                title: 'Lunar Surface Detail',
                meta: 'Moon | Skywatcher 150f4 | Toupek 2600mc',
                url: 'library/luna.jpg',
                sort: 1
            }
        ],
        MARS: [
            {
                title: 'Mars - 2025.01.12',
                meta: 'Mars | C925 | QHY715MC',
                url: 'library/mars-2025-01-12.jpg',
                sort: 1
            }
        ],
        MERCURY: [
            {
                title: 'Mercury - 2025.08.23',
                meta: 'Mercury | C925 | QHY715MC',
                url: 'library/mer-2025-08-23.jpg',
                sort: 1
            }
        ],
        OVERVIEW: [
            {
                title: 'Solar System Overview',
                meta: 'Composited view | 16:9',
                url: 'library/solar system in 2025 16_9.jpg',
                sort: 1
            }
        ],
        SATURN: [
            {
                title: 'Saturn - 2025.08.19 Remake',
                meta: 'Saturn | C925 | QHY715MC',
                url: 'library/sat-2025-08-19-remake.jpg',
                sort: 1
            },
            {
                title: 'Saturn - 2025.11.04',
                meta: 'Saturn | C925 | QHY715MC',
                url: 'library/sat-2025-11-04.jpg',
                sort: 2
            }
        ],
        URANUS: [
            {
                title: 'Uranus - 2025.09.17',
                meta: 'Uranus | C925 | QHY715MC',
                url: 'library/ura-2025-09-17.jpg',
                sort: 1
            },
            {
                title: 'Uranus - 2025.10.10',
                meta: 'Uranus | C925 | QHY715MC',
                url: 'library/ura-2025-10-10.jpg',
                sort: 2
            }
        ],
        NEPTUNE: [
            {
                title: 'Neptune - 2025.08.22 ed2',
                meta: 'Neptune | C925 | QHY715MC',
                url: 'library/nep-2025-08-22 ed2.jpg',
                sort: 1
            }
        ]
    },
    PLAY: {
        '2026.01.27': [
            {
                title: 'Members',
                meta: 'P.L.A.Y | 2026.01.27',
                url: 'library/P.L.A.Y/2026-01-27/members.JPG',
                sort: 1
            },
            {
                title: 'Telescopes',
                meta: 'P.L.A.Y | 2026.01.27',
                url: 'library/P.L.A.Y/2026-01-27/telescopes.JPG',
                sort: 2
            }
        ]
    },
    NEBULAE: [
        {
            title: 'M78 Reflection Nebula',
            meta: 'M78 | Deep Sky',
            url: 'library/M78.jpg',
            sort: 1
        }
    ],
    GALAXIES: [
        {
            title: 'M31 Andromeda Galaxy',
            meta: 'M31 | Deep Sky',
            url: 'library/M31-2023-07-25.jpg',
            sort: 1
        },
        {
            title: 'Markarian Chain',
            meta: 'Galaxy Cluster | Deep Sky',
            url: 'library/MarkarianChain.jpg',
            sort: 2
        }
    ],
    COMETS: [
        {
            title: 'C/2024 E3 Tsuchinshan',
            meta: 'Comet | Deep Sky',
            url: 'library/C2024-E3-Tsuchinshan-2024-10-23-ed2.jpg',
            sort: 1
        },
        {
            title: 'C/2022 E3 ZTF',
            meta: 'Comet | Deep Sky',
            url: 'library/C2022E3_ZTF-2023-01-18_v2.jpg',
            sort: 2
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
