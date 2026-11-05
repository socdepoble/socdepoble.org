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
import { useState } from 'react';
import { Feather, Folder, Layers, Shapes, Tags } from 'lucide-react';
import { Camp, CampText, Selector } from '../../PedraSeca/index.js';
import { tradueix, useTraductorOpcional } from '../../PedraSeca/hooks/useTraductorOpcional.js';
import { omple } from '../../../config/moderacio.js';
import { carpetesEnArbre } from './DialegCarpeta.jsx';
import { CATEGORIA_GENERAL } from './model.js';
import { creaCarpetaCreada, useCarpetesCreades } from './carpetesCreades.js';


const CAP = Object.freeze([]);
const p = (nom, reserva) => Object.freeze([`universal.classificacio.botonera.${nom}`, reserva]);
const TEXTOS_BOTONERA = Object.freeze({
  grup: p('grup', 'Classificació del document'),
  carpeta: p('carpeta', 'Carpeta'),
  carpetes: p('carpetes', 'Carpetes'),
  crearCarpeta: p('crearCarpeta', 'Crear nova carpeta'),
  placeholderCarpeta: p('placeholderCarpeta', 'Nom de la carpeta…'),
  errorCarpeta: ['section.notes.carpetes.errorCrear', 'No s’ha pogut crear la carpeta. Torna-ho a provar.'],
  categories: p('categories', 'Categories'),
  triaCategoria: p('triaCategoria', 'Tria una categoria…'),
  crearCategoria: p('crearCategoria', 'Crear nova categoria'),
  placeholderCategoria: p('placeholderCategoria', 'Nova categoria…'),
  etiquetes: p('etiquetes', 'Etiquetes'),
  triaEtiqueta: p('triaEtiqueta', 'Tria una etiqueta…'),
  crearEtiqueta: p('crearEtiqueta', 'Crear nova etiqueta'),
  placeholderEtiqueta: p('placeholderEtiqueta', 'Nova etiqueta…'),
  llevarValor: p('llevarValor', 'Llevar «{valor}»'),
  ambit: p('ambit', 'Àmbit'),
  emoticona: p('emoticona', 'Emoticona'),
  pindolaEtiqueta: p('pindolaEtiqueta', '{grup}: {valors}'),
});

/* Classe de badge, nom i icona del grup (el text i la icona del botó de
   resum) quan ja està triat.
   IDEA-61 (T0, prompt 261102_1532) · `ambit`: el grup «Àmbit» (Mur, Mercat,
   Compartir cotxe, Treball o Habitatge), amb la classe de l'àmbit a les
   targetes (etiquetesDAmbit · sdp-badge-system). */
const PINDOLES = Object.freeze({
  carpeta: Object.freeze({ badge: 'sdp-badge-system', parellNom: TEXTOS_BOTONERA.carpetes, icona: Folder }),
  categories: Object.freeze({ badge: 'sdp-badge-category', parellNom: TEXTOS_BOTONERA.categories, icona: Shapes }),
  etiquetes: Object.freeze({ badge: 'sdp-badge-tag', parellNom: TEXTOS_BOTONERA.etiquetes, icona: Tags }),
  ambit: Object.freeze({ badge: 'sdp-badge-system', parellNom: TEXTOS_BOTONERA.ambit, icona: Layers }),
});

/* O4-CLAUDE-1 (ordre del Mestre, captura 261102_2121) · Cada grup obri el seu
   diàleg (aria-haspopup="dialog"), tret de l'«Àmbit»: «On es publica?» ja no
   és cap finestra modal, viu en línia dins de l'«Edició avançada» i el botó hi
   porta (qui munta la botonera ho fa, per onObri('ambit')). */
const popupDe = (tipus) => (tipus === 'ambit' ? undefined : 'dialog');

/* Un botó per grup amb totes les píndoles del grup a dins (T7B-V1).
   IDEA-61 · `nom` (opcional): el nom accessible ja traduït; sense, el de sempre. */
