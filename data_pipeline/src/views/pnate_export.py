from __future__ import annotations

import math
from typing import Any

import pandas as pd


PNATE_FIELDS = [
    "alunos_infantil_municipal",
    "alunos_infantil_estadual",
    "total_alunos_infantil",
    "alunos_fundamental_municipal",
    "alunos_fundamental_estadual",
    "total_alunos_fundamental",
    "alunos_medio_municipal",
    "alunos_medio_estadual",
    "total_alunos_medio",
    "total_alunos_rede_municipal",
    "total_alunos_rede_estadual",
    "total_alunos",
    "resultado_per_capita",
    "repasse_total",
    "repasse_total_ano_anterior",
    "saldo_ano_anterior",
    "saldo_desconsiderado",
    "desconto",
    "repasse_autorizado_apos_desconto",
    "repasse_nao_autorizado_apos_desconto",
    "previsao_repasse_ajustado",
    "valor_parcela_municipal",
    "valor_parcela_estadual",
    "valor_infantil_municipal",
    "valor_infantil_estadual",
    "valor_fundamental_municipal",
    "valor_fundamental_estadual",
    "valor_medio_municipal",
    "valor_medio_estadual",
    "valor_total_municipal",
    "valor_total_estadual",
    "repasse_autorizado",
]


def _json_safe(value: Any) -> Any:
    if value is None:
        return None
    if isinstance(value, float) and (math.isnan(value) or math.isinf(value)):
        return None
    if isinstance(value, (int, float, bool, str)):
        return value
    try:
        if pd.isna(value):
            return None
    except (TypeError, ValueError):
        pass
    if hasattr(value, "item"):
        try:
            return _json_safe(value.item())
        except (TypeError, ValueError):
            pass
    return value


def _build_pnate_entry(row: pd.Series) -> dict[str, Any]:
    entry = {
        "ano": _json_safe(row.get("ano")),
        "id_municipio": _json_safe(row.get("id_municipio")),
        "municipio": _json_safe(row.get("municipio")),
        "uf": _json_safe(row.get("uf")),
        "regiao": _json_safe(row.get("regiao")),
        "cnpj_identificador": _json_safe(row.get("cnpj_identificador")),
        "razao_social": _json_safe(row.get("razao_social")),
        "fonte": _json_safe(row.get("fonte")),
    }
    for field in PNATE_FIELDS:
        entry[field] = _json_safe(row.get(field))
    return entry


def extract_pnate_for_municipio(
    municipio_name: str,
    pnate_df: pd.DataFrame,
) -> dict[str, Any] | None:
    mun_df = pnate_df[pnate_df["municipio"] == municipio_name].sort_values("ano")
    if mun_df.empty:
        return None

    historico = [_build_pnate_entry(row) for _, row in mun_df.iterrows()]
    anos_disponiveis = [h["ano"] for h in historico if h["ano"] is not None]
    ultimo_ano = max(anos_disponiveis) if anos_disponiveis else None
    ultimo = next((h for h in historico if h["ano"] == ultimo_ano), None)

    resumo = {"ano": ultimo_ano}
    if ultimo:
        resumo.update(
            {
                "id_municipio": ultimo["id_municipio"],
                "municipio": ultimo["municipio"],
                "total_alunos": ultimo["total_alunos"],
                "total_alunos_rede_municipal": ultimo["total_alunos_rede_municipal"],
                "total_alunos_rede_estadual": ultimo["total_alunos_rede_estadual"],
                "resultado_per_capita": ultimo["resultado_per_capita"],
                "repasse_total": ultimo["repasse_total"],
                "repasse_autorizado_apos_desconto": ultimo[
                    "repasse_autorizado_apos_desconto"
                ],
                "valor_total_municipal": ultimo["valor_total_municipal"],
                "valor_total_estadual": ultimo["valor_total_estadual"],
                "repasse_autorizado": ultimo["repasse_autorizado"],
            }
        )

    return {
        "ultimo_ano": ultimo_ano,
        "anos_disponiveis": anos_disponiveis,
        "historico": historico,
        "resumo_ultimo_ano": resumo,
        "fonte": "PNATE / FNDE",
        "avisos": [
            "Os arquivos do PNATE podem alternar entre previsao/plano de atendimento e atendimento anual conforme o exercicio.",
            "Valores nulos indicam campo ausente no leiaute daquele ano, nao zero.",
        ],
    }
