/**
 * LectorSkillWiki.jsx — D4 Opció B (v1.2.26 · Lector complet diferit de skills).
 *
 * Carregat sempre via `lazyRoute` des de WikiDePobleSection (+0 B al nucli WP).
 * Baixa a demanda el fitxer Markdown oficial `/md/skills/<name>.md` generat per
 * C26-4, retira el frontmatter YAML en temps lineal (zero ReDoS) i el pinta amb
 * UniversalPage, quadre tècnic accessible, enllaç a l'Explorador de la Consola
 * i botó de descàrrega directa `.md`.
 */
import { useEffect, useMemo, useState } from 'react';
import { Download, Network } from 'lucide-react';
import { UniversalPage } from '../../components/universal/UniversalPage.jsx';
import { COPYRIGHT_SDP } from '../../components/universal/editorial.js';
import { Carregant } from '../../components/PedraSeca/atoms/estats.jsx';
import { Alerta } from '../../components/PedraSeca/molecules/Alerta.jsx';
import { Link } from '../../app/contexts/RouterContext.jsx';
import { resolveAsset, resolRecursosDeHtml } from '../../config/assetResolver.js';
import { sanitizeHtml } from '../../utils/sanitize.js';
import { extreuEditorial, parseMarkdown, parseMarkdownEnLinia } from './parseMarkdown.js';
import { textosWikiV26 } from './i18nWikiV26.js';
import { esUrlSkillSegura } from './useSkillsPubliques.js';

/** Retira un bloc frontmatter YAML al principi del fitxer en temps O(n). */
export function retiraFrontmatterLineal(brut) {
  const text = String(brut || '').replace(/\r\n/g, '\n');
  if (!text.startsWith('---\n')) return text;
  const fi = text.indexOf('\n---', 4);
  if (fi === -1) return text;
  const despres = text.indexOf('\n', fi + 4);
  return despres === -1 ? '' : text.slice(despres + 1).trimStart();
}

function formatBytes(bytes) {
  if (!Number.isFinite(bytes) || bytes <= 0) return '0 B';
  if (bytes < 1024) return `${bytes} B`;
  return `${(bytes / 1024).toFixed(1).replace('.', ',')} KB`;
}

