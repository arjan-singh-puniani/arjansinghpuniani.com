import { Vec3, clamp, smoothstep } from '../rendering/Math3D.js';
import type { Mesh } from '../rendering/Renderer.js';
import type { Character } from '../entities/Character.js';
import { BallPhysics } from './BallPhysics.js';
import { BallTrail } from './BallTrail.js';
import type { ChampionshipOpponentProfile } from './ChampionshipController.js';
import { CHAMPIONSHIP_TUNING, CHAMPIONSHIP_CONTACT_FEEL } from './ChampionshipTuning.js';
import type { MatchInput } from './MatchInput.js';

export type InteractiveShotQuality =
  | 'perfect'
  | 'clean'
  | 'defensive'
  | 'frame';

export type InteractivePointReason =
  | 'winner'
  | 'net'
  | 'wide'
  | 'long'
  | 'doubleBounce'
  | 'miss';

type Side = 'player' | 'opponent';
type Stroke = 'swingForehand' | 'swingBackhand' | 'serve' | 'volley';

interface PendingContact {
  hitter: Character;
  receiver: Character;
  side: Side;
  stroke: Stroke;
  quality: InteractiveShotQuality;
  target: Vec3;
  flightTime: number;
  contactAt: number;
  duration: number;
  captureAt: number;
  incomingStart: Vec3 | null;
  contactTarget: Vec3 | null;
  tossStart: Vec3;
  captured: boolean;
  impactStarted: boolean;
  released: boolean;
  latchRemaining: number;
  normalDirection: number;
}

export interface InteractiveMatchCallbacks {
  onHit?: (quality: InteractiveShotQuality,side:Side,direction:number) => void;
  onBounce?: () => void;
  onNet?: () => void;
  onRallyContact?: (side: Side, quality: InteractiveShotQuality) => void;
  onPoint?: (winner: Side, reason: InteractivePointReason, rallyLength: number) => void;
}

const COURT_CENTER_X = 1;
const PLAYER_BASELINE_Z = 5;
const OPPONENT_BASELINE_Z = -5;
const SINGLES_MIN_X = -3.25;
const SINGLES_MAX_X = 5.25;
const PLAYABLE_MIN_Z = -6;
const PLAYABLE_MAX_Z = 6;

function fract(value: number) {
  return value - Math.floor(value);
}

/** Deterministic pseudo-random value. Replays remain reproducible for QA. */
function hash(seed: number) {
  return fract(Math.sin(seed * 12.9898 + 78.233) * 43758.5453);
}

/**
 * InteractiveMatchSystem owns one live point at a time.
 *
 * It intentionally reuses Rally House's Character racket solver and BallPhysics
 * rather than implementing a second visual tennis model. The ball is only
 * launched after the staged ball reaches the live racket string-bed frame.
 */
export class InteractiveMatchSystem {
  readonly ball = new BallPhysics();

  enabled = false;
  rallyLength = 0;
  bestRally = 0;

  private playerHitPraise=0;
  private lastPlayerQuality:InteractiveShotQuality='clean';
  private movementX=0;
  private movementZ=0;
  private priorPlayerSpeed=1;
  private priorOpponentSpeed=1;
  private matchClaimed=false;
  private bouncePulse=0;
  private bouncePosition=new Vec3();
  private landingTarget:Vec3|null=null;
  private server: Side = 'player';
  private receiver: Side = 'opponent';
  private flightHitter: Side | null = null;
  private pending: PendingContact | null = null;
  private pointResolved = false;
  private firstBounceSeen = false;
  private shotSequence = 0;
  private opponentServeDelay = 0;
  private readonly trail = new BallTrail();
  private trailSpeed = 0;
  private impactBurst = 0;
  private impactAge = 1;
  private impactQuality:InteractiveShotQuality='clean';
  private lastContact: Vec3 | null = null;
  private lastContactFrame: {
    rotation: Vec3;
    horizontal: Vec3;
    vertical: Vec3;
  } | null = null;

  constructor(
    private readonly player: Character,
    private readonly opponent: Character,
    private readonly opponentProfile: ChampionshipOpponentProfile,
    private readonly input: MatchInput,
    private readonly callbacks: InteractiveMatchCallbacks = {},
  ) {
    this.ball.restitution=CHAMPIONSHIP_TUNING.ballRestitution;
  }

