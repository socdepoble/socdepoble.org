/**
 * CopiesSeguretatSocDePobleArticle.jsx · Onada R25 · Vista completa i didàctica
 * de la publicació del Mur «El Farcellet Digital de Sóc de Poble»
 * (/mur/copies-de-seguretat-soc-de-poble).
 *
 * Reunix:
 *   1. Lectura oral «Escolta la IAIA» (`BotoVeuIaia`) connectada a Matxa-TTS v2
 *      del Node 0 quan el reproductor de capçalera no la pinta ja.
 *   2. Cos editorial ric en 5 llengües amb la UniversalCard incrustada de
 *      descàrregues a la dreta i la segona vinyeta interior de les 4 capes.
 *   3. Simulador didàctic interactiu del Farcellet Digital (`.sdpbackup`) per
 *      entendre sense tecnicismes com es combinen els 5 àmbits del sistema
 *      (Xat, Bloc de Notes, Publicacions, Fotos pròpies i Perfil), el tall
 *      temporal i les 4 capes de custòdia.
 */
import { useId, useMemo, useState } from 'react';
import { Check, HardDriveDownload, ShieldCheck, Smartphone } from 'lucide-react';
import { renderRichText } from '../../detail/detailRichText.jsx';
import { SelectorOpcionsDesplegable } from '../../../components/PedraSeca/molecules/SelectorOpcionsDesplegable.jsx';
import { Boto } from '../../../components/PedraSeca/atoms/Boto.jsx';
import { BotoVeuIaia } from '../../../components/PedraSeca/molecules/BotoVeuIaia.jsx';
import { useVeuLecturaPaginaActiva } from '../../../components/universal/veu/VeuLecturaPaginaContext.js';
import { useUIActionsOpcional, useUIStateOpcional } from '../../../app/contexts/UIContext.jsx';
import { createTranslator } from '../../../config/i18n.js';
import { cosDeLArticle, cosPerAPintar } from './cosCanonic.js';
import { nomDeLaVeu } from './nomDeLaVeu.js';
import { textPlaDelCos } from './NovesTecnologiesCulturaRuralArticle.jsx';
import {
  COPIES_SEGURETAT_SOC_DE_POBLE_HTML,
  COPIES_SEGURETAT_SOC_DE_POBLE_TRADUCCIONS,
} from './copiesSeguretatSocDePobleContent.js';

const T_PER_DEFECTE = createTranslator('ca');

const AMBITS_SISTEMA = Object.freeze([
  { id: 'xat', pesMb: 45 },
  { id: 'notes', pesMb: 18 },
  { id: 'publicacions', pesMb: 24 },
  { id: 'fotos', pesMb: 680 },
  { id: 'perfil', pesMb: 2 },
]);

