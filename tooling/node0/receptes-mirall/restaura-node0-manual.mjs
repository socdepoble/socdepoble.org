#!/usr/bin/env node
/** Explicit disposable-DB restore entrypoint; identity only from anonymous stdin.
 * Package with the reviewed parent helpers and their pinned dependencies.
 * No restoration of production, global roles, ACLs or clean-machine claim.
 */
import {mainRestauracio} from '../verifica-restauracio-node0.mjs';
await mainRestauracio();
