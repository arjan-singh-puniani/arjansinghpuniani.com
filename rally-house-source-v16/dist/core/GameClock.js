export class GameClock {
    minutesPerSecond = 2.1;
    minutes = 8 * 60 + 30;
    day = 1;
    paused = false;
    speed = 1;
    accumulator = 0;
    constructor(minutes, day) { if (minutes !== undefined)
        this.minutes = minutes; if (day !== undefined)
        this.day = day; }
    update(realDt) { if (this.paused)
        return; this.accumulator += Math.min(realDt, .25) * this.speed * this.minutesPerSecond; const step = .25; while (this.accumulator >= step) {
        this.minutes += step;
        this.accumulator -= step;
        if (this.minutes >= 1440) {
            this.minutes -= 1440;
            this.day++;
        }
    } }
    setSpeed(s) { this.speed = s; }
    get hour() { return Math.floor(this.minutes / 60) % 24; }
    get minute() { return Math.floor(this.minutes % 60); }
    formatted() { return `${this.hour}:${String(this.minute).padStart(2, '0')}`; }
    serialize() { return { minutes: this.minutes, day: this.day, paused: this.paused, speed: this.speed }; }
}
//# sourceMappingURL=GameClock.js.map