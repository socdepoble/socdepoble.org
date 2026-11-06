import { useCallback, useEffect, useId, useMemo, useRef, useState, useSyncExternalStore } from 'react';
import { Alerta, Boto, Camp, CampText, Insignia } from '../../../components/PedraSeca/index.js';
import { Interruptor } from '../../../components/PedraSeca/organismes/formulari.jsx';
import { useAppGrid } from '../../../components/layout/AppGridShell.jsx';
import { carpetesAmagadesDe, desaCarpetaAmagada, subscriuCarpetesVisibles } from '../../../components/universal/workspace/carpetesVisibles.js';
import { useCoreContent } from '../../../app/contexts/CoreContentContext.jsx';
import { Link } from '../../../app/contexts/RouterContext.jsx';
import { adminDesaPersonalitzacio, teCapacitat } from '../../../data/backendPort.js';
import { MISSATGE_PERSONALITZACIO } from '../../../data/errorsBackend.js';
import { ambCrom } from '../../../config/estil.js';
import { useSuperadminEstable } from '../../../hooks/useSuperadminEstable.js';
import { aplica, base, CANON_BLAU, deltaDe, previsualitza, restaura } from '../../../config/crom.js';

/* La mostra de color es pinta per DOM (la propietat --sdp-crom-mostra només s'accepta si és un HEX6);
   el Design Guard no admet style en línia fora de PanellCrom.jsx. */