const TEXTOS_SIMULADOR = Object.freeze({
  ca: Object.freeze({
    titol: 'Simulador didàctic: munta el teu Farcellet Digital (.sdpbackup)',
    descripcio: 'Maqueta didàctica, sense cap còpia real: toca què vols incloure i on ho vols guardar per vore d’un colp d’ull com funcionarà la còpia de tot el teu Sóc de Poble quan estiga connectada.',
    botoNomesXat: 'Només el Xat',
    botoTotSistema: 'Tot Sóc de Poble complet',
    botoIncremental: 'Mode estalvi: només el nou des de l’última còpia',
    botoComplet: 'Mode complet: tot fins a hui',
    resumProxim: '{n}/5 àmbits actius · ~{mida} MB estimats ({mode}) · Càlcul didàctic',
    modeCurtIncremental: 'incremental',
    modeCurtComplet: 'complet',
    etiquetaInclou: 'Inclou al farcellet',
    ambits: Object.freeze({
      xat: { nom: 'Converses i notes de veu del Xat', detall: 'Missatges al segon · xifratge i 3 claus d’amistat en preparació' },
      notes: { nom: 'Tots els teus Blocs de Notes', detall: 'Apunts privats, receptes familiars, llistes i esborranys' },
      publicacions: { nom: 'Tot el que has publicat al sistema', detall: 'Cròniques al Mur, anuncis al Mercat, actes i aportacions' },
      fotos: { nom: 'Les teues pròpies fotografies i àudios', detall: 'Arxius originals ordenats per data i verificats contra trencaments' },
      perfil: { nom: 'Perfil, pobles i connexions', detall: 'Identitat, preferències d’idioma, veu de lectura i agenda veïnal' },
    }),
    destinsTitol: 'On vols custodiar la segona còpia si et furten o es trenca el mòbil?',
    destins: Object.freeze({
      tauletaEspill: {
        nom: 'Tauleta o ordinador de casa (Calaix Espill · 0 €)',
        explicacio: 'En disseny: cada nit, quan el mòbil es carregue al Wi-Fi de casa, passarà una còpia xifrada a la tauleta o ordinador familiar. Si un dia perds el mòbil al carrer, tot fins a la nit d’abans t’esperarà a casa sense pagar quotes.',
      },
      arxiuUsb: {
        nom: 'Arxiu .sdpbackup en tauleta o llapis USB-C (0 €)',
        explicacio: 'En disseny: descarregaràs d’un sol toc un únic fitxer .sdpbackup fins al dia triat. Quan obres el mòbil nou (Android o iPhone), el seleccionaràs i el sistema comprovarà que no falta cap foto abans de restaurar.',
      },
      pontQr: {
        nom: 'Pont QR directe de mòbil vell a mòbil nou (0 €)',
        explicacio: 'En disseny: apuntaràs la càmera al codi QR del telèfon nou i els xats, les notes i les fotos passaran pel Wi-Fi de casa entre Android i iPhone sense pujar al núvol.',
      },
      carpetaExterna: {
        nom: 'Carpeta xifrada per a qui viu amb un sol mòbil',
        explicacio: 'En disseny: si no tens tauleta ni ordinador a casa, podràs guardar l’arxiu ja xifrat a la teua pròpia carpeta externa o en un node cooperatiu europeu sense bloquejar els 15 GB del correu de Gmail.',
      },
    }),
    resumTitol: 'Resum del teu Farcellet simulat',
    resumText: 'Seleccionats {n} de 5 blocs del sistema · Mida aproximada: {mida} MB · Simulació: encara no es fa cap còpia.',
  }),
  es: Object.freeze({
    titol: 'Simulador didáctico: prepara tu Hatillo Digital (.sdpbackup)',
    descripcio: 'Maqueta didáctica, sin ninguna copia real: marca qué quieres incluir y dónde guardarlo para ver de un vistazo cómo funcionará el respaldo completo de tu Sóc de Poble cuando esté conectado.',
    botoNomesXat: 'Solo el Chat',
    botoTotSistema: 'Todo Sóc de Poble completo',
    botoIncremental: 'Modo ahorro: solo lo nuevo desde la última copia',
    botoComplet: 'Modo completo: todo hasta hoy',
    resumProxim: '{n}/5 ámbitos activos · ~{mida} MB estimados ({mode}) · Cálculo didáctico',
    modeCurtIncremental: 'incremental',
    modeCurtComplet: 'completo',
    etiquetaInclou: 'Incluir en la copia',
    ambits: Object.freeze({
      xat: { nom: 'Conversaciones y notas de voz del Chat', detall: 'Mensajes al segundo · cifrado y 3 llaves amigas en preparación' },
      notes: { nom: 'Todos tus Blocs de Notas', detall: 'Apuntes privados, recetas familiares, listas y borradores' },
      publicacions: { nom: 'Todo lo que has publicado en el sistema', detall: 'Crónicas en el Muro, anuncios del Mercado, eventos y aportaciones' },
      fotos: { nom: 'Tus propias fotografías y audios', detall: 'Archivos originales ordenados por fecha y verificados sin cortes' },
      perfil: { nom: 'Perfil, pueblos y conexiones', detall: 'Identidad, idioma, voz preferida de lectura y red vecinal' },
    }),
    destinsTitol: '¿Dónde quieres custodiar la segunda copia por si pierdes o te roban el móvil?',
    destins: Object.freeze({
      tauletaEspill: {
        nom: 'Tableta u ordenador de casa (Cajón Espejo · 0 €)',
        explicacio: 'En diseño: cada noche, al cargar el móvil en el Wi-Fi de casa, se guardará sola una copia cifrada en tu tableta u ordenador. Si un día se rompe el móvil en la calle, todo te esperará a salvo en casa.',
      },
      arxiuUsb: {
        nom: 'Archivo .sdpbackup en tableta o llave USB-C (0 €)',
        explicacio: 'En diseño: descargarás en un toque un único archivo .sdpbackup hasta el día elegido y lo restaurarás al abrir cualquier móvil nuevo.',
      },
      pontQr: {
        nom: 'Puente QR directo de móvil viejo a móvil nuevo (0 €)',
        explicacio: 'En diseño: escanearás un código QR temporal y los datos pasarán por el Wi-Fi local entre Android y iPhone sin pasar por nubes de terceros.',
      },
      carpetaExterna: {
        nom: 'Carpeta cifrada para quien vive con un único móvil',
        explicacio: 'En diseño: podrás guardar el paquete ya cifrado en tu carpeta externa o en una bóveda cooperativa europea sin ahogar los 15 GB de Gmail.',
      },
    }),
    resumTitol: 'Resumen de tu Hatillo simulado',
    resumText: 'Seleccionados {n} de 5 bloques del sistema · Tamaño aproximado: {mida} MB · Simulación: todavía no se hace ninguna copia.',
  }),
  en: Object.freeze({
    titol: 'Teaching simulator: build your Digital Bundle (.sdpbackup)',
    descripcio: 'A teaching mock-up that makes no real backup: pick what to include and where to store it to see how full-system Sóc de Poble backups will work once connected.',
    botoNomesXat: 'Chat only',
    botoTotSistema: 'Full Sóc de Poble system',
    botoIncremental: 'Space-saver: new items since last backup',
    botoComplet: 'Full archive: everything up to today',
    resumProxim: '{n}/5 active modules · ~{mida} MB est. ({mode}) · Educational estimate',
    modeCurtIncremental: 'incremental',
    modeCurtComplet: 'full',
    etiquetaInclou: 'Include in the bundle',
    ambits: Object.freeze({
      xat: { nom: 'Chat conversations and voice notes', detall: 'Per-second sync · encryption and 3-friend recovery in preparation' },
      notes: { nom: 'All your private Notebooks', detall: 'Personal notes, family recipes, lists, and drafts' },
      publicacions: { nom: 'Everything you published', detall: 'Wall chronicles, Market listings, events, and cultural entries' },
      fotos: { nom: 'Your own photos and audio files', detall: 'Original media organized by date with integrity checksums' },
      perfil: { nom: 'Profile, villages, and connections', detall: 'Identity, language, voice preferences, and neighbour links' },
    }),
    destinsTitol: 'Where do you want your off-phone safety copy?',
    destins: Object.freeze({
      tauletaEspill: {
        nom: 'Home Mirror Tablet or Computer (€0)',
        explicacio: 'In design: every night on home Wi-Fi, new encrypted photos and notes will mirror automatically to your tablet or computer at home.',
      },
      arxiuUsb: {
        nom: '.sdpbackup file on tablet or USB-C drive (€0)',
        explicacio: 'In design: you will download one portable .sdpbackup file up to day X and restore it on any new phone.',
      },
      pontQr: {
        nom: 'Direct QR Wi-Fi phone-to-phone bridge (€0)',
        explicacio: 'In design: you will scan a temporary QR code to move your data directly between Android and iPhone over local Wi-Fi.',
      },
      carpetaExterna: {
        nom: 'Encrypted external folder for single-phone users',
        explicacio: 'In design: you will be able to store your pre-encrypted bundle in your chosen external folder or a European cooperative vault without clogging Gmail.',
      },
    }),
    resumTitol: 'Simulated Bundle summary',
    resumText: 'Selected {n} of 5 system modules · Estimated size: {mida} MB · Simulation: no backup is made yet.',
  }),
  eu: Object.freeze({
    titol: 'Simulatzaile didaktikoa: prestatu zure Fardeltxo Digitala (.sdpbackup)',
    descripcio: 'Maketa didaktikoa, benetako kopiarik gabe: aukeratu zer gorde eta non babestu, Sóc de Pobleren sistema osoko kopiak konektatuta dagoenean nola funtzionatuko duen ikusteko.',
    botoNomesXat: 'Txata bakarrik',
    botoTotSistema: 'Sóc de Poble osoa',
    botoIncremental: 'Azken kopiatik berria bakarrik',
    botoComplet: 'Gaur arteko kopia osoa',
    resumProxim: '5etik {n} atal aktibo · ~{mida} MB ({mode}) · Kalkulu didaktikoa',
    modeCurtIncremental: 'inkrementala',
    modeCurtComplet: 'osoa',
    etiquetaInclou: 'Sartu fardeltxoan',
    ambits: Object.freeze({
      xat: { nom: 'Txateko elkarrizketak eta ahots-oharrak', detall: 'Berehalako sinkronizazioa · zifratzea eta 3 lagunen giltzak prestatzen' },
      notes: { nom: 'Zure Ohar-blok guztiak', detall: 'Ohar pribatuak, errezetak, zerrendak eta zirriborroak' },
      publicacions: { nom: 'Sisteman argitaratutako guztia', detall: 'Hormako kronikak, Merkatuko iragarkiak eta ekitaldiak' },
      fotos: { nom: 'Zure argazkiak eta audioak', detall: 'Dataz ordenatutako jatorrizko fitxategiak' },
      perfil: { nom: 'Profila, herriak eta konexioak', detall: 'Identitatea, hizkuntza eta irakurketa-ahotsa' },
    }),
    destinsTitol: 'Non gorde nahi duzu bigarren segurtasun-kopia?',
    destins: Object.freeze({
      tauletaEspill: {
        nom: 'Etxeko tableta edo ordenagailu ispilua (0 €)',
        explicacio: 'Diseinuan: gauero, etxeko Wi-Fian kargatzean, kopia zifratua automatikoki gordeko da etxeko tabletan.',
      },
      arxiuUsb: {
        nom: '.sdpbackup fitxategia tabletan edo USB-C memorian (0 €)',
        explicacio: 'Diseinuan: klik bakarrean .sdpbackup fitxategia jaitsi eta mugikor berrian berreskuratu ahal izango duzu.',
      },
      pontQr: {
        nom: 'QR zubi zuzena mugikor batetik bestera (0 €)',
        explicacio: 'Diseinuan: datuak Wi-Fi lokaletik zuzenean igaroko dira Android eta iPhone artean.',
      },
      carpetaExterna: {
        nom: 'Kanpoko karpeta zifratua mugikor bakarra dutenentzat',
        explicacio: 'Diseinuan: zure kanpoko karpetan zifratuta gorde ahal izango duzu, Gmail bete gabe.',
      },
    }),
    resumTitol: 'Zure Fardeltxo simulatuaren laburpena',
    resumText: '5 ataletatik {n} hautatuta · Gutxi gorabeherako tamaina: {mida} MB · Simulazioa: oraindik ez da kopiarik egiten.',
  }),
  gl: Object.freeze({
    titol: 'Simulador didáctico: prepara o teu Fardelo Dixital (.sdpbackup)',
    descripcio: 'Maqueta didáctica, sen ningunha copia real: marca que queres incluír e onde gardalo para ver dunha ollada como funcionará a copia de todo o teu Sóc de Poble cando estea conectada.',
    botoNomesXat: 'Só o Chat',
    botoTotSistema: 'Todo Sóc de Poble completo',
    botoIncremental: 'Modo aforro: só o novo dende a última copia',
    botoComplet: 'Modo completo: todo ata hoxe',
    resumProxim: '{n}/5 bloques activos · ~{mida} MB estimados ({mode}) · Cálculo didáctico',
    modeCurtIncremental: 'incremental',
    modeCurtComplet: 'completo',
    etiquetaInclou: 'Incluír no fardelo',
    ambits: Object.freeze({
      xat: { nom: 'Conversas e notas de voz do Chat', detall: 'Mensaxes ao segundo · cifrado e 3 chaves amigas en preparación' },
      notes: { nom: 'Todos os teus Blocs de Notas', detall: 'Apuntamentos privados, receitas familiares, listas e borradores' },
      publicacions: { nom: 'Todo o publicado no sistema', detall: 'Crónicas no Muro, anuncios no Mercado e eventos' },
      fotos: { nom: 'As túas propias fotografías e audios', detall: 'Arquivos orixinais ordenados por data e verificados' },
      perfil: { nom: 'Perfil, vilas e conexións', detall: 'Identidade, idioma, voz de lectura e rede veciñal' },
    }),
    destinsTitol: 'Onde queres custodiar a segunda copia se perdes o móbil?',
    destins: Object.freeze({
      tauletaEspill: {
        nom: 'Tableta ou ordenador da casa (Caixón Espello · 0 €)',
        explicacio: 'En deseño: cada noite, ao cargar o móbil no Wi-Fi da casa, gardarase soa unha copia cifrada na tableta familiar.',
      },
      arxiuUsb: {
        nom: 'Arquivo .sdpbackup en tableta ou chave USB-C (0 €)',
        explicacio: 'En deseño: descargarás nun toque un único arquivo .sdpbackup listo para restaurar en calquera móbil novo.',
      },
      pontQr: {
        nom: 'Ponte QR directa de móbil vello a móbil novo (0 €)',
        explicacio: 'En deseño: escanearás un código QR e os datos pasarán polo Wi-Fi local entre Android e iPhone.',
      },
      carpetaExterna: {
        nom: 'Carpeta cifrada para quen vive cun único móbil',
        explicacio: 'En deseño: poderás gardar o paquete xa cifrado sen esgotar os 15 GB do correo de Gmail.',
      },
    }),
    resumTitol: 'Resumo do teu Fardelo simulado',
    resumText: 'Seleccionados {n} de 5 bloques do sistema · Tamaño aproximado: {mida} MB · Simulación: aínda non se fai ningunha copia.',
  }),
});

