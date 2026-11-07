/**
 * pouNeuRentonar.js — IDEA-161 + IDEA-165 (Onada R11) · La geometria única del
 * Pou de Neu del Rentonar, en metres, per als modes WebGL del visor (dins del
 * pou i talls seccionals) i per a les proves d'exactitud.
 *
 *  · Les mides són les de l'arqueòleg: Josep Mª Segura Martí (Eines 7-8, 1987;
 *    reproduït a l'article WP 3656 i al corpus del Rentonar, §14). Totes viuen
 *    a SEGURA_1987, cadascuna amb la línia del corpus d'on ix: este fitxer és
 *    l'única font de les cotes del Pou de Neu.
 *  · El dibuix divulgatiu 76150.jpg (18 m = 15 + 3, Ø 9,75 m) no mana sobre la
 *    geometria: és un esbós sense autor ni escala (ordre del Mestre, 261107).
 *  · Allò que cap font no dona (el gruix de la volta, la secció dels arcs, el
 *    terreny…) és a RECONSTRUCCIO, una xifra per línia i amb el motiu. El
 *    visor ho mostra com a reconstrucció, mai com a dada. `construeix()` no du
 *    cap altra xifra: només les de SEGURA_1987 i RECONSTRUCCIO (la prova ho
 *    comprova sobre el codi font).
 *  · Eixos: x cap a l'est, y cap amunt, z cap al sud. L'origen és el centre
 *    del fons del pou. El túnel d'accés va cap al sud (+z) i la galeria
 *    d'escorredor, cap a l'est (+x). L'orientació és esquemàtica
 *    (RECONSTRUCCIO.orientacio).
 *  · `distanciaAlSolid` és el camp de distància (SDF): positiu a l'aire i
 *    negatiu dins del sòlid. El shader (pouNeuInterior.js) en du la mateixa
 *    fórmula, i `materialAlPunt` la mateixa classificació de materials; ací
 *    servixen per a col·lisions, per a amagar cotes tapades i per a les proves.
 */
const CORPUS_SEGURA = 'Josep Mª Segura Martí (Eines 7-8, 1987), corpus del Rentonar';
const font = (valorM, unitat, linia, decimals = 2, nota = null) => Object.freeze({ valor: valorM, unitat, font: `${CORPUS_SEGURA}, l. ${linia}`, linia, decimals, nota });

/** Les mides de Josep Mª Segura Martí (1987), amb la línia del corpus. */
export const SEGURA_1987 = Object.freeze({
  diametreInterior: font(9.8, 'm', 990, 2, 'Diàmetre interior; l’esbós 76150 dona 9,75 m i 10 m, sense escala.'),
  fondariaFinestres: font(13.75, 'm', 990, 2, 'Fondària des del nivell de les boques o finestres superiors fins al fons.'),
  capacitat: font(1030, 'm³', 990, 0, 'Estimació de Segura; π·4,90²·13,75 ≈ 1.037 m³.'),
  tunel: font(9.1, 'm', 990, 2, 'Túnel amb volta rebaixada de maçoneria, de la boca fins a l’ingrés.'),
  galeria: font(29, 'm', 1031, 0, '29 m en línia recta; l’esbós 76150 la parteix en 24 + 5 m.'),
  gruixMur: font(1.5, 'm', 992, 2, 'Mesurat a la finestra de l’oest; els plànols donen el mateix gruix a tot el cilindre.'),
  finestraAmple: font(1.55, 'm', 992, 2, 'Mesurada a la finestra de l’oest; la Planta de Segura (l. 980) acota 1,55 m també a la del nord.'),
  finestraAlt: font(1.7, 'm', 992, 2, 'Altura màxima, amb volta rebaixada de maçoneria en sardinell; la secció A-B acota 1,70 m també a la de l’est.'),
  ingresTunel: font(10, 'm', 990, 2, 'Cota de l’ingrés sud sobre el fons (secció C-D).'),
  ingresAmple: font(1.35, 'm', 990),
  ingresAlt: font(1.55, 'm', 990),
  bocaTunelAmple: font(2.35, 'm', 990),
  bocaTunelAlt: font(2.1, 'm', 990, 2, 'El text diu «12,10 m d’altura»: probablement és la cota de la clau de la boca sobre el fons (10,00 + 2,10); la secció C-D dibuixa 2,10 m.'),
  galeriaAmple: font(0.5, 'm', 1031),
  galeriaAlt: font(0.7, 'm', 1031, 2, 'L’esbós 76150 parla d’una entrada de 43 cm; Segura dona 0,50 × 0,70 m.'),
});

