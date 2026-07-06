from __future__ import annotations

import json
import math
import re
import time
from collections.abc import Iterable
from datetime import datetime, timezone
from pathlib import Path
from typing import Any
from urllib.parse import quote, urlencode

import pandas as pd
import requests
from requests.exceptions import ChunkedEncodingError


BASE_DIR = Path(__file__).resolve().parents[1]
PROJECT_DIR = BASE_DIR.parent
BASE_ODATA = "https://www.fnde.gov.br/olinda-ide/servico/DADOS_ABERTOS_SIOPE/versao/v1/odata"

UF_PADRAO = "RS"
ANOS_FECHADOS = list(range(2021, 2026))
PERIODOS = [1, 2, 3, 4, 5, 6]
COLETAR_APENAS_POC = False
INCLUIR_ANO_EM_ANDAMENTO = False
ANOS_EM_ANDAMENTO = [2026]
FORCAR_DOWNLOAD = False
SALVAR_PARQUET = True
SALVAR_CSV = True

TAMANHO_PAGINA_PADRAO = 2_000
TIMEOUT_REQUISICAO = 180
MAX_TENTATIVAS = 5
SLEEP_ENTRE_REQUESTS = 1.0

CACHE_DIR = (
    BASE_DIR
    / "cache"
    / "siope_indicadores_financeiros_educacionais"
    / "odata_json"
)
OUTPUT_DIR = BASE_DIR / "export" / "data"
LOTES_DIR = OUTPUT_DIR / "siope_indicadores_financeiros_educacionais_lotes"

HEADERS = {
    "User-Agent": (
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) "
        "AppleWebKit/537.36 (KHTML, like Gecko) "
        "Chrome/124.0 Safari/537.36"
    ),
    "Accept": "application/json,text/plain,*/*",
    "Accept-Language": "pt-BR,pt;q=0.9,en-US;q=0.8",
    "Connection": "keep-alive",
}

MUNICIPIOS_AMOSTRA = [
    {"id_municipio": "4313375", "municipio": "Nova Santa Rita"},
    {"id_municipio": "4310009", "municipio": "Ibirubá"},
]

ANOS_PERIODOS_AMOSTRA_FECHADOS = [
    (2021, 1),
    (2021, 6),
    (2024, 1),
    (2024, 6),
]

ANOS_PERIODOS_AMOSTRA_EM_ANDAMENTO = [
    (2026, 1),
    (2026, 2),
]

COLUNAS_LONG = [
    "ano",
    "periodo",
    "sigla_uf",
    "cod_uf",
    "id_municipio",
    "municipio",
    "municipio_param_siope",
    "tipo_esfera",
    "grupo_codigo",
    "grupo_nome",
    "codigo_indicador",
    "cod_indi_origem",
    "cod_grup_origem",
    "grupo_nome_origem",
    "nome_indicador",
    "unidade_detectada",
    "valor_original",
    "valor",
    "url_consulta",
    "data_hora_coleta",
    "status_coleta",
    "observacao",
]

COLUNAS_CATALOGO = [
    "codigo_indicador",
    "grupo_codigo",
    "grupo_nome",
    "nome_indicador",
    "unidade_detectada",
    "primeira_ocorrencia_ano",
    "ultima_ocorrencia_ano",
    "primeiro_periodo_observado",
    "ultimo_periodo_observado",
    "qtd_ocorrencias",
    "qtd_municipios",
    "observacao",
]

COLUNAS_AUDITORIA = [
    "ano",
    "periodo",
    "id_municipio",
    "municipio",
    "qtd_indicadores",
    "qtd_indicadores_esperada_periodo",
    "qtd_valores_convertidos",
    "qtd_valores_nao_convertidos",
    "qtd_duplicados",
    "indicadores_ausentes",
    "indicadores_extras",
    "qtd_indicadores_ref_ano_p6",
    "diferenca_qtd_periodo_vs_p6",
    "periodo_6_ano_fechado",
    "status",
]

GRUPOS_POR_PREFIXO = {
    "1": "Indicadores Legais",
    "2": "Indicadores de Dispêndio Financeiro",
    "3": "Indicadores de Dispêndio com Pessoal",
    "4": "Indicadores de Investimento por Aluno",
    "5": "Indicadores de Desenvolvimento Educacional",
    "6": "Indicadores de Composição da Receita",
    "7": "Resultado Financeiro do Exercício",
    "8": "Aplicação da Receita de Impostos em MDE",
}


def municipio_param_siope(id_municipio: str | int) -> int:
    codigo = re.sub(r"\D", "", str(id_municipio))
    if len(codigo) < 6:
        raise ValueError(f"id_municipio invalido para SIOPE: {id_municipio!r}")
    return int(codigo[:6])


