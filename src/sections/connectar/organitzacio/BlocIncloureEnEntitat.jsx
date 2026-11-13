/**
 * BlocIncloureEnEntitat.jsx — «Incloure {nom} en una entitat teua», la
 * targeta 2 de /connectar quan es visita una PERSONA (FEDI-22, ordre del
 * Mestre, 261103; captura 261103_2055).
 *
 *   · Qui administra entitats (owner o admin: entitatsPerIncloure, la mateixa
 *     font que «Connectar com a») tria l'entitat i el rol: «Usuari / Membre»
 *     és 1 clic; «Administrador», només la propietària i sempre amb
 *     confirmació (DialegConfirmacio diu els poders); «Treballador / Soci» va
 *     desactivat amb el motiu (rolsDInclusio.js).
 *   · Abans d'oferir res es llig si ja en forma part (useIncloureEnEntitat):
 *     propietària o administradora, només ho diu; membre, la propietària la
 *     pot fer administradora. Des d'ací no es degrada ni es lleva ningú: això
 *     és del Perfil («Membres i connexions»). Si la lectura falla, cap
 *     formulari: «Gestionar {entitat}».
 *   · L'alta és directa i sense avís (decisió 261008): el text ho diu abans
 *     del clic. No crida segueix, creaFil ni sendChatMessage.
 *   · Els errors es diuen pel seu codi amb ERRORS_MEMBRES (font única,
 *     profile/GestioMembres.jsx, només en lectura); sense codi, el genèric
 *     d'afegir. Mai el text del servidor.
 *   · C17 · Sense cap role=status persistent: «comprovant» és text, amb
 *     aria-busy a la secció; l'únic status és el resultat d'una acció.
 *   · Revisió 261104:
 *       · RA-03 · L'h3 «Incloure {nom} en una entitat teua» només per al
 *         lector de pantalla (.sdp-sr-only): la targeta ja porta el rètol
 *         «Incloure en la teua entitat» i el botó diu a qui i on.
 *       · C-01 · Les conseqüències, just abans del botó i en la seua
 *         descripció (aria-describedby, com C9 a BlocRelacio): l'alta és
 *         directa i sense avís, qui la veurà (qui administra l'entitat i la
 *         persona, al seu Perfil, d'on en pot eixir) i que de moment no es
 *         publica. L'1 clic del Mestre es manté.
 *       · RA-05 · Només s'hi pot incloure veïnat del padró del poble de
 *         l'entitat (SDP-ORGMEM-003): l'ajuda ho diu sempre, i si la fitxa de
 *         confiança diu un altre poble, una línia ho avisa abans del clic. El
 *         botó no es desactiva: una persona pot ser de més d'un padró i el
 *         client només en veu un (town_memberships és del servidor).
 *       · C17 i C-02 · Quan l'acció va bé, el focus va al resultat
 *         (role=status, tabIndex -1); quan falla, a l'avís d'error (abans
 *         queia al <body>: Boto desactiva el botó premut mentre treballa).
 *   · Integració 261104 (àrbitre, amb FEDI-23 de Codex) · Si el servidor té
 *     les connexions (inclusio.ambFuncions), «Treballador / Soci» és actiu
 *     i l'avís diu que només es publica si les dues parts ho trien. Este bloc
 *     substituïx VinculacioEntitat a /connectar: una sola targeta d'incloure.
 * Tots els textos passen per t(): section.connectar.incloure.* i rol.*.
 */
import { useEffect, useId, useRef, useState } from 'react';
import { Settings, UserPlus } from 'lucide-react';
import { useUIActions } from '../../../app/contexts/UIContext';
import { useNavigate } from '../../../app/contexts/RouterContext';
import { rutaFitxaOrganitzacio } from '../../../config/navigation.js';
import { omple } from '../../../config/moderacio.js';
import { Alerta, Boto, DialegConfirmacio, GrupOpcions } from '../../../components/PedraSeca/index.js';
import { SelectorDeVariacions } from '../../mercat/SelectorDeVariacions.jsx';
/* C14 (crític, 261103) · Les taules d'errors i textos dels membres, de la seua font única (només en lectura). */
import { ERRORS_MEMBRES, TEXTOS_MEMBRES } from '../../profile/GestioMembres.jsx';
import { ROL_PER_DEFECTE, accioDInclusio, opcionsDeRol } from './rolsDInclusio.js';
import { useIncloureEnEntitat } from './useIncloureEnEntitat.js';

