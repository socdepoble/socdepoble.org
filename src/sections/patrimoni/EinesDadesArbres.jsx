import { useEffect, useMemo, useRef, useState } from 'react';
import { AreaText, Boto, Camp, CampFitxer, Selector } from '../../components/PedraSeca/index.js';
import { esAppNativa } from '../../config/origenPublic.js';
import { useUIStateOpcional } from '../../app/contexts/UIContext.jsx';
import { useSessioOpcional } from '../../app/contexts/SessionContext.jsx';
import { backendScope } from '../../config/backendConfig.js';
import { creaFitxaDoctoralArbre, exportaFitxesDoctoralsArbres, importaFitxesDoctoralsArbres,
  FORMATS_FITXES_DOCTORALS, LIMIT_BYTES_FITXES_DOCTORALS, REFERENCIES_DOCTORALS_ARBRES } from '../../data/patrimoni/esquemaDoctoralArbres.js';

const REVISIONS_BUIDES = Object.freeze({});
const FORMATS_IMPORTABLES = new Set(['jsonld', 'csv', 'geojson']);
const OPCIONS = FORMATS_FITXES_DOCTORALS.map(format => ({ valor: format.id, etiqueta: format.titol }));

export default function EinesDadesArbres(props) {
  const config = useUIStateOpcional()?.externalConfig;
  const sessio = useSessioOpcional();
  const key = JSON.stringify([backendScope(config), sessio?.currentUser?.id ?? null,
    props.font?.id ?? null, props.arbres.map(arbre => arbre.id)]);
  return <CosEinesDadesArbres key={key} {...props} />;
}

function CosEinesDadesArbres({ arbres, font, revisionsPerArbre = REVISIONS_BUIDES }) {
  const [format, setFormat] = useState('jsonld');
  const [formatImportacio, setFormatImportacio] = useState('jsonld');
  const [text, setText] = useState('');
  const [previsualitzacio, setPrevisualitzacio] = useState(null);
  const [exportacio, setExportacio] = useState(null);
  const [error, setError] = useState('');
  const [llegint, setLlegint] = useState(false);
  const lectura = useRef(0);
  const arbresKey = arbres.map(arbre => arbre.id).join('|');
  const abast = useRef(arbresKey);
  abast.current = arbresKey;
  const fitxes = useMemo(() => arbres.map(arbre => creaFitxaDoctoralArbre(arbre,
    { font, revisions: revisionsPerArbre[arbre.id] ?? [] })), [arbres, font, revisionsPerArbre]);

  useEffect(() => () => { lectura.current += 1; }, []);
  useEffect(() => () => {
    if (exportacio?.url) URL.revokeObjectURL(exportacio.url);
  }, [exportacio]);

  function importa(contingut, tipus = formatImportacio) {
    setError('');
    setPrevisualitzacio(null);
    try {
      const fitxesImportades = importaFitxesDoctoralsArbres(contingut, tipus);
      setPrevisualitzacio(fitxesImportades);
    } catch (cause) { setError(cause.message || 'La importació no s’ha pogut validar.'); }
  }

  async function lligFitxer(event) {
    const file = event.target.files?.[0];
    if (!file) return;
    const idLectura = ++lectura.current;
    const key = arbresKey;
    setError(''); setPrevisualitzacio(null);
    if (file.size > LIMIT_BYTES_FITXES_DOCTORALS) {
      setError('El fitxer supera el límit de 8 MiB.'); return;
    }
    setLlegint(true);
    try {
      const contingut = await file.text();
      if (lectura.current !== idLectura || abast.current !== key) return;
      setText(contingut);
      importa(contingut, formatImportacio);
    } catch (cause) {
      if (lectura.current === idLectura && abast.current === key) setError(cause.message || 'No s’ha pogut llegir el fitxer.');
    } finally {
      if (lectura.current === idLectura && abast.current === key) setLlegint(false);
    }
  }

  function exporta(importada = false) {
    setError('');
    try {
      const descriptor = FORMATS_FITXES_DOCTORALS.find(item => item.id === format);
      const contingut = exportaFitxesDoctoralsArbres(importada ? previsualitzacio : fitxes, format);
      const blob = new Blob([contingut], { type: descriptor.mime });
      const url = esAppNativa() ? null : URL.createObjectURL(blob);
      setExportacio({ contingut, url, nom: `patrimoni-arbres.${descriptor.extensio}`, mime: descriptor.mime });
    } catch (cause) { setError(cause.message || 'L’exportació no s’ha pogut preparar.'); }
  }

  return (
    <section aria-label="Intercanvi de dades d’arbres">
      <h4>Intercanvi de dades d’arbres</h4>
      <Camp etiqueta="Format d’exportació">
        <Selector opcions={OPCIONS} value={format} onChange={event => setFormat(event.target.value)} />
      </Camp>
      <Boto onClick={() => exporta()}>Exporta {fitxes.length} fitxes del catàleg</Boto>
      <p>Inclou les dades del catàleg i les campanyes que s’han carregat en esta vista.</p>
      {!FORMATS_IMPORTABLES.has(format) && <p>Este format prepara la citació acadèmica. La fitxa completa es transferix amb JSON-LD, Darwin Core CSV o GeoJSON.</p>}
      {exportacio && (
        <div>
          {exportacio.url && <p><a href={exportacio.url} download={exportacio.nom} type={exportacio.mime}>Descarrega {exportacio.nom}</a></p>}
          <Camp etiqueta="Text exportat">
            <AreaText readOnly value={exportacio.contingut} files={6} />
          </Camp>
        </div>
      )}
      <details>
        <summary>Importa un paquet de dades</summary>
        <p>La importació validada es previsualitza en la memòria d’esta vista.</p>
        <Camp etiqueta="Format d’importació">
          <Selector opcions={OPCIONS.filter(item => FORMATS_IMPORTABLES.has(item.valor))} value={formatImportacio}
            onChange={event => { lectura.current += 1; setLlegint(false); setPrevisualitzacio(null); setFormatImportacio(event.target.value); }} />
        </Camp>
        <Camp etiqueta="Fitxer de dades">
          <CampFitxer accept=".jsonld,.json,.csv,.geojson" disabled={llegint} onChange={lligFitxer} />
        </Camp>
        <Camp etiqueta="Contingut per importar">
          <AreaText value={text} maxLength={LIMIT_BYTES_FITXES_DOCTORALS}
            onChange={event => { lectura.current += 1; setLlegint(false); setText(event.target.value); setPrevisualitzacio(null); }} files={6} />
        </Camp>
        <Boto disabled={llegint || !text} onClick={() => importa(text)}>Valida i previsualitza</Boto>
        {llegint && <p role="status">Llegint el paquet…</p>}
        {previsualitzacio && (
          <div>
            <p role="status">{previsualitzacio.length} fitxes validades.</p>
            <ul>{previsualitzacio.map(fitxa => <li key={fitxa.id}>{fitxa.nom} · <em lang="la">{fitxa.taxonomia.nomCientific}</em></li>)}</ul>
            <Boto onClick={() => exporta(true)}>Exporta la importació validada</Boto>
          </div>
        )}
      </details>
      {error && <p role="alert">{error}</p>}
      <details>
        <summary>Fonts i estàndards de referència</summary>
        <ul>{REFERENCIES_DOCTORALS_ARBRES.map(referencia => (
          <li key={referencia.id}><a href={referencia.url} target="_blank" rel="noopener noreferrer">{referencia.titol}</a></li>
        ))}</ul>
      </details>
    </section>
  );
}
