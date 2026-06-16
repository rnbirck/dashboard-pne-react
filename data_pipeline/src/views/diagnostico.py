import sys

import dash
import dash_bootstrap_components as dbc
from dash import ALL, Input, Output, State, callback, ctx, dcc, html

from src.views.pne_shared import _format_metric_value, _tracks_goal


dash.register_page(
    __name__,
    path="/diagnostico-municipio",
    name="Diagnóstico do município",
)


DIAGNOSTIC_CATEGORIES = [
    "atendimento",
    "rendimento",
    "corpo_docente",
    "infraestrutura",
    "escolaridade_populacao",
]

CATEGORY_META = {
    "atendimento": {
        "icon": "🎓",
        "subtitle": "Acesso e permanência",
        "accent": "#4f46e5",
        "observed": (
            "O município apresenta desafios de acesso e permanência, com metas "
            "ainda abaixo do esperado em parte dos indicadores acompanhados."
        ),
        "reading": (
            "A leitura indica necessidade de concentrar esforços nos indicadores "
            "abaixo da meta, preservando os avanços já alcançados em acesso escolar."
        ),
    },
    "rendimento": {
        "icon": "↗",
        "subtitle": "Aprendizagem e desempenho",
        "accent": "#10b981",
        "observed": (
            "O município apresenta desafios importantes de aprendizagem e desempenho, "
            "com necessidade de apoio pedagógico nos indicadores em atenção."
        ),
        "reading": (
            "O maior desafio está em recuperar aprendizagem e elevar resultados de "
            "alfabetização, desempenho e conclusão escolar nas metas ainda pendentes."
        ),
    },
    "corpo_docente": {
        "icon": "👥",
        "subtitle": "Profissionais da educação",
        "accent": "#f59e0b",
        "observed": (
            "O diagnóstico docente aponta a necessidade de acompanhar formação, "
            "vínculo e valorização dos profissionais da educação básica."
        ),
        "reading": (
            "A dimensão docente exige ações voltadas à formação adequada, redução de "
            "vínculos frágeis e sustentação das condições de trabalho."
        ),
    },
    "infraestrutura": {
        "icon": "🏫",
        "subtitle": "Condições de oferta",
        "accent": "#3b82f6",
        "observed": (
            "O diagnóstico de infraestrutura reúne condições de conectividade, "
            "acessibilidade, climatização e recursos tecnológicos disponíveis nas escolas."
        ),
        "reading": (
            "A leitura indica que a rede precisa fortalecer condições físicas e digitais "
            "para sustentar a aprendizagem e a permanência dos estudantes."
        ),
    },
    "escolaridade_populacao": {
        "icon": "▦",
        "subtitle": "Escolaridade da população",
        "accent": "#2563eb",
        "observed": (
            "O diagnóstico da população mostra o nível de alfabetização e conclusão "
            "das etapas escolares entre jovens e adultos do município."
        ),
        "reading": (
            "A dimensão aponta desafios estruturais de escolarização acumulados na "
            "população e ajuda a orientar políticas de recomposição e continuidade."
        ),
    },
}

SUMMARY_CARDS = [
    {
        "key": "tracked",
        "label": "Indicadores analisados",
        "caption": "indicadores com dados disponíveis",
        "icon": "☷",
        "accent": "#10b981",
    },
    {
        "key": "achieved",
        "label": "Metas atingidas",
        "caption": "resultados já alcançados",
        "icon": "✓",
        "accent": "#3b82f6",
    },
    {
        "key": "attention",
        "label": "Pontos de atenção",
        "caption": "indicadores abaixo da meta",
        "icon": "!",
        "accent": "#f59e0b",
    },
]


def _alert_style(show):
    return {
        "border": "none",
        "borderRadius": "12px",
        "fontSize": "0.95rem",
        "fontWeight": "600",
        "display": "block" if show else "none",
    }


def _get_pne2026_module():
    for module_name, module in sys.modules.items():
        if module_name.endswith("pne_2026_2036") and hasattr(module, "INDICADORES"):
            return module
    raise RuntimeError("Módulo PNE 2026-2036 ainda não carregado pelo Dash.")


def _distance_value(record):
    distance = record["result"].get("distance")
    return 0 if distance is None else float(distance)


def _is_attention(record):
    return record["tracks_goal"] and not record["achieved"]


def _category_counter_text(category):
    goal_total = category["goal_total"]
    informative_total = category["informative_total"]
    if goal_total and informative_total:
        return (
            f"{category['achieved']} de {goal_total} metas atingidas; "
            f"{informative_total} informativos"
        )
    if goal_total:
        return f"{category['achieved']} de {goal_total} metas atingidas"
    return f"{category['total']} indicadores informativos"


