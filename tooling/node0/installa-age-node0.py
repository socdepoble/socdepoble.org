#!/usr/bin/env python3
"""Pinned user-space age for Node0. Default is a read-only plan; no key setup."""
import fcntl
import gzip
import hashlib
import io
import json
import os
import platform
import re
import resource
import secrets
import stat
import subprocess
import sys
import tarfile
from datetime import datetime, timezone

ASSET = {
    'version': '1.3.2', 'id': 535541897, 'size': 18106798,
    'sha256': 'e2020b073c44f692685a24d6abc378817eb81ffaaf49fd0531ef8565f767f2f5',
    'url': 'https://github.com/FiloSottile/age/releases/download/v1.3.2/age-v1.3.2-darwin-arm64.tar.gz',
}
# Derived only from the compressed archive matching the independent official pin.
SELECTED = {
    'age': {'size': 6502258, 'sha256': '4012dfc2725883beafb710894af4f599b7a94f8c8e0f51f02cc96ab8df33915e', 'mode': 0o755},
    'age-keygen': {'size': 3806562, 'sha256': 'c16e229245123d0ad27442317461d63915416cad0294395cd19ca93feb3211ea', 'mode': 0o755},
    'LICENSE': {'size': 2975, 'sha256': 'afbdb4e07a359499db587ae632815809b1fc1670a92d5449af112ce9a67833a2', 'mode': 0o644},
}
DESTINATION = 'age-v1.3.2'
DIR = os.O_RDONLY | os.O_DIRECTORY | os.O_NOFOLLOW
MAX_EXPANDED = 64 * 1024 * 1024
MAX_MEMBER = 16 * 1024 * 1024


class Failure(Exception):
    pass


def fail(code):
    raise Failure(code)


def digest(data):
    return hashlib.sha256(data).hexdigest()


def leaf(name):
    if not isinstance(name, str) or not name or '/' in name or '\\' in name or name in ('.', '..'):
        fail('node0_age_invalid_leaf')
    return name


def open_root(value):
    if not isinstance(value, str) or not value.startswith('/') or any(part in ('', '.', '..') for part in value.split('/')[1:]):
        fail('node0_age_invalid_root')
    current = os.open('/', DIR)
    try:
        for part in value.split('/')[1:]:
            child = os.open(part, DIR, dir_fd=current)
            os.close(current)
            current = child
        return current
    except BaseException:
        os.close(current)
        raise


def owned_dir(fd, private=False):
    info = os.fstat(fd)
    if not stat.S_ISDIR(info.st_mode) or info.st_uid != os.getuid() or info.st_mode & 0o022:
        fail('node0_age_unsafe_directory')
    if private and stat.S_IMODE(info.st_mode) != 0o700:
        fail('node0_age_private_directory_required')
    return info


def same_name(parent, name, held):
    current = os.open(leaf(name), DIR, dir_fd=parent)
    try:
        a, b = os.fstat(current), os.fstat(held)
        if (a.st_dev, a.st_ino) != (b.st_dev, b.st_ino):
            fail('node0_age_directory_changed')
    finally:
        os.close(current)


def read_regular(parent, name, mode, maximum, expected=None):
    fd = os.open(leaf(name), os.O_RDONLY | os.O_NOFOLLOW | os.O_NONBLOCK, dir_fd=parent)
    try:
        before = os.fstat(fd)
        if not stat.S_ISREG(before.st_mode) or before.st_nlink != 1 or before.st_uid != os.getuid() or stat.S_IMODE(before.st_mode) != mode or before.st_size > maximum:
            fail('node0_age_unsafe_file')
        with os.fdopen(os.dup(fd), 'rb') as stream:
            data = stream.read(maximum + 1)
        after = os.fstat(fd)
        named = os.stat(name, dir_fd=parent, follow_symlinks=False)
        fields = ('st_dev', 'st_ino', 'st_size', 'st_mtime_ns', 'st_ctime_ns')
        if len(data) > maximum or any(getattr(before, key) != getattr(after, key) for key in fields) or (after.st_dev, after.st_ino) != (named.st_dev, named.st_ino):
            fail('node0_age_read_drift')
        if expected and digest(data) != expected:
            fail('node0_age_file_digest_mismatch')
        return data
    finally:
        os.close(fd)


