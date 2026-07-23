from __future__ import annotations

import csv
import hashlib
import io
import json
import re
import time
import unicodedata
from concurrent.futures import ThreadPoolExecutor, as_completed
from collections.abc import Iterable
from decimal import Decimal, ROUND_HALF_UP
from pathlib import Path
from typing import Any
from urllib.parse import urlencode
from urllib.request import Request, urlopen


SCHEMA_VERSION = "municipal-finance-v1"
METHODOLOGY_VERSION = "municipal-finance-p5b2b1-v1"
DATA_VERSION = "p5b2b1-2024-p6-2026-07-20"
SNAPSHOT_VERSION = "municipal-finance-sources-p5b1-v1"
GENERATED_AT = "2026-07-20T00:00:00-03:00"
ACCESSED_AT = "2026-07-20"
FORECAST_CUTOFF_DATE = "2026-06-22"
EXPECTED_MUNICIPALITIES = 497

FUND_EB_TOTAL_URL = (
    "https://www.gov.br/fnde/pt-br/acesso-a-informacao/acoes-e-programas/"
    "financiamento/fundeb/2026-1/publicacoes-2026/2-publicacao/"
    "1-receita-total-do-fundeb-por-ente-federado.csv"
)
FUND_EB_VAAT_URL = (
    "https://www.gov.br/fnde/pt-br/acesso-a-informacao/acoes-e-programas/"
    "financiamento/fundeb/2026-1/publicacoes-2026/2-publicacao/"
    "3-vaat-vaat-min-e-complementacao-vaat-por-ente-federado.csv"
)
FUND_EB_VAAR_FORECAST_URL = (
    "https://www.gov.br/fnde/pt-br/acesso-a-informacao/acoes-e-programas/"
    "financiamento/fundeb/2026-1/publicacoes-2026/2-publicacao/"
    "6-redes-beneficiadas-coef-de-distribuicao-e-compl-vaar-prevista.csv"
)
FUND_EB_VAAR_STATUS_URL = (
    "https://www.gov.br/fnde/pt-br/acesso-a-informacao/acoes-e-programas/"
    "financiamento/fundeb/2026-1/"
    "ListaentesbeneficiariosenaobeneficiariosacomplementacaoVAARdoFundeb2026.csv"
)
FUND_EB_VAAT_STATUS_URL = (
    "https://www.gov.br/fnde/pt-br/acesso-a-informacao/acoes-e-programas/"
    "financiamento/fundeb/vaat/"
    "lista-dos-entes-habilitados-e-inabilitados-ao-vaat-2026-posicao-final-"
    "com-ajuste-de-decisao-judicial-edit-csv.csv"
)
QSE_REALIZED_URL = (
    "https://www.gov.br/fnde/pt-br/acesso-a-informacao/acoes-e-programas/"
    "financiamento/salario-educacao/defeso-eleitoral/2024/"
    "distribuiototalmatrculasecoeficienteqse2024.pdf"
)
QSE_ESTIMATE_URL = (
    "https://www.gov.br/fnde/pt-br/acesso-a-informacao/acoes-e-programas/"
    "financiamento/salario-educacao/defeso-eleitoral/2026/"
    "estimativadasquotasqse2026porentefederado.pdf"
)
SICONFI_DCA_URL = "https://apidatalake.tesouro.gov.br/ords/cdwhprd/siconfi/tt/dca"

INTEGRATED_SOURCE_CATALOG = {
    "fnde_fundeb_total_forecast_2026": {
        "name": "Receita total prevista do Fundeb por ente",
        "url": FUND_EB_TOTAL_URL,
        "agency": "FNDE",
        "referenceYear": 2026,
        "status": "integrated",
        "municipalKey": "ibge_code",
        "uses": ["fundeb_total", "fundeb_vaaf_status"],
    },
    "fnde_fundeb_vaat_2026": {
        "name": "VAAT e complementação VAAT por ente",
        "url": FUND_EB_VAAT_URL,
        "agency": "FNDE",
        "referenceYear": 2026,
        "status": "integrated",
        "municipalKey": "ibge_code",
        "uses": ["fundeb_vaat_forecast"],
    },
    "fnde_fundeb_vaat_status_2026": {
        "name": "Habilitação para cálculo do VAAT",
        "url": FUND_EB_VAAT_STATUS_URL,
        "agency": "FNDE",
        "referenceYear": 2026,
        "status": "integrated",
        "municipalKey": "ibge_code",
        "uses": ["fundeb_vaat_calculation_status"],
    },
    "fnde_fundeb_vaar_status_2026": {
        "name": "Lista nominal de beneficiários e não beneficiários VAAR",
        "url": FUND_EB_VAAR_STATUS_URL,
        "agency": "FNDE",
        "referenceYear": 2026,
        "status": "integrated",
        "municipalKey": "ibge_code",
        "uses": ["fundeb_vaar_status"],
    },
    "fnde_fundeb_vaar_forecast_2026": {
        "name": "Complementação VAAR prevista por rede",
        "url": FUND_EB_VAAR_FORECAST_URL,
        "agency": "FNDE",
        "referenceYear": 2026,
        "status": "integrated",
        "municipalKey": "ibge_code",
        "uses": ["fundeb_vaar_forecast"],
    },
    "fnde_qse_realized_2024": {
        "name": "Distribuição realizada da quota municipal do salário-educação",
        "url": QSE_REALIZED_URL,
        "agency": "FNDE",
        "referenceYear": 2024,
        "status": "integrated",
        "municipalKey": "ibge_code",
        "uses": ["qse_distributed", "qse_enrollments", "qse_coefficient"],
    },
    "fnde_qse_estimate_2026": {
        "name": "Estimativa oficial da quota municipal do salário-educação",
        "url": QSE_ESTIMATE_URL,
        "agency": "FNDE",
        "referenceYear": 2026,
        "status": "integrated",
        "municipalKey": "ibge_code",
        "uses": ["qse_estimate", "qse_estimate_coefficient"],
    },
    "siconfi_dca_function_2024": {
        "name": "SICONFI DCA Anexo I-E — despesa por função",
        "url": SICONFI_DCA_URL,
        "agency": "Secretaria do Tesouro Nacional",
        "referenceYear": 2024,
        "status": "integrated",
        "municipalKey": "ibge_code",
        "uses": ["education_execution"],
    },
    "fnde_siope_indicators_odata_2024_p6": {
        "name": "SIOPE OData — indicadores constitucionais municipais",
        "url": "https://www.fnde.gov.br/olinda-ide/servico/DADOS_ABERTOS_SIOPE/versao/v1/odata",
        "agency": "FNDE",
        "referenceYear": 2024,
        "period": 6,
        "status": "integrated",
        "municipalKey": "siope_code_crosswalk_ibge",
        "uses": ["mde_applied_amount", "mde_applied_rate", "fundeb_professional_remuneration_rate"],
    },
    "fnde_siope_rreo_annex8_2024_p6": {
        "name": "SIOPE/FNDE RREO Anexo 8 municipal",
        "url": "ftp://ftp.fnde.gov.br/web/siope/RREO/",
        "agency": "FNDE",
        "referenceYear": 2024,
        "period": 6,
        "status": "integrated",
        "municipalKey": "siope_code_crosswalk_ibge",
        "uses": [
            "mde_applied_amount",
            "mde_applied_rate",
            "fundeb_professional_remuneration_rate",
            "fundeb_revenue_received_declared",
        ],
    },
}

BLOCKED_SOURCE_CATALOG = {
    "fundeb_actual_transfers": {"status": "blocked", "reasonCode": "reproducible_endpoint_unavailable"},
    "siope_current_non_odata": {"status": "manual", "reasonCode": "manual_query_required"},
    "siconfi_rreo_annex8": {"status": "unavailable", "reasonCode": "annex_not_available_in_api"},
    "pnae_current": {"status": "blocked", "reasonCode": "reproducible_endpoint_unavailable"},
    "pnate_current": {"status": "manual", "reasonCode": "manual_query_required"},
    "peate_rs": {"status": "manual", "reasonCode": "manual_query_required"},
    "pdde_info": {"status": "blocked", "reasonCode": "different_grain"},
    "par_terms": {"status": "manual", "reasonCode": "manual_query_required"},
    "novo_pac_results": {"status": "blocked", "reasonCode": "reproducible_endpoint_unavailable"},
    "escola_tempo_integral": {"status": "blocked", "reasonCode": "reproducible_endpoint_unavailable"},
    "caminho_escola": {"status": "blocked", "reasonCode": "reproducible_endpoint_unavailable"},
    "pnae_historical": {"status": "needs_hardening", "reasonCode": "source_contract_unstable"},
    "pdde_historical": {"status": "needs_hardening", "reasonCode": "source_contract_unstable"},
    "siconfi_msc": {"status": "needs_hardening", "reasonCode": "mapping_not_validated"},
    "siope_bulk_historical": {"status": "unavailable", "reasonCode": "historical_source_not_current"},
    "teacher_programs": {"status": "not_verified", "reasonCode": "municipal_finance_grain_not_verified"},
}

