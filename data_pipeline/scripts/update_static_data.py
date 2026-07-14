from __future__ import annotations

import argparse
import os
import subprocess
import sys
import time
from dataclasses import dataclass
from pathlib import Path


REPO_ROOT = Path(__file__).resolve().parents[2]
DATA_PIPELINE_DIR = REPO_ROOT / "data_pipeline"
PARTITIONED_DATA_DIR = DATA_PIPELINE_DIR / "export" / "data_partitioned"
PUBLIC_DATA_DIR = REPO_ROOT / "public" / "data"

PYTHON = sys.executable
NPM = "npm.cmd" if os.name == "nt" else "npm"

try:
    sys.stdout.reconfigure(line_buffering=True)
except AttributeError:
    pass


@dataclass
class StepResult:
    name: str
    status: str
    duration: float | None = None


def format_command(command: list[str]) -> str:
    return " ".join(command)


def run_git_status() -> str:
    result = subprocess.run(
        ["git", "status", "--short"],
        cwd=REPO_ROOT,
        text=True,
        capture_output=True,
        check=False,
    )
    if result.returncode != 0:
        raise RuntimeError(result.stderr.strip() or "git status failed")
    return result.stdout.rstrip()


def status_paths(status_output: str) -> list[str]:
    paths: list[str] = []
    for line in status_output.splitlines():
        if not line:
            continue
        raw_path = line[3:].strip()
        if " -> " in raw_path:
            paths.extend(part.strip().strip('"') for part in raw_path.split(" -> "))
        else:
            paths.append(raw_path.strip('"'))
    return paths


def is_allowed_update_path(path: str) -> bool:
    normalized = path.replace("\\", "/")
    return normalized == "public/data" or normalized.startswith("public/data/")


def ensure_git_update_safe() -> None:
    status = run_git_status()
    if not status:
        print("[update-data] Git status inicial: limpo.")
        return

    blocked = [path for path in status_paths(status) if not is_allowed_update_path(path)]
    if blocked:
        print("[update-data] Git status inicial:")
        print(status)
        print("[update-data] Alteracoes fora de public/data impedem o update completo:")
        for path in blocked:
            print(f"  - {path}")
        raise SystemExit(1)

    print("[update-data] Git status inicial contem apenas alteracoes permitidas em public/data.")


def run_command(name: str, command: list[str], results: list[StepResult]) -> None:
    print(f"[update-data] Iniciando {name}: {format_command(command)}")
    start = time.perf_counter()
    completed = subprocess.run(command, cwd=REPO_ROOT, check=False)
    duration = time.perf_counter() - start
    if completed.returncode != 0:
        results.append(StepResult(name, "erro", duration))
        print(f"[update-data] ERRO em {name} apos {duration:.1f}s.")
        raise SystemExit(completed.returncode)
    results.append(StepResult(name, "ok", duration))
    print(f"[update-data] {name} concluido em {duration:.1f}s.")


def iter_files(root: Path) -> list[Path]:
    return sorted(path for path in root.rglob("*") if path.is_file())


def sync_partitioned_to_public(results: list[StepResult]) -> None:
    name = "sync"
    print(f"[update-data] Iniciando {name}: {PARTITIONED_DATA_DIR} -> {PUBLIC_DATA_DIR}")
    start = time.perf_counter()

    if not PARTITIONED_DATA_DIR.exists():
        raise SystemExit(f"[update-data] Diretorio particionado nao encontrado: {PARTITIONED_DATA_DIR}")
    if not PUBLIC_DATA_DIR.exists():
        raise SystemExit(f"[update-data] Diretorio public/data nao encontrado: {PUBLIC_DATA_DIR}")

    source_files = iter_files(PARTITIONED_DATA_DIR)
    expected_targets: set[Path] = set()
    created = updated = preserved = removed = 0

    for source in source_files:
        relative = source.relative_to(PARTITIONED_DATA_DIR)
        target = PUBLIC_DATA_DIR / relative
        expected_targets.add(target.resolve())
        target.parent.mkdir(parents=True, exist_ok=True)

        source_bytes = source.read_bytes()
        if target.exists():
            if target.read_bytes() == source_bytes:
                preserved += 1
                continue
            action = "updated"
        else:
            action = "created"

        target.write_bytes(source_bytes)
        if action == "created":
            created += 1
        else:
            updated += 1

    preserved_roots = {(PUBLIC_DATA_DIR / "educacao").resolve()}

    for target in iter_files(PUBLIC_DATA_DIR):
        if target.suffix.lower() != ".json":
            continue
        if any(root in target.resolve().parents for root in preserved_roots):
            continue
        if target.resolve() not in expected_targets:
            target.unlink()
            removed += 1

    for directory in sorted(
        (path for path in PUBLIC_DATA_DIR.rglob("*") if path.is_dir()),
        key=lambda path: len(path.parts),
        reverse=True,
    ):
        try:
            directory.rmdir()
        except OSError:
            pass

    duration = time.perf_counter() - start
    results.append(StepResult(name, "ok", duration))
    print(f"[update-data] {name} concluido em {duration:.1f}s.")
    print(f"[update-data] sync criados: {created}")
    print(f"[update-data] sync atualizados: {updated}")
    print(f"[update-data] sync preservados: {preserved}")
    print(f"[update-data] sync removidos: {removed}")


