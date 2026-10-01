import type {
  ChampionshipPhase,
  ChampionshipSnapshot,
} from '../tennis/ChampionshipController.js';
import type { MatchInput } from '../tennis/MatchInput.js';
import type { InteractiveMatchSystem } from '../tennis/InteractiveMatchSystem.js';

type ChampionshipPlayerCue = ReturnType<InteractiveMatchSystem['playerCue']>;

export interface ChampionshipHUDActions {
  onRematch: () => void;
  onReturnToClub: () => void;
}

/**
 * Presentation-only overlay for Championship Mode.
 * Game state stays in ChampionshipController and InteractiveMatchSystem.
 */
export class ChampionshipHUD {
  private readonly root: HTMLDivElement;
  private readonly matchup: HTMLDivElement;
  private readonly score: HTMLDivElement;
  private readonly message: HTMLDivElement;
  private readonly results: HTMLDivElement;
  private readonly resultTitle: HTMLElement;
  private readonly resultSummary: HTMLParagraphElement;
  private readonly rematchButton: HTMLButtonElement;
  private readonly returnButton: HTMLButtonElement;
  private readonly touchPad: HTMLDivElement;
  private readonly swingButton: HTMLButtonElement;
  private readonly controlsHint: HTMLDivElement;

  private readonly exitButton:HTMLButtonElement;
  private pointerId: number | null = null;

  constructor(
    private readonly input: MatchInput,
    private readonly actions: ChampionshipHUDActions,
  ) {
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

    this.exitButton=document.createElement('button');this.exitButton.className='championshipExit';this.exitButton.textContent='Exit match';this.exitButton.setAttribute('aria-label','Return to Club');this.exitButton.onclick=()=>this.actions.onReturnToClub();this.root.append(this.exitButton);
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

    this.swingButton.addEventListener('click',event=>{if(event.detail===0)this.input.queueSwing();});
    this.bindTouchPad();

    this.root.append(
      this.matchup,
      this.score,
      this.message,
      this.results,
      this.touchPad,
      this.swingButton,
      this.controlsHint,
    );

    document.getElementById('app')?.append(this.root);
  }

  show() {
    this.root.hidden = false;
  }

  hide() {
    this.root.hidden = true;
    this.results.hidden = true;
    this.input.setTouchMovement(0, 0);
  }

  render(
    snapshot: ChampionshipSnapshot,
    playerName: string,
    opponentName: string,
    cue: ChampionshipPlayerCue = 'none',
  ) {
    if (snapshot.phase === 'inactive') {
      // The challenge walk belongs to the dollhouse. Keep the sports HUD out
      // of the way until the camera actually begins its transformation.
      this.hide();
      return;
    }

    this.show();
    this.controlsHint.hidden=snapshot.phase==='matchResult';
    this.exitButton.hidden=snapshot.phase==='matchResult';
    this.root.dataset.phase = snapshot.phase;

    this.matchup.textContent = `${playerName.toUpperCase()}  vs  ${opponentName.toUpperCase()}`;
    this.score.textContent = `${snapshot.score.player}  –  ${snapshot.score.opponent}`;
    const message=this.messageFor(snapshot,cue);
    if(this.message.textContent!==message)this.message.textContent=message;

    const showResults = snapshot.phase === 'matchResult';
    this.results.hidden = !showResults;
    if(showResults){
      const playerWon=snapshot.score.player>snapshot.score.opponent;
      this.resultTitle.textContent=playerWon?'YOU WIN':`${opponentName.toUpperCase()} WINS`;
      this.resultSummary.textContent=`${snapshot.score.player} – ${snapshot.score.opponent}  ·  Best rally ${snapshot.bestRally}`;
    }
    this.touchPad.hidden = !this.gameplayPhase(snapshot.phase);
    this.swingButton.hidden = !this.gameplayPhase(snapshot.phase);
  }

  private gameplayPhase(phase: ChampionshipPhase) {
    return phase === 'serving' || phase === 'rally';
  }

  private messageFor(snapshot: ChampionshipSnapshot, cue: ChampionshipPlayerCue) {
    const phase=snapshot.phase;
    if (phase === 'intro') return '';
    if (phase === 'challenge')return 'Walking to court';
    if (phase === 'ready') return 'Ready';
    if (phase === 'serving') {
      return snapshot.server === 'player' ? (matchMedia('(pointer:coarse)').matches?'TAP SWING TO SERVE':'SPACE TO SERVE') : 'WATCH THE BALL';
    }
    if (phase === 'rally') {
      if (cue === 'swing') return 'SWING';
      return '';
    }
    if (phase === 'pointResult') {
      const point = snapshot.lastPoint;
      if (!point) return '';

      const reason: Record<string, string> = {
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
    if (phase === 'matchResult') return '';
    return '';
  }

  private bindTouchPad() {
    const update = (event: PointerEvent) => {
      const bounds = this.touchPad.getBoundingClientRect();
      const centerX = bounds.left + bounds.width / 2;
      const centerY = bounds.top + bounds.height / 2;
      const radius = Math.max(1, Math.min(bounds.width, bounds.height) / 2);

      this.input.setTouchMovement(
        (event.clientX - centerX) / radius,
        (event.clientY - centerY) / radius,
      );
    };

    this.touchPad.addEventListener('pointerdown', (event) => {
      event.preventDefault();
      this.pointerId = event.pointerId;
      this.touchPad.setPointerCapture(event.pointerId);
      update(event);
    });

    this.touchPad.addEventListener('pointermove', (event) => {
      if (this.pointerId !== event.pointerId) return;
      event.preventDefault();
      update(event);
    });

    const release = (event: PointerEvent) => {
      if (this.pointerId !== event.pointerId) return;
      this.pointerId = null;
      this.input.setTouchMovement(0, 0);
    };

    this.touchPad.addEventListener('pointerup', release);
    this.touchPad.addEventListener('pointercancel', release);
    this.touchPad.addEventListener('lostpointercapture',release);
  }
}
