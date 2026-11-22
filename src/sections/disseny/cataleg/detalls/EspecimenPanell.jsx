/**
 * EspecimenPanell.jsx — El Panell de Disseny (MarIA, Onada 4): dos controls
 * vius, el «Mode Bancal · Sol i Lletra Gran» i l'ombra de la targeta.
 *
 * W4-13 (auditoria de Codex, 261004) · Abans es trencava en muntar
 * (/disseny?categoria=fonaments&item=fonaments-panell): importava per defecte
 * una UniversalCard que només s'exporta amb nom, i li passava props que no són
 * del seu contracte. A més, els dos controls escrivien directament a l'arrel
 * del document de la pàgina, fora de l'estat de l'app.
 *  · MODE BANCAL. És el mateix estat que el xip de l'accés del Xat, d'El meu
 *    perfil, del Panell de Control i de L'Avisador, i que l'opció «Mode Bancal ·
 *    Sol i Lletra Gran» del full «Ajustos» del Xat (UIContext → config/theme.js,
 *    esModeBancal): es desa per a esta persona i este dispositiu i arriba a les
 *    altres instàncies. Els atributs els posa App.jsx a l'arrel que pertoca
 *    (theme.js, arrelDePresentacio): ací no s'escriu cap atribut.
 *    v1.2.22 · Gauntlet R1 (L2-01, L3-05 i L2-02) · IDEA-323.4 · DOL-31 · Un sol
 *    interruptor, amb el rètol del xip (TEXTOS_MODE_SENIOR.ca.xip). Hi havia un
 *    segon interruptor, «Mode Sènior / Lectura Gran», que buscava setModeSenior i
 *    modeSenior, dos noms que UIContext no exposa (són setSeniorMode i
 *    seniorMode): dins de l'app sempre estava desactivat i deia «No», també amb
 *    la lletra gran encesa. Ja no hi és: és el mateix mode.
 *    L'interruptor diu el mode (seniorMode), com el xip, i no el contrast que es
 *    pinta. Amb «Segons el sistema» i el dispositiu demanant més contrast, es veu
 *    el contrast Bancal sense la lletra gran: l'interruptor diu «No» i una nota ho
 *    explica. Encendre'l és setContrast('bancal'), com triar-lo als Ajustos;
 *    apagar-lo és setSeniorMode(false), com el xip. Així cap toc d'ací no
 *    sobreescriu amb 'normal' la tria «Segons el sistema» desada (setContrast
 *    ('normal') l'esborrava sense dir-ho); un 'bancal' desat per una versió
 *    anterior sí que torna a 'normal' en apagar, com al xip.
 *  · OMBRA. La targeta conserva sempre l'ombra (Q6 del Mestre: cap vora sòlida
 *    en lloc de l'ombra). Els botons redefinixen --sdp-ombra-2, la que porta
 *    .sp-card, NOMÉS a la caixa de la mostra i amb tokens (--sdp-ombra-1 o
 *    --sdp-ombra-3), des d'una ref amb usePropietatsCss (el patró de T10 per a
 *    propietats que decidix el JavaScript). La resta de l'app no canvia.
 * Fora d'un UIProvider (el catàleg solt d'allLoaders.test.jsx) es pinta igual
 * i l'interruptor queda desactivat: no hi ha cap preferència a canviar.
 */
import { useRef, useState } from 'react';
import { Especimen } from '../Especimen.jsx';
import { GrupCamps, Interruptor } from '../../../../components/PedraSeca/organismes/formulari.jsx';
import { Boto } from '../../../../components/PedraSeca/atoms/Boto.jsx';
import { UniversalCard } from '../../../../components/PedraSeca/organismes/UniversalCard.jsx';
import { useUIActionsOpcional, useUIStateOpcional } from '../../../../app/contexts/UIContext.jsx';
import { usePropietatsCss } from '../../../../hooks/usePropietatsCss.js';
import { CONTRAST_BANCAL } from '../../../../config/theme.js';
import { TEXTOS_MODE_SENIOR } from '../../../../config/textosModeSenior.js';

/* Els tres graons d'ombra del sistema. La mitjana és la de .sp-card: sense
   valor, no es redefinix res. */
const OMBRES = Object.freeze([
  Object.freeze({ id: 'subtil', etiqueta: 'Ombra subtil', valor: 'var(--sdp-ombra-1)' }),
  Object.freeze({ id: 'mitjana', etiqueta: 'Ombra mitjana', valor: null }),
  Object.freeze({ id: 'elevada', etiqueta: 'Ombra elevada', valor: 'var(--sdp-ombra-3)' })
]);
const OMBRA_DE_SEMPRE = 'mitjana';
/* El rètol i la descripció del xip, en valencià: el catàleg de Disseny és en valencià. */
const MODE = TEXTOS_MODE_SENIOR.ca;

