import { BookOpen, Landmark, Receipt } from 'lucide-react';

/* ═══════════════════════════════════════════════════════════════════
   APLICACIONS DEL PERFIL · configuració pura (sense React)

   Cada entrada és una utilitat que el Perfil mostra al grup APLICACIONS
   de la primera columna. Una utilitat nova s'endolla afegint-hi una
   entrada; una altra instància federada de Sóc de Poble pot passar la
   seua pròpia llista a PerfilShell (propietat `aplicacions`).

     · id          identificador estable: minúscules, xifres i guions
     · nom         el que es llig a la navegació i al títol de la pàgina
     · descripcio  una frase: què fa
     · icona       component de lucide-react (opcional)
     · estat       'pendent' (este node no té la secció) o 'connectada'
     · ruta        només amb 'connectada': la ruta interna de la secció

   Estes cinc utilitats encara no tenen una ruta connectada des del Perfil.
   Totes són 'pendent'; la seua fitxa permet triar si apareixen al Panell,
   sense prometre que el servei estiga disponible.
   ═══════════════════════════════════════════════════════════════════ */

export const ESTATS_APLICACIO = Object.freeze({
  pendent: 'Pendent de connectar en este node',
  connectada: 'Connectada en este node',
});

export const APLICACIONS = Object.freeze([
  Object.freeze({
    id: 'gestoria',
    nom: 'Gestoria de Poble',
    descripcio: 'Comptabilitat i facturació trimestral.',
    icona: Receipt,
    estat: 'pendent',
  }),
  Object.freeze({
    id: 'metriques',
    nom: 'Consola de Mètriques',
    descripcio: 'Monitorització i auditoria de la IA.',
    icona: Landmark, // TODO proper icon
    estat: 'pendent',
  }),
  Object.freeze({
    id: 'lector-rss',
    nom: 'Curation AI (Lector RSS)',
    descripcio: 'Agregador de notícies i resums intel·ligents.',
    icona: BookOpen,
    estat: 'pendent',
  }),
  Object.freeze({
    id: 'cervell',
    nom: 'Cervell (Node Graph)',
    descripcio: 'Mapa visual de relacions i categories.',
    icona: Landmark,
    estat: 'pendent',
  }),
  Object.freeze({
    id: 'snippet',
    nom: 'Snippet',
    descripcio: 'Extensió de Chrome per a desar webs al Bloc.',
    icona: BookOpen,
    estat: 'pendent',
  }),
]);

const ID_VALID = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const esText = (valor) => typeof valor === 'string' && valor.trim() !== '';
const esRutaInterna = (ruta) => typeof ruta === 'string' && ruta.startsWith('/') && !ruta.startsWith('//');
const esComponent = (icona) => typeof icona === 'function' || (typeof icona === 'object' && icona !== null);

/**
 * La llista que el Perfil pot pintar sense prometre res: fora les entrades
 * sense id vàlid o sense nom i els ids repetits (guanya la primera). Una
 * utilitat 'connectada' sense ruta interna es pinta com a 'pendent'.
 */
export function aplicacionsValides(llista) {
  if (!Array.isArray(llista)) return [];
  const vistos = new Set();
  const valides = [];
  for (const entrada of llista) {
    if (!entrada || !ID_VALID.test(String(entrada.id ?? '')) || !esText(entrada.nom) || vistos.has(entrada.id)) continue;
    vistos.add(entrada.id);
    const connectada = entrada.estat === 'connectada' && esRutaInterna(entrada.ruta);
    valides.push(Object.freeze({
      id: entrada.id,
      nom: entrada.nom.trim(),
      descripcio: esText(entrada.descripcio) ? entrada.descripcio.trim() : '',
      icona: esComponent(entrada.icona) ? entrada.icona : null,
      estat: connectada ? 'connectada' : 'pendent',
      ruta: connectada ? entrada.ruta : null,
    }));
  }
  return valides;
}
