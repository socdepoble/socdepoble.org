/* Gauntlet 261016_1530 (prompt, Bloc 3.6; relleu F21, F57-F61 i F63) · La
   regla pura dels quatre actors del Xat (actorsDelXat.js): l'ordre estricte
   (la comunitat de Sóc de Poble, Javi Llinares, Gent de la Torre i la IAIA),
   la fila que porta a la comunitat quan encara no hi és, i la ruta canònica de
   cada capçalera. Tot per identificador, mai pel nom. */
import { afterEach, describe, expect, test } from 'vitest';
import {
  CLAU_FILA_DE_SOC_DE_POBLE, COMUNITAT_DE_SOC_DE_POBLE, RUTA_DE_JAVI, RUTA_DE_LA_IAIA, RUTA_DE_SOC_DE_POBLE, RUTA_SOBRE_DE_SOC_DE_POBLE,
  anteposaActors, esComunitatDeSocDePoble, potPortarLaComunitat, rutaCanonicaDelXat
} from './actorsDelXat.js';
import { mapejaFil } from './missatges.js';
import { AJUDA_PER_CLAU, ambXatsPerDefecte, filDeMostraDeJavi } from '../../data/xatsPerDefecte.js';
import { ENTITAT_PILOT_ID, IAIA_ID } from '../../data/identitatsSeed.js';
import { oblidaEntitatDelProjecte, registraEntitatDelProjecte } from '../../config/navigation.js';

const UUID_SDP = '7d1e5c2a-0000-4000-8000-0000000000aa';
const UUID_ALTRA = '7d1e5c2a-0000-4000-8000-0000000000bb';

/* Les files com les munta XatSection: { clau, tipus: 'fil' | 'comunitat' | 'poble', … }. */
const deFil = (fil) => ({ clau: String(fil.id), tipus: 'fil', fil });
const deComunitat = (fil) => ({ clau: `comunitat:${fil.id}`, tipus: 'comunitat', comunitat: { fil, fills: [] } });
const delPoble = { clau: 'poble:la-torre-de-les-macanes', tipus: 'poble', poble: { id: 'la-torre-de-les-macanes', nom: 'Gent de la Torre' }, delPoble: true };
const comunitatSdp = (id = ENTITAT_PILOT_ID) => mapejaFil({ id: 'c-sdp', tipus: 'comunitat', titol: 'Sóc de Poble', subjecte: { tipus: 'entitat', id, ruta: `/empresa/${id}`, titol: 'Sóc de Poble' } });
const [javi, iaia] = ambXatsPerDefecte([]).map((f) => deFil(mapejaFil(f)));
const pepa = deFil(mapejaFil({ id: 'f-pepa', tipus: 'directe', titol: 'Pepa', fixatAl: '2026-10-16T09:00:00Z', altres: [{ id: 'pepa', tipus: 'persona' }] }));
const claus = (files) => files.map((fila) => fila.clau);

afterEach(() => { oblidaEntitatDelProjecte(); });

describe('anteposaActors · l’ordre estricte del Mestre', () => {
  test('els quatre dalt de tot, en este ordre, també per damunt d’una fixada; la resta, darrere i en el seu ordre', () => {
    const sdp = deComunitat(comunitatSdp());
    const altra = deFil(mapejaFil({ id: 'f-colla', tipus: 'grup', titol: 'Colla' }));
    const files = [delPoble, pepa, iaia, altra, sdp, javi];
    expect(claus(anteposaActors(files))).toEqual(['comunitat:c-sdp', 'sdp-per-defecte:javi', 'poble:la-torre-de-les-macanes', 'sdp-per-defecte:iaia', 'f-pepa', 'f-colla']);
  });

  test('ja en ordre, o sense cap actor, torna la MATEIXA referència; un actor que falta no ocupa cap lloc', () => {
    const enOrdre = [deComunitat(comunitatSdp()), javi, delPoble, iaia, pepa];
    expect(anteposaActors(enOrdre)).toBe(enOrdre);
    const sense = [pepa];
    expect(anteposaActors(sense)).toBe(sense);
    expect(claus(anteposaActors([pepa, iaia, delPoble]))).toEqual(['poble:la-torre-de-les-macanes', 'sdp-per-defecte:iaia', 'f-pepa']);
    expect(anteposaActors(null)).toBeNull();
  });

  test('amb `comunitat`, la de Sóc de Poble que falta és una fila que hi porta; si ja hi és, cap segona', () => {
    const ambFila = anteposaActors([delPoble, javi, iaia], { comunitat: true });
    expect(ambFila[0]).toEqual({ clau: CLAU_FILA_DE_SOC_DE_POBLE, tipus: 'entitat', entitat: COMUNITAT_DE_SOC_DE_POBLE });
    expect(COMUNITAT_DE_SOC_DE_POBLE).toEqual({ id: 'socdepoble', nom: 'Sóc de Poble', avatar: AJUDA_PER_CLAU.socdepoble.avatar, ruta: '/socdepoble' });
    const ambLaDeVeres = anteposaActors([delPoble, deComunitat(comunitatSdp()), javi, iaia], { comunitat: true });
    expect(claus(ambLaDeVeres)).toEqual(['comunitat:c-sdp', 'sdp-per-defecte:javi', 'poble:la-torre-de-les-macanes', 'sdp-per-defecte:iaia']);
  });

  test('Javi pel seu xat de mostra o per un directe real (per id); un homònim no és Javi', () => {
    const mostra = deFil(filDeMostraDeJavi());
    expect(claus(anteposaActors([pepa, mostra]))).toEqual(['fake-javi', 'f-pepa']);
    const real = deFil(mapejaFil({ id: 'd-javi', tipus: 'directe', titol: 'Javi Llinares', altres: [{ id: '0001', tipus: 'persona' }] }));
    expect(claus(anteposaActors([pepa, real]))).toEqual(['d-javi', 'f-pepa']);
    const homonim = deFil(mapejaFil({ id: 'd-h', tipus: 'directe', titol: 'Javi Llinares', altres: [{ id: UUID_ALTRA, tipus: 'persona', nom: 'Javi Llinares' }] }));
    expect(anteposaActors([pepa, homonim])).toEqual([pepa, homonim]);
  });

  test('la IAIA: primer el xat on contesta (fila, mostra, fil o directe); el xat públic de /iaia només si no n’hi ha cap', () => {
    const pagina = deFil(mapejaFil({ id: 'p-iaia', tipus: 'grup', titol: 'IAIA MarIA', subjecte: { tipus: 'pagina', id: '/iaia', ruta: '/iaia' }, ultimAl: '2026-10-16T10:00:00Z' }));
    expect(claus(anteposaActors([pepa, pagina, iaia]))).toEqual(['sdp-per-defecte:iaia', 'f-pepa', 'p-iaia']);
    expect(claus(anteposaActors([pepa, pagina]))).toEqual(['p-iaia', 'f-pepa']);
    const directe = deFil(mapejaFil({ id: 'd-iaia', tipus: 'directe', altres: [{ id: IAIA_ID, tipus: 'ia' }] }));
    expect(claus(anteposaActors([pepa, pagina, directe]))).toEqual(['d-iaia', 'f-pepa', 'p-iaia']);
    expect(claus(anteposaActors([pepa, deFil({ id: 'fake-iaia', tipus: 'ia', name: 'IAIA MarIA' })]))).toEqual(['fake-iaia', 'f-pepa']);
    /* Un grup on la IAIA és una més no és el seu xat. */
    const grup = deFil(mapejaFil({ id: 'g', tipus: 'grup', altres: [{ id: IAIA_ID, tipus: 'ia' }, { id: 'pepa', tipus: 'persona' }] }));
    expect(anteposaActors([pepa, grup])).toEqual([pepa, grup]);
  });
});