def exclusive(parent, name, data, mode):
    fd = os.open(leaf(name), os.O_WRONLY | os.O_CREAT | os.O_EXCL | os.O_NOFOLLOW, mode, dir_fd=parent)
    try:
        os.fchmod(fd, mode)
        with os.fdopen(os.dup(fd), 'wb') as stream:
            stream.write(data)
            stream.flush()
        os.fsync(fd)
    finally:
        os.close(fd)


def fresh_directory(parent, prefix):
    for attempt in range(16):
        name = prefix + secrets.token_hex(12)
        try:
            os.mkdir(name, 0o700, dir_fd=parent)
            fd = os.open(name, DIR, dir_fd=parent)
            owned_dir(fd, private=True)
            same_name(parent, name, fd)
            return name, fd
        except FileExistsError:
            continue
    fail('node0_age_directory_collision')


def cleanup_directory(parent, name, fd, allowed):
    same_name(parent, name, fd)
    entries = os.listdir(fd)
    if any(entry not in allowed for entry in entries):
        fail('node0_age_cleanup_unknown_entry')
    for entry in entries:
        info = os.stat(entry, dir_fd=fd, follow_symlinks=False)
        if not stat.S_ISREG(info.st_mode) or info.st_nlink != 1 or info.st_uid != os.getuid():
            fail('node0_age_cleanup_unsafe_entry')
        os.unlink(entry, dir_fd=fd)
    same_name(parent, name, fd)
    os.rmdir(name, dir_fd=parent)


class ExpandedLimit:
    def __init__(self, source):
        self.source, self.count = source, 0

    def read(self, size=-1):
        remaining = MAX_EXPANDED - self.count
        if size < 0 or size > remaining + 1:
            fail('node0_age_archive_expansion_limit')
        data = self.source.read(size)
        self.count += len(data)
        if self.count > MAX_EXPANDED:
            fail('node0_age_archive_expansion_limit')
        return data


def decode_archive(data):
    """Never extract paths: select three captured byte strings from a bounded stream."""
    output, seen, total = {}, set(), 0
    with gzip.GzipFile(fileobj=io.BytesIO(data)) as decompressed:
        stream = ExpandedLimit(decompressed)
        with tarfile.open(fileobj=stream, mode='r|') as archive:
            for member in archive:
                name = member.name
                if not isinstance(name, str) or len(name) > 256 or '\\' in name or any(part in ('', '.', '..') for part in name.split('/')) or not name.isascii() or name.startswith('/'):
                    fail('node0_age_archive_path')
                key = name.lower()
                if key in seen or len(seen) >= 64:
                    fail('node0_age_archive_duplicate_or_count')
                seen.add(key)
                if name != 'age' and not name.startswith('age/'):
                    fail('node0_age_archive_root')
                if member.isdir():
                    if name != 'age' or member.size:
                        fail('node0_age_archive_directory')
                    continue
                if member.type not in (tarfile.REGTYPE, tarfile.AREGTYPE) or member.size < 0 or member.size > MAX_MEMBER or member.mode & 0o7000:
                    fail('node0_age_archive_non_regular')
                total += member.size
                if total > MAX_EXPANDED:
                    fail('node0_age_archive_expansion_limit')
                selected = name[4:] if name.startswith('age/') else ''
                if selected not in SELECTED:
                    continue
                pin = SELECTED[selected]
                if member.size != pin['size'] or member.mode != pin['mode']:
                    fail('node0_age_selected_metadata_mismatch')
                content = archive.extractfile(member).read(pin['size'] + 1)
                if len(content) != pin['size'] or digest(content) != pin['sha256']:
                    fail('node0_age_selected_digest_mismatch')
                output[selected] = content
    if set(output) != set(SELECTED):
        fail('node0_age_selected_missing')
    return output


def asset_bytes(parent):
    data = read_regular(parent, 'archive.tar.gz', 0o600, ASSET['size'])
    if len(data) != ASSET['size'] or digest(data) != ASSET['sha256']:
        fail('node0_age_asset_digest_mismatch')
    return data


