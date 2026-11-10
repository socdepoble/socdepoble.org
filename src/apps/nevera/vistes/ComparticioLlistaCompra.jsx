/**
 * La Nevera de Casa · compartir la llista de la compra i rebre'n una (R16-F).
 * Va a l'avís de La compra, al costat de la recepció de receptes.
 *   · Envia: l'enllaç (<origen>/app/nevera/llista#compartida=…, al porta-retalls
 *     o, si el navegador no ho deixa, en un camp per a copiar-lo) o el fitxer
 *     .json, amb la descàrrega de l'app. El nucli fa el paquet
 *     (nucli/comparticio.js); la vista no en toca el format.
 *   · Rep: l'enllaç obert (el fragment arriba a la llista per defecte) o
 *     l'enllaç o el text del fitxer enganxats. Rebre només obri una
 *     previsualització amb una casella per article: afegir és una acció
 *     explícita, i ho fa fusionaLlistaCompartida (accions.fusionaLlistaCompartida),
 *     que conserva el que ja hi ha. Afegir o descartar lleva el fragment de la URL.
 *     Cap selector de fitxers: CampFitxer escriu el seu estat només en valencià.
 * Els textos, en les cinc llengües de la interfície (useClosaAplicacio().idioma).
 */
import { useMemo, useState } from 'react';
import { Download, Link2, Share2, Upload } from 'lucide-react';
import { useLocation, useNavigate, useRouter } from '../../../app/contexts/RouterContext';
import { Alerta, Boto, Botonera, Camp, CampText, Casella, GrupCamps } from '../../../components/PedraSeca/index.js';
import { useClosaAplicacio } from '../../plataforma/index.js';
import {
  PREFIX_FRAGMENT_COMPARTIDA, enllacLlistaCompartida, exportaLlistaCompra, importaLlistaCompra,
  serialitzaLlistaCompartida
} from '../nucli/index.js';
import { COMPRA } from './constants.js';
import { useVistaNevera } from './context.js';

const articlesCa = (n) => `${n} ${n === 1 ? 'article' : 'articles'}`;
const articlesEs = (n) => `${n} ${n === 1 ? 'artículo' : 'artículos'}`;
const articlesEn = (n) => `${n} ${n === 1 ? 'item' : 'items'}`;
const articlesEu = (n) => `${n} artikulu`;
const articlesGl = (n) => `${n} ${n === 1 ? 'artigo' : 'artigos'}`;
const frases = (...parts) => parts.filter(Boolean).join(' ');

