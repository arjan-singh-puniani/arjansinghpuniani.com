import type { CameraController } from '../rendering/CameraController.js';
import { Vec3, clamp } from '../rendering/Math3D.js';
import type { ChampionshipCameraMode } from './ChampionshipController.js';
import { CHAMPIONSHIP_TUNING } from './ChampionshipTuning.js';

interface CameraSnapshot {
  target: Vec3;
  desiredTarget: Vec3;
  distance: number;
  desiredDistance: number;
  azimuth: number;
  desiredAzimuth: number;
  elevation: number;
  desiredElevation: number;
  fov: number;
  autoFrame: boolean;
}

interface CameraPose {
  target: Vec3;
  distance: number;
  azimuth: number;
  elevation: number;
  fov: number;
}

function smooth01(value: number) {
  const t = clamp(value, 0, 1);
  return t * t * (3 - 2 * t);
}

function shortestAngleDelta(from: number, to: number) {
  let delta = to - from;
  while (delta > Math.PI) delta -= Math.PI * 2;
  while (delta < -Math.PI) delta += Math.PI * 2;
  return delta;
}

function lerpAngle(from: number, to: number, t: number) {
  return from + shortestAngleDelta(from, to) * t;
}

/**
 * Championship's presentation camera.
 *
 * There are deliberately two different visual languages:
 *
 * 1. The ordinary Rally House camera treats the academy like a miniature
 *    dollhouse that can be observed and explored.
 * 2. Championship Mode turns that SAME physical court into an arcade sports
 *    game. The transition between those languages is part of the experience,
 *    not a hidden implementation detail.
 *
 * The rig therefore stages the challenge in three readable beats:
 *
 *   dollhouse / court establishing view
 *             -> orbit around the court
 *             -> descend behind the player's baseline
 *
 * CameraController still owns the actual spring motion. This class only feeds
 * it authored targets, which keeps the transition soft and consistent with the
 * rest of Rally House rather than introducing a second camera system.
 */
export class ChampionshipCameraRig {
  private savedClubView: CameraSnapshot | null = null;
  private impactKick = 0;
  private exactState:ReturnType<CameraController['captureState']>|null=null;
  private returning=false;
  private lastMode: ChampionshipCameraMode = 'club';
  private introElapsed = 0;
  private introStart: CameraPose | null = null;

  constructor(private readonly camera: CameraController) {}

  /**
   * Add a tiny camera impulse at authoritative string-bed contact. The normal
   * spring camera still performs all motion; this only nudges its target for a
   * few frames so impact is felt rather than merely seen.
   */
  pulseImpact(strength = 1) {
    this.impactKick = Math.max(this.impactKick, clamp(strength, 0, 1.35));
  }

  begin() {
    if (this.savedClubView) return;

    this.exactState=this.camera.captureState();
    this.returning=false;
    this.savedClubView = {
      target: this.camera.target.clone(),
      desiredTarget: this.camera.desiredTarget.clone(),
      distance: this.camera.distance,
      desiredDistance: this.camera.desiredDistance,
      azimuth: this.camera.azimuth,
      desiredAzimuth: this.camera.desiredAzimuth,
      elevation: this.camera.elevation,
      desiredElevation: this.camera.desiredElevation,
      fov: this.camera.fov,
      autoFrame: this.camera.autoFrame,
    };

    this.lastMode = 'club';
    this.introElapsed = 0;
    this.introStart = null;

    // Championship has authored framing, so automatic whole-club reframing
    // stays off until the exact pre-match camera is restored.
    this.camera.autoFrame = false;
  }