def download(parent):
    fd = os.open('archive.tar.gz', os.O_WRONLY | os.O_CREAT | os.O_EXCL | os.O_NOFOLLOW, 0o600, dir_fd=parent)
    def bounded_download():
        resource.setrlimit(resource.RLIMIT_FSIZE, (ASSET['size'] + 1, ASSET['size'] + 1))
    try:
        os.fchmod(fd, 0o600)
        result = subprocess.run(['/usr/bin/curl', '--fail', '--location', '--proto', '=https', '--proto-redir', '=https', '--tlsv1.2', '--silent', '--show-error', '--connect-timeout', '10', '--max-time', '120', '--max-filesize', str(ASSET['size']), ASSET['url']], stdout=fd, stderr=subprocess.PIPE, timeout=125, preexec_fn=bounded_download)
        if result.returncode:
            fail('node0_age_download_failed')
        os.fsync(fd)
    finally:
        os.close(fd)


def executable(parent, name):
    pin = SELECTED[name]
    read_regular(parent, name, pin['mode'], pin['size'], pin['sha256'])
    fd = os.open(name, os.O_RDONLY | os.O_NOFOLLOW | os.O_NONBLOCK, dir_fd=parent)
    info = os.fstat(fd)
    if not stat.S_ISREG(info.st_mode) or info.st_nlink != 1 or info.st_uid != os.getuid() or stat.S_IMODE(info.st_mode) != pin['mode'] or info.st_size != pin['size']:
        os.close(fd)
        fail('node0_age_executable_changed')
    # Hash this exact held descriptor again; never execute a later pathname lookup.
    with os.fdopen(os.dup(fd), 'rb') as stream:
        data = stream.read(pin['size'] + 1)
    if digest(data) != pin['sha256']:
        os.close(fd)
        fail('node0_age_executable_changed')
    return {'fd': fd, 'parent': parent, 'name': name}


def run_binary(binary, args, input_fd=None, output_fd=None, extra=()):
    # Darwin cannot exec /dev/fd/N. Pin cwd and verify this exact regular leaf
    # inside the child; no ancestor or PATH lookup is used for the executable.
    def prepare_child():
        os.fchdir(binary['parent'])
        held = os.fstat(binary['fd'])
        named = os.stat(binary['name'], dir_fd=binary['parent'], follow_symlinks=False)
        if not stat.S_ISREG(named.st_mode) or named.st_nlink != 1 or any(getattr(held, key) != getattr(named, key) for key in ('st_dev', 'st_ino', 'st_size', 'st_mtime_ns', 'st_ctime_ns')):
            fail('node0_age_executable_changed')
        resource.setrlimit(resource.RLIMIT_CPU, (10, 10))
    result = subprocess.run(['./' + binary['name']] + args, pass_fds=tuple(set((binary['fd'], binary['parent']) + tuple(extra))), stdin=input_fd if input_fd is not None else subprocess.DEVNULL, stdout=output_fd if output_fd is not None else subprocess.PIPE, stderr=subprocess.PIPE, timeout=15, env={'PATH': '/usr/bin:/bin', 'LC_ALL': 'C'}, preexec_fn=prepare_child)
    if result.returncode or len(result.stderr) > 32768 or (result.stdout is not None and len(result.stdout) > 32768):
        fail('node0_age_command_failed')
    return result.stdout


