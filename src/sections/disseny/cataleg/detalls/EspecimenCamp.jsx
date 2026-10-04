import { Especimen } from '../Especimen.jsx';
import { Camp, CampFitxer, CampText, AreaText, Selector, ControlContrasenya } from '../../../../components/PedraSeca/index.js';

export default function EspecimenCamp() {
  return (
    <Especimen id="camp" nom="Camp · CampText · AreaText · Selector · ControlContrasenya" fitxer="src/components/PedraSeca/organismes/formulari.jsx"
        descripcio={'Contenidor de camp amb etiqueta, ajuda i error. El control de dins (CampText, AreaText o Selector) hereta id, aria-describedby, aria-invalid i required. CampFitxer (i CampText tipus="file", que hi delega) no hereta required: porta aria-required i una validesa pròpia segons els fitxers triats.'}
        contracte={[           ['etiqueta', 'node', '—', 'Obligatòria i sempre visible.'],           ['ajuda', 'node', 'null', 'Instrucció curta abans del control.'],           ['error', 'string', 'null', 'Què passa i com arreglar-ho. Activa aria-invalid.'],           ['obligatori', 'boolean', 'false', 'Escriu «(obligatori)» en text, no només un asterisc.'],           ['CampText.tipus', "'text'|'email'|'tel'|'number'|'search'|'password'|'date'", "'text'", 'Tipus natiu: el mòbil mostra el teclat bo.'],           ['Selector.opcions', '{ valor, etiqueta, desactivat? }[]', '[]', 'Opcions del <select> natiu.'],
          ['ControlContrasenya', 'props d’<input>', '—', 'atoms/ControlContrasenya.jsx. Contrasenya amb ull; l’etiqueta la posa qui l’usa amb htmlFor = id.'],
          ['ControlContrasenya.etiquetaUll', 'string', "'Mostra la contrasenya'", 'Nom fix de l’ull. Amb dos camps, un nom distint per a cadascun.'],
          ['CampFitxer', 'accept · multiple · webkitdirectory · disabled · onChange · onInvalid', '—', 'D-D (261004). Selector de fitxers: Boto secundari amb icona i línia d’estat en valencià. CampText tipus="file" hi delega. El nom del botó du l’etiqueta del Camp. El fitxer no viatja en un enviament natiu de <form>: es llig des d’onChange.'],
          ['CampFitxer dins de Camp obligatori', 'boolean', 'false', 'Cap required natiu (value es buida a cada canvi): aria-required i una validesa pròpia segons els fitxers triats. Sense fitxers, el missatge del Camp i aria-invalid, sense bombolla; el focus va al botó només en enviar i si és el primer control invàlid del formulari.'],
          ['CampFitxer.textBoto', 'string', "'Triar fitxer'", '«Triar fitxers» amb multiple i «Triar carpeta» amb webkitdirectory.'],
        ]}
        a11y={['CampText, AreaText i Selector: label[for] ↔ input[id] garantit per construcció.', 'L’error s’anuncia per aria-describedby; porta icona i text, no només roig.', 'CampText, AreaText o Selector fora de <Camp> llancen un error en desenvolupament.', 'L’ull de ControlContrasenya: nom fix, estat a aria-pressed, aria-controls al camp i el clic no li roba el focus.']}
        fes={['Validar en enviar, no a cada tecla.', 'Usar autoComplete i inputMode.', 'Contrasenya: ControlContrasenya amb autoComplete new-password o current-password; dins d’un <form>, en enviar torna a ocultar-se sola.']}
        noFacis={['Placeholder com a etiqueta.', 'Errors genèrics («Camp invàlid»).', 'Canviar el nom de l’ull segons l’estat: ja ho diu aria-pressed.', 'Posar ControlContrasenya dins de <Camp>: no en llig el context i l’etiqueta queda òrfena. Etiqueta pròpia amb htmlFor = id, com a l’espècimen.']}>
        <Camp etiqueta="Nom del poble" ajuda="Tal com l’escriu l’Ajuntament."><CampText placeholder="La Torre de les Maçanes" /></Camp>
        <Camp etiqueta="Telèfon" error="Falta un dígit: han de ser 9."><CampText tipus="tel" defaultValue="96 555 12" /></Camp>
        <Camp etiqueta="Província" obligatori><Selector opcions={[{ valor: 'a', etiqueta: 'Alacant' }, { valor: 'v', etiqueta: 'València' }, { valor: 'c', etiqueta: 'Castelló' }]} /></Camp>
        <Camp etiqueta="Descripció"><AreaText placeholder="Una breu descripció…" /></Camp>
        <Camp etiqueta="Camp desactivat"><CampText defaultValue="No editable" disabled /></Camp>
        <Camp etiqueta="Còpia de seguretat (JSON)" ajuda="Un o més fitxers .json."><CampFitxer accept=".json,application/json" multiple /></Camp>
        <div className="sdp-camp">
          <label className="sdp-camp__etiqueta" htmlFor="especimen-contrasenya">Contrasenya</label>
          <ControlContrasenya id="especimen-contrasenya" name="especimen-contrasenya" autoComplete="new-password" defaultValue="text-de-prova" />
        </div>
    </Especimen>
  );
}
