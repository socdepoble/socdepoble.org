/** @jsxImportSource preact */
/**
 * Proves de la LLEI DE LA FITXA (dictamen Seient Núm. 5 · 260911).
 *
 * Amb `render` de Preact directe i una arrel separada del document, com
 * src/components/ui/UniversalCard.test.jsx: @testing-library/react pinta amb
 * el react-dom real i fa petar les suites (dictamen 260910).
 *
 * Què NO es prova ací: els límits de línies (títol ≤ 2 · subtítol ≤ 1) i la
 * mida de 96px. jsdom no maqueta, i una prova que no pot fallar no és una
 * prova. Això ho vigila tooling/gates/tractor-fitxa-gestor.mjs (F8) llegint
 * el CSS i calculant el pressupost vertical.
 */
import { render } from 'preact';
import { act } from 'preact/test-utils';
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';

/* La llista necessita la graella i les icones. lucide-react es carrega fora
   de l'àlies de Vite (amb el React real), així que es substituïx per SVG de
   Preact; la graella, per la mida ampla. */
vi.mock('lucide-react', async () => {
  const { h } = await import('preact');
  const icona = (nom) => () => h('svg', { 'data-lucide': nom, 'aria-hidden': 'true' });
  return {
    Search: icona('Search'),
    Plus: icona('Plus'),
    ChevronDown: icona('ChevronDown'),
    ChevronRight: icona('ChevronRight'),
    PanelLeftClose: icona('PanelLeftClose'),
  };
});
vi.mock('../src/components/layout/AppGridShell', () => ({
  useAppGrid: () => ({ mida: 'ample', setPanellObert: () => {} }),
}));

import ManagerItemCard from '../src/components/universal/manager/ManagerItemCard.jsx';
import ManagerList from '../src/components/universal/manager/ManagerList.jsx';
import { ManagerProvider } from '../src/components/universal/manager/ManagerContext.jsx';

let arrel;
beforeEach(() => {
  arrel = document.createElement('div'); // arrel separada: no penja del document
});
afterEach(() => {
  act(() => { render(null, arrel); });
});

const pinta = (vnode) => {
  console.log('PINTA vnode:', vnode, 'extensible:', Object.isExtensible(vnode), 'type:', typeof vnode);
  return act(() => { render(vnode, arrel); });
};
const fitxa = (props = {}) => pinta(<ManagerItemCard titol="Fira del Porrat" {...props} />);
const troba = (selector) => arrel.querySelector(selector);
const totes = (selector) => [...arrel.querySelectorAll(selector)];
const falla = (img) => act(() => { img.dispatchEvent(new Event('error')); });

function IconaProva() {
  return <svg data-icona="prova" />;
}

/* ═══════════════════════ Botó natiu d'acció ═══════════════════════ */

describe("botó natiu d'acció", () => {
  test('l\'arrel és un sol <button type="button">, sense rol ni tabindex postissos', () => {
    fitxa({ subtitol: '12/09/26' });
    expect(arrel.children).toHaveLength(1);
    const boto = arrel.firstElementChild;
    expect(boto.tagName).toBe('BUTTON');
    expect(boto.getAttribute('type')).toBe('button');
    expect(boto.hasAttribute('role')).toBe(false);
    expect(boto.hasAttribute('tabindex')).toBe(false);
  });

  test('no hi ha cap altre element interactiu dins de la fitxa', () => {
    fitxa({ subtitol: 'Subtítol', icona: IconaProva });
    const interactius = totes('button, a, input, select, textarea, [tabindex], [role="button"], [role="link"]');
    expect(interactius).toHaveLength(1);
    expect(interactius[0]).toBe(arrel.firstElementChild);
    expect(interactius[0].tagName).toBe('BUTTON'); // un <div role="button"> no passa
  });

  test('un clic crida onSelecciona una sola vegada', () => {
    const onSelecciona = vi.fn();
    fitxa({ onSelecciona });
    act(() => { troba('button').click(); });
    expect(onSelecciona).toHaveBeenCalledTimes(1);
  });

  test('sense onSelecciona, clicar no peta', () => {
    fitxa();
    expect(() => act(() => { troba('button').click(); })).not.toThrow();
  });
});