function Pindoles({ tipus, valors, onObri, nom: nomPropi, t }) {
  const { badge, parellNom, icona: Icona } = PINDOLES[tipus];
  const etiqueta = nomPropi || omple(tradueix(t, TEXTOS_BOTONERA.pindolaEtiqueta), {
    grup: tradueix(t, parellNom),
    valors: valors.join(', '),
  });
  return (
    <button type="button" className="sdp-classificacio-pindola" aria-haspopup={popupDe(tipus)}
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
    <button type="button" className="sdp-classificacio-pindola" aria-haspopup={popupDe(tipus)} onClick={() => onObri?.(tipus)}>
      <span className="sp-card-label sdp-badge-buit">
        {glif ? <span className="sdp-classificacio-botonera__glif" aria-hidden="true">{glif}</span> : Icona ? <Icona aria-hidden="true" focusable="false" /> : null}
        <span className="sdp-classificacio-pindola__text">
          {text}
          {resum === null ? null : <span className="sdp-classificacio-botonera__resum">{` (${resum})`}</span>}
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
   no porta la ploma central). Sense, «Emoticona», el DOM de sempre.
   IDEA-61 (T0, prompt 261102_1532) · `ambit` (opcional): el quart grup,
   «Àmbit», entre les etiquetes i l'emoticona: { text, valor, nom }. Amb
   `valor` (el nom de l'àmbit triat, ja traduït), una píndola amb `nom` com a
   nom accessible («Àmbit: Compartir cotxe»); sense, el botó de resum amb
   `text` («Àmbit»). Sense la prop, el DOM de sempre, byte a byte.
   O4-CLAUDE-1 · El botó «Àmbit» no obri cap diàleg (sense aria-haspopup): qui
   munta la botonera hi porta, al bloc «On es publica?» en línia. Continua
   abans de l'emoticona, que ha de ser l'últim botó (DESTINS_FOCUS.icon).
   Onada R6 · Bloc 2 (P1-d) · L'id d'una carpeta nova i la seua persistència
   viuen a carpetesCreades.js (resolCarpeta: sense col·lisions d'slug). */

function ClassificacioEnLinia({ enLinia, categories, etiquetes, t }) {
  const {
    carpetaId = '',
    carpetes = CAP,
    onCanviaCarpeta,
    catalegCategories = CAP,
    onCanviaCategories,
    categoriaGeneral = CATEGORIA_GENERAL,
    catalegEtiquetes = CAP,
    onCanviaEtiquetes,
    ambitCarpetes = null,
    configCarpetes = null,
  } = enLinia;
  const [novaCarpeta, setNovaCarpeta] = useState('');
  /* P1-d · Les carpetes creades en línia persistixen (per àmbit) i tornen en recarregar. */
  const carpetesExtra = useCarpetesCreades(ambitCarpetes);
  const [novaCategoria, setNovaCategoria] = useState('');
  const [novaEtiqueta, setNovaEtiqueta] = useState('');

  const totesCarpetes = [
    ...carpetes,
    ...carpetesExtra.filter((extra) => !carpetes.some((c) => c.id === extra.id)),
  ];
  const opcionsCarpetes = carpetesEnArbre(totesCarpetes).map((c) => ({
    valor: c.id,
    etiqueta: c.cami.length ? `${c.cami.join(' › ')} › ${c.nom}` : c.nom,
  }));

  const [errorCarpeta, setErrorCarpeta] = useState(false);
  const afigCarpeta = async () => {
    /* P1-d · El mateix nom reutilitza la carpeta; un altre amb el mateix slug pren -2, -3…
       Bloc 5 · Una de nova es crea primer (al servidor si el permet, si no en este
       navegador) i només després es tria, amb l'id que torna. */
    setErrorCarpeta(false);
    try {
      const resolta = await creaCarpetaCreada(ambitCarpetes, novaCarpeta, { existents: totesCarpetes, config: configCarpetes });
      if (!resolta) return;
      setNovaCarpeta('');
      onCanviaCarpeta?.(resolta.id, resolta.nom);
    } catch {
      setErrorCarpeta(true);
    }
  };

  const opcionsCategories = [
    ...new Set([...catalegCategories, ...categories].filter(Boolean)),
  ].map((c) => ({ valor: c, etiqueta: c }));

  const afigCategoria = (valor) => {
    const net = String(valor || '').trim();
    if (!net) return false;
    if (!categories.includes(net)) {
      onCanviaCategories?.([...categories, net]);
    }
    return true;
  };

  const llevaCategoria = (valor) => {
    const restants = categories.filter((c) => c !== valor);
    onCanviaCategories?.(restants.length ? restants : [categoriaGeneral]);
  };

  const opcionsEtiquetes = [
    ...new Set([...catalegEtiquetes, ...etiquetes].filter(Boolean)),
  ].map((e) => ({ valor: e, etiqueta: e }));

  const afigEtiqueta = (valor) => {
    const net = String(valor || '').trim();
    if (!net) return false;
    if (!etiquetes.includes(net)) {
      onCanviaEtiquetes?.([...etiquetes, net]);
    }
    return true;
  };

  const llevaEtiqueta = (valor) => {
    onCanviaEtiquetes?.(etiquetes.filter((e) => e !== valor));
  };

  return (
    <section className="sdp-classificacio-en-linia">
      <div className="sdp-classificacio-en-linia__fila">
        <Camp etiqueta={tradueix(t, TEXTOS_BOTONERA.carpeta)}>
          <Selector
            value={carpetaId}
            onChange={(e) => onCanviaCarpeta?.(e.target.value)}
            opcions={opcionsCarpetes}
          />
        </Camp>
        <Camp etiqueta={tradueix(t, TEXTOS_BOTONERA.crearCarpeta)} error={errorCarpeta ? tradueix(t, TEXTOS_BOTONERA.errorCarpeta) : undefined}>
          <CampText
            value={novaCarpeta}
            onChange={(e) => setNovaCarpeta(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault();
                afigCarpeta();
              }
            }}
            placeholder={tradueix(t, TEXTOS_BOTONERA.placeholderCarpeta)}
          />
        </Camp>
      </div>

      <div className="sdp-classificacio-en-linia__grup">
        <div className="sdp-classificacio-en-linia__fila">
          <Camp etiqueta={tradueix(t, TEXTOS_BOTONERA.categories)}>
            <Selector
              value=""
              onChange={(e) => afigCategoria(e.target.value)}
              opcions={[
                { valor: '', etiqueta: tradueix(t, TEXTOS_BOTONERA.triaCategoria) },
                ...opcionsCategories,
              ]}
            />
          </Camp>
          <Camp etiqueta={tradueix(t, TEXTOS_BOTONERA.crearCategoria)}>
            <CampText
              value={novaCategoria}
              onChange={(e) => setNovaCategoria(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  if (afigCategoria(novaCategoria)) setNovaCategoria('');
                }
              }}
              placeholder={tradueix(t, TEXTOS_BOTONERA.placeholderCategoria)}
            />
          </Camp>
        </div>
        {categories.length ? (
          <div className="sdp-classificacio-en-linia__pindoles">
            {categories.map((cat) => (
              <span key={cat} className="sp-card-label sdp-badge-category">
                <Shapes aria-hidden="true" focusable="false" />
                <span className="sdp-classificacio-pindola__text">{cat}</span>
                <button
                  type="button"
                  className="sdp-classificacio-en-linia__lleva"
                  aria-label={omple(tradueix(t, TEXTOS_BOTONERA.llevarValor), { valor: cat })}
                  disabled={categories.length === 1 && cat === categoriaGeneral}
                  onClick={() => llevaCategoria(cat)}
                >
                  ×
                </button>
              </span>
            ))}
          </div>
        ) : null}
      </div>

      <div className="sdp-classificacio-en-linia__grup">
        <div className="sdp-classificacio-en-linia__fila">
          <Camp etiqueta={tradueix(t, TEXTOS_BOTONERA.etiquetes)}>
            <Selector
              value=""
              onChange={(e) => afigEtiqueta(e.target.value)}
              opcions={[
                { valor: '', etiqueta: tradueix(t, TEXTOS_BOTONERA.triaEtiqueta) },
                ...opcionsEtiquetes,
              ]}
            />
          </Camp>
          <Camp etiqueta={tradueix(t, TEXTOS_BOTONERA.crearEtiqueta)}>
            <CampText
              value={novaEtiqueta}
              onChange={(e) => setNovaEtiqueta(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  if (afigEtiqueta(novaEtiqueta)) setNovaEtiqueta('');
                }
              }}
              placeholder={tradueix(t, TEXTOS_BOTONERA.placeholderEtiqueta)}
            />
          </Camp>
        </div>
        {etiquetes.length ? (
          <div className="sdp-classificacio-en-linia__pindoles">
            {etiquetes.map((tag) => (
              <span key={tag} className="sp-card-label sdp-badge-tag">
                <Tags aria-hidden="true" focusable="false" />
                <span className="sdp-classificacio-pindola__text">{tag}</span>
                <button
                  type="button"
                  className="sdp-classificacio-en-linia__lleva"
                  aria-label={omple(tradueix(t, TEXTOS_BOTONERA.llevarValor), { valor: tag })}
                  onClick={() => llevaEtiqueta(tag)}
                >
                  ×
                </button>
              </span>
            ))}
          </div>
        ) : null}
      </div>
    </section>
  );
}