export default function EspecimenPanell() {
  const estat = useUIStateOpcional();
  const accions = useUIActionsOpcional();
  const potTriar = typeof accions?.setContrast === 'function' && typeof accions?.setSeniorMode === 'function';
  const modeActiu = estat?.seniorMode === true;
  const contrastDelSistema = !modeActiu && estat?.contrastMode === CONTRAST_BANCAL;
  const canviaMode = (actiu) => {
    if (!potTriar) return;
    if (actiu) accions.setContrast(CONTRAST_BANCAL);
    else accions.setSeniorMode(false);
  };

  const [ombra, setOmbra] = useState(OMBRA_DE_SEMPRE);
  const mostraRef = useRef(null);
  usePropietatsCss(mostraRef, { '--sdp-ombra-2': OMBRES.find((o) => o.id === ombra)?.valor });

  return (
    <>
      <Especimen
        id="panell-bancal"
        nom={MODE.xip}
        fitxer="src/config/theme.js"
        descripcio={`${MODE.descripcio} D’un sol toc encén o apaga alhora la lletra gran i el contrast Bancal; les targetes conserven l’ombra. És el mateix mode del xip de l’accés del Xat, d’El meu perfil, del Panell de Control i de L’Avisador, i de «${MODE.xip}» al full «Ajustos» del Xat: la tria es desa per a esta persona i este dispositiu i val per a tota l’app i per a les altres instàncies de la pàgina. «Segons el sistema» es tria als Ajustos i només posa el contrast que demana el dispositiu, sense la lletra gran: ací l’interruptor diu el mode, no eixe contrast.`}
        a11y={[
          'Interruptor amb role="switch" sobre un botó natiu: Intro i Espai sense JS, i l’estat es llig en text («Sí» o «No»).',
          'Encés, les dianes d’acció primària fan 56 × 56 píxels com a mínim.',
          'Els atributs de la lletra gran i del contrast van a l’arrel de l’app (theme.js, arrelDePresentacio): mai a l’<html> d’una pàgina amfitriona.'
        ]}
        fes={['Encendre el mode amb setContrast(\'bancal\') i apagar-lo amb setSeniorMode(false) (UIContext): un sol estat per al xip, els Ajustos, este Panell i les altres instàncies.']}
        noFacis={[
          'Escriure data-contrast o data-sdp-senior a mà en qualsevol element: App.jsx ja els posa a l’arrel que pertoca.',
          'Afegir un segon interruptor de lectura gran: és el mateix mode (IDEA-323.4).'
        ]}
      >
        <GrupCamps llegenda="Accessibilitat visual">
          <Interruptor etiqueta={MODE.xip} actiu={modeActiu} onCanvi={canviaMode} desactivat={!potTriar} />
        </GrupCamps>
        {contrastDelSistema ? (
          <p>
            Ara el contrast Bancal el posa el dispositiu («Segons el sistema», triat als Ajustos) i la lletra gran no hi és:
            el mode està apagat. Encendre’l o apagar-lo d’ací no canvia eixa tria.
          </p>
        ) : null}
        {potTriar ? null : <p>Fora de l’app no hi ha cap preferència del Mode Bancal a canviar.</p>}
      </Especimen>

      <Especimen
        id="panell-ombra"
        nom="Ombra de la targeta"
        fitxer="src/components/PedraSeca/organismes/UniversalCard.jsx"
        descripcio="La targeta conserva sempre l’ombra; ací es prova quina. Els botons canvien --sdp-ombra-2, la que porta .sp-card, només dins de la caixa de la mostra i amb els tokens --sdp-ombra-1 i --sdp-ombra-3. La resta de l’app no canvia."
        fes={['Triar entre els tres graons de token: mai una ombra escrita a mà.']}
        noFacis={['Llevar l’ombra a una targeta o substituir-la per una vora sòlida.']}
      >
        <div className="sdp-especimen__fila" role="group" aria-label="Ombra de la targeta de mostra">
          {OMBRES.map((o) => (
            <Boto key={o.id} varietat={o.id === ombra ? 'primari' : 'secundari'} aria-pressed={o.id === ombra}
              onClick={() => setOmbra(o.id)}>
              {o.etiqueta}
            </Boto>
          ))}
        </div>
        <div className="sdp-especimen__fila">
          <Boto varietat="fantasma" onClick={() => setOmbra(OMBRA_DE_SEMPRE)}>Restablir l’ombra de sempre</Boto>
        </div>
        <div ref={mostraRef} className="sdp-especimen__mostra sdp-especimen__mostra--estreta">
          <UniversalCard
            title="Mas del Roure"
            subtitle="Provant l’arquitectura de Pedra Seca"
            imageUrl="/assets/ui/plugins/disseny_vinyeta.jpg"
            body="Observa l’ombra i el contrast d’esta targeta. Ací és on l’estètica es posa a prova."
          />
        </div>
      </Especimen>
    </>
  );
}
