/**
 * BotoneraClassificacio — Carpetes, Categories i Etiquetes davall del títol
 * d'un document en edició (punt 7 del Mestre). Cada botó obri la seua modal;
 * la botonera no guarda estat: qui la munta decidix quina modal s'obri.
 *
 * Només viu dins de l'editor. En lectura, targetes, Mur, Perfil i Pàgines es
 * continuen pintant les píndoles (PageFrame, sense la ranura `classificacio`).
 *
 * T7 (P8, ordre del Mestre: «els botons blaus de l'edició desapareixen o es
 * compacten quan el contingut ja s'ha triat») · Quan la carpeta, les
 * categories o les etiquetes ja estan triades, la botonera les mostra com a
 * píndoles (les classes sp-card-label + sdp-badge-* de les píndoles de
 * lectura). Sense res triat en un grup, el botó de resum de sempre.
 * L'emoticona no canvia.
 * T7B-V1 · Un sol objectiu tàctil per GRUP, no per valor: totes les píndoles
 * d'un grup viuen dins d'un únic botó que obri el diàleg del grup. Com que
 * totes obrien el mateix diàleg, una àrea de --sdp-touch per valor només
 * afegia files de 44 px; així la botonera té com a màxim quatre objectius i
 * les píndoles d'un grup s'ajunten en files de 24 px dins del seu botó.
 * El nom accessible és el del botó de resum més els valors
 * («Carpetes: Mur», «Etiquetes: Hort, Reg») i diu quin diàleg obri.
 * T7B-V2 · La carpeta porta `sdp-badge-system` (sdp-universal-page §4.1, la
 * mateixa classe que les carpetes i seccions de lectura).
 * A la vista, cada píndola porta la icona del seu grup, la mateixa del botó
 * de resum (Folder, Shapes, Tags): el grup no depén només del color
 * (WCAG 1.4.1), ni quan un mateix valor és alhora categoria i etiqueta.
 * El valor va en un element propi perquè un nom llarg s'escurce amb punts
 * suspensius en una columna estreta; el `title` el mostra sencer.
 */
import { Feather, Folder, Shapes, Tags } from 'lucide-react';


const CAP = Object.freeze([]);

/* Classe de badge, nom i icona del grup (el text i la icona del botó de
   resum) quan ja està triat. */
const PINDOLES = Object.freeze({
  carpeta: Object.freeze({ badge: 'sdp-badge-system', nom: 'Carpetes', icona: Folder }),
  categories: Object.freeze({ badge: 'sdp-badge-category', nom: 'Categories', icona: Shapes }),
  etiquetes: Object.freeze({ badge: 'sdp-badge-tag', nom: 'Etiquetes', icona: Tags }),
});

/* Un botó per grup amb totes les píndoles del grup a dins (T7B-V1). */
function Pindoles({ tipus, valors, onObri }) {
  const { badge, nom, icona: Icona } = PINDOLES[tipus];
  const etiqueta = `${nom}: ${valors.join(', ')}`;
  return (
    <button type="button" className="sdp-classificacio-pindola" aria-haspopup="dialog"
      aria-label={etiqueta} title={etiqueta} onClick={() => onObri?.(tipus)}>
      {valors.map((valor, i) => (
        <span key={`${i}:${valor}`} className={`sp-card-label ${badge}`}>
          <Icona aria-hidden="true" focusable="false" />
          <span className="sdp-classificacio-pindola__text">{valor}</span>
        </span>
      ))}
    </button>
  );
}

function BotoResum({ tipus, icona: Icona, glif = null, text, resum, onObri }) {
  return (
    <button type="button" className="sdp-classificacio-pindola" aria-haspopup="dialog" onClick={() => onObri?.(tipus)}>
      <span className="sp-card-label sdp-badge-buit">
        {glif ? <span className="sdp-classificacio-botonera__glif" aria-hidden="true">{glif}</span> : Icona ? <Icona aria-hidden="true" focusable="false" /> : null}
        <span className="sdp-classificacio-pindola__text">
          {text}
          {resum === null ? null : <span className="sdp-classificacio-botonera__resum"> ({resum})</span>}
        </span>
      </span>
    </button>
  );
}

/* T23 (ordre del Mestre, 260927 nit) · el quart botó és l'emoticona del
   document. La botonera només es pinta en edició: sense emoticona hi va una
   PLOMA (Feather), que diu «això és editable»; en eixir de l'edició la
   botonera desapareix i amb ella la ploma. Amb emoticona, la mateixa
   emoticona ocupa el lloc de la icona, fixa i guardada al document.
   Gauntlet 261016 (Bloc 3.9) · `etiquetaEmoticona` (opcional): el text del
   quart botó. El Bloc de Notes hi posa «Emojis XL» (el diàleg porta la
   graella del catàleg, i és l'únic camí per a obrir-lo: la barra taronja ja
   no porta la ploma central). Sense, «Emoticona», el DOM de sempre. */
export function BotoneraClassificacio({ carpeta, categories = CAP, etiquetes = CAP, emoticona = '', etiquetaEmoticona = 'Emoticona', onObri }) {
  const valorsDe = (llista) => llista.filter(Boolean);
  const triatsCategories = valorsDe(categories);
  const triatsEtiquetes = valorsDe(etiquetes);
  return (
    <div className="sdp-classificacio-botonera" role="group" aria-label="Classificació del document">
      {carpeta
        ? <Pindoles tipus="carpeta" valors={[carpeta]} onObri={onObri} />
        : <BotoResum tipus="carpeta" icona={Folder} text="Carpetes" resum="—" onObri={onObri} />}
      {triatsCategories.length
        ? <Pindoles tipus="categories" valors={triatsCategories} onObri={onObri} />
        : <BotoResum tipus="categories" icona={Shapes} text="Categories" resum={0} onObri={onObri} />}
      {triatsEtiquetes.length
        ? <Pindoles tipus="etiquetes" valors={triatsEtiquetes} onObri={onObri} />
        : <BotoResum tipus="etiquetes" icona={Tags} text="Etiquetes" resum={0} onObri={onObri} />}
      {emoticona
        ? <BotoResum tipus="emoticona" icona={null} glif={emoticona} text={etiquetaEmoticona} resum={null} onObri={onObri} />
        : <BotoResum tipus="emoticona" icona={Feather} text={etiquetaEmoticona} resum="—" onObri={onObri} />}
    </div>
  );
}

export default BotoneraClassificacio;