const CLAU_DESTINS = Object.freeze(['tauletaEspill', 'arxiuUsb', 'pontQr', 'carpetaExterna']);

const RESUM_CURT = {
  ca: { blocs: 'blocs', modes: ['Completa', 'Novetats'], destins: ['Casa', 'USB', 'QR', 'Carpeta'] },
  es: { blocs: 'bloques', modes: ['Completa', 'Novedades'], destins: ['Casa', 'USB', 'QR', 'Carpeta'] },
  en: { blocs: 'blocks', modes: ['Full', 'New'], destins: ['Home', 'USB', 'QR', 'Folder'] },
  eu: { blocs: 'atal', modes: ['Osoa', 'Berria'], destins: ['Etxea', 'USB', 'QR', 'Karpeta'] },
  gl: { blocs: 'bloques', modes: ['Completa', 'Novidades'], destins: ['Casa', 'USB', 'QR', 'Cartafol'] },
};

function useIdiomaActiu() {
  try {
    const lang = useUIStateOpcional()?.language;
    return ['ca', 'es', 'en', 'eu', 'gl'].includes(lang) ? lang : 'ca';
  } catch {
    return 'ca';
  }
}

function textPlaEditorial(html) {
  if (typeof html !== 'string' || !html.trim()) return '';
  if (typeof DOMParser === 'function') {
    const analitzat = new DOMParser().parseFromString(html, 'text/html');
    for (const grup of analitzat.querySelectorAll('[data-sdp-targetes]')) {
      grup.remove();
    }
    return (analitzat.body.textContent || '').replace(/\s+/g, ' ').trim();
  }
  return textPlaDelCos(html);
}