/* RA-05 · Dos noms de poble són el mateix si només canvien les majúscules o els espais. */
const pobleNet = (poble) => (typeof poble === 'string' ? poble.trim().replace(/\s+/g, ' ') : '');
const mateixPoble = (a, b) => pobleNet(a).toLocaleLowerCase() === pobleNet(b).toLocaleLowerCase();

/**
 * `entitats`: [{ valor, etiqueta, nom, rol, poble }] (entitatsPerIncloure);
 * `persona`: { id, nom, poble } de la fitxa de confiança, mai de l'URL.
 */
export function BlocIncloureEnEntitat({ entitats = [], persona = null, config = {}, usuariId = null }) {
  const id = useId();
  const { t } = useUIActions();
  const navigate = useNavigate();
  const opcionsEntitat = Array.isArray(entitats) ? entitats : [];
  /* Per defecte, la primera on és propietària; si no n'hi ha cap, la primera. */
  const perDefecte = (opcionsEntitat.find((opcio) => opcio.rol === 'owner') || opcionsEntitat[0])?.valor ?? null;
  const [entitatTriada, setEntitatTriada] = useState(null);
  const valorEntitat = entitatTriada !== null && opcionsEntitat.some((opcio) => opcio.valor === entitatTriada) ? entitatTriada : perDefecte;
  const entitat = opcionsEntitat.find((opcio) => opcio.valor === valorEntitat) || null;
  const rolPropi = entitat?.rol ?? null;
  const nom = persona?.nom || '';
  const nomEntitat = entitat?.nom || '';
  const inclusio = useIncloureEnEntitat({ orgId: entitat?.valor ?? null, personaId: persona?.id ?? null, config, usuariId });
  const [rolTriat, setRolTriat] = useState(ROL_PER_DEFECTE);
  /* L'acció que espera la confirmació (alta o ascens com a administradora), o null. */
  const [confirmacio, setConfirmacio] = useState(null);
  /* C17 i C-02 · On va el focus després d'una acció: 'resultat' o 'error'. */
  const [focusA, setFocusA] = useState(null);
  const titolRef = useRef(null);
  const resultatRef = useRef(null);
  const errorRef = useRef(null);

  /* C17 · El diàleg torna el focus al seu disparador en el seu efecte (el del
     fill); este, el del pare, va després en el mateix commit i el porta al
     resultat o a l'error. Si el destí no s'ha pintat (un AbortError), a l'h3. */
  useEffect(() => {
    if (!focusA || confirmacio) return;
    const desti = (focusA === 'error' ? errorRef : resultatRef).current;
    const objectiu = desti?.isConnected ? desti : titolRef.current;
    if (objectiu?.isConnected) objectiu.focus();
    setFocusA(null);
  }, [focusA, confirmacio]);

  const ambNoms = (parell) => omple(t(...parell), { nom, entitat: nomEntitat });
  const executa = async (accio) => {
    const fet = accio ? await inclusio.inclou(accio.rol) : false;
    setConfirmacio(null);
    if (accio) setFocusA(fet ? 'resultat' : 'error');
  };
  /* RA-05 · El poble de l'entitat i el de la fitxa; l'avís, només si tots dos es coneixen i no coincidixen. */
  const pobleEntitat = pobleNet(entitat?.poble);
  const pobleDeLaPersona = pobleNet(persona?.poble);
  const altrePoble = Boolean(pobleEntitat) && Boolean(pobleDeLaPersona) && !mateixPoble(pobleEntitat, pobleDeLaPersona);
  const idAvis = `${id}-avis`;
  const idAltrePoble = `${id}-altre-poble`;
  const triaEntitat = (valor) => { setEntitatTriada(valor); setRolTriat(ROL_PER_DEFECTE); };
  const gestiona = entitat ? (
    <Boto varietat="secundari" icona={Settings} onClick={() => navigate(rutaFitxaOrganitzacio(entitat.valor))}>
      {omple(t('section.connectar.formarPart.gestiona', 'Gestionar {nom}'), { nom: nomEntitat })}
    </Boto>
  ) : null;

  const rolActual = inclusio.rolActual;
  const ambFuncions = inclusio.ambFuncions === true;
  let cos = null;
  switch (inclusio.estat) {
    case 'comprovant':
      cos = <p className="sdp-connectar__ajuda">{ambNoms(['section.connectar.incloure.comprovant', 'Comprovant si {nom} ja forma part de {entitat}…'])}</p>;
      break;
    case 'no-disponible':
      cos = <p className="sdp-connectar__ajuda">{t(...ERRORS_MEMBRES['NO-DISPONIBLE'])}</p>;
      break;
    case 'error-lectura':
      cos = (
        <>
          <p className="sdp-connectar__ajuda">{ambNoms(['section.connectar.incloure.errorLectura', 'No s’ha pogut comprovar si {nom} ja forma part de {entitat}. Mira-ho al teu Perfil.'])}</p>
          {gestiona}
        </>
      );
      break;
    default:
      if (rolActual === 'owner') {
        cos = <p>{ambNoms(['section.connectar.incloure.jaPropietaria', '{nom} és la propietària de {entitat}.'])}</p>;
      } else if (rolActual === 'admin') {
        cos = (
          <>
            <p>{ambNoms(['section.connectar.incloure.jaAdmin', '{nom} ja administra {entitat}.'])}</p>
            {gestiona}
          </>
        );
      } else if (rolActual === 'member') {
        const ascens = accioDInclusio({ rolActual, rolPropi });
        cos = (
          <>
            <p>{ambNoms(['section.connectar.incloure.jaMembre', '{nom} ja és membre de {entitat}.'])}</p>
            {ascens ? (
              <Boto varietat="secundari" onClick={() => setConfirmacio(ascens)} carregant={inclusio.ocupat}>
                {ambNoms(['section.connectar.incloure.botoAscens', 'Donar a {nom} l’administració de {entitat}'])}
              </Boto>
            ) : gestiona}
          </>
        );
      } else {
        const accio = accioDInclusio({ rolActual, rolPropi, rolTriat, ambFuncions });
        cos = (
          <>
            <GrupOpcions llegenda={t('section.connectar.incloure.rol', 'Amb quin rol?')} nom={`${id}-rol`}
              opcions={opcionsDeRol({ rolPropi, rolActual, t, ambFuncions })} valor={rolTriat} onCanvi={setRolTriat}
              disabled={inclusio.ocupat} />
            {/* C-01 · Les conseqüències, just abans del botó, i en la seua descripció. */}
            <p id={idAvis} className="sdp-connectar__ajuda">
              {ambNoms(ambFuncions
                ? ['section.connectar.incloure.avisConnexions', 'L’alta és directa i sense cap avís: parleu-ne abans. Ho veuran qui administra {entitat} i {nom}, al seu Perfil, d’on en podrà eixir quan vullga. Si l’entitat i la persona tenen les connexions públiques, la pertinença, amb el rol, també eixirà a la fitxa pública de l’entitat, llevat que alguna de les dues l’amague.']
                : ['section.connectar.incloure.avis', 'L’alta és directa i sense cap avís: parleu-ne abans. Ho veuran qui administra {entitat} i {nom}, al seu Perfil, d’on en podrà eixir quan vullga. De moment no es publica enlloc.'])}
            </p>
            {/* RA-05 · Un altre poble a la fitxa: es diu abans del clic, sense desactivar res. */}
            {altrePoble ? (
              <p id={idAltrePoble} className="sdp-connectar__ajuda">
                {omple(t('section.connectar.incloure.altrePoble', 'La fitxa de {nom} diu {poble}, i a {entitat} només s’hi pot incloure veïnat de {pobleEntitat}: si no hi consta, l’alta no es podrà fer.'),
                  { nom, entitat: nomEntitat, poble: pobleDeLaPersona, pobleEntitat })}
              </p>
            ) : null}
            <div className="sdp-connectar__accions">
              <Boto varietat="secundari" icona={UserPlus} carregant={inclusio.ocupat} disabled={!accio}
                aria-describedby={altrePoble ? `${idAvis} ${idAltrePoble}` : idAvis}
                onClick={() => (accio?.confirma ? setConfirmacio(accio) : executa(accio))}>
                {rolTriat === 'admin'
                  ? ambNoms(['section.connectar.incloure.botoAdmin', 'Incloure {nom} a {entitat} i donar-li l’administració'])
                  : ambNoms(['section.connectar.incloure.boto', 'Incloure {nom} a {entitat}'])}
              </Boto>
            </div>
          </>
        );
      }
  }

  const codi = inclusio.error?.codi ?? '';
  const textError = !inclusio.error ? null
    : Object.hasOwn(ERRORS_MEMBRES, codi) ? t(...ERRORS_MEMBRES[codi]) : t(...TEXTOS_MEMBRES.errorAfegeix);

  return (
    <section className="sdp-connectar__seccio" aria-labelledby={`${id}-incloure`}
      aria-busy={inclusio.estat === 'comprovant' ? 'true' : undefined}>
      {/* RA-03 · El títol, només per al lector de pantalla: el rètol de la targeta ja es veu. */}
      <h3 ref={titolRef} tabIndex={-1} id={`${id}-incloure`} className="sdp-sr-only">
        {omple(t('section.connectar.incloure.titol', 'Incloure {nom} en una entitat teua'), { nom })}
      </h3>
      <p className="sdp-connectar__ajuda">
        {t('section.connectar.incloure.ajuda', 'Formar part és una pertinença formal, no una connexió. Només s’hi pot incloure veïnat del municipi de l’entitat.')}
      </p>
      {opcionsEntitat.length > 1 ? (
        <SelectorDeVariacions llegenda={t('section.connectar.incloure.entitat', 'A quina entitat?')}
          opcions={opcionsEntitat} valor={valorEntitat} onCanvi={triaEntitat} />
      ) : null}
      {cos}
      {inclusio.resultat ? (
        <p ref={resultatRef} tabIndex={-1} role="status">{inclusio.resultat === 'fetAdmin'
          ? ambNoms(['section.connectar.incloure.fetAdmin', 'Fet: {nom} ja administra {entitat}.'])
          : inclusio.resultat === 'fetTreballador'
            ? ambNoms(['section.connectar.incloure.fetTreballador', 'Fet: {nom} ja forma part de {entitat} amb el rol «Treballador / Soci».'])
            : ambNoms(['section.connectar.incloure.fetMembre', 'Fet: {nom} ja forma part de {entitat} com a membre.'])}</p>
      ) : null}
      {/* C-02 · Enfocable (tabIndex -1): hi va el focus quan l'alta falla. */}
      {textError ? <div ref={errorRef} tabIndex={-1} className="sdp-connectar__error"><Alerta to="error">{textError}</Alerta></div> : null}
      <DialegConfirmacio
        obert={Boolean(confirmacio)}
        onTanca={() => { if (!inclusio.ocupat) setConfirmacio(null); }}
        onConfirma={() => executa(confirmacio)}
        titol={ambNoms(['section.connectar.incloure.dialegTitol', 'Donar l’administració de {entitat} a {nom}?'])}
        descripcio={t('section.connectar.incloure.dialegText', 'Podrà editar la fitxa, gestionar els membres, respondre el xat de l’entitat i publicar en el seu nom. Només la propietària li ho podrà llevar, des del Perfil.')}
        etiquetaConfirma={t('section.connectar.incloure.dialegConfirma', 'Donar l’administració')}
        etiquetaCancela={t('section.connectar.formarPart.cancela', 'Cancel·lar')}
        carregant={inclusio.ocupat}
      />
    </section>
  );
}

export default BlocIncloureEnEntitat;
