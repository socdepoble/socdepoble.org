/**
 * BlocAmbit.jsx — «On es publica?» en línia · IDEA-61 (T0, prompt 261102_1532)
 * i O4-CLAUDE-1 (ordre del Mestre, captura 261102_2121: fora la finestra
 * modal, dins de l'«Edició avançada») · El compositor del Flux Universal de
 * Publicació: el selector d'àmbit (els huit d'AMBITS: Mur, Mercat, Calendari,
 * Mapa, Compartir cotxe, Animalets, Treball i Habitatge), el formulari guiat
 * que naix del contracte pur (utils/publicacioUniversal.js · CAMPS) just
 * davall de l'àmbit triat, l'Estat
 * (només als àmbits verticals) i la previsualització de la targeta pública.
 *
 * Universal: no importa cap secció. Qui el munta (el Bloc de Notes, dins de
 * la ranura `ambitEdicioAvancada` de la closca) li passa la fitxa de la nota
 * ({ ambit, estat, dades } o null), el document per a la previsualització
 * ({ title, subtitle, lead, heroImage?, authorName?… }, el que llig
 * propsDeTargetaDeLaPagina) i el traductor. Sense botó de desar: cada canvi
 * crida onCanvia(fitxa, motiu) amb la fitxa ja normalitzada (normalitzaEstat
 * + normalitzaDades), la mateixa forma que tornava «Desar l'àmbit»; `motiu`
 * és 'ambit' quan la persona tria un àmbit (qui el munta hi sincronitza la
 * carpeta) i 'dades' en editar un camp o l'Estat. Un àmbit 'mur' és la
 * publicació de sempre: sense camps ni etiquetes (Llei del Píxel).
 *
 * L'estat del formulari no queda congelat al muntatge: quan l'àmbit de la
 * fitxa canvia des de fora (l'entrada ?ambit=, moure la nota a la carpeta del
 * Mercat), el bloc el pren amb les seues dades. Els textos que s'escriuen
 * viuen ací (un camp a mitges no es perd per la normalització) i, en tornar a
 * un àmbit ja editat en esta nota, les seues dades tornen, també quan l'àmbit
 * se n'ha anat per un canvi de fora.
 *
 * Validació: els errors de validaFitxa van en línia (Camp error) després del
 * primer canvi d'un camp, o quan `mostraErrors` diu que PUBLICAR s'ha aturat
 * per la fitxa; llavors també un avís curt, no viu (el selector de
 * visibilitat ja l'anuncia). Cap classe de formulari nova: Camp, CampText,
 * AreaText, Selector (AH-04: «On es publica?» és un desplegable, seguit dels
 * camps de l'àmbit triat),
 * Alerta, Pila i Superficie de Pedra Seca, i la UniversalCard de la pàgina
 * (targetaDeLaPagina.js). Només el títol i l'ajuda del bloc porten la seua.
 */
import { useId, useRef, useState } from 'react';
import { Alerta, AreaText, Camp, CampText, Pila, Selector, Superficie, UniversalCard } from '../../PedraSeca/index.js';
import { propsDeTargetaDeLaPagina } from '../targetaDeLaPagina.js';
import {
  AMBITS, CAMPS, ESTATS, etiquetaDAmbit, etiquetaDEstat, etiquetaDOpcio, etiquetaDeCamp, etiquetesDAmbit,
  normalitzaDades, normalitzaEstat, resumDeFitxa, validaFitxa
} from '../../../utils/publicacioUniversal.js';

const AMBIT_PER_DEFECTE = 'mur';
/* Un text llarg del contracte (dedicació, remuneració, condicions: 500) va en una àrea. */
const MAXIM_AREA = 300;
const CAP_ERROR = Object.freeze({});
const reserva = (_clau, text) => text;

/* El text amb cada {clau} de `valors` al seu lloc; amb una funció de
   reemplaç, perquè un «$» del valor no faça de patró. Lineal, sense retrocés. */
const omple = (text, valors) => String(text ?? '').replace(/\{(\w+)\}/g, (tros, clau) => (Object.hasOwn(valors, clau) ? String(valors[clau]) : tros));