const rec = (valor, motiu) => Object.freeze({ valor, motiu });

/** Xifres de reconstrucció: cap font del disc no les dona. Una per línia, amb el motiu. */
export const RECONSTRUCCIO = Object.freeze({
  orientacio: rec(0, 'Orientació esquemàtica (gir aplicat, en graus): finestres al N, W i E, túnel al S i galeria a l’E. La Planta de Segura gira les obertures uns 16° i fa eixir la galeria cap a l’ESE (≈119°).'),
  voltaArrencada: rec(13.75, 'Segura no dona la cota d’arrencada de la falsa volta: es pren la dels llindars de les finestres (13,75 m).'),
  voltaClau: rec(0.7, 'Gruix de la falsa volta a la clau, llegit en píxels a la secció de Segura (≈0,7 m).'),
  voltaRenyons: rec(null, 'Gruix als renyons de la volta: el del mur que Segura mesura a la finestra de l’oest (l. 992), que és a l’arrencada de la volta. El text mana sobre la lectura en píxels de la secció (≈1,4 m).'),
  forat: rec(0.6, 'Forat d’una pedra central caiguda, ja vist el 28 d’octubre de 2020 (corpus l. 919; carta a l’Ajuntament del 30-10-2020, l. 760) i fotografiat el 2023 (l. 648): sense mesura.'),
  finestraFletxa: rec(0.2, 'Fletxa (m) de la volta rebaixada en sardinell de les finestres: Segura en dona l’altura màxima (1,70 m), no la fletxa.'),
  finestresObertesUs: rec(3, 'Segura (l. 992): hui cegades amb obra, llevat de la de l’oest; no se sap quan es van cegar. Als segles d’ús es dibuixen les tres obertes.'),
  tunelFletxa: rec(0.35, 'Fletxa de la volta rebaixada del túnel, en fracció de l’ample: Segura no la dona.'),
  tunelVolta: rec(0.4, 'Gruix de la volta de maçoneria del túnel i dels seus murs: sense mesura. La volta cobrix els 9,10 m fins a la boca.'),
  tunelSol: rec(0, 'Pendent del sòl del túnel: es dibuixa pla; la secció C-D el fa pujar uns 0,5 m cap a la boca.'),
  arrencadaArcs: rec(13.0, 'Els quatre estreps són «entre l’ingrés (10 m) i les finestres (13,75 m)»; l’arc arrenca damunt.'),
  estrepAlt: rec(2.2, 'Altura dels estreps: Segura només diu que són entre l’ingrés i les finestres; es dibuixen de 10,80 a 13,00 m.'),
  estrepVolada: rec(0.18, 'Volada dels estreps de carreu sobre el parament interior: sense mesura.'),
  gruixArc: rec(0.5, 'Secció dels arcs de carreus de la primera coberta: sense mesura.'),
  ampleArc: rec(0.6, 'Amplada de l’intradós dels arcs: sense mesura.'),
  fase1Pendent: rec(0.5, 'Pendent de la teulada cònica de la 1a coberta. L’intradós es fa tangent a l’extradós dels arcs, que «subjectaria el trespol de teula» (l. 1003): el cim ix de la geometria dels arcs.'),
  fase1Gruix: rec(0.35, 'Gruix del trespol de teula de la 1a coberta: sense mesura.'),
  fase1Rafec: rec(0.3, 'Volada del ràfec de la 1a coberta sobre el mur: sense mesura.'),
  graons: rec(12, 'Graons buidats al mur davall de l’ingrés sud: Segura no en dona el nombre.'),
  graonsDisposicio: rec(0.09, 'Disposició dels graons: en hèlix, 0,09 rad de gir per graó, buidats uns 0,28 m al mur (caixes de 0,50 × 0,18 m): Segura només diu que hi són.'),
  pendentGaleria: rec(0.02, 'La galeria té «cert grau d’inclinació»: es pren un 2 %.'),
  nivellNeuHivern: rec(13.6, 'Il·lustratiu: Segura dona la capacitat (1.030 m³), no el nivell; a l’hivern el pou es dibuixa quasi ple.'),
  nivellNeuEstiu: rec(4.5, 'Il·lustratiu: a l’estiu el pou es dibuixa buidant-se; cap font no en dona el nivell.'),
  terrenyOest: rec(13.75, 'Secció A-B: el terreny de l’oest i del nord és arran dels llindars de les finestres.'),
  pendentEst: rec(0.52, 'Secció A-B: a l’est el terreny cau uns 14 m en uns 30 m fins a l’eixida de la galeria.'),
  pendentSud: rec(0.2, 'Secció C-D: el terreny passa per damunt del túnel i baixa poc a poc fins a la boca; damunt de la volta queden de 2,2 m a 0,15 m de terra.'),
  talusBoca: rec(0.15, 'A la boca el terreny cau en talús fins a 0,15 m davall del sòl del túnel: la boca ix al vessant a la cota de 10 m.'),
  replanaBoca: rec(1.5, 'Replana d’1,5 m davant de la boca abans que el vessant sud continue baixant.'),
  pendentVessant: rec(0.25, 'Pendent del vessant sud més enllà de la replana: sense mesura.'),
  paredo: rec(null, 'Segura (l. 984): «un paredó circular que, a mode de talús, l’envolta» per l’est. No es dibuixa: no en dona cap mesura.'),
});

