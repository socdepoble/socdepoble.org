/**
 * Lector de notícies · la GESTIÓ DE FONTS, dins de l'arbre de l'espai de
 * treball: el diàleg que obri «Gestiona les fonts», a la capçalera de la
 * columna de les carpetes (Noticies.jsx · onManageCategories).
 *
 * Ordre del Mestre (261024, 15:05) · «Adeu a la pàgina inflada de
 * /app/lector/fonts: les fonts viuen a l'arbre de carpetes de l'esquerra.
 * Desactiva o simplifica /app/lector/fonts perquè el Lector siga exclusivament
 * un UniversalWorkspace pur i fluid de tres columnes.» La pàgina (el catàleg en
 * UniversalCard amb boina, ColumnaCataleg, i «Les que seguixes» en NavTargetes)
 * se'n va (Gemini G2-01); d'ella queden només les peces que la gent necessita,
 * compactes i de Pedra Seca:
 *   · seguir o apagar cada font del catàleg: un Interruptor per font, per
 *     carpetes (GrupCamps). Una apagada continua ací i a l'arbre, marcada, per a
 *     tornar-la a encendre;
 *   · les fonts teues (FontsPersonals): el seu estat i «Lleva»;
 *   · «Afig una font» (AfigFont): una adreça https, un nom i, si vols, la
 *     carpeta. Codex D-06 · Ara s'hi arriba també en producció, no només amb
 *     el literal de la llavor: és l'API de sempre (fontsPersonals.js ·
 *     afigFontPersonal), sobre el magatzem de l'app (AppLector.jsx).
 * El text del servei és honest (correcció R5-04): qui llig cada font i què en
 * sap; sense el servei, o amb les teues apagades al servei, que queden
 * guardades en este dispositiu i es llegiran quan el servei les active.
 * Cap classe pròpia, cap targeta, cap llista escrita a mà.
 */
import { useEffect, useRef, useState } from 'react';
import {
  Alerta, Boto, Camp, CampText, Carregant, Dialeg, EstatBuit, GrupCamps, Interruptor, LiniesColleccio, Selector
} from '../../../components/PedraSeca/index.js';
import { llocDe, seguix } from '../nucli/index.js';
import { useVistaLector } from './context.js';
import { textDelMotiu } from './FontsSenseResposta.jsx';

const ESTATS_INTERRUPTOR = Object.freeze({ si: 'La seguixes', no: 'Apagada' });
const TEXTOS_PERSONALS = Object.freeze({ lleva: (nom) => `Lleva la font ${nom}` });

/* Qui llig les fonts, quan hi ha servei de notícies. */
const TEXT_SERVEI = 'Les fonts les llig el servei de notícies, no este dispositiu: el navegador no demana mai res a la web d’una font.';
/* Correcció R5-04 (261024) · El que el servei sap de veres quan llig les fonts teues: les adreces
   que li demanes i la connexió des d'on les demanes; mai una sessió ni una galeta. */
const TEXT_PERSONALS_SERVEI = 'Les teues fonts també les llig el servei de notícies. Sap quines adreces li demanes i des de quina '
  + 'connexió (l’adreça IP), però no qui eres: no hi va cap sessió ni cap galeta. L’adreça de cada font viatja en la petició i '
  + 'pot quedar als registres del servidor. Si en lleves una, ja no es demana.';
const TEXT_PERSONALS_PENDENTS = 'Les teues fonts queden guardades en este dispositiu. El servei de notícies encara no les llig: '
  + 'les llegirà quan el servei les active.';

const SENSE_CARPETA = '';
const ALTRES = 'Altres fonts';

/* Una adreça per a afegir: absoluta, segura (https) i sense usuari ni contrasenya; si no, el motiu.
   Correcció L-10 (261024 Lector final) · Amb la regla del servei (mitjans.js · adreca,
   la del client del servei per la seua porta, sense cap còpia ací), una adreça que el servei no
   llegiria no es desa: el motiu és el text de 'adreca' (FontsSenseResposta.jsx), abans de desar res i
   sense demanar res a ningú. `reglaDelServei`: mitjans.adreca, o null sense la regla. { adreca, motiu }:
   l'adreça que es desa (la normalitzada pel servei, si en dona la regla) o el motiu. */
