import { resolveAsset } from '../../../config/assetResolver.js';

export function Aplec2023Article() {
  return (
    <article className="detail-content" >
      <div className="media-frame detail-content__figura">
        <img src={resolveAsset('/assets/events/aplec_2023_ponents.png')} alt="Cartell Ponents Aplec" />
      </div>

      <p className="detail-content__paragraph">
        El proper diumenge 29 de gener, a Benillup, a les 11 del matí les associacions Coordinadora d’Estudis Eòlics del Comtat i Rentonar han organitzat un Aplec pel territori motivat per l’incendi d’aquest estiu, però per a intentar tractar temes de més calat com són el despoblament rural i l’abandonament agrícola.
      </p>
      
      <h3 className="detail-content__titol">El format de l’Aplec és innovador</h3>
      <p className="detail-content__paragraph">
        No volem que facen discursos els ponents convidats sinó que escolten preguntes, inquietuds i suggeriments que la gent dels pobles els vulga formular. Només Enric Moltó, geògraf i climatòleg, farà una intervenció de 30 min.
      </p>
      
      <p className="detail-content__paragraph">
        Els ponents convidats representen un planter d’experts de tots els sectors vinculats al món rural:
      </p>
      <ul className="detail-content__llista">
        <li><strong>Javier Cendra:</strong> Alcalde de Planes i Diputat per Alacant.</li>
        <li><strong>Javier Navarro:</strong> Alcalde de Benillup.</li>
        <li><strong>Rafa Climent:</strong> Conseller d’Economia Sostenible, Sectors Productius, Comerç i Treballl.</li>
        <li><strong>Imma Orozco:</strong> Directora General de Política Territorial i Paisatge.</li>
        <li><strong>Rosa Pardo:</strong> Directora General de Política Territorial i Paisatge.</li>
        <li><strong>David Torres:</strong> Director General de Desenvolupament Rural.</li>
        <li><strong>Mauro Ferrando:</strong> Jove agricultor i treballador de l’almàssera de Milleneta.</li>
        <li><strong>Isabel Sancho:</strong> Regidora de Fageca, Tècnica de promoció econòmica en Cocentaina i vinculada a la promoció del turisme rural.</li>
        <li><strong>Òscar Ponsoda:</strong> President de la Societat de Caçadors de Famorca.</li>
        <li><strong>Adán Lloret:</strong> Bomber Forestal a la Font Roja.</li>
        <li><strong>Alejandro Molina:</strong> Llaurador i president de COARVAL i de la Cooperativa Cofrudeca de Bèlgida.</li>
        <li><strong>Artemi Cerdà:</strong> Geògraf, professor d’universitat i llaurador.</li>
      </ul>

      <p className="detail-content__paragraph">
        En la segona quinzena d’agost un incendi va colpir el nostre territori calcinant més de 12.000 ha i 100 km de perimetre.
      </p>
      
      <p className="detail-content__paragraph">
        Aquest incendi, originat de forma espontània en una tormenta seca va cremar a gran velocitat des de Pego fins a Benialfaquí. Alguns pobles van haver de ser desallotjats i moltes persones vam viure amb un ai al cor l’avanç de les flames. Els nombrosos mitjans van treballar de manera incansable tant en aquest incendi com en el de Begís.
      </p>
      
      <p className="detail-content__paragraph">
        Des d’aquell moment, les dues coordinadores es van plantejar que alguna cosa calia fer per entendre què estava passant amb els gran incendis i quin era el futur previsible. Un canvi de tendència en els diagnòstics va fer moure la necessitat de reflexionar sobre el fenòmen. D’una banda, la idea no és evitar el foc sinó saber què hem de fer quan passe perquè passarà, i d’altra banda, els incendis agafen grans dimensions perquè estem perdent el mosaic tan típic del mediterrani (paisatge mixt agro-forestal).
      </p>
      
      <p className="detail-content__paragraph">
        La conclusió lògica d’aquests arguments és que els focs de les nostres serres són deguts al despoblament i a l’abandonament agrícola. I és en aquesta doble línia que les coordinadores decidiren muntar un nou Aplec pel Territori. I clar, l’àrea de cobertura no només inclou les zones de l’incendi sinó altres pobles també que responen al mateix perfil.
      </p>
      
      <p className="detail-content__paragraph">
        Una de les mancances que es va detectar en l’incendi va ser el desempar que moltes persones van sentir quan se’ls va desallotjar de sa casa i, per aquest motiu, s’han iniciat un munt de reunions xicotetes en cadascun dels pobles per a preparar l’Aplec on se’ls informa de l’esdeveniment i també s’intenta fer un recull de peticions de cada poble per tal de lliurar-les als polítics que seran convidats a l’Aplec. El resultat d’aquestes reunions és el <a href="/events/manifest-de-poble" className="detail-content__enllac">Manifest de Poble</a>, un document viu i en constant actualització que pretén destacar les necessitats particulars que caldria atendre per tal de revitalitzar els nostres petits pobles rurals.
      </p>
      
      <p className="detail-content__paragraph">
        Al 2n Aplec pel territori es pretén que tant científics, com polítics, com gent dels pobles puguen establir un fòrum de debat d’iniciatives per a dinamitzar els pobles. No es pretén buscar culpables sinó proposar solucions i cercar llocs on eixes idees hagen sigut ja satisfactòries per a poder-les implementar a casa nostra.
      </p>
      
      <p className="detail-content__paragraph">
        S’adjunta una foto d’una de les darreres reunions que englobava els pobles de Millena, Gorga, Balones i Quatretondeta. Altres reunions han sigut als pobles de Fageca, Tollos, Beniaia, Vall d’Alcalà, Vall de Gallinera, Planes, Benillup, Benialfaquí, Benimassot, La Torre de les Maçanes, Vall d’Ebo i n’hi ha d’altres previstes.
      </p>

      <div className="media-frame detail-content__figura detail-content__figura--final">
        <img src={resolveAsset('/assets/events/aplec_2023_reunio.png')} alt="Reunió preparatòria Aplec" />
      </div>
    </article>
  );
}
