import { useLayoutEffect, useState } from 'react';
import { Especimen } from '../Especimen.jsx';
import { Alerta, Boto, SelectorDataHora } from '../../../../components/PedraSeca/index.js';
import { EstatDesament } from '../../../../components/universal/EstatDesament.jsx';
import { BarraTaronja } from '../../../../components/universal/barres/BarraTaronja.jsx';
import { LLINDAR_COMPTADOR, MAXIM_LEMA } from '../../../../data/limitsText.js';
import { Llinatge } from '../Llinatge.jsx';

const res = () => {};

/* T49 · Les xifres de mostra es deriven del límit de veres de l'entradilla:
   si canvia, el catàleg canvia amb ell. Un text que passa del límit i el
   primer valor que ja mostra el comptador (el llindar del 80 % de PerfilEditor). */
const LEMA_MASSA_LLARG = MAXIM_LEMA + 44;
const LEMA_AL_LLINDAR = Math.ceil(MAXIM_LEMA * LLINDAR_COMPTADOR);

/* T47 (ordre del Mestre, 260928) · L'indicador de l'autodesament i l'avís en
   línia d'un camp que el servidor no accepta. Els estats es pinten dins de la
   barra taronja de veres (BarraTaronja, T51), com a UniversalEditorShell
   (prop estatDesament). T51 · Ja no és una ploma: la ploma és del botó
   d'emoticona, i una barra d'edició sempre el porta (onObriEmoticona). Els
   quatre casos són d'edició: la pastilla és la de l'editor sense data
   triada, que diu la d'ara (decisió del Mestre, 260928); mai una data fixa. */
const ESTATS = [
  ['pendent', 'Canvis pendents: el núvol amb la fletxa es veu mentre el servidor no els té.'],
  ['error', 'Alguna cosa no s’ha pogut desar: el núvol es canvia per un avís.'],
  ['desat', 'Desat i confirmat pel servidor: el núvol amb el check es queda fins al canvi següent (ordre del Mestre, 261008).'],
  ['net', 'Obert sense cap canvi: res a la barra (la regió d’estat continua per al lector).'],
];

/* Ordre del Mestre (261008) · El check no és cap estat que es puga passar:
   és el pas de 'pendent' a 'net' (la confirmació del servidor). L'espècimen
   el viu de veres: naix pendent i, abans de pintar-se, passa a net. */
function EstatDesat() {
  const [estat, setEstat] = useState('pendent');
  useLayoutEffect(() => { setEstat('net'); }, []);
  return <EstatDesament estat={estat} />;
}

