from __future__ import annotations

import copy
import json
import sys
import unittest
from pathlib import Path


DATA_PIPELINE_DIR = Path(__file__).resolve().parents[1]
REPO_ROOT = DATA_PIPELINE_DIR.parent
sys.path.insert(0, str(DATA_PIPELINE_DIR))

from src.municipal_finance import (  # noqa: E402
    build_contract,
    load_municipality_registry,
    load_source_snapshot,
    reconciled_constitutional_metric,
    validate_contract,
)
from src.municipal_finance_constitutional import (  # noqa: E402
    CROSSWALK_VERSION,
    REFERENCE_PERIOD,
    REFERENCE_YEAR,
    RREO_SOURCE_ID,
    SIOPE_SOURCE_ID,
    apply_rreo_revision_policy,
    load_constitutional_snapshot,
    merge_constitutional_snapshot,
    validate_crosswalk,
)
from src.municipal_finance_p5b2 import (  # noqa: E402
    RREO_LAYOUT_VERSION,
    RREO_PARSER_VERSION,
    SourceSchemaError,
    adapt_rreo_text,
)


DATA_DIR = DATA_PIPELINE_DIR / "data" / "municipal_finance"
PUBLIC_DATA = REPO_ROOT / "public" / "data"


def rreo_text() -> str:
    return """
AGUDO - RS
RELATÓRIO RESUMIDO DA EXECUÇÃO ORÇAMENTÁRIA
DEMONSTRATIVO DAS RECEITAS E DESPESAS COM MANUTENÇÃO E DESENVOLVIMENTO DO ENSINO - MDE
Período de Referência: 6º Bimestre/2024
RREO - ANEXO 8 (LDB, art. 72) R$ 1,00
6- TOTAL DAS RECEITAS DO FUNDEB RECEBIDAS 10,00 20,00
6.1- FUNDEB - Impostos e Transferências de Impostos
15- MÍNIMO DE 70% DO FUNDEB NA REMUNERAÇÃO DOS PROFISSIONAIS DA EDUCAÇÃO BÁSICA 70,00 80,00 80,00 90,00
16 - PERCENTUAL DA COMPLEMENTAÇÃO DA UNIÃO
29- APLICAÇÃO EM MDE SOBRE A RECEITA LÍQUIDA DE IMPOSTOS 25,00 30,00 27,00
RESTOS A PAGAR INSCRITOS
5Nos cinco primeiros bimestres do exercício o acompanhamento será feito com base na despesa liquidada. No último bimestre do exercício, o valor deverá corresponder ao total da despesa empenhada.
"""