const rc = (clau) => RECONSTRUCCIO[clau].valor;
const sg = (clau) => SEGURA_1987[clau].valor;

/** Les dues cobertes que documenta Segura (corpus, l. 1003, 1020 i 1063). */
export const COBERTES = Object.freeze(['fase2', 'fase1']);

function construeix() {
  const R = sg('diametreInterior') / 2;
  const alcadaCilindre = sg('fondariaFinestres');
  const gir = rc('orientacio') * Math.PI / 180;
  return Object.freeze({
    R,
    alcadaCilindre,
    // Segura: «una perfecta coberta hemisfèrica» per aproximació de filades.
    fletxa: R,
    voltaArrencada: rc('voltaArrencada'),
    alcadaInterior: rc('voltaArrencada') + R,
    gruixMur: sg('gruixMur'),
    // L4-ARQ-04 · Als renyons, el gruix del mur de Segura (RECONSTRUCCIO.voltaRenyons diu per què).
    volta: Object.freeze({ clau: rc('voltaClau'), renyons: sg('gruixMur'), forat: rc('forat') }),
    finestres: Object.freeze([
      // Tres ingressos superiors (nord, oest i est); hui només el de l'oest és obert (corpus, l. 992).
      Object.freeze({ id: 'nord', angle: gir - Math.PI / 2, obertaHui: false }),
      Object.freeze({ id: 'oest', angle: gir + Math.PI, obertaHui: true }),
      Object.freeze({ id: 'est', angle: gir, obertaHui: false }),
    ]),
    finestra: Object.freeze({ llindar: alcadaCilindre, ample: sg('finestraAmple'), alt: sg('finestraAlt'), fletxa: rc('finestraFletxa') }),
    tunel: Object.freeze({
      longitud: sg('tunel'), cota: sg('ingresTunel'),
      ampleIngres: sg('ingresAmple'), altIngres: sg('ingresAlt'),
      ampleBoca: sg('bocaTunelAmple'), altBoca: sg('bocaTunelAlt'),
      fletxa: rc('tunelFletxa'), volta: rc('tunelVolta'),
    }),
    galeria: Object.freeze({ longitud: sg('galeria'), ample: sg('galeriaAmple'), alt: sg('galeriaAlt'), pendent: rc('pendentGaleria') }),
    arcs: Object.freeze({ arrencada: rc('arrencadaArcs'), gruix: rc('gruixArc'), ample: rc('ampleArc'), estrepAlt: rc('estrepAlt'), estrepVolada: rc('estrepVolada') }),
    fase1: Object.freeze({ pendent: rc('fase1Pendent'), gruix: rc('fase1Gruix'), rafec: rc('fase1Rafec') }),
    graons: rc('graons'),
    graoPas: rc('graonsDisposicio'),
    terreny: Object.freeze({
      cotaOest: rc('terrenyOest'), pendentEst: rc('pendentEst'), pendentSud: rc('pendentSud'),
      cotaReplana: sg('ingresTunel') - rc('talusBoca'), replana: rc('replanaBoca'), pendentVessant: rc('pendentVessant'),
    }),
  });
}

