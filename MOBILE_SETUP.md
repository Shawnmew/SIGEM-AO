# 📱 SIGEM-AO Mobile - Quick Start Guide

## O que foi criado

Uma **aplicação mobile completa** usando **Expo** que funciona com seu iPhone ou Android via **Expo Go**.

## 🚀 Iniciar em 3 minutos

### Passo 1: Instalar Expo CLI (primeira vez apenas)
```bash
npm install -g expo-cli
```

### Passo 2: Instalar dependências da app mobile
```bash
cd mobile
npm install
```

### Passo 3: Encontrar o IP do seu computador

**Windows:**
```powershell
ipconfig
# Procure por "IPv4 Address" na seção da sua rede (ex: 192.168.1.100)
```

**macOS/Linux:**
```bash
ifconfig
# Procure por "inet" (ex: 192.168.x.x)
```

### Passo 4: Configurar IP no app
Abra `mobile/app/login.tsx` e atualize:
```javascript
const API_URL = 'http://192.168.1.100:4001'  // Use o seu IP!
```

Faça o mesmo em:
- `mobile/app/register.tsx`
- `mobile/app/(app)/dashboard.tsx`
- `mobile/app/(app)/report-incident.tsx`
- `mobile/app/(app)/admin-dashboard.tsx`

### Passo 5: Garantir que backend e frontend estão rodando
```bash
# Terminal 1 - Backend
cd backend
npm run dev

# Terminal 2 - Frontend (Vite)
cd ..
npm run dev

# Terminal 3 - Expo
cd mobile
npm start
```

### Passo 6: Escanear QR Code com seu telemóvel

1. **Baixar Expo Go**
   - [iOS App Store](https://apps.apple.com/app/expo-go/id982107779)
   - [Android Play Store](https://play.google.com/store/apps/details?id=host.exp.exponent)

2. **Escanear QR Code** que aparece no terminal (ou abrir o link gerado)

3. **App carrega no telemóvel!** 🎉

## 📸 Screenshots das telas

### Login
- Campo de email
- Campo de senha
- Botão entrar
- Link para criar conta

### Dashboard Cidadão
- Botão "Reportar Incidente"
- Lista de incidentes
- Alertas em tempo real 🚨
- Info: endereço, severidade, status, data

### Dashboard Admin
- ✅ Selecionar múltiplos incidentes
- 🗑️ Deletar selecionados (com motivo obrigatório)
- 🔄 Mudar status (Pendente → Em Andamento → Resolvido)
- 📊 Alertas em tempo real

### Reportar Incidente
- Campo título
- Campo endereço
- Descrição (opcional)
- Severidade (Leve/Médio/Grave)
- Botão reportar

## 🔧 Páginas Criadas

| Rota | Descrição |
|------|-----------|
| `/login` | Login na app |
| `/register` | Criar nova conta |
| `/(app)/dashboard` | Dashboard cidadão |
| `/(app)/admin-dashboard` | Dashboard admin |
| `/(app)/report-incident` | Formulário reportar |

## 🔐 Contas para testar

### Admin
- Email: `admin@sigem.local`
- Senha: `admin123`

### Registrar novo cidadão
- Nome, email, senha na tela de registre-se

## 🐛 Troubleshooting

### ❌ "Cannot connect to API"
1. Verifique se o `IP` está correto
2. Verifique se `backend` está rodando na porta `4001`
3. Verifique se `frontend` está rodando na porta `5173`
4. Verifique se o telemóvel está na **mesma rede** que o computador

### ❌ "Blank white screen"
1. Verifique o console do Expo no terminal
2. Tente fazer `Ctrl+R` no Expo para reload
3. Force close e reabra o Expo Go

### ❌ "Socket.IO não reconecta"
1. Verifique se o backend permite CORS
2. Verifique o IP em **todos** os arquivos `const API_URL = ...`

## 📁 Estrutura do projeto

```
SIGEM-AO/
├── backend/               # Node.js + Express server
│   ├── server.js         # API endpoints
│   └── package.json
├── src/                  # React web app (Vite)
│   ├── components/
│   └── main.jsx
├── mobile/               # React Native app (Expo)
│   ├── app/
│   │   ├── login.tsx
│   │   ├── register.tsx
│   │   ├── (app)/
│   │   │   ├── dashboard.tsx
│   │   │   ├── report-incident.tsx
│   │   │   └── admin-dashboard.tsx
│   ├── app.json
│   └── package.json
└── package.json
```

## 🎯 Próximos passos

- [ ] Testes em Android e iOS
- [ ] Adicionar geolocalização (GPS)
- [ ] Implementar notificações push
- [ ] Integrar câmera para fotos
- [ ] Modo dark theme
- [ ] Offline-first com SQLite

## 💡 Dicas

- **Reload rápido:** Toque 2x nas costas do telemóvel enquanto Expo está aberto
- **Debug mode:** Toque no ícone de menu (canto inferior) → Debugger
- **Hot reload:** Alterações no código recarregam automaticamente
- **Logs:** Verifique o terminal do Expo para console.log()

---

**Pronto para testar? Comece pelo Passo 1! 🚀**