def carregar_municipios_rs() -> list[dict[str, Any]]:
    candidatos = [
        PROJECT_DIR / "public" / "data" / "educacao" / "municipios_index.json",
        BASE_DIR / "export" / "data_partitioned" / "municipios_index.json",
        BASE_DIR / "export" / "data" / "educacao" / "municipios_index.json",
    ]

    problemas: list[str] = []
    for path in candidatos:
        if not path.exists():
            problemas.append(f"{path}: arquivo nao encontrado")
            continue

        try:
            payload = json.loads(path.read_text(encoding="utf-8"))
        except json.JSONDecodeError as exc:
            problemas.append(f"{path}: JSON invalido ({exc})")
            continue

        itens = payload.get("municipios")
        if not isinstance(itens, list):
            problemas.append(f"{path}: campo 'municipios' ausente ou invalido")
            continue

        municipios: list[dict[str, Any]] = []
        for item in itens:
            if not isinstance(item, dict):
                continue
            id_municipio = str(item.get("id_municipio") or item.get("id") or "").strip()
            municipio = str(
                item.get("municipio") or item.get("nome") or item.get("name") or ""
            ).strip()
            if not id_municipio or not municipio:
                continue
            if not re.fullmatch(r"\d{7}", id_municipio):
                continue
            if not id_municipio.startswith("43"):
                continue
            municipios.append(
                {
                    "id_municipio": id_municipio,
                    "municipio": municipio,
                    "municipio_param_siope": municipio_param_siope(id_municipio),
                    "fonte_municipios": str(path),
                }
            )

        ids = {item["id_municipio"] for item in municipios}
        params = {item["municipio_param_siope"] for item in municipios}
        if len(municipios) != 497:
            problemas.append(f"{path}: {len(municipios)} municipios RS, esperado 497")
            continue
        if len(ids) != 497 or len(params) != 497:
            problemas.append(f"{path}: IDs ou parametros SIOPE duplicados")
            continue

        return sorted(municipios, key=lambda item: item["id_municipio"])

    detalhe = "\n".join(problemas)
    raise RuntimeError(
        "Nao foi possivel encontrar uma fonte segura com 497 municipios do RS.\n"
        f"Fontes testadas:\n{detalhe}"
    )


def _endpoint_indicadores() -> str:
    return (
        f"{BASE_ODATA.rstrip('/')}/"
        "Indicadores_Siope(Ano_Consulta=@Ano_Consulta,Num_Peri=@Num_Peri,Sig_UF=@Sig_UF)"
    )


def _query_string(params: dict[str, Any]) -> str:
    return urlencode(params, quote_via=quote, safe="@'$(),")


def montar_url_odata_indicadores(
    ano: int,
    periodo: int,
    uf: str,
    top: int,
    skip: int,
) -> str:
    params = {
        "@Ano_Consulta": int(ano),
        "@Num_Peri": int(periodo),
        "@Sig_UF": f"'{uf}'",
        "$top": int(top),
        "$skip": int(skip),
        "$format": "json",
    }
    return f"{_endpoint_indicadores()}?{_query_string(params)}"


def montar_url_odata_indicador_municipio(
    ano: int,
    periodo: int,
    uf: str,
    municipio_param: int,
    top: int,
    skip: int,
) -> str:
    params = {
        "@Ano_Consulta": int(ano),
        "@Num_Peri": int(periodo),
        "@Sig_UF": f"'{uf}'",
        "$top": int(top),
        "$skip": int(skip),
        "$format": "json",
        "$filter": f"COD_MUNI eq {int(municipio_param)}",
    }
    return f"{_endpoint_indicadores()}?{_query_string(params)}"


def baixar_json_odata(session: requests.Session, url: str) -> dict[str, Any]:
    ultimo_erro: Exception | None = None
    for tentativa in range(1, MAX_TENTATIVAS + 1):
        try:
            response = session.get(url, timeout=TIMEOUT_REQUISICAO)
            if response.ok:
                return response.json()

            mensagem = response.text[:800].strip()
            erro = RuntimeError(
                f"Erro HTTP {response.status_code} ao consultar OData: {mensagem}"
            )
            if response.status_code not in {429, 500, 502, 503, 504}:
                raise erro
            ultimo_erro = erro
        except (
            requests.Timeout,
            requests.ConnectionError,
            ChunkedEncodingError,
            ValueError,
            RuntimeError,
        ) as exc:
            ultimo_erro = exc
            if tentativa == MAX_TENTATIVAS:
                break

        espera = tentativa * 5
        print(
            f"    Falha na tentativa {tentativa}/{MAX_TENTATIVAS}. "
            f"Retentando em {espera}s..."
        )
        time.sleep(espera)

    raise RuntimeError(f"Falha ao baixar OData apos retries: {ultimo_erro}") from ultimo_erro


def iterar_paginas_odata(
    ano: int,
    periodo: int,
    uf: str,
) -> Iterable[dict[str, Any]]:
    session = requests.Session()
    session.headers.update(HEADERS)
    skip = 0
    while True:
        url = montar_url_odata_indicadores(
            ano=ano,
            periodo=periodo,
            uf=uf,
            top=TAMANHO_PAGINA_PADRAO,
            skip=skip,
        )
        payload = baixar_json_odata(session, url)
        registros = payload.get("value", [])
        for registro in registros:
            yield registro

        if len(registros) < TAMANHO_PAGINA_PADRAO:
            break
        skip += TAMANHO_PAGINA_PADRAO
        time.sleep(SLEEP_ENTRE_REQUESTS)


def _iterar_paginas_odata_municipio(
    session: requests.Session,
    ano: int,
    periodo: int,
    uf: str,
    municipio_param: int,
) -> tuple[list[dict[str, Any]], list[dict[str, Any]]]:
    skip = 0
    registros_acumulados: list[dict[str, Any]] = []
    respostas: list[dict[str, Any]] = []

    while True:
        url = montar_url_odata_indicador_municipio(
            ano=ano,
            periodo=periodo,
            uf=uf,
            municipio_param=municipio_param,
            top=TAMANHO_PAGINA_PADRAO,
            skip=skip,
        )
        payload = baixar_json_odata(session, url)
        registros = payload.get("value", [])
        respostas.append(
            {
                "municipio_param_siope": municipio_param,
                "skip": skip,
                "url": url,
                "qtd_registros": len(registros),
                "response": payload,
            }
        )
        for registro in registros:
            registros_acumulados.append({**registro, "_url_consulta": url})

        if len(registros) < TAMANHO_PAGINA_PADRAO:
            break
        skip += TAMANHO_PAGINA_PADRAO
        time.sleep(SLEEP_ENTRE_REQUESTS)

    return registros_acumulados, respostas