def _load_diagnostic(municipio):
    pne2026 = _get_pne2026_module()
    results = pne2026._calculate_results_for_categories(
        municipio, tuple(DIAGNOSTIC_CATEGORIES)
    )
    categories = []

    for category_key in DIAGNOSTIC_CATEGORIES:
        category = pne2026.INDICADORES.get(category_key)
        if not category:
            continue

        indicators = []
        for item in category["items"]:
            result = results.get(item["key"], {})
            tracks_goal = _tracks_goal(item, result)
            if result.get("available"):
                indicators.append(
                    {
                        "key": item["key"],
                        "label": item["label"],
                        "desc": item["desc"],
                        "item": item,
                        "result": result,
                        "tracks_goal": tracks_goal,
                        "achieved": bool(result.get("atingida"))
                        if tracks_goal
                        else False,
                    }
                )

        if indicators:
            meta = CATEGORY_META[category_key]
            goal_indicators = [item for item in indicators if item["tracks_goal"]]
            categories.append(
                {
                    "key": category_key,
                    "label": category["label"],
                    "subtitle": meta["subtitle"],
                    "icon": meta["icon"],
                    "accent": meta["accent"],
                    "observed": meta["observed"],
                    "reading": meta["reading"],
                    "indicators": indicators,
                    "achieved": sum(1 for item in goal_indicators if item["achieved"]),
                    "total": len(indicators),
                    "goal_total": len(goal_indicators),
                    "informative_total": len(indicators) - len(goal_indicators),
                    "attention": [
                        item for item in goal_indicators if not item["achieved"]
                    ],
                    "positive": [item for item in goal_indicators if item["achieved"]],
                    "informative": [
                        item for item in indicators if not item["tracks_goal"]
                    ],
                }
            )

    return categories


def _default_active_category(categories):
    if not categories:
        return None
    return max(
        categories,
        key=lambda category: (len(category["attention"]), category["total"]),
    )["key"]


def _summary_values(categories):
    tracked = sum(category["total"] for category in categories)
    achieved = sum(category["achieved"] for category in categories)
    attention = sum(len(category["attention"]) for category in categories)
    return {
        "tracked": tracked,
        "achieved": achieved,
        "attention": attention,
    }


def _summary_card(config, value, subtitle=None):
    accent = config["accent"]
    caption = subtitle or config["caption"]
    return html.Div(
        [
            html.Div(config["icon"], className="diagnostic-summary-icon"),
            html.Div(
                [
                    html.Div(config["label"], className="diagnostic-summary-label"),
                    html.Div(str(value), className="diagnostic-summary-value"),
                    html.Div(caption, className="diagnostic-summary-caption"),
                ],
                className="diagnostic-summary-copy",
            ),
            html.Div(
                className="diagnostic-summary-bar",
                style={
                    "background": f"linear-gradient(90deg, {accent}, color-mix(in srgb, {accent} 18%, #ffffff))"
                },
            ),
        ],
        className="diagnostic-summary-card",
        style={"--diagnostic-accent": accent},
    )


def _summary_cards(categories):
    values = _summary_values(categories)
    cards = []
    for config in SUMMARY_CARDS:
        cards.append(_summary_card(config, values[config["key"]]))
    return cards


def _area_rows(categories, active_key):
    rows = []
    for category in categories:
        rows.append(
            html.Button(
                [
                    html.Span(category["icon"], className="diagnostic-area-icon"),
                    html.Span(
                        [
                            html.Span(
                                category["label"], className="diagnostic-area-title"
                            ),
                            html.Span(
                                _category_counter_text(category),
                                className="diagnostic-area-subtitle",
                            ),
                        ],
                        className="diagnostic-area-copy",
                    ),
                    html.Span("›", className="diagnostic-area-arrow"),
                ],
                id={"type": "diagnostic-area", "index": category["key"]},
                n_clicks=0,
                type="button",
                className=(
                    "diagnostic-area-row"
                    + (" is-active" if category["key"] == active_key else "")
                ),
                style={"--diagnostic-accent": category["accent"]},
            )
        )
    return rows


def _indicator_badge(record):
    if not record["tracks_goal"]:
        return "Info", "#2563eb", "#dbeafe"
    if record["achieved"]:
        return "OK", "#087f3f", "#dcf7e9"
    distance = record["result"].get("distance")
    if distance is not None and float(distance) <= -20:
        return "Crítico", "#ef4444", "#fee2e2"
    return "Atenção", "#ea580c", "#ffedd5"


def _indicator_rows(category):
    ordered = sorted(
        category["indicators"],
        key=lambda record: (
            not _is_attention(record),
            not record["tracks_goal"],
            record["achieved"],
            _distance_value(record),
        ),
    )
    rows = []
    for index, record in enumerate(ordered[:4]):
        badge, fg, bg = _indicator_badge(record)
        rows.append(
            html.Div(
                [
                    html.Span(str(index + 1), className="diagnostic-indicator-number"),
                    html.Span(record["label"], className="diagnostic-indicator-label"),
                    html.Span(
                        badge,
                        className="diagnostic-status-badge",
                        style={"color": fg, "background": bg},
                    ),
                ],
                className="diagnostic-indicator-row",
            )
        )
    return rows