/* L'error d'un camp segons el codi de validaFitxa (L2-A2: claus a tots cinc diccionaris). */
const TEXT_OBLIGATORI = Object.freeze(['editor.ambit.obligatori', 'Falta un camp obligatori: {camp}']);
const TEXT_PER_CODI = Object.freeze({
  format: Object.freeze(['editor.ambit.error.format', 'El valor de «{camp}» no té la forma esperada.']),
  rang: Object.freeze(['editor.ambit.error.rang', 'El valor de «{camp}» és fora del rang permés.']),
  enum: Object.freeze(['editor.ambit.error.enum', 'Tria una opció de la llista per a «{camp}».']),
  llargaria: Object.freeze(['editor.ambit.error.llargaria', 'El text de «{camp}» és massa llarg.']),
  /* G3-g2-matriu-05 · La fi d'un interval (el dia o l'hora de finalització
     del Calendari), anterior a l'inici (validaFitxa · INTERVALS). */
  ordre: Object.freeze(['editor.ambit.error.ordre', 'El valor de «{camp}» no pot ser anterior a l’inici.'])
});

function textDError(codi, nomDelCamp, t) {
  const parell = codi === 'obligatori' ? TEXT_OBLIGATORI : (TEXT_PER_CODI[codi] ?? TEXT_PER_CODI.format);
  return omple(t(parell[0], parell[1]), { camp: nomDelCamp });
}

/* idea61-05 (Gauntlet T7a, 261104) · Un camp `privat` del contracte (el
   contacte de Treball i, des d'AH-04, el d'Animalets) no ix a la targeta ni a
   la cerca, però la fitxa del detall el mostra a qui pot llegir la fila: el
   camp ho diu, perquè la previsualització l'amaga a posta. Cap altre camp
   porta ajuda. honestedat_textos-05 (R21) · Amb la política 2611112005, anon
   llig el payload del Mur i del Mercat: el veu qualsevol persona, també sense
   compte, i no només la gent registrada del poble com deia abans
   (config/i18n.murPublic.test.js ho lliga a MUR_PUBLIC_FILTRAT). */
const TEXT_CAMP_VISIBLE = Object.freeze(['editor.ambit.contacteVisible', 'Ho veurà qualsevol persona, també sense compte, en obrir la fitxa; no ix a la targeta ni a la cerca.']);

/* El tipus de l'<input> per a cada tipus del contracte. */
const TIPUS_INPUT = Object.freeze({ text: 'text', preu: 'text', data: 'date', hora: 'time' });

/* L'àmbit i les dades d'una fitxa que arriba, coaccionats pel contracte (una
   fitxa d'una fila del port pot portar qualsevol cosa). */
const ambitDe = (valor) => (valor && AMBITS.includes(valor.ambit) ? valor.ambit : AMBIT_PER_DEFECTE);
const dadesInicials = (valor) => (valor && AMBITS.includes(valor.ambit) ? normalitzaDades(valor.ambit, valor.dades) : {});
const esObjecte = (valor) => valor !== null && typeof valor === 'object';
/* La fitxa que ix cap a qui el munta: la forma que desava «Desar l'àmbit». */
const fitxaDe = (ambit, estat, dades) => ({ ambit, estat: normalitzaEstat(estat), dades: normalitzaDades(ambit, dades) });
/* Correcció D2-publicacio-5-verticals-02 · Si les dades que la persona veu
   (crues, abans de normalitzaDades) passen el contracte: un valor fora de rang
   no ix a la fitxa, però tampoc no la deixa publicar. El Mur, sempre. */
const sonValides = (ambit, dades) => ambit === AMBIT_PER_DEFECTE || validaFitxa(ambit, dades).ok;