def print_dry_run(commands: list[tuple[str, list[str]]], run_sync: bool, run_build: bool) -> None:
    print("[update-data] Dry run: nenhum comando que altera arquivos sera executado.")
    print("[update-data] Checagem segura: git status --short")
    status = run_git_status()
    print(status or "[update-data] Git status atual: limpo.")

    for name, command in commands:
        print(f"[update-data] Rodaria {name}: {format_command(command)}")
    if run_sync:
        print(f"[update-data] Rodaria sync: {PARTITIONED_DATA_DIR} -> {PUBLIC_DATA_DIR}")
    if run_build:
        print(f"[update-data] Rodaria build: {format_command([NPM, 'run', 'build'])}")


def print_summary(
    results: list[StepResult],
    skipped: list[str],
    validate_ok: bool,
    build_ok: bool | None,
    profile: bool = False,
) -> None:
    print("[update-data] Resumo:")
    for result in results:
        duration = "" if result.duration is None else f" ({result.duration:.1f}s)"
        print(f"  - {result.name}: {result.status}{duration}")
    for name in skipped:
        print(f"  - {name}: pulado")
    print(f"[update-data] validate:details: {'passou' if validate_ok else 'nao executado'}")
    if build_ok is None:
        print("[update-data] build: nao executado")
    else:
        print(f"[update-data] build: {'passou' if build_ok else 'falhou'}")
    if profile:
        print("[update-data] Perfil por duração:")
        for result in sorted(
            results,
            key=lambda item: item.duration or 0,
            reverse=True,
        ):
            print(f"  - {result.name}: {(result.duration or 0):.3f}s")
    print("[update-data] Git status final:")
    print(run_git_status() or "  limpo")


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(
        description="Orquestra export, partition, sync, validacao e build dos dados estaticos."
    )
    parser.add_argument("--dry-run", action="store_true", help="Mostra as etapas sem alterar arquivos.")
    parser.add_argument("--skip-export", action="store_true", help="Pula a etapa de export.")
    parser.add_argument("--skip-partition", action="store_true", help="Pula partition e sync para public/data.")
    parser.add_argument("--skip-build", action="store_true", help="Pula npm run build.")
    parser.add_argument("--validate-only", action="store_true", help="Roda apenas npm run validate:details.")
    parser.add_argument(
        "--no-include-derived",
        action="store_true",
        help="Executa o export sem --include-derived.",
    )
    parser.add_argument(
        "--profile",
        action="store_true",
        help="Mostra o perfil das etapas do export, partition, sync, validação e build.",
    )
    return parser.parse_args()


def main() -> int:
    args = parse_args()
    results: list[StepResult] = []
    skipped: list[str] = []

    export_command = [PYTHON, "data_pipeline/scripts/export_static_data.py"]
    if not args.no_include_derived:
        export_command.append("--include-derived")
    if args.profile:
        export_command.append("--profile")
    partition_command = [PYTHON, "data_pipeline/scripts/partition_static_data.py"]
    validate_command = [NPM, "run", "validate:details"]
    build_command = [NPM, "run", "build"]

    if args.validate_only:
        if args.dry_run:
            print_dry_run([("validate", validate_command)], run_sync=False, run_build=False)
            return 0
        run_command("validate", validate_command, results)
        print_summary(
            results,
            ["export", "partition", "sync", "build"],
            validate_ok=True,
            build_ok=None,
            profile=args.profile,
        )
        return 0

    run_export = not args.skip_export
    run_partition = not args.skip_partition
    run_sync = run_partition
    run_build = not args.skip_build

    planned_commands: list[tuple[str, list[str]]] = []
    if run_export:
        planned_commands.append(("export", export_command))
    if run_partition:
        planned_commands.append(("partition", partition_command))
    planned_commands.append(("validate", validate_command))

    if args.dry_run:
        print_dry_run(planned_commands, run_sync=run_sync, run_build=run_build)
        return 0

    if run_export or run_partition or run_sync:
        ensure_git_update_safe()

    if run_export:
        run_command("export", export_command, results)
    else:
        skipped.append("export")

    if run_partition:
        run_command("partition", partition_command, results)
        sync_partitioned_to_public(results)
    else:
        skipped.extend(["partition", "sync"])

    run_command("validate", validate_command, results)
    validate_ok = True

    build_ok: bool | None = None
    if run_build:
        run_command("build", build_command, results)
        build_ok = True
    else:
        skipped.append("build")

    print_summary(
        results,
        skipped,
        validate_ok=validate_ok,
        build_ok=build_ok,
        profile=args.profile,
    )
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
