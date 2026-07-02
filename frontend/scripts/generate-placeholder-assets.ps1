New-Item -ItemType Directory -Force -Path "$PSScriptRoot\..\assets" | Out-Null
Add-Type -AssemblyName System.Drawing

function New-PitwiseImage {
    param(
        [string]$Path,
        [int]$Width,
        [int]$Height,
        [ValidateSet("icon", "splash")]
        [string]$Mode
    )

    $bitmap = [System.Drawing.Bitmap]::new($Width, $Height)
    $graphics = [System.Drawing.Graphics]::FromImage($bitmap)
    $graphics.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::AntiAlias

    $background = [System.Drawing.SolidBrush]::new([System.Drawing.Color]::FromArgb(15, 23, 42))
    $blue = [System.Drawing.SolidBrush]::new([System.Drawing.Color]::FromArgb(37, 99, 235))
    $green = [System.Drawing.SolidBrush]::new([System.Drawing.Color]::FromArgb(16, 185, 129))
    $white = [System.Drawing.SolidBrush]::new([System.Drawing.Color]::White)
    $pen = [System.Drawing.Pen]::new([System.Drawing.Color]::White, [Math]::Max(6, [int]($Width * 0.025)))

    $graphics.FillRectangle($background, 0, 0, $Width, $Height)

    if ($Mode -eq "splash") {
        $font = [System.Drawing.Font]::new("Arial", [int]($Width * 0.14), [System.Drawing.FontStyle]::Bold, [System.Drawing.GraphicsUnit]::Pixel)
        $format = [System.Drawing.StringFormat]::new()
        $format.Alignment = [System.Drawing.StringAlignment]::Center
        $format.LineAlignment = [System.Drawing.StringAlignment]::Center
        $graphics.DrawString("PitWise", $font, $white, [System.Drawing.RectangleF]::new(0, 0, $Width, $Height), $format)
    }
    else {
        $centerX = [double]($Width / 2)
        $centerY = [double]($Height / 2)
        $radius = [double]($Width * 0.31)
        $graphics.FillEllipse($blue, [float]($centerX - $radius), [float]($centerY - $radius), [float]($radius * 2), [float]($radius * 2))
        $graphics.DrawArc($pen, [float]($centerX - $radius * 0.72), [float]($centerY - $radius * 0.42), [float]($radius * 1.44), [float]($radius * 1.44), 200, 140)
        $graphics.DrawLine($pen, [float]$centerX, [float]$centerY, [float]($centerX + $radius * 0.46), [float]($centerY - $radius * 0.33))
        $graphics.FillEllipse($green, [float]($centerX + $radius * 0.46 - 10), [float]($centerY - $radius * 0.33 - 10), 20, 20)

        $font = [System.Drawing.Font]::new("Arial", [int]($Width * 0.18), [System.Drawing.FontStyle]::Bold, [System.Drawing.GraphicsUnit]::Pixel)
        $format = [System.Drawing.StringFormat]::new()
        $format.Alignment = [System.Drawing.StringAlignment]::Center
        $format.LineAlignment = [System.Drawing.StringAlignment]::Center
        $graphics.DrawString("PW", $font, $white, [System.Drawing.RectangleF]::new(0, [float]($centerY + $radius * 0.1), $Width, [float]$radius), $format)
    }

    $bitmap.Save($Path, [System.Drawing.Imaging.ImageFormat]::Png)
    $graphics.Dispose()
    $bitmap.Dispose()
}

New-PitwiseImage -Path "$PSScriptRoot\..\assets\icon.png" -Width 1024 -Height 1024 -Mode icon
New-PitwiseImage -Path "$PSScriptRoot\..\assets\adaptive-icon.png" -Width 1024 -Height 1024 -Mode icon
New-PitwiseImage -Path "$PSScriptRoot\..\assets\splash.png" -Width 1242 -Height 2436 -Mode splash
