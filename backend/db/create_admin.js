import bcrypt from 'bcrypt'

// Create admin user in memory (demo mode)
export async function createAdminUser() {
  const email = process.env.ADMIN_EMAIL || 'admin@sigem.local'
  const password = process.env.ADMIN_PASS || 'admin123'
  const name = process.env.ADMIN_NAME || 'Administrador'

  const hash = await bcrypt.hash(password, 10)
  const adminUser = {
    id: 1,
    name,
    email,
    phone: null,
    role: 'admin',
    password_hash: hash
  }

  console.log(`✓ Usuário admin criado: ${email}`)
  return adminUser
}

