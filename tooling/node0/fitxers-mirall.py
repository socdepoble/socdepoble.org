#!/usr/bin/env python3
"""AH11 LAB filesystem capability worker (Python3.9 stdlib).
No source traversal or recursive copy. Every ancestor/leaf is opened NOFOLLOW;
files require nlink1. A cooperative lock excludes other exports, not an
independent administrator. Unreferenced failed generations are never reused.
"""
import os
import sys
import stat
import json
import re
import hashlib
import base64
import secrets
import unicodedata
import fcntl
import hmac
import io
import gzip
import zipfile
import binascii
import datetime

FLAGS = os.O_RDONLY | os.O_DIRECTORY | os.O_NOFOLLOW
LIMIT = 128 * 1024 * 1024
TOTAL = 256 * 1024 * 1024
LOCK = '.mirror-export.lock'
FOLDERS = ('01_Publicacions_i_Croniques', '02_Multimedia_i_Patrimoni',
           '03_Paquets_OpenData_Municipals', '04_Snapshots_PostgreSQL',
           '05_Recepta_Restauracio_Node0')
GEN = re.compile(r'^[0-9]{8}T[0-9]{6}Z-[a-f0-9]{16}$')
HASH = re.compile(r'^[a-f0-9]{64}$')
# One separately sealed unsigned R7 checkpoint. No request or environment can
# supply alternative commitments. Ordinary inspect always requires its HMAC.
R7_SEALED_CHECKPOINT = {
    'generation':'20261104T212515Z-ef95f03c414aefb7',
    'manifestSha256':'71fd6fabbedb16df44af41fa942babd9ca02e0759841a416a3f0daac6d837eb9',
    'sumsSha256':'5a9228938f025ed6e2c06d9ab49a55b6dd5752dba7ecba02ed6b4ac62bb8dc5d',
}
R7_BOOTSTRAP_APPROVAL = 'seal-exact-r7-checkpoint-20261104T212515Z-ef95f03c414aefb7'

def bad(code):
    raise RuntimeError(code)

# One twelve-rule scanner. The same function is called on preflight input,
# reread publication bytes, and the final complete generation. No values leak.
SECRET_PATTERNS = (
    ('private-key', re.compile(b'PRI' + b'VATE KEY', re.I)),
    ('ed25519-pkcs8', re.compile(b'\\x30\\x2e\\x02\\x01\\x00\\x30\\x05\\x06\\x03\\x2b\\x65\\x70\\x04\\x22\\x04\\x20|' + b'MC4CAQAwB' + b'QYDK2VwBCIEI')),
    ('sdp-assignment', re.compile(rb'(?:^|[;\n])[ \t]*(?:(?:const|let|var)[ \t]+)?SDP_[A-Z_]*[ \t]*=', re.M)),
    ('mastodon-assignment', re.compile(rb'(?:^|[;\n])[ \t]*(?:(?:const|let|var)[ \t]+)?MASTODON_[A-Z_]*[ \t]*=', re.M)),
    ('smtp-assignment', re.compile(rb'(?:^|[;\n])[ \t]*(?:(?:const|let|var)[ \t]+)?SMTP_[A-Z_]*[ \t]*=', re.M)),
    ('pg-assignment', re.compile(rb'(?:^|[;\n])[ \t]*(?:(?:const|let|var)[ \t]+)?PG[A-Z_]*[ \t]*=', re.M)),
    ('tunnel-secret', re.compile(b'Tunnel' + b'Secret', re.I)),
    ('account-tag', re.compile(b'Account' + b'Tag', re.I)),
    ('age-identity', re.compile(b'AGE-' + b'SECRET-KEY-1', re.I)),
    ('supabase-secret', re.compile(b'sb_' + b'secret_', re.I)),
    ('service-role-jwt', re.compile(rb'[A-Za-z0-9_-]{2,}\.[A-Za-z0-9_-]{2,}\.[A-Za-z0-9_-]{2,}')),
    ('bearer', re.compile(b'Bear' + b'er ', re.I)),
)

def scan_markers(data):
    for label, pattern in SECRET_PATTERNS:
        if label == 'service-role-jwt':
            for match in pattern.finditer(data):
                try:
                    middle = match.group().split(b'.')[1]
                    value = json.loads(base64.urlsafe_b64decode(middle + b'=' * (-len(middle) % 4)))
                    if isinstance(value, dict) and value.get('role') == 'service_role':
                        bad('mirror_plaintext_secret_marker')
                except (ValueError, UnicodeError, binascii.Error):
                    pass
        elif pattern.search(data):
            bad('mirror_plaintext_secret_marker')

