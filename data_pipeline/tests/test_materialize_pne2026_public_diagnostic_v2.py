import importlib.util
import json
import sys
import tempfile
import unittest
from pathlib import Path
from unittest import mock


REPO_ROOT = Path(__file__).resolve().parents[2]
PIPELINE_DIR = REPO_ROOT / "data_pipeline"
SCRIPT_PATH = (
    PIPELINE_DIR / "scripts" / "materialize_pne2026_public_diagnostic_v2.py"
)
if str(PIPELINE_DIR) not in sys.path:
    sys.path.insert(0, str(PIPELINE_DIR))

spec = importlib.util.spec_from_file_location("materialize_diagnostic_v2", SCRIPT_PATH)
materializer = importlib.util.module_from_spec(spec)
assert spec.loader is not None
spec.loader.exec_module(materializer)


class MaterializePne2026PublicDiagnosticV2UnitTest(unittest.TestCase):
    def test_duplicate_json_property_is_rejected(self):
        with self.assertRaisesRegex(RuntimeError, "duplicada"):
            materializer._loads(b'{"a": 1, "a": 2}', Path("duplicate.json"))

    def test_v2_is_inserted_before_v1_and_other_properties_are_preserved(self):
        v1 = {"version": "pne2026-public-diagnostic-v1", "goals": []}
        original = {"schemaVersion": "municipal-diagnostic-v2", "other": 1, "pne2026PublicDiagnostic": v1}
        v2 = {"version": "pne2026-public-diagnostic-v2"}
        output = materializer._insert_parallel_v2(original, v2)
        self.assertEqual(
            list(output),
            [
                "schemaVersion",
                "other",
                "pne2026PublicDiagnosticV2",
                "pne2026PublicDiagnostic",
            ],
        )
        self.assertEqual(output["other"], 1)
        self.assertIs(output["pne2026PublicDiagnostic"], v1)

    def test_transaction_rolls_back_all_replaced_files_on_failure(self):
        with tempfile.TemporaryDirectory() as temporary:
            root = Path(temporary)
            first = root / "first.json"
            second = root / "second.json"
            first.write_text('{"value": 1}\n', encoding="utf-8")
            second.write_text('{"value": 2}\n', encoding="utf-8")
            original_first = first.read_bytes()
            original_second = second.read_bytes()
            real_replace = materializer.os.replace
            calls = 0

            def fail_second(source, target):
                nonlocal calls
                calls += 1
                if calls == 2:
                    raise OSError("falha simulada")
                return real_replace(source, target)

            with mock.patch.object(materializer, "PUBLIC_DATA_DIR", root), mock.patch.object(
                materializer.os, "replace", side_effect=fail_second
            ):
                with self.assertRaisesRegex(OSError, "falha simulada"):
                    materializer._transactional_write(
                        {
                            first: b'{"value": 10}\n',
                            second: b'{"value": 20}\n',
                        }
                    )
            self.assertEqual(first.read_bytes(), original_first)
            self.assertEqual(second.read_bytes(), original_second)


class MaterializePne2026PublicDiagnosticV2PayloadTest(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.audit = materializer.audit_materialized()

    def test_all_canonical_contracts_are_deterministic(self):
        self.assertEqual(self.audit["canonicalCount"], 497)
        self.assertEqual(self.audit["physicalFileCount"], 497)
        self.assertEqual(self.audit["changedPaths"], [])
        self.assertEqual(self.audit["existingV2ContractCount"], 497)

    def test_v1_is_preserved_and_v2_has_full_pne_parity(self):
        self.assertEqual(self.audit["v1Before"], self.audit["v1After"])
        self.assertEqual(self.audit["v1After"]["resultCount"], 9119)
        self.assertEqual(
            self.audit["v1After"]["classificationCounts"],
            {"advance": 7759, "maintain": 1360, "unclassified": 0},
        )
        v2 = self.audit["v2Audit"]
        self.assertEqual(v2["v2AvailableOccurrences"], 15896)
        self.assertEqual(v2["pneAbsentOccurrences"], 1002)
        self.assertEqual(v2["duplicateResultCount"], 0)
        self.assertEqual(v2["outOfCatalogResultCount"], 0)
        self.assertTrue(v2["publicationReady"])


if __name__ == "__main__":
    unittest.main()
