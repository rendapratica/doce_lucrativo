/* produtos.js — cadastro, edição e exclusão de produtos */
(function () {
  'use strict';
  const { icon, esc, money, int, pct, $, $$, handleError } = DL.ui;
  let products = [], editingId = null, photo = '';

  const stockBadge = (p) => p.stock === 0 ? '<span class="pill bad">Sem estoque</span>' : p.stock <= 5 ? '<span class="pill warn">Pouco: ' + int(p.stock) + '</span>' : '<span class="pill ok">' + int(p.stock) + ' em estoque</span>';
  const marginOf = (p) => (p.price > 0 ? ((p.price - p.cost) / p.price) * 100 : 0);

  async function load() { products = (await DL.db.getAll('products')).sort((a, b) => a.name.localeCompare(b.name, 'pt-BR')); render(); }

  function render() {
    const q = $('#q').value.trim().toLowerCase(), cat = $('#cat').value;
    const list = products.filter((p) => (!cat || p.category === cat) && (!q || (p.name + ' ' + p.description).toLowerCase().indexOf(q) !== -1));
    const stockUnits = products.reduce((a, p) => a + p.stock, 0), stockValue = products.reduce((a, p) => a + p.stock * p.cost, 0), stockSale = products.reduce((a, p) => a + p.stock * p.price, 0);
    $('#summary').innerHTML = DL.ui.stat('Produtos cadastrados', int(products.length), { icon: 'box' }) + DL.ui.stat('Doces em estoque', int(stockUnits), { icon: 'layers', tone: 'dark' }) +
      DL.ui.stat('Valor do estoque', money(stockSale), { icon: 'coins', tone: 'gold', note: 'a preço de venda · custo ' + money(stockValue) });
    if (!products.length) { $('#list').innerHTML = DL.ui.emptyState('Nenhum produto ainda', 'Cadastre seus doces para registrar produção e vendas.', { art: 'mix' }); return; }
    if (!list.length) { $('#list').innerHTML = DL.ui.emptyState('Nada encontrado', 'Tente outra busca ou categoria.', { art: 'ninho' }); return; }
    $('#list').innerHTML = '<div class="cards-grid">' + list.map((p) =>
      '<article class="tile"><div class="thumb">' + DL.ui.thumb(p, DL.artForCategory(p.category)) + '<span class="badge">' + stockBadge(p) + '</span></div>' +
      '<div class="body"><div class="row between" style="gap:6px"><span class="pill gold">' + esc(p.category) + '</span><span class="small muted" title="Margem de lucro">' + pct(marginOf(p)) + ' margem</span></div>' +
      '<h3>' + esc(p.name) + '</h3>' + (p.description ? '<p class="small muted" style="margin:0">' + esc(p.description) + '</p>' : '') +
      '<div class="meta"><span class="price">' + money(p.price) + '</span><span>custo ' + money(p.cost) + '</span></div>' +
      '<div class="foot"><button class="btn sm" type="button" data-edit="' + p.id + '">' + icon('edit') + '<span>Editar</span></button><button class="btn sm danger" type="button" data-del="' + p.id + '" aria-label="Excluir ' + esc(p.name) + '">' + icon('trash') + '<span>Excluir</span></button></div></div></article>').join('') + '</div>';
  }

  function setPhoto(v) {
    photo = v || '';
    $('#preview').innerHTML = photo ? '<img src="' + esc(photo) + '" alt="Prévia da foto">' : 'Sem foto';
    $('#photo-clear').hidden = !photo;
  }
  function updateLive() {
    const price = DL.num.parseMoney($('#f-price').value), cost = DL.num.parseMoney($('#f-cost').value);
    if (price > 0 && cost >= 0) {
      const profit = price - cost;
      $('#live').innerHTML = '<div><b class="' + (profit >= 0 ? 'pos' : 'neg') + '">' + money(profit) + '</b><span>Lucro por unidade</span></div><div><b>' + pct((profit / price) * 100) + '</b><span>Margem sobre o preço</span></div>';
    } else $('#live').innerHTML = '<span>Preencha preço e custo para ver o lucro por unidade.</span>';
  }

  function openForm(p, prefill) {
    editingId = p ? p.id : null;
    const form = $('#form');
    DL.ui.showErrors(form, {});
    form.reset();
    $('#dlg-title').textContent = p ? 'Editar produto' : 'Novo produto';
    DL.ui.fillForm(form, p ? { name: p.name, category: p.category, description: p.description, price: DL.ui.moneyStr(p.price), cost: DL.ui.moneyStr(p.cost), stock: p.stock } : (prefill || { stock: 0 }));
    $('#stock-hint').textContent = p ? 'Ajuste manual do estoque. Use Produção e Vendas para movimentar.' : 'Quantidade que você já tem pronta hoje.';
    setPhoto(p ? p.photo : '');
    updateLive();
    DL.ui.openDialog($('#dlg'));
    setTimeout(() => $('#f-name').focus(), 50);
  }

  async function save(e) {
    e.preventDefault();
    const form = $('#form'), btn = $('#btn-save');
    btn.disabled = true;
    try {
      const d = DL.ui.formData(form); d.photo = photo;
      await DL.ops.saveProduct(d, editingId);
      DL.ui.closeDialog($('#dlg'));
      DL.ui.toast(editingId ? 'Produto atualizado.' : 'Produto cadastrado.', 'ok');
      await load();
    } catch (err) { handleError(err, form); } finally { btn.disabled = false; }
  }

  async function remove(id) {
    const p = products.find((x) => x.id === id); if (!p) return;
    const ok = await DL.ui.confirm({ title: 'Excluir "' + p.name + '"?', message: 'O produto sai da lista e o estoque dele (' + p.stock + ' un.) deixa de existir. As vendas e produções já registradas continuam no histórico. Esta ação não pode ser desfeita.', confirmText: 'Excluir produto' });
    if (!ok) return;
    try { await DL.ops.deleteProduct(id); DL.ui.toast('Produto excluído.', 'ok'); await load(); } catch (err) { handleError(err); }
  }

  async function fromRecipe(id) {
    let r = DL.RECIPES.find((x) => x.id === id);
    if (!r && /^\d+$/.test(id)) r = await DL.db.get('recipes', Number(id));
    if (!r) return;
    openForm(null, { name: r.name, category: r.category, description: 'Receita: ' + r.name + '.', price: DL.ui.moneyStr(r.suggestedPrice), cost: '', stock: 0 });
    if (r.photo) setPhoto(r.photo);
  }

  DL.ui.boot(async function () {
    $('#cat').innerHTML = DL.ui.options(DL.CATEGORIES, '', 'Todas as categorias');
    $('#f-category').innerHTML = DL.ui.options(DL.CATEGORIES, '', 'Escolha…');
    $('#btn-new').innerHTML = icon('plus') + ' Novo produto';
    $('#photo-label').innerHTML = icon('camera') + ' Escolher foto';
    $$('[data-close]').forEach((b) => { if (b.classList.contains('icon-only')) b.innerHTML = icon('x'); });
    $('#q').addEventListener('input', DL.ui.debounce(render, 150)); $('#cat').addEventListener('change', render);
    $('#btn-new').addEventListener('click', () => openForm(null));
    $('#form').addEventListener('submit', save);
    ['#f-price', '#f-cost'].forEach((s) => $(s).addEventListener('input', updateLive));
    $('#photo-clear').addEventListener('click', () => setPhoto(''));
    $('#f-photo').addEventListener('change', async (e) => {
      const file = e.target.files[0]; if (!file) return;
      try { setPhoto(await DL.ui.readImage(file, 720)); } catch (err) { handleError(err); } finally { e.target.value = ''; }
    });
    $('#list').addEventListener('click', (e) => {
      const ed = e.target.closest('[data-edit]'), dl = e.target.closest('[data-del]');
      if (ed) openForm(products.find((p) => p.id === Number(ed.dataset.edit)));
      if (dl) remove(Number(dl.dataset.del));
    });
    await load();
    const rid = new URLSearchParams(location.search).get('de-receita');
    if (rid) { history.replaceState(null, '', 'produtos.html'); await fromRecipe(rid); }
  });
})();
