(() => {
'use strict';

/* ---------- helpers ---------- */
const KEY = 'bjj-trainer-v1';
const DAYS = ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'];
const WEEK_ORDER = [1,2,3,4,5,6,0];
const uid = () => Math.random().toString(36).slice(2, 9);
const esc = s => String(s == null ? '' : s).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const pad = n => String(n).padStart(2, '0');
const dkey = d => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
const parse = k => { const [y, m, d] = k.split('-').map(Number); return new Date(y, m - 1, d); };
const addDays = (k, n) => { const d = parse(k); d.setDate(d.getDate() + n); return dkey(d); };
const today = () => dkey(new Date());
const clone = o => JSON.parse(JSON.stringify(o));
const fmt = k => parse(k).toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
const weekStart = k => { const d = parse(k); return addDays(k, -((d.getDay() + 6) % 7)); };
const daysBetween = (a, b) => Math.round((parse(b) - parse(a)) / 864e5);

/* ---------- default data (your preloaded plan) ---------- */
function defaults() {
  const it = o => Object.assign({ id: uid(), duration: '' }, o);
  const bjj = () => it({ type: 'bjj', label: 'Brazilian Jiu-Jitsu' });
  const str = w => it({ type: 'strength', label: 'Strength', workoutId: w, warm: true, stretch: true });
  const t = today();
  return {
    v: 1, created: t, lastSeen: t,
    schedule: {
      1: [bjj(), it({ type: 'cardio', label: 'Easy run/walk', duration: '20' })],
      2: [bjj(), str('A')],
      3: [bjj(), it({ type: 'cardio', label: 'Easy run/walk', duration: '20–25' })],
      4: [bjj(), str('B')],
      5: [it({ type: 'cardio', label: 'Incline treadmill walk', duration: '25–35' })],
      6: [str('C')],
      0: [it({ type: 'recovery', label: 'Recovery' }), it({ type: 'mobility', label: 'Mobility and stretching', routine: 'both' })]
    },
    workouts: {
      A: { id: 'A', name: 'Strength A', subtitle: 'Lower Body & Core', rounds: 2,
        rest: 'Rest 30–45 sec between exercises, 60–90 sec between rounds.',
        exercises: [
          { id: 'A1', name: 'Goblet squats', reps: '10', instructions: 'Hold a dumbbell or kettlebell at your chest. Sit down between your hips, keep your chest tall and drive up through the whole foot.' },
          { id: 'A2', name: 'Single-leg Romanian deadlifts', reps: '8/leg', instructions: 'Soft knee on the standing leg. Hinge at the hip while the back leg reaches long, hips square to the floor. Go light and slow.' },
          { id: 'A3', name: 'Lateral band walks', reps: '10 steps/direction', instructions: 'Band just above the knees, slight squat, toes forward. Step wide without leaning or letting the knees cave in.' },
          { id: 'A4', name: 'Dead bugs', reps: '10/side', instructions: 'On your back, low back flat. Lower the opposite arm and leg slowly, exhale as you go, return and switch sides.' },
          { id: 'A5', name: 'Farmer carries', reps: '30 sec', instructions: 'Hold a weight in each hand. Walk tall with shoulders down and back and a firm grip. Do not lean.' }
        ] },
      B: { id: 'B', name: 'Strength B', subtitle: 'Upper Body & Stability', rounds: 2,
        rest: 'Rest 30–45 sec between exercises, 60–90 sec between rounds.',
        exercises: [
          { id: 'B1', name: 'Single-arm rows', reps: '10/side', instructions: 'One hand on a bench, flat back. Pull the elbow toward your hip without twisting, lower under control.' },
          { id: 'B2', name: 'Incline push-ups', reps: '10', instructions: 'Hands on a bench or counter, body in one straight line. Lower the chest to the edge, press back up.' },
          { id: 'B3', name: 'Pallof presses', reps: '10/side', instructions: 'Band anchored at your side, hold at chest. Press straight out and resist the band trying to rotate you.' },
          { id: 'B4', name: 'Side planks', reps: '25 sec/side', instructions: 'Forearm under shoulder, hips lifted, body in a line. Breathe steadily.' },
          { id: 'B5', name: 'Band external rotations', reps: '12', instructions: 'Elbow tucked at your side bent to 90°. Rotate the forearm outward, slow return. Light band.' }
        ] },
      C: { id: 'C', name: 'Strength C', subtitle: 'Grip, Movement & BJJ Support', rounds: 2,
        rest: 'Rest 30–45 sec between exercises, 60–90 sec between rounds.',
        exercises: [
          { id: 'C1', name: 'Towel grip holds', reps: '20–30 sec', instructions: 'Hang from a bar by a towel (or pull a towel taut between your hands) and hold. Keep shoulders packed.' },
          { id: 'C2', name: 'Glute bridge marches', reps: '10/side', instructions: 'In a glute bridge, lift one knee at a time without letting the hips drop or rotate.' },
          { id: 'C3', name: 'Bear crawls', reps: '20–30 sec', instructions: 'Hands and toes, knees an inch off the floor. Crawl with small controlled steps, back flat.' },
          { id: 'C4', name: 'Band face pulls', reps: '12', instructions: 'Band at face height. Pull toward your forehead with elbows high, squeeze the shoulder blades.' },
          { id: 'C5', name: 'Suitcase carries', reps: '30 sec/side', instructions: 'One weight in one hand. Walk tall without leaning toward the weight.' }
        ] }
    },
    warmups: [
      { id: 'w1', name: 'Hip mobility (90/90 switches)', duration: '8 each side', instructions: 'Sit with both knees bent 90°, then rotate your knees side to side, keeping your chest tall.' },
      { id: 'w2', name: 'Leg swings', duration: '10 per leg, each direction', instructions: 'Hold a wall. Swing the leg forward/back, then side to side. Increase range gradually.' },
      { id: 'w3', name: 'Arm circles', duration: '10 each direction', instructions: 'Start small and grow the circles. Keep shoulders relaxed.' },
      { id: 'w4', name: 'Thoracic rotations', duration: '8 per side', instructions: 'On hands and knees, hand behind your head. Rotate your elbow toward the ceiling, then under your body.' },
      { id: 'w5', name: 'Dynamic lunges', duration: '6 per leg', instructions: 'Step into a lunge and twist toward the front leg. Push back to standing.' },
      { id: 'w6', name: 'Movement preparation', duration: '1–2 min', instructions: 'Bodyweight squats, hip escapes and a few light bridges so the movements feel smooth before you load them.' }
    ],
    stretches: [
      { id: 's1', name: 'Hip flexors (half-kneeling)', duration: '30 sec per side', instructions: 'Half-kneeling, tuck the pelvis and shift forward until you feel the front of the back hip stretch.' },
      { id: 's2', name: 'Hamstrings', duration: '30 sec per side', instructions: 'Heel forward on a low step or the floor, hinge with a flat back.' },
      { id: 's3', name: 'Glutes (figure-4)', duration: '30 sec per side', instructions: 'On your back, ankle over the opposite knee, pull the thigh toward your chest.' },
      { id: 's4', name: 'Adductors (frog)', duration: '30–40 sec', instructions: 'On hands and knees, widen the knees and sit your hips back gently.' },
      { id: 's5', name: 'Shoulders (cross-body)', duration: '30 sec per side', instructions: 'Pull one arm across your chest with the other. Keep shoulders down.' },
      { id: 's6', name: 'Back (child’s pose)', duration: '40 sec', instructions: 'Sit your hips back toward your heels, arms long, breathe into your back.' }
    ],
    logs: {},
    progression: { start: t, level: 0, reviews: [] }
  };
}

/* ---------- state ---------- */
let S;
function load() {
  const d = defaults();
  try {
    const raw = localStorage.getItem(KEY);
    if (raw) { const p = JSON.parse(raw); S = Object.assign(d, p); return; }
  } catch (e) { /* fall through */ }
  S = d;
}
function save() { try { localStorage.setItem(KEY, JSON.stringify(S)); } catch (e) { /* storage full or blocked */ } }
const ui = { tab: 'today', date: today(), sheet: null, adjust: false, wtab: 'strength', edit: {}, checkin: false };

const TEMPLATES = {
  bjj: ['Brazilian Jiu-Jitsu', () => ({ type: 'bjj', label: 'Brazilian Jiu-Jitsu' })],
  openmat: ['Open mat', () => ({ type: 'bjj', label: 'Open mat' })],
  run: ['Easy run/walk', () => ({ type: 'cardio', label: 'Easy run/walk', duration: '20' })],
  incline: ['Incline treadmill walk', () => ({ type: 'cardio', label: 'Incline treadmill walk', duration: '30' })],
  strength: ['Strength workout', () => ({ type: 'strength', label: 'Strength', workoutId: Object.keys(S.workouts)[0] || '', warm: true, stretch: true })],
  mobility: ['Mobility and stretching', () => ({ type: 'mobility', label: 'Mobility and stretching', routine: 'both' })],
  recovery: ['Recovery', () => ({ type: 'recovery', label: 'Recovery' })]
};
const mkItem = tk => Object.assign({ id: uid(), duration: '' }, TEMPLATES[tk][1]());
const templateOptions = () => Object.keys(TEMPLATES).map(k => `<option value="${k}">${esc(TEMPLATES[k][0])}</option>`).join('');

/* ---------- plans and logs ---------- */
function planFor(k) {
  const l = S.logs[k];
  if (l && l.items) return l.items;
  return clone(S.schedule[parse(k).getDay()] || []);
}
function ensureLog(k) {
  if (!S.logs[k]) S.logs[k] = { items: clone(planFor(k)), done: {}, sets: {}, detail: {}, notes: '', checkin: null };
  const l = S.logs[k];
  l.done = l.done || {}; l.sets = l.sets || {}; l.detail = l.detail || {};
  return l;
}
function freeze() {
  const t = today(); let k = S.lastSeen || t, guard = 0;
  while (k < t && guard++ < 800) {
    if (!S.logs[k] && k >= S.created) S.logs[k] = { items: clone(planFor(k)), done: {}, sets: {}, detail: {}, notes: '', checkin: null };
    k = addDays(k, 1);
  }
  S.lastSeen = t; save();
}
function entries(items) {
  const out = [];
  items.forEach(item => {
    if (item.type === 'strength') {
      if (item.warm !== false) out.push({ key: item.id + ':warm', item, kind: 'warm' });
      out.push({ key: item.id, item, kind: 'main' });
      if (item.stretch !== false) out.push({ key: item.id + ':stretch', item, kind: 'stretch' });
    } else out.push({ key: item.id, item, kind: 'main' });
  });
  return out;
}
function entryText(e) {
  const it = e.item;
  if (e.kind === 'warm') return ['Dynamic warm-up', 'Movement preparation'];
  if (e.kind === 'stretch') return ['Static stretching', 'Start at 20–40 sec per stretch'];
  if (it.type === 'strength') {
    const w = S.workouts[it.workoutId];
    return w ? [`${w.name} — ${w.rounds} round${w.rounds == 1 ? '' : 's'}`, w.subtitle] : [it.label, 'Workout not found'];
  }
  if (it.type === 'cardio' || it.type === 'bjj') return [it.label, it.duration ? it.duration + ' min' : ''];
  if (it.type === 'recovery') return [it.label, 'Take it easy today'];
  return [it.label, ''];
}
function lastSet(exId, before) {
  const ks = Object.keys(S.logs).filter(k => k < before).sort().reverse();
  for (const k of ks) {
    const s = S.logs[k].sets && S.logs[k].sets[exId];
    if (s && (s.w || s.r)) return { k, s };
  }
  return null;
}

/* ---------- recovery check-in ---------- */
const SORE = ['None/normal', 'Mild', 'Moderate', 'High'];
const FAT = ['Normal', 'Somewhat tired', 'Very fatigued'];
function advice(c) {
  if (!c || c.s == null || c.f == null) return null;
  const s = c.s, f = c.f;
  if (s === 3 || f === 2) return { title: 'Prioritize recovery', tips: ['Keep BJJ technical and light. Skip hard live rounds.', 'Cut strength to one round, or swap it for mobility.', 'Make conditioning an easy walk, or skip it.', 'Prioritize sleep, food and water.'] };
  if (s === 2 || (f === 1 && s >= 1)) return { title: 'Dial it back a little', tips: ['Reduce strength volume (for example, one round fewer).', 'Keep conditioning easy.', 'Favor technical BJJ over hard live rounds.'] };
  if (s === 1 || f === 1) return { title: 'Mostly normal', tips: ['Follow your plan with controlled technique.', 'Keep conditioning easy.'] };
  return { title: 'Follow your normal training plan', tips: ['You are feeling good. Train as scheduled.'] };
}

/* ---------- progression ---------- */
const PHASES = [
  { name: 'Foundation', weeks: '1–4', text: 'Build consistency, learn the movements and establish baseline resistance and reps. Start with 2 rounds, keep technique controlled and conditioning mostly easy.' },
  { name: 'Build', weeks: '5–8', text: 'Gradually increase resistance or reps when appropriate. Improve grip endurance, core stability and movement control.' },
  { name: 'Advance', weeks: '9–12', text: 'Consider further resistance increases and harder variations such as reverse lunges or hanging knee raises.' }
];
const weekIdx = () => { const d = daysBetween(S.progression.start, today()); return d < 0 ? 0 : Math.floor(d / 7); };
function pendingReview() {
  const w = weekIdx();
  for (let b = 0; b <= Math.floor(w / 4); b++) {
    if (w >= 4 * b + 3 && !S.progression.reviews.some(r => r.block === b)) return b;
  }
  return null;
}
function reviewOptions(choice) {
  if (choice === 'maintain') return [];
  if (choice === 'scale') return [
    { id: 'repsDown', label: 'Reduce reps by 2 on rep-based exercises' },
    { id: 'roundsDown', label: 'Drop one round (minimum 1) on each strength workout' }
  ];
  const nl = S.progression.level + 1;
  const o = [{ id: 'repsUp', label: 'Add 2 reps to rep-based exercises (or add a little resistance instead)' }];
  if (nl === 1) o.push({ id: 'roundsUp', label: 'Add a third round to each strength workout' });
  if (nl >= 2) {
    o.push({ id: 'revLunge', label: 'Add reverse lunges (8/leg) to Strength A' });
    o.push({ id: 'hkr', label: 'Add hanging knee raises (8) to Strength C' });
  }
  return o;
}
function bumpReps(d) {
  Object.values(S.workouts).forEach(w => w.exercises.forEach(e => {
    if (/sec/i.test(e.reps)) return;
    const m = String(e.reps).match(/^(\d+)(.*)$/);
    if (m) e.reps = Math.max(1, +m[1] + d) + m[2];
  }));
}
function bumpRounds(d, min, max) { Object.values(S.workouts).forEach(w => { w.rounds = Math.min(max, Math.max(min, (+w.rounds || 1) + d)); }); }
function addEx(wid, name, reps, instr) {
  const w = S.workouts[wid]; if (!w || w.exercises.some(e => e.name === name)) return;
  w.exercises.push({ id: uid(), name, reps, instructions: instr });
}
function applyOpt(id) {
  if (id === 'repsUp') bumpReps(2);
  if (id === 'repsDown') bumpReps(-2);
  if (id === 'roundsUp') bumpRounds(1, 1, 3);
  if (id === 'roundsDown') bumpRounds(-1, 1, 3);
  if (id === 'revLunge') addEx('A', 'Reverse lunges', '8/leg', 'Step back into a lunge, back knee toward the floor, drive through the front heel to stand. Keep your torso tall.');
  if (id === 'hkr') addEx('C', 'Hanging knee raises', '8', 'Hang from a bar with shoulders engaged. Lift the knees toward your chest without swinging, lower slowly.');
}

/* ---------- stats ---------- */
function statsFor(a, b) {
  let planned = 0, done = 0;
  const t = { bjj: [0, 0], strength: [0, 0], cardio: [0, 0], mobility: [0, 0] };
  const td = today();
  for (let k = a; k <= b && k <= td; k = addDays(k, 1)) {
    if (k < S.created) continue;
    const items = planFor(k), log = S.logs[k];
    entries(items).forEach(e => { planned++; if (log && log.done[e.key]) done++; });
    items.forEach(it => { if (t[it.type]) { t[it.type][1]++; if (log && log.done[it.id]) t[it.type][0]++; } });
  }
  return { planned, done, pct: planned ? Math.round(done / planned * 100) : 0, t };
}
function minutesFor(a, b, type) {
  let m = 0;
  for (let k = a; k <= b; k = addDays(k, 1)) {
    const l = S.logs[k]; if (!l) continue;
    (l.items || []).forEach(it => { if (it.type === type && l.done[it.id]) { const d = parseFloat(l.detail[it.id] && l.detail[it.id].duration); if (d) m += d; } });
  }
  return m;
}

/* ---------- views ---------- */
function viewToday() {
  const k = ui.date, log = S.logs[k], items = planFor(k), es = entries(items), done = log ? log.done : {};
  const n = es.filter(e => done[e.key]).length, tot = es.length;
  const isToday = k === today();
  const pend = pendingReview();
  const c = log ? log.checkin : null, adv = advice(c);
  let h = `<div class="date-nav"><button data-act="prevDay">‹</button><div class="mid"><b>${isToday ? 'Today' : esc(DAYS[parse(k).getDay()])}</b><span class="muted">${esc(DAYS[parse(k).getDay()])}, ${esc(fmt(k))}</span></div><button data-act="nextDay">›</button></div>`;
  if (!isToday) h += `<div class="row" style="margin-bottom:8px"><button class="small" data-act="goToday">Back to today</button></div>`;
  if (pend !== null && isToday) h += `<div class="banner"><b>Progression review ready</b><p class="muted">You’ve reached the end of a four-week block. Nothing changes unless you choose it.</p><button class="small" data-act="tab" data-tab="progression">Open review</button></div>`;
  h += `<div class="card"><div class="row sp"><b>Daily completion</b><span class="pill">${n}/${tot}</span></div><div class="bar" style="margin-top:8px"><i style="width:${tot ? Math.round(n / tot * 100) : 0}%"></i></div>`;
  if (!es.length) h += `<p class="muted" style="margin-top:10px">Nothing scheduled. Enjoy the rest day or add something below.</p>`;
  else h += `<div style="margin-top:6px">` + es.map(e => {
    const [t1, t2] = entryText(e), on = !!done[e.key];
    const canOpen = e.item.type !== 'recovery';
    return `<div class="chk ${on ? 'done' : ''}"><button class="box ${on ? 'on' : ''}" data-act="toggle" data-key="${esc(e.key)}" aria-label="Toggle">${on ? '✓' : ''}</button>
      <button class="txt" ${canOpen ? `data-act="open" data-key="${esc(e.key)}"` : `data-act="toggle" data-key="${esc(e.key)}"`}><b>${esc(t1)}</b><span class="hint">${esc(t2)}</span></button>
      ${canOpen ? `<span class="muted">›</span>` : ''}
      ${ui.adjust && e.kind === 'main' ? `<button class="small danger" data-act="rmItem" data-id="${esc(e.item.id)}">✕</button>` : ''}</div>`;
  }).join('') + `</div>`;
  h += `</div>`;
  h += `<div class="row" style="margin:8px 0"><button class="small" data-act="adjust">${ui.adjust ? 'Done adjusting' : 'Adjust this day'}</button></div>`;
  if (ui.adjust) h += `<div class="card"><p class="hint">Changes here affect only this day, not your weekly schedule.</p><div class="row"><select id="addSel">${templateOptions()}</select><button class="primary small" data-act="addToday">Add</button></div></div>`;
  h += `<div class="card"><label>Notes (optional): energy, recovery, performance<textarea id="notes" placeholder="How did training go?">${esc(log ? log.notes : '')}</textarea></label></div>`;
  h += `<div class="card"><div class="row sp"><b>Recovery check-in</b><button class="small ghost" data-act="toggleCheckin">${ui.checkin || c ? 'Hide' : 'Optional'}</button></div>`;
  if (ui.checkin || c) {
    h += `<p class="hint" style="margin-top:6px">Soreness</p><div class="chips">${SORE.map((s, i) => `<button class="chip ${c && c.s === i ? 'on' : ''}" data-act="checkin" data-f="s" data-v="${i}">${s}</button>`).join('')}</div>`;
    h += `<p class="hint">Fatigue</p><div class="chips">${FAT.map((s, i) => `<button class="chip ${c && c.f === i ? 'on' : ''}" data-act="checkin" data-f="f" data-v="${i}">${s}</button>`).join('')}</div>`;
    if (adv) h += `<div class="tip"><b>${esc(adv.title)}</b><ul>${adv.tips.map(t => `<li>${esc(t)}</li>`).join('')}</ul><p class="hint">Suggestions only. Your schedule and workouts are unchanged.</p></div>`;
    if (c) h += `<div class="row" style="margin-top:8px"><button class="small ghost" data-act="clearCheckin">Clear check-in</button></div>`;
  }
  h += `</div>`;
  return h;
}

function routineHTML(list, title) {
  return `<h2>${esc(title)}</h2>` + list.map(m => `<div class="ex"><div class="ex-h"><b>${esc(m.name)}</b><span class="pill">${esc(m.duration)}</span></div><p>${esc(m.instructions)}</p></div>`).join('');
}
function sheetHTML() {
  const sh = ui.sheet; if (!sh) return '';
  if (sh.type === 'review') return reviewSheet(sh.choice);
  const k = sh.k, log = S.logs[k], items = planFor(k);
  const e = entries(items).find(x => x.key === sh.key);
  if (!e) return '';
  const on = !!(log && log.done[e.key]);
  const it = e.item;
  let body = '', title = entryText(e)[0];
  if (e.kind === 'warm') body = routineHTML(S.warmups, 'Dynamic warm-up');
  else if (e.kind === 'stretch') body = routineHTML(S.stretches, 'Static stretching');
  else if (it.type === 'strength') {
    const w = S.workouts[it.workoutId];
    if (!w) body = '<p class="muted">This workout was deleted. Pick another in the Schedule tab.</p>';
    else {
      body = `<p class="muted">${esc(w.subtitle)} · ${w.rounds} round${w.rounds == 1 ? '' : 's'}</p><p class="hint">${esc(w.rest)}</p>` +
        w.exercises.map(x => {
          const cur = (log && log.sets[x.id]) || {}, last = lastSet(x.id, k);
          return `<div class="ex"><div class="ex-h"><b>${esc(x.name)}</b><span class="pill">${esc(x.reps)}</span></div><p>${esc(x.instructions)}</p>
            <div class="grid2"><label>Weight / resistance<input data-set="${esc(x.id)}" data-name="${esc(x.name)}" data-f="w" value="${esc(cur.w || '')}" placeholder="e.g. 25 lb"></label>
            <label>Reps done<input data-set="${esc(x.id)}" data-name="${esc(x.name)}" data-f="r" value="${esc(cur.r || '')}" placeholder="e.g. 10"></label></div>
            ${last ? `<p class="hint">Last (${esc(fmt(last.k))}): ${esc(last.s.w || '–')} × ${esc(last.s.r || '–')}</p>` : ''}</div>`;
        }).join('');
    }
  } else if (it.type === 'mobility') {
    body = routineHTML(S.warmups, 'Dynamic mobility') + routineHTML(S.stretches, 'Static stretching');
  } else {
    const d = (log && log.detail[e.key]) || {};
    body = `<div class="grid2"><label>Duration (min)<input type="number" inputmode="decimal" data-detail="${esc(e.key)}" data-f="duration" value="${esc(d.duration || '')}" placeholder="${esc(it.duration || '')}"></label>
      <label>Intensity / feel<input data-detail="${esc(e.key)}" data-f="note" value="${esc(d.note || '')}" placeholder="e.g. light, drilling"></label></div>`;
  }
  return `<div class="bg" data-act="closeBg"><div class="panel"><div class="panel-h"><h2 style="margin:0">${esc(title)}</h2><button class="small" data-act="close">Close</button></div>${body}
    <div class="row" style="margin-top:14px"><button class="primary" data-act="toggleClose" data-key="${esc(e.key)}">${on ? 'Mark not complete' : 'Mark complete'}</button></div></div></div>`;
}
function reviewSheet(choice) {
  const names = { progress: 'Progress', maintain: 'Maintain', scale: 'Scale back' };
  const opts = reviewOptions(choice);
  let msg = choice === 'progress' ? 'Choose which suggested changes to apply. Anything you leave unchecked stays as it is.'
    : choice === 'maintain' ? 'Your training stays exactly as it is for the next four weeks.' : 'Choose how to reduce your workload.';
  return `<div class="bg" data-act="closeBg"><div class="panel"><div class="panel-h"><h2 style="margin:0">${names[choice]}</h2><button class="small" data-act="close">Cancel</button></div>
    <p class="muted">${msg}</p>
    ${opts.map(o => `<label class="inline" style="padding:8px 0;color:var(--text);font-size:15px"><input type="checkbox" class="opt" value="${o.id}" checked> ${esc(o.label)}</label>`).join('')}
    ${choice === 'progress' ? '<p class="hint">Resistance is up to you. Raise weights or bands in the Workouts tab or when you log.</p>' : ''}
    <div class="row" style="margin-top:14px"><button class="primary" data-act="confirmReview" data-choice="${choice}">Confirm</button></div></div></div>`;
}

function viewSchedule() {
  let h = `<p class="hint">Edits apply to upcoming days. Days you have already logged keep their original plan, so your history stays intact.</p>`;
  WEEK_ORDER.forEach(d => {
    const items = S.schedule[d] || [];
    h += `<div class="card"><h3>${DAYS[d]}</h3>`;
    if (!items.length) h += `<p class="muted">Rest day</p>`;
    items.forEach((it, i) => {
      const p = `schedule.${d}.${i}`;
      h += `<div class="ex"><div class="row"><input data-path="${p}.label" value="${esc(it.label)}"><input class="sm" data-path="${p}.duration" value="${esc(it.duration || '')}" placeholder="min"></div>`;
      if (it.type === 'strength') {
        h += `<div class="row" style="margin-top:6px"><select data-path="${p}.workoutId">${Object.values(S.workouts).map(w => `<option value="${esc(w.id)}" ${w.id === it.workoutId ? 'selected' : ''}>${esc(w.name)} — ${esc(w.subtitle)}</option>`).join('')}</select></div>
          <div class="row" style="margin-top:6px"><label class="inline"><input type="checkbox" data-path="${p}.warm" ${it.warm !== false ? 'checked' : ''}> Warm-up</label><label class="inline"><input type="checkbox" data-path="${p}.stretch" ${it.stretch !== false ? 'checked' : ''}> Stretching</label></div>`;
      }
      h += `<div class="row" style="margin-top:6px"><select data-move="${d}.${i}"><option value="">Move to…</option>${WEEK_ORDER.filter(x => x !== d).map(x => `<option value="${x}">${DAYS[x]}</option>`).join('')}</select><button class="small danger" data-act="delItem" data-day="${d}" data-idx="${i}">Remove</button></div></div>`;
    });
    h += `<div class="row" style="margin-top:8px"><select id="add${d}">${templateOptions()}</select><button class="small primary" data-act="addItem" data-day="${d}">Add</button></div></div>`;
  });
  return h;
}

function viewWorkouts() {
  const tabs = [['strength', 'Strength'], ['warm', 'Warm-ups'], ['stretch', 'Stretching']];
  let h = `<div class="tabs">${tabs.map(([k, l]) => `<button class="${ui.wtab === k ? 'on' : ''}" data-act="wtab" data-t="${k}">${l}</button>`).join('')}</div>`;
  if (ui.wtab === 'strength') {
    Object.values(S.workouts).forEach(w => {
      const ed = ui.edit[w.id], p = `workouts.${w.id}`;
      h += `<div class="card"><div class="card-h"><div>${ed ? '' : `<h3>${esc(w.name)}</h3><p class="muted">${esc(w.subtitle)} · ${w.rounds} round${w.rounds == 1 ? '' : 's'}</p>`}</div><button class="small" data-act="editW" data-id="${esc(w.id)}">${ed ? 'Done' : 'Edit'}</button></div>`;
      if (!ed) {
        h += `<p class="hint">${esc(w.rest)}</p>` + w.exercises.map(x => `<div class="ex"><div class="ex-h"><b>${esc(x.name)}</b><span class="pill">${esc(x.reps)}</span></div><p>${esc(x.instructions)}</p></div>`).join('');
      } else {
        h += `<label>Name<input data-path="${p}.name" value="${esc(w.name)}"></label><label>Focus<input data-path="${p}.subtitle" value="${esc(w.subtitle)}"></label>
          <label>Rounds<input type="number" min="1" data-num data-path="${p}.rounds" value="${w.rounds}"></label><label>Rest guidance<input data-path="${p}.rest" value="${esc(w.rest)}"></label>`;
        w.exercises.forEach((x, i) => {
          h += `<div class="ex"><div class="row"><input data-path="${p}.exercises.${i}.name" value="${esc(x.name)}"><input class="sm" data-path="${p}.exercises.${i}.reps" value="${esc(x.reps)}"></div>
            <textarea data-path="${p}.exercises.${i}.instructions">${esc(x.instructions)}</textarea><button class="small danger" data-act="delEx" data-w="${esc(w.id)}" data-i="${i}">Remove exercise</button></div>`;
        });
        h += `<div class="row" style="margin-top:8px"><button class="small" data-act="addEx" data-w="${esc(w.id)}">+ Exercise</button><button class="small danger" data-act="delW" data-id="${esc(w.id)}">Delete workout</button></div>`;
      }
      h += `</div>`;
    });
    h += `<button data-act="newW">+ New workout</button>`;
  } else {
    const key = ui.wtab === 'warm' ? 'warmups' : 'stretches', list = S[key], ed = ui.edit[key];
    h += `<div class="row sp"><p class="hint">Add these to individual workouts or do them on their own.</p><button class="small" data-act="editList" data-l="${key}">${ed ? 'Done' : 'Edit'}</button></div>`;
    list.forEach((m, i) => {
      h += `<div class="card">`;
      if (!ed) h += `<div class="ex-h"><b>${esc(m.name)}</b><span class="pill">${esc(m.duration)}</span></div><p class="muted">${esc(m.instructions)}</p>`;
      else h += `<input data-path="${key}.${i}.name" value="${esc(m.name)}"><div style="height:6px"></div><input data-path="${key}.${i}.duration" value="${esc(m.duration)}" placeholder="Duration"><div style="height:6px"></div><textarea data-path="${key}.${i}.instructions">${esc(m.instructions)}</textarea><button class="small danger" data-act="delMob" data-l="${key}" data-i="${i}">Remove</button>`;
      h += `</div>`;
    });
    if (ed) h += `<button data-act="addMob" data-l="${key}">+ Add movement</button>`;
  }
  return h;
}

function viewProgression() {
  const w = weekIdx(), b = Math.floor(w / 4), P = S.progression, pend = pendingReview();
  const lvlName = ['Foundation', 'Build', 'Advance'][Math.min(P.level, 2)] + (P.level > 2 ? '+' : '');
  const ph = PHASES[Math.min(b, 2)];
  let h = `<div class="card"><div class="row sp"><div><h3>Week ${w + 1}</h3><p class="muted">${w >= 12 ? 'Beyond the 12-week plan' : esc(ph.name) + ' phase · weeks ' + ph.weeks}</p></div><span class="pill">Level: ${esc(lvlName)}</span></div>
    <div class="weeks" style="margin-top:10px">${Array.from({ length: 12 }, (_, i) => {
      const rev = i % 4 === 3 && P.reviews.some(r => r.block === Math.floor(i / 4));
      return `<div class="wk ${i === w ? 'cur' : i < w ? 'past' : ''}">Wk ${i + 1}${rev ? ' ✓' : i % 4 === 3 ? ' ⟳' : ''}</div>`;
    }).join('')}</div><p class="hint">⟳ = four-week review · ✓ = reviewed</p>
    <label style="margin-top:8px">Program start date<input type="date" data-startdate value="${esc(P.start)}"></label></div>`;
  h += PHASES.map((p, i) => `<div class="card" ${i === Math.min(b, 2) ? 'style="border-color:var(--accent)"' : ''}><b>${p.name}</b> <span class="muted">· weeks ${p.weeks}</span><p class="muted">${p.text}</p></div>`).join('');
  const st = statsFor(addDays(today(), -27), today());
  let hard = 0, chk = 0;
  for (let i = 0; i < 28; i++) { const l = S.logs[addDays(today(), -i)]; if (l && l.checkin && l.checkin.s != null) { chk++; if (l.checkin.s >= 2 || l.checkin.f === 2) hard++; } }
  h += `<h2>Four-week review ${pend !== null ? '<span class="pill warn">due</span>' : ''}</h2><div class="card"><p class="hint">Look at the last 28 days:</p>
    <div class="hrow"><span class="l">Completion</span><div class="bar"><i style="width:${st.pct}%"></i></div><span class="r">${st.pct}%</span></div>
    <p>• Completing workouts consistently? Strength ${st.t.strength[0]}/${st.t.strength[1]}, BJJ ${st.t.bjj[0]}/${st.t.bjj[1]}.</p>
    <p>• Are exercises becoming easier? Check your logged weights and reps in Progress.</p>
    <p>• Recovering between BJJ sessions? ${chk ? `${hard} of ${chk} check-ins showed high soreness or heavy fatigue.` : 'No check-ins logged (they are optional).'}</p>
    <p>• Is your energy and performance holding steady?</p>
    <div class="row" style="margin-top:12px"><button class="primary" data-act="review" data-choice="progress">Progress</button><button data-act="review" data-choice="maintain">Maintain</button><button data-act="review" data-choice="scale">Scale back</button></div>
    <p class="hint" style="margin-top:8px">The app never increases your training load on its own.</p></div>`;
  if (P.reviews.length) h += `<h2>Review history</h2>` + P.reviews.slice().reverse().map(r => `<div class="card"><b>${{ progress: 'Progressed', maintain: 'Maintained', scale: 'Scaled back' }[r.choice]}</b> <span class="muted">· ${esc(fmt(r.date))} · block ${r.block + 1}</span></div>`).join('');
  return h;
}

function viewProgress() {
  const td = today(), ws = weekStart(td), ms = td.slice(0, 8) + '01';
  const sw = statsFor(ws, td), sm = statsFor(ms, td);
  const card = (title, s, a) => `<div class="card"><b>${title}</b><div class="grid2" style="margin-top:8px"><div class="stat"><b>${s.t.bjj[0]}</b><span class="hint">BJJ sessions</span></div><div class="stat"><b>${s.t.strength[0]}</b><span class="hint">Strength</span></div><div class="stat"><b>${s.t.cardio[0]}</b><span class="hint">Run / walk</span></div><div class="stat"><b>${s.pct}%</b><span class="hint">Completion</span></div></div>
    <p class="hint" style="margin-top:6px">${minutesFor(a, td, 'bjj') ? 'BJJ logged: ' + minutesFor(a, td, 'bjj') + ' min. ' : ''}${minutesFor(a, td, 'cardio') ? 'Cardio logged: ' + minutesFor(a, td, 'cardio') + ' min.' : ''}</p></div>`;
  let h = card('This week', sw, ws) + card('This month', sm, ms);
  h += `<h2>Last 8 weeks</h2><div class="card">` + Array.from({ length: 8 }, (_, i) => {
    const a = addDays(ws, -7 * i), s = statsFor(a, addDays(a, 6));
    return `<div class="hrow"><span class="l">${esc(fmt(a))}</span><div class="bar"><i style="width:${s.pct}%"></i></div><span class="r">${s.planned ? s.pct + '%' : '–'}</span></div>`;
  }).join('') + `</div>`;
  const map = {};
  Object.keys(S.logs).sort().forEach(k => {
    const sets = S.logs[k].sets || {};
    Object.keys(sets).forEach(id => { const s = sets[id]; if (!s.w && !s.r) return; (map[s.name || id] = map[s.name || id] || []).push({ k, w: s.w, r: s.r }); });
  });
  const names = Object.keys(map).sort();
  h += `<h2>Strength improvements</h2><div class="card">`;
  if (!names.length) h += `<p class="muted">Log weights and reps inside a strength workout and your trends show up here.</p>`;
  names.forEach(n => {
    const a = map[n][0], z = map[n][map[n].length - 1];
    h += `<div class="ex-h" style="padding:6px 0"><b>${esc(n)}</b><span class="muted">${esc(a.w || '–')} → ${esc(z.w || '–')} <span class="hint">(${map[n].length} logs)</span></span></div>`;
  });
  h += `</div>`;
  const notes = Object.keys(S.logs).filter(k => S.logs[k].notes || (S.logs[k].checkin && S.logs[k].checkin.s != null)).sort().reverse().slice(0, 10);
  h += `<h2>Recent notes</h2>`;
  if (!notes.length) h += `<div class="card"><p class="muted">Notes and check-ins will appear here.</p></div>`;
  notes.forEach(k => {
    const l = S.logs[k], c = l.checkin;
    h += `<div class="card"><b>${esc(DAYS[parse(k).getDay()])}, ${esc(fmt(k))}</b>${c && c.s != null ? `<p class="hint">Soreness: ${SORE[c.s]} · Fatigue: ${c.f != null ? FAT[c.f] : '–'}</p>` : ''}${l.notes ? `<p>${esc(l.notes)}</p>` : ''}</div>`;
  });
  h += `<h2>Backup</h2><div class="card"><p class="hint">Data is stored in this browser only. Export a backup regularly and import it to move to another device.</p>
    <div class="row"><button data-act="export">Export JSON</button><button data-act="copyJson">Copy JSON</button></div>
    <label style="margin-top:10px">Import backup<input type="file" accept="application/json,.json" data-import></label>
    <div class="row" style="margin-top:10px"><button class="danger small" data-act="reset">Reset everything</button></div></div>`;
  return h;
}

/* ---------- render ---------- */
const TABS = [['today', 'Today'], ['schedule', 'Schedule'], ['workouts', 'Workouts'], ['progression', 'Progression'], ['progress', 'Progress']];
const TITLES = { today: 'Today', schedule: 'Weekly Schedule', workouts: 'Workouts', progression: 'Progression', progress: 'Progress & History' };
function render(keepScroll) {
  const y = typeof window !== 'undefined' ? window.scrollY : 0;
  const views = { today: viewToday, schedule: viewSchedule, workouts: viewWorkouts, progression: viewProgression, progress: viewProgress };
  document.getElementById('title').textContent = TITLES[ui.tab];
  document.getElementById('app').innerHTML = views[ui.tab]();
  document.getElementById('nav').innerHTML = TABS.map(([k, l]) => `<button class="${ui.tab === k ? 'on' : ''}" data-act="tab" data-tab="${k}">${l}</button>`).join('');
  document.getElementById('sheet').innerHTML = sheetHTML();
  if (keepScroll) window.scrollTo(0, y); else window.scrollTo(0, 0);
}

/* ---------- events ---------- */
function setPath(path, val) {
  const p = path.split('.'); let o = S;
  for (let i = 0; i < p.length - 1; i++) o = o[p[i]];
  o[p[p.length - 1]] = val;
}
function toggleDone(k, key) {
  const l = ensureLog(k);
  if (l.done[key]) delete l.done[key]; else l.done[key] = true;
  save();
}
function download(name, text) {
  const blob = new Blob([text], { type: 'application/json' });
  const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = name;
  document.body.appendChild(a); a.click(); a.remove();
}

function onClick(ev) {
  const t = ev.target.closest('[data-act]'); if (!t) return;
  const d = t.dataset, a = d.act;
  if (a === 'closeBg') { if (ev.target !== t) return; ui.sheet = null; return render(true); }
  switch (a) {
    case 'tab': ui.tab = d.tab; ui.sheet = null; return render(false);
    case 'prevDay': ui.date = addDays(ui.date, -1); return render(false);
    case 'nextDay': ui.date = addDays(ui.date, 1); return render(false);
    case 'goToday': ui.date = today(); return render(false);
    case 'toggle': toggleDone(ui.date, d.key); return render(true);
    case 'toggleClose': toggleDone(ui.date, d.key); ui.sheet = null; return render(true);
    case 'open': ui.sheet = { type: 'entry', k: ui.date, key: d.key }; return render(true);
    case 'close': ui.sheet = null; return render(true);
    case 'adjust': ui.adjust = !ui.adjust; return render(true);
    case 'rmItem': {
      const l = ensureLog(ui.date);
      l.items = l.items.filter(i => i.id !== d.id);
      Object.keys(l.done).forEach(k => { if (k.split(':')[0] === d.id) delete l.done[k]; });
      save(); return render(true);
    }
    case 'addToday': {
      const l = ensureLog(ui.date); l.items.push(mkItem(document.getElementById('addSel').value)); save(); return render(true);
    }
    case 'toggleCheckin': ui.checkin = !ui.checkin; return render(true);
    case 'checkin': {
      const l = ensureLog(ui.date); l.checkin = l.checkin || { s: null, f: null };
      l.checkin[d.f] = +d.v; save(); return render(true);
    }
    case 'clearCheckin': ensureLog(ui.date).checkin = null; save(); return render(true);
    case 'delItem': S.schedule[d.day].splice(+d.idx, 1); save(); return render(true);
    case 'addItem': S.schedule[d.day].push(mkItem(document.getElementById('add' + d.day).value)); save(); return render(true);
    case 'wtab': ui.wtab = d.t; return render(false);
    case 'editW': ui.edit[d.id] = !ui.edit[d.id]; return render(true);
    case 'editList': ui.edit[d.l] = !ui.edit[d.l]; return render(true);
    case 'addEx': S.workouts[d.w].exercises.push({ id: uid(), name: 'New exercise', reps: '10', instructions: '' }); save(); return render(true);
    case 'delEx': S.workouts[d.w].exercises.splice(+d.i, 1); save(); return render(true);
    case 'delW':
      if (confirm('Delete this workout? Logged history is kept.')) { delete S.workouts[d.id]; save(); render(true); }
      return;
    case 'newW': { const id = uid(); S.workouts[id] = { id, name: 'New workout', subtitle: '', rounds: 2, rest: 'Rest 30–60 sec between exercises.', exercises: [] }; ui.edit[id] = true; save(); return render(true); }
    case 'addMob': S[d.l].push({ id: uid(), name: 'New movement', duration: '30 sec', instructions: '' }); save(); return render(true);
    case 'delMob': S[d.l].splice(+d.i, 1); save(); return render(true);
    case 'review': ui.sheet = { type: 'review', choice: d.choice }; return render(true);
    case 'confirmReview': {
      const checked = [...document.querySelectorAll('.opt')].filter(x => x.checked).map(x => x.value);
      checked.forEach(applyOpt);
      const P = S.progression;
      if (d.choice === 'progress') P.level++;
      if (d.choice === 'scale') P.level = Math.max(0, P.level - 1);
      P.reviews.push({ block: Math.floor(weekIdx() / 4), date: today(), choice: d.choice, applied: checked });
      save(); ui.sheet = null; return render(true);
    }
    case 'export': return download(`bjj-training-backup-${today()}.json`, JSON.stringify(S, null, 2));
    case 'copyJson':
      if (navigator.clipboard) navigator.clipboard.writeText(JSON.stringify(S)).then(() => alert('Backup copied to clipboard.'), () => alert('Copy failed. Use Export instead.'));
      return;
    case 'reset':
      if (confirm('Erase ALL data on this device and restore the starting plan? This cannot be undone.')) { localStorage.removeItem(KEY); load(); freeze(); ui.date = today(); render(false); }
      return;
  }
}
function onChange(ev) {
  const t = ev.target, d = t.dataset;
  if (d.path) {
    let v = t.type === 'checkbox' ? t.checked : t.value;
    if (d.num !== undefined) v = Math.max(1, parseInt(v, 10) || 1);
    setPath(d.path, v); save(); return;
  }
  if (d.set) { const l = ensureLog(ui.date); l.sets[d.set] = Object.assign({}, l.sets[d.set], { name: d.name, [d.f]: t.value }); save(); return; }
  if (d.detail) { const l = ensureLog(ui.date); l.detail[d.detail] = Object.assign({}, l.detail[d.detail], { [d.f]: t.value }); save(); return; }
  if (t.id === 'notes') { ensureLog(ui.date).notes = t.value; save(); return; }
  if (d.move !== undefined) {
    if (t.value === '') return;
    const [from, idx] = d.move.split('.').map(Number);
    const item = S.schedule[from].splice(idx, 1)[0];
    (S.schedule[+t.value] = S.schedule[+t.value] || []).push(item);
    save(); return render(true);
  }
  if (d.startdate !== undefined) { S.progression.start = t.value || today(); save(); return render(true); }
  if (d.import !== undefined) {
    const f = t.files && t.files[0]; if (!f) return;
    const r = new FileReader();
    r.onload = () => {
      try {
        const p = JSON.parse(r.result);
        if (!p || !p.schedule || !p.workouts || !p.logs) throw new Error('bad');
        if (!confirm('Replace all data on this device with the imported backup?')) return;
        S = Object.assign(defaults(), p); save(); freeze(); ui.date = today(); render(false);
      } catch (e) { alert('That file is not a valid backup.'); }
    };
    r.readAsText(f);
  }
}

/* ---------- boot ---------- */
load();
freeze();
document.addEventListener('click', onClick);
document.addEventListener('change', onChange);
render(false);
window.__app = { get S() { return S; }, ui, render, onClick, onChange };
})();
