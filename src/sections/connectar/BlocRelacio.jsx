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
 * Tots els textos passen per t() (CA-6): section.connectar.*.
 */
import { useId, useRef } from 'react';
import { UserPlus } from 'lucide-react';
import { useUIActions } from '../../app/contexts/UIContext';
import { Alerta, Boto, Carregant } from '../../components/PedraSeca/index.js';
import { useComentaEnPrivat } from '../../components/PedraSeca/hooks/useAccions.js';
import { omple } from '../../config/moderacio.js';
import { TEXTOS_ERROR_SEGUIMENT, useSeguiment } from './useSeguiment.js';

export function BlocRelacio({ contacte = null, deFitxa = false, calEntrar = false, onEntra, dataMode = 'remote', config = {} }) {
  const id = useId();
  const { t } = useUIActions();
  const obriXat = useComentaEnPrivat(contacte?.interlocutor ?? null);
  const seguiment = useSeguiment(contacte, {
    config,
    missatgeAvis: t('section.connectar.seguir.missatge', 'Connexió nova: m’he connectat amb tu a Sóc de Poble.')
  });
  const titolRef = useRef(null);
  const enfocaTitol = () => { if (titolRef.current?.isConnected) titolRef.current.focus(); };

  if (!contacte) {
    return (
      <section className="sdp-connectar__seccio" aria-labelledby={`${id}-relacio`}>
        <h3 id={`${id}-relacio`} className="sdp-connectar__titol-seccio">
          {t('section.connectar.persona.titolSenseNom', 'Connectar amb esta persona')}
        </h3>
        <p className="sdp-connectar__ajuda">
          {t('section.connectar.persona.ajudaSenseNom', 'Entra amb el teu compte per a vore qui és, connectar-t’hi o escriure-li.')}
        </p>
        <Boto varietat="secundari" onClick={() => onEntra?.()}>
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

  const segueix = async () => { if (await seguiment.segueix()) enfocaTitol(); };
  const deixa = async () => { if (await seguiment.deixa()) enfocaTitol(); };

  /* R3-11 · En llavor i en local el xat és d'este dispositiu: ningú no rep res. */
  const remot = dataMode === 'remote';
  const textDelResultat = {
    avisat: () => (remot
      ? ambNom('section.connectar.seguir.avisat', 'T’has connectat amb {nom}. Li hem enviat un missatge al xat.')
      : ambNom('section.connectar.seguir.avisatLlavor', 'T’has connectat amb {nom}. El missatge s’ha quedat al xat d’este dispositiu: ningú més l’ha rebut.')),
    represa: () => ambNom('section.connectar.seguir.represa', 'T’has tornat a connectar amb {nom}. Esta vegada no li hem enviat cap missatge: només s’avisa la primera.'),
    'sense-avis': () => ambNom('section.connectar.seguir.senseAvis', 'T’has connectat amb {nom}, però el missatge al xat no ha eixit. Si vols, escriu-li tu.'),
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
      seguir = (
        <p className="sdp-connectar__ajuda">
          {t('section.connectar.seguir.noDisponible', 'Este poble encara no permet connectar amb ningú des de l’app: de moment, la relació és la conversa.')}
        </p>
      );
      break;
    case 'sense-sessio':
      seguir = <p className="sdp-connectar__ajuda">{ambNom('section.connectar.seguir.senseSessio', 'Per a connectar amb {nom} has d’entrar amb el teu compte.')}</p>;
      break;
    case 'comprovant':
      seguir = <Carregant etiqueta={ambNom('section.connectar.seguir.comprovant', 'Comprovant la connexió amb {nom}…')} />;
      break;
    case 'segueix':
      seguir = (
        <>
          {resultat ? null : <p>{ambNom('section.connectar.seguir.jaSegueixes', 'Connectat amb {nom}.')}</p>}
          <Boto varietat="fantasma" onClick={deixa} carregant={seguiment.ocupat === 'deixa'}>
            {ambNom('section.connectar.seguir.deixa', 'Deixar la connexió amb {nom}')}
          </Boto>
        </>
      );
      break;
    case 'no-segueix':
      seguir = (
        <>
          {seguiment.errorLectura ? (
            <p className="sdp-connectar__ajuda">{ambNom('section.connectar.seguir.errorLectura', 'No s’ha pogut comprovar la connexió amb {nom}.')}</p>
          ) : null}
          {/* Directiva del Mestre (261024) · l'avís a l'altra banda es diu ABANS del clic. */}
          <p className="sdp-connectar__ajuda">{remot
            ? ambNom('section.connectar.seguir.avis', '{nom} rebrà un missatge al xat per a dir-li que t’hi has connectat.')
            : ambNom('section.connectar.seguir.avisLlavor', 'Sense servidor, el missatge per a {nom} es queda al xat d’este dispositiu: ningú més el rep.')}</p>
          {/* Integració 261024 (T6b · qui_em_segueix amb orgId) · qui administra
              l'entitat veu el nom del veïnat connectat: es diu abans del clic. */}
          {seguitEntitat ? (
            <p className="sdp-connectar__ajuda">
              {ambNom('section.connectar.seguir.avisEntitat', 'Les persones que administren {nom} voran el teu nom a la llista del veïnat connectat amb l’entitat.')}
            </p>
          ) : null}
          <Boto varietat="secundari" icona={UserPlus} onClick={segueix} carregant={seguiment.ocupat === 'segueix'}>
            {ambNom('section.connectar.seguir.boto', 'Connectar amb {nom}')}
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
      <h3 ref={titolRef} tabIndex={-1} id={`${id}-relacio`} className="sdp-connectar__titol-seccio">{titol}</h3>
      <p className="sdp-connectar__ajuda">
        {ambNom('section.connectar.relacio.ajuda', 'Una relació directa entre tu i {nom}, sense algoritmes ni intermediaris. No et fa membre de res.')}
      </p>
      {seguir}
      {resultat ? <p role="status">{resultat}</p> : null}
      {/* El motiu del contracte per a un codi conegut (SDP-SEG-*: el bloqueig, el
          poble, el límit…); si no n'hi ha, el text de sempre. Mai el del servidor. */}
      {textError ? <Alerta to="error">{textError}</Alerta> : null}
      {/* Gauntlet 261022_0225 · CA-4: en remot, obrir el xat ja crea la
          conversa, i l'autor la veu a la seua llista abans de cap missatge;
          en llavor (CN-R4) la conversa és d'este dispositiu i l'autor no la
          veu: un altre text. CA-6: el botó diu amb qui (el nom de l'element
          resolt), i tot passa per t(). */}
      <p>{remot
        ? ambNom('section.connectar.autor.text', 'Obri una conversa privada amb {nom}. Li apareixerà de seguida a la seua llista de converses, però no rebrà cap missatge fins que l’escrigues.')
        : ambNom('section.connectar.autor.textLlavor', 'Obri una conversa privada amb {nom} en este dispositiu. No rebrà cap missatge fins que l’escrigues.')}</p>
      <Boto varietat="secundari" onClick={() => (calEntrar ? onEntra?.() : obriXat())}>
        {calEntrar
          ? ambNom('section.connectar.autor.entra', 'Entra per a escriure-li a {nom}')
          : ambNom('section.connectar.autor.boto', 'Escriu-li a {nom}')}
      </Boto>
    </section>
  );
}

export default BlocRelacio;