def normalizar_valor_indicador(valor_original: Any) -> float | None:
    if valor_original is None:
        return None

    texto = str(valor_original).strip()
    if not texto or texto in {"-", "--"}:
        return None

    texto = (
        texto.replace("\xa0", " ")
        .replace("R$", "")
        .replace("%", "")
        .strip()
    )
    texto = re.sub(r"\s+", "", texto)
    texto = texto.replace("+", "")

    if not texto:
        return None

    negativo = texto.startswith("(") and texto.endswith(")")
    if negativo:
        texto = texto[1:-1]

    if "," in texto:
        texto = texto.replace(".", "").replace(",", ".")
    elif re.fullmatch(r"-?\d{1,3}(?:\.\d{3})+", texto):
        texto = texto.replace(".", "")

    try:
        valor = float(texto)
    except ValueError:
        return None

    if not math.isfinite(valor):
        return None
    return -valor if negativo else valor


def detectar_unidade(
    nome_indicador: Any,
    codigo_indicador: Any,
    valor_original: Any,
) -> str:
    texto_valor = str(valor_original or "").lower()
    texto_nome = str(nome_indicador or "").lower()
    texto_codigo = str(codigo_indicador or "").lower()

    if "%" in texto_valor or "percentual" in texto_nome or "taxa" in texto_nome:
        return "percentual"

    termos_reais = (
        "r$",
        "despesa",
        "receita",
        "investimento",
        "valor",
        "superávit",
        "superavit",
        "déficit",
        "deficit",
        "saldo",
        "recursos",
    )
    if any(termo in texto_valor or termo in texto_nome for termo in termos_reais):
        return "reais"

    if texto_codigo and normalizar_valor_indicador(valor_original) is not None:
        return "numero"

    return "indefinido"


def classificar_grupo(cod_exib: Any, nom_grup_indi: Any) -> tuple[str, str]:
    codigo = str(cod_exib or "").strip()
    prefixo = codigo.split(".", 1)[0] if codigo else ""
    if prefixo in GRUPOS_POR_PREFIXO:
        return prefixo, GRUPOS_POR_PREFIXO[prefixo]
    return "outros", "Outros / não classificado"


def transformar_odata_em_long(
    rows: list[dict[str, Any]],
    municipios_rs: list[dict[str, Any]],
) -> pd.DataFrame:
    data_hora_coleta = datetime.now(timezone.utc).astimezone().isoformat(
        timespec="seconds"
    )
    municipios_por_param = {
        int(item["municipio_param_siope"]): item
        for item in municipios_rs
    }
    registros: list[dict[str, Any]] = []

    for row in rows:
        cod_muni = row.get("COD_MUNI")
        if cod_muni is None:
            continue

        try:
            municipio_param = int(cod_muni)
        except (TypeError, ValueError):
            continue

        municipio_base = municipios_por_param.get(municipio_param)
        if municipio_base is None:
            continue

        codigo_indicador = str(row.get("COD_EXIB") or "").strip()
        nome_indicador = str(row.get("NOM_INDI") or "").strip()
        grupo_codigo, grupo_nome = classificar_grupo(
            codigo_indicador,
            row.get("NOM_GRUP_INDI"),
        )
        valor_original = row.get("VAL_INDI")
        valor = normalizar_valor_indicador(valor_original)
        unidade = detectar_unidade(nome_indicador, codigo_indicador, valor_original)
        observacao = ""
        if valor_original not in (None, "") and valor is None:
            observacao = "valor_nao_convertido"

        registros.append(
            {
                "ano": row.get("NUM_ANO"),
                "periodo": row.get("NUM_PERI"),
                "sigla_uf": row.get("SIG_UF"),
                "cod_uf": row.get("COD_UF"),
                "id_municipio": str(municipio_base["id_municipio"]),
                "municipio": municipio_base.get("municipio") or row.get("NOM_MUNI"),
                "municipio_param_siope": municipio_param,
                "tipo_esfera": row.get("TIPO"),
                "grupo_codigo": grupo_codigo,
                "grupo_nome": grupo_nome,
                "codigo_indicador": codigo_indicador,
                "cod_indi_origem": row.get("COD_INDI"),
                "cod_grup_origem": row.get("COD_GRUP"),
                "grupo_nome_origem": row.get("NOM_GRUP_INDI"),
                "nome_indicador": nome_indicador,
                "unidade_detectada": unidade,
                "valor_original": None if valor_original is None else str(valor_original),
                "valor": valor,
                "url_consulta": row.get("_url_consulta", ""),
                "data_hora_coleta": data_hora_coleta,
                "status_coleta": "ok",
                "observacao": observacao,
            }
        )

    return pd.DataFrame(registros, columns=COLUNAS_LONG)


def _codigo_sort_key(codigo: Any) -> tuple[int, ...]:
    partes = re.findall(r"\d+", str(codigo or ""))
    if not partes:
        return (9999,)
    return tuple(int(parte) for parte in partes)


def _modo_mais_frequente(series: pd.Series) -> Any:
    valores = series.dropna()
    if valores.empty:
        return None
    moda = valores.mode()
    if moda.empty:
        return valores.iloc[0]
    return moda.iloc[0]


