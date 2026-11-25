$root='C:\Users\sahil\OneDrive\Desktop\divy_lib'
$source='C:\xampp\htdocs\divylibrary.in\library-file-inventory.csv'
$dest='C:\xampp\htdocs\divylibrary.in\library-duplicate-hash-report.csv'
Add-Type -AssemblyName System.IO.Compression.FileSystem
$rows=Import-Csv -LiteralPath $source | Where-Object {$_.Format -in @('pdf','epub')}
$candidates=foreach($r in $rows){
  $n=$r.Title.ToLowerInvariant() -replace '^copy of\s*','' -replace '\s*\(copy\)$','' -replace '\s*\(\d+\)$','' -replace '[^\p{L}\p{Nd}]',''
  [pscustomobject]@{Key="$n|$($r.Format)|$($r.Bytes)";Archive=$r.Archive;Path=$r.FilePath;Title=$r.Title;Format=$r.Format;Bytes=[long]$r.Bytes}
}
$groups=$candidates | Group-Object Key | Where-Object Count -gt 1
$archiveCache=@{}
$hashes=[System.Collections.Generic.List[object]]::new()
$sha=[System.Security.Cryptography.SHA256]::Create()
$i=0;$total=($groups|Measure-Object Count -Sum).Sum
foreach($group in $groups){
  foreach($item in $group.Group){
    if(-not $archiveCache.ContainsKey($item.Archive)){$archiveCache[$item.Archive]=[System.IO.Compression.ZipFile]::OpenRead((Join-Path $root $item.Archive))}
    $entry=$archiveCache[$item.Archive].GetEntry($item.Path)
    if($entry){$stream=$entry.Open();try{$digest=[Convert]::ToHexString($sha.ComputeHash($stream)).ToLowerInvariant()}finally{$stream.Dispose()};$hashes.Add([pscustomobject]@{CandidateKey=$item.Key;SHA256=$digest;Title=$item.Title;Format=$item.Format;Bytes=$item.Bytes;Archive=$item.Archive;Path=$item.Path})}
    $i++
    if(($i % 500) -eq 0){Write-Progress -Activity 'Hashing likely duplicate book files' -Status "$i of $total" -PercentComplete (($i/$total)*100)}
  }
}
foreach($a in $archiveCache.Values){$a.Dispose()}
$sha.Dispose()
$exact=$hashes|Group-Object SHA256|Where-Object Count -gt 1
$report=foreach($g in $exact){foreach($item in $g.Group){[pscustomobject]@{SHA256=$g.Name;Copies=$g.Count;Title=$item.Title;Format=$item.Format;Bytes=$item.Bytes;Archive=$item.Archive;PathInArchive=$item.Path}}}
$report|Export-Csv -LiteralPath $dest -NoTypeInformation -Encoding utf8
Write-Output "Candidate files hashed: $($hashes.Count)"
Write-Output "Exact SHA-256 duplicate groups: $($exact.Count)"
Write-Output "Exact duplicate entries: $($report.Count)"
Write-Output "Report: $dest"
