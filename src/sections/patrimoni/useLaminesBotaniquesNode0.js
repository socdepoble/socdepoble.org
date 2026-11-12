import { useEffect, useState } from 'react';

let cataleg = null;
let peticio = null;

function carregaCataleg() {
  peticio ??= import('../../data/patrimoni/laminesBotaniquesNode0.js')
    .then((modul) => { cataleg = modul; return modul; })
    .catch(() => { peticio = null; return null; });
  return peticio;
}

/** Els índexs i el document literal es poden pintar mentre arriben les làmines. */
export function useLaminesBotaniquesNode0(actiu = true) {
  const [modul, posaModul] = useState(() => cataleg);
  useEffect(() => {
    if (!actiu || modul) return undefined;
    let viu = true;
    void carregaCataleg().then((resultat) => { if (viu) posaModul(resultat); });
    return () => { viu = false; };
  }, [actiu, modul]);
  return actiu ? modul : null;
}