def _evidence_lines(category):
    lines = []
    attention = sorted(category["attention"], key=_distance_value)
    positives = category["positive"]
    informative = category["informative"]

    for record in attention[:3]:
        value = _format_metric_value(record["item"], record["result"].get("end_value"))
        lines.append(f"{record['label']}: {value}, abaixo da meta acompanhada.")

    for record in informative[: max(0, 3 - len(lines))]:
        value = _format_metric_value(record["item"], record["result"].get("end_value"))
        year = record["result"].get("end_year")
        suffix = f" em {year}" if year else ""
        lines.append(f"{record['label']}: {value}{suffix}.")

    if positives:
        lines.append(
            f"A dimensão atingiu {category['achieved']} de {category['goal_total']} metas acompanhadas."
        )
    elif not lines:
        lines.append("Os indicadores acompanhados exigem atenção em relação às metas.")

    return lines[:4]


def _diagnostic_detail(category):
    return html.Div(
        [
            html.Div(
                [
                    html.Div(
                        f"Diagnóstico: {category['label']}",
                        className="diagnostic-detail-title",
                    ),
                    html.Div(
                        "Baseado em indicadores com dados disponíveis",
                        className="diagnostic-detail-badge",
                    ),
                ],
                className="diagnostic-detail-header",
            ),
            html.Div(
                [
                    _detail_column("⌕", "Situação observada", [category["observed"]]),
                    _detail_column(
                        "i",
                        "Principais evidências",
                        _evidence_lines(category),
                        as_list=True,
                    ),
                    html.Div(
                        [
                            html.Div(
                                [html.Span("▱"), html.Span("Indicadores relacionados")],
                                className="diagnostic-column-title",
                            ),
                            html.Div(
                                _indicator_rows(category),
                                className="diagnostic-indicator-list",
                            ),
                        ],
                        className="diagnostic-detail-column diagnostic-related-column",
                    ),
                    _detail_column("▣", "Leitura diagnóstica", [category["reading"]]),
                ],
                className="diagnostic-detail-grid",
            ),
        ],
        className="diagnostic-detail-card",
    )


def _detail_column(icon, title, lines, *, as_list=False):
    content = (
        html.Ul([html.Li(line) for line in lines], className="diagnostic-detail-list")
        if as_list
        else html.Div(
            [html.P(line) for line in lines], className="diagnostic-detail-text"
        )
    )
    return html.Div(
        [
            html.Div(
                [html.Span(icon), html.Span(title)], className="diagnostic-column-title"
            ),
            content,
        ],
        className="diagnostic-detail-column",
    )


def _challenge_rows(categories):
    rows = []
    attention = []
    for category in categories:
        for record in category["attention"]:
            attention.append({**record, "category_key": category["key"]})
    templates = {
        "atendimento": [
            "Ampliar a cobertura em {label}.",
            "Reduzir desigualdades de acesso em {label}.",
            "Priorizar territórios com menor resultado em {label}.",
        ],
        "rendimento": [
            "Reforçar a aprendizagem em {label}.",
            "Acompanhar escolas com menor desempenho em {label}.",
            "Definir metas intermediárias para {label}.",
        ],
        "corpo_docente": [
            "Fortalecer políticas docentes para {label}.",
            "Mapear escolas com maior lacuna em {label}.",
            "Apoiar formação e gestão de equipes em {label}.",
        ],
        "infraestrutura": [
            "Priorizar investimentos em {label}.",
            "Mapear escolas com maior necessidade em {label}.",
            "Integrar manutenção e planejamento para {label}.",
        ],
        "escolaridade_populacao": [
            "Ampliar estratégias para {label}.",
            "Articular busca ativa e continuidade de estudos em {label}.",
            "Acompanhar desigualdades territoriais em {label}.",
        ],
    }
    for index, record in enumerate(sorted(attention, key=_distance_value)[:4]):
        options = templates.get(record["category_key"], templates["atendimento"])
        rows.append(options[index % len(options)].format(label=record["label"]))
    return rows or ["Manter o acompanhamento das metas já atingidas."]


def _positive_rows(categories):
    rows = []
    positives = []
    for category in categories:
        positives.extend(category["positive"])
    templates = [
        "Meta alcançada: {label}.",
        "Resultado positivo em {label}.",
        "Avanço consolidado no indicador {label}.",
        "Referência atendida em {label}.",
    ]
    for index, record in enumerate(positives[:4]):
        rows.append(templates[index % len(templates)].format(label=record["label"]))
    return rows or [
        "Município com dados suficientes para orientar o acompanhamento das metas."
    ]


