// Setzt E-Mail- und Telefon-Links erst beim ersten Bedienen der Seite zusammen (Schutz vor Adress-Sammlern).
// Die Teile stehen rückwärts in data-Attributen (siehe src/lib/contact.ts); hier steht keine Adresse im Klartext.

const rev = (s: string) => [...s].reverse().join('');
let done = false;

function upgrade() {
  if (done) return;
  done = true;
  document.querySelectorAll<HTMLAnchorElement>('a[data-obf]').forEach((a) => {
    if (a.dataset.obf === 'mail') {
      const address = `${rev(a.dataset.u ?? '')}@${rev(a.dataset.d ?? '')}`;
      const params: string[] = [];
      if (a.dataset.s) params.push(`subject=${encodeURIComponent(a.dataset.s)}`);
      if (a.dataset.b) params.push(`body=${encodeURIComponent(a.dataset.b)}`);
      a.href = `mailto:${address}${params.length ? `?${params.join('&')}` : ''}`;
      if (a.hasAttribute('data-show')) a.textContent = address;
    } else if (a.dataset.obf === 'phone') {
      a.href = `tel:${rev(a.dataset.p ?? '')}`;
    }
  });
}

// Capture-Phase auf window: läuft vor dem Klick, damit der Link beim ersten Antippen schon stimmt.
for (const type of ['pointerdown', 'pointermove', 'touchstart', 'keydown', 'focusin', 'scroll', 'wheel']) {
  addEventListener(type, upgrade, { once: true, passive: true, capture: true });
}
