/**
 * EspecimenCopiaSeguretatXat.jsx — les dos pàgines «Còpia de seguretat» dels
 * Ajustos del Xat (Ajustos › Xats › Còpia de seguretat), de l'Onada R28
 * (pla 261115_0135, Lot C3): «Desa una còpia xifrada» i «Comprova una còpia».
 * És l'espècimen que demana la skill sdp-clon-whatsapp §4.4 («Primer
 * l'espècimen», Pedra Seca §9) per a les peces de seguretat del xat. La
 * pàgina ja estava cablejada a FullAjustos quan s'ha fet: l'espècimen arriba
 * després, no abans com demana la regla.
 *
 * Es munta el cos de producció (CosCopiaSeguretatXat), tot per props, amb
 * dades inventades i un MOTOR DE MOSTRA amb la forma de MOTOR_COPIA: no xifra
 * res, no llig cap arxiu, no desa ni descarrega res i no obri cap full de
 * compartir. Cap mostra no passa pel motor de veres (copiaSeguretatPortatil.js)
 * ni llig les converses de qui mira: d'eixe mòdul només n'ixen els codis
 * d'error, que són constants. Els avisos de cada mostra són els que diria
 * l'app, i la nota de davall diu el que el motor de mostra ha fet de veres.
 * Restaurar una còpia dins de l'app encara no és possible, i cap mostra ho
 * insinua.
 */
import { Especimen } from '../Especimen.jsx';
import { CosCopiaSeguretatXat } from '../../../xat/components/PaginaCopiaSeguretatXat.jsx';
import { CODI_CLAU_INCORRECTA, CODI_LIMIT_SUPERAT } from '../../../../data/xat/copiaSeguretatPortatil.js';

/* Traductor mínim: les alternatives ja són el text en valencià. */
const t = (_clau, alternativa) => alternativa;

const HORA_MS = 60 * 60 * 1000;
const INICI_MOSTRA_MS = Date.UTC(2026, 9, 2, 8);

/* L'àmbit inventat de la còpia (a l'app, abastDeLaCopia amb joId i l'àmbit del xat). */
const ABAST_MOSTRA = Object.freeze({ usuariId: 'mostra-jo', tenantId: 'mostra-poble' });

/* El contingut inventat, amb la forma de contingutDeLaCopia: la pàgina només
   en pinta el recompte i el passa al motor, que ací és de mostra. */
const FILS_MOSTRA = Object.freeze([1, 2, 3].map((n) => Object.freeze({ id: `mostra-fil-${n}` })));
const MISSATGES_MOSTRA = Object.freeze(Array.from({ length: 47 }, (_, i) => Object.freeze({
  id: `mostra-missatge-${i + 1}`,
  filId: FILS_MOSTRA[i % FILS_MOSTRA.length].id,
  creatAl: new Date(INICI_MOSTRA_MS + i * 21 * HORA_MS).toISOString()
})));
const CONTINGUT_MOSTRA = Object.freeze({ fils: FILS_MOSTRA, missatges: MISSATGES_MOSTRA, filsAmbMissatges: FILS_MOSTRA.length });
const CONTINGUT_BUIT = Object.freeze({ fils: Object.freeze([]), missatges: Object.freeze([]), filsAmbMissatges: 0 });

/* El nom amb la forma de nomArxiuCopiaSeguretatXat; cap arxiu no el porta. */
const NOM_ARXIU_MOSTRA = 'socdepoble-xat-20261115-0230.sdpbackup';

/* El que tornaria importa d'una còpia bona: el resum de la mostra és inventat. */
const RESULTAT_MOSTRA = Object.freeze({
  fils: FILS_MOSTRA,
  missatges: MISSATGES_MOSTRA,
  manifest: Object.freeze({ creatAt: new Date(INICI_MOSTRA_MS + 47 * 21 * HORA_MS).toISOString() })
});

const ambCodi = (codi) => Object.assign(new Error('Error de mostra.'), { codi });

/**
 * El motor de mostra: la forma de MOTOR_COPIA, sense cap xifra, cap lectura i
 * cap arxiu. Cada mostra en tria l'eixida: el lliurament del pas 2, el codi
 * amb què falla el pas 1, la capçalera de l'arxiu triat o el codi amb què
 * falla la comprovació. `llegix` no toca el fitxer triat.
 */
