/* T1 (261024; P0-04) · L'embolcall Deno de compte-apple: tota la lògica és a gestor.js (Vitest). Desplegament amb --no-verify-jwt (supabase/README.md). */
/* global Deno */
import { creaGestor } from './gestor.js';
Deno.serve(creaGestor({ env: Deno.env.toObject() }));
