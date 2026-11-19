/**
 * El Bar · vistes/Caixa.jsx — la comanda ràpida (disseny del Bar §A.6, flux 1)
 * feta amb l'ESQUELET COMÚ (ordre del Mestre, 261002: sinergies T4/T8).
 */
import { useEffect, useState } from 'react';
import { ArrowRightLeft, Plus, Send, Split, Trash2 } from 'lucide-react';
import {
  Alerta, Boto, Camp, Dialeg, EstatBuit, Fila, Pila, Selector, TeclatNumeric
} from '../../../components/PedraSeca/index.js';
import { ColumnaCataleg, ColumnaColleccio, ColumnaColleccions } from '../../comu/esquelet/index.js';
import { esIdOpac, esSlug, useParametresConsulta } from '../../plataforma/index.js';
import { grupsDe, resolModificadors } from '../nucli/cataleg.js';
import { totals } from '../nucli/comanda.js';
import { potTancar } from '../nucli/cobrament.js';
import { useBar } from '../estat/ProveidorBar.jsx';
import { textProductesBar, textosUiBar } from '../i18nBar.js';
import { nomAlergen } from '../i18nMercaderies.js';
import { EditorLinia } from './EditorLinia.jsx';
import { AvisBase, AvisDeLaColumna, AvisOperacio, Columna, NoTrobat, Preparat } from './comu.jsx';
import { ambTornada, esTornaTpv, useFixaComanda, useIdiomaBar, usePunt, useVes } from './punt.js';
import {
  articlesDeCarta, categoriesVestides, horaCurta, liniesVestides, llegixOpcio, necessitaTria, nomOrigen,
  opcionsDetall, preuObertDeConsulta, resumDeComanda, textLiniesPerIdioma, textosLiniesBar, tiquetsOberts, triaLaVariant
} from './vestits.js';

const PARAMETRES_COMANDA = Object.freeze({ linia: esIdOpac, mou: (valor) => valor === '1', torna: esTornaTpv });
const PARAMETRES_CATALEG = Object.freeze({ preu: esSlug, variant: esSlug, article: esIdOpac });
const CAP_PREU = Object.freeze({ producte: null, variant: null });

export function DialegPreuObert({ producte, variant = null, onTanca, onAfig, idioma }) {
  const idiomaContext = useIdiomaBar();
  const tx = textosUiBar(idioma || idiomaContext);
  const [preu, setPreu] = useState(0);
  const titol = producte?.nom ? [producte.nom, variant?.nom].filter(Boolean).join(' · ') : tx.preuObert;
  return (
    <Dialeg obert={Boolean(producte)} onTanca={onTanca} titol={titol} descripcio={tx.preuObertDesc}
      accions={<Boto onClick={() => onTanca('boto')}>{tx.cancela}</Boto>}>
      {producte ? (
        <TeclatNumeric mode="import" etiqueta={tx.preu} valor={preu} onCanvi={setPreu}
          onAccepta={(cents) => { if (cents > 0) onAfig(cents); }} textAccepta={tx.afig} />
      ) : null}
    </Dialeg>
  );
}

export function CatalegCaixa({ params }) {
  const idioma = useIdiomaBar();
  const tx = textosUiBar(idioma);
  return (
    <Preparat titol={tx.productes}>
      <CatalegDelPunt params={params} idioma={idioma} />
    </Preparat>
  );
}

