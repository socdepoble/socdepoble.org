/**
 * Arbre Genealògic · manifest sdp.app.v1 (P0-114, ordre del Mestre 261111).
 *
 * Etnogenealogia rural privada al dispositiu: entrevista d'una pregunta per torn
 * (malnom de la casa, mas o poble, G4 → G1), arbre Sosa-Stradonitz amb
 * branques col·laterals (FAN), 4 estats epistemològics i 4 precisions de
 * data, consultes i prompts copiables per als arxius públics, i GEDCOM
 * 7.0 / 5.5.1 i còpia JSON («Prepara, no publica»). L'app no cerca als
 * arxius ni envia res: genera textos que la persona copia.
 *
 * Contracte de la plataforma (src/apps/plataforma/manifestApp.js):
 *   · id 'genealogia' (la ruta és /app/genealogia, no es declara);
 *   · dadesPersonals 'salut': l'arbre porta dades de persones vives, i és
 *     l'únic valor que activa la guarda d'ama del document (sense iframe ni
 *     __SDP_EMBEDDED__) i el títol de pestanya sense noms ni dates;
 *   · P0-114: eina gratuïta oberta en producció (entorn 'produccio',
 *     actiuPerDefecte true); l'estat de proves (ESTAT_PROVES) el posa
 *     l'integrador a registrePlugins.js;
 *   · `carrega` darrere del literal de compilació EXACTE de baix: amb
 *     VITE_SDP_APP_GENEALOGIA=0 el build de producció no la porta;
 *   · icones de la llista tancada NOMS_ICONES (no n'hi ha cap d'arbre).
 */
export default {
  schema: 'sdp.app.v1',
  id: 'genealogia',
  titol: { ca: 'Arbre Genealògic', es: 'Árbol Genealógico', en: 'Family Tree', eu: 'Zuhaitz Genealogikoa', gl: 'Árbore Xenealóxica' },
  icona: 'Users',
  grups: [
    { id: 'recollir', titol: { ca: 'Recollir', es: 'Recoger', en: 'Gather', eu: 'Bildu', gl: 'Recoller' } },
    { id: 'mirar', titol: { ca: 'Mirar', es: 'Mirar', en: 'View', eu: 'Ikusi', gl: 'Mirar' } },
    { id: 'cercar', titol: { ca: 'Cercar', es: 'Buscar', en: 'Research', eu: 'Bilatu', gl: 'Buscar' } },
    { id: 'guardar', titol: { ca: 'Guardar', es: 'Guardar', en: 'Keep', eu: 'Gorde', gl: 'Gardar' } }
  ],
  entrades: [
    { slug: 'entrevista', titol: { ca: 'Entrevista', es: 'Entrevista', en: 'Interview', eu: 'Elkarrizketa', gl: 'Entrevista' }, icona: 'NotebookPen', grup: 'recollir' },
    { slug: 'persones', titol: { ca: 'Persones', es: 'Personas', en: 'People', eu: 'Pertsonak', gl: 'Persoas' }, icona: 'Contact', grup: 'recollir' },
    { slug: 'arbre', titol: { ca: 'Arbre i Sosa', es: 'Árbol y Sosa', en: 'Tree and Ahnentafel', eu: 'Zuhaitza eta Sosa', gl: 'Árbore e Sosa' }, icona: 'LayoutGrid', grup: 'mirar' },
    { slug: 'fan', titol: { ca: 'Germans, padrins i testimonis', es: 'Hermanos, padrinos y testigos', en: 'Siblings, godparents, witnesses', eu: 'Anai-arrebak, aitabitxiak, lekukoak', gl: 'Irmáns, padriños e testemuñas' }, icona: 'Users', grup: 'mirar' },
    { slug: 'arxius', titol: { ca: 'Arxius públics', es: 'Archivos públicos', en: 'Public archives', eu: 'Artxibo publikoak', gl: 'Arquivos públicos' }, icona: 'Landmark', grup: 'cercar' },
    { slug: 'prompts', titol: { ca: 'Prompts per a copiar', es: 'Prompts para copiar', en: 'Prompts to copy', eu: 'Kopiatzeko promptak', gl: 'Prompts para copiar' }, icona: 'ClipboardList', grup: 'cercar' },
    { slug: 'intercanvi', titol: { ca: 'GEDCOM i còpia', es: 'GEDCOM y copia', en: 'GEDCOM and backup', eu: 'GEDCOM eta kopia', gl: 'GEDCOM e copia' }, icona: 'Package', grup: 'guardar' },
    { slug: 'avis', titol: { ca: 'Avís i privacitat', es: 'Aviso y privacidad', en: 'Notice and privacy', eu: 'Oharra eta pribatutasuna', gl: 'Aviso e privacidade' }, icona: 'FileText', grup: 'guardar' }
  ],
  entradaPerDefecte: 'entrevista',
  permisos: { veure: 'public' },
  capacitats: [],
  nivell: 'gratuit',
  actiuPerDefecte: true,
  entorn: 'produccio',
  dadesPersonals: 'salut',
  carrega: import.meta.env.VITE_SDP_APP_GENEALOGIA !== '0' ? () => import('./AppGenealogia.jsx') : null
};