REASON_MESSAGES = {
    "source_record_not_found": "A fonte integrada não retornou linha para o código IBGE.",
    "not_applicable_non_beneficiary": "A fonte nominal registra condição de não beneficiário.",
    "not_published": "A fonte não publicou o campo para o município.",
    "installments_not_integrated": "As parcelas mensais não integram o escopo P5-B1.",
    "budget_not_available_in_dca_function": "O Anexo I-E não fornece dotação da função Educação.",
    "economic_classification_not_mapped": "Corrente e capital exigem junção validada entre função e natureza.",
    "missing_calculation_component": "Um componente necessário ao cálculo está ausente.",
    "zero_denominator": "O denominador da taxa é zero.",
    "constitutional_source_missing": "Uma das fontes constitucionais homologadas não publicou o campo.",
    "constitutional_divergent_unexplained": "SIOPE e RREO divergem além da tolerância homologada.",
    "constitutional_zero_denominator": "A diferença percentual não pode ser calculada com denominador zero.",
    "source_revision_detected": "Uma nova revisão do PDF foi detectada e permanece bloqueada até validação.",
    "rreo_mapping_pending": "O mapeamento do RREO ainda não está visível na interface.",
    "reconciliation_pending_source": "A reconciliação constitucional permanece oculta enquanto a fonte está pendente.",
    "scores_not_applicable_to_financial_contract": "O contrato financeiro não altera escores educacionais.",
    "partial_automated_source_coverage": "Uma ou mais fontes automatizadas não cobrem a dimensão integralmente.",
    "dca_required_field_missing": "Ao menos um estágio esperado da DCA não foi publicado.",
}

SAMPLE_CODES = {
    "4300109": "Agudo",
    "4313375": "Nova Santa Rita",
    "4314902": "Porto Alegre",
    "4300661": "André da Rocha",
    "4300638": "Amaral Ferrador",
    "4316808": "Santa Cruz do Sul",
    "4300877": "Araricá",
    "4301875": "Barra do Quaraí",
}


def normalize_text(value: Any) -> str:
    normalized = unicodedata.normalize("NFKD", str(value or ""))
    ascii_value = "".join(ch for ch in normalized if not unicodedata.combining(ch))
    return re.sub(r"[^a-z0-9]+", " ", ascii_value.lower()).strip()


def canonical_json(payload: Any) -> str:
    return json.dumps(payload, ensure_ascii=False, indent=2, sort_keys=False) + "\n"


def sha256_bytes(content: bytes) -> str:
    return hashlib.sha256(content).hexdigest()


def sha256_payload(payload: Any) -> str:
    return sha256_bytes(canonical_json(payload).encode("utf-8"))


def write_text_if_changed(path: Path, content: str) -> str:
    path.parent.mkdir(parents=True, exist_ok=True)
    encoded = content.encode("utf-8")
    if path.exists() and path.read_bytes() == encoded:
        return "preserved"
    action = "updated" if path.exists() else "created"
    path.write_bytes(encoded)
    return action


def write_json_if_changed(path: Path, payload: Any) -> str:
    return write_text_if_changed(path, canonical_json(payload))


def download_bytes(url: str, attempts: int = 4, timeout: int = 90) -> bytes:
    last_error: Exception | None = None
    for attempt in range(1, attempts + 1):
        try:
            request = Request(url, headers={"User-Agent": "DASHBOARD-PNE-REACT/P5-B1"})
            with urlopen(request, timeout=timeout) as response:
                return response.read()
        except Exception as error:  # pragma: no cover - network variability
            last_error = error
            if attempt < attempts:
                time.sleep(min(2**attempt, 8))
    raise RuntimeError(f"Falha ao baixar fonte oficial: {url}: {last_error}")


def decode_csv_bytes(content: bytes) -> str:
    for encoding in ("utf-8-sig", "cp1252", "latin-1"):
        try:
            return content.decode(encoding)
        except UnicodeDecodeError:
            continue
    raise RuntimeError("Não foi possível decodificar o arquivo CSV oficial.")


def parse_brazilian_number(value: Any) -> float | None:
    text = str(value or "").strip().replace("R$", "").replace("%", "")
    if not text or text.strip("- ") == "":
        return None
    text = text.replace(".", "").replace(",", ".").strip()
    try:
        return float(text)
    except ValueError as error:
        raise ValueError(f"Número brasileiro inválido: {value!r}") from error


def parse_coefficient(value: Any) -> float | None:
    text = str(value or "").strip()
    if not text or text.strip("- ") == "":
        return None
    return float(text.replace(".", "").replace(",", "."))


def find_header_index(headers: list[str], *parts: str) -> int:
    normalized_parts = [normalize_text(part) for part in parts]
    for index, header in enumerate(headers):
        normalized_header = normalize_text(header)
        if all(part in normalized_header for part in normalized_parts):
            return index
    raise KeyError(f"Coluna não encontrada: {parts}; cabeçalho={headers}")


def semicolon_table(content: bytes) -> tuple[list[str], list[list[str]]]:
    rows = list(csv.reader(io.StringIO(decode_csv_bytes(content)), delimiter=";"))
    header_index = next(
        (
            index
            for index, row in enumerate(rows)
            if "codigo ibge" in normalize_text(" ".join(row))
        ),
        None,
    )
    if header_index is None:
        raise RuntimeError("Cabeçalho com código IBGE não encontrado.")
    headers = rows[header_index]
    width = len(headers)
    body = [(row + [""] * width)[:width] for row in rows[header_index + 1 :] if any(cell.strip() for cell in row)]
    return headers, body


def source_quality(records: dict[str, Any], registry_codes: set[str], duplicates: set[str], incompatible: int) -> dict[str, Any]:
    found_codes = set(records) & registry_codes
    return {
        "municipalitiesExpected": len(registry_codes),
        "municipalitiesFound": len(found_codes),
        "municipalitiesNotFound": len(registry_codes - found_codes),
        "duplicateMunicipalityCodes": sorted(duplicates),
        "incompatibleMunicipalityKeys": incompatible,
        "coverageRate": round(len(found_codes) / len(registry_codes), 6),
    }


def parse_fundeb_total(content: bytes, registry_codes: set[str]) -> tuple[dict[str, Any], dict[str, Any]]:
    headers, rows = semicolon_table(content)
    indexes = {
        "uf": find_header_index(headers, "uf"),
        "code": find_header_index(headers, "codigo", "ibge"),
        "name": find_header_index(headers, "entidade"),
        "base": find_header_index(headers, "receita da contribuicao"),
        "vaaf": find_header_index(headers, "complementacao", "vaaf"),
        "vaat": find_header_index(headers, "complementacao", "vaat"),
        "vaar": find_header_index(headers, "complementacao", "vaar"),
        "total": find_header_index(headers, "total das receitas", "previstas"),
    }
    records: dict[str, Any] = {}
    duplicates: set[str] = set()
    incompatible = 0
    for row in rows:
        if normalize_text(row[indexes["uf"]]) != "rs":
            continue
        code = re.sub(r"\D", "", row[indexes["code"]])
        if len(code) == 2:
            continue
        if not re.fullmatch(r"43\d{5}", code):
            incompatible += 1
            continue
        if code in records:
            duplicates.add(code)
            continue
        records[code] = {
            "name": row[indexes["name"]].strip(),
            "baseContribution": parse_brazilian_number(row[indexes["base"]]),
            "vaafComplement": parse_brazilian_number(row[indexes["vaaf"]]),
            "vaatComplement": parse_brazilian_number(row[indexes["vaat"]]),
            "vaarComplement": parse_brazilian_number(row[indexes["vaar"]]),
            "totalForecast": parse_brazilian_number(row[indexes["total"]]),
        }
    return records, source_quality(records, registry_codes, duplicates, incompatible)


def parse_fundeb_vaat(content: bytes, registry_codes: set[str]) -> tuple[dict[str, Any], dict[str, Any]]:
    headers, rows = semicolon_table(content)
    uf_index = find_header_index(headers, "uf")
    code_index = find_header_index(headers, "codigo", "ibge")
    name_index = find_header_index(headers, "ente federado")
    before_index = find_header_index(headers, "vaat anterior")
    after_index = find_header_index(headers, "vaat com a complementacao")
    complement_index = next(
        index
        for index, header in enumerate(headers)
        if normalize_text(header).startswith("complementacao da uniao vaat")
    )
    records: dict[str, Any] = {}
    duplicates: set[str] = set()
    incompatible = 0
    for row in rows:
        if normalize_text(row[uf_index]) != "rs":
            continue
        code = re.sub(r"\D", "", row[code_index])
        if len(code) == 2:
            continue
        if not re.fullmatch(r"43\d{5}", code):
            incompatible += 1
            continue
        if code in records:
            duplicates.add(code)
            continue
        records[code] = {
            "name": row[name_index].strip(),
            "vaatBeforeComplement": parse_brazilian_number(row[before_index]),
            "vaatAfterComplement": parse_brazilian_number(row[after_index]),
            "vaatComplement": parse_brazilian_number(row[complement_index]),
        }
    return records, source_quality(records, registry_codes, duplicates, incompatible)


def parse_fundeb_vaar_forecast(content: bytes, registry_codes: set[str]) -> tuple[dict[str, Any], dict[str, Any]]:
    headers, rows = semicolon_table(content)
    uf_index = find_header_index(headers, "uf")
    code_index = find_header_index(headers, "codigo", "ibge")
    name_index = find_header_index(headers, "ente federado")
    coefficient_index = find_header_index(headers, "coeficientes de distribuicao")
    amount_index = next(
        index
        for index, header in enumerate(headers)
        if normalize_text(header).startswith("complementacao da uniao vaar")
    )
    records: dict[str, Any] = {}
    duplicates: set[str] = set()
    incompatible = 0
    for row in rows:
        if normalize_text(row[uf_index]) != "rs":
            continue
        code = re.sub(r"\D", "", row[code_index])
        if len(code) == 2:
            continue
        if not re.fullmatch(r"43\d{5}", code):
            incompatible += 1
            continue
        if code in records:
            duplicates.add(code)
            continue
        records[code] = {
            "name": row[name_index].strip(),
            "coefficient": parse_coefficient(row[coefficient_index]),
            "forecast": parse_brazilian_number(row[amount_index]),
        }
    return records, source_quality(records, registry_codes, duplicates, incompatible)


