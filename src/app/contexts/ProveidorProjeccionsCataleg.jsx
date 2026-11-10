import { useProjeccionsCataleg } from '../../hooks/useProjeccionsCataleg.js';
import { ProjeccionsCatalegContext } from '../../components/universal/workspace/ProjeccionsCatalegContext.js';

/** Auth-aware route wrapper, deliberately outside the public kernel facade. */
export default function ProveidorProjeccionsCataleg({ children, enabled = true }) {
  const publicacio = useProjeccionsCataleg({ enabled });
  return <ProjeccionsCatalegContext.Provider value={publicacio}>{children}</ProjeccionsCatalegContext.Provider>;
}