function adrecaPerAAfegir(adreca, reglaDelServei) {
  if (adreca === '') return { adreca: null, motiu: 'Falta l’adreça de la font.' };
  if (reglaDelServei) {
    const neta = reglaDelServei(adreca);
    return neta ? { adreca: neta, motiu: null } : { adreca: null, motiu: textDelMotiu('adreca', { una: true }) };
  }
  let url = null;
  try {
    url = new URL(adreca);
  } catch {
    url = null;
  }
  if (!url || url.protocol !== 'https:' || url.username || url.password) {
    return {
      adreca: null,
      motiu: 'Només es poden afegir adreces web segures (https), sense usuari ni contrasenya: l’adreça del feed RSS o Atom de la web.'
    };
  }
  return { adreca, motiu: null };
}

/* SN (261003) · Les fonts que ha afegit la persona. Es poden llevar; en una pestanya lectora el
   magatzem no deixa escriure i no hi ha paperera.
   Correcció SN-R6 (el patró C16 de /connectar) · Llevar-ne una desmunta la paperera premuda: el
   focus va a la de la línia següent, o a l'anterior, o, si no en queda cap, al primer camp
   d'«Afig una font» (`reserva`, dins del mateix diàleg). Mai al <body> (WCAG 2.4.3). Es resol quan
   el DOM ja és el nou. */
function FontsPersonals({ fonts, reserva }) {
  const { lector, personals, noticies, llegixPersonals } = useVistaLector();
  const arrel = useRef(null);
  const rondaFocus = useRef(0);
  const [focusDesti, setFocusDesti] = useState(null);
  useEffect(() => {
    if (!focusDesti) return;
    /* Un avís pot invalidar la lectura de lleva(): l'èxit de l'escriptura
       encara no vol dir que la línia haja desaparegut de la vista. */
    if (personals.fonts.some((font) => font.id === focusDesti.llevadaId)) return;
    const { premuda } = focusDesti;
    const doc = premuda.ownerDocument;
    const encaraSeu = doc.activeElement === premuda || (!premuda.isConnected && doc.activeElement === doc.body);
    if (encaraSeu) {
      const veina = personals.fonts.find((font) => font.id === focusDesti.veinaId)
        || personals.fonts[Math.min(focusDesti.index, personals.fonts.length - 1)];
      const linia = [...(arrel.current?.querySelectorAll('[data-linia]') || [])].find((node) => node.dataset.linia === veina?.id);
      const desti = linia?.querySelector('button') || reserva();
      desti?.focus();
    }
    setFocusDesti(null);
  }, [focusDesti, personals.fonts, reserva]);

  if (personals.fonts.length === 0) return null;
  const nomDe = new Map(noticies.categories.map((categoria) => [categoria.id, categoria.nom]));
  const delArbre = new Map(fonts.map((font) => [font.id, font]));
  const estatDe = (font) => {
    const vista = delArbre.get(font.id);
    if (vista?.senseHttps) return 'Sense https: no es pot llegir';
    return !vista || vista.pendent ? 'Pendent' : null;
  };
  const linies = personals.fonts.map((font) => ({
    id: font.id,
    nom: font.nom,
    detall: [estatDe(font), llocDe(font.url), nomDe.get(font.categoriaId)].filter(Boolean).join(' · ')
  }));
  const lleva = async (linia) => {
    const ronda = ++rondaFocus.current;
    setFocusDesti(null);
    const index = personals.fonts.findIndex((font) => font.id === linia.id);
    const veina = personals.fonts[index + 1] || personals.fonts[index - 1] || null;
    const premuda = arrel.current?.ownerDocument.activeElement;
    const teFocus = arrel.current?.contains(premuda) && premuda.closest('[data-linia]')?.dataset.linia === linia.id;
    if (await personals.lleva(linia.id) && teFocus && ronda === rondaFocus.current) {
      setFocusDesti({ llevadaId: linia.id, veinaId: veina?.id ?? null, index, premuda });
    }
  };
  return (
    <div ref={arrel}>
      <Alerta to="info" titol="Les teues fonts" viva={false}>{llegixPersonals ? TEXT_PERSONALS_SERVEI : TEXT_PERSONALS_PENDENTS}</Alerta>
      <LiniesColleccio
        linies={linies}
        etiqueta="Les teues fonts"
        textos={TEXTOS_PERSONALS}
        onLleva={lector.mode === 'lectora' ? undefined : lleva}
      />
      {personals.error ? (
        /* Correcció SN-R9 · Neutre: pot haver fallat la lectura o l'escriptura. */
        <Alerta to="error" titol="Les teues fonts no estan disponibles">Torna a obrir el lector i prova-ho de nou.</Alerta>
      ) : null}
    </div>
  );
}

