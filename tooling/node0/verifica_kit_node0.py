#!/usr/bin/env python3
"""Standalone Node0 CAS verifier. Default is read-only; --apply commits.
Per-file atomic replacements + captured-error rollback; not crash-atomic.
The cooperative lock does not exclude independent editors. SHA is integrity,
not authorship: compare SHA256SUMS with an independently trusted report.
"""
import argparse
import hashlib
import json
import os
from pathlib import Path
import re
import secrets
import stat
import sys
import unicodedata

SCHEMA = 'sdp.node0.cas.v1'
LOCK = '.node0-kit.lock'

class Refusal(Exception):
    pass

def refuse(message):
    raise Refusal(message)

def relative(value):
    if not isinstance(value, str) or not value or len(value) > 4096 or value != unicodedata.normalize('NFC', value):
        refuse('invalid_path')
    if value.startswith('/') or '\\' in value or any(unicodedata.category(c) in ('Cc', 'Cf') or c in '\u2028\u2029' for c in value):
        refuse('invalid_path')
    for part in value.split('/'):
        if not part or part in ('.', '..') or part.endswith((' ', '.')) or any(c in part for c in '<>:"|?*'):
            refuse('invalid_path')
        lower = part.lower()
        if lower in ('.git', 'node_modules', LOCK) or lower.startswith('.env') or lower.startswith('.node0-kit-stage-'):
            refuse('forbidden_path')
        if re.fullmatch(r'(con|prn|aux|nul|com[1-9]|lpt[1-9])(?:\..*)?', lower):
            refuse('forbidden_path')
    return value

DIR_FLAGS = os.O_RDONLY | os.O_DIRECTORY | os.O_NOFOLLOW

def normalitza_root(path):
    absolute = Path(os.path.abspath(os.fspath(path)))
    # Only the two standard macOS OS aliases are accepted. User-created
    # symlinks, including the requested root itself, remain visible to openat.
    if sys.platform == 'darwin':
        for alias, actual in (('/tmp', '/private/tmp'), ('/var', '/private/var')):
            prefix = Path(alias)
            if absolute == prefix or absolute.is_relative_to(prefix):
                try:
                    target = os.readlink(alias)
                except OSError:
                    continue
                if target in (actual, actual[1:]):
                    absolute = Path(actual) / absolute.relative_to(prefix)
    return absolute

def open_root(path):
    """Pin every ancestor; the resolved caller path must contain no symlink."""
    descriptor = os.open('/', DIR_FLAGS)
    try:
        for part in Path(path).parts[1:]:
            child = os.open(part, DIR_FLAGS, dir_fd=descriptor)
            os.close(descriptor)
            descriptor = child
        return descriptor
    except BaseException:
        os.close(descriptor)
        raise

def parent_fd(root, name, created=None):
    parts = relative(name).split('/')
    descriptor = os.dup(root)
    prefix = []
    try:
        for part in parts[:-1]:
            prefix.append(part)
            try:
                child = os.open(part, DIR_FLAGS, dir_fd=descriptor)
            except FileNotFoundError:
                if created is None:
                    raise
                os.mkdir(part, mode=0o755, dir_fd=descriptor)
                created.append('/'.join(prefix))
                child = os.open(part, DIR_FLAGS, dir_fd=descriptor)
            os.close(descriptor)
            descriptor = child
        return descriptor, parts[-1]
    except BaseException:
        os.close(descriptor)
        raise

def state(root, name):
    try:
        parent, leaf = parent_fd(root, name)
    except FileNotFoundError:
        return None
    try:
        try:
            fd = os.open(leaf, os.O_RDONLY | os.O_NOFOLLOW | os.O_NONBLOCK, dir_fd=parent)
        except FileNotFoundError:
            return None
        try:
            info = os.fstat(fd)
            if not stat.S_ISREG(info.st_mode) or info.st_nlink != 1:
                refuse('non_regular_file:' + name)
            if info.st_size > 32 * 1024 * 1024:
                refuse('file_limit:' + name)
            with os.fdopen(os.dup(fd), 'rb') as source:
                data = source.read(32 * 1024 * 1024 + 1)
            if len(data) > 32 * 1024 * 1024:
                refuse('file_limit:' + name)
            after = os.fstat(fd)
            if (info.st_dev, info.st_ino, info.st_size, info.st_mtime_ns, info.st_ctime_ns) != (after.st_dev, after.st_ino, after.st_size, after.st_mtime_ns, after.st_ctime_ns):
                refuse('file_changed_during_read:' + name)
            return {'sha256': hashlib.sha256(data).hexdigest(), 'mode': stat.S_IMODE(info.st_mode), 'data': data}
        finally:
            os.close(fd)
    finally:
        os.close(parent)

