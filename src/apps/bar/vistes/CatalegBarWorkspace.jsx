import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Link, useSearchParams } from '../../../app/contexts/RouterContext';
import { Alerta, Boto, Camp, CandidatsAlergens, Fila, Selector } from '../../../components/PedraSeca/index.js';
import { CatalegWorkspace, DetallCataleg } from '../../../components/universal/workspace/index.js';
import { candidatsVariantParroquia, useApp } from '../../plataforma/index.js';
import { useBar } from '../estat/ProveidorBar.jsx';
import { LLAVORS, obteLlavor } from '../llavors/index.js';
import { AvisOperacio, AvisSessio } from './comu.jsx';
import { euros } from './vestits.js';
import { modelCartaWorkspace } from './modelCartaWorkspace.js';

function DetallProducte({ item, ruta, historic }) {
  const producte = item.dades;
  const [variantId, setVariantId] = useState(producte.variants[0]?.id || '');
  const variant = producte.variants.find(v => v.id === variantId) || producte.variants[0];
  const proposta = useMemo(() => producte.handle && variant?.ref ? candidatsVariantParroquia(producte, variant) : null, [producte, variant]);
  return <DetallCataleg title={item.title} subtitle={item.subtitle} lead={item.lead} rellotgeViu
    heroImage={item.imageUrl} heroAlt={item.title} showShare={false} showConnect={false} showComment={false}>
    <AvisSessio /><AvisOperacio />
    <p><Link to={ruta('tpv')}>Obri el TPV</Link>{' · '}<Link to={ruta('caixa')}>Obri la caixa</Link>{' · '}
      {!historic && <Link to={ruta('productes', producte.id)}>Edita en la carta del dispositiu</Link>}</p>
    {historic && <Alerta to="avis">Consulta de la font històrica de La Parròquia. Esta vista no ha canviat la carta del dispositiu; els preus, costos i al·lèrgens requerixen revisió.</Alerta>}
    <h3>Variants</h3>
    <Camp etiqueta="Variant del producte"><Selector value={variantId} onChange={event => setVariantId(event.target.value)}
      opcions={producte.variants.map(v => ({ valor: v.id, etiqueta: `${v.nom} · ${euros(v.preuCents)}` }))} /></Camp>
    <p>{variant?.ref ? `REF original: ${variant.ref}. ` : ''}{producte.preuObert ? 'Preu obert.' : variant ? `Preu de la carta: ${euros(variant.preuCents)}.` : 'Preu desconegut.'}</p>
    {proposta ? <CandidatsAlergens proposta={proposta} /> : <>
      <h3>Al·lèrgens i escandall</h3>
      <p>Consulta la fitxa actual del producte. Esta proposta no acredita la composició, les traces, les absències ni el cost d’un escandall.</p>
    </>}
  </DetallCataleg>;
}

export function CatalegBarWorkspace() {
  const { carta, establiment, carregat, errorCarrega } = useBar();
  const { ruta } = useApp();
  const [historica, setHistorica] = useState(null);
  const [carregant, setCarregant] = useState(false);
  const [errorFont, setErrorFont] = useState(null);
  const [font, setFont] = useState('dispositiu');
  const actual = font === 'historica' && historica ? historica : { carta, establiment };
  const [searchParams] = useSearchParams();
  const fitxaEnllacada = searchParams.get('fitxa');
  const peticio = useRef(null), viu = useRef(true);
  useEffect(() => { viu.current = true; return () => { viu.current = false; peticio.current = null; }; }, []);
  const model = useMemo(() => {
    const resultat = modelCartaWorkspace(actual.carta, actual.establiment);
    if (font === 'historica') resultat.items = resultat.items.map(item => ({ ...item, id: 'historica:' + item.id }));
    return { ...resultat, status: errorCarrega ? 'error' : !carregat ? 'loading' : 'ready', error: errorCarrega };
  }, [actual.carta, actual.establiment, font, carregat, errorCarrega]);
  const consultaHistorica = useCallback(async () => {
    const idPeticio = {}; peticio.current = idPeticio;
    setErrorFont(null); setCarregant(true);
    try {
      const resultat = await obteLlavor('la-parroquia');
      if (!viu.current || idPeticio !== peticio.current) return;
      setHistorica(resultat); setFont('historica');
    } catch {
      if (viu.current && idPeticio === peticio.current) setErrorFont('La font històrica de La Parròquia no està disponible en este build o no s’ha pogut carregar. La carta del dispositiu continua disponible.');
    } finally { if (viu.current && idPeticio === peticio.current) setCarregant(false); }
  }, []);
  useEffect(() => {
    if (fitxaEnllacada?.startsWith('historica:')) consultaHistorica();
  }, [fitxaEnllacada, consultaHistorica]);
  const eines = <>
    <Fila justify="center">
      <Boto aria-pressed={font === 'dispositiu'} onClick={() => { peticio.current = null; setCarregant(false); setFont('dispositiu'); }}>Carta del dispositiu</Boto>
      {LLAVORS.some(llavor => llavor.id === 'la-parroquia') && <Boto disabled={carregant} aria-pressed={font === 'historica'} onClick={consultaHistorica}>
        {carregant ? 'Carregant La Parròquia…' : 'Consulta La Parròquia · font històrica'}
      </Boto>}
    </Fila>
    {errorFont && <Alerta to="avis">{errorFont}</Alerta>}
  </>;
  return <CatalegWorkspace font="bar" destiPublicacio="bar" id="bar-cataleg-p069" model={model} ruta={ruta('cataleg')} privateItems
    labels={{ categories: 'Categories de la carta', items: 'Catàleg del Bar', all: 'Tota la carta', search: 'Busca a la carta…', empty: 'La carta està buida', noResults: 'No hi ha coincidències' }}
    renderDetail={({ item }) => item ? <>{eines}<DetallProducte key={item.id} item={item} ruta={ruta} historic={font === 'historica'} /></>
      : <DetallCataleg title="Catàleg del Bar" subtitle={actual.establiment?.nom || 'Carta del dispositiu'} lead="Categories, productes i variants en un únic espai." rellotgeViu showShare={false} showConnect={false} showComment={false}>
        <AvisSessio /><AvisOperacio />{eines}
        <p><Link to={ruta('tpv')}>Obri el TPV</Link>{' · '}<Link to={ruta('caixa')}>Obri la caixa</Link>{' · '}<Link to={ruta('ajustos', 'carta')}>Gestiona la carta</Link></p>
        <h3>Tria un producte</h3><p>La selecció obri el detall ací mateix. La consulta d’una font històrica no substituïx la carta del dispositiu.</p>
      </DetallCataleg>} />;
}
