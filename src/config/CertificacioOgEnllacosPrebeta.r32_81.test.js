// @vitest-environment node
/**
 * R32.81 (G17 · Pre-Beta) — Certificació Integral d'Enllaços (5 llengües),
 * Targetes Socials OpenGraph <= 300 KB i Previsualització WhatsApp / Telegram.
 *
 * Blinda quatre invariants Pre-Beta:
 *   1. Tots els enllaços i targetes incrustades de PAGE_COPY en les 5 llengües
 *      (ca, es, en, eu, gl) i dels articles editorials del Mur passen
 *      certificaEnllacos amb 0 falles i 0 diacrítics/%C3 en URLs HTTP(S).
 *   2. Tota pàgina de PAGE_COPY amb imatge pròpia (no reserva SVG) resol via
 *      urlSocialDe a un PNG o JPEG baseline <= 300.000 B sense APP1/EXIF (cap WebP).
 *   3. Les 194+ rutes i àlies de buildSocialManifest({ estricte: true }) emeten
 *      via renderSocialHead etiquetes OpenGraph i Twitter/Telegram completes
 *      (og:title, og:description, og:url, og:image <= 300 KB, og:image:width,
 *      og:image:height, twitter:card="summary_large_image") sense doble escapat.
 */
import fs from 'node:fs';
import path from 'node:path';
import { describe, expect, test } from 'vitest';
import { certificaEnllacos, extreuUrlsDeText } from '../../tooling/gates/certifica-enllacos.mjs';
import { buildSocialManifest } from '../../tooling/seo/build-social-manifest.mjs';
import { sniffImage } from '../../tooling/seo/prerender-social.mjs';
import { renderSocialHead, selectMetadata } from '../../tooling/seo/social-edge.mjs';
import { PAGE_COPY } from '../sections/text/pageContent.js';
import { COPIES_SEGURETAT_SOC_DE_POBLE_POST } from '../sections/mur/articles/copiesSeguretatSocDePobleContent.js';
import { LA_VEU_DE_SOC_DE_POBLE_POST } from '../sections/mur/articles/laVeuDeSocDePobleContent.js';
import { NOVES_TECNOLOGIES_CULTURA_RURAL_POST } from '../sections/mur/articles/novesTecnologiesCulturaRuralContent.js';
import { MANIFEST_DE_POBLE_HTML } from '../sections/mur/articles/manifestDePobleContent.js';
import { APLEC_2023_HTML } from '../sections/mur/articles/aplec2023Content.js';
import { esImatgeDeReserva, ORIGEN_SOCIAL_PER_DEFECTE, urlSocialDe } from './imatgeSocial.js';

const ARREL = process.cwd();
const PUBLIC = path.join(ARREL, 'public');
const PES_MAXIM = 300_000;
const IDIOMES_ALTRES = Object.freeze(['es', 'en', 'eu', 'gl']);

function teApp1Jpeg(bytes) {
  if (bytes.length < 4 || bytes[0] !== 0xff || bytes[1] !== 0xd8) return false;
  let i = 2;
  while (i + 3 < bytes.length && bytes[i] === 0xff) {
    const marcador = bytes[i + 1];
    if (marcador === 0xda) break;
    if (marcador === 0xe1) return true;
    const len = bytes.readUInt16BE(i + 2);
    if (len < 2) break;
    i += 2 + len;
  }
  return false;
}

