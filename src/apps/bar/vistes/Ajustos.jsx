/**
 * El Bar · vistes/Ajustos.jsx — sala, caixa i dispositiu (disseny del Bar §A.7-§A.8).
 *
 *   · Dispositiu: on viuen les dades (este navegador), si el navegador ha
 *     promés guardar-les, «Desa una còpia» (JSON) i els interruptors de l'app.
 *   · Caixa: el nom del bar i l'IVA per defecte (el posa qui gestiona el bar:
 *     el TPV no aconsella cap tipus).
 *   · Sala: les zones i les taules (de només lectura en esta versió).
 *   · Carta: la llavor d'ara i carregar-ne una altra (llavors/index.js), amb
 *     el diàleg de confirmació destructiu a la consulta (?llavor=<id>), que
 *     diu què canvia de l'establiment i recorda desar abans una còpia, i el
 *     resum i els avisos de la importació (Onada 3).
 * Sense permís d'escriptura (ProveidorBar, permis.potEscriure): «Desa» i les
 * llavors queden desactivats. La còpia, la persistència i els interruptors
 * del dispositiu no escriuen dades del Bar i continuen igual.
 */
import { useEffect, useState } from 'react';
import { Download, HardDrive } from 'lucide-react';
import {
  Alerta, BarraResum, Boto, Camp, CampText, DialegConfirmacio, Interruptor, LiniesColleccio
} from '../../../components/PedraSeca/index.js';
import { ColumnaColleccions } from '../../comu/esquelet/index.js';
import { esSlug, titolDe, useApp, useInterruptorsApp, useParametresConsulta } from '../../plataforma/index.js';
import { taulesEnOrdre } from '../nucli/sala.js';
import { useBar } from '../estat/ProveidorBar.jsx';
import { LLAVORS, nomDeLlavor } from '../llavors/index.js';
import { AvisBase, AvisOperacio, AvisSessioEnEstret, Columna, Preparat } from './comu.jsx';
import { desaFitxer, nomFitxer } from './desa.js';
import { SECCIONS_AJUSTOS, useUnaVegada, useVes } from './punt.js';

/* Fora de cap Preparat: en estret, quan és el panell que es veu, porta l'avís de la sessió ella
   mateixa; en ample i en tauleta el diu el detall del costat (AjustTriat), una sola vegada. */
export function ApartatsAjustos({ params }) {
  const { ruta } = useVes();
  return (
    <ColumnaColleccions titol="Ajustos" actiu={params?.seccio || 'dispositiu'}
      colleccions={SECCIONS_AJUSTOS.map((s) => ({ id: s.id, nom: s.nom, comptador: 0, secundari: s.text }))}
      hrefDe={(s) => ruta('ajustos', s.id)} textComptador={() => ''} avis={<AvisSessioEnEstret />} />
  );
}

export function AjustTriat({ params }) {
  const seccio = params?.seccio || 'dispositiu';
  return (
    <Preparat titol="Ajustos" ambTorn={false}>
      {seccio === 'dispositiu' ? <Dispositiu /> : null}
      {seccio === 'caixa' ? <Caixa /> : null}
      {seccio === 'sala' ? <Sala /> : null}
      {seccio === 'carta' ? <CartaLlavor /> : null}
    </Preparat>
  );
}

