/* despesas.js — cadastro de despesas */
(function () {
  'use strict';
  const { icon, esc, money, $, handleError } = DL.ui;
  let items = [], editingId = null;
  const FILTERS = [['mes', 'Mês atual'], ['hoje', 'Hoje'], ['7d', 'Últimos 7 dias'], ['30d', 'Últimos 30 dias'], ['ano', 'Ano atual'], ['todos', 'Tudo']];

  function resetForm() {
    editingId = null; const form = $('#form'); form.reset(); DL.ui.showErrors(form, {});
    $('#f-date').value = DL.dates.today(); $('#f-date').max = DL.dates.today();
    $('#f-category').innerHTML = DL.ui.options(DL.EXPENSE_CATEGORIES, '', 'Escolha…');
    $('#form-title').textContent = 'Lançar despesa'; $('#edit-pill').hidden = true; $('#btn-cancel').hidden = true;
    $('#btn-save').innerHTML = icon('check') + ' Salvar despesa';
  }
  const range = () => { const f = $('#flt').value; return f === 'todos' ? { from: '', to: '' } : DL.calc.presetRange(f); };

  function renderList() {
    const r = range(), cat = $('#flt-cat').value;
    const list = items.filter((x) => DL.calc.inRange(x.date, r.from, r.to) && (!cat || x.category === cat)).sort((a, b) => (b.date + String(b.id).padStart(9, '0')).localeCompare(a.date + String(a.id).padStart(9, '0')));
    const total = list.reduce((a, x) => a + x.amount, 0);
    const byCat = DL.calc.expensesByCategory(list, '', ''), max = byCat.length ? byCat[0].amount : 1;
    $('#summary').innerHTML = DL.ui.stat('Total de despesas', money(total), { icon: 'wallet', tone: 'red', note: list.length + ' lançamento(s)' }) +
      '<div class="card" style="padding:16px 18px"><div class="k small muted" style="font-weight:700;text-transform:uppercase;letter-spacing:.06em;margin-bottom:8px">Por categoria</div>' +
      (byCat.length ? '<div class="bars">' + byCat.slice(0, 5).map((c) => '<div class="bar-row"><span>' + esc(c.category) + '</span><div class="bar-track"><div class="bar-fill" style="width:' + Math.max(4, (c.amount / max) * 100) + '%"></div></div><b>' + money(c.amount) + '</b></div>').join('') + '</div>' : '<span class="muted small">Sem despesas neste filtro.</span>') + '</div>';
    if (!list.length) { $('#list').innerHTML = DL.ui.emptyState('Nenhuma despesa neste filtro', 'Lance acima o que você gastou.', { art: 'palha' }); return; }
    $('#list').innerHTML = '<div class="table-wrap"><table class="stack"><thead><tr><th>Data</th><th>Descrição</th><th>Categoria</th><th class="num">Valor</th><th></th></tr></thead><tbody>' +
      list.map((x) => '<tr><td data-label="Data">' + DL.dates.br(x.date) + '</td><td data-label="Descrição"><b>' + esc(x.description) + '</b></td><td data-label="Categoria"><span class="pill gold">' + esc(x.category) + '</span></td><td class="num" data-label="Valor"><b>' + money(x.amount) + '</b></td>' +
        '<td class="actions"><button class="btn sm" type="button" data-edit="' + x.id + '">' + icon('edit') + ' Editar</button> <button class="btn sm danger" type="button" data-del="' + x.id + '" aria-label="Excluir despesa">' + icon('trash') + '</button></td></tr>').join('') +
      '</tbody><tfoot><tr><td></td><td>Total</td><td></td><td class="num" data-label="Total">' + money(total) + '</td><td></td></tr></tfoot></table></div>';
  }

  async function load() { items = await DL.db.getAll('expenses'); renderList(); }

  async function submit(e) {
    e.preventDefault();
    const form = $('#form'), btn = $('#btn-save'); btn.disabled = true;
    try {
      await DL.ops.saveExpense(DL.ui.formData(form), editingId);
      DL.ui.toast(editingId ? 'Despesa atualizada.' : 'Despesa lançada.', 'ok'); resetForm(); await load();
    } catch (err) { handleError(err, form); } finally { btn.disabled = false; }
  }
  function startEdit(id) {
    const x = items.find((i) => i.id === id); if (!x) return;
    editingId = id; const form = $('#form'); DL.ui.showErrors(form, {});
    DL.ui.fillForm(form, { description: x.description, category: x.category, amount: DL.ui.moneyStr(x.amount), date: x.date });
    $('#form-title').textContent = 'Editar despesa'; $('#edit-pill').hidden = false; $('#btn-cancel').hidden = false; $('#btn-save').innerHTML = icon('check') + ' Salvar alterações';
    $('#form-card').scrollIntoView({ behavior: 'smooth', block: 'start' });
  }
  async function remove(id) {
    const x = items.find((i) => i.id === id); if (!x) return;
    const ok = await DL.ui.confirm({ title: 'Excluir esta despesa?', message: '"' + x.description + '" (' + money(x.amount) + ') será removida e o lucro estimado aumentará nesse valor.', confirmText: 'Excluir despesa' });
    if (!ok) return;
    try { await DL.ops.deleteExpense(id); DL.ui.toast('Despesa excluída.', 'ok'); if (editingId === id) resetForm(); await load(); } catch (err) { handleError(err); }
  }

  DL.ui.boot(async function () {
    $('#flt').innerHTML = DL.ui.options(FILTERS, 'mes');
    $('#flt-cat').innerHTML = DL.ui.options(DL.EXPENSE_CATEGORIES, '', 'Todas as categorias');
    resetForm();
    $('#form').addEventListener('submit', submit); $('#btn-cancel').addEventListener('click', resetForm);
    ['#flt', '#flt-cat'].forEach((s) => $(s).addEventListener('change', renderList));
    $('#list').addEventListener('click', (e) => {
      const ed = e.target.closest('[data-edit]'), dl = e.target.closest('[data-del]');
      if (ed) startEdit(Number(ed.dataset.edit)); if (dl) remove(Number(dl.dataset.del));
    });
    await load();
  });
})();
