/**
 * problemesConsola.js — els problemes que una targeta de la Consola diu a la
 * vista, purs (Onada 6, requisit 9).
 *
 * «Informació en superfície: tot el que conté cada targeta (resum, estat,
 * problemes) s'ha de mostrar a les pastilles exteriors de manera visible,
 * sense necessitat de fer clic.» Un problema és { clau, text, ruta?, marca?,
 * to? }: el text es llig tal qual (el nom d'una skill, un codi d'avís, l'id
 * d'una tasca); la ruta va en <Mono>, que el mode privacitat amaga; la marca
 * és una insígnia amb el color del semàfor (to d'Insignia), perquè la llista
 * també faça de semàfor (requisit 8): la severitat d'un avís, l'estat d'una
 * tasca o el color d'una skill a l'Inventari. La targeta (peces.jsx ·
 * TargetaConsola) en pinta com a molt MAX_PROBLEMES_TARGETA i diu quants en
 * queden.
 *
 * Només importa peces pures sense cap import de la Consola (semafor.js i
 * grafMapa.js): el tauler (consolaPagines.js) i les xifres (xifresMas.js,
 * xifresVistes.js) en compartixen les peces sense cap cicle.
 */
import { COLOR_DE_SEVERITAT, COLOR_D_ESTAT_TASCA, colorDAvisos, toDeColor } from './semafor.js';
import { TEXT_ESTAT } from './mapa/grafMapa.js';

export const MAX_PROBLEMES_TARGETA = 5;

const PES_SEVERITAT = Object.freeze({ alta: 0, mitjana: 1, baixa: 2 });
const PES_ESTAT_TASCA = Object.freeze({ mort: 0, 'declarat-sense-llancador': 1, 'llancador-sense-declaracio': 2, desconegut: 3 });
/* El nom que l'Inventari dona a cada color del semàfor (inventariMapa.js · semaforDe). */
const NOM_A_L_INVENTARI = Object.freeze({ roig: 'roig', taronja: 'ambre', verd: 'verd' });

/** La ruta d'una peça del Mapa: el seu id sense el tipus (document:.agents/LEDGER.md → .agents/LEDGER.md). */
export const rutaDelNode = (node) => String(node ?? '').replace(/^[a-z]+:/, '');

/** La marca d'una severitat del Mapa: la paraula i el seu color (alta, roig; mitjana i baixa, taronja). */
const marcaDeSeveritat = (severitat) => (typeof severitat === 'string' && severitat
  ? { marca: severitat, to: toDeColor(COLOR_DE_SEVERITAT[severitat] ?? 'taronja') }
  : {});

/** Un avís del Mapa com a problema: una skill pel seu nom; qualsevol altra peça, pel codi i la seua ruta; la marca, la severitat. */
export function problemaDAvis(a, i = 0) {
  const node = String(a?.node ?? '');
  const clau = `${node}|${a?.codi}|${i}`;
  const marca = marcaDeSeveritat(a?.severitat);
  if (node.startsWith('skill:')) return { clau, text: `${node.slice('skill:'.length)} · ${a?.codi}`, ...marca };
  return { clau, text: String(a?.codi ?? ''), ruta: rutaDelNode(node), ...marca };
}

/** Els avisos com a problemes, el més greu primer (dins de cada severitat, l'ordre del Mapa). */
export function problemesDAvisos(avisos) {
  return [...(avisos ?? [])]
    .map((a, i) => ({ a, i }))
    .sort((x, y) => (PES_SEVERITAT[x.a?.severitat] ?? 3) - (PES_SEVERITAT[y.a?.severitat] ?? 3) || x.i - y.i)
    .map(({ a, i }) => problemaDAvis(a, i));
}

/** Un problema que només és text (un nom de skill, un candat), amb la seua marca si en porta. */
export const problemaText = (clau, text, marca = null, to = 'neutre') => (marca
  ? { clau: String(clau), text: String(text), marca: String(marca), to }
  : { clau: String(clau), text: String(text) });

/** Un problema amb ruta: el text, i la ruta en <Mono>; la marca, si en porta. */
export const problemaRuta = (clau, text, ruta, marca = null, to = 'neutre') => (marca
  ? { clau: String(clau), text: String(text), ruta: String(ruta), marca: String(marca), to }
  : { clau: String(clau), text: String(text), ruta: String(ruta) });

