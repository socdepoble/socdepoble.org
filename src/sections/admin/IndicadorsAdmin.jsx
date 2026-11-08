/**
 * IndicadorsAdmin.jsx — el bloc «Indicadors» del Tauler d'administració
 * (decisió del Mestre 261003, «Graphfy»: principis de dashboards i UI de
 * dades als gràfics del panell administratiu). Va a la columna del detall:
 * la que té l'amplada del llenç i la que el mòbil mostra primer.
 *
 * Una pregunta per gràfic:
 *   1. Quantes persones s'han donat d'alta cada mes?   Histograma + Taula
 *   2. Quan van entrar per última vegada?               Histograma + Taula
 *   3. De quin tipus són les entitats?                  Histograma ordenat + Taula
 * L'Histograma dona la forma i la Taula, davall, les xifres exactes: la
 * mateixa parella que Patrons de la Salut. Per això les barres no porten la
 * xifra damunt: «menys de 5» no cap en una columna, i la xifra ja és a la
 * Taula. El mes en curs, que encara no ha acabat, va remarcat i amb el seu
 * nom davall. Res de pastissos, doble eix, 3D ni degradats.
 *
 * Minimització (Llei 05, llei_05_privacitat §1): per a comptar persones,
 * l'únic camí del port és la llista d'adminListUsers, que porta el correu.
 * Per això el bloc no crida res en obrir el Tauler: ho fa quan el
 * superadmin ho demana, després de dir-li què es baixarà. De cada fila es
 * guarden només la data d'alta i la de l'última entrada (de cada entitat, el
 * tipus); la resta es descarta en arribar, i en eixir del Tauler no en queda
 * res. Una RPC de recomptes ho evitaria del tot: és una decisió del Mestre.
 *
 * Model B: la crida al port es queda ací i els recomptes són les funcions
 * pures d'indicadors.js; cap peça de Pedra Seca veu una persona.
 *
 * Estats: sense la capacitat 'admin' (un node que no l'oferix), en espera
 * (encara no s'ha demanat), carregant, error (amb reintent), buit, protegit
 * (dins de cada pregunta) i parcial (el sostre de persones).
 *
 * P0-42 i P0-53 (ordre del Mestre, 08-11-2026, al xat de Claude) · Els
 * aparells amb l'app instal·lada i connectada, en quatre camins (📱 App
 * Android de Google Play, 🍎 App d'iPhone i iPad, 🌐 Android web i 💻
 * Escriptori), sempre a la vista. Cap font real del servidor no els compta
 * per plataforma: admin_list_users només torna el correu, l'alta i l'última
 * entrada; public.xat_dispositius_push (2611020417, a producció) diu el
 * tipus d'avís (web, apns, fcm), però cada persona només en veu els seus,
 * no hi ha cap RPC d'administració que l'agregue i, sense la clau pública
 * VAPID al build web ni el push natiu (assistentBotigues.js), encara no s'hi
 * registra cap aparell; i la RPC agregada de P0-42 (el resum per
 * plataforma d'auth.sessions) no és a cap migració. Per això el bloc no
 * mostra cap xifra: diu, per a cada camí, «sense xifra» i on es pot llegir
 * hui (Google Play Console, App Store Connect). Comptar-ho ací és una
 * migració nova, decisió del Mestre.
 */
import { useId, useState } from 'react';
import { ShieldCheck } from 'lucide-react';
import AppGridColumn from '../../components/layout/AppGridColumn';
import { Alerta, Boto, Carregant, EstatBuit, Histograma, MarcColumna, Pila, Taula } from '../../components/PedraSeca/index.js';
import { adminListOrganizations, adminListUsers, teCapacitat } from '../../data/backendPort.js';
import { LLINDAR_GRUP_PETIT, altesPerMes, barresHistograma, darrerAcces, entitatsPerTipus } from './indicadors.js';
import { TEXT_CAL_SEGON_FACTOR, esRebuigDeSegonFactor } from './rebuigSegonFactor.js';

/* El sostre de public.admin_list_users (2609150000_seguretat_profunda_deepseek.sql):
   no en torna més, i les torna de l'alta més recent a la més antiga. */
export const LIMIT_PERSONES = 500;

/* [singular, plural]: el text per al lector concorda amb la xifra. */
const UNITAT_ALTES = Object.freeze(['alta', 'altes']);
const UNITAT_PERSONES = Object.freeze(['persona', 'persones']);
const UNITAT_ENTITATS = Object.freeze(['entitat', 'entitats']);

const TEXT_SERIE_PROTEGIDA = `No es mostra: amb tan poques persones, restant es podria saber la xifra d’un grup de menys de ${LLINDAR_GRUP_PETIT}.`;
const TEXT_XIFRES_PROTEGIDES = `Algunes xifres es protegixen: sense això, restant del total es podria saber la d’un grup de menys de ${LLINDAR_GRUP_PETIT}.`;

/* P0-42 i P0-53 · Els quatre camins que el Mestre vol seguir i on es pot llegir hui cadascun. Cap té font
   al servidor: el valor és un estat, mai una xifra (vegeu la capçalera). */
