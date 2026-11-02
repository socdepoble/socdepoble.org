/** Guia editorial local. No llig dades de sessió ni publica en nom de ningú. */
const GUIES = Object.freeze([
  { id: 'vehicle', paraules: /\b(cotxe|vehicle|viatge|trajecte|coche|viaje)\b/, nom: 'Compartir cotxe', ruta: '/page/vehicle_compartit', camps: 'origen, destí, dia i hora, places, aportació i punt de trobada', titol: 'Compartim viatge de [origen] a [destí]', text: 'El [dia] eixiré de [origen] cap a [destí] a les [hora]. Tinc [places] places. Ens trobem a [lloc]. Aportació: [import o acord].' },
  { id: 'treball', paraules: /\b(treball|feina|faena|ofici|jornal|trabajo|empleo)\b/, nom: 'Treball i oficis', ruta: '/page/treball', camps: 'si oferixes o busques treball, ofici, poble, dedicació, remuneració i contacte', titol: '[Oferisc / busque] treball de [ofici] a [poble]', text: 'Busquem una persona per a [tasca] a [poble]. Dedicació: [horari]. Condicions i remuneració: [dades]. Inici: [dia].' },
  { id: 'habitatge', paraules: /\b(habitatge|lloguer|llogar|pis|casa|vivienda|alquiler|alquilar)\b/, nom: 'Habitatge', ruta: '/page/habitatge', camps: 'lloguer o venda, poble, preu, habitacions, superfície, estat i condicions', titol: '[Lloguer / venda] de [pis / casa] a [poble]', text: 'Oferisc [tipus d’habitatge] a [poble], amb [habitacions] habitacions i [superfície] m². Preu: [import]. Estat i condicions: [detalls].' },
  { id: 'mercat', paraules: /\b(mercat|botiga|vendre|venc|compre|comprar|producte|mercado|tienda|vendo|vender|regale|regalar)\b/, nom: 'Mercat', ruta: '/mercat', camps: 'producte, estat, preu o intercanvi, quantitat, poble i una foto clara', titol: '[Producte] a [poble]', text: 'Oferisc [producte i quantitat]. Estat: [detalls]. Preu o intercanvi: [condicions]. Recollida a [poble].' },
  { id: 'calendari', paraules: /\b(calendari|acte|festa|event|evento|agenda)\b/, nom: 'Calendari', ruta: '/calendari', camps: 'nom de l’acte, dia, hora, lloc, organització i si cal inscripció', titol: '[Nom de l’acte] a [poble]', text: 'El [dia] a les [hora] ens trobem a [lloc] per a [activitat]. Organitza: [entitat]. Inscripció: [condicions].' },
  { id: 'mur', paraules: /\b(mur|muro|avis|anunci|publicacio|publicacion|noticia)\b/, nom: 'Mur', ruta: '/mur', camps: 'què passa, a qui va dirigit, poble, dia i lloc', titol: '[Què passa] a [poble]', text: 'El [dia] a [lloc], [explica què passa i a qui va dirigit]. Si vols saber-ne més, escriu-me pel Xat.' }
]);
const plega = (s) => s.normalize('NFD').replace(/\p{M}/gu, '').toLowerCase();
const DEMANA_REDACCIO = /\b(redacta|redactar|redactem|escriu|escriure|escribe|escribir|esborrany|borrador|prepara)\b/;
const DEMANA_GUIA = /\b(publicar|publique|publico|publicacio|publicacion|penjar|anunciar)\b/;

export function ajudaDePublicacioIAIA(pregunta) {
  if (typeof pregunta !== 'string' || !pregunta.trim() || pregunta.length > 2000) return null;
  const normal = plega(pregunta);
  const redacta = DEMANA_REDACCIO.test(normal);
  if (!redacta && !DEMANA_GUIA.test(normal)) return null;
  const guia = GUIES.find((g) => g.paraules.test(normal));
  if (!guia) return 'T’ajude a preparar la publicació. Digues si és per al Mur, Mercat, compartir cotxe, treball, habitatge o calendari, i conta’m què vols anunciar, en quin poble i per a quan. Pots guardar l’esborrany al Bloc de Notes: /notes';
  const passos = `Per a ${guia.nom}, prepara: ${guia.camps}.\nObri ${guia.ruta} per a consultar la secció. Pots redactar primer al Bloc de Notes (/notes), revisar la targeta amb «Proposa Card» i triar on publicar-la. La publicació només ix quan tu la confirmes; jo no l’he publicada.`;
  if (!redacta) return passos;
  // Amb dades explícites després del tipus d'anunci, conserva el relat de la
  // persona. No endevina noms, preus, horaris ni interpreta un 17:30 com a camp.
  const dades = /^[^\n:]{0,160}\b(?:anunci|publicació|publicacion|esborrany|borrador|text|notícia|noticia|oferta|mercat|mur|treball|habitatge|calendari)\s*:\s*([\s\S]+)$/iu.exec(pregunta)?.[1]?.trim();
  if (dades) return `Et deixe un esborrany amb les dades que m’has donat. Revisa el text i completa només la informació que falte:\n\nAnunci per a ${guia.nom}\n${dades}\n\n${passos}`;
  return `Et deixe una plantilla per a ${guia.nom}. Completa els camps entre claudàtors amb dades reals abans de publicar:\n\n${guia.titol}\n${guia.text}\n\n${passos}`;
}