def verify_canary(binaries, scratch):
    """Real native crypto; secret bytes and even recipient fingerprints stay off stdout."""
    owned_dir(scratch, private=True)
    fds, names, result = [], ['identity', 'canary', 'ciphertext', 'decoded'], None
    try:
        age = executable(binaries, 'age');fds.append(age['fd'])
        keygen = executable(binaries, 'age-keygen');fds.append(keygen['fd'])
        if run_binary(age, ['--version']).strip() != b'v1.3.2' or run_binary(keygen, ['--version']).strip() != b'v1.3.2':
            fail('node0_age_version_mismatch')
        files = {}
        for name in names:
            fd = os.open(name, os.O_RDWR | os.O_CREAT | os.O_EXCL | os.O_NOFOLLOW, 0o600, dir_fd=scratch)
            os.fchmod(fd, 0o600)
            fds.append(fd)
            files[name] = fd
        run_binary(keygen, [], output_fd=files['identity'])
        os.fsync(files['identity']);os.lseek(files['identity'], 0, os.SEEK_SET)
        recipient = run_binary(keygen, ['-y', '/dev/fd/' + str(files['identity'])], extra=(files['identity'],)).strip()
        if not re.fullmatch(rb'age1[0-9a-z]{20,200}', recipient):
            fail('node0_age_canary_recipient')
        canary = b'Soc de Poble Node0 synthetic canary age v1.3.2\n'
        os.write(files['canary'], canary);os.lseek(files['canary'], 0, os.SEEK_SET)
        run_binary(age, ['-r', recipient.decode('ascii')], input_fd=files['canary'], output_fd=files['ciphertext'])
        os.lseek(files['ciphertext'], 0, os.SEEK_SET);os.lseek(files['identity'], 0, os.SEEK_SET)
        run_binary(age, ['-d', '-i', '/dev/fd/' + str(files['identity'])], input_fd=files['ciphertext'], output_fd=files['decoded'], extra=(files['identity'],))
        os.lseek(files['decoded'], 0, os.SEEK_SET)
        if os.read(files['decoded'], len(canary) + 1) != canary:
            fail('node0_age_canary_roundtrip_failed')
        for name in names:
            if stat.S_IMODE(os.fstat(files[name]).st_mode) != 0o600:
                fail('node0_age_canary_permissions')
        result = {'ok': True, 'synthetic': True, 'nativeRoundtrip': True, 'privateDirectoryMode': '0700', 'identityMode': '0600'}
    finally:
        for fd in fds:
            os.close(fd)
        for name in names:
            try:
                info = os.stat(name, dir_fd=scratch, follow_symlinks=False)
            except FileNotFoundError:
                continue
            if not stat.S_ISREG(info.st_mode) or info.st_nlink != 1 or info.st_uid != os.getuid():
                fail('node0_age_canary_cleanup_unsafe')
            os.unlink(name, dir_fd=scratch)
    result['temporaryIdentityRemoved'] = True
    result['canaryFilesRemoved'] = True
    return result


def verify_installation(parent):
    installed = os.open(DESTINATION, DIR, dir_fd=parent)
    try:
        owned_dir(installed, private=True)
        if set(os.listdir(installed)) != set(SELECTED) | {'installation.json'}:
            fail('node0_age_existing_install_unclaimed')
        receipt = json.loads(read_regular(installed, 'installation.json', 0o600, 32768))
        if receipt.get('schema') != 'sdp.node0.age.install.v1' or receipt.get('assetSha256') != ASSET['sha256']:
            fail('node0_age_existing_install_unclaimed')
        for name, pin in SELECTED.items():
            read_regular(installed, name, pin['mode'], pin['size'], pin['sha256'])
        same_name(parent, DESTINATION, installed)
        return installed
    except BaseException:
        os.close(installed)
        raise


def publish_installation(parent, source, receipt):
    # Exclusive root creation: no rename may replace an operator's existing directory.
    os.mkdir(DESTINATION, 0o700, dir_fd=parent)
    installed = os.open(DESTINATION, DIR, dir_fd=parent)
    try:
        owned_dir(installed, private=True)
        for name, pin in SELECTED.items():
            same_name(parent, DESTINATION, installed)
            data = read_regular(source, name, pin['mode'], pin['size'], pin['sha256'])
            exclusive(installed, name, data, pin['mode'])
        same_name(parent, DESTINATION, installed)
        exclusive(installed, 'installation.json', (json.dumps(receipt, sort_keys=True, indent=2) + '\n').encode(), 0o600)
        os.fsync(installed);os.fsync(parent)
        same_name(parent, DESTINATION, installed)
    finally:
        os.close(installed)


