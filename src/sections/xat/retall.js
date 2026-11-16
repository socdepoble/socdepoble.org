/**
 * retall.js — l'objecte de transport entre el Xat i el Bloc de Notes.
 *
 * PER QUÈ VIU FORA DE XatSection.jsx: convertir missatges en una nota és una
 * transformació pura, sense React ni estat. Ací es pot llegir, raonar i provar
 * sense muntar mig arbre de components.
 *
 * SENSE DEPENDÈNCIES NOVES. Només `sanitize.js`, que ja és al projecte, i el
 * predicat i el text del missatge xifrat tancat de `conversa.js` (Onada R30).
 */
import { sanitizeHtml, netejaText } from '../../utils/sanitize.js';
import { esXifratTancat, textXifratTancat } from './conversa.js';

const ESCAPADES = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' };

/**
 * ESCAPAR NO ÉS SANEJAR, I L'ORDRE NO ÉS NEGOCIABLE.
 *
 * El text d'un missatge l'ha escrit una altra persona. Si es concatena cru dins
 * d'HTML, tens XSS emmagatzemat servit per l'editor de notes.
 *
 * I no es pot resoldre passant el text per DOMPurify: `sanitizeHtml` sobre text
 * pla destrossa «l'aigua < 5 litres» (vegeu l'avís de netejaText a sanitize.js).
 * Escapant PRIMER, `&lt;` ja és una entitat vàlida i travessa DOMPurify sencera.
 * Escapa → construïx → saneja. Mai a l'inrevés.
 */
function escapa(valor) {
  return String(valor ?? '').replace(/[&<>"']/g, (c) => ESCAPADES[c]);
}

/** 'Jo' per als propis; per als altres, el primer nom que el missatge porte. */
function autorDe(missatge) {
  if (missatge.sender === 'me') return 'Jo';
  return missatge.author || missatge.author_name || missatge.sender_name || 'Veí';
}

/**
 * ORDRE DE PREFERÈNCIA CORREGIT (260908). `time_label` ara SÍ que arriba, i val
 * "14:32" per als missatges de hui. Si es llegira primer, el retall guardat al
 * Bloc de Notes perdria el dia: dins d'una nota, «14:32» tot sol no diu res.
 * Primer la data completa; l'etiqueta és l'últim recurs.
 */
function horaDe(missatge, locale) {
  const brut = missatge.creatAl ?? missatge.createdAtTs ?? missatge.time ?? missatge.time_label ?? null;
  if (!brut) return '';
  const data = new Date(brut);
  if (Number.isNaN(data.getTime())) return String(brut);
  return data.toLocaleString(locale, {
    day: '2-digit', month: '2-digit', year: '2-digit', hour: '2-digit', minute: '2-digit'
  });
}

/* Onada R30 · R29-E2EE-02 (retall cap al Bloc de Notes; kit Gemini lot_01, arbitrat per Claude) · Un
   missatge xifrat que este dispositiu no ha pogut obrir no té cap text: abans, la nota en guardava una
   cita buida, sense dir per què. Ara el missatge triat es conserva al seu lloc (el recompte de la
   capçalera continua sent el de la tria) però MARCAT: el text serè de la bombolla, el mateix segons la
   causa (textXifratTancat: «en un altre dispositiu» només quan hi falta la clau), en cursiva com la
   làpida de la bombolla i mai com a paraules de l'autor ni amb el codi tècnic. Un esborrat mana, com a
   Bombolla.jsx. La còpia de seguretat el deixa fora perquè és una dada que es pot restaurar; una nota
   és un document per a llegir, i ometre'l en silenci li canviaria la tria a la persona. */
function cosDelMissatge(missatge, t) {
  const esborrat = Boolean(missatge.esborrat) || Boolean(missatge.esborratAl);
  if (!esborrat && esXifratTancat(missatge)) {
    const [clau, reserva] = textXifratTancat(missatge);
    return `<em>${escapa(typeof t === 'function' ? t(clau, reserva) : reserva)}</em>`;
  }
  return escapa(missatge.text ?? missatge.content ?? '').replace(/\n/g, '<br />');
}

/**
 * Construïx la nota a partir dels missatges triats.
 *
 * @param {object}   opcions
 * @param {object}   opcions.fil        Fil actiu (per al títol).
 * @param {object[]} opcions.missatges  Missatges triats, JA en ordre cronològic.
 * @param {string}   opcions.locale     'ca-ES' o 'es-ES'.
 * @param {Function} [opcions.t]        Traductor: només per al text serè d'un xifrat tancat.
 * @returns {{title: string, folderId: string, content: string}}
 */
export function construeixRetall({ fil, missatges, locale = 'ca-ES', t = null }) {
  const nomFil = fil?.name || fil?.title || 'Conversa';
  const quants = missatges.length;

  if (quants === 1 && missatges[0]?.esEsborranyIAIA === true) {
    const esborrany = missatges[0];
    const title = netejaText(escapa(esborrany.titolEsborrany || nomFil), 120);
    const paragrafs = String(esborrany.text ?? esborrany.content ?? '')
      .split(/\n{2,}/)
      .map((bloc) => bloc.trim())
      .filter(Boolean)
      .map((bloc) => `<p>${escapa(bloc).replace(/\n/g, '<br />')}</p>`)
      .join('\n');
    return {
      title,
      folderId: 'f-notes',
      content: sanitizeHtml(paragrafs)
    };
  }

  /* El títol acaba a `titleHtml` d'UniversalEditorShell, o siga que viatja com
     a HTML: el nom del fil el pot haver escrit un altre usuari i va escapat. */
  const title = netejaText(`Retall de «${escapa(nomFil)}»`, 160);

  const capcalera =
    `<p><em>${escapa(nomFil)} · ${quants} missatge${quants === 1 ? '' : 's'} · `
    + `retallat el ${escapa(new Date().toLocaleDateString(locale, { day: '2-digit', month: 'long', year: 'numeric' }))}</em></p>`;

  const cos = missatges.map((m) => {
    const hora = horaDe(m, locale);
    const text = cosDelMissatge(m, t);
    const signatura = hora ? `${escapa(autorDe(m))} · ${escapa(hora)}` : escapa(autorDe(m));
    return `<blockquote><p><strong>${signatura}</strong><br />${text}</p></blockquote>`;
  }).join('\n');

  /* Segona barrera. El contingut ja està escapat; DOMPurify només confirma que
     l'estructura que hem muntat nosaltres és la que dèiem que era.
     `createNote` NO saneja res al backend (P1 anotat): aquesta és l'única
     defensa del camí de creació. */
  return {
    title,
    /* 'f-notes' («Altres notes») existix al catàleg de noteFolders. El
       'general' per defecte de createNote NO existix i faria desaparéixer el
       retall en tocar qualsevol carpeta de la barra lateral (P0-4). */
    folderId: 'f-notes',
    content: sanitizeHtml(`${capcalera}\n${cos}`)
  };
}
