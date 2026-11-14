/**
 * canonImatgesNano.js · IDEA-250 (Onada R24) · Manifest canònic i guarda
 * executable de les 9 imatges mestres del Nano (Registre A · Bruguera i Berlanga).
 *
 * Blindatge d'estil multi-imatge («Style Lock»):
 *   · Prohibeix la generació cega només des de text per a vinyetes del Registre A.
 *   · Tota tirada nova ha d'adjuntar entre 3 i 4 imatges mestres aprovades d'este
 *     manifest com a referències visuals (`ImagePaths`), prioritzant la família
 *     de composició de l'escena (`carrer-coral`, `aparell-mecanic` o `primer-pla`).
 */

export const MIN_REFERENCIES_STYLE_LOCK = 3;
export const MAX_REFERENCIES_STYLE_LOCK = 4;
export const RESOLUCIO_QUADRADA_CANONICA_PX = 1600;

export const COMPOSICIONS_NANO = Object.freeze([
  'carrer-coral',
  'aparell-mecanic',
  'primer-pla'
]);

export const INVARIANTS_MORFOLOGIQUES_NANO = Object.freeze([
  'escenari-exterior-mediterrani-assolellat',
  'anatomia-brugueriana-i-vestimenta-valenciana',
  'accio-cinetica-teatral-i-psicologia-viva',
  'enginyeria-fusta-ferro-colat-i-robotets-bombeta',
  'trac-plumilla-negra-trames-i-aquarella-a-sang',
  'retols-fisics-integrats-i-valencia-impecable'
]);

export const CANON_9_IMATGES_MESTRES_NANO = Object.freeze([
  Object.freeze({
    id: 'disseny-vinyeta',
    camiAltaResolucio: 'public/assets/ui/plugins/disseny_vinyeta.jpg',
    camiPublic: '/assets/ui/plugins/disseny_vinyeta.jpg',
    composicio: 'carrer-coral',
    descripcioCanonica: 'Mur web de pedra seca en construcció estil 13, Rue del Percebe, arquitecte amb llacet, obrers cisellant pestanyes i iaia amb carretó al sol.'
  }),
  Object.freeze({
    id: 'snippet-tisores-rellamp',
    camiAltaResolucio: 'public/assets/nano_cards/snippet_nano_card.jpg',
    camiPublic: '/assets/nano_cards/snippet_nano_card.webp',
    composicio: 'aparell-mecanic',
    descripcioCanonica: 'Màquina gegant TISORES RELLAMP de fusta i ferro tallant el diari davant l’alqueria, amb gallines volant, ruc i tarongers.'
  }),
  Object.freeze({
    id: 'vehicle-seat-600',
    camiAltaResolucio: 'public/assets/nano_cards/vehicle_nano_card.jpg',
    camiPublic: '/assets/nano_cards/vehicle_nano_card.webp',
    composicio: 'carrer-coral',
    descripcioCanonica: 'SEAT 600 taronja carregat fins al sostre per un camí de terra entre marges de pedra seca, oliveres i la iaia dalt amb un gall.'
  }),
  Object.freeze({
    id: 'govern-certificacio',
    camiAltaResolucio: 'public/assets/nano_cards/govern_certificacio_nano_card.jpg',
    camiPublic: '/assets/nano_cards/govern_certificacio_nano_card.webp',
    composicio: 'primer-pla',
    descripcioCanonica: 'El Mestre amb boina i faixa roja segellant papers al carrer assolellat davant dos robotets quadrats de xapa amb bombeta al cap.'
  }),
  Object.freeze({
    id: 'cervell-tractor-placa',
    camiAltaResolucio: 'public/assets/ui/plugins/cervell_vinyeta.jpg',
    camiPublic: '/assets/ui/plugins/cervell_vinyeta.jpg',
    composicio: 'aparell-mecanic',
    descripcioCanonica: 'Cervell metàl·lic gegant reblonat sobre erugues de tractor dalt d’un cadafal a la plaça del poble, amb llauradors debatent i una cabra.'
  }),
  Object.freeze({
    id: 'calendari-agricola-gegant',
    camiAltaResolucio: 'public/assets/nano_cards/calendari_nano_card.jpg',
    camiPublic: '/assets/nano_cards/calendari_nano_card.webp',
    composicio: 'primer-pla',
    descripcioCanonica: 'CALENDARI AGRÍCOLA GEGANT de fusta clavat a la façana exterior, amb llaurador en faixa i espardenyes agafant-se el cap mentre li vola la boina.'
  }),
  Object.freeze({
    id: 'bascula-cooperativa',
    camiAltaResolucio: 'public/assets/ui/plugins/bascula_vinyeta.jpg',
    camiPublic: '/assets/ui/plugins/bascula_vinyeta.jpg',
    composicio: 'carrer-coral',
    descripcioCanonica: 'Pati assolellat de la cooperativa amb bàscula mecànica de 487 kg, llauradors amb pantalons apedaçats rient i iaia anotant a la llibreta.'
  }),
  Object.freeze({
    id: 'metriques-manometres-rurals',
    camiAltaResolucio: 'public/assets/nano_cards/metriques_nano_card.jpg',
    camiPublic: '/assets/nano_cards/metriques_nano_card.webp',
    composicio: 'aparell-mecanic',
    descripcioCanonica: 'Panell de fusta amb manòmetres rurals clavat entre tarongers i oliveres, bicicleta vella i dos uelos amb boina i faixa gratant-se el cap.'
  }),
  Object.freeze({
    id: 'drets-autor-cassola-arros',
    camiAltaResolucio: 'public/assets/nano_cards/drets_autor_comic.jpg',
    camiPublic: '/assets/nano_cards/drets_autor_comic.webp',
    composicio: 'primer-pla',
    descripcioCanonica: 'Iaia brugueriana amb monyo, nas de patata i cullera de fusta defensant la cassola d’arròs al carrer davant un inspector amb gavardina.'
  })
]);

