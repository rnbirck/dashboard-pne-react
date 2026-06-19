from __future__ import annotations

import argparse
import json
import re
import unicodedata
from datetime import datetime, timezone
from pathlib import Path


BASE_DIR = Path(__file__).resolve().parents[1]
SOURCE_DIR = BASE_DIR / "export" / "data"
OUTPUT_DIR = BASE_DIR / "export" / "data_partitioned"

CYCLES = ("pne_2014_2024", "pne_2026_2036")


def slugify(value: str, fallback: str = "municipio") -> str:
    normalized = unicodedata.normalize("NFKD", value)
    ascii_value = "".join(ch for ch in normalized if not unicodedata.combining(ch))
    slug = re.sub(r"[^a-zA-Z0-9]+", "-", ascii_value.lower()).strip("-")
    slug = re.sub(r"-+", "-", slug)
    return slug or fallback


def unique_slugs(names: list[str]) -> dict[str, str]:
    used: dict[str, int] = {}
    result: dict[str, str] = {}

    for name in names:
        base_slug = slugify(name)
        count = used.get(base_slug, 0) + 1
        used[base_slug] = count
        result[name] = base_slug if count == 1 else f"{base_slug}-{count}"

    return result


def load_json(path: Path) -> dict:
    with path.open("r", encoding="utf-8") as file:
        return json.load(file)


def load_optional_json(path: Path, fallback: dict | None = None) -> dict:
    if path.exists():
        return load_json(path)
    return fallback or {}


def render_json(payload: dict) -> str:
    return json.dumps(payload, ensure_ascii=False, indent=2) + "\n"


def record_write(path: Path, expected_paths: set[Path]) -> None:
    expected_paths.add(path.resolve())


def write_text_if_changed(path: Path, content: str, stats: dict[str, int]) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)

    if path.exists():
        current = path.read_text(encoding="utf-8")
        if current == content:
            stats["preserved"] += 1
            return
        action = "updated"
    else:
        action = "created"

    path.write_text(content, encoding="utf-8")
    stats[action] += 1


def write_json(
    path: Path,
    payload: dict,
    stats: dict[str, int],
    expected_paths: set[Path],
) -> None:
    record_write(path, expected_paths)
    write_text_if_changed(path, render_json(payload), stats)


def copy_file_if_changed(
    source: Path,
    destination: Path,
    stats: dict[str, int],
    expected_paths: set[Path],
) -> None:
    record_write(destination, expected_paths)
    destination.parent.mkdir(parents=True, exist_ok=True)
    content = source.read_bytes()

    if destination.exists():
        if destination.read_bytes() == content:
            stats["preserved"] += 1
            return
        action = "updated"
    else:
        action = "created"

    destination.write_bytes(content)
    stats[action] += 1


def safe_prepare_output_dir() -> None:
    resolved_output = OUTPUT_DIR.resolve()
    expected_parent = (BASE_DIR / "export").resolve()

    if resolved_output.parent != expected_parent:
        raise RuntimeError(f"Diretório de saída inesperado: {resolved_output}")

    OUTPUT_DIR.mkdir(parents=True, exist_ok=True)


def remove_orphan_json_files(
    output_dir: Path,
    expected_paths: set[Path],
    stats: dict[str, int],
) -> None:
    expected = {path.resolve() for path in expected_paths}

    for path in output_dir.rglob("*.json"):
        if path.resolve() in expected:
            continue
        path.unlink()
        stats["removed"] += 1

    directories = [path for path in output_dir.rglob("*") if path.is_dir()]
    for directory in sorted(directories, key=lambda path: len(path.parts), reverse=True):
        if directory == output_dir:
            continue
        try:
            directory.rmdir()
        except OSError:
            pass


def load_aggregate_payloads() -> dict[str, dict]:
    payloads = {
        "municipios": load_json(SOURCE_DIR / "municipios.json"),
        "indicadores": load_json(SOURCE_DIR / "indicadores.json"),
    }

    for cycle in CYCLES:
        payloads[f"{cycle}_indicadores"] = load_json(
            SOURCE_DIR / cycle / "indicadores_por_municipio.json"
        )
        payloads[f"{cycle}_rankings"] = load_optional_json(
            SOURCE_DIR / cycle / "rankings_por_municipio.json"
        )

    payloads["diagnostico"] = load_optional_json(
        SOURCE_DIR / "pne_2026_2036" / "diagnostico_por_municipio.json"
    )
    payloads["indicator_details"] = load_json(
        SOURCE_DIR / "indicator_details_por_municipio.json"
    )
    return payloads


def extract_results(payload: dict, municipio: str) -> dict:
    return payload.get("municipios", {}).get(municipio, {}).get("results", {})


def extract_rankings(payload: dict, municipio: str) -> dict:
    return payload.get("municipios", {}).get(municipio, {}).get("categories", {})


def extract_diagnostico(payload: dict, municipio: str) -> dict:
    return payload.get("municipios", {}).get(municipio, {})


def extract_indicator_details(payload: dict, municipio: str) -> dict:
    return payload.get("municipios", {}).get(municipio, {}).get("indicator_details", {})


