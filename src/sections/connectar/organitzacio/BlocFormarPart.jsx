/**
 * BlocFormarPart.jsx — «Formar part de l'entitat» a la vista Connectar
 * (IDEA-14, Directiva del Mestre, 261024; auditoria Gemini G-04): ser-ne
 * membre, soci o treballador.
 *
 *   · Formar part és una pertinença formal que dona qui l'administra, i
 *     abans hi ha una petició pendent, mai una alta des del client. Amb la
 *     capacitat connexionsPubliques i una fitxa pública de confiança, el
 *     mateix botó confirma solicitaUnirSeAEntitat i no crea ni envia xat.
 *     Sense eixa capacitat es conserva el camí legacy (261024): confirmació
 *     i conversa humana. El botó obri una confirmació (DialegConfirmacio) que
 *     ensenya el text que s'enviarà («Sol·licitud per a formar part de
 *     {nom}.» i, si vols, el que hi afiges) i, en confirmar, l'envia al xat
 *     privat de l'entitat (missatgeAlXat.js: creaFil + sendChatMessage, la
 *     porta de les normes inclosa) i porta a eixa conversa.
 *   · Sense metadades: el xat del client no en porta (XatContext les envia
 *     buides i xat_envia les ignora des de 2610081543). La línia fixa del
 *     principi és l'estructura de la petició.
 *   · Estats (estatFormarPart.js): sense sessió porta a entrar; qui ja en
 *     forma part (IdentitatContext · memberships) ho llig, com a membre o
 *     com a qui l'administra.
 *   · IDEA-22 (pla 261025_0045, T5; Directiva del Mestre 261025) · DEROGAT
 *     «una entitat sense xat on arribar ho diu i no té botó» («Des d'ací encara
 *     no es pot arribar al xat d'esta entitat…»). Sense xat privat on arribar
 *     ('sense-xat'), un botó directe al xat de la pàgina de l'entitat (el
 *     canal comú de «Comentar», rutaXatDePagina sobre el seu descriptor), on
 *     es pot preguntar i demanar. I qui l'administra ja no l'administra ací:
 *     un botó la porta al seu Perfil («Membres i connexions»).
 *   · El nom és de confiança: el de la pertinença, el del contacte de la
 *     fitxa pública o el de la fitxa; mai el title de l'URL (T43b-3).
 *   · Si l'enviament falla, la confirmació es tanca (correcció 261008 de
 *     GestioMembres: l'error es pinta fora del <dialog> modal) i l'avís diu
 *     què ha passat; si la conversa s'ha obert, s'hi pot anar.
 *   · 261024 correccions · R4-04: declinar les normes ja no obri cap
 *     conversa (missatgeAlXat les pregunta abans de creaFil i torna
 *     motiu 'normes'). R4-05: com useComentaEnPrivat (Correcció C6), la
 *     resposta que arriba quan el bloc ja s'ha desmuntat no toca res, i si
 *     la persona s'ha mogut des del clic no se la porta enlloc.
 *   · FEDI-22 (ordre del Mestre, 261103; captura 261103_2055) · Abans del
 *     botó es tria el rol que es demana («Administrador», «Treballador /
 *     Soci» o «Usuari / Membre», per defecte el darrer: rolsDInclusio.js). El
 *     rol es demana a l’API pendent quan està disponible; en el camí legacy
 *     només viatja com a segona línia del text («Rol que demane: …»).
 *     Cap camí dona rols: l’alta la decidix qui administra l’entitat.
 * Tots els textos passen per t() (CA-6): section.connectar.formarPart.*.
 */