def montar_catalogo_indicadores(df_long: pd.DataFrame) -> pd.DataFrame:
    if df_long.empty:
        return pd.DataFrame(columns=COLUNAS_CATALOGO)

    registros: list[dict[str, Any]] = []
    for codigo, grupo in df_long.groupby("codigo_indicador", dropna=False):
        nomes = sorted(str(v) for v in grupo["nome_indicador"].dropna().unique())
        unidades = sorted(str(v) for v in grupo["unidade_detectada"].dropna().unique())
        grupos = sorted(str(v) for v in grupo["grupo_nome"].dropna().unique())
        observacoes: list[str] = []
        if len(nomes) > 1:
            observacoes.append(f"nomes_variantes={len(nomes)}")
        if len(unidades) > 1:
            observacoes.append(f"unidades_variantes={','.join(unidades)}")
        if len(grupos) > 1:
            observacoes.append(f"grupos_variantes={','.join(grupos)}")

        registros.append(
            {
                "codigo_indicador": codigo,
                "grupo_codigo": _modo_mais_frequente(grupo["grupo_codigo"]),
                "grupo_nome": _modo_mais_frequente(grupo["grupo_nome"]),
                "nome_indicador": _modo_mais_frequente(grupo["nome_indicador"]),
                "unidade_detectada": _modo_mais_frequente(grupo["unidade_detectada"]),
                "primeira_ocorrencia_ano": int(grupo["ano"].min()),
                "ultima_ocorrencia_ano": int(grupo["ano"].max()),
                "primeiro_periodo_observado": int(grupo["periodo"].min()),
                "ultimo_periodo_observado": int(grupo["periodo"].max()),
                "qtd_ocorrencias": int(len(grupo)),
                "qtd_municipios": int(grupo["id_municipio"].nunique()),
                "observacao": "; ".join(observacoes),
            }
        )

    catalogo = pd.DataFrame(registros, columns=COLUNAS_CATALOGO)
    catalogo["_ordem"] = catalogo["codigo_indicador"].map(_codigo_sort_key)
    catalogo = catalogo.sort_values("_ordem").drop(columns=["_ordem"]).reset_index(
        drop=True
    )
    return catalogo


