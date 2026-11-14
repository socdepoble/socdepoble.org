/* R24 · xat_entrega (IDEA-260 b, P2-9) · Textos accessibles honestos de les
   marques: ✓ «Enviat al servidor», ✓✓ gris «Ha arribat a l’aplicació»,
   ✓✓ blau «Llegit» i, quan el servidor no informa de l'entrega, el ✓ ho diu en
   lloc de suggerir que encara no ha arribat. En les cinc llengües, amb els
   diccionaris de veres, i a la previsualització de la llista i a la bombolla. */
import { afterEach, describe, expect, it } from 'vitest';
import { cleanup, render, screen } from '@testing-library/react';
import MarquesEstat from './MarquesEstat.jsx';
import FilaConversa from './FilaConversa.jsx';
import Bombolla from './Bombolla.jsx';
import { MemoryRouter } from '../../../app/contexts/RouterContext.jsx';
import { mapejaFil } from '../missatges.js';
import ca from '../../../config/idiomes/ca.js';
import es from '../../../config/idiomes/es.js';
import en from '../../../config/idiomes/en.js';
import eu from '../../../config/idiomes/eu.js';
import gl from '../../../config/idiomes/gl.js';

afterEach(cleanup);
const reserva = (_, alternativa) => alternativa;
const amb = diccionari => (clau, alternativa) => diccionari[clau] ?? alternativa;
const text = (props, t = reserva) => {
  const { container } = render(<MarquesEstat t={t} {...props} />);
  const valor = container.querySelector('.sdp-nomes-lector').textContent;
  cleanup();
  return valor;
};

describe('MarquesEstat · textos honestos', () => {
  it('la reserva en valencià diu què ha passat de veres', () => {
    expect(text({ estat: 'enviat' })).toBe('Enviat al servidor');
    expect(text({ estat: 'lliurat' })).toBe('Ha arribat a l’aplicació');
    expect(text({ estat: 'llegit' })).toBe('Llegit');
    expect(text({ estat: 'enviat', rebutsConeguts: false })).toBe('Enviat al servidor (este servidor no informa de l’entrega)');
    /* Només el ✓ canvia: el que ja se sap no es retira. */
    expect(text({ estat: 'lliurat', rebutsConeguts: false })).toBe('Ha arribat a l’aplicació');
    expect(text({ estat: 'llegit', rebutsConeguts: false })).toBe('Llegit');
  });

  it.each([['ca', ca], ['es', es], ['en', en], ['eu', eu], ['gl', gl]])('%s: quatre textos distints i cap reserva en valencià fora del ca', (llengua, diccionari) => {
    const t = amb(diccionari);
    for (const clau of ['section.xat.estat.enviat', 'section.xat.estat.lliurat', 'section.xat.estat.llegit', 'section.xat.estat.enviatSenseRebuts']) {
      expect(typeof diccionari[clau], `${llengua}: ${clau}`).toBe('string');
    }
    const textos = [text({ estat: 'enviat' }, t), text({ estat: 'lliurat' }, t), text({ estat: 'llegit' }, t), text({ estat: 'enviat', rebutsConeguts: false }, t)];
    expect(new Set(textos).size).toBe(4);
    if (llengua !== 'ca') expect(textos).not.toContain('Ha arribat a l’aplicació');
  });
});

describe('la marca a la llista i a la conversa', () => {
  const base = { id: 'd-24', tipus: 'directe', titol: 'Bernat', ultimText: 'Hola', ultimAutorId: 'jo', ultimSeq: 5, ultimAl: new Date().toISOString() };
  const marca = dades => {
    render(<FilaConversa fil={mapejaFil(dades)} onSelect={() => {}} t={reserva} locale="ca-ES" joId="jo" />);
    return screen.getByRole('button').querySelector('.sdp-xat-marques');
  };

  it('la previsualització: ✓✓ gris amb el rebut dels altres; el ✓ diu si el servidor no ho sap', () => {
    let m = marca({ ...base, rebutPelsAltresFinsSeq: 5 });
    expect(m.classList.contains('sdp-xat-marques--lliurat')).toBe(true);
    expect(m.textContent).toBe('Ha arribat a l’aplicació');
    cleanup();
    m = marca({ ...base, rebutPelsAltresFinsSeq: 4 });
    expect(m.textContent).toBe('Enviat al servidor');
    cleanup();
    m = marca(base);
    expect(m.classList.contains('sdp-xat-marques--enviat')).toBe(true);
    expect(m.textContent).toBe('Enviat al servidor (este servidor no informa de l’entrega)');
  });

  it('la bombolla pròpia: el ✓ d’un missatge anotat diu que el servidor no informa de l’entrega', () => {
    const pinta = extra => {
      render(<MemoryRouter><ul><Bombolla missatge={{ id: 'm-24', sender: 'me', text: 'Hola', seq: 5, creatAl: '2026-11-14T05:00:00Z', ...extra }} locale="ca-ES" t={reserva} /></ul></MemoryRouter>);
      const valor = document.querySelector('.sdp-xat-marques .sdp-nomes-lector').textContent;
      cleanup();
      return valor;
    };
    expect(pinta({ estatEnviament: 'enviat', rebutsConeguts: false })).toBe('Enviat al servidor (este servidor no informa de l’entrega)');
    expect(pinta({ estatEnviament: 'enviat' })).toBe('Enviat al servidor');
    expect(pinta({ estatEnviament: 'lliurat' })).toBe('Ha arribat a l’aplicació');
  });
});
