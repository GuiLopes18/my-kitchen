# My Kitchen — seu livro de receitas digital

Aplicação web para registrar, organizar e compartilhar receitas. Desenvolvida com **React + Vite**, **React Router** e **Supabase** (autenticação, banco PostgreSQL, armazenamento de fotografias e funções de backend).

## Começar no VS Code

**Requisitos:** Node.js e npm compatíveis com a versão do Vite definida em `package.json`.

```bash
npm install
cp .env.example .env.local
npm run dev
```

No Windows, copie `.env.example` para `.env.local` pelo Explorador de Arquivos ou use `Copy-Item .env.example .env.local` no PowerShell. Preencha nesse arquivo o endereço e a **chave pública** do Supabase. Não coloque senhas, `service_role` ou chaves secretas em variáveis `VITE_*`: elas são incluídas no código enviado ao navegador.

O `.env.local` deve permanecer apenas no computador e nas configurações do serviço de hospedagem. Ele está no `.gitignore` e **não está incluído neste pacote de revisão**.

```bash
npm run test   # Testes das funções reutilizáveis
npm run lint   # Verificação estática pelo Oxlint
npm run build  # Versão de produção (pasta dist/)
npm run preview
```

## Como o projeto está organizado

```text
src/
├── App.jsx                      # Rotas, sessão e estado da área autenticada
├── App.css                      # Estrutura visual compartilhada
├── main.jsx                     # Entrada: aplicação ou receita pública
├── config/
│   └── receitas.js              # Categorias, dificuldades, tags e unidades
├── services/
│   └── receitas.js              # Consultas, uploads, gravações e exclusões
├── lib/
│   └── supabaseClient.js        # Configuração do cliente Supabase
├── utils/
│   ├── tempo.js                 # Minutos ↔ horas e apresentação do tempo
│   ├── formatadoresReceita.js   # Textos iguais em telas privadas e públicas
│   ├── filtrosReceitas.js       # Regras combinadas de busca e filtros
│   └── *.test.js                # Testes unitários (node:test)
├── components/
│   ├── layout/
│   │   ├── Cabecalho.jsx
│   │   └── Rodape.jsx
│   ├── ui/
│   │   └── IconeGoogle.jsx       # SVG reutilizado nas telas de conta e login
│   ├── FormularioReceita.jsx    # Cadastro/edição em quatro etapas
│   ├── DetalhesReceita.jsx      # Detalhes e fotografia ampliável
│   ├── PaginaInicial.jsx
│   ├── PaginaReceitas.jsx
│   ├── CompartilharReceita.jsx   # Link privado e página pública
│   ├── Autenticacao.jsx
│   ├── Conta.jsx
│   ├── ExcluirConta.jsx
│   └── Modal.jsx
└── assets/                       # Ilustrações otimizadas em WebP
```

Os arquivos CSS de cada tela permanecem próximos dos seus componentes. Isso facilita localizar o estilo correspondente e evita criar uma folha única muito extensa.

## Fluxos que vale a pena estudar

**Salvar uma receita:** `FormularioReceita.jsx` valida quatro etapas. As três primeiras apenas avançam; somente a quarta permite salvar. `App.jsx` chama `services/receitas.js`, que envia a foto (se houver), grava os dados e atualiza a lista. Se o banco falhar após enviar a foto, o serviço tenta desfazer esse upload para não deixar arquivos sem receita.

**Fotografias privadas:** o banco guarda `image_path` (caminho), e não a URL de visualização. O serviço solicita URLs temporárias ao Storage. Por terem prazo de validade, as imagens podem precisar ser recarregadas após longos períodos com a página aberta; atualizar a página renova esses links.

**Compartilhamento:** `CompartilharReceita.jsx` gerencia tokens em `recipe_shares`. A leitura pública é realizada pela Edge Function `receita-publica`, que precisa estar implantada e validar o token no servidor. **A Edge Function não foi incluída no ZIP original**, por isso sua implementação e regras não foram auditadas.

**Excluir conta:** `ExcluirConta.jsx` chama uma Edge Function responsável por operações privilegiadas. Essa função também não está neste pacote. Nunca implemente exclusão de usuários com `service_role` no frontend.


## Dependências do Supabase

Este repositório é o **frontend**, não uma exportação completa do banco. Para executar todas as funções, o projeto Supabase precisa conter:

- Autenticação por e-mail e, se desejado, Google OAuth com URLs de redirecionamento configuradas.
- Tabela `recipes` com dono (`user_id`), informações da receita, `ingredientes`, `preparo`, `tags`, `observacoes`, `ja_cozinhei` e `image_path`.
- Tabela `recipe_shares` e mecanismo de token válido para a função pública.
- Buckets `recipe-images` e `profile-photos`, mais as políticas RLS de acesso por proprietário.
- Edge Functions para receita pública e exclusão de conta, configuradas com as permissões adequadas.

**RLS e autorizações são medidas obrigatórias**, mesmo quando o frontend faz `.eq("user_id", usuarioId)`. Filtrar pelo usuário no navegador não substitui regras no banco.
