$tests = @(
    @{ email = 'doesnotexist@example.com'; password = 'x'; label = 'missing-user' },
    @{ email = 'prajyuthsaicheruku@gmail.com'; password = 'wrongpassword'; label = 'wrong-password' }
)

foreach ($test in $tests) {
    $body = $test | ConvertTo-Json
    Write-Host "\n=== $($test.label) ==="
    try {
        $r = Invoke-WebRequest -Uri 'http://localhost:8081/api/login' -Method POST -Body $body -ContentType 'application/json' -UseBasicParsing
        Write-Host "STATUS: $($r.StatusCode)"
        Write-Host $r.Content
    } catch {
        if ($_.Exception.Response) {
            $res = $_.Exception.Response
            $reader = New-Object System.IO.StreamReader($res.GetResponseStream())
            $content = $reader.ReadToEnd()
            Write-Host "STATUS: $($res.StatusCode)"
            Write-Host $content
        } else {
            Write-Host "ERROR:" $_
        }
    }
}