const MAPA_PER_SUFIX = new Map(
  CANON_9_IMATGES_MESTRES_NANO.flatMap((entrada) => [
    [entrada.id, entrada],
    [entrada.camiAltaResolucio, entrada],
    [entrada.camiPublic, entrada]
  ])
);

function resolEntradaCanonica(referencia) {
  if (typeof referencia !== 'string') return null;
  const neta = referencia.trim().replace(/\\/g, '/');
  if (!neta) return null;
  if (MAPA_PER_SUFIX.has(neta)) return MAPA_PER_SUFIX.get(neta);
  for (const entrada of CANON_9_IMATGES_MESTRES_NANO) {
    if (neta.endsWith(`/${entrada.camiAltaResolucio}`) || neta.endsWith(entrada.camiPublic)) {
      return entrada;
    }
  }
  return null;
}

/**
 * Valida que una petició de generació d'imatge del Registre A incorpore
 * entre 3 i 4 referències visuals úniques del cànon oficial de 9 mestres.
 */
export function validaReferenciesStyleLockNano(referencies) {
  if (!Array.isArray(referencies)) {
    return Object.freeze({ ok: false, codi: 'format-invalid' });
  }
  if (referencies.length < MIN_REFERENCIES_STYLE_LOCK) {
    return Object.freeze({ ok: false, codi: 'poques-referencies', minim: MIN_REFERENCIES_STYLE_LOCK });
  }
  if (referencies.length > MAX_REFERENCIES_STYLE_LOCK) {
    return Object.freeze({ ok: false, codi: 'massa-referencies', maxim: MAX_REFERENCIES_STYLE_LOCK });
  }

  const resoltes = [];
  const vistes = new Set();
  for (const ref of referencies) {
    const entrada = resolEntradaCanonica(ref);
    if (!entrada) {
      return Object.freeze({ ok: false, codi: 'fora-del-canon', referencia: String(ref) });
    }
    if (vistes.has(entrada.id)) {
      return Object.freeze({ ok: false, codi: 'referencia-duplicada', id: entrada.id });
    }
    vistes.add(entrada.id);
    resoltes.push(entrada);
  }

  return Object.freeze({
    ok: true,
    imatges: Object.freeze(resoltes)
  });
}

/**
 * Tria deterministament entre 3 i 4 imatges mestres del cànon prioritzant
 * la família compositiva de l'escena demanada.
 */
export function seleccionaReferenciesPerComposicio(composicio = 'carrer-coral', total = MAX_REFERENCIES_STYLE_LOCK) {
  const limit = Math.min(MAX_REFERENCIES_STYLE_LOCK, Math.max(MIN_REFERENCIES_STYLE_LOCK, Number(total) || MAX_REFERENCIES_STYLE_LOCK));
  const principals = CANON_9_IMATGES_MESTRES_NANO.filter((e) => e.composicio === composicio);
  const suport = CANON_9_IMATGES_MESTRES_NANO.filter((e) => e.composicio !== composicio);
  return Object.freeze([...principals, ...suport].slice(0, limit));
}
