/**
 * El Bar · vistes/Caixa.jsx — la comanda ràpida (disseny del Bar §A.6, flux 1)
 * feta amb l'ESQUELET COMÚ (ordre del Mestre, 261002: sinergies T4/T8).
 *
 *   CatalegCaixa   ColumnaCataleg: els productes per categories, la cerca i
 *                  el detall (variants i modificadors). El toc afig la variant
 *                  per defecte; un grup obligatori obri el diàleg menut (un toc
 *                  tria i tanca); la pulsació llarga o el botó dret, el detall.
 *                  El preu obert es tecleja; si el producte té més d'una
 *                  variant, primer el diàleg menut la tria i després el preu.
 *   ComandaCaixa   ColumnaColleccio: «quantitat × nom», el total i «Cobra».
 *   TiquetsOberts  ColumnaColleccions: la barra, les taules i per emportar.
 * Composicions primes: les dades del Bar vestides (vestits.js) i els gestos
 * cap a l'estat (ProveidorBar). Cap graella, llista ni classe pròpia.
 */
import { useEffect, useState } from 'react';
import { ArrowRightLeft, Plus, Send, Split, Trash2 } from 'lucide-react';
import {
  Boto, Camp, Dialeg, EstatBuit, Fila, Pila, Selector, TeclatNumeric
} from '../../../components/PedraSeca/index.js';
import { ColumnaCataleg, ColumnaColleccio, ColumnaColleccions } from '../../comu/esquelet/index.js';
import { esIdOpac, esSlug, useParametresConsulta } from '../../plataforma/index.js';
import { NOMS_ALERGENS, resolModificadors } from '../nucli/cataleg.js';
import { totals } from '../nucli/comanda.js';
import { potTancar } from '../nucli/cobrament.js';
import { useBar } from '../estat/ProveidorBar.jsx';
import { EditorLinia } from './EditorLinia.jsx';
import { AvisBase, AvisOperacio, Columna, NoTrobat, Preparat } from './comu.jsx';
import { useFixaComanda, usePunt, useVes } from './punt.js';
import {
  TEXTOS_LINIES_BAR, articlesDeCarta, categoriesVestides, euros, horaCurta, liniesVestides, llegixOpcio, necessitaTria, nomOrigen,
  opcionsDetall, resumDeComanda, textLinies, triaLaVariant
} from './vestits.js';

/* Els diàlegs van a la consulta (Clàusula dels Slugs, BAR-R7): ?linia=<id>,
   ?mou=1 i ?preu=<producte> (amb &variant=<variant> quan el producte en té
   més d'una). `article` és el detall de l'esquelet: només es llig. */
const PARAMETRES_COMANDA = Object.freeze({ linia: esIdOpac, mou: (valor) => valor === '1' });
const PARAMETRES_CATALEG = Object.freeze({ preu: esSlug, variant: esSlug, article: esIdOpac });

/* «Varis»: el preu es tecleja en vendre. La variant triada, si n'hi ha, va al títol. */
function DialegPreuObert({ producte, variant = null, onTanca, onAfig }) {
  const [preu, setPreu] = useState(0);
  const titol = producte?.nom ? [producte.nom, variant?.nom].filter(Boolean).join(' · ') : 'Preu obert';
  return (
    <Dialeg obert={Boolean(producte)} onTanca={onTanca} titol={titol} descripcio="Tecleja el preu amb IVA inclòs."
      accions={<Boto onClick={() => onTanca('boto')}>Cancel·la</Boto>}>
      {producte ? (
        <TeclatNumeric mode="import" etiqueta="Preu" valor={preu} onCanvi={setPreu}
          onAccepta={(cents) => { if (cents > 0) onAfig(cents); }} textAccepta="Afig" />
      ) : null}
    </Dialeg>
  );
}

export function CatalegCaixa({ params }) {
  return (
    <Preparat titol="Productes">
      <CatalegDelPunt params={params} />
    </Preparat>
  );
}