def _bottom_panel(title, icon, rows, accent):
    return html.Div(
        [
            html.Div(
                [
                    html.Span(
                        icon, className="diagnostic-panel-icon", style={"color": accent}
                    ),
                    html.Div(title, className="diagnostic-panel-title"),
                ],
                className="diagnostic-panel-header",
            ),
            html.Div(
                [
                    html.Div(
                        [
                            html.Span(
                                str(index + 1), className="diagnostic-bottom-number"
                            ),
                            html.Span(row, className="diagnostic-bottom-label"),
                        ],
                        className="diagnostic-bottom-row",
                    )
                    for index, row in enumerate(rows)
                ],
                className="diagnostic-bottom-list",
            ),
        ],
        className="diagnostic-bottom-card",
    )


layout = html.Div(
    [
        dcc.Store(id="diagnostic-active-category", data=None),
        dbc.Alert(
            "Selecione um município no filtro acima para visualizar o diagnóstico.",
            id="alert-municipio-diagnostico",
            color="warning",
            class_name="mb-3",
            style=_alert_style(True),
        ),
        html.Div(
            [
                html.Div(
                    [
                        html.H2(
                            "Diagnóstico do Município", className="diagnostic-title"
                        ),
                        html.P(
                            "Síntese dos principais desafios e avanços do PNE 2026-2036, incluindo atendimento, rendimento, corpo docente, infraestrutura escolar e escolaridade da população.",
                            className="diagnostic-subtitle",
                        ),
                    ],
                    className="diagnostic-heading",
                ),
                html.Div(id="diagnostic-summary", className="diagnostic-summary-grid"),
                dbc.Row(
                    [
                        dbc.Col(
                            html.Div(
                                [
                                    html.Div(
                                        "Áreas do diagnóstico",
                                        className="diagnostic-panel-title",
                                    ),
                                    html.Div(
                                        id="diagnostic-area-list",
                                        className="diagnostic-area-list",
                                    ),
                                ],
                                className="diagnostic-area-card",
                            ),
                            md=4,
                            xl=3,
                            className="mb-3",
                        ),
                        dbc.Col(
                            html.Div(id="diagnostic-detail"),
                            md=8,
                            xl=9,
                            className="mb-3",
                        ),
                    ]
                ),
                dbc.Row(
                    [
                        dbc.Col(
                            html.Div(id="diagnostic-challenges"), md=6, className="mb-3"
                        ),
                        dbc.Col(
                            html.Div(id="diagnostic-positives"), md=6, className="mb-3"
                        ),
                    ]
                ),
            ],
            id="diagnostic-content",
            style={"display": "none"},
        ),
    ],
    className="page-section diagnostic-page",
)


@callback(
    Output("diagnostic-active-category", "data"),
    Input({"type": "diagnostic-area", "index": ALL}, "n_clicks"),
    State("diagnostic-active-category", "data"),
    prevent_initial_call=True,
)
def update_active_category(_clicks, active_key):
    if isinstance(ctx.triggered_id, dict):
        return ctx.triggered_id.get("index")
    return active_key


@callback(
    Output("alert-municipio-diagnostico", "style"),
    Output("diagnostic-content", "style"),
    Output("diagnostic-summary", "children"),
    Output("diagnostic-area-list", "children"),
    Output("diagnostic-detail", "children"),
    Output("diagnostic-challenges", "children"),
    Output("diagnostic-positives", "children"),
    Output("diagnostic-active-category", "data", allow_duplicate=True),
    Input("filter-municipio", "value"),
    Input("diagnostic-active-category", "data"),
    prevent_initial_call="initial_duplicate",
)
def update_diagnostic(municipio, active_key):
    if not municipio:
        return _alert_style(True), {"display": "none"}, [], [], "", "", "", None

    categories = _load_diagnostic(municipio)
    if not categories:
        return (
            _alert_style(False),
            {"display": "block"},
            [],
            [],
            dbc.Alert(
                "Não há indicadores disponíveis para gerar o diagnóstico deste município.",
                color="info",
                style={"border": "none", "borderRadius": "12px"},
            ),
            "",
            "",
            None,
        )

    category_keys = {category["key"] for category in categories}
    if active_key not in category_keys:
        active_key = _default_active_category(categories)

    active_category = next(
        category for category in categories if category["key"] == active_key
    )
    return (
        _alert_style(False),
        {"display": "block"},
        _summary_cards(categories),
        _area_rows(categories, active_key),
        _diagnostic_detail(active_category),
        _bottom_panel(
            "Principais desafios identificados",
            "⚑",
            _challenge_rows(categories),
            "#4f46e5",
        ),
        _bottom_panel(
            "Pontos positivos do município", "●", _positive_rows(categories), "#10b981"
        ),
        active_key,
    )