class MunicipalFinanceP5B2B1Test(unittest.TestCase):
    @classmethod
    def setUpClass(cls) -> None:
        cls.municipalities = load_municipality_registry(PUBLIC_DATA / "municipios_index.json")
        base = load_source_snapshot(DATA_DIR / "source_snapshot.json")
        cls.constitutional_snapshot = load_constitutional_snapshot(
            DATA_DIR / "constitutional_source_snapshot.json"
        )
        cls.snapshot = merge_constitutional_snapshot(base, cls.constitutional_snapshot)
        cls.contracts = {
            municipality["ibgeCode"]: build_contract(municipality, cls.snapshot)
            for municipality in cls.municipalities
        }

    def test_01_crosswalk_covers_497_unique_codes(self) -> None:
        payload = json.loads((DATA_DIR / "siope_ibge_crosswalk_v1.json").read_text(encoding="utf-8"))
        self.assertEqual(payload["crosswalkVersion"], CROSSWALK_VERSION)
        crosswalk = validate_crosswalk(payload)
        self.assertEqual(len(crosswalk), 497)
        self.assertEqual(len({record["ibgeCode"] for record in crosswalk.values()}), 497)

    def test_02_snapshot_keeps_annual_fallback_sources_at_the_sixth_bimester(self) -> None:
        self.assertEqual(self.constitutional_snapshot["referenceYear"], 2025)
        self.assertEqual(self.constitutional_snapshot["referenceYears"], [REFERENCE_YEAR, 2025])
        self.assertEqual(self.constitutional_snapshot["period"], REFERENCE_PERIOD)
        self.assertEqual(self.constitutional_snapshot["stageBasis"], "empenhado")

    def test_03_rreo_parser_validates_header_layout_lines_columns_and_note_5(self) -> None:
        records = adapt_rreo_text(
            rreo_text(),
            municipality="Agudo",
            ibge_code="4300109",
            reference_year=2024,
            bimester=6,
            source_url="ftp://example.invalid/rreo.pdf",
            source_hash="a" * 64,
            accessed_at="2026-07-20",
            published_at=None,
        )
        by_concept = {record["concept"]: record for record in records}
        self.assertEqual(by_concept["fundeb_total_received"]["value"], 20)
        self.assertEqual(by_concept["fundeb_professionals_remuneration_rate"]["value"], 90)
        self.assertEqual(by_concept["mde_applied_value"]["value"], 30)
        self.assertEqual(by_concept["mde_application_rate"]["value"], 27)
        self.assertEqual(by_concept["mde_applied_value"]["financialStage"], "empenhado")
        self.assertEqual(by_concept["mde_applied_value"]["dimensions"]["line"], "29")
        self.assertEqual(by_concept["mde_applied_value"]["dimensions"]["column"], "aa")
        self.assertEqual(by_concept["mde_applied_value"]["dimensions"]["layoutVersion"], RREO_LAYOUT_VERSION)
        self.assertEqual(by_concept["mde_applied_value"]["dimensions"]["parserVersion"], RREO_PARSER_VERSION)

    def test_04_unexpected_rreo_schema_stops_ingestion(self) -> None:
        with self.assertRaises(SourceSchemaError):
            adapt_rreo_text(
                rreo_text().replace("RREO - ANEXO 8", "RREO - ANEXO 9"),
                municipality="Agudo",
                ibge_code="4300109",
                reference_year=2024,
                bimester=6,
                source_url="ftp://example.invalid/rreo.pdf",
                source_hash="a" * 64,
                accessed_at="2026-07-20",
                published_at=None,
            )

    def test_05_every_rreo_pdf_has_hash_size_timestamp_parser_and_layout(self) -> None:
        records = self.constitutional_snapshot["sources"][RREO_SOURCE_ID]["records"]
        self.assertEqual(len(records), 497)
        for record in records.values():
            self.assertRegex(record["sourceHash"], r"^[0-9a-f]{64}$")
            self.assertGreater(record["sizeBytes"], 0)
            self.assertTrue(record["lastModified"])
            self.assertEqual(record["parserVersion"], RREO_PARSER_VERSION)
            self.assertEqual(record["layoutVersion"], RREO_LAYOUT_VERSION)

    def test_06_source_revision_is_detected_and_previous_value_remains_published(self) -> None:
        previous = {
            "4300109": {
                "sourceHash": "a" * 64,
                "sourceUrl": "ftp://example.invalid/old.pdf",
                "mdeAppliedAmount": 10,
                "lastModified": "2025-01-01T00:00:00Z",
                "sizeBytes": 100,
            }
        }
        candidate = copy.deepcopy(previous["4300109"])
        candidate.update(
            {
                "sourceHash": "b" * 64,
                "sourceUrl": "ftp://example.invalid/new.pdf",
                "mdeAppliedAmount": 11,
                "lastModified": "2025-02-01T00:00:00Z",
                "sizeBytes": 101,
            }
        )
        history = {"revisionPolicyVersion": "municipal-finance-rreo-revisions-v1", "events": []}
        published, events = apply_rreo_revision_policy(
            previous,
            {"4300109": candidate},
            {"4300109": {"name": "Agudo", "ibgeCode": "4300109"}},
            history,
        )
        self.assertEqual(published["4300109"]["mdeAppliedAmount"], 10)
        self.assertEqual(events[0]["status"], "source_revision_detected")
        self.assertTrue(events[0]["publicationBlocked"])

    def test_07_siope_and_rreo_values_are_both_preserved(self) -> None:
        metric = self.contracts["4300109"]["constitutionalApplication"]["mdeAppliedAmount"]
        self.assertEqual(metric["siope"]["value"], 18_296_611.85)
        self.assertEqual(metric["rreo"]["value"], 18_296_611.85)
        self.assertEqual(metric["canonical"]["value"], 18_296_611.85)
        self.assertEqual(metric["canonical"]["referenceYear"], 2025)

    def test_08_canonical_exists_only_when_reconciled(self) -> None:
        divergent = reconciled_constitutional_metric(
            100,
            101,
            unit="BRL",
            financial_stage="empenhado",
        )
        missing = reconciled_constitutional_metric(
            100,
            None,
            unit="BRL",
            financial_stage="empenhado",
        )
        self.assertEqual(divergent["reconciliation"]["status"], "divergent_unexplained")
        self.assertIsNone(divergent["canonical"]["value"])
        self.assertEqual(missing["reconciliation"]["status"], "source_missing")
        self.assertIsNone(missing["canonical"]["value"])
        self.assertNotEqual(missing["rreo"]["value"], 0)

    def test_09_monetary_and_percentage_tolerances_are_explicit(self) -> None:
        monetary = reconciled_constitutional_metric(
            100,
            100.01,
            unit="BRL",
            financial_stage="empenhado",
        )
        percentage = reconciled_constitutional_metric(
            25.000,
            25.004,
            unit="percent",
            financial_stage="calculated_indicator",
        )
        self.assertEqual(monetary["reconciliation"]["status"], "reconciled")
        self.assertEqual(percentage["reconciliation"]["status"], "reconciled")
        self.assertEqual(monetary["reconciliation"]["toleranceRuleId"], "monetary_absolute_0_01")
        self.assertEqual(percentage["reconciliation"]["toleranceRuleId"], "published_precision_2_decimals")

    def test_10_dca_is_not_reconciled_as_mde(self) -> None:
        contract = self.contracts["4300109"]
        self.assertEqual(contract["summary"]["dcaEducationCommitted"]["value"], 28_948_138.0)
        self.assertEqual(
            contract["constitutionalApplication"]["mdeAppliedAmount"]["canonical"]["value"],
            18_296_611.85,
        )
        self.assertEqual(contract["reconciliation"]["scope"], "siope_rreo_constitutional_application")

    def test_11_fundeb_declared_received_is_outside_confirmed_transfers(self) -> None:
        contract = self.contracts["4300109"]
        declared = contract["constitutionalApplication"]["fundebRevenueReceivedDeclared"]
        confirmed = contract["summary"]["confirmedTransfersCoveredBySources"]
        self.assertEqual(declared["value"], 20_720_141.29)
        self.assertEqual(declared["amountNature"], "municipal_declared")
        self.assertEqual(declared["financialStage"], "received")
        self.assertNotIn(declared["sourceId"], confirmed["coveredSourceIds"])
        self.assertEqual(confirmed["value"], contract["amounts"]["qseDistributedClosedYear"]["value"])

    def test_12_all_497_contracts_are_valid_and_scores_stay_null(self) -> None:
        self.assertEqual(len(self.contracts), 497)
        for contract in self.contracts.values():
            validate_contract(contract)
            self.assertIsNone(contract["educationalScoreIsolation"]["priorityScore"])

    def test_13_public_contracts_use_only_code_paths_and_finance_is_absent_from_index(self) -> None:
        for municipality in self.municipalities:
            slug_root = PUBLIC_DATA / "municipios" / municipality["slug"]
            code_root = PUBLIC_DATA / "municipios" / municipality["ibgeCode"]
            self.assertFalse(slug_root.exists())
            self.assertTrue((code_root / "financeiro.json").is_file())
            index = json.loads((code_root / "index.json").read_text(encoding="utf-8"))
            self.assertNotIn("financeiro", index)

    def test_15_barra_do_quarai_uses_2024_without_zero_imputation(self) -> None:
        contract = self.contracts["4301875"]
        self.assertEqual(contract["constitutionalApplication"]["referenceYear"], 2024)
        self.assertEqual(contract["constitutionalApplication"]["status"], "reconciled")
        for field in (
            "mdeAppliedAmount",
            "mdeAppliedRate",
            "fundebProfessionalRemunerationRate",
        ):
            self.assertIsNotNone(contract["constitutionalApplication"][field]["canonical"]["value"])

    def test_16_snapshot_contains_only_homologated_constitutional_sources(self) -> None:
        source_ids = set(self.constitutional_snapshot["sources"])
        self.assertEqual(
            source_ids,
            {
                SIOPE_SOURCE_ID,
                RREO_SOURCE_ID,
                "fnde_siope_indicators_odata_2025_p6",
                "fnde_siope_rreo_annex8_2025_p6",
            },
        )
        serialized = json.dumps(self.constitutional_snapshot, ensure_ascii=False)
        self.assertNotIn("msc_orcamentaria", serialized)
        self.assertNotIn("fundeb_actual_transfers", serialized)


if __name__ == "__main__":
    unittest.main()
