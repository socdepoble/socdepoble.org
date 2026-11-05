#!/usr/bin/env node

// tooling/node0/verifica-restauracio-node0.mjs
import fs3 from "node:fs";
import os2 from "node:os";
import path2 from "node:path";
import { createHash, randomBytes } from "node:crypto";
import { spawn } from "node:child_process";
import { pathToFileURL } from "node:url";

// tooling/node0/custodia-age-node0.mjs
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
var fail = (code) => {
  throw new Error(code);
};
function inspeccionaCustodiaAge({ homeDir = os.homedir(), lstat = fs.lstatSync } = {}) {
  if (typeof homeDir !== "string" || !path.isAbsolute(homeDir) || path.normalize(homeDir) !== homeDir || /[\r\n\0\\]/.test(homeDir)) fail("custody_home_invalid");
  let current = homeDir;
  try {
    const home = lstat(current);
    if (!home.isDirectory() || home.isSymbolicLink()) throw Error();
    for (const part of [".config", "socdepoble"]) {
      current = path.join(current, part);
      const s = lstat(current);
      if (!s.isDirectory() || s.isSymbolicLink()) throw Error();
    }
    lstat(path.join(current, "workspace-node0.agekey"));
    return { schema: "sdp.node0.age-custody.v1", metadataChecked: true, legacyLocalIdentityPresent: true, localIdentityAbsenceProven: false, externalCustodyVerified: false, r5CustodyClosed: false, code: "custody_legacy_local_identity_present" };
  } catch (error) {
    if (error?.code === "ENOENT") return { schema: "sdp.node0.age-custody.v1", metadataChecked: true, legacyLocalIdentityPresent: false, localIdentityAbsenceProven: true, externalCustodyVerified: false, r5CustodyClosed: false, code: "custody_external_evidence_unproven" };
    return { schema: "sdp.node0.age-custody.v1", metadataChecked: false, legacyLocalIdentityPresent: null, localIdentityAbsenceProven: false, externalCustodyVerified: false, r5CustodyClosed: false, code: "custody_metadata_unproven" };
  }
}
function exigeixAbsenciaIdentitatLocal(options) {
  const observation = inspeccionaCustodiaAge(options);
  if (!observation.localIdentityAbsenceProven) fail(observation.code);
  return observation;
}

