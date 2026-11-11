/* producao.js — registro de produção (soma ao estoque) */
(function () {
  'use strict';
  const { icon, esc, money, int, $, handleError } = DL.ui;
  let products = [], items = [], editingId = null;
  const FILTERS = [['mes', 'Mês atual'], ['7d', 'Últimos 7 dias'], ['30d', 'Últimos 30 dias'], ['ano', 'Ano atual'], ['todos', 'Tudo']];

  const prodById = (id) => products.find((p) => p.id === Number(id));

  function fillProducts(selected) {
    $('#f-product').innerHTML = DL.ui.options(products.map((p) => [p.id, p.name]), selected, 'Escolha o produto…');
    stockNow();
  }
  function stockNow() {
    const p = prodById($('#f-product').value);
    $('#stock-now').textContent = p ? 'Estoque atual: ' + int(p.stock) + ' un. · custo unitário atual: ' + money(p.cost) : '';
  }
  function updateLive() {
    const qty = DL.num.parseIntStrict($('#f-qty').value), cost = DL.num.parseMoney($('#f-cost').value || '0');
    const p = prodById($('#f-product').value);
    if (qty >= 1 && cost >= 0) {
      const unit = cost / qty;
      $('#live').innerHTML = '<div><b>' + money(unit) + '</b><span>Custo por unidade</span></div>' + (p ? '<div><b>' + int(p.stock + (editingId ? 0 : qty)) + '</b><span>' + (editingId ? 'Estoque atual' : 'Estoque após registrar') + '</span></div>' : '') +
        (p && p.price > 0 && unit > 0 ? '<div><b class="' + (p.price - unit >= 0 ? 'pos' : 'neg') + '">' + money(p.price - unit) + '</b><span>Lucro por un. (preço atual)</span></div>' : '');
    } else $('#live').innerHTML = '<span>Informe a quantidade e o custo para ver o custo por unidade.</span>';
  }

  function resetForm() {
    editingId = null;
    const form = $('#form'); form.reset(); DL.ui.showErrors(form, {});
    $('#f-date').value = DL.dates.today(); $('#f-date').max = DL.dates.today(); $('#f-update').checked = true; $('#f-update').disabled = false;
    $('#form-title').textContent = 'Registrar produção'; $('#edit-pill').hidden = true; $('#btn-cancel').hidden = true;
    $('#btn-save').innerHTML = icon('check') + ' Registrar produção';
    fillProducts(''); updateLive();
  }

  function range() { const f = $('#flt').value; return f === 'todos' ? { from: '', to: '' } : DL.calc.presetRange(f); }

  function renderList() {
    const r = range();
    const list = items.filter((x) => DL.calc.inRange(x.date, r.from, r.to)).sort((a, b) => (b.date + String(b.id).padStart(9, '0')).localeCompare(a.date + String(a.id).padStart(9, '0')));
    const qty = list.reduce((a, x) => a + x.qty, 0), cost = list.reduce((a, x) => a + x.totalCost, 0);
    $('#summary').innerHTML = DL.ui.stat('Doces produzidos', int(qty), { icon: 'cake', tone: 'gold', note: list.length + ' registro(s)' }) + DL.ui.stat('Custo da produção', money(cost), { icon: 'coins' }) + DL.ui.stat('Custo médio por doce', money(qty ? cost / qty : 0), { icon: 'tag', tone: 'dark' });
    if (!list.length) { $('#list').innerHTML = DL.ui.emptyState('Nenhuma produção neste período', products.length ? 'Registre acima o que você fabricou.' : 'Cadastre um produto primeiro.', { art: 'brigadeiro' }); return; }
    $('#list').innerHTML = '<div class="table-wrap"><table class="stack"><thead><tr><th>Data</th><th>Produto</th><th class="num">Quantidade</th><th class="num">Custo total</th><th class="num">Custo/un.</th><th></th></tr></thead><tbody>' +
      list.map((x) => '<tr><td data-label="Data">' + DL.dates.br(x.date) + '</td><td data-label="Produto"><b>' + esc(x.productName) + '</b></td><td class="num" data-label="Quantidade">' + int(x.qty) + '</td><td class="num" data-label="Custo total">' + money(x.totalCost) + '</td><td class="num" data-label="Custo/un.">' + money(x.qty ? x.totalCost / x.qty : 0) + '</td>' +
        '<td class="actions"><button class="btn sm" type="button" data-edit="' + x.id + '">' + icon('edit') + ' Editar</button> <button class="btn sm danger" type="button" data-del="' + x.id + '" aria-label="Excluir produção">' + icon('trash') + '</button></td></tr>').join('') +
      '</tbody><tfoot><tr><td></td><td>Total</td><td class="num" data-label="Quantidade">' + int(qty) + '</td><td class="num" data-label="Custo total">' + money(cost) + '</td><td></td><td></td></tr></tfoot></table></div>';
  }

  async function load() {
    const [p, i] = await Promise.all([DL.db.getAll('products'), DL.db.getAll('productions')]);
    products = p.sort((a, b) => a.name.localeCompare(b.name, 'pt-BR')); items = i;
    const none = !products.length;
    $('#no-products').hidden = !none; $('#form').hidden = none;
    if (none) $('#no-products').innerHTML = DL.ui.emptyState('Cadastre um produto primeiro', 'Para registrar produção você precisa ter ao menos um produto.', { href: 'produtos.html', label: 'Cadastrar produto', art: 'mix' });
    fillProducts($('#f-product').value); renderList();
  }

  async function submit(e) {
    e.preventDefault();
    const form = $('#form'), btn = $('#btn-save'); btn.disabled = true;
    try {
      const d = DL.ui.formData(form);
      if (editingId) await DL.ops.updateProduction(editingId, d); else await DL.ops.registerProduction(d);
      DL.ui.toast(editingId ? 'Produção atualizada e estoque ajustado.' : 'Produção registrada. Estoque atualizado!', 'ok');
      resetForm(); await load();
    } catch (err) { handleError(err, form); } finally { btn.disabled = false; }
  }

  function startEdit(id) {
    const x = items.find((i) => i.id === id); if (!x) return;
    editingId = id; const form = $('#form'); DL.ui.showErrors(form, {});
    fillProducts(x.productId);
    DL.ui.fillForm(form, { productId: x.productId, qty: x.qty, date: x.date, totalCost: DL.ui.moneyStr(x.totalCost) });
    $('#f-update').checked = false; $('#f-update').disabled = true;
    $('#form-title').textContent = 'Editar produção'; $('#edit-pill').hidden = false; $('#btn-cancel').hidden = false;
    $('#btn-save').innerHTML = icon('check') + ' Salvar alterações'; stockNow(); updateLive();
    $('#form-card').scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  async function remove(id) {
    const x = items.find((i) => i.id === id); if (!x) return;
    const ok = await DL.ui.confirm({ title: 'Excluir esta produção?', message: 'Serão retirados ' + x.qty + ' un. de "' + x.productName + '" do estoque. Se parte já foi vendida, a exclusão será bloqueada para o estoque não ficar negativo.', confirmText: 'Excluir produção' });
    if (!ok) return;
    try { await DL.ops.deleteProduction(id); DL.ui.toast('Produção excluída e estoque ajustado.', 'ok'); await load(); } catch (err) { handleError(err); }
  }

  DL.ui.boot(async function () {
    $('#flt').innerHTML = DL.ui.options(FILTERS, 'mes');
    $('#form').addEventListener('submit', submit);
    $('#btn-cancel').addEventListener('click', () => { $('#f-update').disabled = false; resetForm(); });
    $('#f-product').addEventListener('change', () => { stockNow(); updateLive(); });
    ['#f-qty', '#f-cost'].forEach((s) => $(s).addEventListener('input', updateLive));
    $('#flt').addEventListener('change', renderList);
    $('#list').addEventListener('click', (e) => {
      const ed = e.target.closest('[data-edit]'), dl = e.target.closest('[data-del]');
      if (ed) startEdit(Number(ed.dataset.edit)); if (dl) remove(Number(dl.dataset.del));
    });
    resetForm(); await load();
  });
})();
