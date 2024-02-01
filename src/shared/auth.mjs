import { google } from 'googleapis'

export async function getAccessToken(gcpServiceAccountKey) {
  const key = JSON.parse(gcpServiceAccountKey)
  const jwtClient = new google.auth.JWT(
    key.client_email,
    null,
    key.private_key,
    [
      'https://www.googleapis.com/auth/webmasters.readonly',
      'https://www.googleapis.com/auth/indexing'
    ],
    null
  )

  const tokens = await jwtClient.authorize()
  return tokens.access_token
}
