/**
 * SeccioVertical.jsx · IDEA-61 (T0, prompt 261102_1532) · Les tres seccions
 * verticals del Flux Universal de Publicació: Compartir cotxe (/vehicle),
 * Treball (/treball) i Habitatge (/habitatge). Un sol component amb l'àmbit
 * com a prop; cada ruta d'App.jsx el munta amb el seu (identitat pròpia per
 * al tractor de rutes, W7).
 *
 * El PATRÓ és MercatSection: la mateixa UniversalPage, el mateix estat
 * d'error (EstatErrorDades) i el mateix «Mostra més». Les dades són les
 * publicacions del Mur (sortedFeedPosts de useMur: cap migració, una fitxa
 * vertical viu a la secció 'mur' amb `ambit`, `estat` i `dades` al payload)
 * filtrades amb perAmbit i esVisibleALaLlista del contracte
 * (utils/publicacioUniversal.js): una fitxa 'tancada' no ix a la llista. La
 * targeta és TargetaDelMur, la mateixa del Mur. El botó «+ Publicar» és
 * l'acció principal de la pàgina (la ranura accioPrincipal de PageFrame, la
 * mateixa peça que /page/publicar_mur: PortaDePagina) i porta a l'editor amb
 * l'àmbit fixat (/notes?ambit=<ambit>). Model B: cap adaptador; les dades
 * arriben pel proveïdor del Mur.
 */
import { useCallback, useEffect, useMemo, useState } from 'react';
import { UniversalPage } from '../../components/universal/UniversalPage';
import { ContentProvider } from '../../components/universal/ContentProvider';
import { useSEO } from '../../hooks/useSEO';
import { useMur } from '../mur/MurContext';
import { useUIActions } from '../../app/contexts/UIContext';
import { Carregant, Boto } from '../../components/PedraSeca/index.js';
import { PortaDePagina } from '../../components/PedraSeca/organismes/PortesTargeta.jsx';
import { EstatErrorDades } from '../mur/EstatErrorDades.jsx';
import { TargetaDelMur } from '../mur/TargetaDelMur.jsx';
import { totsPublics } from '../../components/universal/traduccio/visibilitatTraduible.js';
import { esVisibleALaLlista, perAmbit } from '../../utils/publicacioUniversal.js';

/** Els cinc àmbits amb secció vertical pròpia (sections.js: mapa, vehicle, animalets, treball, habitatge). */
export const AMBITS_VERTICALS = Object.freeze(['mapa', 'vehicle', 'animalets', 'treball', 'habitatge']);

/** On porta «+ Publicar»: l'editor del Bloc amb l'àmbit fixat. */
export const rutaDePublicar = (ambit) => `/notes?ambit=${ambit}`;

/* Els textos de cada vertical, en parells [clau, reserva]: la reserva és el
   valor de ca.js, caràcter a caràcter (SeccioVertical.test.jsx ho compara
   amb ca.js per a tots els parells; G3-regressio-01: Mapa i Animalets en
   portaven 7 de diferents).
   G3-pedra-seca-i18n-15 · /mapa és una llista de targetes, no cap mapa:
   l'entradilla diu el que s'hi publica (les modalitats del contracte: punt
   d'interès, camí o ruta, patrimoni i incidència al terme) amb la clau
   section.mapa.lead. section.mapa.subtitle («Vista geogràfica del
   projecte…») queda per al connector del Mapa, que la fa servir encara. */
