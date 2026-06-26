"""Auditoria das projeções do PNE 2026-2036."""
import csv
import json
from pathlib import Path

BASE = Path(__file__).resolve().parents[1]
EXPORT_DIR = BASE / "export" / "data"
OUTPUT_DIR = BASE / "export"

INDICATORS = ["creche", "pre_escola", "basico_6_17", "basico_15_17"]
PLAUSIBLE_CAPS = {"creche": 85.0, "pre_escola": 100.0, "basico_6_17": 100.0, "basico_15_17": 100.0}


def load_json(path):
    with open(str(path), "r", encoding="utf-8") as f:
        return json.load(f)


def write_csv(filename, rows, fieldnames):
    path = OUTPUT_DIR / filename
    with open(str(path), "w", encoding="utf-8", newline="") as f:
        w = csv.DictWriter(f, fieldnames=fieldnames, delimiter=",")
        w.writeheader()
        w.writerows(rows)
    print(f"  CSV exportado: {path.relative_to(BASE)}")


def run_audit():
    proj_file = EXPORT_DIR / "pne_2026_2036" / "projecoes_por_municipio.json"
    if not proj_file.exists():
        print(f"ERRO: {proj_file} nao encontrado. Execute export_static_data.py primeiro.")
        return

    proj_data = load_json(proj_file)
    municipios = list(proj_data["municipios"].keys())
    total_mun = len(municipios)
    print(f"Auditando {total_mun} municipios...")

    summary = {
        "total_municipios": total_mun,
        "gerado_em": proj_data.get("generated_at", ""),
        "indicadores": {},
    }

    for indicator in INDICATORS:
        plausible_cap = PLAUSIBLE_CAPS[indicator]

        available = []
        unavailable = []
        proj_2036_values = []
        proj_2036_raw_values = []
        current_values = []
        status_counts = {"tende_a_atingir": 0, "risco_de_nao_atingir": 0}
        quality_counts = {}
        cap_hit = 0
        raw_above_display = 0
        raw_above_85 = 0

        for mun in municipios:
            ind = proj_data["municipios"][mun].get(indicator, {})
            if not ind.get("available"):
                unavailable.append(mun)
                continue

            available.append(mun)
            p2036 = ind.get("projected_2036")
            p2036_raw = ind.get("projected_2036_raw")
            status = ind.get("status_2036")
            quality = ind.get("quality", "N/A")
            hp = ind.get("historical_percent", [])
            current_val = hp[-1] if hp else None
            pp = ind.get("projected_percent", [])
            pp_raw = ind.get("projected_percent_raw", [])

            if p2036 is not None:
                proj_2036_values.append(p2036)
                if p2036 >= plausible_cap:
                    cap_hit += 1
            if p2036_raw is not None:
                proj_2036_raw_values.append(p2036_raw)
                if p2036_raw > plausible_cap:
                    raw_above_85 += 1
            if current_val is not None:
                current_values.append(current_val)

            if pp and pp_raw:
                for i in range(len(pp)):
                    if pp_raw[i] > pp[i]:
                        raw_above_display += 1
                        break

            if status:
                status_counts[status] = status_counts.get(status, 0) + 1
            quality_counts[quality] = quality_counts.get(quality, 0) + 1

        n = len(available)
        avg_curr = sum(current_values) / len(current_values) if current_values else 0
        med_curr = sorted(current_values)[len(current_values)//2] if current_values else 0
        min_curr = min(current_values) if current_values else 0
        max_curr = max(current_values) if current_values else 0

        avg_2036 = sum(proj_2036_values) / len(proj_2036_values) if proj_2036_values else 0
        med_2036 = sorted(proj_2036_values)[len(proj_2036_values)//2] if proj_2036_values else 0
        min_2036 = min(proj_2036_values) if proj_2036_values else 0
        max_2036 = max(proj_2036_values) if proj_2036_values else 0

        # Build detail CSV rows
        csv_rows = []
        for mun in municipios:
            ind = proj_data["municipios"][mun].get(indicator, {})
            row = {
                "municipio": mun,
                "available": ind.get("available", False),
                "current_value": (
                    ind.get("historical_percent", [])[-1]
                    if ind.get("historical_percent") else None
                ),
                "projected_2036": ind.get("projected_2036"),
                "projected_2036_raw": ind.get("projected_2036_raw"),
                "status_2036": ind.get("status_2036"),
                "quality": ind.get("quality"),
                "distance_to_target": ind.get("distance_to_target_2036"),
                "bateu_plausible_cap": (
                    ind.get("projected_2036") is not None
                    and ind.get("projected_2036") >= plausible_cap
                ),
                "raw_acima_display": (
                    ind.get("projected_2036_raw") is not None
                    and ind.get("projected_2036") is not None
                    and ind.get("projected_2036_raw") > ind.get("projected_2036")
                ),
            }
            csv_rows.append(row)

        proj_csv = f"auditoria_projecoes_pne_2026_2036_{indicator}.csv"
        proj_fields = list(csv_rows[0].keys()) if csv_rows else []
        write_csv(proj_csv, csv_rows, proj_fields)
        write_csv(
            f"auditoria_elegibilidade_projecoes_pne_2026_2036_{indicator}.csv",
            [{"municipio": m, "possui_projecao": m in available} for m in municipios],
            ["municipio", "possui_projecao"],
        )

        print(f"  Disponivel: {n}  Indisponivel: {len(unavailable)}")
        print(f"  Valor atual: media={avg_curr:.1f} mediana={med_curr:.1f} min={min_curr:.1f} max={max_curr:.1f}")
        print(f"  Projetado 2036: media={avg_2036:.1f} mediana={med_2036:.1f} min={min_2036:.1f} max={max_2036:.1f}")
        print(f"  Status: {json.dumps(status_counts)}")
        print(f"  Quality: {json.dumps(quality_counts)}")
        print(f"  Bateu no plausible_cap ({plausible_cap}%): {cap_hit}")
        print(f"  raw > displayed: {raw_above_display}")

        over_85_list = []
        for mun in municipios:
            ind = proj_data["municipios"][mun].get(indicator, {})
            if ind.get("available") and (ind.get("projected_2036_raw") or 0) > plausible_cap:
                over_85_list.append((mun, ind.get("projected_2036"), ind.get("projected_2036_raw")))

        ind_summary = {
            "disponivel": n,
            "indisponivel": len(unavailable),
            "valor_atual": {
                "media": round(avg_curr, 2),
                "mediana": round(med_curr, 2),
                "minimo": round(min_curr, 2),
                "maximo": round(max_curr, 2),
            },
            "projetado_2036": {
                "media": round(avg_2036, 2),
                "mediana": round(med_2036, 2),
                "minimo": round(min_2036, 2),
                "maximo": round(max_2036, 2),
            },
            "status": status_counts,
            "quality": quality_counts,
            "bateu_plausible_cap": cap_hit,
            "raw_acima_display": raw_above_display,
            "raw_acima_plausible_cap": len(over_85_list),
        }

        if indicator == "creche":
            ind_summary["projected_2036_sempre_abaixo_85"] = max_2036 <= 85
            ind_summary["municipios_com_raw_acima_85"] = [
                {"municipio": m, "projected": p, "raw": pr}
                for m, p, pr in over_85_list
            ]

        summary["indicadores"][indicator] = ind_summary

    # basico_15_17 viability check
    print("\n\n=== Expansao: basico_15_17 ===")
    print("Consultando dados do carregador...")
    try:
        import sys
        sys.path.insert(0, str(BASE))
        from src.data_loader import load_basico_15_17_data
        df = load_basico_15_17_data()
        print(f"  Dados carregados: shape={df.shape}")
        print(f"  Colunas: {list(df.columns)}")
        required = {"ano", "municipio", "mat_basico_15_17", "pop_15_17"}
        if required.issubset(set(df.columns)):
            print("  Colunas necessarias: OK")
            print(f"  Anos disponiveis: {sorted(df['ano'].unique())}")
            print(f"  Municipios com dados: {df['municipio'].nunique()}")
            print("  VIABLE: Sim, parece pronto para expansao")
        else:
            missing = required - set(df.columns)
            print(f"  Colunas faltando: {missing}")
            print("  VIABLE: Nao (colunas ausentes)")
    except Exception as e:
        print(f"  ERRO ao carregar: {e}")
        print("  VIABLE: Nao foi possivel verificar")

    # Save summary JSON
    sum_path = OUTPUT_DIR / "auditoria_projecoes_pne_2026_2036_resumo.json"
    with open(str(sum_path), "w", encoding="utf-8") as f:
        json.dump(summary, f, ensure_ascii=False, indent=2)
    print(f"\nResumo exportado: {sum_path.relative_to(BASE)}")

    print("\nAuditoria concluida.")


if __name__ == "__main__":
    run_audit()
