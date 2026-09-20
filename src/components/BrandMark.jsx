import logoDark from '../assets/ui/logo-socdepoble-rect-negre.svg';
import logoLight from '../assets/ui/logo-socdepoble-rect-blanc.svg';

export default function BrandMark({ variant = 'light', className = '' }) {
  const src = variant === 'dark' ? logoDark : logoLight;

  return <img className={className} src={src} alt="Sóc de Poble" fetchpriority="high" />;
}