import dash
from dash import dcc, html


dash.register_page(__name__, path="/", name="Início")


def _icon(name, class_name="home-icon-svg"):
    return html.Span(
        className=f"{class_name} home-icon-{name}",
        **{"aria-hidden": "true"},
    )


def _pillar_card(icon, title, text, tone):
    return html.Div(
        [
            html.Div(_icon(icon), className=f"home-pillar-icon home-tone-{tone}"),
            html.Div(
                [
                    html.Div(title, className="home-pillar-title"),
                    html.Div(text, className="home-pillar-text"),
                ],
                className="home-pillar-copy",
            ),
        ],
        className="home-pillar-card",
    )


def _module_card(icon, title, text, href, tone):
    return dcc.Link(
        [
            html.Div(
                [
                    html.Div(
                        _icon(icon), className=f"home-module-icon home-tone-{tone}"
                    ),
                    html.Div(
                        [
                            html.Div(title, className="home-module-title"),
                            html.Div(text, className="home-module-text"),
                        ],
                        className="home-module-copy",
                    ),
                    html.Div(_icon("chevron"), className="home-module-arrow"),
                ],
                className="home-module-card-inner",
            ),
            html.Div(className=f"home-module-bar home-tone-{tone}"),
        ],
        href=href,
        className="home-module-card",
    )


def _feature_item(icon, text, tone):
    return html.Div(
        [
            html.Div(_icon(icon), className=f"home-feature-icon home-tone-{tone}"),
            html.Div(text, className="home-feature-text"),
        ],
        className="home-feature-item",
    )


def _about_visual():
    return html.Img(
        src="/assets/img_pne_livros.png",
        alt="",
        className="home-about-illustration",
    )


layout = html.Div(
    [
        html.Section(
            [
                html.Div(_icon("panel"), className="home-hero-mark"),
                html.Div(
                    [
                        html.H1(
                            "Bem-vindo ao Painel de Acompanhamento do PNE.",
                            className="home-hero-title",
                        ),
                        html.P(
                            "Acompanhe as metas e indicadores educacionais do município e a evolução das metas do Plano Nacional de Educação.",
                            className="home-hero-text",
                        ),
                    ],
                    className="home-hero-copy",
                ),
                html.Div(
                    [
                        _pillar_card(
                            "door",
                            "Acesso",
                            "Mais estudantes na escola, com permanência e conclusão.",
                            "green",
                        ),
                        _pillar_card(
                            "book",
                            "Aprendizagem",
                            "Ensino de qualidade e melhores resultados para todos.",
                            "blue",
                        ),
                        _pillar_card(
                            "people",
                            "Equidade",
                            "Redução das desigualdades e mais oportunidades para todos.",
                            "orange",
                        ),
                    ],
                    className="home-pillars",
                ),
            ],
            className="home-hero-panel",
        ),
        html.Section(
            [
                _module_card(
                    "bars",
                    "PNE 2014 - 2024",
                    "Resultados do ciclo anterior. Veja o que avançou e os desafios que permanecem.",
                    "/pne-2014-2024",
                    "purple",
                ),
                _module_card(
                    "trend",
                    "PNE 2026 - 2036",
                    "Metas e indicadores do ciclo atual. Acompanhe a evolução das metas e prioridades para a próxima década.",
                    "/pne-2026-2036",
                    "green",
                ),
                _module_card(
                    "pie",
                    "Diagnóstico do município",
                    "Síntese dos avanços, desafios e oportunidades da educação no município.",
                    "/diagnostico-municipio",
                    "orange",
                ),
            ],
            className="home-module-grid",
        ),
        html.Section(
            [
                html.Div(
                    [
                        html.Div(
                            [
                                html.Div(
                                    [
                                        html.Div(
                                            _icon("about"), className="home-info-icon"
                                        ),
                                        html.H2(
                                            "Sobre o PNE",
                                            className="home-section-title",
                                        ),
                                    ],
                                    className="home-info-heading",
                                ),
                                html.P(
                                    "O Plano Nacional de Educação (2026-2036) define as metas e prioridades da educação brasileira para a próxima década, orientando ações e investimentos para garantir acesso, qualidade e equidade.",
                                    className="home-info-text",
                                ),
                            ],
                            className="home-about-copy",
                        ),
                        _about_visual(),
                    ],
                    className="home-info-card home-about-card",
                ),
                html.Div(
                    [
                        html.Div(
                            [
                                html.Div(_icon("compass"), className="home-info-icon"),
                                html.H2(
                                    "O que você encontra no painel",
                                    className="home-section-title",
                                ),
                            ],
                            className="home-info-heading",
                        ),
                        html.Div(
                            [
                                _feature_item(
                                    "bars",
                                    "Resultados do ciclo anterior",
                                    "purple",
                                ),
                                _feature_item(
                                    "target",
                                    "Metas atuais e indicadores",
                                    "green",
                                ),
                                _feature_item(
                                    "document",
                                    "Síntese dos principais indicadores do município",
                                    "blue",
                                ),
                            ],
                            className="home-feature-list",
                        ),
                    ],
                    className="home-info-card home-feature-card",
                ),
            ],
            className="home-info-grid",
        ),
    ],
    className="home-page",
)
