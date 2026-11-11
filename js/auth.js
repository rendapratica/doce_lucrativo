/* auth.js — ponto de integração para login individual e controle de acesso (Hotmart).

   HOJE: acesso local, sem login (enabled: false). O sistema funciona de forma independente.

   FUTURO: ligue `enabled` e aponte `endpoint` para a sua função de backend (ver docs/HOTMART.md).
   REGRAS DE SEGURANÇA:
   - NENHUM segredo (hottok, client secret, chaves) deve existir neste arquivo ou em qualquer JS do navegador.
     Eles ficam somente no backend (variáveis de ambiente da função serverless).
   - O navegador só pergunta ao backend "esta sessão tem acesso?" (cookie HttpOnly emitido pelo backend).
   - Bloquear no front-end sozinho NÃO é segurança real; é só experiência de uso. A decisão de acesso
     é do backend, que recebe os webhooks da Hotmart e mantém a lista de compradores ativos. */
(function (global) {
  'use strict';
  const DL = (global.DL = global.DL || {});

  const AUTH_CONFIG = {
    enabled: false,                  // true quando o backend estiver pronto
    endpoint: '',                    // ex.: 'https://acesso.seudominio.com.br' (sem segredos aqui)
    loginUrl: '',                    // página de login/Área de Membros (Hotmart Club) para onde redirecionar
    supportUrl: '',                  // link de suporte mostrado quando o acesso é negado
  };

  // Contrato esperado do backend: GET {endpoint}/session  (cookie HttpOnly, credentials: 'include')
  //   200 -> { "active": true,  "user": { "name": "...", "email": "..." } }
  //   200 -> { "active": false, "reason": "refunded" | "canceled" | "chargeback" | "unknown" }
  //   401 -> sem sessão (redirecionar para loginUrl)
  async function check() {
    if (!AUTH_CONFIG.enabled) return { allowed: true, user: null, mode: 'local' };
    try {
      const res = await fetch(AUTH_CONFIG.endpoint.replace(/\/$/, '') + '/session', { credentials: 'include', headers: { Accept: 'application/json' } });
      if (res.status === 401) return { allowed: false, reason: 'no-session' };
      if (!res.ok) return { allowed: false, reason: 'error' };
      const data = await res.json();
      if (data && data.active === true) return { allowed: true, user: data.user || null, mode: 'remote' };
      return { allowed: false, reason: (data && data.reason) || 'unknown' };
    } catch (e) {
      return { allowed: false, reason: 'offline' };
    }
  }

  function blockedHtml(reason) {
    const msgs = {
      'no-session': 'Faça login na Área de Membros para acessar o sistema.',
      refunded: 'O acesso foi encerrado porque a compra foi reembolsada.',
      canceled: 'O acesso foi encerrado porque a compra foi cancelada.',
      chargeback: 'O acesso foi suspenso por contestação da compra.',
      offline: 'Não foi possível confirmar seu acesso agora. Verifique a internet e tente de novo.',
      error: 'Não foi possível confirmar seu acesso agora. Tente novamente em instantes.',
    };
    const msg = msgs[reason] || 'Seu acesso não está ativo no momento.';
    const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
    return '<div class="card center" style="max-width:560px;margin:8vh auto"><h2>Acesso indisponível</h2><p class="muted">' + esc(msg) + '</p>' +
      (AUTH_CONFIG.loginUrl ? '<p><a class="btn primary" href="' + esc(AUTH_CONFIG.loginUrl) + '">Ir para o login</a></p>' : '') +
      (AUTH_CONFIG.supportUrl ? '<p class="small"><a href="' + esc(AUTH_CONFIG.supportUrl) + '">Falar com o suporte</a></p>' : '') +
      '<p class="small muted">Seus dados continuam salvos neste aparelho e voltam a aparecer quando o acesso for regularizado.</p></div>';
  }

  async function guard() {
    const r = await check();
    if (r.allowed) return { allowed: true, user: r.user };
    return { allowed: false, html: blockedHtml(r.reason) };
  }

  DL.auth = { config: AUTH_CONFIG, check, guard };
})(typeof window !== 'undefined' ? window : globalThis);
