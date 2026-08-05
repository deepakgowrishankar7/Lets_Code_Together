$net = Get-NetTCPConnection -LocalPort 8081 -ErrorAction SilentlyContinue
if ($net) {
    $processIds = $net | Select-Object -ExpandProperty OwningProcess -ErrorAction SilentlyContinue | Sort-Object -Unique
    $processIds = $processIds | Where-Object { $_ -and ($_ -as [int]) -gt 4 }
    if (-not $processIds) {
        Write-Output "No killable process IDs found for port 8081"
        return
    }
    foreach ($procId in $processIds) {
        Write-Output ("Killing PID " + $procId)
        try {
            Stop-Process -Id $procId -Force -ErrorAction Stop
            Write-Output ("Killed " + $procId)
        } catch {
            Write-Output ("Failed to kill " + $procId + ": " + $_.Exception.Message)
        }
    }
} else {
    Write-Output "No listener on port 8081"
}
