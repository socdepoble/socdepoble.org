import { Extension } from '@tiptap/core';
import Suggestion from '@tiptap/suggestion';

const CLASSE = 'sdp-slash-menu';

/**
 * EL FANTASMA DEL SHADOW DOM.
 *
 * L'editor viu dins del shadow root de <soc-de-poble>. Si el popup es
 * munta al document.body, cau al cos del CMS amfitrió: fora del
 * shadow root no existixen els tokens --sdp-* i el menú es pinta nu.
 * I si es munta dins de .ues-canvas, l'overflow de .ues-scroll el retalla
 * i l'`isolation: isolate` de .ues-root impedix que cap z-index el salve.
 *
 * La tercera via: germà dins del MATEIX shadow root (.sdp-root), amb
 * position: fixed i coordenades de coordsAtPos. Es demana l'arrel a
 * l'editor mateix (getRootNode) en compte de buscar l'etiqueta pel
 * document: així funciona igual encapsulat que solt.
 */
function contenidorDe(editor) {
  const arrel = editor?.view?.dom?.getRootNode?.();
  if (arrel && arrel.host) {
    return arrel.querySelector('.sdp-root') || arrel;
  }
  if (typeof document === 'undefined') return null;
  return document.querySelector('.sdp-root') || document.body;
}

export const SlashMenu = Extension.create({
  name: 'sdpSlashMenu',

  addOptions() {
    return {
      ordres: [],
      suggestion: {
        char: '/',
        startOfLine: false,
        allowSpaces: false
      }
    };
  },

  addProseMirrorPlugins() {
    const ordres = this.options.ordres;

    return [
      Suggestion({
        editor: this.editor,
        ...this.options.suggestion,

        items: ({ query }) => {
          const q = (query || '').toLowerCase().trim();
          if (!q) return ordres;
          return ordres.filter((o) =>
            o.titol.toLowerCase().includes(q) ||
            (o.paraules || []).some((p) => p.toLowerCase().startsWith(q))
          );
        },

        command: ({ editor, range, props }) => {
          props?.executa?.({ editor, range });
        },

        render: () => {
          let caixa = null;
          let items = [];
          let actiu = 0;
          let propsActuals = null;

          const tanca = () => {
            if (caixa) {
              caixa.remove();
              caixa = null;
            }
            window.removeEventListener('scroll', reposiciona, true);
            window.removeEventListener('resize', reposiciona);
          };

          const reposiciona = () => {
            if (!caixa || !propsActuals?.clientRect) return;
            const r = propsActuals.clientRect();
            if (!r) return tanca();

            const alt = caixa.offsetHeight || 0;
            const ample = caixa.offsetWidth || 0;
            const capMunt = r.bottom + alt + 8 > window.innerHeight && r.top - alt - 8 > 0;

            caixa.style.top = `${Math.round(capMunt ? r.top - alt - 6 : r.bottom + 6)}px`;
            caixa.style.left = `${Math.round(Math.min(r.left, window.innerWidth - ample - 12))}px`;
          };

          const pinta = () => {
            if (!caixa) return;
            caixa.textContent = '';

            if (items.length === 0) {
              const buit = document.createElement('div');
              buit.className = `${CLASSE}__buit`;
              buit.textContent = 'Res que encaixe.';
              caixa.appendChild(buit);
              reposiciona();
              return;
            }

            items.forEach((item, i) => {
              const fila = document.createElement('button');
              fila.type = 'button';
              fila.className = `${CLASSE}__opcio${i === actiu ? ` ${CLASSE}__opcio--activa` : ''}`;
              fila.setAttribute('role', 'option');
              fila.setAttribute('aria-selected', String(i === actiu));

              const titol = document.createElement('span');
              titol.className = `${CLASSE}__titol`;
              titol.textContent = item.titol;
              fila.appendChild(titol);

              if (item.ajuda) {
                const ajuda = document.createElement('span');
                ajuda.className = `${CLASSE}__ajuda`;
                ajuda.textContent = item.ajuda;
                fila.appendChild(ajuda);
              }

              /* mousedown i no click: amb click, l'editor perd el focus
                 abans que la comanda s'execute i el range ja no val. */
              fila.addEventListener('mousedown', (e) => {
                e.preventDefault();
                propsActuals?.command?.(item);
              });

              caixa.appendChild(fila);
            });

            reposiciona();
          };

          return {
            onStart: (props) => {
              propsActuals = props;
              items = props.items || [];
              actiu = 0;

              const pare = contenidorDe(props.editor);
              if (!pare) return;

              caixa = document.createElement('div');
              caixa.className = CLASSE;
              caixa.setAttribute('role', 'listbox');
              caixa.setAttribute('aria-label', 'Inserir bloc');
              pare.appendChild(caixa);

              /* Capture: true perquè el scroll de .ues-scroll no bombolleja
                 fins a window. Sense això, el menú es queda flotant al buit. */
              window.addEventListener('scroll', reposiciona, true);
              window.addEventListener('resize', reposiciona);

              pinta();
            },

            onUpdate: (props) => {
              propsActuals = props;
              items = props.items || [];
              if (actiu >= items.length) actiu = 0;
              pinta();
            },

            onKeyDown: ({ event }) => {
              if (!caixa) return false;

              if (event.key === 'Escape') {
                tanca();
                return true;
              }
              if (event.key === 'ArrowDown') {
                actiu = items.length ? (actiu + 1) % items.length : 0;
                pinta();
                return true;
              }
              if (event.key === 'ArrowUp') {
                actiu = items.length ? (actiu - 1 + items.length) % items.length : 0;
                pinta();
                return true;
              }
              if (event.key === 'Enter' || event.key === 'Tab') {
                const item = items[actiu];
                if (!item) return false;
                propsActuals?.command?.(item);
                return true;
              }
              return false;
            },

            onExit: tanca
          };
        }
      })
    ];
  }
});

export default SlashMenu;
