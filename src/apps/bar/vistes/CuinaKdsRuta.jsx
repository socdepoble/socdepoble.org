import { Suspense } from 'react';
import { Carregant } from '../../../components/PedraSeca/index.js';
import { lazyRoute } from '../../plataforma/index.js';

const CuinaKdsDiferida = lazyRoute(() => import('./CuinaKds.jsx'));

export function CuinaKdsRuta() {
  return (
    <Suspense fallback={<Carregant etiqueta="Cuina (KDS)" />}>
      <CuinaKdsDiferida />
    </Suspense>
  );
}
