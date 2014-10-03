$global:log = Resolve-Path $args[0]

#$global:log = "C:\logs\ish.txt"

"processing $log"

Function Create-Log($grep, $outputFile) {
    $outputFile = Join-Path (pwd) $outputFile
    "outputing $outputFile" 

    $html = "<html><body>"
    $content = cat $global:log | grep "$grep" | cut -f1 | % { "<img src='$_' style='border:1px black solid;'/><br>$_<br><br>" }
    $joined = $content -join "`n"
    $html = $html + $joined
    $html = $html + "</body></html>"
    $html | Out-File $outputFile
}

Create-Log "CHANGED TO:png" "png.html"
Create-Log "CHANGED TO:jpg" "jpg.html"
Create-Log "SHOULD BE:jpg" "should-be-jpg.html"
Create-Log "SHOULD BE:png" "should-be-png.html"
