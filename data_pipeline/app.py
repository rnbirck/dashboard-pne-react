import unicodedata

import dash
import dash_bootstrap_components as dbc
from dash import Dash, Input, Output, callback, dcc, html

import plotly.io as pio

from src.data_loader import load_municipios

custom_template = pio.templates["plotly"]
custom_template.layout.separators = ",."
custom_template.layout.hoverlabel = dict(
    bgcolor="white",
    font_size=13,
    font_family="Inter, sans-serif",
    font_color="#0f172a",
    bordercolor="#cbd5e1",
    namelength=-1,
)
pio.templates.default = custom_template


def _normalize_search_text(value: str) -> str:
    normalized = unicodedata.normalize("NFKD", value)
    without_accents = "".join(
        character for character in normalized if not unicodedata.combining(character)
    )
    return without_accents.casefold()


def _get_municipios() -> list[str]:
    try:
        return load_municipios()
    except Exception as exc:
        print(f"Erro ao carregar municípios: {exc}")
        return []


def _global_filter_style() -> dict[str, str]:
    return {"display": "block"}


app = Dash(
    __name__,
    use_pages=True,
    pages_folder="src/views",
    external_stylesheets=[dbc.themes.BOOTSTRAP],
    suppress_callback_exceptions=True,
    title="Dashboard PNE",
)
server = app.server


def _top_nav_item(label: str, href: str | None, icon_class: str, *, active="partial"):
    children = [
        html.Span(className=f"top-nav-icon {icon_class}", **{"aria-hidden": "true"}),
        html.Span(label, className="top-nav-label"),
    ]
    if href:
        return dbc.NavLink(children, href=href, active=active, className="top-nav-link")
    return html.Div(children, className="top-nav-link top-nav-link-ghost")


def serve_layout():
    municipios = _get_municipios()
    return html.Div(
        [
            dcc.Location(id="app-location", refresh=False),
            html.Div(
                [
                    html.Div(
                        [
                            html.Div(
                                [
                                    html.Span("SESI", className="brand-logo-text"),
                                    html.Span("•", className="brand-separator"),
                                    html.Span(
                                        "Observatório da Educação",
                                        className="brand-subtitle",
                                    ),
                                ],
                                className="brand-block",
                            ),
                        ],
                        className="app-header-left",
                    ),
                    html.Div(
                        [
                            html.Button(
                                html.Span(
                                    className="app-header-user-icon",
                                    **{"aria-hidden": "true"},
                                ),
                                className="app-header-user",
                                type="button",
                                title="Perfil",
                            ),
                        ],
                        className="app-header-right",
                    ),
                ],
                className="app-header",
            ),
            html.Div(
                [
                    html.Div(
                        [
                            _top_nav_item(
                                "Início",
                                "/",
                                "top-nav-icon-home",
                                active="exact",
                            ),
                            _top_nav_item(
                                "PNE 2014 - 2024",
                                "/pne-2014-2024",
                                "top-nav-icon-bars",
                            ),
                            _top_nav_item(
                                "PNE 2026 - 2036",
                                "/pne-2026-2036",
                                "top-nav-icon-trend",
                            ),
                            _top_nav_item(
                                "Diagnóstico do município",
                                "/diagnostico-municipio",
                                "top-nav-icon-clipboard",
                            ),
                        ],
                        className="portal-nav-strip",
                    ),
                    html.Div(
                        [
                            html.Div(
                                "Selecione um município",
                                className="global-filter-label",
                            ),
                            html.Div(
                                [
                                    html.Span(
                                        className="global-search-icon",
                                        **{"aria-hidden": "true"},
                                    ),
                                    dcc.Dropdown(
                                        id="filter-municipio",
                                        options=[
                                            {
                                                "label": municipio,
                                                "value": municipio,
                                                "search": (
                                                    f"{municipio} "
                                                    f"{_normalize_search_text(municipio)}"
                                                ),
                                            }
                                            for municipio in municipios
                                        ],
                                        value=None,
                                        placeholder="Busque ou selecione um município...",
                                        clearable=True,
                                        maxHeight=320,
                                        optionHeight=44,
                                        className="dash-dropdown main-filter-dropdown",
                                        style={"width": "100%"},
                                    ),
                                ],
                                className="global-filter-input-row",
                            ),
                        ],
                        className="global-filter-panel",
                        style=_global_filter_style(),
                        id="global-filter-container",
                    ),
                    dash.page_container,
                ],
                className="content-shell",
            ),
        ],
        className="app-shell",
    )


app.layout = serve_layout


@callback(
    Output("global-filter-container", "style"),
    Input("app-location", "pathname"),
)
def toggle_global_filter(pathname):
    return _global_filter_style()


if __name__ == "__main__":
    app.run(debug=True, host="127.0.0.1", port="8050")
