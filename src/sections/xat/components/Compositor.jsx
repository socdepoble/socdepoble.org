/**
 * Compositor.jsx — el camp d'escriure (XAT-B01, XAT-B03, UX-A08).
 *
 *   · <textarea> que creix fins a 6 línies. El creixement és CSS pur: el
 *     contenidor és una graella amb un ::after que replica el text
 *     (data-valor) i marca l'alçada; cap style en línia ni mesura de DOM.
 *   · A l'escriptori, Retorn envia i Maj+Retorn fa salt de línia; en mode
 *     estret Retorn fa salt i s'envia amb el botó, com a les apps de
 *     missatgeria.
 *   · Límit de 4.096 caràcters amb comptador visible a partir de 3.900.
 *   · Cap botó d'adjuntar ni de micròfon: són F1 i la interfície no promet el
 *     que no fa.
 *   · Xat de pàgina (T63.2, T67): amb `fil`, si no s'hi pot escriure (els
 *     Avisos per a qui no n'és administrador) el compositor dona pas a l'avís
 *     que ho diu; si el fil té subjecte i s'hi pot escriure, un avís menut
 *     damunt recorda que és el xat públic d'una pàgina.
 *   · D7 (ordre del Mestre, 260930): els Avisos són estrictament
 *     unidireccionals. Un canal només mostra el formulari si `potEscriure`
 *     és exactament true; si el camp no arriba, és de només lectura
 *     (esNomesLectura). El servidor i localXat també ho rebutgen (SDP-XAT-011).
 *     En mode llavor qualsevol persona amb sessió és propietària de l'entitat
 *     pilot i, per tant, escriu als Avisos (identitatsSeed.js): la regla no
 *     es toca ací.
 *   · Respostes (torn 260930, T1): `barra` (la BarraResposta) es pinta just
 *     damunt del formulari, i Escape dins del camp crida `onEscapa` (cancel·la
 *     la resposta) i queda consumit (preventDefault). `campRef` dona el
 *     textarea a Conversa, que hi porta el focus en triar «Respon».
 *   · Qui signa (pla 261014_1450, front C): una línia damunt del formulari
 *     diu amb quina veu ix el que s'envia (quiSigna). La decidix el servidor
 *     per fil, no la barra negra; `entitatActiva` (useXat, per Conversa) només
 *     servix perquè, si la barra diu una entitat i el fil el signa la persona,
 *     també es diga.
 */
import { Building2, Megaphone, Send, UserRound, Users } from 'lucide-react';
import { useAppGrid } from '../../../components/layout/AppGridShell.jsx';

export const LIMIT_TEXT = 4096;
export const LLINDAR_COMPTADOR = 3900;
/* Pla 261014_1450 (front C) · Id estable de la línia de qui signa (n'hi ha un sol
   compositor a la pantalla, com el seu textarea, #xat-message-input). */
const ID_SIGNA = 'xat-message-signa';
const ID_COMPTADOR = 'xat-message-comptador';

/** Cert si al fil no s'hi pot escriure: potEscriure false o un canal sense permís explícit (D7). */
export function esNomesLectura(fil) {
  if (!fil) return false;
  return fil.potEscriure === false || (fil.tipus === 'canal' && fil.potEscriure !== true);
}

/**
 * Pla 261014_1450 (front C) · Qui signa el que s'envia en este fil, o null si
 * no cal dir-ho. No ho decidix la barra negra sinó el servidor, per fil:
 *   · on parles en nom d'una entitat (xat_participants.com_org_id →
 *     fil.comEntitat, amb fil.entitatNom) signa ella;
 *   · als Avisos (tipus 'canal'), qui hi pot escriure la gestiona i hi signa
 *     com ella (migració 2609282100; localXat.js, enviaMissatge), encara que
 *     la llavor no hi pose comEntitat;
 *   · a la resta signa la persona (xat_envia, migració 2610081543). Si la
 *     barra diu una entitat, es diu que ací no parles en nom seu.
 * Torna { tipus: 'entitat', nom } | { tipus: 'persona', entitat } | null.
 */
