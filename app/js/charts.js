/* Charts of the statistics screen: the win rate of each player, the race of wins over the games, the games per month,
   who beats whom. The numbers come from pure functions (tested in scripts/test-core.js); the pictures are plain HTML
   and SVG in the app's colours. A player keeps their own colour on every chart, and a name always stands beside it:
   the colours are chosen by the family and may look alike, so identity never rests on colour alone.
   Tapping (or hovering) the race or a month shows its numbers in a tooltip; every chart has its numbers in text too. */
(function () {
  "use strict";
  const BH = window.BH, esc = BH.esc;
  const C = BH.charts = {};
  const MON = ["янв", "фев", "мар", "апр", "май", "июн", "июл", "авг", "сен", "окт", "ноя", "дек"];
  const MON_FULL = ["Январь", "Февраль", "Март", "Апрель", "Май", "Июнь", "Июль", "Август", "Сентябрь", "Октябрь", "Ноябрь", "Декабрь"];
  C.MIN_GAMES = 5;    // fewer games — the rate is shown faded: 1 of 1 is not yet 100%
  C.MAX_LINES = 6;    // the race draws at most six players, the ones with the most wins

  /* ---------- numbers ---------- */
  // a cooperative game (The Gang): everyone wins or loses together — it says nothing in a race or a duel
  const solo = list => list.filter(s => !BH.isCoop(BH.game(s.gameId)));
  const byDate = list => list.slice().sort((a, b) => BH.sessionDate(a) - BH.sessionDate(b) || (a.finishedAt || 0) - (b.finishedAt || 0));
  // the race: the games in the order played; for each player the wins after every game (the first point is 0)
  C.race = (sessions, ids) => {
    const games = byDate(solo(sessions)), series = {};
    for (const id of ids) { let n = 0; series[id] = [0, ...games.map(s => (n += s.winners.includes(id) ? 1 : 0))]; }
    return { games, series };
  };
  // the games per month: from the first month with a game to now, at most the last 12 months
  C.months = (sessions, now) => {
    const key = t => { const d = new Date(t); return d.getFullYear() * 12 + d.getMonth(); };
    const dated = sessions.map(BH.sessionDate).filter(Boolean);
    if (!dated.length) return [];
    const last = Math.max(key(now || Date.now()), ...dated.map(key)), first = Math.max(Math.min(...dated.map(key)), last - 11), out = [];
    for (let k = first; k <= last; k++) out.push({ y: Math.floor(k / 12), m: k % 12, n: dated.filter(t => key(t) === k).length });
    return out;
  };
  // who beats whom: in the games both played, how often one of them won and the other did not
  C.headToHead = (sessions, ids) => {
    const m = {};
    for (const a of ids) { m[a] = {}; for (const b of ids) m[a][b] = { shared: 0, won: 0, lost: 0 }; }
    for (const s of solo(sessions)) for (const a of ids) for (const b of ids) {
      if (a === b || !s.players.includes(a) || !s.players.includes(b)) continue;
      const c = m[a][b], wa = s.winners.includes(a), wb = s.winners.includes(b);
      c.shared++; if (wa && !wb) c.won++; if (wb && !wa) c.lost++;
    }
    return m;
  };

  /* ---------- pictures ---------- */
  const name = id => (BH.player(id) || { name: "?" }).name;
  const games = n => n + " " + BH.plural(n, "партия", "партии", "партий");
  const ofGames = n => "из " + n + " " + BH.plural(n, "партии", "партий", "партий");
  const wins = n => n + " " + BH.plural(n, "победа", "победы", "побед");
  const nice = max => { if (max <= 4) return Math.max(1, max); const step = max <= 10 ? 2 : max <= 25 ? 5 : max <= 50 ? 10 : Math.ceil(max / 50) * 10; return Math.ceil(max / step) * step; };

  // the win rate: one bar per player in their colour, the per cent at the bar's end, «7 из 12» under the name
  C.ratesHTML = rows => {
    if (!rows.length) return "";
    const sure = rows.filter(r => r.played >= C.MIN_GAMES), few = rows.filter(r => r.played < C.MIN_GAMES);
    const order = [...sure.sort((a, b) => b.rate - a.rate || b.wins - a.wins), ...few.sort((a, b) => b.rate - a.rate || b.played - a.played)];
    const line = r => { const pct = Math.round(100 * r.rate), faint = r.played < C.MIN_GAMES;
      return `<div class="ch-rate${faint ? " faint" : ""}" role="listitem" aria-label="${esc(r.p.name)}: ${pct}% побед, ${r.wins} ${ofGames(r.played)}${faint ? ", мало партий" : ""}">
        <span class="ch-rate-n"><b>${esc(r.p.name)}</b><small>${r.wins} из ${r.played}</small></span>
        <span class="ch-rate-bar" aria-hidden="true"><i style="width:${Math.max(pct, r.wins ? 2 : 0)}%;background:${esc(r.p.color)}"></i></span>
        <span class="ch-rate-pct" aria-hidden="true">${pct}%</span></div>`; };
    return `<section class="panel ch"><h2>Процент побед</h2>
      <div class="ch-rates" role="list">${order.map(line).join("")}</div>
      ${few.length ? `<p class="small muted ch-note">Бледные полоски — у игроков меньше ${C.MIN_GAMES} партий, их процент пока случаен.</p>` : ""}</section>`;
  };

  // the race of wins: a step line per player over the games in the order played; tap for the numbers after a game
  const store = {};
  C.raceHTML = (sessions, rows) => {
    const ids = rows.filter(r => r.played > 0).sort((a, b) => b.wins - a.wins || a.p.name.localeCompare(b.p.name)).slice(0, C.MAX_LINES).map(r => r.p.id);
    if (ids.length < 2) return "";
    const { games: list, series } = C.race(sessions, ids), n = list.length, top = Math.max(...ids.map(id => series[id][n]));
    if (n < 2 || !top) return "";
    let max = nice(top); if (max > 4 && max % 2) max++;
    const W = 340, H = 200, L = 26, R = 30, T = 10, B = 24, w = W - L - R, h = H - T - B;
    const X = i => L + (w * i) / n, Y = v => T + h - (h * v) / max;
    const ticks = max <= 4 ? Array.from({ length: max + 1 }, (_, i) => i) : [0, max / 2, max];
    const grid = ticks.map(v => `<line x1="${L}" x2="${W - R}" y1="${Y(v)}" y2="${Y(v)}" class="ch-grid"/><text x="${L - 6}" y="${Y(v) + 4}" class="ch-tick" text-anchor="end">${v}</text>`).join("");
    const path = id => { const s = series[id]; let d = `M${X(0)} ${Y(0)}`; for (let i = 1; i <= n; i++) d += ` H${X(i)} V${Y(s[i])}`; return d; };
    // the value at the end of each line; one that would sit on another is left to the legend and the tooltip
    const placed = [];
    const ends = ids.map(id => { const y = Y(series[id][n]); const free = placed.every(p => Math.abs(p - y) >= 12); if (free) placed.push(y);
      return `<circle cx="${X(n)}" cy="${y}" r="4" class="ch-dot" style="fill:${esc(BH.player(id).color)}"/>${free ? `<text x="${X(n) + 8}" y="${y + 4}" class="ch-end">${series[id][n]}</text>` : ""}`; }).join("");
    const id = "race"; store[id] = { list, series, ids, X, n, W, top: T, bottom: H - B };
    const d0 = list[0], d1 = list[n - 1];
    return `<section class="panel ch"><h2>Гонка побед</h2><p class="small muted">Сколько побед у каждого после каждой партии, по порядку дат. Нажмите на график, чтобы увидеть числа.</p>
      <div class="ch-wrap" data-chart="${id}">
        <svg class="ch-svg" viewBox="0 0 ${W} ${H}" role="img" tabindex="0" aria-label="Гонка побед: ${ids.map(x => esc(name(x)) + ": " + wins(series[x][n])).join(", ")}">
          ${grid}${ids.map(x => `<path d="${path(x)}" class="ch-line" fill="none" style="stroke:${esc(BH.player(x).color)}"/>`).join("")}${ends}
          <text x="${L}" y="${H - 6}" class="ch-tick">${esc(BH.fmtDate(BH.sessionDate(d0)))}</text><text x="${W - R}" y="${H - 6}" class="ch-tick" text-anchor="end">${esc(BH.fmtDate(BH.sessionDate(d1)))}</text>
          <line class="ch-cross" x1="0" x2="0" y1="${T}" y2="${H - B}" visibility="hidden"/>
          <rect class="ch-hit" x="${L}" y="0" width="${w}" height="${H}" fill="transparent"/>
        </svg><div class="ch-tip below" role="status" aria-live="polite" hidden></div></div>
      <div class="ch-legend">${ids.map(x => `<span class="ch-key"><i style="background:${esc(BH.player(x).color)}"></i>${esc(name(x))}</span>`).join("")}</div>
      ${rows.filter(r => r.played > 0).length > C.MAX_LINES ? `<p class="small muted ch-note">Показаны ${C.MAX_LINES} игроков с наибольшим числом побед.</p>` : ""}</section>`;
  };

  // the games per month: columns, the busiest month and this month signed; tap a column for its number
  C.monthsHTML = (sessions, now) => {
    const ms = C.months(sessions, now);
    if (!ms.length) return "";
    const W = 340, H = 170, L = 8, R = 8, T = 20, B = 22, w = W - L - R, h = H - T - B, slot = w / ms.length, bw = Math.min(24, slot * 0.62);
    const max = Math.max(1, ...ms.map(m => m.n)), top = ms.reduce((a, m, i) => (m.n > ms[a].n ? i : a), 0), lastI = ms.length - 1;
    const label = m => `${MON_FULL[m.m]} ${m.y}: ${games(m.n)}`;
    const cols = ms.map((m, i) => { const x = L + slot * i + (slot - bw) / 2, ch = (h * m.n) / max, y = T + h - ch, r = Math.min(4, ch);
      const bar = m.n ? `<path d="M${x} ${T + h} V${y + r} Q${x} ${y} ${x + r} ${y} H${x + bw - r} Q${x + bw} ${y} ${x + bw} ${y + r} V${T + h} Z" class="ch-col"/>` : "";
      const sign = m.n && (i === top || i === lastI) ? `<text x="${x + bw / 2}" y="${y - 5}" class="ch-end" text-anchor="middle">${m.n}</text>` : "";
      const tick = ms.length <= 12 ? `<text x="${x + bw / 2}" y="${H - 6}" class="ch-tick" text-anchor="middle">${MON[m.m]}</text>` : "";
      return `<g class="ch-month" data-tip="${esc(label(m))}" tabindex="0" role="img" aria-label="${esc(label(m))}"><rect x="${L + slot * i}" y="0" width="${slot}" height="${H}" fill="transparent"/>${bar}${sign}${tick}</g>`; }).join("");
    const GEN = ["января", "февраля", "марта", "апреля", "мая", "июня", "июля", "августа", "сентября", "октября", "ноября", "декабря"];
    const span = lastI === 0 ? `${MON_FULL[ms[0].m]} ${ms[0].y}` : ms[0].y === ms[lastI].y ? `С ${GEN[ms[0].m]} по ${MON_FULL[ms[lastI].m].toLowerCase()} ${ms[0].y}` : `С ${GEN[ms[0].m]} ${ms[0].y} по ${MON_FULL[ms[lastI].m].toLowerCase()} ${ms[lastI].y}`;
    return `<section class="panel ch"><h2>Партии по месяцам</h2><p class="small muted">${esc(span)}. Нажмите на столбик, чтобы увидеть число.</p>
      <div class="ch-wrap" data-chart="months"><svg class="ch-svg" viewBox="0 0 ${W} ${H}" role="group" aria-label="Партии по месяцам">
        <line x1="${L}" x2="${W - R}" y1="${T + h}" y2="${T + h}" class="ch-grid"/>${cols}</svg><div class="ch-tip" role="status" aria-live="polite" hidden></div></div></section>`;
  };

  // who beats whom: a table of the players with the most games; «6:4» — the wins of the player on the left over the
  // player on top and back; blue — the left one wins more often, red — less often, grey — equal
  C.headToHeadHTML = (sessions, rows) => {
    const ids = rows.slice().sort((a, b) => b.played - a.played || a.p.name.localeCompare(b.p.name)).slice(0, C.MAX_LINES).map(r => r.p.id);
    if (ids.length < 2) return "";
    const m = C.headToHead(sessions, ids);
    const cell = (a, b) => { if (a === b) return `<td class="ch-self"></td>`;
      const c = m[a][b], dec = c.won + c.lost;
      if (!c.shared) return `<td class="ch-none" aria-label="${esc(name(a))} и ${esc(name(b))} вместе не играли">—</td>`;
      const lean = dec ? (c.won - c.lost) / dec : 0, k = Math.abs(lean) * Math.min(1, dec / C.MIN_GAMES), bg = !dec || !lean ? "var(--ch-even)" : `color-mix(in srgb, ${lean > 0 ? "var(--ch-plus)" : "var(--ch-minus)"} ${Math.round(18 + 50 * k)}%, var(--surface))`;
      return `<td style="background:${bg}" aria-label="${esc(name(a))} против ${esc(name(b))}: ${c.won} : ${c.lost}, общих партий: ${c.shared}">${c.won}:${c.lost}</td>`; };
    return `<section class="panel ch"><h2>Кто кого обыгрывает</h2>
      <p class="small muted">«6:4» — у игрока слева 6 побед над игроком сверху, у того 4. Считаются общие партии, где победил только один из двоих.</p>
      <div class="scroll-x"><table class="ch-h2h"><thead><tr><th></th>${ids.map(b => `<th scope="col" title="${esc(name(b))}" aria-label="${esc(name(b))}">${BH.avatar(BH.player(b), "sm")}</th>`).join("")}</tr></thead>
        <tbody>${ids.map(a => `<tr><th scope="row" title="${esc(name(a))}" aria-label="${esc(name(a))}">${BH.avatar(BH.player(a), "sm")}</th>${ids.map(b => cell(a, b)).join("")}</tr>`).join("")}</tbody></table></div>
      <div class="ch-legend">${ids.map(a => `<span class="ch-key">${BH.avatar(BH.player(a), "sm")}${esc(name(a))}</span>`).join("")}</div>
      <div class="ch-legend"><span class="ch-key"><i class="sq" style="background:var(--ch-plus)"></i>Игрок слева выигрывает чаще</span><span class="ch-key"><i class="sq" style="background:var(--ch-minus)"></i>Игрок слева выигрывает реже</span><span class="ch-key"><i class="sq" style="background:var(--ch-even)"></i>Побед поровну</span></div>
      ${rows.length > C.MAX_LINES ? `<p class="small muted ch-note">Показаны ${C.MAX_LINES} игроков с наибольшим числом партий. Бледнее — меньше ${C.MIN_GAMES} партий, где победил один из двоих.</p>` : `<p class="small muted ch-note">Бледнее — меньше ${C.MIN_GAMES} партий, где победил один из двоих.</p>`}</section>`;
  };

  /* ---------- the tooltip: tap or hover a chart ---------- */
  function showTip(wrap, html, x) {
    const tip = wrap.querySelector(".ch-tip"); if (!tip) return;
    tip.innerHTML = html; tip.hidden = false;
    const ww = wrap.clientWidth, tw = tip.offsetWidth;
    tip.style.left = Math.max(0, Math.min(ww - tw, x - tw / 2)) + "px";
  }
  function raceAt(wrap, clientX) {
    const d = store[wrap.dataset.chart], svg = wrap.querySelector("svg"); if (!d || !svg) return;
    const r = svg.getBoundingClientRect(), vx = ((clientX - r.left) / r.width) * d.W;
    let i = 0; for (let k = 0; k <= d.n; k++) if (Math.abs(d.X(k) - vx) < Math.abs(d.X(i) - vx)) i = k;
    raceShow(wrap, Math.max(1, i));
  }
  function raceShow(wrap, i) {
    const d = store[wrap.dataset.chart], svg = wrap.querySelector("svg"); if (!d) return;
    wrap.dataset.i = i;
    const cross = svg.querySelector(".ch-cross"); cross.setAttribute("x1", d.X(i)); cross.setAttribute("x2", d.X(i)); cross.setAttribute("visibility", "visible");
    const s = d.list[i - 1], g = BH.game(s.gameId), order = d.ids.slice().sort((a, b) => d.series[b][i] - d.series[a][i]);
    const html = `<b>Партия ${i}, ${esc(BH.fmtDate(BH.sessionDate(s)))}</b><span class="muted">${esc(g ? g.name : "")}</span>` +
      order.map(id => `<span class="ch-key"><i style="background:${esc(BH.player(id).color)}"></i><span>${esc(name(id))}</span>${s.winners.includes(id) ? `<small>победа</small>` : "<small></small>"}<b>${d.series[id][i]}</b></span>`).join("");
    const r = svg.getBoundingClientRect(); showTip(wrap, html, (d.X(i) / d.W) * r.width);
  }
  const hide = wrap => { const t = wrap.querySelector(".ch-tip"); if (t) t.hidden = true; const c = wrap.querySelector(".ch-cross"); if (c) c.setAttribute("visibility", "hidden"); };
  const monthShow = (wrap, g) => { const svg = wrap.querySelector("svg"), r = svg.getBoundingClientRect(), b = g.getBoundingClientRect();
    wrap.querySelectorAll(".ch-month.on").forEach(x => x.classList.remove("on")); g.classList.add("on");
    showTip(wrap, `<b>${esc(g.dataset.tip)}</b>`, b.left - r.left + b.width / 2); };
  document.addEventListener("pointermove", e => {
    if (e.pointerType !== "mouse") return;
    const wrap = e.target.closest && e.target.closest(".ch-wrap"); if (!wrap) return;
    if (wrap.dataset.chart === "months") { const g = e.target.closest(".ch-month"); if (g) monthShow(wrap, g); } else raceAt(wrap, e.clientX);
  });
  document.addEventListener("pointerdown", e => {
    const wrap = e.target.closest && e.target.closest(".ch-wrap");
    document.querySelectorAll(".ch-wrap").forEach(w => { if (w !== wrap) hide(w); });
    if (!wrap) return;
    if (wrap.dataset.chart === "months") { const g = e.target.closest(".ch-month"); if (g) monthShow(wrap, g); } else raceAt(wrap, e.clientX);
  });
  document.addEventListener("mouseout", e => { const wrap = e.target.closest && e.target.closest(".ch-wrap"); if (wrap && !wrap.contains(e.relatedTarget)) hide(wrap); });
  // the keyboard: arrows walk the race game by game; a month column shows its number on focus
  document.addEventListener("keydown", e => {
    const wrap = e.target.closest && e.target.closest(".ch-wrap"); if (!wrap || wrap.dataset.chart === "months") return;
    const d = store[wrap.dataset.chart]; if (!d || (e.key !== "ArrowLeft" && e.key !== "ArrowRight")) return;
    e.preventDefault(); if (!wrap.dataset.i) { raceShow(wrap, d.n); return; } const i = +wrap.dataset.i; raceShow(wrap, Math.max(1, Math.min(d.n, i + (e.key === "ArrowRight" ? 1 : -1))));
  });
  document.addEventListener("focusout", e => { const wrap = e.target.closest && e.target.closest(".ch-wrap"); if (wrap && !wrap.contains(e.relatedTarget)) { hide(wrap); delete wrap.dataset.i; } });
  document.addEventListener("focusin", e => { const g = e.target.closest && e.target.closest(".ch-month"); if (g) monthShow(g.closest(".ch-wrap"), g); });
})();
