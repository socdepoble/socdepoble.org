/**
 * @module supabase/utils
 * @description Funcions utilitàries per a Supabase.
 * @contract
 *   - handleError(error)
 * Auditoria 261007 (B) · Retirats withRetry, batchInsert, getPagination,
 * getCount i searchWithPagination: cap codi, eina ni prova no els cridava, i
 * searchWithPagination interpolava el text de cerca dins d'un `.or(...)` de
 * PostgREST sense escapar-lo (una coma o un parèntesi trencaven el filtre si
 * algú la reutilitzava). Qui clone l'adaptador ja no hi troba helpers morts.
 */

/**
 * Gestiona errors de Supabase.
 * @param {Error} error - Error a gestionar.
 * @returns {object} - Objecte estandarditzat { error: string, code: number, details?: object }
 */
export const handleError = (error) => {
  if (!error) return { error: null, code: 200 };

  const errorMessage = error.message || String(error);
  const errorCode = error.status || error.code || 500;

  // Errors específics de Supabase
  if (errorMessage.includes('JWT')) {
    return {
      error: 'SESSIO_CADUCADA',
      code: 401,
      details: { message: 'La sessió ha caducat. Si us plau, torna a iniciar sessió.' },
    };
  }

  if (errorMessage.includes('Row not found') || errorMessage.includes('No rows found')) {
    return {
      error: 'NO_TROBAT',
      code: 404,
      details: { message: 'El recurs sol·licitat no existeix.' },
    };
  }

  if (errorMessage.includes('duplicate key')) {
    return {
      error: 'DUPLICAT',
      code: 409,
      details: { message: 'Ja existeix un registre amb aquests valors.' },
    };
  }

  if (errorMessage.includes('permission denied') || errorMessage.includes('403')) {
    return {
      error: 'SENSE_PERMIS',
      code: 403,
      details: { message: 'No tens permís per a realitzar aquesta acció.' },
    };
  }

  // Errors de xarxa
  if (errorMessage.includes('network') || errorMessage.includes('fetch')) {
    return {
      error: 'XARXA',
      code: 0,
      details: { message: 'Error de connexió. Si us plau, verifica la teua connexió a internet.' },
    };
  }

  return {
    error: errorMessage,
    code: errorCode,
    details: error,
  };
};
