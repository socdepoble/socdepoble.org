import React from "react";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { act, cleanup, renderHook, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, expect, it, vi } from "vitest";
import { classificaEndpoint } from "../../tooling/gates/tractor-zero-dependencia-ia.mjs";
const m = vi.hoisted(() => ({ root: "", valors: {}, requests: [], aiRequests: [], aiMode: "refuse", discover: false, native: [], assistant: vi.fn(), store: /* @__PURE__ */ new Map(), epoch: 0 }));
vi.mock("../../src/data/backendPort.js", async (original) => ({ ...await original(), teCapacitat: () => true, consultaIAIA: (...args) => m.assistant(...args) }));
vi.mock("../../src/config/storage.js", async (original) => ({ ...await original(), getEfimer: (key, fallback = null) => m.store.get(key) ?? fallback }));
vi.mock("../../src/data/identitat.js", async (original) => ({ ...await original(), jwtPerBackend: () => null, usuariDeSessio: () => null, capturaSessio: () => () => {
}, get versioSessio() {
  return m.epoch;
} }));
vi.mock("../../scripts/botigues/preflight.mjs", () => ({
  arrelComprovada: () => m.root,
  projecteIos: () => ({ opcio: "-project", cami: "fixture.xcodeproj" }),
  llegixClauPlay: () => ({ valida: false }),
  preflight: () => ({ codi: 0, linies: ["fixture preflight"], valors: m.valors, segell: { commit: "a".repeat(40) }, push: { anuncia: false, estat: {} } })
}));
vi.mock("../../scripts/botigues/entorn.mjs", async (original) => ({
  ...await original(),
  llegixAjuda: () => "-workspace -project -scheme -configuration -destination -archivePath -exportArchive -exportPath -exportOptionsPlist -allowProvisioningUpdates -authenticationKeyPath -authenticationKeyID -authenticationKeyIssuerID -packageAuthorizationProvider --validate-app --upload-app -f --api-key --api-issuer --p8-file-path",
  guardaDelRegistre: () => ({ codi: 0, avisos: [], problemes: [] }),
  executa: async (...args) => {
    m.native.push(args);
    throw new Error("Unexpected native execution in dry run");
  }
}));
vi.mock("../../tooling/vite/consola-iaia.mjs", () => ({ CANALS_JARVIS: ["web", "wordpress", "android", "ios"], recullEmpaquetats: () => ({ canonica: "1.2.22", plataformes: {} }) }));
vi.mock("../../tooling/gates/tractor-higiene-paquets.mjs", () => ({ inspeccionaHigienePaquets: () => ({ valid: true, incidencies: [] }) }));
import { creaAdaptadorNodeZeroHttp } from "../../src/data/node0/adaptadorNodeZeroHttp.js";
import { creaSessioNodeZeroHttp } from "../../src/data/node0/sessioNodeZeroHttp.js";
import { request } from "../../src/data/supabase/runtime.js";
import { fixaPuntNode0, creaSessioVeu, reiniciaVeuPerProves } from "../../src/services/veuIaiaService.js";
import { XatContext, useXat } from "../../src/sections/xat/XatContext.jsx";
import IAIAProvider from "../../src/sections/xat/IAIAProvider.jsx";
import * as ios from "../../scripts/botigues/puja-ios.mjs";
import * as android from "../../scripts/botigues/puja-android.mjs";
import * as wordpress from "../../scripts/botigues/puja-wordpress-svn.mjs";
import * as publica from "../../scripts/botigues/publica-tot.mjs";
import { VERSIO_CLIENT_NATIU } from "../../scripts/botigues/versio-client.mjs";
import { executaValidadors, PASSOS_HOOK } from "../../tooling/gates/git-staged.mjs";
const U = "10000000-0000-4000-8000-000000000001", F = "20000000-0000-4000-8000-000000000001", B = "30000000-0000-4000-8000-000000000001", M = "40000000-0000-4000-8000-000000000001";
const json = (value) => new Response(JSON.stringify(value), { headers: { "Content-Type": "application/json" } });
function transport(url, init = {}) {
  const endpoint = String(url);
  m.requests.push({ endpoint, init });
  if (classificaEndpoint(endpoint) === "ai") {
    m.aiRequests.push(endpoint);
    if (m.aiMode === "hang") return new Promise((_, reject) => init.signal?.addEventListener("abort", () => reject(new DOMException("fixture abort", "AbortError")), { once: true }));
    return Promise.reject(new TypeError("AI fixture offline"));
  }
  const pathname = new URL(endpoint, "https://socdepoble.cat").pathname;
  if (pathname.endsWith("/core")) return Promise.resolve(json({ towns: [], pages: [], agents: [] }));
  if (pathname.endsWith("/mur")) return Promise.resolve(json({ feedPosts: [{ id: "human-post", title: "Bon dia" }], events: [], marketItems: [] }));
  if (pathname.endsWith("/multimedia")) return Promise.resolve(json({ mediaItems: [] }));
  if (pathname.endsWith("/notes")) return Promise.resolve(json({ notes: [], noteFolders: [] }));
  if (pathname === "/plugins/info/1.2/") return Promise.resolve(json({ version: "1.1.30" }));
  if (pathname.startsWith("/api/v1/node0/auth/")) return Promise.resolve(json({ user: { id: U }, operation: pathname.split("/").at(-1) }));
  if (pathname.startsWith("/api/v1/node0/private/")) return Promise.resolve(json({ id: M, revision: 2, operation: pathname.split("/").at(-1), accepted: JSON.parse(init.body) }));
  if (pathname.startsWith("/rest/v1/") || pathname.startsWith("/auth/v1/") || pathname.startsWith("/storage/v1/")) return Promise.resolve(json({ ok: true, path: pathname, body: init.body ? JSON.parse(init.body) : null }));
  return Promise.reject(new Error(`UNSTUBBED network: ${pathname}`));
}
beforeEach(() => {
  m.root = fs.mkdtempSync(path.join(os.tmpdir(), "sdp-zero-ia-runtime-"));
  m.requests = [];
  m.aiRequests = [];
  m.aiMode = "refuse";
  m.native = [];
  m.store.clear();
  m.assistant.mockReset();
  m.valors = { SDP_BUILDS_DIR: path.join(m.root, "builds"), SDP_ASC_KEY_PATH: path.join(m.root, "fixture.p8"), SDP_ASC_KEY_ID: "FIXTURE", SDP_ASC_ISSUER_ID: "fixture-issuer", SDP_APPLE_TEAM_ID: "ABCDEFGHIJ", SDP_APP_ID: "org.socdepoble.app", SDP_PLAY_JSON_KEY_PATH: path.join(m.root, "fixture.json") };
  vi.stubGlobal("fetch", vi.fn(transport));
  vi.stubGlobal("location", { origin: "https://socdepoble.cat" });
  vi.spyOn(process.stdout, "write").mockImplementation(() => true);
  vi.spyOn(process.stderr, "write").mockImplementation(() => true);
});
afterEach(() => {
  cleanup();
  reiniciaVeuPerProves();
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
  fs.rmSync(m.root, { recursive: true, force: true });
});
it("fault injection is calibrated: AI refused while real Node0 public human reads stay available", async () => {
  await expect(fetch("http://192.168.0.20:11434/api/generate")).rejects.toThrow("AI fixture offline");
  const a = creaAdaptadorNodeZeroHttp({ fetchImpl: fetch });
  try {
    expect(await a.loadCoreContent()).toEqual({ towns: [], pages: [], agents: [] });
    expect((await a.loadMur()).feedPosts[0].title).toBe("Bon dia");
    expect(await a.loadMultimedia()).toEqual({ mediaItems: [] });
    expect(await a.loadNotes()).toEqual({ notes: [], noteFolders: [] });
  } finally {
    a.destroy();
  }
  expect(m.aiRequests).toHaveLength(1);
  expect(m.requests.filter((r) => r.endpoint.includes("/api/v1/node0/")).every((r) => r.init.method === "GET")).toBe(true);
});
it.each(["refuse", "hang"])("Node0 actual auth, publishing, profile, notes and human chat survive AI %s", async (mode) => {
  m.aiMode = mode;
  const c = creaSessioNodeZeroHttp({ origin: "https://socdepoble.cat", fetchImpl: fetch, timeoutMs: 30 });
  const config = { expectedActor: U };
  try {
    await expect(c.demanaIAIA({ mode: "discover" }, config)).rejects.toHaveProperty("codi");
    for (const action of ["session", "login", "logout"]) {
      const body = action === "login" ? { email: "fixture@example.test", password: "fixture-only" } : {};
      const auth = await c.demanaAuth(action, body, action === "logout" ? config : {});
      expect(auth.operation).toBe(action);
    }
    const operations = { updateProfile: { updates: { full_name: "Veïna" } }, createNote: { input: { title: "Nota humana" } }, updateNote: { id: M, updates: { title: "Editada" }, expectedRevision: 1 }, appendSectionSubmissionNetworkOnly: { submission: { sectionId: "mur", payload: { title: "Publicació humana" } } }, enviaMissatge: { filId: F, id: M, text: "Hola", tipus: "text" }, loadMissatges: { filId: F } };
    for (const [action, body] of Object.entries(operations)) {
      const result = await c.demanaPrivat(action, body, config);
      expect(result.operation).toBe(action);
      expect(result.accepted).toEqual(body);
    }
    expect(m.aiRequests).toEqual(["https://socdepoble.cat/api/v1/node0/iaia"]);
  } finally {
    c.destroy();
  }
});
it("actual Supabase request transport keeps auth/RPC/editorial/storage calls independent of AI outage", async () => {
  await expect(fetch("https://backend.invalid/functions/v1/iaia")).rejects.toThrow("AI fixture offline");
  const config = { supabaseUrl: "https://human-backend.invalid", supabaseAnonKey: "sb_publishable_fixture" };
  for (const route of ["/auth/v1/token", "/rest/v1/app_content", "/rest/v1/rpc/xat_envia", "/rest/v1/rpc/actualitza_publicacio_propia", "/rest/v1/rpc/admin_actualitza_pagina", "/storage/v1/object/fixture"]) {
    const result = await request(route, config, { method: route.includes("rpc") ? "POST" : "GET", body: { human: true }, anonim: true });
    expect(result.ok).toBe(true);
    expect(result.path).toBe(route);
  }
  expect(m.aiRequests).toHaveLength(1);
  expect(m.requests.filter((r) => r.endpoint.startsWith(config.supabaseUrl))).toHaveLength(6);
});
it("optional actual voice degrades when AI is unavailable; human request still succeeds", async () => {
  fixaPuntNode0("https://socdepoble.cat/api/v1/node0/veu");
  const spoken = [];
  vi.stubGlobal("speechSynthesis", { getVoices: () => [{ lang: "ca-ES-valencia", name: "Fixture", voiceURI: "fixture" }], speak: (u) => {
    spoken.push(u.text);
    queueMicrotask(() => u.onend?.());
  }, cancel: () => {
  } });
  vi.stubGlobal("SpeechSynthesisUtterance", class {
    constructor(text) {
      this.text = text;
    }
  });
  const s = creaSessioVeu();
  try {
    await s.parla("Text opcional");
    expect(spoken).toEqual(["Text opcional."]);
    expect(m.aiRequests).toContain("https://socdepoble.cat/api/v1/node0/veu/salut");
  } finally {
    s.tanca();
  }
  const c = creaSessioNodeZeroHttp({ origin: "https://socdepoble.cat", fetchImpl: fetch });
  try {
    expect((await c.demanaPrivat("enviaMissatge", { filId: F, id: M, text: "Missatge humà" }, { expectedActor: U })).id).toBe(M);
  } finally {
    c.destroy();
  }
});
const group = { id: F, tipus: "grup", subjecte: { tipus: "pagina", id: "/beta" } };
function chat() {
  const base = { modeDades: "remote", joId: U, ambitEstable: "offline-test", senseSessio: false, chatThreads: [group], sendChatMessage: vi.fn(async () => [{ id: M, seq: 1, usuariId: U }]), getThreadMessages: () => [], recarregaFil: vi.fn() };
  const wrapper = ({ children }) => /* @__PURE__ */ React.createElement(XatContext.Provider, { value: base }, /* @__PURE__ */ React.createElement(IAIAProvider, null, children));
  return { ...renderHook(useXat, { wrapper }), base };
}
it.each(["refuse", "hang"])("actual chat provider returns committed human messages while AI %s", async (mode) => {
  m.assistant.mockImplementation((input, options) => input.mode === "discover" ? Promise.resolve({ available: true, group: { threadId: F, botId: B } }) : transport("https://human-backend.invalid/functions/v1/iaia", { signal: options.signal }));
  const h = chat();
  await waitFor(() => expect(m.assistant).toHaveBeenCalledTimes(1));
  m.aiMode = mode;
  let result;
  await act(async () => {
    result = await h.result.current.sendChatMessage(group, "@iaia ajuda opcional");
  });
  expect(result).toEqual([{ id: M, seq: 1, usuariId: U }]);
  expect(h.base.sendChatMessage).toHaveBeenCalledTimes(1);
  expect(m.aiRequests).toHaveLength(1);
  await act(async () => {
    expect(await h.result.current.sendChatMessage(group, "Bon dia, veïns")).toEqual(result);
  });
  expect(h.base.sendChatMessage).toHaveBeenCalledTimes(2);
  expect(m.aiRequests).toHaveLength(1);
});
it("actual deployment iOS/Android plans and dry-run entrypoints require no AI or native execution", async () => {
  await expect(fetch("http://192.168.0.20:11434/api/generate")).rejects.toThrow("AI fixture offline");
  fs.mkdirSync(path.join(m.root, "android/app"), { recursive: true });
  fs.writeFileSync(path.join(m.root, "android/app/build.gradle"), `versionName "1.2.22"
versionCode ${VERSIO_CLIENT_NATIU}
`);
  expect(await android.main(["--versio", "1.2.22", "--build", String(VERSIO_CLIENT_NATIU)])).toBe(0);
  if (process.platform === "darwin") expect(await ios.main(["--versio", "1.2.22", "--build", String(VERSIO_CLIENT_NATIU)])).toBe(0);
  const plan = ios.planIos({ arrel: m.root, valors: m.valors, versio: "1.2.22", build: VERSIO_CLIENT_NATIU, projecte: { opcio: "-project", cami: "fixture.xcodeproj" } });
  expect(plan.puja("/fixture/App.ipa")[1]).toContain("--upload-app");
  expect(m.native).toEqual([]);
  expect(m.aiRequests).toHaveLength(1);
});
it("actual WordPress API entrypoint uses fixture GET and every Jarvis channel passes a stubbed dry run", async () => {
  await expect(fetch("https://api.openai.com/v1/responses")).rejects.toThrow("AI fixture offline");
  expect(await wordpress.main(["--comprova-api"], { consultaApi: () => wordpress.consultaApi({ fetch: transport }) })).toBe(0);
  const events = [];
  expect(await publica.correProtocolJarvis({ arrel: m.root, canals: ["web", "wordpress", "android", "ios"], sec: true, surt: (line) => events.push(JSON.parse(line)) })).toBe(0);
  expect(events.filter((e) => e.estat === "fet").map((e) => e.pas)).toEqual(["web", "wordpress", "android", "ios"]);
  expect(m.native).toEqual([]);
  expect(m.aiRequests).toHaveLength(1);
});
it("actual prepared-tree validator dispatch works with tools stubbed and AI refused", async () => {
  await expect(fetch("http://192.168.0.20:11434/api/generate")).rejects.toThrow("AI fixture offline");
  const dependencies = path.join(m.root, "dependencies"), prepared = path.join(m.root, "prepared");
  fs.mkdirSync(dependencies);
  fs.mkdirSync(prepared);
  const calls = [];
  executaValidadors(prepared, {}, { origen: dependencies, run: (cmd, args) => {
    calls.push({ cmd, args });
    return "";
  } });
  expect(calls.map((c) => c.args)).toEqual(PASSOS_HOOK.map((p) => [...p.args]));
  expect(m.aiRequests).toHaveLength(1);
});
