from urllib.parse import quote

import pandas as pd
from dash import html

GOAL_AT_LEAST = "at_least"
GOAL_AT_MOST = "at_most"
DISPLAY_DECIMALS = 1


def _display_rounded(value):
    if value is None or pd.isna(value):
        return None
    rounded = round(float(value), DISPLAY_DECIMALS)
    return 0.0 if rounded == 0 else rounded


def _goal_achieved(distance):
    rounded_distance = _display_rounded(distance)
    return rounded_distance is not None and rounded_distance >= 0


def _fmt_number(value, pattern=",.1f"):
    if value is None or pd.isna(value):
        return "-"
    formatted = f"{float(value):{pattern}}"
    if formatted.startswith("-") and set(
        formatted[1:].replace(",", "").replace(".", "")
    ) <= {"0"}:
        formatted = formatted[1:]
    return formatted.replace(",", "X").replace(".", ",").replace("X", ".")


def _fmt_percent(value):
    if value is None or pd.isna(value):
        return "-"
    return f"{_fmt_number(value)}%"


def _fmt_signed_pp(value):
    if value is None or pd.isna(value):
        return "-"
    prefix = "+" if float(value) > 0 else ""
    return f"{prefix}{_fmt_number(value)} p.p."


def _fmt_signed_number(value):
    if value is None or pd.isna(value):
        return "-"
    prefix = "+" if float(value) > 0 else ""
    return f"{prefix}{_fmt_number(value)}"


def _fmt_years(value):
    if value is None or pd.isna(value):
        return "-"
    return f"{_fmt_number(value)} anos"


def _fmt_signed_years(value):
    if value is None or pd.isna(value):
        return "-"
    prefix = "+" if float(value) > 0 else ""
    return f"{prefix}{_fmt_number(value)} anos"


def _value_mode(item):
    return item.get("value_mode", "percent")


def _format_metric_value(item, value):
    mode = _value_mode(item)
    if mode == "count":
        return _fmt_number(value, ",.0f")
    if mode == "index":
        return _fmt_number(value)
    if mode == "years":
        return _fmt_years(value)
    return _fmt_percent(value)


def _format_metric_distance(item, value):
    mode = _value_mode(item)
    if mode == "count":
        return _fmt_number(value, ",.0f")
    if mode == "index":
        return _fmt_signed_number(value)
    if mode == "years":
        return _fmt_signed_years(value)
    return _fmt_signed_pp(value)


def _empty_result(
    meta,
    direction=GOAL_AT_LEAST,
    meta_label="Meta de referência",
    tracks_goal=True,
):
    return {
        "available": False,
        "meta": meta,
        "meta_label": meta_label,
        "direction": direction,
        "start_year": None,
        "end_year": None,
        "start_value": None,
        "end_value": None,
        "raw_delta": None,
        "progress_delta": None,
        "distance": None,
        "atingida": False,
        "tracks_goal": tracks_goal,
    }


def _safe_load(loader):
    try:
        return loader()
    except Exception as exc:
        print(f"Erro ao carregar dados do painel PNE: {exc}")
        return pd.DataFrame()


def _prepare_yearly_series(df):
    if df.empty or "ano" not in df.columns or "valor" not in df.columns:
        return pd.DataFrame(columns=["ano", "valor"])

    dff = df.copy()
    dff["ano"] = pd.to_numeric(dff["ano"], errors="coerce")
    dff["valor"] = pd.to_numeric(dff["valor"], errors="coerce")
    dff = dff.dropna(subset=["ano", "valor"]).copy()
    if dff.empty:
        return pd.DataFrame(columns=["ano", "valor"])

    dff["ano"] = dff["ano"].astype(int)
    dff = (
        dff.groupby("ano", as_index=False)["valor"]
        .mean()
        .sort_values("ano")
        .reset_index(drop=True)
    )
    return dff


