/**
 * EspecimenXatCerca.jsx — la cerca global del Xat (onada 3, T69; catàleg de
 * l'onada 3B, Pedra Seca §9): la fitxa del filtre dins del camp de cerca, la
 * llista vertical de filtres amb una fila enfocada (FiltresCerca) i els
 * resultats (ResultatsCercaXat) amb dades, amb un filtre sense dades i sense
 * cap resultat.
 *
 * Els resultats són els de cercaXat() de veres sobre la llavor de
 * mostraDelXat(): el terme «torre» troba una comunitat, un grup i un canal,
 * una persona del padró i un missatge.
 *
 * DEUTE declarat: la fitxa del filtre no és cap component, és marcat en línia
 * de XatSection.jsx. Ací es munta el mateix marcat, control per control (les
 * mateixes classes, claus i18n, IconaFiltre, la lupa, la fitxa i el ⊗ «Tanca
 * la cerca», amb el mateix onMouseDown), i cap control que el camp real no
 * tinga: tornar a posar el filtre és un botó de l'espècimen, fora del camp.
 * El dia que s'extraga el camp de cerca a un component propi, este espècimen
 * l'ha de muntar i esta còpia desapareix.
 */
import { useEffect, useRef, useState } from 'react';
import { CircleX, Search, X } from 'lucide-react';
import { Especimen } from '../Especimen.jsx';
import { Boto } from '../../../../components/PedraSeca/index.js';
import FiltresCerca, { IconaFiltre } from '../../../xat/components/FiltresCerca.jsx';
import ResultatsCercaXat from '../../../xat/components/ResultatsCercaXat.jsx';
import { FILTRES_CERCA_XAT, cercaXat } from '../../../xat/cercaXat.js';
import { mostraDelXat } from './EspecimenXatLlista.jsx';

const t = (clau, alternativa) => alternativa;
const LOCALE = 'ca-ES';
const noop = () => {};

/* La fitxa del filtre triat dins del camp: el marcat de XatSection.jsx
   (onada 3), sense res de més. */
function CampAmbFitxa() {
  const [filtre, setFiltre] = useState('fotos');
  const [terme, setTerme] = useState('');
  const cercaRef = useRef(null);
  const actiu = FILTRES_CERCA_XAT.find((f) => f.id === filtre) || null;
  const nomFiltre = actiu ? t(actiu.clauI18n, actiu.etiqueta) : '';
  const etiquetaCerca = t('section.xat.cerca', 'Cerca converses');
  const noRobes = (e) => e.preventDefault();
  return (
    <>
      <div className="sdp-xat-cerca">
        <div className="sdp-xat-cerca__camp sdp-xat-cerca__camp--actiu">
          {actiu ? (
            <button
              type="button"
              className="sdp-xat-fitxa"
              aria-label={t('section.xat.cerca.lleva', 'Lleva el filtre {nom}').replace('{nom}', nomFiltre)}
              onMouseDown={noRobes}
              onClick={() => { setFiltre(null); cercaRef.current?.focus(); }}
            >
              <span className="sdp-xat-fitxa__pastilla">
                <IconaFiltre nom={actiu.icona} size={16} />
                <span>{nomFiltre}</span>
                <X size={16} aria-hidden="true" focusable="false" />
              </span>
            </button>
          ) : null}
          <label className="sdp-xat-cerca__etiqueta">
            <span className="sdp-nomes-lector">{etiquetaCerca}</span>
            {!actiu ? <Search size={20} aria-hidden="true" focusable="false" /> : null}
            <input ref={cercaRef} type="search" autoComplete="off" value={terme} placeholder={etiquetaCerca} onChange={(e) => setTerme(e.target.value)} />
          </label>
          {/* P1-36 (pla 261028_1526) · Amb la lupa, la cerca oberta porta sempre el ⊗:
              buida, la tanca; amb terme o filtre, els lleva. */}
          <button
            type="button"
            className="sdp-xat-icona"
            aria-label={t('section.xat.tancaCerca', 'Tanca la cerca')}
            onMouseDown={noRobes}
            onClick={() => { setTerme(''); setFiltre(null); cercaRef.current?.focus(); }}
          >
            <CircleX size={20} aria-hidden="true" focusable="false" />
          </button>
        </div>
      </div>
      <div className="sdp-especimen__fila">
        <Boto varietat="secundari" onClick={() => setFiltre('fotos')} disabled={filtre === 'fotos'}>Torna a triar Fotos (espècimen)</Boto>
      </div>
    </>
  );
}

/* La llista vertical de filtres amb la segona fila enfocada en muntar-se,
   sense moure la pàgina (preventScroll) i una sola vegada. */
