/**
 * Lector de notícies · IDEA-265 (261118) · el que porta la lectura d'un article de la carpeta
 * «Observatori I+D · Mestres» (observatori.js), només per a superadmins (context · observatori):
 *   veredicte  una Insignia amb el text del veredicte (mai només el color): Descartar, Vigilant WP
 *              o Idea de sistema
 *   promoure   «Promou al Llibre Mestre» copia la fitxa (textPromocio) al porta-retalls i ho diu
 *              per una regió viva. Copiar deixa la revisió en mans humanes: el navegador no escriu
 *              mai al Llibre Mestre.
 * Un article que no és de l'observatori, o amb un veredicte que no és de la llista, no porta res.
 */
import { useState } from 'react';
import { ClipboardCopy } from 'lucide-react';
import { Boto, Insignia } from '../../../components/PedraSeca/index.js';
import { textosLector } from '../i18nLector.js';
import { llegixEntradaObservatori, textPromocio } from '../observatori.js';
import { useVistaLector } from './context.js';

/* El to de cada veredicte; el text és el que el diu. */
const TO_DEL_VEREDICTE = Object.freeze({ DESCARTAR: 'neutre', GUARDAR_VIGILANT_WP: 'avis', PROPOSAR_IDEA_SISTEMA: 'info' });

async function copia(text) {
  const portaRetalls = typeof navigator === 'undefined' ? null : navigator.clipboard;
  if (typeof portaRetalls?.writeText !== 'function') throw new Error('Sense porta-retalls.');
  await portaRetalls.writeText(text);
}

/** `article`: l'article obert (sencer o el resum). */
export function ObservatoriDeLArticle({ article }) {
  const { observatori = false, idioma = 'ca' } = useVistaLector();
  const tx = textosLector(idioma).observatori;
  const [avis, setAvis] = useState({ id: null, text: '' });
  const entrada = observatori ? llegixEntradaObservatori(article) : null;
  if (!entrada) return null;
  const promou = () => {
    const id = article.id;
    copia(textPromocio(entrada)).then(
      () => setAvis({ id, text: tx.copiada }),
      () => setAvis({ id, text: tx.noCopiada })
    );
  };
  return (
    <>
      <p>
        <Insignia to={TO_DEL_VEREDICTE[entrada.veredicte]}>{tx.veredicte(tx.veredictes[entrada.veredicte])}</Insignia>
      </p>
      <p>
        <Boto varietat="secundari" icona={ClipboardCopy} onClick={promou}>{tx.promou}</Boto>
        {' '}
        <span role="status">{avis.id === article.id ? avis.text : ''}</span>
      </p>
    </>
  );
}