def _select_reference_rows(df, target_start_year, target_end_year):
    if df.empty:
        return None, None

    start_row = df[df["ano"] == target_start_year]
    if start_row.empty:
        start_row = df[df["ano"] >= target_start_year]
    if start_row.empty:
        start_row = df.head(1)
    else:
        start_row = start_row.head(1)

    end_row = df[df["ano"] == target_end_year]
    if end_row.empty:
        end_row = df[df["ano"] <= target_end_year]
    if end_row.empty:
        end_row = df.tail(1)
    else:
        end_row = end_row.tail(1)

    if start_row.empty or end_row.empty:
        return None, None

    if int(start_row.iloc[0]["ano"]) > int(end_row.iloc[0]["ano"]):
        start_row = df.head(1)
        end_row = df.tail(1)

    if len(df) > 1 and int(start_row.iloc[0]["ano"]) == int(end_row.iloc[0]["ano"]):
        start_row = df.head(1)
        end_row = df.tail(1)

    return start_row.iloc[0], end_row.iloc[0]


def _build_result(
    df,
    meta,
    *,
    direction=GOAL_AT_LEAST,
    meta_label="Meta de referência",
    target_start_year,
    target_end_year,
    tracks_goal=True,
):
    result = _empty_result(
        meta,
        direction=direction,
        meta_label=meta_label,
        tracks_goal=tracks_goal,
    )
    series = _prepare_yearly_series(df)
    start_row, end_row = _select_reference_rows(
        series,
        target_start_year=target_start_year,
        target_end_year=target_end_year,
    )

    if start_row is None or end_row is None:
        return result

    start_value = float(start_row["valor"])
    end_value = float(end_row["valor"])
    raw_delta = end_value - start_value
    progress_delta = raw_delta if direction == GOAL_AT_LEAST else -raw_delta
    distance = end_value - meta if direction == GOAL_AT_LEAST else meta - end_value
    series_window = (
        series[
            (series["ano"] >= int(start_row["ano"]))
            & (series["ano"] <= int(end_row["ano"]))
        ]
        .copy()
        .reset_index(drop=True)
    )
    series_points = [
        {"ano": int(row["ano"]), "valor": float(row["valor"])}
        for _, row in series_window.iterrows()
    ]

    return {
        "available": True,
        "meta": meta,
        "meta_label": meta_label,
        "direction": direction,
        "start_year": int(start_row["ano"]),
        "end_year": int(end_row["ano"]),
        "start_value": start_value,
        "end_value": end_value,
        "raw_delta": raw_delta,
        "progress_delta": progress_delta,
        "distance": distance,
        "atingida": _goal_achieved(distance),
        "series": series_points,
        "tracks_goal": tracks_goal,
    }


def _build_ratio_result(
    loader,
    municipio,
    *,
    numerator,
    denominator,
    meta,
    meta_label="Meta de referência",
    direction=GOAL_AT_LEAST,
    num_agg="sum",
    den_agg="sum",
    filters=None,
    target_start_year,
    target_end_year,
):
    df = _safe_load(loader)
    if df.empty or "municipio" not in df.columns:
        return _empty_result(meta, direction=direction, meta_label=meta_label)

    dff = df[df["municipio"] == municipio].copy()
    if filters:
        for column, value in filters.items():
            if column not in dff.columns:
                return _empty_result(meta, direction=direction, meta_label=meta_label)
            dff = dff[dff[column] == value]

    if dff.empty or numerator not in dff.columns or denominator not in dff.columns:
        return _empty_result(meta, direction=direction, meta_label=meta_label)

    yearly = (
        dff.groupby("ano", as_index=False)
        .agg({numerator: num_agg, denominator: den_agg})
        .copy()
    )
    yearly[numerator] = pd.to_numeric(yearly[numerator], errors="coerce")
    yearly[denominator] = pd.to_numeric(yearly[denominator], errors="coerce")
    yearly["valor"] = (
        yearly[numerator]
        .div(yearly[denominator].where(yearly[denominator] != 0, pd.NA))
        .fillna(0)
        .mul(100)
    )
    return _build_result(
        yearly[["ano", "valor"]],
        meta,
        direction=direction,
        meta_label=meta_label,
        target_start_year=target_start_year,
        target_end_year=target_end_year,
    )