def auditar_indicadores(
    df_long: pd.DataFrame,
    municipios: list[dict[str, Any]],
    anos_periodos: list[tuple[int, int]],
) -> pd.DataFrame:
    if df_long.empty:
        registros_sem_dados = [
            {
                "ano": ano,
                "periodo": periodo,
                "id_municipio": municipio["id_municipio"],
                "municipio": municipio["municipio"],
                "qtd_indicadores": 0,
                "qtd_indicadores_esperada_periodo": 0,
                "qtd_valores_convertidos": 0,
                "qtd_valores_nao_convertidos": 0,
                "qtd_duplicados": 0,
                "indicadores_ausentes": "",
                "indicadores_extras": "",
                "qtd_indicadores_ref_ano_p6": 0,
                "diferenca_qtd_periodo_vs_p6": 0,
                "periodo_6_ano_fechado": periodo == 6,
                "status": "sem_dados",
            }
            for ano, periodo in anos_periodos
            for municipio in municipios
        ]
        return pd.DataFrame(registros_sem_dados, columns=COLUNAS_AUDITORIA)

    chaves = ["ano", "periodo", "id_municipio", "codigo_indicador"]
    df_aud = df_long.copy()
    df_aud["ano"] = df_aud["ano"].astype("Int64")
    df_aud["periodo"] = df_aud["periodo"].astype("Int64")
    df_aud["id_municipio"] = df_aud["id_municipio"].astype(str)
    df_aud["codigo_indicador"] = df_aud["codigo_indicador"].astype(str)
    df_aud["_valor_convertido"] = df_aud["valor"].notna().astype(int)
    df_aud["_valor_nao_convertido"] = (
        df_aud["valor_original"].notna() & df_aud["valor"].isna()
    ).astype(int)
    df_aud["_duplicado"] = df_aud.duplicated(subset=chaves, keep=False).astype(int)

    agregado = (
        df_aud.groupby(["ano", "periodo", "id_municipio"], dropna=False)
        .agg(
            qtd_indicadores=("codigo_indicador", "nunique"),
            qtd_valores_convertidos=("_valor_convertido", "sum"),
            qtd_valores_nao_convertidos=("_valor_nao_convertido", "sum"),
            qtd_duplicados=("_duplicado", "sum"),
        )
        .reset_index()
    )
    agregado_por_chave = {
        (int(row.ano), int(row.periodo), str(row.id_municipio)): row
        for row in agregado.itertuples(index=False)
    }

    indicadores_por_chave = (
        df_aud.groupby(["ano", "periodo", "id_municipio"], dropna=False)[
            "codigo_indicador"
        ]
        .agg(lambda valores: set(valores.dropna().astype(str)))
        .to_dict()
    )
    indicadores_por_chave = {
        (int(ano), int(periodo), str(id_municipio)): codigos
        for (ano, periodo, id_municipio), codigos in indicadores_por_chave.items()
    }

    conjuntos_por_periodo: dict[tuple[int, int], dict[tuple[str, ...], int]] = {}
    for (ano, periodo, _id_municipio), codigos in indicadores_por_chave.items():
        chave_periodo = (int(ano), int(periodo))
        conjunto = tuple(sorted(codigos, key=_codigo_sort_key))
        conjuntos_por_periodo.setdefault(chave_periodo, {})
        conjuntos_por_periodo[chave_periodo][conjunto] = (
            conjuntos_por_periodo[chave_periodo].get(conjunto, 0) + 1
        )

    indicadores_por_periodo: dict[tuple[int, int], set[str]] = {}
    for chave_periodo, contagens in conjuntos_por_periodo.items():
        conjunto_modal = max(
            contagens.items(),
            key=lambda item: (item[1], len(item[0])),
        )[0]
        indicadores_por_periodo[chave_periodo] = set(conjunto_modal)

    qtd_esperada_periodo = {
        chave: len(indicadores)
        for chave, indicadores in indicadores_por_periodo.items()
    }
    qtd_ref_p6 = {
        int(ano): qtd_esperada_periodo.get((int(ano), 6), 0)
        for ano in df_aud["ano"].dropna().unique()
    }

    registros: list[dict[str, Any]] = []
    for ano, periodo in anos_periodos:
        indicadores_ref = indicadores_por_periodo.get((int(ano), int(periodo)), set())
        qtd_esperada = qtd_esperada_periodo.get((int(ano), int(periodo)), 0)
        qtd_ano_p6 = qtd_ref_p6.get(int(ano), 0)

        for municipio in municipios:
            id_municipio = str(municipio["id_municipio"])
            chave = (int(ano), int(periodo), id_municipio)
            resumo = agregado_por_chave.get(chave)
            indicadores_municipio = indicadores_por_chave.get(chave, set())
            ausentes = sorted(
                indicadores_ref - indicadores_municipio,
                key=_codigo_sort_key,
            )
            extras = sorted(
                indicadores_municipio - indicadores_ref,
                key=_codigo_sort_key,
            )
            qtd_indicadores = int(resumo.qtd_indicadores) if resumo is not None else 0
            qtd_convertidos = (
                int(resumo.qtd_valores_convertidos) if resumo is not None else 0
            )
            qtd_nao_convertidos = (
                int(resumo.qtd_valores_nao_convertidos) if resumo is not None else 0
            )
            qtd_duplicados = int(resumo.qtd_duplicados) if resumo is not None else 0

            if resumo is None and qtd_esperada == 0:
                status = "sem_dados"
            elif resumo is None:
                status = "municipio_ausente"
            elif qtd_duplicados > 0:
                status = "duplicado"
            elif qtd_nao_convertidos > 0:
                status = "valor_nao_convertido"
            elif qtd_indicadores < qtd_esperada:
                status = "qtd_indicadores_incompleta"
            else:
                status = "ok"

            registros.append(
                {
                    "ano": int(ano),
                    "periodo": int(periodo),
                    "id_municipio": id_municipio,
                    "municipio": municipio["municipio"],
                    "qtd_indicadores": int(qtd_indicadores),
                    "qtd_indicadores_esperada_periodo": int(qtd_esperada),
                    "qtd_valores_convertidos": qtd_convertidos,
                    "qtd_valores_nao_convertidos": qtd_nao_convertidos,
                    "qtd_duplicados": qtd_duplicados,
                    "indicadores_ausentes": ",".join(ausentes),
                    "indicadores_extras": ",".join(extras),
                    "qtd_indicadores_ref_ano_p6": int(qtd_ano_p6),
                    "diferenca_qtd_periodo_vs_p6": int(qtd_esperada - qtd_ano_p6),
                    "periodo_6_ano_fechado": int(periodo) == 6,
                    "status": status,
                }
            )

    return pd.DataFrame(registros, columns=COLUNAS_AUDITORIA)


def _cache_path(ano: int, periodo: int, uf: str) -> Path:
    return CACHE_DIR / f"siope_indicadores_{uf}_{ano}_p{periodo}.json"


def _cache_path_poc(ano: int, periodo: int, uf: str) -> Path:
    return CACHE_DIR / f"siope_indicadores_{uf}_{ano}_p{periodo}_poc.json"


def _json_safe(value: Any) -> Any:
    if value is None:
        return None
    if isinstance(value, (str, bool, int)):
        return value
    if isinstance(value, float):
        return value if math.isfinite(value) else None
    if isinstance(value, datetime):
        return value.isoformat()
    if hasattr(value, "item") and not isinstance(value, (str, bytes, bytearray)):
        try:
            return _json_safe(value.item())
        except (TypeError, ValueError):
            pass
    if isinstance(value, dict):
        return {str(k): _json_safe(v) for k, v in value.items()}
    if isinstance(value, (list, tuple)):
        return [_json_safe(v) for v in value]
    return str(value)


def _write_json(path: Path, payload: Any) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(
        json.dumps(_json_safe(payload), ensure_ascii=False, indent=2),
        encoding="utf-8",
    )


def _flatten_pages(pages: list[dict[str, Any]]) -> list[dict[str, Any]]:
    registros: list[dict[str, Any]] = []
    for page in pages:
        url = page.get("url", "")
        response = page.get("response", {})
        for row in response.get("value", []):
            registros.append({**row, "_url_consulta": url})
    return registros


