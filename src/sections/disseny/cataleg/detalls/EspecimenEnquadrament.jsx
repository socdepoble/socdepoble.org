import { useEffect, useRef, useState } from 'react';
import { CircleUserRound, Crop, ImageUp, MapPin } from 'lucide-react';
import { Especimen } from '../Especimen.jsx';
import { Alerta, Avatar, Boto } from '../../../../components/PedraSeca/index.js';
import { DialegEnquadrament } from '../../../../components/universal/enquadrament/DialegEnquadrament.jsx';
import { midaSortida } from '../../../../components/universal/enquadrament/enquadrament.js';
import { PRECISIONS, textUbicacio } from '../../../../components/universal/enquadrament/geolocalitzacio.js';
import { useEnquadramentAvatar } from '../../../profile/useEnquadramentAvatar.jsx';
import { resolRecursPropi } from '../../../../config/assetResolver';
import { Llinatge } from '../Llinatge.jsx';

/* T46 (ordre del Mestre, 260928) · Re-enquadrar la capçalera. Una foto
   apaisada del mateix origen (1376×768): en quadrat es veu que el marc talla i
   que es pot moure. El diàleg només es munta obert: allLoaders el pinta tancat
   en jsdom, que no té canvas. */
const MOSTRA = '/assets/notes/bloc_notes_vintage.jpg';

/* Onada 4 · T3 · L'avatar de la IAIA que pinta avui el Xat (agentsSeed.js), una
   escena quadrada de 1024 px: el retall és la cara. Cap imatge nova ni tocada
   (core-identitat-visual): l'espècimen la llig i el retall no ix del navegador. */
const MOSTRA_AVATAR = '/assets/fotos/iaia-maria.png';

const urlDe = (fitxer) => (typeof URL.createObjectURL === 'function' ? URL.createObjectURL(fitxer) : '');

/** El text del fitxer que ha eixit del diàleg. Onada 4 · revisió (K1) · Només
    és «la foto sencera, sense tornar-la a codificar» quan el diàleg ha tornat
    l'ORIGINAL (`original`): amb `sortida` o amb la geolocalització, una foto
    sencera també es recodifica, a la mida de midaSortida. */
function descriu(fitxer, { format, rect, sencera }, original = null) {
  const tornada = sencera && fitxer === original;
  const mida = tornada ? { amplada: rect.w, alcada: rect.h } : midaSortida(rect);
  return `${mida.amplada} × ${mida.alcada} px, forma ${format}, ${Math.max(1, Math.round(fitxer.size / 1024))} KB${tornada ? ' (la foto sencera, sense tornar-la a codificar)' : ''}`;
}

/* Onada 4 · T3 · Les metadades que llig el diàleg de l'original quan la persona
   tria geolocalitzar (ADR D5). Es pinten ací i prou: l'espècimen no les puja.
   Revisió (K1) · La forma és la del contracte, el TERCER argument d'onDesa:
   { geolocalitzacio: { lat, lng, precisio_m, origen } | null, dataCaptura }.
   Les coordenades ja arriben arrodonides a la precisió triada. */
function textMetadades(meta) {
  const parts = [];
  const geo = meta?.geolocalitzacio;
  if (geo && Number.isFinite(geo.lat) && Number.isFinite(geo.lng)) {
    const precisio = PRECISIONS.find((p) => p.precisio_m === geo.precisio_m)?.valor;
    parts.push(`coordenades ${textUbicacio(geo, precisio)}, ${geo.origen === 'exif' ? 'llegides de l’original abans del canvas' : 'escrites a mà'}`);
  }
  if (meta?.dataCaptura) parts.push(`presa el ${meta.dataCaptura}`);
  return parts.length
    ? `Viatjaria com a camps, mai dins del fitxer: ${parts.join('; ')}.`
    : 'Cap coordenada: el fitxer no en porta o no has marcat l’opció.';
}

/** Un resultat amb la seua vista (objectURL), que es revoca en canviar-lo i en eixir. */
function useResultat() {
  const [resultat, setResultat] = useState(null);
  useEffect(() => () => {
    if (resultat?.url) URL.revokeObjectURL(resultat.url);
  }, [resultat]);
  return [resultat, setResultat];
}

