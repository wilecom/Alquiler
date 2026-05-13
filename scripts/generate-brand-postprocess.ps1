# Post-procesa los PNGs crudos de Nano Banana en public/brand/
# y los conecta al file-routing de Next.js 16 (src/app/icon.png, apple-icon.png,
# opengraph-image.png).
#
# Uso: powershell -ExecutionPolicy Bypass -File .\scripts\generate-brand-postprocess.ps1

$RepoRoot = Split-Path -Parent $PSScriptRoot
$Brand    = Join-Path $RepoRoot "public\brand"
$AppDir   = Join-Path $RepoRoot "src\app"

Add-Type -AssemblyName System.Drawing

function Resize-Png {
  param([string]$Src, [string]$Dst, [int]$W, [int]$H)
  $img = [System.Drawing.Image]::FromFile($Src)
  $bmp = New-Object System.Drawing.Bitmap $W, $H
  $g   = [System.Drawing.Graphics]::FromImage($bmp)
  $g.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
  $g.SmoothingMode     = [System.Drawing.Drawing2D.SmoothingMode]::HighQuality
  $g.PixelOffsetMode   = [System.Drawing.Drawing2D.PixelOffsetMode]::HighQuality
  $g.CompositingQuality = [System.Drawing.Drawing2D.CompositingQuality]::HighQuality
  $g.DrawImage($img, 0, 0, $W, $H)
  $bmp.Save($Dst, [System.Drawing.Imaging.ImageFormat]::Png)
  $g.Dispose(); $bmp.Dispose(); $img.Dispose()
  Write-Host "  $Dst  ($W x $H)"
}

function Copy-Png {
  param([string]$Src, [string]$Dst)
  Copy-Item -Path $Src -Destination $Dst -Force
  $img = [System.Drawing.Image]::FromFile($Dst)
  Write-Host "  $Dst  ($($img.Width) x $($img.Height))"
  $img.Dispose()
}

Write-Host "Wire-up de assets de marca a Next.js..."

# icon.png (Next.js downsize automatico para distintas plataformas)
Copy-Png -Src (Join-Path $Brand "favicon.png") -Dst (Join-Path $AppDir "icon.png")

# apple-icon.png (180x180 estandar iOS)
Resize-Png -Src (Join-Path $Brand "favicon.png") -Dst (Join-Path $AppDir "apple-icon.png") -W 180 -H 180

# opengraph-image.png (deja el 1376x768 que da NB2; Next escribe og:image:width/height automaticamente)
Copy-Png -Src (Join-Path $Brand "og-image.png") -Dst (Join-Path $AppDir "opengraph-image.png")

# Borrar icon.svg viejo si existe (lo reemplaza icon.png)
$oldSvg = Join-Path $AppDir "icon.svg"
if (Test-Path $oldSvg) {
  Remove-Item $oldSvg
  Write-Host "  borrado: $oldSvg"
}

Write-Host ""
Write-Host "Listo. Verifica con 'npm run dev' y abre / para ver el favicon en el tab."
