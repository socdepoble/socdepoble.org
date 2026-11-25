/* Fixture del filtre FN0 (C6 · desplaçament real de línies): una app que redirigix a la seua pantalla d'avís.
   Cap ruta de producció la importa; tests/filtre-aprenentatge-node0.test.mjs la llig com a text i l'analitza
   amb un nom virtual de src/apps/, de manera que cap canvi d'una app real no la mou. */
import { Navigate } from 'react-router-dom';

export default function RedireccioAvis() {
  return <Navigate to="/app/prova/avis" replace />;
}
