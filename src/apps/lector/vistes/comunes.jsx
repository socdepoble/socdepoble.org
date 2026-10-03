/**
 * Lector de notícies · peces que fan servir diverses columnes. Cap classe
 * pròpia: tot és de Pedra Seca.
 *
 *   ObridorCarpetes  en mitjana i en estret, el botó que obri la columna de
 *                    les carpetes (el patró de salut/vistes/comunes.jsx:
 *                    data-obri-columna + aria-controls, perquè la guarda de
 *                    focus d'AppGridShell el trobe en tancar-la)
 *   NavTargetes      TargetesColleccions amb enllaços de veres: el clic
 *                    normal navega (push) i, en mitjana, tanca el panell
 *   MarcaTotLlegit   «Marca-ho tot com a llegit» per a la carpeta (i la font)
 *                    que es veu: el ✓ de la capçalera de la llista de Feedly
 *   AvisLector       el disc: només en memòria, una altra pestanya o un error
 */
import { CheckCheck, PanelLeftOpen } from 'lucide-react';
import { useNavigate, useRouter } from '../../../app/contexts/RouterContext';
import { Alerta, Boto, TargetesColleccions } from '../../../components/PedraSeca/index.js';
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

/** `camiDe(element)`: el camí dins de l'app (useApp().ruta(...)). */
export function NavTargetes({ elements, etiqueta, actiu, camiDe, buit = null }) {
  const navigate = useNavigate();
  const { basename = '' } = useRouter();
  const { mida, tancaPanells } = useClosaAplicacio();
  return (
    <TargetesColleccions
      colleccions={elements}
      etiqueta={etiqueta}
      actiu={actiu}
      hrefDe={(element) => basename + camiDe(element)}
      onTria={(element) => {
        navigate(camiDe(element));
        /* En mitjana l'esquerra tapa la resta: triar-ne una la tanca (en estret ho fa la ruta). */
        if (mida === 'mitja') tancaPanells();
      }}
      textComptador={(n) => String(n)}
      buit={buit}
    />
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
