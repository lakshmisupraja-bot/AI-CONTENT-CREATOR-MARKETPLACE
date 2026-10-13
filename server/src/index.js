import 'dotenv/config'
import cors from 'cors'
import express from 'express'
import { createClient } from '@supabase/supabase-js'
import { pool } from './pool.js'
import { validateBrief } from './validation.js'

const app = express()
const port = Number(process.env.PORT) || 10000
const allowedOrigins = new Set(
  (process.env.FRONTEND_ORIGINS || 'http://localhost:5173')
    .split(',')
    .map((origin) => origin.trim())
    .filter(Boolean),
)

const supabaseUrl = process.env.SUPABASE_URL?.trim()
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim()
const supabaseAdmin = supabaseUrl && supabaseServiceRoleKey
  ? createClient(supabaseUrl, supabaseServiceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  })
  : null

app.disable('x-powered-by')
app.use(cors({
  origin(origin, callback) {
    if (!origin || allowedOrigins.has(origin)) {
      callback(null, true)
      return
    }
    callback(new Error('This origin is not allowed by the API CORS configuration.'))
  },
  methods: ['GET', 'POST', 'OPTIONS'],
  allowedHeaders: ['Authorization', 'Content-Type'],
  maxAge: 600,
}))
app.use(express.json({ limit: '32kb', strict: true }))

app.get('/health', async (_request, response) => {
  try {
    await pool.query('select 1')
    response.json({ status: 'ok', database: 'connected' })
  } catch (error) {
    console.error('Health check could not reach PostgreSQL.', error)
    response.status(503).json({ status: 'error', database: 'unavailable' })
  }
})

async function requireBrand(request, response, next) {
  if (!supabaseAdmin) {
    response.status(503).json({ error: 'Brand authentication is not configured on the API.' })
    return
  }

  const authorization = request.get('authorization') || ''
  const tokenMatch = authorization.match(/^Bearer\s+(.+)$/i)
  if (!tokenMatch) {
    response.status(401).json({ error: 'Sign in with a brand account to manage creative briefs.' })
    return
  }

  try {
    const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(tokenMatch[1])
    if (authError || !user) {
      response.status(401).json({ error: 'Your session is invalid or expired. Please sign in again.' })
      return
    }

    const { data: profile, error: profileError } = await supabaseAdmin
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .maybeSingle()

    if (profileError) {
      console.error('Unable to verify the Supabase member role.', profileError)
      response.status(502).json({ error: 'Could not verify your account role. Please try again.' })
      return
    }
    if (profile?.role !== 'brand') {
      response.status(403).json({ error: 'Only signed-in brand accounts can manage creative briefs.' })
      return
    }

    request.brandId = user.id
    next()
  } catch (error) {
    console.error('Unexpected error while authenticating a brief API request.', error)
    response.status(502).json({ error: 'Could not verify your account. Please try again.' })
  }
}

function mapBrief(row) {
  return {
    id: row.id,
    brand_id: row.brand_id,
    title: row.title,
    project_description: row.project_description,
    target_audience: row.target_audience,
    creative_style: row.creative_style,
    output_format: row.output_format,
    content_type: row.content_type,
    aspect_ratio: row.aspect_ratio,
    commercial_use: row.commercial_use,
    duration: row.duration,
    budget: row.budget,
    deadline: row.deadline,
    additional_requirements: row.additional_requirements,
    details: row.details,
    reference_files: row.reference_files,
    created_at: row.created_at,
  }
}

app.get('/api/creative-briefs', requireBrand, async (request, response) => {
  try {
    const { rows } = await pool.query(
      `select id, brand_id, title, project_description, target_audience,
              creative_style, output_format, content_type, aspect_ratio,
              commercial_use, duration, budget, deadline,
              additional_requirements, details, reference_files, created_at
       from creative_briefs
       where brand_id = $1
       order by created_at desc`,
      [request.brandId],
    )
    response.json({ data: rows.map(mapBrief) })
  } catch (error) {
    console.error('Unable to retrieve creative briefs from PostgreSQL.', error)
    response.status(503).json({ error: 'Could not load saved briefs. Please try again.' })
  }
})

app.post('/api/creative-briefs', requireBrand, async (request, response) => {
  let brief
  try {
    brief = validateBrief(request.body, request.brandId)
  } catch (error) {
    response.status(400).json({ error: error.message })
    return
  }

  try {
    const { rows } = await pool.query(
      `insert into creative_briefs (
         brand_id, title, project_description, target_audience, creative_style,
         output_format, content_type, aspect_ratio, commercial_use, duration,
         budget, deadline, additional_requirements, details, reference_files
       )
       values ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15)
       returning id, brand_id, title, project_description, target_audience,
                 creative_style, output_format, content_type, aspect_ratio,
                 commercial_use, duration, budget, deadline,
                 additional_requirements, details, reference_files, created_at`,
      [
        brief.brandId,
        brief.title,
        brief.projectDescription,
        brief.targetAudience,
        brief.creativeStyle,
        brief.outputFormat,
        brief.contentType,
        brief.aspectRatio,
        brief.usage,
        brief.duration,
        brief.budget,
        brief.deadline,
        brief.additionalRequirements,
        brief.details,
        JSON.stringify(brief.referenceFiles),
      ],
    )
    response.status(201).json({ data: mapBrief(rows[0]) })
  } catch (error) {
    console.error('Unable to save a creative brief to PostgreSQL.', error)
    response.status(503).json({ error: 'Could not save your brief. Your entered details are still available; please retry.' })
  }
})

app.use((error, _request, response, _next) => {
  void _next
  if (error instanceof SyntaxError && 'body' in error) {
    response.status(400).json({ error: 'Request body must contain valid JSON.' })
    return
  }
  if (error.type === 'entity.too.large') {
    response.status(413).json({ error: 'Request body is too large.' })
    return
  }
  if (error.message?.includes('CORS configuration')) {
    response.status(403).json({ error: error.message })
    return
  }
  console.error('Unhandled API error.', error)
  response.status(500).json({ error: 'An unexpected server error occurred.' })
})

const server = app.listen(port, () => {
  console.log(`CreatorBridge API listening on port ${port}`)
})

async function shutdown(signal) {
  console.log(`Received ${signal}; closing API and PostgreSQL connections.`)
  server.close(async () => {
    await pool.end()
    process.exit(0)
  })
}

process.on('SIGTERM', () => shutdown('SIGTERM'))
process.on('SIGINT', () => shutdown('SIGINT'))
