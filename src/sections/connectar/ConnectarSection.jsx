/**
 * ConnectarSection.jsx — «Connectar» un element d'altri (una casa, una faena,
 * un poble, un article del Mercat) amb el MAS de qui mira (T5).
 *
 *   · La connexió és una nota del Bloc que recorda d'on ve (`origen`): secció,
 *     element, títol i qui el signa. Naix a la safata «Connectats» i des
 *     d'allí la persona la distribuïx a les seues carpetes i l'etiqueta.
 *   · Com que el contingut és d'una altra persona, a l'editor «Publicar» es
 *     torna «Compartir»: es compartix al mur propi citant l'origen, sempre
 *     des del Workspace, mai directament com a les altres xarxes.
 *   · Les carpetes són les mateixes del Bloc (carpetes.js), amb les mateixes
 *     icones. El que arriba per URL (item_id, title, sectionId, targetUserId,
 *     autorTipus, author) ho escriu rutaConnectar (navigation.js).
 */
import { useState } from 'react';
import { useNavigate, useSearchParams } from '../../app/contexts/RouterContext';
import { Layers, AlertTriangle, Lock, Globe, Sparkles, Tag, Plus, ArrowLeft } from 'lucide-react';
import { useToast } from '@/components/universal/NotificationContext.jsx';
import { useUIActions } from '../../app/contexts/UIContext';
import { useSession } from '../../app/contexts/SessionContext';
import { useNotesData } from '../notes/NotesDataContext';
import { CARPETA_CONNECTATS, carpetesDelBloc, iconaDeCarpeta } from '../notes/carpetes.js';
import { getSectionItemPath } from '../../config/navigation.js';
import './ConnectarSection.css';

const SUGGESTED_TAGS = ['Història local', 'Interessant', 'Patrimoni', 'Gent del Poble', 'Debat'];
const NOM_SECCIO = Object.freeze({ mur: 'el Mur', mercat: 'el Mercat', events: "l'agenda", pobles: 'els Pobles', multimedia: 'Multimèdia' });

/* Text pla → HTML que la closca pinta tal qual (el sanejador ho torna a passar). */
const aHtml = (text) => String(text ?? '')
  .replaceAll('&', '&amp;')
  .replaceAll('<', '&lt;')
  .replaceAll('>', '&gt;')
  .replaceAll('"', '&quot;');

/** El que la nota recordarà de l'element connectat. */
export function origenDeLaConnexio(params) {
  const sectionId = params.get('sectionId') || '';
  const itemId = params.get('item_id') || '';
  const titol = params.get('title') || itemId || 'element-desconegut';
  const origen = {
    tipus: 'connexio',
    sectionId,
    itemId: itemId || titol,
    titol,
    autorId: params.get('targetUserId') || '',
    autorNom: params.get('author') || '',
    autorTipus: params.get('autorTipus') || '',
    ruta: sectionId && itemId ? getSectionItemPath(sectionId, itemId) : ''
  };
  return origen;
}

/** El cos de la nota: una presentació curta que enllaça l'element de veres. */
export function contingutDeLaConnexio(origen) {
  const seccio = NOM_SECCIO[origen.sectionId] || 'Sóc de Poble';
  const qui = origen.autorNom ? ` de ${aHtml(origen.autorNom)}` : '';
  const titol = aHtml(origen.titol);
  const enllac = origen.ruta ? `<a href="${aHtml(origen.ruta)}">${titol}</a>` : `<strong>${titol}</strong>`;
  return `<p>Element connectat des ${seccio}${qui}: ${enllac}.</p><p>Ordena'l a les teues carpetes, etiqueta'l i, si vols, compartix-lo al teu mur.</p>`;
}

