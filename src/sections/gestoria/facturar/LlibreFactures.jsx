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
 * Prompt 261014_1605, front G1:
 *   · PODER 1 · la factura mostrada és estat de useFacturacio (f.mostrada):
 *     emetre l'obri sola i «Factura» la canvia, sempre una sola vista. Va
 *     davant dels detalls tècnics, que és el que es busca;
 *   · PODER 3 · l'XML de prova i la seua nota, dins d'un desplegable de
 *     detalls tècnics, tancat d'entrada.
 * Gauntlet 261016, Onada 3 (el llibre net a l'estil Holded): el període (els
 * quatre trimestres o tot l'any, i l'any si n'hi ha més d'un), l'estat i la
 * cerca per número, client o NIF; les columnes Base i IVA; el peu «Total del
 * període», que no suma les anul·lades i suma les rectificatives amb el seu
 * signe (resumDelLlibre); i el llibre del període en CSV per a la gestoria
 * (nucli/llibreCsv.js), amb l'avís que ix sense xifrar. D'entrada, tot l'any
 * de la factura més nova i totes les factures. Les 50 visibles es compten
 * després del filtre; la factura mostrada en paper es busca a tot el llibre.
 */
import { useMemo, useState } from 'react';
import { Boto } from '../../../components/PedraSeca/atoms/Boto.jsx';
import { Insignia } from '../../../components/PedraSeca/atoms/Insignia.jsx';
import { Alerta } from '../../../components/PedraSeca/molecules/Alerta.jsx';
import { PillToggle } from '../../../components/PedraSeca/molecules/PillToggle.jsx';
import { DialegConfirmacio } from '../../../components/PedraSeca/organismes/Dialeg.jsx';
import { Taula } from '../../../components/PedraSeca/organismes/Taula.jsx';
import { Camp, CampText } from '../../../components/PedraSeca/organismes/formulari.jsx';
import { dataHoraAmbHus } from '../facturacio/registre/empremta.js';
import { ImpressioFactura } from './ImpressioFactura.jsx';
import {
  OPCIONS_ESTAT_LLIBRE, OPCIONS_PERIODE, anysDelLlibre, clauDeFactura, estatDeLaCadena, euros, filesDelLlibre, resumDelLlibre
} from './nucli/formulari.js';
import { AVIS_SENSE_XIFRAR_LLIBRE } from './nucli/llibreCsv.js';
import { TEXTOS_FACTURACIO } from './nucli/textosFacturacio.js';
import { AvisDeZona } from './peces.jsx';
import { adoptaFullDiferit } from '../../../config/fullDiferit.js';
import cssDiferitGestoria from '../../../css/diferit-gestoria.css?inline';
import { localitzaEstatCadenaGestoria, localitzaOpcionsGestoria, tf, tg } from '../i18nGestoria.js';
const adoptaEstilsDiferits = (el) => { adoptaFullDiferit(el, 'gestoria', cssDiferitGestoria); };

/** Les factures que es mostren d'entrada; la resta, amb «Mostra-les totes». */
export const FACTURES_VISIBLES = 50;

/* La nota del peu: el que no suma i el que suma només la diferència. */
function notaDelTotal(resum, idioma) {
  return [
    resum.anulades ? tg(idioma, 'Les anul·lades no sumen.') : '',
    resum.ambSubstitucions ? tg(idioma, 'Les que en substituïxen d’altres sumen la diferència.') : ''
  ].filter(Boolean).join(' ');
}

