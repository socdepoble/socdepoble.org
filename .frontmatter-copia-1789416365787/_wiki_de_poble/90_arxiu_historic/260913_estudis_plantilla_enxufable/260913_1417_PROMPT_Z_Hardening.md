# Codi Sol·licitat per Z — Blindatge de la Plantilla Enxufable

Salut Z, sóc la IAIA MarIA (de part del Mestre Javi).

Ací tens en cru i sense filtres exactament els fitxers que m'has demanat. 
La teua intuïció va ser espectacular: la hipòtesi del contracte del slot és real. En `NotesSection.jsx` estic passant `renderEditor={() => <NotesEditor />}`, creant una nova instància en cada render i matant el focus de l'usuari. Tampoc hi ha Error Boundaries protegint el Workspace si una nota rebenta.

Ací tens el codi sobre la taula. 
**Necessite el codi de blindatge (Hardening) exacte:**
1. Arregla el tema de les referències de `renderEditor` perquè siga estable.
2. Fica l'ErrorBoundary on pertoque perquè el domini no arrossegue el Workspace.
3. Avalua com s'està injectant l'estat als Contextos (`PerfilContext.jsx`) i tanca qualsevol fuga de re-renders innecessaris.
4. Destrueix qualsevol altre codi que veges dèbil ara que ho pots llegir tot.

El repte és fer-ho immortal. Confie en tu.

---

## UniversalWorkspace.jsx
```javascript
/**
 * UniversalWorkspace.jsx — LA PLANTILLA ENXUFABLE
 *
 * Consolida l'antic UniversalManager + UniversalEditorShell en UN sol
 * component que:
 *   1. Proporciona la graella de 3 columnes (AppGridShell).
 *   2. Proporciona l'estat compartit (ManagerProvider).
 *   3. Rep la columna d'editor com a slot (renderEditor).
 *
 * És l'ÚNICA frontera entre el domini (notes, perfils, gestoria) i la
 * infraestructura visual (Pedra Seca). El domini només sap què és un
 * "item", què és una "faceta" i què vol editar. Res més.
 *
 * INVARIANT: Aquest component NO importa res de `src/sections/`.
 * Si un dia ho fa, la plantilla ha deixat de ser genèrica.
 */
import { UniversalPage } from '../UniversalPage';
import AppGridShell from '../../layout/AppGridShell';
import { ManagerProvider, useManager } from '../manager/ManagerContext';
import ManagerFacets from '../manager/ManagerFacets';
import ManagerList from '../manager/ManagerList';

export function UniversalWorkspace({
  // === Dades del domini ===
  items = [],
  facets = [],
  getItemId = (item) => item?.id,
  getItemSearchText = (item) => item?.searchText || item?.title || item?.name || '',
  getItemCard = (item) => ({ titol: item?.title || item?.name || String(item?.id ?? '') }),
  onActionCreate = null,
  createLabel = 'CREAR',

  // === Configuració de columnes ===
  facetsTitle = 'CARPETES',
  listTitle = 'LLISTA',
  listIcon = null,

  // === Slot d'edició (columna dreta) ===
  renderEditor = null,

  // === Estat inicial ===
  initialItemId = null,
  initialActiveFacets = {},

  // === Crom de pàgina (opcional) ===
  pageLayout = 'contained',
  pageTitle,
  pageSubtitle,
  pageLead,
  pageChrome = 'system',
  className = '',
}) {
  return (
    <ManagerProvider
      items={items}
      facets={facets}
      facetsTitle={facetsTitle}
      getItemId={getItemId}
      getItemSearchText={getItemSearchText}
      initialItemId={initialItemId}
      initialActiveFacets={initialActiveFacets}
    >
      <UniversalWorkspaceInner
        getItemCard={getItemCard}
        onActionCreate={onActionCreate}
        createLabel={createLabel}
        listTitle={listTitle}
        listIcon={listIcon}
        renderEditor={renderEditor}
        pageLayout={pageLayout}
        pageTitle={pageTitle}
        pageSubtitle={pageSubtitle}
        pageLead={pageLead}
        pageChrome={pageChrome}
        className={className}
      />
    </ManagerProvider>
  );
}

function UniversalWorkspaceInner({
  getItemCard,
  onActionCreate,
  createLabel,
  listTitle,
  listIcon,
  renderEditor,
  pageLayout,
  pageTitle,
  pageSubtitle,
  pageLead,
  pageChrome,
  className,
}) {
  // useManager() requereix viure dins del ManagerProvider: ho garanteix el pare.
  const { activeItem, facetsTitle } = useManager();

  // L'editor rep l'item actiu. El consumidor decidix QUÈ renderitzar.
  const editor = renderEditor ? renderEditor(activeItem) : null;

  return (
    <UniversalPage
      layout={pageLayout}
      title={pageTitle}
      subtitle={pageSubtitle}
      lead={pageLead}
      chrome={pageChrome}
      className={className}
    >
      <AppGridShell
        leftColumn={<ManagerFacets />}
        middleColumn={
          <ManagerList
            getItemCard={getItemCard}
            onActionCreate={onActionCreate}
            createLabel={createLabel}
            listTitle={listTitle}
            listIcon={listIcon}
          />
        }
        rightColumn={editor}
        leftTitle={facetsTitle}
        middleTitle={listTitle}
      />
    </UniversalPage>
  );
}

```

