/**
 * La Nevera de Casa · IDEA-258b (Onada R24) · Panell en línia de precomanda
 * per a la botiga local / de poble.
 *
 * S'allotja a l'espai `avis` de `LaCompra` (al costat de `ComparticioLlistaCompra`):
 *   · 100% primitives de Pedra Seca (`Alerta`, `AreaText`, `Boto`, `Botonera`,
 *     `Camp`, `CampText`, `GrupCamps`), zero estils inline i zero classes CSS noves.
 *   · 100% local i sense xarxa: cap petició automàtica ni enviament a servidors
 *     aliens; l'encàrrec es copia d'un toc al porta-retalls (amb camp de reserva
 *     manual si el navegador no ho permet), es comparteix amb el menú natiu del
 *     dispositiu (`navigator.share` quan és disponible), es descarrega en `.txt`
 *     o copia i obri `/xat` per enganxar-lo al comerç veí.
 *   · 5 llengües del sistema (`ca`, `es`, `en`, `eu`, `gl`) via `useClosaAplicacio().idioma`.
 */
import { useId, useMemo, useRef, useState } from 'react';
import { ClipboardCopy, Download, MessageSquare, Share2, Store } from 'lucide-react';
import { useNavigate } from '../../../app/contexts/RouterContext';
import { Alerta, AreaText, Boto, Botonera, Camp, CampText, GrupCamps } from '../../../components/PedraSeca/index.js';
import { useClosaAplicacio } from '../../plataforma/index.js';
import { creaEncarrecBotigaPoble, netejaNomLlistaEncarrec } from '../nucli/index.js';
import { useVistaNevera } from './context.js';

