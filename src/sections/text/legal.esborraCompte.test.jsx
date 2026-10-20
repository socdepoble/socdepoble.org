/**
 * Fase D (261020, tasca 3.2) · L'adreça pública per a esborrar la conta, la que
 * demanen la Play Console i l'App Store: https://socdepoble.org/legal#esborra-compte.
 * L'àncora la declara el contingut (data-sdp-ancora a l'h5 de l'apartat 16), el
 * sanejador la conserva i PageFrame hi salta pel fragment del document o per
 * ?seccio=esborra-compte. Esta prova fixa que la secció hi és una sola vegada, al
 * seu lloc, amb el que la persona necessita, i que la ruta és pública.
 */
import React from 'react';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { cleanup, render } from '@testing-library/react';
import { afterEach, describe, expect, test, vi } from 'vitest';

/* L'arnés de TextSection.targetes.test.jsx: la pàgina reduïda als seus fills. */
const mocks = vi.hoisted(() => ({ navigate: vi.fn(), toast: vi.fn(), t: (_, alternativa) => alternativa }));
vi.mock('../../app/contexts/UIContext', () => ({ useUIActions: () => ({ t: mocks.t }) }));
vi.mock('../../hooks/useSEO', () => ({ useSEO: () => {} }));
vi.mock('../../app/contexts/RouterContext', () => ({ useNavigate: () => mocks.navigate, Link: 'a' }));
vi.mock('../../components/universal/NotificationContext.jsx', () => ({ useToast: () => ({ showToast: mocks.toast }) }));
vi.mock('../../components/universal/UniversalPage', () => ({
  UniversalPage: ({ children }) => React.createElement('div', { 'data-pagina': '' }, children)
}));
import TextSection from './TextSection.jsx';
import { PAGE_COPY } from './pageContent.js';
import { sanitizeHtml } from '../../utils/sanitize';

afterEach(() => {
  cleanup();
  vi.clearAllMocks();
});

const ANCORA = 'esborra-compte';

/** L'HTML legal sanejat, com el llig TextSection, en un contenidor. */
function legalSanejat() {
  const arrel = document.createElement('div');
  arrel.innerHTML = sanitizeHtml(PAGE_COPY.legal.html);
  return arrel;
}

/** L'encapçalament h4 més pròxim abans (o després) d'`element`, en l'ordre del document. */
function h4Veina(arrel, element, abans) {
  const h4 = [...arrel.querySelectorAll('h4')];
  const posicio = (el) => element.compareDocumentPosition(el);
  const candidates = h4.filter((el) => (abans ? posicio(el) & Node.DOCUMENT_POSITION_PRECEDING : posicio(el) & Node.DOCUMENT_POSITION_FOLLOWING));
  return abans ? candidates.at(-1) : candidates[0];
}

/** El text des de l'àncora fins al següent h4: la secció sencera. */
function textDeLaSeccio(arrel, ancora) {
  const trossos = [];
  for (let node = ancora; node && !(node !== ancora && node.tagName === 'H4'); node = node.nextElementSibling) trossos.push(node);
  return trossos;
}

describe('/legal#esborra-compte · com esborrar la conta', () => {
  test('una sola àncora, un h5 «Com esborrar la teua conta» entre «Els teus drets» i «Seguretat»', () => {
    const arrel = legalSanejat();
    const ancores = arrel.querySelectorAll('[data-sdp-ancora]');
    expect(ancores).toHaveLength(1);
    const [h5] = ancores;
    expect(h5.tagName).toBe('H5');
    expect(h5.getAttribute('data-sdp-ancora')).toBe(ANCORA);
    expect(h5.textContent.trim()).toBe('Com esborrar la teua conta');
    expect(h4Veina(arrel, h5, true).textContent).toMatch(/Els teus drets/);
    expect(h4Veina(arrel, h5, false).textContent).toMatch(/Seguretat/);
  });

  test('la secció diu on és el botó, el correu, els 30 dies i com fer-se arrere', () => {
    const arrel = legalSanejat();
    const seccio = textDeLaSeccio(arrel, arrel.querySelector(`[data-sdp-ancora="${ANCORA}"]`));
    const text = seccio.map((node) => node.textContent).join('\n');
    for (const frase of ['Privacitat i dades', 'Donar-me de baixa', '30 dies naturals', 'des del correu de la teua conta', 'Cancel·lar la baixa']) {
      expect(text, frase).toContain(frase);
    }
    const correus = seccio.flatMap((node) => [...node.querySelectorAll('a[href^="mailto:"]')]);
    expect(correus.length).toBeGreaterThan(0);
    expect(correus.every((a) => a.getAttribute('href').startsWith('mailto:socdepoble@socdepoble.org'))).toBe(true);
  });

  test('pintada per TextSection (segmentsAmbTargetes inclòs), l’h5 conserva l’àncora', () => {
    const { container } = render(<TextSection page={PAGE_COPY.legal} pageKey="legal" />);
    expect(container.querySelectorAll(`h5[data-sdp-ancora="${ANCORA}"]`)).toHaveLength(1);
  });

  test('cap enllaç del text legal apunta a un fragment: les referències van a /legal?seccio=', () => {
    expect(PAGE_COPY.legal.html).not.toMatch(/href="#/);
  });

  test('la ruta /legal és pública: sense RequireAuth', () => {
    const app = readFileSync(resolve(process.cwd(), 'src/app/App.jsx'), 'utf8');
    const linia = app.split('\n').find((l) => l.includes('<Route path="/legal" element={<TextRoute pageKey="legal" />} />'));
    expect(linia).toBeTruthy();
    expect(linia).not.toContain('RequireAuth');
  });

  /* Decisió D-1 = A (Mestre, 261020): el text diu el que fa el codi. La baixa
     esborra auth.users i, en cascada, els missatges de xat. */
  test('l’apartat 10 ja no diu que la còpia de la conversa es queda', () => {
    expect(PAGE_COPY.legal.html).not.toMatch(/no s'esborra sola/);
    expect(PAGE_COPY.legal.html).toMatch(/els missatges que has escrit s'esborren amb ella/);
  });
});