import { useEffect, useId, useRef, useState } from 'react';
import { MessageCircle, Settings, Users } from 'lucide-react';
import { objecteDePerfil, rutaFitxaOrganitzacio, rutaXatDePagina } from '../../../config/navigation.js';
import { useNavigate } from '../../../app/contexts/RouterContext';
import { useUbicacioApp } from '../../../components/PedraSeca/hooks/useAccions.js';
import { useUIActions } from '../../../app/contexts/UIContext';
import { useSession } from '../../../app/contexts/SessionContext';
import { useIdentitat } from '../../../app/contexts/IdentitatContext.jsx';
import { Alerta, AreaText, Boto, Camp, Carregant, DialegConfirmacio, GrupOpcions } from '../../../components/PedraSeca/index.js';
import { TEXTOS_MODERACIO } from '../../../components/PedraSeca/organismes/textosModeracio.js';
import { backendScope } from '../../../config/backendConfig.js';
import { capturaSessio, entradaSessio } from '../../../data/identitat.js';
import * as port from '../../../data/backendPort.js';
import { omple } from '../../../config/moderacio.js';
import { useMissatgeAlXat } from '../missatgeAlXat.js';
import { LIMIT_AFEGIT, estatDeFormarPart, pertinencaDe, textDeLaSollicitud } from './estatFormarPart.js';
import { ROL_PER_DEFECTE, etiquetaDeRol, opcionsDeRolDemanat } from './rolsDInclusio.js';

/* R4-05 · On és la persona, només per a comparar-ho amb on era en el clic: el
   mateix criteri que useComentaEnPrivat (Correcció C6), l'entrada del router
   en memòria o, si no, la barra d'adreces tal qual. */
function onEs(router) {
  if (router?.memoria === true) {
    const consulta = router.searchParams ? String(router.searchParams) : '';
    return `${router.currentPath ?? ''}${consulta ? `?${consulta}` : ''}`;
  }
  if (typeof window === 'undefined' || !window.location) return '';
  return `${window.location.pathname}${window.location.search}`;
}

const ROLS_PENDENTS = Object.freeze({ admin: 'administrador', treballador: 'treballador', member: 'usuari' });
function organitzacioPendent(contacte) {
  if (contacte?.deFitxa !== true || contacte.propia || !['entitat', 'grup'].includes(contacte.tipus)
    || contacte.seguiment?.tipus !== 'entitat') return null;
  const id = contacte.seguiment.id;
  return typeof id === 'string' && id.trim() ? id : null;
}
function tePeticions() {
  try { return port.teCapacitat('connexionsPubliques') === true && typeof port.solicitaUnirSeAEntitat === 'function'; }
  catch { return false; }
}

export function BlocFormarPart(props) {
  const { currentUser } = useSession();
  let backend;
  try { backend = backendScope(props.config ?? {}); } catch { backend = 'backend:invàlid'; }
  const orgPendent = tePeticions() ? organitzacioPendent(props.contacte) : null;
  const entradaDeVista = entradaSessio();
  const clau = JSON.stringify([backend, currentUser?.id ?? null, entradaDeVista, props.orgId ?? null,
    props.tipusOrg ?? 'entitat', props.contacte?.interlocutor?.id ?? null, orgPendent]);
  return <FormulariFormarPart key={clau} {...props} orgPendent={orgPendent} abastBackend={backend} entradaDeVista={entradaDeVista} />;
}

