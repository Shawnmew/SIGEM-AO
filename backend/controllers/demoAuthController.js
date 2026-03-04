import bcrypt from 'bcrypt'
import jwt from 'jsonwebtoken'
import { users } from './demoData.js'

export async function register(req, res) {
  try {
    const { name, email, password, phone, role } = req.body
    if (!email || !password || !name) return res.status(400).json({ error: 'missing_fields' })
    if (users[email]) return res.status(409).json({ error: 'user_exists' })

    const hash = await bcrypt.hash(password, 10)
    const id = Object.keys(users).length + 1
    const userRole = role || 'citizen'
    const user = { id, name, email, phone: phone || null, role: userRole }
    users[email] = { ...user, password_hash: hash }

    const token = jwt.sign({ userId: id, role: userRole }, process.env.JWT_SECRET || 'dev_secret', { expiresIn: '7d' })
    return res.json({ user, token })
  } catch (err) {
    console.error('Register error', err)
    return res.status(500).json({ error: 'internal' })
  }
}

export async function login(req, res) {
  try {
    const { email, password } = req.body
    if (!email || !password) return res.status(400).json({ error: 'missing_fields' })

    const user = users[email]
    if (!user) return res.status(401).json({ error: 'invalid_credentials' })

    const ok = await bcrypt.compare(password, user.password_hash)
    if (!ok) return res.status(401).json({ error: 'invalid_credentials' })

    const userResponse = { id: user.id, name: user.name, email: user.email, role: user.role }
    const token = jwt.sign({ userId: user.id, role: user.role }, process.env.JWT_SECRET || 'dev_secret', { expiresIn: '7d' })
    return res.json({ user: userResponse, token })
  } catch (err) {
    console.error('Login error', err)
    return res.status(500).json({ error: 'internal' })
  }
}
