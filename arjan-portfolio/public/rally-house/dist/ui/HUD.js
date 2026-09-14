const byId = (id) => document.getElementById(id);
export class HUD {
    onBuildClose = () => { };
    onPlay = () => { };
    onSpeed = () => { };
    onBook = () => { };
    onCoach = () => { };
    onBuild = () => { };
    onWeather = () => { };
    onCamera = () => { };
    onSave = () => { };
    onBuildSelect = (type) => { };
    context = byId('context');
    book = byId('book');
    build = byId('buildPanel');
    toastTimer = 0;
    momentTimer = 0;
    speechTimer = 0;
    bookData = null;
    activeTab = 'today';
    opener = null;
    focusPanel(panel) { if (!panel.contains(document.activeElement))
        this.opener = document.activeElement; requestAnimationFrame(() => { if (panel.classList.contains('open'))
        panel.querySelector('button')?.focus(); }); }
    constructor() {
        byId('playBtn').onclick = () => this.onPlay();
        byId('speedBtn').onclick = () => this.onSpeed();
        byId('bookBtn').onclick = () => this.onBook();
        byId('coachBtn').onclick = () => this.onCoach();
        byId('buildBtn').onclick = () => this.onBuild();
        byId('weatherBtn').onclick = () => this.onWeather();
        byId('cameraBtn').onclick = () => this.onCamera();
        byId('saveBtn').onclick = () => this.onSave();
        byId('closeContext').onclick = () => this.closeContext();
        byId('closeBook').onclick = () => this.closeBook();
        byId('brandBtn').onclick = () => this.onBook();
        this.build.querySelectorAll('button[data-build]').forEach(b => b.onclick = () => { this.build.querySelectorAll('button').forEach(x => x.classList.remove('selected')); b.classList.add('selected'); this.onBuildSelect(b.dataset.build); });
        byId('bookTabs').addEventListener('click', e => { const b = e.target.closest('button[data-tab]'); if (!b)
            return; this.activeTab = b.dataset.tab; byId('bookTabs').querySelectorAll('button').forEach(x => x.classList.toggle('active', x === b)); this.renderBook(); });
    }
    hideLoading() { setTimeout(() => byId('loading').classList.add('hide'), 180); }
    hideHint() { byId('hint').classList.add('hide'); }
    update(stats, paused, speed) { byId('coins').textContent = String(Math.floor(stats.coins)); byId('stars').textContent = String(stats.stars); byId('heart').textContent = String(stats.heart); byId('clock').textContent = stats.clock; byId('weatherChip').firstChild.textContent = stats.weather === 'rain' ? '☂ ' : stats.weather === 'cloudy' ? '☁ ' : '☀ '; byId('weatherBtn').textContent = stats.weather === 'rain' ? '☂' : stats.weather === 'cloudy' ? '☁' : '☀'; byId('playBtn').textContent = paused ? '▶' : 'Ⅱ'; byId('playBtn').setAttribute('aria-label', paused ? 'Resume' : 'Pause'); byId('playBtn').classList.toggle('primary', !paused); byId('speedBtn').textContent = `${speed}×`; }
    setObjective(title, text) { byId('objectiveTitle').textContent = title; byId('objectiveText').textContent = text; }
    showContext(eyebrow, title, text, meta, actions) { byId('contextEyebrow').textContent = eyebrow.toUpperCase(); byId('contextTitle').textContent = title; byId('contextText').textContent = text; const mb = byId('contextMeta'); mb.innerHTML = ''; for (const x of meta) {
        const s = document.createElement('span');
        s.textContent = x;
        mb.appendChild(s);
    } const box = byId('contextActions'); box.innerHTML = ''; for (const a of actions) {
        const b = document.createElement('button');
        const strong = document.createElement('strong');
        strong.textContent = a.title;
        const span = document.createElement('span');
        span.textContent = a.subtitle;
        b.append(strong, span);
        b.onclick = () => a.run();
        box.appendChild(b);
    } this.toggleBuild(false); this.context.scrollTop = 0; this.book.classList.remove('open'); this.context.classList.add('open'); this.focusPanel(this.context); }
    closeContext() { const had = this.context.contains(document.activeElement); this.context.classList.remove('open'); if (had)
        this.opener?.focus(); }
    showBook(data) { this.toggleBuild(false); this.bookData = data; this.context.classList.remove('open'); this.book.classList.add('open'); this.renderBook(); this.focusPanel(this.book); }
    renderBook() {
        if (!this.bookData)
            return;
        const d = this.bookData, c = byId('bookContent');
        if (this.activeTab === 'today') {
            const goals = d.goals.map(g => `<div class="goal ${g.done ? 'done' : ''}"><i>${g.done ? '✓' : '○'}</i><span>${this.escape(g.label)}</span><small>+${g.reward}</small></div>`).join('');
            c.innerHTML = `<div class="card heroCard"><div class="row"><strong>Day ${d.day}</strong><span>${d.time} · ${d.weather}</span></div><small>There is no streak to protect. The club will be here when you come back.</small></div><div class="card"><strong>People today</strong>${d.members.map(m => `<p><b>${this.escape(m.name)}</b><br>${this.escape(m.intention ?? m.goal)}</p>`).join('')}</div><div class="card"><strong>Gentle intentions</strong><div class="goalList">${goals}</div></div><div class="card"><div class="row"><strong>Club heart</strong><span>♥ ${d.heart}</span></div><small>Built from people, progress, and the details you chose to add.</small></div>`;
        }
        else if (this.activeTab === 'people') {
            c.innerHTML = d.members.map(m => `<div class="card personCard"><div class="row"><strong>${this.escape(m.name)}</strong><span>${this.escape(m.mood ?? m.tier)}</span></div><small>${this.escape(m.role)} · ${this.escape(m.quirk)}</small><p>${this.escape(m.intention ?? m.goal)}</p>${m.favorite ? `<small>Favorite place · ${this.escape(m.favorite)}</small>` : ''}${m.personalMemory ? `<em>${this.escape(m.personalMemory)}</em>` : m.memories[0] ? `<em>${this.escape(m.memories[0])}</em>` : ''}${m.possessions?.length ? `<small>${m.possessions.map(p => this.escape(p)).join(' · ')}</small>` : ''}</div>`).join('');
        }
        else if (this.activeTab === 'coaching') {
            c.innerHTML = `<div class="card"><strong>Your coaching approach</strong><small>${this.escape(d.philosophy ?? 'Your approach will emerge through practice.')}</small></div><div class="card"><div class="row"><strong>Lucresia · forehand timing</strong><span>${d.mikaProgress}%</span></div><div class="meter"><i style="width:${Math.min(100, d.mikaProgress)}%"></i></div><small>Choose drills because they fit the problem, not because they pay more.</small></div><div class="card"><div class="row"><strong>${this.escape(d.coachLevel)}</strong><span>${d.coachXP} XP</span></div><small>Your coaching level grows from completed lessons and useful choices.</small></div><div class="card"><div class="row"><strong>Best observed rally</strong><span>${d.bestRally} balls</span></div><small>Rallies are a little different every time. No score multiplier attached.</small></div>`;
        }
        else if (this.activeTab === 'moments') {
            c.innerHTML = d.moments.length ? d.moments.map(x => `<div class="memory"><i>✦</i><span>${this.escape(x)}</span></div>`).join('') : `<div class="card"><strong>No scrapbook entries yet</strong><small>Watch the club for a while. People will make their own little stories.</small></div>`;
        }
        else
            c.innerHTML = `<div class="card"><strong>The club is becoming…</strong><small>${this.escape(d.culture ?? 'Still finding its rhythm.')}</small></div><div class="card"><strong>Current racket</strong><small>${this.escape(d.equipment.frame)} · ${this.escape(d.equipment.string)} · ${d.equipment.tension} lb</small></div><div class="card"><strong>Academy snapshot</strong><small>${d.coins} coins · ${d.placements} placed details · indoor court · matcha nook · pro shop · lounge · bonsai corner</small></div><div class="card"><strong>Design principle</strong><small>Most management is optional. The physical club is the interface and the people remain the point.</small></div>`;
    }
    escape(v) { return v.replace(/[&<>'"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' }[c])); }
    closeBook() { const had = this.book.contains(document.activeElement); this.book.classList.remove('open'); if (had)
        this.opener?.focus(); }
    toggleBuild(open) { const next = open ?? !this.build.classList.contains('open'); if (next) {
        this.closeContext();
        this.closeBook();
    }
    else {
        this.clearBuildSelection();
        this.onBuildClose();
    } this.build.classList.toggle('open', next); byId('buildBtn').classList.toggle('active', next); }
    clearBuildSelection() { this.build.querySelectorAll('button').forEach(x => x.classList.remove('selected')); }
    toast(msg) { const t = byId('toast'); t.textContent = msg; t.classList.add('show'); clearTimeout(this.toastTimer); this.toastTimer = window.setTimeout(() => t.classList.remove('show'), 2300); }
    showMoment(title, text) { byId('momentTitle').textContent = title; byId('momentText').textContent = text; const el = byId('moment'); el.classList.add('show'); clearTimeout(this.momentTimer); this.momentTimer = window.setTimeout(() => el.classList.remove('show'), 5200); }
    showSpeech(name, text, duration = 3600) { byId('speechName').textContent = name; byId('speechText').textContent = text; const el = byId('speech'); el.classList.add('show'); clearTimeout(this.speechTimer); if (duration > 0)
        this.speechTimer = window.setTimeout(() => el.classList.remove('show'), duration); }
    hideSpeech() { clearTimeout(this.speechTimer); byId('speech').classList.remove('show'); }
    positionSpeech(x, y) { const el = byId('speech'); const half = el.getBoundingClientRect().width / 2; el.style.left = `${Math.max(half + 12, Math.min(innerWidth - half - 12, x))}px`; el.style.top = `${Math.max(145, Math.min(innerHeight - 100, y))}px`; }
}
//# sourceMappingURL=HUD.js.map