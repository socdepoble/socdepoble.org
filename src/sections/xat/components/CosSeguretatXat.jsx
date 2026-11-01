/**
 * CosSeguretatXat.jsx — El cos del panell «Xifratge i número de seguretat» d'una
 * conversa (P1-12 pas 17; pla 261101_1246, T7 · S5; disseny E2EE §4.4 i §13).
 *
 * Presentacional: no importa cap mòdul del xifratge ni del port. Rep l'estat del
 * xifratge de la conversa (estatXifratgeFil.js) i el del número
 * (useSeguretatDelFil.js), i el pinta sense prometre res que no siga cert:
 *   · el paràgraf de l'estat ({nom} omplit sense patrons de replace);
 *   · en un directe entre dues persones, el número en 12 grups de 5 xifres
 *     (una graella de text, no una llista), què vol dir, «Verificat…» si escau i
 *     el botó que alterna «Marca com a verificat» i «Lleva la marca de
 *     verificat»;
 *   · en un grup, on es compara el número (cada persona, al seu xat privat).
 * L'espècimen del catàleg el munta amb dades inventades (EspecimenXatSeguretat).
 *
 * Gauntlet T7b-G06 · En prémer el botó, «Treballant…» el desactiva i el focus cau
 * al body; en acabar, si encara és al body, torna al botó (o, si ja no hi és, al
 * primer botó del diàleg).
 *
 * Gauntlet UI-02 · Una regió viva que es munta ja plena no s'anuncia de manera
 * fiable. Les línies «Calculant…» i «Verificat…» són dos regions (role="status")
 * muntades sempre que hi ha número: buides, van amagades i fora del flux de la
 * graella del panell (.sdp-nomes-lector); quan l'estat canvia, reben el text i
 * es veuen al mateix lloc que abans. Cap canvi visual i cap text repetit.
 */
import { useEffect, useRef } from 'react';
import { ShieldCheck } from 'lucide-react';
import { Alerta, Boto } from '../../../components/PedraSeca/index.js';
import { omple } from '../../../config/moderacio.js';
import { TEXTOS_XIFRATGE } from '../estatXifratgeFil.js';

const XIFRES = /^\d{5}( \d{5}){11}$/;
const T_RESERVA = (_clau, reserva) => reserva;

/**
 * estat: { estat, potVerificar, text, nota } (estatXifratgeDelFil).
 * numero: { estat: 'inactiu'|'calculant'|'llest'|'sense-clau'|'sense-claus-propies'|
 *   'clau-canviada'|'error', numero, verificat, avis: null|'canviat'|'errorMarca', ocupat }.
 */
export default function CosSeguretatXat({ estat, nom = '', numero = null, onMarca = null, t = T_RESERVA }) {
  const nomNet = String(nom || '').trim();
  const tr = ([clau, reserva]) => omple(t(clau, reserva), { nom: nomNet });
  const n = numero || { estat: 'inactiu' };
  const grups = n.estat === 'llest' && XIFRES.test(n.numero ?? '') ? n.numero.split(' ') : null;
  const titol = tr(TEXTOS_XIFRATGE.numero.titol);
  const arrel = useRef(null);
  const rescat = useRef(false);
  const ocupat = n.ocupat === true;
  const calculant = n.estat === 'calculant';
  /* «Verificat…» només al costat d'un número. */
  const verificat = grups !== null && n.verificat === true;
  /* Una línia d'estat permanent: buida, amagada i fora del flux. */
  const classeEstat = (plena) => (plena ? undefined : 'sdp-nomes-lector');

  useEffect(() => {
    if (ocupat) {
      rescat.current = true;
      return;
    }
    if (!rescat.current || n.estat === 'calculant') return;
    rescat.current = false;
    const doc = arrel.current?.ownerDocument;
    if (!doc || (doc.activeElement && doc.activeElement !== doc.body)) return;
    const desti = arrel.current.querySelector('button') || arrel.current.closest('dialog')?.querySelector('button');
    desti?.focus();
  }, [ocupat, n.estat]);

  return (
    <div className="sdp-xat-dialeg__panell" ref={arrel}>
      {estat?.text ? <p>{tr(estat.text)}</p> : null}
      {estat?.nota ? <p>{tr(estat.nota)}</p> : null}
      {estat?.potVerificar ? (
        <>
          <p role="status" className={classeEstat(calculant)}>{calculant ? tr(TEXTOS_XIFRATGE.numero.calculant) : null}</p>
          {grups ? (
            <>
              {/* Gauntlet T7b-G03 · «Compareu este número nou» només al costat d'un número. */}
              {n.avis === 'canviat' ? <Alerta to="avis">{tr(TEXTOS_XIFRATGE.numero.canviat)}</Alerta> : null}
              <div className="sdp-xat-numero" role="group" aria-label={titol}>
                {grups.map((grup, i) => <span key={`${i}-${grup}`}>{grup}</span>)}
              </div>
              <p>{tr(TEXTOS_XIFRATGE.numero.explica)}</p>
            </>
          ) : null}
          <p role="status" className={classeEstat(verificat)}>
            {verificat ? (
              <>
                <ShieldCheck size={20} aria-hidden="true" focusable="false" />{' '}
                {tr(TEXTOS_XIFRATGE.numero.verificat)}
              </>
            ) : null}
          </p>
          {grups ? (
            <>
              {n.avis === 'errorMarca' ? <Alerta to="error">{tr(TEXTOS_XIFRATGE.numero.errorMarca)}</Alerta> : null}
              {typeof onMarca === 'function' ? (
                <Boto varietat={n.verificat ? 'secundari' : 'primari'} carregant={n.ocupat === true} onClick={() => onMarca(!n.verificat)}>
                  {tr(n.verificat ? TEXTOS_XIFRATGE.numero.desmarca : TEXTOS_XIFRATGE.numero.marca)}
                </Boto>
              ) : null}
            </>
          ) : null}
          {n.estat === 'sense-clau' ? <p>{tr(TEXTOS_XIFRATGE.numero.senseClau)}</p> : null}
          {n.estat === 'sense-claus-propies' ? <p>{tr(TEXTOS_XIFRATGE.numero.senseClausPropies)}</p> : null}
          {n.estat === 'clau-canviada' ? <Alerta to="avis">{tr(TEXTOS_XIFRATGE.clauCanviadaForta)}</Alerta> : null}
          {n.estat === 'error' ? <Alerta to="error">{tr(TEXTOS_XIFRATGE.numero.error)}</Alerta> : null}
        </>
      ) : null}
    </div>
  );
}
