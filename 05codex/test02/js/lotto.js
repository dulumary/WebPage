const numbers = Array.from({ length: 45 }, (_, index) => index + 1);
const auto = document.querySelector('#auto');
const manual = document.querySelector('#manual');
const picker = document.querySelector('#picker');
const count = document.querySelector('#count');
const grid = document.querySelector('#number-grid');
const selectedBalls = document.querySelector('#selected-balls');
const winningBalls = document.querySelector('#winning-balls');
const bonusBall = document.querySelector('#bonus-ball');
const draw = document.querySelector('#draw');
const reset = document.querySelector('#reset');
const rank = document.querySelector('#rank');
const matches = document.querySelector('#matches');
const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');

let mode = null;
let selected = [];
let phase = 'ready';
let pendingReveal = null;

function randomIndex(size) {
  const range = 2 ** 32;
  const limit = range - (range % size);
  const random = new Uint32Array(1);
  do {
    window.crypto.getRandomValues(random);
  } while (random[0] >= limit);
  return random[0] % size;
}

function sampleNumbers(amount) {
  const pool = [...numbers];
  return Array.from({ length: amount }, () => pool.splice(randomIndex(pool.length), 1)[0]);
}

function sortNumbers(values) {
  return [...values].sort((first, second) => first - second);
}

function makeBall(number, tag = 'span') {
  const ball = document.createElement(tag);
  ball.className = 'ball';
  if (number === undefined) {
    ball.classList.add('placeholder');
    ball.setAttribute('aria-hidden', 'true');
  } else {
    ball.textContent = number;
    ball.dataset.range = Math.floor((number - 1) / 10);
  }
  return ball;
}

function fillBalls(container, values, size) {
  container.replaceChildren(...Array.from({ length: size }, (_, index) => makeBall(values[index])));
}

function renderSelection() {
  const locked = phase === 'drawing';
  auto.disabled = locked;
  manual.disabled = locked;
  auto.setAttribute('aria-pressed', mode === 'auto');
  manual.setAttribute('aria-pressed', mode === 'manual');
  picker.hidden = mode !== 'manual';
  count.textContent = `선택한 번호 ${selected.length} / 6개`;
  for (const [index, button] of Array.from(grid.children).entries()) {
    const picked = selected.includes(numbers[index]);
    button.setAttribute('aria-pressed', picked);
    button.disabled = locked || (selected.length === 6 && !picked);
  }
  fillBalls(selectedBalls, sortNumbers(selected), 6);
  draw.disabled = selected.length !== 6 || phase !== 'ready';
  draw.lastChild.textContent = locked ? ' 추첨 중…' : ' 추첨 시작';
}

function clearDraw() {
  window.clearTimeout(pendingReveal);
  pendingReveal = null;
  phase = 'ready';
  fillBalls(winningBalls, [], 6);
  fillBalls(bonusBall, [], 1);
  rank.textContent = '';
  matches.textContent = '';
}

function selectMode(nextMode) {
  if (phase === 'drawing' || (nextMode === 'manual' && mode === 'manual')) return;
  mode = nextMode;
  selected = mode === 'auto' ? sampleNumbers(6) : [];
  clearDraw();
  renderSelection();
}

function toggleNumber(number) {
  if (phase === 'drawing' || mode !== 'manual') return;
  if (selected.includes(number)) {
    selected = selected.filter(value => value !== number);
  } else if (selected.length < 6) {
    selected.push(number);
  } else {
    return;
  }
  clearDraw();
  renderSelection();
}

function getRank(matchCount, bonusMatch) {
  if (matchCount === 6) return 1;
  if (matchCount === 5) return bonusMatch ? 2 : 3;
  if (matchCount === 4) return 4;
  if (matchCount === 3) return 5;
  return null;
}

function markMatch(ball, bonus = false) {
  ball.classList.add(bonus ? 'is-bonus-match' : 'is-match');
  ball.setAttribute('aria-label', `${ball.textContent}번 ${bonus ? '보너스 번호 일치' : '당첨 번호 일치'}`);
  ball.setAttribute('role', 'img');
}

function showResult(winning, bonus) {
  const matching = winning.filter(number => selected.includes(number));
  const bonusMatch = selected.includes(bonus);
  const place = getRank(matching.length, bonusMatch);

  phase = 'complete';
  renderSelection();
  for (const ball of [...selectedBalls.children, ...winningBalls.children]) {
    const number = Number(ball.textContent);
    if (matching.includes(number)) markMatch(ball);
    if (number === bonus) markMatch(ball, true);
  }
  if (bonusMatch) markMatch(bonusBall.firstElementChild, true);

  rank.textContent = place ? `🏆 ${place}등 당첨` : '낙첨';
  matches.textContent = `당첨 번호 ${matching.length}개 일치 · 보너스 번호 ${bonusMatch ? '일치' : '불일치'}`;
}

function startDraw() {
  if (selected.length !== 6 || phase !== 'ready') return;

  const drawn = sampleNumbers(7);
  const bonus = drawn.pop();
  const winning = sortNumbers(drawn);
  const interval = reducedMotion.matches ? 50 : 300;
  let index = 0;

  phase = 'drawing';
  renderSelection();

  function revealNext() {
    if (index < winning.length) {
      const ball = makeBall(winning[index]);
      ball.classList.add('reveal');
      winningBalls.children[index].replaceWith(ball);
      index += 1;
      pendingReveal = window.setTimeout(revealNext, interval);
    } else {
      const ball = makeBall(bonus);
      ball.classList.add('reveal');
      bonusBall.replaceChildren(ball);
      pendingReveal = window.setTimeout(() => {
        pendingReveal = null;
        showResult(winning, bonus);
      }, interval);
    }
  }

  pendingReveal = window.setTimeout(revealNext, interval);
}

for (const number of numbers) {
  const button = makeBall(number, 'button');
  button.type = 'button';
  button.addEventListener('click', () => toggleNumber(number));
  grid.append(button);
}

auto.addEventListener('click', () => selectMode('auto'));
manual.addEventListener('click', () => selectMode('manual'));
draw.addEventListener('click', startDraw);
reset.addEventListener('click', () => {
  mode = null;
  selected = [];
  clearDraw();
  renderSelection();
  auto.focus();
});

clearDraw();
renderSelection();
