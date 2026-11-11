/* relatorios.js — filtros por período, resumo, mais vendidos, evolução e exportação CSV */
(function () {
  'use strict';
  const { icon, esc, money, int, pct, signed, $, $$ } = DL.ui;
  let data, range = null, gran = 'day';

  const rows = {
    vendas: () => data.sales.filter((x) => DL.calc.inRange(x.date, range.from, range.to)).sort((a, b) => a.date.localeCompare(b.date) || a.id - b.id),
    producao: () => data.productions.filter((x) => DL.calc.inRange(x.date, range.from, range.to)).sort((a, b) => a.date.localeCompare(b.date) || a.id - b.id),
    despesas: () => data.expenses.filter((x) => DL.calc.inRange(x.date, range.from, range.to)).sort((a, b) => a.date.localeCompare(b.date) || a.id - b.id),
  };

  function render() {
    range = DL.ui.readPeriod('r', $('#period-row'));
    if (!range || range.error) { $('#period-msg').innerHTML = range ? '<div class="alert bad">' + icon('alert') + '<span>' + esc(range.error) + '</span></div>' : ''; $('#report').hidden = true; return; }
    $('#period-msg').innerHTML = '<p class="muted small" style="margin:0">Período: ' + DL.dates.br(range.from) + ' até ' + DL.dates.br(range.to) + '</p>';
    $('#report').hidden = false;
    const s = DL.calc.summarize(data, range.from, range.to);
    $('#cards').innerHTML =
      DL.ui.stat('Total vendido', money(s.revenue), { icon: 'dollar', tone: 'gold', note: s.salesCount + ' venda(s) · ' + int(s.unitsSold) + ' doces' }) +
      DL.ui.stat('Total produzido', int(s.produced), { icon: 'cake', note: 'custo ' + money(s.productionCost) }) +
      DL.ui.stat('Total de despesas', money(s.expenses), { icon: 'wallet', tone: 'red' }) +
      DL.ui.stat('Lucro estimado', money(s.estimatedProfit), { icon: 'trend', tone: s.estimatedProfit >= 0 ? 'green' : 'red', note: 'faturamento − despesas · lucro bruto ' + money(s.grossProfit) });
    DL.charts.revenue('ch-rev', DL.calc.series(data, gran, range.from, range.to), true);

    const top = DL.calc.topProducts(data.sales, range.from, range.to, 8), max = top.length ? top[0].qty : 1;
    $('#top').innerHTML = top.length ? '<div class="bars">' + top.map((t, i) => '<div class="bar-row"><span><span class="rank">' + (i + 1) + '</span>' + esc(t.name) + '</span><div class="bar-track"><div class="bar-fill" style="width:' + Math.max(5, (t.qty / max) * 100) + '%"></div></div><b>' + int(t.qty) + ' un.</b></div>').join('') + '</div><p class="muted small" style="margin-top:12px">Ordenados pela quantidade vendida. Faturamento do 1º: ' + money(top[0].revenue) + '.</p>' : '<p class="muted center" style="padding:30px 0">Sem vendas neste período.</p>';

    const sales = rows.vendas().reverse();
    $('#sales-list').innerHTML = sales.length ? '<div class="table-wrap"><table class="stack"><thead><tr><th>Data</th><th>Produto</th><th class="num">Qtd.</th><th class="num">Total</th><th class="num">Resultado</th><th>Pagamento</th></tr></thead><tbody>' +
      sales.slice(0, 200).map((x) => '<tr><td data-label="Data">' + DL.dates.br(x.date) + '</td><td data-label="Produto">' + esc(x.productName) + '</td><td class="num" data-label="Qtd.">' + int(x.qty) + '</td><td class="num" data-label="Total">' + money(x.total) + '</td><td class="num" data-label="Resultado">' + signed(x.profit) + '</td><td data-label="Pagamento">' + esc(x.payment) + '</td></tr>').join('') +
      '</tbody></table></div>' + (sales.length > 200 ? '<p class="muted small">Mostrando as 200 vendas mais recentes. O CSV traz todas.</p>' : '') : '<p class="muted center" style="padding:24px 0">Sem vendas neste período.</p>';
  }

  function exportCSV(kind) {
    if (!range || range.error) { DL.ui.toast('Escolha um período válido antes de exportar.', 'err'); return; }
    const tag = range.from + '_a_' + range.to;
    if (kind === 'resumo') {
      const s = DL.calc.summarize(data, range.from, range.to), top = DL.calc.topProducts(data.sales, range.from, range.to);
      const body = [['Período', DL.dates.br(range.from) + ' a ' + DL.dates.br(range.to)], ['Total vendido (R$)', s.revenue], ['Vendas (quantidade)', s.salesCount], ['Doces vendidos', s.unitsSold], ['Doces produzidos', s.produced], ['Custo da produção (R$)', s.productionCost], ['Custo dos doces vendidos (R$)', s.cogs], ['Lucro bruto (R$)', s.grossProfit], ['Total de despesas (R$)', s.expenses], ['Lucro estimado (R$)', s.estimatedProfit], ['', ''], ['Produto mais vendido', 'Quantidade / Faturamento (R$)']]
        .concat(top.map((t) => [t.name, t.qty + ' un. / ' + String(t.revenue).replace('.', ',')]));
      DL.ui.downloadCSV('resumo_' + tag + '.csv', ['Indicador', 'Valor'], body);
    } else if (kind === 'vendas') {
      DL.ui.downloadCSV('vendas_' + tag + '.csv', ['Data', 'Produto', 'Quantidade', 'Valor unitário (R$)', 'Total (R$)', 'Custo unitário (R$)', 'Resultado estimado (R$)', 'Pagamento', 'Observações'], rows.vendas().map((x) => [DL.dates.br(x.date), x.productName, x.qty, x.unitPrice, x.total, x.unitCost, x.profit, x.payment, x.notes]));
    } else if (kind === 'producao') {
      DL.ui.downloadCSV('producao_' + tag + '.csv', ['Data', 'Produto', 'Quantidade', 'Custo total (R$)', 'Custo unitário (R$)'], rows.producao().map((x) => [DL.dates.br(x.date), x.productName, x.qty, x.totalCost, DL.num.round2(x.totalCost / x.qty)]));
    } else {
      DL.ui.downloadCSV('despesas_' + tag + '.csv', ['Data', 'Descrição', 'Categoria', 'Valor (R$)'], rows.despesas().map((x) => [DL.dates.br(x.date), x.description, x.category, x.amount]));
    }
    DL.ui.toast('Arquivo CSV gerado. Confira a pasta de downloads.', 'ok');
  }

  DL.ui.boot(async function () {
    data = await DL.db.loadAll();
    $('#period-row').innerHTML = DL.ui.periodPicker('r');
    const labels = { resumo: ['file', 'Resumo'], vendas: ['cart', 'Vendas'], producao: ['cake', 'Produção'], despesas: ['wallet', 'Despesas'] };
    $$('[data-exp]').forEach((b) => { const l = labels[b.dataset.exp]; b.innerHTML = icon('download') + ' ' + l[1]; });
    $('#r-p').value = '30d';
    $('#r-p').addEventListener('change', () => {
      if ($('#r-p').value === 'custom' && !$('#r-f').value) { const r = DL.calc.presetRange('30d'); $('#r-f').value = r.from; $('#r-t').value = r.to; }
      render();
    });
    ['#r-f', '#r-t'].forEach((s) => $(s).addEventListener('change', render));
    $('#gran').addEventListener('click', (e) => {
      const b = e.target.closest('button[data-g]'); if (!b) return;
      gran = b.dataset.g; $$('#gran button').forEach((x) => x.classList.toggle('on', x === b)); render();
    });
    $('#content').addEventListener('click', (e) => { const b = e.target.closest('[data-exp]'); if (b) exportCSV(b.dataset.exp); });
    render();
  });
})();
