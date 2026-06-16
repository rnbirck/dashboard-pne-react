from __future__ import annotations

import argparse
import json
import math
import os
from collections import defaultdict
from pathlib import Path
from typing import Any

import psycopg2
from openpyxl import load_workbook


REPO_DIR = Path(__file__).resolve().parents[1]
DEFAULT_DATA_DIR = REPO_DIR / "public" / "data"
DEFAULT_PYTHON_PROJECT_DIR = REPO_DIR / "data_pipeline"
DEFAULT_SINOPSE_DIR = (
    REPO_DIR.parent / "SENAI" / "DB" / "data" / "sinopse_estatistica_censo"
)

YEARS = range(2014, 2026)
UF_TARGET = "Rio Grande do Sul"

INDICATORS = {
    "creche": {
        "label": "Popula\u00e7\u00e3o de 0 a 3 anos que frequenta creche",
        "old_label": "Popula\u00e7\u00e3o de 0 a 3 anos que frequenta a escola/creche",
        "desc": "Percentual da popula\u00e7\u00e3o de 0 a 3 anos que frequenta creche.",
        "old_desc": "Percentual da popula\u00e7\u00e3o de 0 a 3 anos que frequenta a escola ou creche.",
        "numerator": "mat_creche_0_3",
        "denominator": "pop_0_3",
        "age_column": 5,
        "meta": {
            "pne_2014_2024": 50.0,
            "pne_2026_2036": 60.0,
        },
    },
    "pre_escola": {
        "label": "Popula\u00e7\u00e3o de 4 a 5 anos que frequenta a pr\u00e9-escola",
        "old_label": "Popula\u00e7\u00e3o de 4 a 5 anos que frequenta a escola/creche",
        "desc": "Percentual da popula\u00e7\u00e3o de 4 a 5 anos que frequenta a pr\u00e9-escola.",
        "old_desc": "Percentual da popula\u00e7\u00e3o de 4 a 5 anos que frequenta a escola ou creche.",
        "numerator": "mat_pre_escola_4_5",
        "denominator": "pop_4_5",
        "age_column": 6,
        "meta": {
            "pne_2014_2024": 100.0,
            "pne_2026_2036": 100.0,
        },
    },
}

CYCLES = {
    "pne_2014_2024": {
        "start_year": 2014,
        "end_year": 2024,
        "meta_label": "Meta PNE 2024",
    },
    "pne_2026_2036": {
        "start_year": 2015,
        "end_year": 2025,
        "meta_label": "Meta PNE 2036",
    },
}


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(
        description=(
            "Atualiza os indicadores de creche e pre-escola do React usando "
            "as planilhas da Sinopse Estatistica do Censo Escolar."
        )
    )
    parser.add_argument("--data-dir", type=Path, default=DEFAULT_DATA_DIR)
    parser.add_argument(
        "--python-project-dir", type=Path, default=DEFAULT_PYTHON_PROJECT_DIR
    )
    parser.add_argument("--sinopse-dir", type=Path, default=DEFAULT_SINOPSE_DIR)
    return parser.parse_args()


def load_env_file(path: Path) -> None:
    if not path.exists():
        return
    for raw_line in path.read_text(encoding="utf-8").splitlines():
        line = raw_line.strip()
        if not line or line.startswith("#") or "=" not in line:
            continue
        key, value = line.split("=", 1)
        os.environ.setdefault(key.strip(), value.strip().strip('"').strip("'"))


def db_connection(python_project_dir: Path):
    load_env_file(python_project_dir / ".env")
    load_env_file(python_project_dir / "queries" / ".env")
    required = ["DB_USUARIO", "DB_SENHA", "DB_HOST", "DB_BANCO"]
    missing = [name for name in required if not os.getenv(name)]
    if missing:
        raise RuntimeError(
            "Variaveis de ambiente ausentes para Postgres: " + ", ".join(missing)
        )
    return psycopg2.connect(
        user=os.environ["DB_USUARIO"],
        password=os.environ["DB_SENHA"],
        host=os.environ["DB_HOST"],
        port=os.getenv("DB_PORT", "5432"),
        dbname=os.environ["DB_BANCO"],
    )


