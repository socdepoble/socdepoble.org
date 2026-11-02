// El context viu fora del mòdul que Fast Refresh reavalua quan canvia el proveïdor.
// Dos versions temporals de WorkspaceContext.jsx han de compartir esta identitat.
import { createContext } from 'react';
export const WorkspaceContext = createContext(null);
