/**
 * SafataDenunciesDiligentsAdmin.jsx — Safata d'Administració de Denúncies Diligents
 * LSSI Art. 16 i Ampliacions (Onada R32.17 · Lot 02 · D-R32.15-2).
 *
 * Fitxes verticals Pedra Seca (zero taules amples P0-128), 5 llengües, validació
 * accessible de justificació obligatòria (aria-invalid="false" -> "true" + focus)
 * i protecció idempotent contra doble enviament amb operacioId UUID estable.
 */
import { useCallback, useEffect, useId, useRef, useState } from 'react';
import { Alerta, Boto, Insignia } from '../../../components/PedraSeca/index.js';
import { useUIStateOpcional } from '../../../app/contexts/UIContext.jsx';
import { useFullDiferit } from '../../../config/fullDiferit.js';
import cssDenunciesLssi from '../../../css/diferit-denuncies-lssi.css?inline';
import {
  FILTRES_SAFATA_LSSI,
  accionsTransicioPermeses,
  aplicaRevisioDenunciaDiligent,
  carregaSafataDenunciesDiligents
} from './serveiSafataDenunciesDiligents.js';
import {
  etiquetaAccioTransicio,
  etiquetaEstatDenuncia,
  etiquetaMotiuDenuncia,
  textosSafataLssi
} from './i18nSafataDenunciesDiligents.js';

function etiquetaFiltre(filtre, tx) {
  if (filtre === 'pendent') return tx.filtrePendent;
  if (filtre === 'en_revisio') return tx.filtreEnRevisio;
  if (filtre === 'retirada') return tx.filtreRetirada;
  return tx.filtreDesestimada;
}