def _carregar_ou_baixar_periodo_uf_completo(
    session: requests.Session,
    ano: int,
    periodo: int,
    uf: str,
) -> tuple[list[dict[str, Any]], dict[str, Any], bool]:
    path = _cache_path(ano, periodo, uf)
    if path.exists() and not FORCAR_DOWNLOAD:
        payload = json.loads(path.read_text(encoding="utf-8"))
        if payload.get("escopo") == "uf_completa" and isinstance(
            payload.get("pages"),
            list,
        ):
            return _flatten_pages(payload["pages"]), payload, True
        print(
            f"  Cache existente nao e completo ({path.name}); "
            "baixando UF completa novamente."
        )

    pages: list[dict[str, Any]] = []
    total_registros = 0
    skip = 0
    while True:
        url = montar_url_odata_indicadores(
            ano=ano,
            periodo=periodo,
            uf=uf,
            top=TAMANHO_PAGINA_PADRAO,
            skip=skip,
        )
        payload_page = baixar_json_odata(session, url)
        registros = payload_page.get("value", [])
        pages.append(
            {
                "skip": skip,
                "top": TAMANHO_PAGINA_PADRAO,
                "url": url,
                "qtd_registros": len(registros),
                "response": payload_page,
            }
        )
        total_registros += len(registros)
        print(f"    pagina skip={skip}: {len(registros)} registros")

        if len(registros) < TAMANHO_PAGINA_PADRAO:
            break
        skip += TAMANHO_PAGINA_PADRAO
        time.sleep(SLEEP_ENTRE_REQUESTS)

    payload = {
        "generated_at": datetime.now(timezone.utc).astimezone().isoformat(
            timespec="seconds"
        ),
        "fonte": "SIOPE OData Indicadores_Siope",
        "escopo": "uf_completa",
        "ano": int(ano),
        "periodo": int(periodo),
        "uf": uf,
        "top": TAMANHO_PAGINA_PADRAO,
        "total_registros": total_registros,
        "pages": pages,
    }
    _write_json(path, payload)
    return _flatten_pages(pages), payload, False


def _carregar_ou_baixar_amostra_periodo(
    session: requests.Session,
    ano: int,
    periodo: int,
    uf: str,
    municipios_amostra: list[dict[str, Any]],
) -> tuple[list[dict[str, Any]], dict[str, Any]]:
    path = _cache_path_poc(ano, periodo, uf)
    if path.exists() and not FORCAR_DOWNLOAD:
        payload = json.loads(path.read_text(encoding="utf-8"))
        return _flatten_pages(payload.get("responses", [])), payload

    responses: list[dict[str, Any]] = []
    registros: list[dict[str, Any]] = []
    for municipio in municipios_amostra:
        parametro = municipio_param_siope(municipio["id_municipio"])
        rows_municipio, responses_municipio = _iterar_paginas_odata_municipio(
            session=session,
            ano=ano,
            periodo=periodo,
            uf=uf,
            municipio_param=parametro,
        )
        registros.extend(rows_municipio)
        responses.extend(responses_municipio)
        time.sleep(SLEEP_ENTRE_REQUESTS)

    payload = {
        "generated_at": datetime.now(timezone.utc).astimezone().isoformat(
            timespec="seconds"
        ),
        "fonte": "SIOPE OData Indicadores_Siope",
        "escopo": "poc",
        "ano": ano,
        "periodo": periodo,
        "uf": uf,
        "municipios_amostra": municipios_amostra,
        "responses": responses,
    }
    _write_json(path, payload)
    return registros, payload


def _anos_periodos_fechados() -> list[tuple[int, int]]:
    return [(ano, periodo) for ano in ANOS_FECHADOS for periodo in PERIODOS]


def _anos_periodos_poc() -> list[tuple[int, int]]:
    anos_periodos = list(ANOS_PERIODOS_AMOSTRA_FECHADOS)
    if INCLUIR_ANO_EM_ANDAMENTO:
        anos_periodos.extend(ANOS_PERIODOS_AMOSTRA_EM_ANDAMENTO)
    return anos_periodos


def _salvar_lote_intermediario(df_lote: pd.DataFrame, ano: int, periodo: int) -> Path:
    LOTES_DIR.mkdir(parents=True, exist_ok=True)
    path = LOTES_DIR / f"siope_indicadores_{UF_PADRAO}_{ano}_p{periodo}_long.parquet"
    df_lote.to_parquet(path, index=False)
    return path


def _salvar_csv_parquet(df: pd.DataFrame, csv_path: Path, parquet_path: Path) -> None:
    csv_path.parent.mkdir(parents=True, exist_ok=True)
    if SALVAR_CSV:
        df.to_csv(csv_path, index=False, encoding="utf-8-sig")
    if SALVAR_PARQUET:
        df.to_parquet(parquet_path, index=False)


def _salvar_saidas_poc(
    df_long: pd.DataFrame,
    catalogo: pd.DataFrame,
    auditoria: pd.DataFrame,
) -> dict[str, Path]:
    OUTPUT_DIR.mkdir(parents=True, exist_ok=True)
    paths = {
        "long_csv": OUTPUT_DIR
        / "siope_indicadores_financeiros_educacionais_poc_long.csv",
        "long_parquet": OUTPUT_DIR
        / "siope_indicadores_financeiros_educacionais_poc_long.parquet",
        "catalogo_csv": OUTPUT_DIR / "siope_indicadores_catalogo_poc.csv",
        "auditoria_csv": OUTPUT_DIR / "siope_indicadores_auditoria_poc.csv",
    }
    _salvar_csv_parquet(df_long, paths["long_csv"], paths["long_parquet"])
    if SALVAR_CSV:
        catalogo.to_csv(paths["catalogo_csv"], index=False, encoding="utf-8-sig")
        auditoria.to_csv(paths["auditoria_csv"], index=False, encoding="utf-8-sig")
    return paths


