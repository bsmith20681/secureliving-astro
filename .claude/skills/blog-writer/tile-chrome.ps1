param([string[]]$Urls)

Add-Type @"
using System;
using System.Runtime.InteropServices;
public class Win {
  [DllImport("user32.dll")] public static extern IntPtr GetForegroundWindow();
  [DllImport("user32.dll")] public static extern bool ShowWindow(IntPtr h, int cmd);
  [DllImport("user32.dll")] public static extern bool SetWindowPos(IntPtr h, IntPtr after, int x, int y, int w, int hgt, uint flags);
}
"@
Add-Type -AssemblyName System.Windows.Forms

$chrome = @("$env:ProgramFiles\Google\Chrome\Application\chrome.exe",
            "${env:ProgramFiles(x86)}\Google\Chrome\Application\chrome.exe",
            "$env:LocalAppData\Google\Chrome\Application\chrome.exe") | Where-Object { Test-Path $_ } | Select-Object -First 1
if (-not $chrome) { throw "Chrome not found" }

$area = [System.Windows.Forms.Screen]::PrimaryScreen.WorkingArea
$n = $Urls.Count
$w = [math]::Floor($area.Width / $n)
$border = 7  # Windows 10/11 invisible resize border on each side

for ($i = 0; $i -lt $n; $i++) {
  $before = [Win]::GetForegroundWindow()
  Start-Process $chrome -ArgumentList "--new-window", $Urls[$i]
  # Wait for the new window to take focus.
  $h = $before
  for ($t = 0; $t -lt 50 -and $h -eq $before; $t++) { Start-Sleep -Milliseconds 100; $h = [Win]::GetForegroundWindow() }
  Start-Sleep -Milliseconds 400
  $h = [Win]::GetForegroundWindow()
  [Win]::ShowWindow($h, 9) | Out-Null  # restore if maximized
  [Win]::SetWindowPos($h, [IntPtr]::Zero, $area.X + $i * $w - $border, $area.Y, $w + 2 * $border, $area.Height + $border, 0x0040) | Out-Null
}
