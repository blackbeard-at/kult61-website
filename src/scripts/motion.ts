// Bewegung wie auf der bisherigen WordPress-Seite (Uncode), ohne Bibliotheken.
// Alles ist abschaltbar über prefers-reduced-motion; ohne JavaScript bleibt die Seite voll lesbar.

const html = document.documentElement;
const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;

html.dataset.motion = 'ready';

/* 1) Einblenden, sobald ein Element "fast sichtbar" ist (data-reveal="up" | "fade") ---------------- */
const revealEls = [...document.querySelectorAll<HTMLElement>('[data-reveal]')];
if (reduce || !('IntersectionObserver' in window)) {
  revealEls.forEach((el) => el.classList.add('is-visible'));
} else {
  const io = new IntersectionObserver(
    (entries) => {
      for (const entry of entries) {
        if (!entry.isIntersecting) continue;
        entry.target.classList.add('is-visible');
        io.unobserve(entry.target);
      }
    },
    { rootMargin: '0px 0px -8% 0px', threshold: 0.01 },
  );
  // Was beim Laden schon im Sichtbereich liegt, sofort einblenden (ohne auf den Observer zu warten) …
  const vh = innerHeight;
  const vw = innerWidth;
  for (const el of revealEls) {
    const r = el.getBoundingClientRect();
    const inView = r.top < vh * 0.92 && r.bottom > 0 && r.left < vw && r.right > 0;
    if (inView) el.classList.add('is-visible');
    else io.observe(el); // … den Rest beim Scrollen
  }
}

/* 2) Parallax ---------------------------------------------------------------------------------
   Collage-Bilder: Rellax-Formel der Live-Seite (data-rellax-speed 1/3/5, percentage 0.5):
     translateY = 100 · speed · (percentage − p),  p = (scrollY − top + vh) / (höhe + vh)
   Hero-Hintergrund: wandert mit 10 % der Scrollstrecke nach unten.
   Nur ab 900 px Breite (darunter stehen die Bilder untereinander, da würde es nur stören). */
if (!reduce) {
  const wide = matchMedia('(min-width: 900px)');
  const heroBg = document.querySelector<HTMLElement>('[data-hero-parallax]');
  const els = [...document.querySelectorAll<HTMLElement>('[data-rellax-speed]')];
  let blocks: { el: HTMLElement; top: number; height: number; speed: number; percentage: number }[] = [];
  let ticking = false;

  const measure = () => {
    els.forEach((el) => (el.style.transform = ''));
    blocks = els.map((el) => {
      const r = el.getBoundingClientRect();
      return {
        el,
        top: r.top + scrollY,
        height: r.height,
        speed: Number(el.dataset.rellaxSpeed ?? 0),
        percentage: Number(el.dataset.rellaxPercentage ?? 0.5),
      };
    });
  };

  const update = () => {
    ticking = false;
    const y = scrollY;
    const vh = innerHeight;
    if (!wide.matches) {
      els.forEach((el) => (el.style.transform = ''));
      if (heroBg) heroBg.style.transform = '';
      return;
    }
    if (heroBg && y < vh * 1.3) heroBg.style.transform = `translate3d(0, ${(y * 0.1).toFixed(1)}px, 0)`;
    for (const b of blocks) {
      const p = (y - b.top + vh) / (b.height + vh);
      if (p < -0.3 || p > 1.5) continue; // weit außerhalb des Bildschirms: nicht nötig
      b.el.style.transform = `translate3d(0, ${(100 * b.speed * (b.percentage - p)).toFixed(1)}px, 0)`;
    }
  };

  const request = () => {
    if (ticking) return;
    ticking = true;
    requestAnimationFrame(update);
  };

  const remeasure = () => {
    measure();
    update();
  };

  if (els.length || heroBg) {
    measure();
    update();
    addEventListener('scroll', request, { passive: true });
    addEventListener('resize', remeasure);
    addEventListener('load', remeasure);
    wide.addEventListener('change', remeasure);
  }
}
