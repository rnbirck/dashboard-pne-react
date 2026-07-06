from __future__ import annotations

import json
import math
import re
from collections.abc import Mapping, Sequence
from datetime import date, datetime, timezone
from pathlib import Path
from typing import Any
from unicodedata import normalize

import pandas as pd


BASE_DIR = Path(__file__).resolve().parents[1]
DATA_DIR = BASE_DIR / "export" / "data"
STATIC_DIR = BASE_DIR / "export" / "static"

ANUAL_P6_PATH = DATA_DIR / "siope_indicadores_financeiros_educacionais_anual_p6.parquet"
CATALOGO_PATH = DATA_DIR / "siope_indicadores_catalogo.csv"
AUDITORIA_PATH = DATA_DIR / "siope_indicadores_auditoria.csv"

TOTAL_MUNICIPIOS_ESPERADOS = 497
ANOS_COMPLETOS_REFERENCIA = {2021, 2022, 2023, 2024}

OUT_LONG = STATIC_DIR / "siope_indicadores_dashboard_long.json"
OUT_WIDE = STATIC_DIR / "siope_indicadores_dashboard_wide.json"
OUT_CATALOGO = STATIC_DIR / "siope_indicadores_dashboard_catalogo.json"
OUT_COBERTURA = STATIC_DIR / "siope_indicadores_dashboard_cobertura.json"


