/* Testes do núcleo (cálculos + IndexedDB + backup). Rodar: NODE_PATH=<node_modules> node tests/core.test.js */
require('fake-indexeddb/auto');
const path = require('path'); const assert = require('assert');
require(path.join(__dirname, '../js/calc.js'));
require(path.join(__dirname, '../js/database.js'));
const DL = globalThis.DL; const T = DL.dates.today();
let n = 0;
const ok = (name) => { n++; console.log('  ok', n, name); };
const rejects = async (fn, re, name) => { try { await fn(); } catch (e) { assert(re.test(e.message) || e.errors, name + ' -> ' + e.message); ok(name); return e; } assert.fail('deveria falhar: ' + name); };

(async () => {
  // números
  assert.strictEqual(DL.num.parseMoney('1.234,56'), 1234.56); assert.strictEqual(DL.num.parseMoney('12,5'), 12.5);
  assert.strictEqual(DL.num.parseMoney('R$ 10'), 10); assert(Number.isNaN(DL.num.parseMoney('abc'))); ok('parseMoney');
  assert.strictEqual(DL.dates.startOfWeek('2026-11-10'), '2026-11-09'); assert.strictEqual(DL.dates.addDays('2026-03-01', -1), '2026-02-28'); ok('datas');

  // produtos
  const p1 = await DL.ops.saveProduct({ name: 'Brigadeiro', category: 'Brigadeiros', price: '2,50', cost: '0,85', stock: '0' });
  assert.strictEqual(p1.id, 1); assert.strictEqual(p1.price, 2.5); ok('cadastro de produto');
  await rejects(() => DL.ops.saveProduct({ name: '', category: 'X', price: '0', cost: '-1', stock: '1.5' }), /./, 'produto inválido é recusado');
  const p1e = await DL.ops.saveProduct({ name: 'Brigadeiro tradicional', category: 'Brigadeiros', price: '3', cost: '0,9', stock: '0' }, p1.id);
  assert.strictEqual(p1e.name, 'Brigadeiro tradicional'); assert.strictEqual((await DL.db.getAll('products')).length, 1); ok('edição de produto');
  const p2 = await DL.ops.saveProduct({ name: 'Beijinho', category: 'Beijinhos', price: '2,5', cost: '0,8', stock: '10' });

  // produção
  const pr = await DL.ops.registerProduction({ productId: p1.id, qty: '50', date: T, totalCost: '40', updateCost: true });
  let prod = await DL.db.get('products', p1.id);
  assert.strictEqual(prod.stock, 50); assert.strictEqual(prod.cost, 0.8); ok('produção soma estoque e atualiza custo unitário');
  await rejects(() => DL.ops.registerProduction({ productId: p1.id, qty: '5', date: '2999-01-01', totalCost: '1' }), /./, 'produção com data futura é recusada');

  // vendas
  const s1 = await DL.ops.registerSale({ productId: p1.id, qty: '20', unitPrice: '3', date: T, payment: 'Pix', notes: 'teste' });
  prod = await DL.db.get('products', p1.id);
  assert.strictEqual(prod.stock, 30); assert.strictEqual(s1.total, 60); assert.strictEqual(s1.profit, 44); ok('venda baixa estoque e calcula resultado');
  await rejects(() => DL.ops.registerSale({ productId: p1.id, qty: '31', unitPrice: '3', date: T, payment: 'Pix' }), /insuficiente/, 'não vende mais que o estoque');
  assert.strictEqual((await DL.db.get('products', p1.id)).stock, 30); assert.strictEqual((await DL.db.getAll('sales')).length, 1); ok('venda recusada não altera nada (atomicidade)');
  await DL.ops.updateSale(s1.id, { productId: p1.id, qty: '25', unitPrice: '3', date: T, payment: 'Dinheiro' });
  assert.strictEqual((await DL.db.get('products', p1.id)).stock, 25); ok('editar venda ajusta o estoque pela diferença');
  await rejects(() => DL.ops.updateSale(s1.id, { productId: p1.id, qty: '80', unitPrice: '3', date: T, payment: 'Pix' }), /insuficiente/, 'editar venda para além do estoque é recusado');
  assert.strictEqual((await DL.db.get('products', p1.id)).stock, 25); ok('edição recusada preserva estoque');
  // troca de produto na venda
  await DL.ops.updateSale(s1.id, { productId: p2.id, qty: '4', unitPrice: '2,5', date: T, payment: 'Pix' });
  assert.strictEqual((await DL.db.get('products', p1.id)).stock, 50); assert.strictEqual((await DL.db.get('products', p2.id)).stock, 6); ok('trocar o produto da venda devolve e baixa nos produtos certos');
  await DL.ops.updateSale(s1.id, { productId: p1.id, qty: '20', unitPrice: '3', date: T, payment: 'Pix' });
  // produção não pode ser excluída se isso zeraria abaixo do vendido
  await rejects(() => DL.ops.deleteProduction(pr.id), /negativo/, 'excluir produção que já foi vendida é recusado');
  await DL.ops.deleteSale(s1.id);
  assert.strictEqual((await DL.db.get('products', p1.id)).stock, 50); ok('excluir venda devolve ao estoque');
  await DL.ops.deleteProduction(pr.id);
  assert.strictEqual((await DL.db.get('products', p1.id)).stock, 0); ok('excluir produção retira do estoque');

  // despesas
  const e1 = await DL.ops.saveExpense({ description: 'Chocolate', category: 'Chocolate', amount: '35,90', date: T });
  await DL.ops.saveExpense({ description: 'Gás', category: 'Gás', amount: '110', date: T }, undefined);
  await DL.ops.saveExpense({ description: 'Chocolate (corrigido)', category: 'Chocolate', amount: '40', date: T }, e1.id);
  assert.strictEqual((await DL.db.getAll('expenses')).length, 2); await rejects(() => DL.ops.saveExpense({ description: 'x', category: 'Gás', amount: '0', date: T }), /./, 'despesa inválida'); ok('despesas: criar/editar');

  // resumo
  await DL.ops.registerProduction({ productId: p1.id, qty: '100', date: T, totalCost: '80' });
  await DL.ops.registerSale({ productId: p1.id, qty: '10', unitPrice: '3', date: T, payment: 'Pix' });
  await DL.ops.registerSale({ productId: p1.id, qty: '5', unitPrice: '3', date: DL.dates.addDays(T, -3), payment: 'Pix' });
  const data = await DL.db.loadAll();
  const s = DL.calc.summarize(data, T, T);
  assert.strictEqual(s.revenue, 30); assert.strictEqual(s.expenses, 150); assert.strictEqual(s.estimatedProfit, -120); assert.strictEqual(s.grossProfit, 30 - 10 * 0.8); assert.strictEqual(s.produced, 100); ok('resumo financeiro');
  const ser = DL.calc.series(data, 'day', DL.dates.addDays(T, -6), T); assert.strictEqual(ser.keys.length, 7); assert.strictEqual(ser.revenue.reduce((a, b) => a + b, 0), 45); ok('série diária');
  assert.strictEqual(DL.calc.series(data, 'month', DL.dates.addDays(T, -70), T).revenue.reduce((a, b) => a + b, 0), 45); ok('série mensal soma tudo');
  assert.strictEqual(DL.calc.topProducts(data.sales, '', '', 5)[0].qty, 15); ok('mais vendidos');

  // calculadora
  const c = DL.calc.priceCalc({ ingredients: '30', qty: '30', packaging: '6', other: '4', margin: '50', mode: 'margin' });
  assert.strictEqual(c.unitCost, 1.33); assert.strictEqual(c.recommended, 2.67); assert.strictEqual(c.estimatedProfit, 40.1); assert.strictEqual(c.grossProfit, 44.1); ok('calculadora (margem sobre o preço)');
  assert.strictEqual(DL.calc.priceCalc({ ingredients: '30', qty: '30', margin: '100', mode: 'margin' }).ok, false);
  assert.strictEqual(DL.calc.priceCalc({ ingredients: '30', qty: '0', margin: '30' }).ok, false);
  assert.strictEqual(DL.calc.priceCalc({ ingredients: '30', qty: '30', margin: '100', mode: 'markup' }).recommended, 2); ok('calculadora (validação e markup)');

  // CSV
  const csv = DL.calc.toCSV(['a', 'b'], [['=1+1', 'x;y'], [1.5, 'q"r']]);
  assert.strictEqual(csv, "a;b\r\n'=1+1;\"x;y\"\r\n1,5;\"q\"\"r\""); ok('CSV com escape e proteção contra fórmulas');

  // backup
  const b = await DL.backup.build(); const text = JSON.stringify(b);
  await DL.backup.wipe(); assert.strictEqual((await DL.db.getAll('products')).length, 0);
  const parsed = DL.backup.parse(text); await DL.backup.restore(parsed);
  const after = await DL.db.loadAll(); assert.deepStrictEqual(after.products.map((x) => [x.id, x.stock]), data.products.map((x) => [x.id, x.stock])); assert.strictEqual(after.sales.length, data.sales.length); ok('backup → apagar → restaurar');
  await rejects(async () => DL.backup.parse('lixo'), /JSON/, 'backup ilegível é recusado');
  const bad = JSON.parse(text); bad.data.products[0].stock = -5;
  await rejects(async () => DL.backup.parse(JSON.stringify(bad)), /corrompido/, 'backup com estoque negativo é recusado');
  assert.strictEqual((await DL.db.getAll('products')).length, 2); ok('restauração inválida não altera dados');

  // demo (banco separado)
  DL.db.close(); DL.mode.set('demo'); await DL.demo.ensure();
  const d = await DL.db.loadAll();
  assert(d.products.length === 6 && d.sales.length > 100); assert(d.products.every((x) => x.stock >= 0));
  d.products.forEach((pp) => { const made = d.productions.filter((x) => x.productId === pp.id).reduce((a, x) => a + x.qty, 0); const sold = d.sales.filter((x) => x.productId === pp.id).reduce((a, x) => a + x.qty, 0); assert.strictEqual(made - sold, pp.stock); }); ok('demonstração consistente (estoque = produzido − vendido)');
  DL.db.close(); DL.mode.set('real');
  assert.strictEqual((await DL.db.getAll('products')).length, 2); ok('dados reais intactos após usar a demonstração');
  console.log('\nTODOS OS ' + n + ' TESTES PASSARAM');
})().catch((e) => { console.error('FALHOU:', e); process.exit(1); });
