// @vitest-environment node
import { expect, test } from 'vitest';
import { creaZip, llegeixZip } from './zip.js';
import { zipAmbDeflate } from './__fixtures__/zipAmbDeflate.js';

const vista = b => new DataView(b.buffer, b.byteOffset, b.byteLength);
function mostra() {
  const b = creaZip([{ nom: 'safe.txt', dades: 'Dades' }]);
  const v = vista(b), final = b.length - 22, central = v.getUint32(final + 16, true);
  return { b, v, final, central };
}

test('el nom local no pot ocultar un traversal sota un nom central innocu', () => {
  const { b } = mostra();
  b.set(new TextEncoder().encode('../a.txt'), 30);
  expect(() => llegeixZip(b)).toThrow(/Capçalera local/);
});

test('mètode i flags de la capçalera local han de casar amb el directori central', () => {
  for (const [offset, valor] of [[8, 8], [6, 1], [6, 0x0800]]) {
    const { b, v } = mostra(); v.setUint16(offset, valor, true);
    expect(() => llegeixZip(b)).toThrow(/Capçalera local/);
  }
});

test('sense descriptor de dades, el CRC i les mides locals també han de casar', () => {
  for (const offset of [14, 18, 22]) {
    const { b, v } = mostra(); v.setUint32(offset, 1, true);
    expect(() => llegeixZip(b)).toThrow(/Capçalera local/);
  }
});

test('la mida del directori central delimita totes les entrades, extres i comentaris', () => {
  for (const muta of [
    ({ v, final }) => v.setUint32(final + 12, 0, true),
    ({ v, final }) => v.setUint32(final + 12, 1, true),
    ({ v, final }) => v.setUint32(final + 12, 0xfffffffe, true),
    ({ v, central }) => v.setUint16(central + 30, 0xffff, true),
    ({ v, central }) => v.setUint16(central + 32, 0xffff, true),
    ({ v, final }) => { v.setUint16(final + 8, 0, true); v.setUint16(final + 10, 0, true); }
  ]) {
    const m = mostra(); muta(m);
    expect(() => llegeixZip(m.b)).toThrow(/Directori central/);
  }
});

function ambDescriptor(ambSignatura) {
  const original = zipAmbDeflate([{ nom: 'safe.txt', dades: 'Dades'.repeat(40) }]);
  const v = vista(original), final = original.length - 22, central = v.getUint32(final + 16, true);
  const mida = ambSignatura ? 16 : 12, b = new Uint8Array(original.length + mida);
  b.set(original.subarray(0, central)); b.set(original.subarray(central), central + mida);
  const w = vista(b), nouCentral = central + mida, nouFinal = final + mida;
  w.setUint16(6, 8, true); w.setUint16(nouCentral + 8, 8, true);
  w.setUint32(14, 0, true); w.setUint32(18, 0, true); w.setUint32(22, 0, true);
  let descriptor = central;
  if (ambSignatura) { w.setUint32(descriptor, 0x08074b50, true); descriptor += 4; }
  for (const [d, c] of [[0, 16], [4, 20], [8, 24]]) w.setUint32(descriptor + d, v.getUint32(central + c, true), true);
  w.setUint32(nouFinal + 16, nouCentral, true);
  return { b, descriptor, central: nouCentral };
}

test('els descriptors de dades vàlids, amb signatura o sense, continuen llegint-se', () => {
  for (const signatura of [false, true]) {
    const { b } = ambDescriptor(signatura);
    expect(new TextDecoder().decode(llegeixZip(b)[0].dades)).toBe('Dades'.repeat(40));
  }
});

test('el bit descriptor no permet ometre o falsejar CRC i mides després de les dades', () => {
  const sense = mostra(); sense.v.setUint16(6, 8, true); sense.v.setUint16(sense.central + 8, 8, true);
  expect(() => llegeixZip(sense.b)).toThrow(/descriptor/i);
  for (const signatura of [false, true]) for (const camp of [0, 4, 8]) {
    const { b, descriptor } = ambDescriptor(signatura); vista(b).setUint32(descriptor + camp, 1, true);
    expect(() => llegeixZip(b)).toThrow(/descriptor/i);
  }
});

test('els límits centrals també es comproven quan nomes descarta totes les entrades', () => {
  const m = mostra(); m.v.setUint16(m.central + 32, 0xffff, true);
  expect(() => llegeixZip(m.b, { nomes: () => false })).toThrow(/Directori central/);
});

/* Una sola capçalera local DEFLATE amb blocs STORE buits (mida 0, CRC 0) i
   N entrades centrals amb el mateix nom i el desplaçament 0: el control de
   coherència local/central les accepta totes i maxEixida no en gasta res.
   Sense el pressupost de bytes comprimits, el mateix flux s'inflava N
   vegades (2 MB × 300 ≈ 4,5 s de fil principal bloquejat). */
function solapades(blocs, entrades, nom = '_rels/.rels') {
  const flux = new Uint8Array(blocs * 5 + 5);
  for (let i = 0; i < blocs; i += 1) flux.set([0x00, 0x00, 0x00, 0xff, 0xff], i * 5);
  flux.set([0x01, 0x00, 0x00, 0xff, 0xff], blocs * 5);
  const n = new TextEncoder().encode(nom);
  const local = 30 + n.length + flux.length;
  const central = (46 + n.length) * entrades;
  const b = new Uint8Array(local + central + 22), v = vista(b);
  v.setUint32(0, 0x04034b50, true); v.setUint16(4, 20, true); v.setUint16(8, 8, true);
  v.setUint32(18, flux.length, true); v.setUint16(26, n.length, true); b.set(n, 30); b.set(flux, 30 + n.length);
  let p = local;
  for (let i = 0; i < entrades; i += 1) {
    v.setUint32(p, 0x02014b50, true); v.setUint16(p + 4, 20, true); v.setUint16(p + 6, 20, true); v.setUint16(p + 10, 8, true);
    v.setUint32(p + 20, flux.length, true); v.setUint16(p + 28, n.length, true); v.setUint32(p + 42, 0, true);
    b.set(n, p + 46); p += 46 + n.length;
  }
  v.setUint32(p, 0x06054b50, true); v.setUint16(p + 8, entrades, true); v.setUint16(p + 10, entrades, true);
  v.setUint32(p + 12, central, true); v.setUint32(p + 16, local, true);
  return b;
}

/* El pressupost és la mida del fitxer: la suma dels bytes comprimits que es
   lligen no pot passar-la. Amb un flux de 5 KB (1.000 blocs), dues còpies ja
   no hi caben, i la feina total queda sempre lineal en la mida del ZIP. */
test('cap byte comprimit no es llig dues vegades: les entrades solapades no amplifiquen la feina', () => {
  const una = llegeixZip(solapades(1000, 1));
  expect(una.map(({ nom, dades }) => [nom, dades.length])).toEqual([['_rels/.rels', 0]]);
  for (const entrades of [2, 300]) {
    expect(() => llegeixZip(solapades(1000, entrades))).toThrow(TypeError);
    expect(() => llegeixZip(solapades(1000, entrades))).toThrow(/solapades/);
  }
  // Les entrades que «nomes» descarta no gasten el pressupost.
  expect(() => llegeixZip(solapades(1000, 300), { nomes: () => false })).not.toThrow();
});
