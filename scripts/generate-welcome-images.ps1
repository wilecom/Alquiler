# Genera imágenes hero para la welcome page de /solicitud usando Nano Banana 2.
# Uso: powershell -ExecutionPolicy Bypass -File .\scripts\generate-welcome-images.ps1

param(
  [string]$Project = "562013906780",
  [string]$Region = "global",
  [string]$Model = "gemini-3.1-flash-image-preview"
)

[System.Net.ServicePointManager]::Expect100Continue = $false

$gcloud = "C:\Users\USER\AppData\Local\Google\Cloud SDK\google-cloud-sdk\bin\gcloud.cmd"
$token = (& $gcloud auth print-access-token 2>&1 | Select-Object -Last 1).Trim()
if (-not $token -or $token.Length -lt 100) {
  throw "No se pudo obtener access token. Ejecutar 'gcloud auth login' primero."
}

$OutDir = Join-Path $PSScriptRoot "..\public\brand"
$Endpoint = "https://aiplatform.googleapis.com/v1/projects/$Project/locations/global/publishers/google/models/${Model}:generateContent"

function Invoke-NanoBanana {
  param([string]$Prompt, [string]$OutName)
  $payload = @{
    contents = @(@{ role = "user"; parts = @(@{ text = $Prompt }) })
    generationConfig = @{ responseModalities = @("IMAGE") }
  }
  $body = $payload | ConvertTo-Json -Depth 10 -Compress
  $outPath = Join-Path $OutDir $OutName
  Write-Host "[$OutName] generando..." -NoNewline
  try {
    $r = Invoke-WebRequest -Uri $Endpoint -Method POST `
      -Headers @{ "Authorization" = "Bearer $token" } `
      -Body $body -ContentType "application/json" `
      -UseBasicParsing -TimeoutSec 180
    $json = $r.Content | ConvertFrom-Json
    $imagePart = $json.candidates[0].content.parts | Where-Object { $_.inlineData } | Select-Object -First 1
    if (-not $imagePart) {
      $txt = ($json.candidates[0].content.parts | Where-Object { $_.text } | Select-Object -First 1).text
      Write-Host " FAIL (no inlineData). Text: $txt"
      return $false
    }
    $bytes = [Convert]::FromBase64String($imagePart.inlineData.data)
    [System.IO.File]::WriteAllBytes($outPath, $bytes)
    $sz = (Get-Item $outPath).Length
    Write-Host " OK ($([Math]::Round($sz/1KB,1)) KB)"
    return $true
  } catch {
    $status = $_.Exception.Response.StatusCode.value__
    Write-Host " ERROR ($status)"
    try {
      $reader = New-Object IO.StreamReader($_.Exception.Response.GetResponseStream())
      Write-Host "  $($reader.ReadToEnd())"
    } catch { Write-Host "  $($_.Exception.Message)" }
    return $false
  }
}

# ====== PROMPTS (sin acentos para que Nano Banana renderee bien si sale texto) ======

$prompts = [ordered]@{

  # Hero principal: 3 Spark M300 segunda generacion (Spark Activo / Lite) al atardecer
  "welcome-hero.png" = @'
Cinematic wide-angle photograph of three Chevrolet Spark M300 second-generation
hatchbacks, model years 2011 to 2015, also known as Spark Activo or Spark Lite.
The body has soft rounded organic curves with modern proportions: elongated
swept-back headlights that wrap around the front fenders (NOT small round headlights
of the old Daewoo Matiz, NOT the angular sharp Spark GT of 2016 onwards), a smooth
trapezoidal grille with the Chevrolet bowtie badge, smooth flowing waistline,
compact 5-door hatchback shape, slightly bubble-like but refined and contemporary.
Three of these cars parked in a row on smooth asphalt at golden hour. From left to
right: vibrant red, charcoal grey, pearl white. All facing camera at slight
three-quarter angle. Background: dramatic sunset sky with warm orange and pink
clouds gradient blending into deep navy blue at the top, Aburra Valley mountain
silhouettes and downtown Medellin Colombia city skyline in the distance, warm city
lights starting to glow. Professional commercial automotive photography, sharp focus
on cars, shallow depth of field on background, vibrant cinematic mood, clean
composition, no text, no logos overlay, premium polished look, panoramic widescreen
composition.
'@

  # Hero alternativo: persona feliz recibiendo las llaves de un Spark blanco
  "welcome-llaves.png" = @'
Warm cinematic photograph of a young Latin American man in his early 30s, smiling
genuinely with relief and joy, wearing a clean casual button-up shirt, receiving a
single car key with a simple keychain from a hand reaching from the right side of
the frame. Behind him, slightly out of focus, a pearl white Chevrolet Spark Activo
small hatchback parked on a sunny Medellin street. Soft afternoon golden light,
shallow depth of field, photojournalistic style, authentic emotion, no posed studio
look, no text, no logos. Premium commercial automotive photography aesthetic.
'@

}

$ok = 0; $fail = 0
foreach ($k in $prompts.Keys) {
  if (Invoke-NanoBanana -Prompt $prompts[$k] -OutName $k) { $ok++ } else { $fail++ }
}
Write-Host "`nTotal: $ok OK, $fail FAIL"
