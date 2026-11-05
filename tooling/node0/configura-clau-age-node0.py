#!/usr/bin/env python3
"""Public recipient configuration only. Never generate/read/delete an identity."""
import fcntl
import hashlib
import json
import os
from pathlib import Path
import re
import secrets
import stat
import sys
import types

HELPER_SHA = '0f528d8d4b6090a2ea1bdcb13f12193e030b2d8b874ed1a3e5b9e0940d93ed17'
KEY = 'workspace-node0.agekey'
ACCOUNT = 'socdepoble@socdepoble.org'
TARGETS = ('SDP_WORKSPACE_AGE_RECIPIENT', 'SDP_WORKSPACE_ACCOUNT', 'SDP_NODE0_MAIL_FROM')
ASSIGNMENT = re.compile(rb'^([ \t]*(?:export[ \t]+)?)([A-Za-z_][A-Za-z0-9_]*)([ \t]*=[ \t]*)(.*)$')
DIR = os.O_RDONLY | os.O_DIRECTORY | os.O_NOFOLLOW


class Failure(Exception):
    pass


def fail(code):
    raise Failure(code)


def helper():
    source = Path(__file__).with_name('installa-age-node0.py')
    fd = os.open(source, os.O_RDONLY | os.O_NOFOLLOW | os.O_NONBLOCK)
    try:
        info = os.fstat(fd)
        if not stat.S_ISREG(info.st_mode) or info.st_nlink != 1 or info.st_uid != os.getuid() or info.st_size > 65536:
            fail('node0_age_key_helper_unsafe')
        with os.fdopen(os.dup(fd), 'rb') as stream:
            data = stream.read(65537)
    finally:
        os.close(fd)
    # This hash is of reviewed PUBLIC program code, never a private key or env.
    if hashlib.sha256(data).hexdigest() != HELPER_SHA:
        fail('node0_age_key_helper_pin')
    module = types.ModuleType('node0_age_pinned_helper')
    module.__file__ = str(source)
    exec(compile(data, str(source), 'exec'), module.__dict__)
    return module


def quote_end(value, quote, start=1):
    escaped = False
    for index in range(start, len(value)):
        char = value[index]
        if quote == 34 and char == 92:
            escaped = not escaped
            continue
        if char == quote and not escaped:
            return index
        escaped = False
    return None


def split_value(value):
    if value[:1] in (b'"', b"'"):
        end = quote_end(value, value[0])
        if end is None:
            fail('node0_age_key_target_multiline')
        tail = value[end + 1:]
        if tail.strip() and not tail.lstrip().startswith(b'#'):
            fail('node0_age_key_target_syntax')
        return value[1:end], tail
    comment = value.find(b'#')
    before, suffix = (value[:comment], value[comment:]) if comment >= 0 else (value, b'')
    trimmed = before.rstrip(b' \t')
    return trimmed, before[len(trimmed):] + suffix


def parse_env(data):
    if len(data) > 1048576 or b'\0' in data:
        fail('node0_age_key_env_format')
    data.decode('utf-8', errors='strict')
    chunks = data.split(b'\n')
    lines = []
    for index, chunk in enumerate(chunks):
        if index == len(chunks) - 1 and not chunk:
            continue
        ending = b'\n' if index < len(chunks) - 1 else b''
        if chunk.endswith(b'\r') and ending:
            chunk, ending = chunk[:-1], b'\r\n'
        if b'\r' in chunk:
            fail('node0_age_key_env_format')
        lines.append((chunk, ending))
    records, multiline = {}, None
    for index, (body, ending) in enumerate(lines):
        if multiline is not None:
            if quote_end(body, multiline, start=0) is not None:
                multiline = None
            continue
        match = ASSIGNMENT.match(body)
        if not match:
            continue
        name = match.group(2).decode('ascii')
        value = match.group(4)
        if name in TARGETS:
            if name in records:
                fail('node0_age_key_duplicate_target')
            current, tail = split_value(value)
            records[name] = (index, match.group(1) + match.group(2) + match.group(3), current, tail, ending)
        elif value[:1] in (b'"', b"'") and quote_end(value, value[0]) is None:
            multiline = value[0]
    if multiline is not None:
        fail('node0_age_key_env_unterminated_quote')
    return lines, records


