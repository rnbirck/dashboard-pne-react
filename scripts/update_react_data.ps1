$ErrorActionPreference = "Stop"

$ReactProject = (Resolve-Path -LiteralPath (Join-Path $PSScriptRoot "..")).Path
$DataPipeline = Join-Path $ReactProject "data_pipeline"
$ReactData = Join-Path $ReactProject "public\data"
$PartitionedData = Join-Path $DataPipeline "export\data_partitioned"
$LocalPython = Join-Path $ReactProject ".venv\Scripts\python.exe"
$PythonExe = if (Test-Path -LiteralPath $LocalPython) {
  $LocalPython
} elseif ($env:PNE_PYTHON) {
  $env:PNE_PYTHON
} else {
  "python"
}
$SinopseData = if ($env:SINOPSE_CENSO_DIR) {
  (Resolve-Path -LiteralPath $env:SINOPSE_CENSO_DIR).Path
} else {
  throw "Defina a variavel de ambiente SINOPSE_CENSO_DIR com o caminho das planilhas da Sinopse Estatistica do Censo Escolar."
}

Write-Host "[update-data] Exportando JSONs agregados com o pipeline local..."
Push-Location $DataPipeline
& $PythonExe "scripts\export_static_data.py" "--include-derived"
& $PythonExe "scripts\partition_static_data.py"
Pop-Location

Write-Host "[update-data] Copiando dados particionados para o React..."
$resolvedReactData = (Resolve-Path -LiteralPath $ReactData).Path
if ($resolvedReactData -ne $ReactData) {
  throw "Diretorio React public\data inesperado: $resolvedReactData"
}

Get-ChildItem -LiteralPath $resolvedReactData -Force | Remove-Item -Recurse -Force
Copy-Item -Path (Join-Path $PartitionedData "*") -Destination $resolvedReactData -Recurse -Force

Write-Host "[update-data] Recalculando creche e pre-escola com a Sinopse Estatistica..."
Push-Location $ReactProject
& $PythonExe "scripts\patch_early_childhood_indicators.py" `
  "--data-dir" $ReactData `
  "--python-project-dir" $DataPipeline `
  "--sinopse-dir" $SinopseData
Pop-Location

Write-Host "[update-data] Gerando build estatico do React..."
Push-Location $ReactProject
npm run build
Pop-Location

Write-Host "[update-data] Concluido."
