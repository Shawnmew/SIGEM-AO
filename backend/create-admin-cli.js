#!/usr/bin/env node
import readline from 'readline'

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
})

function question(text) {
  return new Promise(resolve => rl.question(text, resolve))
}

async function main() {
  console.log('🔐 SIGEM-AO - Criar Usuário Admin\n')

  const email = await question('Email do admin: ')
  const password = await question('Senha do admin: ')
  const name = await question('Nome do admin: ')

  console.log(`\n📝 Adicione estas variáveis ao seu .env do backend:\n`)
  console.log(`ADMIN_EMAIL=${email}`)
  console.log(`ADMIN_PASS=${password}`)
  console.log(`ADMIN_NAME=${name}\n`)
  
  console.log('Depois, execute:\n')
  console.log('npm run seed:admin\n')

  rl.close()
}

main()