def inventory(root, prefix=''):
    names = set()
    for child in os.listdir(root):
        name = relative(prefix + child)
        info = os.stat(child, dir_fd=root, follow_symlinks=False)
        if stat.S_ISDIR(info.st_mode):
            fd = os.open(child, DIR_FLAGS, dir_fd=root)
            try:
                names.update(inventory(fd, name + '/'))
            finally:
                os.close(fd)
        elif stat.S_ISREG(info.st_mode) and info.st_nlink == 1:
            names.add(name)
        else:
            refuse('kit_non_regular')
    return names

def matches(actual, expected):
    return actual is None if expected is None else actual is not None and actual['sha256'] == expected['sha256'] and actual['mode'] == expected['mode']

def valid_expected(value):
    if value is None:
        return True
    return (isinstance(value, dict) and set(value) == {'sha256', 'mode'}
            and isinstance(value['sha256'], str) and re.fullmatch('[a-f0-9]{64}', value['sha256'])
            and type(value['mode']) is int and 0 <= value['mode'] <= 0o777)

def verify_kit(root):
    sums = state(root, 'SHA256SUMS')
    if sums is None:
        refuse('checksums_absent')
    entries = {}
    try:
        lines = sums['data'].decode('utf8').splitlines()
    except UnicodeError:
        refuse('checksums_invalid')
    for line in lines:
        digest, sep, name = line.partition('  ')
        if sep != '  ' or not re.fullmatch('[a-f0-9]{64}', digest):
            refuse('checksums_invalid')
        relative(name)
        if name == 'SHA256SUMS' or name in entries or any(x.casefold() == name.casefold() for x in entries):
            refuse('checksums_duplicate')
        found = state(root, name)
        if found is None or found['sha256'] != digest:
            refuse('kit_integrity:' + name)
        entries[name] = digest
    actual_files = inventory(root) - {'SHA256SUMS'}
    if actual_files != set(entries) or not {'MANIFEST.json', 'verifica_i_aplica.py', 'README_INTEGRACIO.md'}.issubset(entries):
        refuse('kit_inventory_mismatch')
    try:
        manifest = json.loads(state(root, 'MANIFEST.json')['data'])
    except (ValueError, TypeError):
        refuse('manifest_invalid')
    if not isinstance(manifest, dict) or manifest.get('schema') != SCHEMA or not isinstance(manifest.get('files'), list) or not manifest['files']:
        refuse('manifest_invalid')
    seen = set()
    files = []
    for item in manifest['files']:
        if not isinstance(item, dict) or set(item) != {'path', 'before', 'after'}:
            refuse('manifest_file_invalid')
        name = relative(item['path'])
        if not name.startswith(('src/', 'tests/', 'tooling/node0/')) and name != 'tooling/tests/node-suite-manifest.json':
            refuse('target_scope_rejected')
        key = name.casefold()
        if key in seen or any(key.startswith(p + '/') or p.startswith(key + '/') for p in seen):
            refuse('target_path_duplicate')
        seen.add(key)
        if not valid_expected(item['before']) or not valid_expected(item['after']) or item['after'] is None:
            refuse('manifest_state_invalid')
        before = state(root, 'preimatges/' + name)
        after = state(root, 'fitxers/' + name)
        if not matches(before, item['before']) or not matches(after, item['after']):
            refuse('payload_or_preimage_mismatch:' + name)
        files.append({**item, 'before_data': before, 'after_data': after})
    return manifest, files, sums['sha256']

def classify(target, files, rollback):
    start, end = ('after', 'before') if rollback else ('before', 'after')
    actual = [state(target, item['path']) for item in files]
    if all(matches(found, item[end]) for found, item in zip(actual, files)):
        return True
    for found, item in zip(actual, files):
        if not matches(found, item[start]):
            refuse('cas_drift:' + item['path'])
    return False

def replace_file(target, name, value, created):
    parent, leaf = parent_fd(target, name, created)
    temp = '.node0-kit-stage-' + secrets.token_hex(16)
    try:
        if value is None:
            # Only an exact previously verified postimage reaches deletion.
            os.unlink(leaf, dir_fd=parent)
            return
        fd = os.open(temp, os.O_CREAT | os.O_EXCL | os.O_WRONLY | os.O_NOFOLLOW, 0o600, dir_fd=parent)
        try:
            with os.fdopen(fd, 'wb') as out:
                out.write(value['data'])
                out.flush()
                os.fchmod(out.fileno(), value['mode'])
                os.fsync(out.fileno())
            os.replace(temp, leaf, src_dir_fd=parent, dst_dir_fd=parent)
        finally:
            try:
                os.unlink(temp, dir_fd=parent)
            except FileNotFoundError:
                pass
    finally:
        os.close(parent)

