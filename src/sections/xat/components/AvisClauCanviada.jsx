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
 *
 * E3 (marató 261101_2143; G2-A-doctr-02, G2-A-integ-02) · Un pendent sense cap clau
 * nova que es puga confirmar (kidNou null o `acceptable: false`: cap clau activa, o
 * una sense declaració autofirmada vàlida) no diu «Clau nova»: «Sense cap clau de
 * seguretat vàlida», un text propi que conserva l'avís de manipulació, i cap botó
 * «continua». L'alarma pròpia sense cap clau activa (`senseClau`), igual.
 */
import { Alerta, Boto } from '../../../components/PedraSeca/index.js';
import { omple } from '../../../config/moderacio.js';
import { TEXTOS_XIFRATGE } from '../estatXifratgeFil.js';

const T_RESERVA = (_clau, reserva) => reserva;
const MANIPULACIO = Object.freeze(['bifurcacio', 'kid-no-quadra', 'historia-incoherent']);
const llista = (valor) => (Array.isArray(valor) ? valor : []);

/** E3 · Els textos [clau, reserva] de quan no hi ha cap clau nova que es puga confirmar
    (també els usa el cos del número, CosSeguretatXat.jsx). */
export const TEXTOS_SENSE_CLAU = Object.freeze({
  titol: Object.freeze(['section.xat.xifratge.senseClauValida', 'Sense cap clau de seguretat vàlida']),
  contacte: Object.freeze(['section.xat.xifratge.clauRetirada', 'Este aparell no troba cap clau de seguretat vàlida de {nom} que es puga confirmar. Passa quan algú perd l’aparell i la frase, o si algú s’ha posat pel mig. Fins que n’hi haja una de vàlida, no s’hi pot escriure. Parla amb {nom} per a saber què ha passat.']),
  contacteSenseNom: Object.freeze(['section.xat.xifratge.clauRetiradaSenseNom', 'Este aparell no troba cap clau de seguretat vàlida d’este contacte que es puga confirmar. Passa quan algú perd l’aparell i la frase, o si algú s’ha posat pel mig. Fins que n’hi haja una de vàlida, no s’hi pot escriure. Parla amb esta persona per a saber què ha passat.']),
  /* ARB-E3-1 · Diu el que veu l'aparell, no que el compte no tinga cap clau: només s'hi arriba si
     el servidor n'amaga una (xat_publica_identitat retira i inserix en la mateixa transacció). */
  propia: Object.freeze(['section.xat.xifratge.clauPropiaRetirada', 'Este aparell no troba cap clau activa del teu compte: ni la seua ni cap altra. Pot ser que algú s’haja posat pel mig. Per seguretat, no s’hi pot escriure. Si no has sigut tu, avisa’ns.'])
});
/* D-M02-2 (P1-12) · Quan nomDe(usuari) torna buit (directori encara no carregat),
   els textos amb {nom} usen una frase genèrica neta sense forats («amb : continua»). */
export const TEXTOS_SENSE_NOM = Object.freeze({
  continua: Object.freeze(['section.xat.xifratge.clauCanviadaContinuaSenseNom', 'He parlat amb esta persona: continua']),
  verificat: Object.freeze(['section.xat.xifratge.verificatBloquejatSenseNom', 'Havies verificat este contacte i la seua clau ha canviat. Torna-la a verificar per a continuar.']),
  forta: Object.freeze(['section.xat.xifratge.clauCanviadaFortaSenseNom', 'Este contacte té una clau de seguretat nova que la clau anterior no ha confirmat. Passa quan algú perd l’aparell i la frase, o si algú s’ha posat pel mig. Parla amb esta persona per a saber què ha passat.']),
  suau: Object.freeze(['section.xat.xifratge.clauCanviadaSuauSenseNom', 'La clau de seguretat d’este contacte ha canviat i ho ha confirmat la seua clau anterior.']),
});
/* La clau nova d'un pendent, si es pot acceptar (la mateixa regla que teClauNova del hook). */
const clauNovaAcceptable = (p) => typeof p?.kidNou === 'string' && p.kidNou !== '' && p.acceptable !== false;

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
 * canvis: { pendents: [{ usuari, motiu, kidNou, acceptable? }], suaus: [{ usuari, kidNou }],
 *   alarmes: [{ tipus, senseClau? }], error } (useCanvisDeClau).
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
      {alarmes.length ? (
        <Alerta to="error">{tr(alarmes.every((a) => a?.senseClau === true) ? TEXTOS_SENSE_CLAU.propia : TEXTOS_XIFRATGE.clauPropiaAlarma)}</Alerta>
      ) : null}
      {manipulacio ? <Alerta to="error">{tr(TEXTOS_XIFRATGE.bifurcacio)}</Alerta> : null}
      {pendents.map((p) => {
        const nomPersona = nom(p.usuari);
        const ambNom = nomPersona !== '';
        const clauNova = clauNovaAcceptable(p);
        const potAcceptar = typeof onAccepta === 'function' && clauNova;
        const accions = potAcceptar || typeof onObriNumero === 'function' ? (
          <>
            {potAcceptar ? (
              <Boto varietat="primari" carregant={ocupat === true} onClick={() => accepta(p.usuari, p.kidNou)}>
                {ambNom ? tr(TEXTOS_XIFRATGE.clauCanviadaContinua, nomPersona) : tr(TEXTOS_SENSE_NOM.continua)}
              </Boto>
            ) : null}
            {typeof onObriNumero === 'function' ? (
              <Boto varietat="secundari" onClick={onObriNumero}>{tr(TEXTOS_XIFRATGE.numero.titol)}</Boto>
            ) : null}
          </>
        ) : null;
        /* E3 · G2-A-doctr-02 · Sense clau nova, ni el títol ni el text diuen que n'hi ha una. */
        const cos = !clauNova
          ? (ambNom ? TEXTOS_SENSE_CLAU.contacte : TEXTOS_SENSE_CLAU.contacteSenseNom)
          : (p.motiu === 'verificat'
            ? (ambNom ? TEXTOS_XIFRATGE.verificatBloquejat : TEXTOS_SENSE_NOM.verificat)
            : (ambNom ? TEXTOS_XIFRATGE.clauCanviadaForta : TEXTOS_SENSE_NOM.forta));
        return (
          <Alerta key={`pendent-${p.usuari}`} to="avis" titol={tr(clauNova ? TEXTOS_XIFRATGE.clauNovaSenseConfirmar : TEXTOS_SENSE_CLAU.titol)} accions={accions}>
            {tr(cos, nomPersona)}
          </Alerta>
        );
      })}
      {errorAccepta ? <Alerta to="error">{tr(TEXTOS_XIFRATGE.errorAccepta)}</Alerta> : null}
      {suaus.map((s) => {
        const nomSuau = nom(s.usuari);
        return (
          <Alerta key={`suau-${s.usuari}-${s.kidNou}`} to="info"
            onTanca={typeof onTancaSuau === 'function' ? () => onTancaSuau(s.usuari, s.kidNou) : null}>
            {nomSuau ? tr(TEXTOS_XIFRATGE.clauCanviadaSuau, nomSuau) : tr(TEXTOS_SENSE_NOM.suau)}
          </Alerta>
        );
      })}
    </>
  );
}
