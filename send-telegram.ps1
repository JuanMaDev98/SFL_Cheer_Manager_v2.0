param(
    [string]$FilePath = "C:\Users\WorkMonitor\.openclaw\SFL_Cheer_Manager_v2.0\omfcat-farm.json",
    [string]$BotToken = "8041782108:AAH_pjLEbZ6GB0mH9FVppwahDKgF_aE0gTg",
    [string]$ChatId = "1166287745"
)

Add-Type -AssemblyName System.Net.Http
Add-Type -Path "C:\Windows\System32\System.Net.Http.dll"

$fileName = [System.IO.Path]::GetFileName($FilePath)
$url = "https://api.telegram.org/bot$BotToken/sendDocument"

$client = New-Object System.Net.Http.HttpClient
$content = New-Object System.Net.Http.MultipartFormDataContent

$fileStream = [System.IO.File]::OpenRead($FilePath)
$streamContent = New-Object System.Net.Http.StreamContent($fileStream)
$streamContent.Headers.ContentType = [System.Net.Http.Headers.MediaTypeHeaderValue]::Parse("application/json")
$content.Add($streamContent, "document", $fileName)

$chatContent = New-Object System.Net.Http.StringContent($ChatId, [System.Text.Encoding]::UTF8, "text/plain")
$content.Add($chatContent, "chat_id")

$captionContent = New-Object System.Net.Http.StringContent("OMFCAT Farm JSON", [System.Text.Encoding]::UTF8, "text/plain")
$content.Add($captionContent, "caption")

try {
    $response = $client.PostAsync($url, $content).Result
    $result = $response.Content.ReadAsStringAsync().Result
    Write-Host "Status: $($response.StatusCode)"
    Write-Host $result
} catch {
    Write-Host "Error: $_"
} finally {
    $fileStream.Close()
    $client.Dispose()
}
