import {COURT,COURT_MIN_X,COURT_MAX_X} from './CourtGeometry.js';
import { Vec3, clamp, smoothstep } from '../rendering/Math3D.js';
import type { Mesh } from '../rendering/Renderer.js';
import type { Character } from '../entities/Character.js';
import { BallPhysics, solveLaunch } from './BallPhysics.js';
import { BallTrail } from './BallTrail.js';
import type { ChampionshipOpponentProfile } from './ChampionshipController.js';
import { CHAMPIONSHIP_TUNING, CHAMPIONSHIP_CONTACT_FEEL } from './ChampionshipTuning.js';
import type { MatchInput, MatchShot } from './MatchInput.js';

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
  shot: MatchShot;
  target: Vec3;
  flightTime: number;
  contactAt: number;
  duration: number;
  captureAt: number;
  incomingStart: Vec3 | null;
  contactTarget: Vec3 | null;
  captured: boolean;
  impactStarted: boolean;
  released: boolean;
  latchRemaining: number;
  normalDirection: number;
}

export interface InteractiveMatchCallbacks {
  onHit?: (quality: InteractiveShotQuality,side:Side,direction:number,speed:number,shot:MatchShot) => void;
  onBounce?: () => void;
  onNet?: () => void;
  onRallyContact?: (side: Side, quality: InteractiveShotQuality) => void;
  onPoint?: (winner: Side, reason: InteractivePointReason, rallyLength: number) => void;
}

