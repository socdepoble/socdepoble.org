import { useEffect, useRef, useState } from 'react';
import { Circle, CircleUserRound, Crop, ImageUp, MapPin, Proportions, Square } from 'lucide-react';
import { Especimen } from '../Especimen.jsx';
import { Alerta, Avatar, Boto } from '../../../../components/PedraSeca/index.js';
import { DialegEnquadrament } from '../../../../components/universal/enquadrament/DialegEnquadrament.jsx';
import { opcionsSortida } from '../../../../components/universal/enquadrament/enquadrament.js';
import { ETIQUETA_CONSERVA_EXIF } from '../../../../components/universal/enquadrament/exifIncrustat.js';
import { AJUDA_FOTO, FORMES, useEnquadramentImatge } from '../../../../components/universal/enquadrament/useEnquadramentImatge.jsx';
import { PRECISIONS, textUbicacio } from '../../../../components/universal/enquadrament/geolocalitzacio.js';
import { sortidaAvatar, useEnquadramentAvatar } from '../../../profile/useEnquadramentAvatar.jsx';
import { MIDA_AVATAR } from '../../../../utils/pujadaImatge.js';
import { resolRecursPropi } from '../../../../config/assetResolver';
import { Llinatge } from '../Llinatge.jsx';

/* T46 (ordre del Mestre, 260928) · Re-enquadrar la capçalera. Una foto
   apaisada del mateix origen (1376×768): en quadrat es veu que el marc talla i
   que es pot moure; en 16:9 o 21:9, que la panoràmica hi cap (Directiva del
   Mestre, 261024, àudio 22:47). El diàleg només es munta obert: allLoaders el pinta tancat
   en jsdom, que no té canvas.
   Ordre del Mestre (261021, pla 261021_0015 §13, P1-05) · La bessona .webp
   (99 KB, també de 1376×768): l'original .jpg (764 KB) ja no ha de viatjar
   dins de l'app nativa. */
const MOSTRA = '/assets/notes/bloc_notes_vintage.webp';

/* Onada 4 · T3 · L'avatar de la IAIA que pinta avui el Xat (agentsSeed.js), una
   escena quadrada de 1024 px: el retall és la cara. Cap imatge nova ni tocada
   (core-identitat-visual): l'espècimen la llig i el retall no ix del navegador. */
const MOSTRA_AVATAR = '/assets/fotos/iaia-maria.png';

const urlDe = (fitxer) => (typeof URL.createObjectURL === 'function' ? URL.createObjectURL(fitxer) : '');

/** El text del fitxer que ha eixit del diàleg. Onada 4 · revisió (K1) · Només
    és «la foto sencera, sense tornar-la a codificar» quan el diàleg ha tornat
    l'ORIGINAL (`original`): amb `sortida` o amb la geolocalització, una foto
    sencera també es recodifica, a la mida de la sortida (opcionsSortida).
    Gauntlet 261016 (Bloc 1, Llei del Quadrat) · `sortida`, la del diàleg: la
    de l'avatar (sortidaAvatar) és exacta, 400 × 400, i el text ho diu. Sense,
    la de sempre (midaSortida, fins a 1.200 px). */