function motorDeMostra({ lliurament = null, errorExporta = null, capcalera = null, errorImporta = null } = {}) {
  return Object.freeze({
    exporta: () => (errorExporta ? Promise.reject(ambCodi(errorExporta)) : Promise.resolve({ text: 'mostra' })),
    desa: () => Promise.resolve(lliurament ?? { metode: 'descarrega', nomArxiu: NOM_ARXIU_MOSTRA, lliurat: true }),
    llegix: () => Promise.resolve(new Uint8Array(0)),
    descriu: () => Promise.resolve(capcalera ?? { xifrada: true, ...ABAST_MOSTRA }),
    importa: () => (errorImporta ? Promise.reject(ambCodi(errorImporta)) : Promise.resolve(RESULTAT_MOSTRA))
  });
}

const MOTOR_DESCARREGA = motorDeMostra();
const MOTOR_CANCELLAT = motorDeMostra({ lliurament: { metode: 'web-share', nomArxiu: NOM_ARXIU_MOSTRA, lliurat: false, motiu: 'cancellat' } });
const MOTOR_MASSA_GRAN = motorDeMostra({ errorExporta: CODI_LIMIT_SUPERAT });
const MOTOR_CLAU_INCORRECTA = motorDeMostra({ errorImporta: CODI_CLAU_INCORRECTA });
const MOTOR_ALTRE_COMPTE = motorDeMostra({ capcalera: { xifrada: true, usuariId: 'mostra-altra-persona', tenantId: ABAST_MOSTRA.tenantId } });

/* Dins de l'app, la pàgina només mira que el full de compartir hi siga
   (share i canShare): el motor de mostra no el crida mai. */
const NAVEGADOR_AMB_FULL = Object.freeze({ share: () => Promise.resolve(), canShare: () => true });
const NAVEGADOR_SENSE_FULL = Object.freeze({});

/* Cada mostra es diu mostra, i la nota diu el que el motor de mostra ha fet. */
const Mostra = ({ titol, nota = null, children }) => (
  <>
    <h4>{`Mostra · ${titol}`}</h4>
    <div className="sdp-especimen__mostra sdp-especimen__mostra--estreta sdp-especimen__caixa">
      <div className="sdp-xat-ajustos__cos">{children}</div>
    </div>
    {nota ? <p>{nota}</p> : null}
  </>
);