def parse_fundeb_vaar_status(content: bytes, registry_codes: set[str]) -> tuple[dict[str, Any], dict[str, Any]]:
    headers, rows = semicolon_table(content)
    uf_index = find_header_index(headers, "uf")
    code_index = find_header_index(headers, "codigo", "ibge")
    name_index = find_header_index(headers, "entidade")
    habilitation_index = find_header_index(headers, "habilitados")
    beneficiary_index = find_header_index(headers, "beneficiario")
    records: dict[str, Any] = {}
    duplicates: set[str] = set()
    incompatible = 0
    for row in rows:
        if normalize_text(row[uf_index]) != "rs":
            continue
        code = re.sub(r"\D", "", row[code_index])
        if len(code) == 2:
            continue
        if not re.fullmatch(r"43\d{5}", code):
            incompatible += 1
            continue
        if code in records:
            duplicates.add(code)
            continue
        beneficiary_text = normalize_text(row[beneficiary_index])
        status = "confirmed_non_beneficiary" if "nao beneficiario" in beneficiary_text else "confirmed_beneficiary" if "beneficiario" in beneficiary_text else "not_verified"
        records[code] = {
            "name": row[name_index].strip(),
            "status": status,
            "officialHabilitationText": row[habilitation_index].strip(),
        }
    return records, source_quality(records, registry_codes, duplicates, incompatible)


def parse_fundeb_vaat_status(content: bytes, registry_codes: set[str]) -> tuple[dict[str, Any], dict[str, Any]]:
    headers, rows = semicolon_table(content)
    uf_index = find_header_index(headers, "uf")
    code_index = find_header_index(headers, "codigo", "ibge")
    name_index = find_header_index(headers, "ente federado")
    verification_index = find_header_index(headers, "veficacao")
    records: dict[str, Any] = {}
    duplicates: set[str] = set()
    incompatible = 0
    for row in rows:
        if normalize_text(row[uf_index]) != "rs":
            continue
        code = re.sub(r"\D", "", row[code_index])
        if len(code) == 2:
            continue
        if not re.fullmatch(r"43\d{5}", code):
            incompatible += 1
            continue
        if code in records:
            duplicates.add(code)
            continue
        verification = normalize_text(row[verification_index])
        if "inabilitado" in verification or "nao habilitado" in verification:
            calculation_status = "not_habilitated_for_calculation"
        elif "habilitado" in verification:
            calculation_status = "habilitated_for_calculation"
        else:
            calculation_status = "not_verified"
        records[code] = {
            "name": row[name_index].strip(),
            "calculationStatus": calculation_status,
        }
    return records, source_quality(records, registry_codes, duplicates, incompatible)


def extract_pdf_lines(content: bytes) -> Iterable[str]:
    try:
        from pypdf import PdfReader
    except ImportError as error:  # pragma: no cover - dependency guard
        raise RuntimeError("pypdf é necessário para atualizar as fontes QSE.") from error
    reader = PdfReader(io.BytesIO(content))
    for page in reader.pages:
        for line in (page.extract_text() or "").splitlines():
            yield re.sub(r"\s+", " ", line.strip())


def parse_qse_realized(content: bytes, registry_codes: set[str]) -> tuple[dict[str, Any], dict[str, Any]]:
    pattern = re.compile(r"^RS\s+(.+?)\s+(43\d{5})\s+([\d.]+,\d{2})\s+([\d,]+)\s+([\d.]+,\d{2})$")
    records: dict[str, Any] = {}
    duplicates: set[str] = set()
    for line in extract_pdf_lines(content):
        match = pattern.match(line)
        if not match:
            continue
        name, code, enrollments, coefficient, distributed = match.groups()
        if code in records:
            duplicates.add(code)
            continue
        records[code] = {
            "name": name,
            "enrollments": int(parse_brazilian_number(enrollments) or 0),
            "coefficient": parse_coefficient(coefficient),
            "distributed": parse_brazilian_number(distributed),
        }
    return records, source_quality(records, registry_codes, duplicates, 0)


def parse_qse_estimate(content: bytes, registry_codes: set[str]) -> tuple[dict[str, Any], dict[str, Any]]:
    pattern = re.compile(r"^RS\s+(.+?)\s+(43\d{5})\s+([\d,]+)\s+([\d.]+,\d{2})$")
    records: dict[str, Any] = {}
    duplicates: set[str] = set()
    for line in extract_pdf_lines(content):
        match = pattern.match(line)
        if not match:
            continue
        name, code, coefficient, estimate = match.groups()
        if code in records:
            duplicates.add(code)
            continue
        records[code] = {
            "name": name,
            "coefficient": parse_coefficient(coefficient),
            "estimate": parse_brazilian_number(estimate),
        }
    return records, source_quality(records, registry_codes, duplicates, 0)


def parse_dca_items(items: list[dict[str, Any]]) -> dict[str, Any]:
    education_rows = [item for item in items if normalize_text(item.get("conta")) == "12 educacao"]
    by_column = {normalize_text(item.get("coluna")): item.get("valor") for item in education_rows}

    def column_value(*parts: str) -> float | None:
        for column, value in by_column.items():
            if all(normalize_text(part) in column for part in parts):
                return float(value) if value is not None else None
        return None

    return {
        "committed": column_value("despesas empenhadas"),
        "liquidated": column_value("despesas liquidadas"),
        "paid": column_value("despesas pagas"),
        "outstandingNonProcessed": column_value("restos a pagar nao processados"),
        "outstandingProcessed": column_value("restos a pagar processados"),
    }


def fetch_dca_records(
    municipalities: list[dict[str, str]],
    checkpoint_path: Path,
    delay_seconds: float = 1.05,
    workers: int = 1,
) -> tuple[dict[str, Any], dict[str, Any]]:
    records: dict[str, Any] = {}
    errors: dict[str, str] = {}
    if checkpoint_path.exists():
        checkpoint = json.loads(checkpoint_path.read_text(encoding="utf-8"))
        if checkpoint.get("referenceYear") == 2024:
            records.update(checkpoint.get("records", {}))
            errors.update(checkpoint.get("errors", {}))

    pending = [
        municipality
        for municipality in municipalities
        if municipality["ibgeCode"] not in records
        or records[municipality["ibgeCode"]].get("sourceError")
    ]

    def fetch_one(municipality: dict[str, str]) -> tuple[str, dict[str, Any], str | None]:
        code = municipality["ibgeCode"]
        query = urlencode(
            {
                "an_exercicio": 2024,
                "no_anexo": "DCA-Anexo I-E",
                "co_esfera": "M",
                "id_ente": code,
            }
        )
        try:
            payload = json.loads(download_bytes(f"{SICONFI_DCA_URL}?{query}", attempts=5).decode("utf-8"))
            result = parse_dca_items(payload.get("items") or [])
            error_message = None
        except Exception as error:  # pragma: no cover - network variability
            result = {
                "committed": None,
                "liquidated": None,
                "paid": None,
                "outstandingNonProcessed": None,
                "outstandingProcessed": None,
                "sourceError": type(error).__name__,
            }
            error_message = str(error)
        if delay_seconds > 0:
            time.sleep(delay_seconds)
        return code, result, error_message

    completed = len(municipalities) - len(pending)
    with ThreadPoolExecutor(max_workers=max(1, workers)) as executor:
        futures = [executor.submit(fetch_one, municipality) for municipality in pending]
        for future in as_completed(futures):
            code, result, error_message = future.result()
            records[code] = result
            if error_message:
                errors[code] = error_message
            else:
                errors.pop(code, None)
            completed += 1
            if completed % 25 == 0 or completed == len(municipalities):
                write_json_if_changed(
                    checkpoint_path,
                    {"referenceYear": 2024, "records": records, "errors": errors},
                )
                print(f"[municipal-finance] DCA {completed}/{len(municipalities)}", flush=True)

    if completed % 25:
        write_json_if_changed(
            checkpoint_path,
            {"referenceYear": 2024, "records": records, "errors": errors},
        )
    if len(records) != len(municipalities):
        raise RuntimeError(
            f"Checkpoint DCA contém {len(records)} municípios; esperado {len(municipalities)}."
        )

    registry_codes = {municipality["ibgeCode"] for municipality in municipalities}
    quality = source_quality(records, registry_codes, set(), 0)
    quality["requestErrors"] = len(errors)
    quality["requestErrorCodes"] = sorted(errors)
    return records, quality


def load_municipality_registry(path: Path) -> list[dict[str, str]]:
    payload = json.loads(path.read_text(encoding="utf-8"))
    municipalities = [
        {
            "ibgeCode": str(item["id_municipio"]),
            "name": item["nome"],
            "slug": item["slug"],
        }
        for item in payload.get("municipios", [])
    ]
    municipalities.sort(key=lambda item: item["ibgeCode"])
    codes = [item["ibgeCode"] for item in municipalities]
    slugs = [item["slug"] for item in municipalities]
    if len(municipalities) != EXPECTED_MUNICIPALITIES:
        raise RuntimeError(f"Base municipal contém {len(municipalities)} municípios; esperado {EXPECTED_MUNICIPALITIES}.")
    if len(set(codes)) != len(codes) or len(set(slugs)) != len(slugs):
        raise RuntimeError("A base municipal contém códigos ou slugs duplicados.")
    return municipalities


def snapshot_source(source_id: str, raw: bytes, records: dict[str, Any], quality: dict[str, Any]) -> dict[str, Any]:
    catalog = INTEGRATED_SOURCE_CATALOG[source_id]
    return {
        "sourceId": source_id,
        "referenceYear": catalog["referenceYear"],
        "accessedAt": ACCESSED_AT,
        "rawSha256": sha256_bytes(raw),
        "quality": quality,
        "records": dict(sorted(records.items())),
    }


