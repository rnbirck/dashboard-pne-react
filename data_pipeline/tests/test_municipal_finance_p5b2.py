from __future__ import annotations

import copy
import hashlib
import sys
import unittest
from pathlib import Path


PROJECT_DIR = Path(__file__).resolve().parents[2]
sys.path.insert(0, str(PROJECT_DIR / "data_pipeline"))

from src.municipal_finance_p5b2 import (  # noqa: E402
    DuplicateGrainError,
    SourceSchemaError,
    adapt_msc_rows,
    adapt_siope_rows,
    canonical_json,
    coverage_summary,
    detect_duplicate_grain,
    reconciliation_state,
    sha256_bytes,
    validate_ibge_code,
    validate_poc_records,
)


SIOPE_ROW = {
    "TIPO": "Municipal",
    "NUM_ANO": 2024,
    "NUM_PERI": 6,
    "COD_UF": 43,
    "SIG_UF": "RS",
    "COD_MUNI": 430010,
    "NOM_MUNI": "AGUDO",
    "COD_INDI": 1,
    "COD_EXIB": "8.1",
    "NOM_INDI": "Valor aplicado em MDE da receita de impostos",
    "COD_GRUP": 8,
    "NOM_GRUP_INDI": "Aplicação da Receita de Impostos em MDE",
    "VAL_INDI": "19.159.995,28",
}

MSC_ROW = {
    "tipo_matriz": "MSCE",
    "cod_ibge": 4300109,
    "classe_conta": 6,
    "conta_contabil": "622130500",
    "poder_orgao": "10131",
    "ano_fonte_recursos": 1,
    "fonte_recursos": "1500",
    "funcao": "12",
    "subfuncao": "361",
    "exercicio": 2024,
    "mes_referencia": 12,
    "educacao_saude": None,
    "data_referencia": "2024-12-31T00:00:00Z",
    "entrada_msc": 123,
    "natureza_despesa": "33903000",
    "ano_inscricao": 2024,
    "natureza_receita": None,
    "valor": 100.0,
    "natureza_conta": "D",
    "tipo_valor": "period_change",
    "complemento_fonte": None,
}


def siope_records(rows: list[dict] | None = None) -> list[dict]:
    return adapt_siope_rows(
        rows or [SIOPE_ROW],
        {"430010": {"name": "Agudo", "ibgeCode": "4300109"}},
        source_url="https://example.invalid/siope",
        source_hash="a" * 64,
        accessed_at="2026-07-20T12:00:00Z",
        published_at=None,
    )


class MunicipalFinanceP5B2AuditTest(unittest.TestCase):
    def test_01_chave_ibge_municipal_estavel(self) -> None:
        self.assertEqual(validate_ibge_code("4300109"), "4300109")
        with self.assertRaises(ValueError):
            validate_ibge_code("430010")

    def test_02_exercicio_e_explicito(self) -> None:
        self.assertEqual(siope_records()[0]["referenceYear"], 2024)

    def test_03_periodo_e_explicito(self) -> None:
        self.assertEqual(siope_records()[0]["period"], "bimestre_6")

    def test_04_estagio_e_explicito(self) -> None:
        self.assertEqual(siope_records()[0]["financialStage"], "calculated_indicator")

    def test_05_natureza_e_explicita(self) -> None:
        records = adapt_msc_rows(
            [MSC_ROW],
            "Agudo",
            source_url="https://example.invalid/msc",
            source_hash="b" * 64,
            accessed_at="2026-07-20T12:00:00Z",
            published_at="2025-01-23T15:50:30Z",
        )
        self.assertEqual(records[0]["amountNature"], "municipal_declared")
        self.assertEqual(records[0]["dimensions"]["economicCategory"], "current_expense")

    def test_06_ausencia_nao_e_convertida_em_zero(self) -> None:
        record = siope_records()[0]
        record["value"] = None
        record["notes"] = "Indicador ausente; ausência preservada como null."
        validate_poc_records([record])
        self.assertIsNone(record["value"])

    def test_07_duplicidade_e_detectada(self) -> None:
        records = siope_records()
        duplicates = detect_duplicate_grain(records + copy.deepcopy(records), ("ibgeCode", "concept"))
        self.assertEqual(len(duplicates), 1)
        with self.assertRaises(DuplicateGrainError):
            siope_records([SIOPE_ROW, copy.deepcopy(SIOPE_ROW)])

    def test_08_schema_inesperado_interrompe_ingestao(self) -> None:
        invalid = copy.deepcopy(SIOPE_ROW)
        del invalid["VAL_INDI"]
        with self.assertRaises(SourceSchemaError):
            siope_records([invalid])

    def test_09_hash_da_fonte_e_registrado(self) -> None:
        expected = "ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad"
        self.assertEqual(sha256_bytes(b"abc"), expected)
        self.assertRegex(siope_records()[0]["sourceHash"], r"^[0-9a-f]{64}$")

    def test_10_duas_execucoes_geram_saida_normalizada_identica(self) -> None:
        first = canonical_json(siope_records())
        second = canonical_json(siope_records())
        self.assertEqual(first, second)
        self.assertEqual(sha256_bytes(first), sha256_bytes(second))

    def test_11_previsao_permanece_separada_de_realizado(self) -> None:
        forecast = {"concept": "fundeb", "financialStage": "forecast", "amountNature": "official_estimate", "value": 10}
        realized = {"concept": "fundeb", "financialStage": "received", "amountNature": "confirmed", "value": 10}
        self.assertEqual(reconciliation_state(forecast, realized), "not_comparable")

    def test_12_transferencia_permanece_separada_de_recebimento(self) -> None:
        transferred = {"concept": "fundeb", "financialStage": "transferred", "amountNature": "confirmed", "value": 10}
        received = {"concept": "fundeb", "financialStage": "received", "amountNature": "confirmed", "value": 10}
        self.assertEqual(reconciliation_state(transferred, received), "not_comparable")

    def test_13_conceitos_nao_equivalentes_nao_sao_reconciliados(self) -> None:
        dca = {"concept": "education_function", "financialStage": "empenhado", "amountNature": "municipal_declared", "value": 10}
        rreo = {"concept": "mde_applied_value", "financialStage": "empenhado", "amountNature": "municipal_declared", "value": 10}
        self.assertEqual(reconciliation_state(dca, rreo), "not_comparable")

    def test_14_cobertura_usa_denominador_de_497_municipios(self) -> None:
        registry = [f"43{number:05d}" for number in range(497)]
        summary = coverage_summary(registry[:490], registry)
        self.assertEqual(summary["denominator"], 497)
        self.assertEqual(summary["covered"], 490)
        self.assertAlmostEqual(summary["coverageRate"], 490 / 497)

    def test_15_public_data_nao_foi_alterado(self) -> None:
        def public_data_hash() -> str:
            digest = hashlib.sha256()
            root = PROJECT_DIR / "public" / "data"
            for path in sorted(item for item in root.rglob("*") if item.is_file()):
                digest.update(path.relative_to(root).as_posix().encode("utf-8"))
                digest.update(b"\0")
                digest.update(path.read_bytes())
            return digest.hexdigest()

        before = public_data_hash()
        siope_records()
        after = public_data_hash()
        self.assertEqual(after, before)


if __name__ == "__main__":
    unittest.main()
