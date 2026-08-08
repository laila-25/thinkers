[CmdletBinding()]
param(
    [string]$ProductionHost = '127.0.0.1',
    [int]$ProductionPort = 3307,
    [Parameter(Mandatory)][string]$ProductionUser,
    [string]$ProductionDatabase = 'railway',
    [string]$SourceHost = '127.0.0.1',
    [int]$SourcePort = 3308,
    [string]$SourceUser = 'root',
    [string]$SourceDatabase = 'recovery_source',
    [string]$SourceMediaRoot = 'C:\xampp\htdocs\thinkers\backend\storage\app',
    [string]$ProductionCourseMediaRoot,
    [string]$ProductionPublicMediaRoot,
    [string]$PublicMediaUrlPrefix,
    [string]$BackupDirectory = 'C:\xampp\htdocs\thinkers\artifacts\railway-backups',
    [string]$PhpPath = 'C:\xampp\php\php.exe',
    [string]$MySqlDumpPath = 'C:\xampp\mysql\bin\mysqldump.exe',
    [switch]$Execute
)

$ErrorActionPreference = 'Stop'
$scriptPath = Join-Path $PSScriptRoot 'production-catalog-recovery.php'
$runId = Get-Date -Format 'yyyyMMdd-HHmmss'
$reportPath = Join-Path $PSScriptRoot "production-recovery-$runId.json"

if (-not (Test-Path -LiteralPath $scriptPath)) { throw "Missing PHP runner: $scriptPath" }
if (-not (Test-Path -LiteralPath $PhpPath)) { throw "Missing PHP executable: $PhpPath" }
if ($Execute -and (([string]::IsNullOrWhiteSpace($ProductionCourseMediaRoot)) -or ([string]::IsNullOrWhiteSpace($ProductionPublicMediaRoot)) -or ([string]::IsNullOrWhiteSpace($PublicMediaUrlPrefix)))) {
    throw 'Execution requires persistent ProductionCourseMediaRoot, ProductionPublicMediaRoot, and PublicMediaUrlPrefix. Dry-run does not.'
}

$securePassword = Read-Host -Prompt 'Railway MySQL password' -AsSecureString
$bstr = [Runtime.InteropServices.Marshal]::SecureStringToBSTR($securePassword)
$plainPassword = [Runtime.InteropServices.Marshal]::PtrToStringBSTR($bstr)
try {
    $env:THINKERS_RUN_ID = $runId
    $env:THINKERS_REPORT_FILE = $reportPath
    $env:THINKERS_SOURCE_MEDIA_ROOT = $SourceMediaRoot
    $env:THINKERS_SOURCE_DB_HOST = $SourceHost
    $env:THINKERS_SOURCE_DB_PORT = "$SourcePort"
    $env:THINKERS_SOURCE_DB_USER = $SourceUser
    $env:THINKERS_SOURCE_DB_DATABASE = $SourceDatabase
    $env:THINKERS_SOURCE_DB_PASSWORD = ''
    $env:THINKERS_PROD_DB_HOST = $ProductionHost
    $env:THINKERS_PROD_DB_PORT = "$ProductionPort"
    $env:THINKERS_PROD_DB_USER = $ProductionUser
    $env:THINKERS_PROD_DB_DATABASE = $ProductionDatabase
    $env:THINKERS_PROD_DB_PASSWORD = $plainPassword
    $env:THINKERS_PROD_COURSE_MEDIA_ROOT = $ProductionCourseMediaRoot
    $env:THINKERS_PROD_PUBLIC_MEDIA_ROOT = $ProductionPublicMediaRoot
    $env:THINKERS_PUBLIC_MEDIA_URL_PREFIX = $PublicMediaUrlPrefix

    $arguments = @($scriptPath)
    if ($Execute) {
        New-Item -ItemType Directory -Force -Path $BackupDirectory | Out-Null
        $backupPath = Join-Path $BackupDirectory "thinkers-production-premerge-$runId.sql"
        if (Test-Path -LiteralPath $backupPath) { throw "Refusing to overwrite backup: $backupPath" }
        # MYSQL_PWD is scoped to this process tree and cleared in finally; it keeps the password out of command history.
        $env:MYSQL_PWD = $plainPassword
        & $MySqlDumpPath --host=$ProductionHost --port=$ProductionPort --user=$ProductionUser --single-transaction --quick --skip-lock-tables --routines --events --triggers --hex-blob --default-character-set=utf8mb4 --databases $ProductionDatabase --result-file=$backupPath
        if ($LASTEXITCODE -ne 0 -or -not (Test-Path -LiteralPath $backupPath) -or (Get-Item -LiteralPath $backupPath).Length -lt 1024) { throw 'Final production backup failed; merge was not attempted.' }
        $backupHash = (Get-FileHash -Algorithm SHA256 -LiteralPath $backupPath).Hash
        $env:THINKERS_FINAL_BACKUP_PATH = $backupPath
        $env:THINKERS_FINAL_BACKUP_SHA256 = $backupHash
        $arguments += '--execute'
    }
    & $PhpPath @arguments
    if ($LASTEXITCODE -ne 0) { throw "PHP recovery runner failed; inspect $reportPath" }
    Write-Host "Recovery report: $reportPath"
}
finally {
    foreach ($key in 'MYSQL_PWD','THINKERS_PROD_DB_PASSWORD','THINKERS_SOURCE_DB_PASSWORD','THINKERS_FINAL_BACKUP_PATH','THINKERS_FINAL_BACKUP_SHA256') { Remove-Item "Env:$key" -ErrorAction SilentlyContinue }
    [Runtime.InteropServices.Marshal]::ZeroFreeBSTR($bstr)
}