def locate_sinopse_file(sinopse_dir: Path, year: int) -> Path:
    candidates = sorted(sinopse_dir.glob(f"*{year}*.xlsx"))
    if not candidates:
        raise FileNotFoundError(f"Arquivo da sinopse nao encontrado para {year}")
    return candidates[0]


def sheet_for(year: int, indicator_key: str) -> str:
    if indicator_key == "creche":
        return "1.13" if year >= 2025 else "1.8"
    if indicator_key == "pre_escola":
        return "1.18" if year >= 2025 else "1.12"
    raise KeyError(indicator_key)


def number_or_none(value: Any) -> float | None:
    if value is None:
        return None
    try:
        number = float(value)
    except (TypeError, ValueError):
        return None
    if not math.isfinite(number):
        return None
    return number


def municipal_id(value: Any) -> str | None:
    number = number_or_none(value)
    if number is None:
        return None
    return str(int(number))


def read_sinopse_enrollments(
    sinopse_dir: Path,
) -> dict[tuple[int, str], dict[str, float]]:
    enrollments: dict[tuple[int, str], dict[str, float]] = defaultdict(dict)

    for year in YEARS:
        workbook_path = locate_sinopse_file(sinopse_dir, year)
        workbook = load_workbook(workbook_path, read_only=True, data_only=True)
        try:
            for indicator_key, config in INDICATORS.items():
                worksheet = workbook[sheet_for(year, indicator_key)]
                target_col = int(config["age_column"])
                numerator = str(config["numerator"])

                for row in worksheet.iter_rows(values_only=True):
                    if len(row) <= target_col:
                        continue
                    if str(row[1]).strip() != UF_TARGET:
                        continue
                    id_municipio = municipal_id(row[3])
                    if id_municipio is None:
                        continue
                    value = number_or_none(row[target_col])
                    enrollments[(year, id_municipio)][numerator] = value or 0.0
        finally:
            workbook.close()

    return enrollments


def read_population(
    python_project_dir: Path,
) -> dict[tuple[int, str], dict[str, Any]]:
    query = """
        SELECT
            p.ano,
            m.id_municipio::text AS id_municipio,
            m.municipio,
            SUM(CASE WHEN p.idade <= 3 THEN p.pop_estimada ELSE 0 END) AS pop_0_3,
            SUM(CASE WHEN p.idade BETWEEN 4 AND 5 THEN p.pop_estimada ELSE 0 END) AS pop_4_5
        FROM populacao_idade_rs p
        JOIN municipios m ON p.id_municipio = m.id_municipio
        WHERE p.ano BETWEEN 2014 AND 2025
        GROUP BY p.ano, m.id_municipio, m.municipio
        ORDER BY p.ano, m.municipio
    """
    rows: dict[tuple[int, str], dict[str, Any]] = {}
    with db_connection(python_project_dir) as connection:
        with connection.cursor() as cursor:
            cursor.execute(query)
            for year, id_municipio, municipio, pop_0_3, pop_4_5 in cursor.fetchall():
                rows[(int(year), str(id_municipio))] = {
                    "municipio": municipio,
                    "pop_0_3": float(pop_0_3 or 0),
                    "pop_4_5": float(pop_4_5 or 0),
                }
    return rows


def build_rates(
    enrollments: dict[tuple[int, str], dict[str, float]],
    population: dict[tuple[int, str], dict[str, Any]],
) -> dict[str, dict[str, list[dict[str, float | int]]]]:
    rates: dict[str, dict[str, list[dict[str, float | int]]]] = defaultdict(
        lambda: defaultdict(list)
    )
    for key, pop_row in population.items():
        year, _id_municipio = key
        enrollment_row = enrollments.get(key, {})
        municipio = str(pop_row["municipio"])
        for indicator_key, config in INDICATORS.items():
            numerator = float(enrollment_row.get(str(config["numerator"]), 0.0))
            denominator = float(pop_row.get(str(config["denominator"]), 0.0))
            value = (numerator / denominator * 100.0) if denominator else 0.0
            rates[municipio][indicator_key].append({"ano": year, "valor": value})

    for municipio_rates in rates.values():
        for series in municipio_rates.values():
            series.sort(key=lambda row: int(row["ano"]))
    return rates


