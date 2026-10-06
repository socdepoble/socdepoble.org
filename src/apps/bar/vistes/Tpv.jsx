/**
 * El Bar · vistes/Tpv.jsx — l'entrada «TPV» (/app/bar/tpv): el TPV Universal
 * de Pedra Seca (ordre del Mestre, 261006: prompt 261006_1215 i skill
 * sdp-clon-loiverse) amb les dades del Bar. Calca l'ESTRUCTURA de Loyverse,
 * no l'estil: el tiquet a l'esquerra, la graella a la dreta i, al peu del
 * tiquet, la barra partida «Tiquets oberts | Cobra». És una entrada nova
 * sobre el mateix estat (ProveidorBar): la Caixa no canvia ni un píxel (Llei
 * del Píxel).
 *
 *   /app/bar/tpv              la comanda de barra més recent (o una de nova)
 *   /app/bar/tpv/<comanda>    una comanda oberta qualsevol, pel seu id
 * Àrea única (rutesBar.js, Unica): cap columna de l'esquelet. Composició
 * prima: les dades vestides (vestits.js) i els gestos cap a l'estat.
 *
 *   · EL TOC, com a Loyverse: preu obert → el teclat (DialegPreuObert, el de
 *     la Caixa); un grup obligatori o MÉS D'UNA VARIANT → el diàleg «tria» de
 *     la peça (un toc tria i tanca); si no, l'única variant. Ací no hi ha
 *     pulsació llarga: sense el diàleg, una variant que no és la primera no
 *     es podria vendre. La Caixa no canvia (la variant per defecte i el
 *     detall amb la pulsació llarga). La comanda nova passa al camí (/tpv/<id>).
 *   · EL TIQUET diu quin és (el nom de Tiquets oberts: «Barra · 08:30»,
 *     «Taula 3», «Per emportar · 09:10»), com el títol de la comanda a la
 *     Caixa: dues comandes obertes no es confonen.
 *   · «COBRA» porta al cobrament de la Caixa amb la tornada al TPV
 *     (/caixa/<comanda>/cobrar?torna=tpv): el TPV encara no en té cap de
 *     propi, i el cobrament és un de sol. En acabar, Cobrament.jsx conserva
 *     la tornada fins a la nota del client (/tiquets/<id>?nota=1&torna=tpv), i
 *     en tancar-la (Tiquets.jsx) es torna a /app/bar/tpv. Sense ?torna, la
 *     Caixa fa el de sempre.
 *   · Els diàlegs van a la consulta (Clàusula dels Slugs, BAR-R7): ?oberts=1,
 *     ?tria=<producte>, ?preu=<producte>[&variant=<variant>] i ?linia=<id>.
 *     Un toc als diàlegs de la peça tria i després tanca amb el motiu 'tria':
 *     eixe tancament ja l'ha fet la tria (amb una sola escriptura de la
 *     consulta), i no se'n fa cap altra que la xafaria.
 *   · PER EMPORTAR: una comanda d'origen 'emportar' només veu els productes
 *     del canal (cartaDelCanal) i l'avís ho diu.
 *   · SESSIÓ: el permís és el de TOT el Bar (ordre del Mestre, 261006): el
 *     de l'estat (ProveidorBar, `permis`), que llig el pont de només lectura
 *     de la plataforma (useSessioApp). Sense permis.potEscriure el TPV ensenya
 *     la carta però no ven (rajoles, «Cobra» i línies desactivades). Mirar sí
 *     que es pot: la llista dels tiquets oberts s'obri i porta a cada tiquet,
 *     però sense «Nou tiquet de barra», com la Caixa. L'avís
 *     de la sessió (AvisSessio, el mateix de la resta del Bar) diu per què i,
 *     sense sessió, porta a entrar. En mode de proves i sense xarxa amb la
 *     sessió desada, ven i l'avís ho diu. Amb sessió, la capçalera del tiquet
 *     porta la marca de l'organització (useSessioApp().marca). El TPV no veu
 *     mai el testimoni ni l'usuari.
 *   · ELS AVISOS van en una llista per ordre d'importància (sessió, per
 *     emportar, l'última operació i la base): en el mòbil la peça només posa
 *     el primer fora de les pestanyes. Un avís que no té res a dir no hi entra.
 */
import { useState } from 'react';
import { useNavigate } from '../../../app/contexts/RouterContext';
import { UniversalTPV } from '../../../components/PedraSeca/index.js';
import { esIdOpac, esSlug, useParametresConsulta, useSessioApp } from '../../plataforma/index.js';
import { grupsDe, resolModificadors } from '../nucli/cataleg.js';
import { useBar } from '../estat/ProveidorBar.jsx';
import { avisDeSessio } from '../estat/textos.js';
import { DialegPreuObert } from './Caixa.jsx';
import { EditorLinia } from './EditorLinia.jsx';
import { AvisBase, AvisOperacio, AvisSessio, NoTrobat, Preparat } from './comu.jsx';
import { useFixaComanda, usePunt, useVes } from './punt.js';
import {
  TEXTOS_LINIES_BAR, articlesDelTpv, categoriesVestides, llegixOpcio, necessitaTria, nomOrigen, opcionsDetall, preuObertDeConsulta,
  textLinies, tiquetDeComanda, tiquetsOberts, triaLaVariant
} from './vestits.js';

