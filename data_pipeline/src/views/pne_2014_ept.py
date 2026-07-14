from dash import html

from src.views.pne_shared import (
    _fmt_number,
    _fmt_percent,
    _fmt_signed_pp,
    _timeline_visual,
    _variation_text,
)
from src.views.pne_shared_components import (
    build_detail_card,
    build_detail_explanation_box,
    build_detail_header,
    build_detail_metrics_grid,
    build_detail_value_band,
    build_detail_value_node,
)

EPT_DETAIL_KEYS = {
    "eja_integrada_educacao_profissional_percentual",
    "medio_tecnico_total",
    "medio_tecnico_participacao_publica",
    "medio_tecnico",
}


def is_pne2014_ept_item(item_key):
    return item_key in EPT_DETAIL_KEYS


def _fmt_signed_percent(value):
    if value is None:
        return "-"
    prefix = "+" if float(value) > 0 else ""
    return f"{prefix}{_fmt_number(value)}%"


def _fmt_signed_count(value):
    if value is None:
        return "-"
    prefix = "+" if float(value) > 0 else ""
    return f"{prefix}{_fmt_number(value, ',.0f')}"


def _detail_formatted_value_node(year, value, *, color, size, formatter):
    return build_detail_value_node(
        year,
        formatter(value),
        size,
        color=color,
    )


def _detail_highlight_section(children, *, padding="14px", margin_bottom="12px"):
    return html.Div(
        children,
        style={
            "background": "#fbfdff",
            "borderRadius": "16px",
            "border": "1px solid #edf2f7",
            "padding": padding,
            "marginBottom": margin_bottom,
        },
    )


def _detail_stat_cell(label, value, color):
    return html.Div(
        [
            html.Div(
                label,
                style={
                    "fontSize": "0.69rem",
                    "fontWeight": "700",
                    "color": "#64748b",
                    "marginBottom": "3px",
                },
            ),
            html.Div(
                value,
                style={
                    "fontSize": "0.88rem",
                    "fontWeight": "800",
                    "color": color,
                },
            ),
        ],
        style={
            "background": "#ffffff",
            "padding": "11px 12px",
            "textAlign": "center",
        },
    )


def _count_formatter(value):
    return _fmt_number(value, ",.0f")