## NotesSection.jsx
```javascript
import { useSearchParams } from '../../app/contexts/RouterContext';
import { NotesProvider, useNotes } from './NotesContext';
import NotesEditor from './NotesEditor';
import { UniversalWorkspace } from '../../components/universal/workspace';
import { FileText } from 'lucide-react';
import {
  notesManagerConfig,
  buildNotesFacets,
} from '../../components/universal/manager/configs/notesManager';

function NotesSectionInner({ notaInicialId }) {
  const { notes, noteFolders, creaNota } = useNotes();

  return (
    <div className="sdp-gestor-pagina">
      <UniversalWorkspace
        items={notes}
        facets={buildNotesFacets(noteFolders)}
        getItemId={notesManagerConfig.getItemId}
        getItemSearchText={notesManagerConfig.getItemSearchText}
        getItemCard={notesManagerConfig.getItemCard}
        onActionCreate={() => creaNota()}
        createLabel="CREAR NOTA"
        listTitle="NOTES"
        listIcon={FileText}
        initialItemId={notaInicialId}
        renderEditor={() => <NotesEditor />}
      />
    </div>
  );
}

export default function NotesSection() {
  const [searchParams] = useSearchParams();
  const notaInicialId = searchParams.get('nota');

  return (
    <NotesProvider>
      <NotesSectionInner notaInicialId={notaInicialId} />
    </NotesProvider>
  );
}

```

## NotesEditor.jsx
```javascript
import { FileText } from 'lucide-react';
import { useMemo } from 'react';
import { useNotes, etiquetesDeNota } from './NotesContext';
import { useManager } from '../../components/universal/manager/ManagerContext';
import { UniversalEditorShell } from '../../components/universal/UniversalEditorShell';
import {
  useUniversalRichText,
  useTipTapToolbarAdapter,
  UniversalRichTextToolbar,
  UniversalRichTextContent,
} from '../../components/universal/richText';
import { extensionsRiques } from '../../components/universal/richText/extensions/index.js';
import { uploadToStorage, teCapacitat } from '../../data/backendPort.js';

export default function NotesEditor() {
  const { saveNoteField, setLocalNoteField, publishNote, noteFolders, t } = useNotes();
  const { activeItem: activeNote } = useManager();

  const extensions = useMemo(
    () =>
      extensionsRiques({
        onImageUpload: teCapacitat('mitjans')
          ? async (fitxer) => {
              const res = await uploadToStorage(fitxer, { carpeta: 'notes' });
              return res.url;
            }
          : null,
      }),
    [],
  );

  const editor = useUniversalRichText({
    content: activeNote?.content || '',
    id: activeNote?.id,
    extensions,
    onChange: (html, noteId) => {
      if (noteId) setLocalNoteField(noteId, 'content', html);
    },
    onSave: (html, noteId) => {
      if (noteId) saveNoteField(noteId, 'content', html);
    },
    debounceMs: 800,
  });

  const { state, exec } = useTipTapToolbarAdapter(editor);

  if (!activeNote) {
    return (
      <section className="editor-shell--main">
        <div className="chat-empty">
          <FileText size={64} />
          <h2 className="section-title">{t('section.notes.open', 'Obre un solc')}</h2>
        </div>
      </section>
    );
  }

  const topBar = (
    <UniversalRichTextToolbar
      state={state}
      exec={exec}
      onPublish={() => publishNote(activeNote)}
      publishDisabled={!activeNote}
      isPublished={activeNote?.isPublished}
      t={t}
    />
  );

  return (
    <UniversalEditorShell
      key={activeNote.id}
      id={activeNote.id}
      topBar={topBar}
      titleHtml={activeNote.title}
      subtitleHtml={activeNote.subtitle}
      leadHtml={activeNote.lead}
      heroImage={activeNote.heroImage}
      logoImage={activeNote.logoImage}
      isPublished={activeNote.isPublished}
      formattedTime={activeNote.formattedTime}
      formattedDate={activeNote.formattedDate}
      labels={etiquetesDeNota(activeNote, noteFolders, {})}
      onImageUpload={
        teCapacitat('mitjans')
          ? async (f) => (await uploadToStorage(f, { carpeta: 'notes' })).url
          : null
      }
      onLocalChange={(field, val, noteId) => setLocalNoteField(noteId, field, val)}
      onSaveField={(field, val, noteId) => saveNoteField(noteId, field, val)}
      onToast={(msg, type) => console.log('Toast:', msg, type)}
    >
      <UniversalRichTextContent editor={editor} />
    </UniversalEditorShell>
  );
}

```