def run_pinned(kit, target, write=False, rollback=False):
    manifest, files, kit_pin = verify_kit(kit)
    already = classify(target, files, rollback)
    result = {'kit': manifest.get('name'), 'files': len(files), 'direction': 'rollback' if rollback else 'apply', 'write': write, 'already_applied': already}
    if not write or already:
        return result
    descriptor = None
    changed, created = [], []
    start, end = ('after', 'before') if rollback else ('before', 'after')
    def owns_lock():
        owned = os.fstat(descriptor)
        try:
            current = os.stat(LOCK, dir_fd=target, follow_symlinks=False)
        except FileNotFoundError:
            refuse('lock_disappeared')
        if (current.st_dev, current.st_ino) != (owned.st_dev, owned.st_ino):
            refuse('lock_replaced')
    try:
        try:
            descriptor = os.open(LOCK, os.O_CREAT | os.O_EXCL | os.O_WRONLY | os.O_NOFOLLOW, 0o600, dir_fd=target)
        except FileExistsError:
            refuse('target_locked')
        os.write(descriptor, json.dumps({'pid': os.getpid(), 'kit': manifest.get('name')}).encode('utf8'))
        os.fsync(descriptor)
        # Both target and kit are rechecked after acquiring the cooperative lock.
        _, files, new_pin = verify_kit(kit)
        if new_pin != kit_pin:
            refuse('kit_changed_after_review')
        if classify(target, files, rollback):
            return {**result, 'already_applied': True}
        for item in files:
            owns_lock()
            if not matches(state(target, item['path']), item[start]):
                refuse('cas_changed_during_apply:' + item['path'])
            changed.append(item)
            replace_file(target, item['path'], item[end + '_data'], created)
        owns_lock()
        if not all(matches(state(target, item['path']), item[end]) for item in files):
            refuse('postimage_verification_failed')
        return result
    except BaseException:
        rollback_errors = []
        for item in reversed(changed):
            try:
                current = state(target, item['path'])
                if matches(current, item[start]):
                    continue
                if not matches(current, item[end]):
                    refuse('external_change_during_rollback')
                replace_file(target, item['path'], item[start + '_data'], created)
            except BaseException:
                rollback_errors.append(item['path'])
        if rollback_errors:
            refuse('recovery_required:' + ','.join(rollback_errors))
        raise
    finally:
        if descriptor is not None:
            try:
                owns_lock()
                os.unlink(LOCK, dir_fd=target)
            finally:
                os.close(descriptor)
        for directory in reversed(created):
            try:
                parent, leaf = parent_fd(target, directory)
                try:
                    os.rmdir(leaf, dir_fd=parent)
                finally:
                    os.close(parent)
            except OSError:
                pass

def run(kit, target, write=False, rollback=False):
    kit, target = normalitza_root(kit), normalitza_root(target)
    kit_fd, target_fd = open_root(kit), None
    try:
        target_fd = open_root(target)
        return run_pinned(kit_fd, target_fd, write, rollback)
    finally:
        os.close(kit_fd)
        if target_fd is not None:
            os.close(target_fd)

def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--target', required=True, help='explicit integration checkout; default operation is dry-run')
    parser.add_argument('--kit', default=str(Path(__file__).absolute().parent))
    parser.add_argument('--apply', action='store_true', help='write after all integrity and CAS checks')
    parser.add_argument('--rollback', action='store_true', help='reverse direction; remains dry-run without --apply')
    args = parser.parse_args()
    target, kit = normalitza_root(args.target), normalitza_root(args.kit)
    if not target.is_dir() or not kit.is_dir() or target == kit or kit.is_relative_to(target) or target.is_relative_to(kit):
        refuse('invalid_or_overlapping_roots')
    result = run(kit, target, args.apply, args.rollback)
    print(json.dumps(result, ensure_ascii=False, sort_keys=True))

if __name__ == '__main__':
    try:
        main()
    except (Refusal, OSError, ValueError) as exc:
        print(json.dumps({'ok': False, 'error': str(exc)}, ensure_ascii=False), file=sys.stderr)
        sys.exit(1)
