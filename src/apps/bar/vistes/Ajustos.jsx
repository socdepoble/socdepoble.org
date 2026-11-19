/**
 * El Bar · vistes/Ajustos.jsx — sala, caixa i dispositiu (disseny del Bar §A.7-§A.8).
 */
import { useEffect, useRef, useState } from 'react';
import { Download, HardDrive } from 'lucide-react';
import {
  Alerta, BarraResum, Boto, Camp, CampText, DialegConfirmacio, Interruptor, LiniesColleccio
} from '../../../components/PedraSeca/index.js';
import { ColumnaColleccions } from '../../comu/esquelet/index.js';
import { esSlug, titolDe, useApp, useInterruptorsApp, useParametresConsulta } from '../../plataforma/index.js';
import { MAX_BYTES_COPIA_BAR } from '../nucli/copia.js';
import { taulesEnOrdre } from '../nucli/sala.js';
import { useBar } from '../estat/ProveidorBar.jsx';
import { textProductesBar, textosUiBar } from '../i18nBar.js';
import { llavorsDisponibles, nomDeLlavor } from '../llavors/index.js';
import { AvisBase, AvisOperacio, AvisSessioEnEstret, Columna, Preparat } from './comu.jsx';
import { desaFitxer, nomFitxer } from './desa.js';
import { seccionsAjustos, useIdiomaBar, useUnaVegada, useVes } from './punt.js';

export function ApartatsAjustos({ params }) {
  const idioma = useIdiomaBar();
  const tx = textosUiBar(idioma);
  const { ruta } = useVes();
  return (
    <ColumnaColleccions titol={tx.ajustosTitol} actiu={params?.seccio || 'dispositiu'}
      colleccions={seccionsAjustos(idioma).map((s) => ({ id: s.id, nom: s.nom, comptador: 0, secundari: s.text }))}
      hrefDe={(s) => ruta('ajustos', s.id)} textComptador={() => ''} avis={<AvisSessioEnEstret />} />
  );
}

export function AjustTriat({ params }) {
  const idioma = useIdiomaBar();
  const tx = textosUiBar(idioma);
  const seccio = params?.seccio || 'dispositiu';
  return (
    <Preparat titol={tx.ajustosTitol} ambTorn={false}>
      {seccio === 'dispositiu' ? <Dispositiu idioma={idioma} /> : null}
      {seccio === 'caixa' ? <Caixa idioma={idioma} /> : null}
      {seccio === 'sala' ? <Sala idioma={idioma} /> : null}
      {seccio === 'carta' ? <CartaLlavor idioma={idioma} /> : null}
    </Preparat>
  );
}