def _build_value_result(
    loader,
    municipio,
    *,
    value_column,
    meta,
    meta_label="Meta de referência",
    direction=GOAL_AT_LEAST,
    filters=None,
    target_start_year,
    target_end_year,
):
    df = _safe_load(loader)
    if df.empty or "municipio" not in df.columns or value_column not in df.columns:
        return _empty_result(meta, direction=direction, meta_label=meta_label)

    dff = df[df["municipio"] == municipio].copy()
    if filters:
        for column, value in filters.items():
            if column not in dff.columns:
                return _empty_result(meta, direction=direction, meta_label=meta_label)
            dff = dff[dff[column] == value]

    if dff.empty:
        return _empty_result(meta, direction=direction, meta_label=meta_label)

    dff[value_column] = pd.to_numeric(dff[value_column], errors="coerce")
    dff = dff.dropna(subset=[value_column]).copy()
    if dff.empty:
        return _empty_result(meta, direction=direction, meta_label=meta_label)

    yearly = (
        dff.groupby("ano", as_index=False)[value_column]
        .mean()
        .rename(columns={value_column: "valor"})
    )
    return _build_result(
        yearly,
        meta,
        direction=direction,
        meta_label=meta_label,
        target_start_year=target_start_year,
        target_end_year=target_end_year,
    )


def _build_accumulated_growth_result(
    loader,
    municipio,
    *,
    value_column,
    meta,
    meta_label="Meta de referência",
    direction=GOAL_AT_LEAST,
    filters=None,
    value_agg="sum",
    base_year,
    target_start_year,
    target_end_year,
):
    df = _safe_load(loader)
    if df.empty or "municipio" not in df.columns or value_column not in df.columns:
        return _empty_result(meta, direction=direction, meta_label=meta_label)

    dff = df[df["municipio"] == municipio].copy()
    if filters:
        for column, value in filters.items():
            if column not in dff.columns:
                return _empty_result(meta, direction=direction, meta_label=meta_label)
            if isinstance(value, (list, tuple, set, frozenset)):
                dff = dff[dff[column].isin(value)]
            else:
                dff = dff[dff[column] == value]

    if dff.empty:
        return _empty_result(meta, direction=direction, meta_label=meta_label)

    yearly = dff.groupby("ano", as_index=False).agg({value_column: value_agg}).copy()
    yearly[value_column] = pd.to_numeric(yearly[value_column], errors="coerce")
    yearly = (
        yearly.dropna(subset=[value_column]).sort_values("ano").reset_index(drop=True)
    )
    if yearly.empty:
        return _empty_result(meta, direction=direction, meta_label=meta_label)

    base_rows = yearly[(yearly["ano"] >= base_year) & (yearly[value_column] > 0)].copy()
    if base_rows.empty:
        base_rows = yearly[yearly[value_column] > 0].copy()
    if base_rows.empty:
        base_rows = yearly.head(1)

    base_value = float(base_rows.iloc[0][value_column]) if not base_rows.empty else 0.0
    if base_value <= 0:
        return _empty_result(meta, direction=direction, meta_label=meta_label)

    base_reference_year = int(base_rows.iloc[0]["ano"])
    yearly = yearly[yearly["ano"] >= base_reference_year].copy()
    yearly["valor"] = yearly[value_column].div(base_value).sub(1.0).mul(100.0)
    result = _build_result(
        yearly[["ano", "valor"]],
        meta,
        direction=direction,
        meta_label=meta_label,
        target_start_year=base_reference_year,
        target_end_year=target_end_year,
    )
    result["base_year"] = base_reference_year
    return result


def _status_theme(result):
    if not result.get("available"):
        return {
            "text": "Sem dados suficientes",
            "fg": "#64748b",
            "bg": "#e2e8f0",
        }

    if not result.get("tracks_goal", True):
        return {
            "text": "Visualização informativa",
            "fg": "#2563eb",
            "bg": "#93c5fd",
        }

    if result["atingida"]:
        return {
            "text": "Meta atingida",
            "fg": "#10b981",
            "bg": "#10b981",
        }

    return {
        "text": "Meta não atingida",
        "fg": "#f59e0b",
        "bg": "#f59e0b",
    }


def _tracks_goal(item, result=None):
    if result is not None and "tracks_goal" in result:
        return bool(result.get("tracks_goal", True))
    return bool(item.get("tracks_goal", True))


