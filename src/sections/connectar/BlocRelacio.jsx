/**
 * BlocRelacio.jsx — El camí «Entre persones» de /connectar (IDEA-14,
 * Directiva del Mestre, 261024; auditoria Gemini G-04): la relació humana
 * amb l'autor d'un element o amb la persona o l'entitat d'un perfil.
 *
 *   · «Connectar amb {nom}» (useSeguiment, capacitat 'seguiments'): abans
 *     del clic es diu que l'altra banda rebrà un missatge al xat; després,
 *     si ha eixit o no (un avís que no ix no desfà la connexió). «Deixar la
 *     connexió amb {nom}» no avisa ningú. Sense la capacitat, ho diu i no hi
 *     ha botó. Integració 261024 · Si et connectes amb una entitat, també es
 *     diu abans del clic que les persones que l'administren voran el teu nom
 *     a la llista del veïnat connectat (qui_em_segueix amb orgId, T6b).
 *     P1-11 (pla 261024_2230; G1945-04 de Gemini, ordre del Mestre) · «A Sóc
 *     de Poble no se seguix, es connecta»: els textos diuen «Connectar amb
 *     {nom}», «Connectat amb {nom}.» i «veïnat connectat». El model no canvia:
 *     al port continua sent un seguiment d'un sol sentit (segueix,
 *     deixaDeSeguir, estatSeguiment), i les claus section.connectar.seguir.*
 *     es queden.
 *   · «Escriu-li a {nom}»: la via «En privat» de sempre (useComentaEnPrivat),
 *     amb els textos de CA-4 i CN-R4. L'entitat pilot va al xat de Sóc de
 *     Poble (CA-1).
 *   · Res d'açò et fa membre de cap entitat (és el camí «Formar part») ni
 *     connecta res a les notes (és el camí «A les teues notes»).
 *   · El nom és el del contacte de confiança (l'element resolt o la fitxa
 *     pública), mai el de l'URL. Sense contacte (en remot sense sessió, la
 *     fitxa d'una altra persona no es pot llegir), un bloc sense nom que porta
 *     a entrar.
 *   · Correcció C17 · Connectar i deixar la connexió desmunten el botó premut:
 *     el focus va al títol del bloc, no al <body>.
 *   · 261024 correccions · R3-11: fora del remot (llavor, local) el xat és
 *     d'este dispositiu, i l'avís ho diu abans i després del clic. R3-12: el
 *     motiu d'un error del contracte es diu en la llengua de qui mira
 *     (TEXTOS_ERROR_SEGUIMENT). R4-01: tornar-se a connectar no avisa
 *     ('represa'), i es diu.
 *   · FEDI-22 (ordre del Mestre, 261103; captura 261103_2055) · `principal`:
 *     el bloc és la targeta de la connexió directa d'un perfil, i el botó que
 *     diu botoPrincipalDeLaRelacio és el primari gran de la vista (un per
 *     vista): «Connectar amb {nom}» abans, «Escriu-li a {nom}» després, i
 *     «Entra per a connectar-hi» sense sessió (C3). La resta, secundaris, i
 *     «Deixar» fantasma, al final. Sense `principal` (un element, la
 *     titular), tot secundari com sempre. Amb el barret d'una entitat el botó
 *     diu qui es connecta («Connectar {entitat} amb {nom}»). L'avís continua
 *     ABANS del botó (Directiva 261024), i aria-describedby només apunta a
 *     les línies d'avís pintades (C9). L'ajuda de la relació baixa davall de
 *     l'estat.
 *   · Revisió 261104 · RA-03: amb `principal`, l'h3 «Connectar amb {nom}» no
 *     es pinta (.sdp-sr-only: el grup ja té el rètol de la targeta i el botó
 *     diu el mateix), però continua sent el títol del cos. C17 sense títol
 *     visible: quan l'acció va bé, el focus va al resultat (role=status, amb
 *     tabIndex -1); sense `principal`, a l'h3 com sempre. C-02: quan falla,
 *     el focus va a l'avís d'error (abans queia al <body>: el botó premut es
 *     desactiva mentre treballa).
 * Tots els textos passen per t() (CA-6): section.connectar.*.
 */
