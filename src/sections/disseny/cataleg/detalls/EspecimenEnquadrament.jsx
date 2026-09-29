import { useEffect, useRef, useState } from 'react';
import { Crop, ImageUp } from 'lucide-react';
import { Especimen } from '../Especimen.jsx';
import { Boto } from '../../../../components/PedraSeca/index.js';
import { DialegEnquadrament } from '../../../../components/universal/enquadrament/DialegEnquadrament.jsx';
import { midaSortida } from '../../../../components/universal/enquadrament/enquadrament.js';
import { Llinatge } from '../Llinatge.jsx';

/* T46 (ordre del Mestre, 260928) · Re-enquadrar la capçalera. Una foto
   apaisada del mateix origen (1376×768): en quadrat es veu que el marc talla i
   que es pot moure. El diàleg només es munta obert: allLoaders el pinta tancat
   en jsdom, que no té canvas. */
const MOSTRA = '/assets/notes/bloc_notes_vintage.jpg';

export default function EspecimenEnquadrament() {
  const [font, setFont] = useState(null);
  const [resultat, setResultat] = useState(null);
  const input = useRef(null);

  // L'objectURL de la vista del resultat es revoca en canviar-lo i en eixir.
  useEffect(() => () => {
    if (resultat?.url) URL.revokeObjectURL(resultat.url);
  }, [resultat]);

  const tria = (e) => {
    const fitxer = e.target.files?.[0];
    e.target.value = '';
    if (fitxer && fitxer.type.startsWith('image/')) setFont(fitxer);
  };

  const desa = async (fitxer, { format, rect, sencera }) => {
    const mida = sencera ? { amplada: rect.w, alcada: rect.h } : midaSortida(rect);
    const url = typeof URL.createObjectURL === 'function' ? URL.createObjectURL(fitxer) : '';
    setResultat({
      url,
      text: `${mida.amplada} × ${mida.alcada} px, forma ${format}, ${Math.max(1, Math.round(fitxer.size / 1024))} KB${sencera ? ' (la foto sencera, sense tornar-la a codificar)' : ''}`,
    });
    setFont(null);
    return true;
  };

  return (
    <>
    <Llinatge id="enquadrament" />
    <Especimen id="enquadrament" nom="DialegEnquadrament · re-enquadrar una foto"
      fitxer="src/components/universal/enquadrament/DialegEnquadrament.jsx"
      descripcio="La foto de capçalera d’una nota és també la miniatura del llistat i la targeta del Mur. Abans de desar-la, este diàleg deixa triar la forma (quadrat de sèrie) i moure-la perquè el que importa no quede tallat. El retall es guarda dins de l’arxiu: la resta de la foto no es conserva. Si la nota ja és al Mur, la targeta no canvia fins que es torna a publicar."
      contracte={[
        ['obert', 'boolean', 'true', 'El pare el sol muntar només quan cal (la closca, l’espècimen).'],
        ['font', 'File | string', '—', 'Una foto nova (File) o l’adreça ja resolta de la capçalera existent.'],
        ['formatInicial', "'1:1' | 'original' | '4:3' | '16:9'", "'1:1'", 'Pedra Seca §8: el quadrat és el de sèrie.'],
        ['formats', '[{ valor, etiqueta, ajuda?, ratio }]', 'FORMATS', 'Per a afegir-ne un n’hi ha prou amb una fila nova (enquadrament.js).'],
        ['onTanca', "(motiu: 'esc'|'boto') => void", '—', 'Cancel·lar, la X i Escape. El vel no el tanca: un arrossegament no perd la feina.'],
        ['onDesa', '(fitxer, { format, rect, sencera }) => Promise<boolean>', '—', 'El pare el tanca. Si llança, el missatge ix dins del diàleg i continua obert.'],
        ['carregador / exportador / dibuixant', 'funcions', 'imatgeCanvas.js', 'Injectables per a les proves (jsdom no té canvas).'],
      ]}
      a11y={[
        'Tres lliscadors natius amb etiqueta (ampliació en percentatge, posició horitzontal i vertical): tot es fa amb teclat.',
        'Un lliscador desactivat diu per què (la foto ja omple el marc en eixa direcció).',
        'El visor és una imatge descrita (role="img"); arrossegar i el pessic amb dos dits són una drecera, no l’únic camí.',
        'Forma en ràdios natius dins d’un fieldset; errors en línia amb role="alert".',
        'Escape tanca sempre; el focus torna al botó que l’ha obert o, després de desar, a la capçalera nova.',
      ]}
      fes={[
        'El quadrat de sèrie: capçalera, miniatura i targeta ensenyen el mateix enquadrament (la targeta del Mur d’una nota ja publicada, quan es torna a publicar).',
        'Ensenyar el resultat exacte abans de desar (el visor és el retall).',
        'Una sola imatge per diàleg.',
      ]}
      noFacis={[
        'Retallar sense ensenyar el resultat.',
        'Fer-lo servir per a l’avatar o la capçalera del Perfil: T46 els deixa com estaven.',
        'Prometre que es pot recuperar la part retallada: no es guarda.',
      ]}>
      <div className="sdp-alerta__accions">
        <Boto icona={Crop} aria-haspopup="dialog" onClick={() => setFont(MOSTRA)}>Enquadrar una foto apaisada</Boto>
        <Boto icona={ImageUp} aria-haspopup="dialog" onClick={() => input.current?.click()}>Provar amb una foto teua</Boto>
        <input ref={input} type="file" accept="image/*" onChange={tria} className="sdp-nomes-lector" tabIndex={-1} aria-hidden="true" />
      </div>
      <p className="sdp-camp__ajuda">La foto teua no ix del navegador: l’espècimen no puja ni desa res.</p>
      {resultat ? (
        <figure className="sdp-enquadrament__resultat">
          {resultat.url ? <img src={resultat.url} alt="El resultat de l’enquadrament" /> : null}
          <figcaption className="sdp-camp__ajuda">
            Ha eixit un fitxer de {resultat.text}. A l’editor, este fitxer passa després per la compressió de sempre (WebP, fins a 1.200 px).
          </figcaption>
        </figure>
      ) : null}
      {font ? <DialegEnquadrament font={font} onTanca={() => setFont(null)} onDesa={desa} /> : null}
    </Especimen>
    </>
  );
}
