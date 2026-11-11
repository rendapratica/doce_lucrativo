const { chromium } = require('playwright');
const SH = process.argv[2];
const BASE = 'http://localhost:8765/';
let fails = 0;
const ok = (c, m) => { if (!c) { fails++; console.log('  FALHOU:', m); } else console.log('  ok  :', m); };
(async () => {
  const browser = await chromium.launch();
  const ctx = await browser.newContext({ viewport: { width: 1360, height: 900 }, deviceScaleFactor: 1 });
  const page = await ctx.newPage();
  const errors = [];
  page.on('pageerror', (e) => errors.push('pageerror: ' + e.message));
  page.on('console', (m) => { if (m.type() === 'error') errors.push('console: ' + m.text()); });
  const go = async (p) => { await page.goto(BASE + p); await page.waitForSelector('.content > *:not(.loading)', { timeout: 8000 }).catch(() => {}); await page.waitForTimeout(250); };

  // --- Início
  await go('index.html');
  ok(await page.locator('.hero h1').count() === 1, 'Início carrega');
  await page.screenshot({ path: SH + '/01-inicio.png' });

  // --- Produtos: validação, cadastro, edição
  await go('produtos.html');
  await page.click('#btn-new');
  await page.click('#btn-save');
  ok(await page.locator('.field.invalid').count() >= 3, 'Produto vazio mostra erros de validação');
  await page.fill('#f-name', 'Brigadeiro tradicional'); await page.selectOption('#f-category', 'Brigadeiros');
  await page.fill('#f-price', '3,00'); await page.fill('#f-cost', '0,90'); await page.fill('#f-stock', '0');
  await page.click('#btn-save'); await page.waitForTimeout(300);
  ok(await page.locator('.tile h3', { hasText: 'Brigadeiro tradicional' }).count() === 1, 'Produto cadastrado aparece');
  await page.click('#btn-new');
  await page.fill('#f-name', 'Beijinho'); await page.selectOption('#f-category', 'Beijinhos'); await page.fill('#f-price', '2,50'); await page.fill('#f-cost', '0,80'); await page.fill('#f-stock', '0');
  await page.click('#btn-save'); await page.waitForTimeout(300);
  await page.click('[data-edit]'); await page.fill('#f-description', 'Chocolate com granulado'); await page.click('#btn-save'); await page.waitForTimeout(300);
  ok(await page.locator('.tile', { hasText: 'Chocolate com granulado' }).count() === 1, 'Edição de produto funciona');
  await page.screenshot({ path: SH + '/02-produtos.png' });

  // --- Produção
  await go('producao.html');
  await page.selectOption('#f-product', { label: 'Beijinho' });
  await page.fill('#f-qty', '40'); await page.fill('#f-cost', '32,00');
  await page.click('#btn-save'); await page.waitForTimeout(300);
  await page.selectOption('#f-product', { index: 1 });
  await page.fill('#f-qty', '50'); await page.fill('#f-cost', '45'); await page.click('#btn-save'); await page.waitForTimeout(300);
  ok(await page.locator('#list tbody tr').count() === 2, 'Duas produções registradas');

  // --- Vendas: não vende acima do estoque
  await go('vendas.html');
  const opts = await page.locator('#f-product option').allTextContents();
  ok(opts.some((o) => /disp\./.test(o)), 'Lista de produtos mostra estoque disponível: ' + opts.join(' | '));
  await page.selectOption('#f-product', { index: 1 });
  await page.fill('#f-qty', '9999'); await page.click('#btn-save'); await page.waitForTimeout(300);
  ok(await page.locator('.toast.err').count() >= 1, 'Venda acima do estoque é recusada com aviso');
  await page.fill('#f-qty', '20'); await page.fill('#f-price', '3'); await page.selectOption('#f-payment', 'Pix');
  await page.click('#btn-save'); await page.waitForTimeout(400);
  ok(await page.locator('#list tbody tr').count() === 1, 'Venda válida registrada');
  await page.screenshot({ path: SH + '/03-vendas.png' });

  // --- Despesas
  await go('despesas.html');
  await page.fill('#f-desc', 'Chocolate meio amargo'); await page.selectOption('#f-category', 'Chocolate'); await page.fill('#f-amount', '35,90');
  await page.click('#btn-save'); await page.waitForTimeout(300);
  ok(await page.locator('#list tbody tr').count() === 1, 'Despesa lançada');

  // --- Dashboard reflete tudo
  await go('dashboard.html');
  const txt = await page.locator('#top-cards').innerText();
  ok(/60,00/.test(txt), 'Painel: faturamento do dia = R$ 60,00 → ' + txt.replace(/\n/g, ' '));
  const per = await page.locator('#period-cards').innerText();
  ok(/35,90/.test(per), 'Painel: despesas aparecem');
  await page.waitForTimeout(600);
  ok(await page.locator('#ch-rev').evaluate((c) => c.width > 0), 'Gráfico de faturamento desenhado');
  await page.screenshot({ path: SH + '/04-dashboard-real.png', fullPage: true });

  // --- Calculadora
  await go('calculadora.html');
  await page.fill('#c-ing', '30'); await page.fill('#c-qty', '30'); await page.fill('#c-pack', '6'); await page.fill('#c-other', '4'); await page.fill('#c-margin', '50');
  await page.waitForTimeout(200);
  const calc = await page.locator('#result').innerText();
  ok(/2,67/.test(calc) && /1,33/.test(calc), 'Calculadora: custo 1,33 e preço 2,67');
  await page.screenshot({ path: SH + '/05-calculadora.png' });

  // --- Relatórios + CSV
  await go('relatorios.html');
  await page.waitForTimeout(500);
  const [dl] = await Promise.all([page.waitForEvent('download'), page.click('[data-exp="vendas"]')]);
  const fs = require('fs'); const p = SH + '/vendas.csv'; await dl.saveAs(p);
  const csv = fs.readFileSync(p, 'utf8');
  ok(/Brigadeiro tradicional|Beijinho/.test(csv) && csv.charCodeAt(0) === 0xfeff, 'CSV de vendas baixado com BOM e dados');

  // --- Backup: baixa, apaga, restaura
  await go('backup.html');
  const [bk] = await Promise.all([page.waitForEvent('download'), page.click('#btn-export')]);
  const bp = SH + '/backup.json'; await bk.saveAs(bp);
  ok(JSON.parse(fs.readFileSync(bp, 'utf8')).data.sales.length === 1, 'Backup JSON contém a venda');
  await page.click('#btn-wipe'); await page.fill('#cf-typed', 'APAGAR'); await page.click('dialog.confirm [data-r="1"]'); await page.waitForTimeout(400);
  await go('produtos.html');
  ok(await page.locator('.tile').count() === 0, 'Apagar tudo funciona');
  await go('backup.html');
  await page.setInputFiles('#f-file', bp); await page.waitForSelector('#btn-restore');
  await page.click('#btn-restore'); await page.click('dialog.confirm [data-r="1"]'); await page.waitForTimeout(500);
  await go('produtos.html');
  ok(await page.locator('.tile').count() === 2, 'Restauração devolve os 2 produtos');
  await go('backup.html');
  fs.writeFileSync(SH + '/ruim.json', '{"app":"doce-lucrativo","version":1,"data":{"products":[{"id":1,"name":"x","price":1,"cost":1,"stock":-3}],"productions":[],"sales":[],"expenses":[]}}');
  await page.setInputFiles('#f-file', SH + '/ruim.json'); await page.waitForTimeout(300);
  ok(await page.locator('#restore-info .alert.bad').count() === 1, 'Backup inválido é recusado');

  // --- Receitas
  await go('receitas.html');
  ok(await page.locator('.tile').count() >= 10, 'Receitas embutidas listadas');
  await page.screenshot({ path: SH + '/06-receitas.png', fullPage: false });
  await page.click('.tile >> nth=0'); await page.waitForSelector('#v-body .recipe-hero');
  await page.screenshot({ path: SH + '/07-receita-aberta.png' });
  await page.keyboard.press('Escape');
  await page.click('#btn-new'); await page.fill('#r-name', 'Minha trufa'); await page.selectOption('#r-category', 'Trufas');
  await page.fill('#r-yield', '20 un'); await page.fill('#r-time', '30 min'); await page.fill('#r-ing', 'a\nb'); await page.fill('#r-steps', '1\n2');
  await page.click('#btn-save'); await page.waitForTimeout(300);
  ok(await page.locator('.tile', { hasText: 'Minha trufa' }).count() === 1, 'Receita do usuário cadastrada');

  // --- Demonstração separada
  await page.goto(BASE + 'dashboard.html'); await page.waitForTimeout(300);
  await page.click('.sidebar [data-act="enter-demo"]'); await page.click('dialog.confirm [data-r="1"]');
  await page.waitForSelector('.demo-banner'); await page.waitForTimeout(900);
  ok(await page.locator('.demo-banner').count() === 1, 'Banner da demonstração visível');
  await page.screenshot({ path: SH + '/08-dashboard-demo.png', fullPage: true });
  await go('produtos.html');
  ok(await page.locator('.tile').count() === 6, 'Demonstração tem 6 produtos próprios');
  await page.click('.sidebar [data-act="exit-demo"]'); await page.waitForTimeout(800);
  await go('produtos.html');
  ok(await page.locator('.tile').count() === 2, 'Dados reais intactos após sair da demonstração');

  console.log('\nERROS DE CONSOLE/JS:', errors.length ? '\n' + errors.join('\n') : 'nenhum');
  await browser.close();
  console.log(fails ? '\n' + fails + ' FALHA(S)' : '\nTODOS OS FLUXOS OK');
  process.exit(fails ? 1 : 0);
})().catch((e) => { console.error('ERRO NO TESTE:', e); process.exit(2); });