function Dispositiu() {
  const { accions, persistent } = useBar();
  const { manifest } = useApp();
  const interruptors = useInterruptorsApp();
  const [estat, setEstat] = useState(null);
  const [avis, setAvis] = useState(null);
  useEffect(() => {
    let viu = true;
    accions.estatPersistencia().then((e) => { if (viu) setEstat(e); }).catch(() => {});
    return () => { viu = false; };
  }, [accions]);
  const demana = async () => {
    const concedit = await accions.demanaPersistencia();
    setAvis(concedit === null ? 'Este navegador no permet demanar-ho.' : (concedit ? 'Fet: el navegador no les esborrarà per falta d’espai.' : 'El navegador no ho ha concedit.'));
    setEstat(await accions.estatPersistencia());
  };
  const copia = async () => {
    const bolcat = await accions.bolca();
    const ara = new Date().toISOString();
    const ofert = desaFitxer(nomFitxer('copia-bar', 'dispositiu', ara, 'json'), JSON.stringify({ schema: 'sdp.bar.copia.v1', desadaA: ara, ...bolcat }, null, 2), 'application/json');
    setAvis(ofert ? 'Còpia preparada: el navegador et deixa triar on desar-la.' : 'Este navegador no deixa desar fitxers des d’ací.');
  };
  return (
    <Columna titol="Dispositiu">
      <AvisBase />
      <AvisOperacio />
      {avis ? <Alerta to="info" onTanca={() => setAvis(null)}>{avis}</Alerta> : null}
      <BarraResum etiqueta="On són les dades" comptador={0} textComptador={() => ''}
        total={persistent ? 'En este navegador' : 'Només en memòria'} textTotal="Lloc" />
      <p>Les dades del bar no ixen d’este dispositiu: no es sincronitzen amb cap servidor. Esborrar les dades del navegador les esborra. Desa una còpia en cada tancament.</p>
      {estat ? <p>{estat.duradora ? 'El navegador ha promés no esborrar-les per falta d’espai.' : 'El navegador encara no ha promés guardar-les.'}</p> : null}
      <Boto icona={HardDrive} onClick={demana}>Demana que no s’esborren</Boto>
      <Boto icona={Download} onClick={copia}>Desa una còpia (JSON)</Boto>
      {manifest.interruptors.filter((i) => interruptors.avalua(i.id).motiu !== 'apagat-per-defecte').map((i) => (
        <Interruptor key={i.id} etiqueta={titolDe(i.titol)} actiu={interruptors.actiu(i.id)} onCanvi={(actiu) => interruptors.apaga(i.id, !actiu)} />
      ))}
    </Columna>
  );
}

function Caixa() {
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
    <Columna titol="Caixa">
      <AvisOperacio />
      {desat ? <Alerta to="exit">Desat. Les comandes ja fetes conserven l’IVA que tenien.</Alerta> : null}
      <Camp etiqueta="Nom del bar" ajuda="Es veu a la nota del client.">
        <CampText value={nom} maxLength={80} onChange={(event) => { setNom(event.target.value); setDesat(false); }} />
      </Camp>
      <Camp etiqueta="IVA per defecte (%)" ajuda="El decidix qui gestiona el bar; un producte en pot portar un altre."
        error={ivaNet === null ? 'Escriu un enter de 0 a 100.' : undefined}>
        <CampText inputMode="numeric" value={iva} maxLength={3} onChange={(event) => { setIva(event.target.value); setDesat(false); }} />
      </Camp>
      <Boto varietat="primari" disabled={!permis.potEscriure || ivaNet === null} onClick={desa}>Desa</Boto>
    </Columna>
  );
}

function Sala() {
  const { sala } = useBar();
  return (
    <Columna titol="Sala">
      <p>Les zones i les taules del plànol. Editar-les és per a una versió pròxima.</p>
      {sala.zones.map((zona) => (
        <LiniesColleccio key={zona.id} etiqueta={zona.nom}
          linies={taulesEnOrdre(sala).filter((t) => t.zonaId === zona.id).map((t) => ({
            id: t.id, articleId: t.id, nom: t.nom, detall: `Fila ${t.posicio.fila}, columna ${t.posicio.columna}`, valor: `${t.places} places`
          }))} />
      ))}
    </Columna>
  );
}

const textProductes = (n) => `${n} ${n === 1 ? 'producte' : 'productes'}`;
const linia = (id, nom, valor) => ({ id, articleId: id, nom, valor: String(valor) });

/* El resum de l'importador com a línies de només lectura. */
function liniesDelResum(resum) {
  const iva = Object.keys(resum.perIva).map(Number).sort((a, b) => a - b)
    .map((percent) => linia(`iva-${percent}`, `IVA del ${percent} %`, resum.perIva[percent]));
  return [
    linia('productes', 'Productes', resum.productes),
    linia('variants', 'Variants', resum.variants),
    linia('categories', 'Categories', resum.categories),
    linia('inactius', 'No disponibles', resum.inactius),
    linia('preu-obert', 'Amb preu obert', resum.preuObert),
    ...iva,
    ...(resum.senseIva ? [linia('sense-iva', 'Amb l’IVA de l’establiment', resum.senseIva)] : []),
    linia('modificadors', 'Grups de modificadors no importats', resum.modificadors)
  ];
}

