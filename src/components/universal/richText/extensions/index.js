import Image, { inputRegex as regexImatgeMarkdown } from '@tiptap/extension-image';
import { nodeInputRule } from '@tiptap/core';
import { ReactNodeViewRenderer } from '@tiptap/react';
import { compressImage } from '../../../../utils/imageUtils.js';
import { netejaFontImatge } from '../../enquadrament/netejaMetadades.js';
import { netejaHtmlEnganxat } from './imatgesEnganxades.js';
import SlashMenu from './slash.js';
import SdpImageNodeView from './SdpImageNodeView.jsx';

/* RICH-EXIF (Onada 4, ADR multimèdia D4) · allowBase64 es queda (les notes
   sense servidor hi desen el data URL de compressImage), però cap data URL
   d'imatge entra amb metadades: ni enganxat, ni arrossegat, ni escrit com
   a «![alt](src)». La neteja és síncrona i no torna a codificar cap píxel. */
const SdpImage = Image.extend({
  addNodeView() {
    return ReactNodeViewRenderer(SdpImageNodeView);
  },

  /* Enganxar i deixar anar HTML: ProseMirror crida esta mateixa funció. */
  transformPastedHTML(html) {
    return netejaHtmlEnganxat(html);
  },

  /* La regla de Markdown de TipTap, amb la font neta. Una imatge que no es
     pot netejar no es crea: el text escrit es queda com a text. */
  addInputRules() {
    return [
      nodeInputRule({
        find: (text) => {
          const m = regexImatgeMarkdown.exec(text);
          if (!m) return null;
          const [tot, imatge, alt, src, title] = m;
          const net = netejaFontImatge(src);
          if (net === null) return null;
          return { index: m.index, text: tot, replaceWith: imatge, data: { src: net, alt, title } };
        },
        type: this.type,
        getAttributes: (match) => match.data
      })
    ];
  }
});

/** Obri el selector de fitxers i resol amb el File, o null si s'anul·la. */
function triaFitxer(accept = 'image/*') {
  return new Promise((resolve) => {
    if (typeof document === 'undefined') return resolve(null);

    const input = document.createElement('input');
    input.type = 'file';
    input.accept = accept;
    input.style.position = 'fixed';
    input.style.left = '-9999px';
    document.body.appendChild(input);

    let resolt = false;
    const acaba = (fitxer) => {
      if (resolt) return;
      resolt = true;
      input.remove();
      resolve(fitxer);
    };

    input.addEventListener('change', () => acaba(input.files?.[0] || null), { once: true });
    /* Si l'usuari cancel·la, no hi ha esdeveniment 'change'. El focus que
       torna a la finestra és l'únic senyal fiable per a no deixar l'input
       penjat al DOM per sempre. */
    window.addEventListener('focus', () => setTimeout(() => acaba(null), 400), { once: true });

    input.click();
  });
}

async function aFitxerWebp(dataUrl, nom = 'imatge.webp') {
  const resposta = await fetch(dataUrl);
  const blob = await resposta.blob();
  return new File([blob], nom, { type: 'image/webp' });
}

/**
 * Ordres del menú Slash.
 * @param {Object} opcions
 * @param {(fitxer: File) => Promise<string|null>} [opcions.onImageUpload]
 *        La MATEIXA capacitat que fa servir el hero. Una sola porta de
 *        pujada per a tota l'aplicació: si n'hi ha dues, només una tindrà
 *        polítiques.
 */
export function creaOrdres({ onImageUpload = null } = {}) {
  return [
    {
      id: 'titol',
      titol: 'Títol de secció',
      ajuda: 'Encapçalament gran',
      paraules: ['titol', 'títol', 'h2', 'encapçalament'],
      executa: ({ editor, range }) =>
        editor.chain().focus().deleteRange(range).toggleHeading({ level: 2 }).run()
    },
    {
      id: 'subtitol',
      titol: 'Subtítol',
      ajuda: 'Encapçalament menut',
      paraules: ['subtitol', 'subtítol', 'h3'],
      executa: ({ editor, range }) =>
        editor.chain().focus().deleteRange(range).toggleHeading({ level: 3 }).run()
    },
    {
      id: 'h4',
      titol: 'Subapartat',
      ajuda: 'Encapçalament de nivell 4',
      paraules: ['h4', 'subapartat'],
      executa: ({ editor, range }) =>
        editor.chain().focus().deleteRange(range).toggleHeading({ level: 4 }).run()
    },
    {
      id: 'h5',
      titol: 'Detall del subapartat',
      ajuda: 'Encapçalament de nivell 5',
      paraules: ['h5', 'detall'],
      executa: ({ editor, range }) =>
        editor.chain().focus().deleteRange(range).toggleHeading({ level: 5 }).run()
    },
    {
      id: 'h6',
      titol: 'Detall específic',
      ajuda: 'Encapçalament de nivell 6',
      paraules: ['h6', 'específic'],
      executa: ({ editor, range }) =>
        editor.chain().focus().deleteRange(range).toggleHeading({ level: 6 }).run()
    },
    {
      id: 'llista',
      titol: 'Llista',
      ajuda: 'Punts, un per línia',
      paraules: ['llista', 'punts', 'ul'],
      executa: ({ editor, range }) =>
        editor.chain().focus().deleteRange(range).toggleBulletList().run()
    },
    {
      id: 'citacio',
      titol: 'Citació',
      ajuda: 'Bloc destacat',
      paraules: ['citacio', 'citació', 'cita', 'quote'],
      executa: ({ editor, range }) =>
        editor.chain().focus().deleteRange(range).toggleBlockquote().run()
    },
    {
      /* HorizontalRule ja ve dins de l'StarterKit. No cal cap paquet nou. */
      id: 'divisor',
      titol: 'Divisor',
      ajuda: 'Una ratlla que separa',
      paraules: ['divisor', 'ratlla', 'hr', 'separador'],
      executa: ({ editor, range }) =>
        editor.chain().focus().deleteRange(range).setHorizontalRule().run()
    },
    {
      id: 'imatge',
      titol: 'Imatge',
      ajuda: 'Puja una foto del dispositiu',
      paraules: ['imatge', 'foto', 'image', 'img'],
      executa: async ({ editor, range }) => {
        editor.chain().focus().deleteRange(range).run();

        const original = await triaFitxer();
        if (!original) return;
        if (!original.type.startsWith('image/')) return;

        try {
          const dataUrl = await compressImage(original, {
            maxSize: 1200, format: 'image/webp', quality: 0.8
          });

          let src = dataUrl;
          if (typeof onImageUpload === 'function') {
            const fitxer = await aFitxerWebp(dataUrl, `${Date.now()}.webp`);
            const url = await onImageUpload(fitxer);
            if (url) src = url;
          }

          editor.chain().focus().setImage({
            src,
            alt: original.name || 'Imatge'
          }).run();
        } catch (err) {
          console.warn('[slash] No s\'ha pogut inserir la imatge:', err?.message);
        }
      }
    }
  ];
}

/**
 * Extensions riques. El host les memoritza (useMemo) abans de passar-les:
 * si l'array canvia d'identitat a cada render, useEditor reconstruïx
 * l'editor i el cursor salta.
 */
export function extensionsRiques({ onImageUpload = null } = {}) {
  return [
    SdpImage.configure({
      inline: false,
      allowBase64: true,
      HTMLAttributes: { class: 'sdp-imatge-cos', loading: 'lazy', decoding: 'async' }
    }),
    SlashMenu.configure({ ordres: creaOrdres({ onImageUpload }) })
  ];
}

export { SlashMenu };