def _salvar_saidas_completas(
    df_long: pd.DataFrame,
    catalogo: pd.DataFrame,
    auditoria: pd.DataFrame,
    sufixo: str = "",
) -> dict[str, Path]:
    OUTPUT_DIR.mkdir(parents=True, exist_ok=True)
    sufixo_nome = f"_{sufixo}" if sufixo else ""
    anual_p6 = df_long[df_long["periodo"].astype("Int64") == 6].copy()
    paths = {
        "long_csv": OUTPUT_DIR
        / f"siope_indicadores_financeiros_educacionais_long{sufixo_nome}.csv",
        "long_parquet": OUTPUT_DIR
        / f"siope_indicadores_financeiros_educacionais_long{sufixo_nome}.parquet",
        "catalogo_csv": OUTPUT_DIR / f"siope_indicadores_catalogo{sufixo_nome}.csv",
        "auditoria_csv": OUTPUT_DIR / f"siope_indicadores_auditoria{sufixo_nome}.csv",
        "anual_p6_csv": OUTPUT_DIR
        / f"siope_indicadores_financeiros_educacionais_anual_p6{sufixo_nome}.csv",
        "anual_p6_parquet": OUTPUT_DIR
        / f"siope_indicadores_financeiros_educacionais_anual_p6{sufixo_nome}.parquet",
    }

    _salvar_csv_parquet(df_long, paths["long_csv"], paths["long_parquet"])
    _salvar_csv_parquet(anual_p6, paths["anual_p6_csv"], paths["anual_p6_parquet"])
    if SALVAR_CSV:
        catalogo.to_csv(paths["catalogo_csv"], index=False, encoding="utf-8-sig")
        auditoria.to_csv(paths["auditoria_csv"], index=False, encoding="utf-8-sig")
    return paths


def executar_prova_de_conceito() -> dict[str, Any]:
    session = requests.Session()
    session.headers.update(HEADERS)

    todos_rows: list[dict[str, Any]] = []
    contagens_brutas: list[dict[str, Any]] = []
    anos_periodos = _anos_periodos_poc()

    for ano, periodo in anos_periodos:
        print(f"Baixando/carregando cache POC SIOPE {UF_PADRAO} {ano} periodo {periodo}...")
        rows, payload = _carregar_ou_baixar_amostra_periodo(
            session=session,
            ano=ano,
            periodo=periodo,
            uf=UF_PADRAO,
            municipios_amostra=MUNICIPIOS_AMOSTRA,
        )
        todos_rows.extend(rows)
        contagens_brutas.append(
            {
                "ano": ano,
                "periodo": periodo,
                "qtd_registros_brutos": len(rows),
                "cache": str(_cache_path_poc(ano, periodo, UF_PADRAO)),
                "cache_generated_at": payload.get("generated_at"),
            }
        )
        print(f"  registros brutos: {len(rows)}")

    df_long = transformar_odata_em_long(todos_rows, MUNICIPIOS_AMOSTRA)
    catalogo = montar_catalogo_indicadores(df_long)
    auditoria = auditar_indicadores(df_long, MUNICIPIOS_AMOSTRA, anos_periodos)
    paths = _salvar_saidas_poc(df_long, catalogo, auditoria)

    return {
        "contagens_brutas": contagens_brutas,
        "df_long": df_long,
        "catalogo": catalogo,
        "auditoria": auditoria,
        "paths": paths,
        "municipios": MUNICIPIOS_AMOSTRA,
        "anos_periodos": anos_periodos,
        "falhas": [],
    }


def coletar_indicadores_rs_completo(
    anos: list[int] | None = None,
    periodos: list[int] | None = None,
    sufixo_saida: str = "",
) -> dict[str, Any]:
    municipios = carregar_municipios_rs()
    anos = anos or ANOS_FECHADOS
    periodos = periodos or PERIODOS
    anos_periodos = [(ano, periodo) for ano in anos for periodo in periodos]

    print(
        f"Municipios RS carregados: {len(municipios)} "
        f"({municipios[0]['fonte_municipios']})"
    )
    print(
        f"Coleta completa SIOPE: anos={anos}, periodos={periodos}, "
        f"combinacoes municipio/ano/periodo esperadas={len(municipios) * len(anos_periodos)}"
    )

    session = requests.Session()
    session.headers.update(HEADERS)
    dfs_lotes: list[pd.DataFrame] = []
    contagens_brutas: list[dict[str, Any]] = []
    falhas: list[dict[str, Any]] = []

    for posicao, (ano, periodo) in enumerate(anos_periodos, start=1):
        print(
            f"\n[{posicao}/{len(anos_periodos)}] "
            f"SIOPE {UF_PADRAO} {ano} periodo {periodo}"
        )
        try:
            rows, payload, veio_cache = _carregar_ou_baixar_periodo_uf_completo(
                session=session,
                ano=ano,
                periodo=periodo,
                uf=UF_PADRAO,
            )
            df_lote = transformar_odata_em_long(rows, municipios)
            lote_path = _salvar_lote_intermediario(df_lote, ano, periodo)
            dfs_lotes.append(df_lote)

            contagens_brutas.append(
                {
                    "ano": ano,
                    "periodo": periodo,
                    "qtd_registros_brutos": len(rows),
                    "qtd_linhas_long": len(df_lote),
                    "qtd_municipios_long": int(df_lote["id_municipio"].nunique())
                    if not df_lote.empty
                    else 0,
                    "cache": str(_cache_path(ano, periodo, UF_PADRAO)),
                    "cache_reutilizado": veio_cache,
                    "total_registros_cache": payload.get("total_registros"),
                    "lote_path": str(lote_path),
                }
            )
            print(
                f"  brutos={len(rows)} long={len(df_lote)} "
                f"municipios={contagens_brutas[-1]['qtd_municipios_long']} "
                f"cache={'sim' if veio_cache else 'nao'}"
            )
            print(f"  lote salvo: {_format_relative(lote_path)}")
        except Exception as exc:
            erro = {
                "ano": ano,
                "periodo": periodo,
                "erro": str(exc),
            }
            falhas.append(erro)
            print(f"  ERRO: {exc}")

    if dfs_lotes:
        df_long = pd.concat(dfs_lotes, ignore_index=True)
    else:
        df_long = pd.DataFrame(columns=COLUNAS_LONG)

    catalogo = montar_catalogo_indicadores(df_long)
    auditoria = auditar_indicadores(df_long, municipios, anos_periodos)
    paths = _salvar_saidas_completas(df_long, catalogo, auditoria, sufixo_saida)

    return {
        "contagens_brutas": contagens_brutas,
        "df_long": df_long,
        "catalogo": catalogo,
        "auditoria": auditoria,
        "paths": paths,
        "municipios": municipios,
        "anos_periodos": anos_periodos,
        "falhas": falhas,
    }