def refresh_source_snapshot(
    municipalities: list[dict[str, str]],
    snapshot_path: Path,
    checkpoint_path: Path,
    dca_delay_seconds: float = 1.05,
    dca_workers: int = 1,
) -> dict[str, Any]:
    registry_codes = {item["ibgeCode"] for item in municipalities}
    downloads = {
        "fnde_fundeb_total_forecast_2026": download_bytes(FUND_EB_TOTAL_URL),
        "fnde_fundeb_vaat_2026": download_bytes(FUND_EB_VAAT_URL),
        "fnde_fundeb_vaat_status_2026": download_bytes(FUND_EB_VAAT_STATUS_URL),
        "fnde_fundeb_vaar_status_2026": download_bytes(FUND_EB_VAAR_STATUS_URL),
        "fnde_fundeb_vaar_forecast_2026": download_bytes(FUND_EB_VAAR_FORECAST_URL),
        "fnde_qse_realized_2024": download_bytes(QSE_REALIZED_URL),
        "fnde_qse_estimate_2026": download_bytes(QSE_ESTIMATE_URL),
    }
    parsers = {
        "fnde_fundeb_total_forecast_2026": parse_fundeb_total,
        "fnde_fundeb_vaat_2026": parse_fundeb_vaat,
        "fnde_fundeb_vaat_status_2026": parse_fundeb_vaat_status,
        "fnde_fundeb_vaar_status_2026": parse_fundeb_vaar_status,
        "fnde_fundeb_vaar_forecast_2026": parse_fundeb_vaar_forecast,
        "fnde_qse_realized_2024": parse_qse_realized,
        "fnde_qse_estimate_2026": parse_qse_estimate,
    }
    sources: dict[str, Any] = {}
    for source_id, raw in downloads.items():
        records, quality = parsers[source_id](raw, registry_codes)
        sources[source_id] = snapshot_source(source_id, raw, records, quality)
        print(
            f"[municipal-finance] {source_id}: "
            f"{quality['municipalitiesFound']}/{quality['municipalitiesExpected']}"
        )

    dca_records, dca_quality = fetch_dca_records(
        municipalities,
        checkpoint_path=checkpoint_path,
        delay_seconds=dca_delay_seconds,
        workers=dca_workers,
    )
    dca_content = canonical_json(dca_records).encode("utf-8")
    sources["siconfi_dca_function_2024"] = snapshot_source(
        "siconfi_dca_function_2024",
        dca_content,
        dca_records,
        dca_quality,
    )
    snapshot = {
        "snapshotVersion": SNAPSHOT_VERSION,
        "dataVersion": DATA_VERSION,
        "generatedAt": GENERATED_AT,
        "municipalities": EXPECTED_MUNICIPALITIES,
        "sources": sources,
    }
    write_json_if_changed(snapshot_path, snapshot)
    return snapshot


def load_source_snapshot(path: Path) -> dict[str, Any]:
    if not path.exists():
        raise RuntimeError(f"Snapshot financeiro ausente: {path}. Execute com --refresh-sources.")
    payload = json.loads(path.read_text(encoding="utf-8"))
    if payload.get("snapshotVersion") != SNAPSHOT_VERSION:
        raise RuntimeError(f"Versão de snapshot incompatível: {payload.get('snapshotVersion')}")
    return payload


def compact_value(
    value: float | int | None,
    unit: str,
    reference_year: int,
    stage: str,
    nature: str,
    source_id: str,
    null_reason_code: str | None = None,
) -> dict[str, Any]:
    result: dict[str, Any] = {
        "value": round(value, 6) if isinstance(value, float) else value,
        "unit": unit,
        "referenceYear": reference_year,
        "financialStage": stage,
        "amountNature": nature,
        "sourceId": source_id,
    }
    if value is None:
        if not null_reason_code:
            raise ValueError(f"Valor nulo sem razão: {source_id}/{reference_year}")
        result["nullReasonCode"] = null_reason_code
    return result


def dimension(
    rate: float | None,
    status: str,
    available: list[str],
    missing: list[str],
    reasons: list[str] | None = None,
) -> dict[str, Any]:
    return {
        "rate": round(rate, 6) if rate is not None else None,
        "status": status,
        "availableSourceIds": available,
        "missingSourceIds": missing,
        "reasonCodes": reasons or [],
    }


def source_record(snapshot: dict[str, Any], source_id: str, code: str) -> dict[str, Any] | None:
    return snapshot["sources"].get(source_id, {}).get("records", {}).get(code)


def _canonical_reconciled_value(left: float, right: float, decimals: int) -> float:
    quantum = Decimal("1").scaleb(-decimals)
    average = (Decimal(str(left)) + Decimal(str(right))) / Decimal("2")
    return float(average.quantize(quantum, rounding=ROUND_HALF_UP))


def reconciled_constitutional_metric(
    siope_value: float | None,
    rreo_value: float | None,
    *,
    unit: str,
    financial_stage: str,
) -> dict[str, Any]:
    siope_source_id = "fnde_siope_indicators_odata_2024_p6"
    rreo_source_id = "fnde_siope_rreo_annex8_2024_p6"
    reconciliation_source_id = "siope_rreo_constitutional_reconciliation_2024_p6"
    monetary = unit == "BRL"
    tolerance = 0.01 if monetary else 0.005
    decimals = 2
    tolerance_rule_id = "monetary_absolute_0_01" if monetary else "published_precision_2_decimals"

    if siope_value is None or rreo_value is None:
        status = "source_missing"
        absolute_difference = None
        percentage_difference = None
        canonical_value = None
        canonical_reason = "constitutional_source_missing"
    else:
        absolute_difference = round(abs(float(siope_value) - float(rreo_value)), 6)
        if rreo_value == 0:
            percentage_difference = 0.0 if absolute_difference == 0 else None
        else:
            percentage_difference = round(absolute_difference / abs(float(rreo_value)) * 100, 8)
        if absolute_difference <= tolerance:
            status = "reconciled"
            canonical_value = _canonical_reconciled_value(float(siope_value), float(rreo_value), decimals)
            canonical_reason = None
        else:
            status = "divergent_unexplained"
            canonical_value = None
            canonical_reason = "constitutional_divergent_unexplained"

    difference_reason = "constitutional_source_missing" if absolute_difference is None else None
    percentage_reason = None
    if percentage_difference is None:
        percentage_reason = (
            "constitutional_source_missing"
            if siope_value is None or rreo_value is None
            else "constitutional_zero_denominator"
        )
    return {
        "canonical": compact_value(
            canonical_value,
            unit,
            2024,
            financial_stage,
            "municipal_declared",
            reconciliation_source_id,
            canonical_reason,
        ),
        "siope": compact_value(
            siope_value,
            unit,
            2024,
            financial_stage,
            "municipal_declared",
            siope_source_id,
            "constitutional_source_missing" if siope_value is None else None,
        ),
        "rreo": compact_value(
            rreo_value,
            unit,
            2024,
            financial_stage,
            "municipal_declared",
            rreo_source_id,
            "constitutional_source_missing" if rreo_value is None else None,
        ),
        "reconciliation": {
            "status": status,
            "sourceIds": [siope_source_id, rreo_source_id],
            "absoluteDifference": compact_value(
                absolute_difference,
                unit,
                2024,
                "calculated_indicator",
                "local_calculation",
                reconciliation_source_id,
                difference_reason,
            ),
            "percentageDifference": compact_value(
                percentage_difference,
                "percent",
                2024,
                "calculated_indicator",
                "local_calculation",
                reconciliation_source_id,
                percentage_reason,
            ),
            "tolerance": tolerance,
            "toleranceUnit": unit,
            "toleranceRuleId": tolerance_rule_id,
            "canonicalRuleId": "arithmetic_mean_rounded_to_published_precision",
            "reasonCodes": [] if status == "reconciled" else [canonical_reason],
        },
    }


def composition_metadata(is_total: bool, reconciled: bool) -> dict[str, Any]:
    if is_total:
        return {
            "includedInFundebTotal": True,
            "compositionStatus": "total",
            "doubleCountingRisk": "none",
            "summationAllowed": True,
        }
    if reconciled:
        return {
            "includedInFundebTotal": True,
            "compositionStatus": "included_in_total",
            "doubleCountingRisk": "high",
            "summationAllowed": False,
        }
    return {
        "includedInFundebTotal": False,
        "compositionStatus": "composition_not_reconciled",
        "doubleCountingRisk": "high",
        "summationAllowed": False,
    }


def derived_rate(
    numerator_values: list[float | None],
    denominator: float | None,
    formula: str,
    numerator_reference_ids: list[str],
    denominator_reference_id: str,
    source_id: str,
    reference_year: int,
    unit: str = "percent",
) -> dict[str, Any]:
    if any(value is None for value in numerator_values):
        value = None
        reason = "missing_calculation_component"
    elif denominator is None:
        value = None
        reason = "missing_calculation_component"
    elif denominator == 0:
        value = None
        reason = "zero_denominator"
    else:
        numerator = sum(float(item) for item in numerator_values if item is not None)
        value = numerator / denominator * (100 if unit == "percent" else 1)
        reason = None
    result = compact_value(
        value,
        unit,
        reference_year,
        "not_applicable",
        "local_calculation",
        source_id,
        reason,
    )
    result["calculation"] = {
        "formula": formula,
        "numeratorReferenceIds": numerator_reference_ids,
        "denominatorReferenceId": denominator_reference_id,
        "sourceId": source_id,
        "referenceYear": reference_year,
        "functionalClassification": "12 - Educação",
    }
    return result