def scan(data, depth=0, budget=None):
    if budget is None:
        budget = {'bytes':0, 'entries':0}
    if depth > 3:
        bad('mirror_archive_depth_limit')
    budget['bytes'] += len(data)
    if budget['bytes'] > TOTAL:
        bad('mirror_archive_byte_limit')
    scan_markers(data)
    # Decode JSON scalar strings as well: quoting/escaped newlines must not
    # hide a credential assignment in a public DTO from the same scanner.
    if data.lstrip().startswith((b'{', b'[')):
        try:
            decoded = json.loads(data)
        except (ValueError, UnicodeError):
            decoded = None
        def strings(value, nesting=0):
            if nesting > 64:
                bad('mirror_json_depth_limit')
            if isinstance(value, str):
                # Already decoded JSON strings are plain UTF-8. Scan them
                # directly so a string containing JSON cannot recurse forever.
                raw = value.encode('utf8')
                scan_markers(raw)
            elif isinstance(value, list):
                for item in value:
                    strings(item, nesting + 1)
            elif isinstance(value, dict):
                for key, item in value.items():
                    strings(key, nesting + 1)
                    strings(item, nesting + 1)
        strings(decoded)
    if data.startswith((b'PK\x03\x04', b'PK\x05\x06')) or zipfile.is_zipfile(io.BytesIO(data)):
        try:
            with zipfile.ZipFile(io.BytesIO(data)) as archive:
                for entry in archive.infolist():
                    budget['entries'] += 1
                    if budget['entries'] > 10000 or entry.file_size > LIMIT or entry.flag_bits & 1:
                        bad('mirror_archive_limit')
                    scan(entry.filename.encode('utf8'), depth + 1, budget)
                    if not entry.is_dir():
                        with archive.open(entry) as member:
                            payload = member.read(LIMIT + 1)
                        if len(payload) > LIMIT:
                            bad('mirror_archive_byte_limit')
                        scan(payload, depth + 1, budget)
        except (zipfile.BadZipFile, NotImplementedError, OSError, EOFError):
            bad('mirror_archive_invalid')
    elif data.startswith(b'\x1f\x8b'):
        try:
            with gzip.GzipFile(fileobj=io.BytesIO(data)) as stream:
                payload = stream.read(LIMIT + 1)
            if len(payload) > LIMIT:
                bad('mirror_archive_byte_limit')
            scan(payload, depth + 1, budget)
        except (OSError, EOFError):
            bad('mirror_archive_invalid')

def reviewed_source(req, source):
    root = source.get('root')
    kind = source.get('kind')
    if kind not in ('media', 'opendata', 'restore') or not isinstance(root, str) or not root.startswith('/'):
        bad('mirror_source_roots_invalid')
    relative(root.lstrip('/'))
    relative(source.get('path'))
    caps = req.get('reviewedSourceRoots')
    if not isinstance(caps, list) or len(caps) > 32 or not any(c == {'kind':kind, 'root':root} for c in caps):
        bad('mirror_source_root_not_reviewed')
    return open_root(root)

def authentication_key(config, mirror_path):
    if not isinstance(config, dict) or set(config) != {'keyFile', 'keyId'} or not re.fullmatch(r'[a-zA-Z0-9_-]{1,64}', config.get('keyId', '')):
        bad('mirror_authentication_required')
    filename = config.get('keyFile')
    if not isinstance(filename, str) or not filename.startswith('/') or os.path.normpath(filename) != filename:
        bad('mirror_authentication_invalid')
    # This key is a separately provisioned local capability, never a file from
    # the synchronized mirror or its account. Parent and leaf are FD pinned.
    if any(p.casefold() in ('cloudstorage', 'library') or p.casefold().startswith('googledrive') for p in filename.split('/')):
        bad('mirror_authentication_must_be_local')
    if os.path.commonpath((native_absolute(filename), native_absolute(mirror_path))) == native_absolute(mirror_path):
        bad('mirror_authentication_must_be_local')
    parent, leaf = os.path.split(filename)
    fd = open_root(parent)
    try:
        owner_directory(fd)
        if stat.S_IMODE(os.fstat(fd).st_mode) != 0o700:
            bad('mirror_authentication_permissions')
        s = os.stat(leaf, dir_fd=fd, follow_symlinks=False)
        if stat.S_IMODE(s.st_mode) != 0o600:
            bad('mirror_authentication_permissions')
        key = read(fd, leaf, 64)
        if len(key) != 32:
            bad('mirror_authentication_invalid')
        return key, config['keyId']
    finally:
        os.close(fd)

def auth_bytes(manifest, sums, auth):
    key, key_id = auth
    message = b'sdp.node0.mirror.authentication.v1\x00' + manifest + b'\x00' + sums
    return (json.dumps({'schema':'sdp.node0.mirror.authentication.v1', 'algorithm':'HMAC-SHA256', 'keyId':key_id, 'mac':hmac.new(key, message, hashlib.sha256).hexdigest()}, sort_keys=True, separators=(',', ':')) + '\n').encode('utf8')

def validate_snapshot_ledger(manifest):
    snapshot = manifest.get('snapshot')
    if not isinstance(snapshot, dict):
        bad('mirror_snapshot_ledger_invalid')
    # Legacy manifests remain usable with a separate trusted manual source.
    if 'migrationLedger' not in snapshot and 'migrationLedgerCapture' not in snapshot:
        if snapshot.get('consistent') == 'pg_dump-transaction':
            return
        bad('mirror_snapshot_ledger_invalid')
    ledger, capture = snapshot.get('migrationLedger'), snapshot.get('migrationLedgerCapture')
    if not isinstance(ledger, dict) or set(ledger) != {'migrations', 'migrationLedgerSha256'} or type(ledger.get('migrations')) is not int or not 1 <= ledger['migrations'] <= 9007199254740991 or not isinstance(ledger.get('migrationLedgerSha256'), str) or not HASH.fullmatch(ledger['migrationLedgerSha256']):
        bad('mirror_snapshot_ledger_invalid')
    if not isinstance(capture, dict) or set(capture) != {'method', 'isolation', 'readOnly', 'nativeVerified'} or capture.get('method') != 'pg-exported-snapshot' or capture.get('isolation') != 'repeatable read' or capture.get('readOnly') is not True or capture.get('nativeVerified') is not False or snapshot.get('consistent') != 'pg-exported-snapshot':
        bad('mirror_snapshot_ledger_invalid')

