/**
 * ConnexioDetall.jsx — T54 · El lector d'una connexió del MAS (Safata
 * d’Entrada): contingut d'altri connectat per a llegir-lo després.
 *
 * D4 (excepció del Mestre, 260930) · La connexió ara és una còpia editable i
 * NotesDetail l'obri amb NotesEditor: este lector ja no el munta cap vista.
 * Es conserva (amb les seues proves) fins que el Mestre decidisca si torna
 * com a vista de lectura o es retira; no s'ha esborrat cap fitxer.
 *
 *   · Si l'original és a les dades que ja tenen els proveïdors (Mur, Mercat,
 *     agenda, Pobles, Multimèdia), es pinta la pàgina de l'autor tal com és
 *     (elementDeSeccio.js: paginaDElement + renderBody de la secció), dins de
 *     la columna (layout="contained", com PublicacioDetall).
 *   · T71 · Si és una pàgina de text (/ia, /projecte, /page/:slug…), la
 *     pàgina de veres amb les props de TextSection (text/paginaDeText.js) i el
 *     seu cos sanejat. Manen les dades resoltes, mai el títol ni l'autor que
 *     l'URL de Connectar va deixar a l'origen.
 *   · Si no (un perfil, una pàgina amb query, un element d'un altre poble o
 *     que ja no hi és), una pàgina de caiguda amb el títol que recorda
 *     l'origen, un avís i «Obri l'original». Si la font no s'ha pogut
 *     carregar, ho diu així: no sabem si l'original hi és. Qui signa la
 *     caiguda no s'inventa (connexions.js · signaturaDeCaiguda): un perfil
 *     es signa ell mateix, i sense autor conegut la barra no en posa cap.
 *     El cos desat (memòria cau) només es pinta ací.
 *   · Cap editor: ni DocumentEditor ni camps editables, ni ploma ni
 *     emoticona. La barra blava continua (Índex, Traduir, Comentar) sense
 *     Connectar (ja és al MAS), i Compartir envia l'enllaç de l'original,
 *     mai el de la nota (/notes?nota=… només l'obri qui la té). T63.2 ·
 *     Comentar també és de l'original (connexions.js · objecteDeConnexio):
 *     el seu xat comú, o el directe d'una persona o una IA; la nota no en té.
 *   · Davall del contingut, una tira de recopilació (no és cap barra
 *     d'edició): «Obri l'original», «Compartir al Mur», la carpeta i
 *     «Borrar», amb els diàlegs de sempre i les accions del context de Notes.
 *     Compartir al Mur és la de l'editor d'abans de T54 (compartirNota, amb el
 *     selector de visibilitat i els textos de visibilitatNota.js): ix citant
 *     l'origen, i només amb sessió i amb servidor (en seed i local no hi ha
 *     Mur). Al Mur no hi va el cos desat de la nota, que és privat: publishNote
 *     hi posa el que munta connexions.js (cosDeConnexioPerAlMur) amb l'origen.
 *     Ja compartida, el botó diu «Actualitzar al Mur», com el selector. Les
 *     categories i les etiquetes es trien en connectar; canviar-les ací
 *     espera que la lògica de NotesEditor es puga compartir sense duplicar-la.
 */