export default function ConnectarSection() {
  const { showToast } = useToast();
  const { t } = useUIActions();
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const origen = origenDeLaConnexio(params);
  const contextTitle = origen.titol;

  const { currentUser } = useSession();
  const { noteFolders, creaNota, canCreate } = useNotesData();

  const isGuest = !currentUser;
  /* Sense sessió, en seed i local el Bloc és del dispositiu: la connexió es
     guarda igual. En remot, el Foraster només simula. */
  const potGuardar = Boolean(canCreate);

  const [isPrivate, setIsPrivate] = useState(true);
  const [selectedFolder, setSelectedFolder] = useState(CARPETA_CONNECTATS);
  const [customTags, setCustomTags] = useState([]);
  const [tagInput, setTagInput] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  const displayFolders = carpetesDelBloc(noteFolders);

  const addTag = (tag) => {
    const value = String(tag || '').trim();
    if (!value || customTags.includes(value)) return;
    setCustomTags((current) => [...current, value]);
    setTagInput('');
  };

  const removeTag = (tag) => {
    setCustomTags((current) => current.filter((t) => t !== tag));
  };

  const handleConnect = async () => {
    if (!selectedFolder || isSaving) return;
    setIsSaving(true);
    try {
      if (potGuardar) {
        const nota = await creaNota({
          title: contextTitle,
          content: contingutDeLaConnexio(origen),
          folderId: selectedFolder,
          tags: customTags,
          origen
        });
        showToast(t('section.connectar.desat', 'Element connectat al teu MAS: el trobaràs a «Connectats».'), 'success');
        navigate(nota?.id ? `/notes?nota=${encodeURIComponent(nota.id)}` : '/notes');
      } else {
        showToast(t('section.connectar.simulat', 'Mode Foraster: simulant que es guarda. Registra’t per fer-ho real.'), 'info');
        setTimeout(() => navigate(-1), 1000);
      }
    } catch (err) {
      showToast(err.message, 'error');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="cs-root">
      {/* HEADER TARONJA V2 */}
      <header className="cs-header">
        <button onClick={() => navigate(-1)} aria-label="Tornar">
          <ArrowLeft size={24} />
        </button>
        <h1>Connectar</h1>
      </header>

      <main className="cs-main">

        {/* ALERTA FORASTER */}
        {isGuest && (
          <div className="cs-alerta">
            <AlertTriangle size={24} />
            <div className="cs-alerta-content">
              <strong>Mode Foraster Actiu</strong>
              <p>
                {potGuardar
                  ? 'Sense sessió, la connexió es guarda només en este dispositiu. Quan et registres, el teu MAS la conservarà de debò.'
                  : 'Estàs provant la funcionalitat en mode simulació. Explora, crea carpetes i organitza este element com vullgues. Quan et registres, el teu MAS guardarà els elements permanentment de debò.'}
              </p>
            </div>
          </div>
        )}

        {/* HEADER CENTRAL */}
        <div className="cs-hero">
          <div className="cs-hero-icon">
            <Layers size={32} />
          </div>
          <h2>On vols guardar açò?</h2>
          <p>
            Classifica i ordena la teua connexió amb el registre:<br />
            <span className="cs-hero-tag">{contextTitle}</span>
            {origen.autorNom ? <><br />{`De ${origen.autorNom}`}</> : null}
          </p>
        </div>

        {/* PRIVACITAT */}
        <section className="cs-section">
          <h3 className="cs-section-title">Privacitat de la connexió</h3>
          <div className="cs-toggle-container">
            <div className="cs-toggle-indicator">
               <div className={`cs-toggle-indicator-bar ${isPrivate ? '' : 'right'}`}></div>
            </div>
            <button
              onClick={() => setIsPrivate(true)}
              className={`cs-toggle-btn ${isPrivate ? 'active' : ''}`}
            >
              <Lock size={16} /> PRIVADA
            </button>
            <button
              onClick={() => setIsPrivate(false)}
              className={`cs-toggle-btn ${!isPrivate ? 'active' : ''}`}
            >
              <Globe size={16} /> PÚBLICA
            </button>
          </div>
          <p className="cs-priv-desc">
            {isPrivate ? 'Només tu podràs vore esta connexió en el teu MAS personal.' : 'Per a fer-la pública, obri-la al teu MAS i prem «Compartir»: anirà al teu mur citant l’origen.'}
          </p>
        </section>

        {/* CAIXA PRINCIPAL */}
        <section className="cs-section">
          <div className="cs-section-header">
            <h3 className="cs-section-title">Caixa principal</h3>
          </div>
          <p className="cs-assist-desc">
            Tota connexió naix a «Connectats»; des d’allí la podràs moure a qualsevol carpeta del teu Bloc.
          </p>

          <div className="cs-folders">
            {displayFolders.map((folder) => {
              const Icon = iconaDeCarpeta(folder.id);
              const isSelected = selectedFolder === folder.id;
              return (
                <button
                  key={folder.id}
                  type="button"
                  onClick={() => setSelectedFolder(folder.id)}
                  className={`cs-folder ${isSelected ? 'active' : ''}`}
                  aria-pressed={isSelected}
                >
                  <Icon size={32} className="cs-folder-icon" />
                  <span className="cs-folder-name">{folder.name}</span>
                </button>
              );
            })}
          </div>
        </section>

        {/* ASSISTENT DE CONTEXT */}
        <section className="cs-section">
          <h3 className="cs-section-title fuchsia">
            <Sparkles size={16} /> Assistent de context
          </h3>
          <p className="cs-assist-desc">
            La IAIA et suggereix estes etiquetes en base al sistema de Poble. Afig tu les que vullgues per trobar-ho ràpid.
          </p>

          <div className="cs-tags">
            {SUGGESTED_TAGS.filter(t => !customTags.includes(t)).map((tag) => (
              <button
                key={tag}
                type="button"
                onClick={() => addTag(tag)}
                className="cs-tag"
              >
                {tag}
              </button>
            ))}
            {customTags.map((tag) => (
              <span key={tag} className="cs-tag active">
                {tag}
                <button type="button" onClick={() => removeTag(tag)} className="cs-tag-remove" aria-label={`Lleva l’etiqueta ${tag}`}>
                  <Plus size={10} />
                </button>
              </span>
            ))}
          </div>

          <div className="cs-input-group">
            <div className="cs-input-wrapper">
              <Tag size={16} className="cs-input-icon" />
              <input
                type="text"
                value={tagInput}
                onChange={(e) => setTagInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && addTag(tagInput)}
                placeholder="Escriu una etiqueta lliure..."
                aria-label="Etiqueta lliure"
                className="cs-input"
              />
            </div>
            <button
              type="button"
              onClick={() => addTag(tagInput)}
              disabled={!tagInput.trim()}
              className={`cs-add-btn ${tagInput.trim() ? 'enabled' : 'disabled'}`}
            >
              Afegir
            </button>
          </div>
        </section>

        {/* BOTÓ FINAL */}
        <div className="cs-footer">
          <button
            type="button"
            onClick={handleConnect}
            disabled={!selectedFolder || isSaving}
            className={`cs-submit-btn ${selectedFolder ? 'enabled' : 'disabled'}`}
          >
            {isSaving ? 'Guardant...' : potGuardar ? 'Guardar Connexió' : 'Simular Guardat'}
          </button>
          <p className="cs-footer-hint">
            Selecciona una carpeta o caixa per activar
          </p>
        </div>
      </main>
    </div>
  );
}