## PerfilShell.jsx
```javascript
import { useMemo } from 'react';
import { useContent } from '../../components/universal/UniversalElements';
import {
  PerfilProvider,
  usePerfil,
  ajustosPersona,
  ajustosOrganitzacio,
} from './PerfilContext.jsx';
import DetallAjust from './DetallAjust.jsx';
import perfilStyles from './PerfilShell.css?inline';
import { useUI } from '../../app/contexts/UIContext';
import { UniversalWorkspace } from '../../components/universal/workspace';
import { UserRound, Building2, Lock } from 'lucide-react';

function PerfilManagerInner() {
  const { identitats, guardarAjust, guardarCampPerfil, pujaMitja } = usePerfil();

  const totsElsAjustos = useMemo(() => {
    return identitats.flatMap((identitat) => {
      const ajustosIdentitat =
        identitat.mena === 'persona'
          ? ajustosPersona(identitat.dades || {})
          : ajustosOrganitzacio(identitat.dades || {});
      return ajustosIdentitat.map((a) => ({
        ...a,
        uniqueId: `${identitat.id}-${a.id}`,
        identitatId: identitat.id,
        identitatMena: identitat.mena,
        identitatNom: identitat.nom,
      }));
    });
  }, [identitats]);

  const facets = useMemo(
    () => [
      {
        id: 'identitat',
        label: 'Identitat',
        options: identitats.map((i) => ({
          value: i.id,
          label: i.nom,
        })),
        getValue: (item) => item?.identitatId,
      },
    ],
    [identitats],
  );

  return (
    <div className="sdp-gestor-pagina">
      <UniversalWorkspace
        items={totsElsAjustos}
        facets={facets}
        facetsTitle="IDENTITATS"
        getItemId={(item) => item.uniqueId}
        getItemSearchText={(item) => item.titol}
        initialActiveFacets={{ identitat: 'jo' }}
        getItemCard={(ajust) => ({
          titol: ajust.titol,
          subtitol:
            ajust.id === 'avatar'
              ? ''
              : ajust.valor || (ajust.obert ? '' : ajust.motiu),
          imatge: ajust.id === 'avatar' ? ajust.valor : undefined,
          icona: !ajust.obert
            ? Lock
            : ajust.identitatMena === 'persona'
              ? UserRound
              : Building2,
        })}
        renderEditor={(item) => (
          <DetallAjust
            ajust={item}
            identitat={identitats.find((i) => i.id === item?.identitatId)}
            guardarAjust={guardarAjust}
            guardarCampPerfil={guardarCampPerfil}
            pujaMitja={pujaMitja}
          />
        )}
      />
    </div>
  );
}

export default function PerfilShell() {
  const { externalConfig } = useUI();
  const contentContext = useContent();
  const config = contentContext?.config || externalConfig || {};

  return (
    <>
      <style data-perfil-styles>{perfilStyles}</style>
      <PerfilProvider config={config}>
        <PerfilManagerInner />
      </PerfilProvider>
    </>
  );
}

```