def build_contract(municipality: dict[str, str], snapshot: dict[str, Any]) -> dict[str, Any]:
    code = municipality["ibgeCode"]
    fundeb_total = source_record(snapshot, "fnde_fundeb_total_forecast_2026", code)
    vaat = source_record(snapshot, "fnde_fundeb_vaat_2026", code)
    vaat_status = source_record(snapshot, "fnde_fundeb_vaat_status_2026", code)
    vaar_status = source_record(snapshot, "fnde_fundeb_vaar_status_2026", code)
    vaar_forecast = source_record(snapshot, "fnde_fundeb_vaar_forecast_2026", code)
    qse_realized = source_record(snapshot, "fnde_qse_realized_2024", code)
    qse_estimate = source_record(snapshot, "fnde_qse_estimate_2026", code)
    dca = source_record(snapshot, "siconfi_dca_function_2024", code)
    siope_constitutional = source_record(snapshot, "fnde_siope_indicators_odata_2024_p6", code)
    rreo_constitutional = source_record(snapshot, "fnde_siope_rreo_annex8_2024_p6", code)

    total_value = fundeb_total.get("totalForecast") if fundeb_total else None
    vaaf_value = fundeb_total.get("vaafComplement") if fundeb_total else None
    vaat_value = vaat.get("vaatComplement") if vaat else None
    vaar_value = vaar_forecast.get("forecast") if vaar_forecast else None
    qse_realized_value = qse_realized.get("distributed") if qse_realized else None
    qse_estimate_value = qse_estimate.get("estimate") if qse_estimate else None
    enrollments = qse_realized.get("enrollments") if qse_realized else None

    total_vaat_component = fundeb_total.get("vaatComplement") if fundeb_total else None
    total_vaar_component = fundeb_total.get("vaarComplement") if fundeb_total else None
    vaat_reconciled = total_vaat_component == vaat_value
    vaar_reconciled = total_vaar_component == vaar_value or (total_vaar_component is None and vaar_value is None)

    vaaf_program_status = "confirmed_beneficiary" if vaaf_value and vaaf_value > 0 else "confirmed_non_beneficiary" if fundeb_total else "not_verified"
    vaat_program_status = "confirmed_beneficiary" if vaat_value and vaat_value > 0 else "confirmed_non_beneficiary" if vaat else "not_verified"
    vaar_program_status = vaar_status.get("status") if vaar_status else "not_verified"

    dca_values = {
        key: dca.get(key) if dca else None
        for key in (
            "committed",
            "liquidated",
            "paid",
            "outstandingNonProcessed",
            "outstandingProcessed",
        )
    }

    siope_mde_amount = (
        siope_constitutional.get("mdeAppliedAmount", {}).get("value")
        if siope_constitutional
        else None
    )
    siope_mde_rate = (
        siope_constitutional.get("mdeAppliedRate", {}).get("value")
        if siope_constitutional
        else None
    )
    siope_remuneration_rate = (
        siope_constitutional.get("fundebProfessionalRemunerationRate", {}).get("value")
        if siope_constitutional
        else None
    )
    rreo_mde_amount = rreo_constitutional.get("mdeAppliedAmount") if rreo_constitutional else None
    rreo_mde_rate = rreo_constitutional.get("mdeAppliedRate") if rreo_constitutional else None
    rreo_remuneration_rate = (
        rreo_constitutional.get("fundebProfessionalRemunerationRate")
        if rreo_constitutional
        else None
    )
    rreo_fundeb_received = (
        rreo_constitutional.get("fundebRevenueReceivedDeclared")
        if rreo_constitutional
        else None
    )
    mde_applied_amount = reconciled_constitutional_metric(
        siope_mde_amount,
        rreo_mde_amount,
        unit="BRL",
        financial_stage="empenhado",
    )
    mde_applied_rate = reconciled_constitutional_metric(
        siope_mde_rate,
        rreo_mde_rate,
        unit="percent",
        financial_stage="calculated_indicator",
    )
    fundeb_remuneration_rate = reconciled_constitutional_metric(
        siope_remuneration_rate,
        rreo_remuneration_rate,
        unit="percent",
        financial_stage="calculated_indicator",
    )
    constitutional_metrics = (
        mde_applied_amount,
        mde_applied_rate,
        fundeb_remuneration_rate,
    )
    constitutional_statuses = {
        metric["reconciliation"]["status"] for metric in constitutional_metrics
    }
    if "divergent_unexplained" in constitutional_statuses:
        constitutional_status = "divergent_unexplained"
    elif "source_missing" in constitutional_statuses or rreo_fundeb_received is None:
        constitutional_status = "source_missing"
    else:
        constitutional_status = "reconciled"
    constitutional_available_count = sum(
        value is not None
        for value in (
            siope_mde_amount,
            siope_mde_rate,
            siope_remuneration_rate,
            rreo_mde_amount,
            rreo_mde_rate,
            rreo_remuneration_rate,
            rreo_fundeb_received,
        )
    )
    constitutional_available_sources = [
        source_id
        for source_id, record in (
            ("fnde_siope_indicators_odata_2024_p6", siope_constitutional),
            ("fnde_siope_rreo_annex8_2024_p6", rreo_constitutional),
        )
        if record is not None
    ]
    constitutional_missing_sources = [
        source_id
        for source_id in (
            "fnde_siope_indicators_odata_2024_p6",
            "fnde_siope_rreo_annex8_2024_p6",
        )
        if source_id not in constitutional_available_sources
    ]

    confirmed_available = ["fnde_qse_realized_2024"] if qse_realized_value is not None else []
    forecast_pairs = [
        ("fnde_fundeb_total_forecast_2026", total_value),
        ("fnde_qse_estimate_2026", qse_estimate_value),
    ]
    forecast_available = [source_id for source_id, value in forecast_pairs if value is not None]
    status_pairs = [
        ("fnde_fundeb_total_forecast_2026", fundeb_total),
        ("fnde_fundeb_vaat_status_2026", vaat_status),
        ("fnde_fundeb_vaar_status_2026", vaar_status),
    ]
    status_available = [source_id for source_id, value in status_pairs if value is not None]
    dca_available_count = sum(value is not None for value in dca_values.values())
    per_student_available = qse_realized_value is not None and enrollments is not None and enrollments > 0

    coverage_by_dimension = {
        "confirmedTransfers": dimension(
            len(confirmed_available),
            "complete" if len(confirmed_available) == 1 else "unavailable",
            confirmed_available,
            [] if confirmed_available else ["fnde_qse_realized_2024"],
            [] if confirmed_available else ["partial_automated_source_coverage"],
        ),
        "officialForecasts": dimension(
            len(forecast_available) / 2,
            "complete" if len(forecast_available) == 2 else "partial" if forecast_available else "unavailable",
            forecast_available,
            [source_id for source_id, value in forecast_pairs if value is None],
            [] if len(forecast_available) == 2 else ["partial_automated_source_coverage"],
        ),
        "programStatuses": dimension(
            len(status_available) / 3,
            "complete" if len(status_available) == 3 else "partial" if status_available else "unavailable",
            status_available,
            [source_id for source_id, value in status_pairs if value is None],
            [] if len(status_available) == 3 else ["partial_automated_source_coverage"],
        ),
        "budgetExecution": dimension(
            dca_available_count / 5,
            "complete" if dca_available_count == 5 else "partial" if dca_available_count else "unavailable",
            ["siconfi_dca_function_2024"] if dca_available_count else [],
            [] if dca_available_count == 5 else ["siconfi_dca_function_2024"],
            [] if dca_available_count == 5 else ["dca_required_field_missing"],
        ),
        "constitutionalApplication": dimension(
            constitutional_available_count / 7,
            (
                "complete"
                if constitutional_status == "reconciled"
                else "divergent"
                if constitutional_status.startswith("divergent")
                else "source_missing"
                if constitutional_status == "source_missing"
                else "partial"
                if constitutional_available_count
                else "unavailable"
            ),
            constitutional_available_sources,
            constitutional_missing_sources,
            (
                []
                if constitutional_status == "reconciled"
                else [
                    "constitutional_divergent_unexplained"
                    if constitutional_status.startswith("divergent")
                    else "constitutional_source_missing"
                ]
            ),
        ),
        "perStudentMetrics": dimension(
            1 if per_student_available else 0,
            "complete" if per_student_available else "unavailable",
            ["fnde_qse_realized_2024"] if per_student_available else [],
            [] if per_student_available else ["fnde_qse_realized_2024"],
            [] if per_student_available else ["missing_calculation_component"],
        ),
        "reconciliation": dimension(
            1 if constitutional_status == "reconciled" else constitutional_available_count / 7,
            (
                "complete"
                if constitutional_status == "reconciled"
                else "divergent"
                if constitutional_status.startswith("divergent")
                else "source_missing"
            ),
            constitutional_available_sources,
            constitutional_missing_sources,
            (
                []
                if constitutional_status == "reconciled"
                else [
                    "constitutional_divergent_unexplained"
                    if constitutional_status.startswith("divergent")
                    else "constitutional_source_missing"
                ]
            ),
        ),
    }

    quality_reasons: list[str] = []
    if constitutional_status != "reconciled":
        quality_reasons.append(
            "constitutional_divergent_unexplained"
            if constitutional_status.startswith("divergent")
            else "constitutional_source_missing"
        )
    if dca_available_count < 5:
        quality_level = "insufficient"
        quality_reasons.append("dca_required_field_missing")
    else:
        core_rates = [
            coverage_by_dimension[key]["rate"]
            for key in ("confirmedTransfers", "officialForecasts", "programStatuses", "budgetExecution", "perStudentMetrics")
        ]
        average_rate = sum(float(rate or 0) for rate in core_rates) / len(core_rates)
        quality_level = "medium" if average_rate >= 0.75 else "low" if average_rate >= 0.4 else "insufficient"
        if average_rate < 1:
            quality_reasons.append("partial_automated_source_coverage")

    fundeb_total_amount = compact_value(total_value, "BRL", 2026, "forecast", "official_estimate", "fnde_fundeb_total_forecast_2026", "source_record_not_found" if total_value is None else None)
    fundeb_total_amount.update(composition_metadata(is_total=True, reconciled=True))
    vaaf_amount = compact_value(vaaf_value, "BRL", 2026, "forecast", "official_estimate", "fnde_fundeb_total_forecast_2026", "not_applicable_non_beneficiary" if fundeb_total else "source_record_not_found")
    vaaf_amount.update(composition_metadata(is_total=False, reconciled=fundeb_total is not None))
    vaat_amount = compact_value(vaat_value, "BRL", 2026, "forecast", "official_estimate", "fnde_fundeb_vaat_2026", "not_applicable_non_beneficiary" if vaat else "source_record_not_found")
    vaat_amount.update(composition_metadata(is_total=False, reconciled=vaat_reconciled))
    vaar_amount = compact_value(vaar_value, "BRL", 2026, "forecast", "official_estimate", "fnde_fundeb_vaar_forecast_2026", "not_applicable_non_beneficiary" if vaar_program_status == "confirmed_non_beneficiary" else "source_record_not_found")
    vaar_amount.update(composition_metadata(is_total=False, reconciled=vaar_reconciled))

    dca_amounts = {
        "committed": compact_value(dca_values["committed"], "BRL", 2024, "empenhado", "municipal_declared", "siconfi_dca_function_2024", "not_published"),
        "liquidated": compact_value(dca_values["liquidated"], "BRL", 2024, "liquidado", "municipal_declared", "siconfi_dca_function_2024", "not_published"),
        "paid": compact_value(dca_values["paid"], "BRL", 2024, "paid", "municipal_declared", "siconfi_dca_function_2024", "not_published"),
        "outstandingNonProcessed": compact_value(dca_values["outstandingNonProcessed"], "BRL", 2024, "balance", "municipal_declared", "siconfi_dca_function_2024", "not_published"),
        "outstandingProcessed": compact_value(dca_values["outstandingProcessed"], "BRL", 2024, "balance", "municipal_declared", "siconfi_dca_function_2024", "not_published"),
    }

    qse_distributed = compact_value(qse_realized_value, "BRL", 2024, "transferred", "confirmed", "fnde_qse_realized_2024", "source_record_not_found")
    qse_estimated = compact_value(qse_estimate_value, "BRL", 2026, "forecast", "official_estimate", "fnde_qse_estimate_2026", "source_record_not_found")
    qse_per_student = derived_rate(
        [qse_realized_value],
        float(enrollments) if enrollments is not None else None,
        "qseDistributedClosedYear / qseEnrollmentsClosedYear",
        ["amounts.qseDistributedClosedYear"],
        "qse.enrollmentsClosedYear",
        "fnde_qse_realized_2024",
        2024,
        unit="BRL_per_student",
    )

    return {
        "schemaVersion": SCHEMA_VERSION,
        "dataVersion": DATA_VERSION,
        "methodologyVersion": METHODOLOGY_VERSION,
        "generatedAt": GENERATED_AT,
        "municipality": {**municipality, "uf": "RS"},
        "periods": {
            "closedFiscalYear": 2024,
            "annualForecastYear": 2026,
            "forecastCutoffDate": FORECAST_CUTOFF_DATE,
            "mixesPeriodsInTotals": False,
        },
        "dataQuality": {
            "level": quality_level,
            "reasonCodes": quality_reasons,
            "coverageByDimension": coverage_by_dimension,
        },
        "summary": {
            "confirmedTransfersCoveredBySources": {
                **qse_distributed,
                "coveredSourceIds": confirmed_available,
                "summationRuleId": "same_year_confirmed_transferred_nonoverlapping",
            },
            "officialAnnualForecastsCurrentYear": {
                **fundeb_total_amount,
                "coveredSourceIds": ["fnde_fundeb_total_forecast_2026"] if total_value is not None else [],
                "summationRuleId": "fundeb_total_standalone_no_components",
            },
            "dcaEducationCommitted": dca_amounts["committed"],
        },
        "amounts": {
            "fundebTotalAnnualForecast": fundeb_total_amount,
            "fundebVaafAnnualForecast": vaaf_amount,
            "fundebVaatAnnualForecast": vaat_amount,
            "fundebVaarAnnualForecast": vaar_amount,
            "qseDistributedClosedYear": qse_distributed,
            "qseOfficialEstimateCurrentYear": qse_estimated,
        },
        "programStatuses": {
            "fundebVaaf": {
                "status": vaaf_program_status,
                "sourceId": "fnde_fundeb_total_forecast_2026",
                "referenceYear": 2026,
            },
            "fundebVaat": {
                "status": vaat_program_status,
                "calculationStatus": vaat_status.get("calculationStatus") if vaat_status else "not_verified",
                "sourceIds": ["fnde_fundeb_vaat_2026", "fnde_fundeb_vaat_status_2026"],
                "referenceYear": 2026,
            },
            "fundebVaar": {
                "status": vaar_program_status,
                "sourceIds": ["fnde_fundeb_vaar_status_2026", "fnde_fundeb_vaar_forecast_2026"],
                "referenceYear": 2026,
            },
        },
        "qse": {
            "enrollmentsClosedYear": compact_value(enrollments, "count", 2024, "not_applicable", "confirmed", "fnde_qse_realized_2024", "source_record_not_found"),
            "distributionCoefficientClosedYear": compact_value(qse_realized.get("coefficient") if qse_realized else None, "coefficient", 2024, "not_applicable", "confirmed", "fnde_qse_realized_2024", "source_record_not_found"),
            "distributionCoefficientCurrentYear": compact_value(qse_estimate.get("coefficient") if qse_estimate else None, "coefficient", 2026, "not_applicable", "official_estimate", "fnde_qse_estimate_2026", "source_record_not_found"),
            "installments": compact_value(None, "count", 2024, "not_applicable", "confirmed", "fnde_qse_realized_2024", "installments_not_integrated"),
        },
        "execution": {
            "dcaEducation": {
                "referenceYear": 2024,
                "functionalClassification": "12 - Educação",
                "amountNature": "municipal_declared",
                "sourceId": "siconfi_dca_function_2024",
                **dca_amounts,
                "budgeted": compact_value(None, "BRL", 2024, "budgeted", "municipal_declared", "siconfi_dca_function_2024", "budget_not_available_in_dca_function"),
                "currentExpense": compact_value(None, "BRL", 2024, "not_applicable", "municipal_declared", "siconfi_dca_function_2024", "economic_classification_not_mapped"),
                "capitalExpense": compact_value(None, "BRL", 2024, "not_applicable", "municipal_declared", "siconfi_dca_function_2024", "economic_classification_not_mapped"),
                "derivedRates": {
                    "liquidatedToCommittedRate": derived_rate([dca_values["liquidated"]], dca_values["committed"], "liquidated / committed * 100", ["execution.dcaEducation.liquidated"], "execution.dcaEducation.committed", "siconfi_dca_function_2024", 2024),
                    "paidToCommittedRate": derived_rate([dca_values["paid"]], dca_values["committed"], "paid / committed * 100", ["execution.dcaEducation.paid"], "execution.dcaEducation.committed", "siconfi_dca_function_2024", 2024),
                    "paidToLiquidatedRate": derived_rate([dca_values["paid"]], dca_values["liquidated"], "paid / liquidated * 100", ["execution.dcaEducation.paid"], "execution.dcaEducation.liquidated", "siconfi_dca_function_2024", 2024),
                    "outstandingToCommittedRate": derived_rate([dca_values["outstandingNonProcessed"], dca_values["outstandingProcessed"]], dca_values["committed"], "(outstandingNonProcessed + outstandingProcessed) / committed * 100", ["execution.dcaEducation.outstandingNonProcessed", "execution.dcaEducation.outstandingProcessed"], "execution.dcaEducation.committed", "siconfi_dca_function_2024", 2024),
                },
            }
        },
        "constitutionalApplication": {
            "status": constitutional_status,
            "referenceYear": 2024,
            "period": 6,
            "stageBasis": "empenhado",
            "mdeAppliedAmount": mde_applied_amount,
            "mdeAppliedRate": mde_applied_rate,
            "fundebProfessionalRemunerationRate": fundeb_remuneration_rate,
            "fundebRevenueReceivedDeclared": compact_value(
                rreo_fundeb_received,
                "BRL",
                2024,
                "received",
                "municipal_declared",
                "fnde_siope_rreo_annex8_2024_p6",
                "constitutional_source_missing" if rreo_fundeb_received is None else None,
            ),
        },
        "reconciliation": {
            "status": constitutional_status,
            "scope": "siope_rreo_constitutional_application",
            "availableSourceIds": constitutional_available_sources,
            "pendingSourceIds": constitutional_missing_sources,
            "absoluteDifference": mde_applied_amount["reconciliation"]["absoluteDifference"],
            "percentageDifference": mde_applied_amount["reconciliation"]["percentageDifference"],
            "reasonCodes": (
                []
                if constitutional_status == "reconciled"
                else [
                    "constitutional_divergent_unexplained"
                    if constitutional_status.startswith("divergent")
                    else "constitutional_source_missing"
                ]
            ),
        },
        "perStudent": {"qseDistributedPerEnrollment": qse_per_student},
        "educationLinks": [
            {
                "indicatorId": "creche",
                "programId": "salario_educacao_qsem",
                "relationType": "general_mde",
                "municipalStatus": "transferred" if qse_realized_value is not None else "not_verified",
                "financialStage": "transferred",
                "amountNature": "confirmed",
                "evidenceStatus": "official_nominal" if qse_realized_value is not None else "not_verified",
                "amountReferenceId": "amounts.qseDistributedClosedYear",
            },
            {
                "indicatorId": "alfabetizacao",
                "programId": "fundeb_vaar",
                "relationType": "conditional_support",
                "municipalStatus": vaar_program_status,
                "financialStage": "forecast" if vaar_value is not None else "not_applicable",
                "amountNature": "official_estimate",
                "evidenceStatus": "official_nominal" if vaar_status else "not_verified",
                "amountReferenceId": "amounts.fundebVaarAnnualForecast",
            },
        ],
        "educationalScoreIsolation": {
            "needScore": None,
            "actionabilityScore": None,
            "confidenceScore": None,
            "priorityScore": None,
            "nullReasonCode": "scores_not_applicable_to_financial_contract",
            "changesDecisionSummary": False,
            "changesAttentionOrder": False,
        },
        "generationMetadata": {
            "interfacePublished": False,
            "includedInMunicipalIndex": False,
            "manualSourcesIntegrated": False,
            "lazyLoadOnly": True,
        },
    }


