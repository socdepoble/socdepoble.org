/**
 * Onada 10 (261010; decisió del Mestre del 261010) · Per on s'entra al xat de
 * la IAIA des de fora del Xat (useObriXatPerDefecte.js · rutaDelXatDeLaIAIA):
 * la mateixa conversa que obri la fila «IAIA MarIA» de la llista.
 *
 *  · Remot: la fila d'ajuda per defecte porta a RUTA_XAT_DE_LA_IAIA (el hook
 *    d'este mateix mòdul, XatSection.test.jsx), i el xat públic de /iaia ja
 *    obert és eixe mateix fil amb el seu nom (vestixLaIAIA).
 *  · Llavor i local: la fila és el fil 'iaia', i s'hi arriba pel directe de
 *    sempre, /xat?amb=<id> (data/localXat.iaia.test.js prova que
 *    creaFilDirecte torna eixe fil).
 */
import { describe, expect, test } from 'vitest';
import { esRutaDeLaPorta } from '../../components/PedraSeca/organismes/PortesTargeta.jsx';
import { rutaXatDePagina, rutaXatPrivat } from '../../config/objecteConnectable.js';
import { PAGINES_AMB_XAT } from '../../data/contracte.js';
import { IAIA_ID } from '../../data/identitatsSeed.js';
import { AJUDA_PER_CLAU, esXatDeLaIAIA, vestixLaIAIA } from '../../data/xatsPerDefecte.js';
import { RUTA_XAT_DE_LA_IAIA, rutaDelXatDeLaIAIA } from './useObriXatPerDefecte.js';

const consultaDe = (ruta) => new URL(ruta, 'http://localhost');

describe('rutaDelXatDeLaIAIA', () => {
  test('en llavor i en local, el directe amb la IAIA: /xat?amb=<el seu id>', () => {
    for (const mode of ['seed', 'local']) {
      const url = consultaDe(rutaDelXatDeLaIAIA(mode));
      expect([mode, url.pathname, [...url.searchParams.keys()], url.searchParams.get('amb')]).toEqual([mode, '/xat', ['amb'], IAIA_ID]);
      /* El mateix enllaç de «Parla amb la IAIA» del seu perfil i de «Escriu-li» del Cercador. */
      expect([mode, rutaDelXatDeLaIAIA(mode)]).toEqual([mode, rutaXatPrivat({ id: IAIA_ID })]);
      expect([mode, rutaDelXatDeLaIAIA(mode)]).toEqual([mode, rutaXatDePagina({ tipus: 'ia', id: IAIA_ID })]);
    }
  });

  test('en remot, el xat públic de la seua pàgina: la via de la fila d’ajuda per defecte', () => {
    expect(rutaDelXatDeLaIAIA('remote')).toBe(RUTA_XAT_DE_LA_IAIA);
    const url = consultaDe(RUTA_XAT_DE_LA_IAIA);
    expect([url.pathname, url.searchParams.get('sobre'), url.searchParams.get('titol'), url.searchParams.get('ruta')])
      .toEqual(['/xat', 'pagina:/iaia', PAGINES_AMB_XAT['/iaia'], '/iaia']);
    expect(url.searchParams.get('amb')).toBeNull();
    /* El fil que eixa ruta obri es diu «IAIA MarIA» a la llista: la mateixa fila. */
    const filDePagina = { id: 'f-pagina', tipus: 'grup', titol: PAGINES_AMB_XAT['/iaia'], subjecte: { tipus: 'pagina', id: '/iaia' } };
    expect(esXatDeLaIAIA(filDePagina)).toBe(true);
    expect(vestixLaIAIA(filDePagina)).toMatchObject({ id: 'f-pagina', titol: AJUDA_PER_CLAU.iaia.nom });
    expect(AJUDA_PER_CLAU.iaia.nom).toBe('IAIA MarIA');
  });

  test('un mode desconegut va per la via del remot, i totes dues rutes són de l’app', () => {
    for (const mode of [undefined, null, '', 'altre']) {
      expect([String(mode), rutaDelXatDeLaIAIA(mode)]).toEqual([String(mode), RUTA_XAT_DE_LA_IAIA]);
    }
    for (const mode of ['seed', 'local', 'remote']) {
      expect([mode, esRutaDeLaPorta(rutaDelXatDeLaIAIA(mode))]).toEqual([mode, true]);
    }
  });
});