export default function EspecimenEstatDesament() {
  return (
    <>
    <Llinatge id="estat-desament" />
    <Especimen id="estat-desament" nom="EstatDesament · l’indicador de l’autodesament" fitxer="src/components/universal/EstatDesament.jsx"
      descripcio="L’editor no té botó «Guardar»: tot es desa sol, com Google Docs. El núvol amb la fletxa (blanc, dins del cercle de vel fosc de la barra) diu que hi ha canvis que el servidor encara no té; es canvia per un avís si alguna cosa falla i, quan el servidor ho confirma, pel núvol amb el check, que es queda fins al canvi següent: la certesa de «tot desat» en qualsevol moment. Els errors de desat d’un camp van en línia, davall del camp, i el text es conserva en el dispositiu."
      contracte={[
        ['estat', "'net' | 'pendent' | 'enviant' | 'sessio' | 'error'", "'net'", "D’on ve: la cua d’autodesament (useAutodesament). Un estat desconegut es tracta com a 'pendent'. El pas de 'pendent', 'enviant', 'sessio' o d’un 'error' amb reintentant a 'net' pinta el check (CloudCheck, .sdp-estat-desament--desat) fins al canvi següent; muntat ja en 'net', res."],
        ['detall', 'string', "''", 'Text per al lector i per al títol; si és buit, el de cada estat.'],
        ['accions', '[{ text, onClick }]', 'null', 'Les eixides del detall en «error» i «sessio» (p. ex. tornar a provar). Sense, només «Entesos».'],
        ['reintentant', 'boolean', 'false', "En 'error': la cua el torna a provar sola (sense xarxa, 5xx), i el pas d’eixe error a 'net' és la confirmació del servidor: pinta el check. Sense, un 'error' que passa a 'net' és un descart («Tornar al que hi ha desat») i no pinta res. No canvia el DOM de l’avís."],
        ['UniversalEditorShell.estatDesament', '{ estat, detall, accions?, reintentant? }', 'null', 'Pinta la icona com a primer element de la barra taronja i la regió viva a l’arrel de la closca. reintentant arriba a la icona (el pas d’un error que la cua torna a provar a net pinta el check); sense la clau, false. Sense la prop, el DOM és el de sempre.'],
        ['UniversalEditorShell.avisosCamps', '{ [camp]: { error?, comptador? } }', 'null', 'Errors en línia (role=alert) i comptador a partir del 80 % del límit, davall de l’entradilla.'],
      ]}
      a11y={['La regió role="status" (aria-live="polite") és sempre al DOM, invisible: els canvis s’anuncien sense moure la barra. La closca la munta a la seua arrel, fora de la barra taronja, que en mòbil s’amaga.', 'En «pendent» i «enviant» la icona és decorativa (aria-hidden). En «error» i «sessio» és un botó amb nom que obri el detall (Dialeg de la barra): què no s’ha desat i què cal fer.', 'El check de desat és una imatge amb nom (role="img", «Tots els canvis estan desats.»): qui recorre la barra amb el lector el troba quan vulga; no és cap botó.', 'Un error de camp és role="alert" i porta les seues eixides com a botons; en usar-les, el focus torna al camp.', 'El text de l’alerta és estable mentre s’escriu (s’anuncia una vegada); la llargària viva va al comptador, una línia fora de la regió viva.']}
      fes={['Un sol lloc per a l’estat del desament: la barra taronja.', 'Dir on es guarda el text de veres: «en este dispositiu» (IndexedDB) o «en esta pestanya».']}
      noFacis={['Avisar amb un toast efímer d’un error de desat: el text es perdria en eixir.', 'Retallar un text en silenci perquè càpiga: la persona ha de decidir.', 'Dir «desat» abans que el servidor ho haja confirmat.', 'Fer desaparéixer el check amb un temporitzador: la certesa ha de durar fins al canvi següent.']}>

      {ESTATS.map(([estat, text]) => (
        <div key={estat}>
          <h4>{estat}</h4>
          <p>{text}</p>
          <div className="sdp-especimen__barres">
            <BarraTaronja authorName="Sóc de Poble" authorLocation="La Torre de les Maçanes" authorAvatar="/assets/system/ui/logo-socdepoble-cuadrat-verd.svg"
              etiqueta={`Autoria i data (espècimen, ${estat})`} onObriEmoticona={res}
              barActions={(
                <>
                  {estat === 'desat' ? <EstatDesat /> : <EstatDesament estat={estat} />}
                  <SelectorDataHora valor={null} />
                </>
              )} />
          </div>
        </div>
      ))}

      <h4>Error en línia d’un camp</h4>
      <p className="sdp-avis-camp__comptador">{`Entradilla: ${LEMA_MASSA_LLARG} de ${MAXIM_LEMA} caràcters`}</p>
      <Alerta to="error" titol="Entradilla" accions={(
        <>
          <Boto varietat="secundari" onClick={res}>{`Retallar a ${MAXIM_LEMA}`}</Boto>
          <Boto varietat="secundari" onClick={res}>Tornar al que hi ha desat</Boto>
        </>
      )}>
        <p>{`Com a màxim ${MAXIM_LEMA} caràcters. El text es guarda en este dispositiu fins que l’escurces.`}</p>
      </Alerta>

      <h4>Comptador a partir del 80 % del límit</h4>
      <p className="sdp-avis-camp__comptador">{`Entradilla: ${LEMA_AL_LLINDAR} de ${MAXIM_LEMA} caràcters`}</p>
    </Especimen>
    </>
  );
}
