/**
 * auditoriaAparador.js — Sentinella 5 · Auditoria d'Aparador.
 *
 * Revisa, en local, la carpeta d'imatges d'un comerç abans que vagen a
 * l'aparador: format (JPEG, PNG o WebP), proporció 1:1 (Pedra Seca §8),
 * resolució, pes i si porten la ubicació GPS a l'EXIF. Llig les capçaleres en
 * bytes (imatges.js) i no decodifica cap imatge. La revisió estètica (llum,
 * enquadrament, fons) amb una IA multimodal només es proposa: este sentinella
 * no envia cap imatge enlloc. L0: no retalla, no comprimix i no esborra.
 */
import { avis, esObjecte, fitxersTriats, nomDe } from './comu.js';
import { FONTS_COMUNES, definixSentinella } from './contracte.js';
import { llegixCapcalera } from './imatges.js';

const LLINDARS = Object.freeze({ costatMinim: 800, costatMaxim: 4000, pesMaxim: 1500000, toleranciaQuadrat: 0.01 });
const NOMS_FORMAT = Object.freeze({ jpeg: 'JPEG', png: 'PNG', webp: 'WebP' });

const kB = (bytes) => `${Math.round(bytes / 1000)} kB`;
function proporcioDe(a, b) {
  const mcd = (x, y) => (y ? mcd(y, x % y) : x);
  const d = mcd(a, b);
  return `${a / d}:${b / d}`;
}

/**
 * @param {{ imatges: Array<{ nom: string, bytes: Uint8Array }> }} entrada
 */
export function observaAparador(entrada) {
  const avisos = [];
  const imatges = (esObjecte(entrada) && Array.isArray(entrada.imatges) ? entrada.imatges : []).filter(esObjecte);
  const linies = [];
  for (const imatge of imatges) {
    const nom = nomDe(imatge);
    const bytes = imatge.bytes instanceof Uint8Array ? imatge.bytes : new Uint8Array(0);
    const c = llegixCapcalera(bytes);
    if (!c.format) {
      avisos.push(avis('AP-FORMAT', 'roja', `«${nom}» no és JPEG, PNG ni WebP: l’aparador no el pot mostrar a tots els navegadors.`, nom));
      linies.push(`- ${nom}: format no admés`);
      continue;
    }
    const format = NOMS_FORMAT[c.format];
    if (!c.amplada || !c.alcada) {
      avisos.push(avis('AP-ILLEGIBLE', 'roja', `«${nom}» sembla ${format}, però no se’n poden llegir les dimensions: pot estar tallat.`, nom));
      linies.push(`- ${nom}: ${format} il·legible`);
      continue;
    }
    const llista = [];
    if (Math.abs(c.amplada - c.alcada) > Math.max(c.amplada, c.alcada) * LLINDARS.toleranciaQuadrat) {
      avisos.push(avis('AP-PROPORCIO', 'groga', `«${nom}» fa ${c.amplada}×${c.alcada} (${proporcioDe(c.amplada, c.alcada)}): l’aparador les vol quadrades (1:1).`, nom));
      llista.push('no és quadrada');
    }
    if (Math.min(c.amplada, c.alcada) < LLINDARS.costatMinim) {
      avisos.push(avis('AP-RESOLUCIO', 'groga', `«${nom}» té el costat curt de ${Math.min(c.amplada, c.alcada)} px: en calen almenys ${LLINDARS.costatMinim} perquè no es veja borrosa.`, nom));
      llista.push('poca resolució');
    } else if (Math.max(c.amplada, c.alcada) > LLINDARS.costatMaxim) {
      avisos.push(avis('AP-MASSA-GRAN', 'info', `«${nom}» fa ${Math.max(c.amplada, c.alcada)} px: es pot reduir a ${LLINDARS.costatMaxim} sense perdre res a l’aparador.`, nom));
    }
    if (bytes.length > LLINDARS.pesMaxim) {
      avisos.push(avis('AP-PES', 'groga', `«${nom}» pesa ${kB(bytes.length)}: per damunt de ${kB(LLINDARS.pesMaxim)} es fa lenta amb poca cobertura.`, nom));
      llista.push('pesa massa');
    }
    if (c.gps === true) {
      avisos.push(avis('AP-GPS', 'roja', `«${nom}» porta la ubicació GPS on es va fer la foto: lleva-la abans de publicar-la.`, nom));
      llista.push('porta la ubicació');
    } else if (c.gps === null) {
      avisos.push(avis('AP-GPS-DUBTE', 'groga', `«${nom}» porta un EXIF que no s’ha pogut llegir sencer: no es pot assegurar que no porte la ubicació.`, nom));
      llista.push('EXIF il·legible');
    } else if (c.exif) {
      avisos.push(avis('AP-EXIF', 'info', `«${nom}» porta metadades de càmera (EXIF), sense ubicació.`, nom));
    }
    linies.push(`- ${nom}: ${format} ${c.amplada}×${c.alcada}, ${kB(bytes.length)}${llista.length ? `; ${llista.join(', ')}` : '; correcta'}`);
  }
  if (!imatges.length) avisos.push(avis('AP-SENSE-IMATGES', 'info', 'No hi ha cap imatge a revisar.', 'entrada'));
  const informe = [
    `${imatges.length} imatges revisades en este ordinador (capçaleres, sense decodificar-les):`,
    ...linies,
    '',
    'Revisió estètica (llum, enquadrament, fons): només com a proposta, amb una IA multimodal que hauries d’activar tu. Este sentinella no envia cap imatge enlloc ni en canvia cap.'
  ];
  return { avisos, informe: informe.join('\n') };
}

