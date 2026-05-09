(() => {
    const ns = window.AstroGallery || (window.AstroGallery = {});
    const logger = ns.logger.create('likes');
    const likeStorageKey = 'astro-gallery-like-state-v1';
    let likeState = loadLikeState();

    function loadLikeState() {
        try {
            const raw = window.localStorage.getItem(likeStorageKey);
            if (!raw) {
                logger.debug('No persisted like state found');
                return { counts: {}, liked: {} };
            }

            const parsed = JSON.parse(raw);
            logger.debug('Loaded like state', {
                countKeys: Object.keys(parsed.counts || {}).length,
                likedKeys: Object.keys(parsed.liked || {}).length
            });
            return {
                counts: parsed.counts || {},
                liked: parsed.liked || {}
            };
        } catch (error) {
            logger.warn('Failed to load like state, falling back to empty state', error);
            return { counts: {}, liked: {} };
        }
    }

    function saveLikeState() {
        try {
            window.localStorage.setItem(likeStorageKey, JSON.stringify(likeState));
        } catch (error) {
            logger.warn('Failed to save like state', error);
        }
    }

    function getPhotoLikeKey(photo) {
        return photo.url;
    }

    function getPhotoLikeCount(photo) {
        return likeState.counts[getPhotoLikeKey(photo)] || 0;
    }

    function isPhotoLiked(photo) {
        return Boolean(likeState.liked[getPhotoLikeKey(photo)]);
    }

    function updateLikeButton(button, photo) {
        const liked = isPhotoLiked(photo);
        const count = getPhotoLikeCount(photo);
        const icon = button.querySelector('.like-icon');
        const countNode = button.querySelector('.like-count');

        button.classList.toggle('liked', liked);
        button.setAttribute('aria-pressed', liked ? 'true' : 'false');
        icon.textContent = liked ? '♥' : '♡';
        countNode.textContent = count;
    }

    function toggleLike(photo, button) {
        const key = getPhotoLikeKey(photo);
        const nextLiked = !Boolean(likeState.liked[key]);
        const currentCount = getPhotoLikeCount(photo);
        const nextCount = nextLiked ? currentCount + 1 : Math.max(0, currentCount - 1);

        likeState.liked[key] = nextLiked;
        likeState.counts[key] = nextCount;
        saveLikeState();
        updateLikeButton(button, photo);

        logger.info('Toggled like state', {
            photo: photo.title,
            liked: nextLiked,
            count: nextCount
        });
    }

    ns.likes = {
        updateLikeButton,
        toggleLike
    };
})();
