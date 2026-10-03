/**
 * La Nevera de Casa · obrir el detall d'un article (el DetallArticle de la
 * columna del catàleg) des de la columna de la col·lecció.
 *
 * En tauleta i escriptori les dues columnes es veuen: n'hi ha prou amb
 * ?article=<id> al camí actual. En pantalla estreta, la columna del catàleg
 * és inert darrere del panell de la col·lecció i el seu diàleg no es podria
 * tocar: es navega (push) al camí del catàleg amb ?article=<id>, i arrere
 * torna on era. (Pendent d'ampliació de l'esquelet: que ColumnaColleccio ho
 * faça ella sola.)
 */
import { useCallback } from 'react';
import { useNavigate } from '../../../app/contexts/RouterContext';
import { esIdOpac, useClosaAplicacio } from '../../plataforma/index.js';
import { useVistaCataleg, useVistesEsquelet } from '../../comu/esquelet/index.js';

export function useObriDetall({ primer, tram }) {
  const { mida } = useClosaAplicacio();
  const vista = useVistaCataleg();
  const vistes = useVistesEsquelet({ primer, tram });
  const navigate = useNavigate();
  return useCallback((articleId) => {
    if (!esIdOpac(articleId)) return;
    if (mida !== 'estret') {
      vista.obriArticle(articleId);
      return;
    }
    const [cami, consulta = ''] = vistes.cataleg.cami.split('?');
    const parametres = new URLSearchParams(consulta);
    parametres.set('article', articleId);
    navigate(`${cami}?${parametres.toString()}`);
  }, [mida, vista, vistes, navigate]);
}
