from dash import html

from src.views.pne_shared import _tracks_goal


def build_category_card(category_key, category, results, is_active, *, card_id_type):
    accent = category["accent"]
    if category.get("summary_mode") == "count":
        primary_value = str(len(category["items"]))
        secondary_value = category.get("summary_text", "indicadores")
        total = None
    else:
        total = sum(1 for item in category["items"] if _tracks_goal(item))
        atingidas = sum(
            1
            for item in category["items"]
            if _tracks_goal(item, results.get(item["key"], {}))
            and results.get(item["key"], {}).get("atingida")
        )
        primary_value = str(atingidas)
        secondary_value = "metas atingidas"

    ratio_node = (
        html.Div(
            [
                html.Span(
                    primary_value,
                    style={
                        "fontSize": "1.75rem",
                        "fontWeight": "800",
                        "lineHeight": "1",
                        "color": accent,
                    },
                ),
                html.Span(
                    f" / {total}",
                    style={
                        "fontSize": "1.28rem",
                        "fontWeight": "700",
                        "lineHeight": "1",
                        "color": "#64748b",
                    },
                ),
            ],
            style={
                "display": "flex",
                "alignItems": "baseline",
                "gap": "4px",
                "marginTop": "2px",
            },
        )
        if total is not None
        else html.Div(
            primary_value,
            style={
                "fontSize": "1.75rem",
                "fontWeight": "800",
                "lineHeight": "1",
                "color": accent,
                "marginTop": "2px",
            },
        )
    )

    return html.Div(
        [
            html.Div(
                category["icon"],
                style={
                    "width": "50px",
                    "height": "50px",
                    "borderRadius": "16px",
                    "display": "flex",
                    "alignItems": "center",
                    "justifyContent": "center",
                    "fontSize": "1.35rem",
                    "background": f"linear-gradient(135deg, {accent}, color-mix(in srgb, {accent} 60%, #ffffff))",
                    "boxShadow": f"0 12px 24px color-mix(in srgb, {accent} 18%, transparent)",
                    "color": "#ffffff",
                },
            ),
            html.Div(
                [
                    html.Div(
                        category["label"],
                        style={
                            "fontSize": "0.92rem",
                            "fontWeight": "700",
                            "color": "#0f172a",
                        },
                    ),
                    ratio_node,
                    html.Div(
                        secondary_value,
                        style={
                            "fontSize": "0.76rem",
                            "fontWeight": "600",
                            "color": "#64748b",
                            "marginTop": "2px",
                        },
                    ),
                ],
                style={"flex": "1"},
            ),
            html.Div(
                style={
                    "height": "6px",
                    "borderRadius": "999px",
                    "background": f"linear-gradient(90deg, {accent}, color-mix(in srgb, {accent} 20%, #ffffff))",
                    "marginTop": "8px",
                    "gridColumn": "1 / -1",
                }
            ),
        ],
        id={"type": card_id_type, "index": category_key},
        n_clicks=0,
        className="pne-dashboard-category-card",
        style={
            "flex": "1 1 240px",
            "minWidth": "230px",
            "background": "#ffffff",
            "padding": "12px 12px 8px 12px",
            "borderRadius": "16px",
            "border": (
                f"1px solid color-mix(in srgb, {accent} 45%, #dbe3f0)"
                if is_active
                else "1px solid #e4e9f1"
            ),
            "boxShadow": (
                f"0 18px 36px color-mix(in srgb, {accent} 10%, transparent)"
                if is_active
                else "0 6px 18px rgba(15, 23, 42, 0.05)"
            ),
            "display": "grid",
            "gridTemplateColumns": "50px 1fr",
            "columnGap": "12px",
            "cursor": "pointer",
            "transition": "transform 0.15s ease, box-shadow 0.15s ease",
        },
    )


