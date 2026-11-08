/* P0-52 / IDEA-183 · Nou fonts exactes autoritzades pel Mestre.
   La prova només llig public/: mai necessita l’arxiu històric ni el corpus.
   OG-7 (R53, arbitratge de Claude) · Les sis fotos del Mestre de 2023 portaven
   el GPS a l'EXIF: es purguen amb netejaJpeg (netejaMetadades.js), sense tornar
   a codificar cap píxel, i les empremtes de davall són les dels bytes nets. */
import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { describe, expect, test } from 'vitest';
import { createRequire } from 'node:module';
const { mides } = createRequire(import.meta.url)('../../../../tooling/media/optimitzar_webp.mjs');
import { sanitizeHtml } from '../../../utils/sanitize.js';
import { cosPerAPintar } from './cosCanonic.js';
import { NOVES_TECNOLOGIES_CULTURA_RURAL_HTML, NOVES_TECNOLOGIES_IMATGES } from './novesTecnologiesCulturaRuralContent.js';

const FONTS_FIXADES = [
  {
    "id": "exterior",
    "filename": "pou-neu-rentonar-exterior-frontal-2023.jpg",
    "sha256": "c644e8bd76a31ad6ad77f9218241f52649cfb9c369a817a0b97e2d30899fa1ba",
    "width": 1600,
    "height": 1200
  },
  {
    "id": "escala-humana",
    "filename": "pou-neu-rentonar-cupula-escala-humana-2023.jpg",
    "sha256": "f5c3334f4e62535956c479cd6efb9f6d8b98a02578b8fad3763a9fe8a5269eee",
    "width": 1600,
    "height": 1200
  },
  {
    "id": "galeria-sud",
    "filename": "pou-neu-rentonar-galeria-sud-volta-2023.jpg",
    "sha256": "dc3a5c9ca54057ff47fb7b55201226850fb3f097dc75fb6f94a16f0b40358c8c",
    "width": 1600,
    "height": 1200
  },
  {
    "id": "interior",
    "filename": "pou-neu-rentonar-interior-cilindre-finestres-2023.jpg",
    "sha256": "727af0606a5b8b8393a6f375e3f19dc75779b60ca85dd3736671904b30968643",
    "width": 1600,
    "height": 1200
  },
  {
    "id": "falsa-volta",
    "filename": "pou-neu-rentonar-falsa-volta-filades-2023.jpg",
    "sha256": "5897b5c2d6711ec44f50844fe2488bfe379f4c5fb349b76e6f280a48c2fb0926",
    "width": 1600,
    "height": 1200
  },
  {
    "id": "carrasca",
    "filename": "pou-neu-rentonar-carrasca-entorn-2023.jpg",
    "sha256": "39139dbc40caa4407515c3a114c056a7b026fd5d42574d928d90a3b8f038cb81",
    "width": 1600,
    "height": 1200
  },
  {
    "id": "planta",
    "filename": "pou-neu-rentonar-planta-segura-1987.jpg",
    "sha256": "e617632e7a183ebf2fd158c50fb566c8e5e9eaf3223c9882a0c8dc56dd05a104",
    "width": 702,
    "height": 589
  },
  {
    "id": "seccions",
    "filename": "pou-neu-rentonar-seccions-segura-1987.jpg",
    "sha256": "b168e34a975d83f11fb5b00ffec62b8f95146d07b117d6691cf6274ecb26c7eb",
    "width": 716,
    "height": 602
  },
  {
    "id": "fissura",
    "filename": "pou-neu-rentonar-fissura-sostre-2020.jpg",
    "sha256": "1610b1c518ce069003752b58f845cfcfa67c48c2231a628d56efbb309428feae",
    "width": 1600,
    "height": 900
  }
];
const ORDRE_EDITORIAL = ['exterior', 'escala-humana', 'planta', 'interior', 'galeria-sud', 'seccions', 'falsa-volta', 'fissura', 'carrasca'];
const documentDe = (html) => new DOMParser().parseFromString(html, 'text/html');
function seccioDe(figura) {
  let node = figura.previousElementSibling;
  while (node && node.tagName !== 'H3') node = node.previousElementSibling;
  return node?.textContent;
}