export const POU_RENTONAR = construeix();

/** Volum útil (m³): el cilindre fins a les finestres, com el calcula Segura (1.030 m³). */
export function volumUtil(g = POU_RENTONAR) {
  return Math.PI * g.R ** 2 * g.alcadaCilindre;
}

/** Nivell de la neu (m sobre el fons), il·lustratiu: plé a l'hivern, buidant-se a l'estiu, buit hui. */
export const NIVELLS_NEU = Object.freeze({ hivern: rc('nivellNeuHivern'), estiu: rc('nivellNeuEstiu'), hui: 0 });
export const ESTACIONS_INTERIOR = Object.freeze(Object.keys(NIVELLS_NEU));

/* ── Camps de distància (mateixa fórmula que el shader) ── */
const len2 = (x, y) => Math.hypot(x, y);
const len3 = (x, y, z) => Math.hypot(x, y, z);
const clamp01 = (v) => Math.min(1, Math.max(0, v));
function caixa(px, py, pz, bx, by, bz) {
  const qx = Math.abs(px) - bx, qy = Math.abs(py) - by, qz = Math.abs(pz) - bz;
  return len3(Math.max(qx, 0), Math.max(qy, 0), Math.max(qz, 0)) + Math.min(Math.max(qx, qy, qz), 0);
}
/** La boca del túnel (z) i la secció del túnel a la distància z (s'estreny cap a dins). */
const bocaZ = (g) => g.R + g.tunel.longitud;
function seccioTunel(z, g) {
  const t = g.tunel;
  const s = clamp01((z - g.R) / t.longitud);
  return { ample: t.ampleIngres + (t.ampleBoca - t.ampleIngres) * s, alt: t.altIngres + (t.altBoca - t.altIngres) * s };
}
/**
 * Cota del terreny (reconstrucció, de les seccions A-B i C-D) en (x, z): pla a
 * l'oest i al nord, vessant a l'est, i al sud la coberta del túnel fins a la
 * boca, el talús de la boca, la replana i el vessant.
 */
export function cotaTerreny(x, z, g = POU_RENTONAR) {
  const T = g.terreny, vora = g.R + g.gruixMur, boca = bocaZ(g);
  const est = T.cotaOest - T.pendentEst * Math.max(0, x - vora);
  const vessant = T.cotaReplana - T.pendentVessant * Math.max(0, z - boca - T.replana);
  const sud = z <= boca ? Math.max(T.cotaOest - T.pendentSud * Math.max(0, z - vora), vessant) : vessant;
  return Math.min(est, sud);
}
/** Terreny com a camp (negatiu davall). El factor 0,75 manté la distància per davall de la real. */
function distanciaTerreny(x, y, z, g) {
  const T = g.terreny, vora = g.R + g.gruixMur, boca = bocaZ(g);
  const est = (y - (T.cotaOest - T.pendentEst * Math.max(0, x - vora))) * 0.75;
  const coberta = Math.max((y - (T.cotaOest - T.pendentSud * Math.max(0, z - vora))) * 0.75, z - boca);
  const vessant = (y - (T.cotaReplana - T.pendentVessant * Math.max(0, z - boca - T.replana))) * 0.75;
  return Math.max(est, Math.min(coberta, vessant));
}
/** Secció de volta rebaixada (2D: x lateral, y des del sòl). `fletxa` és una fracció de l'ample. */
function seccioRebaixada(x, y, ample, alt, fletxa) {
  const f = fletxa * ample;
  const radi = ((ample / 2) ** 2 + f * f) / (2 * f);
  const centre = alt - radi;
  return Math.max(Math.abs(x) - ample / 2, -y, Math.min(y - (alt - f), len2(x, y - centre) - radi));
}
/**
 * La teulada cònica de la 1a coberta (reconstrucció): l'intradós és tangent a
 * l'extradós dels arcs creuats (radi R des de l'arrencada), així que el trespol
 * descansa sobre els arcs. `tangencia` és el radi on toca.
 */