export const SENSE_XIFRA = 'sense xifra';
export const APARELLS = Object.freeze([
  Object.freeze({ clau: 'android-app', nom: '📱 App Android (Google Play)', on: 'Google Play Console › Proves › Prova tancada: Google en demana 12 verificadors amb l’app instal·lada durant 14 dies seguits.' }),
  Object.freeze({ clau: 'ios-app', nom: '🍎 App iPhone i iPad (App Store oberta, id6826441844)', on: 'App Store Connect › Analítica (instal·lacions de la 1.0, publicada el 6-11-2026).' }),
  Object.freeze({ clau: 'android-web', nom: '🌐 Android web', on: 'Cap font.' }),
  Object.freeze({ clau: 'escriptori', nom: '💻 Escriptori', on: 'Cap font.' })
]);
export const TEXT_APARELLS_SENSE_FONT = 'Cap consulta del servidor no compta encara els aparells per camí, i ací no es mostra cap xifra que no vinga d’una font real. Comptar-los des d’este Tauler demana una consulta agregada nova al servidor (P0-42): és una decisió del Mestre.';

export const TITOL_APARELLS = 'Aparells amb l’app instal·lada i connectada';
export const TAULA_APARELLS = 'Aparells amb l’app, per camí';

/* Sempre a la vista i sense cap crida: no hi ha res a baixar. Un títol, la Taula de Pedra Seca (una fila
   per camí: el nom, l'estat i on es llig hui) i l'avís informatiu. Només peces que este tros ja porta: el
   bloc no afig cap dependència a la ruta /admin (la llista de dependències de cada ruta viu a l'entrada,
   que no pot créixer). */
function AparellsAmbLApp() {
  const id = useId();
  return (
    <section aria-labelledby={id}>
      <Pila gap={3}>
        <h3 id={id}>{TITOL_APARELLS}</h3>
        <Taula titol={TAULA_APARELLS}>
          <thead><tr><th scope="col">Camí</th><th scope="col">Aparells</th><th scope="col">On es llig hui</th></tr></thead>
          <tbody>
            {APARELLS.map(({ clau, nom, on }) => <tr key={clau}><th scope="row">{nom}</th><td>{SENSE_XIFRA}</td><td>{on}</td></tr>)}
          </tbody>
        </Taula>
        <Alerta to="info" viva={false} titol="Sense font de dades al servidor">{TEXT_APARELLS_SENSE_FONT}</Alerta>
      </Pila>
    </section>
  );
}

const files = (valor) => (Array.isArray(valor) ? valor.filter((f) => f && typeof f === 'object') : []);
/* Només el que es compta: ni el correu, ni l'identificador, ni el nom. */
const dadesDePersona = (fila) => ({ created_at: fila.created_at, last_sign_in_at: fila.last_sign_in_at });
const dadesDEntitat = (fila) => ({ kind: fila.kind });
const estatInicial = () => (teCapacitat('admin') ? { fase: 'en-espera' } : { fase: 'sense-capacitat' });

function TaulaRecomptes({ titol, capcalera, grups, total }) {
  return (
    <Taula titol={titol}>
      <thead><tr><th scope="col">{capcalera[0]}</th><th scope="col">{capcalera[1]}</th></tr></thead>
      <tbody>
        {grups.map((g) => <tr key={g.clau}><th scope="row">{g.etiqueta}</th><td>{g.text}</td></tr>)}
      </tbody>
      {total ? <tfoot><tr><th scope="row">{total.etiqueta}</th><td>{total.text}</td></tr></tfoot> : null}
    </Taula>
  );
}

function Indicador({
  pregunta, unitat, grups, buit, textBuit, protegida = false, destacada = null,
  titolTaula, capcalera, total = null, descartades = null
}) {
  if (protegida) {
    return <EstatBuit icona={ShieldCheck} titol={pregunta}>{TEXT_SERIE_PROTEGIDA}</EstatBuit>;
  }
  const { barres, maxim, formatValor } = barresHistograma(grups, { unitat });
  const ambProtegides = grups.some((g) => g.amagat) || Boolean(descartades?.amagat);
  const ambDescartades = Boolean(descartades) && (descartades.petit || descartades.amagat || descartades.recompte > 0);
  return (
    <Pila gap={3}>
      <Histograma titol={pregunta} barres={buit ? [] : barres} valors={false} destacada={destacada}
        maxim={maxim} formatValor={formatValor} buit={textBuit} />
      {buit ? null : <TaulaRecomptes titol={titolTaula} capcalera={capcalera} grups={grups} total={total} />}
      {!buit && ambProtegides ? <Alerta to="info" viva={false}>{TEXT_XIFRES_PROTEGIDES}</Alerta> : null}
      {!buit && ambDescartades ? (
        <Alerta to="info" viva={false}>{`Registres sense data vàlida, que no s’han comptat: ${descartades.text}.`}</Alerta>
      ) : null}
    </Pila>
  );
}