function CatalegDelPunt({ params, idioma = 'ca' }) {
  const tx = textosUiBar(idioma);
  const bar = useBar();
  const punt = usePunt(params);
  const [consulta, posaConsulta] = useParametresConsulta(PARAMETRES_CATALEG);
  const fixaComanda = useFixaComanda();
  const [preuPendent, setPreuPendent] = useState(null);
  useEffect(() => {
    if (!preuPendent || consulta.article) return;
    setPreuPendent(null);
    posaConsulta(preuPendent);
  }, [preuPendent, consulta.article, posaConsulta]);
  if (punt.perduda) return <NoTrobat text={tx.comandaOTaulaInexistent} torna={{ etiqueta: tx.vesALaCaixa, trams: ['caixa'] }} />;
  const { carta, establiment, accions } = bar;
  const ven = bar.permis.potEscriure;
  const perId = new Map(carta.productes.map((p) => [p.id, p]));
  const { producte: preuObert, variant: variantPreu } = ven ? preuObertDeConsulta(carta, consulta) : CAP_PREU;
  const aComanda = new Set((punt.comanda?.linies || []).filter((l) => l.estat !== 'anullada').map((l) => l.producteId));
  const delaCarta = articlesDeCarta(carta, { aComanda, establiment, idioma });
  const articles = ven ? delaCarta : delaCarta.map((article) => ({ ...article, estat: 'desactivat' }));
  const textosEstatCaixa = ven
    ? { 'en-colleccio': tx.aLaComanda }
    : { 'en-colleccio': tx.aLaComanda, desactivat: tx.araNoPotVendre };
  const afig = async (producte, extra = {}) => {
    const r = await accions.afegeix({ comandaId: punt.comanda?.id || null, origen: punt.origen }, { producte, ...extra });
    if (r.ok) fixaComanda(r.valor);
    return r;
  };
  const tria = (article, { obriDetall } = {}) => {
    const producte = perId.get(article.id);
    if (!ven || !producte) return;
    if (producte.preuObert && !triaLaVariant(producte)) posaConsulta({ preu: producte.id });
    else if (necessitaTria(producte, carta.grups)) obriDetall?.();
    else afig(producte);
  };
  return (
    <>
      <ColumnaCataleg
        titol={tx.productes}
        primer="cataleg"
        categories={categoriesVestides(carta)}
        articles={articles}
        textosEstat={textosEstatCaixa}
        textArticles={(n) => textProductesBar(n, idioma)}
        onTria={tria}
        afegit={{ etiqueta: tx.buscaProducte, suggeriments: articles.filter((a) => a.estat !== 'desactivat') }}
        detall={{
          variantsDe: (article) => opcionsDetall(perId.get(article.id), carta.grups, idioma),
          triaDirecta: (article) => necessitaTria(perId.get(article.id), carta.grups),
          etiquetaVariants: (article) => {
            const delProducte = grupsDe(perId.get(article.id), carta.grups);
            return delProducte.length ? delProducte.map((g) => g.nom).join(' · ') : tx.variantEtiqueta;
          },
          etiquetaNota: tx.notaBarraCuina,
          textAccepta: tx.afig,
          onAccepta: ({ variant, quantitat, nota }, article) => {
            const producte = perId.get(article.id);
            if (!ven || !producte) return;
            const { varianteId, opcions } = llegixOpcio(variant);
            if (producte.preuObert) {
              setPreuPendent({ preu: producte.id, variant: triaLaVariant(producte) ? varianteId || null : null });
              return;
            }
            afig(producte, { varianteId, modificadors: resolModificadors(producte, carta.grups, opcions), quantitat: quantitat || 1, nota });
          },
          contingutDe: (article) => {
            const alergens = perId.get(article.id)?.alergens || [];
            return <p>{alergens.length ? tx.alergensManteBar(alergens.map((a) => nomAlergen(a, idioma)).join(', ')) : tx.senseAlergensManteBar}</p>;
          }
        }}
        resum={resumDeComanda(punt.comanda, idioma)}
        avis={<AvisDeLaColumna />}
      />
      <DialegPreuObert key={preuObert ? [preuObert.id, variantPreu?.id].filter(Boolean).join('~') : 'cap'} producte={preuObert} variant={variantPreu}
        idioma={idioma}
        onTanca={() => posaConsulta({ preu: null, variant: null })}
        onAfig={(preuCents) => {
          afig(preuObert, { preuCents, ...(variantPreu ? { varianteId: variantPreu.id } : {}) });
          posaConsulta({ preu: null, variant: null });
        }} />
    </>
  );
}

