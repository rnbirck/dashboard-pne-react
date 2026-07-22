"""Baixa/usa os PDFs oficiais do FNDE e materializa a série anual da QSE."""

from __future__ import annotations

import argparse
import json
from pathlib import Path
import sys
from urllib.request import Request, urlopen

ROOT = Path(__file__).resolve().parents[2]
sys.path.insert(0, str(ROOT / "data_pipeline"))

from src.qse_annual import (  # noqa: E402
    QSE_AUDIT_SOURCES,
    QSE_ANNUAL_SOURCES,
    extract_pdf_lines,
    load_municipalities,
    merge_2025_enrollment_basis,
    parse_qse_enrollment_basis_lines,
    parse_qse_annual_lines,
    parse_qse_monthly_lines,
    reconcile_2024,
    reconcile_monthly_continuity_2024,
    source_digest,
    validate_publication_quality,
    write_publication,
)


def download(url: str) -> bytes:
    request = Request(url, headers={"User-Agent": "Dashboard-PNE-QSE-Annual/1.0"})
    with urlopen(request, timeout=120) as response:
        return response.read()


def read_source(source: dict, source_dir: Path | None, fallback_name: str) -> bytes:
    candidates = []
    if source_dir:
        if source.get("snapshotFile"):
            candidates.append(source_dir / source["snapshotFile"])
        candidates.append(source_dir / fallback_name)
    local_path = next((path for path in candidates if path.exists()), None)
    return local_path.read_bytes() if local_path else download(source["url"])


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument(
        "--source-dir",
        type=Path,
        help="Diretório opcional com snapshots oficiais; arquivos ausentes são baixados.",
    )
    parser.add_argument("--output-root", type=Path, default=ROOT / "public" / "data")
    parser.add_argument(
        "--municipality-index",
        type=Path,
        default=ROOT / "public" / "data" / "municipios_index.json",
    )
    args = parser.parse_args()

    municipalities = load_municipalities(args.municipality_index)
    records_by_year = {}
    quality_by_year = {}
    digests = {}
    source_sizes = {}
    for year, source in sorted(QSE_ANNUAL_SOURCES.items()):
        content = read_source(source, args.source_dir, f"{year}.pdf")
        lines = extract_pdf_lines(content)
        if year == 2025:
            records, quality = parse_qse_monthly_lines(lines, year, municipalities)
        else:
            records, quality = parse_qse_annual_lines(lines, year, municipalities)
        records_by_year[year] = records
        quality_by_year[year] = quality
        digests[year] = source_digest(content)
        source_sizes[year] = len(content)

    monthly_2024_source = QSE_AUDIT_SOURCES["monthly2024"]
    monthly_2024_content = read_source(monthly_2024_source, args.source_dir, "2024-monthly.pdf")
    monthly_2024_records, monthly_2024_quality = parse_qse_monthly_lines(
        extract_pdf_lines(monthly_2024_content), 2024, municipalities
    )
    validate_publication_quality(monthly_2024_quality)

    basis_2025_source = QSE_AUDIT_SOURCES["enrollmentBasis2025"]
    basis_2025_content = read_source(basis_2025_source, args.source_dir, "2025-basis.pdf")
    basis_2025_records, basis_2025_quality = parse_qse_enrollment_basis_lines(
        extract_pdf_lines(basis_2025_content), municipalities
    )
    records_by_year[2025] = merge_2025_enrollment_basis(records_by_year[2025], basis_2025_records)

    reconciliation = reconcile_2024(records_by_year[2024], args.output_root)
    monthly_continuity = reconcile_monthly_continuity_2024(
        monthly_2024_records, records_by_year[2024], args.output_root
    )
    audit_sources = [
        {
            **monthly_2024_source,
            "sha256": source_digest(monthly_2024_content),
            "fileSizeBytes": len(monthly_2024_content),
            "quality": monthly_2024_quality,
        },
        {
            **basis_2025_source,
            "sha256": source_digest(basis_2025_content),
            "fileSizeBytes": len(basis_2025_content),
        },
    ]
    manifest = write_publication(
        args.output_root,
        municipalities,
        records_by_year,
        quality_by_year,
        digests,
        reconciliation,
        source_sizes,
        audit_sources,
        monthly_continuity,
        basis_2025_quality,
    )
    print(json.dumps({
        "years": manifest["years"],
        "coverage": manifest["coverage"],
        "reconciliation2024": manifest["reconciliation2024"],
        "monthlyContinuity2024": manifest["monthlyContinuity2024"],
        "enrollmentBasis2025Quality": manifest["enrollmentBasis2025Quality"],
    }, ensure_ascii=False, indent=2))


if __name__ == "__main__":
    main()
