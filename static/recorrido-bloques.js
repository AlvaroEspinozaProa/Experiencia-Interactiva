(() => {
    const carousel = document.querySelector('[data-carousel]');
    if (!carousel) return;

    const stage = carousel.querySelector('[data-carousel-stage]');
    const slides = Array.from(carousel.querySelectorAll('[data-slide]'));
    const thumbnails = carousel.querySelector('[data-thumbnails]');
    const previous = carousel.querySelector('[data-previous]');
    const next = carousel.querySelector('[data-next]');
    const togglePlay = carousel.querySelector('[data-toggle-play]');
    const current = carousel.querySelector('[data-current]');
    const progress = carousel.querySelector('[data-progress]');
    const title = carousel.querySelector('[data-current-title]');
    const zone = carousel.querySelector('[data-current-zone]');
    const caption = carousel.querySelector('[data-caption]');
    const live = carousel.querySelector('[data-live]');
    const portal = carousel.querySelector('.portal-nocturno__portal');
    const timelineProgress = carousel.querySelector('[data-timeline-progress]');
    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
    const sceneDuration = 4.6;
    const captions = [
        'La puerta de entrada ya tiene luz, volumen y recorrido.',
        'El pasillo conecta los espacios del mapa con una línea de color.',
        'Aula por aula, la escuela empieza a tener escala y vida.',
        'Mesas, luces y detalles: el comedor ya se puede reconocer.',
        'Los espacios de servicio también forman parte del mundo.',
        'Cada bloque encuentra lugar en el inventario del mapa.',
        'El inventario guarda los recursos para que el mundo siga creciendo.',
        'De noche, la fachada se vuelve un punto de llegada.',
        'Una vista desde arriba para mirar el avance completo.',
        'El exterior abre el recorrido entre los sectores del edificio.'
    ];
    let index = 0;
    let playing = !reducedMotion.matches;
    let progressTween = null;
    let touchStart = null;

    const miniatures = slides.map((slide, slideIndex) => {
        const image = slide.querySelector('img');
        const button = document.createElement('button');
        button.type = 'button';
        button.className = `portal-nocturno__miniatura${slideIndex === 0 ? ' is-active' : ''}`;
        button.setAttribute('aria-label', `Ver escena ${slideIndex + 1}: ${slide.dataset.title}`);
        button.setAttribute('aria-current', slideIndex === 0 ? 'true' : 'false');
        button.innerHTML = `<img src="${image.currentSrc || image.src}" alt="" loading="lazy">`;
        button.addEventListener('click', () => show(slideIndex, 'miniatura'));
        thumbnails.appendChild(button);
        return button;
    });

    function stopAuto() {
        progressTween?.kill();
        progressTween = null;
    }

    function syncPlayButton() {
        togglePlay.setAttribute('aria-pressed', String(playing));
        togglePlay.setAttribute('aria-label', playing ? 'Pausar reproducción automática' : 'Reanudar reproducción automática');
        togglePlay.querySelector('span').textContent = playing ? 'Ⅱ' : '▶';
    }

    function startAuto() {
        stopAuto();
        if (!playing || reducedMotion.matches) return;
        if (!window.gsap) return;
        window.gsap.set(timelineProgress, { scaleX: 0, transformOrigin: 'left center' });
        progressTween = window.gsap.to(timelineProgress, {
            scaleX: 1,
            duration: sceneDuration,
            ease: 'none',
            onComplete: () => show(index + 1, 'automático')
        });
    }

    function animateChange(previousSlide, activeSlide) {
        if (reducedMotion.matches || !window.gsap) return;
        window.gsap.killTweensOf([previousSlide, activeSlide, portal, activeSlide.querySelector('img')]);
        window.gsap.set(activeSlide, { opacity: 1, clipPath: 'inset(0 100% 0 0)' });
        const timeline = window.gsap.timeline({ defaults: { overwrite: 'auto' } });
        timeline
            .set(portal, { opacity: 0, scaleX: .04, yPercent: -10 })
            .to(previousSlide, { opacity: 0, scale: 1.025, duration: .3, ease: 'power3.in' }, 0)
            .to(portal, { opacity: 1, scaleX: 1, duration: .2, ease: 'power4.out' }, .04)
            .to(activeSlide, { clipPath: 'inset(0 0% 0 0)', duration: .62, ease: 'power4.out' }, .12)
            .fromTo(activeSlide.querySelector('img'), { scale: 1.14, xPercent: 2 }, { scale: 1.035, xPercent: 0, duration: .82, ease: 'expo.out' }, .12)
            .to(portal, { opacity: 0, yPercent: 110, duration: .32, ease: 'power2.in' }, .36)
            .set(activeSlide, { clearProps: 'clipPath' });
    }

    function show(requestedIndex, source = 'control') {
        const nextIndex = (requestedIndex + slides.length) % slides.length;
        if (nextIndex === index && source !== 'init') return;
        const previousSlide = slides[index];
        const activeSlide = slides[nextIndex];
        previousSlide.classList.remove('is-active');
        previousSlide.setAttribute('aria-hidden', 'true');
        activeSlide.classList.add('is-active');
        activeSlide.setAttribute('aria-hidden', 'false');
        index = nextIndex;
        miniatures.forEach((thumbnail, thumbnailIndex) => {
            const selected = thumbnailIndex === index;
            thumbnail.classList.toggle('is-active', selected);
            thumbnail.setAttribute('aria-current', String(selected));
        });
        current.textContent = String(index + 1).padStart(2, '0');
        progress.style.width = `${((index + 1) / slides.length) * 100}%`;
        title.textContent = activeSlide.dataset.title;
        zone.textContent = activeSlide.dataset.zone;
        caption.textContent = captions[index];
        live.textContent = `Escena ${index + 1} de ${slides.length}: ${activeSlide.dataset.title}.`;
        miniatures[index].scrollIntoView({ behavior: reducedMotion.matches ? 'auto' : 'smooth', block: 'nearest', inline: 'center' });
        if (source !== 'init') animateChange(previousSlide, activeSlide);
        if (playing) startAuto();
        else if (window.gsap) window.gsap.set(timelineProgress, { scaleX: 0 });
    }

    previous.addEventListener('click', () => show(index - 1));
    next.addEventListener('click', () => show(index + 1));
    togglePlay.addEventListener('click', () => { playing = !playing; syncPlayButton(); startAuto(); });

    stage.addEventListener('keydown', (event) => {
        if (event.key === 'ArrowLeft') { event.preventDefault(); show(index - 1); }
        if (event.key === 'ArrowRight') { event.preventDefault(); show(index + 1); }
        if (event.key === 'Home') { event.preventDefault(); show(0); }
        if (event.key === 'End') { event.preventDefault(); show(slides.length - 1); }
    });
    stage.addEventListener('pointerdown', (event) => { touchStart = event.clientX; });
    stage.addEventListener('pointerup', (event) => {
        if (touchStart === null) return;
        const difference = event.clientX - touchStart;
        if (Math.abs(difference) > 42) show(index + (difference < 0 ? 1 : -1));
        touchStart = null;
    });
    stage.addEventListener('pointercancel', () => { touchStart = null; });
    carousel.addEventListener('focusin', () => { playing = false; syncPlayButton(); stopAuto(); });
    document.addEventListener('visibilitychange', () => { if (document.hidden) stopAuto(); else startAuto(); });
    reducedMotion.addEventListener('change', () => { if (reducedMotion.matches) { playing = false; } syncPlayButton(); startAuto(); });

    slides.forEach((slide, slideIndex) => slide.setAttribute('aria-hidden', String(slideIndex !== 0)));
    syncPlayButton();
    carousel.classList.add('is-ready');
    startAuto();
})();