export const TEXTOS_VERTICALS = Object.freeze({
  mapa: Object.freeze({
    kicker: ['section.mapa.kicker', 'Mapa'],
    title: ['section.mapa.title', 'Mapa del territori'],
    subtitle: ['section.mapa.lead', 'Punts d’interès, camins, patrimoni i incidències del terme que publica la gent del poble.'],
    buit: ['section.mapa.buit', 'Encara no hi ha cap punt del mapa publicat en este poble.'],
    error: ['section.mapa.error', 'No s’ha pogut carregar el Mapa'],
    carregant: ['section.mapa.carregant', 'Carregant els punts del mapa…'],
    publicar: ['section.mapa.publicar', 'Publicar un punt al mapa']
  }),
  vehicle: Object.freeze({
    kicker: ['section.vehicle.kicker', 'Compartir cotxe'],
    title: ['section.vehicle.title', 'Viatges per compartir'],
    subtitle: ['section.vehicle.subtitle', 'Oferix o busca lloc al cotxe per a anar i tornar del poble.'],
    buit: ['section.vehicle.buit', 'Encara no hi ha cap viatge publicat en este poble.'],
    error: ['section.vehicle.error', 'No s’ha pogut carregar Compartir cotxe'],
    carregant: ['section.vehicle.carregant', 'Carregant els viatges…'],
    publicar: ['section.vehicle.publicar', 'Publicar un viatge']
  }),
  animalets: Object.freeze({
    kicker: ['section.animalets.kicker', 'Animalets'],
    title: ['section.animalets.title', 'Animals del poble'],
    subtitle: ['section.animalets.subtitle', 'Adopció, animals perduts, trobats i cura comunitària al poble.'],
    buit: ['section.animalets.buit', 'Encara no hi ha cap fitxa d’animalets publicada en este poble.'],
    error: ['section.animalets.error', 'No s’ha pogut carregar Animalets'],
    carregant: ['section.animalets.carregant', 'Carregant les fitxes d’animalets…'],
    publicar: ['section.animalets.publicar', 'Publicar una fitxa d’animalets']
  }),
  treball: Object.freeze({
    kicker: ['section.treball.kicker', 'Treball'],
    title: ['section.treball.title', 'Feina i oficis'],
    subtitle: ['section.treball.subtitle', 'Ofertes de feina, oficis i jornals del poble.'],
    buit: ['section.treball.buit', 'Encara no hi ha cap oferta publicada en este poble.'],
    error: ['section.treball.error', 'No s’ha pogut carregar Treball'],
    carregant: ['section.treball.carregant', 'Carregant les ofertes…'],
    publicar: ['section.treball.publicar', 'Publicar una oferta']
  }),
  habitatge: Object.freeze({
    kicker: ['section.habitatge.kicker', 'Habitatge'],
    title: ['section.habitatge.title', 'Pisos i cases de poble'],
    subtitle: ['section.habitatge.subtitle', 'Lloguer, venda i cases per a compartir al poble.'],
    buit: ['section.habitatge.buit', 'Encara no hi ha cap habitatge publicat en este poble.'],
    error: ['section.habitatge.error', 'No s’ha pogut carregar Habitatge'],
    carregant: ['section.habitatge.carregant', 'Carregant els habitatges…'],
    publicar: ['section.habitatge.publicar', 'Publicar un habitatge']
  })
});

/* Decisió 4 del Mestre (261007) · «Carregar-ne més»: les verticals paginen la
   secció 'mur', que és on viuen. Un useMur sense paginació no en porta.
   O2-T4 · Paginació filtrada per àmbit: si una pàgina del Mur general només
   porta publicacions d'altres àmbits (o fitxes tancades) i hiHaMes('mur')
   continua sent cert, s'avancen pàgines (fins a MAX_SALTS_PAGINA) fins a
   trobar almenys una fitxa visible de l'àmbit o esgotar el Mur, evitant
   pàgines buides al veí tant en l'entrada com en prémer «Mostra més». */
const SECCIO_DE_LES_DADES = 'mur';
const SENSE_MES = () => false;
const SENSE_ERROR = () => null;
const SENSE_CARREGA = async () => false;
const MAX_SALTS_PAGINA = 10;
const empremtaDeLaLlista = (llista, ambit) => `${ambit}:${llista.length}:${llista[0]?.id ?? ''}:${llista.at(-1)?.id ?? ''}`;
const ESTAT_INICIAL_CERCA = Object.freeze({ ambit: null, minItems: 1, salts: 0, ultimaEmpremta: '' });

