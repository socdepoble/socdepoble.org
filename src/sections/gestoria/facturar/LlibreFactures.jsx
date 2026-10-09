/**
 * LlibreFactures.jsx — pas 4 de la Facturació: el llibre, la verificació de la cadena i l'anul·lació.
 *
 * Ordre del Mestre, 261007 («tindre la facturació operativa inclús sense
 * xarxa»; pas 2 del mapa de la Gestoria). L'estat de la cadena és sempre
 * visible: verificaCadena la torna a calcular sencera en obrir la pantalla i
 * després de cada acció, i «Torna a verificar» ho fa quan la persona vol. Les
 * factures, de la més nova a la més antiga, amb el seu estat. Anul·lar és
 * per a una factura que no s'havia d'haver emés: afig un registre
 * d'anul·lació (registraAnulacio), no esborra res, i el número no es torna a
 * usar. La confirmació ho diu abans, i el focus va a «Cancel·lar». Amb
 * incidències greus a la cadena no hi ha «Anul·la» (troballa F3, 261007).
 * Onada 6 (261009): «Factura» mostra el full de cada factura, per a
 * imprimir-la o desar-la en PDF (ImpressioFactura.jsx), també amb la cadena
 * aturada: mirar i imprimir no toca el llibre; en tancar-la, el focus torna al
 * botó «Factura» que l'ha oberta. I l'XML de prova dels registres
 * per a l'AEAT (xmlAeat.js), que es descarrega i no s'envia enlloc.
 */
import { useMemo, useRef, useState } from 'react';
import { Boto } from '../../../components/PedraSeca/atoms/Boto.jsx';
import { Insignia } from '../../../components/PedraSeca/atoms/Insignia.jsx';
import { Alerta } from '../../../components/PedraSeca/molecules/Alerta.jsx';
import { DialegConfirmacio } from '../../../components/PedraSeca/organismes/Dialeg.jsx';
import { Taula } from '../../../components/PedraSeca/organismes/Taula.jsx';
import { Camp, CampText } from '../../../components/PedraSeca/organismes/formulari.jsx';
import { dataHoraAmbHus } from '../facturacio/registre/empremta.js';
import { ImpressioFactura } from './ImpressioFactura.jsx';
import { clauDeFactura, estatDeLaCadena, filesDelLlibre } from './nucli/formulari.js';
import { AvisDeZona } from './peces.jsx';

/** Les factures que es mostren d'entrada; la resta, amb «Mostra-les totes». */
export const FACTURES_VISIBLES = 50;

