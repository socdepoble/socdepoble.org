/**
 * @module supabase/utils
 * @description Funcions utilitàries per a Supabase.
 * @contract
 *   - handleError(error)
 *   - withRetry(fn, maxRetries)
 *   - batchInsert(table, data)
 *   - getPagination(page, limit)
 */

import { getClient } from './config.js';

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

/**
 * Executa una funció amb reintents automàtics.
 * @param {Function} fn - Funció a executar.
 * @param {number} maxRetries - Nombre màxim de reintents (default: 3).
 * @param {number} delay - Retard entre reintents en ms (default: 1000).
 * @returns {Promise<any>}
 */
export const withRetry = async (fn, maxRetries = 3, delay = 1000) => {
  let lastError;
  for (let i = 0; i < maxRetries; i++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error;
      if (i < maxRetries - 1) {
        await new Promise((resolve) => setTimeout(resolve, delay * (i + 1)));
      }
    }
  }
  throw lastError;
};

/**
 * Insereix múltiples registres en una taula.
 * @param {string} table - Nom de la taula.
 * @param {Array} data - Array de registres a inserir.
 * @param {number} batchSize - Mida del batch (default: 50).
 * @returns {Promise<{data: Array, error: object}>}
 */
export const batchInsert = async (table, data, batchSize = 50) => {
  try {
    const supabase = await getClient();
    const results = [];

    for (let i = 0; i < data.length; i += batchSize) {
      const batch = data.slice(i, i + batchSize);
      const { data: result, error } = await supabase.from(table).insert(batch).select();
      if (error) throw error;
      results.push(...result);
    }

    return { data: results, error: null };
  } catch (error) {
    return handleError(error);
  }
};

/**
 * Genera paràmetres de paginació.
 * @param {number} page - Pàgina actual (1-based).
 * @param {number} limit - Límit per pàgina.
 * @returns {object} - { offset, limit }
 */
export const getPagination = (page, limit) => {
  return {
    offset: (page - 1) * limit,
    limit,
  };
};

/**
 * Obté el nombre total de registres d'una taula.
 * @param {string} table - Nom de la taula.
 * @param {object} filters - Filtres a aplicar.
 * @returns {Promise<{count: number, error: object}>}
 */
export const getCount = async (table, filters = {}) => {
  try {
    const supabase = await getClient();
    let query = supabase.from(table).select('*', { count: 'exact', head: true });

    Object.entries(filters).forEach(([key, value]) => {
      query = query.eq(key, value);
    });

    const { count, error } = await query;
    return { count, error };
  } catch (error) {
    return { count: 0, error: handleError(error) };
  }
};

/**
 * Cerca registres amb paginació.
 * @param {string} table - Nom de la taula.
 * @param {object} options - Opcions de cerca i paginació.
 * @returns {Promise<{data: Array, count: number, error: object}>}
 */
export const searchWithPagination = async (table, options = {}) => {
  try {
    const supabase = await getClient();
    const { page = 1, limit = 20, filters = {}, orderBy, search } = options;

    let query = supabase.from(table).select('*', { count: 'exact' });

    // Aplicar filtres
    Object.entries(filters).forEach(([key, value]) => {
      query = query.eq(key, value);
    });

    // Aplicar cerca
    if (search) {
      query = query.or(
        `content.ilike.%${search}%,title.ilike.%${search}%,description.ilike.%${search}%`
      );
    }

    // Aplicar ordre
    if (orderBy) {
      query = query.order(orderBy.column, { ascending: orderBy.ascending ?? false });
    }

    // Aplicar paginació
    const { offset } = getPagination(page, limit);
    query = query.range(offset, offset + limit - 1);

    const { data, count, error } = await query;
    return { data, count, error };
  } catch (error) {
    return { data: [], count: 0, error: handleError(error) };
  }
};