def render_env(data, recipient):
    valid_recipient(recipient)
    lines, records = parse_env(data)
    values = {'SDP_WORKSPACE_AGE_RECIPIENT': recipient, 'SDP_WORKSPACE_ACCOUNT': ACCOUNT, 'SDP_NODE0_MAIL_FROM': ACCOUNT}
    rendered = [body + ending for body, ending in lines]
    missing = []
    newline = b'\r\n' if data.count(b'\r\n') > data.count(b'\n') / 2 else b'\n'
    for name in TARGETS:
        wanted = values[name].encode('ascii')
        if name not in records:
            missing.append(name.encode() + b'=' + wanted + newline)
            continue
        index, prefix, current, tail, ending = records[name]
        if current != wanted:
            rendered[index] = prefix + wanted + tail + ending
    output = b''.join(rendered)
    if missing:
        if output and not output.endswith(b'\n'):
            output += newline
        output += b''.join(missing)
    return output


def read_env(config):
    try:
        fd = os.open('node0.env', os.O_RDONLY | os.O_NOFOLLOW | os.O_NONBLOCK, dir_fd=config)
    except FileNotFoundError:
        return None, b''
    try:
        before = os.fstat(fd)
        if not stat.S_ISREG(before.st_mode) or before.st_nlink != 1 or before.st_uid != os.getuid() or stat.S_IMODE(before.st_mode) != 0o600 or before.st_size > 1048576:
            fail('node0_age_key_env_unsafe')
        with os.fdopen(os.dup(fd), 'rb') as stream:
            data = stream.read(1048577)
        after = os.fstat(fd)
        named = os.stat('node0.env', dir_fd=config, follow_symlinks=False)
        fields = ('st_dev', 'st_ino', 'st_size', 'st_mtime_ns', 'st_ctime_ns', 'st_mode')
        state = tuple(getattr(before, key) for key in fields)
        if len(data) > 1048576 or state != tuple(getattr(after, key) for key in fields) or (after.st_dev, after.st_ino) != (named.st_dev, named.st_ino):
            fail('node0_age_key_env_drift')
        return state, data
    finally:
        os.close(fd)


def valid_recipient(value):
    alphabet = 'qpzry9x8gf2tvdw0s3jn54khce6mua7l'
    if not isinstance(value, str) or not re.fullmatch(r'age1[023456789acdefghjklmnpqrstuvwxyz]{58}', value):
        fail('node0_age_key_recipient_format')
    values = [alphabet.index(c) for c in value[4:]]
    chk = 1
    for item in [3, 3, 3, 0, 1, 7, 5] + values:
        top = chk >> 25
        chk = ((chk & 0x1ffffff) << 5) ^ item
        for i, generator in enumerate((0x3b6a57b2,0x26508e6d,0x1ea119fa,0x3d4233dd,0x2a1462b3)):
            if (top >> i) & 1:
                chk ^= generator
    if chk != 1 or values[51] % 16 != 0:
        fail('node0_age_key_recipient_format')
    return value


def update_env(age, config, expected, data, updated, check):
    if data == updated:
        check()
        if read_env(config) != (expected, data):
            fail('node0_age_key_env_cas_mismatch')
        return False
    name = '.node0-env-age-' + secrets.token_hex(12)
    age.exclusive(config, name, updated, 0o600)
    temporary = os.stat(name, dir_fd=config, follow_symlinks=False)
    try:
        check()
        if read_env(config) != (expected, data):
            fail('node0_age_key_env_cas_mismatch')
        # Cooperative .node0-env.lock lease is required for all env writers.
        os.replace(name, 'node0.env', src_dir_fd=config, dst_dir_fd=config)
        os.fsync(config);check()
        if read_env(config)[1] != updated:
            fail('node0_age_key_env_commit_changed')
        return True
    finally:
        try:
            current = os.stat(name, dir_fd=config, follow_symlinks=False)
        except FileNotFoundError:
            current = None
        if current is not None and (current.st_dev, current.st_ino) == (temporary.st_dev, temporary.st_ino):
            os.unlink(name, dir_fd=config)