export function SafataDenunciesDiligentsAdmin({
  idioma,
  config = null,
  port = null
}) {
  const arrelRef = useRef(null);
  useFullDiferit(arrelRef, 'denuncies-lssi', cssDenunciesLssi);
  const ui = useUIStateOpcional();
  const llengua = idioma || ui?.llenguaDelText || ui?.language || 'ca';
  const configEfectiva = config ?? ui?.externalConfig ?? null;
  const tx = textosSafataLssi(llengua);
  const baseId = useId();

  const [filtre, setFiltre] = useState('pendent');
  const [carregant, setCarregant] = useState(true);
  const [safata, setSafata] = useState({
    mode: 'nomes-cua-local',
    disponibleRemot: false,
    motiuNoRemot: null,
    remotes: [],
    cuaLocalPendent: []
  });
  const [justificacions, setJustificacions] = useState({});
  const [tocats, setTocats] = useState({});
  const [errorsCamp, setErrorsCamp] = useState({});
  const [enviantId, setEnviantId] = useState(null);
  const [avisGlobal, setAvisGlobal] = useState(null);

  const registreOperacionsRef = useRef(new Map());
  const textareaRefs = useRef({});
  const tornLecturaRef = useRef(0);

  const refresca = useCallback(async (filtreActiu = filtre) => {
    const torn = ++tornLecturaRef.current;
    setCarregant(true);
    try {
      const resultat = await carregaSafataDenunciesDiligents(
        { filtre: filtreActiu, limit: 50, config: configEfectiva },
        port
      );
      if (torn === tornLecturaRef.current) {
        setSafata(resultat);
      }
    } catch {
      if (torn === tornLecturaRef.current) {
        setAvisGlobal({ to: 'error', text: tx.errorRevisio });
      }
    } finally {
      if (torn === tornLecturaRef.current) {
        setCarregant(false);
      }
    }
  }, [filtre, configEfectiva, port, tx.errorRevisio]);

  useEffect(() => {
    refresca(filtre);
  }, [filtre, refresca]);

  const canviaJustificacio = (id, valor) => {
    setJustificacions((prev) => ({ ...prev, [id]: valor }));
    setTocats((prev) => ({ ...prev, [id]: true }));
    if (errorsCamp[id] && valor.trim().length > 0) {
      setErrorsCamp((prev) => {
        const next = { ...prev };
        delete next[id];
        return next;
      });
    }
  };

  const validaEnEixirDelCamp = (id) => {
    if (!tocats[id]) return;
    const actual = String(justificacions[id] || '').trim();
    if (!actual) {
      setErrorsCamp((prev) => ({ ...prev, [id]: true }));
    }
  };

  const decideix = async (fila, nouEstat) => {
    if (enviantId) return;
    const textJustificacio = String(justificacions[fila.id] || '').trim();
    if (!textJustificacio) {
      setErrorsCamp((prev) => ({ ...prev, [fila.id]: true }));
      textareaRefs.current[fila.id]?.focus?.();
      return;
    }

    setEnviantId(fila.id);
    setAvisGlobal(null);
    try {
      const rebut = await aplicaRevisioDenunciaDiligent(
        {
          id: fila.id,
          estatEsperat: fila.estat,
          versio: fila.versio,
          estat: nouEstat,
          justificacio: textJustificacio,
          config: configEfectiva,
          registreOperacions: registreOperacionsRef.current
        },
        port
      );
      setJustificacions((prev) => {
        const next = { ...prev };
        delete next[fila.id];
        return next;
      });
      setAvisGlobal({
        to: 'exit',
        text: rebut.repetida ? tx.exitDecisioRepetida : tx.exitDecisio
      });
      await refresca(filtre);
    } catch {
      setAvisGlobal({ to: 'error', text: tx.errorRevisio });
    } finally {
      setEnviantId(null);
    }
  };

  return (
    <article
      ref={arrelRef}
      className="sdp-admin-taxonomia sdp-safata-lssi"
      aria-label={tx.titolPanell}
      data-testid="safata-denuncies-diligents-admin"
    >
      <header className="sdp-admin-taxonomia__header">
        <div className="sdp-admin-taxonomia__badges">
          <Insignia to="primari">{tx.insigniaProtocol}</Insignia>
          <Insignia to="neutre">{tx.insigniaAppendOnly}</Insignia>
        </div>
        <p>{tx.resumPanell}</p>
        <p className="sdp-safata-lssi__nota-audit" data-testid="nota-audit-ampliacions-lssi">
          {tx.notaAuditAmpliacions}
        </p>
      </header>

      <section className="sdp-admin-taxonomia__panel">
        <div className="sdp-safata-lssi__barra">
          <div className="sdp-safata-lssi__filtres" role="group" aria-label={tx.grupFiltresAria}>
            {FILTRES_SAFATA_LSSI.map((f) => (
              <Boto
                key={f}
                varietat={filtre === f ? 'primari' : 'secundari'}
                className="sdp-safata-lssi__boto"
                aria-pressed={filtre === f}
                onClick={() => setFiltre(f)}
                data-testid={`filtre-safata-lssi-${f}`}
              >
                {etiquetaFiltre(f, tx)}
              </Boto>
            ))}
          </div>

          <Boto
            varietat="secundari"
            className="sdp-safata-lssi__boto"
            disabled={carregant || Boolean(enviantId)}
            onClick={() => refresca(filtre)}
          >
            {carregant ? tx.carregant : tx.botoRefresca}
          </Boto>
        </div>

        {avisGlobal ? (
          <Alerta to={avisGlobal.to} onTanca={() => setAvisGlobal(null)}>
            {avisGlobal.text}
          </Alerta>
        ) : null}

        {!safata.disponibleRemot ? (
          <Alerta to="info">
            <p data-testid="avis-safata-lssi-mode-local">{tx.modeLocalAvis}</p>
          </Alerta>
        ) : null}

        {safata.disponibleRemot ? (
          <div aria-live="polite">
            <h3>{tx.titolLlistaRemota}</h3>
            {!carregant && safata.remotes.length === 0 ? (
              <p role="status">{tx.buitRemot}</p>
            ) : null}

            {safata.remotes.length > 0 ? (
              <ul className="sdp-safata-lssi__llista" aria-label={tx.titolLlistaRemota}>
                {safata.remotes.map((fila) => {
                  const accions = accionsTransicioPermeses(fila.estat);
                  const campId = `${baseId}-just-${fila.id}`;
                  const ajudaId = `${baseId}-ajuda-${fila.id}`;
                  const errorId = `${baseId}-err-${fila.id}`;
                  const teError = Boolean(errorsCamp[fila.id]);
                  const enviantAquesta = enviantId === fila.id;
                  const describedBy = teError ? `${ajudaId} ${errorId}` : ajudaId;

                  return (
                    <li
                      key={fila.id}
                      className="sdp-safata-lssi__fitxa"
                      data-testid={`fitxa-denuncia-lssi-${fila.id}`}
                    >
                      <div className="sdp-safata-lssi__fitxa-cap">
                        <h4 className="sdp-safata-lssi__fitxa-titol">
                          <code>{fila.id.slice(0, 8)}</code> · {etiquetaMotiuDenuncia(fila.motiu, fila.submotiuLssi, tx)}
                        </h4>
                        <Insignia to={fila.estat === 'rebuda' ? 'avis' : fila.estat === 'en_revisio' ? 'primari' : 'neutre'}>
                          {etiquetaEstatDenuncia(fila.estat, tx)}
                        </Insignia>
                      </div>

                      <div className="sdp-safata-lssi__metadades">
                        <p className="sdp-safata-lssi__dada">
                          <strong>{tx.campPublicacio}:</strong> <code>{fila.publicacioId}</code>
                        </p>
                        <p className="sdp-safata-lssi__dada">
                          <strong>{tx.campVersioCas}:</strong> <code>v{fila.versio}</code>
                        </p>
                        <p className="sdp-safata-lssi__dada">
                          <strong>{tx.campData}:</strong>{' '}
                          {fila.creatAl ? <time dateTime={fila.creatAl}>{fila.creatAl}</time> : tx.dataNoExposada}
                        </p>
                        {fila.recompte !== null ? (
                          <p className="sdp-safata-lssi__dada">
                            <strong>{tx.campRecompte}:</strong> {fila.recompte}
                          </p>
                        ) : null}
                      </div>

                      <p className="sdp-safata-lssi__detall">
                        <strong>{tx.campDetall}:</strong> {fila.detall || tx.senseDetall}
                      </p>

                      <div className="sdp-safata-lssi__ampliacions">
                        <strong>{tx.campAmpliacions}:</strong>
                        {fila.ampliacions.length > 0 ? (
                          <ul className="sdp-safata-lssi__ampliacions-llista">
                            {fila.ampliacions.map((amp, idx) => (
                              <li key={`${fila.id}-amp-${idx}`}>
                                {amp.detall}
                                {amp.creatAl ? ` (${amp.creatAl})` : ''}
                              </li>
                            ))}
                          </ul>
                        ) : (
                          <span>{tx.senseAmpliacionsDto}</span>
                        )}
                      </div>

                      {accions.length > 0 ? (
                        <form
                          className="sdp-safata-lssi__formulari"
                          noValidate
                          onSubmit={(e) => {
                            e.preventDefault();
                            decideix(fila, accions[0]);
                          }}
                        >
                          <label htmlFor={campId} className="sdp-safata-lssi__etiqueta">
                            {tx.labelJustificacio} <span aria-hidden="true">*</span>
                          </label>
                          <p id={ajudaId} className="sdp-safata-lssi__ajuda">
                            {tx.ajudaJustificacio}
                          </p>
                          <textarea
                            id={campId}
                            name={`justificacio-${fila.id}`}
                            ref={(el) => { textareaRefs.current[fila.id] = el; }}
                            className="sdp-safata-lssi__textarea"
                            rows={3}
                            maxLength={2000}
                            required
                            aria-invalid={teError ? 'true' : 'false'}
                            aria-describedby={describedBy}
                            value={justificacions[fila.id] || ''}
                            onChange={(e) => canviaJustificacio(fila.id, e.target.value)}
                            onBlur={() => validaEnEixirDelCamp(fila.id)}
                          />
                          {teError ? (
                            <p id={errorId} role="alert" className="sdp-safata-lssi__error-camp">
                              {tx.errorJustificacioBuida}
                            </p>
                          ) : null}

                          <div className="sdp-safata-lssi__accions">
                            {accions.map((estatDesti, idx) => (
                              <Boto
                                key={estatDesti}
                                tipus={idx === 0 ? 'submit' : 'button'}
                                varietat={idx === 0 ? 'primari' : 'secundari'}
                                className="sdp-safata-lssi__boto"
                                disabled={Boolean(enviantId)}
                                onClick={idx === 0 ? undefined : () => decideix(fila, estatDesti)}
                                data-testid={`accio-lssi-${fila.id}-${estatDesti}`}
                              >
                                {enviantAquesta ? tx.enviantDecisio : etiquetaAccioTransicio(estatDesti, tx)}
                              </Boto>
                            ))}
                          </div>
                        </form>
                      ) : null}
                    </li>
                  );
                })}
              </ul>
            ) : null}
          </div>
        ) : null}

        {safata.cuaLocalPendent.length > 0 ? (
          <div data-testid="bloc-cua-local-denuncies">
            <h3>{tx.titolCuaLocal}</h3>
            <p className="sdp-muted">{tx.resumCuaLocal}</p>
            <ul className="sdp-safata-lssi__llista" aria-label={tx.titolCuaLocal}>
              {safata.cuaLocalPendent.map((local) => (
                <li key={local.denunciaId || local.recursId} className="sdp-safata-lssi__fitxa">
                  <div className="sdp-safata-lssi__fitxa-cap">
                    <h4 className="sdp-safata-lssi__fitxa-titol">
                      {local.titol || local.recursId}
                    </h4>
                    <Insignia to="avis">{local.motiu}</Insignia>
                  </div>
                  <p className="sdp-safata-lssi__detall">
                    {local.detall || tx.senseDetall}
                  </p>
                </li>
              ))}
            </ul>
          </div>
        ) : null}
      </section>
    </article>
  );
}

export default SafataDenunciesDiligentsAdmin;
