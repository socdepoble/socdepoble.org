import { useNavigate } from '../app/contexts/RouterContext';
import { UniversalCard } from './universal/../PedraSeca';
import { objecteDeRutaDePerfil } from '../config/navigation.js';

export default function SectionItemCard({
  to,
  state,
  image,
  title,
  subtitle,
  excerpt,
  meta = [],
  labels = [],
  eyebrow,
  className = '',
  // New props that map to UniversalCard natively
  author,
  /* T6 (ordre del Mestre, 261004, prompt 261004_0515 §5) · la pàgina de qui
     signa (rutaDAutoria o rutaDePerfilDAutor): la boina hi enllaça. Sense,
     la boina de sempre, sense enllaç. */
  authorHref,
  location,
  avatarUrl,
  time,
  date,
  price,
  /* T43 (ordre del Mestre, 260928) · el Connectar amb el descriptor de
     l'element (p. ex. el perfil del directori). Sense ell, el genèric. */
  onConnect,
  /* T63.2 · el descriptor tipat de l'element (objecteDePerfil al directori):
     Comentar obri el seu xat, o el directe d'una persona o una IA. Sense ell,
     el de la fitxa a què porta `to` si és una ruta de perfil (rutaDePerfil):
     cada targeta, el seu, mai el de la llista. Si no ho és, cap xat (useAccions). */
  objecte,
  /* Onada 8 (261009; requeriments, punt 4) · El botó gran de la targeta
     (la ranura `accio` d'UniversalCard: «Anar al xat» d'una entitat del
     directori) i, amb ell, les etiquetes al seu lloc. Sense, el DOM de sempre. */
  accio = null,
  etiquetesAmbAccio = false
}) {
  const navigate = useNavigate();
  const objecteTargeta = objecte !== undefined ? objecte : (objecteDeRutaDePerfil(to, typeof title === 'string' ? title : '') || undefined);

  const handleMainClick = to
    ? (e) => {
        e.preventDefault();
        navigate(to, { state });
      }
    : undefined;

  const resolvedLabels = labels.length > 0 ? labels : eyebrow ? [eyebrow] : [];
  
  // Format the meta array into a small footer string if needed, or use as time fallback
  const metaString = meta.filter(Boolean).join(' · ');

  return (
    <div className={`sdp-fitxa-seccio ${className || ''}`.trim()}>
      <UniversalCard
        title={title}
        subtitle={subtitle}
        body={excerpt || metaString}
        imageUrl={image}
        labels={resolvedLabels}
        onMainClick={handleMainClick}
        author={author}
        authorHref={authorHref}
        location={location}
        avatarUrl={avatarUrl}
        time={time}
        date={date}
        price={price}
        hasFooter={true}
        showTranslate={true}
        showComment={true}
        showShare={true}
        onConnect={onConnect}
        objecte={objecteTargeta}
        accio={accio}
        etiquetesAmbAccio={etiquetesAmbAccio}
      />
    </div>
  );
}