const TEXTOS = Object.freeze({
  ca: {
    obri: 'Compartix o importa la llista',
    tanca: 'Tanca la compartició',
    botonera: 'Compartir la llista',
    llegenda: (nom) => `Compartir «${nom}»`,
    envia: 'Envia la llista',
    copia: 'Copia l’enllaç',
    descarrega: 'Descarrega el fitxer',
    enllac: 'Enllaç per a compartir',
    ajudaEnllac: 'Este navegador no ha deixat copiar-lo: selecciona’l i copia’l tu.',
    importa: 'Enllaç o text rebut',
    ajudaImporta: 'Enganxa l’enllaç o el text del fitxer que t’han enviat. Abans d’afegir res, veuràs què porta.',
    rep: 'Llista rebuda',
    revisa: 'Revisa la llista rebuda',
    rebuda: (titol, n) => `${titol ? `Llista compartida «${titol}»` : 'Llista compartida'} · ${articlesCa(n)}`,
    triaRebuda: (nom) => `Tria què vols afegir a «${nom}». El que ja hi és es queda tal com està.`,
    afig: (nom) => `Afig els triats a «${nom}»`,
    descarta: 'Descarta-la',
    titolError: 'No s’ha pogut llegir la llista compartida',
    noAfegit: 'No s’ha afegit cap article.',
    errors: {
      buit: 'No hi ha res per llegir: enganxa l’enllaç o el text del fitxer.',
      'massa-gran': 'És massa gran per a ser una llista de la compra.',
      format: 'No és un enllaç ni un fitxer de llista de la Nevera, o ha arribat incomplet.',
      'sense-articles': 'La llista compartida no porta cap article.',
      'massa-llarga': 'La llista és massa llarga per a un enllaç: descarrega el fitxer i envia’l.'
    },
    copiat: (nom) => `Enllaç de «${nom}» copiat. Envia’l per on vulgues: qui l’òbriga veurà la llista abans d’afegir-la.`,
    descarregat: (nom) => `Fitxer de «${nom}» descarregat.`,
    noEscriu: 'Ara no es pot afegir res: la nevera està oberta en una altra pestanya o les dades d’este dispositiu no s’han pogut llegir.',
    resultat: ({ afegits, conservats, descartats }, nom) => frases(
      afegits ? `${afegits === 1 ? 'S’ha afegit' : 'S’han afegit'} ${articlesCa(afegits)} a «${nom}».` : `«${nom}» no ha canviat.`,
      conservats ? `${articlesCa(conservats)} ja hi ${conservats === 1 ? 'era' : 'eren'}.` : '',
      descartats ? `${articlesCa(descartats)} no hi ${descartats === 1 ? 'cap' : 'caben'}: la llista és plena.` : ''
    )
  },
  es: {
    obri: 'Comparte o importa la lista',
    tanca: 'Cierra el panel de compartir',
    botonera: 'Compartir la lista',
    llegenda: (nom) => `Compartir «${nom}»`,
    envia: 'Envía la lista',
    copia: 'Copia el enlace',
    descarrega: 'Descarga el archivo',
    enllac: 'Enlace para compartir',
    ajudaEnllac: 'Este navegador no ha permitido copiarlo: selecciónalo y cópialo tú.',
    importa: 'Enlace o texto recibido',
    ajudaImporta: 'Pega el enlace o el texto del archivo que te han enviado. Antes de añadir nada, verás qué contiene.',
    rep: 'Lista recibida',
    revisa: 'Revisa la lista recibida',
    rebuda: (titol, n) => `${titol ? `Lista compartida «${titol}»` : 'Lista compartida'} · ${articlesEs(n)}`,
    triaRebuda: (nom) => `Elige qué quieres añadir a «${nom}». Lo que ya está se queda tal cual.`,
    afig: (nom) => `Añade los elegidos a «${nom}»`,
    descarta: 'Descártala',
    titolError: 'No se ha podido leer la lista compartida',
    noAfegit: 'No se ha añadido ningún artículo.',
    errors: {
      buit: 'No hay nada que leer: pega el enlace o el texto del archivo.',
      'massa-gran': 'Es demasiado grande para ser una lista de la compra.',
      format: 'No es un enlace ni un archivo de lista de la Nevera, o ha llegado incompleto.',
      'sense-articles': 'La lista compartida no trae ningún artículo.',
      'massa-llarga': 'La lista es demasiado larga para un enlace: descarga el archivo y envíalo.'
    },
    copiat: (nom) => `Enlace de «${nom}» copiado. Envíalo por donde quieras: quien lo abra verá la lista antes de añadirla.`,
    descarregat: (nom) => `Archivo de «${nom}» descargado.`,
    noEscriu: 'Ahora no se puede añadir nada: la nevera está abierta en otra pestaña o los datos de este dispositivo no se han podido leer.',
    resultat: ({ afegits, conservats, descartats }, nom) => frases(
      afegits ? `${afegits === 1 ? 'Se ha añadido' : 'Se han añadido'} ${articlesEs(afegits)} a «${nom}».` : `«${nom}» no ha cambiado.`,
      conservats ? `${articlesEs(conservats)} ya ${conservats === 1 ? 'estaba' : 'estaban'}.` : '',
      descartats ? `${articlesEs(descartats)} no ${descartats === 1 ? 'cabe' : 'caben'}: la lista está llena.` : ''
    )
  },
  en: {
    obri: 'Share or import the list',
    tanca: 'Close sharing',
    botonera: 'Share the list',
    llegenda: (nom) => `Share “${nom}”`,
    envia: 'Send the list',
    copia: 'Copy link',
    descarrega: 'Download file',
    enllac: 'Link to share',
    ajudaEnllac: 'This browser did not allow copying it: select it and copy it yourself.',
    importa: 'Received link or text',
    ajudaImporta: 'Paste the link or the text of the file you were sent. Before anything is added, you will see what it contains.',
    rep: 'Received list',
    revisa: 'Review the received list',
    rebuda: (titol, n) => `${titol ? `Shared list “${titol}”` : 'Shared list'} · ${articlesEn(n)}`,
    triaRebuda: (nom) => `Choose what to add to “${nom}”. Whatever is already there stays as it is.`,
    afig: (nom) => `Add the selected items to “${nom}”`,
    descarta: 'Discard it',
    titolError: 'The shared list could not be read',
    noAfegit: 'No item has been added.',
    errors: {
      buit: 'There is nothing to read: paste the link or the text of the file.',
      'massa-gran': 'It is too large to be a shopping list.',
      format: 'It is not a Nevera list link or file, or it arrived incomplete.',
      'sense-articles': 'The shared list has no items.',
      'massa-llarga': 'The list is too long for a link: download the file and send it.'
    },
    copiat: (nom) => `Link to “${nom}” copied. Send it any way you like: whoever opens it will see the list before adding it.`,
    descarregat: (nom) => `File of “${nom}” downloaded.`,
    noEscriu: 'Nothing can be added right now: the fridge is open in another tab or the data on this device could not be read.',
    resultat: ({ afegits, conservats, descartats }, nom) => frases(
      afegits ? `${articlesEn(afegits)} added to “${nom}”.` : `“${nom}” has not changed.`,
      conservats ? `${articlesEn(conservats)} ${conservats === 1 ? 'was' : 'were'} already there.` : '',
      descartats ? `${articlesEn(descartats)} did not fit: the list is full.` : ''
    )
  },
  eu: {
    obri: 'Partekatu edo inportatu zerrenda',
    tanca: 'Itxi partekatzea',
    botonera: 'Zerrenda partekatu',
    llegenda: (nom) => `«${nom}» partekatu`,
    envia: 'Bidali zerrenda',
    copia: 'Kopiatu esteka',
    descarrega: 'Deskargatu fitxategia',
    enllac: 'Partekatzeko esteka',
    ajudaEnllac: 'Nabigatzaile honek ez du kopiatzen utzi: hautatu eta kopiatu zuk zeuk.',
    importa: 'Jasotako esteka edo testua',
    ajudaImporta: 'Itsatsi bidali dizuten esteka edo fitxategiaren testua. Ezer gehitu aurretik, zer dakarren ikusiko duzu.',
    rep: 'Jasotako zerrenda',
    revisa: 'Berrikusi jasotako zerrenda',
    rebuda: (titol, n) => `${titol ? `Partekatutako zerrenda «${titol}»` : 'Partekatutako zerrenda'} · ${articlesEu(n)}`,
    triaRebuda: (nom) => `Aukeratu «${nom}» zerrendara zer gehitu nahi duzun. Lehendik dagoena dagoen bezala geratzen da.`,
    afig: (nom) => `Gehitu aukeratutakoak «${nom}» zerrendara`,
    descarta: 'Baztertu',
    titolError: 'Ezin izan da partekatutako zerrenda irakurri',
    noAfegit: 'Ez da artikulurik gehitu.',
    errors: {
      buit: 'Ez dago ezer irakurtzeko: itsatsi esteka edo fitxategiaren testua.',
      'massa-gran': 'Handiegia da erosketa-zerrenda bat izateko.',
      format: 'Ez da Neverako zerrenda baten esteka edo fitxategia, edo osatu gabe iritsi da.',
      'sense-articles': 'Partekatutako zerrendak ez dakar artikulurik.',
      'massa-llarga': 'Zerrenda luzeegia da esteka baterako: deskargatu fitxategia eta bidali.'
    },
    copiat: (nom) => `«${nom}» zerrendaren esteka kopiatu da. Bidali nahi duzun bidetik: irekitzen duenak zerrenda ikusiko du gehitu aurretik.`,
    descarregat: (nom) => `«${nom}» zerrendaren fitxategia deskargatu da.`,
    noEscriu: 'Orain ezin da ezer gehitu: hozkailua beste fitxa batean irekita dago edo gailu honetako datuak ezin izan dira irakurri.',
    resultat: ({ afegits, conservats, descartats }, nom) => frases(
      afegits ? `${articlesEu(afegits)} ${afegits === 1 ? 'gehitu da' : 'gehitu dira'} «${nom}» zerrendara.` : `«${nom}» ez da aldatu.`,
      conservats ? `${articlesEu(conservats)} lehendik ${conservats === 1 ? 'bazegoen' : 'bazeuden'}.` : '',
      descartats ? `${articlesEu(descartats)} ez ${descartats === 1 ? 'da sartu' : 'dira sartu'}: zerrenda beteta dago.` : ''
    )
  },
  gl: {
    obri: 'Comparte ou importa a lista',
    tanca: 'Pecha a compartición',
    botonera: 'Compartir a lista',
    llegenda: (nom) => `Compartir «${nom}»`,
    envia: 'Envía a lista',
    copia: 'Copia a ligazón',
    descarrega: 'Descarga o ficheiro',
    enllac: 'Ligazón para compartir',
    ajudaEnllac: 'Este navegador non deixou copiala: selecciónaa e cópiaa ti.',
    importa: 'Ligazón ou texto recibido',
    ajudaImporta: 'Pega a ligazón ou o texto do ficheiro que che enviaron. Antes de engadir nada, verás que trae.',
    rep: 'Lista recibida',
    revisa: 'Revisa a lista recibida',
    rebuda: (titol, n) => `${titol ? `Lista compartida «${titol}»` : 'Lista compartida'} · ${articlesGl(n)}`,
    triaRebuda: (nom) => `Escolle que queres engadir a «${nom}». O que xa está queda tal como está.`,
    afig: (nom) => `Engade os escollidos a «${nom}»`,
    descarta: 'Descártaa',
    titolError: 'Non se puido ler a lista compartida',
    noAfegit: 'Non se engadiu ningún artigo.',
    errors: {
      buit: 'Non hai nada que ler: pega a ligazón ou o texto do ficheiro.',
      'massa-gran': 'É demasiado grande para ser unha lista da compra.',
      format: 'Non é unha ligazón nin un ficheiro de lista da Nevera, ou chegou incompleto.',
      'sense-articles': 'A lista compartida non trae ningún artigo.',
      'massa-llarga': 'A lista é demasiado longa para unha ligazón: descarga o ficheiro e envíao.'
    },
    copiat: (nom) => `Ligazón de «${nom}» copiada. Envíaa por onde queiras: quen a abra verá a lista antes de engadila.`,
    descarregat: (nom) => `Ficheiro de «${nom}» descargado.`,
    noEscriu: 'Agora non se pode engadir nada: a neveira está aberta noutra lapela ou os datos deste dispositivo non se puideron ler.',
    resultat: ({ afegits, conservats, descartats }, nom) => frases(
      afegits ? `${afegits === 1 ? 'Engadíuse' : 'Engadíronse'} ${articlesGl(afegits)} a «${nom}».` : `«${nom}» non cambiou.`,
      conservats ? `${articlesGl(conservats)} xa ${conservats === 1 ? 'estaba' : 'estaban'}.` : '',
      descartats ? `${articlesGl(descartats)} non ${descartats === 1 ? 'cabe' : 'caben'}: a lista está chea.` : ''
    )
  }
});

