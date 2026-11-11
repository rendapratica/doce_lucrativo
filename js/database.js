/* database.js — IndexedDB, validações, operações de negócio (estoque consistente),
   backup/restauração e modo demonstração.
   Depende de calc.js. Todos os dados principais ficam no IndexedDB (não no localStorage). */
(function (global) {
  'use strict';
  const DL = (global.DL = global.DL || {});
  const { num, dates } = DL;

  /* ---------- Constantes ---------- */
  DL.CATEGORIES = ['Brigadeiros', 'Beijinhos', 'Trufas', 'Brownies', 'Bolos no pote', 'Docinhos finos', 'Tortas e bolos', 'Outros'];
  DL.PAYMENTS = ['Pix', 'Dinheiro', 'Cartão de débito', 'Cartão de crédito', 'Transferência', 'Outro'];
  DL.EXPENSE_CATEGORIES = ['Chocolate', 'Leite condensado', 'Creme de leite', 'Embalagens', 'Granulados', 'Energia', 'Gás', 'Transporte', 'Outras despesas'];
  const STORES = ['products', 'productions', 'sales', 'expenses', 'settings', 'recipes'];
  const DB_VERSION = 1;
  const MAX_PHOTO = 2 * 1024 * 1024; // caracteres do data URL

  /* ---------- Erros ---------- */
  class DLError extends Error { constructor(msg) { super(msg); this.name = 'DLError'; } }
  class ValidationError extends Error {
    constructor(errors) { super('Dados inválidos'); this.name = 'ValidationError'; this.errors = errors; }
  }
  DL.DLError = DLError; DL.ValidationError = ValidationError;

  /* ---------- Modo (real × demonstração): bancos separados ---------- */
  let memMode = 'real';
  DL.mode = {
    get() { try { return localStorage.getItem('dl_mode') === 'demo' ? 'demo' : 'real'; } catch (e) { return memMode; } },
    set(m) { memMode = m === 'demo' ? 'demo' : 'real'; try { localStorage.setItem('dl_mode', memMode); } catch (e) { /* ignorar */ } },
    isDemo() { return DL.mode.get() === 'demo'; },
  };

  /* ---------- Conexão ---------- */
  let dbPromise = null, dbName = null;
  function open() {
    const name = DL.mode.isDemo() ? 'doce-lucrativo-demo' : 'doce-lucrativo';
    if (dbPromise && dbName === name) return dbPromise;
    dbName = name;
    dbPromise = new Promise((resolve, reject) => {
      if (!global.indexedDB) { reject(new DLError('Seu navegador não suporta armazenamento local (IndexedDB). Use um navegador atualizado e fora do modo anônimo.')); return; }
      const req = global.indexedDB.open(name, DB_VERSION);
      req.onupgradeneeded = () => {
        const db = req.result;
        if (!db.objectStoreNames.contains('products')) db.createObjectStore('products', { keyPath: 'id', autoIncrement: true });
        ['productions', 'sales', 'expenses'].forEach((s) => {
          if (!db.objectStoreNames.contains(s)) db.createObjectStore(s, { keyPath: 'id', autoIncrement: true }).createIndex('date', 'date');
        });
        if (!db.objectStoreNames.contains('settings')) db.createObjectStore('settings', { keyPath: 'key' });
        if (!db.objectStoreNames.contains('recipes')) db.createObjectStore('recipes', { keyPath: 'id', autoIncrement: true });
      };
      req.onsuccess = () => {
        const db = req.result;
        db.onversionchange = () => { db.close(); dbPromise = null; };
        resolve(db);
      };
      req.onerror = () => reject(req.error || new DLError('Falha ao abrir o banco de dados.'));
      req.onblocked = () => reject(new DLError('Feche as outras abas do sistema e tente novamente.'));
    });
    dbPromise.catch(() => { dbPromise = null; });
    return dbPromise;
  }

  const p = (r) => new Promise((res, rej) => { r.onsuccess = () => res(r.result); r.onerror = () => rej(r.error); });

  // Executa `work` dentro de UMA transação; qualquer erro desfaz tudo (atomicidade do estoque).
  function run(storeNames, mode, work) {
    return open().then((db) => new Promise((resolve, reject) => {
      let tx;
      try { tx = db.transaction(storeNames, mode); } catch (e) { reject(e); return; }
      let result, failure = null;
      tx.oncomplete = () => resolve(result);
      tx.onabort = () => reject(failure || tx.error || new DLError('Operação cancelada.'));
      tx.onerror = () => { if (!failure) failure = tx.error; };
      const st = {};
      storeNames.forEach((n) => { st[n] = tx.objectStore(n); });
      Promise.resolve().then(() => work(st)).then((r) => { result = r; })
        .catch((err) => { failure = err; try { tx.abort(); } catch (_) { /* já finalizada */ } });
    }));
  }

  DL.db = {
    open, run, p,
    getAll: (s) => run([s], 'readonly', (st) => p(st[s].getAll())),
    get: (s, k) => run([s], 'readonly', (st) => p(st[s].get(k))),
    put: (s, o) => run([s], 'readwrite', (st) => p(st[s].put(o))),
    delete: (s, k) => run([s], 'readwrite', (st) => p(st[s].delete(k))),
    clear: (s) => run([s], 'readwrite', (st) => p(st[s].clear())),
    count: (s) => run([s], 'readonly', (st) => p(st[s].count())),
    async getSetting(key, def) { const r = await DL.db.get('settings', key); return r ? r.value : def; },
    setSetting(key, value) { return DL.db.put('settings', { key, value }); },
    async loadAll() {
      const [products, productions, sales, expenses] = await Promise.all(['products', 'productions', 'sales', 'expenses'].map((s) => DL.db.getAll(s)));
      return { products, productions, sales, expenses };
    },
    close() { if (dbPromise) { dbPromise.then((d) => d.close()).catch(() => {}); dbPromise = null; } },
  };

  /* ---------- Validação ---------- */
  const str = (v) => String(v == null ? '' : v).trim();
  const isPhoto = (v) => typeof v === 'string' && /^data:image\/(jpeg|png|webp|gif);base64,/.test(v) && v.length <= MAX_PHOTO;

  function result(errors, value) { return { ok: Object.keys(errors).length === 0, errors, value }; }

  const validate = {
    product(i) {
      const e = {}, name = str(i.name), desc = str(i.description);
      const price = num.parseMoney(i.price), cost = num.parseMoney(i.cost), stock = num.parseIntStrict(i.stock === '' || i.stock == null ? 0 : i.stock);
      if (name.length < 2 || name.length > 80) e.name = 'Informe o nome do produto (2 a 80 letras).';
      if (DL.CATEGORIES.indexOf(str(i.category)) === -1) e.category = 'Escolha uma categoria.';
      if (desc.length > 300) e.description = 'A descrição pode ter no máximo 300 caracteres.';
      if (!(price > 0)) e.price = 'Informe o preço de venda (maior que zero).';
      else if (price > 100000) e.price = 'Valor muito alto. Confira o preço.';
      if (!(cost >= 0)) e.cost = 'Informe o custo de produção (pode ser 0).';
      else if (cost > 100000) e.cost = 'Valor muito alto. Confira o custo.';
      if (Number.isNaN(stock)) e.stock = 'Use um número inteiro, 0 ou mais.';
      else if (stock > 1000000) e.stock = 'Quantidade muito alta.';
      if (i.photo && !isPhoto(i.photo)) e.photo = 'Foto inválida. Use JPG, PNG ou WEBP.';
      return result(e, { name, category: str(i.category), description: desc, price: num.round2(price), cost: num.round2(cost), stock, photo: i.photo || '' });
    },
    production(i) {
      const e = {}, qty = num.parseIntStrict(i.qty), cost = num.parseMoney(i.totalCost === '' || i.totalCost == null ? 0 : i.totalCost);
      const productId = Number(i.productId);
      if (!Number.isInteger(productId) || productId <= 0) e.productId = 'Escolha o produto.';
      if (!(qty >= 1)) e.qty = 'Informe a quantidade (número inteiro, mínimo 1).';
      else if (qty > 1000000) e.qty = 'Quantidade muito alta.';
      if (!dates.isValid(i.date)) e.date = 'Informe uma data válida.';
      else if (i.date > dates.today()) e.date = 'A data de fabricação não pode ser futura.';
      if (!(cost >= 0)) e.totalCost = 'Informe o custo total (pode ser 0).';
      return result(e, { productId, qty, date: i.date, totalCost: num.round2(cost), updateCost: !!i.updateCost });
    },
    sale(i) {
      const e = {}, qty = num.parseIntStrict(i.qty), unitPrice = num.parseMoney(i.unitPrice), productId = Number(i.productId);
      if (!Number.isInteger(productId) || productId <= 0) e.productId = 'Escolha o produto vendido.';
      if (!(qty >= 1)) e.qty = 'Informe a quantidade (número inteiro, mínimo 1).';
      else if (qty > 1000000) e.qty = 'Quantidade muito alta.';
      if (!(unitPrice > 0)) e.unitPrice = 'Informe o valor unitário (maior que zero).';
      if (!dates.isValid(i.date)) e.date = 'Informe uma data válida.';
      else if (i.date > dates.today()) e.date = 'A data da venda não pode ser futura.';
      if (DL.PAYMENTS.indexOf(str(i.payment)) === -1) e.payment = 'Escolha a forma de pagamento.';
      const notes = str(i.notes);
      if (notes.length > 200) e.notes = 'As observações podem ter no máximo 200 caracteres.';
      return result(e, { productId, qty, unitPrice: num.round2(unitPrice), date: i.date, payment: str(i.payment), notes });
    },
    expense(i) {
      const e = {}, desc = str(i.description), amount = num.parseMoney(i.amount);
      if (desc.length < 2 || desc.length > 100) e.description = 'Descreva a despesa (2 a 100 letras).';
      if (DL.EXPENSE_CATEGORIES.indexOf(str(i.category)) === -1) e.category = 'Escolha uma categoria.';
      if (!(amount > 0)) e.amount = 'Informe o valor (maior que zero).';
      else if (amount > 10000000) e.amount = 'Valor muito alto. Confira.';
      if (!dates.isValid(i.date)) e.date = 'Informe uma data válida.';
      else if (i.date > dates.today()) e.date = 'A data não pode ser futura.';
      return result(e, { description: desc, category: str(i.category), amount: num.round2(amount), date: i.date });
    },
    recipe(i) {
      const e = {}, name = str(i.name);
      const lines = (t) => String(t || '').split('\n').map((x) => x.trim()).filter(Boolean);
      const ingredients = Array.isArray(i.ingredients) ? i.ingredients.map(str).filter(Boolean) : lines(i.ingredients);
      const steps = Array.isArray(i.steps) ? i.steps.map(str).filter(Boolean) : lines(i.steps);
      const price = i.suggestedPrice === '' || i.suggestedPrice == null ? 0 : num.parseMoney(i.suggestedPrice);
      if (name.length < 2 || name.length > 80) e.name = 'Informe o nome da receita (2 a 80 letras).';
      if (DL.CATEGORIES.indexOf(str(i.category)) === -1) e.category = 'Escolha uma categoria.';
      if (!ingredients.length) e.ingredients = 'Liste os ingredientes, um por linha.';
      if (!steps.length) e.steps = 'Descreva o modo de preparo, um passo por linha.';
      if (!str(i.yield)) e.yield = 'Informe o rendimento (ex.: 30 unidades).';
      if (!str(i.time)) e.time = 'Informe o tempo de preparo (ex.: 40 min).';
      if (Number.isNaN(price) || price < 0) e.suggestedPrice = 'Valor inválido.';
      if (i.photo && !isPhoto(i.photo)) e.photo = 'Foto inválida. Use JPG, PNG ou WEBP.';
      return result(e, {
        name, category: str(i.category), ingredients, steps, yield: str(i.yield).slice(0, 60), time: str(i.time).slice(0, 60),
        storage: str(i.storage).slice(0, 400), suggestedPrice: num.round2(price || 0), photo: i.photo || '',
      });
    },
  };
  DL.validate = validate;

  const fail = (v) => { if (!v.ok) throw new ValidationError(v.errors); return v.value; };

  /* ---------- Estoque: ajusta vários produtos de uma vez, sem permitir saldo negativo ---------- */
  async function adjustStock(st, deltas, required) {
    for (const [id, delta] of deltas) {
      if (!delta) continue;
      const prod = await p(st.products.get(id));
      if (!prod) {
        if (required && required.has(id)) throw new DLError('Produto não encontrado. Ele pode ter sido excluído.');
        continue; // produto excluído: histórico permanece, nada a ajustar
      }
      const next = prod.stock + delta;
      if (next < 0) throw new DLError('O estoque de "' + prod.name + '" ficaria negativo. Disponível agora: ' + prod.stock + '.');
      prod.stock = next; prod.updatedAt = Date.now();
      await p(st.products.put(prod));
    }
  }
  const addDelta = (m, id, d) => m.set(id, (m.get(id) || 0) + d);

  /* ---------- Operações de negócio ---------- */
  const ops = (DL.ops = {});

  // Produtos
  ops.saveProduct = async function (input, id) {
    const v = fail(validate.product(input));
    return run(['products'], 'readwrite', async (st) => {
      let rec;
      if (id) {
        const old = await p(st.products.get(Number(id)));
        if (!old) throw new DLError('Produto não encontrado.');
        rec = Object.assign({}, old, v, { id: old.id, updatedAt: Date.now() });
      } else {
        rec = Object.assign({}, v, { createdAt: Date.now(), updatedAt: Date.now() });
      }
      rec.id = await p(st.products.put(rec));
      return rec;
    });
  };
  ops.deleteProduct = (id) => DL.db.delete('products', Number(id));

  // Produção: soma ao estoque
  ops.registerProduction = async function (input) {
    const v = fail(validate.production(input));
    return run(['products', 'productions'], 'readwrite', async (st) => {
      const prod = await p(st.products.get(v.productId));
      if (!prod) throw new DLError('Produto não encontrado.');
      prod.stock += v.qty; prod.updatedAt = Date.now();
      let costUpdated = false;
      if (v.updateCost && v.totalCost > 0) { prod.cost = num.round2(v.totalCost / v.qty); costUpdated = true; }
      await p(st.products.put(prod));
      const rec = { productId: v.productId, productName: prod.name, qty: v.qty, date: v.date, totalCost: v.totalCost, costUpdated, createdAt: Date.now() };
      rec.id = await p(st.productions.add(rec));
      return rec;
    });
  };
  ops.updateProduction = async function (id, input) {
    const v = fail(validate.production(input));
    return run(['products', 'productions'], 'readwrite', async (st) => {
      const old = await p(st.productions.get(Number(id)));
      if (!old) throw new DLError('Registro de produção não encontrado.');
      const deltas = new Map();
      addDelta(deltas, old.productId, -old.qty); addDelta(deltas, v.productId, v.qty);
      await adjustStock(st, deltas, new Set([v.productId]));
      const prod = await p(st.products.get(v.productId));
      const rec = Object.assign({}, old, { productId: v.productId, productName: prod.name, qty: v.qty, date: v.date, totalCost: v.totalCost });
      await p(st.productions.put(rec));
      return rec;
    });
  };
  ops.deleteProduction = async function (id) {
    return run(['products', 'productions'], 'readwrite', async (st) => {
      const old = await p(st.productions.get(Number(id)));
      if (!old) throw new DLError('Registro de produção não encontrado.');
      await adjustStock(st, new Map([[old.productId, -old.qty]]));
      await p(st.productions.delete(old.id));
    });
  };

  // Vendas: baixam o estoque
  function buildSale(v, prod, keepCost) {
    const total = num.round2(v.qty * v.unitPrice);
    const unitCost = keepCost != null ? keepCost : prod.cost;
    return { productId: v.productId, productName: prod.name, qty: v.qty, unitPrice: v.unitPrice, total, unitCost, profit: num.round2(total - v.qty * unitCost), date: v.date, payment: v.payment, notes: v.notes };
  }
  ops.registerSale = async function (input) {
    const v = fail(validate.sale(input));
    return run(['products', 'sales'], 'readwrite', async (st) => {
      const prod = await p(st.products.get(v.productId));
      if (!prod) throw new DLError('Produto não encontrado.');
      if (v.qty > prod.stock) throw new DLError('Estoque insuficiente de "' + prod.name + '": disponível ' + prod.stock + ', pedido ' + v.qty + '.');
      prod.stock -= v.qty; prod.updatedAt = Date.now();
      await p(st.products.put(prod));
      const rec = Object.assign(buildSale(v, prod), { createdAt: Date.now() });
      rec.id = await p(st.sales.add(rec));
      return rec;
    });
  };
  ops.updateSale = async function (id, input) {
    const v = fail(validate.sale(input));
    return run(['products', 'sales'], 'readwrite', async (st) => {
      const old = await p(st.sales.get(Number(id)));
      if (!old) throw new DLError('Venda não encontrada.');
      const deltas = new Map();
      addDelta(deltas, old.productId, old.qty); addDelta(deltas, v.productId, -v.qty);
      try { await adjustStock(st, deltas, new Set([v.productId])); } catch (err) {
        if (err.name === 'DLError' && /negativo/.test(err.message)) throw new DLError('Estoque insuficiente para essa quantidade. ' + err.message.replace(/^.*Disponível agora/, 'Disponível agora'));
        throw err;
      }
      const prod = await p(st.products.get(v.productId));
      const rec = Object.assign({}, old, buildSale(v, prod, v.productId === old.productId ? old.unitCost : null));
      await p(st.sales.put(rec));
      return rec;
    });
  };
  ops.deleteSale = async function (id) {
    return run(['products', 'sales'], 'readwrite', async (st) => {
      const old = await p(st.sales.get(Number(id)));
      if (!old) throw new DLError('Venda não encontrada.');
      await adjustStock(st, new Map([[old.productId, old.qty]])); // devolve ao estoque
      await p(st.sales.delete(old.id));
    });
  };

  // Despesas
  ops.saveExpense = async function (input, id) {
    const v = fail(validate.expense(input));
    return run(['expenses'], 'readwrite', async (st) => {
      let rec;
      if (id) {
        const old = await p(st.expenses.get(Number(id)));
        if (!old) throw new DLError('Despesa não encontrada.');
        rec = Object.assign({}, old, v);
      } else rec = Object.assign({}, v, { createdAt: Date.now() });
      rec.id = await p(st.expenses.put(rec));
      return rec;
    });
  };
  ops.deleteExpense = (id) => DL.db.delete('expenses', Number(id));

  // Receitas cadastradas pelo usuário
  ops.saveRecipe = async function (input, id) {
    const v = fail(validate.recipe(input));
    return run(['recipes'], 'readwrite', async (st) => {
      let rec;
      if (id) {
        const old = await p(st.recipes.get(Number(id)));
        if (!old) throw new DLError('Receita não encontrada.');
        rec = Object.assign({}, old, v);
      } else rec = Object.assign({}, v, { createdAt: Date.now() });
      rec.id = await p(st.recipes.put(rec));
      return rec;
    });
  };
  ops.deleteRecipe = (id) => DL.db.delete('recipes', Number(id));

  /* ---------- Backup e restauração ---------- */
  const backup = (DL.backup = {});
  backup.build = async function () {
    const data = {};
    for (const s of STORES) data[s] = await DL.db.getAll(s);
    return { app: 'doce-lucrativo', version: 1, exportedAt: new Date().toISOString(), mode: DL.mode.get(), data };
  };

  const isObj = (x) => x && typeof x === 'object' && !Array.isArray(x);
  const okId = (x) => Number.isInteger(x) && x > 0;
  const finite = (x) => typeof x === 'number' && Number.isFinite(x);
  const sanitizers = {
    products(r) {
      if (!isObj(r) || !okId(r.id) || typeof r.name !== 'string' || !finite(r.price) || !finite(r.cost) || !Number.isInteger(r.stock) || r.stock < 0) return null;
      return { id: r.id, name: r.name.slice(0, 80), category: DL.CATEGORIES.indexOf(r.category) >= 0 ? r.category : 'Outros', description: String(r.description || '').slice(0, 300), price: r.price, cost: r.cost, stock: r.stock, photo: isPhoto(r.photo) ? r.photo : '', createdAt: finite(r.createdAt) ? r.createdAt : Date.now(), updatedAt: finite(r.updatedAt) ? r.updatedAt : Date.now() };
    },
    productions(r) {
      if (!isObj(r) || !okId(r.id) || !okId(r.productId) || !Number.isInteger(r.qty) || r.qty < 1 || !dates.isValid(r.date) || !finite(r.totalCost)) return null;
      return { id: r.id, productId: r.productId, productName: String(r.productName || '').slice(0, 80), qty: r.qty, date: r.date, totalCost: r.totalCost, costUpdated: !!r.costUpdated, createdAt: finite(r.createdAt) ? r.createdAt : Date.now() };
    },
    sales(r) {
      if (!isObj(r) || !okId(r.id) || !okId(r.productId) || !Number.isInteger(r.qty) || r.qty < 1 || !dates.isValid(r.date) || !finite(r.unitPrice) || !finite(r.total) || !finite(r.unitCost) || !finite(r.profit)) return null;
      return { id: r.id, productId: r.productId, productName: String(r.productName || '').slice(0, 80), qty: r.qty, unitPrice: r.unitPrice, total: r.total, unitCost: r.unitCost, profit: r.profit, date: r.date, payment: DL.PAYMENTS.indexOf(r.payment) >= 0 ? r.payment : 'Outro', notes: String(r.notes || '').slice(0, 200), createdAt: finite(r.createdAt) ? r.createdAt : Date.now() };
    },
    expenses(r) {
      if (!isObj(r) || !okId(r.id) || typeof r.description !== 'string' || !finite(r.amount) || r.amount <= 0 || !dates.isValid(r.date)) return null;
      return { id: r.id, description: r.description.slice(0, 100), category: DL.EXPENSE_CATEGORIES.indexOf(r.category) >= 0 ? r.category : 'Outras despesas', amount: r.amount, date: r.date, createdAt: finite(r.createdAt) ? r.createdAt : Date.now() };
    },
    settings(r) {
      if (!isObj(r) || typeof r.key !== 'string' || !r.key || r.key.length > 60) return null;
      const t = typeof r.value;
      if (!(r.value === null || t === 'string' || t === 'number' || t === 'boolean')) return null;
      return { key: r.key, value: r.value };
    },
    recipes(r) {
      if (!isObj(r) || !okId(r.id) || typeof r.name !== 'string') return null;
      const arr = (a) => (Array.isArray(a) ? a.map((x) => String(x).slice(0, 300)).slice(0, 80) : []);
      return { id: r.id, name: r.name.slice(0, 80), category: DL.CATEGORIES.indexOf(r.category) >= 0 ? r.category : 'Outros', ingredients: arr(r.ingredients), steps: arr(r.steps), yield: String(r.yield || '').slice(0, 60), time: String(r.time || '').slice(0, 60), storage: String(r.storage || '').slice(0, 400), suggestedPrice: finite(r.suggestedPrice) ? r.suggestedPrice : 0, photo: isPhoto(r.photo) ? r.photo : '', createdAt: finite(r.createdAt) ? r.createdAt : Date.now() };
    },
  };

  // Lê e valida o texto de um arquivo de backup. Lança DLError com mensagem clara se estiver inválido.
  backup.parse = function (text) {
    let obj;
    try { obj = JSON.parse(text); } catch (e) { throw new DLError('Esse arquivo não é um backup válido (JSON ilegível).'); }
    if (!isObj(obj) || obj.app !== 'doce-lucrativo' || !isObj(obj.data)) throw new DLError('Esse arquivo não parece ser um backup do Doce Lucrativo.');
    if (obj.version !== 1) throw new DLError('Versão de backup não suportada.');
    const clean = {};
    for (const s of STORES) {
      const list = obj.data[s];
      if (list === undefined && (s === 'recipes' || s === 'settings')) { clean[s] = []; continue; }
      if (!Array.isArray(list)) throw new DLError('Backup incompleto: faltam dados de "' + s + '".');
      clean[s] = [];
      for (let i = 0; i < list.length; i++) {
        const r = sanitizers[s](list[i]);
        if (!r) throw new DLError('Backup corrompido: registro ' + (i + 1) + ' de "' + s + '" é inválido. Nada foi alterado.');
        clean[s].push(r);
      }
    }
    return { exportedAt: obj.exportedAt, mode: obj.mode, data: clean };
  };
  backup.counts = (parsed) => ({ products: parsed.data.products.length, productions: parsed.data.productions.length, sales: parsed.data.sales.length, expenses: parsed.data.expenses.length, recipes: parsed.data.recipes.length });

  // Substitui TODOS os dados atuais pelos do backup, de forma atômica.
  backup.restore = async function (parsed) {
    await run(STORES, 'readwrite', async (st) => {
      for (const s of STORES) {
        await p(st[s].clear());
        for (const r of parsed.data[s]) await p(st[s].put(r));
      }
    });
  };
  backup.wipe = () => run(STORES, 'readwrite', async (st) => { for (const s of STORES) await p(st[s].clear()); });

  /* ---------- Modo demonstração (banco separado; nunca mistura com os dados reais) ---------- */
  DL.demo = {
    async seed() {
      let a = 20261110;
      const rnd = () => { a |= 0; a = (a + 0x6d2b79f5) | 0; let t = Math.imul(a ^ (a >>> 15), 1 | a); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
      const ri = (lo, hi) => lo + Math.floor(rnd() * (hi - lo + 1));
      const prods = [
        ['Brigadeiro tradicional', 'Brigadeiros', 'Clássico de chocolate com granulado.', 2.5, 0.85],
        ['Brigadeiro gourmet', 'Brigadeiros', 'Chocolate meio amargo cremoso.', 4.0, 1.5],
        ['Beijinho', 'Beijinhos', 'Coco e leite condensado, com cravo.', 2.5, 0.8],
        ['Trufa de chocolate', 'Trufas', 'Ganache de chocolate ao leite.', 4.5, 1.7],
        ['Brownie', 'Brownies', 'Úmido por dentro, casquinha crocante.', 6.0, 2.2],
        ['Bolo no pote de brigadeiro', 'Bolos no pote', 'Massa fofinha e recheio cremoso.', 11.0, 4.3],
      ].map((x, i) => ({ id: i + 1, name: x[0], category: x[1], description: x[2], price: x[3], cost: x[4], stock: 0, photo: '', createdAt: Date.now(), updatedAt: Date.now() }));
      const productions = [], sales = [], expenses = [];
      const today = dates.today();
      for (let off = 75; off >= 0; off--) {
        const day = dates.addDays(today, -off);
        const dow = dates.parse(day).getDay();
        if (dow === 1 || off % 6 === 0) { // produz alguns dias da semana
          const prod = prods[ri(0, prods.length - 1)], qty = ri(3, 8) * 10;
          prod.stock += qty;
          productions.push({ id: productions.length + 1, productId: prod.id, productName: prod.name, qty, date: day, totalCost: num.round2(qty * prod.cost), costUpdated: false, createdAt: Date.now() });
        }
        if (dow !== 0 || rnd() > 0.5) {
          const n = ri(1, 4) + (dow === 5 || dow === 6 ? 2 : 0);
          for (let k = 0; k < n; k++) {
            const avail = prods.filter((x) => x.stock > 0);
            if (!avail.length) break;
            const prod = avail[ri(0, avail.length - 1)], qty = Math.min(prod.stock, ri(2, 18));
            prod.stock -= qty;
            const total = num.round2(qty * prod.price);
            sales.push({ id: sales.length + 1, productId: prod.id, productName: prod.name, qty, unitPrice: prod.price, total, unitCost: prod.cost, profit: num.round2(total - qty * prod.cost), date: day, payment: DL.PAYMENTS[ri(0, 3)], notes: '', createdAt: Date.now() });
          }
        }
        if (dow === 2 && off % 7 < 7) {
          const cats = ['Chocolate', 'Leite condensado', 'Creme de leite', 'Embalagens', 'Granulados'];
          const c = cats[ri(0, cats.length - 1)];
          expenses.push({ id: expenses.length + 1, description: 'Compra de ' + c.toLowerCase(), category: c, amount: num.round2(ri(4000, 16000) / 100), date: day, createdAt: Date.now() });
        }
        if (dates.parse(day).getDate() === 5) {
          expenses.push({ id: expenses.length + 1, description: 'Conta de energia', category: 'Energia', amount: num.round2(ri(9000, 16000) / 100), date: day, createdAt: Date.now() });
          expenses.push({ id: expenses.length + 1, description: 'Botijão de gás', category: 'Gás', amount: 120, date: day, createdAt: Date.now() });
        }
      }
      // Reposição final: a demonstração termina com estoque saudável em todos os produtos
      prods.forEach((prod) => {
        if (prod.stock < 25) {
          const qty = ri(3, 6) * 10;
          prod.stock += qty;
          productions.push({ id: productions.length + 1, productId: prod.id, productName: prod.name, qty, date: today, totalCost: num.round2(qty * prod.cost), costUpdated: false, createdAt: Date.now() });
        }
      });
      await run(STORES, 'readwrite', async (st) => {
        for (const s of STORES) await p(st[s].clear());
        for (const r of prods) await p(st.products.put(r));
        for (const r of productions) await p(st.productions.put(r));
        for (const r of sales) await p(st.sales.put(r));
        for (const r of expenses) await p(st.expenses.put(r));
        await p(st.settings.put({ key: 'seeded', value: true }));
      });
    },
    async ensure() { if (DL.mode.isDemo() && !(await DL.db.getSetting('seeded', false))) await DL.demo.seed(); },
  };
})(typeof globalThis !== 'undefined' ? globalThis : window);
