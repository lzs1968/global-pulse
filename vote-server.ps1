# Vote API helpers for Global Pulse preview server
param(
  [string]$Root
)

$script:VoteDataDir = Join-Path $Root ".gp-data"
$script:VoteStorePath = Join-Path $script:VoteDataDir "votes.json"
$script:VoteSeedPath = Join-Path $Root "assets\data\votes-seed.json"
$script:VoteSync = New-Object object

function Get-ClientIp([System.Net.HttpListenerRequest]$Request) {
  $ip = $Request.RemoteEndPoint.Address.ToString()
  if ($ip -eq "::1") { return "127.0.0.1" }
  if ($ip.StartsWith("::ffff:")) { return $ip.Substring(7) }
  return $ip
}

function Initialize-VoteStore {
  if (-not (Test-Path $script:VoteSeedPath)) {
    throw "Missing votes seed: $script:VoteSeedPath"
  }
  if (-not (Test-Path $script:VoteDataDir)) {
    New-Item -ItemType Directory -Path $script:VoteDataDir -Force | Out-Null
  }
  Copy-Item -LiteralPath $script:VoteSeedPath -Destination $script:VoteStorePath -Force
}

function Read-VoteStoreRaw {
  if (-not (Test-Path $script:VoteStorePath)) {
    Initialize-VoteStore
  }
  $json = [IO.File]::ReadAllText($script:VoteStorePath, [Text.Encoding]::UTF8)
  if ([string]::IsNullOrWhiteSpace($json)) { Initialize-VoteStore; $json = [IO.File]::ReadAllText($script:VoteStorePath, [Text.Encoding]::UTF8) }
  return $json | ConvertFrom-Json
}

function Write-VoteStoreRaw($Store) {
  if (-not (Test-Path $script:VoteDataDir)) {
    New-Item -ItemType Directory -Path $script:VoteDataDir -Force | Out-Null
  }
  $json = $Store | ConvertTo-Json -Depth 20 -Compress:$false
  [IO.File]::WriteAllText($script:VoteStorePath, $json, [Text.Encoding]::UTF8)
}

function Get-LedgerChoice($Store, [string]$Ip, [string]$LeaderId) {
  if ($null -eq $Store.ledger) { return $null }
  $ipNode = $Store.ledger.$Ip
  if ($null -eq $ipNode) { return $null }
  return $ipNode.$LeaderId
}

function Set-LedgerChoice($Store, [string]$Ip, [string]$LeaderId, [string]$Choice) {
  if ($null -eq $Store.ledger) {
    $Store | Add-Member -NotePropertyName ledger -NotePropertyValue ([PSCustomObject]@{}) -Force
  }
  if ($null -eq $Store.ledger.$Ip) {
    $Store.ledger | Add-Member -NotePropertyName $Ip -NotePropertyValue ([PSCustomObject]@{}) -Force
  }
  $Store.ledger.$Ip | Add-Member -NotePropertyName $LeaderId -NotePropertyValue $Choice -Force
}

function Get-LeaderTallies($Store, [string]$LeaderId) {
  if ($null -eq $Store.leaders.$LeaderId) { return $null }
  $node = $Store.leaders.$LeaderId
  $total = [int]$node.support + [int]$node.oppose
  $rate = if ($total -gt 0) { [math]::Round(100.0 * [int]$node.support / $total, 1) } else { $null }
  return @{
    support = [int]$node.support
    oppose  = [int]$node.oppose
    total   = $total
    rate    = $rate
    frozen  = [bool]$node.frozen
  }
}

function Send-JsonResponse([System.Net.HttpListenerResponse]$Response, $Payload, [int]$StatusCode = 200) {
  $json = $Payload | ConvertTo-Json -Depth 10 -Compress
  $bytes = [Text.Encoding]::UTF8.GetBytes($json)
  $Response.StatusCode = $StatusCode
  $Response.ContentType = "application/json; charset=utf-8"
  $Response.ContentLength64 = $bytes.Length
  $Response.OutputStream.Write($bytes, 0, $bytes.Length)
}

