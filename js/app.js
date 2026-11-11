/* app.js — casca compartilhada: menu, ícones, diálogos de confirmação, avisos, fotos, download,
   inicialização das páginas. Depende de calc.js, database.js e art.js. */
(function (global) {
  'use strict';
  const DL = (global.DL = global.DL || {});
  const doc = global.document;

  /* ---------- Ícones (traço, estilo moderno) ---------- */
  const ICONS = {
    home: '<path d="M3 11.5 12 4l9 7.5"/><path d="M5 10v10h14V10"/><path d="M10 20v-6h4v6"/>',
    chart: '<path d="M3 3v18h18"/><path d="M8 17v-6"/><path d="M13 17V7"/><path d="M18 17v-9"/>',
    box: '<path d="M21 8 12 3 3 8v8l9 5 9-5V8Z"/><path d="m3 8 9 5 9-5"/><path d="M12 13v8"/>',
    cake: '<path d="M4 21h16"/><path d="M5 21v-7a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v7"/><path d="M5 16c2 1.4 3.5 1.4 5 0s3-1.4 4.5 0 3 1.4 4.5 0"/><path d="M12 12V8"/><path d="M12 4c.8 1 .8 2 0 3-.8-1-.8-2 0-3Z"/>',
    cart: '<circle cx="9" cy="20" r="1.3"/><circle cx="18" cy="20" r="1.3"/><path d="M2 3h3l2.4 12.2a1.5 1.5 0 0 0 1.5 1.2h8.7a1.5 1.5 0 0 0 1.5-1.1L21 8H6"/>',
    wallet: '<path d="M3 7a2 2 0 0 1 2-2h13v3"/><path d="M3 7v11a2 2 0 0 0 2 2h15a1 1 0 0 0 1-1v-3"/><path d="M21 9H6a3 3 0 0 0-3 3"/><circle cx="17" cy="14" r="1.2"/>',
    calc: '<rect x="5" y="3" width="14" height="18" rx="2"/><path d="M8 7h8"/><path d="M8 12h.01M12 12h.01M16 12h.01M8 16h.01M12 16h.01M16 16h.01"/>',
    file: '<path d="M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8Z"/><path d="M14 3v5h5"/><path d="M9 13h6M9 17h6"/>',
    book: '<path d="M4 5a2 2 0 0 1 2-2h13v15H6a2 2 0 0 0-2 2Z"/><path d="M4 20a2 2 0 0 0 2 2h13v-4"/><path d="M9 7h6"/>',
    shield: '<path d="M12 3 4 6v6c0 4.5 3.2 7.8 8 9 4.8-1.2 8-4.5 8-9V6Z"/><path d="m9 12 2 2 4-4"/>',
    menu: '<path d="M4 6h16M4 12h16M4 18h16"/>', plus: '<path d="M12 5v14M5 12h14"/>',
    edit: '<path d="M12 20h9"/><path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4Z"/>',
    trash: '<path d="M3 6h18"/><path d="M8 6V4h8v2"/><path d="M6 6l1 14h10l1-14"/><path d="M10 10v6M14 10v6"/>',
    search: '<circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5"/>', x: '<path d="M6 6l12 12M18 6 6 18"/>',
    alert: '<path d="M12 3 2 20h20Z"/><path d="M12 10v4M12 17h.01"/>', check: '<path d="m5 12 5 5 9-10"/>',
    download: '<path d="M12 4v11"/><path d="m7 11 5 5 5-5"/><path d="M4 20h16"/>', upload: '<path d="M12 16V5"/><path d="m7 9 5-5 5 5"/><path d="M4 20h16"/>',
    trend: '<path d="m3 17 6-6 4 4 8-8"/><path d="M15 7h6v6"/>', dollar: '<path d="M12 3v18"/><path d="M16.5 7.5C15.5 6 14 5.5 12 5.5c-2.5 0-4 1.2-4 3s1.5 2.7 4 3.2 4 1.3 4 3.2-1.5 3-4 3c-2 0-3.7-.7-4.7-2.2"/>',
    coins: '<ellipse cx="9" cy="7" rx="6" ry="3"/><path d="M3 7v5c0 1.7 2.7 3 6 3s6-1.3 6-3V7"/><path d="M15 11c3.3 0 6 1.3 6 3v3c0 1.7-2.7 3-6 3-1.6 0-3-.3-4-.9"/>',
    calendar: '<rect x="4" y="5" width="16" height="15" rx="2"/><path d="M8 3v4M16 3v4M4 10h16"/>', camera: '<path d="M4 8h3l2-3h6l2 3h3v11H4Z"/><circle cx="12" cy="13" r="3.5"/>',
    reset: '<path d="M3 12a9 9 0 1 0 3-6.7L3 8"/><path d="M3 3v5h5"/>', info: '<circle cx="12" cy="12" r="9"/><path d="M12 11v5M12 8h.01"/>',
    clock: '<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>', tag: '<path d="M3 12V4h8l9 9-8 8Z"/><circle cx="7.5" cy="8.5" r="1"/>',
    sparkle: '<path d="M12 3l1.8 5.2L19 10l-5.2 1.8L12 17l-1.8-5.2L5 10l5.2-1.8Z"/><path d="M19 17l.7 2 2 .7-2 .7L19 22l-.7-1.6-2-.7 2-.7Z"/>',
    layers: '<path d="m12 3 9 5-9 5-9-5Z"/><path d="m3 13 9 5 9-5"/>', eye: '<path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12Z"/><circle cx="12" cy="12" r="3"/>',
    lock: '<rect x="5" y="11" width="14" height="10" rx="2"/><path d="M8 11V8a4 4 0 0 1 8 0v3"/>', percent: '<path d="M19 5 5 19"/><circle cx="7" cy="7" r="2.2"/><circle cx="17" cy="17" r="2.2"/>',
  };
  const icon = (n, cls) => '<svg class="icon ' + (cls || '') + '" viewBox="0 0 24 24" aria-hidden="true">' + (ICONS[n] || '') + '</svg>';

  /* ---------- Utilidades ---------- */
  const esc = (s) => String(s == null ? '' : s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const brl = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' });
  const intf = new Intl.NumberFormat('pt-BR');
  const money = (n) => brl.format(Number.isFinite(n) ? n : 0);
  const int = (n) => intf.format(Number.isFinite(n) ? n : 0);
  const pct = (n) => (Number.isFinite(n) ? n.toLocaleString('pt-BR', { maximumFractionDigits: 1 }) : '0') + '%';
  const $ = (sel, root) => (root || doc).querySelector(sel);
  const $$ = (sel, root) => Array.from((root || doc).querySelectorAll(sel));
  const debounce = (fn, ms) => { let t; return (...a) => { clearTimeout(t); t = setTimeout(() => fn(...a), ms || 200); }; };
  const signed = (n) => '<span class="' + (n >= 0 ? 'pos' : 'neg') + '">' + money(n) + '</span>';

  /* ---------- Avisos (toasts) ---------- */
  function toast(msg, type) {
    let box = $('.toasts');
    if (!box) { box = doc.createElement('div'); box.className = 'toasts'; box.setAttribute('role', 'status'); box.setAttribute('aria-live', 'polite'); doc.body.appendChild(box); }
    const t = doc.createElement('div');
    t.className = 'toast ' + (type || '');
    t.innerHTML = icon(type === 'err' ? 'alert' : 'check') + '<span>' + esc(msg) + '</span>';
    box.appendChild(t);
    setTimeout(() => { t.style.transition = 'opacity .3s'; t.style.opacity = '0'; setTimeout(() => t.remove(), 320); }, type === 'err' ? 6500 : 3200);
  }

  /* ---------- Diálogos ---------- */
  function openDialog(dlg) { if (typeof dlg.showModal === 'function') { if (!dlg.open) dlg.showModal(); } else dlg.setAttribute('open', ''); }
  function closeDialog(dlg) { if (typeof dlg.close === 'function') dlg.close(); else dlg.removeAttribute('open'); }
  // Confirmação antes de ações destrutivas
  function confirmBox(o) {
    return new Promise((resolve) => {
      const d = doc.createElement('dialog');
      d.className = 'confirm';
      d.setAttribute('aria-labelledby', 'cf-title');
      d.innerHTML = '<div class="dlg-body"><div class="confirm-ico ' + (o.danger === false ? 'neutral' : '') + '">' + icon(o.danger === false ? 'info' : 'trash') + '</div>' +
        '<h2 id="cf-title">' + esc(o.title || 'Tem certeza?') + '</h2><p class="muted">' + esc(o.message || '') + '</p>' +
        (o.typed ? '<div class="field"><label for="cf-typed">Digite <b>' + esc(o.typed) + '</b> para confirmar</label><input type="text" id="cf-typed" autocomplete="off"></div>' : '') +
        '<div class="form-actions"><button class="btn ghost" data-r="0" type="button">' + esc(o.cancelText || 'Cancelar') + '</button>' +
        '<button class="btn ' + (o.danger === false ? 'primary' : 'danger solid') + '" data-r="1" type="button">' + esc(o.confirmText || 'Confirmar') + '</button></div></div>';
      doc.body.appendChild(d);
      let done = false;
      const finish = (v) => { if (done) return; done = true; closeDialog(d); d.remove(); resolve(v); };
      d.addEventListener('cancel', (e) => { e.preventDefault(); finish(false); });
      d.addEventListener('click', (e) => {
        const b = e.target.closest('button[data-r]');
        if (!b) return;
        if (b.dataset.r === '1') {
          if (o.typed && $('#cf-typed', d).value.trim().toUpperCase() !== String(o.typed).toUpperCase()) { $('#cf-typed', d).focus(); return; }
          finish(true);
        } else finish(false);
      });
      openDialog(d);
      const first = $('#cf-typed', d) || $('button[data-r="0"]', d); if (first) first.focus();
    });
  }
  // Liga botões "fechar" e fechamento ao clicar fora em <dialog> da página
  function wireDialogs() {
    $$('dialog[data-modal]').forEach((d) => {
      d.addEventListener('click', (e) => { if (e.target.closest('[data-close]')) closeDialog(d); else if (e.target === d) closeDialog(d); });
    });
  }

  /* ---------- Formulários ---------- */
  function showErrors(form, errors) {
    $$('.field', form).forEach((f) => f.classList.remove('invalid'));
    $$('.err', form).forEach((e) => { e.textContent = ''; });
    let first = null;
    Object.keys(errors || {}).forEach((k) => {
      const e = $('.err[data-err="' + k + '"]', form);
      if (e) { e.textContent = errors[k]; const fld = e.closest('.field'); if (fld) fld.classList.add('invalid'); }
      const ctl = form.elements[k]; if (ctl && !first) first = ctl;
    });
    if (first && first.focus) first.focus();
  }
  const formData = (form) => { const o = {}; Array.from(form.elements).forEach((el) => { if (!el.name) return; o[el.name] = el.type === 'checkbox' ? el.checked : el.value; }); return o; };
  const fillForm = (form, o) => { Array.from(form.elements).forEach((el) => { if (!el.name || !(el.name in o)) return; if (el.type === 'checkbox') el.checked = !!o[el.name]; else if (el.type !== 'file') el.value = o[el.name] == null ? '' : o[el.name]; }); };
  const moneyStr = (n) => (Number(n) || 0).toFixed(2).replace('.', ',');
  const options = (list, sel, ph) => (ph ? '<option value="">' + esc(ph) + '</option>' : '') + list.map((x) => { const v = Array.isArray(x) ? x[0] : x, l = Array.isArray(x) ? x[1] : x; return '<option value="' + esc(v) + '"' + (String(v) === String(sel) ? ' selected' : '') + '>' + esc(l) + '</option>'; }).join('');

  // Trata erros de operação: validação nos campos, demais como aviso
  function handleError(err, form) {
    if (err && err.name === 'ValidationError') { if (form) showErrors(form, err.errors); toast('Confira os campos destacados.', 'err'); return; }
    if (err && err.name === 'DLError') { toast(err.message, 'err'); return; }
    if (err && err.name === 'QuotaExceededError') { toast('Sem espaço no navegador. Faça um backup e libere espaço.', 'err'); return; }
    console.error(err); toast('Algo deu errado. Tente novamente. (' + (err && err.message ? err.message : 'erro desconhecido') + ')', 'err');
  }

  /* ---------- Fotos: redimensiona antes de salvar (economiza espaço) ---------- */
  function readImage(file, max) {
    max = max || 720;
    return new Promise((resolve, reject) => {
      if (!file) { reject(new DL.DLError('Nenhum arquivo escolhido.')); return; }
      if (!/^image\/(jpeg|png|webp|gif)$/.test(file.type)) { reject(new DL.DLError('Use uma imagem JPG, PNG ou WEBP.')); return; }
      if (file.size > 12 * 1024 * 1024) { reject(new DL.DLError('A imagem é muito grande (máx. 12 MB).')); return; }
      const fr = new FileReader();
      fr.onerror = () => reject(new DL.DLError('Não foi possível ler a imagem.'));
      fr.onload = () => {
        const img = new Image();
        img.onerror = () => reject(new DL.DLError('Imagem inválida.'));
        img.onload = () => {
          const k = Math.min(1, max / Math.max(img.width, img.height)), c = doc.createElement('canvas');
          c.width = Math.round(img.width * k); c.height = Math.round(img.height * k);
          const ctx = c.getContext('2d'); ctx.fillStyle = '#fff'; ctx.fillRect(0, 0, c.width, c.height); ctx.drawImage(img, 0, 0, c.width, c.height);
          resolve(c.toDataURL('image/jpeg', 0.82));
        };
        img.src = fr.result;
      };
      fr.readAsDataURL(file);
    });
  }

  function download(name, text, mime) {
    const blob = new Blob([text], { type: mime || 'text/plain;charset=utf-8' });
    const a = doc.createElement('a'); a.href = URL.createObjectURL(blob); a.download = name; doc.body.appendChild(a); a.click();
    setTimeout(() => { URL.revokeObjectURL(a.href); a.remove(); }, 500);
  }
  const downloadCSV = (name, headers, rows) => download(name, '﻿' + DL.calc.toCSV(headers, rows), 'text/csv;charset=utf-8');

  /* ---------- Menu e casca da página ---------- */
  const NAV = [
    ['index', 'index.html', 'Início', 'home'], ['dashboard', 'dashboard.html', 'Painel', 'chart'], ['vendas', 'vendas.html', 'Vendas', 'cart'],
    ['producao', 'producao.html', 'Produção', 'cake'], ['produtos', 'produtos.html', 'Produtos', 'box'], ['despesas', 'despesas.html', 'Despesas', 'wallet'],
    ['calculadora', 'calculadora.html', 'Calculadora de preços', 'calc'], ['relatorios', 'relatorios.html', 'Relatórios', 'file'],
    ['receitas', 'receitas.html', 'Receitas', 'book'], ['backup', 'backup.html', 'Backup e ajustes', 'shield'],
  ];
  const BOTTOM = [['dashboard', 'Painel', 'chart'], ['vendas', 'Vendas', 'cart'], ['producao', 'Produção', 'cake'], ['receitas', 'Receitas', 'book']];
  const LOGO = '<svg class="brand-logo" viewBox="0 0 48 48" aria-hidden="true"><defs><linearGradient id="lg" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#e6c878"/><stop offset="1" stop-color="#b08a34"/></linearGradient></defs><circle cx="24" cy="24" r="23" fill="#3b2216" stroke="url(#lg)" stroke-width="2"/><path d="M13 27c0-6 5-11 11-11s11 5 11 11H13Z" fill="url(#lg)"/><path d="M12 28h24l-2.4 8.5a3 3 0 0 1-2.9 2.2H17.3a3 3 0 0 1-2.9-2.2Z" fill="#fbf5ea"/><path d="M18 29l1.4 9M24 29v9.5M30 29l-1.4 9" stroke="#c9a24b" stroke-width="1.4"/><circle cx="24" cy="13.5" r="3" fill="#b9763f"/></svg>';

  function buildShell(page, title, sub) {
    const main = $('#content');
    const shell = doc.createElement('div'); shell.className = 'shell';
    const side = '<aside class="sidebar" id="sidebar" aria-label="Menu principal"><a class="brand" href="index.html">' + LOGO + '<span><span class="brand-name">Doce Lucrativo</span><br><span class="brand-tag">Receitas &amp; gestão</span></span></a><nav class="nav">' +
      NAV.map((n, i) => (i === 1 || i === 8 ? '<div class="nav-sep"></div>' : '') + '<a href="' + n[1] + '"' + (n[0] === page ? ' class="active" aria-current="page"' : '') + '>' + icon(n[3]) + '<span>' + n[2] + '</span></a>').join('') +
      '</nav><div class="side-foot"><div id="side-mode"></div><p class="small" style="margin:12px 4px 0">Seus dados ficam salvos neste aparelho. Faça backup com frequência.</p></div></aside><div class="backdrop" id="backdrop"></div>';
    const col = doc.createElement('div'); col.className = 'main-col';
    col.innerHTML = '<header class="topbar"><button class="btn ghost icon-only menu-btn" id="menu-btn" type="button" aria-label="Abrir menu" aria-controls="sidebar">' + icon('menu') + '</button><div class="grow"><h1>' + esc(title) + '</h1>' + (sub ? '<p class="sub">' + esc(sub) + '</p>' : '') + '</div><span id="mode-pill"></span></header><div id="banner"></div>';
    col.appendChild(main);
    shell.innerHTML = side; shell.appendChild(col);
    const bn = doc.createElement('nav'); bn.className = 'bottomnav'; bn.setAttribute('aria-label', 'Atalhos');
    bn.innerHTML = BOTTOM.map((b) => '<a href="' + b[0] + '.html"' + (b[0] === page ? ' class="active"' : '') + '>' + icon(b[2]) + '<span>' + b[1] + '</span></a>').join('') + '<button type="button" id="bn-more">' + icon('menu') + '<span>Menu</span></button>';
    shell.appendChild(bn);
    doc.body.insertBefore(shell, doc.body.firstChild);
    const toggle = (open) => doc.body.classList.toggle('nav-open', open);
    $('#menu-btn').addEventListener('click', () => toggle(!doc.body.classList.contains('nav-open')));
    $('#bn-more').addEventListener('click', () => toggle(true));
    $('#backdrop').addEventListener('click', () => toggle(false));
    $$('.nav a').forEach((a) => a.addEventListener('click', () => toggle(false)));
    doc.addEventListener('keydown', (e) => { if (e.key === 'Escape') toggle(false); });
    renderMode();
  }

  function renderMode() {
    const demo = DL.mode.isDemo();
    const side = $('#side-mode'), pill = $('#mode-pill'), banner = $('#banner');
    if (side) side.innerHTML = demo
      ? '<button class="btn gold" type="button" data-act="exit-demo">' + icon('reset') + ' Sair da demonstração</button>'
      : '<button class="btn" type="button" data-act="enter-demo" style="background:rgba(255,255,255,.1);color:#f3e6d0">' + icon('eye') + ' Ver demonstração</button>';
    if (pill) pill.innerHTML = demo ? '<span class="pill gold">' + icon('eye') + ' Demonstração</span>' : '';
    if (banner) banner.innerHTML = demo ? '<div class="demo-banner"><span>' + icon('info') + ' <strong>Modo demonstração:</strong> estes dados são fictícios e ficam separados dos seus registros reais.</span><button class="btn sm" type="button" data-act="reset-demo">' + icon('reset') + ' Restaurar exemplos</button><button class="btn sm gold" type="button" data-act="exit-demo">Voltar aos meus dados</button></div>' : '';
  }

  async function switchMode(toDemo) {
    if (toDemo) {
      const ok = await confirmBox({ title: 'Abrir a demonstração?', message: 'Você verá dados de exemplo para conhecer o sistema. Seus registros reais não serão alterados nem misturados.', confirmText: 'Abrir demonstração', danger: false });
      if (!ok) return;
    }
    DL.db.close(); DL.mode.set(toDemo ? 'demo' : 'real'); global.location.href = toDemo ? 'dashboard.html' : 'dashboard.html';
  }
  doc.addEventListener('click', async (e) => {
    const b = e.target.closest('[data-act]'); if (!b) return;
    const act = b.dataset.act;
    if (act === 'enter-demo') switchMode(true);
    else if (act === 'exit-demo') switchMode(false);
    else if (act === 'reset-demo') {
      const ok = await confirmBox({ title: 'Restaurar os exemplos?', message: 'Os dados fictícios da demonstração voltam ao estado original. Seus dados reais continuam intactos.', confirmText: 'Restaurar', danger: false });
      if (ok) { try { await DL.demo.seed(); global.location.reload(); } catch (err) { handleError(err); } }
    }
  });

  /* ---------- Inicialização das páginas ---------- */
  async function boot(init) {
    const body = doc.body, page = body.dataset.page || '';
    buildShell(page, body.dataset.title || 'Doce Lucrativo', body.dataset.sub || '');
    wireDialogs();
    const content = $('#content');
    try {
      if (DL.auth) { const a = await DL.auth.guard(); if (!a.allowed) { content.innerHTML = a.html; return; } }
      await DL.demo.ensure();
      await DL.db.open();
      await init();
    } catch (err) {
      console.error(err);
      content.innerHTML = '<div class="alert bad">' + icon('alert') + '<div><b>Não foi possível carregar os dados.</b><br>' + esc(err && err.message ? err.message : 'Erro desconhecido.') + '<br><span class="small">Dica: não use a aba anônima/privada e mantenha o navegador atualizado.</span></div></div>';
    }
  }

  /* ---------- Elementos reutilizáveis ---------- */
  const stat = (label, value, o) => {
    o = o || {};
    return '<div class="stat ' + (o.tone || '') + '"><div class="ico">' + icon(o.icon || 'coins') + '</div><div><div class="k">' + esc(label) + '</div><div class="v">' + value + '</div>' + (o.note ? '<div class="n">' + o.note + '</div>' : '') + '</div></div>';
  };
  const emptyState = (title, text, action) => '<div class="empty">' + DL.art(action && action.art ? action.art : 'brigadeiro').replace(/^<(svg|img) /, '<$1 class="art" ') + '<h3>' + esc(title) + '</h3><p>' + text + '</p>' + (action && action.href ? '<a class="btn primary" href="' + action.href + '">' + esc(action.label) + '</a>' : '') + '</div>';
  const periodPicker = (id) => '<div class="field"><label for="' + id + '-p">Período</label><select id="' + id + '-p">' + options(DL.PRESETS.map((p) => [p[0], p[1]]), '30d') + '</select></div>' +
    '<div class="field" data-custom hidden><label for="' + id + '-f">De</label><input type="date" id="' + id + '-f"></div><div class="field" data-custom hidden><label for="' + id + '-t">Até</label><input type="date" id="' + id + '-t"></div>';
  // Lê o período escolhido: devolve {from,to} ou {error}
  function readPeriod(id, root) {
    const sel = $('#' + id + '-p', root), v = sel.value;
    $$('[data-custom]', root || doc).forEach((el) => { el.hidden = v !== 'custom'; });
    if (v !== 'custom') return DL.calc.presetRange(v);
    const from = $('#' + id + '-f', root).value, to = $('#' + id + '-t', root).value;
    if (!DL.dates.isValid(from) || !DL.dates.isValid(to)) return { error: 'Escolha as duas datas do período.' };
    if (from > to) return { error: 'A data inicial não pode ser depois da final.' };
    return { from, to };
  }
  const thumb = (item, fallbackKind) => item.photo ? '<img src="' + esc(item.photo) + '" alt="' + esc(item.name) + '" loading="lazy">' : DL.art(fallbackKind, { label: 'Ilustração de ' + item.name });

  DL.ui = { icon, esc, money, int, pct, signed, $, $$, debounce, toast, confirm: confirmBox, openDialog, closeDialog, showErrors, formData, fillForm, moneyStr, options, handleError, readImage, download, downloadCSV, boot, stat, emptyState, periodPicker, readPeriod, thumb, renderMode };
})(typeof window !== 'undefined' ? window : globalThis);