export default function LectorSkillWiki({ item, idioma = 'ca' }) {
  const tx = textosWikiV26(idioma);
  const skill = item?.skill || null;
  const urlSegura = skill && esUrlSkillSegura(skill.url) ? skill.url : null;
  const [estat, setEstat] = useState({ url: null, text: '', error: false, carregant: Boolean(urlSegura) });

  useEffect(() => {
    if (!urlSegura || typeof globalThis.fetch !== 'function') {
      setEstat({ url: urlSegura, text: '', error: true, carregant: false });
      return undefined;
    }
    const controlador = typeof AbortController === 'function' ? new AbortController() : null;
    let viu = true;
    setEstat({ url: urlSegura, text: '', error: false, carregant: true });
    globalThis.fetch(resolveAsset(urlSegura), {
      headers: { Accept: 'text/markdown, text/plain;q=0.9, */*;q=0.1' },
      /* v1.2.26 · G26-3 (Vigilant de Tellado, TELLADO-R3214-40) · Fitxer públic del paquet:
         sense galetes ni credencials i sense seguir cap redirecció fora de /md/skills/. */
      credentials: 'omit',
      redirect: 'error',
      ...(controlador ? { signal: controlador.signal } : {})
    })
      .then((res) => (res && res.ok ? res.text() : Promise.reject(new Error(`http_${res?.status ?? 0}`))))
      .then((text) => {
        if (viu) setEstat({ url: urlSegura, text, error: false, carregant: false });
      })
      .catch(() => {
        if (viu) setEstat({ url: urlSegura, text: '', error: true, carregant: false });
      });
    return () => {
      viu = false;
      controlador?.abort?.();
    };
  }, [urlSegura]);

  const cosNet = useMemo(() => retiraFrontmatterLineal(estat.text), [estat.text]);
  const editorial = useMemo(() => extreuEditorial(cosNet), [cosNet]);
  const nomSkill = skill?.name || String(item?.id || '').replace(/^skill:/, '');
  const rutaGraf = `/consola/explorador?peca=${encodeURIComponent(`skill:${nomSkill}`)}`;
  const urlBaixada = urlSegura ? resolveAsset(urlSegura) : null;
  const esEsborrany = item?.esborrany === true || skill?.esborrany === true;

  const labels = [
    { text: 'Sistema', className: 'sdp-badge-system' },
    { text: tx.wikidepobleSkillsCarpeta, className: 'sdp-badge-category' },
    ...(esEsborrany ? [{ text: tx.wikidepobleEsborranyEtiqueta, className: 'sdp-badge-category' }] : []),
    ...(skill?.tags || []).map((tag) => ({ text: tag, className: 'sdp-badge-tag' }))
  ];

  const entradeta = editorial.entradilla
    ? <span dangerouslySetInnerHTML={{ __html: sanitizeHtml(resolRecursosDeHtml(parseMarkdownEnLinia(editorial.entradilla)), { enllacosEditorials: true }) }} />
    : (skill?.description || null);

  return (
    <UniversalPage
      chrome="context"
      title={editorial.titol || skill?.title || item?.title || nomSkill}
      subtitle={nomSkill}
      lead={entradeta}
      labels={labels}
      showLogos={true}
      copyright={COPYRIGHT_SDP}
      llenguaDelContingut="ca"
    >
      {esEsborrany ? (
        <Alerta to="avis" viva={false} titol={tx.wikidepobleEsborranyTitol}>
          {tx.wikidepobleEsborranyCos}
        </Alerta>
      ) : null}

      <div className="sdp-article">
        <h3>{tx.wikidepobleSkillsQuadreTitol}</h3>
        <table aria-label={tx.wikidepobleSkillsQuadreTitol}>
          <tbody>
            <tr>
              <th scope="row">{tx.wikidepobleSkillsIdentificador}</th>
              <td><code>{nomSkill}</code></td>
            </tr>
            <tr>
              <th scope="row">{tx.wikidepobleSkillsNucli}</th>
              <td>{skill?.core ? tx.wikidepobleSkillsNucliSi : tx.wikidepobleSkillsNucliNo}</td>
            </tr>
            <tr>
              <th scope="row">{tx.wikidepobleSkillsEtiquetes}</th>
              <td>{skill?.tags?.length ? skill.tags.join(', ') : tx.wikidepobleSkillsCapEtiqueta}</td>
            </tr>
            {skill?.bytes ? (
              <tr>
                <th scope="row">{tx.wikidepobleSkillsMida}</th>
                <td>{formatBytes(skill.bytes)}</td>
              </tr>
            ) : null}
            {urlSegura ? (
              <tr>
                <th scope="row">{tx.wikidepobleSkillsFontUnica}</th>
                <td><code>{urlSegura}</code></td>
              </tr>
            ) : null}
          </tbody>
        </table>
        <div className="sdp-alerta__accions">
          {urlBaixada ? (
            <a className="sdp-boto sdp-boto--primari" href={urlBaixada} download={`${nomSkill}.md`}>
              <Download size={16} aria-hidden="true" /> {tx.wikidepobleSkillsBaixaMd}
            </a>
          ) : null}
          <Link className="sdp-boto sdp-boto--secundari" to={rutaGraf}>
            <Network size={16} aria-hidden="true" /> {tx.wikidepobleSkillsVeureAlGraf}
          </Link>
        </div>
      </div>

      {estat.carregant ? (
        <Carregant etiqueta={tx.wikidepobleSkillsCarregantFitxa} />
      ) : estat.error ? (
        <Alerta to="error" titol={tx.wikidepobleSkillsErrorFitxa}>
          {tx.wikidepobleSkillsSubtitol}
        </Alerta>
      ) : (
        <div
          className="sdp-prose"
          lang="ca"
          dangerouslySetInnerHTML={{ __html: sanitizeHtml(resolRecursosDeHtml(parseMarkdown(editorial.cos || cosNet, { entradilla: false })), { llistesNumerades: true, enllacosEditorials: true }) }}
        />
      )}
    </UniversalPage>
  );
}
