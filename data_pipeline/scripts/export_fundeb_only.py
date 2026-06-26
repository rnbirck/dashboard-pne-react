"""Exporta apenas FUNDEB, reaproveitando dados já exportados."""
import json
import math
import sys
from collections.abc import Mapping, Sequence
from datetime import datetime, timezone
from pathlib import Path

BASE_DIR = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(BASE_DIR))

from src.data_loader import load_fundeb_data, load_municipios
from src.views import fundeb_export

EXPORT_DIR = BASE_DIR / "export" / "data"

print("Carregando municipios e dados FUNDEB...")
municipios = load_municipios()
fundeb_df = load_fundeb_data()
print(f"Municipios: {len(municipios)}, fundeb shape: {fundeb_df.shape}")

exported = 0
errors = []
municipio_payloads = {}

for index, municipio in enumerate(municipios, start=1):
    try:
        data = fundeb_export.extract_fundeb_for_municipio(municipio, fundeb_df)
        municipio_payloads[municipio] = {"fundeb": data} if data is not None else {"fundeb": None}
        if data is not None:
            exported += 1
    except Exception as exc:
        errors.append({"municipio": municipio, "error": str(exc)})
        municipio_payloads[municipio] = {"fundeb": None}
    if index % 100 == 0:
        print(f"  [{index}/{len(municipios)}] {exported} com dados, {len(errors)} erros")

print(f"  Final: [{len(municipios)}/{len(municipios)}] {exported} com dados, {len(errors)} erros")

def json_safe(value):
    if value is None:
        return None
    if isinstance(value, (str, bool, int)):
        return value
    if isinstance(value, float):
        return value if math.isfinite(value) else None
    if isinstance(value, (datetime,)):
        return value.isoformat()
    if hasattr(value, "item") and not isinstance(value, (str, bytes, bytearray)):
        try:
            return json_safe(value.item())
        except (TypeError, ValueError):
            pass
    if isinstance(value, Mapping):
        return {str(k): json_safe(v) for k, v in value.items() if not callable(v)}
    if isinstance(value, Sequence) and not isinstance(value, (str, bytes, bytearray)):
        return [json_safe(v) for v in value]
    if callable(value):
        return None
    return str(value)

payload = {
    "generated_at": datetime.now(timezone.utc).astimezone().isoformat(timespec="seconds"),
    "total_municipios": len(municipios),
    "municipios_exportados": exported,
    "municipios": json_safe(municipio_payloads),
}

out_path = EXPORT_DIR / "fundeb_por_municipio.json"
with open(str(out_path), "w", encoding="utf-8") as f:
    json.dump(payload, f, ensure_ascii=False, indent=2)

print(f"\nExportado: {out_path.relative_to(BASE_DIR)}")
print(f"Municipios: {len(municipios)}, com fundeb: {exported}, erros: {len(errors)}")
if errors:
    print("Erros:")
    for e in errors[:10]:
        print(f"  {e['municipio']}: {e['error']}")
