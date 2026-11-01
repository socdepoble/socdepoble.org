/**
 * notaTutorial.js · IDEA-59 / P1-72 (ordre del Mestre, 261101 02:03 i 02:55,
 * punt 0: «regressió crítica») · La Card tutorial «Bloc de notes» (la mà amb
 * la ploma, public/assets/notes/bloc_notes_vintage.*) sempre és dins de
 * NOTES (Tot), també amb sessió.
 *
 * Per què havia desaparegut: la nota tutorial (n1) és una llavor local
 * (appSeed.js · NOTES_SEED). Només hi arriba en mode 'seed'
 * (localNotes.js · seeds); amb sessió, les notes són les files de la persona
 * a Supabase i n1 no hi és mai. L'entrada de /notes que l'obria (l'efecte de
 * NotesSection de 1e2f29b24, 18-09-2026) només actuava si n1 era a la llista,
 * i l'estat buit de l'editor, que pintava eixa mateixa Card en remot, va
 * deixar de veure's amb la «Nota sense títol» preparada a totes les entrades
 * de la navegació (P4, 94d14cfd2, Onada 3, 03-10-2026): l'espai de treball
 * hi trobava sempre un primer element a «Mur» i la triava.
 *
 * Ara, quan la llista ja és llesta i no porta la n1 (amb sessió, o si la
 * llavor local s'ha esborrat), el Bloc hi posa este element de NOMÉS
 * LECTURA: la mateixa nota de la llavor, a «Tot» (sense carpeta, categoria
 * ni etiqueta de la navegació), amb la fitxa de sempre (NotaFitxa) i, al
 * detall, l'estat buit de l'editor (la Card en lectura; el Foraster, la seua
 * còpia de prova). No es desa enlloc ni crea cap nota. En mode 'seed' la n1
 * de veres continua sent una nota editable del dispositiu.
 *
 * D-4 (decisió del Mestre, pla 261101_1246) · Les dues, la de veres i la de
 * lectura, són la primera fila de «Tot» amb qualsevol ordenació: el model de
 * vista de NotesSection (toWorkspaceNote) hi posa `fixatATot: true`, que
 * itemTutorial conserva en espargir-lo, i l'UniversalWorkspace el respecta
 * només a «Tot». «Mentre no estiga arxivada» només val per a la n1 de veres:
 * arxivada, ix de la llista. La de lectura no s'arxiva mai.
 *
 * T11-03 (marató 261101_2143, ordre del Mestre; D-M1, el defecte) · En mode
 * 'seed', arxivar, enviar a la paperera o esborrar la n1 de veres persistix:
 * NotesContext, en l'èxit de l'acció explícita amb la n1 i el mode de dades
 * resolt 'seed' (el de NotesSection), posa una marca per àmbit de
 * la cua (scopeKey) a les preferències del dispositiu (storage.js), i el Bloc
 * ja no hi torna a posar la Card de lectura. Abans hi tornava, fixada: la
 * llista local només porta notes actives i el Bloc no distingia una n1
 * arxivada d'una llavor esborrada. La marca mai amaga la n1 si hi és, i en
 * remot no compta. Es desfà a NotesSection (ambTutorial), en una línia.
 */
import { NOTES_SEED } from '../../data/appSeed.js';
import { getVal, setVal } from '../../config/storage.js';
import { ID_NOTA_BENVINGUDA } from './autoriaNota.js';

/** La nota tutorial de la llavor (n1), congelada. */
export const NOTA_TUTORIAL = Object.freeze(NOTES_SEED.find((nota) => nota.id === ID_NOTA_BENVINGUDA) || {});

/** El tipus d'element del Bloc per a la Card tutorial de lectura. */
export const KIND_TUTORIAL = 'tutorial';

/** Cert si la llista de notes ja porta la n1 (la nota de veres del mode 'seed'). */
export function portaLaNotaTutorial(notes) {
  return Array.isArray(notes) && notes.some((nota) => String(nota?.id) === ID_NOTA_BENVINGUDA);
}

/**
 * L'element de lectura de la Card tutorial a partir del model de vista d'una
 * nota (el de toWorkspaceNote, que NotesSection li passa ja fet): el
 * mateix títol, imatge, etiquetes i data, però només a «Tot».
 */
export function itemTutorial(itemDeNota) {
  if (!itemDeNota) return null;
  return { ...itemDeNota, kind: KIND_TUTORIAL, categoryIds: [] };
}

/* T11-03 · La marca de la n1 retirada, una per àmbit de la cua (actor,
   tenant i backend: una altra identitat del dispositiu no l'hereta). Sense
   àmbit no es llig ni s'escriu res. Síncrones i mai llancen (storage.js).
   NotesContext (recordaRetiradaDeLaN1) escriu la mateixa clau sense importar
   este fitxer, que porta la llavor fora del paquet d'arrencada. */
const clauDeRetirada = (scopeKey) => `notes.tutorialRetirada.${scopeKey}`;
const ambitValid = (scopeKey) => typeof scopeKey === 'string' && scopeKey !== '';

/** Cert si en este àmbit la persona ja ha retirat la n1 (només un true desat). */
export function tutorialRetirada(scopeKey) {
  return ambitValid(scopeKey) && getVal(clauDeRetirada(scopeKey), false) === true;
}

/** Desa la marca de l'àmbit; torna si ha quedat escrita. */
export function marcaTutorialRetirada(scopeKey) {
  return ambitValid(scopeKey) && setVal(clauDeRetirada(scopeKey), true);
}

export { ID_NOTA_BENVINGUDA };
