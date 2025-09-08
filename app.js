// Math Adventure — single-file app, runs in the browser without build tools
// Small, commented version: each line has a short, layman's explanation.

// How many correct answers the user must get to unlock the "flash" mode
const UNLOCK_TARGET = 7; // target number of correct answers to reach the reward

// Simple wrapper for saving/loading progress to localStorage
const storage = {
  // key used in localStorage so we can change it in one place
  get k(){ return 'math_adventure_v1'; },
  // load saved progress (or give a default if nothing is saved or parse fails)
  load(){ try { return JSON.parse(localStorage.getItem(this.k)) || {correct:0}; } catch { return {correct:0}; } },
  // save progress object as a JSON string
  save(data){ localStorage.setItem(this.k, JSON.stringify(data)); }
};

// In-memory app state: list of problems, the current problem, and progress
let state = { problems: [], current:null, progress: storage.load() };

// Cache commonly-used DOM elements so we don't query the page every time
const els = {
  answer: document.getElementById('answer'),         // input where user types answer
  feedback: document.getElementById('feedback'),     // short message area (correct/incorrect)
  progress: document.getElementById('progress'),     // shows "x / UNLOCK_TARGET"
  unlockTarget: document.getElementById('unlockTarget'), // displays the target number
  totalProblems: document.getElementById('totalProblems'), // displays how many problems available
  flash: document.getElementById('flash'),           // flash mode container
  flashGrid: document.getElementById('flashGrid'),   // grid used by the matching game
};

// show the unlock target number in the UI
els.unlockTarget.textContent = UNLOCK_TARGET;

// Speak the given text out loud if the browser supports it
function speak(text){
  if (!('speechSynthesis' in window)) return;               // stop if browser has no voice support
  const u = new SpeechSynthesisUtterance(text);            // create a speech item
  window.speechSynthesis.speak(u);                         // ask the browser to speak it
}

// Fetch the problem definitions from a local JSON file and store them
async function loadProblems(){
  const res = await fetch('data/problems.json');          // load the file over HTTP
  const data = await res.json();                          // parse JSON into an object
  state.problems = data.problems;                         // keep the list in memory
  els.totalProblems.textContent = state.problems.length;  // show total count in the UI
}

// Return a random element from an array
function rand(arr){ return arr[Math.floor(Math.random()*arr.length)]; }

// Pick a new problem and prepare the UI for the user to answer
function newProblem(){
  state.current = rand(state.problems);         // pick one problem at random
  els.feedback.textContent = '';                // clear any previous feedback
  els.answer.value = '';                        // clear the answer input box
  // If the problem has a wording field it's a word problem; placeholder is same either way
  if(state.current.wording){                    // word problem (has sentence text)
    document.getElementById('btn-say').disabled = false; // enable the "say" button
    els.answer.placeholder = 'Type the answer';
  }else{
    document.getElementById('btn-say').disabled = false; // normal numeric problem
    els.answer.placeholder = 'Type the answer';
  }
  speak(problemText(state.current));            // optionally read the problem aloud
}

// Turn a problem object into the text we show / speak
function problemText(p){
  // If there's a wording (sentence), use it; otherwise show the simple math expression
  return p.wording ?? `${p.a} ${p.op} ${p.b}`;
}

// Check the user's typed answer against the right answer
function checkAnswer(){
  if(!state.current) return;                      // nothing to check if no current problem
  const given = els.answer.value.trim();          // what the user typed, trimmed of extra spaces
  if(given === '') return;                        // ignore empty submissions
  const correct = String(state.current.answer);   // convert correct answer to string for comparison
  if (given === correct){                         // exact match = correct
    state.progress.correct = (state.progress.correct || 0) + 1; // increment saved correct count
    storage.save(state.progress);                 // persist progress to localStorage
    els.feedback.textContent = '✅ Correct!';     // show a friendly success message
    updateProgress();                             // update the progress display
    if (state.progress.correct >= UNLOCK_TARGET){ // if they reached the target
      showFlash();                                // reveal the bonus/matching game
    } else {
      newProblem();                               // otherwise give a fresh problem
    }
  } else {
    els.feedback.textContent = `❌ Not quite. Correct is ${correct}.`; // show correct answer
    newProblem();                                 // move on to the next problem
  }
}

