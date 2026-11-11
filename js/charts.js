/* charts.js — gráficos (Chart.js local, sem CDN) com a paleta da confeitaria */
(function (global) {
  'use strict';
  const DL = (global.DL = global.DL || {});
  const inst = {};
  const COLORS = ['#b9763f', '#c9a24b', '#7a4a2e', '#e6c878', '#4a2c1d', '#d9a679', '#8f6b3f', '#a3541f'];
  const money = (n) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(n);

  function ready() {
    if (typeof global.Chart === 'undefined') return false;
    global.Chart.defaults.font.family = "'Nunito', system-ui, sans-serif";
    global.Chart.defaults.color = '#85694f';
    return true;
  }
  function draw(id, cfg) {
    const el = document.getElementById(id);
    if (!el) return null;
    if (inst[id]) { inst[id].destroy(); delete inst[id]; }
    if (!ready()) { el.parentNode.innerHTML = '<p class="muted center" style="padding:40px 10px">Não foi possível carregar os gráficos (Chart.js).</p>'; return null; }
    inst[id] = new global.Chart(el.getContext('2d'), cfg);
    return inst[id];
  }

  // Faturamento (barras) × despesas (linha)
  function revenue(id, ser, withExpenses) {
    const ds = [{ type: 'bar', label: 'Faturamento', data: ser.revenue, backgroundColor: '#c9a24b', hoverBackgroundColor: '#b08a34', borderRadius: 5, maxBarThickness: 28 }];
    if (withExpenses) ds.push({ type: 'bar', label: 'Despesas', data: ser.expenses, backgroundColor: '#7a4a2e', hoverBackgroundColor: '#4a2c1d', borderRadius: 5, maxBarThickness: 28 });
    return draw(id, {
      data: { labels: ser.labels, datasets: ds },
      options: {
        responsive: true, maintainAspectRatio: false, interaction: { mode: 'index', intersect: false },
        plugins: { legend: { position: 'bottom', labels: { usePointStyle: true, boxWidth: 8 } }, tooltip: { callbacks: { label: (c) => ' ' + c.dataset.label + ': ' + money(c.parsed.y) } } },
        scales: { x: { grid: { display: false }, ticks: { maxRotation: 0, autoSkip: true, maxTicksLimit: 14 } }, y: { beginAtZero: true, grid: { color: 'rgba(122,74,46,.12)' }, ticks: { callback: (v) => money(v).replace(',00', '') } } },
      },
    });
  }

  function doughnut(id, labels, values) {
    return draw(id, {
      type: 'doughnut',
      data: { labels, datasets: [{ data: values, backgroundColor: COLORS, borderColor: '#fffdf8', borderWidth: 3, hoverOffset: 8 }] },
      options: { responsive: true, maintainAspectRatio: false, cutout: '62%', plugins: { legend: { position: 'bottom', labels: { usePointStyle: true, boxWidth: 8 } }, tooltip: { callbacks: { label: (c) => ' ' + c.label + ': ' + c.parsed + ' un.' } } } },
    });
  }
  DL.charts = { revenue, doughnut, draw, ready };
})(typeof window !== 'undefined' ? window : globalThis);
