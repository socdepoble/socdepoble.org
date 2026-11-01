// @vitest-environment node
/* Shamir k = 3 de la recuperació social (IDEA-48; P1-12, F7 del disseny): vectors de fora
   i proves de propietat (B2c, marató 261101_2143). No toca xifratXatRecuperacio.js.
   Es mira:
     · la segona implementació (mateix autor, NO independent d'autoria) en els dos sentits;
     · Privy shamir-secret-sharing 0.0.4 (autoria independent; candidat de §9.4, la porta
       de shamir_independents continua pendent) en els dos sentits: el split de Privy es
       recompon amb el mòdul, i el reparteixRk viu dona byte a byte els fragments de Privy;
     · dos fragments no diuen res de la RK: per a cada secret, (a₁, a₂) → (y₁, y₂) és una
       bijecció de GF(2⁸)² (prova exacta, no estadística);
     · linealitat, ordre indiferent de la terna, una sola crida de 64 B al cripto i
       uniformitat (χ²) dels coeficients i dels fragments.
   Els vectors i la procedència de cadascun són a xifratXatRecuperacio.vectors.json; els
   generadors, fora del repositori (camins i SHA-256 al JSON). Dades sintètiques. */
import { describe, expect, test } from 'vitest';
import * as R from './xifratXatRecuperacio.js';
import VECTORS from './xifratXatRecuperacio.vectors.json';

const cripto = globalThis.crypto;
const deHex = (hex) => Uint8Array.from(hex.match(/../g) ?? [], (parell) => Number.parseInt(parell, 16));
const aHex = (bytes) => Array.from(bytes, (byte) => byte.toString(16).padStart(2, '0')).join('');
const aleatoris = (n) => cripto.getRandomValues(new Uint8Array(n));
/* Un cripto amb el subtle de l'entorn i un generador que lliura exactament a₁ ‖ a₂: una sola crida de 64 B. */
function criptoFix(a1, a2) {
  const coeficients = Uint8Array.from([...a1, ...a2]);
  let crides = 0;
  return {
    subtle: cripto.subtle,
    getRandomValues(bytes) {
      crides += 1;
      if (crides > 1 || bytes.length !== coeficients.length) throw new Error(`petició inesperada al cripto: ${bytes.length} B, crida ${crides}`);
      bytes.set(coeficients);
      return bytes;
    }
  };
}
/* Privy porta y ‖ x (x a l'últim byte); el mòdul, x ‖ y. */
const deYx = (hex) => {
  const bytes = deHex(hex);
  return Uint8Array.of(bytes.at(-1), ...bytes.subarray(0, -1));
};
/* Les ternes d'índexs: totes si n ≤ 12; si no, totes les consecutives i (0, n/2, n − 1). */
function ternes(n) {
  const eixida = [];
  if (n <= 12) {
    for (let i = 0; i < n; i += 1) for (let j = i + 1; j < n; j += 1) for (let k = j + 1; k < n; k += 1) eixida.push([i, j, k]);
    return eixida;
  }
  for (let i = 0; i + 2 < n; i += 1) eixida.push([i, i + 1, i + 2]);
  eixida.push([0, n >> 1, n - 1]);
  return eixida;
}
/* El primer índex on dos fragments no casen, o −1. */
const primeraDiferencia = (llista, esperat) => llista.findIndex((fragment, i) => aHex(fragment) !== esperat[i]);
/* χ² d'un histograma de 256 caselles contra la uniforme. */
function chiQuadrat(mostres) {
  const caselles = new Float64Array(256);
  for (const byte of mostres) caselles[byte] += 1;
  const esperat = mostres.length / 256;
  return caselles.reduce((suma, observat) => suma + (observat - esperat) ** 2 / esperat, 0);
}
/* Quantils de χ² amb 255 graus de llibertat per a p = 10⁻⁶ a cada cua (gamma incompleta regularitzada). */
const CHI_INFERIOR = 161.65;
const CHI_SUPERIOR = 377.08;

