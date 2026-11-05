#!/usr/bin/env python3
"""Provision one local HMAC capability, never a recovery age identity.
No secret/hash output, no environment edit and no Drive access. Idempotent;
never overwrite an existing key. A lost HMAC key requires separately trusted
historical checkpoints. This does not prove offsite age recovery custody.
"""
import fcntl
import json
import os
import secrets
import stat
import sys

KEY = 'workspace-mirror-authentication.bin'
FLAGS = os.O_RDONLY | os.O_DIRECTORY | os.O_NOFOLLOW


def fail():
    raise RuntimeError('mirror_authentication_provision_failed')


def provision(home):
    if not isinstance(home, str) or not home.startswith('/') or os.path.normpath(home) != home:
        fail()
    fd = os.open('/', FLAGS)
    try:
        for part in (home + '/.config/socdepoble').split('/')[1:]:
            next_fd = os.open(part, FLAGS, dir_fd=fd)
            os.close(fd)
            fd = next_fd
            info = os.fstat(fd)
            if info.st_uid not in (0, os.getuid()) or (info.st_mode & 0o022 and not (info.st_uid == 0 and info.st_mode & stat.S_ISVTX)):
                fail()
        info = os.fstat(fd)
        if info.st_uid != os.getuid() or stat.S_IMODE(info.st_mode) != 0o700:
            fail()
        lock = os.open('.mirror-authentication.lock', os.O_RDWR | os.O_CREAT | os.O_NOFOLLOW, 0o600, dir_fd=fd)
        try:
            info = os.fstat(lock)
            if not stat.S_ISREG(info.st_mode) or info.st_uid != os.getuid() or info.st_nlink != 1 or stat.S_IMODE(info.st_mode) != 0o600:
                fail()
            fcntl.flock(lock, fcntl.LOCK_EX | fcntl.LOCK_NB)
            try:
                existing = os.stat(KEY, dir_fd=fd, follow_symlinks=False)
            except FileNotFoundError:
                existing = None
            if existing is not None:
                if not stat.S_ISREG(existing.st_mode) or existing.st_nlink != 1 or existing.st_uid != os.getuid() or stat.S_IMODE(existing.st_mode) != 0o600 or existing.st_size != 32:
                    fail()
                return {'provisioned': True, 'created': False, 'secretRead': False, 'secretPrinted': False}
            temp = '.mirror-authentication-' + secrets.token_hex(12) + '.tmp'
            out = os.open(temp, os.O_WRONLY | os.O_CREAT | os.O_EXCL | os.O_NOFOLLOW, 0o600, dir_fd=fd)
            try:
                os.fchmod(out, 0o600)
                data = secrets.token_bytes(32)
                if os.write(out, data) != 32:
                    fail()
                os.fsync(out)
            finally:
                os.close(out)
            try:
                os.link(temp, KEY, src_dir_fd=fd, dst_dir_fd=fd, follow_symlinks=False)
                os.fsync(fd)
            finally:
                os.unlink(temp, dir_fd=fd)
                os.fsync(fd)
            return {'provisioned': True, 'created': True, 'secretRead': False, 'secretPrinted': False}
        finally:
            os.close(lock)
    finally:
        os.close(fd)


def main(args):
    if not args:
        return {'apply': False, 'action': 'provision-local-mirror-authentication', 'environmentWritten': False}
    if args != ['--apply'] or sys.platform != 'darwin' or os.uname().machine != 'arm64' or os.getuid() != 501 or os.path.expanduser('~') != '/Users/javi':
        fail()
    return provision('/Users/javi')


if __name__ == '__main__':
    try:
        print(json.dumps(main(sys.argv[1:]), separators=(',', ':')))
    except BaseException:
        print('mirror_authentication_provision_failed', file=sys.stderr)
        sys.exit(1)
