"""Ставит кэш статики и HTTP/2 в конфиг nginx. Откатывает файл, если nginx -t падает."""
from __future__ import annotations

import shutil
import subprocess
import sys
from pathlib import Path

SNIPPET_NAME = "dorogadomoy-static-cache.conf"
NEEDLES = ("dorogadomoy", "DorogaDomoy")


def nginx_bin() -> str | None:
    return shutil.which("nginx")


def site_files() -> list[Path]:
    found: list[Path] = []
    for folder in (Path("/etc/nginx/sites-enabled"), Path("/etc/nginx/conf.d")):
        if not folder.is_dir():
            continue
        for path in sorted(folder.iterdir()):
            if not path.is_file():
                continue
            try:
                text = path.read_text(encoding="utf-8", errors="replace")
            except OSError:
                continue
            if any(needle in text for needle in NEEDLES):
                found.append(path)
    return found


def patch(text: str, include_line: str) -> str:
    if include_line not in text:
        lines = text.splitlines(keepends=True)
        out: list[str] = []
        inserted = False
        for line in lines:
            out.append(line)
            if inserted:
                continue
            stripped = line.strip()
            if stripped.startswith("server_name") and any(needle in stripped for needle in NEEDLES):
                indent = line[: len(line) - len(line.lstrip())]
                out.append(f"{indent}{include_line}\n")
                inserted = True
        if not inserted:
            out = []
            for line in lines:
                out.append(line)
                if not inserted and line.strip().startswith("server") and "{" in line:
                    indent = line[: len(line) - len(line.lstrip())] + "    "
                    out.append(f"{indent}{include_line}\n")
                    inserted = True
        text = "".join(out)

    if "http2" in text:
        return text

    patched: list[str] = []
    for line in text.splitlines(keepends=True):
        core = line.rstrip("\r\n")
        ending = line[len(core) :]
        stripped = core.strip()
        if (
            stripped.startswith("listen")
            and "443" in stripped
            and "ssl" in stripped
            and "http2" not in stripped
            and stripped.endswith(";")
        ):
            core = core.rstrip()[:-1] + " http2;"
        patched.append(core + ending)
    return "".join(patched)


def main() -> int:
    if nginx_bin() is None:
        print("nginx не найден, кэш и HTTP/2 не применены")
        return 0
    repo = Path(__file__).resolve().parents[2]
    src = repo / "deploy" / "nginx" / SNIPPET_NAME
    dst_dir = Path("/etc/nginx/snippets")
    dst_dir.mkdir(parents=True, exist_ok=True)
    dst = dst_dir / SNIPPET_NAME
    shutil.copyfile(src, dst)
    include_line = f"include {dst};"
    files = site_files()
    if not files:
        print(f"конфиг сайта не найден. Добавьте в server {{ }}: {include_line}")
        return 0

    backups: list[tuple[Path, str]] = []
    for path in files:
        original = path.read_text(encoding="utf-8")
        backups.append((path, original))
        path.write_text(patch(original, include_line), encoding="utf-8")
    test = subprocess.run([nginx_bin() or "nginx", "-t"], capture_output=True, text=True)
    if test.returncode != 0:
        sys.stderr.write(test.stderr or test.stdout)
        for path, original in backups:
            path.write_text(original, encoding="utf-8")
        print("nginx -t не прошёл, конфиг восстановлен")
        return 0
    print(f"кэш статики и HTTP/2: {', '.join(str(path) for path in files)}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
