import jwt from 'jsonwebtoken'

export default function auth(req, res, next) {
  const header = req.headers.authorization
  if (!header) return res.status(401).json({ error: 'no_token' })
  const parts = header.split(' ')
  if (parts.length !== 2) return res.status(401).json({ error: 'invalid_token' })
  const [scheme, token] = parts
  if (!/^Bearer$/i.test(scheme)) return res.status(401).json({ error: 'invalid_token' })

  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET || 'dev_secret')
    req.user = { id: payload.userId, role: payload.role }
    next()
  } catch (err) {
    return res.status(401).json({ error: 'invalid_token' })
  }
}