describe('segona implementació (mateix autor que el mòdul: NO independent d’autoria)', () => {
  const S = VECTORS.shamir_segona_implementacio;

  test('la procedència ho diu en lletres, cita l’eina i la sortida amb el SHA-256 i lliga el cos a la caixa S', () => {
    expect(S.independencia).toMatch(/^NO independent d’autoria/);
    expect(S.independencia).toMatch(/gf_fips197\.V-INV\.caixaS/);
    expect(S.procedencia.eina).toMatch(/evidencia\/B2-E2EE\/segona_impl_shamir\.py$/);
    expect(S.procedencia.eina_sha256).toMatch(/^[0-9a-f]{64}$/);
    expect(S.procedencia.sortida_sha256).toMatch(/^[0-9a-f]{64}$/);
    expect(S.casos.map((cas) => cas.n)).toEqual([3, 4, 5, 8, 3, 5, 8, 12]);
    for (const cas of S.casos) {
      expect(cas.fragments).toHaveLength(cas.n);
      expect(new Set(cas.fragments.map((f) => f.slice(0, 2))).size).toBe(cas.n);
    }
  });

  test('seu → viu: recomponRk dona el secret amb totes les ternes de cada cas; la consistència accepta i delata un byte canviat', () => {
    let ternesProvades = 0;
    for (const cas of S.casos) {
      const fragments = cas.fragments.map(deHex);
      for (const [i, j, k] of ternes(cas.n)) {
        expect(aHex(R.recomponRk([fragments[i], fragments[j], fragments[k]])), `${cas.llavor} ${i},${j},${k}`).toBe(cas.secret);
        ternesProvades += 1;
      }
      expect(R.comprovaConsistencia(fragments), cas.llavor).toBe(true);
      if (cas.n > 3) {
        const corromput = fragments.map((f) => Uint8Array.from(f));
        corromput[cas.n - 1][7] ^= 0x01;
        expect(R.comprovaConsistencia(corromput), `${cas.llavor} corromput`).toBe(false);
      }
    }
    expect(ternesProvades).toBe(1 + 4 + 10 + 56 + 1 + 10 + 56 + 220);
  });

  test('viu → seu: el reparteixRk viu amb els seus a₁ ‖ a₂ dona byte a byte cada fragment, també en les x aleatòries', () => {
    for (const cas of S.casos) {
      const fix = () => criptoFix(deHex(cas.a1), deHex(cas.a2));
      const tots = R.reparteixRk(fix(), deHex(cas.secret), 255);
      for (const fragment of cas.fragments) expect(aHex(tots[deHex(fragment)[0] - 1]), `${cas.llavor} x = ${fragment.slice(0, 2)}`).toBe(fragment);
      // Amb x = 1..n (els quatre primers casos), el repartiment de n fragments és el mateix, en el mateix ordre.
      if (cas.fragments.every((f, i) => deHex(f)[0] === i + 1)) {
        expect(primeraDiferencia(R.reparteixRk(fix(), deHex(cas.secret), cas.n), cas.fragments), cas.llavor).toBe(-1);
      }
    }
  });
});

