/* Revisió 261004 (Relleus 4-12) · La reserva de la barra mòbil en
   compacte (.sdp-root.is-compact, l'arrel ≤ 1023 px). La regla de la llista
   de converses del bloc F0 posa la reserva a TOTA .sdp-xat-llista de la
   closca. Els contenidors que ja la porten i tenen llistes de dins les
   reinicien (resultats, fitxa, diàleg, comunitats); Contingut multimèdia no
   ho feia, i cada grup de mes, que és una .sdp-xat-llista, deixava 72 px +
   safe-area de buit davall seu, a més de la reserva del contenidor.
   jsdom no resol la cascada: es comproven les regles de modules.css, i el DOM
   de la vista per a lligar-les al que es pinta. */
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { cleanup, fireEvent, render, screen, within } from '@testing-library/react';
import { afterEach, expect, test } from 'vitest';
import VistaMultimedia from './VistaMultimedia.jsx';

afterEach(cleanup);

const modules = readFileSync(resolve(process.cwd(), 'src/css/modules.css'), 'utf8').replace(/\/\*[\s\S]*?\*\//g, '');
const net = (text) => text.replace(/\s+/g, ' ').trim();

/** El valor d'una propietat a les regles d'un selector exacte (l'última guanya). */
function valor(selector, propietat) {
  let trobat = null;
  for (const m of modules.matchAll(/([^{}]+)\{([^{}]*)\}/g)) {
    const selectors = net(m[1].split(';').pop()).split(',').map(net);
    if (!selectors.includes(selector)) continue;
    for (const declaracio of m[2].split(';')) {
      const [prop, ...resta] = declaracio.split(':');
      if (net(prop || '') === propietat) trobat = net(resta.join(':'));
    }
  }
  return trobat;
}

const COMPACTE = ':where(.sdp-root.is-compact) .app-grid-shell';
const RESERVA = 'calc(var(--sdp-alt-nav-mobil) + env(safe-area-inset-bottom, 0px))';

test('en compacte, la regla de la llista de converses posa la reserva a tota .sdp-xat-llista de la closca', () => {
  expect(valor(`${COMPACTE} .sdp-xat-llista`, 'padding-bottom')).toBe(RESERVA);
});

test.each(['sdp-xat-resultats', 'sdp-xat-fitxa-comunitat', 'sdp-xat-dialeg', 'sdp-xat-vista-comunitats', 'sdp-xat-multimedia'])(
  'les llistes de dins de .%s no repetixen la reserva',
  (contenidor) => {
    expect(valor(`${COMPACTE} .${contenidor} .sdp-xat-llista`, 'padding-bottom')).toBe('0');
  }
);

test('Contingut multimèdia: la reserva va una sola vegada, al contenidor, i cada grup de mes és una llista de dins', () => {
  expect(valor(`${COMPACTE} .sdp-xat-multimedia`, 'padding-bottom')).toBe(RESERVA);
  const t = (_, alternativa) => alternativa;
  render(
    <VistaMultimedia
      titol="Contingut multimèdia"
      fils={[{ id: 'f-festes', name: 'Comissió de Festes', tipus: 'grup' }]}
      missatgesPerFil={{ 'f-festes': [
        { id: 'm1', seq: 1, sender: 'other', author: 'Pepica', text: 'https://socdepoble.org/festes', creatAl: '2026-10-03T18:00:00Z' },
        { id: 'm2', seq: 2, sender: 'me', text: 'https://socdepoble.org/cartell', creatAl: '2026-09-20T18:00:00Z' }
      ] }}
      t={t}
    />
  );
  fireEvent.click(within(screen.getByRole('group', { name: 'Tipus de contingut' })).getByRole('button', { name: 'Enllaços' }));
  const llistes = document.querySelectorAll('.sdp-xat-llista');
  expect(llistes).toHaveLength(2);
  for (const llista of llistes) expect(llista.closest('.sdp-xat-multimedia')).not.toBeNull();
});