describe('R32.81 · Certificació Pre-Beta d’enllaços 5 llengües i OpenGraph WhatsApp/Telegram <= 300 KB', () => {
  test('tots els enllaços de PAGE_COPY (5 llengües) i dels articles del Mur passen certificaEnllacos i són 100 % ASCII en HTTP(S)', async () => {
    const fragments = [];
    for (const entrada of Object.values(PAGE_COPY)) {
      if (entrada?.html) fragments.push(entrada.html);
      for (const lang of IDIOMES_ALTRES) {
        const htmlLang = entrada?.translations?.[lang]?.html;
        if (htmlLang) fragments.push(htmlLang);
      }
    }
    fragments.push(
      COPIES_SEGURETAT_SOC_DE_POBLE_POST?.content ?? '',
      LA_VEU_DE_SOC_DE_POBLE_POST?.content ?? '',
      NOVES_TECNOLOGIES_CULTURA_RURAL_POST?.content ?? '',
      MANIFEST_DE_POBLE_HTML,
      APLEC_2023_HTML
    );

    const urls = extreuUrlsDeText(fragments.join('\n'), { inclouRelatius: true });
    expect(urls.length).toBeGreaterThan(120);

    const httpNoAscii = urls.filter((u) => /^https?:/i.test(u) && /[^\x20-\x7E]|%c3/i.test(u));
    expect(httpNoAscii, 'URLs HTTP(S) amb accents o codificació %C3').toEqual([]);

    const informe = await certificaEnllacos({ arrel: ARREL, urls, remot: false });
    expect(informe.falles, JSON.stringify(informe.falles)).toEqual([]);
    expect(informe.ok).toBe(true);
  });

  test('tota clau de PAGE_COPY amb imatge pròpia resol via urlSocialDe a PNG o JPEG <= 300 KB sense APP1 (0 WebP)', () => {
    for (const [slug, pagina] of Object.entries(PAGE_COPY)) {
      const ref = pagina?.og_image || pagina?.image;
      if (!ref || esImatgeDeReserva(ref)) continue;
      const socialUrl = urlSocialDe(ref);
      expect(socialUrl, `${slug}: urlSocialDe buida`).toBeTruthy();
      const u = new URL(socialUrl);
      expect(u.origin, slug).toBe(ORIGEN_SOCIAL_PER_DEFECTE);
      expect(u.pathname, `${slug}: cap WebP al <head>`).toMatch(/\.(?:jpe?g|png)$/i);

      const fitxer = path.join(PUBLIC, decodeURIComponent(u.pathname));
      expect(fs.existsSync(fitxer), `${slug}: ${fitxer}`).toBe(true);
      const bytes = fs.readFileSync(fitxer);
      expect(bytes.length, `${slug}: ${bytes.length} B`).toBeLessThanOrEqual(PES_MAXIM);
      const info = sniffImage(bytes);
      expect(info?.type, slug).toMatch(/^image\/(?:jpeg|png)$/);
      expect(teApp1Jpeg(bytes), `${slug}: APP1/EXIF present`).toBe(false);
    }
  });

  test('totes les rutes i àlies del manifest social estricte generen un <head> WhatsApp/Telegram complet i coherent', async () => {
    const { manifest } = await buildSocialManifest({
      root: ARREL,
      origin: ORIGEN_SOCIAL_PER_DEFECTE,
      estricte: true
    });
    const totesLesRutes = [
      ...Object.keys(manifest.routes),
      ...Object.keys(manifest.aliases ?? {})
    ];
    expect(totesLesRutes.length).toBeGreaterThanOrEqual(290);

    for (const ruta of totesLesRutes) {
      expect(ruta, 'ruta no ASCII').toMatch(/^[\x20-\x7E]+$/);
      expect(ruta).not.toMatch(/%c3/i);

      const seleccionat = selectMetadata(manifest, new URL(ruta, ORIGEN_SOCIAL_PER_DEFECTE));
      expect(seleccionat, `selectMetadata nul per a ${ruta}`).toBeTruthy();

      const imgUrl = new URL(seleccionat.image.url);
      const bytes = fs.readFileSync(path.join(PUBLIC, decodeURIComponent(imgUrl.pathname)));
      expect(bytes.length, `${ruta} -> ${imgUrl.pathname}`).toBeLessThanOrEqual(PES_MAXIM);
      const dimensions = sniffImage(bytes);
      expect(dimensions?.type, ruta).toMatch(/^image\/(?:jpeg|png)$/);

      const headHtml = renderSocialHead(
        {
          ...seleccionat,
          image: {
            ...seleccionat.image,
            type: dimensions.type,
            width: dimensions.width,
            height: dimensions.height
          }
        },
        ORIGEN_SOCIAL_PER_DEFECTE
      );

      expect(headHtml, ruta).toContain('property="og:title"');
      expect(headHtml, ruta).toContain('property="og:description"');
      expect(headHtml, ruta).toContain('property="og:image"');
      expect(headHtml, ruta).toContain(`property="og:image:type" content="${dimensions.type}"`);
      expect(headHtml, ruta).toContain(`property="og:image:width" content="${dimensions.width}"`);
      expect(headHtml, ruta).toContain(`property="og:image:height" content="${dimensions.height}"`);
      expect(headHtml, ruta).toContain('name="twitter:card" content="summary_large_image"');
      expect(headHtml, `${ruta}: doble escapat d'entitats`).not.toMatch(/&amp;(?:amp|quot|#39|lt|gt);/);
    }
  });
});
