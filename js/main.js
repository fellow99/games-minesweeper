/**
 * 扫雷游戏 - Minesweeper
 * 经典扫雷玩法，使用 emoji 图标
 */
(function () {
  'use strict';

  // ========== 难度配置 ==========
  const DIFFICULTY = {
    beginner: { name: '初级', rows: 9, cols: 9, mines: 10 },
    intermediate: { name: '中级', rows: 16, cols: 16, mines: 40 },
    expert: { name: '高级', rows: 16, cols: 30, mines: 99 },
  };

  // ========== 数字颜色（经典扫雷配色） ==========
  const NUMBER_COLORS = [
    '',          // 0 - 不显示
    '#0000ff',   // 1 - 蓝
    '#008000',   // 2 - 绿
    '#ff0000',   // 3 - 红
    '#000080',   // 4 - 深蓝
    '#800000',   // 5 - 棕红
    '#008080',   // 6 - 青
    '#000000',   // 7 - 黑
    '#808080',   // 8 - 灰
  ];

  // ========== DOM 元素 ==========
  const elBoard = document.getElementById('board');
  const elMineCount = document.getElementById('mine-count');
  const elTimer = document.getElementById('timer');
  const elFace = document.getElementById('face');
  const elDifficulty = document.getElementById('difficulty');

  // ========== 游戏状态 ==========
  let rows, cols, totalMines, cellSize;
  let board = [];         // board[r][c] = -1（雷）或 0-8（数字）
  let revealed = [];      // revealed[r][c] = true/false
  let flagged = [];       // flagged[r][c] = true/false
  let gameOver = false;
  let gameWon = false;
  let firstClickDone = false;
  let minesRemaining = 0;
  let revealedCount = 0;
  let timerValue = 0;
  let timerInterval = null;
  let currentDifficulty = 'beginner';
  let explodedRow = -1;
  let explodedCol = -1;

  // ========== 动态计算格子大小 ==========
  function calcCellSize() {
    const cfg = DIFFICULTY[currentDifficulty];
    const maxWidth = Math.min(window.innerWidth - 60, 960);
    const maxHeight = Math.min(window.innerHeight - 220, 700);
    const cellByWidth = Math.floor(maxWidth / cfg.cols);
    const cellByHeight = Math.floor(maxHeight / cfg.rows);
    return Math.min(cellByWidth, cellByHeight, 36);
  }

  // ========== 初始化 ==========
  function init() {
    const cfg = DIFFICULTY[currentDifficulty];
    rows = cfg.rows;
    cols = cfg.cols;
    totalMines = cfg.mines;
    minesRemaining = totalMines;
    cellSize = calcCellSize();

    // 清空旧状态
    board = Array.from({ length: rows }, () => Array(cols).fill(0));
    revealed = Array.from({ length: rows }, () => Array(cols).fill(false));
    flagged = Array.from({ length: rows }, () => Array(cols).fill(false));
    gameOver = false;
    gameWon = false;
    firstClickDone = false;
    revealedCount = 0;
    explodedRow = -1;
    explodedCol = -1;

    // 停止计时器
    clearInterval(timerInterval);
    timerInterval = null;
    timerValue = 0;

    // 更新UI
    elMineCount.textContent = String(totalMines).padStart(3, '0');
    elTimer.textContent = '000';
    elFace.textContent = '\u{1F642}'; // 🙂

    // 高亮当前难度按钮
    Array.from(elDifficulty.children).forEach(function (btn) {
      btn.classList.toggle('active', btn.dataset.level === currentDifficulty);
    });

    renderBoard();
  }

  // ========== 首次点击后布雷 ==========
  function generateMines(safeRow, safeCol) {
    if (firstClickDone) return;
    firstClickDone = true;

    // 安全区域：首次点击及其周围 8 格不能有雷
    const safeSet = new Set();
    for (let dr = -1; dr <= 1; dr++) {
      for (let dc = -1; dc <= 1; dc++) {
        const r = safeRow + dr;
        const c = safeCol + dc;
        if (r >= 0 && r < rows && c >= 0 && c < cols) {
          safeSet.add(r * cols + c);
        }
      }
    }

    // 随机布雷
    let placed = 0;
    while (placed < totalMines) {
      const r = Math.floor(Math.random() * rows);
      const c = Math.floor(Math.random() * cols);
      const idx = r * cols + c;
      if (board[r][c] === -1 || safeSet.has(idx)) continue;
      board[r][c] = -1;
      placed++;
    }

    // 计算数字
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        if (board[r][c] === -1) continue;
        let count = 0;
        forEachNeighbor(r, c, function (nr, nc) {
          if (board[nr][nc] === -1) count++;
        });
        board[r][c] = count;
      }
    }

    // 开始计时
    startTimer();
  }

  // ========== 遍历周围8格 ==========
  function forEachNeighbor(r, c, fn) {
    for (let dr = -1; dr <= 1; dr++) {
      for (let dc = -1; dc <= 1; dc++) {
        if (dr === 0 && dc === 0) continue;
        const nr = r + dr;
        const nc = c + dc;
        if (nr >= 0 && nr < rows && nc >= 0 && nc < cols) {
          fn(nr, nc);
        }
      }
    }
  }

  // ========== 揭开格子（左键） ==========
  function reveal(r, c) {
    if (gameOver || gameWon) return;
    if (revealed[r][c] || flagged[r][c]) return;

    // 首次点击 → 布雷
    if (!firstClickDone) {
      generateMines(r, c);
    }

    // 踩雷 → 游戏结束
    if (board[r][c] === -1) {
      lose(r, c);
      return;
    }

    // 揭开 + 自动展开
    doReveal(r, c);

    // 检查胜利
    checkWin();

    // 刷新棋盘
    renderBoard();
  }

  function doReveal(r, c) {
    if (revealed[r][c] || flagged[r][c]) return;
    revealed[r][c] = true;
    revealedCount++;

    if (board[r][c] === 0) {
      forEachNeighbor(r, c, function (nr, nc) {
        doReveal(nr, nc);
      });
    }
  }

  // ========== 标记/取消标记（右键） ==========
  function toggleFlag(r, c) {
    if (gameOver || gameWon) return;
    if (revealed[r][c]) return;

    if (flagged[r][c]) {
      flagged[r][c] = false;
      minesRemaining++;
    } else {
      flagged[r][c] = true;
      minesRemaining--;
    }

    elMineCount.textContent = String(Math.max(0, minesRemaining)).padStart(3, '0');
    updateCellDOM(r, c);
  }

  // ========== 双击快速揭开（Chord） ==========
  function chord(r, c) {
    if (gameOver || gameWon) return;
    if (!revealed[r][c] || board[r][c] <= 0) return;

    // 统计周围旗帜数
    let flagCount = 0;
    forEachNeighbor(r, c, function (nr, nc) {
      if (flagged[nr][nc]) flagCount++;
    });

    // 旗帜数 != 数字 → 不执行
    if (flagCount !== board[r][c]) return;

    // 揭开周围未标记未揭开的格子
    let hitMine = false;
    forEachNeighbor(r, c, function (nr, nc) {
      if (!revealed[nr][nc] && !flagged[nr][nc]) {
        if (board[nr][nc] === -1) {
          lose(nr, nc);
          hitMine = true;
          return;
        }
        doReveal(nr, nc);
      }
    });

    if (hitMine) return;

    checkWin();
    renderBoard();
  }

  // ========== 游戏失败 ==========
  function lose(r, c) {
    gameOver = true;
    explodedRow = r;
    explodedCol = c;
    clearInterval(timerInterval);
    timerInterval = null;
    elFace.textContent = '\u{1F635}'; // 😵

    // 揭开所有未被标记的雷
    for (let rr = 0; rr < rows; rr++) {
      for (let cc = 0; cc < cols; cc++) {
        if (board[rr][cc] === -1) {
          if (!(rr === r && cc === c) && !flagged[rr][cc]) {
            revealed[rr][cc] = true;
          }
        }
        // 错误标记（标记了不是雷的格子）
        if (flagged[rr][cc] && board[rr][cc] !== -1) {
          flagged[rr][cc] = false; // 取消标记以显示❌
        }
      }
    }
    renderBoard();
  }

  // ========== 检查胜利 ==========
  function checkWin() {
    if (revealedCount === rows * cols - totalMines) {
      gameWon = true;
      clearInterval(timerInterval);
      timerInterval = null;

      // 自动标记所有剩余雷
      for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) {
          if (board[r][c] === -1 && !flagged[r][c]) {
            flagged[r][c] = true;
          }
        }
      }
      minesRemaining = 0;
      elMineCount.textContent = '000';
      elFace.textContent = '\u{1F60E}'; // 😎
      renderBoard();
    }
  }

  // ========== 计时器 ==========
  function startTimer() {
    if (timerInterval) return;
    timerValue = 0;
    timerInterval = setInterval(function () {
      timerValue++;
      if (timerValue > 999) timerValue = 999;
      elTimer.textContent = String(timerValue).padStart(3, '0');
    }, 1000);
  }

  // ========== 渲染 ==========
  function renderBoard() {
    elBoard.innerHTML = '';
    elBoard.style.gridTemplateColumns = 'repeat(' + cols + ', ' + cellSize + 'px)';
    elBoard.style.gridTemplateRows = 'repeat(' + rows + ', ' + cellSize + 'px)';

    const fragment = document.createDocumentFragment();
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        const cell = document.createElement('div');
        cell.className = 'cell';
        cell.dataset.row = r;
        cell.dataset.col = c;
        cell.style.width = cellSize + 'px';
        cell.style.height = cellSize + 'px';
        cell.style.fontSize = Math.max(12, Math.floor(cellSize * 0.55)) + 'px';
        applyCellStyle(cell, r, c);
        fragment.appendChild(cell);
      }
    }
    elBoard.appendChild(fragment);
  }

  function updateCellDOM(r, c) {
    const cell = elBoard.querySelector(
      '[data-row="' + r + '"][data-col="' + c + '"]'
    );
    if (cell) applyCellStyle(cell, r, c);
  }

  function applyCellStyle(cell, r, c) {
    // 重置
    cell.className = 'cell';
    cell.textContent = '';
    cell.style.color = '';
    cell.style.fontSize = Math.max(12, Math.floor(cellSize * 0.55)) + 'px';

    // 踩中的雷 - 爆炸特效 💥
    if (explodedRow === r && explodedCol === c && gameOver) {
      cell.classList.add('revealed', 'exploded');
      cell.textContent = '\u{1F4A5}'; // 💥
      return;
    }

    if (revealed[r][c]) {
      cell.classList.add('revealed');
      if (board[r][c] === -1) {
        cell.classList.add('mine');
        cell.textContent = '\u{1F4A3}'; // 💣
      } else if (board[r][c] > 0) {
        cell.textContent = board[r][c];
        cell.style.color = NUMBER_COLORS[board[r][c]];
        cell.classList.add('num-' + board[r][c]);
      }
      return;
    }

    if (flagged[r][c]) {
      cell.classList.add('flagged');
      if (gameOver) {
        cell.classList.add('wrong-flag');
        cell.textContent = '\u{274C}'; // ❌
      } else {
        cell.textContent = '\u{1F6A9}'; // 🚩
      }
      return;
    }

    // 游戏结束 → 显示未标记的雷
    if (gameOver && board[r][c] === -1) {
      cell.classList.add('revealed', 'mine');
      cell.textContent = '\u{1F4A3}'; // 💣
    }
  }

  // ========== 事件处理 ==========
  elBoard.addEventListener('mousedown', function (e) {
    e.preventDefault();
    const cell = e.target.closest('.cell');
    if (!cell) return;

    const r = parseInt(cell.dataset.row);
    const c = parseInt(cell.dataset.col);

    if (e.button === 0) {
      reveal(r, c);
    } else if (e.button === 2) {
      toggleFlag(r, c);
    }
  });

  // 双击 → Chord（快速揭开）
  elBoard.addEventListener('dblclick', function (e) {
    e.preventDefault();
    const cell = e.target.closest('.cell');
    if (!cell) return;
    const r = parseInt(cell.dataset.row);
    const c = parseInt(cell.dataset.col);
    chord(r, c);
  });

  // 禁用右键菜单
  elBoard.addEventListener('contextmenu', function (e) {
    e.preventDefault();
  });

  // 笑脸按钮 → 重新开始
  elFace.addEventListener('click', init);

  // 难度选择
  elDifficulty.addEventListener('click', function (e) {
    const btn = e.target.closest('button');
    if (!btn) return;
    const level = btn.dataset.level;
    if (!level || !DIFFICULTY[level]) return;
    currentDifficulty = level;
    init();
  });

  // 键盘快捷键
  document.addEventListener('keydown', function (e) {
    if (e.key === 'r' || e.key === 'R') {
      init();
    } else if (e.key === '1') {
      currentDifficulty = 'beginner';
      init();
    } else if (e.key === '2') {
      currentDifficulty = 'intermediate';
      init();
    } else if (e.key === '3') {
      currentDifficulty = 'expert';
      init();
    }
  });

  // 窗口大小变化 → 调整格子大小
  let resizeTimeout;
  window.addEventListener('resize', function () {
    clearTimeout(resizeTimeout);
    resizeTimeout = setTimeout(function () {
      const newSize = calcCellSize();
      if (newSize !== cellSize) {
        cellSize = newSize;
        renderBoard();
      }
    }, 200);
  });

  // ========== 启动游戏 ==========
  init();
})();
