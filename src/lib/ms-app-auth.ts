// App-only Microsoft Graph auth helper (client credentials)

export async function getAppOnlyAccessToken(): Promise<string> {
  const tenantId = process.env.MS_TENANT_ID
  const clientId = process.env.MS_CLIENT_ID
  const clientSecret = process.env.MS_CLIENT_SECRET

  if (!tenantId || !clientId || !clientSecret) {
    throw new Error('Missing app-only Graph env: MS_TENANT_ID, MS_CLIENT_ID, MS_CLIENT_SECRET')
  }

  const tokenEndpoint = `https://login.microsoftonline.com/${tenantId}/oauth2/v2.0/token`
  const body = new URLSearchParams({
    client_id: clientId,
    client_secret: clientSecret,
    scope: 'https://graph.microsoft.com/.default',
    grant_type: 'client_credentials'
  })

  const resp = await fetch(tokenEndpoint, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: body.toString()
  })

  if (!resp.ok) {
    const text = await resp.text()
    throw new Error(`Failed to obtain app-only token: ${resp.status} ${text}`)
  }

  const json = await resp.json()
  return json.access_token as string
}