def nested_get(payload: dict[str, Any], path: str) -> Any:
    value: Any = payload
    for key in path.split("."):
        if not isinstance(value, dict):
            return None
        value = value.get(key)
    return value


COVERAGE_FIELDS = [
    ("fnde_fundeb_total_forecast_2026", "fundeb_total_forecast", 2026, "amounts.fundebTotalAnnualForecast"),
    ("fnde_fundeb_total_forecast_2026", "fundeb_vaaf_forecast", 2026, "amounts.fundebVaafAnnualForecast"),
    ("fnde_fundeb_total_forecast_2026", "fundeb_vaaf_status", 2026, "programStatuses.fundebVaaf.status"),
    ("fnde_fundeb_vaat_2026", "fundeb_vaat_forecast", 2026, "amounts.fundebVaatAnnualForecast"),
    ("fnde_fundeb_vaat_2026", "fundeb_vaat_beneficiary_status", 2026, "programStatuses.fundebVaat.status"),
    ("fnde_fundeb_vaat_status_2026", "fundeb_vaat_calculation_status", 2026, "programStatuses.fundebVaat.calculationStatus"),
    ("fnde_fundeb_vaar_status_2026", "fundeb_vaar_status", 2026, "programStatuses.fundebVaar.status"),
    ("fnde_fundeb_vaar_forecast_2026", "fundeb_vaar_forecast", 2026, "amounts.fundebVaarAnnualForecast"),
    ("fnde_qse_realized_2024", "qse_distributed", 2024, "amounts.qseDistributedClosedYear"),
    ("fnde_qse_realized_2024", "qse_enrollments", 2024, "qse.enrollmentsClosedYear"),
    ("fnde_qse_estimate_2026", "qse_official_estimate", 2026, "amounts.qseOfficialEstimateCurrentYear"),
    ("siconfi_dca_function_2024", "education_committed", 2024, "execution.dcaEducation.committed"),
    ("siconfi_dca_function_2024", "education_liquidated", 2024, "execution.dcaEducation.liquidated"),
    ("siconfi_dca_function_2024", "education_paid", 2024, "execution.dcaEducation.paid"),
    ("siconfi_dca_function_2024", "outstanding_non_processed", 2024, "execution.dcaEducation.outstandingNonProcessed"),
    ("siconfi_dca_function_2024", "outstanding_processed", 2024, "execution.dcaEducation.outstandingProcessed"),
    ("siconfi_dca_function_2024", "liquidated_to_committed_rate", 2024, "execution.dcaEducation.derivedRates.liquidatedToCommittedRate"),
    ("siconfi_dca_function_2024", "paid_to_committed_rate", 2024, "execution.dcaEducation.derivedRates.paidToCommittedRate"),
    ("siconfi_dca_function_2024", "paid_to_liquidated_rate", 2024, "execution.dcaEducation.derivedRates.paidToLiquidatedRate"),
    ("siconfi_dca_function_2024", "outstanding_to_committed_rate", 2024, "execution.dcaEducation.derivedRates.outstandingToCommittedRate"),
    ("fnde_siope_indicators_odata_2024_p6", "mde_applied_amount_siope", 2024, "constitutionalApplication.mdeAppliedAmount.siope"),
    ("fnde_siope_rreo_annex8_2024_p6", "mde_applied_amount_rreo", 2024, "constitutionalApplication.mdeAppliedAmount.rreo"),
    ("fnde_siope_indicators_odata_2024_p6", "mde_applied_rate_siope", 2024, "constitutionalApplication.mdeAppliedRate.siope"),
    ("fnde_siope_rreo_annex8_2024_p6", "mde_applied_rate_rreo", 2024, "constitutionalApplication.mdeAppliedRate.rreo"),
    ("fnde_siope_indicators_odata_2024_p6", "fundeb_professional_remuneration_rate_siope", 2024, "constitutionalApplication.fundebProfessionalRemunerationRate.siope"),
    ("fnde_siope_rreo_annex8_2024_p6", "fundeb_professional_remuneration_rate_rreo", 2024, "constitutionalApplication.fundebProfessionalRemunerationRate.rreo"),
    ("fnde_siope_rreo_annex8_2024_p6", "fundeb_revenue_received_declared", 2024, "constitutionalApplication.fundebRevenueReceivedDeclared"),
]