const TEXTOS = Object.freeze({
  ca: Object.freeze({
    botonera: 'Encàrrec per a la botiga local',
    obri: 'Prepara encàrrec per a la botiga local',
    tanca: 'Tanca l’encàrrec local',
    llegenda: (nom) => `Encàrrec per a la botiga local · «${nom}»`,
    comerc: 'Comerç, forn o cooperativa (opcional)',
    ajudaComerc: 'Ex.: Forn de llenya, Carnisseria de la plaça o Botiga de poble.',
    recollida: 'Recollida o indicació breu (opcional)',
    ajudaRecollida: 'Ex.: Passo demà a les 11 h o Guardeu-m’ho per al dijous.',
    signatura: 'De part de qui (opcional)',
    ajudaSignatura: 'Ex.: Maria · Cal Ximet.',
    previsualitzacio: 'Text de l’encàrrec ordenat per seccions',
    ajudaPrevisualitzacio: 'Cap marca de gran superfície no s’inclou a l’encàrrec. Pots copiar-lo i enviar-lo pel Xat, per missatgeria o portar-lo descarregat.',
    accions: 'Enviar o guardar l’encàrrec',
    copia: 'Copia l’encàrrec',
    compartix: 'Compartix al mòbil',
    obriXat: 'Copia i obri el Xat',
    descarrega: 'Descarrega .txt',
    buit: 'Afig almenys un article per comprar a la llista per a preparar l’encàrrec local.',
    copiat: (nom) => `Encàrrec de «${nom}» copiat al porta-retalls.`,
    compartit: (nom) => `Encàrrec de «${nom}» enviat al menú de compartir del dispositiu.`,
    descarregat: (nom) => `Fitxer de text de l’encàrrec «${nom}» descarregat.`,
    manual: 'Este navegador no ha permés copiar automàticament: selecciona el quadre de text de dalt i copia’l.',
    errorCompartir: 'No s’ha pogut obrir el menú de compartir del dispositiu. Pots copiar el text o descarregar el fitxer.'
  }),
  es: Object.freeze({
    botonera: 'Encargo para la tienda local',
    obri: 'Prepara encargo para la tienda local',
    tanca: 'Cierra el encargo local',
    llegenda: (nom) => `Encargo para la tienda local · «${nom}»`,
    comerc: 'Comercio, horno o cooperativa (opcional)',
    ajudaComerc: 'Ej.: Horno de leña, Carnicería de la plaza o Tienda de pueblo.',
    recollida: 'Recogida o indicación breve (opcional)',
    ajudaRecollida: 'Ej.: Paso mañana a las 11 h o Guardádmelo para el jueves.',
    signatura: 'De parte de quién (opcional)',
    ajudaSignatura: 'Ej.: María · Cal Ximet.',
    previsualitzacio: 'Texto del encargo ordenado por secciones',
    ajudaPrevisualitzacio: 'Ninguna marca de gran superficie se incluye en el encargo. Puedes copiarlo y enviarlo por el Chat, por mensajería o llevarlo descargado.',
    accions: 'Enviar o guardar el encargo',
    copia: 'Copia el encargo',
    compartix: 'Comparte en el móvil',
    obriXat: 'Copia y abre el Chat',
    descarrega: 'Descarga .txt',
    buit: 'Añade al menos un artículo pendiente en la lista para preparar el encargo local.',
    copiat: (nom) => `Encargo de «${nom}» copiado al portapapeles.`,
    compartit: (nom) => `Encargo de «${nom}» enviado al menú de compartir del dispositivo.`,
    descarregat: (nom) => `Archivo de texto del encargo «${nom}» descargado.`,
    manual: 'Este navegador no ha permitido copiar automáticamente: selecciona el cuadro de texto superior y cópialo.',
    errorCompartir: 'No se ha podido abrir el menú de compartir del dispositivo. Puedes copiar el texto o descargar el archivo.'
  }),
  en: Object.freeze({
    botonera: 'Pre-order for the local shop',
    obri: 'Prepare local shop pre-order',
    tanca: 'Close local pre-order',
    llegenda: (nom) => `Pre-order for the local shop · “${nom}”`,
    comerc: 'Shop, bakery or co-op (optional)',
    ajudaComerc: 'E.g.: Wood-fired bakery, Square butcher or Village shop.',
    recollida: 'Pickup window or short note (optional)',
    ajudaRecollida: 'E.g.: Picking up tomorrow at 11 am or Please hold until Thursday.',
    signatura: 'Ordered by (optional)',
    ajudaSignatura: 'E.g.: Maria · Cal Ximet.',
    previsualitzacio: 'Section-sorted pre-order text',
    ajudaPrevisualitzacio: 'No supermarket private-label brands are included. Copy it to paste into Chat, messaging apps, or download it as a text file.',
    accions: 'Send or save pre-order',
    copia: 'Copy pre-order',
    compartix: 'Share on device',
    obriXat: 'Copy and open Chat',
    descarrega: 'Download .txt',
    buit: 'Add at least one item to buy in this list to prepare a local pre-order.',
    copiat: (nom) => `Pre-order for “${nom}” copied to clipboard.`,
    compartit: (nom) => `Pre-order for “${nom}” sent to your device share sheet.`,
    descarregat: (nom) => `Text file for pre-order “${nom}” downloaded.`,
    manual: 'This browser blocked automatic copy: select the text box above and copy it manually.',
    errorCompartir: 'Could not open the device share sheet. You can copy the text or download the file instead.'
  }),
  eu: Object.freeze({
    botonera: 'Herriko dendarako enkargua',
    obri: 'Prestatu herriko dendarako enkargua',
    tanca: 'Itxi tokiko enkargua',
    llegenda: (nom) => `Herriko dendarako enkargua · «${nom}»`,
    comerc: 'Saltokia, okindegia edo kooperatiba (aukerakoa)',
    ajudaComerc: 'Adib.: Egur-labea, Plazako harategia edo Herriko denda.',
    recollida: 'Bilketa edo ohar laburra (aukerakoa)',
    ajudaRecollida: 'Adib.: Bihar 11:00etan pasatuko naiz edo Gorde ostegunerako.',
    signatura: 'Noren partetik (aukerakoa)',
    ajudaSignatura: 'Adib.: Maria · Cal Ximet.',
    previsualitzacio: 'Atalka ordenatutako enkarguaren testua',
    ajudaPrevisualitzacio: 'Azalera handiko marka zuririk ez da sartzen enkarguan. Kopiatu eta Txatetik edo mezularitzatik bidali dezakezu, edo fitxategian deskargatu.',
    accions: 'Bidali edo gorde enkargua',
    copia: 'Kopiatu enkargua',
    compartix: 'Partekatu gailuan',
    obriXat: 'Kopiatu eta ireki Txata',
    descarrega: 'Deskargatu .txt',
    buit: 'Gehitu gutxienez erosteko artikulu bat zerrendan tokiko enkargua prestatzeko.',
    copiat: (nom) => `«${nom}» zerrendako enkargua arbelean kopiatu da.`,
    compartit: (nom) => `«${nom}» zerrendako enkargua gailuko partekatze-menura bidali da.`,
    descarregat: (nom) => `«${nom}» enkarguaren testu-fitxategia deskargatu da.`,
    manual: 'Nabigatzaile honek ez du automatikoki kopiatzen utzi: hautatu goiko testu-koadroa eta kopiatu eskuz.',
    errorCompartir: 'Ezin izan da gailuko partekatze-menua ireki. Testua kopiatu edo fitxategia deskargatu dezakezu.'
  }),
  gl: Object.freeze({
    botonera: 'Encargo para a tenda local',
    obri: 'Prepara encargo para a tenda local',
    tanca: 'Pecha o encargo local',
    llegenda: (nom) => `Encargo para a tenda local · «${nom}»`,
    comerc: 'Comercio, forno ou cooperativa (opcional)',
    ajudaComerc: 'Ex.: Forno de leña, Carnizaría da praza ou Tenda da vila.',
    recollida: 'Recollida ou indicación breve (opcional)',
    ajudaRecollida: 'Ex.: Paso mañá ás 11 h ou Gardádemo para o xoves.',
    signatura: 'De parte de quen (opcional)',
    ajudaSignatura: 'Ex.: María · Cal Ximet.',
    previsualitzacio: 'Texto do encargo ordenado por seccións',
    ajudaPrevisualitzacio: 'Ningunha marca de gran superficie se inclúe no encargo. Podes copialo e envialo polo Chat, por mensaxaría ou levalo descargado.',
    accions: 'Enviar ou gardar o encargo',
    copia: 'Copia o encargo',
    compartix: 'Comparte no móbil',
    obriXat: 'Copia e abre o Chat',
    descarrega: 'Descarga .txt',
    buit: 'Engade polo menos un artigo pendente na lista para preparar o encargo local.',
    copiat: (nom) => `Encargo de «${nom}» copiado no portapapeis.`,
    compartit: (nom) => `Encargo de «${nom}» enviado ao menú de compartir do dispositivo.`,
    descarregat: (nom) => `Ficheiro de texto do encargo «${nom}» descargado.`,
    manual: 'Este navegador non permitiu copiar automaticamente: selecciona a caixa de texto superior e cópiaa.',
    errorCompartir: 'Non se puido abrir o menú de compartir do dispositivo. Podes copiar o texto ou descargar o ficheiro.'
  })
});

