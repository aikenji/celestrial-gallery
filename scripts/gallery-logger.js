(() => {
    const ns = window.AstroGallery || (window.AstroGallery = {});
    const debugQuery = new URLSearchParams(window.location.search).get('debug');

    function isEnabled() {
        try {
            return window.localStorage.getItem('astro-gallery-debug') === '1' || debugQuery === 'gallery';
        } catch (error) {
            return debugQuery === 'gallery';
        }
    }

    let enabled = isEnabled();

    function write(level, scope, message, payload) {
        if (!enabled && !['warn', 'error'].includes(level)) {
            return;
        }

        const prefix = `[astro-gallery:${scope}] ${message}`;
        if (payload === undefined) {
            console[level](prefix);
            return;
        }

        console[level](prefix, payload);
    }

    ns.logger = {
        create(scope) {
            return {
                debug(message, payload) {
                    write('debug', scope, message, payload);
                },
                info(message, payload) {
                    write('info', scope, message, payload);
                },
                warn(message, payload) {
                    write('warn', scope, message, payload);
                },
                error(message, payload) {
                    write('error', scope, message, payload);
                }
            };
        },
        setEnabled(nextValue) {
            enabled = Boolean(nextValue);
            try {
                window.localStorage.setItem('astro-gallery-debug', enabled ? '1' : '0');
            } catch (error) {
                console.warn('[astro-gallery:logger] Failed to persist debug flag', error);
            }
            console.info('[astro-gallery:logger] Debug logging updated', { enabled });
        },
        isEnabled() {
            return enabled;
        }
    };
})();