describe('Privy shamir-secret-sharing 0.0.4 (autoria independent; candidat de §9.4)', () => {
  const P = VECTORS.shamir_privy;

  test('procedència fixada (paquet, versió, llicència, commit, SHA-256 de la font i generador) i la porta de §9.4 continua pendent', () => {
    expect(P.estat).toBe('candidat');
    expect(P.procedencia).toMatchObject({
      paquet: 'shamir-secret-sharing',
      versio: '0.0.4',
      llicencia: 'Apache-2.0',
      repositori: 'https://github.com/privy-io/shamir-secret-sharing',
      commit: '73bbf04da63532a57a29353715183c6051d23c2c',
      fitxer: 'src/index.ts',
      sha256_font: 'f5096daf3155502c27d0b7a703fa61e0bf26fda348f2a2f216872bf49498e050'
    });
    expect(P.procedencia.generador).toMatch(/evidencia\/B2c-SHAMIR\/genera_privy\.mjs$/);
    expect(P.procedencia.generador_sha256).toMatch(/^[0-9a-f]{64}$/);
    expect(P.procedencia.sortida_sha256).toMatch(/^[0-9a-f]{64}$/);
    // Candidat, no tancament: la porta de §9.4 la ratifica el Mestre (D-B2-1).
    expect(VECTORS.shamir_independents.estat).toBe('pendent');
    expect(VECTORS.shamir_independents.candidat).toBe('shamir_privy');
    expect(P.casos.map((cas) => cas.n)).toEqual([3, 4, 5, 8, 40, 255]);
    for (const cas of P.casos) {
      expect(cas.fragments_privy).toHaveLength(cas.n);
      const xs = cas.fragments_privy.map((f) => deYx(f)[0]);
      expect(new Set(xs).size).toBe(cas.n);
      expect(xs).not.toContain(0);
    }
    // Els comptadors de fora es van calcular cridant el mòdul que es prova: registre, no vector; cap prova en depén.
    expect(P.registre_execucio_fora).toMatch(/^Registre d’execució de genera_privy\.mjs.*NO és cap vector/);
    // Privy tria x aleatoris: amb n = 255 són una permutació d'1..255 que no és la identitat.
    const xs255 = P.casos.at(-1).fragments_privy.map((f) => deYx(f)[0]);
    expect([...xs255].sort((a, b) => a - b)).toEqual(Array.from({ length: 255 }, (_, i) => i + 1));
    expect(xs255.every((x, i) => x === i + 1)).toBe(false);
  });

  test('Privy → viu: recomponRk dona el secret amb les ternes de cada cas (x aleatoris de Privy, fins a n = 255)', () => {
    let ternesProvades = 0;
    for (const cas of P.casos) {
      const fragments = cas.fragments_privy.map(deYx);
      for (const [i, j, k] of ternes(cas.n)) {
        expect(aHex(R.recomponRk([fragments[i], fragments[j], fragments[k]])), `${cas.llavor} ${i},${j},${k}`).toBe(cas.secret);
        ternesProvades += 1;
      }
    }
    expect(ternesProvades).toBe(1 + 4 + 10 + 56 + 39 + 254);
  });

  test('viu = Privy byte a byte: el reparteixRk viu amb els a₁ ‖ a₂ de Privy dona el fragment de Privy en cada una de les seues x', () => {
    for (const cas of P.casos) {
      const tots = R.reparteixRk(criptoFix(deHex(cas.a1), deHex(cas.a2)), deHex(cas.secret), 255);
      for (const fragmentPrivy of cas.fragments_privy) {
        const esperat = deYx(fragmentPrivy);
        expect(aHex(tots[esperat[0] - 1]), `${cas.llavor} x = ${esperat[0]}`).toBe(aHex(esperat));
      }
    }
  });

  test('la consistència accepta els n fragments de Privy i delata un byte canviat en cada un d’ells (els 312 de n = 4, 5, 8, 40 i 255, un per un)', () => {
    let corromputs = 0;
    for (const cas of P.casos.filter(({ n }) => n > 3)) {
      const fragments = cas.fragments_privy.map(deYx);
      expect(R.comprovaConsistencia(fragments), cas.llavor).toBe(true);
      for (let k = 0; k < cas.n; k += 1) {
        const corromput = fragments.map((f) => Uint8Array.from(f));
        corromput[k][1 + ((k * 11) % 32)] ^= 0x80;
        expect(R.comprovaConsistencia(corromput), `${cas.llavor} fragment ${k}`).toBe(false);
        corromputs += 1;
      }
    }
    expect(corromputs).toBe(4 + 5 + 8 + 40 + 255);
  });
});

