// Math Adventure — no build tools, pure JS
const UNLOCK_TARGET = 7;
const storage = {
  get k(){ return 'math_adventure_v1'; },
  load(){ try { return JSON.parse(localStorage.getItem(this.k)) || {correct:0}; } catch { return {correct:0}; } },
  save(data){ localStorage.setItem(this.k, JSON.stringify(data)); }
};
let state = { problems: [], current:null, progress: storage.load() };

const els = {
  answer: document.getElementById('answer'),
  feedback: document.getElementById('feedback'),
  progress: document.getElementById('progress'),
  unlockTarget: document.getElementById('unlockTarget'),
  totalProblems: document.getElementById('totalProblems'),
  flash: document.getElementById('flash'),
  flashGrid: document.getElementById('flashGrid'),
};
els.unlockTarget.textContent = UNLOCK_TARGET;

function speak(text){
  if (!('speechSynthesis' in window)) return;
  const u = new SpeechSynthesisUtterance(text);
  window.speechSynthesis.speak(u);
}

async function loadProblems(){
  const res = await fetch('data/problems.json');
  const data = await res.json();
  state.problems = data.problems;
  els.totalProblems.textContent = state.problems.length;
}
function rand(arr){ return arr[Math.floor(Math.random()*arr.length)]; }

function newProblem(){
  state.current = rand(state.problems);
  els.feedback.textContent = '';
  els.answer.value = '';
  if(state.current.wording){ // word problem
    document.getElementById('btn-say').disabled = false;
    els.answer.placeholder = 'Type the answer';
  }else{
    document.getElementById('btn-say').disabled = false;
    els.answer.placeholder = 'Type the answer';
  }
  speak(problemText(state.current));
}

function problemText(p){
  return p.wording ?? `${p.a} ${p.op} ${p.b}`;
}

function checkAnswer(){
  if(!state.current) return;
  const given = els.answer.value.trim();
  if(given === '') return;
  const correct = String(state.current.answer);
  if (given === correct){
    state.progress.correct = (state.progress.correct || 0) + 1;
    storage.save(state.progress);
    els.feedback.textContent = '✅ Correct!';
    updateProgress();
    if (state.progress.correct >= UNLOCK_TARGET){
      showFlash();
    } else {
      newProblem();
    }
  } else {
    els.feedback.textContent = `❌ Not quite. Correct is ${correct}.`;
    newProblem();
  }
}

function updateProgress(){
  const c = state.progress.correct || 0;
  els.progress.textContent = `${Math.min(c, UNLOCK_TARGET)}/${UNLOCK_TARGET}`;
}

function resetProgress(){ state.progress.correct = 0; storage.save(state.progress); updateProgress(); }
function resetProblems(){ localStorage.removeItem(storage.k); resetProgress(); }

function showFlash(){
  document.getElementById('practice').classList.add('hidden');
  els.flash.classList.remove('hidden');
  els.flash.setAttribute('aria-hidden', 'false');
  buildFlashRound();
}

function buildFlashRound(){
  const pool = [...state.problems].sort(()=>Math.random()-0.5).slice(0,6);
  const tiles = [];
  pool.forEach(p => {
    tiles.push({type:'q', key:p.id, label: `${p.a} ${p.op} ${p.b}`});
    tiles.push({type:'a', key:p.id, label: String(p.answer)});
  });
  tiles.sort(()=>Math.random()-0.5);
  els.flashGrid.innerHTML = '';
  let first = null, matched = new Set();
  tiles.forEach((t, idx) => {
    const div = document.createElement('div');
    div.className = 'tile';
    div.textContent = t.label;
    div.dataset.key = t.key;
    div.addEventListener('click', () => {
      if (div.classList.contains('matched')) return;
      if (!first){ first = {div, t}; div.classList.add('selected'); return; }
      if (first.t.key === t.key && first.div !== div){
        first.div.classList.add('matched'); div.classList.add('matched');
        matched.add(t.key);
        if (matched.size === pool.length){
          speak('Great job! New round ready.');
        }
      }
      if (first) first.div.classList.remove('selected');
      first = null;
    });
    els.flashGrid.appendChild(div);
  });
}

// UI wiring
document.getElementById('btn-new').addEventListener('click', newProblem);
document.getElementById('btn-say').addEventListener('click', () => {
  if (state.current) speak(problemText(state.current));
});
document.getElementById('btn-check').addEventListener('click', checkAnswer);
document.getElementById('btn-reset-progress').addEventListener('click', resetProgress);
document.getElementById('btn-reset-problems').addEventListener('click', resetProblems);
document.getElementById('btn-flash-new').addEventListener('click', buildFlashRound);

// Tabs
document.getElementById('modeTabs').addEventListener('click', (e)=>{
  if(e.target.matches('.pill')){
    document.querySelectorAll('.pill').forEach(b=>b.classList.remove('active'));
    e.target.classList.add('active');
    const mode = e.target.dataset.mode;
    if(mode==='flash'){ showFlash(); }
    if(mode==='practice'){ document.getElementById('practice').classList.remove('hidden'); els.flash.classList.add('hidden'); }
  }
});

(async function init(){
  updateProgress();
  await loadProblems();
  newProblem();
})();