def fmt_number(value: float | int | None, decimals: int = 1, signed: bool = False) -> str:
    if value is None:
        return "-"
    number = float(value)
    prefix = "+" if signed and number > 0 else ""
    formatted = f"{number:.{decimals}f}"
    return prefix + formatted.replace(".", ",")


def fmt_percent(value: float | int | None) -> str:
    return f"{fmt_number(value)}%"


def fmt_signed_pp(value: float | int | None) -> str:
    if value is None:
        return "-"
    return f"{fmt_number(value, signed=True)} p.p."


def variation_text(delta: float | None) -> str:
    if delta is None:
        return "-"
    if delta > 0:
        return f"Alta de {fmt_number(delta)} p.p."
    if delta < 0:
        return f"Queda de {fmt_number(abs(delta))} p.p."
    return "Sem varia\u00e7\u00e3o"


def build_display(result: dict[str, Any], label_item: dict[str, str]) -> dict[str, str]:
    if not result.get("available"):
        return {
            "start_value": "-",
            "end_value": "-",
            "variation": "-",
            "distance": "-",
            "status": "Sem dados",
            "interpretation": (
                "N\u00e3o foi poss\u00edvel montar a compara\u00e7\u00e3o desse indicador "
                "com os dados dispon\u00edveis para o munic\u00edpio selecionado."
            ),
        }

    end_value = fmt_percent(result["end_value"])
    meta_value = fmt_percent(result["meta"])
    distance = fmt_signed_pp(result["distance"])
    status = "Meta atingida" if result["atingida"] else "Meta n\u00e3o atingida"

    if result["atingida"]:
        interpretation = (
            f"Em {result['end_year']}, o munic\u00edpio alcan\u00e7ou {end_value} "
            f"e superou a meta definida ({meta_value}). O desempenho ficou "
            f"{distance} acima da refer\u00eancia."
        )
    else:
        interpretation = (
            f"Em {result['end_year']}, o munic\u00edpio chegou a {end_value}, "
            f"mas n\u00e3o alcan\u00e7ou a meta definida ({meta_value}). A dist\u00e2ncia "
            f"atual para a refer\u00eancia \u00e9 de {distance}."
        )

    return {
        "start_value": fmt_percent(result["start_value"]),
        "end_value": end_value,
        "variation": variation_text(result["raw_delta"]),
        "distance": distance,
        "status": status,
        "interpretation": interpretation,
    }


def select_reference_rows(
    series: list[dict[str, float | int]],
    target_start_year: int,
    target_end_year: int,
) -> tuple[dict[str, float | int] | None, dict[str, float | int] | None]:
    if not series:
        return None, None
    start_candidates = [row for row in series if int(row["ano"]) == target_start_year]
    if not start_candidates:
        start_candidates = [row for row in series if int(row["ano"]) >= target_start_year]
    start_row = start_candidates[0] if start_candidates else series[0]

    end_candidates = [row for row in series if int(row["ano"]) == target_end_year]
    if not end_candidates:
        end_candidates = [row for row in series if int(row["ano"]) <= target_end_year]
    end_row = end_candidates[-1] if end_candidates else series[-1]

    if int(start_row["ano"]) > int(end_row["ano"]):
        start_row, end_row = series[0], series[-1]
    if len(series) > 1 and int(start_row["ano"]) == int(end_row["ano"]):
        start_row, end_row = series[0], series[-1]
    return start_row, end_row