function DialegMou({ obert, comanda, onTanca, idioma = 'ca' }) {
  const tx = textosUiBar(idioma);
  const { sala, comandes, accions } = useBar();
  const { ves } = useVes();
  const [desti, setDesti] = useState('');
  const opcions = [
    { valor: '', etiqueta: tx.triaOnVa, desactivat: true },
    { valor: 'barra', etiqueta: tx.barraTiquetNou },
    ...sala.taules.map((t) => ({ valor: `taula:${t.id}`, etiqueta: t.nom })),
    ...comandes.filter((c) => c.id !== comanda?.id && c.origen.tipus !== 'taula')
      .map((c) => ({ valor: `comanda:${c.id}`, etiqueta: `${nomOrigen(c.origen, sala, idioma)} · ${horaCurta(c.obertaA)}` }))
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
    if (r.ok) ves('caixa', r.valor.id);
  };
  const ambPagaments = Boolean(comanda?.pagaments.length);
  return (
    <Dialeg obert={obert} onTanca={onTanca} titol={tx.mouAjuntaTitol} descripcio={tx.mouAjuntaDesc}
      accions={<><Boto onClick={() => onTanca('boto')}>{tx.cancela}</Boto><Boto varietat="primari" disabled={!desti || ambPagaments} onClick={mou}>{tx.mou}</Boto></>}>
      {obert ? (
        <Camp etiqueta={tx.onVa}>
          <Selector opcions={opcions} value={desti} onChange={(event) => setDesti(event.target.value)} />
        </Camp>
      ) : null}
      {obert && ambPagaments ? <Alerta to="info" viva={false}>{tx.comandaAmbPagamentsMou}</Alerta> : null}
    </Dialeg>
  );
}

export function ComandaCaixa({ params }) {
  const idioma = useIdiomaBar();
  const tx = textosUiBar(idioma);
  return (
    <Preparat titol={tx.comandaEtiqueta} avis="estret">
      <ComandaDelPunt params={params} idioma={idioma} />
    </Preparat>
  );
}

function ComandaDelPunt({ params, idioma = 'ca' }) {
  const tx = textosUiBar(idioma);
  const bar = useBar();
  const { ves } = useVes();
  const punt = usePunt(params);
  const [consulta, posaConsulta] = useParametresConsulta(PARAMETRES_COMANDA);
  if (punt.perduda) return <NoTrobat text={tx.comandaTancada} torna={{ etiqueta: tx.vesALaCaixa, trams: ['caixa'] }} />;
  const { comanda } = punt;
  const { accions, sala } = bar;
  const ven = bar.permis.potEscriure;
  const tornaTpv = consulta.torna === 'tpv';
  const editable = ven && Boolean(comanda);
  const titol = punt.taula ? punt.taula.nom : (comanda ? nomOrigen(comanda.origen, sala, idioma) : tx.barra);
  const t = comanda ? totals(comanda) : null;
  const perId = new Map((comanda?.linies || []).map((l) => [l.id, l]));
  const edita = (linia) => posaConsulta({ linia: linia.id });
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
  const tancable = Boolean(comanda) && potTancar(comanda).ok;
  const peu = (
    <Pila gap={2}>
      <AvisBase />
      <AvisOperacio />
      {comanda ? (
        <Fila gap={2}>
          {ambNoves ? <Boto icona={Send} disabled={!ven} onClick={() => accions.marxa(comanda.id)}>{tx.marxa}</Boto> : null}
          {ambLinies ? <Boto icona={Split} disabled={!ven} onClick={() => ves(...punt.trams, ambTornada('dividir', tornaTpv))}>{tx.dividix}</Boto> : null}
          {ambLinies ? <Boto icona={ArrowRightLeft} disabled={!ven} onClick={() => posaConsulta({ mou: '1' })}>{tx.mou}</Boto> : null}
          {comanda.linies.length === 0 ? <Boto icona={Trash2} varietat="perill" disabled={!ven} onClick={() => accions.descarta(comanda.id)}>{tx.descarta}</Boto> : null}
          {tancable ? <Boto disabled={!ven} onClick={() => accions.tanca(comanda.id)}>{tx.tancaSenseCobrar}</Boto> : null}
        </Fila>
      ) : null}
    </Pila>
  );
  return (
    <>
      <ColumnaColleccio
        titol={titol}
        primer="cataleg"
        linies={liniesVestides(comanda, idioma)}
        textosLinies={textosLiniesBar(idioma)}
        resum={{
          ...resumDeComanda(comanda, idioma),
          accio: { text: tx.cobra, desactivada: !ven || !t || t.pendentCents <= 0, onClick: () => ves(...punt.trams, ambTornada('cobrar', tornaTpv)) }
        }}
        onEdita={editable ? edita : undefined}
        onResta={editable ? resta : undefined}
        onSuma={editable ? suma : undefined}
        onLleva={editable ? lleva : undefined}
        peu={peu}
        textos={{ buit: tx.comandaBuidaTitol, buitText: tx.tiquetBuitText }}
        avis={<AvisDeLaColumna />}
      />
      <EditorLinia comanda={comanda} liniaId={ven ? consulta.linia : null} onTanca={() => posaConsulta({ linia: null })} />
      <DialegMou obert={ven && consulta.mou === '1' && ambLinies} comanda={comanda} idioma={idioma} onTanca={() => posaConsulta({ mou: null })} />
    </>
  );
}

