import type { ImageMetadata } from 'astro';

import hero from '../assets/images/abend-7rv7407.jpg';
import konzertBuehne from '../assets/images/abend-7iv9253.jpg';
import publikumHandy from '../assets/images/abend-7iv9303.jpg';
import mischpult from '../assets/images/abend-7rv7214.jpg';
import durchgang from '../assets/images/abend-7rv7225.jpg';
import equipment from '../assets/images/abend-7rv7231.jpg';
import leuchtschrift from '../assets/images/abend-7rv7333.jpg';
import techniker from '../assets/images/abend-7rv7352.jpg';
import bandRot from '../assets/images/abend-7rv7362.jpg';
import publikumLila from '../assets/images/abend-7rv7375.jpg';

import g019 from '../assets/images/galerie-019.jpg';
import g016 from '../assets/images/galerie-016.jpg';
import g014 from '../assets/images/galerie-014.jpg';
import g018 from '../assets/images/galerie-018.jpg';
import g022 from '../assets/images/galerie-022.jpg';
import g020 from '../assets/images/galerie-020.jpg';
import g001 from '../assets/images/galerie-001.jpg';
import raumHeader from '../assets/images/raum-header.jpg';
import eventsHeader from '../assets/images/events-header.jpg';
import g004 from '../assets/images/galerie-004.jpg';
import g005 from '../assets/images/galerie-005.jpg';
import g006 from '../assets/images/galerie-006.jpg';
import g024 from '../assets/images/galerie-024.jpg';

export interface Photo {
  src: ImageMetadata;
  alt: string;
}

export const photos = {
  hero: {
    src: hero,
    alt: 'Publikum vor der Bühne bei einem Konzert im KULT61 in Hanau-Großauheim',
  },
  konzertBuehne: { src: konzertBuehne, alt: 'Live-Konzert im KULT61: Band auf der Bühne vor dem Publikum' },
  publikumHandy: { src: publikumHandy, alt: 'Konzertpublikum im KULT61, ein Smartphone filmt die Bühne im lila Licht' },
  mischpult: { src: mischpult, alt: 'Digitales Mischpult beim Live-Konzert im KULT61' },
  durchgang: { src: durchgang, alt: 'Durchgang zum Veranstaltungsraum im KULT61 mit Logo an der Wand' },
  equipment: { src: equipment, alt: 'Technik-Pult im warmen Bühnenlicht bei einer Veranstaltung im KULT61' },
  leuchtschrift: { src: leuchtschrift, alt: 'KULT61-Leuchtschrift mit dem Claim Kunst Kultur Events' },
  techniker: { src: techniker, alt: 'Hand am digitalen Mischpult mit Touchscreen bei einem Konzert im KULT61' },
  bandRot: { src: bandRot, alt: 'Band auf der Bühne des KULT61 im roten Bühnenlicht' },
  publikumLila: { src: publikumLila, alt: 'Publikum vor der Bühne im KULT61, Konzert in lila und blauem Licht' },
} satisfies Record<string, Photo>;

/** Header der Seite „Raum mieten“ (KULT61_111125_001, gleiches Foto wie galerie-001, aber 2800 px breit). */
export const raumHeaderPhoto: Photo = {
  src: raumHeader,
  alt: 'Der leere Veranstaltungsraum des KULT61 bei Tageslicht mit Bühne, Tanzfläche und Theke',
};

/** Header der Seite „Events“ (KULT61_Abendaufnahmen_7RV7407, gleiches Foto wie das Hero der Startseite, 2800 px breit). */
export const eventsHeaderPhoto: Photo = {
  src: eventsHeader,
  alt: 'Publikum im Gegenlicht vor der Bühne im KULT61, orange und violette Scheinwerfer',
};

/** Reihenfolge wie auf der bisherigen Seite (Räumlichkeiten-Galerie). */
export const gallery: Photo[] = [
  { src: durchgang, alt: photos.durchgang.alt },
  { src: g019, alt: 'Theke im KULT61, der Raum in blauem Licht' },
  { src: g016, alt: 'Der Veranstaltungsraum des KULT61 mit Bühne in warmem Abendlicht' },
  { src: g014, alt: 'Blick durch die Halle des KULT61 zur Bühne, blaue Lichtkegel auf dem Boden' },
  { src: g018, alt: 'Bühne im KULT61 mit Teppich und Lichttechnik' },
  { src: g022, alt: 'Theke mit Kühlschränken und KULT61-Schriftzug' },
  { src: g020, alt: 'Eingangsbereich des KULT61 mit Sitzgelegenheiten und Blick in den Saal' },
  { src: g001, alt: 'Der leere Veranstaltungsraum des KULT61 bei Tageslicht mit Theke und Bühne' },
  { src: g004, alt: 'Saal des KULT61 mit Mischpult im Vordergrund und Bühne im Hintergrund' },
  { src: g005, alt: 'Der Saal des KULT61 mit Bühne und Tanzfläche' },
  { src: g006, alt: 'Tanzfläche und Stehtische im Saal des KULT61' },
  { src: g024, alt: 'Glas und Flasche Bier mit KULT61-Logo auf der Theke, Bühnenlicht im Hintergrund' },
];
