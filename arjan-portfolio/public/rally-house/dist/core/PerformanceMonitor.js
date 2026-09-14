export class PerformanceMonitor {
    debug;
    simMs = 0;
    renderMs = 0;
    drawCalls = 0;
    triangles = 0;
    entities = 0;
    lastLog = 0;
    constructor(debug = false) {
        this.debug = debug;
    }
    sample(v, now = performance.now()) {
        const a = .08;
        this.simMs += (v.simMs - this.simMs) * a;
        this.renderMs += (v.renderMs - this.renderMs) * a;
        this.drawCalls = v.drawCalls;
        this.triangles = v.triangles;
        this.entities = v.entities;
        if (this.debug && now - this.lastLog > 5000) {
            this.lastLog = now;
            console.info('[Rally House perf]', this.snapshot());
        }
    }
    snapshot() {
        const perf = performance;
        return { simMs: this.simMs, renderMs: this.renderMs, drawCalls: this.drawCalls, triangles: this.triangles, entities: this.entities, memoryMB: perf.memory ? perf.memory.usedJSHeapSize / 1048576 : null };
    }
}
//# sourceMappingURL=PerformanceMonitor.js.map