def build_coverage_rows(contracts: list[dict[str, Any]], snapshot: dict[str, Any]) -> list[dict[str, Any]]:
    rows: list[dict[str, Any]] = []
    total = len(contracts)
    for source_id, field, year, path in COVERAGE_FIELDS:
        values = [nested_get(contract, path) for contract in contracts]
        with_value = 0
        with_null = 0
        for value in values:
            if isinstance(value, dict) and "value" in value:
                if value["value"] is None:
                    with_null += 1
                else:
                    with_value += 1
            elif value in (None, "not_verified"):
                with_null += 1
            else:
                with_value += 1
        source = snapshot.get("sources", {}).get(source_id)
        quality = source.get("quality", {}) if source else {}
        status = INTEGRATED_SOURCE_CATALOG[source_id]["status"]
        rows.append(
            {
                "sourceId": source_id,
                "field": field,
                "referenceYear": year,
                "sourceStatus": status,
                "municipalitiesTotal": total,
                "municipalitiesWithValue": with_value,
                "municipalitiesWithNull": with_null,
                "municipalitiesNotFound": int(quality.get("municipalitiesNotFound", total if status == "integrated" else 0)),
                "municipalitiesWithDuplicate": len(quality.get("duplicateMunicipalityCodes", [])),
                "municipalitiesWithIncompatibleKey": int(quality.get("incompatibleMunicipalityKeys", 0)),
                "coverageRate": round(with_value / total, 6),
            }
        )
    return rows


def source_catalog_payload(snapshot: dict[str, Any]) -> dict[str, Any]:
    integrated = []
    for source_id, catalog in INTEGRATED_SOURCE_CATALOG.items():
        source_snapshot = snapshot.get("sources", {}).get(source_id)
        integrated.append(
            {
                "sourceId": source_id,
                **catalog,
                "rawSha256": source_snapshot.get("rawSha256") if source_snapshot else "not_collected",
                **(
                    {
                        key: source_snapshot[key]
                        for key in (
                            "accessedAt",
                            "adapterVersion",
                            "parserVersion",
                            "layoutVersion",
                            "quality",
                        )
                        if key in source_snapshot
                    }
                    if source_snapshot
                    else {}
                ),
            }
        )
    blocked = [{"sourceId": source_id, **metadata} for source_id, metadata in BLOCKED_SOURCE_CATALOG.items()]
    return {
        "schemaVersion": SCHEMA_VERSION,
        "dataVersion": DATA_VERSION,
        "generatedAt": GENERATED_AT,
        "sources": integrated + blocked,
        "reasonMessages": REASON_MESSAGES,
        "summationRules": {
            "same_year_confirmed_transferred_nonoverlapping": "Somente valores confirmados, transferidos, do mesmo exercício, não sobrepostos e autorizados para soma.",
            "fundeb_total_standalone_no_components": "O total anual do Fundeb é apresentado isoladamente; VAAF, VAAT e VAAR não são somados novamente.",
            "fundeb_revenue_received_declared_excluded": "A receita do Fundeb recebida declarada no RREO não integra transferências confirmadas nem saldo disponível.",
        },
        "constitutionalReconciliationRules": {
            "monetaryTolerance": 0.01,
            "percentageTolerance": 0.005,
            "percentagePublishedPrecision": 2,
            "canonicalRuleId": "arithmetic_mean_rounded_to_published_precision",
            "dcaComparisonAllowed": False,
        },
    }


def coverage_payload(rows: list[dict[str, Any]]) -> dict[str, Any]:
    return {
        "schemaVersion": SCHEMA_VERSION,
        "dataVersion": DATA_VERSION,
        "generatedAt": GENERATED_AT,
        "municipalities": EXPECTED_MUNICIPALITIES,
        "fields": rows,
    }


def contracts_hash(contracts: list[dict[str, Any]]) -> str:
    digest = hashlib.sha256()
    for contract in sorted(contracts, key=lambda item: item["municipality"]["ibgeCode"]):
        digest.update(contract["municipality"]["ibgeCode"].encode("ascii"))
        digest.update(canonical_json(contract).encode("utf-8"))
    return digest.hexdigest()


def generate_contracts(
    municipalities: list[dict[str, str]],
    snapshot: dict[str, Any],
    output_roots: list[Path],
) -> dict[str, Any]:
    contracts = [build_contract(municipality, snapshot) for municipality in municipalities]
    coverage_rows = build_coverage_rows(contracts, snapshot)
    catalogs = source_catalog_payload(snapshot)
    coverage = coverage_payload(coverage_rows)
    logical_hash = contracts_hash(contracts)
    manifest = {
        "schemaVersion": SCHEMA_VERSION,
        "dataVersion": DATA_VERSION,
        "generatedAt": GENERATED_AT,
        "logicalContracts": len(contracts),
        "aliasFiles": len(contracts) * 2,
        "contractsSha256": logical_hash,
        "sourceSnapshotSha256": sha256_payload(snapshot),
        "municipalPathTemplate": "/data/municipios/<slug-or-ibge>/financeiro.json",
        "includedInMunicipalIndex": False,
        "lazyLoadOnly": True,
    }
    stats = {"created": 0, "updated": 0, "preserved": 0}
    for root in output_roots:
        for name, payload in (
            ("catalogos.json", catalogs),
            ("cobertura.json", coverage),
            ("manifest.json", manifest),
        ):
            action = write_json_if_changed(root / "financeiro" / name, payload)
            stats[action] += 1
        for municipality, contract in zip(municipalities, contracts, strict=True):
            content = canonical_json(contract)
            for identifier in (municipality["slug"], municipality["ibgeCode"]):
                action = write_text_if_changed(root / "municipios" / identifier / "financeiro.json", content)
                stats[action] += 1
    return {
        "contracts": contracts,
        "coverageRows": coverage_rows,
        "manifest": manifest,
        "stats": stats,
    }


