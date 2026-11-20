import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, test, vi } from 'vitest';
import { MemoryRouter } from '../../app/contexts/RouterContext.jsx';
import { Camp, CampText, Selector } from '../../components/PedraSeca/organismes/formulari.jsx';
import { PortaDePagina, PortesTargeta } from '../../components/PedraSeca/organismes/PortesTargeta.jsx';
import { SelectorOpcionsDesplegable } from '../../components/PedraSeca/molecules/SelectorOpcionsDesplegable.jsx';
import { Cella } from './PaginesEspaiMultimedia.jsx';
import AparadorFediversity from '../text/AparadorFediversity.jsx';
import { APARADOR_R20_TEXTS } from '../text/pageContent.fediversityR20.js';
import { etiquetaEnllacosDImatge } from '../detail/etiquetaEnllacosDImatge.js';
import { sanitizeHtml } from '../../utils/sanitize';
import { SUPPORTED_LANGUAGES, createTranslator } from '../../config/i18n.js';
import '../../../tests/helpers/diccionaris.js';

vi.mock('../../components/universal/NotificationContext.jsx', () => ({
  useToast: () => ({ showToast: vi.fn() }),
}));

afterEach(() => {
  cleanup();
});

describe('Onada R32.20 · Lot 1 · Zero controls sense nom accessible sota content-visibility en 5 llengües', () => {
  test.each(SUPPORTED_LANGUAGES.map(({ code }) => code))(
    '%s · Cella (.photo-grid__boto), AparadorFediversity textarea, SelectorOpcionsDesplegable i Camp exposen atributs accessibles explícits',
    (lang) => {
      const t = createTranslator(lang);
      const { container } = render(
        <MemoryRouter>
          <Cella item={{ id: 'm1', title: '', tag: '', src: '/assets/nano_cards/mur_nano_card.jpg' }} onObri={() => {}} t={t} />
          <Cella item={{ id: 'm2', title: 'Animalets', tag: 'Arxiu', src: '/assets/nano_cards/animalets_nano_card.jpg' }} onObri={() => {}} t={t} />
          <AparadorFediversity language={lang} />
          <SelectorOpcionsDesplegable
            llegenda="Còpia"
            valor="usb"
            onCanvi={() => {}}
            opcions={[
              { id: 'usb', titol: 'Arxiu USB', explicacio: 'Explicació USB' },
              { id: 'qr', titol: 'Pont QR', explicacio: 'Explicació QR' },
            ]}
          />
          <Camp etiqueta={t('section.poblacio.col.poble', 'Poble')}>
            <CampText />
          </Camp>
          <Camp etiqueta={t('section.poblacio.col.comarca', 'Comarca')}>
            <Selector opcions={[{ valor: 'alcoia', etiqueta: 'Alcoià' }]} />
          </Camp>
        </MemoryRouter>,
      );

      const botonsFoto = [...container.querySelectorAll('button.photo-grid__boto')];
      expect(botonsFoto).toHaveLength(2);
      expect(botonsFoto[0].getAttribute('aria-label')).toBeTruthy();
      expect(botonsFoto[1].getAttribute('aria-label')).toBe('Animalets');

      const textarea = container.querySelector('textarea[maxlength="16000"]');
      expect(textarea?.getAttribute('aria-label')).toBe(APARADOR_R20_TEXTS[lang].label);

      const radios = [...container.querySelectorAll('.sdp-selector-opcions__tria input[type="radio"]')];
      expect(radios).toHaveLength(2);
      for (const radio of radios) {
        const refId = radio.getAttribute('aria-labelledby');
        expect(refId).toBeTruthy();
        expect(document.getElementById(refId)?.textContent.trim().length).toBeGreaterThan(0);
      }

      const controlsCamp = [...container.querySelectorAll('.sdp-camp .sdp-control')];
      expect(controlsCamp).toHaveLength(2);
      for (const ctrl of controlsCamp) {
        const refId = ctrl.getAttribute('aria-labelledby');
        expect(refId).toBeTruthy();
        expect(document.getElementById(refId)?.textContent.trim().length).toBeGreaterThan(0);
      }
    },
  );

  test('PortesTargeta i PortaDePagina enllacen els spans amb aria-labelledby sense afegir aria-label', () => {
    const { container } = render(
      <MemoryRouter>
        <PortesTargeta
          portes={[
            { id: 'pub', verb: 'Publicar', nom: 'Publicar al Mur', desti: '/notes', varietat: 'primari' },
            { id: 'veh', verb: 'Publicar', nom: 'Publicar: Vehicle Compartit', desti: null, varietat: 'secundari' },
          ]}
        />
        <PortaDePagina porta={{ id: 'xat', verb: 'Anar al xat', nom: 'Anar al xat', desti: '/xat' }} />
      </MemoryRouter>,
    );

    expect(screen.getByRole('link', { name: 'Publicar al Mur' }).hasAttribute('aria-label')).toBe(false);
    expect(screen.getByRole('button', { name: 'Publicar: Vehicle Compartit (en obres)' }).hasAttribute('aria-label')).toBe(false);
    expect(screen.getByRole('link', { name: 'Anar al xat' }).hasAttribute('aria-label')).toBe(false);

    for (const el of container.querySelectorAll('a, button')) {
      expect(el.getAttribute('aria-labelledby')).toBeTruthy();
    }
  });

  test('etiquetaEnllacosDImatge posa aria-label als enllaços muts amb imatge i preserva intactes els enllaços amb text', () => {
    const mut = '<p><a href="https://nlnet.nl/fediversity/" target="_blank" rel="noopener noreferrer nofollow"><img src="/assets/uploads/ngi-fediversity-tag.svg" alt="Logotip NGI Fediversity"></a></p>';
    const enriquit = etiquetaEnllacosDImatge(mut);
    expect(enriquit).toContain('aria-label="Logotip NGI Fediversity"');

    const ambText = '<p><a href="/mur"><strong>Mur</strong> <img src="/assets/x.png" alt="Decorativa"></a></p>';
    expect(etiquetaEnllacosDImatge(ambText)).toBe(ambText);
  });

  /* Gauntlet v1.2.15 · l'etiquetatge va ABANS del sanejador (sanitizeHtml(etiquetaEnllacosDImatge(…))):
     el sanejador conserva l'aria-label (ALLOW_ARIA_ATTR) i neteja tot el que l'etiquetatge haja tornat a
     serialitzar; un alt hostil queda com a text de l'atribut, mai com a marcatge. */
  test('el sanejador va després de l’etiquetatge: conserva l’aria-label i neutralitza un alt hostil', () => {
    const net = sanitizeHtml(etiquetaEnllacosDImatge('<p><a href="/mur"><img src="/assets/x.png" alt="Logotip del Mur"></a></p>'));
    expect(net).toContain('aria-label="Logotip del Mur"');
    const hostil = sanitizeHtml(etiquetaEnllacosDImatge('<p><a href="/mur"><img src="/assets/x.png" alt="&quot;&gt;&lt;img src=x onerror=alert(1)&gt;"></a><script>alert(2)</script></p>'));
    const doc = new DOMParser().parseFromString(hostil, 'text/html');
    expect(doc.querySelectorAll('img')).toHaveLength(1);
    expect(doc.querySelector('[onerror]')).toBeNull();
    expect(doc.querySelector('script')).toBeNull();
    expect(doc.querySelector('a').getAttribute('aria-label')).toBe('"><img src=x onerror=alert(1)>');
  });

  /* Gauntlet v1.2.15 · Ronda 2 · Un «</template>» dins de l'HTML cru no pot fer perdre el que va darrere. */
  test('un «</template>», un <textarea> obert o un <frameset> a l’HTML cru: etiqueta i el text visible és el de sempre', () => {
    const enllac = '<p><a href="/a"><img src="/assets/x.png" alt="A"></a></p>';
    const text = (html) => new DOMParser().parseFromString(html, 'text/html').body.textContent;
    for (const cola of ['</template><p>RESTA</p>', '<textarea>RESTA', '</template><frameset>RESTA', '<svg></template><p>RESTA</p>']) {
      const cru = enllac + cola;
      const nou = sanitizeHtml(etiquetaEnllacosDImatge(cru));
      expect(nou, cola).toContain('aria-label="A"');
      expect(text(nou), cola).toBe(text(sanitizeHtml(cru)));
      expect(text(nou), cola).not.toContain('</template>');
    }
    /* I les etiquetes de capçalera al principi es queden al cos, com les veu el sanejador. */
    for (const cap of ['<title>TITOL</title>', '<style>p{}</style>', '<meta name="x" content="y">']) {
      const cru = cap + enllac;
      const nou = sanitizeHtml(etiquetaEnllacosDImatge(cru));
      expect(nou, cap).toContain('aria-label="A"');
      expect(text(nou), cap).toBe(text(sanitizeHtml(cru)));
    }
  });

  /* Gauntlet v1.2.15 · Ronda 2 · Cap consumidor torna a etiquetar DESPRÉS del sanejador. */
  test('tot consumidor crida etiquetaEnllacosDImatge dins de sanitizeHtml, mai al revés', () => {
    const consumidors = ['src/sections/detail/detailRichText.jsx', 'src/sections/text/TextSection.jsx',
      'src/components/universal/richText/htmlEditorial.jsx'];
    for (const fitxer of consumidors) {
      const codi = readFileSync(resolve(process.cwd(), fitxer), 'utf8');
      const crides = [...codi.matchAll(/(\w+)\(etiquetaEnllacosDImatge\(/g)].map((m) => m[1]);
      expect(crides.length, fitxer).toBeGreaterThan(0);
      expect(new Set(crides), fitxer).toEqual(new Set(['sanitizeHtml']));
      expect(codi, fitxer).not.toContain('etiquetaEnllacosDImatge(sanitizeHtml(');
    }
  });
});
