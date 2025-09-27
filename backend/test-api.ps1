# API Test Suite
# Comprehensive testing of all backend endpoints

Write-Host "🧪 Starting API Test Suite for Tik in de Buurt Backend" -ForegroundColor Green
Write-Host "Base URL: http://localhost:8080" -ForegroundColor Cyan
Write-Host "=" * 60 -ForegroundColor Yellow

$BaseURL = "http://localhost:8080"
$TestResults = @()

function Test-Endpoint {
    param(
        [string]$Name,
        [string]$URL,
        [string]$Method = "GET",
        [hashtable]$Body = @{},
        [hashtable]$Headers = @{}
    )
    
    Write-Host "`n🔍 Testing: $Name" -ForegroundColor Yellow
    Write-Host "   URL: $URL" -ForegroundColor Gray
    Write-Host "   Method: $Method" -ForegroundColor Gray
    
    try {
        $params = @{
            Uri = $URL
            Method = $Method
            TimeoutSec = 10
        }
        
        if ($Headers.Count -gt 0) {
            $params.Headers = $Headers
        }
        
        if ($Body.Count -gt 0 -and $Method -ne "GET") {
            $params.Body = ($Body | ConvertTo-Json)
            $params.ContentType = "application/json"
        }
        
        $response = Invoke-WebRequest @params
        
        Write-Host "   ✅ Status: $($response.StatusCode)" -ForegroundColor Green
        Write-Host "   📄 Content Length: $($response.Content.Length) bytes" -ForegroundColor Green
        
        # Try to parse JSON response
        try {
            $jsonResponse = $response.Content | ConvertFrom-Json
            if ($jsonResponse.PSObject.Properties.Count -gt 0) {
                Write-Host "   📝 Response: Valid JSON with $($jsonResponse.PSObject.Properties.Count) properties" -ForegroundColor Green
            }
        }
        catch {
            Write-Host "   📝 Response: Non-JSON content" -ForegroundColor Yellow
        }
        
        $global:TestResults += @{
            Name = $Name
            Status = "✅ PASS"
            StatusCode = $response.StatusCode
            Size = $response.Content.Length
        }
        
        return $true
    }
    catch {
        Write-Host "   ❌ FAILED: $($_.Exception.Message)" -ForegroundColor Red
        
        $global:TestResults += @{
            Name = $Name
            Status = "❌ FAIL"
            Error = $_.Exception.Message
        }
        
        return $false
    }
}

# 1. HEALTH CHECK
Test-Endpoint "Health Check" "$BaseURL/health"

# 2. AUTH ENDPOINTS
Test-Endpoint "Auth - Get Current User (No Auth)" "$BaseURL/api/auth/me"
Test-Endpoint "Auth - Refresh Token (No Token)" "$BaseURL/api/auth/refresh"

# 3. USER ENDPOINTS
Test-Endpoint "Users - Get All Users" "$BaseURL/api/users"
Test-Endpoint "Users - Get User Profile (Invalid ID)" "$BaseURL/api/users/invalid-id"

# 4. BUSINESS ENDPOINTS
Test-Endpoint "Business - Get All Businesses" "$BaseURL/api/businesses"
Test-Endpoint "Business - Get Business by ID (Invalid)" "$BaseURL/api/businesses/invalid-id"
Test-Endpoint "Business - Get Business Categories" "$BaseURL/api/businesses/categories"

# 5. VIDEO ENDPOINTS
Test-Endpoint "Videos - Get All Videos" "$BaseURL/api/videos"
Test-Endpoint "Videos - Get Trending Videos" "$BaseURL/api/videos/trending"

# 6. VERIFICATION ENDPOINTS
Test-Endpoint "Verification - Send Code (No Data)" "$BaseURL/api/verification/send" "POST"
Test-Endpoint "Verification - Verify Code (No Data)" "$BaseURL/api/verification/verify" "POST"

# 7. UPLOAD ENDPOINTS
Test-Endpoint "Upload - Get Upload Status" "$BaseURL/api/upload/status"

# 8. PROFILE ENDPOINTS  
Test-Endpoint "Profile - Get Profile (No Auth)" "$BaseURL/api/profile"

# 9. NOTIFICATIONS ENDPOINTS
Test-Endpoint "Notifications - Get All (No Auth)" "$BaseURL/api/notifications"

# 10. CHAT ENDPOINTS
Test-Endpoint "Chat - Get Conversations (No Auth)" "$BaseURL/api/chat/conversations"

# 11. STATIC FILE SERVING
Test-Endpoint "Static - Uploads Directory" "$BaseURL/uploads/"

# 12. 404 TEST
Test-Endpoint "404 - Non-existent Endpoint" "$BaseURL/api/nonexistent"

Write-Host "`n" + ("=" * 60) -ForegroundColor Yellow
Write-Host "📊 TEST RESULTS SUMMARY" -ForegroundColor Green
Write-Host ("=" * 60) -ForegroundColor Yellow

$PassCount = 0
$FailCount = 0

foreach ($result in $TestResults) {
    if ($result.Status -like "*PASS*") {
        $PassCount++
        Write-Host "$($result.Status) $($result.Name)" -ForegroundColor Green
        if ($result.StatusCode) {
            Write-Host "    Status: $($result.StatusCode) | Size: $($result.Size) bytes" -ForegroundColor Gray
        }
    } else {
        $FailCount++
        Write-Host "$($result.Status) $($result.Name)" -ForegroundColor Red
        if ($result.Error) {
            Write-Host "    Error: $($result.Error)" -ForegroundColor Gray
        }
    }
}

Write-Host "`n📈 FINAL SCORE:" -ForegroundColor Cyan
Write-Host "✅ Passed: $PassCount tests" -ForegroundColor Green
Write-Host "❌ Failed: $FailCount tests" -ForegroundColor Red
Write-Host "📊 Success Rate: $([math]::Round(($PassCount / ($PassCount + $FailCount)) * 100, 1))%" -ForegroundColor Yellow

if ($FailCount -eq 0) {
    Write-Host "`n🎉 ALL TESTS PASSED! Backend is healthy!" -ForegroundColor Green
} elseif ($PassCount -gt $FailCount) {
    Write-Host "`n⚠️  Most tests passed, minor issues detected" -ForegroundColor Yellow
} else {
    Write-Host "`n🚨 Major issues detected, needs investigation" -ForegroundColor Red
}