def _has_time_comparison(result):
    if not result or not result.get("available"):
        return False
    start_year = result.get("start_year")
    end_year = result.get("end_year")
    if start_year is None or end_year is None:
        return False
    return int(start_year) != int(end_year)


_TIMELINE_SVG_WIDTH = 760
_TIMELINE_SVG_HEIGHT = 150
_TIMELINE_X_START = 14
_TIMELINE_X_END = 746
_TIMELINE_BASELINE_Y = 118
_TIMELINE_CHART_HEIGHT = 92


def _timeline_geometry(result):
    series = result.get("series") or []
    start_value = result.get("start_value")
    end_value = result.get("end_value")
    meta_value = result.get("meta")
    chart_points = [
        {"ano": int(point["ano"]), "valor": float(point["valor"])}
        for point in series
        if point.get("ano") is not None and point.get("valor") is not None
    ]
    if not chart_points and start_value is not None and end_value is not None:
        chart_points = [
            {"ano": int(result["start_year"]), "valor": float(start_value)},
            {"ano": int(result["end_year"]), "valor": float(end_value)},
        ]
    values = [
        float(value)
        for value in ([point["valor"] for point in chart_points] + [meta_value])
        if value is not None and not pd.isna(value)
    ]
    if not values:
        values = [0.0, 100.0]

    min_value = min(values)
    max_value = max(values)
    span = max(max_value - min_value, 8.0)
    floor = max(0.0, min_value - span * 0.28)
    ceiling = max_value + span * 0.24

    def project_y(value):
        ratio = 0.5 if ceiling == floor else (float(value) - floor) / (ceiling - floor)
        ratio = max(0.0, min(1.0, ratio))
        return _TIMELINE_BASELINE_Y - ratio * _TIMELINE_CHART_HEIGHT

    total_points = max(len(chart_points), 1)
    step = (
        0
        if total_points == 1
        else (_TIMELINE_X_END - _TIMELINE_X_START) / (total_points - 1)
    )
    projected_points = []
    for idx, point in enumerate(chart_points):
        projected_points.append(
            {
                "ano": point["ano"],
                "valor": point["valor"],
                "x": _TIMELINE_X_START + step * idx,
                "y": project_y(point["valor"]),
            }
        )
    if not projected_points:
        projected_points = [
            {
                "x": _TIMELINE_X_START,
                "y": project_y(0),
                "ano": result.get("start_year"),
                "valor": 0.0,
            }
        ]

    return {
        "chart_points": chart_points,
        "projected_points": projected_points,
        "baseline_y": _TIMELINE_BASELINE_Y,
        "x_start": _TIMELINE_X_START,
        "x_end": _TIMELINE_X_END,
        "width": _TIMELINE_SVG_WIDTH,
        "height": _TIMELINE_SVG_HEIGHT,
    }


