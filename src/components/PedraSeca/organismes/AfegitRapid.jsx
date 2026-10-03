/**
 * AfegitRapid.jsx — «Necessite…» (La Compra) o «Busca…» (el TPV): un camp
 * amb suggeriments del catàleg i, si l'app ho permet, crear un article nou
 * (esquelet comú T4/T8).
 *
 * Combobox de l'ARIA 1.2 sobre un <input> natiu dins de Camp (l'etiqueta
 * sempre es veu; el placeholder no n'és cap):
 *   · escriure filtra els suggeriments (sense accents ni majúscules,
 *     filtraSuggeriments a articles.js); amb `filtra={false}`, l'app els
 *     passa ja triats;
 *   · ↓ i ↑ recorren les opcions (aria-activedescendant), Intro tria l'activa
 *     des del mateix camp (encara que el botó «Afig» estiga desactivat),
 *     Escape tanca la llista i, ja tancada, buida el camp;
 *   · Intro o el botó sense opció activa: si el text és un article, el tria;
 *     si no, el crea (onCrea). Sense onCrea, no s'inventa res;
 *   · després de triar, el camp es buida i el focus s'hi queda: es poden
 *     afegir moltes coses seguides.
 * El text que s'escriu no va mai a la URL (Clàusula dels Slugs).
 */
import { useId, useState } from 'react';
import { Plus } from 'lucide-react';
import { Boto } from '../atoms/Boto.jsx';
import { Camp, CampText } from './formulari.jsx';
import { filtraSuggeriments, normalitzaText } from './articles.js';

const TEXTOS_AFEGIT = Object.freeze({
  crea: (text) => `Afig «${text}» com a article nou`,
  boto: 'Afig',
  trobats: (n) => (n === 1 ? '1 suggeriment' : `${n} suggeriments`)
});

export function AfegitRapid({
  etiqueta = 'Necessite…', placeholder, ajuda, suggeriments = [], filtra = true, maxim = 8,
  onTria, onCrea, valor, onCanvi, textos, className
}) {
  const t = { ...TEXTOS_AFEGIT, ...textos };
  const id = useId();
  const [propi, setPropi] = useState('');
  const [obert, setObert] = useState(false);
  const [actiu, setActiu] = useState(-1);
  const text = typeof valor === 'string' ? valor : propi;
  const net = text.trim();
  const llista = Array.isArray(suggeriments) ? suggeriments : [];
  const trobats = filtra ? filtraSuggeriments(net, llista, maxim) : llista.slice(0, maxim);
  const exacte = net ? llista.find((s) => normalitzaText(s?.nom) === normalitzaText(net)) || null : null;
  const opcions = [
    ...trobats.map((article) => ({ tipus: 'article', article })),
    ...(onCrea && net && !exacte ? [{ tipus: 'crea', text: net }] : [])
  ];
  const visible = obert && net !== '' && opcions.length > 0;
  const idLlista = `${id}-opcions`;
  const idOpcio = (i) => `${id}-opcio-${i}`;

  const posaText = (nou) => {
    if (typeof valor !== 'string') setPropi(nou);
    onCanvi?.(nou);
  };
  const tanca = () => {
    setObert(false);
    setActiu(-1);
  };
  const tria = (opcio) => {
    if (opcio.tipus === 'crea') onCrea?.(opcio.text);
    else onTria?.(opcio.article);
    posaText('');
    tanca();
  };
  const envia = (event) => {
    event.preventDefault();
    if (visible && actiu >= 0 && actiu < opcions.length) tria(opcions[actiu]);
    else if (exacte) tria({ tipus: 'article', article: exacte });
    else if (net && onCrea) tria({ tipus: 'crea', text: net });
  };
  const tecla = (event) => {
    if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
      if (!opcions.length || !net) return;
      event.preventDefault();
      const pas = event.key === 'ArrowDown' ? 1 : -1;
      setObert(true);
      setActiu((i) => {
        if (!visible || i < 0) return pas === 1 ? 0 : opcions.length - 1;
        return (i + pas + opcions.length) % opcions.length;
      });
    } else if (event.key === 'Enter') {
      /* Intro sobre l'opció activa la tria el camp mateix: sense onCrea (el
         «Busca…» del TPV), el botó «Afig» està desactivat mentre el text no és
         exacte, i un formulari amb el botó per defecte desactivat no s'envia
         amb Intro. Mentre es compon (IME), Intro és del teclat, no nostre. */
      if (event.nativeEvent?.isComposing || !visible || actiu < 0 || actiu >= opcions.length) return;
      event.preventDefault();
      tria(opcions[actiu]);
    } else if (event.key === 'Escape') {
      if (visible) {
        event.preventDefault();
        tanca();
      } else if (text) {
        event.preventDefault();
        posaText('');
      }
    }
  };

  return (
    <form className={['sdp-afegit-rapid', className].filter(Boolean).join(' ')} onSubmit={envia} noValidate>
      <Camp etiqueta={etiqueta} ajuda={ajuda}>
        <div className="sdp-afegit-rapid__fila">
          <CampText
            role="combobox"
            aria-autocomplete="list"
            aria-expanded={visible}
            aria-controls={idLlista}
            aria-activedescendant={visible && actiu >= 0 ? idOpcio(actiu) : undefined}
            autoComplete="off"
            enterKeyHint="done"
            placeholder={placeholder}
            value={text}
            onChange={(event) => {
              posaText(event.target.value);
              setObert(true);
              setActiu(-1);
            }}
            onKeyDown={tecla}
            onBlur={tanca}
          />
          <Boto tipus="submit" varietat="primari" icona={Plus} disabled={!net || (!exacte && !onCrea)}>{t.boto}</Boto>
        </div>
      </Camp>
      {/* mousedown no ha de llevar el focus del camp: el clic tria l'opció. */}
      <ul id={idLlista} role="listbox" aria-label={etiqueta} className="sdp-afegit-rapid__opcions" hidden={!visible}
        onMouseDown={(event) => event.preventDefault()}>
        {visible ? opcions.map((opcio, i) => (
          <li key={opcio.tipus === 'crea' ? '__crea' : opcio.article.id} id={idOpcio(i)} role="option" aria-selected={i === actiu}
            className={opcio.tipus === 'crea' ? 'sdp-afegit-rapid__opcio sdp-afegit-rapid__opcio--crea' : 'sdp-afegit-rapid__opcio'}
            onClick={() => tria(opcio)}>
            {opcio.tipus === 'crea' ? (
              <>
                <Plus size={20} aria-hidden="true" focusable="false" />
                <span>{t.crea(opcio.text)}</span>
              </>
            ) : (
              <>
                <span className="sdp-afegit-rapid__nom">{opcio.article.nom}</span>
                {opcio.article.secundari ? <>{' '}<span className="sdp-afegit-rapid__secundari">{opcio.article.secundari}</span></> : null}
              </>
            )}
          </li>
        )) : null}
      </ul>
      <p className="sdp-nomes-lector" role="status" aria-live="polite">{visible ? t.trobats(trobats.length) : ''}</p>
    </form>
  );
}