const COURT_CENTER_X = COURT.centerX;
const PLAYER_BASELINE_Z = COURT.baselineDepth;
const SINGLES_MIN_X = COURT_MIN_X;
const SINGLES_MAX_X = COURT_MAX_X;
const PLAYABLE_MIN_Z = -COURT.halfLength;
const PLAYABLE_MAX_Z = COURT.halfLength;

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
  private lastPlayerShot:MatchShot='drive';
  playerReturns=0;
  playerLobs=0;
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
  private pointResultAge = 0;
  private firstBounceSeen = false;
  private shotSequence = 0;
  private opponentServeDelay = 0;
  private opponentReadDelay = 0;
  private playerLaneMemory = 0;
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
    this.pointResultAge = 0;
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
    this.opponentReadDelay = 0;
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
    if (!this.enabled || !Number.isFinite(dt) || dt <= 0) {
      return;
    }

    if(this.pointResolved){
      const before=this.pointResultAge;this.pointResultAge+=dt;
      if(before<CHAMPIONSHIP_TUNING.pointReactionSeconds&&this.pointResultAge>=CHAMPIONSHIP_TUNING.pointReactionSeconds){
        // A stopped steering input must not turn baseline recovery into a crawl.
        this.player.setCourtSpeedScale(CHAMPIONSHIP_TUNING.playerMaxCourtSpeedScale);
        this.player.moveOnCourt(new Vec3(COURT_CENTER_X,0,PLAYER_BASELINE_Z),this.opponent.position,false);
        this.opponent.moveOnCourt(new Vec3(COURT_CENTER_X,0,-this.opponentProfile.courtDepth),this.player.position,false);
      }
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

      const aim = this.input.bufferedSwingAim();
      this.input.consumeSwing();
      this.prepareShot('player', 'serve', 'clean', aim);
      return;
    }

    this.opponentServeDelay -= dt;
    if (this.opponentServeDelay <= 0) {
      const quality = this.aiQuality(true);
      this.prepareShot('opponent', 'serve', quality);
    }
  }

  private updatePlayerMovement(dt: number) {
    const serving=this.pending?.hitter===this.player&&this.pending.stroke==='serve';
    if(serving&&this.player.animTime<this.pending!.contactAt+.18){
      this.movementX=this.movementZ=0;this.player.clearCourtMove();return;
    }
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
    const frontLimit=contactZ===undefined?.9:Math.min(COURT.baselineDepth,Math.max(.9,contactZ+.48));
    this.player.steerOnCourt(new Vec3(
      clamp(this.player.position.x+this.movementX/strength*.8,SINGLES_MIN_X+.15,SINGLES_MAX_X-.15),0,
      clamp(this.player.position.z+this.movementZ/strength*.8,frontLimit,COURT.baselineDepth)),this.opponent.position);
  }

  /** Meet the ball ahead of the body, not at the baseline under our feet. */
  private timeToStrikePlane(character:Character){
    const plane=character.position.z-Math.sign(character.position.z)*.65;
    return (plane-this.ball.position.z)/this.ball.velocity.z;
  }

  private get playerReturnReach() {
    // The opening exchange teaches timing; later returns also require court positioning.
    return this.rallyLength<CHAMPIONSHIP_TUNING.assistContacts
      ?CHAMPIONSHIP_TUNING.assistPlayerReturnReach:CHAMPIONSHIP_TUNING.playerReturnReach;
  }

  /** An edge HUD cue shares the physical return window with the input consumer. */
  playerCue():'none'|'swing'|'queued'|'sweet'|'nice'|'serving' {
    if(this.pending?.side==='player'&&this.pending.stroke==='serve'&&!this.pending.released)return 'serving';
    if(this.playerHitPraise>0)return this.lastPlayerQuality==='perfect'?'sweet':'nice';
    if(this.enabled&&!this.pending&&this.ball.active&&this.receiver==='player'&&this.input.hasBufferedSwing())return 'queued';
    if(!this.enabled||this.pending||!this.ball.active||this.receiver!=='player')return 'none';
    const t=this.timeToStrikePlane(this.player);
    return t>-CHAMPIONSHIP_TUNING.returnLateGraceSeconds&&t<CHAMPIONSHIP_TUNING.returnCueLeadSeconds&&Math.abs(this.ball.position.x-this.player.position.x)<this.playerReturnReach?'swing':'none';
  }

  /** HUD reads completed contacts; pressing a button alone never earns progress. */
  shotLesson() {
    return {returns:this.playerReturns,lobs:this.playerLobs,lastShot:this.lastPlayerShot};
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
      this.positionOpponent(dt);
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
    if (lateralGap > this.playerReturnReach) return;

    const pressAge = this.input.bufferedSwingAge();
    const timingAtPress = timeToPlayer + pressAge;
    const timingError = timingAtPress - contactAt;
    const quality = this.playerQuality(timingError, lateralGap);

    const aim = this.input.bufferedSwingAim();
    const shot = this.input.bufferedSwingShot();
    this.input.consumeSwing();
    this.prepareShot('player', stroke, quality, aim, shot);
  }

  private tryOpponentReturn(dt: number) {
    if (!this.firstBounceSeen) return;

    const velocityZ = this.ball.velocity.z;
    if (velocityZ >= -0.05) return;

    const contactAt = this.opponent.shotContactTime(this.strokeFor(this.opponent));
    const timeToOpponent = this.timeToStrikePlane(this.opponent);

    // Reaction time is represented by waiting longer before committing to the
    // stroke. Better opponents therefore prepare closer to the ideal animation
    // lead without receiving impossible movement or teleportation.
    const reactionPenalty = this.opponentProfile.reaction * 0.45;
    const commitThreshold = contactAt + 0.1 - reactionPenalty;

    if (timeToOpponent <= 0.05 || timeToOpponent > commitThreshold) return;

    const lateralGap = Math.abs(this.ball.position.x - this.opponent.position.x);
    const reach = .85 + this.opponentProfile.contactWindow * 0.65;

    if (lateralGap > reach) return;

    const quality = this.aiQuality(false);
    this.prepareShot('opponent', this.strokeFor(this.opponent), quality);
  }

  private positionOpponent(dt:number) {
    if(this.pending?.side==='opponent')return;
    this.opponentReadDelay-=dt;
    if(this.opponentReadDelay>0)return;
    // Read periodically, then commit to walking there. No continuous perfect tracking.
    this.opponentReadDelay=.16+this.opponentProfile.reaction;
    const landing=this.landingTarget??this.ball.firstLanding();
    const depth=Math.min(COURT.baselineDepth,Math.max(this.recoveryDepth(),Math.abs(landing?.z??3)+2.1));
    const time=(-depth+.65-this.ball.position.z)/this.ball.velocity.z;
    const error=(hash(this.shotSequence*13.7+this.rallyLength)*2-1)*(1-this.opponentProfile.anticipation)*.6;
    const x=clamp(this.ball.position.x+this.ball.velocity.x*Math.max(0,time)*this.opponentProfile.anticipation+error,SINGLES_MIN_X,SINGLES_MAX_X);
    this.opponent.steerOnCourt(new Vec3(x,0,-depth),this.player.position);
  }

  private recoveryDepth() {
    // Pressure players take time away; a deep lob makes them visibly retreat.
    return this.rallyLength>=CHAMPIONSHIP_TUNING.assistContacts&&this.opponentProfile.style==='pressure'
      ?5.4:this.opponentProfile.courtDepth;
  }

  private prepareShot(side: Side, stroke: Stroke, quality: InteractiveShotQuality, aim?: number, shot: MatchShot = 'drive') {
    if (this.pending || this.pointResolved) return;

    const hitter = side === 'player' ? this.player : this.opponent;
    const receiver = side === 'player' ? this.opponent : this.player;
    const contactAt = hitter.shotContactTime(stroke);
    const duration = hitter.shotDuration(stroke);
    const predictedContact = this.predictedIncomingContact(contactAt, hitter);
    const target = this.targetFor(side, quality, aim, shot);
    const flightTime = this.flightTimeFor(side, quality, shot);

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
      shot,
      target,
      flightTime,
      contactAt,
      duration,
      captureAt,
      incomingStart: stroke === 'serve' ? null : this.ball.position.clone(),
      contactTarget,
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
    if(pending.stroke==='serve'&&!pending.impactStarted&&pending.hitter.state!=='serve'){
      this.resolvePoint(this.otherSide(pending.side),'miss');return;
    }

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

        // The serve toss must reach the strings, rather than triggering on the wider return-assist radius.
        if (pending.captured && contactWindow && gap <= (pending.stroke==='serve'?.055:.12)) {
          pending.impactStarted = true;
          const feel=CHAMPIONSHIP_CONTACT_FEEL[pending.quality];
          pending.latchRemaining = pending.stroke==='serve'?0:feel.dwell;
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
          if(pending.stroke!=='serve')pending.hitter.holdRacketContact(feel.hold);

          this.impactAge=0;
          this.impactQuality=pending.quality;
          this.impactBurst = 1;
          if(pending.side==='player'){
            this.playerHitPraise=.42;
            this.lastPlayerQuality=pending.quality;
            this.lastPlayerShot=pending.shot;
            if(pending.stroke!=='serve'){
              this.playerReturns++;
              if(pending.shot==='lob')this.playerLobs++;
            }
          }
          this.callbacks.onHit?.(pending.quality,pending.side,clamp((pending.target.x-frame.center.x)/4,-1,1),solveLaunch(frame.center,pending.target,pending.flightTime,this.ball.gravity).len(),pending.shot);
          this.callbacks.onRallyContact?.(pending.side, pending.quality);
          if(pending.stroke==='serve')this.releaseBall(pending,frame.center);
        }
      } else {
        pending.latchRemaining -= dt;

        if (pending.latchRemaining <= 0) {
          const frame = pending.hitter.racketContactFrame();
          this.releaseBall(pending,frame.center);
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

        if(pending.side==='opponent')pending.hitter.moveOnCourt(
          new Vec3(pending.hitter.position.x+(COURT_CENTER_X+this.playerLaneMemory*.35-pending.hitter.position.x)*this.opponentProfile.recovery,0,-this.recoveryDepth()),pending.receiver.position,false);
        // Player steering survives the stroke; no automatic walk to center.
      }

      this.pending = null;
    }
  }

  private releaseBall(pending:PendingContact,point:Vec3){
    pending.released=true;this.ball.launch(point,pending.target,pending.flightTime);
    this.landingTarget=this.ball.firstLanding();this.trail.reset();this.trailSpeed=this.ball.velocity.len();
    if(pending.side==='player'){
      this.opponentReadDelay=this.opponentProfile.reaction;
      // Bounded learning can be wrong-footed: it cannot know the next queued input.
      this.playerLaneMemory=this.playerLaneMemory*.7+clamp((pending.target.x-COURT_CENTER_X)/COURT.singlesHalfWidth,-1,1)*.3;
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
      return pending.hitter.serveBallPoint();
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

  private targetFor(side: Side, quality: InteractiveShotQuality, aim = this.input.movement().x, shot: MatchShot = 'drive') {
    const direction=side==='player'?-1:1;
    const receiver=side==='player'?this.opponent:this.player;
    const assisted=side==='opponent'&&this.rallyLength<CHAMPIONSHIP_TUNING.assistContacts;
    const seed=this.shotSequence*4.37+(side==='player'?2.1:9.3)+this.rallyLength*1.7;
    const spread=side==='player'?CHAMPIONSHIP_TUNING.playerPlacementSpread:assisted?CHAMPIONSHIP_TUNING.assistOpponentSpread:.55+this.opponentProfile.angleBias*.9;
    const variation=(hash(seed)*2-1)*spread;
    // Bounce BEFORE the receiver's strike zone. Baseline-targeting made the
    // old first return effectively impossible, because the ball bounced at the feet.
    let x=clamp(receiver.position.x+variation,SINGLES_MIN_X+.75,SINGLES_MAX_X-.75);
    let depth=quality==='perfect'?3.25:quality==='clean'?2.95:2.25;
    if(assisted){x=clamp(receiver.position.x+.20+variation,SINGLES_MIN_X+.4,SINGLES_MAX_X-.4);depth=clamp(receiver.position.z-2.3,1.5,3.1);}
    if(side==='opponent'&&!assisted&&quality!=='defensive'){
      // After the opening exchange, attack the open half instead of feeding the stationary player.
      const openSide=receiver.position.x>COURT_CENTER_X+.25?-1:receiver.position.x<COURT_CENTER_X-.25?1:hash(seed+31)<.5?-1:1;
      const width=COURT.singlesHalfWidth*(.55+this.opponentProfile.angleBias*.4);
      x=clamp(COURT_CENTER_X+openSide*width+variation*.15,SINGLES_MIN_X+.35,SINGLES_MAX_X-.35);
      if(this.opponentProfile.style==='retriever')depth=3.5;
    }
    if(side==='player'){
      // Keep the opening serve forgiving; placed returns can use the open sideline.
      // A lob trades sharp angles and pace for height, depth and recovery time.
      const margin=this.rallyLength===0||shot==='lob'?.6:.3;
      if(Math.abs(aim)>.18)x=clamp(COURT_CENTER_X+aim*(COURT.singlesHalfWidth-margin)+variation*.2,SINGLES_MIN_X+margin,SINGLES_MAX_X-margin);
      if(shot==='lob')depth=quality==='defensive'?3.6:4.4;
    }
    if(quality==='frame'){
      x+=(hash(seed+18.4)-.5)*2.1;
      depth=hash(seed+9)>.85?COURT.halfLength+.45:2.15;
    }
    return new Vec3(x,this.ball.radius,direction*depth);
  }

  private flightTimeFor(side: Side, quality: InteractiveShotQuality, shot: MatchShot = 'drive') {
    if(side==='player'&&shot==='lob')return 1.48;
    if(side==='opponent'&&this.rallyLength<CHAMPIONSHIP_TUNING.assistContacts)
      return this.rallyLength===0?CHAMPIONSHIP_TUNING.assistOpponentServeFlightSeconds:CHAMPIONSHIP_TUNING.assistOpponentFlightSeconds;
    const power=side==='opponent'?this.opponentProfile.power:.78;
    const patience=side==='opponent'&&this.opponentProfile.style==='retriever'?.12:0;
    return (quality==='perfect'?.96:quality==='clean'?1.02:1.14)-(power-.75)*.12+patience;
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
    this.pointResultAge = 0;
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

    this.callbacks.onPoint?.(winner, reason, this.rallyLength);
  }

  private otherSide(side: Side): Side {
    return side === 'player' ? 'opponent' : 'player';
  }

  /** Same authoritative visible ball for rendering and detached replay capture. */
  visibleBallPosition():Vec3|null {
    if(this.pending&&this.pending.captured&&!this.pending.released)return this.stagedBall(this.pending);
    if(this.ball.active)return this.ball.position.clone();
    return this.enabled&&!this.pointResolved&&!this.pending&&this.rallyLength===0&&this.flightHitter===null
      ?(this.server==='player'?this.player:this.opponent).serveTossPoint():null;
  }

  meshes(reducedMotion=false): Mesh[] {
    const meshes: Mesh[] = [];
    if(this.enabled&&!this.pointResolved&&this.server==='player'&&this.rallyLength===0&&!this.ball.active&&this.input.enabled){
      // Preview the same target the serve consumes, then keep it locked through the toss.
      const target=this.pending?.stroke==='serve'?this.pending.target:!this.pending
        ?this.targetFor('player','clean',this.input.hasBufferedSwing()?this.input.bufferedSwingAim():this.input.movement().x):null;
      if(target){
        meshes.push({id:'serve-aim',kind:'torus',position:new Vec3(target.x,.116,target.z),
          rotation:new Vec3(Math.PI/2,0,0),scale:new Vec3(.62,.62,.065),color:'#fff4bd',alpha:.85,unlit:true,noShadow:true});
        meshes.push({kind:'sphere',position:new Vec3(target.x,.118,target.z),scale:new Vec3(.08,.012,.08),color:'#fff4bd',unlit:true,noShadow:true});
      }
    }
    // Only the incoming player's flight gets a cue. It predicts the actual
    // bounce; it never moves the player or creates a successful return.
    const landing=this.landingTarget;
    if(this.ball.active&&this.receiver==='player'&&landing&&this.inSinglesCourt(landing)&&!this.pending?.captured){
      meshes.push({id:'incoming-landing',kind:'torus',position:new Vec3(landing.x,.116,landing.z),
        rotation:new Vec3(Math.PI/2,0,0),scale:new Vec3(CHAMPIONSHIP_TUNING.landingCueScale,CHAMPIONSHIP_TUNING.landingCueScale,.065),
        color:'#fff4bd',alpha:CHAMPIONSHIP_TUNING.landingCueOpacity,unlit:true,noShadow:true});
    }
    const visible=this.visibleBallPosition();
    if(visible&&!this.pending&&!this.ball.active)meshes.push({kind:'sphere',id:'match-ball',position:visible.clone(),scale:new Vec3(CHAMPIONSHIP_TUNING.ballVisualRadius,CHAMPIONSHIP_TUNING.ballVisualRadius,CHAMPIONSHIP_TUNING.ballVisualRadius),color:'#f5ff7a',unlit:true,noShadow:true});
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
