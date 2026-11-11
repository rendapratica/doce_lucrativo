# Integração com a Hotmart (preparada, ainda não ligada)

Hoje o Doce Lucrativo roda 100% no navegador, sem login. Este guia descreve como ligar o **acesso individual por compra aprovada**, sem colocar nenhum segredo no JavaScript do site.

> **Regra de ouro:** o GitHub Pages só serve arquivos estáticos. Qualquer segredo (hottok, client secret) no JS ou no repositório público fica visível para todos. Por isso a validação de acesso fica em um **backend separado**, e o site só pergunta a ele "esta pessoa tem acesso?".

## Arquitetura

```
Comprador ──paga──► Hotmart ──webhook (POST)──► Backend (função serverless)
                                                     │  valida o hottok (segredo no backend)
                                                     │  grava/atualiza o comprador (ativo / bloqueado)
                                                     ▼
Comprador ──login──► Hotmart Club / Área de Membros
        │
        └─► site no GitHub Pages ──GET /session (cookie HttpOnly)──► Backend ──► { active: true|false }
```

Componentes:

1. **Webhook da Hotmart**: configurado em Ferramentas → Webhook (Hotmart). Envia eventos de compra para a URL do seu backend.
2. **Backend** (Cloudflare Workers, Vercel, Netlify Functions, Firebase Functions ou Google Apps Script): recebe os eventos, confere o `hottok` e guarda a lista de compradores.
3. **Site** (`js/auth.js`): chama `GET {endpoint}/session` com `credentials: 'include'`. Se `active: false`, mostra a tela "Acesso indisponível".

## Eventos do webhook e o que fazer

| Evento (Hotmart)              | Ação no backend                                   |
|-------------------------------|---------------------------------------------------|
| `PURCHASE_APPROVED`           | Cria/ativa o comprador (`status = active`)        |
| `PURCHASE_COMPLETE`           | Mantém ativo (fim do prazo de garantia)           |
| `PURCHASE_REFUNDED`           | `status = blocked`, motivo `refunded`             |
| `PURCHASE_CANCELED`           | `status = blocked`, motivo `canceled`             |
| `PURCHASE_CHARGEBACK`         | `status = blocked`, motivo `chargeback`           |
| `PURCHASE_DELAYED` / `PURCHASE_EXPIRED` | Em planos de assinatura, siga a sua regra |

Confirme os nomes e o formato exatos dos eventos na documentação oficial da Hotmart antes de implementar; eles podem mudar. A decisão de bloquear após reembolso ou cancelamento deve seguir as **regras do seu produto, a política de garantia e o Código de Defesa do Consumidor**. Em caso de dúvida, consulte um profissional.

## Contrato esperado pelo site (`js/auth.js`)

`GET {endpoint}/session` com cookie de sessão `HttpOnly; Secure; SameSite=None`:

```json
200 { "active": true,  "user": { "name": "Maria", "email": "maria@exemplo.com" } }
200 { "active": false, "reason": "refunded" }      // refunded | canceled | chargeback | unknown
401                                                  // sem sessão: o site mostra o aviso de login
```

O backend precisa responder com CORS liberando **apenas** a origem do seu site (`Access-Control-Allow-Origin: https://SEU-USUARIO.github.io`) e `Access-Control-Allow-Credentials: true`.

## Passo a passo para ligar

1. Crie o backend e guarde o `hottok` em **variável de ambiente** (nunca no código).
2. Cadastre a URL do backend como webhook na Hotmart e envie um evento de teste.
3. Implemente o login (ideal: link mágico por e-mail do comprador, ou a Área de Membros / Hotmart Club apontando para o site).
4. Em `js/auth.js`, preencha `endpoint`, `loginUrl` e `supportUrl` e mude `enabled` para `true`.
5. Teste: compra de teste liberando, reembolso bloqueando.

## Limites que você precisa saber

- Como os dados do negócio ficam no navegador de cada cliente, o bloqueio **não apaga** nada: ao regularizar o acesso, tudo reaparece.
- Bloqueio feito só no front-end pode ser contornado por quem entende de navegador. Para proteger o conteúdo de forma forte (por exemplo, as receitas), mova as receitas para o backend e entregue-as só a sessões ativas.
- Esta pasta **não contém** nenhum segredo. Se você colocar um, apague e gere outro na Hotmart.
