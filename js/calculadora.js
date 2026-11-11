/* calculadora.js — preço de venda recomendado, lucro por unidade e visão de faturamento × lucros */
(function () {
  'use strict';
  const { icon, esc, money, int, pct, $, $$, handleError } = DL.ui;
  let mode = 'margin', last = null, products = [], touched = false;
  const FIELDS = { ingredients: '#c-ing', qty: '#c-qty', packaging: '#c-pack', other: '#c-other', margin: '#c-margin', plannedPrice: '#c-planned' };

  function read() {
    const o = { mode };
    Object.keys(FIELDS).forEach((k) => { o[k] = $(FIELDS[k]).value; });
    return o;
  }
  function row(label, value, cls) { return '<div class="row between" style="padding:9px 0;border-bottom:1px dashed var(--line)"><span class="muted">' + label + '</span><b class="' + (cls || '') + '">' + value + '</b></div>'; }

  function render() {
    const form = $('#form');
    const vals = read();
    const blank = !vals.ingredients && !vals.qty;
    $('#mode-hint').textContent = mode === 'margin' ? 'Ex.: margem de 50% significa que metade do preço é lucro.' : 'Ex.: markup de 100% significa cobrar o dobro do custo.';
    if (blank && !touched) { last = null; $('#result').innerHTML = '<div class="card center muted">' + DL.art('brigadeiro').replace('<svg ', '<svg style="width:180px;border-radius:16px;margin:0 auto 10px;display:block" ') + '<p>Preencha os custos ao lado e veja o preço ideal aparecer aqui.</p></div>'; $('#apply-card').hidden = true; DL.ui.showErrors(form, {}); return; }
    const r = DL.calc.priceCalc(vals);
    if (!r.ok) {
      last = null; $('#apply-card').hidden = true;
      // só mostra erro de campo já preenchido, para não assustar enquanto digita
      const shown = {}; Object.keys(r.errors).forEach((k) => { if (vals[k] !== '' || touched) shown[k] = r.errors[k]; });
      DL.ui.showErrors(form, shown);
      $('#result').innerHTML = '<div class="card center muted"><p>Complete os campos para calcular.</p></div>';
      return;
    }
    DL.ui.showErrors(form, {}); last = r;
    const mUnit = r.profitUnit >= 0 ? 'pos' : 'neg';
    $('#result').innerHTML =
      '<div class="stat feature" style="margin-bottom:18px"><div class="ico">' + icon('tag') + '</div><div><div class="k">' + (r.usingPlanned ? 'Preço que você pretende cobrar' : 'Preço de venda recomendado') + '</div><div class="v">' + money(r.price) + '</div>' +
      '<div class="n">' + (r.usingPlanned ? 'Recomendado para a margem pedida: ' + money(r.recommended) : 'Sugestão arredondada: <b>' + money(r.rounded) + '</b> por unidade') + '</div></div></div>' +
      '<div class="card"><h3>Por unidade</h3>' +
      row('Custo unitário', money(r.unitCost)) + row('Lucro por unidade', money(r.profitUnit), mUnit) +
      row('Margem de lucro (sobre o preço)', pct(r.marginReal), mUnit) + row('Markup (sobre o custo)', pct(r.markupReal), mUnit) + '</div>' +
      '<div class="card section"><h3>Lote de ' + int(r.qty) + ' doces</h3>' +
      row('Faturamento previsto', money(r.revenue)) + row('Custo de ingredientes e embalagens', money(r.ingredients + r.packaging)) +
      row('Lucro bruto', money(r.grossProfit), r.grossProfit >= 0 ? 'pos' : 'neg') + row('Outros custos', money(r.other)) +
      '<div class="row between" style="padding:12px 0 0"><b>Lucro total estimado (após despesas)</b><b class="' + (r.estimatedProfit >= 0 ? 'pos' : 'neg') + '" style="font-size:1.3rem;font-family:var(--font-title)">' + money(r.estimatedProfit) + '</b></div></div>' +
      (r.profitUnit < 0 ? '<div class="alert bad section">' + icon('alert') + '<span>Com este preço você <b>perde dinheiro</b> em cada doce. Aumente o preço ou reduza os custos.</span></div>' : '');
    $('#apply-card').hidden = !products.length;
  }

  async function apply() {
    if (!last) return;
    const id = Number($('#c-product').value);
    const p = products.find((x) => x.id === id);
    if (!p) { DL.ui.toast('Escolha um produto.', 'err'); return; }
    const ok = await DL.ui.confirm({ title: 'Atualizar "' + p.name + '"?', message: 'Custo unitário: ' + money(p.cost) + ' → ' + money(last.unitCost) + ' · Preço de venda: ' + money(p.price) + ' → ' + money(last.price), confirmText: 'Aplicar', danger: false });
    if (!ok) return;
    try {
      await DL.ops.saveProduct({ name: p.name, category: p.category, description: p.description, price: last.price, cost: last.unitCost, stock: p.stock, photo: p.photo }, p.id);
      DL.ui.toast('Produto atualizado com o novo custo e preço.', 'ok');
      await loadProducts();
    } catch (err) { handleError(err); }
  }

  async function loadProducts() {
    products = (await DL.db.getAll('products')).sort((a, b) => a.name.localeCompare(b.name, 'pt-BR'));
    $('#c-product').innerHTML = DL.ui.options(products.map((p) => [p.id, p.name]), '', 'Escolha o produto…');
    $('#apply-card').hidden = !(last && products.length);
  }

  DL.ui.boot(async function () {
    $('#btn-clear').innerHTML = icon('reset') + ' Limpar';
    Object.keys(FIELDS).forEach((k) => $(FIELDS[k]).addEventListener('input', () => { touched = true; render(); }));
    $('#form').addEventListener('submit', (e) => { e.preventDefault(); touched = true; render(); });
    $('#mode').addEventListener('click', (e) => {
      const b = e.target.closest('button[data-m]'); if (!b) return;
      mode = b.dataset.m; $$('#mode button').forEach((x) => x.classList.toggle('on', x === b)); touched = touched || !!$('#c-ing').value; render();
    });
    $('#btn-clear').addEventListener('click', () => { $('#form').reset(); $('#c-margin').value = '50'; touched = false; render(); });
    $('#btn-apply').addEventListener('click', apply);
    await loadProducts(); render();
  });
})();
