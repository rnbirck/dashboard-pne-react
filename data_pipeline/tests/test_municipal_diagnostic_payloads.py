import json
import unittest
from pathlib import Path


REPO_ROOT = Path(__file__).resolve().parents[2]
PUBLIC_DATA = REPO_ROOT / "public" / "data"


class MunicipalDiagnosticPayloadTest(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.index = json.loads(
            (PUBLIC_DATA / "municipios_index.json").read_text(encoding="utf-8")
        )

    def load_payload(self, entry):
        relative_path = entry["path"].removeprefix("/data/")
        return json.loads((PUBLIC_DATA / relative_path).read_text(encoding="utf-8"))

    def load_contract(self, entry):
        relative_path = entry["path"].removeprefix("/data/")
        diagnostic_path = (PUBLIC_DATA / relative_path).with_name("diagnostico.json")
        return json.loads(diagnostic_path.read_text(encoding="utf-8"))

    def test_all_497_partitioned_contracts_satisfy_contract_invariants(self):
        entries = self.index["municipios"]
        self.assertEqual(self.index["total_municipios"], 497)
        self.assertEqual(len(entries), 497)
        found_outside_domain = False
        found_allowed_above_100 = False
        pilot_statuses = set()

        for entry in entries:
            payload = self.load_payload(entry)
            pne_data = payload["pne_2026_2036"]
            self.assertNotIn("diagnostico_v2", pne_data)
            self.assertNotIn("diagnostico", pne_data)
            self.assertNotIn("inequalityPilot", payload)
            self.assertNotIn("inequalityPilot", pne_data)
            self.assertEqual(pne_data["diagnostico_ref"]["status"], "available")
            contract = self.load_contract(entry)
            self.assertEqual(contract["schemaVersion"], "municipal-diagnostic-v2")
            self.assertEqual(
                contract["methodologyVersion"], "municipal-diagnostic-p3c-v1"
            )
            self.assertEqual(contract["municipalityId"], str(entry["id_municipio"]))
            indicators = contract["indicators"]
            ids = [item["indicatorId"] for item in indicators]
            self.assertEqual(len(indicators), 49, entry["nome"])
            self.assertEqual(len(set(ids)), 49, entry["nome"])
            by_id = {item["indicatorId"]: item for item in indicators}
            excluded_by_id = {
                item["indicatorId"]: item for item in contract["excludedItems"]
            }
            self.assertIsInstance(contract["excludedItems"], list)
            state_summary = contract["stateBenchmarkSummary"]
            self.assertEqual(
                state_summary["analyzedCount"], contract["summary"]["validLegalComparisons"]
            )
            self.assertEqual(
                state_summary["analyzedCount"],
                state_summary["betterCount"]
                + state_summary["worseCount"]
                + state_summary["equivalentCount"]
                + state_summary["unavailableCount"],
            )
            self.assertLessEqual(
                len(state_summary["largestUnfavorableIndicatorIds"]), 3
            )
            self.assertLessEqual(
                len(state_summary["largestFavorableIndicatorIds"]), 2
            )
            decision_summary = contract["decisionSummary"]
            self.assertEqual(
                decision_summary["selectionMethodologyVersion"],
                "municipal-decision-summary-p3c-v2",
            )
            self.assertLessEqual(len(decision_summary["municipalActionItems"]), 3)
            self.assertLessEqual(len(decision_summary["coordinationItems"]), 2)
            decision_ids = [
                reference["indicatorId"]
                for collection_name in (
                    "municipalActionItems",
                    "coordinationItems",
                    "investigationItems",
                    "monitoringItems",
                    "preservationItems",
                )
                for reference in decision_summary[collection_name]
            ]
            self.assertEqual(len(decision_ids), len(set(decision_ids)), entry["nome"])
            self.assertTrue(
                all(
                    "selectionPosition" not in reference
                    for reference in decision_summary["investigationItems"]
                )
            )
            self.assertEqual(
                decision_summary["municipalActionCount"]
                + decision_summary["coordinationCount"]
                + decision_summary["investigationCount"]
                + decision_summary["monitoringCount"]
                + decision_summary["preservationCount"],
                contract["summary"]["indicatorCount"],
            )

            pilot = contract["inequalityPilot"]
            pilot_statuses.add(pilot["status"])
            self.assertEqual(pilot["methodologyVersion"], "municipal-inequality-p4b-v1")
            self.assertEqual(pilot["indicatorId"], "basico_integral")
            self.assertEqual(pilot["dimension"], "urban_rural")
            self.assertEqual(pilot["universeCode"], "public_basic_education_enrollments")
            self.assertEqual(
                pilot["formulaCode"],
                "integral_enrollments_over_eligible_enrollments",
            )
            self.assertEqual(pilot["minimumCellSize"], 10)
            self.assertEqual(
                [group["groupCode"] for group in pilot["groups"]],
                ["urban", "rural"],
            )
            for group in pilot["groups"]:
                self.assertEqual(group["publicationStatus"], group["status"])
                self.assertEqual(group["year"], pilot["year"])
                if group["status"] == "suppressed_small_cell":
                    self.assertIsNone(group["numerator"])
                    self.assertIsNone(group["denominator"])
                    self.assertIsNone(group["percentage"])
                if group["status"] == "missing":
                    self.assertIsNone(group["numerator"])
                    self.assertIsNone(group["denominator"])
                    self.assertIsNone(group["percentage"])
            if all(group["status"] == "available" for group in pilot["groups"]):
                urban, rural = pilot["groups"]
                self.assertAlmostEqual(
                    pilot["observedDifferencePercentagePoints"],
                    urban["percentage"] - rural["percentage"],
                    places=6,
                )
            else:
                self.assertIsNone(pilot["observedDifferencePercentagePoints"])
            self.assertFalse(
                contract["generationMetadata"]["inequalityPilotAffectsDecisionSummary"]
            )

            for indicator_id in {
                "creche",
                "pre_escola",
                "basico_6_17",
                "basico_15_17",
            }:
                self.assertEqual(
                    by_id[indicator_id]["rawValue"],
                    pne_data["indicadores"][indicator_id]["end_value"],
                    f"{entry['nome']}/{indicator_id}/rawValue",
                )

            for indicator in indicators:
                null_reasons = indicator["nullReasons"]
                for field, value in indicator.items():
                    if value is None:
                        self.assertIn(field, null_reasons, f"{entry['nome']}/{indicator['indicatorId']}/{field}")
                for field, value in indicator["configuredReference"].items():
                    if value is None:
                        self.assertIn(
                            f"configuredReference.{field}",
                            null_reasons,
                            f"{entry['nome']}/{indicator['indicatorId']}/configuredReference.{field}",
                        )
                self.assertIsNone(indicator["priorityScore"])
                for field in (
                    "trajectory",
                    "governance",
                    "municipalExposure",
                    "similarMunicipalities",
                    "evidence",
                    "decisionReading",
                ):
                    self.assertIsInstance(indicator[field], dict)
                self.assertLessEqual(
                    len(indicator["decisionReading"]["reasonCodes"]), 3
                )
                self.assertLessEqual(len(indicator["evidence"]["reasonCodes"]), 3)
                self.assertIn(
                    indicator["evidenceLevel"],
                    {"high", "medium", "low", "insufficient"},
                )
                self.assertFalse(
                    indicator["decisionReading"]["financialEligibilityVerified"]
                )
                for benchmark_name in ("state", "municipalDistribution"):
                    benchmark = indicator["benchmarks"][benchmark_name]
                    has_null = any(
                        value is None
                        for key, value in benchmark.items()
                        if key not in {"reason", "directionReason"}
                    )
                    if has_null:
                        self.assertTrue(
                            benchmark.get("reason") or benchmark.get("directionReason"),
                            f"{entry['nome']}/{indicator['indicatorId']}/{benchmark_name}",
                        )
                state_benchmark = indicator["benchmarks"]["state"]
                if state_benchmark["status"] == "comparable":
                    self.assertIsNotNone(state_benchmark["value"])
                    self.assertIsNotNone(state_benchmark["year"])
                    self.assertIsNotNone(state_benchmark["municipalityValue"])
                    self.assertEqual(
                        state_benchmark["municipalityYear"],
                        state_benchmark["year"],
                    )
                if indicator["targetComparisonStatus"] == "methodologically_incompatible":
                    self.assertIsNone(indicator["goalAttained"])
                if indicator["valueDomainStatus"].startswith("outside_domain"):
                    found_outside_domain = True
                if (
                    indicator["indicatorId"]
                    in {"creche", "pre_escola", "basico_6_17", "basico_15_17"}
                    and indicator["rawValue"] is not None
                    and indicator["rawValue"] > 100
                ):
                    found_allowed_above_100 = True
                    self.assertEqual(indicator["dataStatus"], "available")
                    self.assertEqual(indicator["displayValue"], indicator["rawValue"])
                    self.assertEqual(indicator["valueDomainStatus"], "within_domain")
                    flag_codes = {flag["code"] for flag in indicator["flags"]}
                    self.assertIn("KNOWN_MIXED_TERRITORIAL_BASIS", flag_codes)
                    self.assertIn("VALUE_ABOVE_100_ALLOWED_BY_METHOD", flag_codes)
                    exclusion_codes = {
                        reason["code"]
                        for reason in excluded_by_id.get(
                            indicator["indicatorId"], {}
                        ).get("exclusionReasons", [])
                    }
                    self.assertNotIn("school_location_vs_residence", exclusion_codes)

            expected_attention = []
            for reference in contract["attentionItems"]:
                indicator = by_id[reference["indicatorId"]]
                self.assertEqual(indicator["targetComparisonStatus"], "eligible")
                self.assertNotIn(indicator["legalCorrespondence"], {"proxy", "informational"})
                self.assertEqual(indicator["valueDomainStatus"], "within_domain")
                self.assertFalse(indicator["goalAttained"])
                expected_attention.append(reference["indicatorId"])
            self.assertEqual(
                expected_attention,
                [reference["indicatorId"] for reference in contract["attentionItems"]],
            )

        self.assertTrue(found_outside_domain)
        self.assertTrue(found_allowed_above_100)
        self.assertIn("available", pilot_statuses)
        self.assertIn("suppressed_small_cell", pilot_statuses)

    def test_required_municipal_fixtures(self):
        entries = {entry["nome"]: entry for entry in self.index["municipios"]}
        for municipality in (
            "Aceguá",
            "Agudo",
            "Nova Santa Rita",
            "André da Rocha",
            "Porto Alegre",
        ):
            contract = self.load_contract(entries[municipality])
            self.assertEqual(len(contract["indicators"]), 49)

        acegua_payload = self.load_payload(entries["Aceguá"])
        acegua = self.load_contract(entries["Aceguá"])
        acegua_by_id = {
            item["indicatorId"]: item for item in acegua["indicators"]
        }
        pre_school = acegua_by_id["pre_escola"]
        self.assertAlmostEqual(pre_school["rawValue"], 122.222, places=3)
        self.assertEqual(pre_school["displayValue"], pre_school["rawValue"])
        self.assertEqual(pre_school["dataStatus"], "available")
        self.assertEqual(pre_school["valueDomainStatus"], "within_domain")
        self.assertEqual(pre_school["targetComparisonStatus"], "eligible")
        self.assertTrue(pre_school["goalAttained"])
        self.assertAlmostEqual(pre_school["favorableDistance"], 22.222, places=3)
        self.assertEqual(pre_school["benchmarks"]["state"]["status"], "comparable")
        self.assertGreater(pre_school["benchmarks"]["state"]["value"], 0)
        self.assertNotIn(
            "pre_escola",
            {item["indicatorId"] for item in acegua["excludedItems"]},
        )
        ranking_rows = acegua_payload["pne_2026_2036"]["rankings"]["atendimento"][
            "top_avancos"
        ]
        ranking_pre_school = next(
            item for item in ranking_rows if item["indicator_key"] == "pre_escola"
        )
        self.assertEqual(ranking_pre_school["end_value"], pre_school["rawValue"])
        self.assertEqual(ranking_pre_school["display"]["end_value"], "122,2%")

        nova = self.load_contract(entries["Nova Santa Rita"])
        by_id = {item["indicatorId"]: item for item in nova["indicators"]}
        attention_ids = {item["indicatorId"] for item in nova["attentionItems"]}
        for indicator_id in (
            "basico_15_17",
            "aee",
            "medio_tecnico_articulado_percentual",
        ):
            self.assertIsNone(by_id[indicator_id]["goalAttained"])
            self.assertIsNone(by_id[indicator_id]["favorableDistance"])
            self.assertNotIn(indicator_id, attention_ids)
        self.assertEqual(by_id["temporarios"]["direction"], "at_most")
        self.assertAlmostEqual(by_id["creche"]["rawValue"], 35.1, places=1)
        self.assertAlmostEqual(
            by_id["creche"]["benchmarks"]["state"]["value"], 42.7, places=1
        )
        self.assertAlmostEqual(
            by_id["creche"]["benchmarks"]["state"]["favorableDifference"],
            -7.6,
            places=1,
        )
        self.assertAlmostEqual(by_id["pos_graduacao"]["rawValue"], 49.4, places=1)
        self.assertAlmostEqual(
            by_id["pos_graduacao"]["benchmarks"]["state"]["value"],
            56.8,
            places=1,
        )
        self.assertAlmostEqual(by_id["temporarios"]["rawValue"], 13.2, places=1)
        self.assertAlmostEqual(
            by_id["temporarios"]["benchmarks"]["state"]["value"],
            35.8,
            places=1,
        )
        self.assertGreater(
            by_id["temporarios"]["benchmarks"]["state"]["favorableDifference"],
            0,
        )
        self.assertEqual(
            by_id["basico_15_17"]["benchmarks"]["state"]["status"],
            "comparable",
        )
        self.assertEqual(
            by_id["aee"]["benchmarks"]["state"]["status"],
            "methodology_pending",
        )
        self.assertTrue(any(item["rawValue"] is None for item in nova["indicators"]))
        self.assertTrue(all(item["priorityScore"] is None for item in nova["indicators"]))

        agudo = self.load_contract(entries["Agudo"])
        agudo_summary = agudo["stateBenchmarkSummary"]
        self.assertGreater(agudo_summary["eligibleAnalyzedCount"], 0)
        self.assertEqual(
            agudo_summary["eligibleAnalyzedCount"],
            agudo_summary["betterCount"]
            + agudo_summary["worseCount"]
            + agudo_summary["equivalentCount"],
        )
        self.assertTrue(agudo_summary["largestUnfavorableIndicatorIds"])
        self.assertTrue(agudo_summary["largestFavorableIndicatorIds"])
        self.assertEqual(
            agudo_summary["analyzedCount"],
            agudo_summary["betterCount"]
            + agudo_summary["worseCount"]
            + agudo_summary["equivalentCount"]
            + agudo_summary["unavailableCount"],
        )
        scenario_inventory = agudo["trajectoryScenarioInventory"]
        self.assertEqual(len(scenario_inventory["attendance"]), 7)
        self.assertEqual(len(scenario_inventory["maintenance"]), 4)
        agudo_by_id = {item["indicatorId"]: item for item in agudo["indicators"]}
        self.assertEqual(
            agudo_by_id["escolas_integral"]["municipalExposure"]["status"],
            "available",
        )
        self.assertEqual(
            agudo_by_id["creche"]["similarMunicipalities"]["cohortSize"], 20
        )

        pilot_contracts = {
            entry["nome"]: self.load_contract(entry)["inequalityPilot"]
            for entry in self.index["municipios"]
        }
        for municipality in (
            "Agudo",
            "Nova Santa Rita",
            "Porto Alegre",
            "André da Rocha",
        ):
            self.assertEqual(pilot_contracts[municipality]["indicatorId"], "basico_integral")

        predominantly_rural = [
            name
            for name, pilot in pilot_contracts.items()
            if all(group["status"] == "available" for group in pilot["groups"])
            and pilot["groups"][1]["denominator"] > pilot["groups"][0]["denominator"]
        ]
        no_published_rural_offer = [
            name
            for name, pilot in pilot_contracts.items()
            if pilot["groups"][1]["status"] == "missing"
        ]
        suppressed_rural = [
            name
            for name, pilot in pilot_contracts.items()
            if pilot["groups"][1]["status"] == "suppressed_small_cell"
        ]
        self.assertTrue(predominantly_rural)
        self.assertTrue(no_published_rural_offer)
        self.assertTrue(suppressed_rural)

    def test_index_and_diagnostic_use_only_the_canonical_code_path(self):
        for entry in self.index["municipios"]:
            code_index = PUBLIC_DATA / entry["path"].removeprefix("/data/")
            self.assertEqual(code_index.parent.name, entry["id_municipio"])
            self.assertTrue(code_index.is_file())
            self.assertTrue(code_index.with_name("diagnostico.json").is_file())
            self.assertFalse((PUBLIC_DATA / "municipios" / entry["slug"]).exists())

    def test_aee_and_postgraduate_above_100_keep_their_own_domain_rules(self):
        aee_case = None
        postgraduate_case = None
        creche_case = None
        for entry in self.index["municipios"]:
            contract = self.load_contract(entry)
            by_id = {item["indicatorId"]: item for item in contract["indicators"]}
            if by_id["aee"]["rawValue"] is not None and by_id["aee"]["rawValue"] > 100:
                aee_case = by_id["aee"]
            if (
                by_id["pos_graduacao"]["rawValue"] is not None
                and by_id["pos_graduacao"]["rawValue"] > 100
            ):
                postgraduate_case = by_id["pos_graduacao"]
            if (
                by_id["creche"]["rawValue"] is not None
                and by_id["creche"]["rawValue"] > 100
            ):
                creche_case = by_id["creche"]
            if aee_case and postgraduate_case and creche_case:
                break

        self.assertIsNotNone(aee_case)
        self.assertIsNotNone(creche_case)
        self.assertNotEqual(aee_case["valueDomainStatus"], "within_domain")
        self.assertNotEqual(aee_case["targetComparisonStatus"], "eligible")
        if postgraduate_case is not None:
            self.assertEqual(postgraduate_case["dataStatus"], "unverifiable")
            self.assertEqual(
                postgraduate_case["valueDomainStatus"], "outside_domain_unverifiable"
            )
        self.assertEqual(creche_case["dataStatus"], "available")
        self.assertEqual(creche_case["displayValue"], creche_case["rawValue"])
        self.assertEqual(creche_case["valueDomainStatus"], "within_domain")


if __name__ == "__main__":
    unittest.main()
