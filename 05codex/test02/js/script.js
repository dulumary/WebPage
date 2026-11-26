const moves = {
  scissors: { label: '가위', icon: './images/scissors.png', beats: 'paper' },
  rock: { label: '바위', icon: './images/rock.png', beats: 'scissors' },
  paper: { label: '보', icon: './images/paper.png', beats: 'rock' }
};
const moveNames = Object.keys(moves);
const messages = {
  win: '당신의 승리',
  loss: '컴퓨터 승리',
  draw: '무승부'
};

const game = document.querySelector('.game');
const buttons = document.querySelectorAll('.choice');
const result = document.querySelector('#result');
const status = document.querySelector('#status');
const rateText = document.querySelector('#rate');
const rateBar = document.querySelector('#rate-bar');
const counterFields = {
  total: document.querySelector('#total'),
  win: document.querySelector('#win'),
  loss: document.querySelector('#loss'),
  draw: document.querySelector('#draw'),
  current: document.querySelector('#current-streak'),
  best: document.querySelector('#best-streak')
};
const playerFields = {
  user: { icon: document.querySelector('#user-icon'), label: document.querySelector('#user-choice') },
  computer: { icon: document.querySelector('#computer-icon'), label: document.querySelector('#computer-choice') }
};

let pendingRound = null;
let records;

function showMove(player, move) {
  const { icon, label } = playerFields[player];
  icon.style.backgroundImage = move ? `url("${move.icon}")` : '';
  icon.textContent = move ? '' : '?';
  label.textContent = move?.label ?? '';
  label.hidden = !move;
}

function showOutcome(outcome) {
  result.textContent = outcome ? messages[outcome] : '';
  result.dataset.outcome = outcome ?? '';
  result.hidden = !outcome;
}

function setPlaying(playing, selection) {
  game.classList.toggle('is-playing', playing);
  for (const button of buttons) {
    button.disabled = playing;
    button.classList.toggle('is-selected', button.dataset.choice === selection);
  }
}

function renderRecords() {
  for (const [name, field] of Object.entries(counterFields)) {
    field.textContent = records[name];
  }

  const rate = records.total ? (records.win / records.total) * 100 : 0;
  rateText.textContent = rate.toFixed(1) + '%';
  rateBar.value = rate;
}

function play(userChoice) {
  if (pendingRound !== null) return;

  const computerChoice = moveNames[Math.floor(Math.random() * moveNames.length)];
  const userMove = moves[userChoice];
  const computerMove = moves[computerChoice];

  setPlaying(true, userChoice);
  showMove('user', userMove);
  showMove('computer');
  showOutcome();
  status.textContent = '컴퓨터가 손 모양을 고르는 중이에요…';

  pendingRound = window.setTimeout(() => {
    let outcome = 'draw';
    if (userChoice !== computerChoice) {
      outcome = userMove.beats === computerChoice ? 'win' : 'loss';
    }

    records.total += 1;
    records[outcome] += 1;
    records.current = outcome === 'win' ? records.current + 1 : 0;
    records.best = Math.max(records.current, records.best);

    showMove('computer', computerMove);
    showOutcome(outcome);
    renderRecords();
    status.textContent = `나 ${userMove.label}, 컴퓨터 ${computerMove.label}, ${messages[outcome]}!`;
    pendingRound = null;
    setPlaying(false, userChoice);
  }, 1000);
}

function resetGame() {
  if (pendingRound !== null) window.clearTimeout(pendingRound);
  pendingRound = null;
  records = { total: 0, win: 0, loss: 0, draw: 0, current: 0, best: 0 };

  showMove('user');
  showMove('computer');
  showOutcome();
  setPlaying(false);
  renderRecords();
  status.textContent = '손 모양을 골라 게임을 시작해요!';
}

for (const button of buttons) {
  button.addEventListener('click', () => play(button.dataset.choice));
}
document.querySelector('#reset').addEventListener('click', resetGame);
resetGame();
