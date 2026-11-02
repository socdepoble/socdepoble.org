/* B8C-6 (marató 261101_2143; Bloc B8, D-B8C-9) · La pàgina «Notificacions»
   del full Ajustos del Xat quan hi ha alguna cosa a oferir. És l'ÚNIC lloc on
   es demana el permís dels avisos: l'interruptor de Pedra Seca (Interruptor,
   onClick → onCanvi(!actiu), síncron), mai un bàner ni una pregunta en entrar.

   Presentacional: tot li arriba per `avisos` (useControlAvisosPush) i `t`.
     · oferit    → la targeta amb l'interruptor, la nota de l'estat (un sol
                   <p role="status">, SEMPRE muntat: buit i fora del flux amb
                   .sdp-sr-only quan no hi ha nota, perquè molts lectors de
                   pantalla no anuncien una regió viva que naix ja plena;
                   només en canvien el text i la classe, CORRECTOR
                   ARB-P05-04) i les notes fixes (l'avís és cec; en tancar
                   la sessió, este dispositiu deixa de rebre'n);
     · nomesNota → només la nota d'instal·lar a l'iPhone, sense interruptor.
   `desactivat={avisos.ocupat}` és el pany entre gestos: el registre no en
   serialitza dos de persones diferents, i un gest nou no pot matar la
   subscripció d'un altre que encara vola.

   Kit de Gemini (b8_ui_notificacions_xat_i_5_idiomes, auditat com a dada):
   se'n reprén la idea de tornar el focus al control quan acaba l'ocupat
   (desactivar un botó amb el focus el deixa caure a <body>). */
import { useEffect, useRef } from 'react';
import { Interruptor } from '../../../components/PedraSeca/index.js';
import { TEXTOS_AVISOS } from '../useAvisosPushXat.js';

const RESERVA = (_clau, reserva) => reserva;

export default function PaginaNotificacions({ avisos = null, t = RESERVA }) {
  const arrel = useRef(null);
  const ocupat = avisos?.ocupat === true;
  const ocupatPrevi = useRef(ocupat);

  /* Acabat l'ocupat, si el focus ha caigut a <body> (el control era
     desactivat), torna a l'interruptor. Si la persona ja és en un altre lloc,
     no se la mou. */
  useEffect(() => {
    const previ = ocupatPrevi.current;
    ocupatPrevi.current = ocupat;
    if (ocupat || !previ) return;
    const node = arrel.current;
    const doc = node?.ownerDocument;
    if (!doc || (doc.activeElement && doc.activeElement !== doc.body)) return;
    node.querySelector('[role="switch"]')?.focus();
  }, [ocupat]);

  if (!avisos || (!avisos.oferit && !avisos.nomesNota)) return null;
  const notes = Array.isArray(avisos.notes) ? avisos.notes : [];
  const nota = avisos.oferit && avisos.nota && typeof avisos.nota.text === 'string' && avisos.nota.text ? avisos.nota : null;
  /* Buida, la regió viva no ocupa cap fila de la reixeta del grup (cap gap de més). */
  let classeEstat = 'sdp-sr-only';
  if (nota) classeEstat = nota.error ? 'sdp-xat-ajustos__nota sdp-xat-ajustos__nota--error' : 'sdp-xat-ajustos__nota';

  return (
    <div className="sdp-xat-ajustos__grup" ref={arrel}>
      {avisos.oferit ? (
        <ul className="sdp-xat-ajustos__targeta">
          <li>
            <Interruptor
              className="sdp-xat-ajustos__interruptor"
              etiqueta={t(...TEXTOS_AVISOS.interruptor)}
              actiu={avisos.actiu === true}
              desactivat={avisos.ocupat}
              onCanvi={avisos.onCanvi}
              textosEstat={{ si: t('section.comu.si', 'Sí'), no: t('section.comu.no', 'No') }}
            />
          </li>
        </ul>
      ) : null}
      {avisos.oferit ? <p className={classeEstat} role="status">{nota ? nota.text : ''}</p> : null}
      {notes.map((text) => <p key={text} className="sdp-xat-ajustos__nota">{text}</p>)}
    </div>
  );
}
