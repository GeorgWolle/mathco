import { google } from 'googleapis'
import { loadEnv } from 'vite'

/**
 * Vite-Plugin: stellt /api/sheets als Server-Middleware bereit.
 * Läuft nur in Node.js (dev + preview) – der Private Key bleibt server-seitig.
 */
export function sheetsPlugin() {
  return {
    name: 'sheets-api',

    configureServer(server) {
      const env = loadEnv(server.config.mode, process.cwd(), '')
      server.middlewares.use('/api/sheets', createHandler(env))
    },

    configurePreviewServer(server) {
      const env = loadEnv('production', process.cwd(), '')
      server.middlewares.use('/api/sheets', createHandler(env))
    },
  }
}

function createHandler(env) {
  return async (req, res) => {
    res.setHeader('Content-Type', 'application/json')

    if (req.method !== 'POST') {
      res.statusCode = 405
      return res.end(JSON.stringify({ error: 'Method not allowed' }))
    }

    // Request-Body einlesen
    let body = ''
    for await (const chunk of req) body += chunk
    let payload
    try {
      payload = JSON.parse(body)
    } catch {
      res.statusCode = 400
      return res.end(JSON.stringify({ error: 'Invalid JSON body' }))
    }

    const spreadsheetId = env.GOOGLE_SHEET_ID
    const clientEmail   = env.GOOGLE_CLIENT_EMAIL
    const privateKey    = env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, '\n')

    if (!spreadsheetId || !clientEmail || !privateKey) {
      res.statusCode = 500
      return res.end(JSON.stringify({ error: 'Google Sheets credentials missing in .env' }))
    }

    try {
      const auth = new google.auth.JWT({
        email: clientEmail,
        key: privateKey,
        scopes: ['https://www.googleapis.com/auth/spreadsheets'],
      })

      const sheets = google.sheets({ version: 'v4', auth })

      const range  = payload.range  ?? 'Sheet1!A1'
      const values = payload.values ?? [['Testdaten', new Date().toISOString()]]

      await sheets.spreadsheets.values.update({
        spreadsheetId,
        range,
        valueInputOption: 'USER_ENTERED',
        requestBody: { values },
      })

      res.statusCode = 200
      res.end(JSON.stringify({ ok: true, range, rows: values.length }))
    } catch (err) {
      console.error('[sheets-plugin]', err.message)
      res.statusCode = 500
      res.end(JSON.stringify({ error: err.message }))
    }
  }
}