export function quiSigna(fil, entitatActiva = null) {
  if (!fil) return null;
  const nomEntitat = fil.entitatNom || null;
  /* El servidor diu que signa l'entitat però no en dona el nom: no es pot dir
     qui signa, i dir «com a tu» seria mentir. */
  if (fil.comEntitat === true) return nomEntitat ? { tipus: 'entitat', nom: nomEntitat } : null;
  /* Uns Avisos sense entitat no els pot signar cap entitat: signa la persona. */
  if (fil.tipus === 'canal' && fil.potEscriure === true && nomEntitat) return { tipus: 'entitat', nom: nomEntitat };
  if (entitatActiva?.nom) return { tipus: 'persona', entitat: entitatActiva.nom };
  return null;
}

export default function Compositor({
  valor, onCanvia, onEnvia, t, desactivat = false, fil = null,
  barra = null, onEscapa = null, campRef = null, entitatActiva = null
}) {
  if (esNomesLectura(fil)) {
    /* Gauntlet 261016 (Bloc 3.6.1) · Un fil de només lectura que no és uns
       Avisos (el xat de Javi Llinares per a qui no s'ha registrat, al xat de
       mostra) porta el seu avís ja traduït (`avisNomesLectura`): la mateixa
       línia i la mateixa classe, amb la icona de persona.
       Ordre del Mestre (261020, 23:30) · Botó blau clar «Registra't» per a
       facilitar l'accés directe a la pàgina de registre des del peu del xat. */
    const avisPropi = typeof fil.avisNomesLectura === 'string' && fil.avisNomesLectura ? fil.avisNomesLectura : null;
    const esDeMostra = Boolean(fil?.id?.startsWith('fake-') || avisPropi);
    return (
      <div className="sdp-xat-compositor-barra-avis">
        <p className="sdp-xat-compositor sdp-xat-compositor--avis" role="status">
          {avisPropi
            ? <UserRound size={20} aria-hidden="true" focusable="false" />
            : <Megaphone size={20} aria-hidden="true" focusable="false" />}
          <span>{avisPropi || t('section.xat.canal.nomesAdmins', 'En Avisos només escriuen els administradors.')}</span>
        </p>
        {esDeMostra ? (
          <a
            href="/registre?mode=entrar&tornar=%2Fxat"
            className="sdp-boto sdp-boto--primari sdp-xat-compositor__boto-registre"
          >
            {t('section.xat.fake.botoRegistrat', "Registra't")}
          </a>
        ) : null}
      </div>
    );
  }
  const titolPublic = fil?.subjecte ? (fil.subjecte.titol || fil.name || fil.title || '') : '';
  /* Pla 261014_1450 (front C) · Qui signa, amb la classe de l'avís públic.
     La línia descriu el camp: el textarea la cita
     a aria-describedby, i el lector de pantalla diu amb quina veu escrius en
     entrar-hi. Sense línia, el camp no cita cap id. */
  const signa = quiSigna(fil, entitatActiva);
  const camp = (
    <Formulari
      valor={valor} onCanvia={onCanvia} onEnvia={onEnvia} t={t} desactivat={desactivat}
      onEscapa={onEscapa} campRef={campRef} idSigna={signa ? ID_SIGNA : null}
    />
  );
  const avisSigna = signa ? (
    <p className="sdp-xat-avis-public" id={ID_SIGNA}>
      {signa.tipus === 'entitat'
        ? <Building2 size={16} aria-hidden="true" focusable="false" />
        : <UserRound size={16} aria-hidden="true" focusable="false" />}
      <span>
        {signa.tipus === 'entitat'
          ? t('section.xat.signa.entitat', 'Escrius com a {nom}.').replace('{nom}', signa.nom)
          : t('section.xat.signa.persona', 'Escrius com a tu: en esta conversa no parles en nom de {entitat}.').replace('{entitat}', signa.entitat)}
      </span>
    </p>
  ) : null;
  /* Sempre el mateix arbre (la barra i l'avís de qui signa poden ser null):
     si canviara de forma en obrir o tancar la resposta, React tornaria a
     muntar el textarea i el focus es perdria en enviar o en cancel·lar.
     L'avís de qui signa va sempre primer, i el camp no canvia de lloc quan
     la línia apareix o desapareix dins del mateix àmbit: el nom de l'entitat
     que arriba tard (el de la barra o el del fil) o el fil que refresca
     comEntitat. Canviar d'actor a la barra negra no passa per ací: canvia
     ambitEstable (XatContext.jsx) i XatSection torna a muntar l'espai sencer
     per key. */
  const formulari = <>{avisSigna}{barra}{camp}</>;
  if (!fil?.subjecte) return formulari;
  return (
    <>
      <p className="sdp-xat-avis-public">
        <Users size={16} aria-hidden="true" focusable="false" />
        <span>{t('section.xat.pagina.avisPublic', 'Escrius al xat públic de «{titol}».').replace('{titol}', titolPublic)}</span>
      </p>
      {formulari}
    </>
  );
}

