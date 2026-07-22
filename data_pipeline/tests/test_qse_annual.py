from __future__ import annotations

from copy import deepcopy
from decimal import Decimal
import json
from pathlib import Path
import sys
import tempfile
import unittest

ROOT = Path(__file__).resolve().parents[2]
sys.path.insert(0, str(ROOT / "data_pipeline"))

from src.qse_annual import (  # noqa: E402
    Municipality,
    build_contract,
    merge_2025_enrollment_basis,
    parse_qse_enrollment_basis_lines,
    parse_qse_annual_lines,
    parse_qse_monthly_lines,
    reconcile_2024,
    reconcile_monthly_continuity_2024,
    validate_publication_quality,
)


FIXTURES = Path(__file__).resolve().parent / "fixtures"


class QseAnnualTest(unittest.TestCase):
    def setUp(self) -> None:
        self.municipalities = {
            "4300034": Municipality("4300034", "Aceguá", "acegua"),
            "4300059": Municipality("4300059", "Água Santa", "agua-santa"),
            "4317103": Municipality("4317103", "Sant'Ana do Livramento", "sant-ana-do-livramento"),
        }

    def fixture(self, name: str) -> list[str]:
        return (FIXTURES / name).read_text(encoding="utf-8").splitlines()

    def test_parser_2024_uses_ibge_and_keeps_fields_separate(self) -> None:
        records, quality = parse_qse_annual_lines(
            self.fixture("qse_annual_2024.txt"), 2024, self.municipalities
        )
        self.assertEqual(set(records), set(self.municipalities))
        self.assertEqual(records["4300034"]["distributedAmount"], Decimal("386882.53"))
        self.assertEqual(records["4300034"]["enrollmentBasis"], 726)
        self.assertEqual(records["4300034"]["distributionCoefficient"], Decimal("0.000019493342"))
        self.assertEqual(quality["municipalitiesWithValue"], 3)
        self.assertEqual(quality["coverageRate"], 1.0)

    def test_parser_2025_reconciles_months_and_excludes_state_row(self) -> None:
        records, quality = parse_qse_monthly_lines(
            self.fixture("qse_annual_2025_monthly.txt"), 2025, self.municipalities
        )
        self.assertEqual(set(records), set(self.municipalities))
        self.assertEqual(records["4300034"]["distributedAmount"], Decimal("420559.00"))
        self.assertEqual(records["4300034"]["monthlySum"], Decimal("420559.00"))
        self.assertEqual(len(records["4300034"]["monthlyAmounts"]), 12)
        self.assertEqual(quality["municipalitiesIdentified"], 3)
        self.assertEqual(quality["monthlyReconciledMunicipalities"], 3)
        self.assertEqual(quality["monthlyDivergenceCount"], 0)
        self.assertEqual(quality["stateRowsSeparated"], 1)
        self.assertEqual(quality["stateGovernmentOfficialTotal"], 398306716.57)
        self.assertEqual(quality["missingRequiredColumns"], [])

    def test_2025_monthly_missing_value_and_divergence_block_publication(self) -> None:
        divergent = self.fixture("qse_annual_2025_monthly.txt")
        divergent[1] = divergent[1].replace("420.559,00", "420.559,01")
        _, divergent_quality = parse_qse_monthly_lines(divergent, 2025, self.municipalities)
        self.assertEqual(divergent_quality["monthlyDivergenceCount"], 1)
        with self.assertRaisesRegex(ValueError, "divergências entre meses e Total"):
            validate_publication_quality(divergent_quality)

        missing = self.fixture("qse_annual_2025_monthly.txt")
        missing[1] = missing[1].replace("32.795,43", "-", 1)
        _, missing_quality = parse_qse_monthly_lines(missing, 2025, self.municipalities)
        self.assertEqual(missing_quality["missingMonthMunicipalityCodes"], ["4300034"])
        with self.assertRaisesRegex(ValueError, "meses ausentes"):
            validate_publication_quality(missing_quality)

    def test_2025_basis_uses_ibge_and_same_year_enrollment(self) -> None:
        monthly, _ = parse_qse_monthly_lines(
            self.fixture("qse_annual_2025_monthly.txt"), 2025, self.municipalities
        )
        basis, quality = parse_qse_enrollment_basis_lines(
            self.fixture("qse_annual_2025_basis.txt"), self.municipalities
        )
        merged = merge_2025_enrollment_basis(monthly, basis)
        self.assertEqual(quality["municipalitiesIdentified"], 3)
        self.assertEqual(quality["stateRowsSeparated"], 1)
        self.assertEqual(merged["4300034"]["enrollmentBasis"], 720)
        self.assertEqual(
            merged["4300034"]["distributionCoefficient"], Decimal("0.000019480799")
        )
        contract = build_contract(
            self.municipalities["4300034"], {2025: merged}, {2025: "c" * 64}
        )
        point = contract["series"][0]
        self.assertEqual(point["year"], 2025)
        self.assertAlmostEqual(point["distributedPerEnrollment"], 584.1097222222222)

    def test_older_source_uses_only_exact_map_and_explicit_crosswalk(self) -> None:
        records, quality = parse_qse_annual_lines(
            self.fixture("qse_annual_2020.txt"), 2020, self.municipalities
        )
        self.assertEqual(set(records), set(self.municipalities))
        self.assertEqual(records["4317103"]["officialName"], "SANTANA DO LIVRAMENTO")
        self.assertEqual(quality["unmappedRecords"], [])

    def test_zero_is_preserved_and_absence_is_not_zero(self) -> None:
        records, quality = parse_qse_annual_lines(
            self.fixture("qse_annual_2020.txt")[:-1], 2020, self.municipalities
        )
        self.assertEqual(records["4300059"]["distributedAmount"], Decimal("0.00"))
        self.assertEqual(quality["officialZeroMunicipalityCodes"], ["4300059"])
        missing_lines = [line for line in self.fixture("qse_annual_2020.txt") if "ACEGUA" not in line]
        missing_records, missing_quality = parse_qse_annual_lines(missing_lines, 2020, self.municipalities)
        self.assertNotIn("4300034", missing_records)
        self.assertIn("4300034", missing_quality["absentMunicipalityCodes"])

    def test_duplicate_and_negative_block_publication(self) -> None:
        lines = self.fixture("qse_annual_2020.txt") + [
            "RS ACEGUA 300.000,00",
            "RS AGUA SANTA -1,00",
        ]
        _, quality = parse_qse_annual_lines(lines, 2020, self.municipalities)
        self.assertEqual(quality["duplicateMunicipalityCodes"], ["4300034", "4300059"])
        with self.assertRaisesRegex(ValueError, "duplicidades"):
            validate_publication_quality(quality)

        negative_lines = [
            "RS ACEGUA -1,00",
            "RS AGUA SANTA 0,00",
            "RS SANTANA DO LIVRAMENTO 1,00",
        ]
        _, negative_quality = parse_qse_annual_lines(negative_lines, 2020, self.municipalities)
        self.assertEqual(negative_quality["negativeValueMunicipalityCodes"], ["4300034"])
        with self.assertRaisesRegex(ValueError, "valores negativos"):
            validate_publication_quality(negative_quality)

    def test_contract_is_sorted_and_omits_absent_year(self) -> None:
        records_2020, _ = parse_qse_annual_lines(
            self.fixture("qse_annual_2020.txt"), 2020, self.municipalities
        )
        records_2024, _ = parse_qse_annual_lines(
            self.fixture("qse_annual_2024.txt"), 2024, self.municipalities
        )
        records_2024 = deepcopy(records_2024)
        del records_2024["4300034"]
        contract = build_contract(
            self.municipalities["4300034"],
            {2024: records_2024, 2020: records_2020},
            {2020: "a" * 64, 2024: "b" * 64},
        )
        self.assertEqual(contract["indicatorId"], "qse.distributed_amount")
        self.assertEqual([point["year"] for point in contract["series"]], [2020])
        self.assertEqual(contract["series"][0]["distributedPerEnrollment"], None)

    def test_reconciliation_2024_reports_exact_difference(self) -> None:
        records, _ = parse_qse_annual_lines(
            self.fixture("qse_annual_2024.txt"), 2024, self.municipalities
        )
        with tempfile.TemporaryDirectory() as directory:
            root = Path(directory)
            for code, record in records.items():
                target = root / "municipios" / code
                target.mkdir(parents=True)
                value = float(record["distributedAmount"])
                (target / "financeiro.json").write_text(json.dumps({
                    "amounts": {"qseDistributedClosedYear": {"value": value}}
                }), encoding="utf-8")
            result = reconcile_2024(records, root)
            self.assertEqual(result["comparedMunicipalities"], 3)
            self.assertEqual(result["divergenceCount"], 0)
            self.assertEqual(result["maximumAbsoluteDifference"], 0.0)

            monthly_records = {
                code: {**record, "distributedAmount": record["distributedAmount"]}
                for code, record in records.items()
            }
            continuity = reconcile_monthly_continuity_2024(monthly_records, records, root)
            self.assertEqual(continuity["comparedMunicipalities"], 3)
            self.assertEqual(continuity["divergenceCount"], 0)


if __name__ == "__main__":
    unittest.main()
