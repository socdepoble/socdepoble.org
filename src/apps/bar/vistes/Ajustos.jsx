/**
 * El Bar · vistes/Ajustos.jsx — sala, caixa i dispositiu (disseny del Bar §A.7-§A.8).
 *
 *   · Dispositiu: on viuen les dades (este navegador), si el navegador ha
 *     promés guardar-les, «Desa una còpia» (JSON) i els interruptors de l'app.
 *   · Caixa: el nom del bar i l'IVA per defecte (el posa qui gestiona el bar:
 *     el TPV no aconsella cap tipus).
 *   · Sala: les zones i les taules (de només lectura en esta versió).
 */
import { useEffect, useState } from 'react';
import { Download, HardDrive } from 'lucide-react';
import { Alerta, BarraResum, Boto, Camp, CampText, Interruptor, LiniesColleccio } from '../../../components/PedraSeca/index.js';
import { ColumnaColleccions } from '../../comu/esquelet/index.js';
import { titolDe, useApp, useInterruptorsApp } from '../../plataforma/index.js';
import { taulesEnOrdre } from '../nucli/sala.js';
import { useBar } from '../estat/ProveidorBar.jsx';
import { AvisBase, AvisOperacio, Columna, Preparat } from './comu.jsx';
import { desaFitxer, nomFitxer } from './desa.js';
import { SECCIONS_AJUSTOS, useVes } from './punt.js';

export function ApartatsAjustos({ params }) {
  const { ruta } = useVes();
  return (
    <ColumnaColleccions titol="Ajustos" actiu={params?.seccio || 'dispositiu'}
      colleccions={SECCIONS_AJUSTOS.map((s) => ({ id: s.id, nom: s.nom, comptador: 0, secundari: s.text }))}
      hrefDe={(s) => ruta('ajustos', s.id)} textComptador={() => ''} />
  );
}

export function AjustTriat({ params }) {
  const seccio = params?.seccio || 'dispositiu';
  return (
    <Preparat titol="Ajustos" ambTorn={false}>
      {seccio === 'dispositiu' ? <Dispositiu /> : null}
      {seccio === 'caixa' ? <Caixa /> : null}
      {seccio === 'sala' ? <Sala /> : null}
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
  const { establiment, accions } = useBar();
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
      <Boto varietat="primari" disabled={ivaNet === null} onClick={desa}>Desa</Boto>
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