/* La consulta del TPV: només slugs, ids opacs i la bandera dels oberts. */
const PARAMETRES_TPV = Object.freeze({
  oberts: (valor) => valor === '1', tria: esSlug, preu: esSlug, variant: esSlug, linia: esIdOpac
});

const CAP_PREU = Object.freeze({ producte: null, variant: null });

/* El toc obri el diàleg menut quan la Caixa ho faria, o quan hi ha més d'una variant. */
const demanaTria = (producte, grups) => necessitaTria(producte, grups) || producte.variants.length > 1;

/* «TPV de La Parròquia», «TPV del meu bar»: «de» i l'article «el» es contrauen. */
function etiquetaDe(nom) {
  if (/^El\s/.test(nom)) return `TPV del ${nom.slice(3)}`;
  if (/^Els\s/.test(nom)) return `TPV dels ${nom.slice(4)}`;
  return `TPV de ${nom}`;
}

export function TpvBar({ params }) {
  return (
    <Preparat titol="TPV" avis="propi">
      <TpvDelPunt params={params} />
    </Preparat>
  );
}

function TpvDelPunt({ params }) {
  const bar = useBar();
  const sessio = useSessioApp();
  const navigate = useNavigate();
  const { ruta, ves } = useVes();
  const punt = usePunt(params, 'tpv');
  const fixaComanda = useFixaComanda('tpv');
  const [consulta, posaConsulta] = useParametresConsulta(PARAMETRES_TPV);
  /* El permís de tot el Bar (l'estat, ProveidorBar): el mateix que la Caixa. */
  const ven = bar.permis.potEscriure;
  /* El preu obert de la consulta, com a la Caixa (preuObertDeConsulta). */
  const { producte: preuObert, variant: variantPreu } = ven ? preuObertDeConsulta(bar.carta, consulta) : CAP_PREU;
  /* La clau del teclat del preu canvia en OBRIR-lo (un teclat nou, a zero) i no
     en tancar-lo: la mateixa instància passa a obert=false i el Dialeg torna el
     focus a la rajola. Una clau que canviara en tancar desmuntaria el <dialog>
     obert i el focus cauria a <body>. */
  const idPreu = preuObert ? [preuObert.id, variantPreu?.id].filter(Boolean).join('~') : null;
  const [clauPreu, setClauPreu] = useState({ id: null, generacio: 0 });
  if (idPreu !== clauPreu.id) setClauPreu({ id: idPreu, generacio: idPreu ? clauPreu.generacio + 1 : clauPreu.generacio });
  if (punt.perduda) return <NoTrobat text="Esta comanda ja no està oberta." torna={{ etiqueta: 'Ves al TPV', trams: ['tpv'] }} />;

  const { carta, establiment, comandes, sala, accions } = bar;
  const { comanda } = punt;
  const perId = new Map(carta.productes.map((p) => [p.id, p]));
  const tiquet = tiquetDeComanda(comanda);
  const emportar = comanda?.origen?.tipus === 'emportar';

  /* A /tpv, la comanda que rep el primer producte passa al camí (BAR-R7). */
  const afig = async (producte, extra = {}) => {
    const r = await accions.afegeix({ comandaId: comanda?.id || null, origen: punt.origen }, { producte, ...extra });
    if (r.ok) fixaComanda(r.valor);
    return r;
  };
  const toca = (article) => {
    const producte = perId.get(article.id);
    if (!ven || !producte) return;
    if (producte.preuObert && !triaLaVariant(producte)) posaConsulta({ preu: producte.id });
    else if (demanaTria(producte, carta.grups)) posaConsulta({ tria: producte.id });
    else afig(producte);
  };

  /* El diàleg menut (?tria=<producte>): les variants i les opcions del primer grup, amb el preu final. */
  const perTriar = ven && consulta.tria ? perId.get(consulta.tria) || null : null;
  const triable = perTriar && perTriar.actiu !== false && demanaTria(perTriar, carta.grups) ? perTriar : null;
  const [grup] = triable ? grupsDe(triable, carta.grups) : [];
  const tria = {
    obert: Boolean(triable),
    titol: triable ? triable.nom : 'Tria',
    descripcio: grup ? `Tria una opció de «${grup.nom}».` : 'Tria la variant.',
    opcions: triable ? opcionsDetall(triable, carta.grups).map((o) => ({ id: o.valor, nom: o.etiqueta, valor: o.ajuda })) : [],
    onTria: (opcio) => {
      const { varianteId, opcions } = llegixOpcio(opcio.id);
      /* Preu obert amb variants: la variant ja és triada, ara el teclat. */
      if (triable.preuObert) {
        posaConsulta({ tria: null, preu: triable.id, variant: triaLaVariant(triable) ? varianteId || null : null });
        return;
      }
      posaConsulta({ tria: null });
      afig(triable, { varianteId, modificadors: resolModificadors(triable, carta.grups, opcions) });
    },
    onTanca: (motiu) => {
      if (motiu !== 'tria') posaConsulta({ tria: null });
    }
  };

  /* Els tiquets oberts (?oberts=1): la barra, les taules i per emportar. El
     nom de l'actiu va també al títol del tiquet. Mirar-los és lectura: sense
     permís la llista s'obri igual, i només falta «Nou tiquet de barra». */
  const actiu = comanda?.id || (params?.comanda ? null : 'barra');
  const llistaOberts = tiquetsOberts(comandes, sala);
  const nomTiquet = llistaOberts.find((t) => t.id === actiu)?.nom || nomOrigen(punt.origen, sala);
  const nou = async () => {
    const r = await accions.novaComanda({ tipus: 'barra' });
    if (r.ok) ves('tpv', r.valor.id);
  };
  const oberts = {
    obert: consulta.oberts === '1',
    titol: 'Tiquets oberts',
    elements: llistaOberts.map((t) => ({
      id: t.id, nom: t.nom, detall: textLinies(t.comptador), ...(t.secundari ? { valor: t.secundari } : {}), actiu: t.id === actiu
    })),
    onTria: (element) => (element.id === 'barra' ? ves('tpv') : ves('tpv', element.id)),
    onTanca: (motiu) => {
      if (motiu !== 'tria') posaConsulta({ oberts: null });
    },
    ...(ven ? { nou: { text: 'Nou tiquet de barra', onClick: nou } } : {})
  };

  /* L'avís damunt del tiquet, per ordre d'importància: la sessió, per emportar, l'última operació i la base. */
  const avisos = [];
  if (avisDeSessio(bar.permis)) avisos.push(<AvisSessio key="sessio" />);
  if (emportar) avisos.push(<span key="emportar">Per emportar: només la carta per a casa.</span>);
  if (bar.avis) avisos.push(<AvisOperacio key="operacio" />);
  if (bar.mode === 'lectora' || bar.persistent === false) avisos.push(<AvisBase key="base" />);

  return (
    <>
      <UniversalTPV
        etiqueta={etiquetaDe(establiment.nom)}
        marca={sessio.marca || { nom: establiment.nom }}
        avis={avisos}
        tiquet={{
          titol: 'Tiquet',
          nom: nomTiquet,
          comptador: tiquet.unitats,
          linies: tiquet.linies,
          total: tiquet.total,
          resum: tiquet.resum,
          textosEstat: TEXTOS_LINIES_BAR,
          buit: { titol: 'El tiquet és buit', text: 'Toca un producte per a afegir-lo.' },
          ...(ven && comanda ? { onEdita: (linia) => posaConsulta({ linia: linia.id }) } : {})
        }}
        accions={{
          secundaria: { text: 'Tiquets oberts', comptador: comandes.length, onClick: () => posaConsulta({ oberts: '1' }) },
          principal: {
            text: 'Cobra',
            ...(tiquet.total ? { valor: tiquet.total.valor } : {}),
            desactivada: !ven || !comanda || tiquet.pendentCents <= 0,
            /* El cobrament de la Caixa, amb la tornada al TPV (Cobrament.jsx i Tiquets.jsx). */
            onClick: () => navigate(`${ruta('caixa', comanda.id, 'cobrar')}?torna=tpv`)
          }
        }}
        cataleg={{
          titol: 'Productes',
          categories: categoriesVestides(carta),
          articles: articlesDelTpv(carta, { comanda, establiment }),
          textosEstat: { 'en-colleccio': 'A la comanda' },
          onTria: toca,
          desactivat: !ven,
          buit: emportar
            ? { titol: 'Cap producte per emportar', text: 'Marca «Per emportar» a la fitxa del producte.' }
            : { titol: 'La carta és buida', text: 'Afig productes a la carta.' }
        }}
        oberts={oberts}
        tria={tria}
      />
      <DialegPreuObert key={`preu-${clauPreu.generacio}`} producte={preuObert} variant={variantPreu}
        onTanca={() => posaConsulta({ preu: null, variant: null })}
        onAfig={(preuCents) => {
          afig(preuObert, { preuCents, ...(variantPreu ? { varianteId: variantPreu.id } : {}) });
          posaConsulta({ preu: null, variant: null });
        }} />
      <EditorLinia comanda={comanda} liniaId={ven ? consulta.linia : null} onTanca={() => posaConsulta({ linia: null })} />
    </>
  );
}