// tooling/node0/identitat-age-pipe-node0.mjs
import fs2 from "node:fs";
var fail2 = (code) => {
  throw new Error(code);
};
var PREFIX = Buffer.from(["AGE-", "SECRET-KEY-1"].join(""));
var ALPHABET = Buffer.from("QPZRY9X8GF2TVDW0S3JN54KHCE6MUA7L");
function validaIdentitatAgeMemoria(bytes) {
  if (!(bytes instanceof Uint8Array) || bytes.byteLength < 74 || bytes.byteLength > 8192) fail2("restore_identity_invalid");
  let key = null, offset = 0;
  while (offset < bytes.length) {
    let end = offset;
    while (end < bytes.length && bytes[end] !== 10) end++;
    let stop = end;
    if (stop > offset && bytes[stop - 1] === 13) stop--;
    const line = bytes.subarray(offset, stop);
    offset = end + 1;
    if (line.length === 0 || line[0] === 35) continue;
    if (key || line.length !== PREFIX.length + 58 || !line.subarray(0, PREFIX.length).equals(PREFIX)) fail2("restore_identity_invalid");
    key = line;
  }
  if (!key) fail2("restore_identity_invalid");
  const values = [];
  for (const c of key.subarray(PREFIX.length)) {
    const index = ALPHABET.indexOf(c);
    if (index < 0) fail2("restore_identity_invalid");
    values.push(index);
  }
  const hrp = "age-secret-key-", expanded = [...[...hrp].map((c) => c.charCodeAt(0) >> 5), 0, ...[...hrp].map((c) => c.charCodeAt(0) & 31)];
  let chk = 1;
  for (const v of [...expanded, ...values]) {
    const top = chk >>> 25;
    chk = (chk & 33554431) << 5 ^ v;
    for (let i = 0; i < 5; i++) if (top >>> i & 1) chk ^= [996825010, 642813549, 513874426, 1027748829, 705979059][i];
  }
  if (chk >>> 0 !== 1 || values[51] % 16 !== 0) fail2("restore_identity_invalid");
  return true;
}
function llegeixIdentitatAgePipe(stream, { timeoutMs = 15e3 } = {}) {
  if (!stream || !Number.isInteger(stream.fd) || !Number.isInteger(timeoutMs) || timeoutMs < 1 || timeoutMs > 3e4) fail2("restore_identity_pipe_required");
  const info = fs2.fstatSync(stream.fd);
  if (stream.isTTY || !(info.isFIFO() || info.isSocket()) || info.nlink !== 0) fail2("restore_identity_pipe_required");
  return new Promise((resolve, reject) => {
    const buffer = Buffer.alloc(8192);
    let size = 0, settled = false;
    const finish = (cause) => {
      if (settled) return;
      settled = true;
      clearTimeout(timer);
      stream.off("data", data);
      stream.off("end", end);
      stream.off("error", failed);
      stream.off("close", closed);
      stream.pause();
      if (cause) {
        buffer.fill(0);
        reject(new Error(cause));
        return;
      }
      try {
        validaIdentitatAgeMemoria(buffer.subarray(0, size));
        resolve(buffer.subarray(0, size));
      } catch {
        buffer.fill(0);
        reject(new Error("restore_identity_invalid"));
      }
    };
    const data = (chunk) => {
      if (!(chunk instanceof Uint8Array) || size + chunk.length > buffer.length) return finish("restore_identity_limit");
      buffer.set(chunk, size);
      size += chunk.length;
    };
    const end = () => finish(), failed = () => finish("restore_identity_pipe_failed"), closed = () => {
      if (!stream.readableEnded) finish("restore_identity_pipe_failed");
    };
    const timer = setTimeout(() => finish("restore_identity_timeout"), timeoutMs);
    stream.on("data", data);
    stream.once("end", end);
    stream.once("error", failed);
    stream.once("close", closed);
  });
}

