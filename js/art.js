/* art.js — ilustrações originais (SVG) de doces, usadas como "foto ilustrativa" quando
   não há uma fotografia. Nenhuma imagem externa: funciona offline e sem direitos autorais. */
(function (global) {
  'use strict';
  const DL = (global.DL = global.DL || {});
  let uid = 0;

  function pseudo(seed) {
    let a = seed >>> 0;
    return () => { a = (a + 0x6d2b79f5) | 0; let t = Math.imul(a ^ (a >>> 15), 1 | a); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
  }
  const f = (n) => Math.round(n * 10) / 10;

  // Configuração de cada doce: cores do fundo/mesa, da bola, da forminha e do acabamento
  const K = {
    brigadeiro: { label: 'Brigadeiros tradicionais com granulado', bg: ['#fbefd6', '#efd3a6'], table: ['#d9a86c', '#b9824a'], base: ['#8a4f2c', '#2c150b'], cup: ['#e6c25f', '#f8e8b0'], top: 'sprinkles', colors: ['#24110a', '#4d2814', '#150804'] },
    gourmet: { label: 'Brigadeiros gourmet brilhantes', bg: ['#f5e6d0', '#e0bd92'], table: ['#caa06a', '#a8794a'], base: ['#6c3a22', '#220f08'], cup: ['#d8b25a', '#f2dea0'], top: 'gloss', colors: ['#e8c866', '#f6e7a8'] },
    beijinho: { label: 'Beijinhos de coco com cravo', bg: ['#fdf3df', '#f0d9ad'], table: ['#dcb27a', '#bd8b55'], base: ['#fffaf0', '#e8d9b8'], cup: ['#e9b8a2', '#f9ded0'], top: 'coconut', colors: ['#ffffff', '#f6ecd5'] },
    trufa: { label: 'Trufas de chocolate com cacau', bg: ['#f4e4cf', '#dcb88f'], table: ['#c49462', '#9d6f43'], base: ['#7b4a2f', '#3a1d10'], cup: ['#9b6a3f', '#d9b787'], top: 'cocoa', colors: ['#9a6a45', '#5c3420', '#b88a62'] },
    maracuja: { label: 'Trufas de maracujá', bg: ['#fff3d2', '#f4d98a'], table: ['#dcb27a', '#bd8b55'], base: ['#fbe08a', '#e0a92e'], cup: ['#f0a14a', '#f8d9a0'], top: 'seeds', colors: ['#3a2418', '#7a5b2a'] },
    ninho: { label: 'Docinhos de leite em pó', bg: ['#fdf5e3', '#f1dcb2'], table: ['#d9ad74', '#b98a56'], base: ['#fffbee', '#f0e2bd'], cup: ['#f2d58a', '#fbeec2'], top: 'powder', colors: ['#ffffff', '#fff3d4'] },
    cajuzinho: { label: 'Cajuzinhos açucarados', bg: ['#f8e9d0', '#e5c391'], table: ['#cfa066', '#a97a47'], base: ['#8a5530', '#3f2112'], cup: ['#c9923f', '#ecd09a'], top: 'sugar', colors: ['#ffffff', '#f4e9d6'] },
    olho: { label: 'Olhos de sogra', bg: ['#f4e6d8', '#dcbb9a'], table: ['#c99a68', '#a2733f'], base: ['#6a3b4a', '#2c1520'], cup: ['#cfa458', '#f0dba6'], top: 'sugar', colors: ['#ffffff', '#fbeedd'] },
    brownie: { label: 'Brownies de chocolate', bg: ['#f6e5cd', '#e3c08f'], table: ['#c99a63', '#9d6e3f'], square: true },
    palha: { label: 'Palha italiana', bg: ['#f8e8cf', '#e6c796'], table: ['#d3a56c', '#ad7d49'], square: true, palha: true },
    'pote-choc': { label: 'Bolo no pote de chocolate', bg: ['#f7e6d0', '#e4bf94'], table: ['#caa06a', '#a8794a'], jar: true, layers: ['#4a2616', '#a8683a', '#4a2616', '#a8683a'], topc: '#5a2e1b', sprinkles: true },
    'pote-ninho': { label: 'Bolo no pote de ninho com morango', bg: ['#fdeee4', '#f4cfba'], table: ['#d9ad74', '#b98a56'], jar: true, layers: ['#f7e3b4', '#fbf4e2', '#e06a78', '#fbf4e2'], topc: '#fffaf0', berry: true },
  };
  DL.ART_KINDS = Object.keys(K).concat(['mix']);

  // Categoria de produto -> ilustração padrão
  DL.artForCategory = (cat) => ({ Brigadeiros: 'brigadeiro', Beijinhos: 'beijinho', Trufas: 'trufa', Brownies: 'brownie', 'Bolos no pote': 'pote-choc', 'Docinhos finos': 'cajuzinho', 'Tortas e bolos': 'pote-ninho' }[cat] || 'ninho');

  function ballScene(id, cfg, rand, balls) {
    let s = '';
    balls.forEach((b) => {
      const c = b.cfg || cfg, r = b.r, cx = b.x, cy = b.y;
      const topY = cy + r * 0.42, botY = cy + r * 1.08, wTop = r * 1.08, wBot = r * 0.74, gid = id + b.n;
      s += '<defs><radialGradient id="' + gid + 'b" cx="35%" cy="30%" r="80%"><stop offset="0" stop-color="' + c.base[0] + '"/><stop offset="1" stop-color="' + c.base[1] + '"/></radialGradient>' +
        '<linearGradient id="' + gid + 'c" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="' + c.cup[0] + '"/><stop offset=".5" stop-color="' + c.cup[1] + '"/><stop offset="1" stop-color="' + c.cup[0] + '"/></linearGradient></defs>';
      s += '<ellipse cx="' + cx + '" cy="' + f(cy + r * 1.07) + '" rx="' + f(r * 1.05) + '" ry="' + f(r * 0.2) + '" fill="rgba(60,30,10,.28)"/>';
      s += '<circle cx="' + cx + '" cy="' + cy + '" r="' + r + '" fill="url(#' + gid + 'b)"/>';
      const n = c.top === 'sprinkles' ? 70 : c.top === 'coconut' ? 130 : c.top === 'cocoa' ? 90 : c.top === 'powder' ? 110 : c.top === 'sugar' ? 120 : c.top === 'seeds' ? 22 : 10;
      for (let i = 0; i < n; i++) {
        const ang = rand() * Math.PI * 2, d = Math.sqrt(rand()) * r * 0.93, x = cx + Math.cos(ang) * d, y = cy + Math.sin(ang) * d, col = c.colors[Math.floor(rand() * c.colors.length)];
        if (c.top === 'sprinkles') s += '<rect x="' + f(x - 4.5) + '" y="' + f(y - 1.3) + '" width="9" height="2.6" rx="1.3" fill="' + col + '" transform="rotate(' + f(rand() * 180) + ' ' + f(x) + ' ' + f(y) + ')"/>';
        else if (c.top === 'seeds') s += '<ellipse cx="' + f(x) + '" cy="' + f(y) + '" rx="2.2" ry="1.5" fill="' + col + '" opacity=".85"/>';
        else if (c.top === 'gloss') s += '<circle cx="' + f(x) + '" cy="' + f(y) + '" r="' + f(1 + rand() * 1.6) + '" fill="' + col + '" opacity=".9"/>';
        else s += '<circle cx="' + f(x) + '" cy="' + f(y) + '" r="' + f(1 + rand() * (c.top === 'coconut' ? 2.6 : 1.9)) + '" fill="' + col + '" opacity="' + (c.top === 'cocoa' ? '.55' : '.92') + '"/>';
      }
      if (c.top === 'cocoa') s += '<circle cx="' + cx + '" cy="' + cy + '" r="' + r + '" fill="rgba(140,90,55,.28)"/>';
      if (c.top === 'gloss') s += '<ellipse cx="' + f(cx - r * 0.34) + '" cy="' + f(cy - r * 0.42) + '" rx="' + f(r * 0.3) + '" ry="' + f(r * 0.15) + '" fill="#fff" opacity=".55" transform="rotate(-28 ' + f(cx - r * 0.34) + ' ' + f(cy - r * 0.42) + ')"/>';
      else s += '<ellipse cx="' + f(cx - r * 0.36) + '" cy="' + f(cy - r * 0.42) + '" rx="' + f(r * 0.24) + '" ry="' + f(r * 0.12) + '" fill="#fff" opacity=".22" transform="rotate(-28 ' + f(cx - r * 0.36) + ' ' + f(cy - r * 0.42) + ')"/>';
      if (c.top === 'coconut') s += '<g transform="translate(' + f(cx) + ' ' + f(cy - r * 0.12) + ')"><circle r="4.2" fill="#4b2a18"/><path d="M-5 -5 L0 -1 L5 -5 M-5 5 L0 1 L5 5 M-5 0 L5 0" stroke="#4b2a18" stroke-width="1.6" stroke-linecap="round" fill="none"/></g>';
      s += '<path d="M' + f(cx - wTop) + ' ' + f(topY) + ' L' + f(cx - wBot) + ' ' + f(botY) + ' L' + f(cx + wBot) + ' ' + f(botY) + ' L' + f(cx + wTop) + ' ' + f(topY) + ' Z" fill="url(#' + gid + 'c)"/>';
      for (let i = -5; i <= 5; i++) s += '<line x1="' + f(cx + (i * wTop) / 5.2) + '" y1="' + f(topY) + '" x2="' + f(cx + (i * wBot) / 5.2) + '" y2="' + f(botY) + '" stroke="rgba(110,70,20,.32)" stroke-width="1.3"/>';
      s += '<path d="M' + f(cx - wTop) + ' ' + f(topY) + ' Q' + f(cx) + ' ' + f(topY + r * 0.22) + ' ' + f(cx + wTop) + ' ' + f(topY) + '" fill="none" stroke="rgba(110,70,20,.4)" stroke-width="2"/>';
    });
    return s;
  }

  function brownieScene(id, rand, palha) {
    let s = '<defs><linearGradient id="' + id + 'bt" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="' + (palha ? '#8a5836' : '#5a3019') + '"/><stop offset="1" stop-color="' + (palha ? '#4d2a16' : '#2d160c') + '"/></linearGradient></defs>';
    s += '<ellipse cx="200" cy="232" rx="165" ry="30" fill="#fffaf0" opacity=".9"/><ellipse cx="200" cy="232" rx="165" ry="30" fill="none" stroke="#ead9bd" stroke-width="3"/>';
    const pieces = palha ? [[92, 150, 78, 60], [168, 134, 78, 60], [244, 150, 78, 60], [130, 186, 78, 56], [206, 182, 78, 56]] : [[96, 150, 128, 78], [188, 118, 128, 78], [150, 176, 128, 78]];
    pieces.forEach((q, qi) => {
      const [x, y, w, h] = q, depth = palha ? 18 : 26;
      s += '<rect x="' + (x + 6) + '" y="' + (y + depth + 3) + '" width="' + w + '" height="' + (h * 0.12) + '" rx="6" fill="rgba(50,25,10,.25)"/>';
      s += '<rect x="' + x + '" y="' + (y + 6) + '" width="' + w + '" height="' + (h + depth - 6) + '" rx="10" fill="' + (palha ? '#3d2012' : '#24110a') + '"/>';
      for (let i = 0; i < 6; i++) s += '<line x1="' + (x + 8 + rand() * (w - 16)) + '" y1="' + (y + h + 2) + '" x2="' + (x + 8 + rand() * (w - 16)) + '" y2="' + (y + h + depth - 4) + '" stroke="' + (palha ? '#7a4b2b' : '#5a3019') + '" stroke-width="2" opacity=".5" stroke-linecap="round"/>';
      s += '<rect x="' + x + '" y="' + y + '" width="' + w + '" height="' + h + '" rx="10" fill="url(#' + id + 'bt)"/>';
      if (palha) { for (let i = 0; i < 46; i++) s += '<circle cx="' + f(x + 5 + rand() * (w - 10)) + '" cy="' + f(y + 5 + rand() * (h - 10)) + '" r="' + f(0.8 + rand() * 1.6) + '" fill="#fff5dc" opacity=".85"/>'; }
      else {
        for (let i = 0; i < 5; i++) { const px = x + 14 + rand() * (w - 28), py = y + 12 + rand() * (h - 24); s += '<path d="M' + f(px) + ' ' + f(py) + ' q' + f(8 + rand() * 12) + ' ' + f(-5 + rand() * 10) + ' ' + f(14 + rand() * 18) + ' ' + f(rand() * 8) + '" stroke="#c9a074" stroke-width="1.6" fill="none" opacity=".55" stroke-linecap="round"/>'; }
        s += '<path d="M' + (x + 10) + ' ' + (y + 8) + ' h' + (w - 20) + '" stroke="#fff" stroke-width="2" opacity=".18" stroke-linecap="round"/>';
        if (qi !== 2) { const nx = x + w * 0.5, ny = y + h * 0.5; s += '<path d="M' + f(nx - 12) + ' ' + f(ny) + ' q4 -12 14 -8 q10 -4 12 8 q-6 12 -14 8 q-8 4 -12 -8z" fill="#c9985c"/><path d="M' + f(nx - 6) + ' ' + f(ny - 1) + ' q6 -4 10 0 M' + f(nx - 4) + ' ' + f(ny + 5) + ' q6 -3 10 0" stroke="#8a5a2a" stroke-width="1.3" fill="none"/>'; }
        for (let i = 0; i < 30; i++) s += '<circle cx="' + f(x + 6 + rand() * (w - 12)) + '" cy="' + f(y + 6 + rand() * (h - 12)) + '" r="' + f(0.7 + rand() * 1.1) + '" fill="#fff6e6" opacity=".6"/>';
      }
    });
    return s;
  }

  function jarScene(id, cfg, rand) {
    const x = 128, w = 144, top = 64, bot = 246, h = bot - top;
    let s = '<defs><clipPath id="' + id + 'jc"><rect x="' + x + '" y="' + top + '" width="' + w + '" height="' + h + '" rx="22"/></clipPath><linearGradient id="' + id + 'gl" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#fff" stop-opacity=".55"/><stop offset=".25" stop-color="#fff" stop-opacity=".05"/><stop offset=".8" stop-color="#fff" stop-opacity=".0"/><stop offset="1" stop-color="#fff" stop-opacity=".35"/></linearGradient></defs>';
    s += '<ellipse cx="200" cy="' + (bot + 4) + '" rx="108" ry="15" fill="rgba(60,30,10,.28)"/>';
    s += '<g clip-path="url(#' + id + 'jc)"><rect x="' + x + '" y="' + top + '" width="' + w + '" height="' + h + '" fill="rgba(255,255,255,.6)"/>';
    const layerH = (h - 46) / cfg.layers.length;
    cfg.layers.forEach((c, i) => {
      const y = bot - (i + 1) * layerH;
      s += '<rect x="' + x + '" y="' + f(y) + '" width="' + w + '" height="' + f(layerH + 1) + '" fill="' + c + '"/>';
      if (i % 2 === 0 && !cfg.berry) for (let k = 0; k < 24; k++) s += '<circle cx="' + f(x + 6 + rand() * (w - 12)) + '" cy="' + f(y + 4 + rand() * (layerH - 8)) + '" r="' + f(1 + rand() * 1.8) + '" fill="rgba(255,225,180,.4)"/>';
      if (cfg.berry && (i === 2)) for (let k = 0; k < 12; k++) s += '<ellipse cx="' + f(x + 8 + rand() * (w - 16)) + '" cy="' + f(y + 4 + rand() * (layerH - 8)) + '" rx="5" ry="3" fill="#c9414f" opacity=".75"/>';
    });
    s += '</g>';
    const ty = bot - cfg.layers.length * layerH;
    s += '<path d="M' + (x + 4) + ' ' + f(ty) + ' q' + (w / 8) + ' -30 ' + (w / 4) + ' -6 t' + (w / 4) + ' -2 t' + (w / 4) + ' 0 t' + (w / 4 - 4) + ' 8 v10 h-' + (w - 8) + 'z" fill="' + cfg.topc + '"/>';
    if (cfg.berry) s += '<g transform="translate(200 ' + f(ty - 22) + ')"><path d="M0 -14 C-18 -14 -22 4 -12 18 Q0 30 12 18 C22 4 18 -14 0 -14Z" fill="#d6303f"/><path d="M-9 -14 l9 -9 9 9" fill="#3f8a4a"/>' + [[-8, -2], [4, 2], [-2, 10], [9, -4], [-10, 8]].map((p) => '<circle cx="' + p[0] + '" cy="' + p[1] + '" r="1.3" fill="#ffd9a8"/>').join('') + '</g>';
    else if (cfg.sprinkles) { for (let i = 0; i < 26; i++) { const px = x + 14 + rand() * (w - 28), py = ty - 14 + rand() * 20; s += '<rect x="' + f(px) + '" y="' + f(py) + '" width="8" height="2.4" rx="1.2" fill="' + (rand() > 0.5 ? '#2a140b' : '#e6c25f') + '" transform="rotate(' + f(rand() * 180) + ' ' + f(px) + ' ' + f(py) + ')"/>'; } s += '<circle cx="200" cy="' + f(ty - 22) + '" r="15" fill="#4a2616"/><ellipse cx="195" cy="' + f(ty - 28) + '" rx="5" ry="3" fill="#fff" opacity=".3"/>'; }
    s += '<rect x="' + x + '" y="' + top + '" width="' + w + '" height="' + h + '" rx="22" fill="url(#' + id + 'gl)" stroke="rgba(255,255,255,.9)" stroke-width="2.5"/>';
    s += '<rect x="' + (x - 6) + '" y="' + (top - 8) + '" width="' + (w + 12) + '" height="14" rx="6" fill="#fff" opacity=".85" stroke="#e4d6bd"/>';
    s += '<g transform="rotate(14 330 150)"><rect x="326" y="76" width="9" height="140" rx="4.5" fill="#d9b45a"/><ellipse cx="330" cy="86" rx="12" ry="16" fill="#e9c872"/></g>';
    return s;
  }

  // Gera o SVG completo. opts.label sobrescreve o texto de acessibilidade.
  function art(kind, opts) {
    opts = opts || {};
    const id = 'a' + (++uid) + '_';
    const key = K[kind] ? kind : kind === 'mix' ? 'mix' : 'ninho';
    const cfg = K[key] || K.brigadeiro;
    const rand = pseudo(1000 + key.split('').reduce((a, c) => a + c.charCodeAt(0), 0));
    let s = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 300" preserveAspectRatio="xMidYMid slice" role="img" aria-label="' + (opts.label || (cfg.label ? 'Ilustração: ' + cfg.label : 'Ilustração de doces')) + '">';
    const bg = (cfg.bg || K.brigadeiro.bg), tb = (cfg.table || K.brigadeiro.table);
    s += '<defs><linearGradient id="' + id + 'bg" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="' + bg[0] + '"/><stop offset="1" stop-color="' + bg[1] + '"/></linearGradient><linearGradient id="' + id + 'tb" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="' + tb[0] + '"/><stop offset="1" stop-color="' + tb[1] + '"/></linearGradient></defs>';
    s += '<rect width="400" height="300" fill="url(#' + id + 'bg)"/>';
    [[60, 50, 46, .35], [330, 40, 60, .28], [250, 90, 28, .3], [30, 140, 24, .25], [370, 130, 30, .3]].forEach((c) => { s += '<circle cx="' + c[0] + '" cy="' + c[1] + '" r="' + c[2] + '" fill="#fff" opacity="' + c[3] + '"/>'; });
    s += '<rect y="214" width="400" height="86" fill="url(#' + id + 'tb)"/><rect y="214" width="400" height="4" fill="rgba(255,255,255,.35)"/>';
    for (let i = 0; i < 5; i++) s += '<path d="M0 ' + (232 + i * 15) + ' Q100 ' + (228 + i * 15) + ' 200 ' + (233 + i * 15) + ' T400 ' + (231 + i * 15) + '" stroke="rgba(80,45,15,.14)" stroke-width="1.5" fill="none"/>';
    if (key === 'mix') {
      s += ballScene(id, K.brigadeiro, rand, [
        { n: 1, x: 112, y: 168, r: 44, cfg: K.beijinho }, { n: 2, x: 288, y: 168, r: 44, cfg: K.trufa },
        { n: 3, x: 200, y: 178, r: 56, cfg: K.brigadeiro }]);
    } else if (cfg.jar) s += jarScene(id, cfg, rand);
    else if (cfg.square) s += brownieScene(id, rand, !!cfg.palha);
    else s += ballScene(id, cfg, rand, [{ n: 1, x: 112, y: 160, r: 40 }, { n: 2, x: 290, y: 164, r: 42 }, { n: 3, x: 200, y: 180, r: 56 }]);
    s += '<rect width="400" height="300" fill="none" stroke="rgba(255,255,255,.35)" stroke-width="6"/></svg>';
    return s;
  }
  DL.art = art;
})(typeof globalThis !== 'undefined' ? globalThis : window);
