# Genera assets visuales para Auto Leasing Medellin usando Nano Banana 2
# (gemini-3.1-flash-image-preview) via Vertex AI region 'global'.
#
# Auth: gcloud auth login (user account). Consume creditos del trial Cloud Billing PAYG.
# Uso:  powershell -ExecutionPolicy Bypass -File .\scripts\generate-brand.ps1
#       powershell -ExecutionPolicy Bypass -File .\scripts\generate-brand.ps1 -Only favicon,og
#
# Output: public/brand/<name>.png (PNGs crudos ~1024x1024 desde Nano Banana).
# El wire-up a src/app/icon.png etc. lo hace generate-brand-postprocess.ps1.

param(
  [string]$Project = "562013906780",
  [string]$Region  = "global",
  [string]$Model   = "gemini-3.1-flash-image-preview",
  [string[]]$Only  = @()
)

# Fix Windows PowerShell + Vertex AI 417 Expectation Failed
[System.Net.ServicePointManager]::Expect100Continue = $false

$gcloud = "C:\Users\USER\AppData\Local\Google\Cloud SDK\google-cloud-sdk\bin\gcloud.cmd"
$token  = (& $gcloud auth print-access-token 2>&1 | Select-Object -Last 1).Trim()
if (-not $token -or $token.Length -lt 100) {
  throw "No se pudo obtener access token. Ejecutar 'gcloud auth login' primero."
}

$RepoRoot = Split-Path -Parent $PSScriptRoot
$OutDir   = Join-Path $RepoRoot "public\brand"
if (-not (Test-Path $OutDir)) { New-Item -ItemType Directory -Path $OutDir | Out-Null }

if ($Region -eq "global") {
  $Endpoint = "https://aiplatform.googleapis.com/v1/projects/$Project/locations/global/publishers/google/models/${Model}:generateContent"
} else {
  $Endpoint = "https://${Region}-aiplatform.googleapis.com/v1/projects/$Project/locations/$Region/publishers/google/models/${Model}:generateContent"
}

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

# ====== PROMPTS ======
# Notas del aprendizaje 2026-05-13 (ver memoria reference_vertex_imagen_workaround):
#  - SIN acentos en prompts (Nano Banana renderiza "Medellin", no "Medellin").
#  - SIN codigos hex (los rendea como texto basura). Usar nombres de color.
#  - Output es ~1024x1024 fijo. Para ratios distintos hay que recortar/padding despues.

$prompts = [ordered]@{

  # 1. FAVICON / APP ICON
  # Cuadrado, simbolo unico, alto contraste, legible a 16x16.
  # Branding: naranja vibrante sobre gris carbon casi negro.
  "favicon.png" = @'
Square app icon, 1024x1024 pixels, perfectly centered composition. Dark charcoal
near-black background (very dark gray, almost graphite) with a subtle radial
glow in vibrant orange behind the symbol. Centered foreground symbol: a bold
geometric three-quarter front view of a modern sedan car silhouette rendered in
vibrant orange, with thick rounded strokes and slight depth. The car shape is
simplified, iconic, instantly readable, with a soft inner highlight giving a
gentle 3D feel. Rounded square corners on the icon background (large radius).
Ultra-minimal, no text, no letters, no numbers, no logos. Designed to remain
crisp and legible at 16x16 pixels. Style: premium modern flat-design app icon,
fintech / mobility startup aesthetic, evokes "trust" and "movement".
'@

  # 2. OPEN GRAPH IMAGE (1200x630 logico, pero NB da 1024x1024 -> hay que recortar/padding luego)
  # Texto SIN tildes ("Medellin", no "Medellin"). Sin numeros raros, sin hashtags, sin URLs.
  "og-image.png" = @'
Wide horizontal social media share banner for an automotive leasing company.
Dark charcoal near-black background with a subtle radial gradient and very faint
floating particles. The text is rendered in clean modern sans-serif typography,
perfectly spelled, no hyphenation, no broken letters, no extra characters or
numbers anywhere in the image. Top headline in bright white, bold weight 800,
reads exactly two words: Auto Leasing. Second line below in vibrant orange,
weight 700, reads exactly one word: Medellin. Small white text near the bottom
reads exactly: Tu carro propio en 110 semanas. Text occupies the left half of
the banner. Right half shows a clean three-quarter front view of a modern
compact sedan in soft orange and graphite tones, with thin glowing orange light
beams suggesting motion. High contrast, ultra-legible at thumbnail size. No
people, no faces, no other logos, no hashtag symbols, no hexadecimal codes, no
URLs. Style: editorial premium auto-fintech brand banner.
'@

  # 3. HERO ILUSTRACION para /registro (formulario publico)
  # Aspect ~16:9, parte izquierda mas oscura para overlay si se usa.
  "hero-registro.png" = @'
Abstract premium illustration for an automotive leasing landing page, 16:9 wide
composition. Dark charcoal near-black background that fades into a deep warm
amber-orange glow toward the right side. Centered subject: a stylized
three-quarter front view of a modern compact sedan rendered with clean
geometric lines, painted in a deep charcoal gray body with subtle vibrant
orange light reflections on the hood, headlights and lower edges. Soft
volumetric light rays in warm orange coming from upper right. Faint floating
geometric particles and thin orange light lines in the background suggesting
forward motion. Left third of the image is darker and emptier, to allow text
overlay legibility. No people, no faces, no text, no logos, no numbers, no
license plate. Style: cinematic premium automotive editorial photography meets
modern flat illustration, mood is "trust, opportunity, owning your car".
'@

}

# ====== RUN ======

$results = @{}
foreach ($name in $prompts.Keys) {
  $key = ($name -replace '\.png$','')
  if ($Only.Count -gt 0 -and -not ($Only -contains $key)) { continue }
  $ok = Invoke-NanoBanana -Prompt $prompts[$name] -OutName $name
  $results[$name] = $ok
}

Write-Host ""
Write-Host "=== Resumen ==="
foreach ($k in $results.Keys) {
  $status = if ($results[$k]) { "OK " } else { "FAIL" }
  Write-Host "  $status  $k"
}
Write-Host ""
Write-Host "Output en: $OutDir"
Write-Host "Siguiente: ejecutar scripts\generate-brand-postprocess.ps1 para wire-up a Next.js."