/* Un camp del formulari guiat, generat des del contracte (CAMPS[ambit]). */
function CampDeFitxa({ campDef, valor, obligatori, error, onCanvi, t }) {
  const valorControl = valor == null ? '' : valor;
  const canvia = (event) => onCanvi(campDef.id, event.target.value);
  let control;
  if (campDef.tipus === 'enum') {
    control = (
      <Selector value={valorControl} onChange={canvia}
        opcions={[{ valor: '', etiqueta: '—' }, ...campDef.opcions.map((opcio) => ({ valor: opcio, etiqueta: etiquetaDOpcio(campDef, opcio, t) }))]} />
    );
  } else if (campDef.tipus === 'text' && campDef.maxim >= MAXIM_AREA) {
    control = <AreaText files={3} maxLength={campDef.maxim} value={valorControl} onChange={canvia} />;
  } else if (campDef.tipus === 'enter') {
    control = <CampText tipus="number" inputMode="numeric" min={campDef.min} max={campDef.max} step={1} value={valorControl} onChange={canvia} />;
  } else {
    const ambLlargaria = campDef.tipus === 'text' || campDef.tipus === 'preu';
    control = (
      <CampText tipus={TIPUS_INPUT[campDef.tipus] ?? 'text'} autoComplete="off"
        maxLength={ambLlargaria ? campDef.maxim : undefined} value={valorControl} onChange={canvia} />
    );
  }
  const ajuda = campDef.privat ? t(TEXT_CAMP_VISIBLE[0], TEXT_CAMP_VISIBLE[1]) : undefined;
  return <Camp etiqueta={etiquetaDeCamp(campDef, t)} ajuda={ajuda} obligatori={obligatori} error={error}>{control}</Camp>;
}

/**
 * Props: valor ({ ambit, estat, dades } o null), document (el de la
 * previsualització, o null), onCanvia(fitxa normalitzada, 'ambit' | 'dades',
 * valida: si les dades locals, crues, passen validaFitxa), mostraErrors
 * (PUBLICAR s'ha aturat per esta fitxa) i t (el traductor, (clau, reserva)). Qui el munta li canvia la `key` a cada nota.
 */
