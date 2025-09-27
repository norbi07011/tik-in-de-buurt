Write-Host "🧪 Testing API Endpoints" -ForegroundColor Green

$BaseURL = "http://localhost:8080"

# Test 1: Health Check
Write-Host "`n1. Testing Health Check..."
try {
    $response = Invoke-WebRequest -Uri "$BaseURL/health" -TimeoutSec 5
    Write-Host "✅ Health: $($response.StatusCode)" -ForegroundColor Green
    Write-Host "Response: $($response.Content.Substring(0, 100))..."
} catch {
    Write-Host "❌ Health failed: $($_.Exception.Message)" -ForegroundColor Red
}

# Test 2: Businesses
Write-Host "`n2. Testing Businesses API..."
try {
    $response = Invoke-WebRequest -Uri "$BaseURL/api/businesses" -TimeoutSec 5
    Write-Host "✅ Businesses: $($response.StatusCode)" -ForegroundColor Green
    $json = $response.Content | ConvertFrom-Json
    Write-Host "Found $($json.length) businesses"
} catch {
    Write-Host "❌ Businesses failed: $($_.Exception.Message)" -ForegroundColor Red
}

# Test 3: Users
Write-Host "`n3. Testing Users API..."
try {
    $response = Invoke-WebRequest -Uri "$BaseURL/api/users" -TimeoutSec 5
    Write-Host "✅ Users: $($response.StatusCode)" -ForegroundColor Green
    $json = $response.Content | ConvertFrom-Json
    Write-Host "Found $($json.length) users"
} catch {
    Write-Host "❌ Users failed: $($_.Exception.Message)" -ForegroundColor Red
}

# Test 4: Videos
Write-Host "`n4. Testing Videos API..."
try {
    $response = Invoke-WebRequest -Uri "$BaseURL/api/videos" -TimeoutSec 5
    Write-Host "✅ Videos: $($response.StatusCode)" -ForegroundColor Green
} catch {
    Write-Host "❌ Videos failed: $($_.Exception.Message)" -ForegroundColor Red
}

# Test 5: 404 Test
Write-Host "`n5. Testing 404 Response..."
try {
    $response = Invoke-WebRequest -Uri "$BaseURL/api/nonexistent" -TimeoutSec 5
    Write-Host "❌ Should have failed with 404" -ForegroundColor Red
} catch {
    Write-Host "✅ Correctly returned 404: $($_.Exception.Message)" -ForegroundColor Green
}

Write-Host "`n🎯 Basic API tests completed!" -ForegroundColor Cyan