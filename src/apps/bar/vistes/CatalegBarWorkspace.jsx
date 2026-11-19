import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Link, useSearchParams } from '../../../app/contexts/RouterContext';
import { Alerta, Boto, Camp, CandidatsAlergens, Fila, Selector } from '../../../components/PedraSeca/index.js';
import { CatalegWorkspace, DetallCataleg } from '../../../components/universal/workspace/index.js';
import { candidatsVariantParroquia, useApp } from '../../plataforma/index.js';
import { useBar } from '../estat/ProveidorBar.jsx';
import { textosUiBar } from '../i18nBar.js';
import { LLAVORS, obteLlavor } from '../llavors/index.js';
import { AvisOperacio, AvisSessio } from './comu.jsx';
import { euros } from './vestits.js';
import { modelCartaWorkspace } from './modelCartaWorkspace.js';

function DetallProducte({ item, ruta, historic, tx }) {
  const producte = item.dades;
  const [variantId, setVariantId] = useState(producte.variants[0]?.id || '');
  const variant = producte.variants.find((v) => v.id === variantId) || producte.variants[0];
  const proposta = useMemo(() => (producte.handle && variant?.ref ? candidatsVariantParroquia(producte, variant) : null), [producte, variant]);
  return (
    <DetallCataleg title={item.title} subtitle={item.subtitle} lead={item.lead} rellotgeViu
      heroImage={item.imageUrl} heroAlt={item.title} showShare={false} showConnect={false} showComment={false}>
      <AvisSessio /><AvisOperacio />
      <p><Link to={ruta('tpv')}>{tx.obriTpv}</Link>{' · '}<Link to={ruta('caixa')}>{tx.obriCaixa}</Link>{' · '}
        {!historic && <Link to={ruta('productes', producte.id)}>{tx.editaCarta}</Link>}</p>
      {historic && <Alerta to="avis">{tx.avisConsultaHistorica}</Alerta>}
      <h3>{tx.variantsTitol}</h3>
      <Camp etiqueta={tx.variantProducte}><Selector value={variantId} onChange={(event) => setVariantId(event.target.value)}
        opcions={producte.variants.map((v) => ({ valor: v.id, etiqueta: `${v.nom} · ${euros(v.preuCents)}` }))} /></Camp>
      <p>{variant?.ref ? tx.refOriginal(variant.ref) : ''}{producte.preuObert ? `${tx.preuObert}.` : variant ? tx.preuDeLaCarta(euros(variant.preuCents)) : tx.preuDesconegut}</p>
      {proposta ? <CandidatsAlergens proposta={proposta} /> : <>
        <h3>{tx.alergensEscandallTitol}</h3>
        <p>{tx.alergensEscandallText}</p>
      </>}
    </DetallCataleg>
  );
}

export function CatalegBarWorkspace() {
  const { carta, establiment, carregat, errorCarrega } = useBar();
  const { ruta, idioma = 'ca' } = useApp();
  const tx = textosUiBar(idioma);
  const [historica, setHistorica] = useState(null);
  const [carregant, setCarregant] = useState(false);
  const [errorFont, setErrorFont] = useState(false);
  const [font, setFont] = useState('dispositiu');
  const actual = font === 'historica' && historica ? historica : { carta, establiment };
  const [searchParams] = useSearchParams();
  const fitxaEnllacada = searchParams.get('fitxa');
  const peticio = useRef(null);
  const viu = useRef(true);
  useEffect(() => { viu.current = true; return () => { viu.current = false; peticio.current = null; }; }, []);
  const model = useMemo(() => {
    const resultat = modelCartaWorkspace(actual.carta, actual.establiment);
    if (font === 'historica') resultat.items = resultat.items.map((item) => ({ ...item, id: `historica:${item.id}` }));
    return { ...resultat, status: errorCarrega ? 'error' : !carregat ? 'loading' : 'ready', error: errorCarrega };
  }, [actual.carta, actual.establiment, font, carregat, errorCarrega]);
  const consultaHistorica = useCallback(async () => {
    const idPeticio = {};
    peticio.current = idPeticio;
    setErrorFont(false);
    setCarregant(true);
    try {
      const resultat = await obteLlavor('la-parroquia');
      if (!viu.current || idPeticio !== peticio.current) return;
      setHistorica(resultat);
      setFont('historica');
    } catch {
      if (viu.current && idPeticio === peticio.current) setErrorFont(true);
    } finally {
      if (viu.current && idPeticio === peticio.current) setCarregant(false);
    }
  }, []);
  useEffect(() => {
    if (fitxaEnllacada?.startsWith('historica:')) consultaHistorica();
  }, [fitxaEnllacada, consultaHistorica]);
  const eines = (
    <>
      <Fila justify="center">
        <Boto aria-pressed={font === 'dispositiu'} onClick={() => { peticio.current = null; setCarregant(false); setFont('dispositiu'); }}>{tx.cartaDispositiu}</Boto>
        {LLAVORS.some((llavor) => llavor.id === 'la-parroquia') && <Boto disabled={carregant} aria-pressed={font === 'historica'} onClick={consultaHistorica}>
          {carregant ? tx.carregantParroquia : tx.consultaParroquia}
        </Boto>}
      </Fila>
      {errorFont && <Alerta to="avis">{tx.errorFontHistorica}</Alerta>}
    </>
  );
  return (
    <CatalegWorkspace font="bar" destiPublicacio="bar" id="bar-cataleg-p069" model={model} ruta={ruta('cataleg')} privateItems
      labels={{ categories: tx.catalegCategories, items: tx.catalegTitol, all: tx.catalegTota, search: tx.catalegCerca, empty: tx.catalegBuit, noResults: tx.catalegSenseCoincidencies }}
      renderDetail={({ item }) => (item ? <>{eines}<DetallProducte key={item.id} item={item} ruta={ruta} historic={font === 'historica'} tx={tx} /></>
        : <DetallCataleg title={tx.catalegTitol} subtitle={actual.establiment?.nom || tx.cartaDispositiu} lead={tx.catalegLead} rellotgeViu showShare={false} showConnect={false} showComment={false}>
          <AvisSessio /><AvisOperacio />{eines}
          <p><Link to={ruta('tpv')}>{tx.obriTpv}</Link>{' · '}<Link to={ruta('caixa')}>{tx.obriCaixa}</Link>{' · '}<Link to={ruta('ajustos', 'carta')}>{tx.gestionaCarta}</Link></p>
          <h3>{tx.triaProducteTitol}</h3><p>{tx.triaProducteText}</p>
        </DetallCataleg>)} />
  );
}
