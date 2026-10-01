import { clamp } from '../rendering/Math3D.js';
import { CHAMPIONSHIP_TUNING } from './ChampionshipTuning.js';
/**
 * MatchInput turns keyboard and touch events into a small, frame-rate-independent
 * intent model. It never moves a Character directly. InteractiveMatchSystem is
 * the sole consumer of these values, which keeps DOM/input behavior separate
 * from tennis simulation.
 */
export class MatchInput {
    heldKeys = new Set();
    touchMovement = { x: 0, z: 0 };
    swingAge = Number.POSITIVE_INFINITY;
    swingQueued = false;
    enabled = false;
    setEnabled(enabled) {
        if (this.enabled === enabled)
            return;
        this.enabled = enabled;
        if (!enabled) {
            this.reset();
        }
    }
    update(dt) {
        if (!this.enabled || !Number.isFinite(dt) || dt <= 0)
            return;
        if (this.swingQueued) {
            this.swingAge += dt;
            if (this.swingAge > CHAMPIONSHIP_TUNING.swingBufferSeconds) {
                this.clearSwing();
            }
        }
    }
    handleKeyDown(event) {
        if (!this.enabled)
            return false;
        const key = event.key.toLowerCase();
        const handled = key === 'w' ||
            key === 'a' ||
            key === 's' ||
            key === 'd' ||
            key.startsWith('arrow') ||
            key === ' ';
        if (!handled)
            return false;
        event.preventDefault();
        if (key === ' ') {
            if (!event.repeat)
                this.queueSwing();
            return true;
        }
        this.heldKeys.add(key);
        return true;
    }
    handleKeyUp(event) {
        if (!this.enabled)
            return false;
        const key = event.key.toLowerCase();
        const handled = key === 'w' ||
            key === 'a' ||
            key === 's' ||
            key === 'd' ||
            key.startsWith('arrow');
        if (!handled)
            return false;
        event.preventDefault();
        this.heldKeys.delete(key);
        return true;
    }
    queueSwing() {
        if (!this.enabled)
            return;
        this.swingQueued = true;
        this.swingAge = 0;
    }
    hasBufferedSwing() {
        return this.enabled && this.swingQueued;
    }
    /**
     * Returns how long ago the player pressed swing.
     * InteractiveMatchSystem uses this to judge the actual button timing rather
     * than the later frame on which a buffered command becomes actionable.
     */
    bufferedSwingAge() {
        return this.hasBufferedSwing() ? this.swingAge : Number.POSITIVE_INFINITY;
    }
    consumeSwing() {
        if (!this.hasBufferedSwing())
            return false;
        this.clearSwing();
        return true;
    }
    setTouchMovement(x, z) {
        this.touchMovement = {
            x: clamp(x, -1, 1),
            z: clamp(z, -1, 1),
        };
    }
    movement() {
        if (!this.enabled)
            return { x: 0, z: 0 };
        let x = this.touchMovement.x;
        let z = this.touchMovement.z;
        if (this.heldKeys.has('a') || this.heldKeys.has('arrowleft'))
            x -= 1;
        if (this.heldKeys.has('d') || this.heldKeys.has('arrowright'))
            x += 1;
        if (this.heldKeys.has('w') || this.heldKeys.has('arrowup'))
            z -= 1;
        if (this.heldKeys.has('s') || this.heldKeys.has('arrowdown'))
            z += 1;
        const length = Math.hypot(x, z);
        if (length > 1) {
            x /= length;
            z /= length;
        }
        return { x, z };
    }
    reset() {
        this.heldKeys.clear();
        this.touchMovement = { x: 0, z: 0 };
        this.clearSwing();
    }
    clearSwing() {
        this.swingQueued = false;
        this.swingAge = Number.POSITIVE_INFINITY;
    }
}