def csv_text(rows: list[dict[str, Any]], fieldnames: list[str]) -> str:
    buffer = io.StringIO(newline="")
    writer = csv.DictWriter(buffer, fieldnames=fieldnames, lineterminator="\n")
    writer.writeheader()
    writer.writerows(rows)
    return buffer.getvalue()


def write_coverage_csv(path: Path, rows: list[dict[str, Any]]) -> str:
    fieldnames = [
        "sourceId",
        "field",
        "referenceYear",
        "sourceStatus",
        "municipalitiesTotal",
        "municipalitiesWithValue",
        "municipalitiesWithNull",
        "municipalitiesNotFound",
        "municipalitiesWithDuplicate",
        "municipalitiesWithIncompatibleKey",
        "coverageRate",
    ]
    return write_text_if_changed(path, csv_text(rows, fieldnames))


def write_reconciliation_sample_csv(path: Path, contracts: list[dict[str, Any]]) -> str:
    selected = {contract["municipality"]["ibgeCode"]: contract for contract in contracts}
    rows = []
    for code, expected_name in SAMPLE_CODES.items():
        contract = selected[code]
        execution = contract["execution"]["dcaEducation"]
        constitutional = contract["constitutionalApplication"]
        mde = constitutional["mdeAppliedAmount"]
        rows.append(
            {
                "municipalityId": code,
                "municipalityName": expected_name,
                "referenceYear": 2024,
                "dcaCommitted": execution["committed"]["value"],
                "siopeMdeApplied": mde["siope"]["value"],
                "rreoMdeApplied": mde["rreo"]["value"],
                "canonicalMdeApplied": mde["canonical"]["value"],
                "reconciliationStatus": mde["reconciliation"]["status"],
                "absoluteDifference": mde["reconciliation"]["absoluteDifference"]["value"],
                "percentageDifference": mde["reconciliation"]["percentageDifference"]["value"],
                "dcaComparableToMde": "false",
            }
        )
    fieldnames = [
        "municipalityId",
        "municipalityName",
        "referenceYear",
        "dcaCommitted",
        "siopeMdeApplied",
        "rreoMdeApplied",
        "canonicalMdeApplied",
        "reconciliationStatus",
        "absoluteDifference",
        "percentageDifference",
        "dcaComparableToMde",
    ]
    return write_text_if_changed(path, csv_text(rows, fieldnames))


def iter_objects(value: Any) -> Iterable[dict[str, Any]]:
    if isinstance(value, dict):
        yield value
        for child in value.values():
            yield from iter_objects(child)
    elif isinstance(value, list):
        for child in value:
            yield from iter_objects(child)


def validate_contract(contract: dict[str, Any]) -> None:
    code = contract.get("municipality", {}).get("ibgeCode", "unknown")
    if contract.get("schemaVersion") != SCHEMA_VERSION:
        raise AssertionError(f"{code}: schema incompatível")
    if contract.get("periods") != {
        "closedFiscalYear": 2024,
        "annualForecastYear": 2026,
        "forecastCutoffDate": FORECAST_CUTOFF_DATE,
        "mixesPeriodsInTotals": False,
    }:
        raise AssertionError(f"{code}: períodos inválidos")
    for item in iter_objects(contract):
        if "value" in item and item["value"] is None and not item.get("nullReasonCode"):
            raise AssertionError(f"{code}: valor nulo sem razão")
        if "rate" in item and item["rate"] is None and not item.get("reasonCodes"):
            raise AssertionError(f"{code}: cobertura nula sem razão")
    serialized = canonical_json(contract)
    if "http://" in serialized or "https://" in serialized:
        raise AssertionError(f"{code}: URL longa repetida no contrato")
    if any(source_id in serialized for source_id in BLOCKED_SOURCE_CATALOG):
        raise AssertionError(f"{code}: fonte manual publicada no contrato")
    score_isolation = contract["educationalScoreIsolation"]
    for score in ("needScore", "actionabilityScore", "confidenceScore", "priorityScore"):
        if score_isolation[score] is not None:
            raise AssertionError(f"{code}: score financeiro preenchido")
    vaar_status = contract["programStatuses"]["fundebVaar"]["status"]
    vaar_amount = contract["amounts"]["fundebVaarAnnualForecast"]
    if vaar_status == "confirmed_non_beneficiary" and vaar_amount["value"] is not None:
        raise AssertionError(f"{code}: não beneficiário VAAR com valor potencial")
    for key in ("fundebVaafAnnualForecast", "fundebVaatAnnualForecast", "fundebVaarAnnualForecast"):
        component = contract["amounts"][key]
        if component["summationAllowed"]:
            raise AssertionError(f"{code}: componente Fundeb autorizado para dupla soma")
    execution = contract["execution"]["dcaEducation"]
    for key in ("committed", "liquidated", "paid", "outstandingNonProcessed", "outstandingProcessed"):
        if execution[key]["amountNature"] != "municipal_declared":
            raise AssertionError(f"{code}: natureza DCA inválida")
    for rate in execution["derivedRates"].values():
        calculation = rate["calculation"]
        if calculation["sourceId"] != "siconfi_dca_function_2024" or calculation["referenceYear"] != 2024:
            raise AssertionError(f"{code}: memória de cálculo DCA inválida")
    constitutional = contract["constitutionalApplication"]
    if constitutional["referenceYear"] != 2024 or constitutional["period"] != 6:
        raise AssertionError(f"{code}: período constitucional inválido")
    if constitutional["stageBasis"] != "empenhado":
        raise AssertionError(f"{code}: base do sexto bimestre inválida")
    if constitutional["status"] not in {
        "reconciled",
        "source_missing",
        "divergent_explained",
        "divergent_unexplained",
    }:
        raise AssertionError(f"{code}: reconciliação constitucional inválida")
    for field in (
        "mdeAppliedAmount",
        "mdeAppliedRate",
        "fundebProfessionalRemunerationRate",
    ):
        metric = constitutional[field]
        if metric["siope"]["sourceId"] != "fnde_siope_indicators_odata_2024_p6":
            raise AssertionError(f"{code}: fonte SIOPE perdida em {field}")
        if metric["rreo"]["sourceId"] != "fnde_siope_rreo_annex8_2024_p6":
            raise AssertionError(f"{code}: fonte RREO perdida em {field}")
        status = metric["reconciliation"]["status"]
        if status == "reconciled" and metric["canonical"]["value"] is None:
            raise AssertionError(f"{code}: valor canônico ausente em reconciliação válida")
        if status != "reconciled" and metric["canonical"]["value"] is not None:
            raise AssertionError(f"{code}: valor canônico publicado sem reconciliação")
    fundeb_received = constitutional["fundebRevenueReceivedDeclared"]
    if (
        fundeb_received["sourceId"] != "fnde_siope_rreo_annex8_2024_p6"
        or fundeb_received["amountNature"] != "municipal_declared"
        or fundeb_received["financialStage"] != "received"
    ):
        raise AssertionError(f"{code}: receita Fundeb declarada com semântica inválida")
    summary = canonical_json(contract["summary"])
    if "fnde_siope_rreo_annex8_2024_p6" in summary or "fundebRevenueReceivedDeclared" in summary:
        raise AssertionError(f"{code}: receita Fundeb declarada incluída no resumo somável")
    if contract["generationMetadata"] != {
        "interfacePublished": False,
        "includedInMunicipalIndex": False,
        "manualSourcesIntegrated": False,
        "lazyLoadOnly": True,
    }:
        raise AssertionError(f"{code}: metadados de publicação inválidos")


def validate_generated_contracts(root: Path, municipalities: list[dict[str, str]]) -> dict[str, Any]:
    sizes = []
    digest = hashlib.sha256()
    for municipality in municipalities:
        slug_path = root / "municipios" / municipality["slug"] / "financeiro.json"
        code_path = root / "municipios" / municipality["ibgeCode"] / "financeiro.json"
        if not slug_path.exists() or not code_path.exists():
            raise AssertionError(f"Contrato ausente: {municipality['ibgeCode']}")
        slug_bytes = slug_path.read_bytes()
        code_bytes = code_path.read_bytes()
        if slug_bytes != code_bytes:
            raise AssertionError(f"Aliases divergentes: {municipality['ibgeCode']}")
        contract = json.loads(slug_bytes)
        validate_contract(contract)
        sizes.append(len(slug_bytes))
        digest.update(municipality["ibgeCode"].encode("ascii"))
        digest.update(slug_bytes)
        index_payload = json.loads((root / "municipios" / municipality["slug"] / "index.json").read_text(encoding="utf-8"))
        if "financeiro" in index_payload:
            raise AssertionError(f"financeiro incluído no index.json: {municipality['ibgeCode']}")
    return {
        "logicalContracts": len(municipalities),
        "aliasFiles": len(municipalities) * 2,
        "averageBytes": round(sum(sizes) / len(sizes)),
        "largestBytes": max(sizes),
        "totalLogicalBytes": sum(sizes),
        "totalAliasBytes": sum(sizes) * 2,
        "contractsSha256": digest.hexdigest(),
    }