def remove_tree(parent, name, budget=None):
    # Only called for unselected generation/staging directories under the
    # held export lock. Do not follow links or touch an independently moved root.
    if budget is None:
        budget = {'entries':0}
    fd = os.open(name, FLAGS, dir_fd=parent)
    try:
        owner_directory(fd)
        for child in os.listdir(fd):
            relative(child)
            budget['entries'] += 1
            if budget['entries'] > 21000:
                bad('mirror_cleanup_limit')
            s = os.stat(child, dir_fd=fd, follow_symlinks=False)
            if stat.S_ISDIR(s.st_mode):
                remove_tree(fd, child, budget)
            elif stat.S_ISREG(s.st_mode) and s.st_nlink == 1 and s.st_uid == os.getuid():
                os.unlink(child, dir_fd=fd)
            else:
                bad('mirror_cleanup_unsafe')
        os.fsync(fd)
    finally:
        os.close(fd)
    os.rmdir(name, dir_fd=parent)
    os.fsync(parent)

def retention_keep(rows, now, current_name):
    # At most one generation per UTC day in the most recent 30 days,
    # plus one per prior 12 calendar months. CURRENT wins its daily slot.
    today = now.astimezone(datetime.timezone.utc).date()
    daily = {}
    monthly = {}
    for name, instant in sorted(rows, key=lambda row:(row[0] == current_name, row[1], row[0]), reverse=True):
        instant = instant.astimezone(datetime.timezone.utc)
        age = (today - instant.date()).days
        if 0 <= age < 30:
            daily.setdefault(instant.date(), name)
        elif age >= 30:
            month_age = (today.year - instant.year) * 12 + today.month - instant.month
            if 1 <= month_age <= 12:
                monthly.setdefault((instant.year, instant.month), name)
    keep = set(daily.values()) | set(monthly.values())
    # The published CURRENT was created with the supplied clock, so it is in
    # the daily window. An invalid clock never silently expands retention.
    if current_name not in keep:
        bad('mirror_retention_clock_invalid')
    return keep

def prune(root, auth, now, check):
    selected, selected_hash = current(root)
    generations = os.open('generacions', FLAGS, dir_fd=root)
    try:
        names = os.listdir(generations)
        if len(names) > 2048:
            bad('mirror_retention_limit')
        rows = []
        for name in names:
            if not GEN.fullmatch(name):
                bad('mirror_generation_invalid')
            child = os.open(name, FLAGS, dir_fd=generations)
            try:
                try:
                    manifest_bytes = read(child, 'MANIFEST.json', 4 * 1024 * 1024)
                    sums = read(child, 'SHA256SUMS', 4 * 1024 * 1024)
                    raw_auth = read(child, 'AUTHENTICITY.json', 16384)
                    if not hmac.compare_digest(raw_auth, auth_bytes(manifest_bytes, sums, auth)):
                        continue
                    manifest = json.loads(manifest_bytes)
                    instant = datetime.datetime.fromisoformat(manifest['createdAt'].replace('Z', '+00:00'))
                    if manifest.get('generation') == name and instant.tzinfo is not None:
                        rows.append((name, instant))
                except (FileNotFoundError, ValueError, KeyError):
                    pass
            finally:
                os.close(child)
        keep = retention_keep(rows, now, selected['generation'])
        for name in names:
            if name not in keep:
                check()
                if current(root)[1] != selected_hash:
                    bad('mirror_current_drift')
                remove_tree(generations, name)
        return {'dailyMaximum':30, 'monthlyMaximum':12, 'kept':len(keep), 'removed':len(names)-len(keep)}
    finally:
        os.close(generations)

def relative(value):
    if not isinstance(value, str) or not value or len(value) > 1024 or value != unicodedata.normalize('NFC', value):
        bad('mirror_path_invalid')
    if value.startswith('/') or '\\' in value or any(unicodedata.category(c) in ('Cc', 'Cf') for c in value):
        bad('mirror_path_invalid')
    for part in value.split('/'):
        if not part or part in ('.', '..') or part.endswith((' ', '.')) or any(c in part for c in '<>:"|?*'):
            bad('mirror_path_invalid')
        if part.lower() in ('.git', '.ssh', '.aws', '.config', '.cloudflared', '.gnupg', 'dades', 'library', 'logs', 'log', 'pgdata', 'postgres17', 'node_modules') or part.lower().startswith('.env') or part.lower().endswith('.env'):
            bad('mirror_source_forbidden')
        if re.search(r'(?:^|[._-])(?:credentials?|secrets?|tokens?|privatekeys?)(?:[._-]|$)', part, re.I) or part.lower().endswith(('.pem', '.key', '.p12', '.pfx')):
            bad('mirror_source_forbidden')
    return value

def native_absolute(value):
    if sys.platform == 'darwin':
        for alias, actual in (('/tmp', '/private/tmp'), ('/var', '/private/var')):
            if value == alias or value.startswith(alias + '/'):
                if os.readlink(alias) in (actual, actual[1:]):
                    return actual + value[len(alias):]
    return value

def open_root(value):
    if not isinstance(value, str) or not value.startswith('/') or os.path.normpath(value) != value:
        bad('mirror_root_invalid')
    # Only normalize the OS-owned macOS /tmp and /var aliases.
    value = native_absolute(value)
    fd = os.open('/', FLAGS)
    try:
        for part in value.split('/')[1:]:
            child = os.open(part, FLAGS, dir_fd=fd)
            os.close(fd)
            fd = child
        return fd
    except BaseException:
        os.close(fd)
        raise

def owner_directory(fd):
    s = os.fstat(fd)
    if s.st_uid != os.getuid() or stat.S_IMODE(s.st_mode) & 0o022:
        bad('mirror_directory_permissions')

def parent_fd(root, name, create=False):
    parts = relative(name).split('/')
    fd = os.dup(root)
    try:
        for part in parts[:-1]:
            if create:
                try:
                    os.mkdir(part, 0o700, dir_fd=fd)
                except FileExistsError:
                    pass
            child = os.open(part, FLAGS, dir_fd=fd)
            os.close(fd)
            fd = child
        return fd, parts[-1]
    except BaseException:
        os.close(fd)
        raise