/* Una llista rebuda: una casella per article (totes triades) i l'acció explícita d'afegir. */
function PrevisualitzacioRebuda({ paquet, llista, textos, potEscriure, onAfig, onDescarta }) {
  const [exclosos, setExclosos] = useState(() => new Set());
  const triades = paquet.linies.filter((_, index) => !exclosos.has(index));
  const commuta = (index, triada) => setExclosos((actuals) => {
    const nous = new Set(actuals);
    if (triada) nous.delete(index);
    else nous.add(index);
    return nous;
  });
  return (
    <GrupCamps llegenda={textos.rebuda(paquet.titol, paquet.linies.length)}>
      <p>{textos.triaRebuda(llista.nom)}</p>
      {paquet.linies.map((linia, index) => (
        <Casella
          key={linia.articleId || `nom:${linia.nom}`}
          etiqueta={linia.especificacio ? `${linia.nom} · ${linia.especificacio}` : linia.nom}
          checked={!exclosos.has(index)}
          onChange={(event) => commuta(index, event.target.checked)}
        />
      ))}
      <Botonera etiqueta={textos.rep}>
        <Boto varietat="primari" disabled={!potEscriure || triades.length === 0} onClick={() => onAfig({ ...paquet, linies: triades })}>
          {textos.afig(llista.nom)}
        </Boto>
        <Boto onClick={onDescarta}>{textos.descarta}</Boto>
      </Botonera>
    </GrupCamps>
  );
}