INDICADORES_CURADOS = [
    {
        "codigo_indicador": "1.1",
        "slug": "aplicacao_mde_percentual",
        "nome_dashboard": "Aplicação em MDE",
        "grupo_dashboard": "Aplicação mínima em educação",
        "descricao_curta": "Percentual aplicado em manutenção e desenvolvimento do ensino.",
        "interpretacao": "Mostra se o município alcançou o mínimo constitucional de 25% em educação.",
        "direcao_referencia": "cumprimento_minimo",
        "observacao": "Referência legal: mínimo de 25%.",
        "usar_no_resumo": True,
        "usar_no_grafico_historico": True,
        "usar_na_tabela": True,
    },
    {
        "codigo_indicador": "1.2",
        "slug": "fundeb_remuneracao_profissionais_percentual",
        "nome_dashboard": "FUNDEB em remuneração",
        "grupo_dashboard": "FUNDEB",
        "descricao_curta": "Percentual do FUNDEB aplicado na remuneração dos profissionais da educação.",
        "interpretacao": "Indica cumprimento do mínimo de aplicação do FUNDEB em remuneração.",
        "direcao_referencia": "cumprimento_minimo",
        "observacao": "Referência legal: mínimo de 70%.",
        "usar_no_resumo": True,
        "usar_no_grafico_historico": True,
        "usar_na_tabela": True,
    },
    {
        "codigo_indicador": "1.4",
        "slug": "fundeb_nao_aplicado_percentual",
        "nome_dashboard": "FUNDEB não aplicado",
        "grupo_dashboard": "FUNDEB",
        "descricao_curta": "Percentual das receitas do FUNDEB não aplicadas no exercício.",
        "interpretacao": "Ajuda a identificar saldo de recursos do FUNDEB não executado no ano.",
        "direcao_referencia": "menor_melhor",
        "observacao": "Referência legal indicada pela fonte: máximo de 10%.",
        "usar_no_resumo": True,
        "usar_no_grafico_historico": True,
        "usar_na_tabela": True,
    },
    {
        "codigo_indicador": "8.2",
        "slug": "valor_aplicado_mde_reais",
        "nome_dashboard": "Valor aplicado em MDE",
        "grupo_dashboard": "Aplicação mínima em educação",
        "descricao_curta": "Valor aplicado em MDE com receita de impostos.",
        "interpretacao": "Mostra o volume financeiro aplicado em educação; deve ser interpretado junto ao porte do município.",
        "direcao_referencia": "informativo",
        "observacao": "Valor nominal em reais, sem correção inflacionária.",
        "usar_no_resumo": False,
        "usar_no_grafico_historico": True,
        "usar_na_tabela": True,
    },
    {
        "codigo_indicador": "2.1",
        "slug": "fundeb_educacao_infantil_percentual",
        "nome_dashboard": "FUNDEB na educação infantil",
        "grupo_dashboard": "FUNDEB",
        "descricao_curta": "Percentual dos recursos do FUNDEB aplicados na educação infantil.",
        "interpretacao": "Ajuda a entender a priorização da educação infantil dentro do uso do FUNDEB.",
        "direcao_referencia": "informativo",
        "observacao": "Não classificar maior ou menor como melhor sem contexto de oferta e matrícula.",
        "usar_no_resumo": False,
        "usar_no_grafico_historico": True,
        "usar_na_tabela": True,
    },
    {
        "codigo_indicador": "2.2",
        "slug": "fundeb_ensino_fundamental_percentual",
        "nome_dashboard": "FUNDEB no ensino fundamental",
        "grupo_dashboard": "FUNDEB",
        "descricao_curta": "Percentual dos recursos do FUNDEB aplicados no ensino fundamental.",
        "interpretacao": "Ajuda a entender a distribuição do FUNDEB entre etapas de ensino.",
        "direcao_referencia": "informativo",
        "observacao": "Não classificar maior ou menor como melhor sem contexto de oferta e matrícula.",
        "usar_no_resumo": False,
        "usar_no_grafico_historico": True,
        "usar_na_tabela": True,
    },
    {
        "codigo_indicador": "2.8",
        "slug": "despesas_educacao_total_percentual",
        "nome_dashboard": "Educação nas despesas totais",
        "grupo_dashboard": "Aplicação mínima em educação",
        "descricao_curta": "Percentual das despesas em educação em relação às despesas de todas as áreas.",
        "interpretacao": "Mostra o peso da educação no conjunto das despesas municipais.",
        "direcao_referencia": "informativo",
        "observacao": "Indicador de composição orçamentária; não indica qualidade do gasto por si só.",
        "usar_no_resumo": False,
        "usar_no_grafico_historico": True,
        "usar_na_tabela": True,
    },
    {
        "codigo_indicador": "4.8",
        "slug": "investimento_aluno_basica_reais",
        "nome_dashboard": "Investimento por aluno da educação básica",
        "grupo_dashboard": "Gasto por aluno",
        "descricao_curta": "Investimento educacional por aluno da educação básica.",
        "interpretacao": "Permite acompanhar o gasto por aluno ao longo do tempo e comparar municípios com cautela.",
        "direcao_referencia": "informativo",
        "observacao": "Valor nominal em reais, sem correção inflacionária.",
        "usar_no_resumo": True,
        "usar_no_grafico_historico": True,
        "usar_na_tabela": True,
    },
    {
        "codigo_indicador": "4.1",
        "slug": "investimento_aluno_infantil_reais",
        "nome_dashboard": "Investimento por aluno da educação infantil",
        "grupo_dashboard": "Gasto por aluno",
        "descricao_curta": "Investimento educacional por aluno da educação infantil.",
        "interpretacao": "Apoia leitura do esforço financeiro na educação infantil.",
        "direcao_referencia": "informativo",
        "observacao": "Valor nominal em reais, sem correção inflacionária.",
        "usar_no_resumo": False,
        "usar_no_grafico_historico": True,
        "usar_na_tabela": True,
    },
    {
        "codigo_indicador": "4.2",
        "slug": "investimento_aluno_fundamental_reais",
        "nome_dashboard": "Investimento por aluno do ensino fundamental",
        "grupo_dashboard": "Gasto por aluno",
        "descricao_curta": "Investimento educacional por aluno do ensino fundamental.",
        "interpretacao": "Apoia leitura do esforço financeiro no ensino fundamental.",
        "direcao_referencia": "informativo",
        "observacao": "Valor nominal em reais, sem correção inflacionária.",
        "usar_no_resumo": False,
        "usar_no_grafico_historico": True,
        "usar_na_tabela": True,
    },
    {
        "codigo_indicador": "4.10",
        "slug": "despesa_professores_aluno_basica_reais",
        "nome_dashboard": "Despesa com professores por aluno",
        "grupo_dashboard": "Despesas com pessoal",
        "descricao_curta": "Despesa com professores por aluno da educação básica.",
        "interpretacao": "Mostra o gasto por aluno associado à remuneração de professores.",
        "direcao_referencia": "informativo",
        "observacao": "Valor nominal em reais; não deve ser usado isoladamente para julgar eficiência.",
        "usar_no_resumo": False,
        "usar_no_grafico_historico": True,
        "usar_na_tabela": True,
    },
    {
        "codigo_indicador": "6.2",
        "slug": "receitas_impostos_total_percentual",
        "nome_dashboard": "Impostos na receita total",
        "grupo_dashboard": "Receitas da educação",
        "descricao_curta": "Percentual das receitas de impostos em relação à receita total.",
        "interpretacao": "Ajuda a entender a composição das receitas consideradas no financiamento educacional.",
        "direcao_referencia": "informativo",
        "observacao": "Cobertura menor em alguns anos; usar com aviso de disponibilidade.",
        "usar_no_resumo": False,
        "usar_no_grafico_historico": True,
        "usar_na_tabela": True,
    },
    {
        "codigo_indicador": "7.1",
        "slug": "resultado_financeiro_exercicio_reais",
        "nome_dashboard": "Resultado financeiro do exercício",
        "grupo_dashboard": "Resultado financeiro",
        "descricao_curta": "Superávit ou déficit do ente federado no exercício.",
        "interpretacao": "Indica o resultado financeiro anual informado no SIOPE.",
        "direcao_referencia": "informativo",
        "observacao": "Valor nominal em reais; superávit ou déficit precisa ser lido junto ao contexto fiscal.",
        "usar_no_resumo": False,
        "usar_no_grafico_historico": True,
        "usar_na_tabela": True,
    },
    {
        "codigo_indicador": "7.2",
        "slug": "saldo_financeiro_fundeb_reais",
        "nome_dashboard": "Saldo financeiro do FUNDEB",
        "grupo_dashboard": "Resultado financeiro",
        "descricao_curta": "Saldo financeiro do FUNDEB no exercício atual.",
        "interpretacao": "Mostra o saldo financeiro associado ao FUNDEB no ano.",
        "direcao_referencia": "informativo",
        "observacao": "Valor nominal em reais; deve ser interpretado com dados de execução e calendário financeiro.",
        "usar_no_resumo": False,
        "usar_no_grafico_historico": True,
        "usar_na_tabela": True,
    },
]


