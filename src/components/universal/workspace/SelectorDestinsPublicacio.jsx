import { useEffect, useId, useRef, useState } from 'react';
import { Alerta, Boto, Fila } from '../../PedraSeca/index.js';
import { DESTINS_CATALEG, DESTINS_PRIVATS_CATALEG, destinsOferitsCataleg } from '../../../data/projeccionsCataleg.js';
import { textosCatalegWorkspace } from './textosCatalegWorkspace.js';
import { DESTINACIONS_WORKSPACE_WP } from '../../../data/importacio/destinacionsWorkspaceWp.js';

const COPY = {
  ca: ['On es publica?', 'Tria els destins d’esta referència. La fitxa original es conserva.', 'Mur', 'Mercat públic', 'Rebost privat', 'TPV Bar privat', 'Què dinem?', 'Herbari', 'Banc de Llavors', 'Desa els destins', 'Guardant…', 'Confirmació pública', 'Accepte publicar el títol, el subtítol i l’entradilla als destins públics triats.', 'Entra amb el teu compte per a publicar una referència.', 'Pendent de sincronitzar amb el servidor.', 'Destins confirmats pel servidor.', 'No s’ha pogut sincronitzar. La tria continua pendent.', 'No hi ha persistència disponible; mantín esta pàgina oberta fins a confirmar la sincronització.', 'No s’ha pogut desar la tria; revisa-la i torna-ho a provar.', 'Tria modificada; encara no s’ha desat.'],
  es: ['¿Dónde se publica?', 'Elige los destinos de esta referencia. La ficha original se conserva.', 'Muro', 'Mercado público', 'Despensa privada', 'TPV Bar privado', '¿Qué comemos?', 'Herbario', 'Banco de Semillas', 'Guarda los destinos', 'Guardando…', 'Confirmación pública', 'Acepto publicar el título, el subtítulo y la entradilla en los destinos públicos elegidos.', 'Entra con tu cuenta para publicar una referencia.', 'Pendiente de sincronizar con el servidor.', 'Destinos confirmados por el servidor.', 'No se ha podido sincronizar. La selección sigue pendiente.', 'No hay persistencia disponible; mantén esta página abierta hasta confirmar la sincronización.', 'No se ha podido guardar la selección; revísala e inténtalo de nuevo.', 'Selección modificada; todavía no se ha guardado.'],
  en: ['Where is it published?', 'Choose destinations for this reference. The original entry is preserved.', 'Wall', 'Public market', 'Private pantry', 'Private Bar POS', 'Recipes', 'Herbarium', 'Seed Bank', 'Save destinations', 'Saving…', 'Public confirmation', 'I agree to publish the title, subtitle and introduction to the selected public destinations.', 'Sign in to publish a reference.', 'Waiting to synchronize with the server.', 'Destinations confirmed by the server.', 'Synchronization failed. Your selection is still pending.', 'Persistent storage is unavailable; keep this page open until synchronization is confirmed.', 'Your selection could not be saved; review it and try again.', 'Selection changed; it has not been saved yet.'],
  eu: ['Non argitaratzen da?', 'Aukeratu erreferentziaren helmugak. Jatorrizko fitxa gordetzen da.', 'Horma', 'Azoka publikoa', 'Jakitegi pribatua', 'Tabernako TPV pribatua', 'Errezetak', 'Herbarioa', 'Hazien Bankua', 'Gorde helmugak', 'Gordetzen…', 'Baieztapen publikoa', 'Izenburua, azpititulua eta sarrera hautatutako helmuga publikoetan argitaratzea onartzen dut.', 'Hasi saioa erreferentzia argitaratzeko.', 'Zerbitzariarekin sinkronizatzeko zain.', 'Zerbitzariak helmugak baieztatu ditu.', 'Sinkronizazioak huts egin du. Hautaketa zain dago.', 'Ez dago biltegiratze iraunkorrik; mantendu orrialdea irekita sinkronizazioa baieztatu arte.', 'Ezin izan da hautaketa gorde; berrikusi eta saiatu berriro.', 'Hautaketa aldatu da; oraindik ez da gorde.'],
  gl: ['Onde se publica?', 'Escolle os destinos desta referencia. Consérvase a ficha orixinal.', 'Muro', 'Mercado público', 'Despensa privada', 'TPV Bar privado', 'Receitas', 'Herbario', 'Banco de Sementes', 'Garda os destinos', 'Gardando…', 'Confirmación pública', 'Acepto publicar o título, o subtítulo e a entrada nos destinos públicos escollidos.', 'Entra coa túa conta para publicar unha referencia.', 'Pendente de sincronizar co servidor.', 'Destinos confirmados polo servidor.', 'Non se puido sincronizar. A selección segue pendente.', 'Non hai persistencia dispoñible; mantén esta páxina aberta ata confirmar a sincronización.', 'Non se puido gardar a selección; revísaa e téntao de novo.', 'Selección modificada; aínda non se gardou.']
};