def build_pne2014_ept_detail_panel(
    item,
    result,
    *,
    accent,
    status,
    order_index,
    total,
    title,
    detail_delta_color_fn,
    detail_distance_color_fn,
):
    header = build_detail_header(
        accent,
        title,
        item["desc"],
        order_index,
        total,
        status,
    )

    if item["key"] == "eja_integrada_educacao_profissional_percentual":
        interpretation = (
            f"Entre {result['start_year']} e {result['end_year']}, o percentual de matrículas do EJA "
            f"na forma integrada à educação profissional passou de {_fmt_percent(result['start_value'])} "
            f"para {_fmt_percent(result['end_value'])}. Em {result['end_year']}, a distância para a meta "
            f"de {_fmt_percent(result['meta'])} foi de {_fmt_signed_pp(result['distance'])}."
        )

        metrics_block = _detail_highlight_section(
            [
                build_detail_value_band(
                    start_node=_detail_formatted_value_node(
                        result["start_year"],
                        result["start_value"],
                        color="#0f172a",
                        size="2.05rem",
                        formatter=_fmt_percent,
                    ),
                    timeline_node=_timeline_visual(result, accent),
                    end_node=_detail_formatted_value_node(
                        result["end_year"],
                        result["end_value"],
                        color=accent,
                        size="2.05rem",
                        formatter=_fmt_percent,
                    ),
                    columns=4,
                    margin_bottom="10px",
                ),
                build_detail_metrics_grid(
                    [
                        _detail_stat_cell(
                            "Variação no período",
                            _variation_text(result),
                            detail_delta_color_fn(result),
                        ),
                        _detail_stat_cell(
                            result.get("meta_label", "Meta de referência"),
                            _fmt_percent(result["meta"]),
                            "#475569",
                        ),
                        _detail_stat_cell(
                            "Situação da meta",
                            status["text"],
                            status["fg"],
                        ),
                        _detail_stat_cell(
                            "Distância da meta",
                            _fmt_signed_pp(result["distance"]),
                            detail_distance_color_fn(result),
                        ),
                    ],
                    4,
                ),
            ]
        )
    elif item["key"] == "medio_tecnico_total":
        interpretation = (
            f"Entre {result['start_year']} e {result['end_year']}, o total de matrículas da EPT passou de "
            f"{_fmt_number(result['start_value'], ',.0f')} para {_fmt_number(result['end_value'], ',.0f')}, "
            f"com variação de {_fmt_signed_percent(result.get('percent_change'))}."
        )

        metrics_block = _detail_highlight_section(
            [
                build_detail_value_band(
                    start_node=_detail_formatted_value_node(
                        result["start_year"],
                        result["start_value"],
                        color="#0f172a",
                        size="2.05rem",
                        formatter=_count_formatter,
                    ),
                    timeline_node=_timeline_visual(result, accent),
                    end_node=_detail_formatted_value_node(
                        result["end_year"],
                        result["end_value"],
                        color=accent,
                        size="2.05rem",
                        formatter=_count_formatter,
                    ),
                    columns=3,
                    margin_bottom="10px",
                ),
                build_detail_metrics_grid(
                    [
                        _detail_stat_cell(
                            "Variação percentual",
                            _fmt_signed_percent(result.get("percent_change")),
                            "#0f766e",
                        ),
                        _detail_stat_cell(
                            "Variação absoluta",
                            _fmt_signed_count(result.get("raw_delta")),
                            "#475569",
                        ),
                        _detail_stat_cell(
                            "Período analisado",
                            f"{result['start_year']} → {result['end_year']}",
                            "#475569",
                        ),
                    ],
                    3,
                ),
            ]
        )
    elif item["key"] == "medio_tecnico_participacao_publica":
        interpretation = (
            f"Desde {result.get('base_year', result['start_year'])}, a participação do segmento público "
            f"na expansão da EPT de nível médio chegou a {_fmt_percent(result['end_value'])}."
        )

        metrics_block = _detail_highlight_section(
            [
                build_detail_value_band(
                    timeline_node=_timeline_visual(result, accent),
                    end_node=_detail_formatted_value_node(
                        result["end_year"],
                        result["end_value"],
                        color=accent,
                        size="2.2rem",
                        formatter=_fmt_percent,
                    ),
                    columns=3,
                    margin_bottom="10px",
                ),
                build_detail_metrics_grid(
                    [
                        _detail_stat_cell(
                            "Variação",
                            _variation_text(result),
                            detail_delta_color_fn(result),
                        ),
                        _detail_stat_cell(
                            "Ano-base considerado",
                            str(result.get("base_year", result["start_year"])),
                            "#475569",
                        ),
                        _detail_stat_cell(
                            "Resultado acumulado",
                            _fmt_percent(result["end_value"]),
                            accent,
                        ),
                    ],
                    3,
                ),
            ]
        )
    else:
        interpretation = ""
        if result.get("base_year") and int(result["base_year"]) > 2013:
            interpretation += f"As primeiras matrículas públicas consideradas apareceram em {int(result['base_year'])}. "
        interpretation += (
            f"Até {result['end_year']}, a EPT de médio público acumulou "
            f"{_count_formatter(result['end_value'])} matrículas."
        )

        metrics_block = _detail_highlight_section(
            [
                build_detail_value_band(
                    timeline_node=_timeline_visual(result, accent),
                    end_node=_detail_formatted_value_node(
                        result["end_year"],
                        result["end_value"],
                        color=accent,
                        size="2.2rem",
                        formatter=_count_formatter,
                    ),
                    columns=3,
                    margin_bottom="14px",
                ),
                build_detail_metrics_grid(
                    [
                        _detail_stat_cell(
                            "Matrículas acumuladas",
                            _count_formatter(result["end_value"]),
                            accent,
                        ),
                        _detail_stat_cell(
                            "Ano-base considerado",
                            str(result.get("base_year", result["start_year"])),
                            "#475569",
                        ),
                        _detail_stat_cell(
                            "Situação da meta",
                            status["text"],
                            status["fg"],
                        ),
                    ],
                    3,
                ),
            ],
            padding="16px",
            margin_bottom="16px",
        )

    return build_detail_card(
        [
            header,
            metrics_block,
            build_detail_explanation_box(interpretation, margin_top="6px"),
        ]
    )