def build_sidebar_item(idx, item, result, accent, *, item_id_type, is_active=False):
    border_color = (
        "color-mix(in srgb, #dbe3f0 82%, #ffffff)" if not is_active else accent
    )
    background = f"color-mix(in srgb, {accent} 5%, #ffffff)" if is_active else "#ffffff"

    if result.get("available"):
        if not _tracks_goal(item, result):
            badge = "Info"
            badge_fg = "#2563eb"
            badge_bg = "#e8f0ff"
        else:
            badge = "OK" if result["atingida"] else "Atenção"
            badge_fg = "#087f3f" if result["atingida"] else "#ea580c"
            badge_bg = "#dcf7e9" if result["atingida"] else "#ffedd5"
    else:
        if _tracks_goal(item, result):
            badge = "Atenção"
            badge_fg = "#ea580c"
            badge_bg = "#ffedd5"
        else:
            badge = "Info"
            badge_fg = "#2563eb"
            badge_bg = "#e8f0ff"

    return html.Div(
        [
            html.Div(
                str(idx + 1),
                style={
                    "width": "28px",
                    "height": "28px",
                    "borderRadius": "50%",
                    "display": "flex",
                    "alignItems": "center",
                    "justifyContent": "center",
                    "background": f"color-mix(in srgb, {accent} 14%, #ffffff)",
                    "fontSize": "0.78rem",
                    "fontWeight": "900",
                    "color": accent,
                    "flexShrink": "0",
                },
            ),
            html.Div(
                [
                    html.Div(
                        item["label"],
                        style={
                            "fontSize": "0.74rem",
                            "fontWeight": "650",
                            "color": "#0f172a",
                            "lineHeight": "1.22",
                        },
                    ),
                ]
                + (
                    [
                        html.Div(
                            item["sub"],
                            style={
                                "fontSize": "0.64rem",
                                "fontWeight": "600",
                                "color": "#64748b",
                                "marginTop": "1px",
                            },
                        )
                    ]
                    if item["sub"]
                    else []
                ),
                style={"flex": "1", "minWidth": "0"},
            ),
            html.Div(
                badge,
                style={
                    "minWidth": "36px",
                    "height": "24px",
                    "padding": "0 8px",
                    "borderRadius": "999px",
                    "display": "flex",
                    "alignItems": "center",
                    "justifyContent": "center",
                    "background": badge_bg,
                    "color": badge_fg,
                    "fontSize": "0.64rem",
                    "fontWeight": "850",
                    "flexShrink": "0",
                },
            ),
        ],
        id={"type": item_id_type, "index": item["key"]},
        n_clicks=0,
        className="pne-dashboard-sidebar-item",
        style={
            "display": "grid",
            "gridTemplateColumns": "32px minmax(0, 1fr) auto",
            "alignItems": "center",
            "gap": "8px",
            "padding": "8px 10px",
            "borderRadius": "10px",
            "border": f"1px solid {border_color}",
            "background": background,
            "cursor": "pointer",
            "boxShadow": "0 5px 14px rgba(15, 23, 42, 0.035)",
            "marginBottom": "0",
            "minHeight": "50px",
            "height": "100%",
        },
    )


def build_stat_cell(label, value, color="#475569"):
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


def build_detail_unavailable_panel(accent, title, description, order_index, total):
    return html.Div(
        [
            html.Div(
                f"Indicador {order_index} de {total}",
                style={
                    "fontSize": "0.76rem",
                    "fontWeight": "700",
                    "color": accent,
                    "marginBottom": "8px",
                },
            ),
            html.Div(
                title,
                style={
                    "fontSize": "1.35rem",
                    "fontWeight": "800",
                    "color": "#0f172a",
                    "marginBottom": "4px",
                },
            ),
            html.Div(
                description,
                style={
                    "fontSize": "0.88rem",
                    "color": "#64748b",
                    "lineHeight": "1.5",
                    "marginBottom": "18px",
                },
            ),
            html.Div(
                "Não há dados suficientes para exibir esse indicador no município selecionado.",
                style={
                    "padding": "22px",
                    "borderRadius": "14px",
                    "background": "#f8fafc",
                    "border": "1px dashed #cbd5e1",
                    "color": "#475569",
                    "fontWeight": "600",
                },
            ),
        ],
        style={
            "background": "#ffffff",
            "borderRadius": "20px",
            "border": "1px solid #e4e9f1",
            "padding": "24px",
            "boxShadow": "0 14px 32px rgba(15, 23, 42, 0.05)",
        },
    )


def build_detail_header(accent, title, description, order_index, total, status):
    return html.Div(
        [
            html.Div(
                [
                    html.Div(
                        f"Indicador {order_index} de {total}",
                        style={
                            "fontSize": "0.78rem",
                            "fontWeight": "700",
                            "color": accent,
                            "marginBottom": "6px",
                        },
                    ),
                    html.Div(
                        title,
                        style={
                            "fontSize": "1.18rem",
                            "fontWeight": "800",
                            "color": "#0f172a",
                            "lineHeight": "1.15",
                        },
                    ),
                    html.Div(
                        description,
                        style={
                            "fontSize": "0.81rem",
                            "color": "#64748b",
                            "lineHeight": "1.45",
                            "marginTop": "4px",
                        },
                    ),
                ],
                style={"flex": "1"},
            ),
            html.Div(
                status["text"],
                style={
                    "padding": "7px 14px",
                    "borderRadius": "999px",
                    "fontSize": "0.74rem",
                    "fontWeight": "800",
                    "whiteSpace": "nowrap",
                    "background": f"color-mix(in srgb, {status['bg']} 14%, #ffffff)",
                    "color": status["fg"],
                    "border": f"1px solid color-mix(in srgb, {status['bg']} 26%, #dbe3f0)",
                },
            ),
        ],
        style={
            "display": "flex",
            "justifyContent": "space-between",
            "alignItems": "flex-start",
            "gap": "18px",
            "marginBottom": "14px",
            "flexWrap": "wrap",
        },
    )


def build_detail_value_node(
    year, value, size, *, color, center=False, text_align="center"
):
    return html.Div(
        [
            html.Div(
                str(year) if year is not None else "-",
                style={
                    "fontSize": "0.76rem",
                    "fontWeight": "700",
                    "color": "#64748b",
                    "marginBottom": "8px",
                },
            ),
            html.Div(
                value,
                style={
                    "fontSize": size,
                    "fontWeight": "900",
                    "color": color,
                    "lineHeight": "1",
                    "letterSpacing": "-0.04em",
                },
            ),
        ],
        style={
            "minWidth": "102px",
            "textAlign": text_align,
            "margin": "0 auto" if center else "0",
        },
    )