  startPoint(server: Side) {
    this.landingTarget=null;
    if(!this.matchClaimed){
      this.priorPlayerSpeed=this.player.getCourtSpeedScale();
      this.priorOpponentSpeed=this.opponent.getCourtSpeedScale();
      this.matchClaimed=true;
    }
    this.player.matchCompetitor=this.opponent.matchCompetitor=true;
    this.player.racketStowed=this.opponent.racketStowed=false;
    this.player.socialProp=this.opponent.socialProp=null;
    this.opponent.setCourtSpeedScale(this.opponentProfile.movementSpeed);
    this.movementX=this.movementZ=0;
    this.bouncePulse=0;
    this.playerHitPraise=0;
    this.server = server;
    this.receiver = server === 'player' ? 'opponent' : 'player';
    this.flightHitter = null;
    this.pending = null;
    this.pointResolved = false;
    this.firstBounceSeen = false;
    this.rallyLength = 0;
    this.ball.active = false;
    this.trail.reset();
    this.trailSpeed = 0;
    this.impactBurst = 0;
    this.impactAge = 1;
    this.lastContact = null;
    this.lastContactFrame = null;
    this.opponentServeDelay = server === 'opponent' ? CHAMPIONSHIP_TUNING.opponentServeReadSeconds+this.opponentProfile.serveCadence : 0;
    this.enabled = true;

    // Match movement uses the existing court locomotion path. Resetting both
    // players to ready gives point-to-point transitions a consistent baseline.
    this.player.clearCourtMove();
    this.opponent.clearCourtMove();
    this.player.clearShotIntent();
    this.opponent.clearShotIntent();
    this.player.setAnimation('ready');
    this.opponent.setAnimation('ready');
    this.player.face(this.opponent.position);
    this.opponent.face(this.player.position);
  }

  stop() {
    this.landingTarget=null;
    if(this.matchClaimed){
      this.player.setCourtSpeedScale(this.priorPlayerSpeed);
      this.opponent.setCourtSpeedScale(this.priorOpponentSpeed);
    }
    this.matchClaimed=false;
    this.player.matchCompetitor=this.opponent.matchCompetitor=false;
    this.movementX=this.movementZ=0;
    this.bouncePulse=0;
    this.playerHitPraise=0;
    this.enabled = false;
    this.ball.active = false;
    this.pending = null;
    this.trail.reset();
    this.trailSpeed = 0;
    this.impactBurst = 0;
    this.impactAge = 1;
    this.player.clearCourtMove();
    this.opponent.clearCourtMove();
    this.player.clearShotIntent();
    this.opponent.clearShotIntent();
    this.player.setLook(undefined);
    this.opponent.setLook(undefined);
  }

  update(dt: number) {
    if (!this.enabled || this.pointResolved || !Number.isFinite(dt) || dt <= 0) {
      return;
    }

    this.input.update(dt);
    this.playerHitPraise=Math.max(0,this.playerHitPraise-dt);
    this.bouncePulse=Math.max(0,this.bouncePulse-dt*3);
    this.impactAge+=dt;
    this.impactBurst = Math.max(0, 1-this.impactAge/CHAMPIONSHIP_CONTACT_FEEL[this.impactQuality].duration);

    this.updatePlayerMovement(dt);

    if (this.pending) {
      this.updatePendingContact(dt);
    }

    if (this.ball.active) {
      this.updateBall(dt);
      return;
    }

    // A pending swing temporarily owns the visual ball. Do not start another
    // shot until that contact has either released the ball or resolved a miss.
    if (this.pending) return;

    if (this.rallyLength === 0 && this.flightHitter === null) {
      this.updateServe(dt);
    }
  }

  private updateServe(dt: number) {
    if (this.server === 'player') {
      if (!this.input.hasBufferedSwing()) return;

      this.input.consumeSwing();
      this.prepareShot('player', 'serve', 'clean');
      return;
    }

    this.opponentServeDelay -= dt;
    if (this.opponentServeDelay <= 0) {
      const quality = this.aiQuality(true);
      this.prepareShot('opponent', 'serve', quality);
    }
  }