def read(root, name, limit=LIMIT):
    parent, leaf = parent_fd(root, name)
    try:
        fd = os.open(leaf, os.O_RDONLY | os.O_NOFOLLOW | os.O_NONBLOCK, dir_fd=parent)
        try:
            before = os.fstat(fd)
            if not stat.S_ISREG(before.st_mode) or before.st_nlink != 1 or before.st_uid != os.getuid() or before.st_size > limit:
                bad('mirror_file_unsafe')
            chunks = []
            size = 0
            while True:
                chunk = os.read(fd, min(1024 * 1024, limit + 1 - size))
                if not chunk:
                    break
                chunks.append(chunk)
                size += len(chunk)
                if size > limit:
                    bad('mirror_file_limit')
            after = os.fstat(fd)
            if (before.st_dev, before.st_ino, before.st_size, before.st_mtime_ns, before.st_ctime_ns) != (after.st_dev, after.st_ino, after.st_size, after.st_mtime_ns, after.st_ctime_ns):
                bad('mirror_read_drift')
            return b''.join(chunks)
        finally:
            os.close(fd)
    finally:
        os.close(parent)

def digest(data):
    return hashlib.sha256(data).hexdigest()

def inventory(root, prefix='', depth=0, budget=None):
    if depth > 8:
        bad('mirror_tree_depth_limit')
    if budget is None:
        budget = {'entries':0, 'bytes':0}
    result = set()
    with os.scandir(root) as entries:
        for entry in entries:
            budget['entries'] += 1
            if budget['entries'] > 20032:
                bad('mirror_tree_count_limit')
            name = relative(entry.name)
            s = os.stat(name, dir_fd=root, follow_symlinks=False)
            if stat.S_ISDIR(s.st_mode):
                child = os.open(name, FLAGS, dir_fd=root)
                try:
                    result.update(inventory(child, prefix + name + '/', depth + 1, budget))
                finally:
                    os.close(child)
            elif stat.S_ISREG(s.st_mode) and s.st_nlink == 1:
                budget['bytes'] += s.st_size
                if s.st_size > LIMIT or budget['bytes'] > TOTAL + 8 * 1024 * 1024:
                    bad('mirror_tree_byte_limit')
                result.add(prefix + name)
            else:
                bad('mirror_tree_unsafe')
    return result

def root_preflight(root):
    # Never traverse unreferenced historical generations or unfinished ones.
    # Only CURRENT's bounded generation participates in integrity claims.
    count = 0
    with os.scandir(root) as entries:
        for entry in entries:
            count += 1
            if count > 64:
                bad('mirror_root_count_limit')
            name = entry.name
            s = os.stat(name, dir_fd=root, follow_symlinks=False)
            if name in ('generacions', '.staging'):
                child = os.open(name, FLAGS, dir_fd=root)
                try:
                    owner_directory(child)
                finally:
                    os.close(child)
            elif name in (LOCK, 'CURRENT.json') or re.fullmatch(r'\.mirror-current-[a-f0-9]{24}\.tmp', name):
                if not stat.S_ISREG(s.st_mode) or s.st_nlink != 1 or s.st_uid != os.getuid() or stat.S_IMODE(s.st_mode) != 0o600 or s.st_size > 16384:
                    bad('mirror_root_file_unsafe')
            else:
                bad('mirror_root_entry_unexpected')

def lock_open(root, create):
    flags = os.O_RDWR | os.O_NOFOLLOW | os.O_NONBLOCK
    if create:
        flags |= os.O_CREAT
    try:
        fd = os.open(LOCK, flags, 0o600, dir_fd=root)
    except FileNotFoundError:
        return None
    try:
        s = os.fstat(fd)
        if not stat.S_ISREG(s.st_mode) or s.st_nlink != 1 or s.st_uid != os.getuid() or stat.S_IMODE(s.st_mode) != 0o600:
            bad('mirror_lock_unsafe')
        try:
            fcntl.flock(fd, fcntl.LOCK_EX | fcntl.LOCK_NB)
        except BlockingIOError:
            bad('mirror_export_busy')
        return fd
    except BaseException:
        os.close(fd)
        raise

def fresh(root, name, data):
    parent, leaf = parent_fd(root, name, True)
    try:
        fd = os.open(leaf, os.O_CREAT | os.O_EXCL | os.O_WRONLY | os.O_NOFOLLOW, 0o600, dir_fd=parent)
        with os.fdopen(fd, 'wb') as out:
            out.write(data)
            out.flush()
            os.fchmod(out.fileno(), 0o600)
            os.fsync(out.fileno())
        os.fsync(parent)
    finally:
        os.close(parent)
    if read(root, name) != data:
        bad('mirror_postimage_drift')

def current(root):
    try:
        raw = read(root, 'CURRENT.json', 16384)
    except FileNotFoundError:
        return None, None
    value = json.loads(raw)
    if not isinstance(value, dict) or set(value) != {'schema', 'generation', 'manifestSha256', 'sumsSha256'} or value['schema'] != 'sdp.node0.mirror.current.v1' or not GEN.fullmatch(value.get('generation', '')) or not HASH.fullmatch(value.get('manifestSha256', '')) or not HASH.fullmatch(value.get('sumsSha256', '')):
        bad('mirror_current_invalid')
    return value, digest(raw)