import { useState } from 'react';
import { ExternalLink, Folder, Globe, Trash2 } from 'lucide-react';
import { useNavigate } from '../../app/contexts/RouterContext';
import { useToast } from '@/components/universal/NotificationContext.jsx';
import { useSession } from '../../app/contexts/SessionContext.jsx';
import { useIdentitat } from '../../app/contexts/IdentitatContext.jsx';
import { useUIActions } from '../../app/contexts/UIContext';
import { UniversalPage } from '../../components/universal/UniversalPage';
import { dataHoraDeBarra } from '../../components/universal/editorial.js';
import { SelectorVisibilitat } from '../../components/universal/SelectorVisibilitat.jsx';
import { Alerta, Boto, Carregant } from '../../components/PedraSeca/index.js';
import { compartix, urlPerCompartir, useUbicacioApp } from '../../components/PedraSeca/hooks/useAccions.js';
import { DialegCarpeta } from '../../components/universal/classificacio/DialegCarpeta.jsx';
import { rutaDePerfil } from '../../config/navigation.js';
import { renderRichText } from '../detail/detailRichText.jsx';
import { paginaDElement, useOriginalDeConnexio } from '../detail/elementDeSeccio.js';
import { propsDePaginaDeText } from '../text/paginaDeText.js';
import { sanitizeHtml } from '../../utils/sanitize';
import { resolRecursosDeHtml } from '../../config/assetResolver.js';
import { ETIQUETA_OBJECTE } from '../connectar/abastConnexio.js';
import { useNotes } from './NotesContext.jsx';
import { DialegEsborrarNota } from './DialegEsborrarNota.jsx';
import { CARPETA_CONNECTATS, NOM_CARPETA_CONNECTATS, carpetesDelBloc } from './carpetes.js';
import { bloqueigDeNota, publicaAmbMotiu, textosDeNota } from './visibilitatNota.js';
import { autoriaDeLActor } from './autoriaNota.js';
import { objecteDeConnexio, rutaSegura, senseParagrafHeretat, signaturaDeCaiguda } from './connexions.js';

/* Carpetes: el port de dades no té cap mètode per a crear-ne, reanomenar-ne ni
   esborrar-ne (AGENTS §8). El diàleg ho diu, com a l'editor de Notes. */
const AVIS_CARPETES = 'Crear, reanomenar i esborrar carpetes encara no té contracte de dades amb el servidor. De moment, tria la carpeta d’esta connexió.';
const SENSE_ENLLAC = 'Esta connexió no porta cap enllaç de l’original per a compartir.';
const TEXTOS_MUR = textosDeNota({ connexio: true });