def build_result(
    source_series: list[dict[str, float | int]],
    indicator_key: str,
    cycle_key: str,
) -> dict[str, Any]:
    cycle = CYCLES[cycle_key]
    meta = INDICATORS[indicator_key]["meta"][cycle_key]
    series = [
        {"ano": int(row["ano"]), "valor": float(row["valor"])}
        for row in source_series
        if cycle["start_year"] <= int(row["ano"]) <= cycle["end_year"]
    ]
    start_row, end_row = select_reference_rows(
        series, int(cycle["start_year"]), int(cycle["end_year"])
    )
    if start_row is None or end_row is None:
        return {
            "available": False,
            "meta": meta,
            "meta_label": cycle["meta_label"],
            "direction": "at_least",
            "start_year": None,
            "end_year": None,
            "start_value": None,
            "end_value": None,
            "raw_delta": None,
            "progress_delta": None,
            "distance": None,
            "atingida": False,
            "tracks_goal": True,
            "display": build_display({"available": False}, INDICATORS[indicator_key]),
        }

    start_value = float(start_row["valor"])
    end_value = float(end_row["valor"])
    distance = end_value - meta
    result = {
        "available": True,
        "start_year": int(start_row["ano"]),
        "end_year": int(end_row["ano"]),
        "start_value": start_value,
        "end_value": end_value,
        "raw_delta": end_value - start_value,
        "progress_delta": end_value - start_value,
        "meta": meta,
        "meta_label": cycle["meta_label"],
        "direction": "at_least",
        "distance": distance,
        "atingida": distance >= 0,
        "tracks_goal": True,
        "series": [
            row
            for row in series
            if int(start_row["ano"]) <= int(row["ano"]) <= int(end_row["ano"])
        ],
    }
    result["display"] = build_display(result, INDICATORS[indicator_key])
    return result


def replace_known_text(value: Any) -> Any:
    if isinstance(value, str):
        for config in INDICATORS.values():
            value = value.replace(str(config["old_label"]), str(config["label"]))
            value = value.replace(str(config["old_desc"]), str(config["desc"]))
        return value
    if isinstance(value, list):
        return [replace_known_text(item) for item in value]
    if isinstance(value, dict):
        return {key: replace_known_text(child) for key, child in value.items()}
    return value


def update_indicator_metadata(payload: dict[str, Any]) -> None:
    for cycle in payload.get("cycles", {}).values():
        for category in cycle.get("categories", []):
            for item in category.get("items", []):
                key = item.get("key")
                if key in INDICATORS:
                    item["label"] = INDICATORS[key]["label"]
                    item["desc"] = INDICATORS[key]["desc"]


def ranking_row(category_key: str, indicator_key: str, result: dict[str, Any]) -> dict[str, Any]:
    config = INDICATORS.get(indicator_key, {})
    return {
        "indicator_key": indicator_key,
        "label": config.get("label", indicator_key),
        "sub": "",
        "category": category_key,
        "progress_delta": result.get("progress_delta"),
        "distance": result.get("distance"),
        "atingida": result.get("atingida"),
        "available": result.get("available"),
        "value_mode": "percent",
        "start_year": result.get("start_year"),
        "end_year": result.get("end_year"),
        "start_value": result.get("start_value"),
        "end_value": result.get("end_value"),
        "display": result.get("display", {}),
    }


def update_ranking_rows(rows: list[dict[str, Any]], updates: dict[str, dict[str, Any]]) -> None:
    for index, row in enumerate(rows):
        indicator_key = row.get("indicator_key")
        if indicator_key in updates:
            updated = dict(row)
            result = updates[indicator_key]
            updated.update(
                {
                    "label": INDICATORS[indicator_key]["label"],
                    "progress_delta": result.get("progress_delta"),
                    "distance": result.get("distance"),
                    "atingida": result.get("atingida"),
                    "available": result.get("available"),
                    "start_year": result.get("start_year"),
                    "end_year": result.get("end_year"),
                    "start_value": result.get("start_value"),
                    "end_value": result.get("end_value"),
                    "display": result.get("display", {}),
                }
            )
            rows[index] = updated


