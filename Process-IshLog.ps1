$global:log = Resolve-Path $args[0]
$global:scriptPath = split-path -parent $MyInvocation.MyCommand.Definition

Function Create-Log($grep, $outputFile) {
    $outputFile = "$($global:log)-$outputFile"
    "outputing $outputFile" 

    [xml] $xml = cat "$($global:scriptPath)\log-template.htm"
    $contentNode = $xml.html.body.content
    $contentTemplate = $contentNode.InnerXml

    $content = cat $global:log | grep "$grep" | cut -f1 | % { $contentTemplate -replace '#path', $_ }
    $joined = $content -join "`n"

    $contentNode.InnerXml = $joined

    $xml.OuterXml | Out-File $outputFile
}


"processing $log"
Create-Log "CHANGED TO:png" "png.html"
Create-Log "CHANGED TO:jpg" "jpg.html"
Create-Log "SHOULD BE:jpg" "should-be-jpg.html"
Create-Log "SHOULD BE:png" "should-be-png.html"
Create-Log "TRANSPARENCY MISTAKE:major" "trans-mistake-major.html"
Create-Log "TRANSPARENCY MISTAKE:minor" "trans-mistake-minor.html"