function potCompartirNatiu() {
  return typeof globalThis.navigator?.share === 'function';
}

export function EncarrecBotigaPoble({ llista }) {
  const { estat, descarrega } = useVistaNevera();
  const { idioma } = useClosaAplicacio();
  const navigate = useNavigate();

  const llengua = Object.hasOwn(TEXTOS, idioma) ? idioma : 'ca';
  const textos = TEXTOS[llengua];

  const idPanell = useId();
  const [obert, setObert] = useState(false);
  const [comerc, setComerc] = useState('');
  const [recollida, setRecollida] = useState('');
  const [signatura, setSignatura] = useState('');
  const [avis, setAvis] = useState(null);
  const [errorAvis, setErrorAvis] = useState(null);
  const [compartint, setCompartint] = useState(false);
  const accioEnVolRef = useRef(false);

  const nomVisible = netejaNomLlistaEncarrec(llista.nom, llengua);
  const encarrec = useMemo(
    () => creaEncarrecBotigaPoble(estat, llista.id, {
      idioma: llengua,
      comerc,
      recollida,
      signatura
    }),
    [estat, llista.id, llengua, comerc, recollida, signatura]
  );

  const buida = !encarrec.ok;
  const compartibleNatiu = potCompartirNatiu();

  const copiaAlPortaRetalls = async () => {
    if (buida) return false;
    setErrorAvis(null);
    try {
      if (typeof globalThis.navigator?.clipboard?.writeText !== 'function') {
        throw new Error('Clipboard no disponible');
      }
      await globalThis.navigator.clipboard.writeText(encarrec.text);
      setAvis(textos.copiat(nomVisible));
      return true;
    } catch {
      setAvis(null);
      setErrorAvis(textos.manual);
      return false;
    }
  };

  const compartixAlDispositiu = async () => {
    if (buida || !compartibleNatiu || accioEnVolRef.current) return;
    accioEnVolRef.current = true;
    setCompartint(true);
    setErrorAvis(null);
    try {
      await globalThis.navigator.share({
        title: textos.llegenda(nomVisible),
        text: encarrec.text
      });
      setAvis(textos.compartit(nomVisible));
    } catch (err) {
      if (err?.name === 'AbortError') return;
      setAvis(null);
      setErrorAvis(textos.errorCompartir);
    } finally {
      accioEnVolRef.current = false;
      setCompartint(false);
    }
  };

  /* CODEX-R24-D1-04 (Onada R24.2) · Només es deixa la Nevera quan el text ja
     és al porta-retalls: si la còpia falla, la persona continua ací amb
     l'encàrrec al quadre i l'avís de còpia manual, i no el perd en el Xat. */
  const copiaIObriXat = async () => {
    if (buida || accioEnVolRef.current) return;
    accioEnVolRef.current = true;
    try {
      const copiat = await copiaAlPortaRetalls();
      if (copiat === true) navigate('/xat');
    } finally {
      accioEnVolRef.current = false;
    }
  };

  const descarregaTxt = () => {
    if (buida) return;
    setErrorAvis(null);
    descarrega({
      nom: `encarrec-${llista.id}.txt`,
      tipus: 'text/plain;charset=utf-8',
      dades: `${encarrec.text}\n`
    });
    setAvis(textos.descarregat(nomVisible));
  };

  return (
    <>
      <Botonera etiqueta={textos.botonera}>
        <Boto
          icona={Store}
          aria-expanded={obert}
          aria-controls={obert ? idPanell : undefined}
          onClick={() => {
            setObert((actual) => !actual);
            setAvis(null);
            setErrorAvis(null);
          }}
        >
          {obert ? textos.tanca : textos.obri}
        </Boto>
      </Botonera>
      {obert ? (
        <div id={idPanell}>
          <GrupCamps llegenda={textos.llegenda(nomVisible)}>
          {buida ? (
            <p>{textos.buit}</p>
          ) : (
            <>
              <Camp etiqueta={textos.comerc} ajuda={textos.ajudaComerc}>
                <CampText
                  value={comerc}
                  autoComplete="off"
                  onChange={(event) => {
                    setComerc(event.target.value);
                    setAvis(null);
                    setErrorAvis(null);
                  }}
                />
              </Camp>
              <Camp etiqueta={textos.recollida} ajuda={textos.ajudaRecollida}>
                <CampText
                  value={recollida}
                  autoComplete="off"
                  onChange={(event) => {
                    setRecollida(event.target.value);
                    setAvis(null);
                    setErrorAvis(null);
                  }}
                />
              </Camp>
              <Camp etiqueta={textos.signatura} ajuda={textos.ajudaSignatura}>
                <CampText
                  value={signatura}
                  autoComplete="off"
                  onChange={(event) => {
                    setSignatura(event.target.value);
                    setAvis(null);
                    setErrorAvis(null);
                  }}
                />
              </Camp>
              <Camp etiqueta={textos.previsualitzacio} ajuda={textos.ajudaPrevisualitzacio}>
                <AreaText
                  files={8}
                  value={encarrec.text}
                  readOnly
                  onFocus={(event) => event.target.select()}
                />
              </Camp>
              <Botonera etiqueta={textos.accions}>
                <Boto varietat="primari" icona={ClipboardCopy} onClick={copiaAlPortaRetalls}>
                  {textos.copia}
                </Boto>
                {compartibleNatiu ? (
                  <Boto icona={Share2} carregant={compartint} disabled={compartint} onClick={compartixAlDispositiu}>
                    {textos.compartix}
                  </Boto>
                ) : null}
                <Boto icona={MessageSquare} disabled={compartint} onClick={copiaIObriXat}>
                  {textos.obriXat}
                </Boto>
                <Boto icona={Download} onClick={descarregaTxt}>
                  {textos.descarrega}
                </Boto>
              </Botonera>
            </>
          )}
          {errorAvis ? <Alerta to="avis">{errorAvis}</Alerta> : null}
          </GrupCamps>
        </div>
      ) : null}
      {avis ? <p role="status">{avis}</p> : null}
    </>
  );
}
