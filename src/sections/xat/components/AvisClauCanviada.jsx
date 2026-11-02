/**
 * AvisClauCanviada.jsx — L'alerta al fil quan la clau de seguretat d'un contacte
 * ha canviat, o quan s'ha registrat una clau pròpia que no és d'este aparell
 * (P1-12; disseny E2EE §4.4, CS-01, D-05 a; marató 261101_2143, B2b · M02).
 *
 * Presentacional: no importa cap mòdul del xifratge ni del port. Rep els canvis
 * del fil (useCanvisDeClau.js) i només usa peces de Pedra Seca (Alerta, Boto):
 *   · clau pròpia nova → Alerta d'error, sense cap botó (no hi ha res a acceptar);
 *   · manipulació (bifurcació, kid que no quadra, història incoherent) → Alerta
 *     d'error, sense cap botó;
 *   · canvi fort pendent → Alerta d'avís «Clau nova sense confirmar» amb el text
 *     del canvi (o «Havies verificat…» si el contacte era verificat) i el botó
 *     «He parlat amb {nom}: continua»; en un directe, també «Número de seguretat»;
 *   · acceptació fallida → Alerta d'error;
 *   · canvi suau → Alerta informativa que la persona pot tancar.
 * Conversa.jsx el carrega amb lazy plegat per la bandera E2EE: apagada, no entra
 * al paquet. Després d'acceptar, si el focus ha caigut al body (el botó ja no hi
 * és), va a `destiFocus()` (el camp d'escriure o la llista).
 */
import { Alerta, Boto } from '../../../components/PedraSeca/index.js';
import { omple } from '../../../config/moderacio.js';
import { TEXTOS_XIFRATGE } from '../estatXifratgeFil.js';

const T_RESERVA = (_clau, reserva) => reserva;
const MANIPULACIO = Object.freeze(['bifurcacio', 'kid-no-quadra', 'historia-incoherent']);
const llista = (valor) => (Array.isArray(valor) ? valor : []);

/* El focus només es mou si s'ha perdut (al body o fora de l'arrel d'ombra). */
function rescataFocus(destiFocus) {
  if (typeof destiFocus !== 'function') return;
  const programa = typeof requestAnimationFrame === 'function' ? requestAnimationFrame : (fes) => setTimeout(fes, 0);
  programa(() => {
    const desti = destiFocus();
    if (!desti?.isConnected || typeof desti.focus !== 'function') return;
    const actiu = desti.getRootNode?.()?.activeElement ?? null;
    if (actiu && actiu.tagName !== 'BODY') return;
    desti.focus({ preventScroll: true });
  });
}

/**
 * canvis: { pendents: [{ usuari, motiu, kidNou }], suaus: [{ usuari, kidNou }],
 *   alarmes: [{ tipus }], error } (useCanvisDeClau).
 * nomDe(usuari) → el nom per a {nom}. onAccepta(usuari, kid) → Promise<boolean>.
 */
export default function AvisClauCanviada({
  canvis = null, nomDe = null, ocupat = false, onAccepta = null, onObriNumero = null, onTancaSuau = null, destiFocus = null, t = T_RESERVA
}) {
  const nom = (usuari) => (typeof nomDe === 'function' ? String(nomDe(usuari) ?? '').trim() : '');
  const tr = ([clau, reserva], nomPersona = '') => omple(t(clau, reserva), { nom: nomPersona });
  const alarmes = llista(canvis?.alarmes);
  const pendents = llista(canvis?.pendents);
  const suaus = llista(canvis?.suaus);
  const manipulacio = MANIPULACIO.includes(canvis?.error);
  const errorAccepta = canvis?.error === 'acceptacio';
  if (!alarmes.length && !pendents.length && !suaus.length && !manipulacio && !errorAccepta) return null;

  const accepta = async (usuari, kid) => {
    const fet = await onAccepta(usuari, kid);
    if (fet === true) rescataFocus(destiFocus);
  };

  return (
    <>
      {alarmes.length ? <Alerta to="error">{tr(TEXTOS_XIFRATGE.clauPropiaAlarma)}</Alerta> : null}
      {manipulacio ? <Alerta to="error">{tr(TEXTOS_XIFRATGE.bifurcacio)}</Alerta> : null}
      {pendents.map((p) => {
        const nomPersona = nom(p.usuari);
        const potAcceptar = typeof onAccepta === 'function' && typeof p.kidNou === 'string' && p.kidNou !== '';
        const accions = potAcceptar || typeof onObriNumero === 'function' ? (
          <>
            {potAcceptar ? (
              <Boto varietat="primari" carregant={ocupat === true} onClick={() => accepta(p.usuari, p.kidNou)}>
                {tr(TEXTOS_XIFRATGE.clauCanviadaContinua, nomPersona)}
              </Boto>
            ) : null}
            {typeof onObriNumero === 'function' ? (
              <Boto varietat="secundari" onClick={onObriNumero}>{tr(TEXTOS_XIFRATGE.numero.titol)}</Boto>
            ) : null}
          </>
        ) : null;
        return (
          <Alerta key={`pendent-${p.usuari}`} to="avis" titol={tr(TEXTOS_XIFRATGE.clauNovaSenseConfirmar)} accions={accions}>
            {tr(p.motiu === 'verificat' ? TEXTOS_XIFRATGE.verificatBloquejat : TEXTOS_XIFRATGE.clauCanviadaForta, nomPersona)}
          </Alerta>
        );
      })}
      {errorAccepta ? <Alerta to="error">{tr(TEXTOS_XIFRATGE.errorAccepta)}</Alerta> : null}
      {suaus.map((s) => (
        <Alerta key={`suau-${s.usuari}-${s.kidNou}`} to="info"
          onTanca={typeof onTancaSuau === 'function' ? () => onTancaSuau(s.usuari, s.kidNou) : null}>
          {tr(TEXTOS_XIFRATGE.clauCanviadaSuau, nom(s.usuari))}
        </Alerta>
      ))}
    </>
  );
}
