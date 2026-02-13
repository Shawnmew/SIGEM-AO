import express from 'express'
import pg from 'pg'
import auth from '../middleware/auth.js'

const router = express.Router()
const { Pool } = pg

const pool = new Pool({ connectionString: process.env.DATABASE_URL })

// GET /api/incidents - minimal implementation
router.get('/', async (req, res) => {
  try {
    if (!process.env.DATABASE_URL) return res.json({ data: [] })
    const result = await pool.query('SELECT id, title, status, ST_X(location::geometry) AS longitude, ST_Y(location::geometry) AS latitude FROM incidents LIMIT 100')
    return res.json({ data: result.rows })
  } catch (err) {
    console.error('Error fetching incidents', err)
    return res.status(500).json({ error: 'internal' })
  }
})

// POST /api/incidents - create incident (authenticated)
router.post('/', auth, async (req, res) => {
  try {
    const { title, description, type_disaster_id, latitude, longitude } = req.body
    const userId = req.user && req.user.id
    if (!title || !latitude || !longitude) return res.status(400).json({ error: 'missing_fields' })

    const result = await pool.query(
      `INSERT INTO incidents (title, description, type_disaster_id, user_id, location) VALUES ($1,$2,$3,$4, ST_SetSRID(ST_MakePoint($5,$6),4326)) RETURNING id, title, status`,
      [title, description || null, type_disaster_id || null, userId || null, longitude, latitude]
    )
    return res.status(201).json({ incident: result.rows[0] })
  } catch (err) {
    console.error('Error creating incident', err)
    return res.status(500).json({ error: 'internal' })
  }
})

export default router
