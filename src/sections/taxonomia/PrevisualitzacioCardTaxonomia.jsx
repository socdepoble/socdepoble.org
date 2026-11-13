import { useCallback, useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { UniversalCard } from '../../components/PedraSeca/organismes/UniversalCard.jsx';
import { DEFAULT_AUTHOR } from '../../components/universal/UniversalUtils.js';
import { useCoreContent } from '../../app/contexts/CoreContentContext.jsx';
import { encapcalamentDeTargeta } from '../../components/universal/editorial.js';
import { useTraductorOpcional } from '../../components/PedraSeca/hooks/useTraductorOpcional.js';

const fontsDePresentacio = (frame) => [...new Set([
  frame.closest('.sdp-root'), frame.closest('[data-theme]'), frame.closest('[data-contrast]'),
  frame.getRootNode().host, frame.ownerDocument.documentElement,
].filter(Boolean))];

/** El viewport és real; el zoom CSS només reduïx la representació externa. */
export function PrevisualitzacioCardTaxonomia({ amplaria, article, etapa = '' }) {
  const { personalitzacio } = useCoreContent();
  const t = useTraductorOpcional();
  const estilActiu = personalitzacio?.estil?.payload;
  const iframe = useRef(null);
  const contingut = useRef(null);
  const [doc, setDoc] = useState(null);
  const [alcaria, setAlcaria] = useState(640);
  const [creat] = useState(() => new Date().toISOString());
  const [fullsOpacs, setFullsOpacs] = useState(0);
  const prepara = useCallback(() => {
    const frame = iframe.current;
    const destination = frame?.contentDocument;
    if (!destination?.head || !destination.body) return;
    const root = frame.getRootNode();
    destination.head.querySelectorAll('[data-sdp-preview-style]').forEach((node) => node.remove());
    let opacs = 0;
    const arrels = root === frame.ownerDocument ? [root] : [frame.ownerDocument, root];
    for (const arrel of arrels) {
      const contenidor = arrel.head || arrel;
      contenidor.querySelectorAll('style,link[rel="stylesheet"]').forEach((font) => {
        const copia = font.cloneNode(true);
        copia.setAttribute('data-sdp-preview-style', '');
        destination.head.appendChild(copia);
      });
      for (const full of arrel.adoptedStyleSheets || []) {
        try {
          const copia = destination.createElement('style');
          copia.setAttribute('data-sdp-preview-style', 'adoptat');
          copia.textContent = Array.from(full.cssRules).map((regla) => regla.cssText).join('\n');
          destination.head.appendChild(copia);
        } catch { opacs += 1; }
      }
    }
    setFullsOpacs(opacs);
    destination.documentElement.lang = 'ca';
    for (const atribut of ['data-theme', 'data-contrast']) {
      const valor = fontsDePresentacio(frame).find((element) => element.hasAttribute(atribut))?.getAttribute(atribut);
      if (valor) destination.documentElement.setAttribute(atribut, valor);
      else destination.documentElement.removeAttribute(atribut);
    }
    destination.body.className = 'sdp-taxonomia__preview-cos';
    const origenCrom = frame.closest('.sdp-root');
    if (contingut.current && origenCrom) {
      const desti = contingut.current.style;
      for (const nom of Array.from(desti)) if (nom.startsWith('--sdp-')) desti.removeProperty(nom);
      for (const nom of Array.from(origenCrom.style)) if (nom.startsWith('--sdp-')) desti.setProperty(nom, origenCrom.style.getPropertyValue(nom), origenCrom.style.getPropertyPriority(nom));
    }
    setDoc(destination);
  }, []);
  useEffect(() => {
    let viu = true;
    prepara();
    queueMicrotask(() => { if (viu) prepara(); });
    const frame = iframe.current;
    if (!frame || typeof MutationObserver !== 'function') return;
    const observer = new MutationObserver(prepara);
    fontsDePresentacio(frame).forEach((element) => observer.observe(element, { attributes: true, attributeFilter: ['data-theme', 'data-contrast', 'style'] }));
    return () => { viu = false; observer.disconnect(); };
  }, [prepara, estilActiu]);
  useEffect(() => { if (doc) prepara(); }, [doc, prepara]);
  useEffect(() => {
    const node = contingut.current;
    if (!doc || !node || typeof ResizeObserver !== 'function') return;
    const mesura = () => {
      const mida = Math.ceil(node.getBoundingClientRect().height || node.scrollHeight);
      if (mida > 0) setAlcaria(mida + 16);
    };
    const observer = new ResizeObserver(mesura);
    observer.observe(node);
    mesura();
    return () => observer.disconnect();
  }, [doc, article]);
  return <section className="sdp-taxonomia__preview" aria-label={`Targeta real en viewport de ${amplaria} píxels${etapa ? ` · ${etapa}` : ''}`}>
    <h4>{amplaria} px{etapa ? ` · ${etapa}` : ''}</h4>
    {fullsOpacs > 0 && <p role="alert">No es poden llegir {fullsOpacs} fulls d’estil de l’amfitrió; aquesta mostra no acredita la paritat visual.</p>}
    <iframe ref={iframe} width={amplaria} height={alcaria} title={`UniversalCard a ${amplaria} px${etapa ? ` · ${etapa}` : ''}`} tabIndex={-1} aria-hidden="true"
      className={amplaria === 375 ? 'sdp-taxonomia__frame sdp-taxonomia__frame--mobil' : 'sdp-taxonomia__frame sdp-taxonomia__frame--escriptori'} onLoad={prepara}/>
    {doc && createPortal(<div ref={contingut} className="sdp-root sdp-taxonomia__preview-contingut" inert="">
      <UniversalCard title={article?.title || 'Proposta de classificació'} subtitle="Simulació del laboratori" labels={article?.labels || []}
        {...encapcalamentDeTargeta({ created_at: creat }, { author: DEFAULT_AUTHOR.name, location: DEFAULT_AUTHOR.location, t })}
        authorHref={DEFAULT_AUTHOR.href} avatarUrl={DEFAULT_AUTHOR.avatarUrl} hasFooter={false} traduccio={false}
        body={<p>Els noms són un esborrany. La publicació original conserva la classificació.</p>}/>
    </div>, doc.body)}
  </section>;
}
