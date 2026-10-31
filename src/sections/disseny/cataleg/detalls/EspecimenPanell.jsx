/**
 * EspecimenPanell.jsx — El Panell de Disseny (MarIA, Onada 4): dos controls
 * vius, el Mode Bancal i l'ombra de la targeta.
 *
 * W4-13 (auditoria de Codex, 261004) · Abans es trencava en muntar
 * (/disseny?categoria=fonaments&item=fonaments-panell): importava per defecte
 * una UniversalCard que només s'exporta amb nom, i li passava props que no són
 * del seu contracte. A més, els dos controls escrivien directament a l'arrel
 * del document de la pàgina, fora de l'estat de l'app.
 *  · BANCAL. És el mateix estat que el control «Contrast» del full «Ajustos»
 *    del Xat (UIContext.setContrast → config/theme.js): es desa per a esta
 *    persona i este dispositiu i arriba a les altres instàncies. L'atribut el
 *    posa App.jsx a l'arrel que pertoca (theme.js, arrelDePresentacio): ací no
 *    s'escriu cap atribut. L'interruptor diu el mode que es veu, també quan
 *    l'ha triat el sistema («Segons el sistema», als Ajustos).
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

/* Els tres graons d'ombra del sistema. La mitjana és la de .sp-card: sense
   valor, no es redefinix res. */
const OMBRES = Object.freeze([
  Object.freeze({ id: 'subtil', etiqueta: 'Ombra subtil', valor: 'var(--sdp-ombra-1)' }),
  Object.freeze({ id: 'mitjana', etiqueta: 'Ombra mitjana', valor: null }),
  Object.freeze({ id: 'elevada', etiqueta: 'Ombra elevada', valor: 'var(--sdp-ombra-3)' })
]);
const OMBRA_DE_SEMPRE = 'mitjana';

export default function EspecimenPanell() {
  const estat = useUIStateOpcional();
  const accions = useUIActionsOpcional();
  const potTriar = typeof accions?.setContrast === 'function';
  const bancalActiu = estat?.contrastMode === CONTRAST_BANCAL;
  const canviaBancal = (actiu) => {
    if (potTriar) accions.setContrast(actiu ? CONTRAST_BANCAL : 'normal');
  };

  const [ombra, setOmbra] = useState(OMBRA_DE_SEMPRE);
  const mostraRef = useRef(null);
  usePropietatsCss(mostraRef, { '--sdp-ombra-2': OMBRES.find((o) => o.id === ombra)?.valor });

  return (
    <>
      <Especimen
        id="panell-bancal"
        nom="Mode Bancal"
        fitxer="src/config/theme.js"
        descripcio="El mateix interruptor que «Contrast» al full «Ajustos» del Xat: la tria es desa per a esta persona i este dispositiu i val per a tota l’app i per a les altres instàncies de la pàgina. Encés, el text passa a graons foscos de 9:1 o més i els enllaços, de 7:1 o més; les targetes conserven l’ombra. «Segons el sistema» es tria als Ajustos; ací l’interruptor diu el mode que es veu."
        a11y={[
          'Interruptor amb role="switch" sobre un botó natiu: Intro i Espai sense JS, i l’estat es llig en text («Sí» o «No»).',
          'L’atribut de contrast va a l’arrel de l’app (theme.js, arrelDePresentacio): mai a l’<html> d’una pàgina amfitriona.'
        ]}
        fes={['Canviar el contrast amb setContrast (UIContext): un sol estat per als Ajustos, este Panell i el sistema.']}
        noFacis={['Escriure data-contrast a mà en qualsevol element: App.jsx ja el posa a l’arrel que pertoca.']}
      >
        <GrupCamps llegenda="Accessibilitat visual">
          <Interruptor etiqueta="Activar el Mode Bancal" actiu={bancalActiu} onCanvi={canviaBancal} desactivat={!potTriar} />
        </GrupCamps>
        {potTriar ? null : <p>Fora de l’app no hi ha cap preferència de contrast a canviar.</p>}
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
