/**
 * La Nevera de Casa · TEMPORADA: la llista de la compra creuada amb el
 * calendari agrícola (decisió 1 del Mestre, 261003). Una vista combinada de
 * dues columnes, sense cap classe pròpia:
 *   ColumnaLlistaPerTemporada  el mig, amb el marc de l'esquelet (MarcColumna +
 *                              AppGridColumn) i peces de Pedra Seca: les línies
 *                              de la llista agrupades per l'estat de temporada
 *                              del mes (Plena, Comença, S'acaba, Fora, Sense
 *                              dada). NavegacioPeriode mou el mes i filtra
 *                              («Tot» o «De temporada»). Un toc ho marca com a
 *                              comprat, com a La compra: ix i passa a «Recents»
 *                              amb la seua especificació
 *   ColumnaDeTemporada         el detall, amb ColumnaCataleg de l'esquelet: «De
 *                              temporada a l'octubre», amb les tres seccions de
 *                              temporada del mig. Un toc ho posa a la llista o
 *                              ho lleva; si encara no és cap article, el crea
 *                              com a propi (afigPerNom, com «Necessite…»)
 * L'estat de vista va a la URL i es valida: ?mes=1..12 (sense, el mes d'ara,
 * que es calcula ací i mai al nucli; el mes d'ara no s'escriu) i
 * ?filtre=temporada. En pantalla estreta es veu una sola columna:
 * /temporada/<id> ↔ /temporada/<id>/cataleg (push).
 * La graella del mig va a soles (l'única excepció de qualitat.test.js, pendent
 * del vistiplau del Mestre): cap columna de l'esquelet té lloc a les eines per
 * al mes i el filtre.
 * Ordre del Mestre, 261004 (prompt 261004_0515, «no inventar targetes») · Eixa
 * graella ja no és de rajoles: GraellaTargetes amb una UniversalCard per
 * línia, com les targetes de l'esquelet (forma="targetes", TargetesArticles):
 * el nom (h4, dins de la secció), l'especificació, la icona de la secció al
 * quadrat, «Per comprar» en etiqueta, aria-pressed, data-element i el peu per
 * defecte sense Compartir ni telemetria. El detall és ColumnaCataleg amb
 * forma="targetes".
 * REGLA D'OR 1 (ordre del Mestre, 261004) · Les dues graelles porten la boina
 * taronja amb qui signa cada article (autoria.js): el projecte o, per a un
 * article propi, «Tu».
 *
 * SEPARAR-LA, i què cal tocar de veres:
 *   (a) El filtre ja hi és.
 *   (b) En pestanyes: una sola columna amb Pestanyes de Pedra Seca que munte
 *       les dues graelles; el botó d'estret del mig i el resum del detall
 *       sobren.
 *   (c) En dues entrades: una entrada més al manifest; una constant més i
 *       ENTRADES_AMB_LLISTA a constants.js; les rutes i els títols a rutes.js,
 *       cada entrada amb el seu mig i el seu detall. El botó d'estret del mig i
 *       el resum del detall van lligats al tram d'esta entrada
 *       (useVistesEsquelet(TEMPORADA)) i s'han de refer.
 *   (d) A la secció Calendari: abans cal traure a src/utils/temporada la part
 *       de perTemporada.js que no sap res de la Nevera (el mes i el calendari).
 *       Esta columna llig la llista i les accions del context de la Nevera.
 */
import { CalendarDays, CalendarX, CircleDashed, Sun, Sunrise, Sunset } from 'lucide-react';
import AppGridColumn from '../../../components/layout/AppGridColumn.jsx';
import { encapcalamentDeTargeta, EstatBuit, GraellaTargetes, MarcColumna, NavegacioPeriode, UniversalCard } from '../../../components/PedraSeca/index.js';
import { ColumnaCataleg, useVistesEsquelet } from '../../comu/esquelet/index.js';
import { useClosaAplicacio, useParametresConsulta } from '../../plataforma/index.js';
import { textosBuitNevera, textosVistaNevera } from '../i18nNevera.js';
import { nomLlistaVisible } from '../mercadona.js';
import { articlePerId } from '../nucli/index.js';
import { AvisNevera } from './AvisNevera.jsx';
import { autoriaDArticle } from './autoria.js';
import { TEMPORADA } from './constants.js';
import { useVistaNevera } from './context.js';
import { entradetaDe, subtitolDe } from './vestits.js';
import {
  esParametreMes, grupsDeTemporada, liniesPerTemporada, mesVei, nomDelMes, seccionsDeTemporada,
  suggerimentsDeTemporada, titolDeTemporada
} from './perTemporada.js';

const FILTRE_TEMPORADA = 'temporada';
const PARAMETRES = Object.freeze({ mes: esParametreMes, filtre: (valor) => valor === FILTRE_TEMPORADA });