export function CopiesSeguretatSocDePobleArticle({ item = {} }) {
  const t = useUIActionsOpcional()?.t || T_PER_DEFECTE;
  const veuPaginaActiva = useVeuLecturaPaginaActiva();
  const idioma = useIdiomaActiu();
  const idSimulador = useId();
  const [seleccionats, setSeleccionats] = useState(
    () => new Set(['xat', 'notes', 'publicacions', 'fotos', 'perfil'])
  );
  const [incremental, setIncremental] = useState(false);
  const [destiTriat, setDestiTriat] = useState('tauletaEspill');

  const blocIdioma = COPIES_SEGURETAT_SOC_DE_POBLE_TRADUCCIONS[idioma]
    || COPIES_SEGURETAT_SOC_DE_POBLE_TRADUCCIONS.ca;
  const textosSim = TEXTOS_SIMULADOR[idioma] || TEXTOS_SIMULADOR.ca;

  const htmlCanonic = idioma === 'ca' ? COPIES_SEGURETAT_SOC_DE_POBLE_HTML : blocIdioma.html;
  const cos = cosPerAPintar(cosDeLArticle(idioma === 'ca' ? item : null, htmlCanonic));

  const titolVeu = idioma === 'ca' ? (item?.title || blocIdioma.title) : blocIdioma.title;
  const entradillaVeu = idioma === 'ca'
    ? (item?.entradilla || item?.post_subtitle || blocIdioma.entradilla)
    : blocIdioma.entradilla;

  const textDeLaVeu = useMemo(
    () => [titolVeu, entradillaVeu, textPlaEditorial(cos)].filter(Boolean).join('\n'),
    [titolVeu, entradillaVeu, cos]
  );

  const midaSimuladaMb = useMemo(() => {
    const suma = AMBITS_SISTEMA.reduce(
      (acc, ambit) => (seleccionats.has(ambit.id) ? acc + ambit.pesMb : acc),
      0
    );
    if (suma === 0) return 0;
    return incremental ? Math.max(4, Math.round(suma * 0.12)) : suma;
  }, [seleccionats, incremental]);

  const commutaAmbit = (idAmbit) => {
    setSeleccionats((actual) => {
      const nou = new Set(actual);
      if (nou.has(idAmbit)) {
        if (nou.size > 1) nou.delete(idAmbit);
      } else {
        nou.add(idAmbit);
      }
      return nou;
    });
  };

  const activaNomesXat = () => {
    setSeleccionats(new Set(['xat']));
  };

  const activaTotElSistema = () => {
    setSeleccionats(new Set(AMBITS_SISTEMA.map((a) => a.id)));
  };

  const resumCurt = RESUM_CURT[idioma] || RESUM_CURT.ca;
  const nomesXat = seleccionats.size === 1 && seleccionats.has('xat');
  const totElSistema = seleccionats.size === AMBITS_SISTEMA.length;

  return (
    <div className="sdp-article-veu">
      {!veuPaginaActiva ? (
        <div className="sdp-article-veu__escolta-cap" data-sdp-no-locutar="">
          <BotoVeuIaia
            text={textDeLaVeu}
            idioma={idioma}
            privat={false}
            aria-label={nomDeLaVeu(t, titolVeu)}
          />
        </div>
      ) : null}

      <div className="sdp-article-veu__cos">
        {renderRichText(cos)}
      </div>

      <section
        className="sdp-subtargeta sdp-banc-veus"
        data-sdp-no-locutar=""
        aria-labelledby={idSimulador}
      >
        <h3 id={idSimulador} className="sdp-banc-veus__titol">
          {textosSim.titol}
        </h3>
        <p className="sdp-banc-veus__descripcio">
          {textosSim.descripcio}
        </p>

        {/* ART02 (Onada R26.3, ordre del Mestre del 14-11-2026) · Els dos presets diuen el seu
            estat amb aria-pressed booleà. Onada R28 · Els commutadors de cada àmbit també: rètol estable
            («Inclou al farcellet») i aria-pressed, amb el check i la variant primària com a senyal visual. El commutador de mode no en porta: canvia d'etiqueta, i
            WAI-ARIA no admet un rètol que canvia i un aria-pressed alhora (el rètol ja és l'estat). */}
        <div className="sdp-article-veu__escolta-cap">
          <Boto
            varietat={nomesXat ? 'primari' : 'secundari'}
            aria-pressed={nomesXat}
            onClick={activaNomesXat}
          >
            <Smartphone size={18} aria-hidden="true" focusable="false" />
            <span>{textosSim.botoNomesXat}</span>
          </Boto>
          <Boto
            varietat={totElSistema ? 'primari' : 'secundari'}
            aria-pressed={totElSistema}
            onClick={activaTotElSistema}
          >
            <HardDriveDownload size={18} aria-hidden="true" focusable="false" />
            <span>{textosSim.botoTotSistema}</span>
          </Boto>
          <Boto
            varietat={incremental ? 'primari' : 'secundari'}
            onClick={() => setIncremental((v) => !v)}
          >
            <ShieldCheck size={18} aria-hidden="true" focusable="false" />
            <span>{incremental ? textosSim.botoIncremental : textosSim.botoComplet}</span>
          </Boto>
        </div>

        {/* ART02 · El resultat de cada preset, al costat del dit que l'ha premut: en mòbil el
            recompte del final queda fora del primer colp d'ull. */}
        <p
          className="sdp-farcellet-sim__resum-proxim"
          data-testid="farcellet-resum-proxim"
          role="status"
          aria-live="polite"
        >
          {textosSim.resumProxim
            .replace('{n}', String(seleccionats.size))
            .replace('{mida}', String(midaSimuladaMb))
            .replace('{mode}', incremental ? textosSim.modeCurtIncremental : textosSim.modeCurtComplet)}
        </p>

        <ul className="sdp-banc-veus__llista">
          {AMBITS_SISTEMA.map((ambit) => {
            const actiu = seleccionats.has(ambit.id);
            const copiaAmbit = textosSim.ambits[ambit.id];
            return (
              <li key={ambit.id} className="sdp-banc-veus__item">
                <div className="sdp-banc-veus__item-cap">
                  <div>
                    <strong className="sdp-banc-veus__nom">{copiaAmbit.nom}</strong>
                    <span className="sdp-banc-veus__territori">{copiaAmbit.detall}</span>
                  </div>
                  <Boto
                    varietat={actiu ? 'primari' : 'secundari'}
                    aria-pressed={actiu}
                    onClick={() => commutaAmbit(ambit.id)}
                  >
                    {actiu ? <Check size={16} aria-hidden="true" focusable="false" /> : null}
                    <span>{textosSim.etiquetaInclou}</span>
                  </Boto>
                </div>
              </li>
            );
          })}
        </ul>

        <SelectorOpcionsDesplegable
          llegenda={textosSim.destinsTitol}
          opcions={CLAU_DESTINS.map((clau) => ({
            id: clau,
            titol: textosSim.destins[clau].nom,
            explicacio: <p>{textosSim.destins[clau].explicacio}</p>,
          }))}
          valor={destiTriat}
          onCanvi={setDestiTriat}
          resumTitol={textosSim.resumTitol}
          resumViu={false}
          resum={[
            `${resumCurt.destins[CLAU_DESTINS.indexOf(destiTriat)]} · ${resumCurt.modes[incremental ? 1 : 0]}`,
            `${seleccionats.size}/5 ${resumCurt.blocs} · ≈${midaSimuladaMb} MB`,
          ]}
        />
      </section>
    </div>
  );
}

export default CopiesSeguretatSocDePobleArticle;