function descriu(fitxer, { format, rect, sencera }, original = null, sortida = null) {
  const tornada = sencera && fitxer === original;
  const mida = tornada ? { amplada: rect.w, alcada: rect.h } : opcionsSortida(rect, fitxer.type, sortida);
  const exactes = !tornada && Boolean(sortida?.exacta);
  return `${mida.amplada} × ${mida.alcada} px${exactes ? ' exactes' : ''}, forma ${format}, ${Math.max(1, Math.round(fitxer.size / 1024))} KB${tornada ? ' (la foto sencera, sense tornar-la a codificar)' : ''}`;
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

/* Onada 4 (retallador senzill, ordre del Mestre 261008) · El text del fitxer
   que ix de la finestra senzilla: la mida la decidix la forma (FORMES). Des
   del Gauntlet 261016 (Bloc 1, Llei del Quadrat), l'avatar 400 × 400
   (MIDA_AVATAR) i el logotip 600 × 600 són exactes. Només diu «exactes» si
   la forma porta `exacta`.
   Directiva del Mestre (261024, àudio 22:47) · La capçalera tria la forma i
   ix a 1.200 pel costat llarg (`costatLlarg`): el text diu la forma triada. */
const NOMS_FORMA = Object.freeze({ avatar: 'avatar en cercle', logotip: 'logotip quadrat', capcalera: 'capçalera' });
function descriuSenzill(forma, fitxer, { rect, format }) {
  const f = FORMES[forma];
  const mida = opcionsSortida(rect, fitxer.type, {
    ampladaMaxima: f.midaSortida, ...(f.exacta ? { exacta: f.exacta } : null), ...(f.costatLlarg ? { costatLlarg: f.costatLlarg } : null),
  });
  const detall = f.exacta ? ' exactes' : (f.costatLlarg ? `, ${f.costatLlarg} pel costat llarg` : '');
  const nom = f.costatLlarg ? `${NOMS_FORMA[forma]} en ${format}` : NOMS_FORMA[forma];
  return `${mida.amplada} × ${mida.alcada} px${detall}, ${nom}, ${Math.max(1, Math.round(fitxer.size / 1024))} KB`;
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

  /* Onada 4 (retallador senzill) · Les tres imatges de la fitxa del Perfil,
     pel mateix camí (useEnquadramentImatge): només canvien la proporció i la
     màscara. L'espècimen no puja res. */
  const [resultatSenzill, setResultatSenzill] = useResultat();
  const senzill = (forma) => ({
    forma,
    onEnquadrat: async (fitxer, info) => {
      setResultatSenzill({ url: urlDe(fitxer), text: descriuSenzill(forma, fitxer, info), redo: forma === 'avatar' });
    },
  });
  const avatarSenzill = useEnquadramentImatge(senzill('avatar'));
  const logotipSenzill = useEnquadramentImatge(senzill('logotip'));
  const capcaleraSenzill = useEnquadramentImatge(senzill('capcalera'));

  /* L'avatar, pel mateix camí que el Perfil: només quadrat i sense geolocalitzar.
     Gauntlet 261016 (Bloc 1) · El text diu la mida de la sortida de l'avatar (400 × 400 exactes). */
  const avatar = useEnquadramentAvatar({
    onEnquadrat: async (fitxer, info) => {
      setResultatAvatar({ url: urlDe(fitxer), text: descriu(fitxer, info, null, sortidaAvatar(fitxer)) });
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
      fitxer="src/components/universal/enquadrament/DialegEnquadrament.jsx · src/components/universal/enquadrament/useEnquadramentImatge.jsx · src/sections/profile/useEnquadramentAvatar.jsx"
      descripcio={`La foto de capçalera d’una nota és també la miniatura del llistat i la targeta del Mur. Abans de desar-la, este diàleg deixa triar-ne la forma (superpanoràmic, panoràmic, apaisat, quadrat, vertical o l’original; el quadrat, de sèrie i recomanat), moure-la i ampliar-la perquè el que importa no quede tallat. En quadrat, la miniatura i la targeta ensenyen la mateixa imatge sencera; en una altra forma, la pàgina l’ensenya sencera i la miniatura i la targeta la retallen en quadrat. La closca de les Notes i la fitxa del Perfil en demanen l’eixida de la capçalera: 1.200 px pel costat llarg (Directiva del Mestre, 261024). El retall es guarda dins de l’arxiu: la resta de la foto no es conserva. Si la nota ja és al Mur, la targeta no canvia fins que es torna a publicar. Si la foto porta la ubicació o la data, la casella «${ETIQUETA_CONSERVA_EXIF}» les conserva de sèrie. L’avatar de l’ajust d’imatge hi passa sempre amb una sola forma, el quadrat de 400 × 400, i sense l’opció de geolocalitzar. Les imatges de la fitxa del Perfil (avatar en cercle, logotip i capçalera) passen per la finestra senzilla, calcada de la de Claude.`}
      contracte={[
        ['obert', 'boolean', 'true', 'El pare el sol muntar només quan cal (la closca, l’espècimen).'],
        ['font', 'File | string', '—', 'Una foto nova (File) o l’adreça ja resolta de la capçalera existent.'],
        ['formatInicial', "'1:1' | 'original' | '4:3' | '3:2' | '16:9' | '21:9' | '4:5' | '3:4' | '9:16'", "'1:1'", 'Pedra Seca §8: el quadrat és el de sèrie.'],
        ['formats', '[{ valor, etiqueta, ajuda?, ratio }]', 'FORMATS', 'Per a afegir-ne un n’hi ha prou amb una fila nova (enquadrament.js). L’avatar en passa una sola (FORMATS_AVATAR); la capçalera de les Notes, totes, amb la seua ajuda (FORMATS_CAPCALERA de la closca: Directiva del Mestre, 261024, que deroga per a la capçalera la Llei del Quadrat).'],
        ['permetGeolocalitzacio', 'boolean', 'false', 'Onada 4 · Oferix «Vull geolocalitzar aquesta imatge» (ADR D5): les coordenades es lligen de l’original i viatgen com a camps. L’avatar no l’oferix mai.'],
        ['onTanca', "(motiu: 'esc'|'boto') => void", '—', 'Cancel·lar, la X i Escape. El vel no el tanca: un arrossegament no perd la feina.'],
        ['sortida', '{ ampladaMaxima, format, qualitat, exacta?, costatLlarg? } | null', 'null', 'Onada 4 · Amb sortida, el diàleg sempre recodifica (mai torna l’original). L’avatar (sortidaAvatar, mida exacta) i la capçalera de les Notes (sortidaCapcalera de la closca, costat llarg exacte) en passen una a cada obertura.'],
        ['onDesa', '(fitxer, { format, rect, sencera }, metadades) => Promise<boolean>', '—', 'El pare el tanca. Si llança, el missatge ix dins del diàleg i continua obert. metadades, sempre present: { geolocalitzacio: { lat, lng, precisio_m, origen } | null, dataCaptura | null }. Amb la casella de l’EXIF (ofereixConservarExif), també metadades.exif: { conservaExif: true, original } (marcada) o { conservaExif: false } (desmarcada), a punt per a les opcions de la pujada. Sense casella, cap clau exif.'],
        ['carregador / exportador / dibuixant', 'funcions', 'imatgeCanvas.js', 'Injectables per a les proves (jsdom no té canvas).'],
        ['senzill', 'boolean', 'false', 'Onada 4 · La finestra de Claude per a les imatges de la fitxa: el visor sol, la fila de zoom (−, lliscador, +) i la roda, i Restablir, Cancel·lar i Guardar. Sense lliscadors de posició, sense geolocalització i sense la X (Escape tanca). La Forma, només si n’hi ha més d’una (la capçalera, Directiva del Mestre 261024), davall del zoom. Sense la prop, el T46 de sempre.'],
        ['mascara', "null | 'cercle'", 'null', 'Onada 4 · Amb el mode senzill, el vel enfosquix el que queda fora del cercle (l’avatar). El fitxer continua quadrat.'],
        ['sortida.exacta', '{ amplada, alcada } | absent', '—', 'Onada 4 · El fitxer fa exactament eixa mida, també si cal ampliar el retall. Gauntlet 261016 (Llei del Quadrat): l’avatar, 400 × 400; el logotip, 600 × 600.'],
        ['sortida.costatLlarg', 'enter > 0 | absent', '—', 'Directiva del Mestre (261024) · El costat llarg del fitxer fa exactament eixa mida, també si cal ampliar el retall, i l’altre seguix la forma triada: la capçalera, 1.200 pel costat llarg (1.200 × 1.200 en quadrat, 1.200 × 675 en 16:9, 675 × 1.200 en 9:16). Si també hi ha exacta, mana exacta.'],
        ['ofereixConservarExif', 'boolean', 'false', `Gauntlet 261016 (Bloc 1.2) · Si la foto triada (un File) porta la ubicació o la data, la casella «${ETIQUETA_CONSERVA_EXIF}», marcada de sèrie, amb l’avís que es publicaran amb la foto (en els dos modes). La tria arriba a onDesa (metadades.exif) i la compressió de qui puja hi torna a posar l’EXIF publicable de l’original: el fitxer que lliura el diàleg no en porta. L’oferixen la closca de les Notes, la fitxa del Perfil (avatar i capçalera) i l’avatar de l’ajust d’imatge; el logotip, no. lectorExif, injectable per a les proves.`],
      ]}
      a11y={[
        'Tres lliscadors natius amb etiqueta (ampliació en percentatge, posició horitzontal i vertical): tot es fa amb teclat.',
        'Un lliscador desactivat diu per què (la foto ja omple el marc en eixa direcció).',
        'El visor és una imatge descrita (role="img"); arrossegar i el pessic amb dos dits són una drecera, no l’únic camí.',
        'Forma en ràdios natius dins d’un fieldset; errors en línia amb role="alert".',
        'Escape tanca sempre; el focus torna al botó que l’ha obert o, després de desar, a la capçalera nova.',
        'L’avatar: cancel·lar no puja res i el focus torna a «Triar la imatge» (o al selector de fitxers de l’ajust).',
        'La finestra senzilla: − i + són botons amb nom («Allunyar», «Apropar») i zona tàctil sencera, i es desactiven als límits; el lliscador «Ampliació» diu el percentatge; les fletxes, + i − i Retorn funcionen sobre el visor; la roda no desplaça el diàleg. Sense la X, Escape tanca.',
      ]}
      fes={[
        'El quadrat de sèrie: capçalera, miniatura i targeta ensenyen el mateix enquadrament (la targeta del Mur d’una nota ja publicada, quan es torna a publicar).',
        'Deixar triar la forma de la capçalera (Directiva del Mestre, 261024): una panoràmica de joies hi ha de cabre sencera.',
        'Ensenyar el resultat exacte abans de desar (el visor és el retall).',
        'Una sola imatge per diàleg.',
        'L’avatar, sempre per useEnquadramentAvatar: un sol lloc decidix la forma (1:1), el títol i la privacitat.',
        'Les imatges de la fitxa del Perfil, per useEnquadramentImatge (la taula FORMES): avatar en cercle de 400 × 400 i logotip quadrat de 600 × 600, exactes, i capçalera de forma lliure (el quadrat de sèrie) de 1.200 pel costat llarg, amb 10 MB d’entrada dits abans de triar.',
      ]}
      noFacis={[
        'Retallar sense ensenyar el resultat.',
        'Tornar a posar un diàleg intermedi entre el botó i la finestra: cada imatge té el seu botó.',
        'Oferir a l’avatar una altra forma que el quadrat, o geolocalitzar-lo.',
        'Tancar la capçalera en una sola forma, o prometre que la miniatura i la targeta ensenyen sencera una capçalera que no és quadrada: la retallen en quadrat.',
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
          {/* Gauntlet 261016 (Bloc 1, Llei del Quadrat) · La mostra és el diàleg sense
              props. Directiva del Mestre (261024) · La closca de les Notes hi passa
              totes les formes, amb la seua ajuda, i l'eixida de 1.200 pel costat llarg. */}
          <figcaption className="sdp-camp__ajuda">
            Ha eixit un fitxer de {resultat.text}. És el diàleg sense props: a l’editor de Notes hi ha les mateixes formes, el quadrat de sèrie, i el fitxer ix a 1.200 px pel costat llarg, que la compressió de sempre passa a WebP sense canviar-ne la mida.
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
          {/* Gauntlet 261016 (Bloc 1, Llei del Quadrat) · La mida és la de la font única
              (MIDA_AVATAR, utils/pujadaImatge.js), la que llig DetallAjust. El retallador
              ja l'exporta a eixa mida exacta (sortidaAvatar): la compressió no la canvia. */}
          <figcaption className="sdp-camp__ajuda">
            Ha eixit un fitxer de {resultatAvatar.text}. Al Perfil, este fitxer passa després per la compressió de l’avatar (WebP, {MIDA_AVATAR} × {MIDA_AVATAR} px, sense tornar-lo a reduir) i puja com un sol fitxer.
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

      <h4>Les imatges de la fitxa: la finestra senzilla</h4>
      <p className="sdp-camp__ajuda">
        Al Perfil, «Capçalera» i «Avatar» (o «Logotip») són dos botons separats i obrin la mateixa finestra, calcada de la de Claude: arrossegar, el zoom amb − i +, el lliscador o la roda, i Restablir, Cancel·lar i Guardar. Abans de triar la foto es diu què s’admet: {AJUDA_FOTO}
      </p>
      <div className="sdp-alerta__accions">
        {/* Encastat, '/assets/…' va per la base del paquet (resolRecursPropi). */}
        <Boto icona={Circle} aria-haspopup="dialog" onClick={() => avatarSenzill.obri(resolRecursPropi(MOSTRA_AVATAR))}>Avatar en cercle</Boto>
        <Boto icona={Square} aria-haspopup="dialog" onClick={() => logotipSenzill.obri(resolRecursPropi(MOSTRA_AVATAR))}>Logotip quadrat (600 × 600)</Boto>
        {/* Directiva del Mestre (261024, àudio 22:47) · La capçalera tria la forma (abans,
            Gauntlet 261016, només quadrada): el nom i la icona ho diuen. */}
        <Boto icona={Proportions} aria-haspopup="dialog" onClick={() => capcaleraSenzill.obri(resolRecursPropi(MOSTRA))}>Capçalera de forma lliure (1.200 pel costat llarg)</Boto>
      </div>
      {resultatSenzill ? (
        <figure className="sdp-enquadrament__resultat">
          {resultatSenzill.url ? (
            resultatSenzill.redo ? (
              <div className="sdp-avatar sdp-avatar--xl">
                <img src={resultatSenzill.url} alt="El resultat de la finestra senzilla" className="sdp-avatar__imatge" />
              </div>
            ) : <img src={resultatSenzill.url} alt="El resultat de la finestra senzilla" />
          ) : null}
          <figcaption className="sdp-camp__ajuda">
            Ha eixit un fitxer de {resultatSenzill.text}. Al Perfil puja com un sol fitxer, sense tornar-lo a reduir.
          </figcaption>
        </figure>
      ) : null}

      {font ? <DialegEnquadrament font={font} onTanca={() => setFont(null)} onDesa={desa} /> : null}
      {avatar.dialeg}
      {fontGeo ? <DialegEnquadrament font={fontGeo} permetGeolocalitzacio onTanca={() => setFontGeo(null)} onDesa={desaGeo} /> : null}
      {avatarSenzill.dialeg}
      {logotipSenzill.dialeg}
      {capcaleraSenzill.dialeg}
    </Especimen>
    </>
  );
}
