/**
 * FilaConversa.jsx — la fila de la llista de converses (XAT-A09, UX-B01):
 * avatar, nom, hora de l'últim missatge, previsualització d'una línia i el
 * comptador de no llegits. Un botó de 72px (--sdp-xat-fila-mida).
 *
 * Onada 3 (T67 i T68, calc de WhatsApp Desktop, captura 19.11.50):
 *   · Un grup porta l'avatar de grup (icona de persones si no té imatge; el
 *     General d'una comunitat, la bafarada) i, quan l'últim missatge és d'una
 *     altra persona i la dada existix (`altres`), l'avanç «Nom: text».
 *   · Un canal («Avisos») porta sempre el megàfon, tinga o no imatge.
 *   · FilaComunitat: UNA fila per comunitat, amb l'avatar QUADRAT i les
 *     targetes apilades darrere, el nom en negreta, el xebró «›» en lloc de
 *     l'hora i, a la segona línia, els noms dels grups de dins. La pastilla
 *     suma els no llegits dels fills.
 *   · Cada distintiu té el seu text per a lectors de pantalla: mai només un
 *     dibuix o un color.
 *   · Selecció (T68): amb `seleccio`, la fila és una casella (role=checkbox,
 *     aria-checked) amb el cercle a l'esquerra, com a WhatsApp.
 */
import { BellOff, ChevronRight, Circle, CircleCheck, Megaphone, MessageCircleMore, Pin, Users } from 'lucide-react';
import { Avatar } from '../../../components/PedraSeca/index.js';
import PastillaNoLlegits from './PastillaNoLlegits.jsx';
import { etiquetaLlista } from '../temps.js';

const esCanal = (fil) => Boolean(fil?.esCanal) || fil?.tipus === 'canal';
const esGrup = (fil) => Boolean(fil?.esGrup) || fil?.tipus === 'grup';
/** Una comunitat no té missatges: la seua fila obri la fitxa. */
export const esComunitat = (fil) => Boolean(fil) && (fil.tipus === 'comunitat' || fil.esComunitat === true);

/** El text per a lectors de pantalla que diu quin tipus de fila és. */
export function etiquetaDeTipus(fil, t) {
  if (esComunitat(fil)) return t('section.xat.comunitat.etiqueta', 'Comunitat');
  if (esCanal(fil)) return t('section.xat.canal.etiqueta', "Canal d'avisos");
  if (esGrup(fil)) return t('section.xat.grup.etiqueta', 'Grup');
  return null;
}

/**
 * L'avatar d'un fil. Un canal («Avisos») porta SEMPRE el megàfon, com a
 * WhatsApp (captures 19.41.43, 19.42.54 i 19.43.00): a la llavor hereta la
 * imatge del primer participant i no és la seua. Un grup, la seua imatge o,
 * sense, la icona de persones (el General d'una comunitat, la bafarada). La
 * resta, la imatge o les inicials. `mida` 'sm' és la de la capçalera.
 */
export function AvatarFil({ fil, nom, mida = 'md' }) {
  if (esCanal(fil) || (!fil?.avatar_url && esGrup(fil))) {
    const Icona = esCanal(fil) ? Megaphone : (fil?.comunitatId ? MessageCircleMore : Users);
    return (
      <span className={`sdp-xat-avatar-icona${mida === 'sm' ? ' sdp-xat-avatar-icona--sm' : ''}`} aria-hidden="true">
        <Icona size={mida === 'sm' ? 20 : 24} aria-hidden="true" focusable="false" />
      </span>
    );
  }
  return <Avatar nom={nom} src={fil?.avatar_url} mida={mida} llavor={fil?.id} alt="" />;
}

/** La segona línia d'una comunitat: els noms dels grups de dins («Avisos, General»). */
export function nomsDelsGrups(fills = []) {
  return (Array.isArray(fills) ? fills : []).map((f) => f?.name || f?.title).filter(Boolean).join(', ');
}

/** L'avatar quadrat d'una comunitat, amb les targetes apilades darrere (CSS). */
export function AvatarComunitat({ fil, nom }) {
  return (
    <span className="sdp-xat-apilat" aria-hidden="true">
      <Avatar nom={nom} src={fil?.avatar_url} mida="md" llavor={fil?.id} alt="" className="sdp-xat-avatar--quadrat" />
    </span>
  );
}

/* Qui ha escrit l'últim missatge d'un grup, si no soc jo i la dada existix. */
function autorDeLUltim(fil, joId) {
  if (!(esGrup(fil) || esCanal(fil)) || !fil?.ultimAutorId || joId == null) return null;
  if (String(fil.ultimAutorId) === String(joId)) return null;
  const autor = Array.isArray(fil.altres) ? fil.altres.find((a) => a?.id != null && String(a.id) === String(fil.ultimAutorId)) : null;
  return autor?.nom || null;
}

