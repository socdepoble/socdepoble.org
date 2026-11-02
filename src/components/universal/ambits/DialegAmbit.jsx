/**
 * DialegAmbit.jsx — «On es publica?» · IDEA-61 (T0, prompt 261102_1532) · El
 * compositor del Flux Universal de Publicació: el selector d'àmbit (Mur,
 * Mercat, Compartir cotxe, Treball o Habitatge) i el formulari guiat que naix
 * del contracte pur (utils/publicacioUniversal.js · CAMPS), en un Dialeg de
 * Pedra Seca a la barra (el mateix lloc que SelectorVisibilitat).
 *
 * Universal: no importa cap secció. Qui el munta (el Bloc de Notes) li passa
 * la fitxa actual ({ ambit, estat, dades } o null), el document per a la
 * previsualització ({ title, subtitle, lead, heroImage?, authorName?… }, el
 * que llig propsDeTargetaDeLaPagina) i el traductor, i rep per onDesa la
 * fitxa ja validada i normalitzada (validaFitxa + normalitzaDades): cap valor
 * fora del vocabulari tancat ix d'ací. Un àmbit 'mur' és la publicació de
 * sempre: sense camps ni etiquetes (Llei del Píxel).
 *
 * Cap classe CSS nova: Camp, CampText, AreaText, Selector, GrupOpcions,
 * Alerta, Boto, Pila i Superficie de Pedra Seca, i la UniversalCard de la
 * pàgina (targetaDeLaPagina.js) amb les etiquetes i el resum del contracte.
 * Els errors de validaFitxa van en línia (Camp error) i, en desar amb errors,
 * un anunci curt (Alerta d'error, role="alert"). Escape i Arrere tanquen
 * (Dialeg ja ho fa). Qui el munta en canvia la `key` a cada nota: l'estat
 * naix de `valor` en muntar.
 */
import { useState } from 'react';
import { Alerta, AreaText, Boto, Camp, CampText, Dialeg, GrupOpcions, Pila, Selector, Superficie, UniversalCard } from '../../PedraSeca/index.js';
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
  llargaria: Object.freeze(['editor.ambit.error.llargaria', 'El text de «{camp}» és massa llarg.'])
});

function textDError(codi, nomDelCamp, t) {
  const parell = codi === 'obligatori' ? TEXT_OBLIGATORI : (TEXT_PER_CODI[codi] ?? TEXT_PER_CODI.format);
  return omple(t(parell[0], parell[1]), { camp: nomDelCamp });
}

/* Revisió L2-A1 (IDEA-61) · La insígnia de l'opció d'àmbit marcada (GrupOpcions
   en mode controlat), traduïda als cinc diccionaris. */
const TEXT_TRIAT = Object.freeze(['editor.ambit.triat', 'Triat']);

/* El tipus de l'<input> per a cada tipus del contracte. */
const TIPUS_INPUT = Object.freeze({ text: 'text', preu: 'text', data: 'date', hora: 'time' });

/* Les dades inicials: les de la fitxa que arriba, coaccionades pel contracte
   (una fitxa d'una fila del port pot portar qualsevol cosa). */
const dadesInicials = (valor) => (valor && AMBITS.includes(valor.ambit) ? normalitzaDades(valor.ambit, valor.dades) : {});
const esObjecte = (valor) => valor !== null && typeof valor === 'object';

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
  return <Camp etiqueta={etiquetaDeCamp(campDef, t)} obligatori={obligatori} error={error}>{control}</Camp>;
}

/**
 * Props: obert, valor ({ ambit, estat, dades } o null), document (el de la
 * previsualització, o null), onDesa(fitxa normalitzada), onTanca(motiu) i t
 * (el traductor, (clau, reserva)).
 */
