/* vendas.js — registro de vendas (baixa o estoque, nunca deixa vender mais do que existe) */
(function () {
  'use strict';
  const { icon, esc, money, int, signed, $, handleError } = DL.ui;
  let products = [], items = [], editingId = null, editingOld = null;
  const FILTERS = [['mes', 'Mês atual'], ['hoje', 'Hoje'], ['7d', 'Últimos 7 dias'], ['30d', 'Últimos 30 dias'], ['ano', 'Ano atual'], ['todos', 'Tudo']];
  const prodById = (id) => products.find((p) => p.id === Number(id));

  // Estoque que pode ser vendido agora (ao editar, a própria venda devolve suas unidades)
  function available(p) { return p.stock + (editingOld && editingOld.productId === p.id ? editingOld.qty : 0); }

  function fillProducts(selected) {
    $('#f-product').innerHTML = '<option value="">Escolha o produto…</option>' + products.map((p) => {
      const av = available(p), dis = av <= 0 && String(p.id) !== String(selected);
      return '<option value="' + p.id + '"' + (String(p.id) === String(selected) ? ' selected' : '') + (dis ? ' disabled' : '') + '>' + esc(p.name) + (av <= 0 ? ' (sem estoque)' : ' — ' + av + ' disp.') + '</option>';
    }).join('');
    stockNow();
  }
  function stockNow() {
    const p = prodById($('#f-product').value);
    $('#stock-now').textContent = p ? 'Disponível: ' + int(available(p)) + ' un. · preço cadastrado: ' + money(p.price) : '';
  }
  function updateLive() {
    const qty = DL.num.parseIntStrict($('#f-qty').value), price = DL.num.parseMoney($('#f-price').value), p = prodById($('#f-product').value);
    if (qty >= 1 && price > 0) {
      const total = DL.num.round2(qty * price), cost = p ? (editingOld && editingOld.productId === p.id ? editingOld.unitCost : p.cost) : 0, profit = total - qty * cost;
      const over = p && qty > available(p);
      $('#live').innerHTML = '<div><b>' + money(total) + '</b><span>Valor total</span></div>' + (p ? '<div><b class="' + (profit >= 0 ? 'pos' : 'neg') + '">' + money(profit) + '</b><span>Resultado estimado</span></div>' : '') +
        (over ? '<div><b class="neg">Acima do estoque</b><span>Máximo: ' + int(available(p)) + ' un.</span></div>' : '');
    } else $('#live').innerHTML = '<span>Informe quantidade e valor para ver o total e o resultado estimado.</span>';
  }

  function resetForm() {
    editingId = null; editingOld = null;
    const form = $('#form'); form.reset(); DL.ui.showErrors(form, {});
    $('#f-date').value = DL.dates.today(); $('#f-date').max = DL.dates.today();
    $('#f-payment').innerHTML = DL.ui.options(DL.PAYMENTS, 'Pix', 'Escolha…');
    $('#form-title').textContent = 'Registrar venda'; $('#edit-pill').hidden = true; $('#btn-cancel').hidden = true;
    $('#btn-save').innerHTML = icon('check') + ' Registrar venda';
    fillProducts(''); updateLive();
  }

  const range = () => { const f = $('#flt').value; return f === 'todos' ? { from: '', to: '' } : DL.calc.presetRange(f); };

  function renderList() {
    const r = range(), pay = $('#flt-pay').value;
    const list = items.filter((x) => DL.calc.inRange(x.date, r.from, r.to) && (!pay || x.payment === pay)).sort((a, b) => (b.date + String(b.id).padStart(9, '0')).localeCompare(a.date + String(a.id).padStart(9, '0')));
    const total = list.reduce((a, x) => a + x.total, 0), units = list.reduce((a, x) => a + x.qty, 0), profit = list.reduce((a, x) => a + x.profit, 0);
    $('#summary').innerHTML = DL.ui.stat('Faturamento', money(total), { icon: 'dollar', tone: 'gold', note: list.length + ' venda(s)' }) + DL.ui.stat('Doces vendidos', int(units), { icon: 'tag' }) +
      DL.ui.stat('Resultado estimado', money(profit), { icon: 'trend', tone: profit >= 0 ? 'green' : 'red', note: 'vendas − custo dos doces' }) + DL.ui.stat('Ticket médio', money(list.length ? total / list.length : 0), { icon: 'coins', tone: 'dark' });
    if (!list.length) { $('#list').innerHTML = DL.ui.emptyState('Nenhuma venda neste filtro', products.length ? 'Registre sua primeira venda acima.' : 'Cadastre um produto e registre uma produção para começar a vender.', { art: 'trufa' }); return; }
    $('#list').innerHTML = '<div class="table-wrap"><table class="stack"><thead><tr><th>Data</th><th>Produto</th><th class="num">Qtd.</th><th class="num">Unitário</th><th class="num">Total</th><th class="num">Resultado</th><th>Pagamento</th><th></th></tr></thead><tbody>' +
      list.map((x) => '<tr><td data-label="Data">' + DL.dates.br(x.date) + '</td><td data-label="Produto"><b>' + esc(x.productName) + '</b>' + (x.notes ? '<br><span class="small muted">' + esc(x.notes) + '</span>' : '') + '</td><td class="num" data-label="Qtd.">' + int(x.qty) + '</td><td class="num" data-label="Unitário">' + money(x.unitPrice) + '</td><td class="num" data-label="Total"><b>' + money(x.total) + '</b></td><td class="num" data-label="Resultado">' + signed(x.profit) + '</td><td data-label="Pagamento"><span class="pill">' + esc(x.payment) + '</span></td>' +
        '<td class="actions"><button class="btn sm" type="button" data-edit="' + x.id + '">' + icon('edit') + ' Editar</button> <button class="btn sm danger" type="button" data-del="' + x.id + '" aria-label="Excluir venda">' + icon('trash') + '</button></td></tr>').join('') +
      '</tbody><tfoot><tr><td></td><td>Total</td><td class="num" data-label="Qtd.">' + int(units) + '</td><td></td><td class="num" data-label="Total">' + money(total) + '</td><td class="num" data-label="Resultado">' + money(profit) + '</td><td></td><td></td></tr></tfoot></table></div>';
  }

  async function load() {
    const [p, i] = await Promise.all([DL.db.getAll('products'), DL.db.getAll('sales')]);
    products = p.sort((a, b) => a.name.localeCompare(b.name, 'pt-BR')); items = i;
    const none = !products.length;
    $('#no-products').hidden = !none; $('#form').hidden = none;
    if (none) $('#no-products').innerHTML = DL.ui.emptyState('Cadastre um produto primeiro', 'Para registrar vendas você precisa ter produtos com estoque.', { href: 'produtos.html', label: 'Cadastrar produto', art: 'mix' });
    fillProducts($('#f-product').value); renderList();
  }

  async function submit(e) {
    e.preventDefault();
    const form = $('#form'), btn = $('#btn-save'); btn.disabled = true;
    try {
      const d = DL.ui.formData(form);
      if (editingId) await DL.ops.updateSale(editingId, d); else await DL.ops.registerSale(d);
      DL.ui.toast(editingId ? 'Venda atualizada e estoque ajustado.' : 'Venda registrada. Estoque atualizado!', 'ok');
      resetForm(); await load();
    } catch (err) { handleError(err, form); await load(); } finally { btn.disabled = false; }
  }

  function startEdit(id) {
    const x = items.find((i) => i.id === id); if (!x) return;
    editingId = id; editingOld = x; const form = $('#form'); DL.ui.showErrors(form, {});
    fillProducts(x.productId);
    DL.ui.fillForm(form, { productId: x.productId, qty: x.qty, unitPrice: DL.ui.moneyStr(x.unitPrice), date: x.date, payment: x.payment, notes: x.notes });
    $('#form-title').textContent = 'Editar venda'; $('#edit-pill').hidden = false; $('#btn-cancel').hidden = false;
    $('#btn-save').innerHTML = icon('check') + ' Salvar alterações'; stockNow(); updateLive();
    $('#form-card').scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  async function remove(id) {
    const x = items.find((i) => i.id === id); if (!x) return;
    const ok = await DL.ui.confirm({ title: 'Excluir esta venda?', message: x.qty + ' un. de "' + x.productName + '" (' + money(x.total) + ') voltam para o estoque e o faturamento será reduzido. Esta ação não pode ser desfeita.', confirmText: 'Excluir venda' });
    if (!ok) return;
    try { await DL.ops.deleteSale(id); DL.ui.toast('Venda excluída. As unidades voltaram ao estoque.', 'ok'); await load(); } catch (err) { handleError(err); }
  }

  DL.ui.boot(async function () {
    $('#flt').innerHTML = DL.ui.options(FILTERS, 'mes');
    $('#flt-pay').innerHTML = DL.ui.options(DL.PAYMENTS, '', 'Todos os pagamentos');
    $('#form').addEventListener('submit', submit);
    $('#btn-cancel').addEventListener('click', resetForm);
    $('#f-product').addEventListener('change', () => {
      const p = prodById($('#f-product').value);
      if (p && !editingId) $('#f-price').value = DL.ui.moneyStr(p.price); // sugere o preço cadastrado
      stockNow(); updateLive();
    });
    ['#f-qty', '#f-price'].forEach((s) => $(s).addEventListener('input', updateLive));
    ['#flt', '#flt-pay'].forEach((s) => $(s).addEventListener('change', renderList));
    $('#list').addEventListener('click', (e) => {
      const ed = e.target.closest('[data-edit]'), dl = e.target.closest('[data-del]');
      if (ed) startEdit(Number(ed.dataset.edit)); if (dl) remove(Number(dl.dataset.del));
    });
    resetForm(); await load();
  });
})();