def inspect(root, pointer=None, auth=None):
    if pointer is None:
        pointer, _ = current(root)
    if pointer is None:
        return None
    if auth is None:
        bad('mirror_authentication_required')
    generations = os.open('generacions', FLAGS, dir_fd=root)
    try:
        generation = os.open(pointer['generation'], FLAGS, dir_fd=generations)
    finally:
        os.close(generations)
    try:
        manifest_bytes = read(generation, 'MANIFEST.json', 4 * 1024 * 1024)
        sums = read(generation, 'SHA256SUMS', 4 * 1024 * 1024)
        if digest(manifest_bytes) != pointer['manifestSha256'] or digest(sums) != pointer['sumsSha256']:
            bad('mirror_current_integrity')
        supplied_auth = read(generation, 'AUTHENTICITY.json', 16384)
        if not hmac.compare_digest(supplied_auth, auth_bytes(manifest_bytes, sums, auth)):
            bad('mirror_authentication_failed')
        manifest = json.loads(manifest_bytes)
        if manifest.get('schema') != 'sdp.node0.workspace-mirror.v1' or manifest.get('generation') != pointer['generation'] or not isinstance(manifest.get('files'), list) or len(manifest['files']) > 20000 or manifest.get('folders') != list(FOLDERS):
            bad('mirror_manifest_invalid')
        validate_snapshot_ledger(manifest)
        expected = {}
        total_bytes = 0
        for row in manifest['files']:
            name = relative(row['path'])
            if name.split('/')[0] not in FOLDERS or name in expected or not HASH.fullmatch(row.get('sha256', '')) or type(row.get('bytes')) is not int or row['bytes'] < 0 or row['bytes'] > LIMIT:
                bad('mirror_manifest_invalid')
            total_bytes += row['bytes']
            if total_bytes > TOTAL:
                bad('mirror_tree_byte_limit')
            expected[name] = row['sha256']
            data = read(generation, name)
            scan(data)
            if digest(data) != row['sha256'] or len(data) != row.get('bytes'):
                bad('mirror_content_integrity')
        expected['MANIFEST.json'] = digest(manifest_bytes)
        expected_sums = ''.join(expected[name] + '  ' + name + '\n' for name in sorted(expected)).encode('utf8')
        if sums != expected_sums or inventory(generation) != set(expected) | {'SHA256SUMS', 'AUTHENTICITY.json'}:
            bad('mirror_inventory_integrity')
        if set(os.listdir(generation)) != set(FOLDERS) | {'MANIFEST.json', 'SHA256SUMS', 'AUTHENTICITY.json'}:
            bad('mirror_folder_integrity')
        return {'generation':pointer['generation'], 'manifestSha256':pointer['manifestSha256'], 'sumsSha256':pointer['sumsSha256'], 'lastSnapshotAt':manifest['createdAt']}
    finally:
        os.close(generation)

def atomic_pointer(root, name, data):
    temp = '.mirror-current-' + secrets.token_hex(12) + '.tmp'
    fresh(root, temp, data)
    os.replace(temp, name, src_dir_fd=root, dst_dir_fd=root)
    os.fsync(root)

def checkpoint_stat(info):
    return (info.st_dev, info.st_ino, info.st_uid, info.st_mode,
            info.st_nlink, info.st_size, info.st_mtime_ns, info.st_ctime_ns)

def checkpoint_tree(root, prefix='', depth=0, budget=None):
    """FD-pinned exact tree metadata, including empty directories; no symlinks.
    Payloads are subsequently read/scanned through the same bounded FD helpers.
    """
    owner_directory(root)
    if depth > 8:
        bad('mirror_tree_depth_limit')
    if budget is None:
        budget = {'entries':0, 'bytes':0}
    files, directories, identities = set(), set(), {}
    with os.scandir(root) as entries:
        for entry in entries:
            budget['entries'] += 1
            if budget['entries'] > 20032:
                bad('mirror_tree_count_limit')
            name = relative(entry.name)
            info = os.stat(name, dir_fd=root, follow_symlinks=False)
            full = prefix + name
            identities[full] = checkpoint_stat(info)
            if stat.S_ISDIR(info.st_mode):
                child = os.open(name, FLAGS, dir_fd=root)
                try:
                    if checkpoint_stat(os.fstat(child)) != checkpoint_stat(info):
                        bad('mirror_checkpoint_tree_drift')
                    child_files, child_dirs, child_ids = checkpoint_tree(child, full + '/', depth + 1, budget)
                    files.update(child_files)
                    directories.add(full)
                    directories.update(child_dirs)
                    identities.update(child_ids)
                finally:
                    os.close(child)
            elif stat.S_ISREG(info.st_mode) and info.st_nlink == 1 and info.st_uid == os.getuid() and not stat.S_IMODE(info.st_mode) & 0o022:
                budget['bytes'] += info.st_size
                if info.st_size > LIMIT or budget['bytes'] > TOTAL + 8 * 1024 * 1024:
                    bad('mirror_tree_byte_limit')
                files.add(full)
            else:
                bad('mirror_tree_unsafe')
    return files, directories, identities