function CatalegDelPunt({ params }) {
  const bar = useBar();
  const punt = usePunt(params);
  /* El diàleg del preu obert va a la consulta (?preu=<producte>&variant=<variant>): BAR-R7. */
  const [consulta, posaConsulta] = useParametresConsulta(PARAMETRES_CATALEG);
  const fixaComanda = useFixaComanda();
  /* Des del detall (?article=), el preu s'obri quan el detall ja s'ha tancat:
     si no, el tancament del detall esborraria el ?preu= de la consulta.
     preuPendent = { preu, variant } (variant null amb una sola variant). */
  const [preuPendent, setPreuPendent] = useState(null);
  useEffect(() => {
    if (!preuPendent || consulta.article) return;
    setPreuPendent(null);
    posaConsulta(preuPendent);
  }, [preuPendent, consulta.article, posaConsulta]);
  if (punt.perduda) return <NoTrobat text="Esta comanda ja no està oberta o la taula no existix." torna={{ etiqueta: 'Ves a la caixa', trams: ['caixa'] }} />;
  const { carta, establiment, accions } = bar;
  const perId = new Map(carta.productes.map((p) => [p.id, p]));
  /* El preu obert de la consulta. Amb més d'una variant, només amb la variant
     triada (?variant=): mai la primera a cegues. */
  const ambPreu = consulta.preu ? carta.productes.find((p) => p.id === consulta.preu && p.preuObert && p.actiu !== false) || null : null;
  const variantPreu = ambPreu && triaLaVariant(ambPreu) ? ambPreu.variants.find((v) => v.id === consulta.variant) || null : null;
  const preuObert = ambPreu && (!triaLaVariant(ambPreu) || variantPreu) ? ambPreu : null;
  const aComanda = new Set((punt.comanda?.linies || []).filter((l) => l.estat !== 'anullada').map((l) => l.producteId));
  const articles = articlesDeCarta(carta, { aComanda, establiment });
  /* A /caixa, la comanda que rep el primer producte passa al camí (BAR-R7). */
  const afig = async (producte, extra = {}) => {
    const r = await accions.afegeix({ comandaId: punt.comanda?.id || null, origen: punt.origen }, { producte, ...extra });
    if (r.ok) fixaComanda(r.valor);
    return r;
  };
  const tria = (article, { obriDetall } = {}) => {
    const producte = perId.get(article.id);
    if (!producte) return;
    if (producte.preuObert && !triaLaVariant(producte)) posaConsulta({ preu: producte.id });
    else if (necessitaTria(producte, carta.grups)) obriDetall?.();
    else afig(producte);
  };
  return (
    <>
      <ColumnaCataleg
        titol="Productes"
        primer="cataleg"
        categories={categoriesVestides(carta)}
        articles={articles}
        textosEstat={{ 'en-colleccio': 'A la comanda' }}
        textArticles={(n) => `${n} ${n === 1 ? 'producte' : 'productes'}`}
        onTria={tria}
        afegit={{ etiqueta: 'Busca un producte', suggeriments: articles.filter((a) => a.estat !== 'desactivat') }}
        detall={{
          variantsDe: (article) => opcionsDetall(perId.get(article.id), carta.grups),
          triaDirecta: (article) => necessitaTria(perId.get(article.id), carta.grups),
          etiquetaVariants: (article) => {
            const producte = perId.get(article.id);
            const grup = carta.grups.find((g) => producte.grupsModificadors.includes(g.id));
            return grup ? grup.nom : 'Variant';
          },
          etiquetaNota: 'Nota per a la barra o la cuina',
          textAccepta: 'Afig',
          onAccepta: ({ variant, quantitat, nota }, article) => {
            const producte = perId.get(article.id);
            const { varianteId, opcions } = llegixOpcio(variant);
            if (producte.preuObert) {
              setPreuPendent({ preu: producte.id, variant: triaLaVariant(producte) ? varianteId || null : null });
              return;
            }
            afig(producte, { varianteId, modificadors: resolModificadors(producte, carta.grups, opcions), quantitat: quantitat || 1, nota });
          },
          contingutDe: (article) => {
            const alergens = perId.get(article.id)?.alergens || [];
            return <p>{alergens.length ? `Al·lèrgens: ${alergens.map((a) => NOMS_ALERGENS[a]).join(', ')}. Els manté el bar.` : 'Sense al·lèrgens anotats. Els manté el bar.'}</p>;
          }
        }}
        resum={resumDeComanda(punt.comanda)}
      />
      <DialegPreuObert key={preuObert ? [preuObert.id, variantPreu?.id].filter(Boolean).join('~') : 'cap'} producte={preuObert} variant={variantPreu}
        onTanca={() => posaConsulta({ preu: null, variant: null })}
        onAfig={(preuCents) => {
          afig(preuObert, { preuCents, ...(variantPreu ? { varianteId: variantPreu.id } : {}) });
          posaConsulta({ preu: null, variant: null });
        }} />
    </>
  );
}