export function DialegAmbit({ obert, valor = null, document = null, onDesa, onTanca, t }) {
  const tr = typeof t === 'function' ? t : reserva;
  const [ambit, setAmbit] = useState(() => (valor && AMBITS.includes(valor.ambit) ? valor.ambit : AMBIT_PER_DEFECTE));
  const [estat, setEstat] = useState(() => normalitzaEstat(valor?.estat));
  const [dades, setDades] = useState(() => dadesInicials(valor));
  /* Fins a «Desar», cap error; després, la validació viva de cada tecla. */
  const [validat, setValidat] = useState(false);
  const errors = validat ? Object.fromEntries(validaFitxa(ambit, dades).errors.map((error) => [error.camp, error.codi])) : CAP_ERROR;
  const ambErrors = Object.keys(errors).length > 0;

  const canviaAmbit = (nou) => {
    if (!AMBITS.includes(nou) || nou === ambit) return;
    setAmbit(nou);
    /* Tornar a l'àmbit de la fitxa recupera les seues dades; un altre, de zero. */
    setDades(valor && nou === valor.ambit ? dadesInicials(valor) : {});
    setValidat(false);
  };
  const canviaDada = (id, text) => setDades((abans) => ({ ...abans, [id]: text }));
  const desa = () => {
    setValidat(true);
    if (!validaFitxa(ambit, dades).ok) return;
    onDesa?.({ ambit, estat: normalitzaEstat(estat), dades: normalitzaDades(ambit, dades) });
  };
  /* La condició d'obligatori (places amb «Oferisc places»), com validaFitxa. */
  const esObligatori = (campDef) => campDef.obligatori
    || (campDef.obligatoriSi !== undefined && dades[campDef.obligatoriSi.camp] === campDef.obligatoriSi.valor);

  const nomDAmbit = etiquetaDAmbit(ambit, tr);
  const fitxaViva = { ambit, estat: normalitzaEstat(estat), dades: normalitzaDades(ambit, dades) };
  const base = esObjecte(document) ? document : {};
  /* Sense títol encara, la targeta es titula com l'àmbit: la previsualització no es queda en blanc. */
  const pagina = propsDeTargetaDeLaPagina(base) ?? propsDeTargetaDeLaPagina({ ...base, title: nomDAmbit });
  const resum = resumDeFitxa(fitxaViva, tr);
  const titolPrevisualitzacio = tr('editor.ambit.previsualitzacio', 'Així es veurà al Mur');

  return (
    <Dialeg obert={obert} onTanca={onTanca} titol={tr('editor.ambit.titol', 'On es publica?')}
      descripcio={tr('editor.ambit.ajuda', 'Tria si és una publicació del Mur o una fitxa per al Mercat, Compartir cotxe, Treball o Habitatge.')}
      mida="g" lloc="barra"
      accions={(
        <>
          <Boto varietat="secundari" onClick={() => onTanca?.('boto')}>{tr('editor.ambit.cancelar', 'Cancel·lar')}</Boto>
          <Boto varietat="primari" onClick={desa}>{tr('editor.ambit.desar', 'Desar l’àmbit')}</Boto>
        </>
      )}>
      <Pila gap={4}>
        <GrupOpcions aspecte="targetes" llegenda={tr('editor.ambit.boto', 'Àmbit')} valor={ambit} onCanvi={canviaAmbit}
          textTriada={tr(TEXT_TRIAT[0], TEXT_TRIAT[1])} opcions={AMBITS.map((id) => ({ valor: id, etiqueta: etiquetaDAmbit(id, tr) }))} />
        {ambit === AMBIT_PER_DEFECTE ? null : (
          <>
            {CAMPS[ambit].map((campDef) => (
              <CampDeFitxa key={`${ambit}:${campDef.id}`} campDef={campDef} valor={dades[campDef.id]} obligatori={esObligatori(campDef)}
                error={errors[campDef.id] ? textDError(errors[campDef.id], etiquetaDeCamp(campDef, tr), tr) : undefined}
                onCanvi={canviaDada} t={tr} />
            ))}
            <Camp etiqueta={tr('ambit.camp.estat', 'Estat')}>
              <Selector value={fitxaViva.estat} onChange={(event) => setEstat(normalitzaEstat(event.target.value))}
                opcions={ESTATS.map((id) => ({ valor: id, etiqueta: etiquetaDEstat(id, tr) }))} />
            </Camp>
          </>
        )}
        {ambErrors ? (
          <Alerta to="error">{omple(tr('editor.ambit.errorPublicar', 'La fitxa de «{ambit}» no està completa.'), { ambit: nomDAmbit })}</Alerta>
        ) : null}
        <Superficie as="section">
          <Pila gap={2}>
            <p>{titolPrevisualitzacio}</p>
            <UniversalCard {...pagina} labels={etiquetesDAmbit(fitxaViva, tr)} hasFooter={false} showDateTime={false} />
            {resum ? <p>{resum}</p> : null}
          </Pila>
        </Superficie>
      </Pila>
    </Dialeg>
  );
}

export default DialegAmbit;
