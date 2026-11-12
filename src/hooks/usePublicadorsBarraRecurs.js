/** La lectura del port és del consumidor; la barra només rep publicadors acreditats. */
import { capturaConsultaPublicadors } from '../data/copublicacio.js';
import { usePublicadorsRegistrats } from './usePublicadorsRegistrats.js';

function consultaValida(recurs) {
  if (!recurs) return undefined;
  try {
    return capturaConsultaPublicadors(recurs);
  } catch {
    return undefined;
  }
}

export function usePublicadorsBarraRecurs(recurs) {
  const consulta = usePublicadorsRegistrats(consultaValida(recurs));
  return {
    ...consulta,
    publicadorsRegistrats: consulta.fase === 'llest' ? consulta.publicadorsRegistrats : null
  };
}