function Dispositiu({ idioma = 'ca' }) {
  const tx = textosUiBar(idioma);
  const { accions, persistent, mode, permis } = useBar();
  const { manifest } = useApp();
  const interruptors = useInterruptorsApp();
  const [estat, setEstat] = useState(null);
  const [avis, setAvis] = useState(null);
  const [errorPersistencia, setErrorPersistencia] = useState(false);
  const [demanant, setDemanant] = useState(false);
  const peticioPersistencia = useRef(false);
  const [fitxerCopia, setFitxerCopia] = useState(null);
  const [ocupat, executa] = useUnaVegada();
  useEffect(() => {
    let viu = true;
    Promise.resolve().then(() => accions.estatPersistencia())
      .then((e) => { if (viu) setEstat(e); })
      .catch(() => { if (viu) setErrorPersistencia(true); });
    return () => { viu = false; };
  }, [accions]);
  const demana = async () => {
    if (peticioPersistencia.current) return;
    peticioPersistencia.current = true;
    setDemanant(true);
    setErrorPersistencia(false);
    setAvis(null);
    try {
      const concedit = await accions.demanaPersistencia();
      const nouEstat = await accions.estatPersistencia();
      setEstat(nouEstat);
      setAvis(concedit === null ? tx.navegadorNoPermetDemanar : (concedit ? tx.fetNoEsborrara : tx.navegadorNoConcedit));
    } catch {
      setErrorPersistencia(true);
    } finally {
      peticioPersistencia.current = false;
      setDemanant(false);
    }
  };
  const copia = async () => {
    try {
      const text = await accions.exportaCopia();
      const ara = new Date().toISOString();
      const ofert = desaFitxer(nomFitxer('copia-bar', 'dispositiu', ara, 'json'), text, 'application/json');
      setAvis(ofert ? tx.copiaPreparada : tx.navegadorNoDeixaDesar);
    } catch {
      setAvis(tx.errorLlegirCopia);
    }
  };
  const triaCopia = (event) => {
    const fitxer = event.target.files?.[0];
    event.target.value = '';
    if (!fitxer) return;
    if (fitxer.size > MAX_BYTES_COPIA_BAR) {
      setAvis(tx.fitxerMassaGranCopia);
      return;
    }
    setFitxerCopia(fitxer);
  };
  const restaura = () => executa(async () => {
    try {
      const resultat = await accions.restauraCopia(await fitxerCopia.text());
      if (resultat.ok) {
        const { torns, tiquets } = resultat.valor;
        setAvis(tx.copiaRestaurada(torns, tiquets));
      }
    } catch {
      setAvis(tx.errorLlegirFitxer);
    } finally {
      setFitxerCopia(null);
    }
  });
  return (
    <Columna titol={tx.ajustDispositiuNom}>
      <AvisBase />
      <AvisOperacio />
      {errorPersistencia ? <Alerta to="error">{tx.errorPersistencia}</Alerta> : null}
      {avis ? <Alerta to="info" onTanca={() => setAvis(null)}>{avis}</Alerta> : null}
      <BarraResum etiqueta={tx.onSonLesDades} comptador={0} textComptador={() => ''}
        total={persistent ? tx.enEsteNavegador : tx.nomesEnMemoria} textTotal={tx.llocEtiqueta} />
      <p>{tx.privacitatDispositiuText}</p>
      {estat ? <p>{estat.duradora ? tx.promesNoEsborrar : tx.encaraNoPromes}</p> : null}
      <Boto icona={HardDrive} onClick={demana} carregant={demanant} disabled={demanant}>{tx.demanaNoEsborren}</Boto>
      <Boto icona={Download} onClick={copia}>{tx.desaCopiaJson}</Boto>
      <Camp etiqueta={tx.restauraCopiaCamp} ajuda={tx.ajudaRestauraCopia}>
        <CampText tipus="file" accept=".json,application/json" onChange={triaCopia}
          disabled={!permis.potEscriure || mode === 'lectora' || ocupat} />
      </Camp>
      <DialegConfirmacio obert={Boolean(fitxerCopia)} carregant={ocupat}
        titol={tx.restauraCopiaTitol} descripcio={tx.restauraCopiaDesc}
        etiquetaConfirma={tx.restauraCopiaConfirma} etiquetaCancela={tx.cancela}
        onTanca={() => setFitxerCopia(null)} onConfirma={restaura} />
      {manifest.interruptors.filter((i) => interruptors.avalua(i.id).motiu !== 'apagat-per-defecte').map((i) => (
        <Interruptor key={i.id} etiqueta={titolDe(i.titol, idioma)} actiu={interruptors.actiu(i.id)} onCanvi={(actiu) => interruptors.apaga(i.id, !actiu)} />
      ))}
    </Columna>
  );
}

function Caixa({ idioma = 'ca' }) {
  const tx = textosUiBar(idioma);
  const { establiment, accions, permis } = useBar();
  const [nom, setNom] = useState(establiment.nom);
  const [iva, setIva] = useState(String(establiment.ivaPerDefecte));
  const [desat, setDesat] = useState(false);
  const ivaNet = /^\d{1,3}$/.test(iva) && Number(iva) <= 100 ? Number(iva) : null;
  const desa = async () => {
    const r = await accions.desaEstabliment({ ...establiment, nom: nom.trim() || establiment.nom, ivaPerDefecte: ivaNet });
    setDesat(r.ok);
  };
  return (
    <Columna titol={tx.caixaTitol}>
      <AvisOperacio />
      {desat ? <Alerta to="exit">{tx.desatIvaConservat}</Alerta> : null}
      <Camp etiqueta={tx.nomDelBar} ajuda={tx.ajudaNomDelBar}>
        <CampText value={nom} maxLength={80} onChange={(event) => { setNom(event.target.value); setDesat(false); }} />
      </Camp>
      <Camp etiqueta={tx.ivaPerDefecte} ajuda={tx.ajudaIvaPerDefecte}
        error={ivaNet === null ? tx.errorIvaRang : undefined}>
        <CampText inputMode="numeric" value={iva} maxLength={3} onChange={(event) => { setIva(event.target.value); setDesat(false); }} />
      </Camp>
      <Boto varietat="primari" disabled={!permis.potEscriure || ivaNet === null} onClick={desa}>{tx.desa}</Boto>
    </Columna>
  );
}