describe('dos fragments no diuen res de la RK (prova exacta, no estadística)', () => {
  test('reparteixRk viu, n = 3: per a cada secret, (a₁, a₂) → (y_i, y_j) és una bijecció de GF(2⁸)² en els tres parells de x', () => {
    const parells = [[0, 1], [0, 2], [1, 2]];
    for (const s of [0x00, 0x83, 0xff, 0x5a]) {
      const vistos = parells.map(() => new Uint8Array(65536));
      const rk = new Uint8Array(R.BYTES_RK).fill(s);
      let repetits = 0;
      // 32 parells (a₁, a₂) per crida, un per byte: a₁ = bloc >> 3 i a₂ = (bloc & 7)·32 + b recorren GF(2⁸)² una sola vegada.
      for (let bloc = 0; bloc < 2048; bloc += 1) {
        const a1 = new Uint8Array(R.BYTES_RK).fill(bloc >> 3);
        const a2 = Uint8Array.from({ length: R.BYTES_RK }, (_, b) => ((bloc & 7) << 5) | b);
        const fragments = R.reparteixRk(criptoFix(a1, a2), rk, 3);
        for (let b = 1; b <= R.BYTES_RK; b += 1) {
          parells.forEach(([i, j], p) => {
            const clau = (fragments[i][b] << 8) | fragments[j][b];
            if (vistos[p][clau]) repetits += 1;
            vistos[p][clau] = 1;
          });
        }
      }
      expect(repetits, `s = ${s}`).toBe(0);
      // 65.536 eixides distintes de 65.536 entrades: la imatge és tot GF(2⁸)², siga quin siga el secret.
      vistos.forEach((vist, p) => expect(vist.every((u) => u === 1), `s = ${s}, parell ${p}`).toBe(true));
    }
  });

  test('reparteixRk viu, n = 255: (a₁, a₂) → (y_i, y_j) també és una bijecció de GF(2⁸)² en parells llunyans de x: (7, 200), (0x53, 0xca) i (254, 255)', () => {
    const parells = [[7, 200], [0x53, 0xca], [254, 255]];
    const vistos = parells.map(() => new Uint8Array(65536));
    const rk = new Uint8Array(R.BYTES_RK).fill(0x6e);
    let repetits = 0;
    // El mateix recorregut de GF(2⁸)² que la prova de n = 3; cada crida lliura els 255 fragments i servix per als tres parells.
    for (let bloc = 0; bloc < 2048; bloc += 1) {
      const a1 = new Uint8Array(R.BYTES_RK).fill(bloc >> 3);
      const a2 = Uint8Array.from({ length: R.BYTES_RK }, (_, b) => ((bloc & 7) << 5) | b);
      const fragments = R.reparteixRk(criptoFix(a1, a2), rk, 255);
      for (let b = 1; b <= R.BYTES_RK; b += 1) {
        parells.forEach(([x1, x2], p) => {
          const clau = (fragments[x1 - 1][b] << 8) | fragments[x2 - 1][b];
          if (vistos[p][clau]) repetits += 1;
          vistos[p][clau] = 1;
        });
      }
    }
    expect(repetits).toBe(0);
    vistos.forEach((vist, p) => expect(vist.every((u) => u === 1), `parell (${parells[p]})`).toBe(true));
  });

  test('propietat del cos (no del mòdul): x₁·x₂·(x₁ ⊕ x₂) ≠ 0 en els 32.385 parells de x distints i no nuls, la condició perquè cada parell siga una bijecció', () => {
    let singulars = 0;
    let parellsVistos = 0;
    for (let x1 = 1; x1 < 256; x1 += 1) {
      for (let x2 = x1 + 1; x2 < 256; x2 += 1) {
        if (R.gfMul(R.gfMul(x1, x2), x1 ^ x2) === 0) singulars += 1;
        parellsVistos += 1;
      }
    }
    expect(parellsVistos).toBe(32385);
    expect(singulars).toBe(0);
  });
});

