import { cleanup, render, screen, waitFor } from '@testing-library/react';
import { afterEach, describe, expect, test } from 'vitest';
import { RouterProvider } from '../../../app/contexts/RouterContext.jsx';
import { ORIGEN_SOCIAL_PER_DEFECTE, primeraImatgeSocial } from '../../../config/imatgeSocial.js';
import { resolvePageSlugPath } from '../../../config/navigation.js';
import { AREES_COMARCALS, PREGUNTES_ISOGLOSSES } from '../../../components/patrimoni/isoglossesComarcals.js';
import { REFRANYS_DE_POBLE_SEED } from '../../../components/patrimoni/refranysDePobleSeed.js';
import {
  LA_VEU_DE_SOC_DE_POBLE_COPY,
  LA_VEU_DE_SOC_DE_POBLE_HTML,
  LA_VEU_DE_SOC_DE_POBLE_ID,
  LA_VEU_DE_SOC_DE_POBLE_POST,
  LA_VEU_DE_SOC_DE_POBLE_RUTA,
} from './laVeuDeSocDePobleContent.js';
import { LaVeuDeSocDePobleArticle } from './LaVeuDeSocDePobleArticle.jsx';

afterEach(cleanup);

describe('La Veu de Sóc de Poble · vocabulari canònic, OpenGraph, Node 0 a la dreta i article interactiu', () => {
  test('guarda estricta de vocabulari: zero "del poble" i zero "sobirà/soberano/sovereign" en les 5 llengües i dades', () => {
    const corpus = JSON.stringify({
      copy: LA_VEU_DE_SOC_DE_POBLE_COPY,
      post: LA_VEU_DE_SOC_DE_POBLE_POST,
      isoglosses: PREGUNTES_ISOGLOSSES,
      arees: AREES_COMARCALS,
      refranys: REFRANYS_DE_POBLE_SEED,
    });

    expect(corpus).not.toMatch(/\bdel poble\b/i);
    expect(corpus).not.toMatch(/\bdels pobles\b/i);
    expect(corpus).not.toMatch(/sobir[aà]|sobirania|soberan[oaí]|sovereign|burujabe/i);

    for (const lang of ['ca', 'es', 'en', 'eu', 'gl']) {
      const trad = LA_VEU_DE_SOC_DE_POBLE_COPY[lang];
      expect(trad, `Falta traducció ${lang}`).toBeTruthy();
      const h3s = [...trad.html.matchAll(/<h3>/g)];
      expect(h3s, `Paritat 6 seccions H3 en ${lang}`).toHaveLength(6);
      expect(trad.html).toContain('data-sdp-targeta="pagina:node-zero"');
      expect(trad.html).toContain('https://socdepoble.cat/api/v1/node0/veu');
    }
  });

  test('resol l’àlies /page/la-veu-de-soc-de-poble i servix la variant JPEG baseline 1200x630 per a WhatsApp', () => {
    expect(LA_VEU_DE_SOC_DE_POBLE_ID).toBe('la-veu-de-soc-de-poble');
    expect(resolvePageSlugPath('la-veu-de-soc-de-poble')).toBe(LA_VEU_DE_SOC_DE_POBLE_RUTA);

    const social = primeraImatgeSocial('mur', LA_VEU_DE_SOC_DE_POBLE_POST, {
      origen: ORIGEN_SOCIAL_PER_DEFECTE,
    });
    expect(social.estat).toBe('triada');
    expect(social.url).toBe(
      'https://socdepoble.org/assets/mur/la_veu_de_soc_de_poble_nano_v4-social-1200x630.jpg'
    );
  });

  test('incrusta la UniversalCard del Node 0 flotant a la dreta i explica el servei gratuït al Mac mini M4', () => {
    expect(LA_VEU_DE_SOC_DE_POBLE_HTML).toContain('data-sdp-targeta="pagina:node-zero"');
    expect(LA_VEU_DE_SOC_DE_POBLE_HTML).toContain('data-forma="sola" data-alineacio="dreta"');
    expect(LA_VEU_DE_SOC_DE_POBLE_HTML).toContain('Matxa-TTS v2');
    expect(LA_VEU_DE_SOC_DE_POBLE_HTML).toContain('NEL-VIVES');
    expect(LA_VEU_DE_SOC_DE_POBLE_HTML).toContain('100 % gratuït');
  });

  test('pinta l’article sense cap h1 intrús al cos, amb targeta del Node 0 a la dreta, 7 veus (preload="none"), el joc i el refranyer', async () => {
    const { container } = render(
      <RouterProvider initialPath={LA_VEU_DE_SOC_DE_POBLE_RUTA}>
        <LaVeuDeSocDePobleArticle item={LA_VEU_DE_SOC_DE_POBLE_POST} />
      </RouterProvider>
    );

    expect(container.querySelector('h1')).toBeNull();

    const grupTargeta = container.querySelector('.sdp-targetes[data-forma="sola"][data-alineacio="dreta"]');
    expect(grupTargeta).not.toBeNull();
    expect(container.querySelector('a[href="/page/node-zero"]')).not.toBeNull();

    const audiosBanc = container.querySelectorAll('audio.sdp-banc-veus__audio');
    expect(audiosBanc).toHaveLength(7);
    for (const audio of audiosBanc) {
      expect(audio.getAttribute('preload')).toBe('none');
    }

    await waitFor(() => {
      expect(screen.getByRole('heading', { name: /D’on parles\? · El joc de les paraules de poble/ })).toBeTruthy();
      expect(screen.getByRole('heading', { name: /Refranyer Sonor de Poble per Comarques/ })).toBeTruthy();
    });
  });
});