// Update the small progress text (e.g. "3/7")
function updateProgress(){
  const c = state.progress.correct || 0;                      // guard if progress missing
  els.progress.textContent = `${Math.min(c, UNLOCK_TARGET)}/${UNLOCK_TARGET}`; // cap display at target
}

// Reset saved progress back to zero and update UI
function resetProgress(){ state.progress.correct = 0; storage.save(state.progress); updateProgress(); }
// Remove saved data entirely (clear localStorage key) and reset progress
function resetProblems(){ localStorage.removeItem(storage.k); resetProgress(); }

// Switch the UI from practice mode to the flash/matching game
function showFlash(){
  document.getElementById('practice').classList.add('hidden'); // hide practice area
  els.flash.classList.remove('hidden');                        // show flash area
  els.flash.setAttribute('aria-hidden', 'false');               // accessibility: mark visible
  buildFlashRound();                                            // build a fresh matching round
}

// Build one round of the flash/matching game (pairs of question/answer tiles)
function buildFlashRound(){
  const pool = [...state.problems].sort(()=>Math.random()-0.5).slice(0,6); // pick 6 random problems
  const tiles = [];                                // flat list of tiles (questions and answers)
  pool.forEach(p => {
    // push a tile for the question (shows expression) and a tile for the answer
    tiles.push({type:'q', key:p.id, label: `${p.a} ${p.op} ${p.b}`});
    tiles.push({type:'a', key:p.id, label: String(p.answer)});
  });
  tiles.sort(()=>Math.random()-0.5);               // shuffle all tiles
  els.flashGrid.innerHTML = '';                    // clear previous grid
  let first = null, matched = new Set();          // track currently selected tile and matched pairs
  tiles.forEach((t, idx) => {
    const div = document.createElement('div');    // make a DOM tile
    div.className = 'tile';                        // CSS class for style
    div.textContent = t.label;                     // show question or answer text
    div.dataset.key = t.key;                       // store the problem id so we can match pairs
    div.addEventListener('click', () => {          // what happens when user clicks a tile
      if (div.classList.contains('matched')) return; // ignore clicks on already-matched tiles
      if (!first){                                 // if this is the first tile in the pair
        first = {div, t};                          // remember it
        div.classList.add('selected');             // show selection visually
        return;
      }
      // if the second tile matches the first by problem id and is not the same tile
      if (first.t.key === t.key && first.div !== div){
        first.div.classList.add('matched'); div.classList.add('matched'); // mark both as matched
        matched.add(t.key);                        // remember the pair is complete
        if (matched.size === pool.length){        // all pairs matched
          speak('Great job! New round ready.');  // give spoken praise
        }
      }
      if (first) first.div.classList.remove('selected'); // clear visual selection
      first = null;                                // reset for next pair
    });
    els.flashGrid.appendChild(div);                // add tile to the grid in the DOM
  });
}

// ----- UI event wiring: connect buttons on the page to the functions above -----
document.getElementById('btn-new').addEventListener('click', newProblem); // new problem button
document.getElementById('btn-say').addEventListener('click', () => {        // re-speak current problem
  if (state.current) speak(problemText(state.current));
});
document.getElementById('btn-check').addEventListener('click', checkAnswer); // check answer button
document.getElementById('btn-reset-progress').addEventListener('click', resetProgress); // reset progress
document.getElementById('btn-reset-problems').addEventListener('click', resetProblems); // clear saved data
document.getElementById('btn-flash-new').addEventListener('click', buildFlashRound); // new flash round

// Tab switching between practice and flash modes
document.getElementById('modeTabs').addEventListener('click', (e)=>{
  if(e.target.matches('.pill')){                     // only react to clicks on tab buttons
    document.querySelectorAll('.pill').forEach(b=>b.classList.remove('active')); // clear old active state
    e.target.classList.add('active');              // mark clicked tab active
    const mode = e.target.dataset.mode;             // the tab has a data-mode attribute
    if(mode==='flash'){ showFlash(); }              // show flash mode
    if(mode==='practice'){                          // show practice mode
      document.getElementById('practice').classList.remove('hidden');
      els.flash.classList.add('hidden');
    }
  }
});

// Small startup routine: show progress, load problems, and pick the first problem
(async function init(){
  updateProgress();         // show saved progress right away
  await loadProblems();     // load problem list from the JSON file
  newProblem();             // start with a problem for the user
})();