import { useEffect, useId, useRef, useState } from 'react';
import { MessageCircle, UserPlus } from 'lucide-react';
import { useUIActions } from '../../app/contexts/UIContext';
import { Alerta, Boto, Carregant } from '../../components/PedraSeca/index.js';
import { useComentaEnPrivat } from '../../components/PedraSeca/hooks/useAccions.js';
import { omple } from '../../config/moderacio.js';
import { TEXTOS_ERROR_SEGUIMENT, useSeguiment } from './useSeguiment.js';
import { botoPrincipalDeLaRelacio } from './modeDeConnectar.js';
import { VisibilitatDeLaConnexio } from './VisibilitatDeLaConnexio.jsx';

/* IDEA-22 (pla 261025_0045, T5; Directiva del Mestre 261025) · `com` i
   `nomCom`: l'entitat que la persona administra i amb la qual es connecta
   (ConnectarSection, «Connectar com a»), sense canviar l'actor de la sessió.
   El seguiment és d'ella (useSeguiment), i l'ajuda la nomena. Com a
   entitat no ix cap missatge al xat (el xat personal diria quina persona
   l'administra; revisió adversarial 261025): es diu abans del clic i
   després. La conversa privada («Escriu-li») continua sent de la persona.
   Sense `com`, la persona, com sempre.
   C0200-02 (auditoria Codex 261025_0200) · Amb `com`, el xat continua sent
   el personal de qui mira (`nomPersona`), i es diu ABANS del clic: el botó
   «Escriu-li a {nom} com a {persona}» i una línia que el xat és personal
   (l'entitat no en té cap de propi ací). Cap missatgeria d'entitat.
   C0200-06 · Un contacte que és de qui mira (`propia`) no té xat: mai un
   directe amb tu mateixa. I sense `com` no es connecta: persona → ella
   mateixa o → una entitat que administra no val (SDP-SEG-003). */