export function ConnexioDetall({ nota }) {
  const origen = nota?.origen || {};
  const navigate = useNavigate();
  const router = useUbicacioApp();
  const { showToast } = useToast();
  const { currentUser } = useSession();
  const { actor } = useIdentitat();
  const { t } = useUIActions();
  const {
    noteFolders, setLocalNoteField, mouNota, esborraNota, compartirNota, potEsborrar = false, config
  } = useNotes() || {};
  /* T71 · el resolvedor únic: element d'una secció o pàgina de text. */
  const { section, item, page, pageKey, estat, targeta } = useOriginalDeConnexio(origen);
  const [dialeg, setDialeg] = useState(null); // 'carpeta' | 'esborrar' | 'mur' | null
  const [borrant, setBorrant] = useState(false);

  /* La ruta es validà en connectar; ací es torna a mirar perquè ve de dades
     desades, amb la mateixa regla que el cos del Mur (connexions.js). */
  const ruta = rutaSegura(origen);
  const titolOrigen = origen.titol || nota?.title || 'Element connectat';
  /* Resolt l'original, el seu títol; si no, el que recorda l'origen. */
  const titolCompartit = targeta?.titol || titolOrigen;
  const onShare = () => (ruta
    ? compartix(titolCompartit, urlPerCompartir(ruta, router), showToast)
    : showToast(SENSE_ENLLAC, 'info'));
  /* T63.2 · Comentar va al xat de l'ORIGINAL, en les tres vistes, i mai al de
     la nota (/notes?nota=…), que és privada. Un contingut de fora no té
     Pàgina Universal: objecte null, el botó es queda i el clic avisa. Una
     connexió a una nota tampoc en té: no es pinta. */
  const comentar = { objecte: objecteDeConnexio(origen) };

  /* Carpeta: les del Bloc (amb la Safata d’Entrada sempre present), pel mateix
     canal que la resta de camps de la nota (setLocalNoteField desa i pinta). */
  const carpetes = carpetesDelBloc(noteFolders).map((carpeta) => ({ id: String(carpeta.id), nom: carpeta.name }));
  const carpetaId = String(nota?.folderId ?? CARPETA_CONNECTATS);
  const nomCarpeta = carpetes.find((carpeta) => carpeta.id === carpetaId)?.nom || NOM_CARPETA_CONNECTATS;
  const potMoure = Boolean(nota?.id && setLocalNoteField);
  const desaCarpeta = (id) => {
    if (id && id !== carpetaId) setLocalNoteField(nota.id, 'folderId', id);
    setDialeg(null);
  };

  /* Borrar: el mateix criteri que l'editor de Notes. Capacitat 'cicleNotes'
     del backend i nota pròpia: amb sessió o, en seed i local, del dispositiu. */
  const modeLocal = config?.dataMode === 'seed' || config?.dataMode === 'local';
  const pucBorrar = Boolean(potEsborrar && (currentUser || modeLocal) && nota?.id && mouNota && esborraNota);
  const triaBorrar = async (opcio) => {
    if (borrant) return;
    setBorrant(true);
    const fet = opcio === 'definitiu' ? await esborraNota(nota) : await mouNota(nota, opcio);
    setBorrant(false);
    if (fet) setDialeg(null);
  };

  /* Compartir al Mur: la mateixa acció del context que feia servir l'editor
     (compartirNota → publishNote en mode 'compartir', amb l'origen) i el mateix
     selector. Només amb sessió i amb Mur: en seed i local, o sense sessió,
     bloqueigDeNota bloqueja «pública» i el botó no ix. Una connexió ja
     compartida es pot actualitzar, no retirar (ho diu el selector), i el botó
     de la tira ho diu amb el mateix text que el selector. Els errors es
     tradueixen com a l'editor (publicaAmbMotiu). */
  const compartida = Boolean(nota?.isPublished);
  const bloqueigMur = bloqueigDeNota({ foraster: !currentUser, modeLocal, publicada: compartida, connexio: true });
  const pucCompartirAlMur = Boolean(currentUser && compartirNota && nota?.id && bloqueigMur?.opcio !== 'publica');
  const autoria = autoriaDeLActor(actor, currentUser);
  const accioMur = compartida ? TEXTOS_MUR.publica.accioIgual : TEXTOS_MUR.publica.accio;
  const triaMur = async (publica) => (publica ? publicaAmbMotiu(() => compartirNota(nota)) : true);

  const tira = (
    <div className="sdp-connexio-lector__tira" role="group" aria-label="Recopilació de la connexió">
      {ruta ? (
        <Boto varietat="secundari" icona={ExternalLink} onClick={() => navigate(ruta)}>Obri l’original</Boto>
      ) : null}
      {pucCompartirAlMur ? (
        <Boto varietat="secundari" icona={Globe} onClick={() => setDialeg('mur')}>{accioMur}</Boto>
      ) : null}
      {potMoure ? (
        <Boto varietat="secundari" icona={Folder} onClick={() => setDialeg('carpeta')}>{`Carpeta: ${nomCarpeta}`}</Boto>
      ) : null}
      {pucBorrar ? (
        <Boto varietat="secundari" icona={Trash2} onClick={() => setDialeg('esborrar')}>Borrar</Boto>
      ) : null}
    </div>
  );

  const dialegs = (
    <>
      {dialeg === 'carpeta' && potMoure ? (
        <DialegCarpeta obert onTanca={() => setDialeg(null)} opcions={carpetes} seleccionada={carpetaId}
          onDesa={desaCarpeta} avis={AVIS_CARPETES} />
      ) : null}
      {dialeg === 'esborrar' && pucBorrar ? (
        <DialegEsborrarNota obert nota={nota} onTanca={() => setDialeg(null)} onTria={triaBorrar} ocupat={borrant} />
      ) : null}
      {/* Muntat mentre es pot compartir, com a DocumentEditor: el selector
          continua on era si el navegador el tanca mentre treballa. */}
      {pucCompartirAlMur ? (
        <SelectorVisibilitat obert={dialeg === 'mur'} onTanca={() => setDialeg(null)}
          esPublica={compartida} onTria={triaMur} textos={TEXTOS_MUR}
          bloqueig={bloqueigMur} comNom={autoria?.nom || null} />
      ) : null}
    </>
  );

  if (item) {
    return (
      <>
        <UniversalPage chrome="context" layout="contained" {...paginaDElement(section, item)}
          onConnect={false} onShare={onShare} {...comentar}>
          {section.renderBody(item)}
          {tira}
        </UniversalPage>
        {dialegs}
      </>
    );
  }

  /* T71 · Una pàgina de text: la de veres, amb les props de TextSection i el
     seu cos sanejat (com TextSection, també les imatges amb la base de
     l'amfitrió, SPEC G). Sense autor propi, com a la ruta: la barra taronja
     signa amb el de sèrie. Sense els logos ni els fills vius de la ruta (el
     tauler de /legal): és una lectura dins de la columna. */
  if (page) {
    return (
      <>
        <UniversalPage chrome="context" layout="contained" {...propsDePaginaDeText(page, pageKey, t)}
          onConnect={false} onShare={onShare} {...comentar}>
          <article className="cms-preview" dangerouslySetInnerHTML={{ __html: sanitizeHtml(resolRecursosDeHtml(page.html)) }} />
          {tira}
        </UniversalPage>
        {dialegs}
      </>
    );
  }

  /* Caiguda: qui signa no s'inventa. Un perfil es signa ell mateix; si no,
     l'autor que recorda l'origen; sense cap, la barra no en posa cap (mai
     «Sóc de Poble» ni el Foraster per defecte). */
  const signatura = signaturaDeCaiguda(origen);
  const rutaSignatura = signatura?.ruta || (signatura ? rutaDePerfil(origen.autorTipus, origen.autorId) : null);
  /* Gauntlet 261016 (Bloc 3; Directiva de Dignitat Humana, pla 261015_1900)
     · Una connexió a una PERSONA no porta la píndola del tipus: una persona
     no es categoritza. Mana el tipus de l'objecte representat (origen.objecte,
     el del descriptor), com a la seua fitxa pública i a la seua targeta. Una
     entitat, un grup, una IA o una obra conserven la seua. */
  const etiquetes = origen.objecte === 'persona'
    ? []
    : [{ text: ETIQUETA_OBJECTE[origen.objecte] || 'Element', className: 'sdp-badge-system' }];

  return (
    <>
      <UniversalPage
        chrome="context"
        layout="contained"
        title={titolOrigen}
        labels={etiquetes}
        /* T51 · sense l'original, el document que es llig és la connexió
           desada: la seua data real (creació o última modificació). */
        {...dataHoraDeBarra({ creat: nota?.createdAt, modificat: nota?.updatedAt })}
        topBarData={{
          authorName: signatura?.nom || '',
          authorAvatar: '',
          authorLocation: '',
          authorHref: rutaSignatura || null
        }}
        onConnect={false}
        onShare={onShare}
        {...comentar}
      >
        {estat === 'carregant' ? <Carregant etiqueta="Carregant l’original…" /> : null}
        {/* La font de la secció ha fallat (xarxa, servidor): no sabem si
            l'original hi és, i no es diu que no hi siga. */}
        {estat === 'error' ? (
          <Alerta to="avis" titol="No s’ha pogut carregar l’original">
            {ruta
              ? 'Ara mateix no arriba el contingut d’on ve. Obri’l a la seua pàgina o torna-ho a provar d’ací a una estona.'
              : 'Ara mateix no arriba el contingut d’on ve, i la connexió no en porta l’enllaç.'}
          </Alerta>
        ) : null}
        {estat === 'absent' ? (
          <Alerta to="info" titol="L’original no es pot mostrar ací">
            {ruta
              ? 'No és entre el que s’ha carregat ací (un perfil, una pàgina, un altre poble o un element retirat). Obri’l a la seua pàgina.'
              : 'No és entre el que s’ha carregat ací i la connexió no en porta l’enllaç.'}
          </Alerta>
        ) : null}
        {renderRichText(senseParagrafHeretat(nota?.content))}
        {tira}
      </UniversalPage>
      {dialegs}
    </>
  );
}

export default ConnexioDetall;