export function LlibreFactures({ f }) {
  const [anulant, setAnulant] = useState(null);
  const [motiu, setMotiu] = useState('');
  const [totes, setTotes] = useState(false);
  /* La clau de la factura que es mostra en paper (no el registre: després d'anul·lar-la, el seu estat canvia). */
  const [mostrada, setMostrada] = useState(null);
  /* El botó «Factura» que l'ha oberta: en tancar-la, el focus hi torna (correcció de la revisió, 261009). */
  const origen = useRef(null);
  const estat = estatDeLaCadena(f.informe);
  const files = useMemo(() => filesDelLlibre(f.cadena), [f.cadena]);
  const visibles = totes ? files : files.slice(0, FACTURES_VISIBLES);
  const hora = Number.isFinite(f.verificatA) ? dataHoraAmbHus(f.verificatA).slice(11, 16) : null;
  const filaMostrada = mostrada ? files.find((fila) => clauDeFactura(fila.registre) === mostrada) ?? null : null;

  const obri = (fila) => {
    setMotiu('');
    setAnulant(fila);
  };
  const mostra = (fila) => (event) => {
    origen.current = event.currentTarget;
    setMostrada(clauDeFactura(fila.registre));
  };
  const tancaFactura = () => {
    setMostrada(null);
    if (origen.current?.isConnected) origen.current.focus();
    origen.current = null;
  };
  /* El diàleg es tanca sempre: l'èxit o l'error es diuen a l'avís del llibre, que no queda davall del vel. */
  async function anulla() {
    await f.anulla(anulant.registre, motiu);
    setAnulant(null);
  }

  return (
    <>
      <Alerta to={estat.to} viva={false} titol={estat.titol}
        accions={<Boto varietat="secundari" onClick={f.verifica} carregant={f.ocupat === 'verificant'} disabled={Boolean(f.ocupat)}>Torna a verificar</Boto>}>
        {estat.text ? <p>{estat.text}</p> : null}
        {hora ? <p className="sdp-gestoria-panell__nota">{`Verificada a les ${hora}.`}</p> : null}
        {estat.incidencies.length ? (
          <ul className="sdp-gestoria-panell__avisos">
            {estat.incidencies.map((incidencia, i) => <li key={`${i}-${incidencia}`}>{incidencia}</li>)}
          </ul>
        ) : null}
      </Alerta>
      <AvisDeZona avis={f.avis} zona="llibre" onTanca={f.tancaAvis} />
      {files.length ? (
        <Taula titol="Factures emeses" className="sdp-gestoria-panell__taula">
          <thead>
            <tr>
              <th scope="col">Número</th>
              <th scope="col">Data</th>
              <th scope="col">Tipus</th>
              <th scope="col">Client</th>
              <th scope="col">Total</th>
              <th scope="col">Estat</th>
              <th scope="col">Acció</th>
            </tr>
          </thead>
          <tbody>
            {visibles.map((fila) => (
              <tr key={clauDeFactura(fila.registre)}>
                <th scope="row">{fila.numSerie}</th>
                <td>{fila.data}</td>
                <td>{fila.tipus}</td>
                <td>{fila.client}</td>
                <td className="sdp-gestoria-panell__cel" data-tipus="import">{fila.total}</td>
                <td><Insignia to={fila.anulada ? 'neutre' : 'exit'}>{fila.anulada ? 'Anul·lada' : 'Emesa'}</Insignia></td>
                <td>
                  <div className="sdp-gestoria-panell__accions-fila">
                    <Boto varietat="fantasma" aria-label={`Mostra la factura ${fila.numSerie}`} aria-pressed={mostrada === clauDeFactura(fila.registre)}
                      onClick={mostra(fila)}>
                      Factura
                    </Boto>
                    {/* Troballa F3 (261007): amb la cadena amb incidències no s'anul·la res fins que s'arregle. */}
                    {fila.anulada || !f.cadenaBona ? null : (
                      <Boto varietat="fantasma" disabled={Boolean(f.ocupat)} aria-label={`Anul·la la factura ${fila.numSerie}`} onClick={() => obri(fila)}>
                        Anul·la
                      </Boto>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </Taula>
      ) : <p>Encara no has emés cap factura amb este programa.</p>}
      {files.length > visibles.length ? (
        <div className="sdp-gestoria-panell__accions">
          <Boto varietat="secundari" onClick={() => setTotes(true)}>{`Mostra les ${files.length} factures`}</Boto>
        </div>
      ) : null}
      {files.length ? (
        <>
          <p className="sdp-gestoria-panell__nota">
            L’XML de prova porta els registres com els enviarà el programa a l’AEAT quan hi haja remissió. Ara no s’envia res,
            i encara li falta el bloc del sistema informàtic (la declaració responsable del programa no existix).
          </p>
          <div className="sdp-gestoria-panell__accions">
            <Boto varietat="secundari" onClick={f.exportaXml} disabled={Boolean(f.ocupat) || !f.cadenaBona} carregant={f.ocupat === 'xml'}>
              Descarrega l’XML de prova per a l’AEAT
            </Boto>
          </div>
        </>
      ) : null}
      {filaMostrada ? (
        <ImpressioFactura key={mostrada} registre={filaMostrada.registre} anulada={filaMostrada.anulada}
          onTanca={tancaFactura} imprimix={f.imprimix} />
      ) : null}

      <DialegConfirmacio obert={Boolean(anulant)} destructiu onTanca={() => setAnulant(null)} onConfirma={anulla}
        titol={anulant ? `Anul·les la factura ${anulant.numSerie}?` : 'Anul·les la factura?'}
        descripcio="Anul·la només una factura que no s’havia d’haver emés. Si el que cal és corregir-la, fes una rectificativa. La factura i el seu número es queden al llibre."
        etiquetaConfirma="Sí, anul·la-la" carregant={f.ocupat === 'anul·lant'}>
        <Camp etiqueta="Per què l’anul·les? (opcional)" ajuda="Queda al llibre, per a qui el revise.">
          <CampText value={motiu} spellCheck={false} onChange={(event) => setMotiu(event.target.value)} />
        </Camp>
      </DialegConfirmacio>
    </>
  );
}