export default function EspecimenCopiaSeguretatXat() {
  return (
    <>
      <Especimen id="xat-copia-desa" nom="CosCopiaSeguretatXat · Desa" fitxer="src/sections/xat/components/PaginaCopiaSeguretatXat.jsx"
        descripcio="Ajustos › Xats › Còpia de seguretat › «Desa una còpia xifrada». A l’app, la pàgina diu què hi va i quant (les converses de la llista i només els missatges que este dispositiu ha carregat en esta sessió, sense fotos, àudios ni vídeos), demana la contrasenya dues vegades (12 caràcters com a mínim) i, en dos passos, xifra la còpia amb el motor de veres (data/xat/copiaSeguretatPortatil.js: PBKDF2 de 600.000 iteracions i AES-256-GCM) i la desa en un arxiu .sdpbackup: a la web, amb el selector de fitxers o la descàrrega; dins de l’app del mòbil, només amb el full de compartir. Ací és el cos de producció amb dades inventades i un motor de mostra: no xifra res, no desa ni descarrega cap arxiu i no llig cap conversa de qui mira. Escriu-hi una contrasenya de prova: el navegador o el gestor de contrasenyes pot oferir-se a guardar-la. Restaurar una còpia dins de l’app encara no és possible."
        contracte={[
          ['accio', '\'desa\' | \'comprova\'', '\'desa\'', 'Quina de les dos pàgines: desar una còpia xifrada o comprovar-ne una.'],
          ['abast', '{ usuariId, tenantId } | null', 'null', 'L’àmbit de la còpia (abastDeLaCopia, xat/copiaSeguretatXat.js): la persona i el poble. Sense, només l’avís «Entra al xat amb el teu compte…».'],
          ['contingut', '{ fils, missatges }', 'null', 'El que aniria a la còpia (contingutDeLaCopia), en la forma que el motor admet; només per a «desa». La pàgina en pinta el recompte.'],
          ['locale', 'string', '\'ca-ES\'', 'La llengua dels nombres i de les dates.'],
          ['natiu', 'boolean', 'false', 'Dins de l’app de Capacitor: només el full de compartir, i el botó del pas 2 diu «Comparteix l’arxiu».'],
          ['navegador', '{ share?, canShare? }', 'globalThis.navigator', 'Dins de l’app, sense share i canShare, la pàgina diu que no pot desar l’arxiu abans de demanar res.'],
          ['motor', '{ exporta, desa, llegix, descriu, importa }', 'MOTOR_COPIA', 'El motor de veres (data/xat/copiaSeguretatPortatil.js). Les proves i este catàleg en passen un de mostra.'],
          ['t', '(clau, reserva) => string', 'reserva', 'El traductor de l’app (section.xat.copia.*); fora, el valencià.']
        ]}
        a11y={[
          'Cada camp de contrasenya té etiqueta pròpia, l’ajuda i l’error lligats per aria-describedby i l’ull de ControlContrasenya amb nom propi.',
          'Un error de camp porta aria-invalid, la icona i el text (mai només el color), i el focus va al camp.',
          'L’avís de la pàgina és una regió viva (aria-live="polite"), sempre muntada; les Alerta hi entren sense rol propi (viva={false}), perquè cap rol no hi quede niat.',
          'Mentre el motor treballa, el botó queda ocupat («Treballant…»); la còpia preparada porta el focus al botó que la desa.',
          'Un usuari propi de la còpia (autocomplete="username", amagat, de només lectura i fora de l’ordre de tabulació) i new-password als dos camps: el gestor de contrasenyes la pot tindre com una credencial a banda de la del compte. Què fa cada gestor no ho decidix la pàgina.'
        ]}
        fes={[
          'Dir què hi va, què no hi va i quant, abans de demanar la contrasenya.',
          'Xifrar en un clic i desar en un altre: la crida de desar va dins del seu clic, abans de cap espera, perquè el full de compartir i el selector de fitxers demanen una activació d’usuari vigent.',
          'Esborrar les contrasenyes de la pàgina quan la còpia ja és xifrada.',
          'Dir els errors del motor en paraules de la gent (errorDeLaCopia), mai el codi intern.'
        ]}
        noFacis={[
          'Un botó o un text que prometa restaurar la còpia: encara no és possible.',
          'Prometre fotos, àudios, vídeos o missatges que este dispositiu no ha carregat.',
          'Treure l’usuari propi de la còpia: el gestor de contrasenyes la podria desar damunt de la del compte.',
          '«Mai», «100 %», «immune» o «inviolable».',
          'Al catàleg, cridar el motor de veres o llegir les converses de qui mira.'
        ]}>
        <Mostra titol="Al navegador (es pot tocar)"
          nota="Motor de mostra: «Prepara la còpia» no xifra res i «Desa l’arxiu» no desa ni descarrega cap arxiu. L’avís que ix és el que l’app diria després d’una descàrrega.">
          <CosCopiaSeguretatXat accio="desa" t={t} abast={ABAST_MOSTRA} contingut={CONTINGUT_MOSTRA} motor={MOTOR_DESCARREGA} />
        </Mostra>
        <Mostra titol="Dins de l’app, amb el full de compartir (es pot tocar)"
          nota="Motor de mostra: no s’obri cap full de compartir. L’avís que ix és el que l’app diria si la persona tancara el full sense guardar l’arxiu.">
          <CosCopiaSeguretatXat accio="desa" t={t} abast={ABAST_MOSTRA} contingut={CONTINGUT_MOSTRA} natiu navegador={NAVEGADOR_AMB_FULL} motor={MOTOR_CANCELLAT} />
        </Mostra>
        <Mostra titol="El motor no pot fer la còpia (es pot tocar)"
          nota="Motor de mostra: «Prepara la còpia» falla sempre amb el límit de mida, per a veure l’avís d’error de la pàgina.">
          <CosCopiaSeguretatXat accio="desa" t={t} abast={ABAST_MOSTRA} contingut={CONTINGUT_MOSTRA} motor={MOTOR_MASSA_GRAN} />
        </Mostra>
        <Mostra titol="Cap conversa carregada">
          <CosCopiaSeguretatXat accio="desa" t={t} abast={ABAST_MOSTRA} contingut={CONTINGUT_BUIT} motor={MOTOR_DESCARREGA} />
        </Mostra>
        <Mostra titol="Dins de l’app, sense full de compartir">
          <CosCopiaSeguretatXat accio="desa" t={t} abast={ABAST_MOSTRA} contingut={CONTINGUT_MOSTRA} natiu navegador={NAVEGADOR_SENSE_FULL} motor={MOTOR_DESCARREGA} />
        </Mostra>
        <Mostra titol="Sense compte">
          <CosCopiaSeguretatXat accio="desa" t={t} abast={null} motor={MOTOR_DESCARREGA} />
        </Mostra>
      </Especimen>
      <Especimen id="xat-copia-comprova" nom="CosCopiaSeguretatXat · Comprova" fitxer="src/sections/xat/components/PaginaCopiaSeguretatXat.jsx"
        descripcio="Ajustos › Xats › Còpia de seguretat › «Comprova una còpia». A l’app, la persona tria un arxiu .sdpbackup, la pàgina en llig la capçalera sense desxifrar res i, amb la contrasenya, el motor de veres la desxifra i la valida sencera en memòria, sense escriure res, ni en este dispositiu ni al servidor. Diu quantes converses i missatges porta, de quines dates i quan es va fer, i que restaurar-la dins de l’app encara no és possible. Ací, el motor de mostra no llig l’arxiu que tries ni comprova cap contrasenya: el resum és inventat i cada error és el que fixa la seua mostra."
        contracte={[
          ['PaginaCopiaSeguretatXat', '{ accio, t }', 'accio: \'desa\'', 'La pàgina amb les dades de l’app: llig useXat() i useUIState() i munta el cos amb el motor de veres. FullAjustos la carrega en diferit (lazy).'],
          ['motor.exporta', '({ usuariId, tenantId, fils, missatges, contrasenya }) => Promise<{ text }>', '—', 'Pas 1 de «Desa»: xifra. La pàgina esborra les contrasenyes i guarda el text xifrat en memòria fins que es desmunta.'],
          ['motor.desa', '(text, opcions) => Promise<{ metode, nomArxiu, lliurat, motiu? }>', '—', 'Pas 2 de «Desa», cridat dins del clic. lliurat: true vol dir que l’arxiu s’ha donat al sistema (full, selector o descàrrega), no que la persona l’haja guardat.'],
          ['motor.llegix', '(fitxer) => Promise<Uint8Array>', '—', 'Els bytes de l’arxiu triat, amb el límit de mida del motor.'],
          ['motor.descriu', '(bytes) => Promise<{ xifrada, usuariId, tenantId }>', '—', 'La capçalera, sense desxifrar res. L’àmbit que diu no està autenticat: només estalvia la contrasenya a qui ha triat la còpia d’un altre compte.'],
          ['motor.importa', '(bytes, { usuariIdEsperat, tenantIdEsperat, contrasenya }) => Promise<{ fils, missatges, manifest }>', '—', 'Desxifra i valida la còpia sencera en memòria, sense magatzem ni aplicaImportacio: no escriu res.']
        ]}
        a11y={[
          'El control de fitxer natiu porta l’etiqueta i va fora de l’ordre de tabulació; el Boto «Tria l’arxiu» és l’única parada de focus i es diu «Arxiu de la còpia: Tria l’arxiu».',
          'L’estat de l’arxiu triat és una segona regió viva, com a CampFitxer de Pedra Seca. Sense accept: el selector de Fitxers d’iOS deixa en gris les extensions que no coneix.',
          'El camp de la contrasenya diu current-password, amb el mateix usuari propi de la còpia que a «Desa».',
          'Els errors de l’arxiu i de la contrasenya van al seu camp, amb el focus; la resta, a l’avís de la pàgina.'
        ]}
        fes={[
          'Comprovar en memòria: sense magatzem, sense aplicaImportacio i sense cap funció de XatContext que escriga.',
          'Dir quantes converses i missatges porta la còpia, de quines dates i quan es va fer.',
          'Dir que restaurar-la dins de l’app encara no és possible.'
        ]}
        noFacis={[
          'Escriure res, ni en este dispositiu ni al servidor, en comprovar una còpia.',
          'Prendre la capçalera per la prova: l’àmbit que diu no està autenticat, i la comprovació de veres és importa.',
          'Posar accept al control de fitxer.'
        ]}>
        <Mostra titol="Una còpia que s’obri (es pot tocar)"
          nota="Motor de mostra: no llig l’arxiu que tries ni comprova la contrasenya, i el resum és inventat. Tria qualsevol arxiu: la mostra només en pinta el nom.">
          <CosCopiaSeguretatXat accio="comprova" t={t} abast={ABAST_MOSTRA} motor={MOTOR_DESCARREGA} />
        </Mostra>
        <Mostra titol="La contrasenya no obri la còpia (es pot tocar)"
          nota="Motor de mostra: qualsevol contrasenya hi fa d’incorrecta.">
          <CosCopiaSeguretatXat accio="comprova" t={t} abast={ABAST_MOSTRA} motor={MOTOR_CLAU_INCORRECTA} />
        </Mostra>
        <Mostra titol="Una còpia d’un altre compte (es pot tocar)"
          nota="Motor de mostra: la capçalera de qualsevol arxiu diu que és d’un altre compte.">
          <CosCopiaSeguretatXat accio="comprova" t={t} abast={ABAST_MOSTRA} motor={MOTOR_ALTRE_COMPTE} />
        </Mostra>
        <Mostra titol="Sense compte">
          <CosCopiaSeguretatXat accio="comprova" t={t} abast={null} motor={MOTOR_DESCARREGA} />
        </Mostra>
      </Especimen>
    </>
  );
}
