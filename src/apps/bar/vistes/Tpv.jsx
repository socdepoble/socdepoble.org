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
 *   · LA DEMO (Gemini R32.26, IDEA-304; v1.2.17 · Gauntlet R1 (L3-15)):
 *     sense torn obert i sense sessió (motiu 'sense-sessio', mai 'comprovant'),
 *     l'avís de la sessió porta també «Prova el TPV en local (Demo)»: obri
 *     TpvDemoLocal.jsx, una caixa de prova en memòria amb la carta i el bar
 *     d'exemple (llavor.js), que no desa res i la nota de la qual diu que és
 *     de mostra i que no és factura. Amb un torn obert, o amb qualsevol altre
 *     motiu, l'avís i la pantalla són els de la v1.2.16.
 *     v1.2.17 · Gauntlet R2 (L3R2-05) · El focus no cau mai a <body> (WCAG
 *     2.4.3): en entrar, la Demo el porta a «Ix de la Demo»; en eixir, torna a
 *     «Prova el TPV en local (Demo)».
 *
 * Onada R32.5 · Internacionalització en les 5 llengües oficials (ca, es, en, eu, gl)
 * via useApp().idioma, preservant byte a byte el valencià per defecte.
 */
import { useEffect, useRef, useState } from 'react';
import { LockKeyhole } from 'lucide-react';
import { useNavigate } from '../../../app/contexts/RouterContext';
import { Alerta, Boto, EstatBuit, Fila, UniversalTPV } from '../../../components/PedraSeca/index.js';
import { esIdOpac, esSlug, useApp, useParametresConsulta, useSessioApp } from '../../plataforma/index.js';
import { resolModificadors } from '../nucli/cataleg.js';
import { useBar } from '../estat/ProveidorBar.jsx';
import { avisDeSessio } from '../estat/textos.js';
import { textosUiBar } from '../i18nBar.js';
import { DialegPreuObert } from './Caixa.jsx';
import { EditorLinia } from './EditorLinia.jsx';
import { AvisBase, AvisOperacio, AvisSessio, Columna, NoTrobat, Preparat } from './comu.jsx';
import { useFixaComanda, usePunt, useVes } from './punt.js';
import { TpvDemoLocal } from './TpvDemoLocal.jsx';
import {
  articlesDelTpv, categoriesVestides, descripcioTria, llegixOpcio, necessitaTria, nomOrigen, opcionsDetall,
  preuObertDeConsulta, textLinies, textosLiniesBar, tiquetDeComanda, tiquetsOberts, triaLaVariant
} from './vestits.js';

/* La consulta del TPV: només slugs, ids opacs i la bandera dels oberts. */
const PARAMETRES_TPV = Object.freeze({
  oberts: (valor) => valor === '1', tria: esSlug, preu: esSlug, variant: esSlug, linia: esIdOpac
});

const CAP_PREU = Object.freeze({ producte: null, variant: null });

/* El toc obri el diàleg menut quan la Caixa ho faria, o quan hi ha més d'una variant. */
const demanaTria = (producte, grups) => necessitaTria(producte, grups) || producte.variants.length > 1;

/* «TPV de La Parròquia», «TPV del meu bar»: «de» i l'article «el» es contrauen. */
function etiquetaDe(nom, idioma = 'ca') {
  if (idioma === 'en') return `${nom} POS`;
  if (idioma === 'eu') return `${nom} · TPV`;
  if (idioma === 'es') {
    if (/^El\s/.test(nom)) return `TPV del ${nom.slice(3)}`;
    return `TPV de ${nom}`;
  }
  if (idioma === 'gl') {
    if (/^O\s/.test(nom)) return `TPV do ${nom.slice(2)}`;
    return `TPV de ${nom}`;
  }
  if (/^El\s/.test(nom)) return `TPV del ${nom.slice(3)}`;
  if (/^Els\s/.test(nom)) return `TPV dels ${nom.slice(4)}`;
  return `TPV de ${nom}`;
}

/* v1.2.17 · Gauntlet R1 (L3-11) · L'avís sense torn i sense sessió: el d'AvisSessio («Entra») i, al costat, la Demo.
   v1.2.17 · Gauntlet R2 (L3R2-05) · `textDemo`, la ref de TpvBar per a tornar-hi el focus en eixir de la Demo:
   Boto no reenvia cap ref (React 18, sense forwardRef), i per això és del text i no del <button>. */