  private updatePlayerMovement(dt: number) {
    const intent=this.input.movement();
    const moving=Math.hypot(intent.x,intent.z)>.01;
    const reversing=intent.x*this.movementX+intent.z*this.movementZ<0;
    const rate=reversing?CHAMPIONSHIP_TUNING.movementReverseSharpness:moving?CHAMPIONSHIP_TUNING.movementAcceleration:CHAMPIONSHIP_TUNING.movementDeceleration;
    const k=1-Math.exp(-rate*dt);
    this.movementX+=(intent.x-this.movementX)*k;
    this.movementZ+=(intent.z-this.movementZ)*k;
    const strength=Math.hypot(this.movementX,this.movementZ);
    if(strength<.025){
      this.player.clearCourtMove();
      if(!this.pending||this.pending.hitter!==this.player)this.player.setAnimation('ready');
      return;
    }
    this.player.setCourtSpeedScale(CHAMPIONSHIP_TUNING.playerMaxCourtSpeedScale*strength);
    const striking=this.pending?.hitter===this.player&&this.pending.stroke!=='serve'&&!this.pending.released;
    // Fast steering stays live through the stroke, but a forward chase may not
    // carry the body through its own planted string-bed contact.
    const contactZ=striking?this.pending?.contactTarget?.z:undefined;
    const frontLimit=contactZ===undefined?.9:Math.min(5.65,Math.max(.9,contactZ+.48));
    this.player.steerOnCourt(new Vec3(
      clamp(this.player.position.x+this.movementX/strength*.8,SINGLES_MIN_X+.15,SINGLES_MAX_X-.15),0,
      clamp(this.player.position.z+this.movementZ/strength*.8,frontLimit,5.65)),this.opponent.position);
  }

  /** Meet the ball ahead of the body, not at the baseline under our feet. */
  private timeToStrikePlane(character:Character){
    const plane=character.position.z-Math.sign(character.position.z)*.65;
    return (plane-this.ball.position.z)/this.ball.velocity.z;
  }

  /** An edge HUD cue shares the physical return window with the input consumer. */
  playerCue():'none'|'swing'|'queued'|'sweet'|'nice' {
    if(this.playerHitPraise>0)return this.lastPlayerQuality==='perfect'?'sweet':'nice';
    if(this.enabled&&!this.pending&&this.ball.active&&this.receiver==='player'&&this.input.hasBufferedSwing())return 'queued';
    if(!this.enabled||this.pending||!this.ball.active||this.receiver!=='player')return 'none';
    const t=this.timeToStrikePlane(this.player);
    return t>-CHAMPIONSHIP_TUNING.returnLateGraceSeconds&&t<CHAMPIONSHIP_TUNING.returnCueLeadSeconds&&Math.abs(this.ball.position.x-this.player.position.x)<CHAMPIONSHIP_TUNING.playerReturnReach?'swing':'none';
  }

  private updateBall(dt: number) {
    this.player.setLook(this.ball.position);
    this.opponent.setLook(this.ball.position);

    // Consume the player's current intention before advancing the ball. A late
    // press must not lose another whole frame of its already narrow distance.
    if(this.receiver==='player'&&!this.pending){
      this.tryPlayerReturn();
      if(this.pending){
        this.updatePendingContact(0);
        if(!this.ball.active)return;
      }
    }
    const beforeActive = this.ball.active;
    const event = this.ball.update(dt);
    const speed = this.ball.velocity.len();
    this.trailSpeed = speed;

    this.trail.update(this.ball.position,dt);

    if (event.net) {
      this.callbacks.onNet?.();
      this.resolvePoint(this.otherSide(this.flightHitter ?? this.server), 'net');
      return;
    }

    if (event.bounced) {
      this.landingTarget=this.ball.position.clone();
      this.bouncePosition=this.ball.position.clone();this.bouncePulse=1;
      this.callbacks.onBounce?.();

      if (!this.firstBounceSeen && !this.inSinglesCourt(this.ball.position)) {
        const reason: InteractivePointReason =
          this.ball.position.z < PLAYABLE_MIN_Z || this.ball.position.z > PLAYABLE_MAX_Z
            ? 'long'
            : 'wide';

        this.resolvePoint(this.otherSide(this.flightHitter ?? this.server), reason);
        return;
      }

      if (!this.firstBounceSeen) {
        this.firstBounceSeen = true;
      } else {
        // Two legal bounces means the striker won the point.
        this.resolvePoint(this.flightHitter ?? this.server, 'doubleBounce');
        return;
      }
    }

    if (this.receiver === 'player') {
      this.tryPlayerReturn();
    } else {
      this.tryOpponentReturn(dt);
    }

    // BallPhysics also deactivates balls that leave its broad simulation bounds.
    // If that occurs before a return, score the point instead of leaving the
    // championship state waiting forever for an inactive ball.
    if (beforeActive && !this.ball.active && !this.pending && !this.pointResolved) {
      const striker = this.flightHitter ?? this.server;
      const winner = this.firstBounceSeen ? striker : this.otherSide(striker);
      const reason: InteractivePointReason = this.firstBounceSeen ? 'miss' : 'long';
      this.resolvePoint(winner, reason);
    }
  }

