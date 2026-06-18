from __future__ import annotations

import argparse
import json
import re
import shutil
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


def write_json(path: Path, payload: dict) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    with path.open("w", encoding="utf-8") as file:
        json.dump(payload, file, ensure_ascii=False, indent=2)
        file.write("\n")


def safe_reset_output_dir() -> None:
    resolved_output = OUTPUT_DIR.resolve()
    expected_parent = (BASE_DIR / "export").resolve()

    if resolved_output.parent != expected_parent:
        raise RuntimeError(f"Diretório de saída inesperado: {resolved_output}")

    if OUTPUT_DIR.exists():
        shutil.rmtree(OUTPUT_DIR)

    OUTPUT_DIR.mkdir(parents=True, exist_ok=True)


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

    safe_reset_output_dir()

    shutil.copy2(SOURCE_DIR / "municipios.json", OUTPUT_DIR / "municipios.json")
    shutil.copy2(SOURCE_DIR / "indicadores.json", OUTPUT_DIR / "indicadores.json")

    generated_at = datetime.now(timezone.utc).isoformat()
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
            )
            for indicator_key, detail_payload in municipio_payload.get("indicator_details", {}).items():
                if detail_payload:
                    write_json(
                        OUTPUT_DIR / "municipios" / slug / "details" / f"{indicator_key}.json",
                        detail_payload,
                    )
        except Exception as exc:  # noqa: BLE001 - keep processing other municipalities.
            errors.append({"municipio": municipio, "slug": slug, "erro": str(exc)})
            print(f"[partition] ERRO em {municipio}: {exc}")

    if errors:
        write_json(
            OUTPUT_DIR / "partition_errors.json",
            {"generated_at": generated_at, "total_erros": len(errors), "errors": errors},
        )

    files = list(OUTPUT_DIR.rglob("*.json"))
    municipio_files = list((OUTPUT_DIR / "municipios").rglob("index.json"))
    total_size = sum(path.stat().st_size for path in files)
    largest = max(files, key=lambda path: path.stat().st_size)

    print("[partition] Concluído.")
    print(f"[partition] Municípios particionados: {len(municipio_files)}")
    print(f"[partition] Erros: {len(errors)}")
    print(f"[partition] Arquivos JSON: {len(files)}")
    print(f"[partition] Tamanho total: {format_size(total_size)}")
    print(f"[partition] Maior arquivo: {largest.relative_to(OUTPUT_DIR)} ({format_size(largest.stat().st_size)})")

    return 1 if errors else 0


if __name__ == "__main__":
    raise SystemExit(main())