/* «Mou a una altra taula» o «Ajunta»: tota la comanda passa a un altre lloc. */
function DialegMou({ obert, comanda, onTanca }) {
  const { sala, comandes, accions } = useBar();
  const { ves } = useVes();
  const [desti, setDesti] = useState('');
  const opcions = [
    { valor: '', etiqueta: 'Tria on va', desactivat: true },
    { valor: 'barra', etiqueta: 'Barra (un tiquet nou)' },
    ...sala.taules.map((t) => ({ valor: `taula:${t.id}`, etiqueta: t.nom })),
    ...comandes.filter((c) => c.id !== comanda?.id && c.origen.tipus !== 'taula')
      .map((c) => ({ valor: `comanda:${c.id}`, etiqueta: `${nomOrigen(c.origen, sala)} · ${horaCurta(c.obertaA)}` }))
  ];
  const mou = async () => {
    const [tipus, id] = desti.split(':');
    let destiNet;
    if (tipus === 'comanda') destiNet = { comandaId: id };
    else if (tipus === 'taula') {
      const existent = comandes.find((c) => c.id !== comanda.id && c.origen.tipus === 'taula' && c.origen.taulaId === id);
      destiNet = existent ? { comandaId: existent.id } : { origen: { tipus: 'taula', taulaId: id } };
    } else destiNet = { origen: { tipus: 'barra' } };
    const r = await accions.mou(comanda.id, destiNet, comanda.linies.filter((l) => l.estat !== 'anullada').map((l) => ({ liniaId: l.id })));
    /* La comanda de destí és un altre camí, sense ?mou=: el diàleg es tanca sol. */
    if (r.ok) ves('caixa', r.valor.id);
  };
  return (
    <Dialeg obert={obert} onTanca={onTanca} titol="Mou o ajunta la comanda" descripcio="Totes les línies passen al lloc que tries; si ja hi ha una comanda, s’hi ajunten."
      accions={<><Boto onClick={() => onTanca('boto')}>Cancel·la</Boto><Boto varietat="primari" disabled={!desti} onClick={mou}>Mou</Boto></>}>
      {obert ? (
        <Camp etiqueta="On va">
          <Selector opcions={opcions} value={desti} onChange={(event) => setDesti(event.target.value)} />
        </Camp>
      ) : null}
    </Dialeg>
  );
}

export function ComandaCaixa({ params }) {
  return (
    <Preparat titol="Comanda">
      <ComandaDelPunt params={params} />
    </Preparat>
  );
}

function ComandaDelPunt({ params }) {
  const bar = useBar();
  const { ves } = useVes();
  const punt = usePunt(params);
  const [consulta, posaConsulta] = useParametresConsulta(PARAMETRES_COMANDA);
  if (punt.perduda) return <NoTrobat text="Esta comanda ja no està oberta." torna={{ etiqueta: 'Ves a la caixa', trams: ['caixa'] }} />;
  const { comanda } = punt;
  const { accions, sala } = bar;
  const titol = punt.taula ? punt.taula.nom : (comanda ? nomOrigen(comanda.origen, sala) : 'Barra');
  const t = comanda ? totals(comanda) : null;
  const perId = new Map((comanda?.linies || []).map((l) => [l.id, l]));
  const edita = (linia) => posaConsulta({ linia: linia.id });
  /* Una línia marxada no baixa ni es lleva: s'obri l'editor per a anul·lar-la amb motiu.
     + i − són relatius a la comanda d'ara: dos tocs seguits fan dues unitats (BAR-R5). */
  const resta = (linia) => {
    if (perId.get(linia.id)?.estat === 'nova') accions.sumaQuantitat(comanda.id, linia.id, -1);
    else edita(linia);
  };
  const suma = (linia) => {
    if (perId.get(linia.id)?.estat === 'nova') accions.sumaQuantitat(comanda.id, linia.id, 1);
    else edita(linia);
  };
  const lleva = (linia) => {
    const original = perId.get(linia.id);
    if (original?.estat === 'nova') accions.canviaQuantitat(comanda.id, linia.id, 0);
    else edita(linia);
  };
  const ambNoves = Boolean(comanda?.linies.some((l) => l.estat === 'nova'));
  const ambLinies = Boolean(comanda?.linies.some((l) => l.estat !== 'anullada'));
  /* Res a cobrar i alguna línia (convidades o totes anul·lades): es tanca amb un
     tiquet de 0 € que en guarda la traça; si no, no passaria mai de torn (BAR-R2). */
  const tancable = Boolean(comanda) && potTancar(comanda).ok;
  const peu = (
    <Pila gap={2}>
      <AvisBase />
      <AvisOperacio />
      {comanda ? (
        <Fila gap={2}>
          {ambNoves ? <Boto icona={Send} onClick={() => accions.marxa(comanda.id)}>Marxa</Boto> : null}
          {ambLinies ? <Boto icona={Split} onClick={() => ves(...punt.trams, 'dividir')}>Dividix</Boto> : null}
          {ambLinies ? <Boto icona={ArrowRightLeft} onClick={() => posaConsulta({ mou: '1' })}>Mou</Boto> : null}
          {comanda.linies.length === 0 ? <Boto icona={Trash2} varietat="perill" onClick={() => accions.descarta(comanda.id)}>Descarta</Boto> : null}
          {tancable ? <Boto onClick={() => accions.tanca(comanda.id)}>Tanca sense cobrar</Boto> : null}
        </Fila>
      ) : null}
    </Pila>
  );
  return (
    <>
      <ColumnaColleccio
        titol={titol}
        primer="cataleg"
        linies={liniesVestides(comanda)}
        textosLinies={TEXTOS_LINIES_BAR}
        resum={{
          ...resumDeComanda(comanda),
          accio: { text: 'Cobra', desactivada: !t || t.pendentCents <= 0, onClick: () => ves(...punt.trams, 'cobrar') }
        }}
        onEdita={comanda ? edita : undefined}
        onResta={comanda ? resta : undefined}
        onSuma={comanda ? suma : undefined}
        onLleva={comanda ? lleva : undefined}
        peu={peu}
        textos={{ buit: 'La comanda és buida', buitText: 'Toca un producte per a afegir-lo.' }}
      />
      <EditorLinia comanda={comanda} liniaId={consulta.linia} onTanca={() => posaConsulta({ linia: null })} />
      <DialegMou obert={consulta.mou === '1' && ambLinies} comanda={comanda} onTanca={() => posaConsulta({ mou: null })} />
    </>
  );
}