  private tryPlayerReturn() {
    if (!this.firstBounceSeen || !this.input.hasBufferedSwing()) return;

    const velocityZ = this.ball.velocity.z;
    if (velocityZ <= 0.05) return;

    const timeToPlayer = this.timeToStrikePlane(this.player);
    const stroke = timeToPlayer < .13 ? 'volley' : this.strokeFor(this.player);
    const contactAt = this.player.shotContactTime(stroke);

    // Do not consume a buffered press until the ball can plausibly meet the
    // player's racket during this animation. Slightly early inputs remain alive
    // through MatchInput's buffer instead of disappearing.
    const inFront=this.player.position.z-this.ball.position.z;
    if (timeToPlayer < -CHAMPIONSHIP_TUNING.returnLateGraceSeconds ||
        timeToPlayer > contactAt + CHAMPIONSHIP_TUNING.returnEarlyLeadSeconds ||
        inFront < .12) return;

    const lateralGap = Math.abs(this.ball.position.x - this.player.position.x);
    if (lateralGap > CHAMPIONSHIP_TUNING.playerReturnReach) return;

    const pressAge = this.input.bufferedSwingAge();
    const timingAtPress = timeToPlayer + pressAge;
    const timingError = timingAtPress - contactAt;
    const quality = this.playerQuality(timingError, lateralGap);

    this.input.consumeSwing();
    this.prepareShot('player', stroke, quality);
  }

  private tryOpponentReturn(dt: number) {
    if (!this.firstBounceSeen) return;

    const velocityZ = this.ball.velocity.z;
    if (velocityZ >= -0.05) return;

    const contactAt = this.opponent.shotContactTime(this.strokeFor(this.opponent));
    const timeToOpponent = this.timeToStrikePlane(this.opponent);

    const anticipation = this.opponentProfile.anticipation;
    const desiredX = clamp(
      this.ball.position.x + this.ball.velocity.x * Math.max(0, timeToOpponent) * anticipation,
      SINGLES_MIN_X,
      SINGLES_MAX_X,
    );

    this.opponent.steerOnCourt(
      new Vec3(desiredX, 0, -this.opponentProfile.courtDepth),
      this.player.position,
    );

    // Reaction time is represented by waiting longer before committing to the
    // stroke. Better opponents therefore prepare closer to the ideal animation
    // lead without receiving impossible movement or teleportation.
    const reactionPenalty = this.opponentProfile.reaction * 0.45;
    const commitThreshold = contactAt + 0.1 - reactionPenalty;

    if (timeToOpponent <= 0.05 || timeToOpponent > commitThreshold) return;

    const lateralGap = Math.abs(this.ball.position.x - this.opponent.position.x);
    const reach = 1.25 + this.opponentProfile.contactWindow * 0.65;

    if (lateralGap > reach) return;

    const quality = this.aiQuality(false);
    this.prepareShot('opponent', this.strokeFor(this.opponent), quality);
  }

  private prepareShot(side: Side, stroke: Stroke, quality: InteractiveShotQuality) {
    if (this.pending || this.pointResolved) return;

    const hitter = side === 'player' ? this.player : this.opponent;
    const receiver = side === 'player' ? this.opponent : this.player;
    const contactAt = hitter.shotContactTime(stroke);
    const duration = hitter.shotDuration(stroke);
    const predictedContact = this.predictedIncomingContact(contactAt, hitter);
    const target = this.targetFor(side, quality);
    const flightTime = this.flightTimeFor(side, quality);

    if (stroke !== 'serve') {
      hitter.setIncomingContact(predictedContact);
    }

    hitter.face(target);
    hitter.setLook(receiver.position);
    hitter.triggerShot(stroke, target);
    const contactTarget=hitter.debugKinematics().contactTarget?.clone()??null;
    const arrival=this.timeToStrikePlane(hitter);
    // A buffered late press needs earlier capture, not another full wind-up
    // of free flight past the player followed by a backwards correction.
    const captureAt=stroke==='serve'?0:Math.max(0,Math.min(contactAt-.11,arrival-.10));

    this.pending = {
      hitter,
      receiver,
      side,
      stroke,
      quality,
      target,
      flightTime,
      contactAt,
      duration,
      captureAt,
      incomingStart: stroke === 'serve' ? null : this.ball.position.clone(),
      contactTarget,
      tossStart: hitter.serveTossPoint(),
      captured: stroke === 'serve',
      impactStarted: false,
      released: false,
      latchRemaining: 0,
      normalDirection: 1,
    };

    if (stroke === 'serve') {
      this.ball.active = false;
    }
  }