describe('P0-52 · fonts visuals documentades del Pou de Neu', () => {
  test.each(FONTS_FIXADES)('$id: JPEG exacte i mides reals sense retall ni recodificació', ({ id, filename, sha256, width, height }) => {
    const imatge = NOVES_TECNOLOGIES_IMATGES.find((fila) => fila.id === id);
    expect(imatge).toMatchObject({ src: `/assets/uploads/patrimoni/${filename}`, width, height });
    const bytes = readFileSync(path.resolve(process.cwd(), 'public', imatge.src.slice(1)));
    expect(createHash('sha256').update(bytes).digest('hex')).toBe(sha256);
    expect(mides(bytes)).toEqual({ format: 'jpeg', amplada: width, alcada: height, orientacio: 1 });
    expect(Object.isFrozen(imatge)).toBe(true);
  });

  test('nou imatges úniques en els apartats corresponents, amb alt, mides i càrrega diferida', () => {
    const cos = documentDe(NOVES_TECNOLOGIES_CULTURA_RURAL_HTML);
    const figures = [...cos.querySelectorAll('div.aplec-2023__figura')];
    expect(Object.isFrozen(NOVES_TECNOLOGIES_IMATGES)).toBe(true);
    expect(NOVES_TECNOLOGIES_IMATGES).toHaveLength(9);
    expect(new Set(NOVES_TECNOLOGIES_IMATGES.map((imatge) => imatge.src)).size).toBe(9);
    expect(new Set(NOVES_TECNOLOGIES_IMATGES.map((imatge) => imatge.alt)).size).toBe(9);
    expect(figures).toHaveLength(9);
    expect(figures.map((figura) => figura.querySelector('img').getAttribute('src'))).toEqual(ORDRE_EDITORIAL.map((id) => NOVES_TECNOLOGIES_IMATGES.find((imatge) => imatge.id === id).src));
    expect(figures.map(seccioDe)).toEqual(['Per què un pou de neu en 3D', ...Array(5).fill('L’arquitectura, amb les mides de Segura'), 'Les dues cobertes', 'Les dues cobertes', 'El pou hui']);
    for (const figura of figures) {
      const img = figura.querySelector('img');
      const esperada = NOVES_TECNOLOGIES_IMATGES.find((imatge) => imatge.src === img.getAttribute('src'));
      expect([...figura.children].map((node) => node.tagName)).toEqual(['IMG', 'P']);
      expect(img.getAttribute('alt')).toBe(esperada.alt);
      expect(img.getAttribute('alt').length).toBeGreaterThan(40);
      expect([img.getAttribute('width'), img.getAttribute('height')]).toEqual([String(esperada.width), String(esperada.height)]);
      expect([img.getAttribute('loading'), img.getAttribute('decoding')]).toEqual(['lazy', 'async']);
      const peu = figura.querySelector('p.aplec-2023__peu');
      expect(peu.firstElementChild.tagName).toBe('STRONG');
      expect(peu.firstChild).toBe(peu.firstElementChild);
    }
  });

  test('sis fotos amb data, dos plànols de Segura i la fissura d’El Rentonar, sense drets inventats', () => {
    const cos = documentDe(NOVES_TECNOLOGIES_CULTURA_RURAL_HTML);
    for (const { id, src } of NOVES_TECNOLOGIES_IMATGES) {
      const peu = cos.querySelector(`img[src="${src}"]`).nextElementSibling;
      if (['exterior', 'escala-humana', 'galeria-sud', 'interior', 'falsa-volta', 'carrasca'].includes(id)) {
        expect(peu.textContent).toContain('Fotografia de Javi, 17-10-2023.');
        expect(peu.querySelector('a')).toBeNull();
      } else {
        const esFissura = id === 'fissura';
        expect(peu.textContent).toContain(esFissura ? 'Associació El Rentonar, 28-10-2020' : 'Josep Mª Segura Martí (1987)');
        expect(peu.querySelector('a').getAttribute('href')).toBe(esFissura
          ? 'https://socdepoble.net/2020/10/30/la-fissura-del-sostre-del-pou-de-neu/'
          : 'https://socdepoble.net/2020/04/17/el-pou-de-la-neu-del-rentonar/');
      }
      if (['planta', 'seccions'].includes(id)) {
        const midaCompleta = peu.querySelector(`a[href="${src}"]`);
        expect(midaCompleta.textContent).toBe('Obrir el plànol a mida completa');
        expect(midaCompleta.getAttribute('target')).toBe('_blank');
      }
      expect(peu.textContent).not.toMatch(/llicència|CC BY|domini públic|consultat|8,00 m|9,70 m|11,50 m|alçats/i);
    }
    expect(NOVES_TECNOLOGIES_IMATGES.find((imatge) => imatge.id === 'planta').alt).toMatch(/^Planta.*nord.*escala gràfica.*A-B i C-D/);
  });

  test('sanejador i cicle canònic de l’editor conserven les figures i les atribucions', () => {
    const original = documentDe(NOVES_TECNOLOGIES_CULTURA_RURAL_HTML);
    const signatura = (cos) => [...cos.querySelectorAll('div.aplec-2023__figura')].map((figura) => [
      ['src', 'alt', 'width', 'height', 'loading', 'decoding'].map((nom) => figura.querySelector('img').getAttribute(nom)),
      figura.querySelector('p.aplec-2023__peu').textContent,
      figura.querySelector('p.aplec-2023__peu').firstElementChild.outerHTML,
      [...figura.querySelectorAll('a')].map((a) => [a.getAttribute('href'), a.getAttribute('target'), a.textContent])
    ]);
    for (const html of [sanitizeHtml(NOVES_TECNOLOGIES_CULTURA_RURAL_HTML, { imatgesPropies: true }), cosPerAPintar(NOVES_TECNOLOGIES_CULTURA_RURAL_HTML)]) {
      expect(signatura(documentDe(html))).toEqual(signatura(original));
      const sanejat = documentDe(html);
      expect(sanejat.querySelectorAll('iframe, script, [onload], [onerror]')).toHaveLength(0);
      for (const img of sanejat.querySelectorAll('img')) expect(img.getAttribute('referrerpolicy')).toBe('no-referrer');
      for (const a of sanejat.querySelectorAll('div.aplec-2023__figura a')) expect(a.getAttribute('rel').split(' ')).toEqual(expect.arrayContaining(['noopener', 'noreferrer', 'nofollow']));
    }
  });
});