export function teuladaFase1(g = POU_RENTONAR) {
  const p = g.fase1.pendent, k = Math.hypot(1, p);
  return { cim: g.arcs.arrencada + g.R * k, pendent: p, gruix: g.fase1.gruix, tangencia: g.R * p / k };
}
const plaTeulada = (r, y, cim, pendent) => (y - (cim - pendent * r)) / Math.hypot(1, pendent);
/** Les obertures de les finestres segons l'estat: als segles d'ús, les tres; hui, només l'oest. */
export function finestraOberta(f, estat) {
  return estat === 'hui' ? f.obertaHui : true;
}
/** Els graons només són dins d'esta capsa (N0-01): fora, el bucle no canvia la superfície. */
const prop = (x, y, z, r, g) => z > 3.5 && y < g.tunel.cota + 0.3 && Math.abs(x) < 3.2 && Math.abs(r - (g.R + 0.12)) < 0.6;
/**
 * Aire interior (negatiu dins). `estat` és hivern, estiu o hui; `coberta`,
 * fase2 (falsa cúpula, l'actual) o fase1 (arcs creuats i trespol de teula).
 */
export function distanciaAireInterior(x, y, z, { g = POU_RENTONAR, estat = 'hui', coberta = 'fase2' } = {}) {
  const r = len2(x, z);
  const H = g.alcadaCilindre, V = g.voltaArrencada;
  let aire = Math.max(r - g.R, -y, y - (H + 0.02));
  if (coberta === 'fase2') {
    // Falsa cúpula hemisfèrica sobre el cilindre.
    aire = Math.min(aire, Math.max(len3(x, y - V, z) - g.R, V - 0.4 - y));
    if (estat === 'hui') aire = Math.min(aire, Math.max(r - g.volta.forat / 2, V + g.R - 0.3 - y));
  } else {
    // Primera coberta: l'aire arriba fins a l'intradós del trespol, que descansa sobre els arcs (reconstrucció).
    const T = teuladaFase1(g);
    aire = Math.min(aire, Math.max(r - g.R, H - 0.4 - y, plaTeulada(r, y, T.cim, T.pendent)));
  }
  const F = g.finestra;
  for (const f of g.finestres) {
    const ux = Math.cos(f.angle), uz = Math.sin(f.angle);
    const radial = x * ux + z * uz, tangent = -x * uz + z * ux;
    const dins = g.R - 0.8, fora = finestraOberta(f, estat) ? g.R + g.gruixMur + 0.4 : g.R + 0.2;
    // Buit d'1,55 × 1,70 m amb volta rebaixada (la fletxa, en m, passa a fracció de l'ample).
    const seccio = seccioRebaixada(tangent, y - F.llindar, F.ample, F.alt, F.fletxa / F.ample);
    aire = Math.min(aire, Math.max(seccio, Math.abs(radial - (dins + fora) / 2) - (fora - dins) / 2));
  }
  const t = g.tunel, sec = seccioTunel(z, g);
  aire = Math.min(aire, Math.max(seccioRebaixada(x, y - t.cota, sec.ample, sec.alt, t.fletxa), g.R - 0.6 - z, z - (bocaZ(g) + 0.5)));
  const gal = g.galeria;
  const sol = -gal.pendent * Math.max(0, x - g.R);
  aire = Math.min(aire, Math.max(Math.abs(z) - gal.ample / 2, sol - y, y - (sol + gal.alt), g.R - 0.4 - x, x - (g.R + gal.longitud + 0.5)));
  // Graons buidats al mur davall de l'ingrés sud (reconstrucció del nombre i de la disposició).
  if (prop(x, y, z, r, g)) {
    for (let i = 0; i < g.graons; i++) {
      const yi = t.cota - (i + 1) * (t.cota / (g.graons + 1));
      const ang = Math.PI / 2 + (i - g.graons / 2) * g.graoPas;
      const ux = Math.cos(ang), uz = Math.sin(ang);
      aire = Math.min(aire, caixa(-x * uz + z * ux, y - yi, x * ux + z * uz - (g.R + 0.12), 0.25, 0.09, 0.16));
    }
  }
  return aire;
}
/** La volta de maçoneria del túnel (ARQ-01): de l'ingrés fins a la boca, amb el gruix de reconstrucció. */
function voltaTunel(x, y, z, g) {
  const t = g.tunel, sec = seccioTunel(z, g);
  const fora = seccioRebaixada(x, y - t.cota, sec.ample + 2 * t.volta, sec.alt + t.volta, t.fletxa);
  return Math.max(fora, g.R - z, z - bocaZ(g));
}
/** Cos de fàbrica (mur cilíndric, closca de la coberta i volta del túnel), negatiu dins. */
function distanciaFabrica(x, y, z, g, coberta) {
  const r = len2(x, z);
  const H = g.alcadaCilindre;
  const mur = Math.min(Math.max(r - (g.R + g.gruixMur), -y - 0.4, y - H), voltaTunel(x, y, z, g));
  if (coberta === 'fase1') {
    /* El mur puja amb el seu gruix fins a la teulada cònica de teula; el ràfec (reconstrucció) només
       és la llosa de la teulada que volta per fora del mur (L4-ARQ-04: a la finestra de l'oest el
       mur fa l'1,50 m de Segura, no 1,50 + ràfec). */
    const T = teuladaFase1(g);
    const sobre = plaTeulada(r, y, T.cim + T.gruix, T.pendent);
    const tambor = Math.max(sobre, H - y, r - (g.R + g.gruixMur));
    const rafec = Math.max(sobre, -plaTeulada(r, y, T.cim, T.pendent), H - y, r - (g.R + g.gruixMur + g.fase1.rafec));
    return Math.min(mur, tambor, rafec);
  }
  // Closca de la falsa volta: el·lipsoide exterior (renyons gruixuts, clau prima).
  const V = g.voltaArrencada;
  const a = g.R + g.volta.renyons, b = g.R + g.volta.clau;
  const k = len3(x / a, (y - V) / b, z / a);
  const closca = Math.max((k - 1) * Math.min(a, b), V - 1 - y, r - (g.R + g.gruixMur));
  return Math.min(mur, closca);
}
/**
 * Els arcs creuats de la primera coberta (NE-SW i NW-SE). A la fase 2 només en
 * queden els quatre estreps embotits al mur (corpus, l. 1003).
 */
