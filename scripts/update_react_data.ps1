$ErrorActionPreference = "Stop"

$PythonProject = "C:\Users\rnbirck\PROJETOS\DASHBOARD-PNE-PYTHON"
$ReactProject = "C:\Users\rnbirck\PROJETOS\DASHBOARD-PNE-REACT"
$PythonExe = "C:\Users\rnbirck\PROJETOS\DASHBOARD-PNE\.conda\python.exe"
$PartitionedData = Join-Path $PythonProject "export\data_partitioned"
$ReactData = Join-Path $ReactProject "public\data"

Write-Host "[update-data] Exportando JSONs agregados no projeto Python..."
Push-Location $PythonProject
& $PythonExe "scripts\export_static_data.py" "--include-derived"
& $PythonExe "scripts\partition_static_data.py"
Pop-Location

Write-Host "[update-data] Copiando dados particionados para o React..."
$resolvedReactData = (Resolve-Path -LiteralPath $ReactData).Path
if ($resolvedReactData -ne $ReactData) {
  throw "Diretório React public\data inesperado: $resolvedReactData"
}

Get-ChildItem -LiteralPath $resolvedReactData -Force | Remove-Item -Recurse -Force
Copy-Item -Path (Join-Path $PartitionedData "*") -Destination $resolvedReactData -Recurse -Force

Write-Host "[update-data] Gerando build estático do React..."
Push-Location $ReactProject
npm run build
Pop-Location

Write-Host "[update-data] Concluído."