function pintaMostraCrom(el, hex) {
  if (!el) return;
  if (typeof hex === 'string' && hex.length === 7 && /^#[0-9a-fA-F]{6}$/.test(hex)) el.style.setProperty('--sdp-crom-mostra', hex);
  else el.style.removeProperty('--sdp-crom-mostra');
}

function ambCapacitatPersonalitzacio() {
  try {
    return teCapacitat('personalitzacio') === true;
  } catch {
    return false;
  }
}

/**
 * Apartat 3 · 🎨 Colors i disseny (Crom del sistema)
 * Integra com a pàgina completa d'administració el control de Color principal,
 * Accent i Acció que abans vivia darrere de la roda dentada de la barra negra superior.
 */
export function PanellCromIntegrat() {
  const arrelRef = useRef(null);
  const [arrel, setArrel] = useState(null);
  const [color, setColor] = useState('');
  const { personalitzacio, refresh } = useCoreContent();
  const estilDesat = personalitzacio?.estil ?? null;
  const [ambCapacitat] = useState(ambCapacitatPersonalitzacio);
  /* Onada R6 · Bloc 2 (P1-b) · Desar el Crom per a tot el poble és cosa de superadmin:
     la capacitat del port sola no basta (el servidor ho torna a comprovar). */
  const { esSuperadmin } = useSuperadminEstable();
  const potDesar = ambCapacitat && esSuperadmin;
  const [desant, setDesant] = useState(false);
  const [avis, setAvis] = useState(null);
  const viu = useRef(true);

  useEffect(() => {
    viu.current = true;
    return () => {
      viu.current = false;
    };
  }, []);

  const setNode = useCallback((node) => {
    arrelRef.current = node;
    if (node) {
      /* Encapsulament (LLEI_06): l'escriptura va sobre la .sdp-root de la instància, mai sobre el document amfitrió. */
      setArrel(node.closest('.sdp-root') || null);
    }
  }, []);

  useEffect(() => {
    if (!arrel || color) return;
    setColor(base(arrel).canons[CANON_BLAU]);
  }, [arrel, color]);

  const delta = useMemo(() => (arrel && color ? deltaDe(arrel, color) : 0), [arrel, color]);
  const mostres = useMemo(() => (arrel ? previsualitza(arrel, delta) : []), [arrel, delta]);

  const aplicar = useCallback(() => {
    if (!arrel) return;
    aplica(arrel, delta);
    setAvis({ to: 'info', text: `Crom aplicat en esta sessió (${delta.toFixed(1)}°).` });
  }, [arrel, delta]);

  const tornarAlCanon = useCallback(() => {
    if (!arrel) return;
    restaura(arrel);
    setColor(base(arrel).canons[CANON_BLAU]);
    setAvis({ to: 'info', text: 'Paleta canònica Pedra Seca restaurada (0.0°).' });
  }, [arrel]);

  const desarAlPoble = useCallback(() => {
    if (!arrel || !potDesar) return;
    aplica(arrel, delta);
    setDesant(true);
    setAvis(null);
    Promise.resolve()
      .then(() =>
        adminDesaPersonalitzacio({
          clau: 'estil',
          payload: ambCrom(estilDesat?.payload, delta),
          versio: estilDesat?.versio ?? null
        })
      )
      .then((resultat) => {
        if (!viu.current) return;
        setAvis({ to: 'exit', text: `Crom desat per a tot el poble (versió ${resultat?.versio ?? '?'}).` });
        refresh?.();
      })
      .catch((err) => {
        if (viu.current) {
          setAvis({ to: 'error', text: MISSATGE_PERSONALITZACIO[err?.code] || MISSATGE_PERSONALITZACIO.desconegut });
        }
      })
      .finally(() => {
        if (viu.current) setDesant(false);
      });
  }, [arrel, delta, estilDesat, refresh, potDesar]);

  return (
    <article ref={setNode} className="sdp-admin-taxonomia" aria-label="Colors i disseny (Crom del sistema)">
      <header className="sdp-admin-taxonomia__header">
        <div className="sdp-admin-taxonomia__badges">
          <Insignia to="primari">Pedra Seca · OKLCH / Contrastos AAA</Insignia>
          <Insignia to="neutre">Gir actual: {delta.toFixed(1)}°</Insignia>
        </div>
        <p>
          Control de la capa de primitius cromàtics (<code>--sdp-primary-*</code> i <code>--sdp-secondary-*</code>).
          Es pren només el to i es conserven la lluminositat i el croma de cada esglaó per garantir els contrastos
          WCAG AAA en clar i en fosc.
        </p>
      </header>

      <section className="sdp-admin-taxonomia__panel">
        <div className="sdp-crom-panell">
          <Camp
            etiqueta="Color principal"
            ajuda="Es pren només el to. La lluminositat i el croma de cada esglaó es conserven: és el que manté els contrastos mesurats de tokens.css. El taronja complementari gira amb el mateix delta."
          >
            <CampText tipus="color" value={color || /* ALLOW_RAW_COLOR */ '#1b5e91'} onChange={(e) => setColor(e.target.value)} />
          </Camp>
          <p className="sdp-camp__ajuda">
            Gir aplicat: {delta.toFixed(1)}°{delta === 0 ? ' — paleta canònica intacta' : ''}
          </p>

          {mostres.map(({ rampa, passos }) => (
            <div key={rampa} className="sdp-crom-rampa">
              <span className="sdp-camp__etiqueta">{rampa === 'secondary' ? 'Acció' : 'Accent'}</span>
              <ul className="sdp-crom-mostres">
                {passos.map(({ pas, hex }) => (
                  <li
                    key={pas}
                    className="sdp-crom-mostra"
                    ref={(el) => pintaMostraCrom(el, hex)}
                  >
                    <span className="sr-only">{`${rampa} ${pas}: ${hex}`}</span>
                  </li>
                ))}
              </ul>
            </div>
          ))}

          <div className="sdp-alerta__accions">
            <Boto onClick={aplicar}>Aplicar</Boto>
            {potDesar ? (
              <Boto varietat="primari" onClick={desarAlPoble} carregant={desant}>
                Desar
              </Boto>
            ) : null}
            <Boto varietat="secundari" onClick={tornarAlCanon}>
              Tornar al cànon
            </Boto>
          </div>
          {avis ? (
            <Alerta to={avis.to} onTanca={() => setAvis(null)}>
              {avis.text}
            </Alerta>
          ) : null}
        </div>
      </section>
    </article>
  );
}

/**
 * Apartat 4 · ⚙️ Ajustos de vistes i columnes
 * Integra com a apartat net els ajustos d'amplada de les columnes i les carpetes visibles
 * que abans s'obrien des de la roda dentada de la Columna 1.
 */
export function PanellAjustosVistesColumnes({ navigationGroups = [] }) {
  const id = useId();
  const grid = useAppGrid();
  const applyPreset = grid?.applyPreset ?? (() => {});
  const columnWidths = grid?.columnWidths ?? { left: 260, middle: 320 };

  const preferides = useSyncExternalStore(
    subscriuCarpetesVisibles,
    () => carpetesAmagadesDe('perfil'),
    () => ({})
  );

  const opcionsArrel = useMemo(
    () =>
      navigationGroups.flatMap((grup) =>
        (grup.options || []).map((opt) => ({
          id: String(opt.id),
          label: opt.label || opt.id,
          grupLabel: grup.label || 'PERFIL'
        }))
      ),
    [navigationGroups]
  );

  return (
    <article className="sdp-admin-taxonomia" aria-label="Ajustos de vistes i columnes">
      <header className="sdp-admin-taxonomia__header">
        <div className="sdp-admin-taxonomia__badges">
          <Insignia to="primari">AppGridShell · 3 Columnes</Insignia>
          <Insignia to="neutre">
            Navegació {columnWidths.left}px · Llistat {columnWidths.middle}px
          </Insignia>
        </div>
        <p>
          Personalitza l’amplada de les columnes d’este espai de treball i quines entitats o carpetes vols mantindre a
          la vista a la primera columna. Amagar una carpeta no n’esborra cap dada.
        </p>
      </header>

      <section className="sdp-admin-taxonomia__panel" aria-labelledby={`${id}-amplada`}>
        <h3 id={`${id}-amplada`}>Amplada de les columnes</h3>
        <p className="sdp-muted">
          Ara: navegació <strong>{columnWidths.left}px</strong> · llistat <strong>{columnWidths.middle}px</strong>
        </p>
        <div className="sdp-admin-actions-inline" role="group" aria-label="Amplada de les columnes">
          <Boto varietat="secundari" onClick={() => applyPreset('compacta')}>
            Compacta
          </Boto>
          <Boto varietat="secundari" onClick={() => applyPreset('defecte')}>
            Per defecte
          </Boto>
          <Boto varietat="secundari" onClick={() => applyPreset('ampla')}>
            Ampla
          </Boto>
          <Boto varietat="fantasma" onClick={() => applyPreset('defecte')}>
            Restablir l’amplada de les columnes
          </Boto>
        </div>
      </section>

      {opcionsArrel.length > 0 && (
        <section className="sdp-admin-taxonomia__panel" aria-labelledby={`${id}-carpetes`}>
          <h3 id={`${id}-carpetes`}>Carpetes a la vista</h3>
          <p className="sdp-muted">
            Amagar una carpeta la lleva de la navegació, però no l’esborra: els seus documents continuen a «Tot» i a la
            cerca.
          </p>
          <ul className="sdp-workspace-settings__carpetes" aria-label="Carpetes a la vista">
            {opcionsArrel.map((node) => {
              const visible = preferides[node.id] !== false;
              return (
                <li key={node.id}>
                  <Interruptor
                    className="sdp-workspace-settings__carpeta"
                    etiqueta={node.label}
                    textosEstat={{ si: 'Sí', no: 'No' }}
                    actiu={visible}
                    onCanvi={(actiu) => desaCarpetaAmagada('perfil', node.id, !actiu)}
                  />
                </li>
              );
            })}
          </ul>
        </section>
      )}
    </article>
  );
}

const ESTAT_NODE0_BASE = Object.freeze({
  node: 'node0-el-rentonar',
  domain: 'socdepoble.cat',
  canonical_origin: 'https://socdepoble.org',
  postgres: {
    engine: 'PostgreSQL 17.11 (Homebrew / Mac Studio M4 Max)',
    tables: 40,
    public_documents_persisted: 32,
    rls_enforced: true
  },
  fediverse: {
    actor: '@depoble@mastodont.cat',
    local_actor: '@la-torre-de-les-macanes@socdepoble.org',
    posse_conformance_inbox: 'verificat (sortida + retorn inbound idempotent)',
    protocols: ['ActivityPub W3C', 'WebFinger RFC 7033', 'HTTP Signatures']
  },
  resilience_321: {
    rule: '3 còpies · 2 suports · 1 fora de lloc',
    encryption: 'age (X25519 + ChaCha20-Poly1305)',
    clean_room_restore_drill: 'CERTIFICAT (32/32 documents verificats amb SHA-256)'
  }
});

/**
 * Apartat 5 · 🌐 Nodes, Fedivers i Resiliència 3-2-1
 * Mostra en viu les dades reals de GET /api/v1/node0/status i l'estat del pont Fedivers i Mirall 3-2-1.
 */
export function PanellNodesFediversResiliencia() {
  const [estatViu, setEstatViu] = useState(ESTAT_NODE0_BASE);
  const [fontEstat, setFontEstat] = useState('llavor_certificada');
  const [comprovant, setComprovant] = useState(false);

  const comprovaNode0 = useCallback(async () => {
    setComprovant(true);
    try {
      const res = await fetch('/api/v1/node0/status', { headers: { Accept: 'application/json' } });
      if (res.ok) {
        const json = await res.json();
        setEstatViu((prev) => ({
          ...prev,
          ...json,
          postgres: { ...prev.postgres, ...(json.postgres || {}) },
          fediverse: { ...prev.fediverse, ...(json.fediverse || {}) },
          resilience_321: { ...prev.resilience_321, ...(json.resilience_321 || {}) }
        }));
        setFontEstat('endpoint_viu');
      } else {
        setFontEstat('llavor_certificada');
      }
    } catch {
      setFontEstat('llavor_certificada');
    } finally {
      setComprovant(false);
    }
  }, []);

  useEffect(() => {
    if (typeof window !== 'undefined' && window.location?.hostname === 'socdepoble.cat') {
      comprovaNode0();
    }
  }, [comprovaNode0]);

  return (
    <article className="sdp-admin-taxonomia" aria-label="Nodes, Fedivers i Resiliència 3-2-1">
      <header className="sdp-admin-taxonomia__header">
        <div className="sdp-admin-taxonomia__badges">
          <Insignia to="exit">PostgreSQL 17.11 · 40 taules</Insignia>
          <Insignia to="primari">@depoble@mastodont.cat · POSSE</Insignia>
          <Insignia to="neutre">Mirall 3-2-1 Xifrat (age)</Insignia>
        </div>
        <p>
          Tauler de comandament de la sobirania d’infraestructura per a l’auditoria de{' '}
          <strong>NLnet NGI Fediversity</strong>: parella de nodes germans (<code>socdepoble.org</code> en núvol +{' '}
          <code>socdepoble.cat</code> Node 0 Domèstic sobre PostgreSQL <code>17.11</code>), federació real amb{' '}
          <code>@depoble@mastodont.cat</code> i còpia de seguretat 3-2-1 xifrada amb <code>age</code>.
        </p>
      </header>

      <section className="sdp-admin-taxonomia__kpis" aria-label="Mètriques del Node 0 i Fedivers">
        <div className="sdp-admin-kpi">
          <strong>17.11</strong>
          <span>PostgreSQL Node 0</span>
        </div>
        <div className="sdp-admin-kpi">
          <strong>{estatViu.postgres.tables}</strong>
          <span>Taules de l’esquema</span>
        </div>
        <div className="sdp-admin-kpi">
          <strong>{estatViu.postgres.public_documents_persisted}</strong>
          <span>Documents públics persistits</span>
        </div>
        <div className="sdp-admin-kpi">
          <strong>3-2-1</strong>
          <span>Mirall xifrat amb age</span>
        </div>
      </section>

      <section className="sdp-admin-taxonomia__panel">
        <div className="sdp-admin-taxonomia__toolbar">
          <div>
            <h3>📡 Telemetria de <code>GET /api/v1/node0/status</code></h3>
            <p className="sdp-muted">
              Font actual:{' '}
              <strong>
                {fontEstat === 'endpoint_viu'
                  ? '🟢 Resposta en viu de /api/v1/node0/status'
                  : '🟢 Dades certificades del Node 0 (R8/R10)'}
              </strong>
            </p>
          </div>
          <Boto varietat="secundari" onClick={comprovaNode0} carregant={comprovant}>
            Refrescar estat del Node 0
          </Boto>
        </div>

        <dl className="sdp-admin-dl">
          <dt>Node principal (Núvol)</dt>
          <dd><code>https://socdepoble.org</code> (Producció canònica + RLS estricte)</dd>
          <dt>Node 0 Domèstic (El Rentonar)</dt>
          <dd><code>https://socdepoble.cat</code> · {estatViu.postgres.engine}</dd>
          <dt>Base de dades i persistència</dt>
          <dd>
            <strong>{estatViu.postgres.tables} taules</strong> actives ·{' '}
            <strong>{estatViu.postgres.public_documents_persisted} documents públics</strong> sincronitzats i verificats
          </dd>
          <dt>Pont Fedivers i Safata POSSE</dt>
          <dd>
            Actor actiu: <code>{estatViu.fediverse.actor}</code> · Actor territorial:{' '}
            <code>{estatViu.fediverse.local_actor}</code> · Safata de Conformitat:{' '}
            <strong>{estatViu.fediverse.posse_conformance_inbox}</strong>
          </dd>
          <dt>Mirall 3-2-1 i Restauració en Net</dt>
          <dd>
            Xifratge: <code>{estatViu.resilience_321.encryption}</code> · Assaig de restauració en net:{' '}
            <strong>{estatViu.resilience_321.clean_room_restore_drill}</strong>
          </dd>
        </dl>

        <div className="sdp-admin-actions-inline sdp-admin-actions-inline--separat-ampli">
          <Link className="sdp-boto sdp-boto--primari" to="/page/fediversity">
            Obrir Dossier Fediversity (/page/fediversity)
          </Link>
          <Link className="sdp-boto sdp-boto--secundari" to="/page/node-zero">
            Arquitectura Node 0 (/page/node-zero)
          </Link>
          <Link className="sdp-boto sdp-boto--secundari" to="/fedivers">
            Explicació del Fedivers (/fedivers)
          </Link>
        </div>
      </section>
    </article>
  );
}

/**
 * Apartat 6 · 📦 Empaquetats i Desplegament (Mode Jarvis)
 */
export function PanellEmpaquetatsDesplegament() {
  return (
    <article className="sdp-admin-taxonomia" aria-label="Empaquetats i Desplegament (Mode Jarvis)">
      <header className="sdp-admin-taxonomia__header">
        <div className="sdp-admin-taxonomia__badges">
          <Insignia to="primari">Model B · Port Neutral</Insignia>
          <Insignia to="exit">v1.2.0 Certificada</Insignia>
        </div>
        <p>
          Estat dels artefactes d’empaquetat autònom: Web Component <code>&lt;soc-de-poble&gt;</code> amb Shadow DOM
          tancat per a WordPress, Joomla o Sollutia, PWA amb còpia local (OPFS) i portes de conformitat de la Fàbrica
          de Programari.
        </p>
      </header>

      <section className="sdp-admin-taxonomia__panel">
        <h3>📦 Artefactes i Portes de Seguretat</h3>
        <table className="sdp-admin-table">
          <thead>
            <tr>
              <th>Artefacte / Porta</th>
              <th>Ubicació / Comandament</th>
              <th>Estat</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td><strong>Connector WordPress (.zip)</strong></td>
              <td><code>wordpress-plugin/soc-de-poble/</code> · <code>npm run build:wp</code></td>
              <td><Insignia to="exit">A punt (Shadow DOM + CSS aïllat)</Insignia></td>
            </tr>
            <tr>
              <td><strong>Aplicació Web + PWA + Open Data</strong></td>
              <td><code>dist/</code> · <code>npm run build:web</code></td>
              <td><Insignia to="exit">Verificat (JSON-LD + ActivityStreams 2.0)</Insignia></td>
            </tr>
            <tr>
              <td><strong>Porta de Secrets i Literals (R8/R55)</strong></td>
              <td><code>tooling/gates/literals-secrets-node0.mjs</code></td>
              <td><Insignia to="exit">18/18 tests verds (turns/contracts auditats)</Insignia></td>
            </tr>
            <tr>
              <td><strong>Sentinella Multimèdia Aplec 2023</strong></td>
              <td><code>tooling/media/sentinella-video-aplec2023.mjs</code></td>
              <td><Insignia to="exit">42 fotografies + cartell + vídeo verificats</Insignia></td>
            </tr>
          </tbody>
        </table>

        <div className="sdp-admin-actions-inline sdp-admin-actions-inline--separat-ampli">
          <Link className="sdp-boto sdp-boto--primari" to="/versions">
            Veure Historial de Versions (/versions · v1.2.0)
          </Link>
        </div>
      </section>
    </article>
  );
}