function ResumLlavor({ resultat }) {
  const { nom, resum, avisos = [] } = resultat;
  return (
    <>
      <Alerta to="exit">{resum ? `Fet: «${nom}» té ${textProductes(resum.productes)} en ${resum.categories} categories.` : `Fet: torna a ser la «${nom}».`}</Alerta>
      {resum ? <LiniesColleccio etiqueta="Resum de la importació" linies={liniesDelResum(resum)} /> : null}
      {avisos.length ? (
        <>
          <p>{`La importació ha deixat ${avisos.length} ${avisos.length === 1 ? 'avís' : 'avisos'}:`}</p>
          <LiniesColleccio etiqueta="Avisos de la importació" linies={avisos.map((a, i) => ({ id: `avis-${i + 1}`, articleId: `avis-${i + 1}`, nom: a.text }))} />
        </>
      ) : null}
    </>
  );
}

/* La confirmació va a la consulta (Clàusula dels Slugs, BAR-R7): ?llavor=<id>. */
const PARAMETRES_CARTA = Object.freeze({ llavor: esSlug });

/* Què canvia de l'establiment: només el nom, i només si la llavor en porta un. */
const textEstabliment = (llavor) => (llavor.nomDelBar
  ? `El nom del bar passa a ser «${llavor.nomDelBar}». L’IVA per defecte i les monedes de la caixa no canvien.`
  : 'El nom del bar, l’IVA per defecte i les monedes de la caixa no canvien.');

function CartaLlavor() {
  const { carta, establiment, accions, permis } = useBar();
  const [consulta, posaConsulta] = useParametresConsulta(PARAMETRES_CARTA);
  const [resultat, setResultat] = useState(null);
  const [ocupat, executa] = useUnaVegada();
  /* Sense permís, cap confirmació s'obri, tampoc per la consulta. */
  const triada = permis.potEscriure ? LLAVORS.find((l) => l.id === consulta.llavor) || null : null;
  const tria = (id) => {
    accions.oblidaAvis();
    setResultat(null);
    posaConsulta({ llavor: id });
  };
  const tanca = () => posaConsulta({ llavor: null });
  /* Un sol toc a «Substituïx la carta», encara que se'n facen dos (useUnaVegada). */
  const confirma = () => executa(async () => {
    const r = await accions.carregaLlavor(triada.id);
    tanca();
    if (r.ok) setResultat({ nom: triada.nom, ...r.valor });
  });
  return (
    <Columna titol="Carta">
      <AvisOperacio />
      <BarraResum etiqueta="Carta" comptador={carta.productes.length} textComptador={textProductes}
        total={nomDeLlavor(establiment.llavor)} textTotal="Llavor" />
      <p>Carregar una carta substituïx la d’ara sencera: productes, categories, modificadors, ingredients i escandalls. La sala, els torns i els tiquets no canvien. Cal tindre el torn tancat i cap comanda oberta.</p>
      {LLAVORS.map((l) => <Boto key={l.id} disabled={!permis.potEscriure} onClick={() => tria(l.id)}>{l.accio}</Boto>)}
      {resultat ? <ResumLlavor resultat={resultat} /> : null}
      <DialegConfirmacio obert={Boolean(triada)} destructiu carregant={ocupat}
        titol={triada ? `Substituïx la carta per «${triada.nom}»?` : 'Substituïx la carta'}
        descripcio="Els canvis fets a la carta d’ara es perdran."
        etiquetaConfirma="Substituïx la carta" etiquetaCancela="Cancel·la" onTanca={tanca} onConfirma={confirma}>
        {triada ? <p>{textEstabliment(triada)}</p> : null}
        <p>Si la vols guardar, desa abans una còpia des d’Ajustos › Dispositiu. La còpia és un fitxer per a tindre-la: el TPV encara no la pot tornar a carregar.</p>
      </DialegConfirmacio>
    </Columna>
  );
}
