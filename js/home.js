/* home.js — tela inicial: boas-vindas, atalhos e resumo rápido do dia */
(function () {
  'use strict';
  const { icon, esc, money, int, $ } = DL.ui;

  DL.ui.boot(async function () {
    const data = await DL.db.loadAll();
    const today = DL.dates.today();
    const s = DL.calc.summarize(data, today, today);
    const hasProducts = data.products.length > 0;
    const stock = data.products.reduce((a, p) => a + p.stock, 0);
    const last = await DL.db.getSetting('lastBackupAt', null);
    const backupOld = hasProducts && !DL.mode.isDemo() && (!last || Date.now() - last > 30 * 86400000);
    const picks = DL.RECIPES.slice(0, 3);

    const shortcuts = [
      ['vendas.html', 'cart', 'Registrar venda', 'Dá baixa no estoque na hora'],
      ['producao.html', 'cake', 'Registrar produção', 'Soma os doces no estoque'],
      ['produtos.html', 'box', 'Meus produtos', 'Preço, custo e fotos'],
      ['despesas.html', 'wallet', 'Lançar despesa', 'Chocolate, gás, embalagens…'],
      ['calculadora.html', 'calc', 'Calculadora de preços', 'Descubra quanto cobrar'],
      ['relatorios.html', 'file', 'Relatórios', 'Exporte em CSV'],
    ];

    $('#content').innerHTML =
      '<section class="hero"><div><span class="pill gold">' + icon('sparkle') + ' Receitas &amp; gestão</span>' +
      '<h1>Faça doces que <em>dão lucro</em></h1>' +
      '<p>Tenha receitas e um sistema simples para controlar produção, vendas, estoque e despesas, sem planilha e sem complicação.</p>' +
      '<div class="row" style="margin-top:18px"><a class="btn gold" href="' + (hasProducts ? 'dashboard.html' : 'produtos.html') + '">' + (hasProducts ? 'Abrir meu painel' : 'Cadastrar meu primeiro produto') + '</a>' +
      '<a class="btn" style="background:rgba(255,255,255,.12);color:#fff" href="receitas.html">' + icon('book') + ' Ver receitas</a>' +
      (DL.mode.isDemo() ? '' : '<button class="btn" style="background:rgba(255,255,255,.12);color:#fff" type="button" data-act="enter-demo">' + icon('eye') + ' Conhecer com exemplos</button>') + '</div></div>' +
      '<div class="hero-art">' + '<img src="img/receitas/home-doces.jpg" alt="Brigadeiros, beijinhos, trufas e brownies sobre uma mesa de madeira">' + '</div></section>' +

      (backupOld ? '<div class="alert section">' + icon('shield') + '<div><b>Hora de fazer um backup.</b> Seus dados ficam só neste aparelho. <a href="backup.html">Salvar um backup agora</a>.</div></div>' : '') +

      '<section class="section"><div class="grid g4">' +
      DL.ui.stat('Vendido hoje', money(s.revenue), { icon: 'cart', tone: 'gold', note: s.salesCount + (s.salesCount === 1 ? ' venda' : ' vendas') }) +
      DL.ui.stat('Doces vendidos hoje', int(s.unitsSold), { icon: 'tag' }) +
      DL.ui.stat('Produzidos hoje', int(s.produced), { icon: 'cake' }) +
      DL.ui.stat('Estoque disponível', int(stock), { icon: 'box', tone: 'dark', note: data.products.length + (data.products.length === 1 ? ' produto' : ' produtos') }) +
      '</div></section>' +

      '<section class="section"><h2>Por onde começar</h2><div class="steps3">' +
      '<div><h3>Cadastre seus produtos</h3><p class="muted">Informe nome, preço de venda e custo de cada doce. Se tiver foto, melhor.</p></div>' +
      '<div><h3>Registre produção e vendas</h3><p class="muted">Cada produção soma ao estoque e cada venda desconta sozinha. Não dá para vender mais do que existe.</p></div>' +
      '<div><h3>Acompanhe o lucro</h3><p class="muted">O painel mostra faturamento, despesas e lucro estimado por dia, semana e mês.</p></div></div></section>' +

      '<section class="section"><h2>Atalhos</h2><div class="grid g3">' +
      shortcuts.map((a) => '<a class="shortcut" href="' + a[0] + '"><div class="ico">' + icon(a[1]) + '</div><div><b>' + a[2] + '</b><span>' + a[3] + '</span></div></a>').join('') + '</div></section>' +

      '<section class="section"><div class="card-head"><h2 style="margin:0">Receitas para começar</h2><a class="btn sm" href="receitas.html">Ver todas</a></div>' +
      '<div class="cards-grid">' + picks.map((r) => '<a class="tile" href="receitas.html?r=' + esc(r.id) + '" style="text-decoration:none;color:inherit"><div class="thumb">' + DL.ui.thumb(r, r.art) + '</div><div class="body"><h3>' + esc(r.name) + '</h3><div class="meta"><span>' + icon('clock') + ' ' + esc(r.time.split(' + ')[0]) + '</span><span>' + esc(r.yield.split(' (')[0]) + '</span></div><div class="price">Sugestão: ' + money(r.suggestedPrice) + ' / un.</div></div></a>').join('') + '</div></section>';
  });
})();
