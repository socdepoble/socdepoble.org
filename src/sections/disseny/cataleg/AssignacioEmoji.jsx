/**
 * AssignacioEmoji.jsx — la pantalla «Assignar» del catàleg Emojis XL.
 *
 * Ordre del Mestre (261007, via MarIA) · «Dins de la targeta de cada emoji,
 * afig un xicotet botó blau primari: "Assignar". En fer-hi clic, NO s'ha
 * d'obrir un menú flotant (hi hauria massa pàgines), sinó una PantallaCompleta
 * on es llisten les carpetes i documents disponibles (Wiki, Disseny, Notes
 * personals).»
 *
 * Es munta DINS de la PantallaCompleta de l'espècimen (EspecimenEmojisXL.jsx):
 * cap ruta nova. L'anatomia habitual del «Reenviar a…» de les apps de
 * missatgeria (Gauntlet 261017, Bloc 3.1: patró conegut, sense marca aliena):
 * la capçalera amb l'emoji en gran i el seu nom, la cerca en píndola i la
 * llista agrupada amb les files del Xat (sdp-xat-fila, sdp-xat-seccio), amb
 * l'emoji o la icona actual de cada destí a l'esquerra. Quatre grups: Notes
 * personals, Wiki de Poble, Disseny i les pàgines de Sóc de Poble (les del
 * sistema, al PAGE_COPY); en cada un, les carpetes i els documents.
 *
 * Honestedat (destinsEmoji.js · motiuInert):
 *   · una nota s'assigna de veres, pel mateix canal que el DialegEmoticona de
 *     l'editor (NotesEditor · escriu → setLocalNoteField(id, 'icon', emoji)):
 *     la cua del Bloc la desa i, si falla, ho diu ella. Qui munta la pantalla
 *     rep onFet(missatge) per a tancar-la i avisar;
 *   · una pàgina o una família de Disseny viatja dins del codi: la fila és
 *     inerta (aria-disabled, com les portes «en obres» de PortesTargeta), diu
 *     «Al codi» i, en prémer-la, explica que l'emoji es canvia amb un commit;
 *   · una carpeta de la Wiki porta un emoji fix del codi (iconesWiki.js,
 *     pla 261007_0012 §0.7) i una del Bloc, la seua icona de Lucide: la fila
 *     diu «Icona fixa» i, en prémer-la, explica per què.
 *     Mai fingix que l'ha canviat. L'avís va dins de la pantalla: un toast
 *     quedaria davall del <dialog> modal.
 * La Wiki compilada (src/data/wikiManifest.js, uns 350 kB) es demana en obrir
 * la pantalla, no amb l'espècimen. Decisió 5 del Mestre (261007, paquet
 * trossejat) · Ara és a demanda també al paquet autònom de l'amfitrió
 * (vite.standalone.config.js, SDP_PAQUET=trossos, el defecte): ja no viatja
 * inlinada, va en un tros propi de trossos/ que el navegador demana en obrir
 * la pantalla, com al lloc propi (ESM, main.jsx). Només el paquet monolític
 * (SDP_PAQUET=monolitic i la variant del directori de WordPress, en format
 * IIFE amb inlineDynamicImports) la porta encara dins i l'avalua en carregar;
 * allà l'import() d'ací només ajorna el pintat.
 */
import { useEffect, useId, useMemo, useRef, useState } from 'react';
import { CircleX, Construction, Search } from 'lucide-react';
import { useCoreContent } from '../../../app/contexts/CoreContentContext';
import { useSessioOpcional } from '../../../app/contexts/SessionContext.jsx';
import { GLIF_DOCUMENT, NavGlyph } from '../../../components/universal/workspace/NavGlyph.jsx';
import { SECTIONS } from '../../../config/sections.js';
import { COVER_PAGE_KEYS, SYSTEM_PAGES } from '../../../config/systemPages.js';
import { emojiSol } from '../../../utils/emoji.js';
import { useNotes } from '../../notes/NotesContext.jsx';
import { PAGE_COPY } from '../../text/pageContent.js';
import { maquinariaALaVista } from '../../wiki-de-poble/maquinaria.js';
import { CATALOG_CATEGORIES, CATALOG_ITEMS } from './manifest.js';
import {
  GRUPS_DESTI, destinsDeCarpetesDelBloc, destinsDeLaWiki, destinsDeNotes, destinsDelDisseny, destinsDelSistema,
  filtraDestins, motiuInert, textAssignat, textJaHiEra, textNoAssignable
} from './destinsEmoji.js';

