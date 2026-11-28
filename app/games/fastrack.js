/* Fastrack (Blue Orange): a game of speed for two. Both players at once shoot their wooden disks with the elastic cord
   through the slot in the middle wall to the other side; the first to have all 10 disks over there wins the round,
   two rounds of three win the game.
   The family's box is the Russian edition (sold as «Fastrack (Чапаев)»); its Russian rules sheet is not online, so the
   rules are summarised in our own words from Blue Orange's English rules (2 pages: 1 — the box and contents, 2 — the
   rules). The words are ours: «сторона» (the book's camp — the whole half of the track), «клетчатые полосы» (the
   checkerboard pattern along the long sides of each half), «щель», «резинка», «перегородка». Our top-down diagrams are
   drawn by scripts/assets/fastrack-compose.mjs; the cover is the publisher's photo of the box.
   A game of rounds where a round has one winner and nothing to count: a tap on the winner gives a point; 2 points end
   the game (the best of three). Every rule the app enforces is listed in docs/rules-check.md with its source and its test. */
(function () {
  "use strict";
  const BH = window.BH;

  // our own pictures: [width, height, what is drawn]
  const plates = {
    "board": [768, 512, "Поле сверху: по 5 дисков на клетчатых полосах каждой стороны, посередине перегородка со щелью."],
    "shoot": [768, 512, "Резинку оттягивают одним пальцем и стреляют диском через щель на сторону соперника."],
    "slot": [768, 512, "Диск застрял в щели: толкать его пальцем нельзя, выбить его можно только другим диском."],
    "over": [768, 512, "Диск перелетел через перегородку — считается. Диск вылетел за поле — он вне игры до конца раунда."],
    "round": [768, 512, "Все 10 дисков на стороне соперника — раунд выигран. Кто выиграл 2 раунда из 3, побеждает."],
  };
  const picture = (key, fit = false) => {
    const [width, height, caption] = plates[key];
    return `<img class="a-wide flip7-plate fastrack-plate" style="display:block;width:100%;height:${fit ? "100%" : "auto"};min-height:0;object-fit:contain" src="games/fastrack-art/${key}.webp" alt="${caption}" width="${width}" height="${height}" decoding="async">`;
  };

  BH.registerGame({
    id: "fastrack",
    name: "Fastrack",
    publisher: "Blue Orange",
    tagline: "Стреляйте дисками через щель на сторону соперника — резинкой и одним пальцем. Кто первым избавится от всех дисков, выигрывает раунд.",
    time: "10 мин",
    age: "5+",
    players: { min: 2, max: 2 },
    cover: '<img style="display:block;width:100%;height:100%;object-fit:cover" src="games/covers/fastrack.webp" alt="" width="512" height="512">',
    expansions: [],
    source: "Правила Blue Orange (английские, 2 страницы; русского листа из коробки у нас нет)",
    searchExample: "что делать, если диск застрял в щели?",
    searchWords: ["диск", "щель", "резинка", "раунд"],

    setup: [
      { id: "board", title: "Поле и диски", art: picture("board", true),
        text: "Положите *поле* между собой: у каждого своя *сторона* с резинкой у торца.\nКаждый ставит по *5* дисков на *клетчатые полосы* своей стороны." },
      { id: "rules", title: "Как стрелять", art: picture("shoot", true),
        text: "Диски можно отправлять только *резинкой*, оттягивая её *одним пальцем*.\nИграют *одновременно*, ходов нет.\nПобеждает тот, кто выиграет *2 раунда из 3*." },
    ],

    // two players at once: nobody starts
    rounds: {
      art: picture("round"),
      leader: false,
      title: "Как идёт раунд",
      word: { none: "Раундов пока нет — сыграйте первый и отметьте победителя кнопкой внизу.", undo: "Победа в этом раунде удалится.",
        boldLegend: "1 — победа в раунде", rec: "Итог раунда", pts: "побед", byScore: "по выигранным раундам", wonIn: "в раундах" },
      // the round by topic, at most 4 lines a stage (docs/ui.md «Ход или раунд — по этапам»)
      stages: [
        { title: "Стрельба", steps: [
          "Стреляй *одновременно* с соперником, ходов нет: отправляй диски со своей стороны.",
          "Стреляй только *резинкой*: оттягивай её *одним пальцем*.",
          "Цель — отправить все диски на сторону *соперника*."] },
        { title: "Щель и поле", short: "Щель", steps: [
          "Диск прошёл через *щель* — он уже на стороне соперника.",
          "Диск застрял в щели — выбить его можно только *другим диском*.",
          "Диск перелетел через перегородку к сопернику — тоже *считается*.",
          "Диск вылетел за поле — он *вне игры* до конца раунда."] },
        { title: "Победа в раунде", short: "Победа", steps: [
          "Раунд выигрывает тот, у кого на своей стороне *не осталось* дисков.",
          "Все *10* дисков должны быть на стороне соперника, кроме вылетевших за поле."] },
      ],
      after: () => ["Отметьте победителя раунда кнопкой внизу.", "Каждый снова ставит *5* дисков на клетчатые полосы своей стороны.", "Кто первым выиграет *2* раунда, побеждает."],
    },

    // a round: one winner, a point; two wins of three end the game
    scoring: { type: "rounds", pick: true, target: 2,
      pickWho: "Кто выиграл раунд?",
      pickHint: "Раунд выигрывает тот, кто первым отправил все диски на сторону соперника. Диски, вылетевшие за поле, не в счёт." },
    chances: { note: "Приложение 2000 раз доигрывает партию: каждый выигрывает раунды примерно так же часто, как раньше. Это прикидка: меткость и скорость оно не видит." },

    rules: [
      { id: "goal", art: picture("round"), page: 2, title: "Цель игры", keys: "цель победа десять дисков другая сторона",
        body: "<p>Первым отправить все 10 дисков на другую сторону поля.</p>" },
      { id: "components", art: picture("board"), page: 1, title: "Что в коробке", keys: "состав компоненты поле диски сколько",
        body: "<ul><li>Деревянное поле.</li><li>10 деревянных дисков.</li><li>Правила с картинками.</li></ul><p>Для 2 игроков, от 5 лет, партия около 10 минут.</p>" },
      { id: "rounds", art: picture("board"), page: 2, title: "Раунды и подготовка", keys: "три раунда подготовка пять дисков сторона клетчатые полосы лагерь",
        body: "<p>Игра идёт до 3 раундов. В начале каждого раунда каждый ставит по 5 дисков на клетчатые полосы своей стороны поля.</p>" },
      { id: "shoot", art: picture("shoot"), page: 2, title: "Как стрелять", keys: "одновременно резинка один палец стрелять толкать рукой",
        body: "<p>Оба игрока играют <b>одновременно</b>. Отправлять диски на сторону соперника можно только резинкой, оттягивая её одним пальцем.</p><p>Раунд выигрывает тот, кто первым переправит все 10 дисков на сторону соперника.</p>" },
      { id: "win", art: picture("round"), page: 2, title: "Победа в игре", keys: "победа два из трёх лучший из трёх раундов",
        body: "<p>Игру выигрывает тот, кто выиграл больше раундов из трёх, то есть два.</p>" },
      { id: "notes", art: picture("slot") + picture("over"), page: 2, title: "Особые случаи", keys: "щель застрял перегородка перелетел за поле вылетел вне игры",
        body: "<ul><li>Диск, прошедший через щель, уже на стороне соперника.</li><li>Диск, застрявший в щели, можно сдвинуть только другим диском, который его вытолкнет.</li><li>Диск, перелетевший через центральную перегородку на сторону соперника, считается.</li><li>Диск, вылетевший за поле, выбывает до конца раунда. Тогда для победы в раунде достаточно переправить сопернику все оставшиеся диски.</li></ul>" },
    ],

    ruleGroups: [
      { title: "Игра", ids: ["goal", "components", "rounds"] },
      { title: "Раунд", ids: ["shoot", "notes"] },
      { title: "Конец", ids: ["win"] },
    ],

    faqGroups: [
      { title: "Стрельба", refs: ["shoot", "notes"] },
      { title: "Раунды", refs: ["rounds", "win"] },
    ],

    faq: [
      { q: "Можно толкать диск рукой?", a: "Нет. Диски отправляют только резинкой, оттягивая её одним пальцем.", ref: "shoot", keys: "рукой толкать пальцем бросать" },
      { q: "Ходят по очереди?", a: "Нет, оба играют одновременно — кто быстрее и точнее.", ref: "shoot", keys: "по очереди ход одновременно" },
      { q: "Диск застрял в щели — что делать?", a: "Сдвинуть его можно только другим диском, который его вытолкнет. Пальцем его не трогают.", ref: "notes", keys: "застрял щель" },
      { q: "Диск перелетел через перегородку — считается?", a: "Да: если он оказался на стороне соперника, он считается.", ref: "notes", keys: "перелетел через перегородку стенку" },
      { q: "Диск вылетел за поле — что тогда?", a: "Он выбывает до конца раунда. Для победы в раунде достаточно отправить сопернику все оставшиеся диски.", ref: "notes", keys: "вылетел за поле упал на пол" },
      { q: "Сколько раундов играть?", a: "Не больше трёх: кто первым выиграет 2 раунда, тот и победил. Приложение закончит партию само.", ref: "win", keys: "сколько раундов три два" },
      { q: "Можно играть втроём или вчетвером?", a: "Нет, это игра для двоих.", ref: "components", keys: "трое четверо сколько игроков" },
    ],
  });
})();
