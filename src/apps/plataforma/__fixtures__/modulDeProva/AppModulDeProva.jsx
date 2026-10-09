/* Suport de proves: l'app que modulDeBuild.test.jsx compila com a mòdul. Fa
   servir el que un mòdul real fa servir del nucli (React, el router, l'API
   pública de la plataforma i Pedra Seca, per un fitxer i per la façana) i
   codi propi, que sí que viatja al cos. */
import { useState } from 'react';
import { useLocation } from '../../../../app/contexts/RouterContext';
import { Boto } from '../../../../components/PedraSeca/atoms/Boto.jsx';
import { EstatBuit } from '../../../../components/PedraSeca/index.js';
import { useApp } from '../../index.js';
import { MAXIM_DE_CLICS, comptaFins } from './comptador.js';

export default function AppModulDeProva() {
  const { manifest } = useApp();
  const { pathname } = useLocation();
  const [clics, setClics] = useState(0);
  return (
    <div>
      <p>{`Mòdul ${manifest.id} a ${pathname}`}</p>
      <Boto onClick={() => setClics(comptaFins(clics + 1))}>{`Clics: ${clics}`}</Boto>
      {clics >= MAXIM_DE_CLICS ? <EstatBuit titol="Prou clics">Ja n’hi ha prou.</EstatBuit> : null}
    </div>
  );
}
