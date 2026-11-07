import { afterEach, expect, test, vi } from 'vitest';
import { cleanup, fireEvent, render, within } from '@testing-library/react';
import { Editor } from '@tiptap/core';
import StarterKit from '@tiptap/starter-kit';
import { extensionsRiques } from '../../components/universal/richText/extensions/index.js';
import { SenseSubratllat } from '../../components/universal/richText/extensions/senseSubratllat.js';
import { renderRichText } from './detailRichText.jsx';
import { sanitizeHtml } from '../../utils/sanitize.js';
import { permetOrigenMitjans } from '../../utils/sanitize.js';
import { fixaBaseRecursos } from '../../config/assetResolver.js';
import { Aplec2023Article } from '../mur/articles/Aplec2023Article.jsx';
vi.mock('../../app/contexts/RouterContext', () => ({ useNavigate: () => vi.fn(), Link: 'a' }));
vi.mock('../../components/universal/NotificationContext.jsx', () => ({ useToast: () => ({ showToast: vi.fn() }) }));
const ID='TlZWYbnGuCE';
const marcador=`<div data-sdp-youtube="${ID}" data-titol="Reportatge del poble"><a href="https://www.youtube.com/watch?v=${ID}">Reserva</a></div>`;
afterEach(()=>{cleanup();fixaBaseRecursos('');});
/* Gauntlet R9 · G2-04 · Façana de clic: abans del gest no hi ha cap iframe; el clic obri el de cada vídeo. */
/* Gauntlet R10 · VFC-09 · El nom del botó és el text visible i, darrere, el títol del vídeo. */
const VEURE=/^Veure el vídeo \(YouTube\) /;
const obriVideos=root=>{const botons=within(root).queryAllByRole('button',{name:VEURE});for(const boto of botons)fireEvent.click(boto);return botons.length;};

test('R18 un vídeo desat per l’editor es torna a veure incrustat en lectura',()=>{
 const editor=new Editor({element:document.createElement('div'),extensions:[StarterKit.configure({underline:false}),SenseSubratllat,...extensionsRiques()],content:`<p>Abans</p>${marcador}<p>Després</p>`});
 try{
  const desat=sanitizeHtml(editor.getHTML());
  expect(desat).toContain('data-sdp-youtube');expect(desat).not.toContain('<iframe');
  const {container}=render(renderRichText(desat));
  expect(container.querySelector('iframe')).toBeNull();expect(obriVideos(container)).toBe(1);
  const iframe=container.querySelector('iframe');
  expect(iframe).not.toBeNull();
  expect(iframe.getAttribute('src')).toBe(`https://www.youtube-nocookie.com/embed/${ID}`);
  expect(iframe.title).toBe('Reportatge del poble');
  expect(container.textContent).toContain('Abans');expect(container.textContent).toContain('Després');
 }finally{editor.destroy();}
});

test('R18 marcador vàlid ignora URL, srcdoc, permisos i handlers hostils',()=>{
 const html=`<div data-sdp-youtube="${ID}" data-titol="&lt;script&gt; títol" src="https://intrus.test" srcdoc="atac" allow="camera" onload="alert(1)"><iframe src="https://intrus.test"></iframe><script>alert(1)</script></div>`;
 const {container}=render(renderRichText(html));
 expect(container.querySelector('iframe')).toBeNull();expect(obriVideos(container)).toBe(1);
 const frames=container.querySelectorAll('iframe');expect(frames).toHaveLength(1);
 expect(frames[0].src).toBe(`https://www.youtube-nocookie.com/embed/${ID}`);
 expect(frames[0].hasAttribute('srcdoc')).toBe(false);
 expect(frames[0].getAttribute('allow')).not.toContain('camera');
 expect(container.querySelector('[onload],script')).toBeNull();
 expect(sanitizeHtml(html)).not.toContain('<iframe');
});

test('R18 ids hostils i iframes enganxats continuen inerts',()=>{
 for(const id of ['javascript:alert(1)','https://intrus.test','TlZWYbnGuC','TlZWYbnGuCEx']){
  const {container,unmount}=render(renderRichText(`<div data-sdp-youtube="${id}"><a href="javascript:alert(1)">Reserva</a></div><iframe src="https://www.youtube-nocookie.com/embed/${ID}"></iframe>`));
  expect(container.querySelector('iframe,script,[href^="javascript:"]')).toBeNull();
  expect(container.textContent).toContain('Reserva');unmount();
 }
});

