/* R30-LLEI08-LLEI01 · La classe «sdp-imatge-cos» de les imatges del cos no té
   regla pròpia, però és un ganxo negatiu: la regla d'ample complet de
   src/css/base.css només pinta les imatges sense classe. Si l'Editor deixara
   d'escriure-la, cada imatge desada de nou ompliria la columna en la lectura i
   no casaria amb les publicacions velles. Esta prova fixa l'HTML desat (ja
   sanejat) i que no entra en el selector d'eixa regla. */
import fs from 'node:fs';
import path from 'node:path';
import { Editor } from '@tiptap/core';
import StarterKit from '@tiptap/starter-kit';
import { afterEach, expect, test } from 'vitest';
import { sanitizeHtml } from '../../../../utils/sanitize.js';
import { extensionsRiques } from './index.js';

const SELECTOR_AMPLE_COMPLET = ':where(article.content-wrapper, .sdp-prose) :where(img:not([class]), img[class=""])';

let editor = null;
afterEach(() => {
  editor?.destroy();
  editor = null;
  document.body.replaceChildren();
});

test('la regla d’ample complet de base.css continua sent la que la classe esquiva', () => {
  const base = fs.readFileSync(path.resolve(process.cwd(), 'src/css/base.css'), 'utf8');
  expect(base).toContain(`${SELECTOR_AMPLE_COMPLET} {`);
});

test('la imatge que desa l’Editor porta «sdp-imatge-cos» i queda fora de la regla d’ample complet', () => {
  const element = document.createElement('div');
  document.body.appendChild(element);
  editor = new Editor({
    element,
    extensions: [StarterKit.configure({ underline: false }), ...extensionsRiques()],
    content: '<p>Text</p><img src="https://poble.test/foto.jpg" alt="La plaça">'
  });
  const article = document.createElement('article');
  article.className = 'content-wrapper';
  article.innerHTML = sanitizeHtml(editor.getHTML());
  document.body.appendChild(article);
  const img = article.querySelector('img');
  expect(img).not.toBeNull();
  expect(img.classList.contains('sdp-imatge-cos')).toBe(true);
  expect(img.matches(SELECTOR_AMPLE_COMPLET)).toBe(false);
});
