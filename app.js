/* ═══ 醉今宵 · 酒桌游戏屋 ═══
   命运转盘 / 吹牛骰子 / 罚酒牌 —— 纯前端本地运行 */

(() => {
  "use strict";

  const $ = (id) => document.getElementById(id);
  const PALETTE = ["#a02020", "#c07a28", "#8a3a5a", "#3a6a5a", "#4a5a8a", "#6a4a2a", "#7a2a3a", "#2a5a4a"];

  /* ---------- ① 命运转盘 ---------- */
  let players = ["阿豪", "小美", "老王", "彤彤"];
  let spinning = false;
  let wheelRot = 0;
  const wheelDisc = $("wheelDisc");
  const wheelVerdict = $("wheelVerdict");

  function buildWheel() {
    wheelDisc.querySelectorAll(".seg-label").forEach((n) => n.remove());
    const n = players.length;
    const stops = [];
    for (let i = 0; i < n; i++) {
      stops.push(PALETTE[i % PALETTE.length] + " " + (i * 100 / n) + "% " + ((i + 1) * 100 / n) + "%");
    }
    wheelDisc.style.background = "conic-gradient(" + stops.join(",") + ")";
    players.forEach((name, i) => {
      const mid = (i + 0.5) * 360 / n;
      const lab = document.createElement("span");
      lab.className = "seg-label";
      lab.textContent = name;
      /* 先自身居中 → 转到扇区中角 → 沿半径外推 → 反向旋回，保证文字始终水平可读 */
      lab.style.transform =
        "translate(-50%, -50%) rotate(" + mid + "deg) translate(86px) rotate(" + (-mid) + "deg)";
      wheelDisc.appendChild(lab);
    });
    wheelRot = 0;
    wheelDisc.style.transition = "none";
    wheelDisc.style.transform = "rotate(0deg)";
  }

  function renderPlayers(winnerIdx) {
    const ul = $("playerList");
    ul.innerHTML = "";
    players.forEach((name, i) => {
      const li = document.createElement("li");
      if (i === winnerIdx) li.className = "win";
      li.textContent = name + (i === winnerIdx ? " 🍺" : "");
      const del = document.createElement("button");
      del.textContent = "×";
      del.title = "请离席";
      del.addEventListener("click", () => {
        if (players.length <= 2) { toastVerdict("至少留两位酒友才玩得起来"); return; }
        players.splice(i, 1);
        renderPlayers();
        buildWheel();
      });
      li.appendChild(del);
      ul.appendChild(li);
    });
  }

  function toastVerdict(msg) {
    wheelVerdict.textContent = msg;
    setTimeout(() => { if (wheelVerdict.textContent === msg) wheelVerdict.textContent = "点「开转」—— 看天意选谁喝"; }, 2200);
  }

  $("spinBtn").addEventListener("click", () => {
    if (spinning) return;
    if (players.length < 2) { toastVerdict("人太少了，先拉人入座"); return; }
    spinning = true;
    $("spinBtn").disabled = true;
    wheelVerdict.textContent = "转盘中……";

    const n = players.length;
    const winnerIdx = Math.floor(Math.random() * n);
    /* 让指针（顶部 0°）停在获奖扇区中段 */
    const segMid = (winnerIdx + 0.5) * 360 / n;
    const target = 360 * (5 + Math.floor(Math.random() * 3)) + (360 - segMid);
    wheelRot = wheelRot % 360 + 0;
    wheelDisc.style.transition = "transform 4.2s cubic-bezier(0.12, 0.8, 0.18, 1)";
    wheelDisc.style.transform = "rotate(" + target + "deg)";

    setTimeout(() => {
      spinning = false;
      $("spinBtn").disabled = false;
      const cups = 1 + Math.floor(Math.random() * 3);
      wheelVerdict.textContent = "天意难违 —— 【" + players[winnerIdx] + "】罚 " + cups + " 杯！🍻";
      renderPlayers(winnerIdx);
    }, 4300);
  });

  $("playerForm").addEventListener("submit", (e) => {
    e.preventDefault();
    const v = $("playerInput").value.trim();
    if (!v) return;
    if (players.length >= 8) { toastVerdict("一桌最多坐 8 位，先劝退一位"); return; }
    players.push(v);
    $("playerInput").value = "";
    renderPlayers();
    buildWheel();
  });

  /* ---------- ② 吹牛骰子 ---------- */
  const FACES = ["⚀", "⚁", "⚂", "⚃", "⚄", "⚅"];
  const die1 = $("die1"), die2 = $("die2");
  let left = "左家", right = "右家";

  $("rollBtn").addEventListener("click", () => {
    left = players[Math.floor(Math.random() * players.length)] || "左家";
    do { right = players[Math.floor(Math.random() * players.length)] || "右家"; } while (right === left && players.length > 1);
    $("diceNames").textContent = left + "  vs  " + right;
    $("rollBtn").disabled = true;
    die1.classList.add("rolling");
    die2.classList.add("rolling");

    const tick = setInterval(() => {
      die1.querySelector("span").textContent = FACES[Math.floor(Math.random() * 6)];
      die2.querySelector("span").textContent = FACES[Math.floor(Math.random() * 6)];
    }, 90);

    setTimeout(() => {
      clearInterval(tick);
      die1.classList.remove("rolling");
      die2.classList.remove("rolling");
      const a = 1 + Math.floor(Math.random() * 6);
      const b = 1 + Math.floor(Math.random() * 6);
      die1.querySelector("span").textContent = FACES[a - 1];
      die2.querySelector("span").textContent = FACES[b - 1];
      const v = $("diceVerdict");
      if (a > b) v.textContent = a + " 比 " + b + " —— 【" + right + "】小点，罚 " + (a - b) + " 杯！🍺";
      else if (b > a) v.textContent = b + " 比 " + a + " —— 【" + left + "】小点，罚 " + (b - a) + " 杯！🍺";
      else v.textContent = a + " 比 " + b + " —— 平点！全桌举杯共饮一杯 🥂";
      $("rollBtn").disabled = false;
    }, 900);
  });

  /* ---------- ③ 罚酒牌 ---------- */
  const DECK = [
    { c: "真心话", t: "桌上谁最有可能偷偷买醉？说出名字和理由。" },
    { c: "真心话", t: "你最近一次撒的小谎是什么？现在坦白从宽。" },
    { c: "真心话", t: "在座的人里，你最想和谁换人生过一周？为什么？" },
    { c: "真心话", t: "说出一个你从没告诉过任何人的小怪癖。" },
    { c: "真心话", t: "手机里最舍不得删的一张照片是什么？描述给大家听。" },
    { c: "真心话", t: "你觉得桌上谁的酒量最差？理由要充分。" },
    { c: "大冒险", t: "用最深情的眼神望着左边的人说：「这杯我替你挡了。」" },
    { c: "大冒险", t: "模仿桌上任意一位酒友的口头禅和动作，让大家猜是谁。" },
    { c: "大冒险", t: "站起来给全桌鞠躬敬酒，祝词必须押韵。" },
    { c: "大冒险", t: "用唱歌的方式把「我喝不动了」唱出来，跑调更佳。" },
    { c: "大冒险", t: "给一个不在场的朋友发语音说「今晚不醉不归」，然后展示发送记录。" },
    { c: "大冒险", t: "倒着说一遍桌上所有人的名字，说错一个罚一口。" },
    { c: "罚酒", t: "快问快答：三秒内答出今晚谁的杯子是满的，答错罚酒。", cups: 1 },
    { c: "罚酒", t: "剪刀石头布和右边的人猜三把，输两把的喝酒。", cups: 2 },
    { c: "罚酒", t: "报出桌上每人的本名+生肖，卡壳一次罚一杯。", cups: 2 },
    { c: "罚酒", t: "今晚说了几次「我不行了」？说少了的罚酒。", cups: 1 },
    { c: "罚酒", t: "全桌安静十秒，先笑的人喝。", cups: 1 },
    { c: "罚酒", t: "学猫叫两声，学得不情愿的加罚一杯。", cups: 2 }
  ];

  let filter = "all";
  let drawn = [];

  const pcard = $("pcard");
  const cardVerdict = $("cardVerdict");

  function currentPool() {
    return DECK.map((c, i) => ({ c, i })).filter((x) => filter === "all" || x.c.c === filter);
  }

  function drawCard() {
    const pool = currentPool().filter((x) => !drawn.includes(x.i));
    if (pool.length === 0) {
      cardVerdict.textContent = "这堆牌抽完了 —— 重洗一下";
      return;
    }
    const pick = pool[Math.floor(Math.random() * pool.length)];
    drawn.push(pick.i);
    $("drawnCount").textContent = drawn.length;

    pcard.classList.add("flipped");
    setTimeout(() => {
      const face = document.createElement("div");
      face.className = "face";
      const cat = document.createElement("span");
      cat.className = "cat";
      cat.textContent = "【 " + pick.c.c + " 】";
      const txt = document.createElement("div");
      txt.className = "txt";
      txt.textContent = pick.c.t;
      face.append(cat, txt);
      if (pick.c.cups) {
        const cups = document.createElement("div");
        cups.className = "cups";
        cups.textContent = "🍺".repeat(pick.c.cups);
        face.appendChild(cups);
      }
      pcard.innerHTML = "";
      pcard.className = "pcard";
      void pcard.offsetWidth;
      pcard.appendChild(face);
      cardVerdict.textContent = "抽中【" + pick.c.c + "】—— 指到谁谁来执行";
      setTimeout(() => pcard.classList.add("flipped"), 30);
    }, 320);
  }

  $("drawBtn").addEventListener("click", drawCard);

  $("resetDeck").addEventListener("click", () => {
    drawn = [];
    $("drawnCount").textContent = 0;
    cardVerdict.textContent = "牌堆已重洗，接着抽";
    pcard.className = "pcard back";
    pcard.textContent = "罚 酒 牌";
  });

  document.querySelectorAll(".chip").forEach((ch) => {
    ch.addEventListener("click", () => {
      document.querySelectorAll(".chip").forEach((c) => c.classList.remove("active"));
      ch.classList.add("active");
      filter = ch.dataset.c;
    });
  });

  /* ---------- 酒令页签 ---------- */
  document.querySelectorAll(".tab").forEach((t) => {
    t.addEventListener("click", () => {
      document.querySelectorAll(".tab").forEach((x) => x.classList.remove("active"));
      t.classList.add("active");
      ["wheel", "dice", "card"].forEach((id) => { $(id).hidden = id !== t.dataset.t; });
    });
  });

  /* ---------- 启动 ---------- */
  renderPlayers();
  buildWheel();
})();