test('R18 vídeo niat conserva maquetació, taula, llengua i recursos propis d’amfitrió',()=>{
 fixaBaseRecursos('https://host.test/connector');permetOrigenMitjans('https://host.test/connector');
 const html=`<div class="aplec-2023__complement"><h3>Reportatge</h3>${marcador}<p class="aplec-2023__peu"><img src="/assets/events/aplec-2023/foto.jpg" width="400" height="300" alt="Paisatge">Peu</p><table><tbody><tr><td colspan="2">Memòria</td></tr></tbody></table></div>`;
 const {container}=render(renderRichText(html,{lang:'es'}));
 const article=container.querySelector('article');expect(article.lang).toBe('es');
 expect(article.querySelector('iframe')).toBeNull();expect(obriVideos(article)).toBe(1);
 const complement=article.querySelector('.aplec-2023__complement');expect(complement.querySelectorAll('iframe')).toHaveLength(1);
 expect(complement.querySelector('img').src).toBe('https://host.test/connector/assets/events/aplec-2023/foto.jpg');
 expect(complement.querySelector('img').width).toBe(400);
 expect(complement.querySelector('td').colSpan).toBe(2);
 expect(complement.querySelector('.aplec-2023__peu').textContent).toBe('Peu');
});

test('R18 text del costat d’una targeta real també hidrata el vídeo',()=>{
 const targeta='<div data-sdp-targetes="" class="sdp-targetes" data-forma="sola" data-alineacio="dreta"><div data-sdp-targeta="publicacio:7" data-ruta="/mur/7" data-titol="La crònica" data-autor="Pep"><a href="/mur/7">La crònica</a></div></div>';
 const {container}=render(renderRichText(`<p>Abans</p>${targeta}<div class="aplec-2023__complement">${marcador}</div><p>Després</p>`));
 expect(container.querySelectorAll('.sdp-targetes .sdp-targeta article.sp-card')).toHaveLength(1);
 expect(container.querySelector('iframe')).toBeNull();expect(obriVideos(container)).toBe(1);
 expect(container.querySelectorAll('iframe')).toHaveLength(1);
 expect(container.querySelector('.sdp-cos-tros .aplec-2023__complement iframe')).not.toBeNull();
 expect(container.textContent).toContain('Després');
});

test('R18 exemples de codi i mencions literals del marcador no creen iframes',()=>{
 const html=`<pre><code>&lt;div data-sdp-youtube="${ID}"&gt;</code></pre><p>data-sdp-youtube</p>`;
 const {container}=render(renderRichText(html));expect(container.querySelector('iframe')).toBeNull();
 expect(container.querySelector('article').innerHTML).toBe(sanitizeHtml(html));
});

test('R18 una edició nova substituïx el vídeo anterior sense duplicar-lo',()=>{
 const {container,rerender}=render(renderRichText(marcador));
 expect(obriVideos(container)).toBe(1);expect(container.querySelectorAll('iframe')).toHaveLength(1);
 /* El «sí» era del vídeo d'abans: el nou demana el seu clic. */
 const altre='dQw4w9WgXcQ';rerender(renderRichText(marcador.replaceAll(ID,altre)));
 expect(container.querySelector('iframe')).toBeNull();expect(obriVideos(container)).toBe(1);
 expect(container.querySelectorAll('iframe')).toHaveLength(1);
 expect(container.querySelector('iframe').src).toBe(`https://www.youtube-nocookie.com/embed/${altre}`);
});

test('R18 Aplec usa el vídeo editable del cos i conserva complement quan no hi ha marcador vàlid',()=>{
 const altre='dQw4w9WgXcQ';
 const {container,rerender}=render(<Aplec2023Article item={{content:`<h3>Edició</h3>${marcador.replaceAll(ID,altre)}`}}/>);
 expect(container.querySelector('iframe')).toBeNull();expect(obriVideos(container)).toBe(1);
 expect(container.querySelectorAll('iframe')).toHaveLength(1);
 expect(container.querySelector('iframe').src).toBe(`https://www.youtube-nocookie.com/embed/${altre}`);
 rerender(<Aplec2023Article item={{content:'<h3>Edició</h3><div data-sdp-youtube="https://intrus.test">Reserva</div>'}}/>);
 obriVideos(container);
 expect(container.querySelectorAll('iframe')).toHaveLength(1);
 expect(container.querySelector('iframe').src).toBe(`https://www.youtube-nocookie.com/embed/${ID}`);
});