export function ComparticioLlistaCompra({ llista }) {
  const { estat, accions, mode, llegit, ruta, descarrega } = useVistaNevera();
  const { idioma } = useClosaAplicacio();
  const textos = Object.hasOwn(TEXTOS, idioma) ? TEXTOS[idioma] : TEXTOS.ca;
  const { pathname, search, hash } = useLocation();
  const { basename = '' } = useRouter();
  const navigate = useNavigate();
  const [obert, setObert] = useState(false);
  const [text, setText] = useState('');
  const [enllacManual, setEnllacManual] = useState(null);
  /* La rebuda pel text enganxat: { clau, paquet } (la clau reinicia les caselles). */
  const [pegada, setPegada] = useState(null);
  /* { on: 'text' | 'envia', codi } */
  const [error, setError] = useState(null);
  /* { tipus: 'copiat' | 'descarregat' | 'noEscriu' } o { tipus: 'resultat', resum } */
  const [avis, setAvis] = useState(null);

  const deLaUrl = useMemo(() => (hash.startsWith(PREFIX_FRAGMENT_COMPARTIDA) ? importaLlistaCompra(hash) : null), [hash]);
  const rebuda = pegada
    ? { clau: `text:${pegada.clau}`, paquet: pegada.paquet, deLaUrl: false }
    : deLaUrl?.ok ? { clau: `url:${hash}`, paquet: deLaUrl.paquet, deLaUrl: true } : null;
  const potEscriure = llegit && mode !== 'lectora';
  const buida = llista.linies.length === 0;

  const treuFragment = () => navigate(`${pathname}${search ? `?${search}` : ''}`, { replace: true });
  const tancaRebuda = () => (rebuda?.deLaUrl ? treuFragment() : setPegada(null));
  const revisaText = () => {
    const resultat = importaLlistaCompra(text);
    if (!resultat.ok) {
      setError({ on: 'text', codi: resultat.codi });
      return;
    }
    setError(null);
    setAvis(null);
    setText('');
    setPegada((previa) => ({ clau: (previa?.clau ?? 0) + 1, paquet: resultat.paquet }));
  };

  const afig = (paquet) => {
    const resum = accions.fusionaLlistaCompartida(llista.id, paquet);
    if (!resum) {
      setAvis({ tipus: 'noEscriu' });
      return;
    }
    setAvis({ tipus: 'resultat', resum });
    tancaRebuda();
  };

  const copiaEnllac = async () => {
    const origen = typeof window !== 'undefined' ? window.location.origin : '';
    const enllac = enllacLlistaCompartida(exportaLlistaCompra(estat, llista.id), `${origen}${basename}${ruta(COMPRA.entrada)}`);
    setEnllacManual(null);
    setAvis(null);
    if (!enllac.ok) {
      setError({ on: 'envia', codi: enllac.codi });
      return;
    }
    setError(null);
    try {
      await navigator.clipboard.writeText(enllac.url);
      setAvis({ tipus: 'copiat' });
    } catch {
      setEnllacManual(enllac.url);
    }
  };

  const descarregaFitxer = () => {
    descarrega({ nom: `llista-${llista.id}.json`, tipus: 'application/json', dades: serialitzaLlistaCompartida(exportaLlistaCompra(estat, llista.id)) });
    setError(null);
    setAvis({ tipus: 'descarregat' });
  };

  const errorDe = (on) => (error?.on === on ? textos.errors[error.codi] : null);
  const textAvis = !avis ? null
    : avis.tipus === 'resultat' ? textos.resultat(avis.resum, llista.nom)
      : avis.tipus === 'noEscriu' ? textos.noEscriu : textos[avis.tipus](llista.nom);

  return (
    <>
      {deLaUrl && !deLaUrl.ok ? (
        <Alerta to="avis" titol={textos.titolError} onTanca={treuFragment}>
          {`${textos.errors[deLaUrl.codi]} ${textos.noAfegit}`}
        </Alerta>
      ) : null}
      {rebuda ? (
        <PrevisualitzacioRebuda
          key={rebuda.clau}
          paquet={rebuda.paquet}
          llista={llista}
          textos={textos}
          potEscriure={potEscriure}
          onAfig={afig}
          onDescarta={tancaRebuda}
        />
      ) : null}
      <Botonera etiqueta={textos.botonera}>
        <Boto icona={Share2} aria-expanded={obert} onClick={() => setObert((actual) => !actual)}>
          {obert ? textos.tanca : textos.obri}
        </Boto>
      </Botonera>
      {obert ? (
        <GrupCamps llegenda={textos.llegenda(llista.nom)}>
          <Botonera etiqueta={textos.envia}>
            <Boto icona={Link2} disabled={buida} onClick={copiaEnllac}>{textos.copia}</Boto>
            <Boto icona={Download} disabled={buida} onClick={descarregaFitxer}>{textos.descarrega}</Boto>
          </Botonera>
          {errorDe('envia') ? <Alerta to="avis">{errorDe('envia')}</Alerta> : null}
          {enllacManual ? (
            <Camp etiqueta={textos.enllac} ajuda={textos.ajudaEnllac}>
              <CampText value={enllacManual} readOnly onFocus={(event) => event.target.select()} />
            </Camp>
          ) : null}
          <Camp etiqueta={textos.importa} ajuda={textos.ajudaImporta} error={errorDe('text')}>
            <CampText value={text} autoComplete="off" onChange={(event) => {
              setText(event.target.value);
              if (error?.on === 'text') setError(null);
            }} />
          </Camp>
          <Botonera etiqueta={textos.rep}>
            <Boto icona={Upload} disabled={!text.trim()} onClick={revisaText}>{textos.revisa}</Boto>
          </Botonera>
        </GrupCamps>
      ) : null}
      {textAvis ? <p role="status">{textAvis}</p> : null}
    </>
  );
}