def build_detail_value_band(
    start_node=None,
    timeline_node=None,
    end_node=None,
    *,
    columns,
    margin_bottom="14px",
    center_single=False,
):
    if (
        start_node is None
        and timeline_node is None
        and end_node is not None
        and center_single
    ):
        return html.Div(
            [end_node],
            className="pne-dashboard-detail-value-band",
            style={
                "display": "flex",
                "justifyContent": "center",
                "alignItems": "flex-end",
                "marginBottom": margin_bottom,
            },
        )

    children = []

    if start_node is not None:
        start_slot_style = {
            "gridColumn": "1 / 2",
            "display": "flex",
            "flexDirection": "column",
            "justifyContent": "flex-start",
            "alignItems": "flex-end",
            "alignSelf": "stretch",
            "paddingTop": "40px",
        }
        if columns == 4:
            start_slot_style["transform"] = "translateX(10px)"
            start_slot_style["zIndex"] = "2"
        children.append(
            html.Div(
                start_node,
                className="pne-dashboard-detail-value-slot pne-dashboard-detail-value-slot-start",
                style=start_slot_style,
            )
        )

    if timeline_node is not None:
        if start_node is not None:
            timeline_column = "2 / 4" if columns == 4 else "2 / 3"
        else:
            timeline_column = f"1 / {columns}"

        children.append(
            html.Div(
                timeline_node,
                className="pne-dashboard-detail-value-slot pne-dashboard-detail-timeline-slot",
                style={
                    "gridColumn": timeline_column,
                    "display": "flex",
                    "flexDirection": "column",
                    "justifyContent": "center",
                    "alignItems": "flex-end",
                    "alignSelf": "stretch",
                    "width": "100%",
                    "minWidth": "0",
                },
            )
        )

    if end_node is not None:
        end_slot_style = {
            "gridColumn": f"{columns} / {columns + 1}",
            "display": "flex",
            "flexDirection": "column",
            "justifyContent": "flex-start",
            "alignItems": "flex-start",
            "alignSelf": "stretch",
            "paddingTop": "40px",
        }
        if columns == 4:
            end_slot_style["transform"] = "translateX(-10px)"
            end_slot_style["zIndex"] = "2"
        children.append(
            html.Div(
                end_node,
                className="pne-dashboard-detail-value-slot pne-dashboard-detail-value-slot-end",
                style=end_slot_style,
            )
        )

    return html.Div(
        children,
        className="pne-dashboard-detail-value-band",
        style={
            "display": "grid",
            "gridTemplateColumns": (
                "minmax(118px, 0.5fr) minmax(0, 1.85fr) "
                "minmax(0, 1.85fr) minmax(118px, 0.5fr)"
                if columns == 4
                else "minmax(112px, 0.72fr) minmax(0, 3fr) minmax(112px, 0.72fr)"
                if columns == 3
                else f"repeat({columns}, minmax(0, 1fr))"
            ),
            "columnGap": "6px" if columns == 4 else "12px",
            "rowGap": "12px",
            "alignItems": "stretch",
            "marginBottom": margin_bottom,
            "width": "100%",
        },
    )


def build_detail_metrics_grid(metrics, columns, *, margin_bottom=None):
    style = {
        "display": "grid",
        "gridTemplateColumns": f"repeat({columns}, minmax(0, 1fr))",
        "gap": "1px",
        "background": "#e2e8f0",
        "borderRadius": "14px",
        "overflow": "hidden",
    }
    if margin_bottom is not None:
        style["marginBottom"] = margin_bottom
    return html.Div(metrics, style=style)


def build_detail_explanation_box(text, *, margin_top="8px"):
    return html.Div(
        [
            html.Div(
                "O que isso significa?",
                style={
                    "fontSize": "0.84rem",
                    "fontWeight": "800",
                    "color": "#0f172a",
                    "marginBottom": "6px",
                },
            ),
            html.Div(
                text,
                style={
                    "fontSize": "0.84rem",
                    "lineHeight": "1.6",
                    "color": "#475569",
                },
            ),
        ],
        style={
            "background": "linear-gradient(180deg, #f8fbff 0%, #f7f9fd 100%)",
            "borderRadius": "14px",
            "padding": "12px 14px",
            "border": "1px solid #edf2f7",
            "marginTop": margin_top,
        },
    )


def build_detail_card(children):
    return html.Div(
        children,
        className="pne-dashboard-detail-card",
        style={
            "background": "#ffffff",
            "borderRadius": "18px",
            "border": "1px solid #e4e9f1",
            "padding": "14px 16px",
            "boxShadow": "0 12px 28px rgba(15, 23, 42, 0.05)",
            "height": "100%",
            "display": "flex",
            "flexDirection": "column",
            "justifyContent": "space-between",
        },
    )