export function BlocAmbit({ valor = null, document = null, onCanvia, mostraErrors = false, t }) {
  const tr = typeof t === 'function' ? t : reserva;
  const idTitol = useId();
  const idAjuda = useId();
  const ambitDeLaFitxa = ambitDe(valor);
  /* L'últim àmbit de la fitxa que el bloc ha vist: si canvia des de fora (no
     pel clic d'ací, que ja el porta), el formulari el pren amb les seues dades. */
  const [vist, setVist] = useState(ambitDeLaFitxa);
  const [ambit, setAmbit] = useState(ambitDeLaFitxa);
  const [estat, setEstat] = useState(() => normalitzaEstat(valor?.estat));
  const [dades, setDades] = useState(() => dadesInicials(valor));
  /* Fins al primer canvi d'un camp (o fins que PUBLICAR s'atura), cap error. */
  const [tocat, setTocat] = useState(false);
  /* Les dades de cada àmbit editat en esta nota: tornar-hi les recupera. */
  const memoria = useRef(null);
  if (memoria.current === null) memoria.current = { [ambitDeLaFitxa]: dadesInicials(valor) };
  if (ambitDeLaFitxa !== vist) {
    setVist(ambitDeLaFitxa);
    if (ambitDeLaFitxa !== ambit) {
      /* Correcció A1-02 de l'àrbitre · Les dades vives de l'àmbit que se'n va
         també es guarden quan el canvi ve de fora: tornar-hi amb un clic
         recupera l'última edició, no la del muntatge. Idempotent: sota
         StrictMode la pintada repetida hi escriu el mateix. */
      memoria.current[ambit] = dades;
      setAmbit(ambitDeLaFitxa);
      setEstat(normalitzaEstat(valor?.estat));
      setDades(dadesInicials(valor));
      setTocat(false);
    }
  }

  const validacio = validaFitxa(ambit, dades);
  const vertical = ambit !== AMBIT_PER_DEFECTE;
  const errors = (tocat || mostraErrors) && vertical
    ? Object.fromEntries(validacio.errors.map((error) => [error.camp, error.codi]))
    : CAP_ERROR;

  /* Les crides a onCanvia van als manejadors, mai dins d'un updater d'estat:
     sota StrictMode un updater es repetix i la fitxa s'escriuria dues voltes. */
  const canviaAmbit = (nou) => {
    if (!AMBITS.includes(nou) || nou === ambit) return;
    memoria.current[ambit] = dades;
    const novesDades = memoria.current[nou] ?? {};
    setAmbit(nou);
    setDades(novesDades);
    setTocat(false);
    onCanvia?.(fitxaDe(nou, estat, novesDades), 'ambit', sonValides(nou, novesDades));
  };
  const canviaDada = (id, text) => {
    const noves = { ...dades, [id]: text };
    setDades(noves);
    setTocat(true);
    onCanvia?.(fitxaDe(ambit, estat, noves), 'dades', sonValides(ambit, noves));
  };
  const canviaEstat = (event) => {
    const nou = normalitzaEstat(event.target.value);
    setEstat(nou);
    onCanvia?.(fitxaDe(ambit, nou, dades), 'dades', sonValides(ambit, dades));
  };
  /* La condició d'obligatori (places amb «Oferisc places»), com validaFitxa. */
  const esObligatori = (campDef) => campDef.obligatori
    || (campDef.obligatoriSi !== undefined && dades[campDef.obligatoriSi.camp] === campDef.obligatoriSi.valor);

  const nomDAmbit = etiquetaDAmbit(ambit, tr);
  const fitxaViva = fitxaDe(ambit, estat, dades);
  const base = esObjecte(document) ? document : {};
  /* Sense títol encara, la targeta es titula com l'àmbit: la previsualització no es queda en blanc. */
  const pagina = propsDeTargetaDeLaPagina(base) ?? propsDeTargetaDeLaPagina({ ...base, title: nomDAmbit });
  const resum = resumDeFitxa(fitxaViva, tr);

  /* Els camps de la fitxa i l'Estat, just davall del Selector de l'àmbit
     triat (AH-04; abans, el desplegable de GrupOpcions). El Mur no en porta. */
  const formulari = vertical ? (
    <Pila gap={4}>
      {CAMPS[ambit].map((campDef) => (
        <CampDeFitxa key={`${ambit}:${campDef.id}`} campDef={campDef} valor={dades[campDef.id]} obligatori={esObligatori(campDef)}
          error={errors[campDef.id] ? textDError(errors[campDef.id], etiquetaDeCamp(campDef, tr), tr) : undefined}
          onCanvi={canviaDada} t={tr} />
      ))}
      <Camp etiqueta={tr('ambit.camp.estat', 'Estat')}>
        <Selector value={fitxaViva.estat} onChange={canviaEstat}
          opcions={ESTATS.map((id) => ({ valor: id, etiqueta: etiquetaDEstat(id, tr) }))} />
      </Camp>
    </Pila>
  ) : null;

  return (
    <Pila gap={4} className="sdp-bloc-ambit" role="group" aria-labelledby={idTitol} aria-describedby={idAjuda}>
      <Pila gap={1}>
        <p id={idTitol} className="sdp-bloc-ambit__titol">{tr('editor.ambit.titol', 'On es publica?')}</p>
        <p id={idAjuda} className="sdp-bloc-ambit__ajuda">
          {tr('editor.ambit.ajuda', 'Tria si és una publicació del Mur o una fitxa per al Mercat, Calendari, Mapa, Compartir cotxe, Animalets, Treball o Habitatge.')}
        </p>
      </Pila>
      {/* G3-pedra-seca-i18n-13 (Pedra Seca §6, contracte O4) · El control de
          l'àmbit fa l'alçada d'acció (--sdp-alt-accio, 58 px), no el sòl de 48 px. */}
      <Camp etiqueta={tr('editor.ambit.boto', 'Àmbit')}>
        <Selector
          className="sdp-bloc-ambit__selector"
          value={ambit}
          onChange={(event) => canviaAmbit(event.target.value)}
          opcions={AMBITS.map((id) => ({ valor: id, etiqueta: etiquetaDAmbit(id, tr) }))}
        />
      </Camp>
      {formulari}
      {mostraErrors && vertical && !validacio.ok ? (
        <Alerta to="error" viva={false}>{omple(tr('editor.ambit.errorPublicar', 'La fitxa de «{ambit}» no està completa.'), { ambit: nomDAmbit })}</Alerta>
      ) : null}
      <Superficie as="section">
        <Pila gap={2}>
          <p className="sdp-bloc-ambit__previsualitzacio-titol">{tr('editor.ambit.previsualitzacio', 'Vista en format Card')}</p>
          <UniversalCard {...pagina} labels={etiquetesDAmbit(fitxaViva, tr)} hasFooter={false} showDateTime={false} />
          {resum ? <p>{resum}</p> : null}
        </Pila>
      </Superficie>
    </Pila>
  );
}

export default BlocAmbit;