export default function EspecimenEnquadrament() {
  const [font, setFont] = useState(null);
  const [resultat, setResultat] = useResultat();
  const input = useRef(null);
  const [resultatAvatar, setResultatAvatar] = useResultat();
  const [avisAvatar, setAvisAvatar] = useState(null);
  const inputAvatar = useRef(null);
  const [fontGeo, setFontGeo] = useState(null);
  const [resultatGeo, setResultatGeo] = useResultat();
  const inputGeo = useRef(null);

  /* L'avatar, pel mateix camí que el Perfil: només quadrat i sense geolocalitzar. */
  const avatar = useEnquadramentAvatar({
    onEnquadrat: async (fitxer, info) => {
      setResultatAvatar({ url: urlDe(fitxer), text: descriu(fitxer, info) });
    },
    onError: setAvisAvatar,
  });

  const tria = (e) => {
    const fitxer = e.target.files?.[0];
    e.target.value = '';
    if (fitxer && fitxer.type.startsWith('image/')) setFont(fitxer);
  };

  const triaAvatar = (e) => {
    const fitxer = e.target.files?.[0];
    e.target.value = '';
    setAvisAvatar(null);
    if (fitxer) avatar.obri(fitxer);
  };

  const triaGeo = (e) => {
    const fitxer = e.target.files?.[0];
    e.target.value = '';
    if (fitxer && fitxer.type.startsWith('image/')) setFontGeo(fitxer);
  };

  const desa = async (fitxer, info) => {
    setResultat({ url: urlDe(fitxer), text: descriu(fitxer, info, font) });
    setFont(null);
    return true;
  };

  /* Les metadades són el tercer argument d'onDesa (contracte del diàleg). */
  const desaGeo = async (fitxer, info, metadades) => {
    setResultatGeo({ url: urlDe(fitxer), text: descriu(fitxer, info, fontGeo), meta: textMetadades(metadades) });
    setFontGeo(null);
    return true;
  };

  return (
    <>
    <Llinatge id="enquadrament" />
    <Especimen id="enquadrament" nom="DialegEnquadrament · re-enquadrar una foto"
      fitxer="src/components/universal/enquadrament/DialegEnquadrament.jsx · src/sections/profile/useEnquadramentAvatar.jsx"
      descripcio="La foto de capçalera d’una nota és també la miniatura del llistat i la targeta del Mur. Abans de desar-la, este diàleg deixa triar la forma (quadrat de sèrie) i moure-la perquè el que importa no quede tallat. El retall es guarda dins de l’arxiu: la resta de la foto no es conserva. Si la nota ja és al Mur, la targeta no canvia fins que es torna a publicar. L’avatar del Perfil hi passa sempre amb una sola forma, el quadrat, i sense l’opció de geolocalitzar."
      contracte={[
        ['obert', 'boolean', 'true', 'El pare el sol muntar només quan cal (la closca, l’espècimen).'],
        ['font', 'File | string', '—', 'Una foto nova (File) o l’adreça ja resolta de la capçalera existent.'],
        ['formatInicial', "'1:1' | 'original' | '4:3' | '16:9'", "'1:1'", 'Pedra Seca §8: el quadrat és el de sèrie.'],
        ['formats', '[{ valor, etiqueta, ajuda?, ratio }]', 'FORMATS', 'Per a afegir-ne un n’hi ha prou amb una fila nova (enquadrament.js). L’avatar en passa una sola: FORMATS_AVATAR.'],
        ['permetGeolocalitzacio', 'boolean', 'false', 'Onada 4 · Oferix «Vull geolocalitzar aquesta imatge» (ADR D5): les coordenades es lligen de l’original i viatgen com a camps. L’avatar no l’oferix mai.'],
        ['onTanca', "(motiu: 'esc'|'boto') => void", '—', 'Cancel·lar, la X i Escape. El vel no el tanca: un arrossegament no perd la feina.'],
        ['sortida', '{ ampladaMaxima, format, qualitat } | null', 'null', 'Onada 4 · Amb sortida, el diàleg sempre recodifica (mai torna l’original). L’avatar en passa una per a cada foto nova (sortidaAvatar).'],
        ['onDesa', '(fitxer, { format, rect, sencera }, metadades) => Promise<boolean>', '—', 'El pare el tanca. Si llança, el missatge ix dins del diàleg i continua obert. metadades, sempre present: { geolocalitzacio: { lat, lng, precisio_m, origen } | null, dataCaptura | null }.'],
        ['carregador / exportador / dibuixant', 'funcions', 'imatgeCanvas.js', 'Injectables per a les proves (jsdom no té canvas).'],
      ]}
      a11y={[
        'Tres lliscadors natius amb etiqueta (ampliació en percentatge, posició horitzontal i vertical): tot es fa amb teclat.',
        'Un lliscador desactivat diu per què (la foto ja omple el marc en eixa direcció).',
        'El visor és una imatge descrita (role="img"); arrossegar i el pessic amb dos dits són una drecera, no l’únic camí.',
        'Forma en ràdios natius dins d’un fieldset; errors en línia amb role="alert".',
        'Escape tanca sempre; el focus torna al botó que l’ha obert o, després de desar, a la capçalera nova.',
        'L’avatar: cancel·lar no puja res i el focus torna a «Triar la imatge» (o al selector de fitxers de l’ajust).',
      ]}
      fes={[
        'El quadrat de sèrie: capçalera, miniatura i targeta ensenyen el mateix enquadrament (la targeta del Mur d’una nota ja publicada, quan es torna a publicar).',
        'Ensenyar el resultat exacte abans de desar (el visor és el retall).',
        'Una sola imatge per diàleg.',
        'L’avatar, sempre per useEnquadramentAvatar: un sol lloc decidix la forma (1:1), el títol i la privacitat.',
      ]}
      noFacis={[
        'Retallar sense ensenyar el resultat.',
        'Fer-lo servir per a la capçalera del Perfil: T46 la deixa com estava (al Perfil només s’enquadra l’avatar).',
        'Oferir a l’avatar una altra forma que el quadrat, o geolocalitzar-lo.',
        'Prometre que es pot recuperar la part retallada: no es guarda.',
      ]}>
      <h4>Capçalera</h4>
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

      <h4>Avatar: només quadrat</h4>
      <div className="sdp-especimen__fila">
        <Avatar nom="IAIA MarIA" mida="xl" src={MOSTRA_AVATAR} />
        <p className="sdp-camp__ajuda">
          L’avatar d’avui de la IAIA és l’escena sencera. Amplia-la fins a la cara: sense ampliar, el quadrat ja és la foto sencera i no hi ha res a retallar.
        </p>
      </div>
      <div className="sdp-alerta__accions">
        {/* Encastat, '/assets/…' va per la base del paquet (resolRecursPropi), no a l'arrel del domini. */}
        <Boto icona={CircleUserRound} aria-haspopup="dialog" onClick={() => { setAvisAvatar(null); avatar.obri(resolRecursPropi(MOSTRA_AVATAR)); }}>Enquadrar l’avatar de la IAIA</Boto>
        <Boto icona={ImageUp} aria-haspopup="dialog" onClick={() => inputAvatar.current?.click()}>Provar un avatar amb una foto teua</Boto>
        <input ref={inputAvatar} type="file" accept="image/*" onChange={triaAvatar} className="sdp-nomes-lector" tabIndex={-1} aria-hidden="true" />
      </div>
      {avisAvatar ? <Alerta to="error">{avisAvatar}</Alerta> : null}
      {resultatAvatar ? (
        <figure className="sdp-enquadrament__resultat">
          {resultatAvatar.url ? (
            <div className="sdp-avatar sdp-avatar--xl">
              <img src={resultatAvatar.url} alt="L’avatar enquadrat" className="sdp-avatar__imatge" />
            </div>
          ) : null}
          <figcaption className="sdp-camp__ajuda">
            Ha eixit un fitxer de {resultatAvatar.text}. Al Perfil, este fitxer passa després per la compressió de l’avatar (WebP, fins a 600 px) i puja com un sol fitxer.
          </figcaption>
        </figure>
      ) : null}

      <h4>Geolocalització voluntària</h4>
      <p className="sdp-camp__ajuda">
        Només en fotos de treball de camp i mai en un avatar. L’opció ve apagada; si la marques, les coordenades es lligen de l’original abans del canvas i el fitxer retallat ix sense EXIF.
      </p>
      <div className="sdp-alerta__accions">
        <Boto icona={MapPin} aria-haspopup="dialog" onClick={() => inputGeo.current?.click()}>Provar amb una foto teua, amb l’opció de geolocalitzar</Boto>
        <input ref={inputGeo} type="file" accept="image/*" onChange={triaGeo} className="sdp-nomes-lector" tabIndex={-1} aria-hidden="true" />
      </div>
      {resultatGeo ? (
        <figure className="sdp-enquadrament__resultat">
          {resultatGeo.url ? <img src={resultatGeo.url} alt="El resultat de l’enquadrament amb l’opció de geolocalitzar" /> : null}
          <figcaption className="sdp-camp__ajuda">
            Ha eixit un fitxer de {resultatGeo.text}. {resultatGeo.meta}
          </figcaption>
        </figure>
      ) : null}

      {font ? <DialegEnquadrament font={font} onTanca={() => setFont(null)} onDesa={desa} /> : null}
      {avatar.dialeg}
      {fontGeo ? <DialegEnquadrament font={fontGeo} permetGeolocalitzacio onTanca={() => setFontGeo(null)} onDesa={desaGeo} /> : null}
    </Especimen>
    </>
  );
}