function Contingut({ estat, ara, calcula }) {
  if (estat.fase === 'sense-capacitat') {
    return <Alerta to="info" viva={false}>Este node no oferix les dades d’administració: no hi ha indicadors per mostrar.</Alerta>;
  }
  if (estat.fase === 'en-espera') {
    return (
      <Alerta to="info" viva={false} titol="Els indicadors es calculen quan els demanes"
        accions={<Boto varietat="primari" onClick={calcula}>Calcula els indicadors</Boto>}>
        {`Per a comptar les persones, es baixa del servidor la llista de fins a ${LIMIT_PERSONES} persones, amb el correu de cadascuna. D’ací només se’n guarden la data d’alta i la de l’última entrada, i en eixir del Tauler no en queda res.`}
      </Alerta>
    );
  }
  if (estat.fase === 'carregant') return <Carregant etiqueta="Carregant els indicadors…" />;
  /* Onada 11 (261010; prompt 261010_1730, tasca 2) · El rebuig del servidor per
     falta del segon factor (42501 amb «SDP-ADMIN») no és «de permisos o de
     xarxa»: es diu què cal fer, i el reintent val quan ja s'ha confirmat. */
  if (estat.fase === 'error' && estat.segonFactor) {
    return (
      <Alerta to="error" titol="Cal confirmar el segon factor"
        accions={<Boto onClick={calcula}>Torna-ho a provar</Boto>}>
        {TEXT_CAL_SEGON_FACTOR}
      </Alerta>
    );
  }
  if (estat.fase === 'error') {
    return (
      <Alerta to="error" titol="No s’han pogut carregar els indicadors"
        accions={<Boto onClick={calcula}>Torna-ho a provar</Boto>}>
        Pot ser un error de permisos (cal el rol de superadmin) o de xarxa.
      </Alerta>
    );
  }
  const instant = ara ?? new Date();
  const altes = altesPerMes(estat.persones, { ara: instant });
  const accessos = darrerAcces(estat.persones, { ara: instant });
  const entitats = entitatsPerTipus(estat.entitats);
  const mesEnCurs = altes.mesos.find((m) => m.enCurs);
  return (
    <>
      {estat.parcial ? (
        <Alerta to="avis" viva={false} titol="Xifres parcials">
          {`El servidor torna com a màxim ${LIMIT_PERSONES} persones, les últimes que s’han donat d’alta: les xifres de persones poden quedar curtes.`}
        </Alerta>
      ) : null}
      <Indicador pregunta="Quantes persones s’han donat d’alta cada mes?" unitat={UNITAT_ALTES}
        grups={altes.mesos} buit={altes.buit} textBuit="Encara no hi ha cap persona registrada."
        protegida={altes.protegida} destacada={mesEnCurs ? mesEnCurs.clau : null}
        titolTaula="Altes per mes, en xifres" capcalera={['Mes', 'Altes']}
        total={altes.total} descartades={altes.descartades} />
      <Indicador pregunta="Quan van entrar per última vegada?" unitat={UNITAT_PERSONES}
        grups={accessos.trams} buit={accessos.buit} textBuit="Encara no hi ha cap persona registrada."
        protegida={accessos.protegida}
        titolTaula="Última entrada, en xifres" capcalera={['Última entrada', 'Persones']}
        total={accessos.total} descartades={accessos.descartades} />
      <Indicador pregunta="De quin tipus són les entitats?" unitat={UNITAT_ENTITATS}
        grups={entitats.tipus} buit={entitats.buit} textBuit="Encara no hi ha cap entitat."
        titolTaula="Entitats per tipus, en xifres" capcalera={['Tipus', 'Entitats']}
        total={entitats.total} />
    </>
  );
}

/**
 * @param {{ ara?: Date }} props  «ara» fix per a les proves; per defecte, el
 *   moment de pintar. Les funcions d'indicadors.js no llegixen mai el rellotge.
 */
export function IndicadorsAdmin({ ara = null }) {
  const [estat, setEstat] = useState(estatInicial);

  /* Promise.resolve().then: el port llança de manera síncrona si el mètode
     no hi és, i això també ha d'acabar en l'estat d'error. Mentre carrega no
     hi ha cap botó, de manera que no hi pot haver dos peticions alhora. */
  const calcula = () => {
    setEstat({ fase: 'carregant' });
    Promise.all([
      Promise.resolve().then(() => adminListUsers(LIMIT_PERSONES, 0)),
      Promise.resolve().then(() => adminListOrganizations())
    ]).then(([persones, entitats]) => setEstat({
      fase: 'llest',
      parcial: Array.isArray(persones) && persones.length >= LIMIT_PERSONES,
      persones: files(persones).map(dadesDePersona),
      entitats: files(entitats).map(dadesDEntitat)
    }), (error) => setEstat({ fase: 'error', segonFactor: esRebuigDeSegonFactor(error) }));
  };

  return (
    <MarcColumna capcalera={<AppGridColumn titol="Indicadors" />} etiqueta="Indicadors">
      <Pila gap={6}>
        <AparellsAmbLApp />
        <Contingut estat={estat} ara={ara} calcula={calcula} />
      </Pila>
    </MarcColumna>
  );
}