/* PRODUCCIO-01 (R15b) · Una altra pestanya del Mas té el bloqueig d'escriptura del magatzem (utils/magatzemLocal.js):
   esta és lectora i no pot desar. No és cap tria que calga revisar ni cap intent que calga repetir. */
const esAltraPestanya = problema => (problema?.codi ?? problema?.code) === 'NOMES_LECTURA';
const DESTINS_NOUS = Object.freeze({
  ca: ['Arbres emblemàtics i monumentals', 'Pàgines del fons documental'],
  es: ['Árboles emblemáticos y monumentales', 'Páginas del fondo documental'],
  en: ['Emblematic and monumental trees', 'Documentary collection pages'],
  eu: ['Zuhaitz enblematiko eta monumentalak', 'Dokumentu bildumako orrialdeak'],
  gl: ['Árbores emblemáticas e monumentais', 'Páxinas do fondo documental']
});

/** Explicit public consent, no network action on toggling a destination. */
export default function SelectorDestinsPublicacio({ font, inicials = [], desa, autoritzat, estat, error, persistent = true, language = 'ca' }) {
  const t = COPY[language] || COPY.ca;
  const { altraPestanya } = textosCatalegWorkspace(language);
  const [destins, setDestins] = useState(inicials);
  const dirty = useRef(false), viu = useRef(true);
  const inicialsKey = JSON.stringify(inicials);
  useEffect(() => { viu.current = true; return () => { viu.current = false; }; }, []);
  useEffect(() => { if (!dirty.current) setDestins(JSON.parse(inicialsKey)); }, [inicialsKey]);
  const [consentiment, setConsentiment] = useState(false);
  const [guardant, setGuardant] = useState(false);
  const [fallada, setFallada] = useState(null);
  const id = useId();
  const importacioWp = font?.font === 'importacio-wp';
  const nous = DESTINS_NOUS[language] || DESTINS_NOUS.ca;
  const etiquetaDesti = desti => desti === 'arbres-monumentals' ? nous[0] : desti === 'pagina' ? nous[1] : t[DESTINS_CATALEG.indexOf(desti) + 2];
  const publica = destins.some(desti => !DESTINS_PRIVATS_CATALEG.includes(desti));
  const envia = async () => {
    if (!autoritzat || guardant || (publica && !consentiment)) return;
    setGuardant(true); setFallada(null);
    try { await desa(font, destins); if (viu.current) dirty.current = false; }
    catch (problema) {
      if (viu.current) {
        if (problema?.desatLocal === true) dirty.current = false;
        setFallada(problema?.desatLocal === true ? 'pendent' : esAltraPestanya(problema) ? 'altra_pestanya' : 'no_desat');
      }
    }
    finally { if (viu.current) setGuardant(false); }
  };
  return <section className="sdp-cataleg-workspace__publicacio" aria-labelledby={id}>
    <h3 id={id}>{t[0]}</h3><p>{t[1]}</p>
    <fieldset disabled={!autoritzat || guardant}>
      <legend>{t[0]}</legend>
      {/* PRODNM-02 · Només els destins d'este build: sense l'app del Rebost o del Bar, cap casella
         que es desaria on cap superfície la mostra. L'etiqueta va per l'ordre de DESTINS_CATALEG. */}
      {destinsOferitsCataleg().filter(desti => !importacioWp || DESTINACIONS_WORKSPACE_WP.includes(desti)).map(desti => <label key={desti}>
        <input type="checkbox" checked={destins.includes(desti)} onChange={event => {
          dirty.current = true; setFallada(null);
          setDestins(actual => {
            if (!event.target.checked) return actual.filter(value => value !== desti);
            return importacioWp ? [desti] : [...actual, desti];
          });
          setConsentiment(false);
        }} />{etiquetaDesti(desti)}
      </label>)}
    </fieldset>
    {publica && autoritzat ? <label>
      <input type="checkbox" checked={consentiment} aria-label={t[11]} onChange={event => setConsentiment(event.target.checked)} />{t[12]}
    </label> : null}
    {!autoritzat ? <p>{t[13]}</p> : <Fila justify="center"><Boto disabled={guardant || (publica && !consentiment)} onClick={envia}>{guardant ? t[10] : t[9]}</Boto></Fila>}
    {!persistent && autoritzat ? <Alerta to="avis">{t[17]}</Alerta> : null}
    <p role="status">{guardant ? t[10] : fallada === 'altra_pestanya' ? altraPestanya : fallada === 'no_desat' ? t[18] : dirty.current && !guardant ? t[19] : fallada === 'pendent' || error ? t[16] : estat === 'confirmat' ? t[15] : estat === 'pendent' ? t[14] : ''}</p>
  </section>;
}
