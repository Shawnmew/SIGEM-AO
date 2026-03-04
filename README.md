# React + Vite

This template provides a minimal setup to get React working in Vite with HMR and some ESLint rules.

Currently, two official plugins are available:

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react) uses [Babel](https://babeljs.io/) (or [oxc](https://oxc.rs) when used in [rolldown-vite](https://vite.dev/guide/rolldown)) for Fast Refresh
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react-swc) uses [SWC](https://swc.rs/) for Fast Refresh

## React Compiler

The React Compiler is not enabled on this template because of its impact on dev & build performances. To add it, see [this documentation](https://react.dev/learn/react-compiler/installation).

## Expanding the ESLint configuration

If you are developing a production application, we recommend using TypeScript with type-aware lint rules enabled. Check out the [TS template](https://github.com/vitejs/vite/tree/main/packages/create-vite/template-react-ts) for information on how to integrate TypeScript and [`typescript-eslint`](https://typescript-eslint.io) in your project.

---

## SIGEM-AO — backend & execução rápida

Adicionei um scaffold básico de backend em `backend/` (Node + Express + Socket.IO) e um esquema PostGIS em `backend/db/schema.sql`.

Rápido para começar:

1. Subir PostGIS com Docker Compose:

```powershell
docker-compose up -d
```

2. Rodar o schema no DB (exemplo):

```powershell
docker exec -i <container_name> psql -U postgres -d sigem_ao -f /path/to/backend/db/schema.sql
```

3. Backend:

```powershell
cd backend
npm install
cp .env.example .env        # ajustar DATABASE_URL e JWT_SECRET
npm run dev
```

4. Frontend (mantido):

```powershell
# na raiz do projeto
npm install
npm run dev
```

Notas:
- O frontend Vite + React já presente no repositório foi preservado sem alterações.
- O backend expõe uma rota mínima `/api/incidents` e um servidor Socket.IO.
- Veja `backend/.env.example` para variáveis necessárias.
---

## Suporte PWA e Mobile

A aplicação agora é responsiva e pode ser instalada como um Progressive Web App:

* **Manifesto** (`public/manifest.json`) com cores e ícone.  
* **Service worker** (`public/sw.js`) cache básico para offline.  
* `index.html` contém meta `theme-color` e link para o manifesto.  
* CSS adaptativo com media queries tornando dashboards, tabelas e navegação legíveis em telemóveis.

Para testar em dispositivo móvel ou simulador, abra a URL no navegador, verifique o prompt de "Adicionar à tela inicial" ou use as ferramentas de desenvolvimento do Chrome (device emulation).