/* ═══════════════════════ Llei 2 + 1: títol i subtítol, res més ═══════════════════════ */

describe('llei 2 + 1: títol i subtítol, res més', () => {
  test('cap h1–h6 ni rol de capçalera dins del botó', () => {
    fitxa({ subtitol: '12/09/26' });
    const boto = troba('button');
    expect(boto.querySelectorAll('h1, h2, h3, h4, h5, h6, [role="heading"]')).toHaveLength(0);
  });

  test("cap forma d'article: ni <article>, ni <header>, ni <footer>, ni <p>", () => {
    fitxa({ subtitol: '12/09/26', icona: IconaProva });
    expect(troba('button').querySelectorAll('article, header, footer, p')).toHaveLength(0);
  });

  test('el text té com a molt dos fills: títol i subtítol, en eixe ordre', () => {
    fitxa({ subtitol: 'El Rentonar' });
    const fills = [...troba('.sdp-gestor-fitxa__text').children].map((n) => n.className);
    expect(fills).toEqual(['sdp-gestor-fitxa__titol', 'sdp-gestor-fitxa__subtitol']);
    expect(troba('.sdp-gestor-fitxa__titol').textContent).toBe('Fira del Porrat');
    expect(troba('.sdp-gestor-fitxa__subtitol').textContent).toBe('El Rentonar');
  });

  test('sense subtítol no queda cap contenidor buit', () => {
    fitxa();
    expect(troba('.sdp-gestor-fitxa__subtitol')).toBeNull();
    expect(troba('.sdp-gestor-fitxa__text').children).toHaveLength(1);
  });

  test('un cos, una entradilla o uns fills no tenen on pintar-se', () => {
    pinta(
      <ManagerItemCard titol="Assemblea" cos="COS-AMAGAT" entradilla="ENTRADILLA-AMAGADA" body="BODY-AMAGAT">
        <p>FILL-AMAGAT</p>
      </ManagerItemCard>
    );
    expect(arrel.textContent).not.toMatch(/AMAGAT|AMAGADA/);
    expect(troba('p')).toBeNull();
    expect(troba('button').hasAttribute('cos')).toBe(false);
    expect(troba('button').hasAttribute('entradilla')).toBe(false);
  });
});

/* ═══════════════════════ aria-current ═══════════════════════ */

describe('aria-current', () => {
  test('una fitxa activa porta aria-current="true"', () => {
    fitxa({ actiu: true });
    expect(troba('button').getAttribute('aria-current')).toBe('true');
  });

  test('una fitxa inactiva no porta l\'atribut: mai aria-current="false"', () => {
    fitxa({ actiu: false });
    expect(troba('button').hasAttribute('aria-current')).toBe(false);
    fitxa();
    expect(troba('button').hasAttribute('aria-current')).toBe(false);
  });
});

/* ═══════════════════════ Cadena imatge › icona › inicial ═══════════════════════ */