/* Codex D-06 (261024) · «Afig una font»: l'adreça (https), el nom (si no se'n posa cap, el domini) i
   la carpeta, opcional. La validació i el disc són els de l'API (fontsPersonals.js); ací només es
   comprova abans que l'adreça és segura, perquè el servei només llig https. Correcció L-10: amb el
   servei, que el servei la llegiria (adrecaPerAAfegir). */
function AfigFont({ formulari }) {
  const { lector, noticies, afigFont, llegixPersonals, mitjans } = useVistaLector();
  const [url, setUrl] = useState('');
  const [nom, setNom] = useState('');
  const [carpeta, setCarpeta] = useState(SENSE_CARPETA);
  const [error, setError] = useState(null);
  const [afegida, setAfegida] = useState(null);
  const [enviant, setEnviant] = useState(false);
  const lectora = lector.mode === 'lectora';
  const opcions = [
    { valor: SENSE_CARPETA, etiqueta: 'Sense carpeta' },
    ...noticies.categories.map((categoria) => ({ valor: categoria.id, etiqueta: categoria.nom }))
  ];
  const envia = async (event) => {
    event.preventDefault();
    if (enviant || lectora) return;
    setAfegida(null);
    const { adreca, motiu } = adrecaPerAAfegir(url.trim(), mitjans.adreca);
    if (motiu) {
      setError({ camp: 'url', text: motiu });
      formulari.current?.querySelector('input')?.focus();
      return;
    }
    setEnviant(true);
    try {
      const font = await afigFont({ url: adreca, nom: nom.trim() || llocDe(adreca), categoriaId: carpeta || null });
      setAfegida(font.nom);
      setUrl('');
      setNom('');
      setCarpeta(SENSE_CARPETA);
      setError(null);
    } catch (motiuDelDisc) {
      const text = typeof motiuDelDisc?.message === 'string' && motiuDelDisc.message ? motiuDelDisc.message : 'No s’ha pogut afegir la font.';
      setError({ camp: typeof motiuDelDisc?.camp === 'string' ? motiuDelDisc.camp : null, text });
    } finally {
      setEnviant(false);
    }
  };
  const errorDe = (camp) => (error?.camp === camp ? error.text : undefined);
  return (
    <form ref={formulari} onSubmit={envia} noValidate>
      <GrupCamps llegenda="Afig una font">
        <Camp etiqueta="Adreça del feed" ajuda="L’adreça RSS o Atom de la web, amb https." error={errorDe('url')} obligatori>
          <CampText tipus="url" inputMode="url" autoComplete="off" value={url} disabled={lectora}
            onChange={(event) => { setUrl(event.target.value); if (error) setError(null); }} />
        </Camp>
        <Camp etiqueta="Nom de la font" ajuda="Si no en poses cap, el del lloc web." error={errorDe('nom')}>
          <CampText value={nom} disabled={lectora} onChange={(event) => { setNom(event.target.value); if (error) setError(null); }} />
        </Camp>
        <Camp etiqueta="Carpeta" error={errorDe('categoria')}>
          <Selector opcions={opcions} value={carpeta} disabled={lectora} onChange={(event) => setCarpeta(event.target.value)} />
        </Camp>
        {error && !['url', 'nom', 'categoria'].includes(error.camp) ? (
          <Alerta to="error" titol="La font no s’ha afegit">{error.text}</Alerta>
        ) : null}
        {afegida ? (
          <Alerta to="exit" titol="Font afegida">
            {llegixPersonals ? `«${afegida}» ja és a l’arbre.` : `«${afegida}» ja és a l’arbre, pendent: ${TEXT_PERSONALS_PENDENTS}`}
          </Alerta>
        ) : null}
        {lectora ? (
          <Alerta to="avis" titol="Només per a mirar">El lector està obert en una altra pestanya: ací no es poden afegir ni llevar fonts.</Alerta>
        ) : null}
        <Boto tipus="submit" varietat="primari" carregant={enviant} disabled={lectora}>Afig la font</Boto>
      </GrupCamps>
    </form>
  );
}