  private updatePendingContact(dt: number) {
    const pending = this.pending;
    if (!pending) return;

    if (!pending.captured && pending.hitter.animTime >= pending.captureAt) {
      pending.incomingStart = this.ball.position.clone();
      this.ball.active = false;
      pending.captured = true;
    }

    if (!pending.released) {
      if (!pending.impactStarted) {
        const staged = this.stagedBall(pending);
        const frame = pending.hitter.racketContactFrame();
        const gap = Vec3.sub(staged, frame.center).len();
        const contactWindow = pending.hitter.animTime >= pending.contactAt - 0.025;

        if (pending.captured && contactWindow && gap <= 0.12) {
          pending.impactStarted = true;
          const feel=CHAMPIONSHIP_CONTACT_FEEL[pending.quality];
          pending.latchRemaining = feel.dwell;
          this.flightHitter = pending.side;
          this.receiver = this.otherSide(pending.side);
          this.firstBounceSeen = false;
          this.rallyLength += 1;
          this.bestRally = Math.max(this.bestRally, this.rallyLength);

          this.lastContact = frame.center.clone();
          this.lastContactFrame = {
            rotation: frame.rotation.clone(),
            horizontal: frame.horizontal.clone(),
            vertical: frame.vertical.clone(),
          };

          pending.normalDirection=Vec3.dot(Vec3.sub(pending.target,frame.center),frame.normal)>=0?1:-1;
          pending.hitter.notifyRacketImpact(pending.quality,pending.normalDirection);
          pending.hitter.holdRacketContact(feel.hold);

          this.impactAge=0;
          this.impactQuality=pending.quality;
          this.impactBurst = 1;
          if(pending.side==='player'){
            this.playerHitPraise=.42;
            this.lastPlayerQuality=pending.quality;
          }
          this.callbacks.onHit?.(pending.quality,pending.side,clamp((pending.target.x-frame.center.x)/4,-1,1));
          this.callbacks.onRallyContact?.(pending.side, pending.quality);
        }
      } else {
        pending.latchRemaining -= dt;

        if (pending.latchRemaining <= 0) {
          const frame = pending.hitter.racketContactFrame();
          pending.released = true;
          this.ball.launch(frame.center, pending.target, pending.flightTime);
          this.landingTarget=this.ball.firstLanding();
          this.trail.reset();
          this.trailSpeed = this.ball.velocity.len();
        }
      }
    }

    // A visibly completed swing that never reached the ball is a real miss.
    if (
      pending.hitter.animTime >= pending.duration &&
      !pending.impactStarted &&
      !this.pointResolved
    ) {
      this.resolvePoint(this.otherSide(pending.side), 'miss');
      return;
    }

    if (pending.hitter.animTime >= pending.duration && pending.released) {
      if (pending.hitter.state === pending.stroke) {
        pending.hitter.setAnimation('ready');
        pending.hitter.clearShotIntent();

        const baselineZ = pending.side === 'player' ? PLAYER_BASELINE_Z : OPPONENT_BASELINE_Z;
        if(pending.side==='opponent')pending.hitter.moveOnCourt(
          new Vec3(pending.hitter.position.x+(COURT_CENTER_X-pending.hitter.position.x)*this.opponentProfile.recovery,0,baselineZ),pending.receiver.position,false);
        // Player steering survives the stroke; no automatic walk to center.
      }

      this.pending = null;
    }
  }

