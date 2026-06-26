"""Exporta apenas as projeções, reaproveitando dados já exportados."""
import json
import sys
from pathlib import Path

BASE_DIR = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(BASE_DIR))

from src.views.pne_2026_projections import build_all_projections
from src.data_loader import load_municipios

EXPORT_DIR = BASE_DIR / "export" / "data"
PROJ_OUT = EXPORT_DIR / "pne_2026_2036" / "projecoes_por_municipio.json"

print("Carregando municipios do banco...")
municipios = load_municipios()
print(f"Total: {len(municipios)}")

print("Processando projecoes tendenciais...")
projections = build_all_projections(municipios)

payload = {
    "generated_at": __import__("datetime").datetime.now(
        __import__("datetime").timezone.utc
    ).astimezone().isoformat(timespec="seconds"),
    "cycle": "pne_2026_2036",
    "total_municipios": len(municipios),
    "municipios_exportados": sum(
        1 for p in projections.values()
        if any(v.get("available") for v in p.values())
    ),
    "municipios": projections,
}

PROJ_OUT.parent.mkdir(parents=True, exist_ok=True)
with open(str(PROJ_OUT), "w", encoding="utf-8") as f:
    json.dump(payload, f, ensure_ascii=False, indent=2)

print(f"Exportado: {PROJ_OUT.relative_to(BASE_DIR)}")
print(f"Municipios: {len(municipios)}")