describe('la comunitat de Sóc de Poble, per identificador', () => {
  test('per l’id de la llavor, i en remot per l’id que ha registrat el backend; mai pel nom', () => {
    expect(esComunitatDeSocDePoble({ fil: comunitatSdp() })).toBe(true);
    expect(esComunitatDeSocDePoble({ fil: comunitatSdp(UUID_SDP) })).toBe(false);
    registraEntitatDelProjecte({ tipus: 'entitat', id: UUID_SDP, slug: 'socdepoble' });
    expect(esComunitatDeSocDePoble({ fil: comunitatSdp(UUID_SDP) })).toBe(true);
    /* Una altra entitat que es diu igual, o el poble: no. */
    expect(esComunitatDeSocDePoble({ fil: comunitatSdp(UUID_ALTRA) })).toBe(false);
    expect(esComunitatDeSocDePoble({ fil: { subjecte: { tipus: 'poble', id: ENTITAT_PILOT_ID } } })).toBe(false);
    expect(esComunitatDeSocDePoble(null)).toBe(false);
  });

  test('potPortarLaComunitat: en llavor i en local, sempre; en remot, quan el backend ja ha donat l’id de l’entitat', () => {
    expect([potPortarLaComunitat('seed'), potPortarLaComunitat('local'), potPortarLaComunitat('remote')]).toEqual([true, true, false]);
    registraEntitatDelProjecte({ tipus: 'entitat', id: UUID_SDP, slug: 'socdepoble' });
    expect(potPortarLaComunitat('remote')).toBe(true);
  });

  test('la fila hi porta pel camí del «Comentar» de la pàgina de l’entitat', () => {
    expect(RUTA_SOBRE_DE_SOC_DE_POBLE).toBe('/xat?sobre=entitat:socdepoble&titol=S%C3%B3c%20de%20Poble&ruta=%2Fsocdepoble');
  });
});

describe('rutaCanonicaDelXat · on porta la capçalera', () => {
  test('les tres rutes canòniques; la resta, null (CapcaleraConversa fa com sempre)', () => {
    expect([RUTA_DE_JAVI, RUTA_DE_SOC_DE_POBLE, RUTA_DE_LA_IAIA]).toEqual(['/javillinares', '/socdepoble', '/iaia']);
    expect(rutaCanonicaDelXat(filDeMostraDeJavi())).toBe('/javillinares');
    expect(rutaCanonicaDelXat({ id: 'd', tipus: 'directe', altres: [{ id: ENTITAT_PILOT_ID, tipus: 'entitat' }] })).toBe('/socdepoble');
    expect(rutaCanonicaDelXat({ id: 'i', tipus: 'iaia', altres: [] })).toBe('/iaia');
    expect(rutaCanonicaDelXat({ id: 'g', tipus: 'grup', subjecte: { tipus: 'pagina', id: '/iaia', ruta: '/iaia' } })).toBeNull();
    expect(rutaCanonicaDelXat({ id: 'd', tipus: 'directe', altres: [{ id: 'socdepoble', tipus: 'persona' }] })).toBeNull();
    expect(rutaCanonicaDelXat(null)).toBeNull();
  });
});
