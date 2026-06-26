"""Exporta apenas indicator_details, reaproveitando dados já exportados."""
import json
import sys
from datetime import datetime, timezone
from pathlib import Path

BASE_DIR = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(BASE_DIR))

from src.data_loader import load_municipios
from src.views import pne_shared

EXPORT_DIR = BASE_DIR / "export" / "data"

print("Carregando municipios do banco...")
municipios = load_municipios()
print(f"Total: {len(municipios)}")

print("Processando indicator_details...")
exported = 0
errors = []
municipio_payloads = {}

# Prime the cache with a municipio that has clean ASCII name
print("  Aquecendo cache com Porto Alegre...")
prime = pne_shared._build_indicator_details("Porto Alegre")
print(f"  Cache aquecido: {len(prime)} indicadores")

for index, municipio in enumerate(municipios, start=1):
    try:
        details = pne_shared._build_indicator_details(municipio)
        if details:
            municipio_payloads[municipio] = {"indicator_details": details}
            exported += 1
        else:
            municipio_payloads[municipio] = {"indicator_details": {}}
    except Exception as exc:
        errors.append({"municipio": municipio, "error": str(exc)})
        municipio_payloads[municipio] = {"indicator_details": {}, "error": str(exc)}
    if index % 100 == 0:
        print(f"  [{index}/{len(municipios)}] {exported} com dados, {len(errors)} erros")

print(f"  Final: [{len(municipios)}/{len(municipios)}] {exported} com dados, {len(errors)} erros")

def json_safe(value):
    import math
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
    if isinstance(value, dict):
        return {str(k): json_safe(v) for k, v in value.items() if not callable(v)}
    if isinstance(value, (list, tuple)) and not isinstance(value, (str, bytes, bytearray)):
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

EXPORT_DIR.mkdir(parents=True, exist_ok=True)
out_path = EXPORT_DIR / "indicator_details_por_municipio.json"
with open(str(out_path), "w", encoding="utf-8") as f:
    json.dump(payload, f, ensure_ascii=False, indent=2)

print(f"\nExportado: {out_path.relative_to(BASE_DIR)}")
print(f"Municipios: {len(municipios)}, com dados: {exported}, erros: {len(errors)}")
if errors:
    print("Erros:")
    for e in errors:
        print(f"  {e['municipio']}: {e['error']}")
