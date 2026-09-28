Add-Type -AssemblyName System.IO.Compression.FileSystem
$zip = [System.IO.Compression.ZipFile]::OpenRead("d:\Dai_Hoc\HK5_dot1\CNPM\Du_An_Cuoi_Ky\Project_Final\HomeFix\QTV.docx")
$entry = $zip.GetEntry("word/document.xml")
$stream = $entry.Open()
$reader = New-Object System.IO.StreamReader($stream)
$xmlString = $reader.ReadToEnd()
$reader.Close()
$stream.Close()
$zip.Dispose()
$xml = [xml]$xmlString
Write-Output $xml.DocumentElement.Body.InnerText