def _now_iso() -> str:
    return datetime.now(timezone.utc).astimezone().isoformat(timespec="seconds")


def _is_nullish(value: Any) -> bool:
    if value is None:
        return True
    if isinstance(value, float):
        return math.isnan(value) or math.isinf(value)
    try:
        result = pd.isna(value)
    except (TypeError, ValueError):
        return False
    return isinstance(result, bool) and result


def _json_safe(value: Any) -> Any:
    if _is_nullish(value):
        return None
    if isinstance(value, (str, bool, int)):
        return value
    if isinstance(value, float):
        return value if math.isfinite(value) else None
    if isinstance(value, (datetime, date)):
        return value.isoformat()
    if hasattr(value, "item") and not isinstance(value, (str, bytes, bytearray)):
        try:
            return _json_safe(value.item())
        except (TypeError, ValueError):
            pass
    if isinstance(value, Mapping):
        return {str(k): _json_safe(v) for k, v in value.items()}
    if isinstance(value, Sequence) and not isinstance(value, (str, bytes, bytearray)):
        return [_json_safe(item) for item in value]
    return str(value)


def _write_json(path: Path, payload: Any) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(
        json.dumps(_json_safe(payload), ensure_ascii=False, indent=2),
        encoding="utf-8",
    )


def _slugify(value: str) -> str:
    normalized = normalize("NFKD", value).encode("ascii", "ignore").decode("ascii")
    normalized = re.sub(r"[^a-zA-Z0-9]+", "_", normalized.lower()).strip("_")
    return re.sub(r"_+", "_", normalized)


def _load_inputs() -> tuple[pd.DataFrame, pd.DataFrame, pd.DataFrame]:
    missing = [
        str(path)
        for path in [ANUAL_P6_PATH, CATALOGO_PATH, AUDITORIA_PATH]
        if not path.exists()
    ]
    if missing:
        raise FileNotFoundError(
            "Arquivos de entrada ausentes. Rode a coleta SIOPE validada antes.\n"
            + "\n".join(missing)
        )

    anual = pd.read_parquet(ANUAL_P6_PATH)
    catalogo = pd.read_csv(CATALOGO_PATH, dtype={"codigo_indicador": str})
    auditoria = pd.read_csv(
        AUDITORIA_PATH,
        dtype={"id_municipio": str, "codigo_indicador": str},
    )
    anual["codigo_indicador"] = anual["codigo_indicador"].astype(str)
    anual["id_municipio"] = anual["id_municipio"].astype(str)
    auditoria["id_municipio"] = auditoria["id_municipio"].astype(str)
    return anual, catalogo, auditoria