def recompute_atendimento_rankings(cycle_payload: dict[str, Any]) -> None:
    rankings = cycle_payload.get("rankings", {})
    atendimento = rankings.get("atendimento")
    indicadores = cycle_payload.get("indicadores", {})
    if not isinstance(atendimento, dict) or not isinstance(indicadores, dict):
        return

    existing_by_key: dict[str, dict[str, Any]] = {}
    for list_name in ("top_avancos", "top_atencao"):
        for row in atendimento.get(list_name, []):
            if "indicator_key" in row:
                existing_by_key[row["indicator_key"]] = row

    rows = []
    for indicator_key, result in indicadores.items():
        if not result.get("available") or not result.get("tracks_goal", True):
            continue
        if result.get("start_year") == result.get("end_year"):
            continue
        row = dict(existing_by_key.get(indicator_key, {}))
        if not row:
            row = ranking_row("atendimento", indicator_key, result)
        row.update(
            {
                "progress_delta": result.get("progress_delta"),
                "distance": result.get("distance"),
                "atingida": result.get("atingida"),
                "available": result.get("available"),
                "start_year": result.get("start_year"),
                "end_year": result.get("end_year"),
                "start_value": result.get("start_value"),
                "end_value": result.get("end_value"),
                "display": result.get("display", {}),
            }
        )
        if indicator_key in INDICATORS:
            row["label"] = INDICATORS[indicator_key]["label"]
        rows.append(row)

    atendimento["top_avancos"] = sorted(
        rows,
        key=lambda row: float(row.get("progress_delta") or 0),
        reverse=True,
    )[:3]
    atendimento["top_atencao"] = sorted(
        [row for row in rows if not row.get("atingida")],
        key=lambda row: float(row.get("distance") or 0),
    )[:3]


def recompute_diagnostic(diagnostic: dict[str, Any]) -> None:
    categories = diagnostic.get("categories")
    if not isinstance(categories, list):
        return

    all_goal_records = []
    all_attention = []
    all_positive = []

    for category in categories:
        indicators = category.get("indicators", [])
        goal_records = [
            item for item in indicators if item.get("tracks_goal", True)
        ]
        positive = [
            item for item in goal_records if item.get("result", {}).get("atingida")
        ]
        attention = [
            item
            for item in goal_records
            if item.get("result", {}).get("available")
            and not item.get("result", {}).get("atingida")
        ]
        informative = [
            item for item in indicators if not item.get("tracks_goal", True)
        ]

        category["goal_total"] = len(goal_records)
        category["informative_total"] = len(informative)
        category["achieved"] = len(positive)
        category["attention_count"] = len(attention)
        category["attention_indicators"] = [item.get("key") for item in attention]
        category["positive_indicators"] = [item.get("key") for item in positive]
        category["informative_indicators"] = [item.get("key") for item in informative]
        category["counter_text"] = (
            f"{len(positive)} de {len(goal_records)} metas atingidas; "
            f"{len(informative)} informativos"
        )
        sorted_attention = sorted(
            attention,
            key=lambda item: float(item.get("result", {}).get("distance") or 0),
        )
        evidence_lines = []
        for item in sorted_attention[:3]:
            evidence_lines.append(
                f"{item.get('label')}: "
                f"{item.get('result', {}).get('display', {}).get('end_value', '-')}, "
                "abaixo da meta acompanhada."
            )
        evidence_lines.append(
            f"A dimens\u00e3o atingiu {len(positive)} de {len(goal_records)} metas acompanhadas."
        )
        category["evidence_lines"] = evidence_lines

        all_goal_records.extend(goal_records)
        all_attention.extend(attention)
        all_positive.extend(positive)

    diagnostic["summary"] = {
        "indicadores_analisados": len(all_goal_records),
        "metas_atingidas": len(all_positive),
        "pontos_de_atencao": len(all_attention),
    }
    diagnostic["principais_desafios"] = [
        f"Ampliar a cobertura em {item.get('label')}."
        for item in sorted(
            all_attention,
            key=lambda item: float(item.get("result", {}).get("distance") or 0),
        )[:3]
    ]
    diagnostic["pontos_positivos"] = [
        f"Meta alcan\u00e7ada: {item.get('label')}."
        for item in sorted(
            all_positive,
            key=lambda item: float(item.get("result", {}).get("distance") or 0),
            reverse=True,
        )[:3]
    ]