function FormulariFormarPart({ orgId, contacte = null, nom = null, tipusOrg = 'entitat', carregant = false, onEntra, config = {}, orgPendent = null, abastBackend, entradaDeVista }) {
  const id = useId();
  const { t } = useUIActions();
  const navigate = useNavigate();
  const router = useUbicacioApp();
  const ubicacio = useRef(router);
  ubicacio.current = router;
  const muntat = useRef(true);
  useEffect(() => {
    muntat.current = true;
    return () => { muntat.current = false; };
  }, []);
  const { currentUser } = useSession();
  const identitat = useIdentitat();
  const membership = pertinencaDe(identitat?.memberships, orgId);
  const estat = estatDeFormarPart({ teSessio: Boolean(currentUser), membership, carregant, contacte });
  const nomDeConfianca = (typeof membership?.name === 'string' && membership.name.trim()) || contacte?.nom || nom || '';
  const envia = useMissatgeAlXat(contacte);

  const [obert, setObert] = useState(false);
  const [afegit, setAfegit] = useState('');
  /* FEDI-22 · El rol que es demana (només text de la sol·licitud). */
  const [rolDemanat, setRolDemanat] = useState(ROL_PER_DEFECTE);
  const [enviant, setEnviant] = useState(false);
  const [pendent, setPendent] = useState(false);
  const operacioRef = useRef(null);
  /* { text, ruta }: l'avís d'un enviament que no ha eixit, i la conversa si s'ha obert. */
  const [fallada, setFallada] = useState(null);

  const ambNom = (clau, reserva) => omple(t(clau, reserva), { nom: nomDeConfianca });
  const capcalera = ambNom('section.connectar.formarPart.sollicitud', 'Sol·licitud per a formar part de {nom}.');
  const liniaRol = omple(t('section.connectar.formarPart.rolDemanat', 'Rol que demane: {rol}.'), { rol: etiquetaDeRol(rolDemanat, t) });

  const confirma = async () => {
    if (operacioRef.current || !muntat.current || pendent) return;
    const peticio = orgPendent ? Object.freeze({ orgId: orgPendent, rol: ROLS_PENDENTS[rolDemanat] }) : null;
    const personaId = currentUser?.id;
    const configCapturada = peticio ? Object.freeze({ ...config }) : null;
    const onEra = onEs(ubicacio.current);
    const sessio = capturaSessio();
    const operacio = {};
    operacioRef.current = operacio;
    const comprovaAbast = () => {
      sessio();
      if (entradaSessio() !== entradaDeVista || !muntat.current || operacioRef.current !== operacio || onEs(ubicacio.current) !== onEra
        || (peticio && (backendScope(config) !== abastBackend || backendScope(configCapturada) !== abastBackend))) {
        throw new DOMException('L’àmbit de la sol·licitud ha canviat.', 'AbortError');
      }
    };
    setEnviant(true);
    setFallada(null);
    let resultat = null;
    let error = null;
    try {
      comprovaAbast();
      if (peticio) {
        if (!peticio.rol || typeof personaId !== 'string' || !personaId) throw new Error('Petició no vàlida');
        resultat = await port.solicitaUnirSeAEntitat(peticio, configCapturada);
        comprovaAbast();
        if (!resultat || resultat.orgId !== peticio.orgId || resultat.personaId !== personaId
          || resultat.rol !== peticio.rol || resultat.estat !== 'pendent') throw new Error('Resposta no vàlida');
      } else {
        resultat = await envia(textDeLaSollicitud(capcalera, afegit, liniaRol), { comprovaAbast });
      }
    } catch (e) {
      error = e;
    }
    /* Cap pas posterior d'una altra entrada, entitat, backend o formulari. */
    try { comprovaAbast(); } catch {
      if (operacioRef.current === operacio) {
        operacioRef.current = null;
        if (muntat.current) { setEnviant(false); setObert(false); }
      }
      return;
    }
    if (operacioRef.current === operacio) operacioRef.current = null;
    setEnviant(false);
    setObert(false);
    /* Encara ací però en una altra ruta (un altre perfil, una altra consulta):
       ni s'hi porta ni es pinta un avís d'una entitat que ja no és la de la vista. */
    if (onEs(ubicacio.current) !== onEra) return;
    if (peticio) {
      if (error) {
        setFallada({ text: t('section.perfil.connexions.errorVincle', 'No s’ha pogut guardar el vincle. Comprova els teus permisos i torna-ho a provar.'), ruta: null });
      } else {
        setPendent(true);
      }
      return;
    }
    if (resultat?.enviat && resultat.ruta) {
      setAfegit('');
      navigate(resultat.ruta);
      return;
    }
    /* Fase D (261020) · Declinar les normes de convivència és un AbortError
       (la porta de sendChatMessage) o, abans d'obrir la conversa, motiu
       'normes' (R4-04): no ha eixit res. */
    const text = error?.name === 'AbortError' || resultat?.motiu === 'normes'
      ? t(...TEXTOS_MODERACIO.calAcceptar)
      : resultat?.ruta
        ? ambNom('section.connectar.formarPart.noHaEixit', 'La sol·licitud no ha eixit. La trobaràs al xat de {nom} per a tornar-la a provar.')
        : ambNom('section.connectar.formarPart.senseConversa', 'No s’ha pogut obrir el xat de {nom}. Torna-ho a provar d’ací a una estona.');
    setFallada({ text, ruta: resultat?.ruta || null });
  };

  let cos;
  switch (estat) {
    case 'sense-sessio':
      cos = (
        <Alerta to="info" viva={false}
          accions={<Boto varietat="secundari" onClick={() => onEntra?.()}>{t('section.connectar.formarPart.entra', 'Entra per a demanar-ho')}</Boto>}>
          <p>{t('section.connectar.formarPart.senseSessio', 'Per a demanar formar part d’una entitat has d’entrar amb el teu compte.')}</p>
        </Alerta>
      );
      break;
    case 'administres':
      /* IDEA-22 (T5) · Administrar-la (membres i rols) és del Perfil, «Membres i connexions». */
      cos = (
        <>
          <p>{ambNom('section.connectar.formarPart.administres', 'Ja formes part de {nom} i l’administres.')}</p>
          <p className="sdp-connectar__ajuda">{t('section.connectar.formarPart.onSAdministra', 'Els membres i els rols es gestionen al teu Perfil, a «Membres i connexions».')}</p>
          <Boto varietat="secundari" icona={Settings} onClick={() => navigate(rutaFitxaOrganitzacio(membership.id))}>
            {ambNom('section.connectar.formarPart.gestiona', 'Gestionar {nom}')}
          </Boto>
        </>
      );
      break;
    case 'membre':
      cos = (
        <Alerta to="exit" viva={false} titol={ambNom('section.connectar.formarPart.jaEnFormes', 'Ja formes part de {nom}')}>
          <p>{t('section.connectar.formarPart.jaEnFormesText', 'Hi eres com a membre. Per a deixar-ho o canviar el teu paper, parla amb qui l’administra.')}</p>
        </Alerta>
      );
      break;
    case 'comprovant':
      cos = <Carregant etiqueta={t('section.connectar.formarPart.comprovant', 'Buscant el xat de l’entitat…')} />;
      break;
    case 'sense-xat': {
      /* IDEA-22 (T5) · Sense xat privat on arribar: el canal de la pàgina de l'entitat. */
      const desti = rutaXatDePagina(objecteDePerfil({ tipus: tipusOrg === 'grup' ? 'grup' : 'entitat', id: orgId, nom: nomDeConfianca }));
      cos = (
        <>
          <p>{t('section.connectar.formarPart.que', 'Ser-ne membre, soci o treballador és una pertinença formal: t’hi dona d’alta qui l’administra, després de parlar-ho amb tu. No és el mateix que connectar-t’hi.')}</p>
          {/* Sense directori no hi ha nom de confiança (mai el de l'URL): els textos sense {nom}. */}
          <p className="sdp-connectar__ajuda">{nomDeConfianca
            ? ambNom('section.connectar.formarPart.senseXat', 'Demana-ho al xat de la pàgina de {nom}: és el seu canal per a preguntar i parlar amb qui l’administra.')
            : t('section.connectar.formarPart.senseXatSenseNom', 'Demana-ho al xat de la pàgina de l’entitat: és el seu canal per a preguntar i parlar amb qui l’administra.')}</p>
          {desti ? (
            <Boto varietat="secundari" icona={MessageCircle} onClick={() => navigate(desti)}>
              {nomDeConfianca
                ? ambNom('section.connectar.formarPart.obriXat', 'Obrir el xat de {nom}')
                : t('section.connectar.formarPart.obriXatSenseNom', 'Obrir el xat de l’entitat')}
            </Boto>
          ) : null}
        </>
      );
      break;
    }
    default:
      if (pendent) {
        cos = <Alerta to="exit">{t('section.perfil.connexions.pendent', 'Sol·licitud guardada, pendent de revisió per l’entitat.')}</Alerta>;
        break;
      }
      cos = (
        <>
          {/* P1-11 (pla 261024_2230; G1945-04 de Gemini, ordre del Mestre) · formar part no és connectar-s'hi. */}
          <p>{t('section.connectar.formarPart.que', 'Ser-ne membre, soci o treballador és una pertinença formal: t’hi dona d’alta qui l’administra, després de parlar-ho amb tu. No és el mateix que connectar-t’hi.')}</p>
          <p className="sdp-connectar__ajuda">{orgPendent
            ? t('section.perfil.connexions.pendentAjuda', 'La sol·licitud queda pendent: no et dona cap rol ni permís fins que l’entitat l’aprove.')
            : ambNom('section.connectar.formarPart.onArriba', 'La sol·licitud arribarà al xat privat de {nom}, i en parlareu abans de cap alta.')}</p>
          {/* FEDI-22 · El rol que es demana, abans del botó (C12: l'ajuda d'«Administrador» diu els poders i qui el dona). */}
          <GrupOpcions llegenda={t('section.connectar.formarPart.rolLlegenda', 'Amb quin rol ho demanes?')} nom={`${id}-rol`}
            opcions={opcionsDeRolDemanat(t)} valor={rolDemanat} onCanvi={setRolDemanat} disabled={enviant} />
          <Boto varietat="secundari" icona={Users} onClick={() => { setFallada(null); setObert(true); }}>
            {ambNom('section.connectar.formarPart.boto', 'Demanar formar part de {nom}')}
          </Boto>
        </>
      );
  }

  return (
    <section className="sdp-connectar__seccio" aria-labelledby={`${id}-formar-part`}>
      <h3 id={`${id}-formar-part`} className="sdp-connectar__titol-seccio">
        {t('section.connectar.formarPart.titol', 'Formar part de l’entitat')}
      </h3>
      {cos}
      {fallada ? (
        <Alerta to="error"
          accions={fallada.ruta ? (
            <Boto varietat="secundari" onClick={() => navigate(fallada.ruta)}>
              {ambNom('section.connectar.formarPart.obriXat', 'Obrir el xat de {nom}')}
            </Boto>
          ) : null}>
          {fallada.text}
        </Alerta>
      ) : null}
      {estat === 'pot-demanar' && !pendent ? (
        <DialegConfirmacio
          obert={obert}
          onTanca={() => { if (!enviant) setObert(false); }}
          onConfirma={confirma}
          titol={ambNom('section.connectar.formarPart.boto', 'Demanar formar part de {nom}')}
          descripcio={orgPendent
            ? t('section.perfil.connexions.pendentAjuda', 'La sol·licitud queda pendent: no et dona cap rol ni permís fins que l’entitat l’aprove.')
            : ambNom('section.connectar.formarPart.dialeg', 'Este és el missatge que rebrà {nom} al seu xat privat. Hi parlareu abans que t’hi donen d’alta.')}
          etiquetaConfirma={t('section.connectar.formarPart.envia', 'Enviar la sol·licitud')}
          etiquetaCancela={t('section.connectar.formarPart.cancela', 'Cancel·lar')}
          carregant={enviant}
        >
          {/* FEDI-22 · La capçalera i la línia del rol, tal com arribaran al xat. */}
          <p className="sdp-connectar__sollicitud"><span>{capcalera}</span><br /><span>{liniaRol}</span></p>
          {!orgPendent ? <Camp
            etiqueta={t('section.connectar.formarPart.afegit', 'Vols afegir-hi res?')}
            ajuda={ambNom('section.connectar.formarPart.afegitAjuda', 'Opcional. Ho llegirà qui administra {nom}.')}
          >
            <AreaText value={afegit} maxLength={LIMIT_AFEGIT} files={3} onChange={(e) => setAfegit(e.target.value)} />
          </Camp> : null}
        </DialegConfirmacio>
      ) : null}
    </section>
  );
}

export default BlocFormarPart;
