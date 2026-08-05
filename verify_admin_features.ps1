Write-Host "=== VERIFYING ADMIN CONTROL CENTER REST APIS ===" -ForegroundColor Cyan

$baseUrl = "http://localhost:8081/api"
$passed = 0
$failed = 0

function Test-Endpoint($name, $scriptBlock) {
    Write-Host "`n[TEST] $name ..." -NoNewline
    try {
        & $scriptBlock
        Write-Host " [PASSED]" -ForegroundColor Green
        $global:passed += 1
    } catch {
        Write-Host " [FAILED]" -ForegroundColor Red
        Write-Host "  Error: $_" -ForegroundColor Yellow
        $global:failed += 1
    }
}


# 1. Admin Login
Test-Endpoint "Admin Login (admin@example.com / admin123)" {
    $body = @{ email = "admin@example.com"; password = "admin123" } | ConvertTo-Json
    $res = Invoke-RestMethod -Uri "$baseUrl/admin-login" -Method POST -Body $body -ContentType "application/json"
    if (-not $res.token) { throw "No token returned" }
    Write-Host " (Token acquired for $($res.userName))" -NoNewline
}

# 2. Get Admin Users List
$users = @()
Test-Endpoint "Fetch Admin Users (/api/admin-users)" {
    $global:users = Invoke-RestMethod -Uri "$baseUrl/admin-users" -Method GET
    if ($global:users.Count -eq 0) { throw "No users returned" }
    $adminUser = $global:users | Where-Object { $_.email -eq "admin@example.com" }
    if (-not $adminUser) { throw "Default admin user not found in user list" }
    if (-not $adminUser.isAdmin) { throw "isAdmin flag is not true for admin" }
    Write-Host " (Found $($global:users.Count) users)" -NoNewline
}

# 3. Notification CRUD
$createdNotifId = $null
Test-Endpoint "Create Admin Notification (/api/admin-notifications/create)" {
    $body = @{ contentTitle = "System Maintenance"; content = "Scheduled maintenance tonight at 11 PM." } | ConvertTo-Json
    $res = Invoke-RestMethod -Uri "$baseUrl/admin-notifications/create" -Method POST -Body $body -ContentType "application/json"
    if (-not $res.id) { throw "Notification ID missing" }
    $script:createdNotifId = $res.id
    Write-Host " (Notif ID: $($res.id))" -NoNewline
}

Test-Endpoint "Fetch Notifications List (/api/notifications)" {
    $notifs = Invoke-RestMethod -Uri "$baseUrl/notifications" -Method GET
    $found = $notifs | Where-Object { $_.id -eq $script:createdNotifId }
    if (-not $found) { throw "Created notification not found in list" }
}

Test-Endpoint "Update Admin Notification (/api/admin-notifications/{id})" {
    $body = @{ contentTitle = "System Maintenance Updated"; content = "Maintenance rescheduled to midnight." } | ConvertTo-Json
    $res = Invoke-RestMethod -Uri "$baseUrl/admin-notifications/$script:createdNotifId" -Method PUT -Body $body -ContentType "application/json"
    if ($res.contentTitle -ne "System Maintenance Updated") { throw "Title did not update" }
}

Test-Endpoint "Delete Admin Notification (/api/admin-notifications/{id})" {
    Invoke-RestMethod -Uri "$baseUrl/admin-notifications/$script:createdNotifId" -Method DELETE
}

# 4. Quiz Summary Endpoint
Test-Endpoint "Fetch Quiz Summary (/api/admin-quiz-summary)" {
    $summary = Invoke-RestMethod -Uri "$baseUrl/admin-quiz-summary" -Method GET
    if ($null -eq $summary.totalAttempts) { throw "totalAttempts field missing" }
    Write-Host " (Total Attempts: $($summary.totalAttempts), Avg Score: $($summary.averageScore)%)" -NoNewline
}

# 5. Direct Message Endpoint
Test-Endpoint "Send Admin Message (/api/admin-send-message)" {
    $targetUser = $global:users[0].name
    $body = @{ receiver = $targetUser; message = "Welcome to CodeTogether Admin System!" } | ConvertTo-Json
    $res = Invoke-RestMethod -Uri "$baseUrl/admin-send-message" -Method POST -Body $body -ContentType "application/json"
    if (-not $res.id) { throw "Message ID missing" }
}

# 6. Bulk Email Endpoint
Test-Endpoint "Bulk Email Broadcast (/api/admin-bulk-email)" {
    $body = @{ subject = "Test Broadcast"; message = "This is a test admin broadcast." } | ConvertTo-Json
    $res = Invoke-RestMethod -Uri "$baseUrl/admin-bulk-email" -Method POST -Body $body -ContentType "application/json"
    if ($null -eq $res.sent) { throw "Sent count missing" }
    Write-Host " (Sent: $($res.sent), Failed: $($res.failed))" -NoNewline
}

# 7. Admin Reset User Password
Test-Endpoint "Admin Reset User Password (/api/admin-reset-user-password/{id})" {
    $targetId = $global:users[0].id
    $body = @{ newPassword = "NewPass123!" } | ConvertTo-Json
    $res = Invoke-RestMethod -Uri "$baseUrl/admin-reset-user-password/$targetId" -Method POST -Body $body -ContentType "application/json"
    if (-not $res.message) { throw "Response message missing" }
}

# 8. Toggle Admin Role
Test-Endpoint "Toggle Admin Role (/api/admin-toggle-role/{id})" {
    $targetId = $global:users[0].id
    $res = Invoke-RestMethod -Uri "$baseUrl/admin-toggle-role/$targetId" -Method POST
    if ($null -eq $res.isAdmin) { throw "isAdmin field missing" }
    # Toggle back to restore initial state
    $res2 = Invoke-RestMethod -Uri "$baseUrl/admin-toggle-role/$targetId" -Method POST
}

$summaryColor = if ($failed -eq 0) { "Green" } else { "Red" }
Write-Host "SUMMARY: $passed PASSED, $failed FAILED" -ForegroundColor $summaryColor
if ($failed -gt 0) { exit 1 } else { exit 0 }