def _timeline_svg_data_uri(result, accent):
    geometry = _timeline_geometry(result)
    projected_points = geometry["projected_points"]
    baseline_y = geometry["baseline_y"]
    x_start = geometry["x_start"]
    x_end = geometry["x_end"]
    width = geometry["width"]
    height = geometry["height"]

    def build_smooth_path(points):
        if len(points) <= 1:
            point = points[0]
            return f"M {point['x']:.1f} {point['y']:.1f}"
        if len(points) == 2:
            return (
                f"M {points[0]['x']:.1f} {points[0]['y']:.1f} "
                f"L {points[1]['x']:.1f} {points[1]['y']:.1f}"
            )

        path_parts = [f"M {points[0]['x']:.1f} {points[0]['y']:.1f}"]
        for idx in range(len(points) - 1):
            current = points[idx]
            nxt = points[idx + 1]
            prev = points[idx - 1] if idx > 0 else current
            after = points[idx + 2] if idx + 2 < len(points) else nxt
            cp1x = current["x"] + (nxt["x"] - prev["x"]) / 6
            cp1y = current["y"] + (nxt["y"] - prev["y"]) / 6
            cp2x = nxt["x"] - (after["x"] - current["x"]) / 6
            cp2y = nxt["y"] - (after["y"] - current["y"]) / 6
            path_parts.append(
                f"C {cp1x:.1f} {cp1y:.1f}, {cp2x:.1f} {cp2y:.1f}, {nxt['x']:.1f} {nxt['y']:.1f}"
            )
        return " ".join(path_parts)

    line_path = build_smooth_path(projected_points)
    area_path = (
        f"{line_path} "
        f"L {projected_points[-1]['x']:.1f} {baseline_y:.1f} "
        f"L {projected_points[0]['x']:.1f} {baseline_y:.1f} Z"
    )
    fill_top = min(point["y"] for point in projected_points)
    start_point = projected_points[0]
    end_point = projected_points[-1]
    intermediate_circles = "\n".join(
        f'<circle cx="{point["x"]:.1f}" cy="{point["y"]:.1f}" r="3.4" fill="{accent}" fill-opacity="0.28"/>'
        for point in projected_points[1:-1]
    )

    svg = f"""
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {width} {height}" fill="none">
  <defs>
    <linearGradient id="lineGradient" x1="{start_point["x"]:.1f}" y1="{start_point["y"]:.1f}" x2="{end_point["x"]:.1f}" y2="{end_point["y"]:.1f}" gradientUnits="userSpaceOnUse">
      <stop offset="0%" stop-color="{accent}" stop-opacity="0.92"/>
      <stop offset="100%" stop-color="{accent}" stop-opacity="1"/>
    </linearGradient>
    <linearGradient id="areaGradient" x1="0" y1="{fill_top}" x2="0" y2="{baseline_y}" gradientUnits="userSpaceOnUse">
      <stop offset="0%" stop-color="{accent}" stop-opacity="0.18"/>
      <stop offset="100%" stop-color="{accent}" stop-opacity="0.02"/>
    </linearGradient>
    <filter id="endGlow" x="-50%" y="-50%" width="200%" height="200%">
      <feDropShadow dx="0" dy="6" stdDeviation="8" flood-color="{accent}" flood-opacity="0.18"/>
    </filter>
  </defs>

  <path d="M {x_start} {baseline_y} L {x_end} {baseline_y}" stroke="#e5e7eb" stroke-width="2" stroke-linecap="round"/>
  <path d="{area_path}" fill="url(#areaGradient)"/>
  <path d="{line_path}" stroke="url(#lineGradient)" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"/>
  {intermediate_circles}
  <circle cx="{start_point["x"]:.1f}" cy="{start_point["y"]:.1f}" r="7" fill="white" stroke="{accent}" stroke-width="3"/>
  <circle cx="{end_point["x"]:.1f}" cy="{end_point["y"]:.1f}" r="9" fill="{accent}" filter="url(#endGlow)"/>
</svg>
"""
    return f"data:image/svg+xml;utf8,{quote(svg)}"


def _timeline_hover_label(point):
    value = point.get("valor")
    if value is None or pd.isna(value):
        formatted_value = "-"
    else:
        numeric_value = float(value)
        pattern = (
            ",.0f"
            if numeric_value.is_integer() and abs(numeric_value) >= 1000
            else ",.1f"
        )
        formatted_value = _fmt_number(numeric_value, pattern)
    return f"{point.get('ano', '-')}: {formatted_value}"


def _timeline_tooltip(point, accent):
    label = _timeline_hover_label(point)
    year, _, value = label.partition(": ")
    return html.Div(
        [
            html.Div(year, className="pne-dashboard-timeline-tooltip-year"),
            html.Div(value, className="pne-dashboard-timeline-tooltip-value"),
        ],
        className="pne-dashboard-timeline-tooltip",
        style={
            "position": "absolute",
            "left": "50%",
            "bottom": "calc(100% + 10px)",
            "transform": "translate(-50%, 8px)",
            "minWidth": "90px",
            "padding": "8px 10px",
            "borderRadius": "12px",
            "background": "rgba(255, 255, 255, 0.98)",
            "border": "1px solid #dbe3f0",
            "borderTop": f"3px solid {accent}",
            "boxShadow": "0 16px 32px rgba(15, 23, 42, 0.12), 0 6px 16px rgba(15, 23, 42, 0.08)",
            "opacity": "0",
            "pointerEvents": "none",
            "transition": "opacity 0.16s ease, transform 0.16s ease",
            "backdropFilter": "blur(10px)",
            "textAlign": "center",
            "zIndex": "6",
            "whiteSpace": "nowrap",
        },
    )


