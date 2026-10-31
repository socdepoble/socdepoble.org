import { useState } from 'react';
import { Folder, Inbox, Settings } from 'lucide-react';
import { Especimen } from '../Especimen.jsx';
import AppGridColumn from '../../../../components/layout/AppGridColumn.jsx';
import { Llinatge } from '../Llinatge.jsx';

/* T52 (ordre del Mestre, 260928) · Les variants REALS de la capçalera de
   columna, tal com les munta UniversalWorkspace: dins d'un aside
   .sdp-workspace-column, perquè hereten els mateixos colors de fila 1 i fila 2
   que al gestor. Cada mostra té el seu marc (el carril, 56px × 16rem).
   Esmena D8 de la revisió de T52a · dins del workspace el color el decidix la
   posició (modules.css: la capçalera que en seguix una altra és la fila 2),
   no esDark; i una acció 'text' sense onAcciona es queda activa. */

const RODA = Object.freeze([
  { id: 'settings', etiqueta: 'Configuració de l’espai de treball', icona: Settings },
]);

function Marc({ modificador, etiqueta, children }) {
  return (
    <div className={modificador === 'carril' ? 'sdp-especimen__mostra sdp-especimen__mostra--carril' : 'sdp-especimen__mostra sdp-especimen__mostra--columna'}>
      <aside className="sdp-workspace-column" aria-label={etiqueta}>{children}</aside>
    </div>
  );
}

export default function EspecimenColumnes() {
  const [avis, setAvis] = useState('Prem una acció de les capçaleres.');
  const [tot, setTot] = useState(true);
  const [grupObert, setGrupObert] = useState(true);
  const avisa = (text) => () => setAvis(text);
  const roda = RODA.map((accio) => ({ ...accio, onAcciona: avisa('Roda dentada: obriria els presets d’amplada.') }));
  return (
    <>
      <Llinatge id="columna" />
      <Especimen id="columnes" nom="AppGridColumn · la capçalera de columna" fitxer="src/components/layout/AppGridColumn.jsx"
        descripcio="Una sola capçalera per a totes les columnes del gestor. Fila 1: títol i replegar. Fila 2: Tot, lupa, Crear i la roda dentada. Dins d’un gestor (.sdp-workspace, com esta pàgina), el color el decidix la posició: la primera capçalera de la columna és la fila 1 i la que la seguix, la fila 2. Replegada, la columna es queda en un carril de 56px amb el botó d’expandir a dalt i les accions davall, alineades amb la barra lateral."
        contracte={[
          ['titol / icona', 'string / Component', '—', 'El nom de la columna i la seua icona.'],
          ['startActions / endActions', '{ id, etiqueta, label?, icona, variant?, onAcciona, desactivat?, pressed? }[]', '[]', "variant 'text' pinta icona i text; 'primary', el botó ple (Crear); sense variant, un botó d’icona de 44px. Sense onAcciona, desactivat, llevat de la variant 'text', que es queda activa (només desactivat la desactiva)."],
          ['accions', 'igual que endActions', '[]', 'Àlies antic d’endActions (només si endActions és buit).'],
          ['onReplega / etiquetaReplega', '() => void / string', 'null', 'Afig el botó de replegar (només en escriptori) o, plegada, el d’expandir.'],
          ['replegaTotaCapcalera', 'boolean', 'false', 'Si només hi ha l’acció de replegar, tota la fila és el botó. Només l’usa el Xat: als espais de treball pleguen la icona de l’esquerra i el [|<], el títol és fix i l’acordió porta la paraula i el chevron apegat (ordre d’usabilitat del Mestre, 30-10-2026).'],
          ['plegable / obert / onPlega', 'boolean / boolean / () => void', 'false / true / null', 'El títol és un botó que plega el grup de navegació (aria-expanded i fletxa).'],
          ['variant', "'collapsed' | 'accordion' | null", 'null', "'collapsed': el carril. 'accordion' només afig una classe i ara no la fa servir cap secció."],
          ['esDark', "true | 'intens' | false", 'false', "Fora d’un .sdp-workspace, el to de la capçalera: 'intens' és el més fosc (--sdp-crom-subcapcalera-fosca). Dins, mana la posició: la primera capçalera pren --sdp-workspace-fila1-fons i la següent, --sdp-workspace-fila2-fons, siga quin siga esDark."],
          ['controls / collapseBtnRef / expandBtnRef', 'string / ref / ref', '—', 'aria-controls de la columna i refs per a tornar el focus en plegar i desplegar.'],
          ['children', 'node', '—', 'Plegada: el carril d’icones (CategoryRail). Oberta: accions extra.'],
        ]}
        a11y={[
          'Cap botó dins d’un altre: amb accions independents, els botons són germans; la fila sencera només és botó quan no n’hi ha cap altre.',
          'Les icones són decoratives (aria-hidden); cada botó porta aria-label i title.',
          'El títol no porta aria-current: no és un element de navegació seleccionat.'
        ]}
        fes={['Els noms de columna en majúscules i reals (CARPETES, COMPONENTS).', 'Al carril, cada acció en una cel·la de var(--sdp-touch), centrada.']}
        noFacis={['Copiar el DOM de la capçalera a mà.', 'Fons crema o blancs amb icones negres: les icones van sobre el gris, en blanc.']}>
        <h4>Oberta: fila 1 amb replegar i fila 2 (la capçalera que la seguix) amb Tot i roda</h4>
        <Marc modificador="columna" etiqueta="Columna oberta de mostra">
          <AppGridColumn esDark titol="CARPETES" icona={Folder} onReplega={avisa('Replegar: la columna passaria a carril.')} />
          <AppGridColumn esDark="intens"
            startActions={[{ id: 'all', etiqueta: 'Tot', label: 'Tot', icona: Inbox, variant: 'text', onAcciona: () => setTot((v) => !v), pressed: tot }]}
            endActions={roda} />
        </Marc>
        <h4>Replegable sencera (una sola acció)</h4>
        <Marc modificador="columna" etiqueta="Columna replegable de mostra">
          <AppGridColumn esDark titol="COMPONENTS" icona={Folder} replegaTotaCapcalera onReplega={avisa('Tota la fila replega la columna: així només ho fa el Xat.')} />
        </Marc>
        <h4>Plegable: el títol plega el grup</h4>
        <Marc modificador="columna" etiqueta="Columna amb grup plegable de mostra">
          <AppGridColumn esDark titol="CARPETES" icona={Folder} plegable obert={grupObert} onPlega={() => setGrupObert((v) => !v)} />
        </Marc>
        <h4>Carril plegat</h4>
        <Marc modificador="carril" etiqueta="Carril plegat de mostra">
          <AppGridColumn variant="collapsed" esDark titol="CARPETES" endActions={roda} onReplega={avisa('Expandir: la columna tornaria a obrir-se.')} />
        </Marc>
        <p role="status">{avis}</p>
      </Especimen>
    </>
  );
}
