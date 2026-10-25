/* Gauntlet 261025_0545 (carril de la vista del xat) · El text que escriu la
   gent dins del xat: un nom o un terme amb «$&», «$'» o «$`» es pinta tal
   qual (TE-03: String.prototype.replace amb una cadena els expandix; amb una
   funció, no), i la bombolla i la previsualització prenen la direcció del seu
   text (XU-14: dir="auto", l'àrab o l'hebreu de dreta a esquerra). */
import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, test, vi } from 'vitest';
import { MemoryRouter } from '../../../app/contexts/RouterContext.jsx';
import Bombolla from './Bombolla.jsx';
import CapcaleraConversa from './CapcaleraConversa.jsx';
import FilaConversa from './FilaConversa.jsx';
import ResultatsCercaXat from './ResultatsCercaXat.jsx';

const t = (_, alternativa) => alternativa;
afterEach(cleanup);

const RAR = "Bar $` $& $' Co";
const missatge = (extra = {}) => ({
  id: 'm1', seq: 1, sender: 'other', author: RAR, usuariId: 'pep', text: 'مرحبا، الساعة 5؟',
  creatAl: '2026-10-25T10:00:00Z', estatEnviament: 'enviat', ...extra
});

describe('TE-03 · interpolació amb funció', () => {
  test('ResultatsCercaXat · un terme sense resultats es repetix tal qual', () => {
    for (const terme of ["$'", '$&', '$`']) {
      render(<ResultatsCercaXat resultat={{ converses: [], persones: [], missatges: [] }} terme={terme} onObriFil={() => {}} onObriPersona={() => {}} t={t} locale="ca-ES" />);
      expect(screen.getByRole('status').textContent).toBe(`Cap resultat per a «${terme}».`);
      cleanup();
    }
  });

  test('CapcaleraConversa · el canal d’una entitat, el subjecte i els enllaços', () => {
    const { rerender } = render(
      <MemoryRouter>
        <CapcaleraConversa fil={{ id: 'c', tipus: 'directe', name: RAR, comEntitat: true, entitatNom: RAR, altres: [{ id: 'p', tipus: 'persona', nom: RAR }] }} onTorna={vi.fn()} t={t} />
      </MemoryRouter>
    );
    expect(screen.getByText(`Canal de ${RAR}`)).toBeTruthy();
    expect(screen.getByRole('link', { name: `Obri el perfil de ${RAR}` })).toBeTruthy();
    rerender(
      <MemoryRouter>
        <CapcaleraConversa fil={{ id: 'g', tipus: 'grup', name: 'Pàgina', subjecte: { titol: RAR, ruta: '/fedivers' } }} onTorna={vi.fn()} t={t} />
      </MemoryRouter>
    );
    expect(screen.getByText(`Sobre: ${RAR}`)).toBeTruthy();
    expect(screen.getByRole('link', { name: `Obri la pàgina ${RAR}` })).toBeTruthy();
  });

  test('Bombolla · l’enllaç al perfil de l’autor en un grup', () => {
    render(<MemoryRouter><ol><Bombolla missatge={missatge()} esGrup locale="ca-ES" t={t} /></ol></MemoryRouter>);
    expect(screen.getByRole('link', { name: `Obri el perfil de ${RAR}` })).toBeTruthy();
  });

  test('Bombolla · els paràmetres d’un missatge de sistema', () => {
    const tSistema = (clau, alternativa) => (clau === 'section.xat.sistema.entra' ? '{nom} ha entrat al grup' : alternativa);
    render(<MemoryRouter><ol><Bombolla missatge={missatge({ tipus: 'sistema', metadades: { clau: 'entra', parametres: { nom: RAR } } })} locale="ca-ES" t={tSistema} /></ol></MemoryRouter>);
    expect(screen.getByText(`${RAR} ha entrat al grup`)).toBeTruthy();
  });
});

describe('XU-14 · dir="auto" al text de la gent', () => {
  test('el text de la bombolla', () => {
    const { container } = render(<MemoryRouter><ol><Bombolla missatge={missatge()} locale="ca-ES" t={t} /></ol></MemoryRouter>);
    expect(container.querySelector('.sdp-xat-bombolla__text').getAttribute('dir')).toBe('auto');
  });

  test('la previsualització de la fila de la llista', () => {
    const { container } = render(<FilaConversa fil={{ id: 'f', tipus: 'directe', name: 'Pep', ultimText: 'مرحبا' }} onSelect={() => {}} locale="ca-ES" t={t} />);
    expect(container.querySelector('.sdp-xat-fila__previa').getAttribute('dir')).toBe('auto');
  });
});