def _validar_curadoria(catalogo: pd.DataFrame) -> None:
    codigos_catalogo = set(catalogo["codigo_indicador"].astype(str))
    codigos_curados = [item["codigo_indicador"] for item in INDICADORES_CURADOS]
    ausentes = sorted(set(codigos_curados) - codigos_catalogo)
    duplicados = sorted(
        codigo for codigo in set(codigos_curados) if codigos_curados.count(codigo) > 1
    )
    slugs = [item["slug"] for item in INDICADORES_CURADOS]
    slugs_duplicados = sorted(slug for slug in set(slugs) if slugs.count(slug) > 1)

    if ausentes:
        raise ValueError(
            "Indicadores curados ausentes do catalogo real: " + ", ".join(ausentes)
        )
    if duplicados:
        raise ValueError("Indicadores curados duplicados: " + ", ".join(duplicados))
    if slugs_duplicados:
        raise ValueError("Slugs curados duplicados: " + ", ".join(slugs_duplicados))


def montar_catalogo_curado(catalogo: pd.DataFrame) -> list[dict[str, Any]]:
    _validar_curadoria(catalogo)
    catalogo_por_codigo = {
        str(row.codigo_indicador): row
        for row in catalogo.itertuples(index=False)
    }

    curados = []
    for item in INDICADORES_CURADOS:
        codigo = item["codigo_indicador"]
        origem = catalogo_por_codigo[codigo]
        curados.append(
            {
                "slug": item["slug"],
                "codigo_indicador": codigo,
                "nome_original": origem.nome_indicador,
                "nome_dashboard": item["nome_dashboard"],
                "grupo_dashboard": item["grupo_dashboard"],
                "unidade": origem.unidade_detectada,
                "descricao_curta": item["descricao_curta"],
                "interpretacao": item["interpretacao"],
                "direcao_referencia": item["direcao_referencia"],
                "observacao": item["observacao"],
                "usar_no_resumo": bool(item["usar_no_resumo"]),
                "usar_no_grafico_historico": bool(item["usar_no_grafico_historico"]),
                "usar_na_tabela": bool(item["usar_na_tabela"]),
                "primeira_ocorrencia_ano": int(origem.primeira_ocorrencia_ano),
                "ultima_ocorrencia_ano": int(origem.ultima_ocorrencia_ano),
                "qtd_ocorrencias_catalogo": int(origem.qtd_ocorrencias),
                "qtd_municipios_catalogo": int(origem.qtd_municipios),
            }
        )
    return curados


def montar_cobertura(
    anual: pd.DataFrame,
    auditoria: pd.DataFrame,
    catalogo_curado: list[dict[str, Any]],
) -> dict[str, Any]:
    cobertura_por_ano = []
    for ano in sorted(anual["ano"].dropna().astype(int).unique()):
        recorte = anual[anual["ano"].astype(int).eq(ano)]
        qtd_presentes = int(recorte["id_municipio"].nunique())
        percentual = round(qtd_presentes / TOTAL_MUNICIPIOS_ESPERADOS * 100, 2)
        ano_completo = ano in ANOS_COMPLETOS_REFERENCIA and qtd_presentes == TOTAL_MUNICIPIOS_ESPERADOS
        cobertura_incompleta = qtd_presentes < TOTAL_MUNICIPIOS_ESPERADOS
        observacao = (
            "Cobertura completa no periodo 6."
            if not cobertura_incompleta
            else (
                f"Cobertura incompleta no periodo 6: {qtd_presentes} de "
                f"{TOTAL_MUNICIPIOS_ESPERADOS} municipios."
            )
        )
        cobertura_por_ano.append(
            {
                "ano": int(ano),
                "periodo": 6,
                "qtd_municipios_presentes": qtd_presentes,
                "qtd_municipios_esperados": TOTAL_MUNICIPIOS_ESPERADOS,
                "percentual_cobertura": percentual,
                "ano_completo_para_comparacao": bool(ano_completo),
                "cobertura_incompleta": bool(cobertura_incompleta),
                "observacao": observacao,
            }
        )

    auditoria_p6_2025 = auditoria[
        (auditoria["ano"].astype(int) == 2025)
        & (auditoria["periodo"].astype(int) == 6)
    ].copy()
    municipios_ausentes_2025 = (
        auditoria_p6_2025[auditoria_p6_2025["status"].eq("municipio_ausente")]
        [["id_municipio", "municipio", "status"]]
        .sort_values("municipio")
        .to_dict(orient="records")
    )

    codigos_curados = [item["codigo_indicador"] for item in catalogo_curado]
    cobertura_indicadores = []
    for ano in sorted(anual["ano"].dropna().astype(int).unique()):
        cobertura_ano = next(item for item in cobertura_por_ano if item["ano"] == ano)
        esperado_ano = cobertura_ano["qtd_municipios_presentes"]
        for item in catalogo_curado:
            codigo = item["codigo_indicador"]
            recorte = anual[
                (anual["ano"].astype(int).eq(ano))
                & (anual["codigo_indicador"].astype(str).eq(codigo))
            ]
            presentes = int(recorte["id_municipio"].nunique())
            incompleto = presentes < esperado_ano
            cobertura_indicadores.append(
                {
                    "ano": int(ano),
                    "periodo": 6,
                    "codigo_indicador": codigo,
                    "slug": item["slug"],
                    "qtd_municipios_presentes": presentes,
                    "qtd_municipios_esperados_no_ano": int(esperado_ano),
                    "percentual_cobertura_no_ano": round(
                        presentes / esperado_ano * 100,
                        2,
                    )
                    if esperado_ano
                    else 0,
                    "cobertura_incompleta": bool(incompleto),
                }
            )

    indicadores_com_cobertura_incompleta = [
        item
        for item in cobertura_indicadores
        if item["cobertura_incompleta"]
    ]

    return {
        "generated_at": _now_iso(),
        "fonte": "SIOPE/FNDE - Indicadores Financeiros e Educacionais via OData",
        "periodo_utilizado": 6,
        "qtd_municipios_esperados": TOTAL_MUNICIPIOS_ESPERADOS,
        "cobertura_por_ano": cobertura_por_ano,
        "municipios_ausentes_2025_p6": municipios_ausentes_2025,
        "indicadores_selecionados_com_cobertura_incompleta": indicadores_com_cobertura_incompleta,
        "observacao_interface": (
            "Os indicadores usam o periodo 6 como visao anual. "
            "O ano de 2025 deve ser exibido com aviso de cobertura incompleta, "
            "pois nem todos os municipios possuem dados no SIOPE para o periodo 6."
        ),
        "codigos_indicadores_selecionados": codigos_curados,
    }