  update(
    mode: ChampionshipCameraMode,
    player: Vec3,
    opponent: Vec3,
    ball: Vec3 | null,
    aspect: number,
    dt = 1 / 60,
  ) {
    if (!this.savedClubView) this.begin();

    if (mode !== this.lastMode) {
      if (mode === 'matchIntro') {
        // Capture the ACTUAL current establishing view, not the old club save.
        // This prevents a discontinuity if the challenge walk took a few
        // seconds and the camera had already eased toward the court.
        this.introElapsed = 0;
        this.introStart = this.currentPose();
      }
      this.lastMode = mode;
    }

    const safeDt = Math.max(0, dt);
    const kick = this.impactKick;
    this.impactKick = Math.max(0, this.impactKick - safeDt * 8.5);

    const portrait = clamp((1.0 - aspect) / 0.35, 0, 1);
    const courtCenter = new Vec3(1,0,0);

    if(mode==='club'){
      if(this.returning&&this.savedClubView){
        const p=this.savedClubView;
        this.applyPose({target:p.target,distance:p.distance,azimuth:p.azimuth,elevation:p.elevation,fov:this.camera.fov+(p.fov-this.camera.fov)*(1-Math.exp(-safeDt*6))});
      }
      return;
    }

    if (mode === 'challengeEstablishing') {
      // While both characters physically walk to their baselines, keep the
      // familiar miniature perspective and gently make the court the subject.
      // The player can therefore SEE the dollhouse becoming a tennis arena.
      this.applyPose({
        target: new Vec3(courtCenter.x, 0.54, courtCenter.z),
        distance: 36.2 + portrait * 18,
        azimuth: 0.72,
        elevation: 0.56 + portrait * 0.04,
        fov: (31 + portrait * 8) * Math.PI / 180,
      });
      return;
    }

    if (mode === 'matchIntro') {
      this.introElapsed += safeDt;

      const start = this.introStart ?? this.currentPose();
      const progress = clamp(
        this.introElapsed / CHAMPIONSHIP_TUNING.introSeconds,
        0,
        1,
      );

      // First settle into a clean, high court-establishing composition. Then
      // spend most of the transition visibly orbiting and descending behind
      // the player. The second beat is intentionally longer because that
      // transformation is one of Rally House's signature moments.
      const establish: CameraPose = {
        target: new Vec3(courtCenter.x, 0.58, courtCenter.z - 0.05),
        distance: 23.5 + portrait * 3.8,
        azimuth: 0.70,
        elevation: 0.52 + portrait * 0.045,
        fov: (31.5 + portrait * 8.5) * Math.PI / 180,
      };

      const gameplay = this.gameplayPose(player, courtCenter, null, portrait, 0);

      if (progress < 0.28) {
        this.applyBlendedPose(start, establish, smooth01(progress / 0.28));
      } else {
        this.applyBlendedPose(
          establish,
          gameplay,
          smooth01((progress - 0.28) / 0.72),
        );
      }
      return;
    }

    if (mode === 'behindPlayer' || mode === 'pointReaction') {
      const pose = this.gameplayPose(player, courtCenter, ball, portrait, kick);

      if (mode === 'pointReaction') {
        // A small broadcast-like exhale after the point. It is deliberately
        // subtle; the camera should never steal attention from the next serve.
        pose.distance += 0.72;
        pose.elevation += 0.012;
      }

      this.applyPose(pose);
      return;
    }

    if (mode === 'matchResult') {
      this.applyPose({
        target: new Vec3(courtCenter.x, 0.86, courtCenter.z * 0.18),
        distance: 16.1 + portrait * 3.2,
        azimuth: 0.035,
        elevation: 0.39 + portrait * 0.055,
        fov: (33 + portrait * 9) * Math.PI / 180,
      });
    }
  }

  /**
   * Restore the exact camera the player had before accepting the challenge.
   * This matters because users may have intentionally panned/orbited the club.
   */
  beginReturn(){this.returning=true;this.impactKick=0;}

  restoreClubView(_reducedMotion:boolean){
    if(this.exactState)this.camera.restoreState(this.exactState);
    this.exactState=null;this.savedClubView=null;this.returning=false;
    this.lastMode='club';this.introElapsed=0;this.introStart=null;this.impactKick=0;
  }

  private gameplayPose(
    player: Vec3,
    courtCenter: Vec3,
    ball: Vec3 | null,
    portrait: number,
    kick: number,
  ): CameraPose {
    // Keep the ball involved in framing, but only slightly. The old close view
    // let the ball tug the camera around too much and made the player's avatar
    // occupy a large fraction of the screen. This wider/higher framing makes
    // the full rally readable like an arcade sports game while preserving the
    // charming Rally House environment around it.
    const ballInfluence = ball ? 0.075 : 0;
    const focusX =
      courtCenter.x * (0.86 - ballInfluence) +
      player.x * 0.065 +
      (ball?.x ?? courtCenter.x) * ballInfluence;

    return {
      target: new Vec3(focusX, 0.74 + kick * 0.028, -0.46),
      distance: 20.4 + portrait * 12.2 - kick * 0.11,
      azimuth: 0,
      elevation: 0.49 + portrait * 0.075,
      fov: (35.5 + portrait * 9.5) * Math.PI / 180,
    };
  }

  private currentPose(): CameraPose {
    return {
      target: this.camera.target.clone(),
      distance: this.camera.distance,
      azimuth: this.camera.azimuth,
      elevation: this.camera.elevation,
      fov: this.camera.fov,
    };
  }

  private applyBlendedPose(from: CameraPose, to: CameraPose, t: number) {
    const eased = clamp(t, 0, 1);
    this.applyPose({
      target: Vec3.lerp(from.target, to.target, eased),
      distance: from.distance + (to.distance - from.distance) * eased,
      azimuth: lerpAngle(from.azimuth, to.azimuth, eased),
      elevation: from.elevation + (to.elevation - from.elevation) * eased,
      fov: from.fov + (to.fov - from.fov) * eased,
    });
  }

  private applyPose(pose: CameraPose) {
    this.camera.desiredTarget.set(pose.target.x, pose.target.y, pose.target.z);
    this.camera.desiredDistance = pose.distance;
    this.camera.desiredAzimuth = pose.azimuth;
    this.camera.desiredElevation = pose.elevation;
    this.camera.fov = pose.fov;
  }
}
