/**
 * useDestiDelPlugin.js — P7-A · Onada 4, setena passada · On porta, ARA i
 * ACÍ, el botó «Obrir» d'un plugin (registrePlugins.js).
 *
 *   { estat: 'obert', ruta, motiu: null }       · hi ha destí i es pot obrir;
 *   { estat: 'en-obres', ruta: null, motiu: null } · el registre no en té (obrir null);
 *   { estat: 'no-disponible', ruta: null, motiu } · és una app de la plataforma
 *       que este node, este build o esta persona no deixen obrir: el motiu és
 *       el de la plataforma (interruptors.js) i el text, textDelMotiu
 *       (PortalApps.jsx), el mateix que llig el portal /app.
 *
 * Una ruta que no és d'una app no passa per cap interruptor d'app: la seua
 * barrera, si en té, és la de la ruta a App.jsx. Però si el registre marca el
 * plugin amb entorn 'desenvolupament' (revisió P7-A: hui, la Gestoria), fora
 * de desenvolupament és 'no-disponible' amb el motiu de la plataforma
 * 'entorn-desenvolupament'. Cap enllaç mort: el que no es pot obrir no fa
 * enllaç. La Consola ja no és al registre (Onada 8) ni passa per ací: el seu
 * botó és el de la pàgina (systemPages.js, OBRIR_CONSOLA), i /consola/* és
 * pública en qualsevol entorn (ordre del Mestre 30-10-2026, T2.2).
 *
 * portaDelPlugin(plugin, desti, t) fa, d'eixe destí, la porta «Obrir» de
 * PortesTargeta (PortaDePagina a la pàgina; la graella del Control la pot
 * reutilitzar) i l'avís en text. Una sola manera de dir-ho.
 *
 * Gauntlet 261022_0225 (F7) · El motiu passa pel traductor (textDelMotiu amb
 * `t`): l'avís i el toast parlen la llengua de la persona. Una app de la
 * plataforma 'no-disponible' ja no pinta la porta inerta a la pàgina
 * (PluginPage.jsx, EinaNoDisponible); la porta continua per a qui la
 * reutilitze i per a les eines en obres.
 */
import { useAppAvaluada, useContextApps } from '../../apps/plataforma/PlataformaContext.jsx';
import { textDelMotiu } from '../../apps/plataforma/PortalApps.jsx';
import { appDelPlugin } from './registrePlugins.js';

/* Les claus i els textos de reserva (valencià). Les de la porta inerta són
   les de les portes del Panell (destinsControl.js): el mateix nom accessible
   i el mateix avís. */
export const TEXTOS_OBRIR = Object.freeze({
  enObres: Object.freeze(['section.plugin.enObres', 'Esta eina encara està en obres.']),
  sufixEnObres: Object.freeze(['section.control.porta.enObres', '(en obres)']),
  avisEnObres: Object.freeze(['section.control.porta.avis', '“{nom}” encara està en obres.']),
  sufixNoDisponible: Object.freeze(['section.plugin.noDisponible', '(no disponible ací)'])
});

const EN_OBRES = Object.freeze({ estat: 'en-obres', ruta: null, motiu: null });
const noDisponible = (motiu) => Object.freeze({ estat: 'no-disponible', ruta: null, motiu });
const obert = (ruta) => Object.freeze({ estat: 'obert', ruta, motiu: null });

/** El destí del botó «Obrir» d'un plugin, amb els interruptors de la plataforma. */
export function useDestiDelPlugin(plugin) {
  const idApp = appDelPlugin(plugin);
  // El hook es crida sempre (regles dels hooks); sense app, null.
  const app = useAppAvaluada(idApp);
  // El mateix «producció» que els interruptors (import.meta.env.DEV, o l'entorn fixat a les proves).
  const { produccio } = useContextApps();
  if (!plugin || typeof plugin.obrir !== 'string' || !plugin.obrir) return EN_OBRES;
  if (plugin.entorn === 'desenvolupament' && produccio !== false) return noDisponible('entorn-desenvolupament');
  if (!idApp) return obert(plugin.obrir);
  // El registre de la plataforma no la coneix (manifest invàlid o retirat): el node no la porta.
  if (!app) return noDisponible('no-compilada');
  if (app.estat !== 'available') return noDisponible(app.motiu);
  return obert(plugin.obrir);
}

/**
 * La porta «Obrir» d'un plugin per a PortesTargeta i l'avís en text (null si
 * es pot obrir). `t(clau, reserva)` és el traductor de la UI.
 * @returns {{ avis: string|null, porta: { id, verb, nom, desti, varietat, enObres?, avis? } }}
 */
export function portaDelPlugin(plugin, desti, t) {
  const tr = ([clau, reserva]) => t(clau, reserva);
  const nom = plugin.etiquetaObrir;
  const base = { id: 'obrir', verb: nom, nom, varietat: 'primari' };
  if (desti?.ruta) return { avis: null, porta: { ...base, desti: desti.ruta } };
  if (desti?.estat === 'no-disponible') {
    const motiu = textDelMotiu(desti.motiu, t) || tr(TEXTOS_OBRIR.enObres);
    return { avis: motiu, porta: { ...base, desti: null, enObres: tr(TEXTOS_OBRIR.sufixNoDisponible), avis: motiu } };
  }
  return {
    avis: tr(TEXTOS_OBRIR.enObres),
    porta: {
      ...base,
      desti: null,
      enObres: tr(TEXTOS_OBRIR.sufixEnObres),
      avis: tr(TEXTOS_OBRIR.avisEnObres).replace('{nom}', () => nom)
    }
  };
}