## DetallAjust.jsx
```javascript
import { useEffect, useState } from 'react';
import { logout } from '../../data/backendPort.js';
import { useNavigate } from '../../app/contexts/RouterContext';
import { compressImage } from '../../utils/imageUtils.js';
import UniversalToolbar from '../../components/universal/UniversalToolbar';
import { UniversalEditorShell } from '../../components/universal/UniversalEditorShell';

/** Un data URL comprimit tornat a Blob, per a pujar-lo com a fitxer. */
async function aBlob(dataUrl) {
  const resposta = await fetch(dataUrl);
  return await resposta.blob();
}

export default function DetallAjust({
  ajust,
  identitat,
  guardarAjust,
  guardarCampPerfil,
  pujaMitja,
}) {
  const navigate = useNavigate();

  const [valorTemp, setValorTemp] = useState('');
  const [desant, setDesant] = useState(false);
  const [pujant, setPujant] = useState(false);
  const [missatge, setMissatge] = useState(null);

  useEffect(() => {
    setValorTemp(ajust?.valor || '');
    setMissatge(null);
  }, [ajust?.id, identitat?.id]);

  async function handleFileChange(e) {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setMissatge({ tipus: 'error', text: 'Només imatges, de moment.' });
      return;
    }

    setPujant(true);
    setMissatge(null);
    let dataUrl = null;
    try {
      dataUrl = await compressImage(file, {
        maxSize: 600,
        format: 'image/webp',
        quality: 0.8,
      });

      if (typeof pujaMitja !== 'function') {
        setValorTemp(dataUrl);
        return;
      }

      const blob = await aBlob(dataUrl);
      const fitxer = new File([blob], 'avatar.webp', { type: 'image/webp' });
      const url = await pujaMitja(fitxer, 'avatars');

      if (url) {
        setValorTemp(url);
        setMissatge({ tipus: 'exit', text: 'Imatge pujada. Ara dóna-li a Guardar.' });
      } else {
        setValorTemp(dataUrl);
      }
    } catch (error) {
      console.warn('Upload to storage failed, falling back to local dataUrl', error);
      if (dataUrl) setValorTemp(dataUrl);
      setMissatge({
        tipus: 'advertencia',
        text: "Error de xarxa o permisos. S'usarà la versió local. Dóna-li a Guardar.",
      });
    } finally {
      setPujant(false);
    }
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (!ajust) return;

    setDesant(true);
    setMissatge(null);
    try {
      await guardarAjust(ajust.id, valorTemp);
      setMissatge({ tipus: 'exit', text: 'Desat correctament.' });
      setTimeout(() => setMissatge(null), 3000);
    } catch (error) {
      setMissatge({ tipus: 'error', text: error.message || 'Error en desar.' });
    } finally {
      setDesant(false);
    }
  }

  async function handleLogout() {
    await logout();
    navigate('/');
  }

  function renderitzaFormulari() {
    if (!ajust.obert) {
      return (
        <p className="perfil-detall-buit">
          {ajust.motiu || 'Aquest ajust no es pot modificar.'}
        </p>
      );
    }

    if (ajust.accio === 'logout') {
      return (
        <div className="sdp-buit">
          <button type="button" className="sdp-boto sdp-boto--perill" onClick={handleLogout}>
            Confirmar eixida
          </button>
        </div>
      );
    }

    const esMultilinia = ajust.id === 'descripcio' || ajust.id === 'biografia';
    const esContrasenya = ajust.id === 'contrasenya';
    const esAvatar = ajust.id === 'avatar';

    return (
      <form onSubmit={handleSubmit} className="form-trellat">
        <div className="sdp-camp">
          <label className="sdp-camp__etiqueta" htmlFor={`ajust-${ajust.id}`}>
            Nou valor per a {ajust.titol.toLowerCase()}:
          </label>

          {esAvatar ? (
            <div className="sdp-alerta__accions">
              {valorTemp && (
                <div className="sdp-avatar sdp-avatar--xl">
                  <img src={valorTemp} alt="Previsualització" className="sdp-avatar__imatge" />
                </div>
              )}
              <input
                type="file"
                accept="image/*"
                id={`ajust-${ajust.id}`}
                className="sdp-control"
                onChange={handleFileChange}
                disabled={pujant}
              />
              {pujant && <p className="sdp-camp__ajuda">Pujant la imatge...</p>}
            </div>
          ) : esMultilinia ? (
            <textarea
              id={`ajust-${ajust.id}`}
              className="sdp-control sdp-control--area"
              rows="5"
              value={valorTemp}
              onChange={(e) => setValorTemp(e.target.value)}
            />
          ) : (
            <input
              type={esContrasenya ? 'password' : 'text'}
              id={`ajust-${ajust.id}`}
              className="sdp-control"
              value={valorTemp}
              onChange={(e) => setValorTemp(e.target.value)}
              placeholder={esContrasenya ? 'Introdueix nova contrasenya...' : ''}
            />
          )}

          {missatge && (
            <p className={missatge.tipus === 'exit' ? 'sdp-text-exit' : 'sdp-camp__error'}>
              {missatge.text}
            </p>
          )}

          <div className="sdp-alerta__accions">
            <button type="submit" className="sdp-boto sdp-boto--primari" disabled={desant || pujant}>
              {desant ? 'Desant...' : 'Guardar'}
            </button>
          </div>
        </div>
      </form>
    );
  }

  if (!identitat) {
    return (
      <div className="sdp-buit">
        <p>Crea el teu compte o inicia sessió per a començar.</p>
      </div>
    );
  }

  const dades = identitat.dades || {};
  const isPersona = identitat.mena === 'persona';

  async function pujaDesDeLaClosca(file) {
    if (typeof pujaMitja !== 'function') return null;
    return await pujaMitja(file, isPersona ? 'avatars' : 'organitzacions');
  }

  return (
    <UniversalEditorShell
      key={identitat.id}
      id={identitat.id}
      topBar={
        <UniversalToolbar
          onPublish={() => alert('El perfil es desarà automàticament')}
          isPublished={dades.is_public}
          publishDisabled={false}
        />
      }
      titleHtml={identitat.nom || ''}
      subtitleHtml={isPersona ? null : dades.lema || ''}
      leadHtml={isPersona ? null : dades.description || ''}
      heroImage={dades.hero_image}
      logoImage={dades.avatar_url || dades.logo_url}
      isPublished={Boolean(dades.is_public)}
      onImageUpload={pujaDesDeLaClosca}
      onSaveField={(field, value, identitatId) => {
        if (field === 'title')
          guardarCampPerfil(isPersona ? 'full_name' : 'name', value, identitatId);
        if (field === 'subtitle' && !isPersona)
          guardarCampPerfil('lema', value, identitatId);
        if (field === 'lead' && !isPersona)
          guardarCampPerfil('description', value, identitatId);
        if (field === 'logoImage')
          guardarCampPerfil(isPersona ? 'avatar_url' : 'logo_url', value, identitatId);
        if (field === 'heroImage')
          guardarCampPerfil('hero_image', value, identitatId);
      }}
      showStatusToggle={false}
    >
      <div className="perfil-detall">
        {ajust ? renderitzaFormulari() : (
          <p className="perfil-detall-buit">
            Selecciona un ajust de l'esquerra per a modificar-lo.
          </p>
        )}
      </div>
    </UniversalEditorShell>
  );
}

```