// tooling/node0/verifica-restauracio-node0.mjs
var HOME = "/Users/javi";
var POSTGRES_BIN = HOME + "/local/postgres17/Postgres.app/Contents/Versions/17/bin/";
var AGE = HOME + "/local/age-v1.3.2/age";
var SOCKET = HOME + "/socdepoble-node0/dades/run/postgres17";
var REAL = /* @__PURE__ */ Symbol("native-proof");
var AGE_SHA = "4012dfc2725883beafb710894af4f599b7a94f8c8e0f51f02cc96ab8df33915e";
var fail3 = (code) => {
  throw new Error(code);
};
var nomRestauracioValid = (name) => typeof name === "string" && /^node0_restore_[a-f0-9]{16}$/.test(name);
var fields = (info) => [info.dev, info.ino, info.size, info.mtimeMs, info.ctimeMs, info.mode, info.nlink];
var same = (a, b) => JSON.stringify(a) === JSON.stringify(b);
function obriRegularRestauracio(file, { mode = null, maxBytes = 512 * 1024 * 1024, minBytes = 1 } = {}) {
  if (typeof file !== "string" || !path2.isAbsolute(file) || /[\r\n\0\\]/.test(file)) fail3("restore_file_path_invalid");
  let target = path2.resolve(file);
  if (process.platform === "darwin") {
    for (const [a, b] of [["/tmp", "/private/tmp"], ["/var", "/private/var"]]) if (target.startsWith(a + "/")) {
      let link;
      try {
        link = fs3.readlinkSync(a);
      } catch {
        continue;
      }
      if ([b, b.slice(1)].includes(link)) target = b + target.slice(a.length);
    }
  }
  let current = path2.parse(target).root;
  for (const part of path2.relative(current, path2.dirname(target)).split(path2.sep).filter(Boolean)) {
    current = path2.join(current, part);
    const s = fs3.lstatSync(current);
    if (!s.isDirectory() || s.isSymbolicLink()) fail3("restore_parent_unsafe");
  }
  const fd = fs3.openSync(target, fs3.constants.O_RDONLY | fs3.constants.O_NOFOLLOW | fs3.constants.O_NONBLOCK);
  try {
    const info = fs3.fstatSync(fd), named = fs3.lstatSync(target);
    if (!info.isFile() || info.nlink !== 1 || info.uid !== process.getuid() || info.size < minBytes || info.size > maxBytes || info.mode & 3584 || mode !== null && (info.mode & 511) !== mode || info.dev !== named.dev || info.ino !== named.ino || named.isSymbolicLink()) fail3("restore_file_unsafe");
    return { fd, info, target };
  } catch (error) {
    fs3.closeSync(fd);
    throw error;
  }
}
function hashCipherRestauracio(held, expected) {
  if (!/^[a-f0-9]{64}$/.test(expected)) fail3("restore_cipher_pin_invalid");
  const magic = Buffer.from("age-encryption.org/v1\n"), header = Buffer.alloc(magic.length);
  if (fs3.readSync(held.fd, header, 0, header.length, 0) !== magic.length || !header.equals(magic)) fail3("restore_cipher_header_invalid");
  const h = createHash("sha256"), buffer = Buffer.alloc(1024 * 1024);
  let offset = 0, read;
  while ((read = fs3.readSync(held.fd, buffer, 0, buffer.length, offset)) > 0) {
    h.update(buffer.subarray(0, read));
    offset += read;
  }
  if (h.digest("hex") !== expected || !same(fields(held.info), fields(fs3.fstatSync(held.fd)))) fail3("restore_cipher_pin_mismatch");
  return true;
}
function assertHeld(held) {
  if (!same(fields(held.info), fields(fs3.fstatSync(held.fd)))) fail3("restore_input_changed");
}
function env(database) {
  return { PATH: "/usr/bin:/bin", LC_ALL: "C", PGHOST: SOCKET, PGPORT: "5432", PGUSER: "javi", PGDATABASE: database, PGPASSFILE: "/dev/null", PGSERVICEFILE: "/dev/null", PGCONNECT_TIMEOUT: "5", PGOPTIONS: "-c log_statement=none -c log_min_error_statement=panic -c log_min_messages=panic -c log_parameter_max_length=0 -c log_parameter_max_length_on_error=0" };
}
function command(binary, args, database = "postgres", timeout = 2e4) {
  return new Promise((resolve, reject) => {
    const child = spawn(binary, args, { env: env(database), shell: false, stdio: ["ignore", "pipe", "ignore"] }), chunks = [];
    let length = 0, invalid = false;
    const timer = setTimeout(() => {
      invalid = true;
      child.kill("SIGKILL");
    }, timeout);
    child.stdout.on("data", (chunk) => {
      length += chunk.length;
      if (length > 512 * 1024) {
        invalid = true;
        child.kill("SIGKILL");
      } else chunks.push(Buffer.from(chunk));
    });
    child.on("error", () => {
      invalid = true;
    });
    child.on("close", (code) => {
      clearTimeout(timer);
      if (invalid || code !== 0) return reject(new Error("restore_command_failed"));
      try {
        resolve(new TextDecoder("utf-8", { fatal: true }).decode(Buffer.concat(chunks, length)).trim());
      } catch {
        reject(new Error("restore_command_protocol"));
      }
    });
  });
}
function json(text) {
  try {
    return JSON.parse(text);
  } catch {
    fail3("restore_command_protocol");
  }
}
var CONTROL = ["-X", "-w", "-qAt", "-v", "ON_ERROR_STOP=1", "-v", "VERBOSITY=sqlstate", "--dbname=postgres"];
function control(sql) {
  return command(POSTGRES_BIN + "psql", [...CONTROL, "-c", sql]);
}
function ownershipQuery(name) {
  if (!nomRestauracioValid(name)) fail3("restore_database_name_invalid");
  return `SELECT row_to_json(t) FROM (SELECT oid::text AS oid,pg_get_userbyid(datdba) AS owner,shobj_description(oid,'pg_database') AS proof FROM pg_database WHERE datname='${name}') t`;
}
async function restauraAmbIdentitatPipe(cipher, identity, name, { spawnImpl = spawn, timeoutMs = 18e4 } = {}) {
  let decrypt, restore, timer, failed = false;
  const stop = () => {
    failed = true;
    decrypt?.kill("SIGKILL");
    restore?.kill("SIGKILL");
  };
  try {
    if (!nomRestauracioValid(name) || !Number.isSafeInteger(timeoutMs) || timeoutMs < 1 || timeoutMs > 18e4) fail3("restore_database_name_invalid");
    assertHeld(cipher);
    validaIdentitatAgeMemoria(identity);
    decrypt = spawnImpl(AGE, ["--decrypt", "--identity", "/dev/fd/3"], { env: env(name), shell: false, stdio: [cipher.fd, "pipe", "ignore", "pipe"] });
    decrypt.once("error", stop);
    restore = spawnImpl(POSTGRES_BIN + "pg_restore", ["-w", "--no-owner", "--no-privileges", "--exit-on-error", "--single-transaction", "--dbname=" + name], { env: env(name), shell: false, stdio: ["pipe", "ignore", "ignore"] });
    restore.once("error", stop);
    const done = (child) => new Promise((resolve, reject) => {
      child.once("error", () => {
        stop();
        reject(new Error("restore_stream_failed"));
      });
      child.once("close", (code) => {
        if (code !== 0) {
          stop();
          reject(new Error("restore_stream_failed"));
        } else resolve();
      });
    });
    const completions = Promise.allSettled([done(decrypt), done(restore)]);
    const deadline = new Promise((_, reject) => {
      timer = setTimeout(() => {
        stop();
        reject(new Error("restore_stream_failed"));
      }, timeoutMs);
    });
    decrypt.stdio[3].on("error", stop);
    decrypt.stdout.on("error", stop);
    restore.stdin.on("error", stop);
    decrypt.stdio[3].end(identity);
    decrypt.stdout.pipe(restore.stdin);
    const results = await Promise.race([completions, deadline]);
    if (failed || results.some((value) => value.status !== "fulfilled")) fail3("restore_stream_failed");
    assertHeld(cipher);
  } catch {
    stop();
    fail3("restore_stream_failed");
  } finally {
    clearTimeout(timer);
    decrypt?.stdout?.unpipe(restore?.stdin);
    decrypt?.stdio?.[3]?.destroy();
    identity?.fill(0);
  }
}
function nativeRuntime(cipher, identity) {
  return {
    [REAL]: true,
    async versions() {
      const value = await command(POSTGRES_BIN + "pg_restore", ["--version"]);
      if (!/\b17\./.test(value)) fail3("restore_pg_version_unsupported");
    },
    async create(name) {
      if (!nomRestauracioValid(name)) fail3("restore_database_name_invalid");
      await command(POSTGRES_BIN + "createdb", ["-w", "--template=template0", "--encoding=UTF8", "--locale=C", "--maintenance-db=postgres", name]);
    },
    async mark(name, token) {
      return json(await control(`COMMENT ON DATABASE "${name}" IS '${token}'; ${ownershipQuery(name)};`));
    },
    async owned(name) {
      return json(await control(ownershipQuery(name)));
    },
    async drop(name) {
      if (!nomRestauracioValid(name)) fail3("restore_database_name_invalid");
      await command(POSTGRES_BIN + "dropdb", ["-w", "--maintenance-db=postgres", name]);
    },
    async restore(name) {
      return restauraAmbIdentitatPipe(cipher, identity, name);
    },
    async counts(name) {
      return json(await command(POSTGRES_BIN + "psql", ["-X", "-w", "-qAt", "-v", "ON_ERROR_STOP=1", "-v", "VERBOSITY=sqlstate", "--dbname=" + name, "-c", `SELECT json_build_object('database',current_database(),'serverMajor',current_setting('server_version_num')::int/10000,'tables',(SELECT count(*) FROM pg_class c JOIN pg_namespace n ON n.oid=c.relnamespace WHERE c.relkind='r' AND n.nspname IN ('public','node0','private','auth')),'migrations',(SELECT count(*) FROM node0.schema_migrations),'publicDocuments',(SELECT count(*) FROM node0.public_documents),'profiles',(SELECT count(*) FROM public.profiles),'notes',(SELECT count(*) FROM public.notes),'appContent',(SELECT count(*) FROM public.app_content));`], name));
    }
  };
}
async function provaRestauracioAmbRuntime(runtime, { suffix = randomBytes(8).toString("hex"), token = randomBytes(16).toString("hex") } = {}) {
  const name = "node0_restore_" + suffix;
  if (!nomRestauracioValid(name) || !/^[a-f0-9]{32}$/.test(token)) fail3("restore_database_name_invalid");
  let created = false, owner = null, result = null, failure = null, dropped = false;
  try {
    await runtime.versions();
    await runtime.create(name);
    created = true;
    owner = await runtime.mark(name, token);
    if (!owner || !/^[0-9]+$/.test(owner.oid ?? "") || owner.owner !== "javi" || owner.proof !== token) fail3("restore_ownership_unproven");
    await runtime.restore(name);
    const counts = await runtime.counts(name);
    if (!counts || counts.database !== name || counts.serverMajor !== 17 || counts.migrations !== 75 || !Number.isInteger(counts.tables) || counts.tables < 1 || ["publicDocuments", "profiles", "notes", "appContent"].some((key) => !Number.isInteger(counts[key]) || counts[key] < 0)) fail3("restore_counts_invalid");
    const safeCounts = Object.fromEntries(["serverMajor", "tables", "migrations", "publicDocuments", "profiles", "notes", "appContent"].map((key) => [key, counts[key]]));
    result = { counts: safeCounts, restoreCommandsSucceeded: true, nativeRestoreVerified: runtime[REAL] === true, cleanMachineRestoreVerified: false, aclRestored: false, rolesChanged: false, plaintextDumpWritten: false, privateKeyLogged: false, privateIdentityFileRead: false, identityTransport: "anonymous-pipe", externalCustodyVerified: false, r5CustodyClosed: false };
  } catch (error) {
    failure = error;
  } finally {
    if (created && owner && owner.owner === "javi" && owner.proof === token) {
      try {
        const current = await runtime.owned(name);
        if (!current || current.oid !== owner.oid || current.owner !== owner.owner || current.proof !== owner.proof) fail3("restore_cleanup_ownership_changed");
        await runtime.drop(name);
        dropped = true;
      } catch {
        failure = new Error("restore_owned_cleanup_refused_or_failed");
      }
    } else if (created) failure = new Error("restore_ownership_unproven_cleanup_refused");
  }
  if (failure) throw Object.assign(new Error(/^restore_[a-z_]+$/.test(failure?.message ?? "") ? failure.message : "restore_failed"), { newDisposableDatabaseCreated: created, ownedDisposableDatabaseDropped: dropped });
  return { ...result, newDisposableDatabaseCreated: created, ownedDisposableDatabaseDropped: dropped };
}
async function verificaRestauracioNodeZero(value) {
  if (!value || typeof value !== "object" || Array.isArray(value) || Object.getPrototypeOf(value) !== Object.prototype || Object.keys(value).some((key) => !["ciphertextPath", "expectedSha256", "apply", "identityStdin"].includes(key))) fail3("restore_options_invalid");
  if (typeof value.ciphertextPath !== "string" || !path2.isAbsolute(value.ciphertextPath) || !value.ciphertextPath.endsWith(".dump.age") || /[\r\n\0]/.test(value.ciphertextPath) || !/^[a-f0-9]{64}$/.test(value.expectedSha256 ?? "")) fail3("restore_input_required");
  if (value.identityStdin !== void 0 && typeof value.identityStdin !== "boolean") fail3("restore_options_invalid");
  if (value.apply !== void 0 && typeof value.apply !== "boolean") fail3("restore_options_invalid");
  if (value.apply !== true) return { apply: false, newDatabasePattern: "node0_restore_<16hex>", template: "template0", willWritePlaintextDump: false, identityPipeRequired: true, privateIdentityFileAccepted: false, externalCustodyVerified: false, r5CustodyClosed: false, cleanMachineRestoreVerified: false };
  if (value.identityStdin !== true) fail3("restore_identity_pipe_required");
  if (process.platform !== "darwin" || os2.arch() !== "arm64" || os2.homedir() !== HOME || os2.userInfo().username !== "javi" || !Object.values(os2.networkInterfaces()).flat().some((item) => item?.address === "192.168.0.23")) fail3("restore_node0_machine_required");
  exigeixAbsenciaIdentitatLocal({ homeDir: HOME });
  const held = [];
  let identity = null;
  try {
    const cipher = obriRegularRestauracio(value.ciphertextPath);
    held.push(cipher.fd);
    hashCipherRestauracio(cipher, value.expectedSha256);
    identity = await llegeixIdentitatAgePipe(process.stdin);
    const binary = obriRegularRestauracio(AGE, { mode: 493, minBytes: 1, maxBytes: 16 * 1024 * 1024 });
    held.push(binary.fd);
    if (createHash("sha256").update(fs3.readFileSync(binary.fd)).digest("hex") !== AGE_SHA) fail3("restore_age_binary_pin");
    for (const name of ["createdb", "dropdb", "pg_restore", "psql"]) {
      const tool = obriRegularRestauracio(POSTGRES_BIN + name, { mode: 493, minBytes: 1, maxBytes: 32 * 1024 * 1024 });
      held.push(tool.fd);
    }
    return await provaRestauracioAmbRuntime(nativeRuntime(cipher, identity));
  } finally {
    identity?.fill(0);
    for (const fd of held) fs3.closeSync(fd);
  }
}
async function mainRestauracio(argv = process.argv.slice(2)) {
  try {
    const input = {};
    for (let index = 0; index < argv.length; index++) {
      const arg = argv[index];
      if (arg === "--apply" || arg === "--identity-stdin") {
        const key = arg === "--apply" ? "apply" : "identityStdin";
        if (input[key] !== void 0) fail3("restore_arguments_invalid");
        input[key] = true;
      } else {
        const name = { "--ciphertext": "ciphertextPath", "--sha256": "expectedSha256" }[arg];
        if (!name || input[name] !== void 0 || !argv[index + 1]) fail3("restore_arguments_invalid");
        input[name] = argv[++index];
      }
    }
    process.stdout.write(JSON.stringify(await verificaRestauracioNodeZero(input)) + "\n");
  } catch (error) {
    process.stderr.write(JSON.stringify({ ok: false, error: /^(?:restore_[a-z_]+|custody_legacy_local_identity_present|custody_metadata_unproven)$/.test(error?.message ?? "") ? error.message : "restore_failed", newDisposableDatabaseCreated: error?.newDisposableDatabaseCreated === true, ownedDisposableDatabaseDropped: error?.ownedDisposableDatabaseDropped === true }) + "\n");
    process.exitCode = 1;
  }
}
if (process.argv[1] && import.meta.url === pathToFileURL(path2.resolve(process.argv[1])).href) await mainRestauracio();
export {
  hashCipherRestauracio,
  mainRestauracio,
  nomRestauracioValid,
  obriRegularRestauracio,
  provaRestauracioAmbRuntime,
  restauraAmbIdentitatPipe,
  verificaRestauracioNodeZero
};
