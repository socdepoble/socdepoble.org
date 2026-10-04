/**
 * DialegTriaTargeta.jsx — El selector de la targeta que s'incrusta al cos.
 *
 * T7 (ordre del Mestre, prompt 261004_0515) · Un Dialeg de Pedra Seca amb
 * un camp de cerca i les opcions en targetes (GrupOpcions): es tria i es
 * confirma amb «Inserir», com qualsevol decisió que es confirma després.
 * La font és la funció `cerca(consulta)` de l'adaptador (Model B): ací no
 * s'importa cap secció, i el que no es pot incrustar (privat o d'un tipus
 * no públic) no ix com a opció (attrsDeEntrada).
 *
 * En tancar (Cancel·lar, Escape o el vel) i en inserir, la consulta i la
 * tria s'obliden. El focus va al camp de cerca en obrir-se i torna on era
 * en tancar-se (Dialeg).
 */
import { useCallback, useId, useMemo, useRef, useState } from 'react';
import { Boto } from '../../../../PedraSeca/atoms/Boto.jsx';
import { Dialeg } from '../../../../PedraSeca/organismes/Dialeg.jsx';
import { Camp, CampText, GrupOpcions } from '../../../../PedraSeca/organismes/formulari.jsx';
import { attrsDeEntrada, llegeixClau } from './formaDelGrup.js';

const senseTraductor = (_clau, text) => text;

/* Com a molt, les primeres opcions: la llista és per a triar, no per a llegir. */
export const MAXIM_OPCIONS = 20;

const NOM_DEL_TIPUS = Object.freeze({
  publicacio: ['editor.targetes.tipus.publicacio', 'Publicació'],
  esdeveniment: ['editor.targetes.tipus.esdeveniment', 'Acte'],
  producte: ['editor.targetes.tipus.producte', 'Producte'],
  poble: ['editor.targetes.tipus.poble', 'Poble'],
  pagina: ['editor.targetes.tipus.pagina', 'Pàgina']
});

/* L'ajuda d'una opció: l'extracte, en una línia curta. */
const ajudaDe = (text) => {
  const net = String(text || '').trim();
  return net.length > 140 ? `${net.slice(0, 139).trim()}…` : net;
};

/* Les entrades que es poden incrustar, amb els seus atributs, sense repetir clau. */
function opcionsDe(entrades) {
  const vistes = new Set();
  const opcions = [];
  for (const entrada of Array.isArray(entrades) ? entrades : []) {
    const attrs = attrsDeEntrada(entrada);
    if (!attrs || vistes.has(attrs.clau)) continue;
    vistes.add(attrs.clau);
    opcions.push({ entrada, attrs });
    if (opcions.length >= MAXIM_OPCIONS) break;
  }
  return opcions;
}

export function DialegTriaTargeta({ obert, onTanca, cerca, onTria, t = senseTraductor }) {
  const [consulta, setConsulta] = useState('');
  const [triada, setTriada] = useState(null);
  const zonaCerca = useRef(null);
  const nom = useId();

  const opcions = useMemo(() => {
    const neta = consulta.trim();
    if (!obert || !neta || typeof cerca !== 'function') return [];
    try {
      return opcionsDe(cerca(neta));
    } catch {
      return [];
    }
  }, [obert, consulta, cerca]);

  const triadaViva = opcions.find((opcio) => opcio.attrs.clau === triada) || null;

  const oblida = useCallback(() => {
    setConsulta('');
    setTriada(null);
  }, []);

  const tanca = useCallback((motiu, info) => {
    oblida();
    onTanca?.(motiu, info);
  }, [oblida, onTanca]);

  const insereix = () => {
    if (!triadaViva) return;
    oblida();
    onTria?.(triadaViva.entrada);
  };

  const enfocaCerca = useCallback(() => {
    zonaCerca.current?.querySelector('input')?.focus();
  }, []);

  /* Revisió del front (261004) · La regió viva (role=status) viu sempre
     muntada i només li canvia el text: una regió que naix ja plena sovint no
     s'anuncia. Amb resultats diu quants n'hi ha, només per al lector
     (sdp-nomes-lector: fora del flux de la graella, la pantalla no canvia). */
  const neta = consulta.trim();
  const ambResultats = Boolean(neta) && opcions.length > 0;
  const avis = !neta
    ? t('editor.targetes.dialeg.buit', 'Escriu el que busques: una publicació, un acte, un producte, un poble o una pàgina.')
    : ambResultats
      ? `${t('editor.targetes.dialeg.resultats', 'Resultats')}: ${opcions.length}`
      : t('editor.targetes.dialeg.capResultat', 'Cap targeta pública coincidix amb la cerca.');

  return (
    <Dialeg
      obert={obert}
      onTanca={tanca}
      onObert={enfocaCerca}
      titol={t('editor.targetes.dialeg.titol', 'Inserir una targeta')}
      descripcio={t('editor.targetes.dialeg.descripcio', 'La targeta s’incrusta al text com una imatge: una sola s’alinea a un costat, dues van al centre i tres o més fan una graella.')}
      mida="m"
      accions={(
        <>
          <Boto varietat="secundari" onClick={() => tanca('boto')}>{t('common.cancela', 'Cancel·lar')}</Boto>
          <Boto varietat="primari" disabled={!triadaViva} onClick={insereix}>{t('editor.targetes.dialeg.inserir', 'Inserir')}</Boto>
        </>
      )}
    >
      <div ref={zonaCerca} className="sdp-tria-targeta">
        <Camp etiqueta={t('editor.targetes.dialeg.cerca', 'Busca')}>
          <CampText tipus="search" value={consulta} autoComplete="off" onChange={(event) => setConsulta(event.target.value)} />
        </Camp>
        <p className={ambResultats ? 'sdp-tria-targeta__avis sdp-nomes-lector' : 'sdp-tria-targeta__avis'} role="status">{avis}</p>
        {opcions.length ? (
          <GrupOpcions
            llegenda={t('editor.targetes.dialeg.resultats', 'Resultats')}
            nom={`tria-targeta-${nom}`}
            aspecte="targetes"
            valor={triadaViva ? triadaViva.attrs.clau : null}
            onCanvi={setTriada}
            textTriada={t('editor.targetes.dialeg.triada', 'Triada')}
            opcions={opcions.map(({ attrs, entrada }) => {
              const [clauTipus, textTipus] = NOM_DEL_TIPUS[llegeixClau(attrs.clau)?.tipus] || ['', ''];
              return {
                valor: attrs.clau,
                etiqueta: attrs.titol,
                antetitol: clauTipus ? t(clauTipus, textTipus) : undefined,
                ajuda: ajudaDe(entrada.extracte) || undefined
              };
            })}
          />
        ) : null}
      </div>
    </Dialeg>
  );
}

export default DialegTriaTargeta;