export function distanciaArcs(x, y, z, { g = POU_RENTONAR, coberta = 'fase2' } = {}) {
  let d = Infinity;
  const A = g.arcs, arrenc = A.arrencada;
  const estrepMig = A.estrepAlt / 2, voladaMig = (A.estrepVolada + 0.06) / 2;
  for (const angle of [Math.PI / 4, -Math.PI / 4]) {
    const ux = Math.cos(angle), uz = Math.sin(angle);
    const al = x * ux + z * uz, tr = -x * uz + z * ux;
    // Estrep: carreu embotit 6 cm al mur, fins a l'arrencada.
    const radial = Math.abs(al) - (g.R - A.estrepVolada + voladaMig);
    d = Math.min(d, caixa(tr, y - (arrenc - estrepMig), radial, A.ample / 2, estrepMig, voladaMig));
    if (coberta !== 'fase1' || y < arrenc) continue;
    const anell = Math.abs(len2(al, y - arrenc) - (g.R - A.gruix / 2)) - A.gruix / 2;
    d = Math.min(d, Math.max(anell, Math.abs(tr) - A.ample / 2));
  }
  return d;
}
/** Els talls de la vista seccional (Segura publica A-B i C-D). */
export const TALLS = Object.freeze(['ab', 'cd', 'quart']);
/**
 * El semiespai que lleva cada tall, com a camp: 'ab' (secció A-B, W-E) lleva
 * z > 0; 'cd' (secció C-D, N-S pel túnel) lleva x > 0; 'quart' (com un motor
 * d'avió seccionat) lleva el quadrant x > 0 i z > 0. `true` val per 'ab'.
 */
