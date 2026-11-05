/**
 * videoEditorial.js — El node TipTap del vídeo editorial (R12 de Codex, Onada R6 Bloc 4).
 *
 *   · Forma desada (inert): `<div data-sdp-youtube="ID" data-titol="…"><a href=
 *     "https://www.youtube.com/watch?v=ID" …>títol</a></div>`. Cap iframe: el
 *     sanejador el prohibix, i fora de l'App l'HTML es llig com un enllaç.
 *   · Només es reconeix un marcador amb un id de YouTube vàlid; un altre valor
 *     (una URL, un script) no crea el node. L'id es torna a validar en desar,
 *     perquè un document JSON pot portar atributs que no han passat pel parser.
 *   · A l'editor es veu el vídeo de veritat (VideoEditorialNodeView), sempre a
 *     través de VideoEditorial, que és qui fixa l'origen sense galetes.
 *   · Del node `editorial.js` de R12 només entra el vídeo: les figures, les
 *     galeries i els paràgrafs ja els llig maquetacio.js (P0-26 D1).
 */
import { Node } from '@tiptap/core';
import { ReactNodeViewRenderer } from '@tiptap/react';
import VideoEditorialNodeView from './VideoEditorialNodeView.jsx';
import { esIdVideoEditorial, titolDeVideoEditorial } from '../../VideoEditorial.jsx';

export const ATRIBUT_VIDEO_EDITORIAL = 'data-sdp-youtube';

export const VideoEditorialNode = Node.create({
  name: 'videoEditorial',
  group: 'block',
  atom: true,
  draggable: true,
  /* Abans que el contenidor de maquetació, que també llig div. */
  priority: 110,

  addAttributes() {
    return {
      id: {
        default: null,
        parseHTML: (element) => {
          const id = element.getAttribute(ATRIBUT_VIDEO_EDITORIAL);
          return esIdVideoEditorial(id) ? id : null;
        },
        renderHTML: () => ({}),
      },
      title: {
        default: '',
        parseHTML: (element) => titolDeVideoEditorial(element.getAttribute('data-titol')),
        renderHTML: () => ({}),
      },
    };
  },

  parseHTML() {
    return [{
      tag: `div[${ATRIBUT_VIDEO_EDITORIAL}]`,
      getAttrs: (element) => (esIdVideoEditorial(element.getAttribute(ATRIBUT_VIDEO_EDITORIAL)) ? null : false),
    }];
  },

  renderHTML({ node }) {
    const { id } = node.attrs;
    if (!esIdVideoEditorial(id)) return ['div', {}];
    const titol = titolDeVideoEditorial(node.attrs.title);
    const enllac = `https://www.youtube.com/watch?v=${id}`;
    return ['div', { [ATRIBUT_VIDEO_EDITORIAL]: id, ...(titol ? { 'data-titol': titol } : {}) },
      ['a', { href: enllac, target: '_blank', rel: 'noopener noreferrer' }, titol || enllac]];
  },

  addNodeView() {
    return ReactNodeViewRenderer(VideoEditorialNodeView);
  },
});