/* La casella del mode de selecció: un cercle, ple quan està triada. */
function MarcaTria({ triada }) {
  return (
    <span className="sdp-xat-fila__tria" aria-hidden="true">
      {triada
        ? <CircleCheck size={24} aria-hidden="true" focusable="false" />
        : <Circle size={24} aria-hidden="true" focusable="false" />}
    </span>
  );
}

/* Atributs del botó: una fila normal o una casella de la selecció. */
function propsDeFila({ seleccio, activa, onPrem, classe }) {
  if (seleccio) {
    return {
      role: 'checkbox',
      'aria-checked': Boolean(seleccio.triada),
      className: `${classe} sdp-xat-fila--triable`,
      onClick: seleccio.onAlterna
    };
  }
  return { 'aria-current': activa ? 'true' : undefined, className: classe, onClick: onPrem };
}

export default function FilaConversa({ fil, activa = false, onSelect, locale, t, seleccio = null, joId = null }) {
  const nom = fil.name || fil.title || t('section.xat.conversaSenseNom', 'Conversa');
  const noLlegits = Number(fil.noLlegits) || 0;
  const ressaltada = noLlegits > 0 || Boolean(fil.noLlegitManual);
  const hora = etiquetaLlista(fil.ultimAl, { locale, t });
  const tipus = etiquetaDeTipus(fil, t);
  const autor = fil.ultimText ? autorDeLUltim(fil, joId) : null;
  const classe = `sdp-xat-fila${ressaltada ? ' sdp-xat-fila--nova' : ''}`;

  return (
    <button type="button" {...propsDeFila({ seleccio, activa, onPrem: () => onSelect(fil.id), classe })}>
      {seleccio ? <MarcaTria triada={seleccio.triada} /> : null}
      <AvatarFil fil={fil} nom={nom} />
      <span className="sdp-xat-fila__cos">
        <span className="sdp-xat-fila__cap">
          <span className="sdp-xat-fila__nom">
            {nom}
            {tipus ? <span className="sdp-nomes-lector">{`, ${tipus}`}</span> : null}
          </span>
          {hora ? <time className="sdp-xat-fila__hora" dateTime={fil.ultimAl || undefined}>{hora}</time> : null}
        </span>
        <span className="sdp-xat-fila__peu">
          <span className="sdp-xat-fila__previa">
            {autor ? `${autor}: ` : null}
            {fil.ultimText || t('section.xat.capMissatge', 'Cap missatge.')}
          </span>
          {fil.silenciat || fil.fixat ? (
            <span className="sdp-xat-fila__icones">
              {fil.silenciat ? (
                <>
                  <BellOff size={16} aria-hidden="true" focusable="false" />
                  <span className="sdp-nomes-lector">{t('section.xat.silenciada', 'Silenciada')}</span>
                </>
              ) : null}
              {fil.fixat ? (
                <>
                  <Pin size={16} aria-hidden="true" focusable="false" />
                  <span className="sdp-nomes-lector">{t('section.xat.fixada', 'Fixada')}</span>
                </>
              ) : null}
            </span>
          ) : null}
          <PastillaNoLlegits quants={noLlegits} t={t} />
        </span>
      </span>
    </button>
  );
}

/**
 * Una comunitat a la llista de Xats (T67): `comunitat` és una entrada de
 * useXat().comunitats ({ fil, fills, noLlegits, ultimAl }). Obri la fitxa, no
 * cap conversa.
 */
export function FilaComunitat({ comunitat, onObri, t, seleccio = null }) {
  const { fil, fills = [], noLlegits = 0 } = comunitat;
  const nom = fil.name || fil.title || t('section.xat.conversaSenseNom', 'Conversa');
  const grups = nomsDelsGrups(fills);
  /* La mateixa regla que «No llegits» (XatSection, passaFiltre): un fill
     marcat a mà com a no llegit també ressalta la comunitat. */
  const ressaltada = noLlegits > 0 || fills.some((f) => f?.noLlegitManual);
  const classe = `sdp-xat-fila sdp-xat-fila--comunitat${ressaltada ? ' sdp-xat-fila--nova' : ''}`;
  return (
    <button type="button" {...propsDeFila({ seleccio, activa: false, onPrem: () => onObri(fil.id), classe })}>
      {seleccio ? <MarcaTria triada={seleccio.triada} /> : null}
      <AvatarComunitat fil={fil} nom={nom} />
      <span className="sdp-xat-fila__cos">
        <span className="sdp-xat-fila__cap">
          <span className="sdp-xat-fila__nom">
            {nom}
            <span className="sdp-nomes-lector">{`, ${t('section.xat.comunitat.etiqueta', 'Comunitat')}`}</span>
          </span>
          <ChevronRight className="sdp-xat-fila__xebro" size={20} aria-hidden="true" focusable="false" />
        </span>
        <span className="sdp-xat-fila__peu">
          <span className="sdp-xat-fila__previa">{grups}</span>
          <PastillaNoLlegits quants={noLlegits} t={t} />
        </span>
      </span>
    </button>
  );
}
