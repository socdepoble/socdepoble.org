import { useNavigate } from '../app/contexts/RouterContext';
import { UniversalCard } from './universal/../PedraSeca';

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
  location,
  avatarUrl,
  time,
  date,
  price
}) {
  const navigate = useNavigate();

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
        location={location}
        avatarUrl={avatarUrl}
        time={time}
        date={date}
        price={price}
        hasFooter={true}
        showTranslate={true}
        showComment={true}
        showShare={true}
      />
    </div>
  );
}
