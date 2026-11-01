/**
 * EspecimenXatSeguretat.jsx — L'estat del xifratge d'una conversa, el número de
 * seguretat amb «Marca com a verificat» i el bloc «Persones de confiança» (P1-12
 * pas 17 i IDEA-48; pla 261101_1246, T7 · S7; Pedra Seca §9: l'espècimen abans
 * de les peces).
 *
 * MAQUETA darrere de la bandera E2EE_ACTIU_PER_DEFECTE (apagada): a l'app, cap
 * d'estes peces es veu i el xat NO és xifrat d'extrem a extrem. Ací es munten
 * les peces de producció (CosSeguretatXat i CosPersonesConfianca) amb dades
 * inventades: cap servei, cap port i cap mòdul criptogràfic (els números són
 * xifres de mostra, no cap empremta). La marca d'una mostra canvia de veres,
 * però només en esta pàgina.
 */
import { useState } from 'react';
import { Especimen } from '../Especimen.jsx';
import CosSeguretatXat from '../../../xat/components/CosSeguretatXat.jsx';
import CosPersonesConfianca from '../../../profile/CosPersonesConfianca.jsx';
import { estatXifratgeDelFil } from '../../../xat/estatXifratgeFil.js';

/* Traductor mínim: les alternatives ja són el text en valencià. */
const t = (_clau, alternativa) => alternativa;

/* 12 grups de 5 xifres inventades (no és cap empremta de cap clau). */
const NUMERO_MOSTRA = '04126 39587 61203 88451 27904 53316 70258 19643 95072 31480 66817 42935';
const NUMERO_NOU_MOSTRA = '81530 26749 03318 57092 64185 90427 12756 38604 49271 75913 20586 67340';

/* Els abasts de mostra, amb la forma que dona el servei (ambitDelFil). */
const abast = (motiu, tipusFil, { xifrat = true, bloquejat = false } = {}) => ({ xifrat, obligatori: xifrat, bloquejat, apegalos: false, motiu, tipusFil });
const ESTATS = Object.freeze({
  directe: estatXifratgeDelFil({ actiu: true, abast: abast('directe-persona', 'directe'), entornSegur: true }),
  grup: estatXifratgeDelFil({ actiu: true, abast: abast('grup-privat', 'grup'), entornSegur: true }),
  entitat: estatXifratgeDelFil({ actiu: true, abast: abast('directe-entitat', 'entitat'), entornSegur: true }),
  iaia: estatXifratgeDelFil({ actiu: true, abast: abast('iaia', null, { xifrat: false }), entornSegur: true }),
  public: estatXifratgeDelFil({ actiu: true, abast: abast('public', null, { xifrat: false }), entornSegur: true }),
  bloquejat: estatXifratgeDelFil({ actiu: true, abast: abast('rebaixa-apegalos', 'directe', { bloquejat: true }), entornSegur: true }),
  sensePrimitives: estatXifratgeDelFil({ actiu: true, abast: abast('directe-persona', 'directe'), entornSegur: false })
});

/* La mostra que es pot tocar: «Marca com a verificat» i «Lleva la marca» alternen. */
function MostraMarcable() {
  const [verificat, setVerificat] = useState(false);
  return (
    <CosSeguretatXat estat={ESTATS.directe} nom="Pepa" t={t}
      numero={{ estat: 'llest', numero: NUMERO_MOSTRA, kid: 'mostra', verificat, avis: null, ocupat: false }}
      onMarca={(valor) => setVerificat(valor === true)} />
  );
}

/* Cada mostra diu que és una maqueta: fora de context, cap captura ha de semblar un xat xifrat. */
const Mostra = ({ titol, children }) => (
  <>
    <h4>{`Maqueta · ${titol}`}</h4>
    <div className="sdp-especimen__mostra sdp-especimen__mostra--estreta">{children}</div>
  </>
);

