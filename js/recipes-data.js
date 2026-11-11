/* recipes-data.js — biblioteca inicial de receitas (somente leitura no app).

   COMO ADICIONAR AS SUAS 50 RECEITAS ORIGINAIS:
   • Opção 1 (sem mexer em código): na página Receitas, clique em "Nova receita". Elas ficam salvas no
     navegador de quem cadastrou (entram no backup).
   • Opção 2 (para vender no produto): copie um bloco abaixo, mude os textos e cole no fim da lista.
     Todos os compradores passam a ver a receita. Mantenha `id` único (letras minúsculas e hífens).

   FOTOS: coloque a foto em img/receitas/<id>.jpg (use fotos suas ou com licença de uso) e escreva
   photo: 'img/receitas/<id>.jpg'. Se photo for null, o app mostra uma ilustração original.

   Os rendimentos, tempos, preços e prazos são orientações iniciais. Teste cada receita na sua cozinha,
   confira o custo na Calculadora e ajuste os prazos de validade às normas sanitárias da sua região. */
(function (global) {
  'use strict';
  const DL = (global.DL = global.DL || {});
  DL.RECIPE_SLOTS = 50;
  DL.RECIPES = [
    {
      id: 'brigadeiro-tradicional', name: 'Brigadeiro tradicional', category: 'Brigadeiros', art: 'brigadeiro', photo: 'img/receitas/brigadeiro-tradicional.jpg',
      yield: '30 unidades', time: '25 min + 30 min de descanso', suggestedPrice: 2.5,
      ingredients: ['1 lata (395 g) de leite condensado', '1 colher (sopa) de manteiga sem sal', '3 colheres (sopa) cheias de chocolate em pó 50% cacau', 'Chocolate granulado para enrolar', 'Manteiga extra para untar as mãos', 'Forminhas nº 4'],
      steps: ['Misture o leite condensado, a manteiga e o chocolate em pó numa panela de fundo grosso, ainda fria.', 'Leve ao fogo baixo mexendo sem parar com uma espátula. Em cerca de 10 a 12 minutos a massa engrossa e, ao passar a espátula no fundo, a panela fica visível por alguns segundos.', 'Despeje num prato untado e deixe amornar por cerca de 30 minutos, até soltar das mãos.', 'Com as mãos untadas, enrole bolinhas de uns 12 g, passe no granulado e coloque nas forminhas.'],
      storage: 'Em recipiente fechado, na geladeira, por até 5 dias. Retire 15 minutos antes de servir para ficar macio.',
    },
    {
      id: 'brigadeiro-gourmet', name: 'Brigadeiro gourmet de chocolate meio amargo', category: 'Brigadeiros', art: 'gourmet', photo: 'img/receitas/brigadeiro-gourmet.jpg',
      yield: '35 unidades', time: '30 min + 1 h de descanso', suggestedPrice: 4,
      ingredients: ['1 lata (395 g) de leite condensado', '1 caixinha (200 g) de creme de leite', '200 g de chocolate meio amargo picado', '1 colher (sopa) de manteiga sem sal', 'Cobertura: raspas de chocolate ou chocolate em pó para decorar'],
      steps: ['Leve o leite condensado, o creme de leite e a manteiga ao fogo baixo, mexendo até aquecer bem.', 'Desligue o fogo, junte o chocolate picado e mexa até derreter por completo e ficar liso e brilhante.', 'Volte ao fogo baixo por 2 a 3 minutos, só até o ponto de enrolar mole (a massa deve ficar levemente macia).', 'Deixe esfriar completamente, de preferência cobrindo com filme em contato com a massa, e modele bolinhas de 15 g.', 'Finalize com a cobertura escolhida e acomode em forminhas.'],
      storage: 'Na geladeira, em recipiente fechado, por até 5 dias. Por ter mais creme de leite, mantenha refrigerado até a hora da entrega.',
    },
    {
      id: 'beijinho', name: 'Beijinho de coco', category: 'Beijinhos', art: 'beijinho', photo: 'img/receitas/beijinho.jpg',
      yield: '30 unidades', time: '25 min + 30 min de descanso', suggestedPrice: 2.5,
      ingredients: ['1 lata (395 g) de leite condensado', '1 colher (sopa) de manteiga sem sal', '100 ml de leite de coco', '50 g de coco ralado fino (para a massa)', 'Coco ralado fino para enrolar', '30 cravos-da-índia', 'Açúcar cristal opcional'],
      steps: ['Numa panela, misture o leite condensado, a manteiga, o leite de coco e o coco ralado.', 'Cozinhe em fogo baixo, mexendo sempre, até desgrudar do fundo da panela (cerca de 12 minutos).', 'Despeje em prato untado e deixe amornar.', 'Enrole bolinhas, passe no coco ralado e finalize com um cravo no topo de cada uma.'],
      storage: 'Em recipiente fechado, na geladeira, por até 5 dias. Retire o cravo antes de servir para crianças pequenas.',
    },
    {
      id: 'trufa-chocolate-ao-leite', name: 'Trufa de chocolate ao leite', category: 'Trufas', art: 'trufa', photo: 'img/receitas/trufa-chocolate-ao-leite.jpg',
      yield: '30 unidades', time: '35 min + 2 h de geladeira', suggestedPrice: 4.5,
      ingredients: ['400 g de chocolate ao leite picado', '1 caixinha (200 g) de creme de leite', '1 colher (sopa) de manteiga sem sal', 'Cacau em pó (ou chocolate em pó 100%) para enrolar'],
      steps: ['Aqueça o creme de leite até começar a soltar fumaça, sem deixar ferver.', 'Despeje sobre o chocolate picado, espere 1 minuto e mexa devagar até ficar liso. Junte a manteiga.', 'Cubra com filme em contato com a ganache e leve à geladeira por cerca de 2 horas, até firmar.', 'Com uma colher pequena, retire porções e enrole rapidamente, usando as mãos frias.', 'Passe no cacau em pó e coloque em forminhas.'],
      storage: 'Na geladeira, em recipiente fechado, por até 7 dias. Sirva em temperatura ambiente para sentir melhor o sabor.',
    },
    {
      id: 'trufa-maracuja', name: 'Trufa de maracujá', category: 'Trufas', art: 'maracuja', photo: 'img/receitas/trufa-maracuja.jpg',
      yield: '28 unidades', time: '40 min + 3 h de geladeira', suggestedPrice: 5,
      ingredients: ['300 g de chocolate branco picado', '100 g de creme de leite fresco ou caixinha', '3 colheres (sopa) de polpa de maracujá reduzida (ferva a polpa até virar cerca de 2 colheres)', '1 colher (sopa) de manteiga sem sal', 'Chocolate branco derretido para banhar (opcional)', 'Raspas de limão para decorar'],
      steps: ['Reduza a polpa de maracujá em fogo baixo até ficar espessa; deixe esfriar.', 'Aqueça o creme de leite sem ferver, despeje sobre o chocolate branco e mexa até derreter.', 'Junte a manteiga e a polpa reduzida e misture bem.', 'Leve à geladeira por cerca de 3 horas, até firmar para modelar.', 'Modele as bolinhas e, se quiser, banhe no chocolate branco derretido e decore com raspas de limão.'],
      storage: 'Na geladeira, em recipiente fechado, por até 5 dias.',
    },
    {
      id: 'brownie-tradicional', name: 'Brownie de chocolate úmido', category: 'Brownies', art: 'brownie', photo: 'img/receitas/brownie-tradicional.jpg',
      yield: '16 pedaços (forma 20 × 20 cm)', time: '20 min + 30 min de forno', suggestedPrice: 6,
      ingredients: ['200 g de chocolate meio amargo picado', '150 g de manteiga sem sal', '3 ovos', '1 xícara (200 g) de açúcar', '1/2 xícara (60 g) de farinha de trigo', '3 colheres (sopa) de cacau em pó', '1 pitada de sal', '1/2 xícara de nozes picadas (opcional)'],
      steps: ['Preaqueça o forno a 180 °C e forre a forma com papel manteiga.', 'Derreta o chocolate com a manteiga em banho-maria ou no micro-ondas, em pausas curtas. Deixe amornar.', 'Misture os ovos e o açúcar apenas até incorporar (sem bater muito, para não criar ar demais).', 'Junte o chocolate derretido, depois a farinha, o cacau e o sal peneirados. Acrescente as nozes.', 'Despeje na forma e asse de 25 a 30 minutos: o centro deve ficar levemente mole.', 'Deixe esfriar completamente antes de cortar em 16 quadrados.'],
      storage: 'Embalados individualmente, em local fresco, por até 3 dias; na geladeira, por até 5 dias.',
    },
    {
      id: 'bolo-pote-chocolate', name: 'Bolo no pote de chocolate com brigadeiro', category: 'Bolos no pote', art: 'pote-choc', photo: 'img/receitas/bolo-pote-chocolate.jpg',
      yield: '8 potes de 180 ml', time: '40 min + 30 min de forno', suggestedPrice: 11,
      ingredients: ['Massa: 3 ovos, 1 xícara de açúcar, 1/2 xícara de óleo, 1 xícara de farinha de trigo, 1/2 xícara de chocolate em pó, 1/2 xícara de leite morno, 1 colher (sopa) de fermento', 'Recheio: 1 receita de brigadeiro cremoso (ponto mole)', 'Cobertura: granulado e brigadeiros pequenos', '8 potes de 180 ml com tampa'],
      steps: ['Bata os ovos, o açúcar e o óleo até ficar claro. Junte o leite morno.', 'Misture a farinha e o chocolate peneirados, mexa até ficar homogêneo e finalize com o fermento.', 'Asse em forma untada a 180 °C por cerca de 30 minutos. Deixe esfriar e esfarele grosseiramente.', 'Monte os potes em camadas: bolo, brigadeiro cremoso, bolo, brigadeiro.', 'Finalize com granulado e um brigadeiro no topo. Feche com a tampa.'],
      storage: 'Na geladeira, bem fechado, por até 4 dias. Mantenha refrigerado durante a entrega.',
    },
    {
      id: 'bolo-pote-ninho-morango', name: 'Bolo no pote de ninho com morango', category: 'Bolos no pote', art: 'pote-ninho', photo: 'img/receitas/bolo-pote-ninho-morango.jpg',
      yield: '8 potes de 180 ml', time: '45 min + 30 min de forno', suggestedPrice: 12,
      ingredients: ['Massa branca: 3 ovos, 1 xícara de açúcar, 1/2 xícara de óleo, 1 xícara de leite, 2 xícaras de farinha de trigo, 1 colher (sopa) de fermento', 'Creme: 1 lata de leite condensado, 2 colheres (sopa) de leite em pó, 1 caixinha de creme de leite, 1 colher (sopa) de manteiga', 'Recheio: 300 g de morangos picados + 2 colheres (sopa) de açúcar', 'Morangos inteiros para decorar'],
      steps: ['Bata os ovos, o açúcar e o óleo; alterne o leite e a farinha e termine com o fermento. Asse a 180 °C por cerca de 30 minutos e deixe esfriar.', 'Para o creme, cozinhe o leite condensado, o leite em pó e a manteiga em fogo baixo até engrossar; fora do fogo, misture o creme de leite. Deixe esfriar.', 'Cozinhe os morangos com o açúcar por 8 minutos até formar uma geleia leve; esfrie.', 'Monte os potes: massa esfarelada, creme, morangos, repetindo as camadas.', 'Decore com um morango e feche com a tampa.'],
      storage: 'Na geladeira, bem fechado, por até 3 dias, pois leva fruta fresca. Prefira entrega no mesmo dia.',
    },
    {
      id: 'palha-italiana', name: 'Palha italiana', category: 'Docinhos finos', art: 'palha', photo: 'img/receitas/palha-italiana.jpg',
      yield: '25 quadradinhos', time: '20 min + 2 h de geladeira', suggestedPrice: 3,
      ingredients: ['1 lata (395 g) de leite condensado', '1 colher (sopa) de manteiga sem sal', '3 colheres (sopa) de chocolate em pó', '1 pacote (200 g) de biscoito maisena triturado', 'Açúcar de confeiteiro ou cristal para polvilhar'],
      steps: ['Cozinhe o leite condensado, a manteiga e o chocolate em pó em fogo baixo até o ponto de brigadeiro mole.', 'Fora do fogo, misture o biscoito triturado até formar uma massa que solta da panela.', 'Pressione numa forma pequena forrada com papel manteiga e alise.', 'Leve à geladeira por 2 horas, corte em quadrados e passe no açúcar.'],
      storage: 'Em recipiente fechado, em local fresco por até 2 dias ou na geladeira por até 5 dias.',
    },
    {
      id: 'cajuzinho', name: 'Cajuzinho', category: 'Docinhos finos', art: 'cajuzinho', photo: 'img/receitas/cajuzinho.jpg',
      yield: '30 unidades', time: '30 min + 30 min de descanso', suggestedPrice: 2.5,
      ingredients: ['1 lata (395 g) de leite condensado', '300 g de amendoim torrado, sem pele e moído fino', '3 colheres (sopa) de chocolate em pó', '1 colher (sopa) de manteiga sem sal', 'Açúcar cristal para enrolar', 'Pedaços de amendoim para decorar'],
      steps: ['Cozinhe o leite condensado, a manteiga e o chocolate em pó em fogo baixo até começar a engrossar.', 'Junte o amendoim moído e mexa até a massa desgrudar do fundo da panela.', 'Deixe amornar e, com as mãos untadas, modele no formato de castanha.', 'Passe no açúcar cristal e finalize com um pedacinho de amendoim.'],
      storage: 'Em recipiente fechado, na geladeira, por até 5 dias. Atenção: contém amendoim; avise seus clientes sobre alergênicos.',
    },
    {
      id: 'olho-de-sogra', name: 'Olho de sogra', category: 'Docinhos finos', art: 'olho', photo: 'img/receitas/olho-de-sogra.jpg',
      yield: '30 unidades', time: '35 min + 30 min de descanso', suggestedPrice: 3.5,
      ingredients: ['30 ameixas secas sem caroço', '1 receita de beijinho (massa pronta, ponto de enrolar)', 'Açúcar cristal para passar', 'Forminhas nº 4'],
      steps: ['Prepare a massa de beijinho e deixe amornar até o ponto de modelar.', 'Abra cada ameixa ao meio, sem separar totalmente, e recheie com um rolinho de beijinho deixando a massa aparecer.', 'Passe no açúcar cristal e coloque nas forminhas.'],
      storage: 'Na geladeira, em recipiente fechado, por até 5 dias.',
    },
    {
      id: 'ninho-brigadeiro-branco', name: 'Brigadeiro branco de leite em pó', category: 'Brigadeiros', art: 'ninho', photo: 'img/receitas/ninho-brigadeiro-branco.jpg',
      yield: '30 unidades', time: '25 min + 30 min de descanso', suggestedPrice: 2.8,
      ingredients: ['1 lata (395 g) de leite condensado', '1 colher (sopa) de manteiga sem sal', '3 colheres (sopa) de leite em pó integral', 'Leite em pó ou açúcar cristal para enrolar', 'Forminhas nº 4'],
      steps: ['Em panela de fundo grosso, misture o leite condensado, a manteiga e o leite em pó.', 'Cozinhe em fogo baixo, mexendo sempre, até ver o fundo da panela (cerca de 10 minutos).', 'Despeje em prato untado e deixe esfriar até o ponto de enrolar.', 'Enrole bolinhas, passe no leite em pó e coloque nas forminhas.'],
      storage: 'Em recipiente fechado, na geladeira, por até 5 dias.',
    },
  ];
})(typeof globalThis !== 'undefined' ? globalThis : window);