/** Les targetes dels tiquets oberts: la barra (encara que no en tinga cap), les taules i per emportar. */
function useTiquetsOberts() {
  const { comandes, sala } = useBar();
  const ordenades = [...comandes].sort((a, b) => (a.obertaA < b.obertaA ? -1 : 1));
  const targetes = ordenades.map((c) => {
    const t = totals(c);
    const vives = c.linies.filter((l) => l.estat !== 'anullada').length;
    return {
      id: c.id,
      nom: c.origen.tipus === 'taula' ? nomOrigen(c.origen, sala) : `${nomOrigen(c.origen, sala)} · ${horaCurta(c.obertaA)}`,
      comptador: vives,
      secundari: t.pagatCents > 0 ? `Pendent ${euros(t.pendentCents)}` : euros(t.totalCents)
    };
  });
  if (!comandes.some((c) => c.origen.tipus === 'barra')) targetes.unshift({ id: 'barra', nom: 'Barra', comptador: 0 });
  return targetes;
}

export function TiquetsOberts({ params }) {
  return (
    <Preparat titol="Tiquets oberts">
      <TiquetsDelTorn params={params} ambActiu />
    </Preparat>
  );
}

/** Els mateixos tiquets oberts on la persona no és a cap comanda (/taules, /emportar): cap targeta és l'actual (BAR-R8). */
export function TiquetsObertsSenseActiu() {
  return (
    <Preparat titol="Tiquets oberts">
      <TiquetsDelTorn params={null} ambActiu={false} />
    </Preparat>
  );
}

function TiquetsDelTorn({ params, ambActiu }) {
  const bar = useBar();
  const { ruta, ves } = useVes();
  const targetes = useTiquetsOberts();
  const punt = usePunt(params || {});
  /* A /caixa sense cap comanda de barra, la targeta «Barra» és l'activa. Fora
     de la caixa i de les taules, cap: aria-current no ha de dir una ubicació falsa. */
  let actiu = null;
  if (ambActiu) actiu = punt.comanda?.id || (!params?.taula && !params?.comanda ? 'barra' : null);
  const nou = async () => {
    const r = await bar.accions.novaComanda({ tipus: 'barra' });
    if (r.ok) ves('caixa', r.valor.id);
  };
  return (
    <ColumnaColleccions
      titol="Tiquets oberts"
      colleccions={targetes}
      actiu={actiu}
      hrefDe={(c) => (c.id === 'barra' ? ruta('caixa') : ruta('caixa', c.id))}
      onCrea={nou}
      textCrea="Nou tiquet de barra"
      textComptador={textLinies}
    />
  );
}

/** /app/bar/emportar: una comanda nova per emportar (la llista és la dels tiquets oberts). */
export function EmportarInici() {
  return (
    <Preparat titol="Per emportar">
      <EmportarNova />
    </Preparat>
  );
}

function EmportarNova() {
  const { accions } = useBar();
  const { ves } = useVes();
  const crea = async () => {
    const r = await accions.novaComanda({ tipus: 'emportar' });
    if (r.ok) ves('caixa', r.valor.id);
  };
  return (
    <Columna titol="Per emportar">
      <AvisOperacio />
      <EstatBuit icona={Plus} titol="Una comanda per emportar" accio={<Boto varietat="primari" icona={Plus} onClick={crea}>Nova comanda per emportar</Boto>}>
        Les comandes per emportar obertes són a la llista de tiquets oberts.
      </EstatBuit>
    </Columna>
  );
}
