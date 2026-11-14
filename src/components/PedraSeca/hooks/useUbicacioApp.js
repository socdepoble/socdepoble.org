/* Onada R24 · wp_trinquet (SEO-R22-08, trinquet de l'arrencada estàtica) · El
   router on viu l'app, en un mòdul propi: la barra d'identitat
   (useIdentitatDeLaBarra.js) és de l'arrencada i només en volia este hook, però
   l'importava de useAccions.js, i amb ell arrossegava al tros d'entrada tot
   useAccions (Compartir, Comentar en privat, el Connectar per defecte), que només
   fan servir vistes diferides. useAccions.js el reexporta amb el mateix nom: cap
   altre importador no canvia. */
import { useRouter } from '../../../app/contexts/RouterContext';

/**
 * T43a-1 (C3) · El router on viu l'app, si n'hi ha cap de llegible:
 * { memoria, basename, currentPath, searchParams }. null vol dir «llig la barra
 * d'adreces, com abans»: un arbre sense RouterProvider o una prova que simula
 * RouterContext només amb useNavigate (UniversalEditorShell, DocumentEditor,
 * PageFrame, UniversalCard…), on llegir useRouter peta.
 * L'ordre dels hooks no canvia mai: useRouter fa el seu useContext abans de
 * queixar-se, i una exportació simulada que falta peta abans de cridar-ne cap.
 * La forma `return useRouter()` és la que rules-of-hooks accepta dins d'un try:
 * una assignació (`r = useRouter()`) el fa passar per condicional.
 */
export function useUbicacioApp() {
  try {
    return useRouter() ?? null;
  } catch {
    return null;
  }
}