function Sala({ idioma = 'ca' }) {
  const tx = textosUiBar(idioma);
  const { sala } = useBar();
  return (
    <Columna titol={tx.sala}>
      <p>{tx.salaZonesText}</p>
      {sala.zones.map((zona) => (
        <LiniesColleccio key={zona.id} etiqueta={zona.nom}
          linies={taulesEnOrdre(sala).filter((t) => t.zonaId === zona.id).map((t) => ({
            id: t.id, articleId: t.id, nom: t.nom, detall: tx.filaColumna(t.posicio.fila, t.posicio.columna), valor: `${t.places} ${tx.places}`
          }))} />
      ))}
    </Columna>
  );
}

const linia = (id, nom, valor) => ({ id, articleId: id, nom, valor: String(valor) });

function liniesDelResum(resum, tx) {
  const iva = Object.keys(resum.perIva).map(Number).sort((a, b) => a - b)
    .map((percent) => linia(`iva-${percent}`, tx.ivaDelPercent(percent), resum.perIva[percent]));
  return [
    linia('productes', tx.productes, resum.productes),
    linia('variants', tx.variantsResum, resum.variants),
    linia('categories', tx.categoriesTitol, resum.categories),
    linia('inactius', tx.noDisponibles, resum.inactius),
    linia('preu-obert', tx.ambPreuObert, resum.preuObert),
    ...iva,
    ...(resum.senseIva ? [linia('sense-iva', tx.ambIvaEstabliment, resum.senseIva)] : []),
    linia('modificadors', tx.grupsNoImportats, resum.modificadors)
  ];
}

function ResumLlavor({ resultat, idioma = 'ca' }) {
  const tx = textosUiBar(idioma);
  const { nom, resum, avisos = [] } = resultat;
  return (
    <>
      <Alerta to="exit">{resum ? tx.fetLlavorAmbResum(nom, textProductesBar(resum.productes, idioma), resum.categories) : tx.fetLlavorTorna(nom)}</Alerta>
      {resum ? <LiniesColleccio etiqueta={tx.resumImportacio} linies={liniesDelResum(resum, tx)} /> : null}
      {avisos.length ? (
        <>
          <p>{tx.avisosImportacioIntro(avisos.length)}</p>
          <LiniesColleccio etiqueta={tx.avisosImportacio} linies={avisos.map((a, i) => ({ id: `avis-${i + 1}`, articleId: `avis-${i + 1}`, nom: a.text }))} />
        </>
      ) : null}
    </>
  );
}

const PARAMETRES_CARTA = Object.freeze({ llavor: esSlug });

function CartaLlavor({ idioma = 'ca' }) {
  const tx = textosUiBar(idioma);
  const { carta, establiment, accions, permis } = useBar();
  const [consulta, posaConsulta] = useParametresConsulta(PARAMETRES_CARTA);
  const [resultat, setResultat] = useState(null);
  const [ocupat, executa] = useUnaVegada();
  const llistaLlavors = llavorsDisponibles(idioma);
  const triada = permis.potEscriure ? llistaLlavors.find((l) => l.id === consulta.llavor) || null : null;
  const tria = (id) => {
    accions.oblidaAvis();
    setResultat(null);
    posaConsulta({ llavor: id });
  };
  const tanca = () => posaConsulta({ llavor: null });
  const confirma = () => executa(async () => {
    const r = await accions.carregaLlavor(triada.id);
    tanca();
    if (r.ok) setResultat({ nom: triada.nom, ...r.valor });
  });
  const textEstabliment = triada
    ? (triada.nomDelBar ? tx.textEstablimentCanvia(triada.nomDelBar) : tx.textEstablimentNoCanvia)
    : '';
  return (
    <Columna titol={tx.cartaTitol}>
      <AvisOperacio />
      <BarraResum etiqueta={tx.cartaTitol} comptador={carta.productes.length} textComptador={(n) => textProductesBar(n, idioma)}
        total={nomDeLlavor(establiment.llavor, idioma)} textTotal={tx.llavorEtiqueta} />
      <p>{tx.cartaLlavorExplicacio}</p>
      {llistaLlavors.map((l) => <Boto key={l.id} disabled={!permis.potEscriure} onClick={() => tria(l.id)}>{l.accio}</Boto>)}
      {resultat ? <ResumLlavor resultat={resultat} idioma={idioma} /> : null}
      <DialegConfirmacio obert={Boolean(triada)} destructiu carregant={ocupat}
        titol={triada ? tx.substituixCartaPer(triada.nom) : tx.substituixCarta}
        descripcio={tx.canvisCartaPerdran}
        etiquetaConfirma={tx.substituixCarta} etiquetaCancela={tx.cancela} onTanca={tanca} onConfirma={confirma}>
        {triada ? <p>{textEstabliment}</p> : null}
        <p>{tx.desaCopiaAbansCarta}</p>
      </DialegConfirmacio>
    </Columna>
  );
}