const preparaAparador = (fitxers) => ({
  imatges: fitxersTriats(fitxers).map((f) => ({ nom: nomDe(f), bytes: f.bytes instanceof Uint8Array ? f.bytes : new Uint8Array(0) }))
});

export const SENTINELLA_APARADOR = definixSentinella({
  id: 'sentinella.auditoria-aparador',
  nom: 'Sentinella Auditoria d’Aparador',
  versio: '1.0.0',
  descripcio: 'Revisa en este ordinador les imatges d’un comerç abans de l’aparador: format, proporció 1:1, resolució, pes i si porten la ubicació GPS a l’EXIF.',
  disparador: [
    { tipus: 'carpeta', detall: 'Quan el comerç tria la carpeta d’imatges de l’aparador.' }
  ],
  llig: ['Les imatges que tries (JPEG, PNG o WebP): només les capçaleres i l’EXIF, en bytes'],
  escriu: ['Res: no retalla, no comprimix i no esborra cap imatge'],
  xarxa: 'cap',
  dadesPersonals: true,
  nivell: 'L0',
  eixida: ['bandera', 'informe'],
  superficie: { tipus: 'departament', departaments: ['Comerços'] },
  portaHumana: 'Assenyala què cal arreglar; publicar les imatges a l’aparador ho decidix i ho fa el comerç, i la revisió estètica amb IA només s’activa si ell ho demana.',
  proves: ['src/sections/tractors/sentinelles/auditoriaAparador.test.js'],
  llindars: { ...LLINDARS },
  fitxa: 'src/sections/tractors/sentinelles/fitxes/sentinella_auditoria_aparador.md',
  fonts: [...FONTS_COMUNES, 'src/sections/tractors/sentinelles/auditoriaAparador.js', 'src/sections/tractors/sentinelles/imatges.js'],
  entrada: {
    etiqueta: 'Imatges de l’aparador (JPEG, PNG o WebP)',
    ajuda: 'Pots triar-ne diverses alhora. No ixen d’este ordinador.',
    accepta: 'image/jpeg,image/png,image/webp,.jpg,.jpeg,.png,.webp',
    multiple: true,
    prepara: preparaAparador
  },
  observa: observaAparador
});