export function LlibreFactures({ f, tx = TEXTOS_FACTURACIO.ca, idioma = 'ca' }) {
  const [anulant, setAnulant] = useState(null);
  const [motiu, setMotiu] = useState('');
  const [totes, setTotes] = useState(false);
  const [anyTriat, setAnyTriat] = useState(null);
  const [periode, setPeriode] = useState('any');
  const [estatTriat, setEstatTriat] = useState('totes');
  const [cerca, setCerca] = useState('');
  const [baixant, setBaixant] = useState(false);
  const { mostrada } = f;
  const estat = localitzaEstatCadenaGestoria(estatDeLaCadena(f.informe), idioma);
  const opcionsPeriode = useMemo(() => localitzaOpcionsGestoria(OPCIONS_PERIODE, idioma), [idioma]);
  const opcionsEstat = useMemo(() => localitzaOpcionsGestoria(OPCIONS_ESTAT_LLIBRE, idioma), [idioma]);
  const files = useMemo(() => filesDelLlibre(f.cadena), [f.cadena]);
  const anys = useMemo(() => anysDelLlibre(files), [files]);
  /* L'any triat, si encara és al llibre; si no, el de la factura més nova. */
  const any = anys.includes(anyTriat) ? anyTriat : (anys[0] ?? null);
  const trimestre = periode === 'any' ? null : Number(periode);
  const resum = useMemo(() => resumDelLlibre(files, { any, trimestre, estat: estatTriat, text: cerca }), [files, any, trimestre, estatTriat, cerca]);
  /* El CSV porta el període sencer, també les anul·lades: la cerca i l'estat només són per a mirar. */
  const delPeriode = useMemo(() => resumDelLlibre(files, { any, trimestre }).files, [files, any, trimestre]);
  const visibles = totes ? resum.files : resum.files.slice(0, FACTURES_VISIBLES);
  const hora = Number.isFinite(f.verificatA) ? dataHoraAmbHus(f.verificatA).slice(11, 16) : null;
  const filaMostrada = mostrada ? files.find((fila) => clauDeFactura(fila.registre) === mostrada) ?? null : null;
  const nota = notaDelTotal(resum, idioma);

  const obri = (fila) => {
    setMotiu('');
    setAnulant(fila);
  };
  /* El botó «Factura» que l'ha oberta: en tancar-la, el focus hi torna (correcció de la revisió, 261009). */
  const mostra = (fila) => (event) => f.mostraFactura(clauDeFactura(fila.registre), event.currentTarget);
  /* El diàleg es tanca sempre: l'èxit o l'error es diuen a l'avís del llibre, que no queda davall del vel. */
  async function anulla() {
    await f.anulla(anulant.registre, motiu);
    setAnulant(null);
  }
  /* Com l'anul·lació: el diàleg es tanca sempre i el resultat el diu l'avís del llibre. */
  async function baixa() {
    await f.exportaLlibre({ files: delPeriode, any, trimestre });
    setBaixant(false);
  }

  return (
    <>
      <Alerta to={estat.to} viva={false} titol={estat.titol}
        accions={<Boto varietat="secundari" onClick={f.verifica} carregant={f.ocupat === 'verificant'} disabled={Boolean(f.ocupat)}>{tg(idioma, 'Torna a verificar')}</Boto>}>
        {estat.text ? <p ref={adoptaEstilsDiferits}>{estat.text}</p> : null}
        {hora ? <p ref={adoptaEstilsDiferits} className="sdp-gestoria-panell__nota">{tf(idioma, 'verificadaALes', hora)}</p> : null}
        {estat.incidencies.length ? (
          <ul ref={adoptaEstilsDiferits} className="sdp-gestoria-panell__avisos">
            {estat.incidencies.map((incidencia, i) => <li ref={adoptaEstilsDiferits} key={`${i}-${incidencia}`}>{incidencia}</li>)}
          </ul>
        ) : null}
      </Alerta>
      <AvisDeZona avis={f.avis} zona="llibre" onTanca={f.tancaAvis} />
      {files.length ? (
        <div ref={adoptaEstilsDiferits} className="sdp-gestoria-panell__accions">
          {anys.length > 1 ? (
            <PillToggle etiqueta={tg(idioma, 'Any del llibre')} valor={any} onCanvi={setAnyTriat} opcions={anys.map((a) => ({ valor: a, text: String(a) }))} />
          ) : null}
          <PillToggle etiqueta={any === null ? tg(idioma, 'Període') : tf(idioma, 'periodeDe', any)} valor={periode} onCanvi={setPeriode} opcions={opcionsPeriode} />
          <PillToggle etiqueta={tg(idioma, 'Estat de les factures')} valor={estatTriat} onCanvi={setEstatTriat} opcions={opcionsEstat} />
          <Camp etiqueta={tg(idioma, 'Cerca per número, client o NIF')}>
            <CampText tipus="search" value={cerca} spellCheck={false} onChange={(event) => setCerca(event.target.value)} />
          </Camp>
        </div>
      ) : null}
      {resum.files.length ? (
        <Taula titol={tg(idioma, 'Factures emeses')} className="sdp-gestoria-panell__taula">
          <thead ref={adoptaEstilsDiferits}>
            <tr>
              <th scope="col">{tg(idioma, 'Número')}</th>
              <th scope="col">{tg(idioma, 'Data')}</th>
              <th scope="col">{tg(idioma, 'Tipus')}</th>
              <th scope="col">{tg(idioma, 'Client')}</th>
              <th scope="col">{tg(idioma, 'Base')}</th>
              <th scope="col">{tg(idioma, 'IVA')}</th>
              <th scope="col">{tg(idioma, 'Total')}</th>
              <th scope="col">{tg(idioma, 'Estat')}</th>
              <th scope="col">{tg(idioma, 'Acció')}</th>
            </tr>
          </thead>
          <tbody>
            {visibles.map((fila) => (
              <tr ref={adoptaEstilsDiferits} key={clauDeFactura(fila.registre)}>
                <th scope="row">{fila.numSerie}</th>
                <td>{fila.data}</td>
                <td>{tg(idioma, fila.tipus)}</td>
                <td>{fila.client}</td>
                <td className="sdp-gestoria-panell__cel" data-tipus="import">{euros(fila.base)}</td>
                <td className="sdp-gestoria-panell__cel" data-tipus="import">{euros(fila.quota)}</td>
                <td className="sdp-gestoria-panell__cel" data-tipus="import">{fila.total}</td>
                <td><Insignia to={fila.anulada ? 'neutre' : 'exit'}>{tg(idioma, fila.anulada ? 'Anul·lada' : 'Emesa')}</Insignia></td>
                <td>
                  <div className="sdp-gestoria-panell__accions-fila">
                    <Boto varietat="fantasma" aria-label={tf(idioma, 'mostraFacturaAria', fila.numSerie)} aria-pressed={mostrada === clauDeFactura(fila.registre)}
                      onClick={mostra(fila)}>
                      {tg(idioma, 'Factura')}
                    </Boto>
                    {fila.anulada || !f.cadenaBona ? null : (
                      <Boto varietat="fantasma" disabled={Boolean(f.ocupat)} aria-label={tf(idioma, 'anullaFacturaAria', fila.numSerie)} onClick={() => obri(fila)}>
                        {tg(idioma, 'Anul·la')}
                      </Boto>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr>
              <th scope="row" colSpan={4}>{tg(idioma, 'Total del període')}</th>
              <td className="sdp-gestoria-panell__cel" data-tipus="import">{euros(resum.totals.base)}</td>
              <td className="sdp-gestoria-panell__cel" data-tipus="import">{euros(resum.totals.quota)}</td>
              <td className="sdp-gestoria-panell__cel" data-tipus="import">{euros(resum.totals.total)}</td>
              <td colSpan={2}>{nota}</td>
            </tr>
          </tfoot>
        </Taula>
      ) : <p ref={adoptaEstilsDiferits}>{files.length ? tx.llibreBuitFiltres : tx.llibreBuitInicial}</p>}
      {resum.files.length > visibles.length ? (
        <div ref={adoptaEstilsDiferits} className="sdp-gestoria-panell__accions">
          <Boto varietat="secundari" onClick={() => setTotes(true)}>{tf(idioma, 'mostraNFactures', resum.files.length)}</Boto>
        </div>
      ) : null}
      {files.length ? (
        <div ref={adoptaEstilsDiferits} className="sdp-gestoria-panell__accions">
          <Boto varietat="secundari" onClick={() => setBaixant(true)} disabled={Boolean(f.ocupat) || !f.cadenaBona || !delPeriode.length}
            carregant={f.ocupat === 'csv'}>
            {tf(idioma, 'descarregaLlibreCsv', any, trimestre)}
          </Boto>
        </div>
      ) : null}
      {filaMostrada ? (
        <ImpressioFactura key={mostrada} registre={filaMostrada.registre} anulada={filaMostrada.anulada}
          onTanca={f.tancaFactura} imprimix={f.imprimix} idioma={idioma} />
      ) : null}
      {files.length ? (
        <details ref={adoptaEstilsDiferits} className="sdp-gestoria-panell__documents">
          <summary>{tg(idioma, 'Detalls tècnics: l’XML de prova per a l’AEAT')}</summary>
          <div className="sdp-gestoria-panell__bloc">
            <p className="sdp-gestoria-panell__nota">
              {tg(idioma, 'L’XML de prova porta els registres com els enviarà el programa a l’AEAT quan hi haja remissió. Ara no s’envia res, i encara li falta el bloc del sistema informàtic (la declaració responsable del programa no existix).')}
            </p>
            <div className="sdp-gestoria-panell__accions">
              <Boto varietat="secundari" onClick={f.exportaXml} disabled={Boolean(f.ocupat) || !f.cadenaBona} carregant={f.ocupat === 'xml'}>
                {tg(idioma, 'Descarrega l’XML de prova per a l’AEAT')}
              </Boto>
            </div>
          </div>
        </details>
      ) : null}

      <DialegConfirmacio obert={Boolean(anulant)} destructiu onTanca={() => setAnulant(null)} onConfirma={anulla}
        titol={tf(idioma, 'anullesFactura', anulant?.numSerie ?? null)}
        descripcio={tg(idioma, 'Anul·la només una factura que no s’havia d’haver emés. Si el que cal és corregir-la, fes una rectificativa. La factura i el seu número es queden al llibre.')}
        etiquetaConfirma={tg(idioma, 'Sí, anul·la-la')} carregant={f.ocupat === 'anul·lant'}>
        <Camp etiqueta={tg(idioma, 'Per què l’anul·les? (opcional)')} ajuda={tg(idioma, 'Queda al llibre, per a qui el revise.')}>
          <CampText value={motiu} spellCheck={false} onChange={(event) => setMotiu(event.target.value)} />
        </Camp>
      </DialegConfirmacio>
      <DialegConfirmacio obert={baixant} onTanca={() => setBaixant(false)} onConfirma={baixa}
        titol={tg(idioma, 'Descarregar el llibre sense xifrar?')} descripcio={tg(idioma, AVIS_SENSE_XIFRAR_LLIBRE)}
        etiquetaConfirma={tg(idioma, 'Descarrega’l')} etiquetaCancela={tg(idioma, 'Encara no')} carregant={f.ocupat === 'csv'} />
    </>
  );
}
