import { google } from 'googleapis'

export async function getAccessToken(GCP_SA_KEY) {
  const key = JSON.parse(GCP_SA_KEY)
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