function Formulari({ valor, onCanvia, onEnvia, t, desactivat, onEscapa, campRef, idSigna = null }) {
  const { mida } = useAppGrid();
  const estret = mida === 'estret';
  const buit = !String(valor ?? '').trim();
  const llargada = String(valor ?? '').length;
  const mostraComptador = llargada >= LLINDAR_COMPTADOR;
  /* Pla 261014_1450 (front C) · Qui signa i el comptador, cadascun només si es
     pinta: cap id penjat a un element que no existix. */
  const descritPer = [idSigna, mostraComptador ? ID_COMPTADOR : null].filter(Boolean).join(' ') || undefined;

  const envia = () => {
    if (buit || desactivat) return;
    onEnvia();
  };

  const alTeclat = (e) => {
    if (e.key === 'Escape' && typeof onEscapa === 'function') {
      e.preventDefault();
      onEscapa();
      return;
    }
    if (e.key !== 'Enter' || estret || e.shiftKey || e.altKey || e.ctrlKey || e.metaKey) return;
    if (e.nativeEvent?.isComposing) return;
    e.preventDefault();
    envia();
  };

  /* --comptador: amb la barra de resposta damunt, el compositor reserva
     l'alçada del comptador perquè no es pinte damunt de la cita (revisió
     adversarial 260930, #13; modules.css). Sense barra no canvia res. */
  return (
    <form
      className={`sdp-xat-compositor${mostraComptador ? ' sdp-xat-compositor--comptador' : ''}`}
      onSubmit={(e) => { e.preventDefault(); envia(); }}
    >
      <div className="sdp-xat-compositor__camp" data-valor={valor}>
        <textarea
          ref={campRef}
          id="xat-message-input"
          name="message"
          className="sdp-xat-compositor__textarea"
          rows={1}
          value={valor}
          maxLength={LIMIT_TEXT}
          onChange={(e) => onCanvia(e.target.value)}
          onKeyDown={alTeclat}
          placeholder={t('section.xat.composePlaceholder', 'Escriu un missatge...')}
          aria-label={t('section.xat.compositor.etiqueta', 'Escriu un missatge')}
          aria-describedby={descritPer}
          enterKeyHint={estret ? 'enter' : 'send'}
          disabled={desactivat}
        />
        {mostraComptador ? (
          <span
            id={ID_COMPTADOR}
            className={`sdp-xat-compositor__comptador${llargada >= LIMIT_TEXT ? ' sdp-xat-compositor__comptador--limit' : ''}`}
            aria-live="polite"
          >
            {t('section.xat.compositor.comptador', '{n} de {max} caràcters')
              .replace('{n}', String(llargada))
              .replace('{max}', String(LIMIT_TEXT))}
          </span>
        ) : null}
      </div>
      <button
        type="submit"
        className="sdp-xat-compositor__envia"
        aria-label={t('section.xat.compositor.envia', 'Envia')}
        disabled={buit || desactivat}
      >
        <Send size={20} aria-hidden="true" focusable="false" />
      </button>
    </form>
  );
}