function AvisSessioAmbDemo({ idioma = 'ca', onObriDemo, textDemo = null }) {
  const { permis } = useBar();
  const tx = textosUiBar(idioma);
  const navigate = useNavigate();
  const avis = avisDeSessio(permis, idioma);
  if (!avis) return null;
  const accions = (
    <Fila justify="center">
      {avis.entra ? <Boto varietat="primari" onClick={() => navigate(permis.rutaEntrada)}>{tx.entra}</Boto> : null}
      <Boto onClick={onObriDemo}><span ref={textDemo}>{tx.provaTpvDemo}</span></Boto>
    </Fila>
  );
  return <Alerta to={avis.to} accions={accions}>{avis.text}</Alerta>;
}

export function TpvBar({ params }) {
  const { idioma = 'ca' } = useApp();
  const tx = textosUiBar(idioma);
  const bar = useBar();
  const [demoLocal, setDemoLocal] = useState(false);
  /* v1.2.17 · Gauntlet R2 (L3R2-05) · La marca de tornada: «Ix de la Demo» l'encén i el primer efecte de després
     la consumix, tant si l'avís de la Demo hi és com si no (una sessió que ha entrat entretant): mai no queda
     encesa per a robar el focus més avant. Amb l'avís, el focus torna a «Prova el TPV en local (Demo)». */
  const tornaDeLaDemo = useRef(false);
  const textDemo = useRef(null);
  useEffect(() => {
    if (demoLocal || !tornaDeLaDemo.current) return;
    tornaDeLaDemo.current = false;
    textDemo.current?.closest('button')?.focus();
  }, [demoLocal]);
  if (demoLocal) {
    return (
      <TpvDemoLocal
        idioma={idioma}
        onIx={() => {
          tornaDeLaDemo.current = true;
          setDemoLocal(false);
        }}
      />
    );
  }
  /* v1.2.17 · Gauntlet R1 (L3-11) · La Demo només s'oferix sense torn i sense sessió ('sense-sessio'):
     ni amb el torn obert ni mentre es comprova la sessió. La resta, el Preparat de la v1.2.16.
     v1.2.17 · Gauntlet R1 (L3-13) · «Obri el torn», primari i desactivat, com el del Preparat. */
  if (bar.carregat && !bar.tornActual && bar.permis.motiu === 'sense-sessio') {
    return (
      <Columna titol={tx.tpvTitol} avis={<AvisSessioAmbDemo idioma={idioma} onObriDemo={() => setDemoLocal(true)} textDemo={textDemo} />}>
        <EstatBuit
          icona={LockKeyhole}
          titol={tx.tornTancatTitol}
          accio={<Boto varietat="primari" disabled>{tx.obriTorn}</Boto>}
        >
          {tx.tornTancatText}
        </EstatBuit>
      </Columna>
    );
  }
  return (
    <Preparat titol={tx.tpvTitol} avis="propi">
      <TpvDelPunt params={params} idioma={idioma} />
    </Preparat>
  );
}