/* El cos del diàleg: el catàleg per carpetes, les teues i «Afig una font». */
function CosDeLaGestio({ fonts }) {
  const { lector, noticies, delServei } = useVistaLector();
  const formulari = useRef(null);
  const [reserva] = useState(() => () => formulari.current?.querySelector('input') || null);
  if (noticies.estat === 'carregant' && noticies.fonts.length === 0) return <Carregant etiqueta="Carregant les fonts…" />;
  const delCataleg = fonts.filter((font) => !font.personal);
  const categories = new Set(noticies.categories.map((categoria) => categoria.id));
  const grups = [
    ...noticies.categories.map((categoria) => ({ id: categoria.id, nom: categoria.nom, fonts: delCataleg.filter((font) => font.categoriaId === categoria.id) })),
    { id: SENSE_CARPETA, nom: ALTRES, fonts: delCataleg.filter((font) => !categories.has(font.categoriaId)) }
  ].filter((grup) => grup.fonts.length > 0);
  return (
    <>
      {delServei ? <Alerta to="info" titol="Qui llig les fonts" viva={false}>{TEXT_SERVEI}</Alerta> : null}
      {noticies.estat === 'error' && delCataleg.length === 0 ? (
        <EstatBuit titol="No s’han pogut carregar les fonts" accio={<Boto varietat="secundari" onClick={noticies.rellegix}>Torna-ho a provar</Boto>}>
          Pot ser cosa d’un moment.
        </EstatBuit>
      ) : null}
      {grups.map((grup) => (
        <GrupCamps key={grup.id || '~altres'} llegenda={grup.nom}>
          {grup.fonts.map((font) => (
            <Interruptor key={font.id} etiqueta={font.nom} actiu={seguix(lector.estat, font.id)} textosEstat={ESTATS_INTERRUPTOR}
              onCanvi={() => lector.accions.commutaSeguiment(font.id)} />
          ))}
        </GrupCamps>
      ))}
      <FontsPersonals fonts={fonts} reserva={reserva} />
      <AfigFont formulari={formulari} />
    </>
  );
}

/**
 * `obert` / `onTanca`: el diàleg (Noticies.jsx). `fonts`: les de l'arbre (fontsDelLector.js).
 * Tancat, no hi ha res muntat: el diàleg no escolta res ni ocupa res.
 */
export function GestioDeFonts({ obert, onTanca, fonts }) {
  return (
    <Dialeg obert={obert} onTanca={onTanca} titol="Gestiona les fonts" mida="m"
      descripcio="Tria què vols llegir i afig les teues fonts. El que tries es guarda en este dispositiu.">
      {obert ? <CosDeLaGestio fonts={fonts} /> : null}
    </Dialeg>
  );
}