export default function EspecimenXatSeguretat() {
  return (
    <>
      <Especimen id="xat-seguretat" nom="CosSeguretatXat" fitxer="src/sections/xat/components/CosSeguretatXat.jsx"
        descripcio="Maqueta, encara no activa: el xifratge d’extrem a extrem del xat va darrere d’una bandera apagada i, avui, el xat no és xifrat. Quan s’encenga, el menú «⋯» de cada conversa portarà «Xifratge i número de seguretat», que obri este cos dins d’un diàleg (PanellSeguretatXat): què passa amb els missatges d’esta conversa i, en un xat privat entre dues persones, el número de seguretat per a comparar-lo en persona o per telèfon. La marca «verificat» viu només en este aparell. No hi ha cap interruptor per a xifrar o no una conversa: tota conversa privada es xifra o espera, i no ix en clar."
        contracte={[
          ['estat', '{ estat, potVerificar, text, nota }', '—', 'L’estat del xifratge de la conversa (estatXifratgeDelFil, xat/estatXifratgeFil.js).'],
          ['numero', '{ estat, numero, kid, verificat, avis, ocupat }', 'null', 'El número del servei (useNumeroSeguretat): calculant, llest, sense-clau, sense-claus-propies, clau-canviada o error; avis: canviat o errorMarca.'],
          ['nom', 'string', '\'\'', 'El nom de l’altra persona, per a {nom}.'],
          ['onMarca', '(verificat: boolean) => void', 'null', 'Marca o lleva la marca, només per al kid que s’ha mostrat.'],
          ['t', '(clau, reserva) => string', 'reserva', 'El traductor de l’app; fora, el valencià.']
        ]}
        a11y={[
          'El número és un grup amb nom («Número de seguretat»), no una llista: 12 grups de 5 xifres de lectura tabular.',
          '«Calculant…» és una línia d’estat; els errors van en una Alerta; les icones són decoració (aria-hidden).',
          'El botó de la marca és un Boto de 48 px que diu el que farà; mentre desa, «Treballant…».',
          'El diàleg torna el focus al «⋯» de la capçalera en tancar-se.'
        ]}
        fes={[
          'Dir només el que és cert a cada estat: «es xifren» només on el xifratge és actiu de veres.',
          'Comparar el número en persona o per telèfon abans de marcar-lo.',
          'Si la clau ha canviat mentre es mirava, mostrar el número nou i avisar, sense desar cap marca.'
        ]}
        noFacis={[
          'Un interruptor per a xifrar o no una conversa.',
          '«Mai», «100 %», «immune» o «inviolable».',
          'Un número en un grup, en un xat públic o amb la IAIA.'
        ]}>
        <Mostra titol="Xat privat entre dues persones (la marca es pot tocar)"><MostraMarcable /></Mostra>
        <Mostra titol="Verificat">
          <CosSeguretatXat estat={ESTATS.directe} nom="Pepa" t={t} onMarca={() => {}}
            numero={{ estat: 'llest', numero: NUMERO_MOSTRA, kid: 'mostra', verificat: true, avis: null, ocupat: false }} />
        </Mostra>
        <Mostra titol="La clau ha canviat mentre es mirava: el número nou">
          <CosSeguretatXat estat={ESTATS.directe} nom="Pepa" t={t} onMarca={() => {}}
            numero={{ estat: 'llest', numero: NUMERO_NOU_MOSTRA, kid: 'mostra-nova', verificat: false, avis: 'canviat', ocupat: false }} />
        </Mostra>
        <Mostra titol="Calculant">
          <CosSeguretatXat estat={ESTATS.directe} nom="Pepa" t={t} numero={{ estat: 'calculant' }} />
        </Mostra>
        <Mostra titol="L’altra persona encara no té claus">
          <CosSeguretatXat estat={ESTATS.directe} nom="Pepa" t={t} numero={{ estat: 'sense-clau' }} />
        </Mostra>
        <Mostra titol="Este aparell encara no té les claus pròpies">
          <CosSeguretatXat estat={ESTATS.directe} nom="Pepa" t={t} numero={{ estat: 'sense-claus-propies' }} />
        </Mostra>
        <Mostra titol="Una clau nova sense confirmar">
          <CosSeguretatXat estat={ESTATS.directe} nom="Pepa" t={t} numero={{ estat: 'clau-canviada' }} />
        </Mostra>
        <Mostra titol="Grup privat: sense número de grup">
          <CosSeguretatXat estat={ESTATS.grup} nom="Les Comares" t={t} />
        </Mostra>
        <Mostra titol="Entitat, IAIA, xat públic, canvi inesperat i adreça que no pot xifrar">
          <CosSeguretatXat estat={ESTATS.entitat} t={t} />
          <CosSeguretatXat estat={ESTATS.iaia} t={t} />
          <CosSeguretatXat estat={ESTATS.public} t={t} />
          <CosSeguretatXat estat={ESTATS.bloquejat} t={t} />
          <CosSeguretatXat estat={ESTATS.sensePrimitives} t={t} />
        </Mostra>
      </Especimen>
      <Especimen id="persones-confianca" nom="CosPersonesConfianca" fitxer="src/sections/profile/CosPersonesConfianca.jsx"
        descripcio="Maqueta, encara no activa: el bloc «Persones de confiança» de Privacitat i dades (IDEA-48), darrere de la mateixa bandera apagada. Diu quants contactes tens amb el número de seguretat verificat en este aparell, quants en falten fins a tres i el risc de triar-les. La recuperació amb persones de confiança encara no existix: cap botó crea el cercle."
        contracte={[
          ['verificats', 'number | null', 'null', 'Contactes verificats en este aparell; null mentre es llig.'],
          ['error', 'boolean', 'false', 'La lectura ha fallat: l’avís, sense recompte.'],
          ['teRecuperacio', 'boolean', 'false', 'Si la recuperació ja està activa en este node (teCapacitat(\'recuperacioSocial\'), avui sempre fals). Fals: la línia «encara no està activa» en tots els estats.']
        ]}
        a11y={['El títol el posa el Bloc del Perfil (h2 amb nom de regió); l’error és una Alerta.']}
        fes={['Dir el que ja és cert: el recompte, el que falta fins a tres i que la recuperació encara no està activa.']}
        noFacis={['Cap acció de crear el cercle fins que la recuperació siga real.', 'Un zero inventat quan la lectura falla.']}>
        <Mostra titol="Cap contacte verificat"><CosPersonesConfianca verificats={0} /></Mostra>
        <Mostra titol="Un"><CosPersonesConfianca verificats={1} /></Mostra>
        <Mostra titol="Dos"><CosPersonesConfianca verificats={2} /></Mostra>
        <Mostra titol="Tres"><CosPersonesConfianca verificats={3} /></Mostra>
        <Mostra titol="Cinc"><CosPersonesConfianca verificats={5} /></Mostra>
        <Mostra titol="La lectura ha fallat"><CosPersonesConfianca error /></Mostra>
      </Especimen>
    </>
  );
}
