/**
 * Lector de notícies · peces que fan servir diverses columnes. Cap classe
 * pròpia: tot és de Pedra Seca.
 *
 *   ObridorCarpetes  en mitjana i en estret, el botó que obri la columna de
 *                    les carpetes (el patró de salut/vistes/comunes.jsx:
 *                    data-obri-columna + aria-controls, perquè la guarda de
 *                    focus d'AppGridShell el trobe en tancar-la)
 *   NavTargetes      les targetes de navegació (carpetes, fonts i «Les que
 *                    seguixes»): UniversalCard amb enllaços de veres; el clic
 *                    normal navega (push) i, en mitjana, tanca el panell
 *   MarcaTotLlegit   «Marca-ho tot com a llegit» per a la carpeta (i la font)
 *                    que es veu: el ✓ de la capçalera de la llista de Feedly
 *   AvisLector       el disc: només en memòria, una altra pestanya o un error
 */
import { CheckCheck, PanelLeftOpen } from 'lucide-react';
import { Alerta, Boto, GraellaTargetes, UniversalCard } from '../../../components/PedraSeca/index.js';
import { useClosaAplicacio } from '../../plataforma/index.js';
import { articlesDeCarpeta } from '../nucli/index.js';
import { useVistaLector } from './context.js';

export function ObridorCarpetes() {
  const { mida, obriPanell } = useClosaAplicacio();
  if (mida === 'ample') return null;
  return (
    <Boto varietat="fantasma" icona={PanelLeftOpen} data-obri-columna="esquerra" aria-controls="app-grid-sidebar"
      onClick={() => obriPanell('esquerra')}>
      Carpetes
    </Boto>
  );
}

/* Les apps no entren a la telemetria (frontera.test.js): el Connectar del peu no compta. */
const SENSE_TELEMETRIA = Object.freeze({ comptar: false });
const textDe = (valor) => (typeof valor === 'string' && valor.trim() !== '' ? valor : undefined);

/**
 * Ordre del Mestre, 261004 (integració final, arreglo 6; arreglo del verificador, «front roig i
 * verificació emmascarada») · Les columnes de navegació (Carpetes, Fonts i «Les que seguixes»)
 * passen a UniversalCard, la targeta de tot Sóc de Poble: boina, títol, subtítol i entradeta,
 * amb dades reals. Derogada la llista sdp-gestor-llista amb ItemMedia del Workspace (reescrita
 * a les 11:41 sense relleu): importava fora de la frontera de l'app (Model B) i escrivia classes i
 * elements de llista a mà (qualitat.test.js), i la inicial de reserva es colava al text de
 * l'enllaç («HHui6 sense llegir»).
 *   element   { id, nom, comptador, secundari?, entradeta?, autoria? }
 *     · títol: el nom; subtítol: el comptador i el seu text («6 sense llegir»), que també és la
 *       descripció accessible de l'element principal (el nom és el títol);
 *     · entradeta: la que vestix la columna (què és la carpeta, quantes fonts hi seguixes, la
 *       descripció o el lloc web de la font; navegacio.js);
 *     · boina: `autoria` { nom, href?, avatar?, poble? } que vestix la columna (Sóc de Poble per
 *       a les carpetes, que són de l'app; la font mateixa, sense enllaç, per a una font: la
 *       targeta sencera ja hi porta; navegacio.js). Sense, cap boina: no se n'inventa cap.
 *   actiu     l'id de l'element obert: aria-current="true" a l'element principal
 *   camiDe(e) el camí de l'app on porta (mainHref): enllaç de veres, també en pestanya nova
 * El peu, el per defecte de les apps (TargetesArticles de l'esquelet): sense Compartir (Hui i
 * Per a després són l'estat d'este dispositiu), sense xat comú i el Connectar no compta. El
 * Mestre decidirà què s'apaga. Cap className ni element de llista escrit a mà: GraellaTargetes.
 * La targeta de sempre, amb fons, no la plana: la columna de les carpetes és fosca i la plana no
 * s'hi llegia (comprovat al navegador). La carpeta oberta, la vora del bloc del front a
 * modules.css.
 */
export function NavTargetes({ elements, etiqueta, actiu, camiDe, buit = null }) {
  const { mida, tancaPanells } = useClosaAplicacio();
  const llista = Array.isArray(elements) ? elements : [];
  /* En mitjana la columna és un panell superposat: triar-ne una el tanca (navega el Link). */
  const enTriar = mida === 'mitja' ? () => tancaPanells() : undefined;
  return (
    <GraellaTargetes elements={llista} variant="llista" etiqueta={etiqueta} buit={buit}>
      {(element) => {
        const n = Number.isSafeInteger(element.comptador) && element.comptador > 0 ? element.comptador : 0;
        const subtitol = [String(n), textDe(element.secundari)].filter(Boolean).join(' ');
        const boina = element.autoria || null;
        return (
          <UniversalCard
            key={element.id}
            title={element.nom}
            subtitle={subtitol}
            body={textDe(element.entradeta)}
            author={textDe(boina?.nom)}
            authorHref={textDe(boina?.href)}
            avatarUrl={textDe(boina?.avatar)}
            location={textDe(boina?.poble)}
            imatgePrivada
            mainHref={camiDe(element)}
            onMainClick={enTriar}
            actual={actiu === element.id}
            descripcioAccessible={subtitol}
            objecte={null}
            hasFooter
            showShare={false}
            telemetria={SENSE_TELEMETRIA}
          />
        );
      }}
    </GraellaTargetes>
  );
}

/** `carpeta` i `fontId` (o null): les notícies que es marquen són les que es veuen. */
export function MarcaTotLlegit({ carpeta, fontId = null }) {
  const { lector, noticies, ara } = useVistaLector();
  const llegits = new Set(lector.estat.llegits);
  const pendents = (articlesDeCarpeta({ ...noticies, estat: lector.estat, carpeta, fontId, ara }) || [])
    .filter((article) => !llegits.has(article.id))
    .map((article) => article.id);
  return (
    <Boto varietat="secundari" icona={CheckCheck} disabled={pendents.length === 0} onClick={() => lector.accions.marcaLlegits(pendents)}>
      Marca-ho tot com a llegit
    </Boto>
  );
}

export function AvisLector() {
  const { lector } = useVistaLector();
  if (lector.mode === 'lectora') {
    return <Alerta to="avis" titol="Només per a mirar">El lector està obert en una altra pestanya: el que llegixes ací no es guarda.</Alerta>;
  }
  if (lector.error) {
    return <Alerta to="error" titol="No s’ha pogut guardar">El navegador no ha deixat guardar el que has llegit. Torna a obrir el lector.</Alerta>;
  }
  if (!lector.persistent) {
    return <Alerta to="avis" titol="Només en la memòria">Este navegador no deixa guardar: el que llegixes es perdrà en tancar la pestanya.</Alerta>;
  }
  return null;
}
