import express from 'express'
import pg from 'pg'
import bcrypt from 'bcrypt'
import jwt from 'jsonwebtoken'

const router = express.Router()
const { Pool } = pg
const pool = new Pool({ connectionString: process.env.DATABASE_URL })

// POST /api/auth/register
router.post('/register', async (req, res) => {
  try {
    const { name, email, password, phone, role } = req.body
    if (!email || !password || !name) return res.status(400).json({ error: 'missing_fields' })

    const existing = await pool.query('SELECT id FROM users WHERE email = $1', [email])
    if (existing.rows.length) return res.status(409).json({ error: 'user_exists' })

    const hash = await bcrypt.hash(password, 10)
    const result = await pool.query(
      'INSERT INTO users (name, email, phone, password_hash, role) VALUES ($1,$2,$3,$4,$5) RETURNING id, name, email, role',
      [name, email, phone || null, hash, role || 'citizen']
    )

    const user = result.rows[0]
    const token = jwt.sign({ userId: user.id, role: user.role }, process.env.JWT_SECRET || 'dev_secret', { expiresIn: '7d' })
    return res.json({ user, token })
  } catch (err) {
    console.error('Register error', err)
    return res.status(500).json({ error: 'internal' })
  }
})

// POST /api/auth/login
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body
    if (!email || !password) return res.status(400).json({ error: 'missing_fields' })

    const result = await pool.query('SELECT id, name, email, password_hash, role FROM users WHERE email = $1', [email])
    const user = result.rows[0]
    if (!user) return res.status(401).json({ error: 'invalid_credentials' })

    const ok = await bcrypt.compare(password, user.password_hash)
    if (!ok) return res.status(401).json({ error: 'invalid_credentials' })

    const token = jwt.sign({ userId: user.id, role: user.role }, process.env.JWT_SECRET || 'dev_secret', { expiresIn: '7d' })
    // remove password_hash before returning
    delete user.password_hash
    return res.json({ user, token })
  } catch (err) {
    console.error('Login error', err)
    return res.status(500).json({ error: 'internal' })
  }
})

export default router