describe('més propietats del repartiment', () => {
  test('linealitat: repartir s ⊕ s′ amb a ⊕ a′ dona la suma punt a punt; i multiplicar s i a per c multiplica cada y per c', () => {
    for (let prova = 0; prova < 64; prova += 1) {
      const [s, s2, a1, a2, b1, b2] = Array.from({ length: 6 }, () => aleatoris(R.BYTES_RK));
      const c = (aleatoris(1)[0] % 255) + 1;
      const xorB = (u, v) => Uint8Array.from(u, (byte, i) => byte ^ v[i]);
      const perC = (u) => Uint8Array.from(u, (byte) => R.gfMul(c, byte));
      const f = R.reparteixRk(criptoFix(a1, a2), s, 8);
      const g = R.reparteixRk(criptoFix(b1, b2), s2, 8);
      const h = R.reparteixRk(criptoFix(xorB(a1, b1), xorB(a2, b2)), xorB(s, s2), 8);
      const k = R.reparteixRk(criptoFix(perC(a1), perC(a2)), perC(s), 8);
      for (let i = 0; i < 8; i += 1) {
        expect(h[i][0]).toBe(i + 1);
        expect(aHex(h[i].subarray(1)), `prova ${prova}, x = ${i + 1}`).toBe(aHex(xorB(f[i].subarray(1), g[i].subarray(1))));
        expect(aHex(k[i].subarray(1)), `prova ${prova}, x = ${i + 1}, c = ${c}`).toBe(aHex(perC(f[i].subarray(1))));
      }
    }
  });

  test('recomponRk no depén de l’ordre dels tres fragments (les sis permutacions) ni de quina terna es tria', () => {
    const permutacions = [[0, 1, 2], [0, 2, 1], [1, 0, 2], [1, 2, 0], [2, 0, 1], [2, 1, 0]];
    for (let prova = 0; prova < 8; prova += 1) {
      const rk = aleatoris(R.BYTES_RK);
      const fragments = R.reparteixRk(cripto, rk, 6);
      for (const terna of ternes(6)) {
        for (const ordre of permutacions) expect(aHex(R.recomponRk(ordre.map((i) => fragments[terna[i]]))), `${terna} ${ordre}`).toBe(aHex(rk));
      }
    }
  });

  test('reparteixRk demana una sola vegada 64 B al cripto, siga quin siga n (3, 4, 40, 255)', () => {
    for (const n of [3, 4, 40, 255]) {
      const crides = [];
      const vigilat = { subtle: cripto.subtle, getRandomValues: (bytes) => { crides.push(bytes.length); return cripto.getRandomValues(bytes); } };
      expect(R.reparteixRk(vigilat, aleatoris(R.BYTES_RK), n)).toHaveLength(n);
      expect(crides, `n = ${n}`).toEqual([64]);
    }
  });

  test('uniformitat (χ², 255 graus de llibertat, p = 10⁻⁶ a cada cua): els 64 B de coeficients i els bytes dels fragments en x = 1, 2 i 3', () => {
    const N = 2048;
    const coeficients = new Uint8Array(64 * N);
    const perX = [new Uint8Array(R.BYTES_RK * N), new Uint8Array(R.BYTES_RK * N), new Uint8Array(R.BYTES_RK * N)];
    const rk = new Uint8Array(R.BYTES_RK).fill(0x83);
    for (let i = 0; i < N; i += 1) {
      // Còpia en el moment d'omplir: reparteixRk posa els coeficients a zero en acabar.
      const capturador = { subtle: cripto.subtle, getRandomValues: (bytes) => { cripto.getRandomValues(bytes); coeficients.set(bytes, 64 * i); return bytes; } };
      const fragments = R.reparteixRk(capturador, rk, 3);
      fragments.forEach((fragment, x) => perX[x].set(fragment.subarray(1), R.BYTES_RK * i));
    }
    for (const [nom, mostres] of [['coeficients', coeficients], ['y(1)', perX[0]], ['y(2)', perX[1]], ['y(3)', perX[2]]]) {
      const chi = chiQuadrat(mostres);
      expect(chi, `${nom}: χ² = ${chi.toFixed(1)}`).toBeGreaterThan(CHI_INFERIOR);
      expect(chi, `${nom}: χ² = ${chi.toFixed(1)}`).toBeLessThan(CHI_SUPERIOR);
    }
  });
});