def montar_base_long_dashboard(
    anual: pd.DataFrame,
    catalogo_curado: list[dict[str, Any]],
    cobertura: dict[str, Any],
) -> list[dict[str, Any]]:
    catalogo_por_codigo = {
        item["codigo_indicador"]: item
        for item in catalogo_curado
    }
    cobertura_por_ano = {
        item["ano"]: item
        for item in cobertura["cobertura_por_ano"]
    }

    selecionados = anual[
        anual["codigo_indicador"].astype(str).isin(catalogo_por_codigo.keys())
    ].copy()
    selecionados = selecionados.sort_values(
        ["municipio", "id_municipio", "ano", "codigo_indicador"]
    )

    linhas = []
    for row in selecionados.itertuples(index=False):
        codigo = str(row.codigo_indicador)
        meta = catalogo_por_codigo[codigo]
        cobertura_ano = cobertura_por_ano[int(row.ano)]
        linhas.append(
            {
                "id_municipio": str(row.id_municipio),
                "municipio": row.municipio,
                "ano": int(row.ano),
                "periodo": int(row.periodo),
                "codigo_indicador": codigo,
                "slug": meta["slug"],
                "nome_dashboard": meta["nome_dashboard"],
                "grupo_dashboard": meta["grupo_dashboard"],
                "unidade": meta["unidade"],
                "valor": row.valor,
                "valor_original": row.valor_original,
                "cobertura_incompleta": bool(cobertura_ano["cobertura_incompleta"]),
                "observacao_cobertura": cobertura_ano["observacao"],
            }
        )
    return linhas


