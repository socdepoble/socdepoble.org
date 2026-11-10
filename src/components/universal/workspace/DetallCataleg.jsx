import { PaginaApp } from '../../PedraSeca/index.js';
import { useWorkspace } from './WorkspaceContext.jsx';

/** The canonical app page belongs to the workspace's detail slot. Requiring
 * its provider prevents a catalogue app from mounting a second loose page. */
export default function DetallCataleg(props) {
  useWorkspace();
  return <PaginaApp {...props} />;
}