def build_municipio_payload(payloads: dict[str, dict], municipio: str, slug: str) -> dict:
    return {
        "municipio": municipio,
        "slug": slug,
        "pne_2014_2024": {
            "indicadores": extract_results(payloads["pne_2014_2024_indicadores"], municipio),
            "rankings": extract_rankings(payloads["pne_2014_2024_rankings"], municipio),
        },
        "pne_2026_2036": {
            "indicadores": extract_results(payloads["pne_2026_2036_indicadores"], municipio),
            "rankings": extract_rankings(payloads["pne_2026_2036_rankings"], municipio),
            "diagnostico": extract_diagnostico(payloads["diagnostico"], municipio),
        },
        "indicator_details": extract_indicator_details(payloads["indicator_details"], municipio),
    }


def format_size(bytes_count: int) -> str:
    units = ("B", "KB", "MB", "GB")
    size = float(bytes_count)
    for unit in units:
        if size < 1024 or unit == units[-1]:
            return f"{size:.1f} {unit}"
        size /= 1024
    return f"{bytes_count} B"


def resolve_generated_at(payloads: dict[str, dict]) -> str:
    generated_at = payloads.get("municipios", {}).get("generated_at")
    if generated_at:
        return str(generated_at)
    return datetime.now(timezone.utc).isoformat()


def main() -> int:
    global SOURCE_DIR, OUTPUT_DIR

    parser = argparse.ArgumentParser(
        description="Particiona os JSONs exportados do Dashboard PNE por município."
    )
    parser.add_argument(
        "--source-dir",
        default=str(SOURCE_DIR),
        help="Diretório com os JSONs agregados gerados por export_static_data.py.",
    )
    parser.add_argument(
        "--output-dir",
        default=str(OUTPUT_DIR),
        help="Diretório onde os JSONs particionados serão gerados.",
    )
    args = parser.parse_args()

    SOURCE_DIR = Path(args.source_dir).resolve()
    OUTPUT_DIR = Path(args.output_dir).resolve()

    print("[partition] Iniciando particionamento dos dados estáticos.")
    print(f"[partition] Origem: {SOURCE_DIR}")
    print(f"[partition] Saída: {OUTPUT_DIR}")

    payloads = load_aggregate_payloads()
    municipios = payloads["municipios"].get("municipios", [])
    slug_map = unique_slugs(municipios)
    stats = {"created": 0, "updated": 0, "preserved": 0, "removed": 0}
    expected_paths: set[Path] = set()

    safe_prepare_output_dir()

    copy_file_if_changed(
        SOURCE_DIR / "municipios.json",
        OUTPUT_DIR / "municipios.json",
        stats,
        expected_paths,
    )
    copy_file_if_changed(
        SOURCE_DIR / "indicadores.json",
        OUTPUT_DIR / "indicadores.json",
        stats,
        expected_paths,
    )

    generated_at = resolve_generated_at(payloads)
    index_items = [
        {
            "nome": municipio,
            "slug": slug_map[municipio],
            "path": f"/data/municipios/{slug_map[municipio]}/index.json",
        }
        for municipio in municipios
    ]
    write_json(
        OUTPUT_DIR / "municipios_index.json",
        {
            "generated_at": generated_at,
            "total_municipios": len(index_items),
            "municipios": index_items,
        },
        stats,
        expected_paths,
    )

    errors: list[dict[str, str]] = []
    for position, municipio in enumerate(municipios, start=1):
        slug = slug_map[municipio]
        print(f"[partition] {position}/{len(municipios)} {municipio} -> {slug}")
        try:
            municipio_payload = build_municipio_payload(payloads, municipio, slug)
            write_json(
                OUTPUT_DIR / "municipios" / slug / "index.json",
                municipio_payload,
                stats,
                expected_paths,
            )
            for indicator_key, detail_payload in municipio_payload.get("indicator_details", {}).items():
                if detail_payload:
                    write_json(
                        OUTPUT_DIR / "municipios" / slug / "details" / f"{indicator_key}.json",
                        detail_payload,
                        stats,
                        expected_paths,
                    )
        except Exception as exc:  # noqa: BLE001 - keep processing other municipalities.
            errors.append({"municipio": municipio, "slug": slug, "erro": str(exc)})
            print(f"[partition] ERRO em {municipio}: {exc}")

    if errors:
        write_json(
            OUTPUT_DIR / "partition_errors.json",
            {"generated_at": generated_at, "total_erros": len(errors), "errors": errors},
            stats,
            expected_paths,
        )

    remove_orphan_json_files(OUTPUT_DIR, expected_paths, stats)

    files = list(OUTPUT_DIR.rglob("*.json"))
    municipio_files = list((OUTPUT_DIR / "municipios").rglob("index.json"))
    total_size = sum(path.stat().st_size for path in files)
    largest = max(files, key=lambda path: path.stat().st_size)

    print("[partition] Concluído.")
    print(f"[partition] Municípios particionados: {len(municipio_files)}")
    print(f"[partition] Arquivos criados: {stats['created']}")
    print(f"[partition] Arquivos atualizados: {stats['updated']}")
    print(f"[partition] Arquivos preservados: {stats['preserved']}")
    print(f"[partition] Arquivos removidos: {stats['removed']}")
    print(f"[partition] Erros: {len(errors)}")
    print(f"[partition] Arquivos JSON: {len(files)}")
    print(f"[partition] Tamanho total: {format_size(total_size)}")
    print(f"[partition] Maior arquivo: {largest.relative_to(OUTPUT_DIR)} ({format_size(largest.stat().st_size)})")

    return 1 if errors else 0


if __name__ == "__main__":
    raise SystemExit(main())