def patch_municipio_file(path: Path, rates: dict[str, dict[str, list[dict[str, float | int]]]]) -> bool:
    payload = json.loads(path.read_text(encoding="utf-8"))
    payload = replace_known_text(payload)
    municipio = payload.get("municipio")
    municipio_rates = rates.get(str(municipio), {})
    if not municipio_rates:
        return False

    changed = False
    for cycle_key in CYCLES:
        cycle_payload = payload.get(cycle_key, {})
        indicadores = cycle_payload.get("indicadores", {})
        updates = {}
        for indicator_key in INDICATORS:
            if indicator_key not in indicadores:
                continue
            result = build_result(
                municipio_rates.get(indicator_key, []),
                indicator_key,
                cycle_key,
            )
            indicadores[indicator_key] = result
            updates[indicator_key] = result
            changed = True

        rankings = cycle_payload.get("rankings", {})
        for category in rankings.values():
            if not isinstance(category, dict):
                continue
            update_ranking_rows(category.get("top_avancos", []), updates)
            update_ranking_rows(category.get("top_atencao", []), updates)
        recompute_atendimento_rankings(cycle_payload)

        diagnostic = cycle_payload.get("diagnostico", {})
        if isinstance(diagnostic, dict):
            for category in diagnostic.get("categories", []):
                for item in category.get("indicators", []):
                    key = item.get("key")
                    if key in INDICATORS:
                        item["label"] = INDICATORS[key]["label"]
                        item["desc"] = INDICATORS[key]["desc"]
                    if key in updates:
                        item["result"] = updates[key]
                        item["achieved"] = updates[key].get("atingida", False)
            recompute_diagnostic(diagnostic)

    if changed:
        path.write_text(
            json.dumps(payload, ensure_ascii=False, indent=2) + "\n",
            encoding="utf-8",
        )
    return changed


def patch_global_indicators(data_dir: Path) -> None:
    path = data_dir / "indicadores.json"
    if not path.exists():
        return
    payload = json.loads(path.read_text(encoding="utf-8"))
    payload = replace_known_text(payload)
    update_indicator_metadata(payload)
    path.write_text(
        json.dumps(payload, ensure_ascii=False, indent=2) + "\n",
        encoding="utf-8",
    )


def main() -> int:
    args = parse_args()
    data_dir = args.data_dir.resolve()
    sinopse_dir = args.sinopse_dir.resolve()
    python_project_dir = args.python_project_dir.resolve()

    if not data_dir.exists():
        raise FileNotFoundError(f"Diretorio de dados nao encontrado: {data_dir}")
    if not sinopse_dir.exists():
        raise FileNotFoundError(f"Diretorio de sinopses nao encontrado: {sinopse_dir}")

    print("[early-childhood] Lendo matriculas das sinopses...")
    enrollments = read_sinopse_enrollments(sinopse_dir)
    print(f"[early-childhood] Linhas ano/municipio com matriculas: {len(enrollments)}")

    print("[early-childhood] Lendo populacao do Postgres local...")
    population = read_population(python_project_dir)
    print(f"[early-childhood] Linhas ano/municipio com populacao: {len(population)}")

    rates = build_rates(enrollments, population)
    patch_global_indicators(data_dir)

    municipios_dir = data_dir / "municipios"
    patched = 0
    for path in sorted(municipios_dir.glob("*/index.json")):
        if patch_municipio_file(path, rates):
            patched += 1

    print(f"[early-childhood] Municipios atualizados: {patched}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