def bootstrap_r7_authenticity(req):
    """Explicit operator migration for one sealed historical unsigned tree.
    Never creates a key/dump/generation or rewrites MANIFEST/SHA256SUMS/CURRENT.
    """
    if set(req) != {'action', 'root', 'authentication', 'operatorApproval'} or req['action'] != 'bootstrap-r7-authenticity' or req['operatorApproval'] != R7_BOOTSTRAP_APPROVAL:
        bad('mirror_checkpoint_approval_required')
    root = open_root(req['root'])
    lock_fd, generations, generation = None, None, None
    try:
        owner_directory(root)
        root_preflight(root)
        lock_fd = lock_open(root, False)
        if lock_fd is None:
            bad('mirror_checkpoint_lock_required')
        lock_identity = checkpoint_stat(os.fstat(lock_fd))
        pointer_identity = checkpoint_stat(os.stat('CURRENT.json', dir_fd=root, follow_symlinks=False))
        pointer, pointer_hash = current(root)
        if pointer != dict({'schema':'sdp.node0.mirror.current.v1'}, **R7_SEALED_CHECKPOINT):
            bad('mirror_checkpoint_pin_mismatch')
        generations = os.open('generacions', FLAGS, dir_fd=root)
        owner_directory(generations)
        generation = os.open(pointer['generation'], FLAGS, dir_fd=generations)
        owner_directory(generation)
        generation_identity = (os.fstat(generation).st_dev, os.fstat(generation).st_ino)
        def check():
            named = open_root(req['root'])
            try:
                if (os.fstat(root).st_dev, os.fstat(root).st_ino) != (os.fstat(named).st_dev, os.fstat(named).st_ino):
                    bad('mirror_root_drift')
            finally:
                os.close(named)
            if checkpoint_stat(os.stat(LOCK, dir_fd=root, follow_symlinks=False)) != lock_identity:
                bad('mirror_lock_drift')
            if checkpoint_stat(os.stat('CURRENT.json', dir_fd=root, follow_symlinks=False)) != pointer_identity or current(root)[1] != pointer_hash:
                bad('mirror_current_drift')
            named_generations = os.open('generacions', FLAGS, dir_fd=root)
            try:
                if (os.fstat(named_generations).st_dev, os.fstat(named_generations).st_ino) != (os.fstat(generations).st_dev, os.fstat(generations).st_ino):
                    bad('mirror_checkpoint_generation_drift')
            finally:
                os.close(named_generations)
            info = os.stat(pointer['generation'], dir_fd=generations, follow_symlinks=False)
            if not stat.S_ISDIR(info.st_mode) or (info.st_dev, info.st_ino) != generation_identity:
                bad('mirror_checkpoint_generation_drift')
        check()
        manifest_bytes = read(generation, 'MANIFEST.json', 4 * 1024 * 1024)
        sums = read(generation, 'SHA256SUMS', 4 * 1024 * 1024)
        if digest(manifest_bytes) != pointer['manifestSha256'] or digest(sums) != pointer['sumsSha256']:
            bad('mirror_checkpoint_pin_mismatch')
        scan(manifest_bytes)
        scan(sums)
        manifest = json.loads(manifest_bytes)
        if not isinstance(manifest, dict) or manifest.get('schema') != 'sdp.node0.workspace-mirror.v1' or manifest.get('generation') != pointer['generation'] or not isinstance(manifest.get('files'), list) or len(manifest['files']) > 20000 or manifest.get('folders') != list(FOLDERS):
            bad('mirror_manifest_invalid')
        before = checkpoint_tree(generation)
        if 'AUTHENTICITY.json' in before[0]:
            bad('mirror_checkpoint_already_authenticated')
        expected, expected_dirs, total_bytes = {}, set(FOLDERS), 0
        for row in manifest['files']:
            name = relative(row['path'])
            if name.split('/')[0] not in FOLDERS or name in expected or not HASH.fullmatch(row.get('sha256', '')) or type(row.get('bytes')) is not int or row['bytes'] < 0 or row['bytes'] > LIMIT:
                bad('mirror_manifest_invalid')
            total_bytes += row['bytes']
            if total_bytes > TOTAL:
                bad('mirror_tree_byte_limit')
            expected[name] = row['sha256']
            pieces = name.split('/')
            expected_dirs.update('/'.join(pieces[:index]) for index in range(1, len(pieces)))
            data = read(generation, name)
            scan(data)
            if digest(data) != row['sha256'] or len(data) != row['bytes']:
                bad('mirror_content_integrity')
        expected['MANIFEST.json'] = digest(manifest_bytes)
        expected_sums = ''.join(expected[name] + '  ' + name + '\n' for name in sorted(expected)).encode('utf8')
        if sums != expected_sums or before[0] != set(expected) | {'SHA256SUMS'} or before[1] != expected_dirs:
            bad('mirror_inventory_integrity')
        if inventory(generation) != before[0] or checkpoint_tree(generation) != before:
            bad('mirror_checkpoint_tree_drift')
        # Key bytes are read only here, by this worker, after unsigned content
        # and all sealed commitments have passed. No key material is returned.
        auth = authentication_key(req.get('authentication'), req['root'])
        check()
        if checkpoint_tree(generation) != before:
            bad('mirror_checkpoint_tree_drift')
        fresh(generation, 'AUTHENTICITY.json', auth_bytes(manifest_bytes, sums, auth))
        result = inspect(root, auth=auth)
        check()
        return dict(result, bootstrapped=True, authenticationVerified=True, newGeneration=False,
                    manifestChanged=False, sumsChanged=False, currentChanged=False)
    finally:
        if generation is not None:
            os.close(generation)
        if generations is not None:
            os.close(generations)
        if lock_fd is not None:
            os.close(lock_fd)
        os.close(root)