  private stagedBall(pending: PendingContact) {
    const frame = pending.hitter.racketContactFrame();
    const liveContact = frame.center;
    if(pending.impactStarted){
      return liveContact.clone().add(frame.normal.clone().scale(
        pending.hitter.racketStringOffset()+pending.normalDirection*.035));
    }
    const plannedContact = pending.contactTarget ?? liveContact;
    const remaining = Math.max(0.001, pending.contactAt - pending.captureAt);
    const progress = clamp(
      (pending.hitter.animTime - pending.captureAt) / remaining,
      0,
      1,
    );

    if (pending.stroke === 'serve') {
      const tossProgress = clamp(pending.hitter.animTime / pending.contactAt, 0, 1);
      const rise = smoothstep(0, 0.72, tossProgress);
      const settle = smoothstep(0.72, 1, tossProgress);
      const ball = Vec3.lerp(pending.tossStart, liveContact, rise);
      ball.y += Math.sin(Math.PI * tossProgress) * (0.58 - 0.18 * settle);
      return ball;
    }

    const incoming = pending.incomingStart ?? plannedContact;
    const ball = Vec3.lerp(incoming, plannedContact, smoothstep(0, 0.78, progress));

    // The last part of travel converges on the live string bed. This is the
    // same key principle used by the autonomous RallySystem: presentation can
    // assist the meeting, but release still waits for actual racket proximity.
    return Vec3.lerp(ball, liveContact, smoothstep(0.72, 1, progress));
  }

  private predictedIncomingContact(contactAt: number, hitter: Character) {
    if (!this.ball.active) {
      return new Vec3(hitter.position.x, 1.05, hitter.position.z - 0.25);
    }

    const time = clamp(contactAt, 0.08, 0.42);
    return new Vec3(
      this.ball.position.x + this.ball.velocity.x * time,
      Math.max(
        this.ball.radius,
        this.ball.position.y +
          this.ball.velocity.y * time +
          0.5 * this.ball.gravity * time * time,
      ),
      this.ball.position.z + this.ball.velocity.z * time,
    );
  }

  private strokeFor(character: Character): Stroke {
    if (!this.ball.active) return 'serve';

    const localX = (this.ball.position.x - character.position.x)*-Math.sign(character.position.z);
    return localX < -0.12 ? 'swingBackhand' : 'swingForehand';
  }

  private playerQuality(timingError: number, lateralGap: number): InteractiveShotQuality {
    const error = Math.abs(timingError);
    const spacingPenalty = Math.max(0, lateralGap - 1.05) * 0.055;
    const adjusted = error + spacingPenalty;

    if (adjusted <= CHAMPIONSHIP_TUNING.perfectWindowSeconds) return 'perfect';
    if (adjusted <= CHAMPIONSHIP_TUNING.cleanWindowSeconds) return 'clean';
    if (adjusted <= CHAMPIONSHIP_TUNING.defensiveWindowSeconds) return 'defensive';
    // An intentional return in the generous physical window stays playable.
    // Timing rewards power and feedback; it does not randomly spray a novice's ball out.
    return 'defensive';
  }

  private aiQuality(serve: boolean): InteractiveShotQuality {
    const seed =
      this.shotSequence * 7.13 +
      this.opponentProfile.id.length * 11.7 +
      (serve ? 3.1 : 0);
    const roll = hash(seed);
    const precision =
      this.opponentProfile.contactWindow * 0.42 +
      this.opponentProfile.aimAccuracy * 0.34 +
      this.opponentProfile.anticipation * 0.24;

    this.shotSequence += 1;

    if (roll < precision * 0.17) return 'perfect';
    if (roll < precision * 0.78) return 'clean';
    if (roll < 0.94 - this.opponentProfile.riskTolerance * 0.08) return 'defensive';
    return 'frame';
  }

  private targetFor(side: Side, quality: InteractiveShotQuality) {
    const direction=side==='player'?-1:1;
    const receiver=side==='player'?this.opponent:this.player;
    const assisted=side==='opponent'&&this.rallyLength<CHAMPIONSHIP_TUNING.assistContacts;
    const seed=this.shotSequence*4.37+(side==='player'?2.1:9.3)+this.rallyLength*1.7;
    const variation=(hash(seed)*2-1)*(assisted?CHAMPIONSHIP_TUNING.assistOpponentSpread:.55+this.opponentProfile.angleBias*.9);
    // Bounce BEFORE the receiver's strike zone. Baseline-targeting made the
    // old first return effectively impossible, because the ball bounced at the feet.
    let x=clamp(receiver.position.x+variation,SINGLES_MIN_X+.75,SINGLES_MAX_X-.75);
    let depth=quality==='perfect'?3.25:quality==='clean'?2.95:2.25;
    if(assisted){x=clamp(receiver.position.x+.20+variation,-2.3,4.3);depth=clamp(receiver.position.z-2.3,1.5,3.1);}
    if(side==='player'){
      // Steering also places the next shot. Releasing the stick gives a forgiving
      // neutral return; holding left/right rewards chasing with a chosen angle.
      const aim=this.input.movement().x;
      if(Math.abs(aim)>.18)x=clamp(COURT_CENTER_X+aim*3.15+variation*.2,SINGLES_MIN_X+.6,SINGLES_MAX_X-.6);
    }
    if(quality==='frame'){
      x+=(hash(seed+18.4)-.5)*2.1;
      depth=hash(seed+9)>.85?6.45:2.15;
    }
    return new Vec3(x,this.ball.radius,direction*depth);
  }