const CAP = Object.freeze([]);
const ETIQUETA_CERCA = 'Cerca una nota, una pàgina o una carpeta';

/* Les pàgines que ja són a un altre grup no es repetixen entre les del
   sistema: les portades de la Wiki i de Disseny, que encapçalen el seu.
   Onada 8 (261009) · I la Consola, ara pàgina del sistema: la Wiki ja la
   llista (Maquinària de la IAIA, destinsDeLaWiki). El Cervell només és ací. */
const JA_LLISTADES = Object.freeze([COVER_PAGE_KEYS.wiki, COVER_PAGE_KEYS.disseny, COVER_PAGE_KEYS.consola]);

/* La portada d'una pàgina del sistema: el copy carregat primer i PAGE_COPY
   de reserva, amb la mateixa precedència que DesignSection i la Wiki. */
const portadaDe = (pageCopy, clau) => pageCopy?.[clau] || PAGE_COPY[clau] || null;

/* Les eines locals de la Wiki (Tractors, Sentinelles i Agents) només hi són en
   desenvolupament: la mateixa funció de la Wiki (modulsLocalsActius), amb el
   literal import.meta.env.DEV. Al build, Vite el fa false i esta importació
   desapareix del paquet, com les eines de la Wiki (EINES_LOCALS). */
const carregaEinesLocals = () => (import.meta.env.DEV
  ? import('../../wiki-de-poble/WikiDePobleSection.jsx')
    .then((modul) => modul.modulsLocalsActius({ DEV: import.meta.env.DEV }).items || CAP)
  : Promise.resolve(CAP));

/* La Wiki compilada (i, en desenvolupament, les eines locals), demanades en
   muntar la pantalla. */
function useWikiCompilada() {
  const [wiki, setWiki] = useState({ estat: 'carregant', manifest: null, locals: CAP });
  useEffect(() => {
    let viu = true;
    Promise.all([import('../../../data/wikiManifest.js'), carregaEinesLocals()])
      .then(([modul, locals]) => { if (viu) setWiki({ estat: 'llesta', manifest: modul.wikiManifest, locals }); })
      .catch(() => { if (viu) setWiki({ estat: 'error', manifest: null, locals: CAP }); });
    return () => { viu = false; };
  }, []);
  return wiki;
}

/* L'estat d'un grup quan no té (encara) cap destí a la llista, o null. */
function estatDelBloc(bloc) {
  if (!bloc) return 'El Bloc de notes no està disponible ací.';
  if (bloc.notes?.length) return null;
  if (bloc.status === 'error') return 'No s’han pogut carregar les notes.';
  if (bloc.status !== 'ready') return 'Carregant les teues notes…';
  return bloc.teSessio === false ? 'Connecta per veure les teues notes.' : 'Encara no tens cap nota.';
}

function estatDeLaWiki(wiki) {
  if (wiki.estat === 'carregant') return 'Carregant la Wiki…';
  if (wiki.estat === 'error') return 'No s’ha pogut carregar la Wiki.';
  return null;
}

/* Una fila inerta (una pàgina del codi o una carpeta) porta, al lloc de
   l'hora, la icona d'obres i el seu motiu («Al codi», «Icona fixa»).
   Ordre del Mestre (261026_2126; pla 261026_2130, P1-36) · Un destí no és
   cap targeta de conversa: la fila senzilla (sdp-xat-fila--senzilla)
   conserva els 72px d'abans, no els 96 de la llista de converses. */