function useTiquetsOberts(idioma) {
  const { comandes, sala } = useBar();
  return tiquetsOberts(comandes, sala, idioma);
}

export function TiquetsOberts({ params }) {
  const idioma = useIdiomaBar();
  const tx = textosUiBar(idioma);
  return (
    <Preparat titol={tx.tiquetsOberts} avis="estret">
      <TiquetsDelTorn params={params} ambActiu idioma={idioma} />
    </Preparat>
  );
}

export function TiquetsObertsSenseActiu() {
  const idioma = useIdiomaBar();
  const tx = textosUiBar(idioma);
  return (
    <Preparat titol={tx.tiquetsOberts} avis="estret">
      <TiquetsDelTorn params={null} ambActiu={false} idioma={idioma} />
    </Preparat>
  );
}

function TiquetsDelTorn({ params, ambActiu, idioma = 'ca' }) {
  const tx = textosUiBar(idioma);
  const bar = useBar();
  const { ruta, ves } = useVes();
  const targetes = useTiquetsOberts(idioma);
  const punt = usePunt(params || {});
  let actiu = null;
  if (ambActiu) actiu = punt.comanda?.id || (!params?.taula && !params?.comanda ? 'barra' : null);
  const nou = async () => {
    const r = await bar.accions.novaComanda({ tipus: 'barra' });
    if (r.ok) ves('caixa', r.valor.id);
  };
  return (
    <ColumnaColleccions
      titol={tx.tiquetsOberts}
      colleccions={targetes}
      actiu={actiu}
      hrefDe={(c) => (c.id === 'barra' ? ruta('caixa') : ruta('caixa', c.id))}
      onCrea={bar.permis.potEscriure ? nou : undefined}
      textCrea={tx.nouTiquetBarra}
      textComptador={textLiniesPerIdioma(idioma)}
      avis={<AvisDeLaColumna />}
    />
  );
}

export function EmportarInici() {
  const idioma = useIdiomaBar();
  const tx = textosUiBar(idioma);
  return (
    <Preparat titol={tx.perEmportar}>
      <EmportarNova idioma={idioma} />
    </Preparat>
  );
}

function EmportarNova({ idioma = 'ca' }) {
  const tx = textosUiBar(idioma);
  const { accions, permis } = useBar();
  const { ves } = useVes();
  const crea = async () => {
    const r = await accions.novaComanda({ tipus: 'emportar' });
    if (r.ok) ves('caixa', r.valor.id);
  };
  return (
    <Columna titol={tx.perEmportar}>
      <AvisOperacio />
      <EstatBuit icona={Plus} titol={tx.unaComandaEmportar} accio={<Boto varietat="primari" icona={Plus} disabled={!permis.potEscriure} onClick={crea}>{tx.novaComandaEmportar}</Boto>}>
        {tx.emportarText}
      </EstatBuit>
    </Columna>
  );
}
