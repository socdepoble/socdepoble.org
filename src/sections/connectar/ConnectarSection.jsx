import { useMemo, useState } from 'react';
import { useNavigate } from '../../app/contexts/RouterContext';
import { CheckCircle2, Globe, Lock, Plus, Tag } from 'lucide-react';
import { UniversalPage } from '../../components/universal/UniversalPage';
import { useToast } from '@/components/universal/NotificationContext.jsx';
import { useUIActions } from '../../app/contexts/UIContext';
import { useMur } from '../mur/MurContext';
import { useSession } from '../../app/contexts/SessionContext';

const TAGS = ['Història local', 'Patrimoni', 'Gent del poble', 'Debat', 'Mercat', 'Tecnologia'];

const generateId = () => {
  return typeof crypto !== 'undefined' && crypto.randomUUID
    ? crypto.randomUUID()
    : 'id-' + Date.now().toString(36) + '-' + Math.random().toString(36).substring(2);
};

export default function ConnectarSection({ agents = [] }) {
  const { showToast } = useToast();
  const { t } = useUIActions();
  const { sendSectionSubmission } = useMur();
  const navigate = useNavigate();
  const [selectedArea, setSelectedArea] = useState('xat');
  const [isPrivate, setIsPrivate] = useState(true);
  const [customTags, setCustomTags] = useState([]);
  const [tagInput, setTagInput] = useState('');
  const [entryTitle, setEntryTitle] = useState('');
  const [entryDescription, setEntryDescription] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const QUICK_AREAS = [
    { id: 'xat', label: t('nav.xat', 'Xat'), description: t('section.connectar.area.xat', 'Obri una conversa amb la gent del poble.') },
    { id: 'mur', label: t('nav.mur', 'Mur'), description: t('section.connectar.area.mur', 'Publica o revisa el mur públic.') },
    { id: 'mercat', label: t('nav.mercat', 'Mercat'), description: t('section.connectar.area.mercat', 'Explora productes i intercanvis.') },
    { id: 'events', label: t('nav.events', 'Events'), description: t('section.connectar.area.events', 'Mira sessions, cites i rituals.') },
    { id: 'multimedia', label: t('nav.multimedia', 'Multimèdia'), description: t('section.connectar.area.multimedia', 'Puge fotos i recursos visuals.') },
    { id: 'notes', label: t('nav.notes', 'Notes'), description: t('section.connectar.area.notes', 'Afig una nova nota a la llibreta.') }
  ];

  const selectedLabel = QUICK_AREAS.find((item) => item.id === selectedArea)?.label || t('nav.xat', 'Xat');
  const supportsPublishing = ['mur', 'mercat', 'events', 'multimedia', 'notes'].includes(selectedArea);
  const canConnect = selectedArea === 'xat' || (entryTitle.trim() && entryDescription.trim());
  const { currentUser } = useSession();

  const addTag = (tag) => {
    const value = String(tag || '').trim();
    if (!value || customTags.includes(value)) return;
    setCustomTags((current) => [...current, value]);
    setTagInput('');
  };

  const buildSubmissionPayload = () => {
    const now = new Date().toISOString();
    const title = entryTitle.trim();
    const description = entryDescription.trim();
    const authorName = currentUser?.user_metadata?.name || 'Foraster';
    const authorAvatar = currentUser?.user_metadata?.avatar_url || null;
    const authorTown = currentUser?.user_metadata?.town_name || 'La Torre de les Maçanes';

    if (selectedArea === 'mur') {
      return {
        id: generateId(),
        sectionId: 'mur',
        type: 'post',
        title,
        post_subtitle: description,
        description,
        summary: description,
        content: description,
        author: authorName,
        author_name: authorName,
        author_avatar: authorAvatar,
        town_name: authorTown,
        image_url: [],
        tags: [...customTags],
        likes: 0,
        comments: 0,
        isPrivate,
        created_at: now,
        searchText: `${title} ${description} ${authorName} ${authorTown} ${customTags.join(' ')}`
      };
    }

    if (selectedArea === 'mercat') {
      return {
        id: generateId(),
        sectionId: 'mercat',
        type: 'product',
        title,
        description,
        summary: description,
        seller: authorName,
        author_name: authorName,
        avatar_url: authorAvatar,
        town_name: authorTown,
        image_url: [],
        image: null,
        category_slug: 'connectat',
        tag: customTags[0] || 'Connectat',
        variations: [],
        price: '0.00€',
        isPrivate,
        created_at: now,
        searchText: `${title} ${description} ${authorName} ${customTags.join(' ')} connectat mercat`
      };
    }

    if (selectedArea === 'multimedia') {
      return {
        id: generateId(),
        sectionId: 'multimedia',
        type: 'media',
        title,
        description,
        summary: description,
        author: authorName,
        tag: customTags[0] || 'Multimèdia',
        source: 'Upload',
        isPrivate,
        created_at: now,
        searchText: `${title} ${description} ${authorName} ${customTags.join(' ')} multimedia`
      };
    }

    if (selectedArea === 'notes') {
      return {
        id: generateId(),
        sectionId: 'notes',
        type: 'note',
        title,
        content: description,
        plainText: description,
        category: customTags[0] || 'General',
        tags: [...customTags],
        folderId: 'f-root',
        isPrivate,
        created_at: now,
        updatedAt: now,
        searchText: `${title} ${description} ${customTags.join(' ')} notes`
      };
    }

    return {
      id: generateId(),
      sectionId: 'events',
      type: 'event',
      title,
      description,
      summary: description,
      author_name: authorName,
      image_url: [],
      date: now.slice(0, 10),
      isPrivate,
      created_at: now,
      tags: [...customTags],
      searchText: `${title} ${description} ${authorName} ${customTags.join(' ')} events`
    };
  };

  const handleConnect = async () => {
    if (selectedArea === 'xat') {
      navigate('/xat');
      return;
    }

    if (!canConnect || isSaving) return;

    const payload = buildSubmissionPayload();
    setIsSaving(true);

    try {
      await sendSectionSubmission({
        sectionId: selectedArea,
        title: entryTitle.trim(),
        description: entryDescription.trim(),
        payload,
        createdAt: payload.created_at
      });
      setEntryTitle('');
      setEntryDescription('');
      setCustomTags([]);
      setTagInput('');
      navigate(`/${selectedArea}`);
    } catch (error) {
      showToast(error.message, 'error');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <UniversalPage
      title={t('section.connectar.title', 'On vols continuar?')}
      subtitle={t('section.connectar.subtitle', 'Tria l’espai on vols entrar i continua navegant.')}
      chrome="system"
      showLogos={true}
    >
      <div className="content-wrapper">


        <section className="content-wrapper">
          <div className="content-wrapper">
            <div>
              <h2 className="section-title">{t('section.connectar.where', 'On vols connectar-ho?')}</h2>
            </div>
            <span className="pill">{selectedLabel}</span>
          </div>
          <div className="content-wrapper">
            <div className="sdp-card-grid">
              {QUICK_AREAS.map((area) => (
                <button
                  key={area.id}
                  type="button"
                  className={`connect-card ${selectedArea === area.id ? 'connect-card--active' : ''}`}
                  onClick={() => setSelectedArea(area.id)}
                >
                  <strong>{area.label}</strong>
                  <span>{area.description}</span>
                </button>
              ))}
            </div>
          </div>
        </section>

        <section className="content-wrapper">
          <div className="content-wrapper">
            <div>
              <h2 className="section-title">{t('section.connectar.context', 'Etiquetes i context')}</h2>
            </div>
          </div>
          <div className="content-wrapper">
            <div className="badge-row">
              {TAGS.map((tag) => (
                <button key={tag} type="button" className="pill" onClick={() => addTag(tag)}>
                  <Tag size={14} /> {tag}
                </button>
              ))}
            </div>

            <div className="sdp-camp">
              <label htmlFor="connectar-tag-input" className="sr-only">{t('section.connectar.tagsPlaceholder', 'Afig una etiqueta lliure...')}</label>
              <input
                id="connectar-tag-input"
                type="text"
                value={tagInput}
                onChange={(event) => setTagInput(event.target.value)}
                onKeyDown={(event) => event.key === 'Enter' && addTag(tagInput)}
                placeholder={t('section.connectar.tagsPlaceholder', 'Afig una etiqueta lliure...')}
                className="sdp-control"
                aria-label={t('section.connectar.tagsPlaceholder', 'Afig una etiqueta lliure...')}
              />
              <button type="button" className="pill pill--primary" onClick={() => addTag(tagInput)}>
                <Plus size={16} /> {t('section.connectar.add', 'Afegir')}
              </button>
            </div>

            {customTags.length > 0 ? (
              <div className="badge-row">
                {customTags.map((tag) => (
                  <span key={tag} className="badge">
                    {tag}
                    <button type="button" className="sdp-alerta__tanca" onClick={() => setCustomTags((current) => current.filter((item) => item !== tag))}>
                      ×
                    </button>
                  </span>
                ))}
              </div>
            ) : null}
          </div>
        </section>

        {supportsPublishing ? (
          <section className="content-wrapper">
            <div className="content-wrapper">
              <div>
                <h2 className="section-title">Nou element en {selectedLabel}</h2>
              </div>
              <span className="pill">Es guardarà i quedarà visible en recarregar</span>
            </div>
            <div className="content-wrapper">
              <label htmlFor="connectar-entry-title" className="sr-only">Títol de l'element</label>
              <input
                id="connectar-entry-title"
                type="text"
                value={entryTitle}
                onChange={(event) => setEntryTitle(event.target.value)}
                placeholder={selectedArea === 'mur'
                  ? 'Títol de la publicació'
                  : selectedArea === 'mercat'
                    ? 'Nom del producte'
                    : 'Títol de l’esdeveniment'}
                className="sdp-control"
                aria-label="Títol de l'element"
              />
              <label htmlFor="connectar-entry-desc" className="sr-only">Descripció o contingut</label>
              <textarea
                id="connectar-entry-desc"
                value={entryDescription}
                onChange={(event) => setEntryDescription(event.target.value)}
                placeholder={selectedArea === 'mur'
                  ? 'Escriu la publicació que vols afegir al mur...'
                  : selectedArea === 'mercat'
                    ? 'Descriu el producte o l’oferta...'
                    : 'Descriu l’esdeveniment o la convocatòria...'}
                className="sdp-control"
                rows={4}
                aria-label="Descripció o contingut"
              />
            </div>
          </section>
        ) : null}

        <section className="content-wrapper">
          <div className="content-wrapper">
            <div className="content-wrapper">
              <button
                type="button"
                className="pill pill--primary"
                onClick={handleConnect}
                disabled={isSaving || (selectedArea !== 'xat' && !canConnect)}
              >
                <CheckCircle2 size={16} />
                {isSaving
                  ? 'Guardant...'
                  : selectedArea === 'xat'
                    ? `${t('section.connectar.connect', 'Connectar a')} ${selectedLabel}`
                    : `Guardar i anar a ${selectedLabel}`}
              </button>
            </div>
          </div>
        </section>
      </div>
    </UniversalPage>
  );
}
