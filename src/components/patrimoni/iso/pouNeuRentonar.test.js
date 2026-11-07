import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it, vi } from 'vitest';
import {
  CAMERA_FORA, CAMERES_GUIADES, COTES_INTERIOR, NIVELLS_NEU, POU_RENTONAR as G, RECONSTRUCCIO, SEGURA_1987,
  cotaEnTall, cotaTerreny, distanciaAlSolid, materialAlPunt, teuladaFase1, volumUtil,
} from './pouNeuRentonar.js';
import {
  POU_INTERIOR_FRAGMENT, SONDES_COLOR, codiTall, creaMotorInterior, esVisible, mouAmbColisio, orbita, projecta,
  rotacioCamera, solDavall, sostreDamunt, uniformesGeometria,
} from './pouNeuInterior.js';
import { POU_NEU_INTERIOR_TEXT } from './pouNeuTextosInterior.js';

const aire = (x, y, z, o = {}) => distanciaAlSolid(x, y, z, o) > 0;

/** El mateix pas a peu que PouNeuInterior.jsx: avançar, la regla de la vora, gravetat i ull sota el sostre. */
function camina(estacio, segons = 1, o = {}) {
  const c = { pos: estacio.pos.slice(), guinyada: estacio.guinyada };
  const dt = 1 / 60;
  let vy = 0, vora = false;
  for (let i = 0; i < segons / dt; i++) {
    const { davant } = rotacioCamera(c.guinyada, 0);
    const nou = mouAmbColisio(c.pos, [davant[0] * 2.2 * dt, 0, davant[2] * 2.2 * dt], { opcions: o });
    if (solDavall(c.pos, o) - solDavall(nou, o) > 1.2) { vora = true; break; }
    c.pos = nou;
    const sol = solDavall(c.pos, o);
    const objectiu = sol + Math.min(1.6, Math.max(0.4, sostreDamunt(c.pos, o) - sol - 0.15));
    if (c.pos[1] > objectiu + 0.02) { vy -= 9.8 * dt; c.pos[1] = Math.max(objectiu, c.pos[1] + vy * dt); } else { c.pos[1] += (objectiu - c.pos[1]) * Math.min(1, dt * 10); vy = 0; }
  }
  return { mogut: Math.hypot(c.pos[0] - estacio.pos[0], c.pos[2] - estacio.pos[2]), vora };
}