  private flightTimeFor(side: Side, quality: InteractiveShotQuality) {
    if(side==='opponent'&&this.rallyLength<CHAMPIONSHIP_TUNING.assistContacts)
      return this.rallyLength===0?CHAMPIONSHIP_TUNING.assistOpponentServeFlightSeconds:CHAMPIONSHIP_TUNING.assistOpponentFlightSeconds;
    const power=side==='opponent'?this.opponentProfile.power:.78;
    return (quality==='perfect'?.96:quality==='clean'?1.02:1.14)-(power-.75)*.12;
  }

  private inSinglesCourt(position: Vec3) {
    return (
      position.x >= SINGLES_MIN_X &&
      position.x <= SINGLES_MAX_X &&
      position.z >= PLAYABLE_MIN_Z &&
      position.z <= PLAYABLE_MAX_Z
    );
  }

  private resolvePoint(winner: Side, reason: InteractivePointReason) {
    if (this.pointResolved) return;

    this.pointResolved = true;
    this.impactBurst=0;this.impactAge=1;
    this.player.clearShotIntent();this.opponent.clearShotIntent();
    this.landingTarget=null;
    this.ball.active = false;
    this.pending = null;
    this.trail.reset();
    this.input.reset();

    const winnerCharacter = winner === 'player' ? this.player : this.opponent;
    const loserCharacter = winner === 'player' ? this.opponent : this.player;

    winnerCharacter.setEmotion('pleased', 0.75);
    loserCharacter.setEmotion(reason === 'net' ? 'frustrated' : 'disappointed', 0.75);

    if (reason === 'winner' || this.rallyLength >= 6) {
      winnerCharacter.trigger('celebrate');
    } else {
      loserCharacter.trigger('reactMiss');
    }

    this.player.moveOnCourt(new Vec3(COURT_CENTER_X,0,PLAYER_BASELINE_Z),this.opponent.position,false);
    this.opponent.moveOnCourt(new Vec3(COURT_CENTER_X,0,-this.opponentProfile.courtDepth),this.player.position,false);
    this.callbacks.onPoint?.(winner, reason, this.rallyLength);
  }

  private otherSide(side: Side): Side {
    return side === 'player' ? 'opponent' : 'player';
  }