def _format_relative(path: Path) -> str:
    try:
        return str(path.relative_to(BASE_DIR))
    except ValueError:
        try:
            return str(path.relative_to(PROJECT_DIR))
        except ValueError:
            return str(path)


def _print_resumo_contagens(resultado: dict[str, Any]) -> None:
    print("\nResumo por ano/periodo:")
    if not resultado["contagens_brutas"]:
        print("  sem contagens")
        return
    for item in resultado["contagens_brutas"]:
        print(
            f"  {item['ano']} p{item['periodo']}: "
            f"brutos={item['qtd_registros_brutos']} "
            f"long={item.get('qtd_linhas_long', '-')} "
            f"municipios={item.get('qtd_municipios_long', '-')} "
            f"cache_reutilizado={item.get('cache_reutilizado', '-')}"
        )


def _print_resumo_auditoria(resultado: dict[str, Any]) -> None:
    auditoria = resultado["auditoria"]
    df_long = resultado["df_long"]
    municipios = resultado["municipios"]
    anos_periodos = resultado["anos_periodos"]
    catalogo = resultado["catalogo"]

    total_esperado = len(municipios) * len(anos_periodos)
    presentes = (
        df_long[["id_municipio", "ano", "periodo"]].drop_duplicates().shape[0]
        if not df_long.empty
        else 0
    )

    print(f"\nTotal de linhas long: {len(df_long)}")
    print(f"Total de indicadores no catalogo: {len(catalogo)}")
    print(f"Total de municipios encontrados na fonte da plataforma: {len(municipios)}")
    print(f"Total de combinacoes municipio/ano/periodo esperadas: {total_esperado}")
    print(f"Total de combinacoes presentes: {presentes}")

    if auditoria.empty:
        print("\nAuditoria: sem linhas")
        return

    print("\nStatus da auditoria:")
    print(auditoria["status"].value_counts().to_string())

    problemas = auditoria[auditoria["status"] != "ok"]
    print("\nProblemas encontrados na auditoria:")
    if problemas.empty:
        print("  nenhum")
    else:
        print(problemas["status"].value_counts().to_string())
        print("\nAmostra dos problemas:")
        cols = ["ano", "periodo", "id_municipio", "municipio", "status", "qtd_indicadores"]
        print(problemas[cols].head(20).to_string(index=False))

    if resultado["falhas"]:
        print("\nFalhas de coleta:")
        for falha in resultado["falhas"]:
            print(f"  {falha['ano']} p{falha['periodo']}: {falha['erro']}")


def _print_validacao_manual(resultado: dict[str, Any]) -> None:
    df_long = resultado["df_long"]
    alvos = [
        ("4313375", "Nova Santa Rita"),
        ("4310009", "Ibirubá"),
    ]
    print("\nValidacao especifica 2024 periodo 6:")
    for id_municipio, municipio in alvos:
        recorte = df_long[
            (df_long["id_municipio"].astype(str) == id_municipio)
            & (df_long["ano"].astype("Int64") == 2024)
            & (df_long["periodo"].astype("Int64") == 6)
        ]
        print(
            f"  {municipio}: {recorte['codigo_indicador'].nunique()} indicadores, "
            f"{len(recorte)} linhas"
        )


def _print_paths(resultado: dict[str, Any]) -> None:
    print("\nArquivos gerados:")
    for path in resultado["paths"].values():
        print(f"  {_format_relative(path)}")


if __name__ == "__main__":
    if COLETAR_APENAS_POC:
        resultado = executar_prova_de_conceito()
    else:
        resultado = coletar_indicadores_rs_completo()

    _print_resumo_contagens(resultado)
    _print_resumo_auditoria(resultado)
    _print_validacao_manual(resultado)
    _print_paths(resultado)

    if INCLUIR_ANO_EM_ANDAMENTO and not COLETAR_APENAS_POC:
        print("\nColetando ano em andamento em arquivos separados...")
        resultado_parcial = coletar_indicadores_rs_completo(
            anos=ANOS_EM_ANDAMENTO,
            periodos=PERIODOS,
            sufixo_saida="parcial_ano_em_andamento",
        )
        _print_resumo_contagens(resultado_parcial)
        _print_resumo_auditoria(resultado_parcial)
        _print_paths(resultado_parcial)