function FilaDesti({ desti, avis, idAvis, onTria }) {
  const motiu = motiuInert(desti);
  return (
    <li>
      <button type="button" className="sdp-xat-fila sdp-xat-fila--senzilla" aria-disabled={motiu ? true : undefined}
        aria-describedby={avis ? idAvis : undefined} onClick={() => onTria(desti)}>
        <span className="sdp-assigna-emoji__actual" aria-hidden="true">
          <NavGlyph glyph={desti.glif} fallback={GLIF_DOCUMENT} size={24} />
        </span>
        <span className="sdp-xat-fila__cos">
          <span className="sdp-xat-fila__cap">
            <span className="sdp-xat-fila__nom">{desti.titol}</span>
            {motiu ? (
              <span className="sdp-xat-fila__hora sdp-assigna-emoji__codi">
                <Construction size={16} aria-hidden="true" focusable="false" />
                <span>{motiu.etiqueta}</span>
              </span>
            ) : desti.data ? <span className="sdp-xat-fila__hora">{desti.data}</span> : null}
          </span>
          {desti.previa ? (
            <span className="sdp-xat-fila__peu">
              <span className="sdp-xat-fila__previa">{desti.previa}</span>
            </span>
          ) : null}
        </span>
      </button>
      {avis ? <p id={idAvis} className="sdp-xat-avis" role="status">{avis}</p> : null}
    </li>
  );
}