describe('pouNeuRentonar · mides de Segura Martí (1987)', () => {
  it('pren totes les cotes de SEGURA_1987 (Segura Martí 1987), no de l’esbós 76150', () => {
    expect(G.R * 2).toBe(SEGURA_1987.diametreInterior.valor);
    expect(G.R * 2).toBe(9.8);
    expect(G.alcadaCilindre).toBe(SEGURA_1987.fondariaFinestres.valor);
    expect(G.gruixMur).toBe(1.5);
    expect(G.tunel.longitud).toBe(9.1);
    expect(G.tunel.cota).toBe(10);
    expect([G.tunel.ampleBoca, G.tunel.altBoca, G.tunel.ampleIngres, G.tunel.altIngres]).toEqual([2.35, 2.1, 1.35, 1.55]);
    expect([G.galeria.longitud, G.galeria.ample, G.galeria.alt]).toEqual([29, 0.5, 0.7]);
    expect([G.finestra.ample, G.finestra.alt, G.finestra.llindar]).toEqual([1.55, 1.7, 13.75]);
    expect(G.finestres.map((f) => f.id)).toEqual(['nord', 'oest', 'est']);
    expect(G.fletxa).toBe(G.R);
    for (const m of Object.values(SEGURA_1987)) expect(m.font).toMatch(/Segura Martí/);
    for (const r of Object.values(RECONSTRUCCIO)) expect(r.motiu.length).toBeGreaterThan(20);
    // CL-01: el «12,10 m» del text és la cota de la clau de la boca (10,00 + 2,10), no un impossible.
    expect(SEGURA_1987.bocaTunelAlt.nota).toMatch(/10,00 \+ 2,10/);
    expect(SEGURA_1987.bocaTunelAlt.nota).not.toMatch(/impossible/);
  });
  it('ARQ-10 · construeix() no du cap xifra pròpia: totes ixen de SEGURA_1987 o de RECONSTRUCCIO', () => {
    const codi = readFileSync(resolve(process.cwd(), 'src/components/patrimoni/iso/pouNeuRentonar.js'), 'utf8');
    const inici = codi.indexOf('function construeix() {');
    const cos = codi.slice(inici, codi.indexOf('\n}\n', inici));
    const literals = new Set([...cos.replace(/\/\/.*$/gm, '').matchAll(/(?<![\w.])\d+(?:\.\d+)?(?![\w.])/g)].map((m) => Number(m[0])));
    expect([...literals].sort((a, b) => a - b)).toEqual([2, 180]);
    // Les reconstruccions que demanaven les lents (ARQ-03, -07, -10, -11, -12, -14, N0-04, N0-05, CL-02).
    for (const clau of ['orientacio', 'voltaArrencada', 'finestraFletxa', 'finestresObertesUs', 'tunelFletxa', 'tunelVolta', 'tunelSol',
      'estrepAlt', 'estrepVolada', 'fase1Pendent', 'fase1Gruix', 'fase1Rafec', 'graonsDisposicio', 'nivellNeuHivern', 'nivellNeuEstiu',
      'pendentSud', 'talusBoca', 'replanaBoca', 'pendentVessant', 'paredo']) expect(RECONSTRUCCIO[clau], clau).toBeTruthy();
    expect(RECONSTRUCCIO.orientacio.motiu).toMatch(/16°.*119°/);
    expect(RECONSTRUCCIO.forat.motiu).toMatch(/28 d’octubre de 2020.*l\. 919.*2023/);
    expect(RECONSTRUCCIO.nivellNeuHivern.motiu).toMatch(/Il·lustratiu/);
    expect(NIVELLS_NEU).toEqual({ hivern: RECONSTRUCCIO.nivellNeuHivern.valor, estiu: RECONSTRUCCIO.nivellNeuEstiu.valor, hui: 0 });
    expect(G.voltaArrencada).toBe(RECONSTRUCCIO.voltaArrencada.valor);
  });
  it('el volum útil és el de Segura (1.030 m³) amb un 1 % de marge', () => {
    expect(Math.abs(volumUtil() - SEGURA_1987.capacitat.valor) / SEGURA_1987.capacitat.valor).toBeLessThan(0.01);
  });
  it('el mur interior és a 4,90 m del centre i té 1,50 m de gruix', () => {
    expect(distanciaAlSolid(G.R - 0.1, 5, 0)).toBeCloseTo(0.1, 2);
    expect(aire(0, 7, 0)).toBe(true);
    expect(aire(G.R + 0.75, 5, 0)).toBe(false);
    expect(aire(0, 5, G.R + 0.75)).toBe(false);
  });
  it('L4-ARQ-04 · al brancal de la finestra de l’oest el mur fa l’1,50 m de Segura (l. 992), en les dues cobertes', () => {
    /** Sòlid radial (m) al costat de l'obertura de l'oest, a l'altura y: del parament interior a l'aire de fora. */
    const gruixAlBrancal = (y, o) => {
      const angle = Math.PI + 0.2; // l'oest és a π; 0,2 rad deixa el raig fora de l'obertura d'1,55 m
      let dins = null;
      for (let rho = 3; rho < 9; rho += 0.001) {
        const solid = distanciaAlSolid(rho * Math.cos(angle), y, rho * Math.sin(angle), o) < 0;
        if (solid && dins === null) dins = rho;
        if (!solid && dins !== null) return rho - dins;
      }
      return null;
    };
    const llindar = G.finestra.llindar;
    expect(RECONSTRUCCIO.voltaRenyons.motiu).toMatch(/l\. 992/);
    expect(G.volta.renyons).toBe(SEGURA_1987.gruixMur.valor);
    for (const estat of ['hui', 'hivern']) {
      for (const dy of [0.1, 0.85, 1.6]) {
        const gruix = gruixAlBrancal(llindar + dy, { estat, coberta: 'fase2' });
        expect(Math.abs(gruix - 1.5), `fase2 ${estat} +${dy}: ${gruix}`).toBeLessThan(0.02);
      }
    }
    // Fase 1: el ràfec és només la llosa de la teulada (al seu caire comença a ≈15,13 m), no un mur més gruixut.
    for (const dy of [0.1, 0.85, 1.3]) {
      const gruix = gruixAlBrancal(llindar + dy, { estat: 'hivern', coberta: 'fase1' });
      expect(Math.abs(gruix - 1.5), `fase1 +${dy}: ${gruix}`).toBeLessThan(0.02);
    }
    // El ràfec continua a la vora de la teulada, per fora del mur (a 45°, lluny de finestres i túnel).
    const T = teuladaFase1();
    const r = G.R + G.gruixMur + G.fase1.rafec / 2, a = Math.PI / 4;
    const yRafec = T.cim - T.pendent * r + T.gruix * Math.hypot(1, T.pendent) / 2;
    expect(distanciaAlSolid(r * Math.cos(a), yRafec, r * Math.sin(a), { estat: 'hivern', coberta: 'fase1' })).toBeLessThan(0);
    expect(distanciaAlSolid(r * Math.cos(a), yRafec - 0.6, r * Math.sin(a), { estat: 'hivern', coberta: 'fase1' })).toBeGreaterThan(0);
  });
  it('la falsa cúpula és hemisfèrica: l’intradós arriba a 13,75 + 4,90 m; hui té el forat de la clau', () => {
    expect(aire(0, G.alcadaCilindre + G.R - 0.1, 0, { estat: 'hivern' })).toBe(true);
    expect(aire(0, G.alcadaCilindre + G.R + 0.3, 0, { estat: 'hivern' })).toBe(false);
    expect(aire(0, G.alcadaCilindre + G.R + 0.3, 0, { estat: 'hui' })).toBe(true);
    expect(aire(3, G.alcadaCilindre + 3.5, 0, { estat: 'hivern' })).toBe(true);
  });
  it('tres finestres de 1,55 × 1,70 m als 13,75 m: hui només l’oest és oberta', () => {
    // Dins del gruix de la closca, a l'altura de les finestres (la volta arrenca als 13,75 m).
    const fora = G.R + 0.6;
    expect(aire(-fora, 14.5, 0, { estat: 'hui' })).toBe(true);
    expect(aire(0, 14.5, -fora, { estat: 'hui' })).toBe(false);
    expect(aire(fora, 14.5, 0, { estat: 'hui' })).toBe(false);
    expect(aire(0, 14.5, -fora, { estat: 'hivern' })).toBe(true);
    expect(aire(-fora, 14.5, 0.9, { estat: 'hui' })).toBe(false);
  });
  it('ARQ-12 · les finestres acaben en volta rebaixada: 1,70 m a la clau i menys als brancals', () => {
    const fora = G.R + 0.6, clau = G.finestra.llindar + G.finestra.alt;
    expect(aire(-fora, clau - 0.05, 0)).toBe(true);
    expect(aire(-fora, clau - 0.05, G.finestra.ample / 2 - 0.08)).toBe(false);
    expect(aire(-fora, clau - G.finestra.fletxa - 0.05, G.finestra.ample / 2 - 0.08)).toBe(true);
    expect(aire(-fora, clau + 0.05, 0)).toBe(false);
  });
  it('l’ingrés sud és a +10 m i el túnel fa 9,10 m', () => {
    expect(aire(0, 10.7, G.R + 0.5)).toBe(true);
    expect(aire(0, 9.8, G.R + 0.5)).toBe(false);
    expect(aire(0, 10.7, G.R + G.tunel.longitud - 0.3)).toBe(true);
    expect(aire(1.0, 10.7, G.R + 0.4)).toBe(false);
    expect(aire(1.0, 10.7, G.R + G.tunel.longitud - 0.3)).toBe(true);
  });
  it('ARQ-01 · el túnel té volta de maçoneria en tots els 9,10 m, amb terra damunt, i la boca ix al vessant a 10 m', () => {
    const boca = G.R + G.tunel.longitud;
    for (let z = G.R + 0.1; z <= boca - 0.1; z += 0.25) {
      const s = (z - G.R) / G.tunel.longitud;
      const clau = G.tunel.cota + G.tunel.altIngres + (G.tunel.altBoca - G.tunel.altIngres) * s;
      expect(sostreDamunt([0, 10.5, z]), `z=${z.toFixed(2)}`).toBeLessThan(13);
      expect(distanciaAlSolid(0, clau + 0.2, z), `volta a z=${z.toFixed(2)}`).toBeLessThan(0);
      expect(materialAlPunt(0, clau, z), `intradós a z=${z.toFixed(2)}`).toBe('pedra');
      // Cap rasa a cel obert: el terreny passa per damunt de la clau fins a la boca.
      expect(cotaTerreny(0, z), `coberta a z=${z.toFixed(2)}`).toBeGreaterThan(clau);
    }
    // Davant de la boca (2,35 × 2,10 m) no hi ha cap graó de terra: el sòl és a la cota de l'ingrés o més avall.
    expect(cotaTerreny(0, boca + 0.2)).toBeLessThanOrEqual(G.tunel.cota);
    for (const y of [10.2, 11.0, 11.9]) expect(aire(0, y, boca + 0.3), `boca a y=${y}`).toBe(true);
    expect(aire(1.0, 10.3, boca + 0.3)).toBe(true);
  });
  it('la galeria d’escorredor ix a l’est des del fons: 29 m de 0,50 × 0,70 m', () => {
    expect(aire(G.R + 10, 0.2, 0)).toBe(true);
    expect(aire(G.R + 10, 0.85, 0)).toBe(false);
    expect(aire(G.R + 10, 0.2, 0.35)).toBe(false);
    expect(aire(G.R + 28.5, 0.2 - 28.5 * G.galeria.pendent, 0)).toBe(true);
    // L'eixida queda a l'aire lliure: el terreny de l'est hi arriba més baix que el sostre de la galeria.
    expect(cotaTerreny(G.R + G.galeria.longitud, 0)).toBeLessThan(G.galeria.alt - G.galeria.longitud * G.galeria.pendent);
  });
  it('els quatre estreps dels arcs creuats són entre 10 m i 13,75 m; els arcs només a la 1a coberta', () => {
    const s = G.R * Math.SQRT1_2;
    expect(aire(s - 0.05, G.arcs.arrencada - 0.5, s - 0.05)).toBe(false);
    expect(aire(0, G.arcs.arrencada + G.R - 0.25, 0, { coberta: 'fase1', estat: 'hivern' })).toBe(false);
    expect(aire(0, G.arcs.arrencada + G.R - 0.25, 0, { coberta: 'fase2', estat: 'hivern' })).toBe(true);
  });
  it('ARQ-07 · el trespol de la 1a coberta descansa sobre la clau dels arcs (buit ≤ 0,05 m)', () => {
    const T = teuladaFase1();
    let buit = Infinity;
    for (let al = -G.R + 0.05; al <= G.R - 0.05; al += 0.005) {
      const arc = G.arcs.arrencada + Math.sqrt(G.R ** 2 - al ** 2);
      buit = Math.min(buit, T.cim - T.pendent * Math.abs(al) - arc);
    }
    expect(buit).toBeGreaterThanOrEqual(-1e-6);
    expect(buit).toBeLessThanOrEqual(0.05);
    // Al camp: al punt de contacte, damunt de l'arc NW-SE i davall del trespol, no hi ha aire (o en queda < 5 cm).
    const al = T.tangencia, y = G.arcs.arrencada + Math.sqrt(G.R ** 2 - al ** 2) + 0.02;
    expect(distanciaAlSolid(al * Math.SQRT1_2, y, al * Math.SQRT1_2, { coberta: 'fase1', estat: 'hivern' })).toBeLessThan(0.05);
  });
  it('ARQ-08 · des de l’estació dels estreps se’n veuen almenys dos, en les dues cobertes', () => {
    const cam = { ...CAMERES_GUIADES.find((c) => c.id === 'arcs'), fov: 1 };
    expect(cam.pos).toEqual([0, 12.0, 3.6]);
    const k = G.R * Math.SQRT1_2 * 0.97, y = G.arcs.arrencada - 1.1;
    const estreps = [[k, -k], [-k, -k], [k, k], [-k, k]].map(([x, z]) => [x, y, z]);
    for (const coberta of ['fase2', 'fase1']) {
      const o = { coberta, estat: coberta === 'fase1' ? 'hivern' : 'hui' };
      const vistos = estreps.filter((p) => { const pr = projecta(p, cam, 1600, 900, 1); return pr && pr.x > 0 && pr.x < 1600 && pr.y > 0 && pr.y < 900 && esVisible(p, cam, o); });
      expect(vistos.length, coberta).toBeGreaterThanOrEqual(2);
    }
  });
  it('la neu ompli el cilindre segons l’estació', () => {
    expect(aire(0, 13.0, 0, { nivellNeu: NIVELLS_NEU.hivern })).toBe(false);
    expect(aire(0, 13.0, 0, { nivellNeu: NIVELLS_NEU.estiu })).toBe(true);
    expect(NIVELLS_NEU.hivern).toBeLessThan(G.finestra.llindar);
  });
  it('VH-02 · el mur, la volta i el túnel són maçoneria; només el sòl, la galeria i el terreny són terra', () => {
    for (let a = 0; a < 2 * Math.PI; a += Math.PI / 7) {
      for (const y of [0.6, 3, 6, 9.5, 11.7, 13.2]) expect(materialAlPunt(G.R * Math.cos(a), y, G.R * Math.sin(a)), `mur a ${a.toFixed(2)} rad, y=${y}`).toBe('pedra');
    }
    expect(materialAlPunt(0, G.voltaArrencada + G.R, 0, { estat: 'hivern' })).toBe('pedra');
    expect(materialAlPunt(1.2, 0, -0.7)).toBe('terra');
    expect(materialAlPunt(G.R + 10, -0.1, 0)).toBe('terra');
    expect(materialAlPunt(G.R + 10, 0.3, G.galeria.ample / 2)).toBe('terra');
    expect(materialAlPunt(-12, cotaTerreny(-12, 0), 0)).toBe('terra');
    const s = G.R * Math.SQRT1_2;
    expect(materialAlPunt(s - 0.18, G.arcs.arrencada - 0.5, s - 0.18)).toBe('carreu');
  });
  it('VH-07 + ARQ-09 · tres talls (A-B, C-D i quart) i la poché de cada material', () => {
    const mur = [0.5, 5, G.R + 0.75];
    expect(aire(...mur)).toBe(false);
    expect(aire(...mur, { tall: 'ab' })).toBe(true);
    expect(aire(-0.5, 5, G.R + 0.75, { tall: 'cd' })).toBe(false);
    expect(aire(...mur, { tall: 'cd' })).toBe(true);
    expect(aire(...mur, { tall: 'quart' })).toBe(true);
    expect(aire(-0.5, 5, G.R + 0.75, { tall: 'quart' })).toBe(false);
    expect(aire(0.5, 5, -(G.R + 0.75), { tall: 'quart' })).toBe(false);
    expect(aire(...mur, { tall: true })).toBe(true);
    // A la cara del tall A-B (z = 0): mur dens, terra clara, neu amb palla; davall del fons, terra.
    expect(materialAlPunt(G.R + 0.75, 5, 0, { tall: 'ab' })).toBe('tall-pedra');
    expect(materialAlPunt(-(G.R + 0.75), 5, 0, { tall: 'ab' })).toBe('tall-pedra');
    expect(materialAlPunt(G.R + 5, 5, 0, { tall: 'ab' })).toBe('tall-terra');
    expect(materialAlPunt(0, -0.2, 0, { tall: 'ab' })).toBe('tall-terra');
    expect(materialAlPunt(0, 3, 0, { tall: 'ab', nivellNeu: NIVELLS_NEU.hivern })).toBe('tall-neu');
    expect(materialAlPunt(0, G.voltaArrencada + G.R + 0.3, 0, { tall: 'ab', estat: 'hivern' })).toBe('tall-pedra');
    // Al tall C-D (x = 0), la volta del túnel és maçoneria i el terreny de damunt, terra.
    expect(materialAlPunt(0, G.tunel.cota + 2.1, G.R + 6, { tall: 'cd' })).toBe('tall-pedra');
    expect(materialAlPunt(0, G.tunel.cota + 3.0, G.R + 5, { tall: 'cd' })).toBe('tall-terra');
    expect([false, 'ab', 'cd', 'quart', true].map(codiTall)).toEqual([0, 1, 2, 3, 1]);
  });
  it('N0-01 · fora de la capsa dels graons, cap graó és a menys de 0,1 m (la guarda no canvia la superfície)', () => {
    const t = G.tunel;
    const caixa = (px, py, pz, bx, by, bz) => {
      const q = [Math.abs(px) - bx, Math.abs(py) - by, Math.abs(pz) - bz];
      return Math.hypot(...q.map((v) => Math.max(v, 0))) + Math.min(Math.max(...q), 0);
    };
    const graons = (x, y, z) => {
      let d = Infinity;
      for (let i = 0; i < G.graons; i++) {
        const yi = t.cota - (i + 1) * (t.cota / (G.graons + 1)), ang = Math.PI / 2 + (i - G.graons / 2) * G.graoPas;
        const ux = Math.cos(ang), uz = Math.sin(ang);
        d = Math.min(d, caixa(-x * uz + z * ux, y - yi, x * ux + z * uz - (G.R + 0.12), 0.25, 0.09, 0.16));
      }
      return d;
    };
    const dins = (x, y, z) => z > 3.5 && y < t.cota + 0.3 && Math.abs(x) < 3.2 && Math.abs(Math.hypot(x, z) - (G.R + 0.12)) < 0.6;
    let minim = Infinity, fora = 0;
    for (let x = -4.5; x <= 4.5; x += 0.09) for (let y = -0.5; y <= 11; y += 0.23) for (let z = 2.5; z <= 6.5; z += 0.09) {
      if (dins(x, y, z)) continue;
      fora++;
      minim = Math.min(minim, graons(x, y, z));
    }
    expect(fora).toBeGreaterThan(10000);
    expect(minim).toBeGreaterThan(0.1);
    // I els dotze graons continuen buidats al mur (el setè és just al sud, x = 0).
    const yi = t.cota - 7 * (t.cota / (G.graons + 1));
    expect(aire(0, yi + 0.02, G.R + 0.2)).toBe(true);
    expect(aire(0, yi + 0.2, G.R + 0.2)).toBe(false);
  });
  it('cada estació guiada comença a l’aire i, a peu, sobre un sòl', () => {
    for (const c of [...CAMERES_GUIADES, CAMERA_FORA]) {
      expect(distanciaAlSolid(...c.pos), c.id).toBeGreaterThan(0.15);
      if (!c.vol) {
        const sol = solDavall(c.pos), sostre = sostreDamunt(c.pos);
        expect(c.pos[1] - sol, c.id).toBeLessThan(1.8);
        expect(sostre - c.pos[1], c.id).toBeGreaterThan(0.05);
      }
    }
    expect(CAMERES_GUIADES).toHaveLength(6);
    expect(CAMERES_GUIADES.find((c) => c.id === 'fons').cabotatgeNeu).toBe(-35);
    expect(CAMERES_GUIADES.find((c) => c.id === 'ingres-10m').pos[1]).toBeCloseTo(G.tunel.cota + 1.15, 6);
    expect(CAMERES_GUIADES.find((c) => c.id === 'finestra-oest').pos[1]).toBeCloseTo(G.finestra.llindar + 1.3, 6);
  });
  it('VH-08 · des de cada estació a peu, 1 s d’avançar mou la càmera ≥ 0,5 m o dispara la regla de la vora', () => {
    const resultats = {};
    for (const c of CAMERES_GUIADES.filter((e) => !e.vol)) {
      const r = camina(c);
      resultats[c.id] = r.vora ? 'vora' : r.mogut >= 0.5;
      expect(r.vora || r.mogut >= 0.5, `${c.id}: ${r.mogut.toFixed(2)} m`).toBe(true);
    }
    // L'ingrés i la finestra donen al buit: la regla de la vora; el fons i la boca, camí.
    expect(resultats).toEqual({ fons: true, 'ingres-10m': 'vora', 'boca-tunel': true, 'finestra-oest': 'vora' });
  });
  it('VH-08 · la col·lisió separa el cos (0,28 m, 0,6 m davall de l’ull) del cap (0,10 m)', () => {
    const ingres = CAMERES_GUIADES.find((c) => c.id === 'ingres-10m');
    const pas = [0, 0, -0.03];
    expect(mouAmbColisio(ingres.pos, pas)).toEqual([ingres.pos[0], ingres.pos[1], ingres.pos[2] - 0.03]);
    // Amb una sola esfera de 0,28 m a l'ull (l'opció antiga) no es podia avançar sota la llinda.
    const alt = [0, G.tunel.cota + G.tunel.altIngres - 0.18, G.R + 1.2];
    expect(mouAmbColisio(alt, pas, { radi: 0.28 })).toEqual(alt);
    expect(mouAmbColisio(alt, pas)).not.toEqual(alt);
    // En vol per la galeria (0,70 m d'alt) el cos ja toca el sòl: mana el cap i no s'encalla.
    const galeria = CAMERES_GUIADES.find((c) => c.id === 'galeria').pos;
    expect(mouAmbColisio(galeria, [-0.03, 0, 0])).toEqual([galeria[0] - 0.03, galeria[1], galeria[2]]);
    expect(mouAmbColisio(galeria, [0, 0, 0.2])).toEqual(galeria);
  });
  it('les cotes de làmina citen xifres amb font i la càmera les projecta', () => {
    for (const cota of COTES_INTERIOR) {
      expect(cota.mesura.font).toBeTruthy();
      expect(Number.isFinite(cota.mesura.valor)).toBe(true);
    }
    const davant = projecta([0, 1.6, -5], { pos: [0, 1.6, 0], guinyada: 0, cabotatge: 0 }, 800, 500);
    expect(davant.x).toBeCloseTo(400, 3);
    expect(davant.y).toBeCloseTo(250, 3);
    expect(projecta([0, 1.6, 5], { pos: [0, 1.6, 0], guinyada: 0, cabotatge: 0 }, 800, 500)).toBeNull();
    const { davant: d } = rotacioCamera(90, 0);
    expect(d[0]).toBeCloseTo(1, 6);
  });
  it('ARQ-09 · cada cota diu la seua secció i cau a la meitat que el tall deixa', () => {
    for (const cota of COTES_INTERIOR) {
      expect(['ab', 'cd', null], cota.id).toContain(cota.seccio);
      for (const p of [cota.a, cota.b]) {
        if (cota.seccio === 'ab') expect(p[2], cota.id).toBeLessThanOrEqual(0.01);
        if (cota.seccio === 'cd') expect(p[0], cota.id).toBeLessThanOrEqual(0.01);
        expect(Math.min(p[0], p[2]), `${cota.id} al quart`).toBeLessThanOrEqual(0.01);
      }
    }
    const per = Object.fromEntries(COTES_INTERIOR.map((c) => [c.id, c]));
    expect(cotaEnTall(per.tunel, 'cd')).toBe(true);
    expect(cotaEnTall(per.tunel, 'ab')).toBe(false);
    expect(cotaEnTall(per.diametre, 'cd')).toBe(false);
    expect(COTES_INTERIOR.every((c) => cotaEnTall(c, 'quart') && cotaEnTall(c, false))).toBe(true);
  });
  it('VIS-05 · amb l’àzimut per defecte, cada tall veu les seues cotes: el punt mitjà no queda darrere del mur tallat', () => {
    const cam = orbita(45);
    for (const estat of ['hui', 'hivern', 'estiu']) {
      for (const tall of ['ab', 'cd', 'quart']) {
        const opcions = { nivellNeu: NIVELLS_NEU[estat] ?? 0, tall, estat, coberta: 'fase2' };
        for (const cota of COTES_INTERIOR.filter((c) => cotaEnTall(c, tall))) {
          const mig = cota.a.map((v, i) => (v + cota.b[i]) / 2);
          expect(esVisible(mig, cam, opcions), `${cota.id} · ${tall} · ${estat}`).toBe(true);
          expect(projecta(cota.a, cam, 800, 500, cam.fov), `${cota.id} · ${tall}`).not.toBeNull();
          expect(projecta(cota.b, cam, 800, 500, cam.fov), `${cota.id} · ${tall}`).not.toBeNull();
        }
      }
    }
  });
  it('orbita mira el centre del pou a mitja altura', () => {
    const o = orbita(45);
    expect(Math.hypot(o.pos[0], o.pos[2])).toBeCloseTo(26, 6);
    const { davant } = rotacioCamera(o.guinyada, o.cabotatge);
    const cap = [-o.pos[0], 8 - o.pos[1], -o.pos[2]], n = Math.hypot(...cap);
    davant.forEach((v, i) => expect(v).toBeCloseTo(cap[i] / n, 6));
  });
  it('el shader no du colors literals, rep la geometria per uniformes i mesura el tramat en píxels CSS', () => {
    expect(POU_INTERIOR_FRAGMENT).not.toMatch(/#[0-9a-f]{3,6}\b/i);
    for (const u of ['uG[10]', 'uTun[8]', 'uGal', 'uArc[5]', 'uTer[6]', 'uRoof', 'uWinOpen', 'uFlags', 'uniform float uPx', 'uniform vec3 uShade', 'uniform vec3 uVeg']) expect(POU_INTERIOR_FRAGMENT).toContain(u);
    expect(POU_INTERIOR_FRAGMENT).toContain('hatch(px, light + beam / 14.0)');
    expect(POU_INTERIOR_FRAGMENT).toContain('vec2 px = gl_FragCoord.xy / uPx;');
    // VH-06 / CL-05: ni vinyeta, ni cel en degradat, ni resplendor del raig.
    expect(POU_INTERIOR_FRAGMENT).not.toMatch(/dot\(v, v\)|mix\(paper, uIce|mix\(paper, uStraw/);
    expect(POU_INTERIOR_FRAGMENT).toContain('col = mix(paper, wash, 0.30);');
    expect(POU_INTERIOR_FRAGMENT).toContain('col = mix(col, uShade, tramat * 0.6);');
    expect(POU_INTERIOR_FRAGMENT).not.toMatch(/sarga|empouador/i);
    // CP-10: cap fwidth dins de les funcions de juntes ni dins de cap branca de material.
    const main = POU_INTERIOR_FRAGMENT.slice(POU_INTERIOR_FRAGMENT.indexOf('void main(){'));
    const abansDeBranques = main.slice(0, main.indexOf('if (toca > 0.5)'));
    expect((POU_INTERIOR_FRAGMENT.match(/fwidth\(/g) || []).length).toBe((abansDeBranques.match(/fwidth\(/g) || []).length);
    expect(SONDES_COLOR).toEqual(expect.arrayContaining([['ombra', 'uShade'], ['vegetacio', 'uVeg']]));
    expect(SONDES_COLOR.map(([nom]) => nom)).not.toContain('sarga');
    const u = uniformesGeometria();
    expect(u.uG).toHaveLength(10);
    expect(u.uTun).toHaveLength(8);
    expect(u.uArc).toHaveLength(5);
    expect(u.uTer).toHaveLength(6);
  });
  it('els textos del visor tenen les mateixes claus en les cinc llengües', () => {
    const claus = (o) => Object.entries(o).flatMap(([k, v]) => (v && typeof v === 'object' ? claus(v).map((c) => `${k}.${c}`) : [k])).sort();
    const ca = claus(POU_NEU_INTERIOR_TEXT.ca);
    for (const lang of ['es', 'en', 'eu', 'gl']) expect(claus(POU_NEU_INTERIOR_TEXT[lang])).toEqual(ca);
    for (const c of [...CAMERES_GUIADES, CAMERA_FORA]) expect(POU_NEU_INTERIOR_TEXT.ca.relats[c.id]).toBeTruthy();
    expect(JSON.stringify(POU_NEU_INTERIOR_TEXT)).not.toMatch(/\bmasia\b|9,75 m|9\.75 m|\b18 m/i);
  });
});

describe('pouNeuInterior · el motor (WebGL2 fals)', () => {
  function glFals(falla) {
    const crides = [];
    const base = {
      VERTEX_SHADER: 1, FRAGMENT_SHADER: 2, COMPILE_STATUS: 3, LINK_STATUS: 4, ARRAY_BUFFER: 5, STATIC_DRAW: 6, FLOAT: 7, TRIANGLES: 8,
      isContextLost: () => false,
      getShaderParameter: () => !falla.compilacio,
      getShaderInfoLog: () => 'error de prova',
      getProgramParameter: () => true,
      getAttribLocation: () => 0,
      getUniformLocation: (programa, nom) => nom,
      uniform1f: (loc, v) => crides.push([loc, v]),
      uniform4f: (loc, ...v) => crides.push([loc, ...v]),
    };
    return { crides, gl: new Proxy(base, { get: (o, k) => (k in o ? o[k] : () => ({})) }) };
  }
  it('CP-03 · en recuperar el context es torna a iniciar i avisa; si falla, queda perdut amb l’error', () => {
    const falla = { compilacio: false };
    const { gl, crides } = glFals(falla);
    const canvas = Object.assign(new EventTarget(), { width: 0, height: 0, getContext: () => gl });
    const onRestaurat = vi.fn();
    const motor = creaMotorInterior(canvas, { onRestaurat });
    expect(motor.error).toBeNull();
    const cam = { pos: [0, 1.6, 0], guinyada: 0, cabotatge: 0 };
    expect(motor.pinta({ camera: cam, ample: 40, alt: 20, escalaPx: 2, tall: 'cd' })).toBe(true);
    expect(crides).toContainEqual(['uPx', 2]);
    expect(crides.find(([nom]) => nom === 'uFlags')[3]).toBe(2);
    canvas.dispatchEvent(new Event('webglcontextlost', { cancelable: true }));
    expect(motor.perdut).toBe(true);
    expect(motor.pinta({ camera: cam, ample: 40, alt: 20 })).toBe(false);
    canvas.dispatchEvent(new Event('webglcontextrestored'));
    expect(onRestaurat).toHaveBeenCalledTimes(1);
    expect(motor.perdut).toBe(false);
    canvas.dispatchEvent(new Event('webglcontextlost', { cancelable: true }));
    falla.compilacio = true;
    canvas.dispatchEvent(new Event('webglcontextrestored'));
    expect(onRestaurat).toHaveBeenCalledTimes(1);
    expect(motor.perdut).toBe(true);
    expect(motor.error).toBe('error de prova');
    motor.dispose();
  });
});