/* Cap color per secció: la icona i el nom la distingixen (l'estat es diu sempre amb text). */
const ICONES = Object.freeze({ plena: Sun, inici: Sunrise, final: Sunset, fora: CalendarX, 'sense-dada': CircleDashed });
const ambIcona = (seccio) => ({ ...seccio, icona: ICONES[seccio.id] });
/* Les apps no entren a la telemetria (frontera.test.js): el Connectar del peu no compta. */
const SENSE_TELEMETRIA = Object.freeze({ comptar: false });

/* El quadrat d'una línia: la icona de la seua secció de temporada (48 px, com a l'espècimen). */
function QuadratDeTemporada({ grup }) {
  const Icona = ICONES[grup] || CircleDashed;
  return <Icona size={48} strokeWidth={1.5} aria-hidden="true" focusable="false" />;
}

/* El mes d'ara (1–12), del rellotge del dispositiu: només la vista el llig. */
const mesDAra = () => new Date().getMonth() + 1;

/**
 * La vista de la URL: { mes, filtre, nomesDeTemporada } i les accions que
 * l'escriuen (push). El mes d'ara no s'escriu: cada vista té una sola URL.
 * Tornar a triar el que ja es veu no navega.
 */
function useVistaTemporada() {
  const [valors, posa] = useParametresConsulta(PARAMETRES);
  const ara = mesDAra();
  const mes = valors.mes === null ? ara : Number(valors.mes);
  const filtre = valors.filtre === null ? 'tot' : valors.filtre;
  const vesAlMes = (desti) => posa({ mes: desti === ara ? null : desti });
  return {
    mes,
    filtre,
    nomesDeTemporada: filtre === FILTRE_TEMPORADA,
    anterior: () => vesAlMes(mesVei(mes, -1)),
    seguent: () => vesAlMes(mesVei(mes, 1)),
    esteMes: () => (mes === ara ? false : vesAlMes(ara)),
    triaFiltre: (nou) => (nou === filtre ? false : posa({ filtre: nou === FILTRE_TEMPORADA ? nou : null }))
  };
}

/* El botó de la capçalera que porta a l'altra columna, només en pantalla estreta. */
function useAccioEstreta(accio) {
  const { mida } = useClosaAplicacio();
  return mida === 'estret' ? [accio] : [];
}

/** «La llista per temporada»: el mig de l'entrada Temporada. */
export function ColumnaLlistaPerTemporada({ params }) {
  const { estat, accions, llistaVigent } = useVistaNevera();
  const { idioma } = useClosaAplicacio();
  const txBuit = textosBuitNevera(idioma);
  const tx = textosVistaNevera(idioma);
  const vista = useVistaTemporada();
  const vistes = useVistesEsquelet(TEMPORADA);
  const llista = llistaVigent(params);
  /* v1.2.19 · Gauntlet R1 (L3-02) · El nom de la llista, pintat en la llengua de la interfície (la de botiga es desa amb el nom canònic). */
  const nomLlista = nomLlistaVisible(llista.nom, idioma);
  const titol = tx.perTemporadaTitol(nomLlista);
  const filtres = [
    { valor: 'tot', text: tx.filtreTot },
    { valor: FILTRE_TEMPORADA, text: tx.filtreDeTemporada }
  ];
  const textosMig = { 'en-colleccio': tx.perComprar };
  const startActions = useAccioEstreta({
    id: 'de-temporada', icona: CalendarDays, etiqueta: titolDeTemporada(vista.mes, idioma), onAcciona: vistes.cataleg.vesA
  });
  const articles = liniesPerTemporada(estat, llista.id, vista.mes);
  const grups = grupsDeTemporada(vista.nomesDeTemporada, idioma).map(ambIcona);
  const nomDelGrup = new Map(grups.map((grup) => [grup.id, grup.nom]));
  const buit = articles.length === 0
    ? <EstatBuit titol={txBuit.temporadaLlistaBuida}>{txBuit.temporadaLlistaBuidaText}</EstatBuit>
    : <EstatBuit titol={txBuit.temporadaResALaLlista}>{txBuit.temporadaResALaLlistaText}</EstatBuit>;
  return (
    <MarcColumna
      capcalera={<AppGridColumn titol={titol} startActions={startActions} />}
      eines={(
        <NavegacioPeriode titol={nomDelMes(vista.mes, idioma)} etiquetes={tx.etiquetesMes}
          onAnterior={vista.anterior} onHui={vista.esteMes} onSeguent={vista.seguent}
          vista={vista.filtre} onCanviaVista={vista.triaFiltre} vistes={filtres} etiquetaVistes={tx.filtreLabel} />
      )}
      peu={<AvisNevera />}
      etiqueta={titol}
    >
      <GraellaTargetes elements={articles} categories={grups} etiqueta={titol} buit={buit}>
        {(article) => {
          /* REGLA D'OR 1 (261004) · La boina: qui signa l'article de la línia (autoria.js).
             autoriaDe pot tornar null (una identitat que la plataforma no coneix): la
             targeta es queda sense boina, com a l'esquelet, i la columna no peta. */
          const delCataleg = articlePerId(estat, article.id);
          const boina = autoriaDArticle(delCataleg) || {};
          const dataReal = delCataleg?.date ?? delCataleg?.data ?? delCataleg?.dataCaducitat ?? delCataleg?.caducitat;
          const creatReal = delCataleg?.created_at ?? delCataleg?.createdAt;
          return (
            <UniversalCard
              key={article.id}
              headingLevel="h4"
              {...encapcalamentDeTargeta(
                { ...delCataleg, date: dataReal, created_at: creatReal },
                { author: boina.nom, location: boina.poble, idioma }
              )}
              showDateTime={Boolean(dataReal || creatReal)}
              authorHref={boina.href || undefined}
              avatarUrl={boina.avatar || undefined}
              title={article.nom}
              /* Integració final (261004, F04) · Subtítol i entradeta reals, com a l'esquelet
                 (vestits.js): la secció de l'article i, sense especificació, d'on ix. */
              subtitle={subtitolDe(delCataleg, idioma)}
              body={article.secundari || entradetaDe(delCataleg, idioma)}
              squareBadge={{ type: 'custom', label: nomDelGrup.get(article.categoriaId) || article.nom, content: <QuadratDeTemporada grup={article.categoriaId} /> }}
              /* v1.2.26 · «Per comprar» és un estat, no taxonomia (D3 de l'integrador sobre IDEA-365,
                 Llibre Mestre, línia 3825): píndola inerta, sense enllaç. */
              labels={textosMig[article.estat] ? [{ text: textosMig[article.estat], inerta: true }] : []}
              onMainClick={() => accions.marcaComprat(llista.id, article.id)}
              premuda={article.estat === 'en-colleccio'}
              idElement={article.id}
              hasFooter
              showShare={false}
              telemetria={SENSE_TELEMETRIA}
            />
          );
        }}
      </GraellaTargetes>
    </MarcColumna>
  );
}