def montar_base_wide_dashboard(
    long_rows: list[dict[str, Any]],
    catalogo_curado: list[dict[str, Any]],
    cobertura: dict[str, Any],
) -> dict[str, Any]:
    catalogo_por_slug = {item["slug"]: item for item in catalogo_curado}
    cobertura_por_ano = {
        str(item["ano"]): item
        for item in cobertura["cobertura_por_ano"]
    }
    municipios: dict[str, Any] = {}

    for row in long_rows:
        id_municipio = row["id_municipio"]
        ano = str(row["ano"])
        slug = row["slug"]
        meta = catalogo_por_slug[slug]

        municipio_payload = municipios.setdefault(
            id_municipio,
            {
                "id_municipio": id_municipio,
                "municipio": row["municipio"],
                "anos": {},
            },
        )
        ano_payload = municipio_payload["anos"].setdefault(
            ano,
            {
                "ano": int(ano),
                "periodo": row["periodo"],
                "cobertura_incompleta": row["cobertura_incompleta"],
                "observacao_cobertura": row["observacao_cobertura"],
                "indicadores": {},
            },
        )
        ano_payload["indicadores"][slug] = {
            "valor": row["valor"],
            "valor_original": row["valor_original"],
            "unidade": row["unidade"],
            "codigo_indicador": row["codigo_indicador"],
            "nome_dashboard": row["nome_dashboard"],
            "grupo_dashboard": row["grupo_dashboard"],
            "direcao_referencia": meta["direcao_referencia"],
        }

    return {
        "generated_at": _now_iso(),
        "fonte": "SIOPE/FNDE - Indicadores Financeiros e Educacionais via OData",
        "periodo_utilizado": 6,
        "total_municipios": len(municipios),
        "indicadores": [item["slug"] for item in catalogo_curado],
        "cobertura_por_ano": list(cobertura_por_ano.values()),
        "municipios": municipios,
    }


def preparar_siope_indicadores_dashboard() -> dict[str, Any]:
    anual, catalogo, auditoria = _load_inputs()
    catalogo_curado = montar_catalogo_curado(catalogo)
    cobertura = montar_cobertura(anual, auditoria, catalogo_curado)
    long_rows = montar_base_long_dashboard(anual, catalogo_curado, cobertura)
    wide = montar_base_wide_dashboard(long_rows, catalogo_curado, cobertura)

    payload_long = {
        "generated_at": _now_iso(),
        "fonte": "SIOPE/FNDE - Indicadores Financeiros e Educacionais via OData",
        "periodo_utilizado": 6,
        "total_linhas": len(long_rows),
        "total_indicadores": len(catalogo_curado),
        "dados": long_rows,
    }
    payload_catalogo = {
        "generated_at": _now_iso(),
        "fonte_catalogo": str(CATALOGO_PATH),
        "total_indicadores_catalogo_bruto": int(len(catalogo)),
        "total_indicadores_selecionados": int(len(catalogo_curado)),
        "indicadores": catalogo_curado,
    }

    _write_json(OUT_LONG, payload_long)
    _write_json(OUT_WIDE, wide)
    _write_json(OUT_CATALOGO, payload_catalogo)
    _write_json(OUT_COBERTURA, cobertura)

    return {
        "anual": anual,
        "catalogo": catalogo,
        "auditoria": auditoria,
        "catalogo_curado": catalogo_curado,
        "cobertura": cobertura,
        "long_rows": long_rows,
        "wide": wide,
        "paths": {
            "long": OUT_LONG,
            "wide": OUT_WIDE,
            "catalogo": OUT_CATALOGO,
            "cobertura": OUT_COBERTURA,
        },
    }


def _print_validacao(resultado: dict[str, Any]) -> None:
    catalogo = resultado["catalogo"]
    catalogo_curado = resultado["catalogo_curado"]
    cobertura = resultado["cobertura"]
    long_rows = resultado["long_rows"]

    print(f"Indicadores no catalogo bruto: {len(catalogo)}")
    print(f"Indicadores selecionados para o dashboard: {len(catalogo_curado)}")
    print("\nIndicadores selecionados:")
    for item in catalogo_curado:
        print(
            f"  {item['codigo_indicador']} | {item['slug']} | "
            f"{item['grupo_dashboard']} | {item['nome_dashboard']}"
        )

    print("\nMunicipios por ano no arquivo final:")
    long_df = pd.DataFrame(long_rows)
    if long_df.empty:
        print("  sem linhas")
    else:
        for ano, qtd in (
            long_df.groupby("ano")["id_municipio"]
            .nunique()
            .sort_index()
            .items()
        ):
            print(f"  {ano}: {qtd}")

    cobertura_2025 = next(
        item for item in cobertura["cobertura_por_ano"] if item["ano"] == 2025
    )
    print(
        "\n2025 marcado como cobertura incompleta: "
        f"{cobertura_2025['cobertura_incompleta']}"
    )

    print("\nMunicipios ausentes em 2025 p6:")
    for item in cobertura["municipios_ausentes_2025_p6"]:
        print(f"  {item['id_municipio']} - {item['municipio']}")

    print("\nArquivos gerados:")
    for path in resultado["paths"].values():
        print(f"  {path.relative_to(BASE_DIR)}")


if __name__ == "__main__":
    resultado = preparar_siope_indicadores_dashboard()
    _print_validacao(resultado)