function TpvDelPunt({ params, idioma = 'ca' }) {
  const tx = textosUiBar(idioma);
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
  if (punt.perduda) return <NoTrobat text={tx.comandaTancada} torna={{ etiqueta: tx.vesAlTpv, trams: ['tpv'] }} />;

  const { carta, establiment, comandes, sala, accions } = bar;
  const { comanda } = punt;
  const perId = new Map(carta.productes.map((p) => [p.id, p]));
  const tiquet = tiquetDeComanda(comanda, idioma);
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

  /* El diàleg menut (?tria=<producte>): les variants i les opcions dels grups de modificadors, amb el preu final. */
  const perTriar = ven && consulta.tria ? perId.get(consulta.tria) || null : null;
  const triable = perTriar && perTriar.actiu !== false && demanaTria(perTriar, carta.grups) ? perTriar : null;
  const tria = {
    obert: Boolean(triable),
    titol: triable ? triable.nom : tx.tria,
    descripcio: triable ? descripcioTria(triable, carta.grups, idioma) : tx.triaVariant,
    opcions: triable ? opcionsDetall(triable, carta.grups, idioma).map((o) => ({ id: o.valor, nom: o.etiqueta, valor: o.ajuda })) : [],
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
  const llistaOberts = tiquetsOberts(comandes, sala, idioma);
  const nomTiquet = llistaOberts.find((t) => t.id === actiu)?.nom || nomOrigen(punt.origen, sala, idioma);
  const nou = async () => {
    const r = await accions.novaComanda({ tipus: 'barra' });
    if (r.ok) ves('tpv', r.valor.id);
  };
  const oberts = {
    obert: consulta.oberts === '1',
    titol: tx.tiquetsOberts,
    elements: llistaOberts.map((t) => ({
      id: t.id, nom: t.nom, detall: textLinies(t.comptador, idioma), ...(t.secundari ? { valor: t.secundari } : {}), actiu: t.id === actiu
    })),
    onTria: (element) => (element.id === 'barra' ? ves('tpv') : ves('tpv', element.id)),
    onTanca: (motiu) => {
      if (motiu !== 'tria') posaConsulta({ oberts: null });
    },
    ...(ven ? { nou: { text: tx.nouTiquetBarra, onClick: nou } } : {})
  };

  /* Una lectura fallida va primer: en mòbil el primer avís queda a la vista també en Productes. */
  const avisos = [];
  if (bar.errorCarrega) avisos.push(<AvisBase key="base" />);
  if (avisDeSessio(bar.permis, idioma)) avisos.push(<AvisSessio key="sessio" />);
  if (emportar) avisos.push(<span key="emportar">{tx.avisEmportar}</span>);
  if (bar.avis) avisos.push(<AvisOperacio key="operacio" />);
  if (!bar.errorCarrega && (bar.mode === 'lectora' || bar.persistent === false)) avisos.push(<AvisBase key="base" />);

  return (
    <>
      <UniversalTPV
        etiqueta={etiquetaDe(establiment.nom, idioma)}
        marca={sessio.marca || { nom: establiment.nom }}
        avis={avisos}
        tiquet={{
          titol: tx.tiquet,
          nom: nomTiquet,
          comptador: tiquet.unitats,
          linies: tiquet.linies,
          total: tiquet.total,
          resum: tiquet.resum,
          textosEstat: textosLiniesBar(idioma),
          buit: { titol: tx.tiquetBuitTitol, text: tx.tiquetBuitText },
          ...(ven && comanda ? { onEdita: (linia) => posaConsulta({ linia: linia.id }) } : {})
        }}
        accions={{
          secundaria: { text: tx.tiquetsOberts, comptador: comandes.length, onClick: () => posaConsulta({ oberts: '1' }) },
          principal: {
            text: tx.cobra,
            ...(tiquet.total ? { valor: tiquet.total.valor } : {}),
            desactivada: !ven || !comanda || tiquet.pendentCents <= 0,
            /* El cobrament de la Caixa, amb la tornada al TPV (Cobrament.jsx i Tiquets.jsx). */
            onClick: () => navigate(`${ruta('caixa', comanda.id, 'cobrar')}?torna=tpv`)
          }
        }}
        cataleg={{
          titol: tx.productes,
          categories: categoriesVestides(carta),
          articles: articlesDelTpv(carta, { comanda, establiment, idioma }),
          textosEstat: { 'en-colleccio': tx.aLaComanda },
          onTria: toca,
          desactivat: !ven,
          buit: emportar
            ? { titol: tx.capEmportarTitol, text: tx.capEmportarText }
            : { titol: tx.cartaBuidaTitol, text: tx.cartaBuidaText }
        }}
        oberts={oberts}
        tria={tria}
      />
      <DialegPreuObert key={`preu-${clauPreu.generacio}`} producte={preuObert} variant={variantPreu}
        idioma={idioma}
        onTanca={() => posaConsulta({ preu: null, variant: null })}
        onAfig={(preuCents) => {
          afig(preuObert, { preuCents, ...(variantPreu ? { varianteId: variantPreu.id } : {}) });
          posaConsulta({ preu: null, variant: null });
        }} />
      <EditorLinia comanda={comanda} liniaId={ven ? consulta.linia : null} onTanca={() => posaConsulta({ linia: null })} />
    </>
  );
}
