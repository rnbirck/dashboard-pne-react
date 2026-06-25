SELECT
  id_municipio,
  municipio,
  ano,
  estrutura_versao,
  limite_remuneracao_referencia,
  receitas,
  despesa_remuneracao_profissionais,
  despesa_remuneracao_profissionais_ensino_fundamental,
  despesa_remuneracao_profissionais_ensino_infantil,
  despesa_remuneracao_profissionais_creche,
  despesa_remuneracao_profissionais_pre_escola,
  despesa_total_fundeb,
  percentual_minimo_remuneracao_profissionais,
  disponibilidade_financeira_ano_anterior,
  ingresso_recursos_ate_bimestre,
  pagamentos_efetuados_ate_bimestre,
  disponibilidade_financeira_ate_bimestre,
  saldo_financeiro_conciliado
FROM siope_fundeb_municipio_dashboard
ORDER BY municipio, ano
