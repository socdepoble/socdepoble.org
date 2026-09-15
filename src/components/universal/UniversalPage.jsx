import { useNavigate, Link } from '../../app/contexts/RouterContext';
import { showToast } from './AvisadorEfimer';
import { useContent } from './ContentProvider';
import { PageFrame } from './PageFrame';
import { isSafeUrl, isValidDate } from './UniversalUtils';

export function UniversalPage(props) {
  const contentContext = useContent();
  const config = contentContext?.config || {};

  const navigate = useNavigate();
  
  const title = props.title ?? config.title;
  const actualTitleText = props.titleText || config.titleText || (typeof title === 'string' ? title : '');
  
  const handleConnect = props.onConnect || (() => navigate('/connectar?item_id=' + encodeURIComponent(actualTitleText || 'page')));
  const handleBack = props.onBack || (() => navigate(-1));
  const handleForward = props.onForward || (() => navigate(1));
  
  const handleComment = props.onComment || (() => navigate('/xat'));
  const handleTranslate = props.onTranslate || (() => navigate('/traduccions?item_id=' + encodeURIComponent(actualTitleText || 'page')));
  const handleShare = props.onShare || (() => {
    const safeHref = isSafeUrl(window.location.href) ? window.location.href : window.location.origin;
    if (navigator.share) {
      navigator.share({ title: title || document.title, url: safeHref }).catch(console.error);
    } else {
      navigator.clipboard.writeText(safeHref);
      showToast('Enllaç copiat al porta-retalls');
    }
  });

  const barDateTime = props.topBarData?.dateTime ?? props.dateTime ?? config.dateTime;
  const barDate = props.topBarData?.date ?? props.date ?? config.date;
  
  const handleDateTime = props.onDateTime || config.onDateTime || ((e) => {
    e.preventDefault();
    e.stopPropagation();
    let yyyymmdd;
    if (barDateTime) {
      yyyymmdd = barDateTime.split('T')[0];
    } else if (barDate) {
      const parts = barDate.split('/');
      if (parts.length === 3) {
        let [dd, mm, yy] = parts;
        if (yy.length === 2) yy = '20' + yy;
        if (isValidDate(dd, mm, yy)) {
          yyyymmdd = `${yy}-${mm.padStart(2, '0')}-${dd.padStart(2, '0')}`;
        }
      } else {
        const d = new Date(barDate);
        if (!isNaN(d.getTime())) yyyymmdd = d.toISOString().split('T')[0];
      }
    }
    if (yyyymmdd) {
      navigate(`/mur?date=${encodeURIComponent(yyyymmdd)}`);
    } else {
      navigate('/mur');
    }
  });

  return (
    <PageFrame
      {...config}
      {...props}
      onConnect={handleConnect}
      onBack={handleBack}
      onForward={handleForward}
      onTranslate={handleTranslate}
      onComment={handleComment}
      onShare={handleShare}
      onDateTime={handleDateTime}
      LinkComponent={Link}
    />
  );
}