describe('cadena de fallback: imatge › icona › inicial', () => {
  test('una imatge segura guanya a la icona i a la inicial, i és decorativa', () => {
    fitxa({ imatge: '/assets/fira.jpg', icona: IconaProva });
    const img = troba('img');
    expect(img.getAttribute('src')).toBe('/assets/fira.jpg');
    expect(img.getAttribute('alt')).toBe('');
    expect(img.className).toBe('sdp-gestor-fitxa__imatge');
    expect(troba('[data-icona]')).toBeNull();
    expect(troba('.sdp-gestor-fitxa__inicial')).toBeNull();
    expect(troba('.sdp-gestor-fitxa__media').getAttribute('aria-hidden')).toBe('true');
  });

  test('una data:image també és segura', () => {
    fitxa({ imatge: 'data:image/png;base64,iVBORw0KGgo=' });
    expect(troba('img')).not.toBeNull();
  });

  test.each([
    ['javascript:', 'javascript:alert(1)'],
    ['protocol relatiu', '//dolent.example/x.png'],
    ['data que no és imatge', 'data:text/html;base64,PHNjcmlwdD4='],
  ])('una URL insegura (%s) no es pinta mai i cau a la icona', (_, url) => {
    fitxa({ imatge: url, icona: IconaProva });
    expect(troba('img')).toBeNull();
    expect(troba('[data-icona]')).not.toBeNull();
  });

  test('una imatge que no és text no tomba la fitxa', () => {
    fitxa({ imatge: { url: '/assets/fira.jpg' }, icona: IconaProva });
    expect(troba('img')).toBeNull();
    expect(troba('[data-icona]')).not.toBeNull();
  });

  test('si la imatge falla, cau a la icona', () => {
    fitxa({ imatge: '/assets/trencada.jpg', icona: IconaProva });
    falla(troba('img'));
    expect(troba('img')).toBeNull();
    expect(troba('[data-icona]')).not.toBeNull();
  });

  test('si la imatge falla i no hi ha icona, cau a la inicial', () => {
    fitxa({ titol: "l'Horta de Dalt", imatge: '/assets/trencada.jpg' });
    falla(troba('img'));
    expect(troba('img')).toBeNull();
    expect(troba('.sdp-gestor-fitxa__inicial').textContent).toBe('L');
  });

  test('una imatge nova es torna a provar després d\'una fallada', () => {
    fitxa({ imatge: '/assets/a.jpg' });
    falla(troba('img'));
    expect(troba('img')).toBeNull();
    fitxa({ imatge: '/assets/b.jpg' });
    expect(troba('img').getAttribute('src')).toBe('/assets/b.jpg');
  });

  test('sense imatge ni icona: inicial en majúscula, amb la ç del català', () => {
    fitxa({ titol: 'çaragata' });
    expect(troba('.sdp-gestor-fitxa__inicial').textContent).toBe('Ç');
  });

  test('una emoji inicial no es parteix pel mig', () => {
    fitxa({ titol: '🌿 Hort comunal' });
    expect(troba('.sdp-gestor-fitxa__inicial').textContent).toBe('🌿');
  });

  test('la media sempre té exactament un contingut: mai un forat', () => {
    const casos = [
      { imatge: '/assets/fira.jpg', icona: IconaProva },
      { icona: IconaProva },
      {},
      { imatge: 'javascript:alert(1)' },
    ];
    for (const props of casos) {
      fitxa(props);
      expect(troba('.sdp-gestor-fitxa__media').children).toHaveLength(1);
    }
  });
});

/* ═══════════════════════ La llista pinta la fitxa (P0 · getItemId) ═══════════════════════ */

describe('la llista pinta la fitxa i selecciona per getItemId (P0 · 260911)', () => {
  /* Al Perfil, els id d'ajust es repetixen entre identitats: la identitat
     de la fila ha de ser getItemId, no item.id. */
  const ajustos = [
    { id: 'nom', uniqueId: 'jo-nom', titol: 'Nom', valor: 'Javi' },
    { id: 'nom', uniqueId: 'rentonar-nom', titol: 'Nom', valor: 'El Rentonar' },
  ];
  const pintaLlista = () => pinta(
    <ManagerProvider items={ajustos} getItemId={(a) => a.uniqueId}>
      <ManagerList getItemCard={(a) => ({ titol: a.titol, subtitol: a.valor })} />
    </ManagerProvider>
  );

  test('cada fila és un <li> net que conté una sola fitxa', () => {
    pintaLlista();
    const files = totes('.sdp-gestor-llista > li');
    expect(files).toHaveLength(2);
    for (const li of files) {
      expect(li.hasAttribute('role')).toBe(false);
      expect(li.hasAttribute('tabindex')).toBe(false);
      expect(li.querySelectorAll('button')).toHaveLength(1);
      expect(li.firstElementChild.className).toBe('sdp-gestor-fitxa');
    }
  });

  test('seleccionar la segona fitxa la marca a ella, no a la primera', () => {
    pintaLlista();
    const [primera, segona] = totes('.sdp-gestor-fitxa');
    expect(primera.getAttribute('aria-current')).toBe('true');
    expect(segona.hasAttribute('aria-current')).toBe(false);

    act(() => { segona.click(); });

    const [ara1, ara2] = totes('.sdp-gestor-fitxa');
    expect(ara2.getAttribute('aria-current')).toBe('true');
    expect(ara1.hasAttribute('aria-current')).toBe(false);
    expect(ara2.textContent).toContain('El Rentonar');
  });
});