export function campTall(x, z, tall) {
  if (tall === 'cd') return x;
  if (tall === 'quart') return Math.min(x, z);
  if (tall === 'ab' || tall === true) return z;
  return -Infinity;
}
/** Les peces del camp en un punt (les mateixes que el shader, en el mateix ordre). */
function peces(x, y, z, { g = POU_RENTONAR, nivellNeu = 0, tall = false, estat = 'hui', coberta = 'fase2' } = {}) {
  const terra = distanciaTerreny(x, y, z, g);
  const fab = distanciaFabrica(x, y, z, g, coberta);
  const aire = distanciaAireInterior(x, y, z, { g, estat, coberta });
  const arcs = distanciaArcs(x, y, z, { g, coberta });
  const neu = nivellNeu > 0 ? Math.max(len2(x, z) - g.R, y - nivellNeu, -y) : Infinity;
  return { terra, fab, aire, arcs, neu, tall: campTall(x, z, tall), g };
}
/**
 * Distància al sòlid més pròxim (positiva a l'aire). `nivellNeu` és la cota de
 * la neu; `tall` (false, 'ab', 'cd' o 'quart') lleva una part per a la vista de tall.
 */
export function distanciaAlSolid(x, y, z, opcions = {}) {
  const P = peces(x, y, z, opcions);
  let d = Math.max(Math.min(P.terra, P.fab), -P.aire);
  d = Math.min(d, P.arcs, P.neu);
  return Math.max(d, P.tall);
}
/**
 * El material del sòlid en un punt de la superfície, com el classifica el
 * shader: 'pedra' (maçoneria: mur, volta i túnel), 'terra' (sòl, galeria i
 * terreny), 'carreu' (arcs i estreps), 'neu', o la secció tallada
 * ('tall-pedra', 'tall-terra', 'tall-neu').
 */
export function materialAlPunt(x, y, z, opcions = {}) {
  const P = peces(x, y, z, opcions);
  const solid = Math.min(P.terra, P.fab);
  let d = Math.max(solid, -P.aire);
  let mat = P.terra < P.fab ? 'terra' : 'pedra';
  // VH-02: on l'aire talla l'obra, la cara és de maçoneria; el sòl i la galeria, de terra.
  if (-P.aire > solid && P.fab < -0.01 && y > 0.05) mat = 'pedra';
  if (P.arcs < d) { d = P.arcs; mat = 'carreu'; }
  if (P.neu < d) { d = P.neu; mat = 'neu'; }
  if (P.tall > d) {
    if (P.neu < 0) mat = 'tall-neu';
    else if (P.arcs < 0 || (P.fab < 0 && (len2(x, z) > P.g.R - 0.01 || y > 0))) mat = 'tall-pedra';
    else mat = 'tall-terra';
  }
  return mat;
}

const G = POU_RENTONAR;
/**
 * Sis estacions guiades d'un clic (posició en m; guinyada 0 = nord, positiva cap
 * a l'est). `cabotatgeNeu`, si hi és, val quan la neu de l'estat puja la càmera.
 */
