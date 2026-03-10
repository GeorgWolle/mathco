import { google } from 'googleapis'

/**
 * Vercel Serverless Function: POST /api/sheets
 * Schreibt Antworten in Google Sheets via Service Account.
 * Umgebungsvariablen (in Vercel Dashboard setzen):
 *   GOOGLE_SHEET_ID, GOOGLE_CLIENT_EMAIL, GOOGLE_PRIVATE_KEY
 */
export default async function handler(req, res) {
  res.setHeader('Content-Type', 'application/json')

  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed' })
    return
  }

  const spreadsheetId = process.env.GOOGLE_SHEET_ID
  const clientEmail   = process.env.GOOGLE_CLIENT_EMAIL
  const privateKey    = process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, '\n')

  if (!spreadsheetId || !clientEmail || !privateKey) {
    console.error('[sheets-api] Credentials fehlen:', {
      hasSheetId: !!spreadsheetId,
      hasEmail: !!clientEmail,
      hasKey: !!privateKey,
    })
    res.status(500).json({ error: 'Google Sheets credentials missing' })
    return
  }

  const { range, values } = req.body ?? {}

  try {
    const auth = new google.auth.JWT({
      email: clientEmail,
      key: privateKey,
      scopes: ['https://www.googleapis.com/auth/spreadsheets'],
    })

    const sheets = google.sheets({ version: 'v4', auth })

    // Aktuelle Anzahl Zeilen ermitteln → nächste freie Zeile berechnen
    const existing = await sheets.spreadsheets.values.get({
      spreadsheetId,
      range: 'Sheet1!A:A',
    })
    const nextRow = (existing.data.values?.length ?? 0) + 1

    await sheets.spreadsheets.values.update({
      spreadsheetId,
      range: `Sheet1!A${nextRow}`,
      valueInputOption: 'USER_ENTERED',
      requestBody: { values: values ?? [[JSON.stringify({ test: true, generatedAt: new Date().toISOString() })]] },
    })

    res.status(200).json({ ok: true, row: nextRow, rows: values?.length })
  } catch (err) {
    console.error('[sheets-api] Fehler:', err.message)
    res.status(500).json({ error: err.message })
  }
}
