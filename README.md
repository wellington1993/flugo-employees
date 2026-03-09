# Flugo Staff Manager

Gerenciador de colaboradores desenvolvido com foco em performance, UX resiliente e suporte offline.

A aplicação utiliza um formulário multi-etapa com persistência de rascunho e sincronização automática com o Firebase Firestore.

## 🚀 Demo
Produção na Vercel: [https://flugo-employees-theta.vercel.app](https://flugo-employees-theta.vercel.app)

---

## 🛠 Tech Stack
- **Framework:** React 19 + TypeScript + Vite
- **UI:** Material UI v7 + Emotion
- **State & Data:** TanStack Query (React Query) v5
- **Forms:** React Hook Form + Zod
- **Backend:** Firebase Firestore
- **Roteamento:** React Router v7

## ✨ Diferenciais Técnicos
- **Optimistic Updates:** Feedback instantâneo na UI ao cadastrar, sem esperar resposta do servidor.
- **Offline-First:** Persistência nativa do Firestore (IndexedDB) + Fallback em LocalStorage para garantir que dados nunca se percam.
- **Draft Persistence:** Rascunho automático do formulário no LocalStorage (evita perda de dados ao atualizar a página).
- **Skeleton Loading:** Transições fluidas e sem saltos de layout durante o carregamento inicial.

---

## 📦 Como Rodar

### Localmente
1. Instale as dependências: `npm install`
2. Configure o `.env` (baseie-se no `.env.example`)
3. Inicie o dev: `npm run dev` (disponível em `http://localhost:5173`)

### Com Docker
```bash
docker compose up --build
```
Disponível em `http://localhost:3000`.

---

## 🧪 Testes
O projeto conta com uma suíte de testes robusta:
- **Unitários (Vitest):** Lógica de negócio, validações e hooks.
  - `npm run test`
- **E2E (Playwright):** Fluxo real de usuário e integração.
  - `npm run test:e2e`

---

## ⚙️ Configuração do Firebase
1. Crie um projeto no Firebase Console.
2. Ative o **Firestore Database** em modo de teste.
3. Obtenha as chaves web e configure no seu `.env`.

### Regras do Firestore
As regras estão no arquivo `firestore.rules`. Para deploy:
```bash
npx firebase-tools deploy --only firestore:rules --project SEU_ID
```
