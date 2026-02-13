# SIGEM-AO Mobile (Expo)

Aplicação mobile para o SIGEM-AO usando Expo Go.

## ⚙️ Setup

### 1. Instalar Expo CLI
```bash
npm install -g expo-cli
```

### 2. Instalar dependências
```bash
cd mobile
npm install
```

### 3. Configurar URL da API
No arquivo `app/login.tsx`, altere `API_URL` para o IP do seu computador:
```javascript
const API_URL = 'http://YOUR_IP:4001'
```

Encontre seu IP com:
```bash
# Windows
ipconfig

# macOS/Linux
ifconfig
```

### 4. Iniciar servidor Expo
```bash
npm start
```

## 📱 Usar com Expo Go

1. **Baixe o app Expo Go** na Play Store ou App Store
2. **Escaneie o QR code** que aparece no terminal
3. **App carregará no seu telefone**

## 🗂️ Estrutura de Arquivos

```
mobile/
├── app/
│   ├── _layout.tsx          # Root layout
│   ├── index.tsx            # Redirect to login
│   ├── login.tsx            # Login screen
│   ├── register.tsx         # Register screen
│   └── (app)/
│       ├── _layout.tsx      # App layout
│       ├── dashboard.tsx    # Citizen dashboard
│       ├── admin-dashboard.tsx # Admin dashboard
│       └── report-incident.tsx # Report form
├── app.json                 # Expo config
└── package.json            # Dependencies
```

## 🔐 Credenciais de Teste

- **Email:** admin@sigem.local
- **Senha:** admin123

## 🚀 Funcionalidades

- ✅ Autenticação (Login/Registre-se)
- ✅ Dashboard cidadão com listagem de incidentes
- ✅ Reportar novo incidente
- ✅ Dashboard admin com bulk delete
- ✅ Alertas em tempo real (Socket.IO)
- ✅ Gestão de status de incidentes

## 📡 Conexão com Backend

O app se conecta ao backend em `http://YOUR_IP:4001`. Certifique-se de que:
1. Backend está rodando: `cd backend && npm run dev`
2. Frontend (Vite) está rodando: `cd .. && npm run dev`
3. IP está correto no app
4. Telefone e computador estão na mesma rede

## 🐛 Troubleshooting

**"Failed to connect to API"**
- Verifique se o IP está correto
- Backend está rodando?
- Firewall bloqueando a porta 4001?

**"App carrega em branco"**
- Verifique console do Expo
- Tente `npm start` e escanear QR novamente

**"Socket.IO não conecta"**
- Verifique CORS no backend
- IP correto no socket connection

Sugestão: use React Native para protótipo rápido.

Tarefas iniciais:
- `npx react-native init SIGEMAOApp` ou `npx expo init SIGEMAOApp` (Expo para prototipagem rápida)
- Implementar telas: Reportar, Mapa, Voluntário, Perfil
- Integrar FCM para push

Este diretório serve como placeholder e referência.