export const CAMERES_GUIADES = Object.freeze([
  Object.freeze({ id: 'galeria', pos: [G.R + 7, 0.34, 0], guinyada: -90, cabotatge: 1, vol: true }),
  Object.freeze({ id: 'fons', pos: [0.8, 1.6, 1.2], guinyada: -20, cabotatge: 68, cabotatgeNeu: -35, vol: false }),
  Object.freeze({ id: 'arcs', pos: [0, 12.0, 3.6], guinyada: 0, cabotatge: 20, vol: true }),
  Object.freeze({ id: 'ingres-10m', pos: [0, G.tunel.cota + 1.15, G.R + 0.35], guinyada: 0, cabotatge: -40, vol: false }),
  Object.freeze({ id: 'boca-tunel', pos: [0, G.tunel.cota + 1.6, G.R + G.tunel.longitud - 0.6], guinyada: 0, cabotatge: -6, vol: false }),
  Object.freeze({ id: 'finestra-oest', pos: [-G.R - 0.7, G.finestra.llindar + 1.3, 0], guinyada: 90, cabotatge: -30, vol: false }),
]);
/** Vista de fora (inici del mode tall i càmera extra). */
export const CAMERA_FORA = Object.freeze({ id: 'fora', pos: [-17, 19.5, -12], guinyada: 125, cabotatge: -18, vol: true });

/**
 * Cotes de làmina que dibuixa el mode interior (dos extrems en m i la xifra amb
 * font). `seccio` diu en quina secció de Segura viu la cota: 'ab' (W-E, a la
 * meitat z ≤ 0), 'cd' (N-S, a la meitat x ≤ 0) o null (en totes dues). En el
 * tall 'ab' s'amaguen les 'cd', i a l'inrevés; el 'quart' les deixa totes.
 * VIS-05 · La profunditat i l'ingrés, que quedaven darrere del mur tallat, van
 * damunt del seu pla de tall (z = 0 i x = 0), com en una làmina; la galeria i la
 * finestra, que queien dins del sòlid, passen a l'aire (la galeria pel seu eix,
 * la finestra damunt de l'ampit). Així la càmera d'òrbita les veu als tres talls.
 */
export const COTES_INTERIOR = Object.freeze([
  Object.freeze({ id: 'diametre', mesura: SEGURA_1987.diametreInterior, seccio: 'ab', a: [-G.R, 0.15, 0], b: [G.R, 0.15, 0] }),
  Object.freeze({ id: 'profunditat', mesura: SEGURA_1987.fondariaFinestres, seccio: 'ab', a: [G.R - 0.25, 0, 0], b: [G.R - 0.25, G.alcadaCilindre, 0] }),
  Object.freeze({ id: 'ingres', mesura: SEGURA_1987.ingresTunel, seccio: 'cd', a: [0, 0, G.R - 0.25], b: [0, G.tunel.cota, G.R - 0.25] }),
  Object.freeze({ id: 'tunel', mesura: SEGURA_1987.tunel, seccio: 'cd', a: [-0.9, G.tunel.cota + 0.05, G.R], b: [-0.9, G.tunel.cota + 0.05, G.R + G.tunel.longitud] }),
  Object.freeze({ id: 'finestra', mesura: SEGURA_1987.finestraAmple, seccio: 'cd', a: [-G.R - 0.1, G.finestra.llindar + 0.05, -G.finestra.ample / 2], b: [-G.R - 0.1, G.finestra.llindar + 0.05, G.finestra.ample / 2] }),
  Object.freeze({ id: 'galeria', mesura: SEGURA_1987.galeria, seccio: 'ab', a: [G.R, 0.1, 0], b: [G.R + G.galeria.longitud, 0.1 - G.galeria.longitud * G.galeria.pendent, 0] }),
]);
/** Si una cota es dibuixa amb un tall: sense tall o amb el 'quart', totes; amb 'ab' o 'cd', les de la seua secció. */
export function cotaEnTall(cota, tall) {
  if (!tall || tall === 'quart' || !cota.seccio) return true;
  return cota.seccio === (tall === true ? 'ab' : tall);
}
