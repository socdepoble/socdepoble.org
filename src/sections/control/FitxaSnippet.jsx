/**
 * FitxaSnippet.jsx · CU (Onada 3, 261003) · La fitxa del Snippet a Control ›
 * Utilitats (/control?fitxa=snippet): què és, en paraules senzilles, i el
 * botó principal per a instal·lar-lo o descarregar-lo per a Chrome.
 *
 * Es compon amb les peces del mateix Panell (UniversalPage, .content-wrapper,
 * seccions amb h2 i la columna .sdp-control-actions amb .sdp-btn-ample) i el
 * botó primari i gran de Pedra Seca: Boto o, quan és un enllaç, les seues
 * classes (com «Visita el lloc web» del Lector de notícies). Cap classe, token
 * ni CSS nous.
 *
 * El destí del botó és configuració (destiSnippet.js, Model B). Sense destí,
 * el botó es veu desactivat i una Alerta diu per què: mai un enllaç inventat.
 * Amb un .zip, «Com funciona» explica com carregar-lo a Chrome.
 * El receptor del Snippet és el Snippet Curador (/notes?mode=desa): desa la
 * web com una nota del Bloc. La privacitat que es conta ací és la seua
 * (modeDesa.js): la consulta arriba al servidor que servix l'app, que en el
 * Model B pot ser el de l'amfitrió. La fitxa només parla del Bloc, que hi és
 * sempre: el Lector de notícies, el Curador només l'oferix on l'app és
 * disponible (useDestinacioEnllac), i en producció encara no ho és.
 *
 * `vistaRef` (de ControlSection) apunta al cos de la fitxa: amb ell es
 * col·loca la vista quan s'obri (vistaDeLaFitxa.js).
 */
import { useId } from 'react';
import { Download, Puzzle } from 'lucide-react';
import { UniversalPage } from '../../components/universal/UniversalPage';
import { Alerta, Boto } from '../../components/PedraSeca/index.js';
import { destiDelSnippet, urlDelSnippet } from './destiSnippet.js';

const INSTALLA = 'Instal·la a Chrome';
const DESCARREGA = 'Descarrega l’extensió';

const PASSOS_D_US = Object.freeze([
  'Quan una web t’interesse, prem el Snippet. Si abans selecciones un tros de text, també l’envia.',
  'S’obri una finestra de Sóc de Poble amb l’enllaç: tria la carpeta i prem «Desar».'
]);
/* Des de la botiga de Chrome (o mentre no hi ha destí). */
const PASSOS_DE_LA_BOTIGA = Object.freeze([
  'Instal·la el Snippet a Chrome amb el botó d’esta pàgina.',
  ...PASSOS_D_US
]);
/* Des d'un .zip: Chrome només el carrega desempaquetat, en mode de desenvolupador. */
const PASSOS_DEL_PAQUET = Object.freeze([
  'Descarrega el Snippet amb el botó d’esta pàgina i descomprimix el fitxer en una carpeta que no hages d’esborrar.',
  'A Chrome, obri l’adreça chrome://extensions, activa el mode de desenvolupador i carrega eixa carpeta com a extensió desempaquetada.',
  ...PASSOS_D_US
]);

const origenDeLApp = () => (typeof window === 'undefined' ? '' : window.location.origin);

function BotoPrincipal({ desti, idAvis }) {
  if (!desti) {
    return (
      <>
        <Boto varietat="primari" mida="gran" icona={Puzzle} disabled className="sdp-btn-ample" aria-describedby={idAvis}>
          {INSTALLA}
        </Boto>
        <Alerta to="info" viva={false} titol="Encara no està publicada">
          <span id={idAvis}>
            L’extensió del Snippet no té encara cap versió per a instal·lar. Quan en tinga, este botó s’activarà ací mateix.
          </span>
        </Alerta>
      </>
    );
  }
  const Icona = desti.descarrega ? Download : Puzzle;
  return (
    <a
      className="sdp-boto sdp-boto--primari sdp-boto--gran sdp-btn-ample"
      href={desti.href}
      rel="noopener noreferrer"
      target={desti.extern ? '_blank' : undefined}
      download={desti.descarrega || undefined}
    >
      <Icona size={20} aria-hidden="true" focusable="false" />
      <span>{desti.descarrega ? DESCARREGA : INSTALLA}</span>
      {desti.extern ? (
        <>
          {' '}
          <span className="sdp-nomes-lector">(s’obri en una pestanya nova)</span>
        </>
      ) : null}
    </a>
  );
}

export function FitxaSnippet({ vistaRef }) {
  const id = useId();
  const desti = destiDelSnippet(urlDelSnippet(), origenDeLApp());
  const passos = desti?.descarrega ? PASSOS_DEL_PAQUET : PASSOS_DE_LA_BOTIGA;
  return (
    <UniversalPage
      chrome="system"
      title="Snippet"
      subtitle="Desa qualsevol web d’un clic"
      lead="Una extensió de Chrome que porta a Sóc de Poble la web que estàs llegint."
    >
      <div ref={vistaRef} className="content-wrapper">
        <section>
          <h2>Què és</h2>
          <p>
            El Snippet és un botó al teu navegador. Quan trobes una notícia, una recepta o qualsevol pàgina que vols
            guardar, el prems i l’enllaç arriba al teu Bloc de notes de Sóc de Poble, amb el títol i, si n’has
            seleccionat, un tros del text. Allí tries la carpeta, les categories i les etiquetes, i es desa com una nota
            teua que podràs editar.
          </p>
        </section>

        <div className="sdp-control-actions">
          <BotoPrincipal desti={desti} idAvis={`${id}-avis`} />
        </div>

        <section>
          <h2>Com funciona</h2>
          <ol>
            {passos.map((pas) => <li key={pas}>{pas}</li>)}
          </ol>
        </section>

        <section>
          <h2>Què necessites</h2>
          <ul>
            <li>Google Chrome a l’ordinador.</li>
            <li>El teu compte de Sóc de Poble. Si no has entrat, el Snippet t’ho demana abans de desar.</li>
          </ul>
        </section>

        <section>
          <h2>Privacitat</h2>
          <p>
            El Snippet només actua quan el prems. Llavors obri Sóc de Poble en una finestra nova amb l’adreça de la
            pàgina, el títol i el text que hages seleccionat.
          </p>
          <p>
            Eixes dades viatgen en l’adreça d’eixa finestra: arriben al servidor que servix l’app on desaràs la nota,
            que pot ser el del teu poble, i poden quedar als seus registres. La nota no es crea fins que prems «Desar»,
            i la imatge de l’altra web no es copia.
          </p>
        </section>
      </div>
    </UniversalPage>
  );
}

export default FitxaSnippet;