function FiltresAmbFocus({ onTria }) {
  const llista = useRef(null);
  const fet = useRef(false);
  useEffect(() => {
    if (fet.current) return;
    fet.current = true;
    llista.current?.querySelectorAll('.sdp-xat-filtres-cerca__fila')[1]?.focus({ preventScroll: true });
  }, []);
  const enfoca = () => llista.current?.querySelectorAll('.sdp-xat-filtres-cerca__fila')[1]?.focus();
  return (
    <>
      <div className="sdp-xat sdp-xat-especimen sdp-xat-especimen--baixa">
        <FiltresCerca ref={llista} onTria={onTria} onBlur={noop} onTornaAlCamp={noop} t={t} />
      </div>
      <div className="sdp-especimen__fila">
        <Boto varietat="secundari" onClick={enfoca}>Torna a enfocar la segona fila</Boto>
      </div>
    </>
  );
}

export default function EspecimenXatCerca() {
  const [avis, setAvis] = useState('Tria un filtre o un resultat.');
  const { fils, comunitats, membres, missatgesPerFil } = mostraDelXat();
  const busca = (terme, filtre = null) => cercaXat({ terme, filtre, fils, membres, missatgesPerFil, joId: 'jo' });
  const resultats = (terme, filtre, etiqueta) => (
    <div className="sdp-xat sdp-xat-especimen sdp-xat-especimen--baixa" aria-label={etiqueta} role="group">
      <ResultatsCercaXat
        resultat={busca(terme, filtre)}
        terme={terme}
        filtre={filtre}
        onObriFil={(fil) => setAvis(`Obriria ${fil.name}.`)}
        onObriPersona={(membre) => setAvis(`Obriria la conversa amb ${membre.nom}.`)}
        comunitats={comunitats}
        locale={LOCALE}
        t={t}
      />
    </div>
  );

  return (
    <Especimen id="xat-cerca" nom="Xat · cerca global" fitxer="src/sections/xat/components/ (FiltresCerca, ResultatsCercaXat) · src/sections/xat/cercaXat.js"
      descripcio="La cerca del Xat amb el patró estàndard de missatgeria (captura de referència 19.13.56): amb el focus i el camp buit, la llista vertical de filtres; en triar-ne un, una fitxa dins del camp; en escriure, els resultats de cercaXat() en tres grups (Converses, Persones i Missatges), amb els fragments ressaltats i l’avís de l’abast. Un filtre sense dades i una cerca sense resultats ho diuen amb text."
      contracte={[
        ['FiltresCerca', '{ onTria, onBlur, onTornaAlCamp, t } + ref', '—', 'Les fletxes, Inici i Fi es mouen entre files; Escape, Maj+Tab a la primera o Fletxa amunt a la primera tornen al camp.'],
        ['IconaFiltre', '{ nom, size? }', '24', 'La icona de lucide pel nom de FILTRES_CERCA_XAT.'],
        ['ResultatsCercaXat', '{ resultat, terme, filtre, onObriFil, onObriPersona, obrintAmb?, locale, t, comunitats? }', '—', 'Pinta el que torna cercaXat(); una comunitat obri la fitxa i porta els noms dels seus grups.']
      ]}
      a11y={[
        'Cada grup de resultats és una secció amb el seu títol (aria-labelledby); els ressaltats són <mark>.',
        'La fitxa del filtre és un botó amb nom («Lleva el filtre …»); Retrocés amb el camp buit també la lleva.',
        'L’estat buit és role="status": diu per què no hi ha res.'
      ]}
      fes={['Dir l’abast: només es busca en les converses obertes en esta sessió.', 'Posar el filtre com una fitxa dins del camp i seguir-hi escrivint.']}
      noFacis={['Inventar resultats d’un tipus que el backend encara no escriu.', 'Pintar HTML dels missatges: els trossos es pinten com a text.']}>
      <h4>La fitxa del filtre dins del camp de cerca</h4>
      <p>Marcat en línia de XatSection.jsx (deute: encara no és un component propi). Prem la fitxa per a llevar el filtre; el botó de davall és de l’espècimen i el torna a posar.</p>
      <div className="sdp-xat sdp-xat-especimen sdp-xat-especimen--baixa">
        <CampAmbFitxa />
      </div>

      <h4>Filtres de cerca, amb una fila enfocada</h4>
      <FiltresAmbFocus onTria={(id) => setAvis(`Triaria el filtre ${id}.`)} />

      <h4>Resultats: una comunitat, un grup i un canal, gent i missatges («torre»)</h4>
      {resultats('torre', null, 'Resultats de mostra amb dades')}

      <h4>Un filtre sense dades (Fotos)</h4>
      {resultats('', 'fotos', 'Resultats de mostra amb un filtre sense dades')}

      <h4>Cap resultat («zzz»)</h4>
      {resultats('zzz', null, 'Resultats de mostra sense cap resultat')}
      <p role="status">{avis}</p>
    </Especimen>
  );
}
