import { useNavigate } from '../../../app/contexts/RouterContext';
import { useToast } from '@/components/universal/NotificationContext.jsx';

/** URL absoluta del detall; si no n'hi ha, la de la pàgina. */
export function urlPerCompartir(href) {
  if (!href) return window.location.href;
  try { return new URL(href, window.location.origin).href; } catch { return window.location.href; }
}

export async function compartix(titol, url, showToast) {
  if (navigator.share) {
    try {
      await navigator.share({ title: titol || document.title, url });
      return;
    } catch (error) {
      if (error?.name === 'AbortError') return; // ha tancat el menú: no és cap error
      // Qualsevol altra fallada: provem el porta-retalls.
    }
  }
  try {
    await navigator.clipboard.writeText(url);
    showToast('Enllaç copiat al porta-retalls.');
  } catch {
    showToast(`No s'ha pogut copiar. Enllaç: ${url}`, 6000);
  }
}

/**
 * Peça única de domini per a les accions de UI (Connectar, Traduir, Comentar, Compartir).
 * Cura el doble protocol i el prop drilling.
 */
export function useAccions({
  title,
  mainHref,
  onConnect,
  onTranslate,
  onComment,
  onShare,
  showConnect,
  showTranslate,
  showComment,
  showShare,
  hasFooter
}) {
  const { showToast } = useToast();
  const navigate = useNavigate();

  const handleConnect = onConnect || (() => navigate('/connectar?item_id=' + encodeURIComponent(title || 'card')));
  const handleTranslate = onTranslate || (() => navigate('/traduccions'));
  const handleComment = onComment || (() => navigate('/xat'));
  const handleShare = onShare || (() => compartix(title, urlPerCompartir(mainHref), showToast));

  const perDefecte = hasFooter === true;
  const traduirVisible = showTranslate ?? (perDefecte || Boolean(onTranslate));
  const comentarVisible = showComment ?? (perDefecte || Boolean(onComment));
  const compartirVisible = showShare ?? (perDefecte || Boolean(onShare));
  const connectarVisible = showConnect ?? (perDefecte || Boolean(onConnect));

  return {
    handleConnect,
    handleTranslate,
    handleComment,
    handleShare,
    traduirVisible,
    comentarVisible,
    compartirVisible,
    connectarVisible
  };
}
