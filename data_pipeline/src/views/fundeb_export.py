from __future__ import annotations

import math
from typing import Any

import pandas as pd


FUNDEB_FIELDS = [
    "receitas",
    "despesa_remuneracao_profissionais",
    "despesa_remuneracao_profissionais_ensino_fundamental",
    "despesa_remuneracao_profissionais_ensino_infantil",
    "despesa_remuneracao_profissionais_creche",
    "despesa_remuneracao_profissionais_pre_escola",
    "despesa_total_fundeb",
    "percentual_minimo_remuneracao_profissionais",
    "disponibilidade_financeira_ano_anterior",
    "ingresso_recursos_ate_bimestre",
    "pagamentos_efetuados_ate_bimestre",
    "disponibilidade_financeira_ate_bimestre",
    "saldo_financeiro_conciliado",
]


def _json_safe(value: Any) -> Any:
    if value is None:
        return None
    if isinstance(value, float) and (math.isnan(value) or math.isinf(value)):
        return None
    if isinstance(value, (int, float)):
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


def _build_fundeb_entry(row: pd.Series) -> dict[str, Any]:
    entry = {
        "ano": _json_safe(row.get("ano")),
        "id_municipio": _json_safe(row.get("id_municipio")),
        "municipio": _json_safe(row.get("municipio")),
        "estrutura_versao": _json_safe(row.get("estrutura_versao")),
        "limite_remuneracao_referencia": _json_safe(row.get("limite_remuneracao_referencia")),
    }
    for field in FUNDEB_FIELDS:
        entry[field] = _json_safe(row.get(field))
    return entry


def extract_fundeb_for_municipio(
    municipio_name: str,
    fundeb_df: pd.DataFrame,
) -> dict[str, Any] | None:
    mun_df = fundeb_df[fundeb_df["municipio"] == municipio_name].sort_values("ano")
    if mun_df.empty:
        return None

    historico = [_build_fundeb_entry(row) for _, row in mun_df.iterrows()]
    anos_disponiveis = [h["ano"] for h in historico if h["ano"] is not None]
    ultimo_ano = max(anos_disponiveis) if anos_disponiveis else None

    ultimo = next(
        (h for h in historico if h["ano"] == ultimo_ano),
        None,
    )

    resumo = {
        "ano": ultimo_ano,
    }
    if ultimo:
        resumo["id_municipio"] = ultimo["id_municipio"]
        resumo["municipio"] = ultimo["municipio"]
        resumo["receitas"] = ultimo["receitas"]
        resumo["despesa_total_fundeb"] = ultimo["despesa_total_fundeb"]
        resumo["percentual_minimo_remuneracao_profissionais"] = ultimo[
            "percentual_minimo_remuneracao_profissionais"
        ]
        resumo["limite_remuneracao_referencia"] = ultimo["limite_remuneracao_referencia"]

    return {
        "ultimo_ano": ultimo_ano,
        "anos_disponiveis": anos_disponiveis,
        "historico": historico,
        "resumo_ultimo_ano": resumo,
    }
