from __future__ import annotations

import json
import sys
import tempfile
import unittest
from pathlib import Path


PROJECT_DIR = Path(__file__).resolve().parents[2]
sys.path.insert(0, str(PROJECT_DIR / "data_pipeline"))

from scripts.materialize_municipal_education_overview import (  # noqa: E402
    _write_contracts,
    replace_directory_transactionally,
)
from src.municipal_education_overview import (  # noqa: E402
    materialize_municipal_education_overview,
)


GENERATED_AT = "2026-07-22T12:00:00-03:00"
ENTRY = {
    "idMunicipality": "4320008",
    "name": "Sapucaia do Sul",
    "slug": "sapucaia-do-sul",
}
COMPLETE_EVIDENCE = {
    "referenceYear": 2025,
    "expectedMunicipalities": 497,
    "municipalitiesPresent": 497,
    "annualLoadPresent": True,
    "validDependencyDomain": True,
    "validSchoolLocationDomain": True,
    "duplicateGrainCount": 0,
    "negativeValueCount": 0,
    "isCompleteForDerivedZero": True,
}


def row(dependency: str = "municipal", location: str = "urbana", **overrides):
    result = {
        "ano": 2025,
        "id_municipio": "4320008",
        "dependencia": dependency,
        "localizacao": location,
        "mat_basico": 100,
        "mat_infantil": 30,
        "mat_infantil_creche": 12,
        "mat_infantil_pre": 18,
        "mat_fundamental": 50,
        "mat_fundamental_anos_iniciais": 25,
        "mat_fundamental_anos_finais": 25,
    }
    result.update(overrides)
    return result


SUPPLEMENTAL = {
    "mat_medio": 10,
    "mat_eja": 5,
    "mat_eja_fundamental": 2,
    "mat_eja_medio": 3,
    "mat_medio_tecnico_integrado": 2,
    "mat_profissional_tecnico_concomitante": 2,
    "mat_profissional_tecnico_subsequente": 2,
    "mat_profissional_tecnico_iftp_exclusivo": 1,
    "mat_profissional_iftp_qualificacao": 0,
    "mat_profissional_fic_concomitante": 0,
    "mat_educacao_especial": 10,
    "mat_educacao_especial_classes_comuns": 7,
    "mat_educacao_especial_classes_exclusivas": 3,
}


class MaterializeMunicipalEducationOverviewTests(unittest.TestCase):
    def materialize(self, rows=None):
        return materialize_municipal_education_overview(
            rows or [row()], ENTRY, GENERATED_AT, completeness=COMPLETE_EVIDENCE,
            supplemental=SUPPLEMENTAL,
        )

    def test_writes_canonical_slug_and_identical_ibge_alias(self):
        with tempfile.TemporaryDirectory() as temporary:
            directory = Path(temporary) / "visao-geral-municipal"
            _write_contracts(directory, {"4320008": self.materialize()}, [ENTRY])
            canonical = directory / "sapucaia-do-sul.json"
            alias = directory / "4320008.json"

            self.assertTrue(canonical.is_file())
            self.assertEqual(canonical.read_bytes(), alias.read_bytes())
            payload = json.loads(canonical.read_text(encoding="utf-8"))
            self.assertEqual(payload["schemaVersion"], "municipal-education-overview-v1")
            self.assertEqual(payload["reference"]["year"], 2025)
            self.assertNotIn("historical", payload)

    def test_serialization_preserves_derived_zero_and_unavailable_null(self):
        published = self.materialize()
        federal = published["earlyChildhood"]["total"]["byNetwork"]["federal"]["enrollments"]
        self.assertEqual(federal["state"], "derived_zero")
        self.assertEqual(federal["value"], 0)

        unavailable = self.materialize([row(mat_basico=None)])
        basic_total = unavailable["basicEducation"]["total"]
        self.assertEqual(basic_total["state"], "unavailable")
        self.assertIsNone(basic_total["value"])

    def test_zero_denominator_is_not_applicable(self):
        contract = self.materialize(
            [
                row(
                    mat_basico=0,
                    mat_infantil=0,
                    mat_infantil_creche=0,
                    mat_infantil_pre=0,
                    mat_fundamental=0,
                    mat_fundamental_anos_iniciais=0,
                    mat_fundamental_anos_finais=0,
                )
            ]
        )
        share = contract["earlyChildhood"]["total"]["shareOfBasicEducation"]
        self.assertEqual(share["state"], "not_applicable")
        self.assertIsNone(share["value"])

    def test_transactional_replace_only_promotes_complete_directory(self):
        with tempfile.TemporaryDirectory() as temporary:
            root = Path(temporary)
            output = root / "final"
            output.mkdir()
            (output / "old.json").write_text("old", encoding="utf-8")
            staged = root / "staged"
            staged.mkdir()
            (staged / "new.json").write_text("new", encoding="utf-8")

            replace_directory_transactionally(staged, output)

            self.assertFalse((output / "old.json").exists())
            self.assertEqual((output / "new.json").read_text(encoding="utf-8"), "new")


if __name__ == "__main__":
    unittest.main()