export function AssignacioEmoji({ emoji, nom, onFet }) {
  const bloc = useNotes();
  const { pageCopy } = useCoreContent();
  const wiki = useWikiCompilada();
  const [terme, setTerme] = useState('');
  const [avis, setAvis] = useState(null);
  const campRef = useRef(null);
  const base = useId();
  const idAvis = `${base}-avis`;
  const valid = emojiSol(emoji);

  const notes = bloc?.notes ?? CAP;
  const hiHaBloc = Boolean(bloc);
  const carpetesDelBloc = bloc?.noteFolders;
  /* Gauntlet 261016 (Bloc 3.4) · El grup de la Wiki és la Wiki que veu qui
     mira: la Maquinària de la IAIA (i la Consola), només en desenvolupament o
     per a qui és superadmin, la mateixa regla de la Wiki (maquinaria.js). */
  const esSuperadmin = useSessioOpcional()?.esSuperadmin === true;
  const ambMaquinaria = maquinariaALaVista({ DEV: import.meta.env.DEV, esSuperadmin });
  /* En cada grup, l'ordre de la seua secció: la portada, les carpetes i els
     documents. Les carpetes del Bloc, només si hi ha Bloc. */
  const destins = useMemo(() => {
    const copyDe = (clau) => portadaDe(pageCopy, clau);
    return {
      notes: hiHaBloc ? [...destinsDeCarpetesDelBloc(carpetesDelBloc), ...destinsDeNotes(notes)] : CAP,
      wiki: destinsDeLaWiki(wiki.manifest, copyDe(COVER_PAGE_KEYS.wiki),
        { consola: copyDe(COVER_PAGE_KEYS.consola), locals: wiki.locals, maquinaria: ambMaquinaria }),
      disseny: destinsDelDisseny(CATALOG_CATEGORIES, CATALOG_ITEMS, copyDe(COVER_PAGE_KEYS.disseny)),
      sistema: destinsDelSistema(SYSTEM_PAGES, SECTIONS, copyDe, JA_LLISTADES)
    };
  }, [hiHaBloc, carpetesDelBloc, notes, wiki.manifest, wiki.locals, pageCopy, ambMaquinaria]);
  const filtrats = useMemo(
    () => Object.fromEntries(GRUPS_DESTI.map((grup) => [grup.id, filtraDestins(destins[grup.id], terme)])),
    [destins, terme]
  );
  const estats = { notes: estatDelBloc(bloc), wiki: estatDeLaWiki(wiki), disseny: null, sistema: null };
  /* El Bloc carrega les notes per pàgines i la resta només quan algú les
     demana (NotesDataContext · activate): ací es diu que n'hi pot haver més. */
  const notesParcials = Boolean(notes.length) && bloc?.notesComplete === false;
  const cercant = terme.trim() !== '';
  /* M2-13 · Mentre la Wiki o les notes encara carreguen, una cerca sense
     resultats no és cap negatiu: el que falta encara pot arribar (la mateixa
     càrrega que diu estatDelBloc: ni 'ready' ni 'error', sense notes). */
  const blocCarregant = hiHaBloc && !notes.length && bloc.status !== 'ready' && bloc.status !== 'error';
  const carregant = wiki.estat === 'carregant' || blocCarregant;
  const senseCapFila = cercant && GRUPS_DESTI.every((grup) => filtrats[grup.id].length === 0);
  const capResultat = senseCapFila && !carregant;

  /* Una pàgina del codi o una carpeta (motiuInert), un glif que no és un sol
     emoji o una nota que ja el porta: l'avís davall de la fila i res escrit.
     Una nota: el canal del Bloc i la tornada (onFet). */
  const tria = (desti) => {
    let motiu = motiuInert(desti)?.text ?? null;
    /* M2-12 · Un emoji del catàleg massa nou per a este navegador no és «cap
       emoji»: l'avís diu que el navegador encara no el reconeix. */
    if (!motiu && !valid) motiu = textNoAssignable(emoji);
    else if (!motiu && emojiSol(desti.nota.icon) === valid) motiu = textJaHiEra(valid, desti.titol);
    if (motiu) {
      setAvis({ id: desti.id, text: motiu });
      return;
    }
    bloc.setLocalNoteField(desti.nota.id, 'icon', valid);
    setAvis(null);
    onFet?.(textAssignat(valid, desti.titol));
  };

  const canviaTerme = (valor) => {
    setTerme(valor);
    setAvis(null);
  };

  return (
    <div className="sdp-assigna-emoji">
      <header className="sdp-assigna-emoji__cap">
        <span className="sdp-emojis-xl__glif" aria-hidden="true">{emoji}</span>
        <h2 className="sdp-assigna-emoji__nom" lang="en">{nom}</h2>
        <p className="sdp-assigna-emoji__pista">Tria on vols posar esta emoticona.</p>
      </header>

      <div className="sdp-xat-cerca__camp sdp-xat-dialeg__cerca">
        <label className="sdp-xat-cerca__etiqueta">
          <span className="sdp-nomes-lector">{ETIQUETA_CERCA}</span>
          <Search size={20} aria-hidden="true" focusable="false" />
          <input
            ref={campRef}
            type="search"
            name="assignaEmojiCerca"
            autoComplete="off"
            value={terme}
            placeholder={ETIQUETA_CERCA}
            onChange={(e) => canviaTerme(e.target.value)}
            onKeyDown={(e) => {
              /* Amb text, Escape esborra; buit, el deixa passar i la pantalla es tanca. */
              if (e.key === 'Escape' && terme) { e.preventDefault(); e.stopPropagation(); canviaTerme(''); }
            }}
          />
        </label>
        {terme ? (
          <button type="button" className="sdp-xat-icona" aria-label="Esborra la cerca"
            onClick={() => { canviaTerme(''); campRef.current?.focus(); }}>
            <CircleX size={20} aria-hidden="true" focusable="false" />
          </button>
        ) : null}
      </div>

      {GRUPS_DESTI.map((grup) => {
        const llista = filtrats[grup.id];
        if (cercant && !llista.length) return null;
        const estat = cercant ? null : estats[grup.id];
        return (
          <section key={grup.id} className="sdp-xat-seccio">
            <h3 className="sdp-xat-seccio__titol">{grup.titol}</h3>
            {grup.avis ? <p className="sdp-xat-avis">{grup.avis}</p> : null}
            {llista.length ? (
              <ul className="sdp-xat-llista sdp-xat-targeta">
                {llista.map((desti) => (
                  <FilaDesti key={desti.id} desti={desti} avis={avis?.id === desti.id ? avis.text : null}
                    idAvis={idAvis} onTria={tria} />
                ))}
              </ul>
            ) : null}
            {estat ? <p className="sdp-workspace-state" role="status">{estat}</p> : null}
            {grup.id === 'notes' && notesParcials ? (
              <p className="sdp-xat-resultats__avis">Només hi ha les notes ja carregades: si no hi trobes la teua, obri el Bloc i torna.</p>
            ) : null}
          </section>
        );
      })}

      {capResultat ? <p className="sdp-workspace-state" role="status">Cap nota, pàgina ni carpeta amb eixe nom.</p> : null}
      {senseCapFila && carregant ? <p className="sdp-workspace-state" role="status">Encara es carreguen la Wiki i les notes…</p> : null}
    </div>
  );
}

export default AssignacioEmoji;