def publish(req):
    root = open_root(req['mirrorDir'])
    lock_fd = None
    lock_info = None
    stage_parent = None
    stage_name = None
    stage_published = False
    try:
        owner_directory(root)
        root_preflight(root)
        auth = authentication_key(req.get('authentication'), req['mirrorDir'])
        previous, previous_hash = current(root)
        previous_bytes = read(root, 'CURRENT.json', 16384) if previous is not None else None
        if previous is not None:
            inspect(root, auth=auth)
        lock_fd = lock_open(root, True)
        lock_info = os.fstat(lock_fd)
        os.fsync(lock_fd)
        def check():
            pinned = open_root(req['mirrorDir'])
            try:
                a, b = os.fstat(root), os.fstat(pinned)
                if (a.st_dev, a.st_ino) != (b.st_dev, b.st_ino):
                    bad('mirror_root_drift')
            finally:
                os.close(pinned)
            s = os.stat(LOCK, dir_fd=root, follow_symlinks=False)
            if (s.st_dev, s.st_ino) != (lock_info.st_dev, lock_info.st_ino) or not stat.S_ISREG(s.st_mode) or s.st_nlink != 1 or s.st_uid != os.getuid() or stat.S_IMODE(s.st_mode) != 0o600:
                bad('mirror_lock_drift')
        check()
        if current(root)[1] != previous_hash:
            bad('mirror_current_drift')
        entries = req['entries']
        if not isinstance(entries, list) or len(entries) > 20000:
            bad('mirror_entry_limit')
        payloads = {}
        total = 0
        for item in entries:
            name = relative(item['path'])
            if name.split('/')[0] not in FOLDERS or name.casefold() in [p.casefold() for p in payloads]:
                bad('mirror_entry_invalid')
            if 'source' in item:
                source = reviewed_source(req, item['source'])
                try:
                    data = read(source, relative(item['source']['path']))
                finally:
                    os.close(source)
            else:
                data = base64.b64decode(item['data'], validate=True)
            total += len(data)
            if len(data) > LIMIT or total > TOTAL or digest(data) != item['sha256'] or len(data) != item['bytes']:
                bad('mirror_payload_invalid')
            scan(data)
            payloads[name] = data
        manifest_bytes = base64.b64decode(req['manifest'], validate=True)
        manifest = json.loads(manifest_bytes)
        generation_name = manifest.get('generation', '')
        validate_snapshot_ledger(manifest)
        if not GEN.fullmatch(generation_name):
            bad('mirror_generation_invalid')
        if manifest.get('files') != [{'path':i['path'], 'sha256':i['sha256'], 'bytes':i['bytes'], 'kind':i['kind']} for i in entries]:
            bad('mirror_manifest_mismatch')
        check()
        for folder in ('generacions', '.staging'):
            try:
                os.mkdir(folder, 0o700, dir_fd=root)
            except FileExistsError:
                pass
        generations = os.open('generacions', FLAGS, dir_fd=root)
        stage_parent = os.open('.staging', FLAGS, dir_fd=root)
        try:
            owner_directory(generations)
            owner_directory(stage_parent)
            if os.fstat(stage_parent).st_dev != os.fstat(generations).st_dev:
                bad('mirror_staging_device_mismatch')
            # Clean unfinished hidden preparations left by process termination.
            for stale in os.listdir(stage_parent):
                if not re.fullmatch(r'prepare-[a-f0-9]{24}', stale):
                    bad('mirror_staging_invalid')
                check()
                remove_tree(stage_parent, stale)
            stage_name = 'prepare-' + secrets.token_hex(12)
            os.mkdir(stage_name, 0o700, dir_fd=stage_parent)
            generation = os.open(stage_name, FLAGS, dir_fd=stage_parent)
            try:
                for folder in FOLDERS:
                    os.mkdir(folder, 0o700, dir_fd=generation)
                for name, data in payloads.items():
                    check()
                    fresh(generation, name, data)
                fresh(generation, 'MANIFEST.json', manifest_bytes)
                hashes = {name:digest(data) for name, data in payloads.items()}
                hashes['MANIFEST.json'] = digest(manifest_bytes)
                sums = ''.join(hashes[name] + '  ' + name + '\n' for name in sorted(hashes)).encode('utf8')
                fresh(generation, 'SHA256SUMS', sums)
                fresh(generation, 'AUTHENTICITY.json', auth_bytes(manifest_bytes, sums, auth))
                # Scan reread completed bytes, including ZIP/gzip members,
                # before any visible generation can exist.
                for name in payloads:
                    prepared = read(generation, name)
                    scan(prepared)
                    if digest(prepared) != hashes[name]:
                        bad('mirror_postimage_drift')
                os.fsync(generation)
            finally:
                os.close(generation)
            os.fsync(stage_parent)
            check()
            # Existing generations are immutable. rename is atomic on the
            # verified same device; EXDEV fails without a copy fallback.
            try:
                os.stat(generation_name, dir_fd=generations, follow_symlinks=False)
                bad('mirror_generation_exists')
            except FileNotFoundError:
                pass
            os.rename(stage_name, generation_name, src_dir_fd=stage_parent, dst_dir_fd=generations)
            stage_published = True
            os.fsync(generations)
            os.fsync(stage_parent)
        finally:
            os.close(generations)
        pointer = {'schema':'sdp.node0.mirror.current.v1', 'generation':generation_name, 'manifestSha256':digest(manifest_bytes), 'sumsSha256':digest(sums)}
        inspect(root, pointer, auth)
        check()
        if current(root)[1] != previous_hash:
            bad('mirror_current_drift')
        pointer_bytes = (json.dumps(pointer, sort_keys=True, separators=(',', ':')) + '\n').encode('utf8')
        try:
            atomic_pointer(root, 'CURRENT.json', pointer_bytes)
            result = inspect(root, auth=auth)
            check()
        except BaseException:
            # A non-cooperating editor may race the precommit check. Restore
            # the previous selector only while CURRENT still equals ours.
            # Never overwrite an independently changed pointer or root path.
            check()
            found_hash = current(root)[1]
            if found_hash == previous_hash:
                # Atomic writer failed before its external effect.
                raise
            if found_hash != digest(pointer_bytes):
                bad('mirror_rollback_current_drift')
            if previous_bytes is None:
                os.unlink('CURRENT.json', dir_fd=root)
                os.fsync(root)
            else:
                atomic_pointer(root, 'CURRENT.json', previous_bytes)
                inspect(root, auth=auth)
            bad('mirror_postcommit_verification_rolled_back')
        # CURRENT is already committed and authenticated. Cleanup has an
        # explicit separate policy result; a cleanup failure must not prevent
        # the caller from writing the successful snapshot's private receipt.
        try:
            clock = datetime.datetime.fromisoformat(req['retentionNow'].replace('Z', '+00:00'))
            result['retention'] = prune(root, auth, clock, check)
            result['retentionOk'] = True
            result['retentionCode'] = None
        except Exception:
            result['retentionOk'] = False
            result['retentionCode'] = 'mirror_retention_failed'
        return result
    finally:
        if stage_parent is not None:
            if stage_name is not None and not stage_published:
                try:
                    remove_tree(stage_parent, stage_name)
                except FileNotFoundError:
                    pass
            os.close(stage_parent)
        if lock_fd is not None:
            # Persistent inode; the kernel releases flock on close/SIGKILL.
            # Never unlink a lock another process could have opened/pinned.
            os.close(lock_fd)
        os.close(root)