export function BlocRelacio({ contacte = null, deFitxa = false, calEntrar = false, onEntra, dataMode = 'remote', config = {}, com = null, nomCom = '', nomPersona = '', principal = false }) {
  const id = useId();
  const { t } = useUIActions();
  const obriXat = useComentaEnPrivat(contacte?.interlocutor ?? null);
  const ambEntitat = Boolean(com) && Boolean(nomCom);
  const propi = Boolean(contacte?.propia);
  const seguiment = useSeguiment(propi && !ambEntitat ? null : contacte, {
    config,
    com: ambEntitat ? com : null,
    missatgeAvis: t('section.connectar.seguir.missatge', 'Connexió nova: m’he connectat amb tu a Sóc de Poble.')
  });
  const titolRef = useRef(null);
  const resultatRef = useRef(null);
  const errorRef = useRef(null);
  /* C17 i C-02 · On va el focus després d'una acció ('titol', 'resultat' o
     'error'): s'enfoca després de pintar, quan el resultat o l'error ja hi són.
     Si el destí no s'ha pintat (una clau que ha canviat), el títol. */
  const [focusA, setFocusA] = useState(null);
  useEffect(() => {
    if (!focusA) return;
    const desti = { resultat: resultatRef, error: errorRef }[focusA]?.current;
    const objectiu = desti?.isConnected ? desti : titolRef.current;
    if (objectiu?.isConnected) objectiu.focus();
    setFocusA(null);
  }, [focusA]);
  /* FEDI-22 · Quin botó és el primari gran (només amb `principal`): 'entra', 'connecta', 'escriu' o cap. */
  const primari = principal ? botoPrincipalDeLaRelacio({ teContacte: Boolean(contacte), estat: seguiment.estat, propi }) : null;
  const varietatDe = (boto) => (primari === boto ? { varietat: 'primari', mida: 'gran' } : { varietat: 'secundari' });

  if (!contacte) {
    return (
      <section className="sdp-connectar__seccio" aria-labelledby={`${id}-relacio`}>
        <h3 id={`${id}-relacio`} className="sdp-connectar__titol-seccio">
          {t('section.connectar.persona.titolSenseNom', 'Connectar amb esta persona')}
        </h3>
        <p className="sdp-connectar__ajuda">
          {t('section.connectar.persona.ajudaSenseNom', 'Entra amb el teu compte per a vore qui és, connectar-t’hi o escriure-li.')}
        </p>
        <Boto {...varietatDe('entra')} onClick={() => onEntra?.()}>
          {t('section.connectar.persona.entraSenseNom', 'Entra per a connectar-hi')}
        </Boto>
      </section>
    );
  }

  const nom = contacte.nom;
  const ambNom = (clau, reserva) => omple(t(clau, reserva), { nom });
  const seguitEntitat = contacte.seguiment?.tipus === 'entitat';
  const titol = deFitxa
    ? ambNom('section.connectar.persona.titol', 'Connectar amb {nom}')
    : t('section.connectar.autor.titol', 'Connectar amb l’autor');

  const despresDe = (fet) => setFocusA(fet ? (principal ? 'resultat' : 'titol') : 'error');
  const segueix = async () => despresDe(await seguiment.segueix());
  const deixa = async () => despresDe(await seguiment.deixa());

  /* R3-11 · En llavor i en local el xat és d'este dispositiu: ningú no rep res. */
  const remot = dataMode === 'remote';
  /* C0200-02 · Amb el barret d'una entitat, el xat és el de la persona: el botó ho diu. */
  const xatComPersona = ambEntitat && Boolean(nomPersona) && !calEntrar;
  const textDelResultat = {
    avisat: () => (remot
      ? ambNom('section.connectar.seguir.avisat', 'T’has connectat amb {nom}. Li hem enviat un missatge al xat.')
      : ambNom('section.connectar.seguir.avisatLlavor', 'T’has connectat amb {nom}. El missatge s’ha quedat al xat d’este dispositiu: ningú més l’ha rebut.')),
    represa: () => ambNom('section.connectar.seguir.represa', 'T’has tornat a connectar amb {nom}. Esta vegada no li hem enviat cap missatge: només s’avisa la primera.'),
    'sense-avis': () => ambNom('section.connectar.seguir.senseAvis', 'T’has connectat amb {nom}, però el missatge al xat no ha eixit. Si vols, escriu-li tu.'),
    'com-entitat': () => omple(t('section.connectar.seguir.avisatCom', 'Has connectat {entitat} amb {nom}. No li hem enviat cap missatge al xat: ho veurà a la llista del veïnat connectat.'), { nom, entitat: nomCom }),
    deixat: () => ambNom('section.connectar.seguir.deixat', 'Has deixat la connexió amb {nom}. No li hem dit res.')
  };
  /* 'ja-seguies' (o cap acció) no té línia de resultat: ho diu l'estat. */
  const resultat = Object.hasOwn(textDelResultat, seguiment.avis ?? '') ? textDelResultat[seguiment.avis]() : null;
  /* R3-12 · El motiu d'un codi del contracte, traduït; si no n'hi ha, el text de sempre. Mai el del servidor. */
  const textError = !seguiment.error ? null
    : seguiment.error.codi ? t(...TEXTOS_ERROR_SEGUIMENT[seguiment.error.codi])
      : seguiment.error.accio === 'deixa'
        ? ambNom('section.connectar.seguir.errorDeixa', 'No s’ha pogut deixar la connexió amb {nom}. Torna-ho a provar.')
        : ambNom('section.connectar.seguir.errorSegueix', 'No s’ha pogut connectar amb {nom}. Torna-ho a provar.');

  let seguir;
  switch (seguiment.estat) {
    case 'no-disponible':
      /* C0200-06 · Amb una identitat pròpia no hi ha conversa que fer de
         relació (cap xat amb tu mateixa): el text ho diu sense prometre-la. */
      seguir = propi ? (
        <p className="sdp-connectar__ajuda">
          {t('section.connectar.seguir.noDisponiblePropia', 'Este poble encara no permet connectar les teues identitats entre elles des de l’app.')}
        </p>
      ) : (
        <p className="sdp-connectar__ajuda">
          {t('section.connectar.seguir.noDisponible', 'Este poble encara no permet connectar amb ningú des de l’app: de moment, la relació és la conversa.')}
        </p>
      );
      break;
    case 'sense-sessio':
      seguir = (
        <>
          <p className="sdp-connectar__ajuda">{ambNom('section.connectar.seguir.senseSessio', 'Per a connectar amb {nom} has d’entrar amb el teu compte.')}</p>
          {/* FEDI-22 (C3) · A la targeta principal, el primari és entrar per a CONNECTAR, no per a escriure. */}
          {primari === 'entra' ? (
            <Boto {...varietatDe('entra')} onClick={() => onEntra?.()}>
              {t('section.connectar.persona.entraSenseNom', 'Entra per a connectar-hi')}
            </Boto>
          ) : null}
        </>
      );
      break;
    case 'comprovant':
      seguir = <Carregant etiqueta={ambNom('section.connectar.seguir.comprovant', 'Comprovant la connexió amb {nom}…')} />;
      break;
    case 'segueix':
      /* FEDI-22 · «Deixar la connexió» baixa al final del bloc (davall d'«Escriu-li»). */
      seguir = resultat ? null : <p>{ambNom('section.connectar.seguir.jaSegueixes', 'Connectat amb {nom}.')}</p>;
      break;
    case 'no-segueix':
      seguir = (
        <>
          {seguiment.errorLectura ? (
            <p className="sdp-connectar__ajuda">{ambNom('section.connectar.seguir.errorLectura', 'No s’ha pogut comprovar la connexió amb {nom}.')}</p>
          ) : null}
          {/* Directiva del Mestre (261024) · l'avís a l'altra banda es diu ABANS del clic. */}
          {/* IDEA-22 · Com a entitat, cap missatge al xat: ho diu la línia de l'entitat (davall) o esta. */}
          {ambEntitat && seguitEntitat ? null : (
            <p id={`${id}-avis`} className="sdp-connectar__ajuda">{ambEntitat
              ? omple(t('section.connectar.seguir.avisCom', 'Com a {entitat}, no li enviarem cap missatge al xat: {nom} ho veurà a la llista del veïnat connectat.'), { nom, entitat: nomCom })
              : remot
                ? ambNom('section.connectar.seguir.avis', '{nom} rebrà un missatge al xat per a dir-li que t’hi has connectat.')
                : ambNom('section.connectar.seguir.avisLlavor', 'Sense servidor, el missatge per a {nom} es queda al xat d’este dispositiu: ningú més el rep.')}</p>
          )}
          {/* Integració 261024 (T6b · qui_em_segueix amb orgId) · qui administra
              l'entitat veu el nom del veïnat connectat: es diu abans del clic. */}
          {seguitEntitat ? (
            <p id={`${id}-avis-entitat`} className="sdp-connectar__ajuda">
              {/* IDEA-22 (T5) · connectant com a entitat, a la llista hi ix l'entitat, no la persona. */}
              {ambEntitat
                ? omple(t('section.connectar.seguir.avisEntitatCom', 'Les persones que administren {nom} voran {entitat} a la llista del veïnat connectat amb l’entitat, sense cap missatge al xat.'), { nom, entitat: nomCom })
                : ambNom('section.connectar.seguir.avisEntitat', 'Les persones que administren {nom} voran el teu nom a la llista del veïnat connectat amb l’entitat.')}
            </p>
          ) : null}
          {/* FEDI-22 (C9) · El botó es descriu amb les línies d'avís que s'han pintat, i cap més. Amb el barret
              d'una entitat, el nom diu qui es connecta. */}
          <Boto {...varietatDe('connecta')} icona={UserPlus} onClick={segueix} carregant={seguiment.ocupat === 'segueix'}
            aria-describedby={[!(ambEntitat && seguitEntitat) && `${id}-avis`, seguitEntitat && `${id}-avis-entitat`].filter(Boolean).join(' ') || undefined}>
            {ambEntitat
              ? omple(t('section.connectar.seguir.botoCom', 'Connectar {entitat} amb {nom}'), { nom, entitat: nomCom })
              : ambNom('section.connectar.seguir.boto', 'Connectar amb {nom}')}
          </Boto>
        </>
      );
      break;
    default:
      /* 'no-seguible' · hi ha la capacitat, però amb este contacte no es pot connectar des d'ací (un id de la llavor en remot). */
      seguir = null;
  }

  return (
    <section className="sdp-connectar__seccio" aria-labelledby={`${id}-relacio`}>
      {/* RA-03 · Amb `principal`, el títol només per al lector de pantalla. */}
      <h3 ref={titolRef} tabIndex={-1} id={`${id}-relacio`} className={principal ? 'sdp-sr-only' : 'sdp-connectar__titol-seccio'}>{titol}</h3>
      {seguir}
      {resultat ? <p ref={resultatRef} tabIndex={-1} role="status">{resultat}</p> : null}
      {/* El motiu del contracte per a un codi conegut (SDP-SEG-*: el bloqueig, el
          poble, el límit…); si no n'hi ha, el text de sempre. Mai el del servidor.
          C-02 · Enfocable (tabIndex -1): hi va el focus quan l'acció falla. */}
      {textError ? <div ref={errorRef} tabIndex={-1} className="sdp-connectar__error"><Alerta to="error">{textError}</Alerta></div> : null}
      {/* FEDI-22 · L'ajuda de la relació, davall de l'estat i del botó de connectar. */}
      <p className="sdp-connectar__ajuda">
        {ambEntitat
          ? omple(t('section.connectar.relacio.ajudaEntitat', 'Una relació directa entre {entitat} i {nom}, sense algoritmes ni intermediaris. No fa ningú membre de res.'), { nom, entitat: nomCom })
          : ambNom('section.connectar.relacio.ajuda', 'Una relació directa entre tu i {nom}, sense algoritmes ni intermediaris. No et fa membre de res.')}
      </p>
      {/* Gauntlet 261022_0225 · CA-4: en remot, obrir el xat ja crea la
          conversa, i l'autor la veu a la seua llista abans de cap missatge;
          en llavor (CN-R4) la conversa és d'este dispositiu i l'autor no la
          veu: un altre text. CA-6: el botó diu amb qui (el nom de l'element
          resolt), i tot passa per t().
          C0200-06 · Amb tu mateixa (o una entitat teua), cap xat. */}
      {propi ? null : (
        <>
          <p>{remot
            ? ambNom('section.connectar.autor.text', 'Obri una conversa privada amb {nom}. Li apareixerà de seguida a la seua llista de converses, però no rebrà cap missatge fins que l’escrigues.')
            : ambNom('section.connectar.autor.textLlavor', 'Obri una conversa privada amb {nom} en este dispositiu. No rebrà cap missatge fins que l’escrigues.')}</p>
          {/* C0200-02 · El barret d'entitat no val per al xat: es diu abans del clic, amb el nom de la persona. */}
          {xatComPersona && remot ? (
            <p>{omple(t('section.connectar.autor.textCom', 'El xat és personal: {nom} veurà que li escriu {persona}, no {entitat}, que ací no té xat propi.'), { nom, persona: nomPersona, entitat: nomCom })}</p>
          ) : null}
          <Boto {...varietatDe('escriu')} icona={MessageCircle} onClick={() => (calEntrar ? onEntra?.() : obriXat())}>
            {calEntrar
              ? ambNom('section.connectar.autor.entra', 'Entra per a escriure-li a {nom}')
              : xatComPersona
                ? omple(t('section.connectar.autor.botoCom', 'Escriu-li a {nom} com a {persona}'), { nom, persona: nomPersona })
                : ambNom('section.connectar.autor.boto', 'Escriu-li a {nom}')}
          </Boto>
        </>
      )}
      {/* FEDI-23 (ordre del Mestre, 261103) · Connectat: si esta connexió es mostra a la fitxa pública. */}
      {seguiment.estat === 'segueix' && !propi ? (
        <VisibilitatDeLaConnexio com={ambEntitat ? com : null} nomCom={nomCom} connexio={contacte.seguiment} nom={nom} config={config} />
      ) : null}
      {seguiment.estat === 'segueix' ? (
        <Boto varietat="fantasma" onClick={deixa} carregant={seguiment.ocupat === 'deixa'}>
          {ambNom('section.connectar.seguir.deixa', 'Deixar la connexió amb {nom}')}
        </Boto>
      ) : null}
    </section>
  );
}

export default BlocRelacio;