  meshes(reducedMotion=false): Mesh[] {
    const meshes: Mesh[] = [];
    // Only the incoming player's flight gets a cue. It predicts the actual
    // bounce; it never moves the player or creates a successful return.
    const landing=this.landingTarget;
    if(this.ball.active&&this.receiver==='player'&&landing&&this.inSinglesCourt(landing)&&!this.pending?.captured){
      meshes.push({id:'incoming-landing',kind:'torus',position:new Vec3(landing.x,.116,landing.z),
        rotation:new Vec3(Math.PI/2,0,0),scale:new Vec3(CHAMPIONSHIP_TUNING.landingCueScale,CHAMPIONSHIP_TUNING.landingCueScale,.065),
        color:'#fff4bd',alpha:CHAMPIONSHIP_TUNING.landingCueOpacity,unlit:true,noShadow:true});
    }
    const visible=this.pending&&this.pending.captured&&!this.pending.released?this.stagedBall(this.pending):this.ball.active?this.ball.position:null;
    if(visible){
      meshes.push({kind:'sphere',position:new Vec3(visible.x,.108,visible.z),scale:new Vec3(.25,.015,.25),color:'#152c23',alpha:.48,unlit:true,noShadow:true});
      meshes.push({kind:'sphere',position:visible.clone(),scale:new Vec3(CHAMPIONSHIP_TUNING.ballHaloRadius,CHAMPIONSHIP_TUNING.ballHaloRadius,CHAMPIONSHIP_TUNING.ballHaloRadius),color:'#fffbc3',alpha:.13,unlit:true,noShadow:true});
    }
    if(this.bouncePulse>0&&!reducedMotion)meshes.push({kind:'torus',position:new Vec3(this.bouncePosition.x,.12,this.bouncePosition.z),rotation:new Vec3(Math.PI/2,0,0),scale:new Vec3(.3+(1-this.bouncePulse)*.5,.3+(1-this.bouncePulse)*.5,.045),color:'#fff4bd',alpha:this.bouncePulse*.6,unlit:true,noShadow:true});

    if (this.pending && this.pending.captured && !this.pending.released) {
      const ball = this.stagedBall(this.pending);
      const scale = this.pending.impactStarted
        ? new Vec3(0.30, 0.30, 0.085)
        : new Vec3(CHAMPIONSHIP_TUNING.ballVisualRadius,CHAMPIONSHIP_TUNING.ballVisualRadius,CHAMPIONSHIP_TUNING.ballVisualRadius);

      meshes.push({
        kind: 'sphere',
        id:'match-ball',
        position: ball,
        rotation:this.pending.hitter.racketContactFrame().rotation,
        scale,
        color: '#f5ff7a',emission:.45,
        unlit: true,
        noShadow: this.pending.impactStarted,
      });
    }

    if (this.ball.active) {
      meshes.push(...this.trail.meshes(this.ball.position,reducedMotion));
      const age=(1-this.bouncePulse)/3;
      const diameter=CHAMPIONSHIP_TUNING.ballVisualRadius;
      const squash=!reducedMotion&&this.bouncePulse>0&&age<.055;
      const stretch=reducedMotion?1:1+Math.min(.32,this.trailSpeed*.015);
      const velocity=this.ball.velocity;
      const rotation=squash?new Vec3():new Vec3(
        Math.atan2(Math.hypot(velocity.x,velocity.z),velocity.y),Math.atan2(velocity.x,velocity.z),0);
      const scale=squash?new Vec3(diameter*1.28,diameter*.58,diameter*1.28)
        :new Vec3(diameter/Math.sqrt(stretch),diameter*stretch,diameter/Math.sqrt(stretch));

      meshes.push({
        kind: 'sphere',
        id:'match-ball',
        position: this.ball.position.clone(),
        rotation,scale,
        color: '#f5ff7a',emission:.45,
        unlit: true,
      });
    }

    if (!reducedMotion && this.impactBurst > 0 && this.lastContact && this.lastContactFrame) {
      const frame = this.lastContactFrame;
      const feel=CHAMPIONSHIP_CONTACT_FEEL[this.impactQuality];
      const age=1-this.impactBurst;
      const release=1-(1-age)*(1-age);
      const expansion = .18+release*.48*feel.flare;
      const color=this.impactQuality==='perfect'?'#fff1b7':this.impactQuality==='frame'?'#d9b7a4':'#dcf781';
      const count=this.impactQuality==='perfect'?8:this.impactQuality==='clean'?5:3;
      for(let i=0;i<count;i++){
        const angle=i*Math.PI*2/count;
        const spark=this.lastContact.clone()
          .add(frame.horizontal.clone().scale(Math.cos(angle)*(.10+release*.52*feel.flare)))
          .add(frame.vertical.clone().scale(Math.sin(angle)*(.10+release*.52*feel.flare)));
        const size=.055*(.5+this.impactBurst*.5)*feel.flare;
        meshes.push({kind:'sphere',position:spark,scale:new Vec3(size,size,size),color:i%2?'#fff5d0':color,alpha:this.impactBurst*.85,unlit:true,noShadow:true});
      }


      meshes.push({
        kind: 'torus',
        position: this.lastContact.clone(),
        rotation: frame.rotation.clone(),
        scale: new Vec3(expansion, expansion * 1.08, 0.13),
        color,
        alpha: Math.min(.85,this.impactBurst*.72*feel.flare),
        unlit: true,
        noShadow: true,
      });

      meshes.push({
        kind: 'torus',
        position: this.lastContact.clone(),
        rotation: frame.rotation.clone(),
        scale: new Vec3(expansion * 0.68, expansion * 0.74, 0.09),
        color: '#bce453',
        alpha: Math.min(0.6, 0.42 * this.impactBurst),
        unlit: true,
        noShadow: true,
      });
    }

    return meshes;
  }
}
