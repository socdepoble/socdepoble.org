// @vitest-environment node
/* Privacitat dels sentinelles en execució: amb la xarxa i l'emmagatzematge
   del navegador convertits en trampes, cada sentinella prepara i observa una
   entrada representativa sense tocar-ne cap. A més, observar és pur: no muta
   l'entrada (congelada) i dues observacions iguals donen el mateix. La
   frontera estàtica (cap API de xarxa ni d'emmagatzematge al codi, imports
   només dels carrils) la vigila gestoria/privacitat.test.js, que llig tot
   src/sections/tractors/. */
import { afterAll, beforeAll, describe, expect, test, vi } from 'vitest';
import { SENTINELLES } from '../registreSentinelles.js';

const ARA = Date.UTC(2026, 9, 2, 16);
const trampa = vi.fn(() => {
  throw new Error('Un sentinella ha intentat eixir d’este ordinador.');
});
const magatzemTrampa = { getItem: trampa, setItem: trampa, removeItem: trampa, clear: trampa, key: trampa };

/* Els noms es componen a trossos perquè les portes que llegixen src/ no els prenguen per usos. */
const nom = (...trossos) => trossos.join('');
beforeAll(() => {
  for (const api of [nom('fet', 'ch'), nom('XMLHttp', 'Request'), nom('WebSo', 'cket'), nom('EventSo', 'urce')]) vi.stubGlobal(api, trampa);
  vi.stubGlobal(nom('local', 'Storage'), magatzemTrampa);
  vi.stubGlobal(nom('session', 'Storage'), magatzemTrampa);
  vi.stubGlobal(nom('indexed', 'DB'), { open: trampa, deleteDatabase: trampa });
});
afterAll(() => vi.unstubAllGlobals());

const json = (valor) => ({ nom: 'entrada.json', bytes: new TextEncoder().encode(JSON.stringify(valor)) });
const tancament = {
  schema: 'sdp.bar.tancament.v1', tornId: 't1', obertA: '2026-10-02T06:00:00Z', tancatA: '2026-10-02T15:00:00Z', diferenciaCaixaCents: 0,
  resum: {
    vendesPerMetode: { efectiu: 1000, targeta: 0, altre: 0 }, tiquets: 1, tiquetMitjaCents: 1000, devolucionsCents: 0,
    anullacions: { nombre: 0, importCents: 0 }, descomptesCents: 0, convidadesCents: 0, perCategoria: [],
    perProducte: [{ producteId: 'cafe', nom: 'Café', unitats: 1, importCents: 1000, costCents: 200 }]
  }
};
const traspas = {
  schema: 'sdp.bar.traspas.v1', tornId: 't1', tancatA: '2026-10-02T15:00:00Z', de: 'Persona de Prova', fonsDeixatCents: 0,
  comandesObertes: [], incidencies: [], reposicio: [], avisos: [], llegidaPer: null, llegidaA: null
};
const PNG = new Uint8Array([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0, 0, 0, 13, 0x49, 0x48, 0x44, 0x52, 0, 0, 4, 0x38, 0, 0, 4, 0x38]);

/* Els fitxers que triaria la persona, per sentinella. */
const FITXERS = {
  'sentinella.estructural': [json({ sessio: { user: { id: '11111111-2222-4333-8444-555555555555' } }, perfil: null, pertinences: [] })],
  'sentinella.triturador-financer': [{ nom: 'banc.csv', text: 'Fecha,F. valor,Concepto,Importe,Saldo\n2099-01-02,2099-01-02,PROVA,-1.00,0.00\n' }],
  'sentinella.policia-disseny': [{ nom: 'a.css', text: '.sdp-a { margin: 0; }' }],
  'sentinella.consol-vendes': [json(tancament)],
  'sentinella.enllac-torn': [json(traspas)],
  'sentinella.auditoria-aparador': [{ nom: 'a.png', bytes: PNG }],
  'sentinella.detectiu-poble': [{ nom: 'bustia.txt', text: 'El fanal no va.\n\nEl fanal continua igual.' }]
};

function congelaFons(valor) {
  if (valor === null || typeof valor !== 'object' || ArrayBuffer.isView(valor)) return valor;
  Object.values(valor).forEach(congelaFons);
  return Object.freeze(valor);
}

describe('cap sentinella ix d’este ordinador', () => {
  test('hi ha una entrada per a cada sentinella registrat', () => {
    expect(Object.keys(FITXERS).sort()).toEqual(SENTINELLES.map((s) => s.id).sort());
  });

  test.each(SENTINELLES.map((s) => [s.id, s]))('%s: prepara i observa sense xarxa ni emmagatzematge, i és pur', (id, s) => {
    const entrada = congelaFons(s.entrada.prepara(FITXERS[id]));
    const primera = s.observa(entrada, { ara: ARA });
    const segona = s.observa(entrada, { ara: ARA });
    expect(trampa).not.toHaveBeenCalled();
    expect(primera).toEqual(segona);
    expect(primera.avisos.length + (primera.informe ? 1 : 0)).toBeGreaterThan(0);
  });
});
