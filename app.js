/**
 * RUBY CYCLES — 3D BICYCLE SCROLL VISUALIZER & LUXURY SHOWROOM
 * Precision 96-frame scroll scrub + Brands Gallery + Automatic Outlet Slideshow
 */

(function() {
  'use strict';

  // --- CONSTANTS & CONFIGURATION ---
  const TOTAL_FRAMES = 96;
  const FRAME_DIR = 'frames/';
  const FRAME_PREFIX = 'frame_';
  const FRAME_EXT = '.webp';
  const CACHE_BUST = '?v=' + Date.now();

  // --- DOM ELEMENTS ---
  const canvas = document.getElementById('cycle-canvas');
  const ctx = canvas.getContext('2d');
  const preloader = document.getElementById('preloader');
  const loadText = document.getElementById('load-text');
  const scrollHint = document.getElementById('scroll-hint');
  const scrollTrack = document.getElementById('scroll-track');
  const showroomSection = document.getElementById('brands-showroom');
  const outletsSection = document.getElementById('outlets-section');

  const images = [];
  let loadedCount = 0;
  let targetProgress = 0;
  let currentProgress = 0;
  let currentFrameIndex = 0;
  let fontLoaded = false;

  // Ensure Google Fonts are loaded for crisp canvas rendering
  if (document.fonts) {
    document.fonts.ready.then(() => {
      fontLoaded = true;
      drawCurrent();
    });
  } else {
    fontLoaded = true;
  }

  // ==========================================================================
  // 1. ASSET PRELOADING (96 TRANSPARENT WEBP FRAMES)
  // ==========================================================================
  function preloadFrames() {
    for (let i = 0; i < TOTAL_FRAMES; i++) {
      const img = new Image();
      const paddedIndex = String(i).padStart(4, '0');
      img.src = `${FRAME_DIR}${FRAME_PREFIX}${paddedIndex}${FRAME_EXT}${CACHE_BUST}`;
      img.onload = onFrameLoaded;
      img.onerror = onFrameLoaded;
      images.push(img);
    }
  }

  function onFrameLoaded() {
    loadedCount++;
    const percent = Math.round((loadedCount / TOTAL_FRAMES) * 100);
    loadText.textContent = `Loading ${percent}%`;

    if (loadedCount >= TOTAL_FRAMES) {
      setTimeout(onReady, 200);
    }
  }

  function onReady() {
    preloader.classList.add('hidden');
    resizeCanvas();
    drawCurrent();
    startAnimationLoop();
    initScrollObservers();
    initOutletSlideshows();
    initLuxuryNavigation();
  }

  // ==========================================================================
  // 2. CANVAS RESIZE (HIGH-DPI / RETINA DISPLAY SCALING)
  // ==========================================================================
  function resizeCanvas() {
    const width = window.innerWidth;
    const height = window.innerHeight;
    const dpr = window.devicePixelRatio || 1;

    canvas.width = width * dpr;
    canvas.height = height * dpr;
    canvas.style.width = `${width}px`;
    canvas.style.height = `${height}px`;
    ctx.scale(dpr, dpr);

    drawCurrent();
  }

  window.addEventListener('resize', resizeCanvas);

  // ==========================================================================
  // 3. DRAW WATERMARK TEXT (BEHIND CYCLE)
  // ==========================================================================
  function drawWatermarkText(centerX, centerY, opacity) {
    if (opacity <= 0.01) return;

    ctx.save();
    
    const screenWidth = window.innerWidth;
    const fontSize = Math.max(38, Math.min(screenWidth * 0.082, 110));
    
    ctx.font = `800 ${fontSize}px "Syncopate", "Syne", sans-serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';

    const lineSpacing = fontSize * 1.05;
    const yLine1 = centerY - (lineSpacing * 0.55);
    const yLine2 = centerY + (lineSpacing * 0.55);

    // Subtle soft ambient glow
    ctx.shadowColor = `rgba(255, 255, 255, ${0.15 * opacity})`;
    ctx.shadowBlur = 25;

    // 1. Translucent fill
    ctx.fillStyle = `rgba(255, 255, 255, ${0.08 * opacity})`;
    ctx.fillText("MAKE YOUR", centerX, yLine1);
    ctx.fillText("RIDE WITH", centerX, yLine2);

    // 2. Crisp stroke outline
    ctx.strokeStyle = `rgba(255, 255, 255, ${0.75 * opacity})`;
    ctx.lineWidth = Math.max(1.8, fontSize * 0.022);
    ctx.strokeText("MAKE YOUR", centerX, yLine1);
    ctx.strokeText("RIDE WITH", centerX, yLine2);

    ctx.restore();
  }

  // ==========================================================================
  // 4. MAIN RENDER FUNCTION: DRAWS TEXT BEHIND, CYCLE IN FRONT
  // ==========================================================================
  function drawFrame(frameIdx, progress) {
    const img = images[frameIdx];
    const canvasWidth = window.innerWidth;
    const canvasHeight = window.innerHeight;

    // Clear canvas
    ctx.fillStyle = '#000000';
    ctx.fillRect(0, 0, canvasWidth, canvasHeight);

    const centerX = canvasWidth / 2;
    const centerY = canvasHeight / 2;

    // Compute watermark text opacity
    let textOpacity = 0;
    if (progress <= 0.18) {
      textOpacity = 1 - (progress / 0.18);
    } else if (progress >= 0.80) {
      textOpacity = (progress - 0.80) / 0.20;
    } else {
      textOpacity = 0;
    }

    // Draw watermark text behind
    drawWatermarkText(centerX, centerY, textOpacity);

    // Draw transparent cycle image on top
    if (img && img.complete) {
      const imgRatio = img.naturalWidth / img.naturalHeight;
      const canvasRatio = canvasWidth / canvasHeight;

      let renderWidth, renderHeight, offsetX, offsetY;

      if (canvasRatio > imgRatio) {
        renderHeight = canvasHeight;
        renderWidth = canvasHeight * imgRatio;
        offsetX = (canvasWidth - renderWidth) / 2;
        offsetY = 0;
      } else {
        renderWidth = canvasWidth;
        renderHeight = canvasWidth / imgRatio;
        offsetX = 0;
        offsetY = (canvasHeight - renderHeight) / 2;
      }

      ctx.drawImage(img, offsetX, offsetY, renderWidth, renderHeight);
    }
  }

  function drawCurrent() {
    drawFrame(currentFrameIndex, currentProgress);
  }

  // ==========================================================================
  // 5. ANIMATION LOOP (MOMENTUM LERP FOR SMOOTH SCRUBBING)
  // ==========================================================================
  function startAnimationLoop() {
    function loop() {
      currentProgress += (targetProgress - currentProgress) * 0.15;

      const frameIdx = Math.min(
        TOTAL_FRAMES - 1,
        Math.max(0, Math.round(currentProgress * (TOTAL_FRAMES - 1)))
      );

      currentFrameIndex = frameIdx;
      drawFrame(currentFrameIndex, currentProgress);

      requestAnimationFrame(loop);
    }
    requestAnimationFrame(loop);
  }

  // ==========================================================================
  // 6. SCROLL TRANSITION & MAPPING
  // ==========================================================================
  function handleScroll() {
    const currentScroll = window.scrollY || window.pageYOffset;
    const trackHeight = scrollTrack ? scrollTrack.offsetHeight : (document.documentElement.scrollHeight - window.innerHeight);

    // Map scroll across track to [0, 1]
    targetProgress = trackHeight > 0 ? Math.min(1, Math.max(0, currentScroll / trackHeight)) : 0;

    // Fade scroll hint once user starts interacting
    if (currentScroll > 40) {
      scrollHint.classList.add('faded');
    } else {
      scrollHint.classList.remove('faded');
    }

    // Seamlessly and softly crossfade canvas out as user enters the showroom gallery
    if (targetProgress >= 0.94) {
      const extraScroll = currentScroll - (trackHeight * 0.94);
      const fadeDistance = window.innerHeight * 0.55;
      const fadeFactor = Math.max(0, 1 - (extraScroll / fadeDistance));
      canvas.style.opacity = fadeFactor;
    } else {
      canvas.style.opacity = '1';
    }
  }

  window.addEventListener('scroll', handleScroll, { passive: true });

  // ==========================================================================
  // 7. SECTION INTERSECTION OBSERVERS (PROGRESSIVE CINEMATIC REVEAL)
  // ==========================================================================
  function initScrollObservers() {
    const observerOptions = {
      root: null,
      rootMargin: '0px 0px -80px 0px',
      threshold: 0.06
    };

    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('in-view');
        }
      });
    }, observerOptions);

    const showroomSection = document.getElementById('brands-showroom');
    const outletsSection = document.getElementById('outlets-section');
    const founderSection = document.getElementById('founder-section');
    const contactSection = document.getElementById('contact-section');

    if (showroomSection) observer.observe(showroomSection);
    if (outletsSection) observer.observe(outletsSection);
    if (founderSection) observer.observe(founderSection);
    if (contactSection) observer.observe(contactSection);

    document.querySelectorAll('.outlet-card').forEach(card => {
      observer.observe(card);
    });
  }

  // ==========================================================================
  // 8. AUTOMATIC OUTLET SLIDESHOW ENGINE (SUPPORTS MULTIPLE SHOWROOMS)
  // ==========================================================================
  function initOutletSlideshows() {
    const viewports = document.querySelectorAll('.slideshow-viewport');
    if (!viewports.length) return;

    viewports.forEach(viewport => {
      const slides = viewport.querySelectorAll('.slide-item');
      const dots = viewport.querySelectorAll('.page-dot');
      const prevBtn = viewport.querySelector('.prev-btn');
      const nextBtn = viewport.querySelector('.next-btn');
      const counterBadge = viewport.querySelector('.slide-counter-badge');

      if (!slides.length) return;

      let currentSlide = 0;
      const totalSlides = slides.length;
      const SLIDE_INTERVAL = 5000; // 5 seconds per slide
      let autoplayTimer = null;
      let isPaused = false;

      function goToSlide(index) {
        slides[currentSlide].classList.remove('active');
        if (dots[currentSlide]) dots[currentSlide].classList.remove('active');

        currentSlide = (index + totalSlides) % totalSlides;

        slides[currentSlide].classList.add('active');
        if (dots[currentSlide]) dots[currentSlide].classList.add('active');

        if (counterBadge) {
          const paddedCurrent = String(currentSlide + 1).padStart(2, '0');
          const paddedTotal = String(totalSlides).padStart(2, '0');
          counterBadge.textContent = `${paddedCurrent} / ${paddedTotal}`;
        }
      }

      function nextSlide() {
        goToSlide(currentSlide + 1);
      }

      function prevSlide() {
        goToSlide(currentSlide - 1);
      }

      function startAutoplay() {
        stopAutoplay();
        autoplayTimer = setInterval(() => {
          if (!isPaused) {
            nextSlide();
          }
        }, SLIDE_INTERVAL);
      }

      function stopAutoplay() {
        if (autoplayTimer) {
          clearInterval(autoplayTimer);
          autoplayTimer = null;
        }
      }

      // Button Listeners
      if (prevBtn) {
        prevBtn.addEventListener('click', (e) => {
          e.stopPropagation();
          prevSlide();
          startAutoplay();
        });
      }

      if (nextBtn) {
        nextBtn.addEventListener('click', (e) => {
          e.stopPropagation();
          nextSlide();
          startAutoplay();
        });
      }

      // Dot Pagination Listeners
      dots.forEach(dot => {
        dot.addEventListener('click', (e) => {
          e.stopPropagation();
          const targetIdx = parseInt(dot.dataset.index, 10);
          goToSlide(targetIdx);
          startAutoplay();
        });
      });

      // Pause on Hover
      viewport.addEventListener('mouseenter', () => { isPaused = true; });
      viewport.addEventListener('mouseleave', () => { isPaused = false; });

      // Touch / Swipe Navigation for Mobile
      let touchStartX = 0;
      let touchEndX = 0;

      viewport.addEventListener('touchstart', (e) => {
        touchStartX = e.changedTouches[0].screenX;
        isPaused = true;
      }, { passive: true });

      viewport.addEventListener('touchend', (e) => {
        touchEndX = e.changedTouches[0].screenX;
        isPaused = false;
        handleSwipe();
        startAutoplay();
      }, { passive: true });

      function handleSwipe() {
        const diff = touchEndX - touchStartX;
        if (Math.abs(diff) > 40) {
          if (diff < 0) {
            nextSlide(); // Swipe left -> next slide
          } else {
            prevSlide(); // Swipe right -> prev slide
          }
        }
      }

      // Start playback
      startAutoplay();
    });
  }

  // ==========================================================================
  // 9. FULL-SCREEN LUXURY NAVIGATION & ACTIVE SECTION HIGHLIGHTING
  // ==========================================================================
  function initLuxuryNavigation() {
    const navbar = document.getElementById('luxury-navbar');
    const menuBtn = document.getElementById('menu-trigger-btn');
    const closeBtn = document.getElementById('menu-close-btn');
    const overlay = document.getElementById('luxury-menu-overlay');
    const homeBrandLink = document.getElementById('brand-home-link');
    const navLinks = document.querySelectorAll('.menu-nav-link');

    if (!overlay || !menuBtn || !closeBtn) return;

    function openMenu() {
      overlay.classList.add('open');
      overlay.setAttribute('aria-hidden', 'false');
      menuBtn.setAttribute('aria-expanded', 'true');
      document.body.style.overflow = 'hidden';
    }

    function closeMenu() {
      overlay.classList.remove('open');
      overlay.setAttribute('aria-hidden', 'true');
      menuBtn.setAttribute('aria-expanded', 'false');
      document.body.style.overflow = '';
    }

    menuBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      openMenu();
    });

    closeBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      closeMenu();
    });

    // Close on Escape Key
    window.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && overlay.classList.contains('open')) {
        closeMenu();
      }
    });

    // Brand Home Link Smooth Scroll
    if (homeBrandLink) {
      homeBrandLink.addEventListener('click', (e) => {
        e.preventDefault();
        closeMenu();
        window.scrollTo({ top: 0, behavior: 'smooth' });
      });
    }

    // Navigation Links Smooth Scroll
    navLinks.forEach(link => {
      link.addEventListener('click', (e) => {
        e.preventDefault();
        const targetId = link.getAttribute('data-target');
        closeMenu();

        setTimeout(() => {
          if (targetId === 'scroll-track') {
            window.scrollTo({ top: 0, behavior: 'smooth' });
          } else {
            const targetElem = document.getElementById(targetId);
            if (targetElem) {
              const offsetTop = targetElem.getBoundingClientRect().top + window.pageYOffset - 50;
              window.scrollTo({ top: offsetTop, behavior: 'smooth' });
            }
          }
        }, 300);
      });
    });

    // Active Section Tracking on Scroll
    const sections = [
      { id: 'scroll-track', target: 'scroll-track' },
      { id: 'brands-showroom', target: 'brands-showroom' },
      { id: 'outlets-section', target: 'outlets-section' },
      { id: 'founder-section', target: 'founder-section' },
      { id: 'contact-section', target: 'contact-section' }
    ];

    function updateActiveNav() {
      const scrollY = window.pageYOffset || window.scrollY;
      const windowHeight = window.innerHeight;
      let currentActive = 'scroll-track';

      sections.forEach(sec => {
        const el = document.getElementById(sec.id);
        if (el) {
          const top = el.offsetTop - (windowHeight * 0.45);
          if (scrollY >= top) {
            currentActive = sec.target;
          }
        }
      });

      navLinks.forEach(link => {
        if (link.getAttribute('data-target') === currentActive) {
          link.classList.add('active');
        } else {
          link.classList.remove('active');
        }
      });

      // Navbar Scrolled State
      if (navbar) {
        if (scrollY > 50) {
          navbar.classList.add('scrolled');
        } else {
          navbar.classList.remove('scrolled');
        }
      }
    }

    window.addEventListener('scroll', updateActiveNav, { passive: true });
    updateActiveNav();
  }

  // START
  preloadFrames();
})();
