(() => {
    const ns = window.AstroGallery || (window.AstroGallery = {});
    const { core, ui, messier } = ns;
    const logger = ns.logger.create('bootstrap');

    core.createStars();
    ui.bindGlobalEvents();
    ui.renderMainNav('ALL');
    ui.renderPhotos();

    window.setInterval(() => {
        messier.refreshChartIfVisible();
    }, 60000);

    logger.info('Gallery bootstrap complete', {
        currentCategory: core.state.currentCategory,
        debugLogging: ns.logger.isEnabled()
    });
})();
