// ===================================
// SWILLY'S 40TH - MAIN JAVASCRIPT
// ===================================

// Countdown Timer
const birthdayDate = new Date('2026-01-29T15:00:00').getTime();

function updateCountdown() {
    const now = new Date().getTime();
    const distance = birthdayDate - now;

    if (distance < 0) {
        document.querySelector('.countdown-display').innerHTML =
            '<div class="countdown-box"><div class="countdown-number" style="font-size: 2rem;">🎉 IT\'S PARTY TIME! 🎉</div></div>';
        return;
    }

    const days = Math.floor(distance / (1000 * 60 * 60 * 24));
    const hours = Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutes = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((distance % (1000 * 60)) / 1000);

    const daysEl = document.getElementById('days');
    const hoursEl = document.getElementById('hours');
    const minutesEl = document.getElementById('minutes');
    const secondsEl = document.getElementById('seconds');

    if (daysEl) daysEl.textContent = String(days).padStart(2, '0');
    if (hoursEl) hoursEl.textContent = String(hours).padStart(2, '0');
    if (minutesEl) minutesEl.textContent = String(minutes).padStart(2, '0');
    if (secondsEl) secondsEl.textContent = String(seconds).padStart(2, '0');
}

// Update countdown every second
if (document.getElementById('days')) {
    updateCountdown();
    setInterval(updateCountdown, 1000);
}

// Smooth Scroll for anchor links
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
        const href = this.getAttribute('href');
        if (href !== '#' && href.length > 1) {
            e.preventDefault();
            const target = document.querySelector(href);
            if (target) {
                target.scrollIntoView({
                    behavior: 'smooth',
                    block: 'start'
                });
            }
        }
    });
});

// Mobile Menu Toggle
const mobileToggle = document.querySelector('.mobile-menu-toggle');
const navLinks = document.querySelector('.nav-links');

if (mobileToggle && navLinks) {
    mobileToggle.addEventListener('click', () => {
        navLinks.classList.toggle('active');
        mobileToggle.classList.toggle('active');
    });
}

// Intersection Observer for fade-in animations
const observerOptions = {
    threshold: 0.1,
    rootMargin: '0px 0px -50px 0px'
};

const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            entry.target.style.opacity = '1';
            entry.target.style.transform = 'translateY(0)';
        }
    });
}, observerOptions);

// Observe all cards and sections
document.querySelectorAll('.hype-card, .quick-link-card, .preview-content').forEach(el => {
    el.style.opacity = '0';
    el.style.transform = 'translateY(30px)';
    el.style.transition = 'opacity 0.6s ease, transform 0.6s ease';
    observer.observe(el);
});

// Parallax effect on scroll
let lastScrollY = window.scrollY;

window.addEventListener('scroll', () => {
    const currentScrollY = window.scrollY;

    // Parallax for grid pattern
    const gridPattern = document.querySelector('.grid-pattern');
    if (gridPattern) {
        gridPattern.style.transform = `perspective(500px) rotateX(60deg) translateY(${currentScrollY * 0.5}px)`;
    }

    // Hide/show nav on scroll
    const nav = document.querySelector('.main-nav');
    if (nav) {
        if (currentScrollY > lastScrollY && currentScrollY > 100) {
            nav.style.transform = 'translateY(-100%)';
        } else {
            nav.style.transform = 'translateY(0)';
        }
    }

    lastScrollY = currentScrollY;
});

// Console Easter Egg
console.log('%cSWILLY\'S 40TH', 'font-size: 48px; font-weight: bold; background: linear-gradient(90deg, #FF10F0, #00F0FF); -webkit-background-clip: text; -webkit-text-fill-color: transparent;');
console.log('%cLEVEL 40 UNLOCKED', 'font-size: 24px; color: #00F0FF; text-shadow: 0 0 10px #00F0FF;');
console.log('%cPunta Mita | Jan 29 - Feb 1, 2026', 'font-size: 16px; color: #FF10F0;');
console.log(' ');
console.log('🎉 Built with 80s vibes & Miami Vice dreams 🌴');