export function BotoneraClassificacio({
  carpeta,
  categories = CAP,
  etiquetes = CAP,
  emoticona = '',
  etiquetaEmoticona = null,
  ambit,
  enLinia = null,
  onObri
}) {
  const t = useTraductorOpcional();
  const textEmoticona = etiquetaEmoticona || tradueix(t, TEXTOS_BOTONERA.emoticona);
  const valorsDe = (llista) => llista.filter(Boolean);
  const triatsCategories = valorsDe(categories);
  const triatsEtiquetes = valorsDe(etiquetes);
  if (enLinia) {
    return (
      <div className="sdp-classificacio-bloc" role="group" aria-label={tradueix(t, TEXTOS_BOTONERA.grup)}>
        <ClassificacioEnLinia
          enLinia={enLinia}
          categories={triatsCategories}
          etiquetes={triatsEtiquetes}
          t={t}
        />
        <div className="sdp-classificacio-botonera">
          {emoticona
            ? <BotoResum tipus="emoticona" icona={null} glif={emoticona} text={textEmoticona} resum={null} onObri={onObri} />
            : <BotoResum tipus="emoticona" icona={Feather} text={textEmoticona} resum="—" onObri={onObri} />}
        </div>
      </div>
    );
  }
  return (
    <div className="sdp-classificacio-botonera" role="group" aria-label={tradueix(t, TEXTOS_BOTONERA.grup)}>
      {carpeta
        ? <Pindoles tipus="carpeta" valors={[carpeta]} onObri={onObri} t={t} />
        : <BotoResum tipus="carpeta" icona={Folder} text={tradueix(t, TEXTOS_BOTONERA.carpetes)} resum="—" onObri={onObri} />}
      {triatsCategories.length
        ? <Pindoles tipus="categories" valors={triatsCategories} onObri={onObri} t={t} />
        : <BotoResum tipus="categories" icona={Shapes} text={tradueix(t, TEXTOS_BOTONERA.categories)} resum={0} onObri={onObri} />}
      {triatsEtiquetes.length
        ? <Pindoles tipus="etiquetes" valors={triatsEtiquetes} onObri={onObri} t={t} />
        : <BotoResum tipus="etiquetes" icona={Tags} text={tradueix(t, TEXTOS_BOTONERA.etiquetes)} resum={0} onObri={onObri} />}
      {ambit ? (ambit.valor
        ? <Pindoles tipus="ambit" valors={[ambit.valor]} nom={ambit.nom} onObri={onObri} t={t} />
        : <BotoResum tipus="ambit" icona={Layers} text={ambit.text} resum="—" onObri={onObri} />) : null}
      {emoticona
        ? <BotoResum tipus="emoticona" icona={null} glif={emoticona} text={textEmoticona} resum={null} onObri={onObri} />
        : <BotoResum tipus="emoticona" icona={Feather} text={textEmoticona} resum="—" onObri={onObri} />}
    </div>
  );
}

export default BotoneraClassificacio;
