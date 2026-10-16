/**
 * Lector de notícies · peces que fan servir diverses vistes. Cap classe
 * pròpia: tot és de Pedra Seca.
 *
 *   NavTargetes      les targetes de «Les que seguixes» (la gestió de fonts,
 *                    GestioFonts.jsx): UniversalCard amb enllaços de veres;
 *                    el clic normal navega (push) i, en mitjana, tanca el panell
 *   MarcaTotLlegit   «Marca-ho tot com a llegit» per a les notícies que es
 *                    veuen: el ✓ de la capçalera de la llista de Feedly (amb
 *                    una cerca, els resultats, i el text ho diu)
 *   AvisLector       el disc: només en memòria, una altra pestanya o un error
 * Bloc 0 del Gauntlet (ordre del Mestre, 261016) · Les notícies són l'espai de
 * treball del Bloc (Noticies.jsx): l'obridor de la columna de les carpetes
 * (ObridorCarpetes) i les targetes de navegació de les carpetes i de les fonts
 * se'n van amb les columnes del 261004. L'arbre de l'espai porta els seus
 * obridors, i MarcaTotLlegit rep la llista que es veu (els ids), també la de
 * «Totes», que el nucli no té com a carpeta.
 */
import { CheckCheck } from 'lucide-react';
import { Alerta, Boto, GraellaTargetes, UniversalCard } from '../../../components/PedraSeca/index.js';
import { useClosaAplicacio } from '../../plataforma/index.js';
import { useVistaLector } from './context.js';

/* Les apps no entren a la telemetria (frontera.test.js): el Connectar del peu no compta. */
const SENSE_TELEMETRIA = Object.freeze({ comptar: false });
const textDe = (valor) => (typeof valor === 'string' && valor.trim() !== '' ? valor : undefined);

/**
 * Ordre del Mestre, 261004 (integració final, arreglo 6; arreglo del verificador, «front roig i
 * verificació emmascarada») · La columna «Les que seguixes» (la gestió de fonts) va en
 * UniversalCard, la targeta de tot Sóc de Poble: boina, títol, subtítol i entradeta, amb dades
 * reals. Bloc 0 del Gauntlet (ordre del Mestre, 261016) · Les carpetes i les fonts de les
 * notícies ja no hi passen: són l'arbre de l'espai de treball (Noticies.jsx). Amb elles se'n va
 * `actiu` (la targeta oberta, aria-current) i la seua vora de modules.css: «Les que seguixes» no
 * en marcava mai cap (actiu={null}), i cap píxel canvia.
 *   element   { id, nom, comptador, secundari?, entradeta?, autoria? }
 *     · títol: el nom; subtítol: el comptador i el seu text («6 sense llegir»), que també és la
 *       descripció accessible de l'element principal (el nom és el títol);
 *     · entradeta: la descripció o el lloc web de la font (navegacio.js);
 *     · boina: `autoria` { nom, href?, avatar?, poble? }: la font mateixa, sense enllaç (la
 *       targeta sencera ja hi porta; navegacio.js). Sense, cap boina: no se n'inventa cap.
 *   camiDe(e) el camí de l'app on porta (mainHref): enllaç de veres, també en pestanya nova
 * El peu, el per defecte de les apps (TargetesArticles de l'esquelet): sense Compartir (el que
 * se seguix és l'estat d'este dispositiu), sense xat comú i el Connectar no compta. El Mestre
 * decidirà què s'apaga. Cap className ni element de llista escrit a mà: GraellaTargetes. La
 * targeta de sempre, amb fons, no la plana (comprovat al navegador: la plana no s'hi llegia).
 */
export function NavTargetes({ elements, etiqueta, camiDe, buit = null }) {
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

/* F2 del Gauntlet (261016, defecte L1-2) · Amb una cerca, el botó diu l'abast, com a Feedly: els
   resultats que es veuen a la llista, no la carpeta sencera. */
const textDelsResultats = (n) => {
  if (n === 0) return 'Cap resultat per a marcar';
  return n === 1 ? 'Marca com a llegit el resultat' : `Marca com a llegits els ${n} resultats`;
};

/**
 * `ids`: les notícies que es veuen. Es marquen les que encara no s'han llegit.
 * `filtrat` (F2, 261016): si els ids són els resultats d'una cerca; el text ho diu («Marca com a
 * llegits els 3 resultats»). Sense, «Marca-ho tot com a llegit», el de sempre.
 */
export function MarcaTotLlegit({ ids, filtrat = false }) {
  const { lector } = useVistaLector();
  const llegits = new Set(lector.estat.llegits);
  const llista = Array.isArray(ids) ? ids : [];
  const pendents = llista.filter((id) => !llegits.has(id));
  return (
    <Boto varietat="secundari" icona={CheckCheck} disabled={pendents.length === 0} onClick={() => lector.accions.marcaLlegits(pendents)}>
      {filtrat ? textDelsResultats(llista.length) : 'Marca-ho tot com a llegit'}
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