/** Una tasca del Mapa com a problema: l'id, i el seu estat de marca amb el color del semàfor (COLOR_D_ESTAT_TASCA). */
export const problemaTasca = (t, clau = t?.id) => problemaText(clau, t?.id ?? '', TEXT_ESTAT[t?.estat] ?? t?.estat ?? 'desconegut',
  toDeColor(COLOR_D_ESTAT_TASCA[t?.estat] ?? 'taronja'));

/** Les tasques que no consten vives, la morta primer; a igualtat, per id. */
export function problemesDeTasques(tasques) {
  return (tasques ?? []).filter((t) => t?.estat !== 'viu')
    .sort((x, y) => (PES_ESTAT_TASCA[x.estat] ?? 9) - (PES_ESTAT_TASCA[y.estat] ?? 9) || String(x.id).localeCompare(String(y.id)))
    .map((t) => problemaTasca(t));
}

/** Un lloc on algú deixa la faena i ningú no declara que la llig: la seua ruta en <Mono>, taronja. */
export const problemaLloc = (clau, cami) => problemaRuta(clau, '', cami, 'sense lector', toDeColor('taronja'));

/* Un candat (actorsMapa.js · capesActors) que no està acreditat: sense
   consumidor, roig (com la seua etiqueta, SENSE CONSUMIDOR); per acreditar,
   taronja. */
const MARCA_CANDAT = Object.freeze({ false: ['sense consumidor', 'roig'], null: ['per acreditar', 'taronja'] });
/** Un candat com a problema: l'arnés i l'esdeveniment, i de marca el que li falta. */
export function problemaCandat(c, clau = c?.id) {
  const [marca, color] = MARCA_CANDAT[String(c?.acreditat ?? null)] ?? ['acreditat', 'verd'];
  return problemaText(clau, `${c?.arnes} · ${c?.esdeveniment}`, marca, toDeColor(color));
}
/** Els candats sense consumidor (primer) i els per acreditar; els acreditats no són cap problema. */
export const problemesDeCandats = (candats, prefix = '') => [
  ...(candats ?? []).filter((c) => c.acreditat === false).map((c) => problemaCandat(c, `${prefix}${c.id}`)),
  ...(candats ?? []).filter((c) => c.acreditat === null).map((c) => problemaCandat(c, `${prefix}${c.id}`))
];

/* La severitat més greu d'uns avisos (alta, mitjana o baixa). */
const severitatMesGreu = (avisos) => Object.keys(PES_SEVERITAT).find((s) => avisos.some((a) => a?.severitat === s)) ?? null;

/**
 * Una skill de l'Inventari (inventariMapa.js · skillsDelInventari) com a
 * problema: el nom i els codis dels avisos que la fan problema.
 *  · Sense `avisos` (tots els seus): la marca és el seu color a l'Inventari
 *    (roig, ambre), el mateix de la taula.
 *  · Amb `avisos` (només una part, p. ex. els del cens): la marca és la
 *    severitat més greu d'eixa part (alta, mitjana o baixa). No es diu
 *    «ambre» d'una skill que l'Inventari pinta roja per un altre avís: les
 *    targetes no es contradiuen (correcció de l'Onada 6, verificació visual).
 */
export function problemaDeSkill(skill, avisos = null) {
  const llista = avisos ?? skill?.avisos ?? [];
  const color = colorDAvisos(llista);
  const codis = [...new Set(llista.map((a) => a?.codi))].join(', ');
  const text = codis ? `${skill?.nom} · ${codis}` : String(skill?.nom ?? '');
  const marca = avisos ? severitatMesGreu(llista) : NOM_A_L_INVENTARI[color];
  return problemaText(skill?.id, text, marca, toDeColor(color));
}

/**
 * Els que es pinten i quants en queden: { visibles, resta }. La llista sencera
 * no es perd: la pàgina de la targeta la porta.
 */
export function retallaProblemes(problemes, max = MAX_PROBLEMES_TARGETA) {
  const llista = Array.isArray(problemes) ? problemes.filter(Boolean) : [];
  return { visibles: llista.slice(0, max), resta: Math.max(0, llista.length - max) };
}