def _timeline_visual(result, accent):
    geometry = _timeline_geometry(result)
    hover_points = [
        html.Div(
            [
                html.Div(className="pne-dashboard-timeline-hit-area"),
                _timeline_tooltip(point, accent),
            ],
            className="pne-dashboard-timeline-hotspot",
            title=_timeline_hover_label(point),
            style={
                "position": "absolute",
                "left": f"{(point['x'] / geometry['width']) * 100:.3f}%",
                "top": f"{(point['y'] / geometry['height']) * 100:.3f}%",
                "width": "34px",
                "height": "34px",
                "transform": "translate(-50%, -50%)",
                "cursor": "pointer",
                "zIndex": "2",
            },
        )
        for point in geometry["projected_points"]
    ]

    return html.Div(
        [
            html.Div(
                [
                    html.Img(
                        src=_timeline_svg_data_uri(result, accent),
                        alt="Evolução do indicador",
                        style={
                            "display": "block",
                            "width": "100%",
                            "height": f"{geometry['height']}px",
                        },
                    ),
                    html.Div(
                        hover_points,
                        className="pne-dashboard-timeline-overlay",
                        style={
                            "position": "absolute",
                            "inset": "0",
                            "overflow": "visible",
                        },
                    ),
                ],
                className="pne-dashboard-mini-timeline",
                style={
                    "position": "relative",
                    "width": "100%",
                    "height": f"{geometry['height']}px",
                    "overflow": "visible",
                },
            )
        ],
        className="pne-dashboard-timeline-shell",
        style={
            "display": "flex",
            "alignItems": "center",
            "justifyContent": "center",
            "flex": "1",
            "minWidth": "0",
            "width": "100%",
            "maxWidth": "100%",
            "margin": "0 auto",
        },
    )


def _variation_text(result, item=None):
    delta = result.get("raw_delta")
    if delta is None:
        return "-"
    if item is not None and _value_mode(item) == "count":
        if delta > 0:
            return f"Alta de {_fmt_number(delta, ',.0f')}"
        if delta < 0:
            return f"Queda de {_fmt_number(abs(delta), ',.0f')}"
        return "Sem variação"
    if item is not None and _value_mode(item) == "years":
        if delta > 0:
            return f"Alta de {_fmt_number(delta)} anos"
        if delta < 0:
            return f"Queda de {_fmt_number(abs(delta))} anos"
        return "Sem variação"
    if item is not None and _value_mode(item) == "index":
        if delta > 0:
            return f"Alta de {_fmt_number(delta)}"
        if delta < 0:
            return f"Queda de {_fmt_number(abs(delta))}"
        return "Sem variaÃ§Ã£o"
    if delta > 0:
        return f"Alta de {_fmt_number(delta)} p.p."
    if delta < 0:
        return f"Queda de {_fmt_number(abs(delta))} p.p."
    return "Sem variação"


def _interpretation(item, result):
    if not result.get("available"):
        return (
            "Não foi possível montar a comparação desse indicador com os dados "
            "disponíveis para o município selecionado."
        )

    start_value = _format_metric_value(item, result["start_value"])
    end_value = _format_metric_value(item, result["end_value"])
    end_year = result["end_year"]
    start_year = result["start_year"]

    if not _tracks_goal(item, result):
        if _has_time_comparison(result):
            return (
                f"Entre {start_year} e {end_year}, o indicador passou de {start_value} "
                f"para {end_value}. "
                f"A variação no período foi de {_variation_text(result, item).lower()}."
            )
        return f"Em {end_year}, o indicador registrou {end_value}."

    meta_value = _format_metric_value(item, result["meta"])
    distance = _format_metric_distance(item, result["distance"])

    if _value_mode(item) == "years":
        if result["atingida"]:
            return (
                f"Em {end_year}, o município alcançou {end_value} e superou a meta definida "
                f"({meta_value}). O desempenho ficou {distance} acima da referência."
            )
        return (
            f"Em {end_year}, o município chegou a {end_value}, mas não alcançou a "
            f"meta definida ({meta_value}). A distância atual para a referência é de {distance}."
        )

    if result["atingida"]:
        if result["direction"] == GOAL_AT_MOST:
            return (
                f"Em {end_year}, o indicador ficou em {end_value}, abaixo do limite de "
                f"{meta_value}. Em relação a {start_year}, houve melhora no controle do indicador."
            )
        return (
            f"Em {end_year}, o município alcançou {end_value} e superou a meta definida "
            f"({meta_value}). O desempenho ficou {distance} acima da referência."
        )

    if result["direction"] == GOAL_AT_MOST:
        return (
            f"Em {end_year}, o indicador ficou em {end_value}, acima do limite de "
            f"{meta_value}. Ainda faltam {distance.replace('+', '')} para enquadrar o resultado na meta."
        )

    return (
        f"Em {end_year}, o município chegou a {end_value}, mas não alcançou a "
        f"meta definida ({meta_value}). A distância atual para a referência é de {distance}."
    )