def configure(home=None, recipient=None):
    valid_recipient(recipient)
    age = helper()
    home = os.path.expanduser('~') if home is None else home
    homefd = age.open_root(home)
    config_parent = config = lock = None
    try:
        age.owned_dir(homefd)
        try:os.mkdir('.config', 0o700, dir_fd=homefd)
        except FileExistsError:pass
        config_parent = os.open('.config', DIR, dir_fd=homefd);age.owned_dir(config_parent)
        try:os.mkdir('socdepoble', 0o700, dir_fd=config_parent)
        except FileExistsError:pass
        config = os.open('socdepoble', DIR, dir_fd=config_parent);age.owned_dir(config, private=True)
        def check():
            age.same_name(homefd, '.config', config_parent);age.same_name(config_parent, 'socdepoble', config);age.owned_dir(config, private=True)
        check()
        lock = os.open('.node0-env.lock', os.O_RDWR | os.O_CREAT | os.O_NOFOLLOW | os.O_NONBLOCK, 0o600, dir_fd=config)
        info = os.fstat(lock)
        if not stat.S_ISREG(info.st_mode) or info.st_nlink != 1 or info.st_uid != os.getuid() or stat.S_IMODE(info.st_mode) != 0o600 or info.st_size:
            fail('node0_age_key_lock_unsafe')
        try:fcntl.flock(lock, fcntl.LOCK_EX | fcntl.LOCK_NB)
        except BlockingIOError:fail('node0_age_key_lock_busy')
        expected, data = read_env(config);parse_env(data)
        # Metadata only. Preserve a legacy identity unchanged for the two-phase
        # handoff; presence cannot establish an external custody claim.
        try:
            os.stat(KEY, dir_fd=config, follow_symlinks=False)
            legacy_present = True
        except FileNotFoundError:
            legacy_present = False
        updated = render_env(data, recipient);check()
        changed = update_env(age, config, expected, data, updated, check)
        return {'schema':'sdp.node0.age-public-recipient-config.v2', 'privateIdentityGenerated':False, 'privateIdentityRead':False, 'legacyLocalIdentityPresent':legacy_present, 'externalCustodyVerified':False, 'r5CustodyClosed':False, 'recipientConfigured':True, 'account':ACCOUNT, 'mailFrom':ACCOUNT, 'environmentChanged':changed, 'managedFields':list(TARGETS), 'mirrorDirWritten':False, 'driveTouched':False, 'privateKeyOutputLogged':False, 'privateKeyDigestComputed':False}
    finally:
        for fd in (lock, config, config_parent, homefd):
            if fd is not None:os.close(fd)


def plan():
    return {'apply':False, 'publicRecipientRequired':True, 'privateIdentityGenerated':False, 'privateIdentityRead':False, 'externalCustodyVerified':False, 'r5CustodyClosed':False, 'directoryMode':'0700', 'managedFields':list(TARGETS), 'account':ACCOUNT, 'mirrorDirWritten':False, 'driveTouched':False}


if __name__ == '__main__':
    try:
        argv=sys.argv[1:]
        if argv not in ([],) and not (len(argv) in (2,3) and argv[0]=='--recipient' and (len(argv)==2 or argv[2]=='--apply')):
            fail('node0_age_key_invalid_arguments')
        recipient=valid_recipient(argv[1]) if argv else None
        if len(argv)!=3:result=plan()
        else:helper().node0_guard();result=configure(recipient=recipient)
        print(json.dumps(result,sort_keys=True))
    except BaseException as error:
        print(json.dumps({'ok':False,'error':str(error) if isinstance(error,Failure) else 'node0_age_key_operation_failed'}),file=sys.stderr)
        sys.exit(1)