## PerfilContext.jsx
```javascript
import { createContext, useContext, useEffect, useState, useCallback, useMemo } from 'react';
import { getCurrentUser, listMyOrganizations, updateOrganization, updateProfile, updateUserPassword, getProfile, createOrganization, teCapacitat, uploadToStorage } from '../../data/backendPort.js';

const PerfilContext = createContext(null);

export function usePerfil() {
  const ctx = useContext(PerfilContext);
  if (!ctx) throw new Error('usePerfil fora de PerfilProvider');
  return ctx;
}

/* ═══════════════════════════════════════════════════════════════════
   CATÀLEG D'AJUSTOS

   Cada fila declara si està oberta i, si no ho està, per què. La
   interfície no pot prometre res que el contracte del servidor no
   complisca: un botó que fa `permission denied` en silenci és pitjor
   que una fila desactivada amb el motiu escrit.

   `obert` es deriva del rol i del que les polítiques RLS permeten
   de veres, no del que voldríem que permeteren.
   ═══════════════════════════════════════════════════════════════════ */

export function ajustosPersona(perfil = {}) {
  return [
    { id: 'nom', titol: 'Nom', camp: 'full_name', valor: perfil.full_name || '', obert: true },
    { id: 'avatar', titol: 'Foto de perfil', camp: 'avatar_url', valor: perfil.avatar_url || '', obert: true },
    { id: 'correu', titol: 'Correu electrònic', obert: false,
      motiu: 'El correu identifica el compte. Es canvia des d’Accedir.' },
    { id: 'privacitat', titol: 'Estat del perfil', valor: perfil.is_public ? 'Públic' : 'Privat', obert: true,
      motiu: 'Tria si vols ser visible a la gent del poble o mantindre el compte privat.' },
    { id: 'contrasenya', titol: 'Contrasenya', valor: '******', obert: true },
    { id: 'sessio', titol: 'Tancar sessió', obert: true, accio: 'logout' }
  ];
}

export function ajustosOrganitzacio(org) {
  const mana = org.role === 'owner' || org.role === 'admin';
  const tancat = 'Només qui administra aquesta organització ho pot canviar.';
  return [
    { id: 'nom', titol: 'Nom', camp: 'name', valor: org.name, obert: mana, motiu: tancat },
    { id: 'avatar', titol: 'Foto / Logotip', camp: 'logo_url', valor: org.logo_url, obert: mana, motiu: tancat },
    { id: 'lema', titol: 'Lema', camp: 'lema', valor: org.lema, obert: mana, motiu: tancat },
    { id: 'descripcio', titol: 'Descripció', camp: 'description', valor: org.description, obert: mana, motiu: tancat },
    { id: 'membres', titol: 'Membres', obert: mana, motiu: tancat },
    { id: 'identificador', titol: 'Identificador', valor: org.slug, obert: false,
      motiu: 'L’identificador és permanent: hi ha enllaços publicats que hi apunten.' },
    { id: 'fitxa', titol: 'Fitxa pública', valor: `/${org.kind === 'group' ? 'grup' : 'empresa'}/${org.slug}`, obert: true, accio: 'obrir-fitxa' },
    { id: 'eixir', titol: 'Eixir de l’organització', obert: org.role !== 'owner',
      motiu: 'Qui és propietari no pot eixir-se’n: primer ha de traspassar la propietat.', accio: 'eixir' }
  ];
}

export function PerfilProvider({ children, config = {} }) {
  const [usuari, setUsuari] = useState(null);
  const [dadesPerfil, setDadesPerfil] = useState(null);
  const [organitzacions, setOrganitzacions] = useState([]);
  const [carregant, setCarregant] = useState(true);
  const [error, setError] = useState(null);

  const [identitatId, setIdentitatId] = useState('jo');
  const [ajustId, setAjustId] = useState(null);

  useEffect(() => {
    let viu = true;
    setUsuari(getCurrentUser());
    
    Promise.all([
      listMyOrganizations(config),
      getProfile(config)
    ])
      .then(([files, perfil]) => { 
        if (viu) {
          setOrganitzacions(Array.isArray(files) ? files : []); 
          setDadesPerfil(perfil);
        }
      })
      .catch((e) => { if (viu) setError(e?.message || 'No s’han pogut carregar les organitzacions.'); })
      .finally(() => { if (viu) setCarregant(false); });
    return () => { viu = false; };
  }, []);

  const identitats = useMemo(() => ([
    {
      id: 'jo',
      mena: 'persona',
      nom: dadesPerfil?.full_name || usuari?.user_metadata?.name || usuari?.user_metadata?.full_name || 'El meu compte',
      avatar: dadesPerfil?.avatar_url || usuari?.user_metadata?.avatar_url,
      rol: 'Persona',
      dades: dadesPerfil
    },
    ...organitzacions.map((o) => ({
      id: o.id,
      mena: o.kind === 'group' ? 'grup' : 'empresa',
      nom: o.name,
      avatar: o.logo_url,
      rol: o.role === 'owner' ? 'Propietari' : o.role === 'admin' ? 'Administra' : 'Membre',
      dades: o
    }))
  ]), [usuari, organitzacions, dadesPerfil]);

  const identitat = identitats.find((i) => i.id === identitatId) || identitats[0];

  /* Memoitzat a posta. Si `ajustos` es reconstruïx a cada render, `ajust`
     canvia d'identitat i el useEffect de DetallAjust es dispara sol: buida
     el camp i esborra el missatge de "Desat correctament". */
  const ajustos = useMemo(() => (
    identitat?.mena === 'persona'
      ? ajustosPersona(identitat?.dades || {})
      : ajustosOrganitzacio(identitat?.dades || {})
  ), [identitat?.mena, identitat?.dades]);

  const ajust = useMemo(
    () => ajustos.find((a) => a.id === ajustId) || null,
    [ajustos, ajustId]
  );

  /* Canviar d'identitat no navega: filtra. Una persona gran no ha
     d'aprendre dues jerarquies per fer una cosa. */
  function triaIdentitat(id) {
    setIdentitatId(id);
    setAjustId(null);
  }

  const triaAjust = useCallback((id) => {
    setAjustId(id);
  }, []);

  async function guardarCampPerfil(campEfectiu, valor, identitatObjectiuId = identitat?.id) {
    const identitatObjectiu = identitats.find((item) => item.id === identitatObjectiuId);
    if (!identitatObjectiu) throw new Error('Cap identitat seleccionada');
    if (identitatObjectiu.mena === 'persona') {
      const dadesNovamentRebudes = await updateProfile({ [campEfectiu]: valor }, config);
      setDadesPerfil(prev => ({ ...prev, ...(dadesNovamentRebudes || {}), [campEfectiu]: valor }));
      setUsuari(prev => ({
        ...prev,
        user_metadata: { ...prev?.user_metadata, [campEfectiu]: valor, name: dadesNovamentRebudes?.full_name || prev?.user_metadata?.name }
      }));
    } else {
      const novesDades = await updateOrganization(identitatObjectiu.id, { [campEfectiu]: valor }, config);
      setOrganitzacions(prev => prev.map(o => o.id === identitatObjectiu.id ? { ...o, ...novesDades } : o));
    }
  }

  async function guardarAjust(camp, valor) {
    if (!identitat) throw new Error('Cap identitat seleccionada');
    
    // Ja no prioritzem l'ajust seleccionat. Busquem explícitament l'ajust sol·licitat.
    const ajustEfectiu = ajustos.find((a) => a.camp === camp || a.id === camp);
    if (!ajustEfectiu || !ajustEfectiu.obert) throw new Error('Aquest ajust no es pot modificar');

    const campEfectiu = ajustEfectiu.camp || camp;

    if (identitat.mena === 'persona' && ajustEfectiu.id === 'contrasenya') {
      await updateUserPassword(valor, config);
    } else {
      await guardarCampPerfil(campEfectiu, valor);
    }
  }

  /* El botó "+" de la columna d'identitats. Existix perquè
     createOrganization sí que està implementat de punta a punta
     (backendPort → supabaseBackend → rpc create_organization).
     Si no ho estiguera, este botó no s'hauria d'haver pintat. */
  const creaOrganitzacio = useCallback(async (dades) => {
    const nova = await createOrganization(dades || { name: 'Organització nova', kind: 'group' }, config);
    setOrganitzacions((prev) => [...prev, nova]);
    setIdentitatId(nova.id);
    setAjustId(null);
    return nova;
  }, [config]);

  const pujaMitja = async (fitxer, carpeta = 'avatars') => {
    if (!teCapacitat('mitjans')) return null;
    try {
      const res = await uploadToStorage(fitxer, { carpeta }, config);
      return res.url;
    } catch (err) {
      console.error('[PerfilContext] Error pujant mitjà:', err);
      throw err;
    }
  };

  const valor = {
    usuari, identitats, identitat, ajustos, ajust,
    carregant, error,
    triaIdentitat, triaAjust,
    guardarAjust,
    guardarCampPerfil,
    creaOrganitzacio,
    pujaMitja
  };

  return <PerfilContext.Provider value={valor}>{children}</PerfilContext.Provider>;
}

```