function Read-RequestBody([System.Net.HttpListenerRequest]$Request) {
  if (-not $Request.HasEntityBody) { return $null }
  $reader = New-Object System.IO.StreamReader($Request.InputStream, $Request.ContentEncoding)
  $text = $reader.ReadToEnd()
  if ([string]::IsNullOrWhiteSpace($text)) { return $null }
  return $text | ConvertFrom-Json
}

function Invoke-VoteApi([System.Net.HttpListenerRequest]$Request, [System.Net.HttpListenerResponse]$Response) {
  $path = $Request.Url.LocalPath.TrimEnd("/").ToLowerInvariant()
  if ($path -ne "/api/vote") { return $false }

  $ip = Get-ClientIp $Request

  if ($Request.HttpMethod -eq "GET") {
    $leaderId = $Request.QueryString["leaderId"]
    if ([string]::IsNullOrWhiteSpace($leaderId)) {
      Send-JsonResponse $Response @{ ok = $false; error = "missing leaderId" } 400
      return $true
    }

    [System.Threading.Monitor]::Enter($script:VoteSync)
    try {
      $store = Read-VoteStoreRaw
      $choice = Get-LedgerChoice $store $ip $leaderId
      $tallies = Get-LeaderTallies $store $leaderId
      Send-JsonResponse $Response @{
        ok       = $true
        choice   = $choice
        leaderId = $leaderId
        rate     = $tallies.rate
        support  = $tallies.support
        oppose   = $tallies.oppose
        total    = $tallies.total
      }
    } finally {
      [System.Threading.Monitor]::Exit($script:VoteSync)
    }
    return $true
  }

  if ($Request.HttpMethod -eq "POST") {
    $payload = Read-RequestBody $Request
    $leaderId = [string]$payload.leaderId
    $choice = [string]$payload.choice

    if ([string]::IsNullOrWhiteSpace($leaderId) -or ($choice -ne "support" -and $choice -ne "oppose")) {
      Send-JsonResponse $Response @{ ok = $false; error = "invalid vote payload" } 400
      return $true
    }

    [System.Threading.Monitor]::Enter($script:VoteSync)
    try {
      $store = Read-VoteStoreRaw
      if ($null -eq $store.leaders.$LeaderId) {
        Send-JsonResponse $Response @{ ok = $false; error = "unknown leader" } 404
        return $true
      }
      if ($store.leaders.$LeaderId.frozen) {
        Send-JsonResponse $Response @{ ok = $false; error = "voting frozen" } 403
        return $true
      }

      $prev = Get-LedgerChoice $store $ip $leaderId
      $changed = $false
      $isNew = $false

      if ($prev -eq $choice) {
        $changed = $false
      } elseif ($null -ne $prev) {
        if ($prev -eq "support") { $store.leaders.$LeaderId.support = [int]$store.leaders.$LeaderId.support - 1 }
        else { $store.leaders.$LeaderId.oppose = [int]$store.leaders.$LeaderId.oppose - 1 }
        if ($choice -eq "support") { $store.leaders.$LeaderId.support = [int]$store.leaders.$LeaderId.support + 1 }
        else { $store.leaders.$LeaderId.oppose = [int]$store.leaders.$LeaderId.oppose + 1 }
        Set-LedgerChoice $store $ip $LeaderId $choice
        $changed = $true
      } else {
        if ($choice -eq "support") { $store.leaders.$LeaderId.support = [int]$store.leaders.$LeaderId.support + 1 }
        else { $store.leaders.$LeaderId.oppose = [int]$store.leaders.$LeaderId.oppose + 1 }
        Set-LedgerChoice $store $ip $LeaderId $choice
        $changed = $true
        $isNew = $true
      }

      Write-VoteStoreRaw $store
      $tallies = Get-LeaderTallies $store $LeaderId

      Send-JsonResponse $Response @{
        ok       = $true
        choice   = $choice
        previous = $prev
        changed  = $changed
        isNew    = $isNew
        leaderId = $LeaderId
        rate     = $tallies.rate
        support  = $tallies.support
        oppose   = $tallies.oppose
        total    = $tallies.total
      }
    } finally {
      [System.Threading.Monitor]::Exit($script:VoteSync)
    }
    return $true
  }

  Send-JsonResponse $Response @{ ok = $false; error = "Method not allowed" } 405
  return $true
}