def _ranking_card(title, accent, items, metric_key):
    metric_labels = {
        "progress_delta": "Variação no período",
        "distance": "Distância da meta",
    }
    metric_label = metric_labels.get(metric_key, "Indicador")

    if not items:
        rows = [
            html.Div(
                "Nenhum indicador disponível nesta seleção.",
                style={"fontSize": "0.84rem", "color": "#64748b"},
            )
        ]
    else:
        rows = []
        for idx, row in enumerate(items, start=1):
            color = "#10b981" if row[metric_key] >= 0 else "#f43f5e"
            value_mode = row.get("value_mode", "percent")
            metric_value = (
                _fmt_signed_years(row[metric_key])
                if value_mode == "years"
                else _fmt_signed_number(row[metric_key])
                if value_mode == "index"
                else _fmt_signed_pp(row[metric_key])
                if value_mode == "growth_percent" and metric_key == "distance"
                else _fmt_signed_pp(row[metric_key])
            )
            rows.append(
                html.Div(
                    [
                        html.Div(
                            str(idx),
                            style={
                                "width": "24px",
                                "height": "24px",
                                "borderRadius": "50%",
                                "display": "flex",
                                "alignItems": "center",
                                "justifyContent": "center",
                                "background": f"color-mix(in srgb, {accent} 12%, #ffffff)",
                                "fontSize": "0.74rem",
                                "fontWeight": "800",
                                "color": accent,
                                "flexShrink": "0",
                            },
                        ),
                        html.Div(
                            [
                                html.Div(
                                    row["label"],
                                    style={
                                        "fontSize": "0.84rem",
                                        "fontWeight": "700",
                                        "color": "#0f172a",
                                        "lineHeight": "1.2",
                                    },
                                ),
                                html.Div(
                                    row["sub"],
                                    style={
                                        "fontSize": "0.72rem",
                                        "fontWeight": "600",
                                        "color": "#64748b",
                                        "marginTop": "2px",
                                    },
                                ),
                            ],
                            style={"flex": "1"},
                        ),
                        html.Div(
                            [
                                html.Div(
                                    metric_label,
                                    style={
                                        "fontSize": "0.64rem",
                                        "fontWeight": "700",
                                        "color": "#64748b",
                                        "marginBottom": "2px",
                                        "textAlign": "right",
                                    },
                                ),
                                html.Div(
                                    metric_value,
                                    style={
                                        "fontSize": "0.9rem",
                                        "fontWeight": "800",
                                        "color": color,
                                        "textAlign": "right",
                                    },
                                ),
                            ],
                            style={"minWidth": "120px"},
                        ),
                    ],
                    style={
                        "display": "flex",
                        "alignItems": "center",
                        "gap": "10px",
                        "padding": "10px 0",
                        "borderBottom": "1px solid #edf2f7",
                    },
                )
            )

    return html.Div(
        [
            html.Div(
                title,
                style={
                    "fontSize": "0.84rem",
                    "fontWeight": "800",
                    "color": "#0f172a",
                    "marginBottom": "10px",
                },
            ),
            html.Div(rows),
        ],
        style={
            "background": "#ffffff",
            "borderRadius": "18px",
            "border": "1px solid #e4e9f1",
            "padding": "16px 18px",
            "boxShadow": "0 12px 28px rgba(15, 23, 42, 0.05)",
            "height": "100%",
        },
    )