/** «De temporada a l'octubre»: el detall de l'entrada Temporada. En estret, el resum del peu torna a la llista. */
export function ColumnaDeTemporada({ params }) {
  const { estat, accions, llistaVigent } = useVistaNevera();
  const { idioma } = useClosaAplicacio();
  const txBuit = textosBuitNevera(idioma);
  const tx = textosVistaNevera(idioma);
  const { mes } = useVistaTemporada();
  const llista = llistaVigent(params);
  /* v1.2.19 · Gauntlet R1 (L3-02) · El nom de la llista, pintat en la llengua de la interfície (la de botiga es desa amb el nom canònic). */
  const nomLlista = nomLlistaVisible(llista.nom, idioma);
  /* REGLA D'OR 1 (261004) · La boina de cada suggeriment: l'article de la Nevera que hi
     correspon o, si encara no n'és cap, el calendari de temporada del projecte (autoria.js). */
  const suggeriments = suggerimentsDeTemporada(estat, llista.id, mes).map((suggeriment) => {
    const delCataleg = articlePerId(estat, suggeriment.id);
    return {
      ...suggeriment,
      autoria: autoriaDArticle(delCataleg),
      /* Integració final (261004, F04) · Subtítol i entradeta reals: la secció i d'on ix l'article
         o, si encara no n'és cap, que és un suggeriment del calendari de temporada. */
      subtitol: subtitolDe(delCataleg, idioma),
      entradeta: delCataleg ? entradetaDe(delCataleg, idioma) : tx.suggerimentTemporada
    };
  });
  return (
    <ColumnaCataleg
      forma="targetes"
      ometDataNoIndicada
      titol={titolDeTemporada(mes, idioma)}
      categories={seccionsDeTemporada(idioma).map(ambIcona)}
      articles={suggeriments}
      selector={false}
      ambVistes={false}
      commutable
      textosEstat={{ 'en-colleccio': tx.aLaLlista }}
      onTria={(suggeriment) => (suggeriment.articleId
        ? accions.commuta(llista.id, suggeriment.articleId)
        : accions.afigPerNom(llista.id, suggeriment.nom))}
      resum={{ etiqueta: nomLlista, comptador: llista.linies.length, textComptador: (n) => tx.textArticlesCount(n) }}
      primer={TEMPORADA.primer}
      tram={TEMPORADA.tram}
      textos={{ buit: txBuit.temporadaDetallBuit, buitText: null }}
    />
  );
}
