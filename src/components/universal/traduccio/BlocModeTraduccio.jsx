/**
 * BlocModeTraduccio.jsx — R51 (P0-46 / IDEA-177), fase A · El selector del
 * mode de traducció d'una nota, dins de l'«Edició avançada» del Bloc de Notes
 * (NotesEditor, ranura revisioEdicioAvancada).
 *
 *  · Tres modes (el contracte, translationMode.js): «Traducció automàtica
 *    quan cal», «Revisada en les 5 llengües» i «Sense traducció». La revisada
 *    es veu però no es pot triar fins que les cinc traduccions estan
 *    revisades («{n} de 5 revisades»): preparar-les no l'activa.
 *  · La llengua original, explícita (ca, es, en, eu, gl): mai s'endevina.
 *  · Només qui ha escrit la nota, o la superadministració sobre una
 *    publicació d'altri (PublicacioEditable · motiuPublicacioDAltri), la pot
 *    canviar. Qualsevol altra persona la veu desactivada, amb el motiu. Un
 *    control desactivat no és cap autorització: el servidor haurà de mirar-ho
 *    quan hi haja camí (fase B).
 *  · R51V-02 · L'esborrany es guarda en este dispositiu
 *    (modesTraduccioLocals.js) i viatja amb la publicació en publicar-la o
 *    actualitzar-la al Mur (NotesEditor · ambModeTraduccio → NotesContext ·
 *    publishNote, al payload). Sense esborrany en este dispositiu, el selector
 *    parteix del que ja porta la publicació (`publicat`). Una revisió
 *    editorial (la llavor, un acte) no el pot portar (`viatja` false): es
 *    queda en este dispositiu, i el text ho diu. Si no es pot guardar, el
 *    canvi es queda a la pantalla i ho avisa.
 * Cap estil propi: GrupCamps, GrupOpcions, Camp, Selector i Alerta.
 */
import { useState } from 'react';
import { GrupCamps, GrupOpcions, Camp, Selector } from '../../PedraSeca/organismes/formulari.jsx';
import { Alerta } from '../../PedraSeca/molecules/Alerta.jsx';
import { tradueix, useTraductorOpcional } from '../../PedraSeca/hooks/useTraductorOpcional.js';
import { omple } from '../../../config/moderacio.js';
import { SUPPORTED_LANGUAGES } from '../../../config/i18n.js';
import { TRANSLATION_LANGUAGES } from './translationMode.js';
import { desaModeTraduccio, llegeixModeTraduccio, modeDeLaPublicacio } from './modesTraduccioLocals.js';

const TEXTOS_MODE_TRADUCCIO = Object.freeze({
  titol: Object.freeze(["editor.traduccio.titol", "Traducció"]),
  mode: Object.freeze(["editor.traduccio.mode", "Com es traduïx"]),
  automatica: Object.freeze(["editor.traduccio.automatica", "Traducció automàtica quan cal"]),
  revisada: Object.freeze(["editor.traduccio.revisada", "Revisada en les 5 llengües"]),
  cap: Object.freeze(["editor.traduccio.cap", "Sense traducció"]),
  revisades: Object.freeze(["editor.traduccio.revisades", "{n} de 5 revisades"]),
  calenRevisades: Object.freeze(["editor.traduccio.calenRevisades", "Calen les 5 traduccions revisades."]),
  original: Object.freeze(["editor.traduccio.original", "Llengua original"]),
  dispositiu: Object.freeze(["editor.traduccio.dispositiu", "Es guarda en este dispositiu i viatja amb la publicació quan la publiques o l’actualitzes al Mur."]),
  nomesDispositiu: Object.freeze(["editor.traduccio.nomesDispositiu", "Esta peça és de l’arxiu editorial: el mode de traducció només es guarda en este dispositiu, perquè la revisió editorial encara no el pot portar."]),
  senseDret: Object.freeze(["editor.traduccio.senseDret", "Només qui l’ha escrita, o la persona superadministradora en una publicació d’altri, pot canviar la traducció."]),
  noDesat: Object.freeze(["editor.traduccio.noDesat", "No s’ha pogut guardar en este dispositiu: el canvi es queda només en esta pantalla."])
});

const nomDeLaLlengua = (codi) => SUPPORTED_LANGUAGES.find((llengua) => llengua.code === codi)?.name || codi;

export function BlocModeTraduccio({ id, llenguaInicial = 'ca', potEditar = false, motiu = null, revisades = 0, publicat = null, viatja = true }) {
  const t = useTraductorOpcional();
  const inicial = () => llegeixModeTraduccio(id) ?? modeDeLaPublicacio(publicat) ?? {
    translation_mode: 'on_the_fly',
    source_language: TRANSLATION_LANGUAGES.includes(llenguaInicial) ? llenguaInicial : 'ca'
  };
  const [estat, setEstat] = useState(() => ({ id, valor: inicial(), noDesat: false }));
  /* Una altra nota torna a partir de la seua (ajust durant el render). */
  if (estat.id !== id) setEstat({ id, valor: inicial(), noDesat: false });
  const { valor, noDesat } = estat.id === id ? estat : { valor: inicial(), noDesat: false };

  const canvia = (canvis) => {
    if (!potEditar) return;
    const seguent = { ...valor, ...canvis };
    setEstat({ id, valor: seguent, noDesat: !desaModeTraduccio(id, seguent) });
  };
  const nRevisades = Math.max(0, Math.min(5, Number.isInteger(revisades) ? revisades : 0));
  const estatRevisio = omple(tradueix(t, TEXTOS_MODE_TRADUCCIO.revisades), { n: nRevisades });
  const opcions = [
    { valor: 'on_the_fly', etiqueta: tradueix(t, TEXTOS_MODE_TRADUCCIO.automatica) },
    {
      valor: 'curated_5_langs', etiqueta: tradueix(t, TEXTOS_MODE_TRADUCCIO.revisada),
      ajuda: nRevisades === 5 ? estatRevisio : `${estatRevisio}. ${tradueix(t, TEXTOS_MODE_TRADUCCIO.calenRevisades)}`,
      desactivada: nRevisades !== 5
    },
    { valor: 'none', etiqueta: tradueix(t, TEXTOS_MODE_TRADUCCIO.cap) }
  ];

  return (
    <GrupCamps llegenda={tradueix(t, TEXTOS_MODE_TRADUCCIO.titol)}>
      <GrupOpcions llegenda={tradueix(t, TEXTOS_MODE_TRADUCCIO.mode)} opcions={opcions} valor={valor.translation_mode}
        onCanvi={(translation_mode) => canvia({ translation_mode })} disabled={!potEditar} />
      <Camp etiqueta={tradueix(t, TEXTOS_MODE_TRADUCCIO.original)}>
        <Selector value={valor.source_language} disabled={!potEditar}
          opcions={TRANSLATION_LANGUAGES.map((codi) => ({ valor: codi, etiqueta: nomDeLaLlengua(codi) }))}
          onChange={(event) => canvia({ source_language: event.target.value })} />
      </Camp>
      {potEditar ? null : <Alerta to="avis" viva={false}>{motiu || tradueix(t, TEXTOS_MODE_TRADUCCIO.senseDret)}</Alerta>}
      {noDesat ? <Alerta to="error">{tradueix(t, TEXTOS_MODE_TRADUCCIO.noDesat)}</Alerta> : null}
      <Alerta to="info" viva={false}>{tradueix(t, viatja ? TEXTOS_MODE_TRADUCCIO.dispositiu : TEXTOS_MODE_TRADUCCIO.nomesDispositiu)}</Alerta>
    </GrupCamps>
  );
}

export default BlocModeTraduccio;