def main(req):
    action = req['action']
    if action == 'bootstrap-r7-authenticity':
        return bootstrap_r7_authenticity(req)
    if action == 'publish':
        return publish(req)
    if action == 'scan':
        entries = req.get('entries')
        if not isinstance(entries, list) or len(entries) > 20000:
            bad('mirror_entry_limit')
        for entry in entries:
            scan(base64.b64decode(entry['data'], validate=True))
        return {'scanned':len(entries), 'patterns':len(SECRET_PATTERNS)}
    root = reviewed_source(req, {'root':req['root'], 'path':req['path'], 'kind':req.get('kind')}) if action == 'read' else open_root(req['root'])
    try:
        if action == 'read':
            data = read(root, relative(req['path']))
            scan(data)
            if digest(data) != req['sha256']:
                bad('mirror_source_integrity')
            return {'data':base64.b64encode(data).decode('ascii'), 'bytes':len(data)}
        if action == 'preflight-authentication':
            authentication_key(req.get('authentication'), req['root'])
            return {'ready':True}
        if action == 'inspect':
            owner_directory(root)
            auth = authentication_key(req.get('authentication'), req['root'])
            return inspect(root, auth=auth)
        if action == 'verified-manifest':
            # Narrow operator capability: only CURRENT's authenticated manifest,
            # never an arbitrary file read or an unreviewed source capability.
            owner_directory(root)
            auth = authentication_key(req.get('authentication'), req['root'])
            verified = inspect(root, auth=auth)
            if verified is None:
                bad('mirror_current_required')
            generations = os.open('generacions', FLAGS, dir_fd=root)
            try:
                generation = os.open(verified['generation'], FLAGS, dir_fd=generations)
            finally:
                os.close(generations)
            try:
                payload = read(generation, 'MANIFEST.json', 65536)
                if digest(payload) != verified['manifestSha256']:
                    bad('mirror_current_integrity')
            finally:
                os.close(generation)
            if inspect(root, auth=auth) != verified:
                bad('mirror_current_changed')
            return {'data':base64.b64encode(payload).decode('ascii'), 'bytes':len(payload)}
        if action == 'preflight':
            owner_directory(root)
            root_preflight(root)
            fd = lock_open(root, False)
            if fd is not None:
                os.close(fd)
            auth = authentication_key(req.get('authentication'), req['root']) if current(root)[0] is not None else None
            return inspect(root, auth=auth)
        if action == 'preflight-state':
            owner_directory(root)
            if stat.S_IMODE(os.fstat(root).st_mode) != 0o700:
                bad('mirror_state_directory_permissions')
            try:
                read(root, 'workspace-mirror-state.json', 16384)
                s = os.stat('workspace-mirror-state.json', dir_fd=root, follow_symlinks=False)
                if stat.S_IMODE(s.st_mode) != 0o600:
                    bad('mirror_state_file_permissions')
            except FileNotFoundError:
                pass
            return {'ready':True}
        if action == 'state':
            owner_directory(root)
            if stat.S_IMODE(os.fstat(root).st_mode) != 0o700:
                bad('mirror_state_directory_permissions')
            lock = lock_open(root, True)
            try:
                data = base64.b64decode(req['data'], validate=True)
                if len(data) > 16384:
                    bad('mirror_state_limit')
                try:
                    read(root, 'workspace-mirror-state.json', 16384)
                except FileNotFoundError:
                    pass
                atomic_pointer(root, 'workspace-mirror-state.json', data)
                return {'written':True}
            finally:
                os.close(lock)
        if action in ('state-checkpoint', 'invalidate-state'):
            owner_directory(root)
            if stat.S_IMODE(os.fstat(root).st_mode) != 0o700:
                bad('mirror_state_directory_permissions')
            lock = lock_open(root, True)
            try:
                try:
                    payload = read(root, 'workspace-mirror-state.json', 16384)
                    info = os.stat('workspace-mirror-state.json', dir_fd=root, follow_symlinks=False)
                    if stat.S_IMODE(info.st_mode) != 0o600:
                        bad('mirror_state_file_permissions')
                    checkpoint = digest(payload)
                except FileNotFoundError:
                    checkpoint = None
                if action == 'state-checkpoint':
                    return {'receiptSha256':checkpoint}
                expected = req.get('expectedReceiptSha256')
                if not isinstance(expected, str) or not HASH.fullmatch(expected) or checkpoint != expected:
                    return {'invalidated':False}
                replacement = b'{"schema":"sdp.node0.mirror.private-state.unverified.v1","integrityOk":false,"reason":"mirror_snapshot_unverified"}\n'
                atomic_pointer(root, 'workspace-mirror-state.json', replacement)
                return {'invalidated':True}
            finally:
                os.close(lock)
        bad('mirror_action_invalid')
    finally:
        os.close(root)

if __name__ == '__main__':
 try:
    request = json.load(sys.stdin)
    print(json.dumps({'ok':True, 'result':main(request)}, separators=(',', ':')))
 except BaseException as error:
    print(json.dumps({'ok':False, 'error':str(error) if isinstance(error, RuntimeError) else 'mirror_file_operation_failed'}, separators=(',', ':')))
    sys.exit(1)
