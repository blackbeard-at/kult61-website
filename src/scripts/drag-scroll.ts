// Galerie mit der Maus ziehen (wie das Owl-Carousel der bisherigen Seite).
// Touch und Trackpad scrollen weiter nativ; hier geht es nur um die Maus.
// Tastatur: Der Container ist fokussierbar, Pfeiltasten scrollen ihn (Browser-Standard).

const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
const THRESHOLD = 5; // ab so vielen Pixeln gilt es als Ziehen, nicht als Klick
const FRICTION = 0.92; // Nachlauf pro Frame (60 fps)
const MAX_VELOCITY = 1.6; // px pro ms, begrenzt den Nachlauf bei sehr schnellen Wischern

function enable(el: HTMLElement) {
  let startX = 0;
  let startScroll = 0;
  let pointerId = -1;
  let down = false;
  let dragging = false;
  let lastX = 0;
  let lastT = 0;
  let velocity = 0; // px pro ms
  let raf = 0;

  const stopInertia = () => {
    cancelAnimationFrame(raf);
    raf = 0;
  };

  const inertia = () => {
    let prev = performance.now();
    const step = (now: number) => {
      const dt = Math.min(now - prev, 50);
      prev = now;
      const before = el.scrollLeft;
      el.scrollLeft -= velocity * dt;
      velocity *= Math.pow(FRICTION, dt / 16.67);
      if (Math.abs(velocity) < 0.02 || el.scrollLeft === before) {
        raf = 0;
        return;
      }
      raf = requestAnimationFrame(step);
    };
    raf = requestAnimationFrame(step);
  };

  el.addEventListener('pointerdown', (e) => {
    if (e.pointerType !== 'mouse' || e.button !== 0) return;
    if (el.scrollWidth <= el.clientWidth) return;
    stopInertia();
    down = true;
    dragging = false;
    pointerId = e.pointerId;
    startX = lastX = e.clientX;
    startScroll = el.scrollLeft;
    lastT = performance.now();
    velocity = 0;
    e.preventDefault(); // kein Text-/Bildmarkieren, kein natives Bild-Ziehen
  });

  el.addEventListener('pointermove', (e) => {
    if (!down || e.pointerId !== pointerId) return;
    const dx = e.clientX - startX;
    if (!dragging) {
      if (Math.abs(dx) < THRESHOLD) return;
      dragging = true;
      el.classList.add('is-dragging');
      el.setPointerCapture(pointerId);
    }
    el.scrollLeft = startScroll - dx;
    const now = performance.now();
    const dt = now - lastT;
    if (dt > 0) {
      // geglättete Geschwindigkeit für den Nachlauf
      velocity = 0.8 * ((e.clientX - lastX) / dt) + 0.2 * velocity;
      lastX = e.clientX;
      lastT = now;
    }
  });

  const end = (e: PointerEvent) => {
    if (!down || e.pointerId !== pointerId) return;
    down = false;
    if (dragging) {
      dragging = false;
      el.classList.remove('is-dragging');
      if (el.hasPointerCapture(pointerId)) el.releasePointerCapture(pointerId);
      // Wer vor dem Loslassen stehen blieb, soll keinen Nachlauf bekommen
      const idle = performance.now() - lastT > 80;
      velocity = Math.max(-MAX_VELOCITY, Math.min(MAX_VELOCITY, velocity));
      if (!reduce && !idle && Math.abs(velocity) > 0.1) inertia();
    }
  };
  el.addEventListener('pointerup', end);
  el.addEventListener('pointercancel', end);

  // Nach dem Ziehen kein Klick auf das, was unter der Maus liegt
  el.addEventListener(
    'click',
    (e) => {
      if (Math.abs(e.clientX - startX) >= THRESHOLD) e.stopPropagation();
    },
    true,
  );

  // Bilder nicht per Drag&Drop aus der Galerie ziehen
  el.addEventListener('dragstart', (e) => e.preventDefault());

  // Eigener Scroll (Tastatur, Scrollrad auf Trackpad) bricht einen laufenden Nachlauf ab
  el.addEventListener('wheel', stopInertia, { passive: true });
  el.addEventListener('keydown', stopInertia);
}

document.querySelectorAll<HTMLElement>('[data-drag-scroll]').forEach(enable);
