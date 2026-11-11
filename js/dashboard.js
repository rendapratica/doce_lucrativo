/* dashboard.js — painel principal: indicadores, período, gráficos e estoque */
(function () {
  'use strict';
  const { icon, esc, money, int, pct, $, $$ } = DL.ui;
  let data, gran = 'day', range = null;

  function topCards() {
    const t = DL.dates.today();
    const day = DL.calc.summarize(data, t, t), week = DL.calc.summarize(data, DL.dates.startOfWeek(t), t), month = DL.calc.summarize(data, DL.dates.startOfMonth(t), t);
    $('#top-cards').innerHTML =
      DL.ui.stat('Faturamento do dia', money(day.revenue), { icon: 'cart', tone: 'feature', note: day.salesCount + ' venda(s) · ' + int(day.unitsSold) + ' doces' }) +
      DL.ui.stat('Faturamento da semana', money(week.revenue), { icon: 'calendar', tone: 'gold', note: 'desde segunda-feira · ' + week.salesCount + ' venda(s)' }) +
      DL.ui.stat('Faturamento do mês', money(month.revenue), { icon: 'trend', tone: 'gold', note: month.salesCount + ' venda(s) · ticket médio ' + money(month.ticket) });
  }

  // Cartões do período escolhido. Devolve false se o período for inválido.
  function periodCards() {
    const r = range;
    if (!r || r.error) {
      $('#period-msg').innerHTML = r ? '<div class="alert bad">' + icon('alert') + '<span>' + esc(r.error) + '</span></div>' : '';
      $('#period-cards').innerHTML = '';
      return false;
    }
    $('#period-msg').innerHTML = '<p class="muted small" style="margin-top:-6px">De ' + DL.dates.br(r.from) + ' até ' + DL.dates.br(r.to) + '</p>';
    const s = DL.calc.summarize(data, r.from, r.to), stock = data.products.reduce((a, p) => a + p.stock, 0);
    $('#period-cards').innerHTML =
      DL.ui.stat('Faturamento', money(s.revenue), { icon: 'dollar', tone: 'gold', note: 'tudo o que você vendeu' }) +
      DL.ui.stat('Lucro bruto', money(s.grossProfit), { icon: 'tag', tone: s.grossProfit >= 0 ? 'green' : 'red', note: 'faturamento − custo dos doces vendidos' }) +
      DL.ui.stat('Total de despesas', money(s.expenses), { icon: 'wallet', tone: 'red', note: 'compras e gastos lançados' }) +
      DL.ui.stat('Lucro estimado', money(s.estimatedProfit), { icon: 'trend', tone: s.estimatedProfit >= 0 ? 'green' : 'red', note: 'faturamento − despesas' + (s.revenue > 0 ? ' · ' + pct((s.estimatedProfit / s.revenue) * 100) : '') }) +
      DL.ui.stat('Doces produzidos', int(s.produced), { icon: 'cake', note: 'custo da produção ' + money(s.productionCost) }) +
      DL.ui.stat('Doces vendidos', int(s.unitsSold), { icon: 'cart', note: s.salesCount + ' venda(s)' }) +
      DL.ui.stat('Ticket médio', money(s.ticket), { icon: 'coins', note: 'valor médio por venda' }) +
      DL.ui.stat('Estoque disponível', int(stock), { icon: 'box', tone: 'dark', note: 'agora, em ' + data.products.length + ' produto(s)' });
    return true;
  }

  function charts() {
    const r = range; if (!r || r.error) return;
    DL.charts.revenue('ch-rev', DL.calc.series(data, gran, r.from, r.to), true);
    const top = DL.calc.topProducts(data.sales, r.from, r.to, 6);
    $('#top-empty').hidden = top.length > 0;
    $('#ch-top').parentNode.hidden = top.length === 0;
    if (top.length) DL.charts.doughnut('ch-top', top.map((x) => x.name), top.map((x) => x.qty));
  }

  function stock() {
    const list = data.products.slice().sort((a, b) => a.stock - b.stock || a.name.localeCompare(b.name, 'pt-BR'));
    if (!list.length) { $('#stock').innerHTML = DL.ui.emptyState('Nenhum produto cadastrado', 'Cadastre seus doces para acompanhar o estoque.', { href: 'produtos.html', label: 'Cadastrar produto', art: 'mix' }); return; }
    const total = list.reduce((a, p) => a + p.stock, 0), value = list.reduce((a, p) => a + p.stock * p.price, 0);
    const max = Math.max.apply(null, list.map((p) => p.stock).concat([1]));
    $('#stock').innerHTML = '<p class="muted" style="margin-top:-6px"><b>' + int(total) + '</b> doces em estoque, que valem <b>' + money(value) + '</b> a preço de venda.</p><div class="bars">' +
      list.map((p) => '<div class="bar-row"><span>' + esc(p.name) + '</span><div class="bar-track"><div class="bar-fill" style="width:' + Math.max(p.stock ? 3 : 0, (p.stock / max) * 100) + '%;' + (p.stock <= 5 ? 'background:linear-gradient(90deg,#d9794a,#b3372f)' : '') + '"></div></div><b>' + int(p.stock) + (p.stock === 0 ? ' · esgotado' : p.stock <= 5 ? ' · baixo' : '') + '</b></div>').join('') + '</div>';
  }

  async function alerts() {
    const out = [];
    const last = await DL.db.getSetting('lastBackupAt', null);
    if (!DL.mode.isDemo() && data.products.length && (!last || Date.now() - last > 30 * 86400000)) {
      out.push('<div class="alert">' + icon('shield') + '<div><b>Faça um backup.</b> ' + (last ? 'O último foi há mais de 30 dias. ' : 'Você ainda não fez nenhum. ') + 'Seus dados ficam só neste aparelho. <a href="backup.html">Salvar backup agora</a>.</div></div>');
    }
    const empty = data.products.filter((p) => p.stock === 0);
    if (empty.length) {
      out.push('<div class="alert">' + icon('box') + '<div><b>' + empty.length + (empty.length === 1 ? ' produto esgotado' : ' produtos esgotados') + ':</b> ' + empty.slice(0, 4).map((p) => esc(p.name)).join(', ') + (empty.length > 4 ? '…' : '') + '. <a href="producao.html">Registrar produção</a>.</div></div>');
    }
    $('#alerts').innerHTML = out.length ? '<div class="grid" style="margin-bottom:20px">' + out.join('') + '</div>' : '';
  }

  function refresh() {
    range = DL.ui.readPeriod('d', $('#period-row'));
    if (periodCards()) charts();
  }

  DL.ui.boot(async function () {
    data = await DL.db.loadAll();
    $('#period-row').innerHTML = DL.ui.periodPicker('d') + '<button class="btn" type="button" id="apply" hidden>Aplicar</button>';
    topCards(); await alerts(); stock(); refresh();

    $('#d-p').addEventListener('change', () => {
      const custom = $('#d-p').value === 'custom';
      $('#apply').hidden = !custom;
      if (custom && !$('#d-f').value) { const r = DL.calc.presetRange('30d'); $('#d-f').value = r.from; $('#d-t').value = r.to; }
      refresh();
    });
    ['#d-f', '#d-t'].forEach((s) => $(s).addEventListener('change', refresh));
    $('#apply').addEventListener('click', refresh);
    $('#gran').addEventListener('click', (e) => {
      const b = e.target.closest('button[data-g]'); if (!b) return;
      gran = b.dataset.g;
      $$('#gran button').forEach((x) => x.classList.toggle('on', x === b));
      charts();
    });
  });
})();