def plan(home=None):
    home = os.path.expanduser('~') if home is None else home
    return {'apply': False, 'asset': ASSET, 'root': home + '/local/' + DESTINATION, 'executables': ['age', 'age-keygen'], 'licenseRetained': True, 'environmentChanged': False, 'driveChanged': False, 'persistentKeysCreated': 0}


def node0_guard():
    if sys.platform != 'darwin' or platform.machine() != 'arm64' or os.getuid() == 0:
        fail('node0_age_wrong_machine')
    info = subprocess.run(['/sbin/ifconfig'], stdout=subprocess.PIPE, stderr=subprocess.PIPE, timeout=5)
    if info.returncode or len(info.stdout) > 131072 or not re.search(rb'^\s+inet 192\.168\.0\.23(?:\s|$)', info.stdout, re.M):
        fail('node0_age_wrong_machine')


def install(home=None, fetcher=download):
    """Internal test seam accepts a downloader function; CLI never accepts asset overrides."""
    home = os.path.expanduser('~') if home is None else home
    homefd = open_root(home);local = lock = scratch = installed = None;temporary = None
    try:
        owned_dir(homefd)
        try:
            os.mkdir('local', 0o700, dir_fd=homefd)
        except FileExistsError:
            pass
        local = os.open('local', DIR, dir_fd=homefd);owned_dir(local)
        lock = os.open('.age-v1.3.2.install.lock', os.O_RDWR | os.O_CREAT | os.O_NOFOLLOW | os.O_NONBLOCK, 0o600, dir_fd=local)
        info = os.fstat(lock)
        if not stat.S_ISREG(info.st_mode) or info.st_nlink != 1 or info.st_uid != os.getuid() or stat.S_IMODE(info.st_mode) != 0o600 or info.st_size:
            fail('node0_age_unsafe_lock')
        try:
            fcntl.flock(lock, fcntl.LOCK_EX | fcntl.LOCK_NB)
        except BlockingIOError:
            fail('node0_age_install_busy')
        try:
            os.stat(DESTINATION, dir_fd=local, follow_symlinks=False)
            exists = True
        except FileNotFoundError:
            exists = False
        if exists:
            installed = verify_installation(local)
        temporary, scratch = fresh_directory(local, '.age-install-')
        if not exists:
            fetcher(scratch)
            selected = decode_archive(asset_bytes(scratch))
            for name, data in selected.items():
                same_name(local, temporary, scratch)
                exclusive(scratch, name, data, SELECTED[name]['mode'])
        canary = verify_canary(installed if exists else scratch, scratch)
        receipt = {'schema': 'sdp.node0.age.install.v1', 'verifiedAt': datetime.now(timezone.utc).isoformat(), 'version': ASSET['version'], 'assetId': ASSET['id'], 'assetSha256': ASSET['sha256'], 'alreadyInstalled': exists, 'root': home + '/local/' + DESTINATION, 'binaries': SELECTED, 'canary': canary, 'environmentChanged': False, 'driveChanged': False, 'recipientConfigRead': False, 'persistentKeysCreated': 0, 'postgresqlDataRead': False, 'mirrorConfigured': False}
        if not exists:
            same_name(local, temporary, scratch)
            publish_installation(local, scratch, receipt)
        return receipt
    finally:
        cleanup_error = None
        if installed is not None:
            os.close(installed)
        if scratch is not None:
            try:
                cleanup_directory(local, temporary, scratch, set(SELECTED) | {'archive.tar.gz', 'identity', 'canary', 'ciphertext', 'decoded'})
            except BaseException as error:
                cleanup_error = error
            finally:
                os.close(scratch)
        for fd in (lock, local, homefd):
            if fd is not None:
                os.close(fd)
        if cleanup_error is not None:
            raise cleanup_error


def main(args=None):
    args = sys.argv[1:] if args is None else args
    if args not in ([], ['--apply']):
        fail('node0_age_invalid_arguments')
    if not args:
        return plan()
    node0_guard()
    return install()


if __name__ == '__main__':
    try:
        print(json.dumps(main(), sort_keys=True))
    except BaseException as error:
        print(json.dumps({'ok': False, 'error': str(error) if isinstance(error, Failure) else 'node0_age_install_failed'}), file=sys.stderr)
        sys.exit(1)
