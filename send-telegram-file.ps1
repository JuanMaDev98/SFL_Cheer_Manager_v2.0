$botToken = "8041782108:AAH_pjLEbZ6GB0mH9FVppwahDKgF_aE0gTg"
$chatId = "1166287745"
$filePath = "C:\Users\WorkMonitor\.openclaw\SFL_Cheer_Manager_v2.0\omfcat-farm.json"
$url = "https://api.telegram.org/bot$botToken/sendDocument?chat_id=$chatId&caption=OMFCAT_Farm_JSON"

try {
    $response = Invoke-RestMethod -Uri $url -Method Post -InFile $filePath -ContentType "multipart/form-data"
    Write-Host "OK"
    $response | ConvertTo-Json -Depth 3
} catch {
    $errorResponse = $_.Exception.Response
    $reader = [System.IO.StreamReader]::new($errorResponse.GetResponseStream())
    $reader.ReadToEnd() | Write-Host
}
