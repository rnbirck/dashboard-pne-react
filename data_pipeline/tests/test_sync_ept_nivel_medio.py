import sys
import unittest
from pathlib import Path


DATA_PIPELINE_DIR = Path(__file__).resolve().parents[1]
if str(DATA_PIPELINE_DIR) not in sys.path:
    sys.path.insert(0, str(DATA_PIPELINE_DIR))

from scripts.sync_ept_nivel_medio_from_sinopse import (  # noqa: E402
    LAYOUTS,
    _ibge_code,
    _record_from_row,
    _validate_layout_headers,
)


def header_rows(layout_key):
    layout = LAYOUTS[layout_key]
    width = 75 if layout_key == "1.42" else 35
    rows = [[None] * width for _ in range(3)]
    rows[0][3] = "Código IBGE do município"
    rows[1][3] = "IBGE"
    for mode, start in layout["mode_starts"].items():
        if mode == "itinerario_tecnico_exclusivo":
            continue
        position = start - 1
        rows[0][position] = f"Curso Técnico {mode.title()} Total"
        if layout_key == "1.30":
            for offset, dependency in enumerate(("Federal", "Estadual", "Municipal", "Privada"), 1):
                rows[1][position + offset] = dependency
        else:
            rows[1][position + 1] = "Pública"
            for offset, dependency in enumerate(("Federal", "Estadual", "Municipal", "Privada"), 2):
                rows[1][position + offset] = dependency
    return [tuple(row) for row in rows]


def data_row(layout_key):
    layout = LAYOUTS[layout_key]
    row = [0] * 75
    row[1] = "Rio Grande do Sul"
    row[2] = "Município teste"
    row[3] = 4300001
    for mode, start in layout["mode_starts"].items():
        position = start - 1
        if layout_key == "1.30":
            row[position : position + 5] = [10, 1, 2, 3, 4]
        else:
            row[position : position + 6] = [10, 6, 1, 2, 3, 4]
    if layout["technical_total_column"]:
        row[layout["technical_total_column"] - 1] = 50
    return tuple(row)


class SyncEptContractTests(unittest.TestCase):
    def test_normalized_headers_are_required_for_both_layouts(self):
        for layout_key in ("1.30", "1.42"):
            _validate_layout_headers(header_rows(layout_key), layout_key)

        invalid = header_rows("1.30")
        invalid[0] = tuple(
            "" if value and "Concomitante" in str(value) else value
            for value in invalid[0]
        )
        with self.assertRaises(ValueError):
            _validate_layout_headers(invalid, "1.30")

    def test_semantic_fields_are_extracted_without_using_ept_total(self):
        for layout_key in ("1.30", "1.42"):
            record = _record_from_row(data_row(layout_key), 14, layout_key, 2025)
            self.assertEqual(record["id_municipio"], "4300001")
            self.assertEqual(record["mat_integrado_total"], 10)
            self.assertEqual(record["mat_concomitante_total"], 10)
            self.assertEqual(record["mat_integrado_federal"], 1)
            self.assertEqual(record["mat_concomitante_privada"], 4)

    def test_invalid_ibge_code_is_rejected(self):
        with self.assertRaises(ValueError):
            _ibge_code(123, field="codigo_ibge", row_number=14)


if __name__ == "__main__":
    unittest.main()
