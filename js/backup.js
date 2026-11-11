/* backup.js — backup completo em JSON, restauração validada, modo demonstração e zona de perigo */
(function () {
  'use strict';
  const { icon, esc, int, $, handleError } = DL.ui;
  let pending = null;

  async function refreshInfo() {
    const c = {};
    for (const s of ['products', 'productions', 'sales', 'expenses', 'recipes']) c[s] = await DL.db.count(s);
    $('#counts').innerHTML = '<span class="pill">' + int(c.products) + ' produtos</span><span class="pill">' + int(c.productions) + ' produções</span><span class="pill">' + int(c.sales) + ' vendas</span><span class="pill">' + int(c.expenses) + ' despesas</span><span class="pill">' + int(c.recipes) + ' receitas suas</span>';
    const last = await DL.db.getSetting('lastBackupAt', null);
    const pill = $('#last-pill');
    if (DL.mode.isDemo()) { pill.className = 'pill gold'; pill.textContent = 'Demonstração'; }
    else if (!last) { pill.className = 'pill warn'; pill.textContent = 'Nunca feito'; }
    else { const days = Math.floor((Date.now() - last) / 86400000); pill.className = 'pill ' + (days > 30 ? 'warn' : 'ok'); pill.textContent = 'Último: ' + new Date(last).toLocaleDateString('pt-BR') + (days > 30 ? ' (antigo)' : ''); }
  }

  async function doExport() {
    try {
      const b = await DL.backup.build();
      const stamp = new Date().toISOString().slice(0, 16).replace(/[:T]/g, '-');
      DL.ui.download('doce-lucrativo-backup-' + (DL.mode.isDemo() ? 'demo-' : '') + stamp + '.json', JSON.stringify(b, null, 2), 'application/json;charset=utf-8');
      if (!DL.mode.isDemo()) await DL.db.setSetting('lastBackupAt', Date.now());
      DL.ui.toast('Backup gerado. Guarde o arquivo em local seguro.', 'ok');
      await refreshInfo();
    } catch (err) { handleError(err); }
  }

  async function onFile(e) {
    const file = e.target.files[0]; e.target.value = ''; pending = null;
    const box = $('#restore-info'); box.innerHTML = '';
    if (!file) return;
    try {
      if (file.size > 60 * 1024 * 1024) throw new DL.DLError('Arquivo grande demais para ser um backup válido.');
      const parsed = DL.backup.parse(await file.text());
      const c = DL.backup.counts(parsed); pending = parsed;
      const date = parsed.exportedAt ? new Date(parsed.exportedAt).toLocaleString('pt-BR') : 'data desconhecida';
      box.innerHTML = '<div class="alert ok">' + icon('check') + '<div><b>Arquivo válido</b> (' + esc(file.name) + '), gerado em ' + esc(date) + '.<br>' + int(c.products) + ' produtos · ' + int(c.productions) + ' produções · ' + int(c.sales) + ' vendas · ' + int(c.expenses) + ' despesas · ' + int(c.recipes) + ' receitas.</div></div>' +
        '<div class="form-actions" style="margin-top:12px"><button class="btn gold" type="button" id="btn-restore">' + icon('upload') + ' Restaurar estes dados</button></div>';
      $('#btn-restore').addEventListener('click', doRestore);
    } catch (err) { box.innerHTML = '<div class="alert bad">' + icon('alert') + '<span>' + esc(err.message || 'Arquivo inválido.') + '</span></div>'; }
  }

  async function doRestore() {
    if (!pending) return;
    const mismatch = pending.mode && pending.mode !== DL.mode.get();
    const ok = await DL.ui.confirm({
      title: 'Substituir todos os dados?', confirmText: 'Sim, restaurar',
      message: 'Tudo o que existe agora será trocado pelo conteúdo do backup. Isso não pode ser desfeito.' + (mismatch ? ' Atenção: este backup foi gerado no modo ' + (pending.mode === 'demo' ? 'demonstração' : 'real') + ', mas você está no modo ' + (DL.mode.isDemo() ? 'demonstração' : 'real') + '.' : ''),
    });
    if (!ok) return;
    try {
      await DL.backup.restore(pending); pending = null;
      if (!DL.mode.isDemo()) await DL.db.setSetting('lastBackupAt', Date.now());
      $('#restore-info').innerHTML = '<div class="alert ok">' + icon('check') + '<span>Backup restaurado com sucesso!</span></div>';
      DL.ui.toast('Dados restaurados.', 'ok'); await refreshInfo();
    } catch (err) { handleError(err); }
  }

  async function wipe() {
    const ok = await DL.ui.confirm({ title: 'Apagar tudo?', message: 'Todos os registros deste aparelho serão apagados definitivamente. Se não tiver backup, não há como recuperar.', confirmText: 'Apagar tudo', typed: 'APAGAR' });
    if (!ok) return;
    try { await DL.backup.wipe(); DL.ui.toast('Todos os dados foram apagados.', 'ok'); await refreshInfo(); } catch (err) { handleError(err); }
  }

  function renderDemo() {
    const demo = DL.mode.isDemo();
    $('#demo-actions').innerHTML = demo
      ? '<span class="pill gold">Você está na demonstração</span><button class="btn" type="button" data-act="reset-demo">' + icon('reset') + ' Restaurar exemplos</button><button class="btn gold" type="button" data-act="exit-demo">Voltar aos meus dados</button>'
      : '<button class="btn gold" type="button" data-act="enter-demo">' + icon('eye') + ' Abrir demonstração</button>';
    $('#danger').hidden = demo;
  }

  function renderAuth() {
    const a = DL.auth.config;
    $('#auth-info').innerHTML = a.enabled
      ? '<p class="muted">Login individual ativo. O acesso é confirmado em <code>' + esc(a.endpoint) + '</code>.</p>'
      : '<p class="muted">Acesso <b>local e sem login</b>. O sistema funciona sozinho neste navegador. A estrutura para login individual e liberação por compra aprovada na Hotmart já está preparada (arquivo <code>js/auth.js</code> e guia <code>docs/HOTMART.md</code>).</p><p class="hint">Nenhuma senha ou chave de integração é guardada no navegador.</p>';
  }

  DL.ui.boot(async function () {
    $('#btn-export').innerHTML = icon('download') + ' Baixar backup completo';
    $('#file-label').innerHTML = icon('upload') + ' Escolher arquivo de backup';
    $('#btn-wipe').innerHTML = icon('trash') + ' Apagar todos os dados';
    $('#btn-export').addEventListener('click', doExport);
    $('#f-file').addEventListener('change', onFile);
    $('#btn-wipe').addEventListener('click', wipe);
    renderDemo(); renderAuth(); await refreshInfo();
  });
})();
