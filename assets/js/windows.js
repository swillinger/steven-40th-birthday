// ===================================
// MAC WINDOW SCROLL ANIMATIONS
// ===================================

// Initialize Intersection Observer for Mac windows
function initWindowAnimations() {
    const options = {
        root: null,
        rootMargin: '0px',
        threshold: 0.1
    };

    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                // Add 'opened' class when window enters viewport
                entry.target.classList.add('opened');
            }
        });
    }, options);

    // Observe all Mac windows
    const windows = document.querySelectorAll('.mac-window.scroll-animate');
    windows.forEach(window => {
        observer.observe(window);
    });
}

// Run on page load
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initWindowAnimations);
} else {
    initWindowAnimations();
}
