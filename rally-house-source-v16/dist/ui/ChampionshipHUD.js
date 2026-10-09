/**
 * Presentation-only overlay for Championship Mode.
 * Game state stays in ChampionshipController and InteractiveMatchSystem.
 */
export class ChampionshipHUD {
    input;
    actions;
    root;
    matchup;
    score;
    message;
    results;
    resultTitle;
    resultSummary;
    rematchButton;
    returnButton;
    touchPad;
    swingButton;
    controlsHint;
    pauseButton;
    pausePanel;
    resumeButton;
    soundButton;
    motionButton;
    paused = false;
    exitButton;
    pointerId = null;
    constructor(input, actions) {
        this.input = input;
        this.actions = actions;
        this.root = document.createElement('div');
        this.root.className = 'championshipHud';
        this.root.hidden = true;
        this.matchup = document.createElement('div');
        this.matchup.className = 'championshipMatchup glass';
        this.score = document.createElement('div');
        this.score.className = 'championshipScore glass';
        this.message = document.createElement('div');
        this.message.className = 'championshipMessage';
        this.message.setAttribute('aria-live', 'polite');
        this.results = document.createElement('div');
        this.results.className = 'championshipResults glass';
        this.results.hidden = true;
        this.resultTitle = document.createElement('strong');
        this.resultTitle.textContent = 'Match complete';
        this.resultSummary = document.createElement('p');
        this.resultSummary.className = 'championshipResultSummary';
        this.rematchButton = document.createElement('button');
        this.rematchButton.className = 'championshipPrimary';
        this.rematchButton.textContent = 'Rematch';
        this.rematchButton.onclick = () => this.actions.onRematch();
        this.returnButton = document.createElement('button');
        this.returnButton.textContent = 'Return to Club';
        this.returnButton.onclick = () => this.actions.onReturnToClub();
        this.exitButton = document.createElement('button');
        this.exitButton.className = 'championshipExit';
        this.exitButton.textContent = 'Exit match';
        this.exitButton.setAttribute('aria-label', 'Return to Club');
        this.exitButton.onclick = () => this.actions.onReturnToClub();
        this.root.append(this.exitButton);
        this.pauseButton = document.createElement('button');
        this.pauseButton.className = 'championshipPause';
        this.pauseButton.textContent = 'Pause match';
        this.pauseButton.onclick = () => this.actions.onTogglePause();
        this.pausePanel = document.createElement('div');
        this.pausePanel.className = 'championshipPausePanel glass';
        this.pausePanel.hidden = true;
        this.pausePanel.setAttribute('role', 'region');
        this.pausePanel.setAttribute('aria-label', 'Match paused');
        const pauseTitle = document.createElement('strong');
        pauseTitle.textContent = 'Take your time.';
        const pauseCopy = document.createElement('p');
        pauseCopy.textContent = 'The point is waiting. Resume when you’re ready.';
        const pauseActions = document.createElement('div');
        pauseActions.className = 'championshipPauseActions';
        this.resumeButton = document.createElement('button');
        this.resumeButton.textContent = 'Resume match';
        this.resumeButton.onclick = () => this.actions.onTogglePause();
        const pausedExit = document.createElement('button');
        pausedExit.className = 'championshipPausedExit';
        pausedExit.textContent = 'Return to Club';
        pausedExit.onclick = () => this.actions.onReturnToClub();
        pauseActions.append(this.resumeButton, pausedExit);
        this.soundButton = document.createElement('button');
        this.soundButton.textContent = 'Sound: on';
        this.soundButton.setAttribute('aria-label', 'Sound');
        this.soundButton.onclick = () => this.actions.onToggleSound();
        this.motionButton = document.createElement('button');
        this.motionButton.textContent = 'Reduced motion';
        this.motionButton.onclick = () => this.actions.onToggleMotion();
        this.pausePanel.append(pauseTitle, pauseCopy, pauseActions, this.soundButton, this.motionButton);
        this.results.append(this.resultTitle, this.resultSummary, this.rematchButton, this.returnButton);
        this.touchPad = document.createElement('div');
        this.touchPad.className = 'championshipTouchPad';
        this.touchPad.setAttribute('aria-label', 'Move player');
        this.swingButton = document.createElement('button');
        this.swingButton.className = 'championshipSwing';
        this.swingButton.textContent = 'SWING';
        this.swingButton.setAttribute('aria-label', 'Swing racket');
        this.swingButton.addEventListener('pointerdown', (event) => {
            event.preventDefault();
            this.input.queueSwing();
        });
        this.controlsHint = document.createElement('div');
        this.controlsHint.className = 'championshipControlsHint';
        this.controlsHint.textContent = 'WASD / ARROWS move  ·  SPACE swing';
        this.swingButton.addEventListener('click', event => { if (event.detail === 0)
            this.input.queueSwing(); });
        this.bindTouchPad();
        this.root.append(this.matchup, this.score, this.message, this.results, this.touchPad, this.swingButton, this.controlsHint, this.pauseButton, this.pausePanel);
        document.getElementById('app')?.append(this.root);
    }
    show() {
        this.root.hidden = false;
    }
    hide() {
        this.root.hidden = true;
        this.results.hidden = true;
        this.resetTouch();
        this.paused = false;
        this.pausePanel.hidden = true;
    }
    /** Release capture and intent as one boundary; late events cannot restart it. */
    resetTouch() {
        const pointer = this.pointerId;
        this.pointerId = null;
        if (pointer !== null && this.touchPad.hasPointerCapture(pointer)) {
            this.touchPad.releasePointerCapture(pointer);
        }
        this.input.setTouchMovement(0, 0);
    }
    render(snapshot, playerName, opponentName, cue = 'none', reducedMotion = false, paused = false, muted = false) {
        if (snapshot.phase === 'inactive') {
            // The challenge walk belongs to the dollhouse. Keep the sports HUD out
            // of the way until the camera actually begins its transformation.
            this.hide();
            return;
        }
        this.show();
        this.controlsHint.hidden = snapshot.phase === 'matchResult';
        this.exitButton.hidden = snapshot.phase === 'matchResult' || paused;
        this.root.dataset.phase = snapshot.phase;
        this.root.dataset.cue = this.gameplayPhase(snapshot.phase) ? cue : 'none';
        this.root.dataset.motion = reducedMotion ? 'reduced' : 'full';
        this.root.dataset.paused = String(paused);
        this.pauseButton.hidden = paused || snapshot.phase === 'exiting' || snapshot.phase === 'matchResult';
        this.pausePanel.hidden = !paused;
        this.soundButton.textContent = muted ? 'Sound: off' : 'Sound: on';
        this.soundButton.setAttribute('aria-pressed', String(!muted));
        this.motionButton.setAttribute('aria-pressed', String(reducedMotion));
        if (paused && !this.paused && document.hasFocus())
            this.resumeButton.focus({ preventScroll: true });
        this.paused = paused;
        if (paused || !this.gameplayPhase(snapshot.phase) || !this.input.enabled)
            this.resetTouch();
        this.matchup.textContent = `${playerName.toUpperCase()}  vs  ${opponentName.toUpperCase()}`;
        this.score.textContent = `${snapshot.score.player}  –  ${snapshot.score.opponent}`;
        const message = paused ? '' : this.messageFor(snapshot, cue);
        if (this.message.textContent !== message)
            this.message.textContent = message;
        const showResults = snapshot.phase === 'matchResult';
        this.results.hidden = !showResults;
        if (showResults) {
            const playerWon = snapshot.score.player > snapshot.score.opponent;
            this.resultTitle.textContent = playerWon ? 'YOU WIN' : `${opponentName.toUpperCase()} WINS`;
            this.resultSummary.textContent = `${snapshot.score.player} – ${snapshot.score.opponent}  ·  Best rally ${snapshot.bestRally}`;
        }
        this.touchPad.hidden = paused || !this.gameplayPhase(snapshot.phase);
        this.swingButton.hidden = paused || !this.gameplayPhase(snapshot.phase);
        this.controlsHint.hidden ||= paused;
    }
    gameplayPhase(phase) {
        return phase === 'serving' || phase === 'rally';
    }
    messageFor(snapshot, cue) {
        const phase = snapshot.phase;
        if (phase === 'intro')
            return '';
        if (phase === 'challenge')
            return 'Walking to court';
        if (phase === 'ready')
            return 'Ready';
        if (phase === 'serving') {
            return snapshot.server === 'player' ? (matchMedia('(pointer:coarse)').matches ? 'TAP SWING TO SERVE' : 'SPACE TO SERVE') : 'WATCH THE BALL';
        }
        if (phase === 'rally') {
            if (cue === 'queued')
                return 'READY TO RETURN';
            if (cue === 'sweet')
                return 'SWEET SPOT!';
            if (cue === 'nice')
                return 'NICE RETURN';
            if (cue === 'swing')
                return 'SWING · EARLY IS OK';
            return '';
        }
        if (phase === 'pointResult') {
            const point = snapshot.lastPoint;
            if (!point)
                return '';
            const reason = {
                winner: 'winner',
                net: 'net',
                wide: 'wide',
                long: 'long',
                doubleBounce: 'two bounces',
                miss: 'missed',
            };
            const why = reason[point.reason] ?? point.reason;
            return point.winner === 'player'
                ? `Your point · ${why}`
                : `Their point · ${why}`;
        }
        if (phase === 'matchResult')
            return '';
        return '';
    }
    bindTouchPad() {
        const update = (event) => {
            const bounds = this.touchPad.getBoundingClientRect();
            const centerX = bounds.left + bounds.width / 2;
            const centerY = bounds.top + bounds.height / 2;
            const radius = Math.max(1, Math.min(bounds.width, bounds.height) / 2);
            this.input.setTouchMovement((event.clientX - centerX) / radius, (event.clientY - centerY) / radius);
        };
        this.touchPad.addEventListener('pointerdown', (event) => {
            if (!this.input.enabled || this.pointerId !== null || event.button !== 0)
                return;
            event.preventDefault();
            this.pointerId = event.pointerId;
            this.touchPad.setPointerCapture(event.pointerId);
            update(event);
        });
        this.touchPad.addEventListener('pointermove', (event) => {
            if (this.pointerId !== event.pointerId)
                return;
            if (!this.input.enabled) {
                this.resetTouch();
                return;
            }
            event.preventDefault();
            update(event);
        });
        const release = (event) => {
            if (this.pointerId !== event.pointerId)
                return;
            this.resetTouch();
        };
        this.touchPad.addEventListener('pointerup', release);
        this.touchPad.addEventListener('pointercancel', release);
        this.touchPad.addEventListener('lostpointercapture', release);
    }
}