export default function SeccioVertical({ ambit }) {
  const {
    sortedFeedPosts = [], status, error, refresh,
    carregaMes = SENSE_CARREGA, hiHaMes = SENSE_MES, carregantMes = SENSE_MES, errorMes = SENSE_ERROR
  } = useMur();
  const { t } = useUIActions();
  const textos = Object.hasOwn(TEXTOS_VERTICALS, ambit) ? TEXTOS_VERTICALS[ambit] : null;
  const tr = (parell) => (parell ? t(parell[0], parell[1]) : '');
  /* Només les fitxes d'este àmbit que es poden llistar (mai una 'tancada'). */
  const items = useMemo(() => perAmbit(sortedFeedPosts, ambit).filter(esVisibleALaLlista), [sortedFeedPosts, ambit]);

  const [cerca, setCerca] = useState(() => ({ ...ESTAT_INICIAL_CERCA, ambit }));
  const cercaViva = cerca.ambit === ambit ? cerca : { ...ESTAT_INICIAL_CERCA, ambit };
  const empremtaMur = empremtaDeLaLlista(sortedFeedPosts, ambit);
  const teMesMur = hiHaMes(SECCIO_DE_LES_DADES);
  const estaCarregantMes = carregantMes(SECCIO_DE_LES_DADES);
  const errorDeMes = errorMes(SECCIO_DE_LES_DADES);

  /* AUD-O2-T4-01: el Mur filtra les persones bloquejades abans de lliurar
     sortedFeedPosts, així que una pàgina pot avançar el cursor sense canviar
     l'empremta visible. Quan carregaMes diu que ha consumit la pàgina (true)
     i ningú no ha demanat res després, s'allibera l'empremta perquè la cerca
     continue; MAX_SALTS_PAGINA continua fitant el recorregut. */
  const demanaPagina = useCallback((empremta) => {
    Promise.resolve(carregaMes(SECCIO_DE_LES_DADES)).then(
      (avancada) => setCerca((previ) => (avancada === true && previ.ultimaEmpremta === empremta
        ? { ...previ, ultimaEmpremta: '' }
        : { ...previ })),
      () => setCerca((previ) => ({ ...previ }))
    );
  }, [carregaMes]);

  const calAvancarPagina = Boolean(textos)
    && status === 'ready'
    && items.length < cercaViva.minItems
    && teMesMur
    && !estaCarregantMes
    && !errorDeMes
    && cercaViva.salts < MAX_SALTS_PAGINA
    && cercaViva.ultimaEmpremta !== empremtaMur;

  useEffect(() => {
    if (!calAvancarPagina) return;
    setCerca((previ) => {
      const actual = previ.ambit === ambit ? previ : { ...ESTAT_INICIAL_CERCA, ambit };
      return {
        ...actual,
        salts: actual.salts + 1,
        ultimaEmpremta: empremtaMur
      };
    });
    demanaPagina(empremtaMur);
  }, [calAvancarPagina, ambit, empremtaMur, demanaPagina]);

  const mostraMes = useCallback(() => {
    setCerca({
      ambit,
      minItems: items.length + 1,
      salts: 1,
      ultimaEmpremta: empremtaMur
    });
    demanaPagina(empremtaMur);
  }, [ambit, items.length, empremtaMur, demanaPagina]);

  useSEO({
    title: tr(textos?.kicker),
    description: tr(textos?.subtitle)
  });

  if (!textos) return null;

  const config = {
    title: tr(textos.kicker),
    subtitle: tr(textos.title),
    lead: tr(textos.subtitle),
    chrome: "system",
    showLogos: true
  };
  /* Verb i nom iguals: el nom accessible conté el text visible (WCAG 2.5.3). */
  const textPublicar = tr(textos.publicar);
  const portaPublicar = { id: 'publicar', verb: textPublicar, nom: textPublicar, desti: rutaDePublicar(ambit), varietat: 'primari' };
  const cercantPrimeraFitxa = status === 'ready' && !items.length && (estaCarregantMes || calAvancarPagina) && !errorDeMes;

  return (
    <ContentProvider initialConfig={config}>
      {/* Traduir només si totes les fitxes són públiques (visibilitatTraduible.js). */}
      <UniversalPage traduccio={totsPublics(items)} accioPrincipal={<PortaDePagina porta={portaPublicar} />}>
        {status === 'loading' || cercantPrimeraFitxa ? <Carregant etiqueta={tr(textos.carregant)} /> : null}
        {status === 'error'
          ? <EstatErrorDades titol={tr(textos.error)} error={error} onReintenta={refresh} />
          : null}
        {status === 'ready' && !items.length && !cercantPrimeraFitxa && !errorDeMes ? <p role="status">{tr(textos.buit)}</p> : null}
        <div className="sdp-card-grid">
          {items.map((item) => <TargetaDelMur key={`${item.type}-${item.id}`} item={item} />)}
        </div>
        {errorDeMes
          ? <EstatErrorDades titol={tr(textos.error)} error={errorDeMes} onReintenta={mostraMes} />
          : teMesMur
            ? (
              <div className="sdp-camp sdp-camp--centrat">
                <Boto carregant={estaCarregantMes || calAvancarPagina} onClick={mostraMes}>{t('section.mur.loadMore', 'Mostra més')}</Boto>
              </div>
            )
            : null}
      </UniversalPage>
    </ContentProvider>
  );
}
