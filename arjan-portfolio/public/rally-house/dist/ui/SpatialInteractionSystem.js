import { Vec3 } from '../rendering/Math3D.js';
import { placeWorldCard } from './WorldAnchor.js';
/** A view only: resolvers read live owners; no simulation data is copied or saved here. */
export class SpatialInteractionSystem {
    camera;
    canvas;
    layer = document.createElement('div');
    card = document.createElement('aside');
    leader = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    line = document.createElementNS('http://www.w3.org/2000/svg', 'path');
    title = document.createElement('h2');
    eyebrow = document.createElement('p');
    subtitle = document.createElement('p');
    status = document.createElement('p');
    facts = document.createElement('div');
    actions = document.createElement('div');
    returnButton = document.createElement('button');
    markers = new Map();
    actionButtons = new Map();
    selection = null;
    hover = null;
    width = 294;
    height = 320;
    refresh = 0;
    contentKey = '';
    lastTransform = '';
    observer;
    onResize = () => this.measureBounds();
    margin = { top: 74, bottom: 88, left: 14, right: 14 };
    viewport = { left: 0, top: 0, width: 1, height: 1 };
    onDismiss = () => { };
    constructor(camera, canvas) {
        this.camera = camera;
        this.canvas = canvas;
        this.layer.className = 'spatial-layer';
        this.layer.dataset.worldUi = 'true';
        this.card.className = 'spatial-card glass';
        this.card.id = 'spatialCard';
        this.card.hidden = true;
        this.card.setAttribute('role', 'dialog');
        this.card.setAttribute('aria-labelledby', 'spatialTitle');
        this.title.id = 'spatialTitle';
        this.eyebrow.className = 'eyebrow';
        this.subtitle.className = 'spatial-subtitle';
        this.status.className = 'spatial-status';
        this.facts.className = 'spatial-facts';
        this.actions.className = 'spatial-actions';
        const close = document.createElement('button');
        close.className = 'close';
        close.textContent = '×';
        close.setAttribute('aria-label', 'Close selection');
        close.onclick = () => this.dismiss(true);
        this.returnButton.className = 'spatial-return';
        this.returnButton.hidden = true;
        this.returnButton.onclick = () => {
            const p = this.selection?.position();
            if (p)
                this.camera.nudgeFocus(p.x, p.z, 1);
        };
        this.card.append(close, this.eyebrow, this.title, this.subtitle, this.status, this.facts, this.actions);
        this.leader.classList.add('spatial-leader');
        this.leader.setAttribute('aria-hidden', 'true');
        this.leader.append(this.line);
        this.layer.append(this.leader, this.card, this.returnButton);
        document.getElementById('app').append(this.layer);
        // Keep pointer and keyboard traffic out of global gameplay listeners, without
        // preventing native button activation or tab navigation.
        for (const event of ['pointerdown', 'pointerup', 'pointermove', 'wheel', 'dblclick', 'keydown', 'keyup'])
            this.layer.addEventListener(event, e => {
                e.stopPropagation();
                if (event === 'keydown' && e.key === 'Escape') {
                    e.preventDefault();
                    this.dismiss(true);
                }
            });
        this.actions.addEventListener('click', e => {
            const button = e.target.closest('button[data-action]');
            if (!button || !this.selection)
                return;
            // Recheck availability at invocation, even if reservations changed this frame.
            if (this.selection.present().actions.some(a => a.id === button.dataset.action))
                this.selection.act(button.dataset.action);
            this.refresh = 0;
        });
        this.observer = new ResizeObserver(entries => {
            for (const entry of entries) {
                // A hidden offscreen card reports zero; keep its last real size.
                if (entry.target !== this.card || entry.contentRect.width <= 0)
                    continue;
                const box = entry.borderBoxSize[0];
                this.width = box?.inlineSize ?? entry.contentRect.width + 30;
                this.height = box?.blockSize ?? entry.contentRect.height + 30;
            }
        });
        this.observer.observe(this.card);
        window.addEventListener('resize', this.onResize);
        this.measureBounds();
    }
    get selectedId() { return this.selection?.id ?? null; }
    select(selection) {
        this.selection = selection;
        this.hover = null;
        this.contentKey = '';
        this.refresh = 0;
        this.lastTransform = '';
        this.card.hidden = false;
        this.card.classList.remove('entered');
        requestAnimationFrame(() => {
            if (this.selection === selection)
                this.card.classList.add('entered');
        });
        this.renderContent();
        this.measureBounds();
        this.card.querySelector('.close')?.focus({ preventScroll: true });
    }
    dismiss(restoreFocus = false) {
        const focused = this.layer.contains(document.activeElement);
        this.selection = null;
        this.card.hidden = true;
        this.returnButton.hidden = true;
        this.leader.style.display = 'none';
        this.card.classList.remove('entered');
        this.onDismiss();
        if (restoreFocus && focused)
            this.canvas.focus({ preventScroll: true });
    }
    setHover(position) { this.hover = position; }
    measureBounds() {
        const r = this.canvas.getBoundingClientRect();
        this.viewport = { left: r.left, top: r.top, width: r.width, height: r.height };
        const safe = getComputedStyle(this.layer);
        this.margin = { top: 74 + (parseFloat(safe.paddingTop) || 0), bottom: 88 + (parseFloat(safe.paddingBottom) || 0), left: 14 + (parseFloat(safe.paddingLeft) || 0), right: 14 + (parseFloat(safe.paddingRight) || 0) };
    }
    project(v) {
        const p = this.camera.project(v, this.viewport);
        return { x: p.x - this.viewport.left, y: p.y - this.viewport.top, visible: p.visible };
    }
    renderContent() {
        if (!this.selection)
            return;
        const model = this.selection.present(), key = JSON.stringify(model);
        if (key === this.contentKey)
            return;
        this.contentKey = key;
        this.eyebrow.textContent = model.eyebrow;
        this.title.textContent = model.title;
        this.subtitle.textContent = model.subtitle;
        this.status.textContent = model.status;
        this.returnButton.textContent = `Find ${model.title} ↗`;
        this.facts.replaceChildren(...model.facts.map(f => { const row = document.createElement('div'), label = document.createElement('small'), text = document.createElement('span'); label.textContent = f.label; text.textContent = f.text; row.append(label, text); return row; }));
        const keep = new Set(model.actions.map(a => a.id));
        for (const [id, b] of this.actionButtons)
            if (!keep.has(id)) {
                b.remove();
                this.actionButtons.delete(id);
            }
        for (const action of model.actions) {
            let b = this.actionButtons.get(action.id);
            if (!b) {
                b = document.createElement('button');
                b.dataset.action = action.id;
                b.append(document.createElement('strong'), document.createElement('span'));
                this.actionButtons.set(action.id, b);
                this.actions.append(b);
            }
            b.classList.toggle('primary', !!action.primary);
            b.querySelector('strong').textContent = action.title;
            b.querySelector('span').textContent = action.detail;
        }
    }
    update(dt, suppressed, reducedMotion, notices) {
        this.layer.classList.toggle('reduced-motion', reducedMotion);
        this.layer.hidden = suppressed;
        if (suppressed) {
            this.hover = null;
            for (const m of this.markers.values())
                m.remove();
            this.markers.clear();
            return;
        }
        const position = this.selection?.position();
        if (this.selection && !position) {
            this.dismiss();
        }
        this.refresh -= dt;
        if (this.refresh <= 0) {
            this.renderContent();
            this.refresh = .35;
        }
        if (position && this.selection) {
            const p = this.project(new Vec3(position.x, position.y + 2.1, position.z));
            const layout = placeWorldCard(p, this.width, this.height, { width: this.viewport.width, height: this.viewport.height, ...this.margin });
            this.card.hidden = layout.offscreen;
            this.returnButton.hidden = !layout.offscreen;
            this.leader.style.display = layout.offscreen ? 'none' : 'block';
            const transform = `translate3d(${layout.x.toFixed(1)}px,${layout.y.toFixed(1)}px,0)`;
            if (transform !== this.lastTransform) {
                this.card.style.transform = transform;
                this.lastTransform = transform;
            }
            const endX = layout.side === 'left' ? layout.x + this.width : layout.side === 'right' ? layout.x : layout.x + this.width / 2;
            const endY = layout.side === 'above' ? layout.y + this.height : Math.max(layout.y + 22, Math.min(layout.y + this.height - 22, p.y));
            this.line.setAttribute('d', `M ${p.x.toFixed(1)} ${p.y.toFixed(1)} L ${endX.toFixed(1)} ${endY.toFixed(1)}`);
        }
        const visible = new Set(), occupied = [];
        // Two labels at most. Selected person is already explained by the card.
        for (const n of notices) {
            if (visible.size >= 2 || n.id === this.selection?.id)
                continue;
            const p = this.project(new Vec3(n.position.x, 2.45, n.position.z));
            if (!p.visible || p.x < 85 || p.x > this.viewport.width - 85 || p.y < this.margin.top + 25 || p.y > this.viewport.height - this.margin.bottom - 20 || occupied.some(o => Math.hypot(o.x - p.x, o.y - p.y) < 135))
                continue;
            if (!this.card.hidden) {
                const box = placeWorldCard(this.project(new Vec3(position.x, 2.1, position.z)), this.width, this.height, { width: this.viewport.width, height: this.viewport.height, ...this.margin });
                if (p.x > box.x - 85 && p.x < box.x + this.width + 85 && p.y > box.y - 35 && p.y < box.y + this.height + 35)
                    continue;
            }
            visible.add(n.id);
            occupied.push(p);
            let marker = this.markers.get(n.id);
            if (!marker) {
                marker = document.createElement('button');
                marker.className = 'world-notice';
                this.markers.set(n.id, marker);
                this.layer.append(marker);
            }
            const label = `${n.name} · ${n.activity}`;
            if (marker.textContent !== label)
                marker.textContent = label;
            marker.setAttribute('aria-label', `Select ${n.name}, ${n.activity}`);
            marker.onclick = n.select;
            marker.style.transform = `translate(${p.x.toFixed(1)}px,${p.y.toFixed(1)}px) translate(-50%,-100%)`;
        }
        for (const [id, m] of this.markers)
            if (!visible.has(id)) {
                m.remove();
                this.markers.delete(id);
            }
    }
    meshes() {
        if (this.layer.hidden)
            return [];
        const p = this.selection?.position() ?? this.hover;
        if (!p)
            return [];
        const selected = !!this.selection, r = selected ? 1.5 : 1.15;
        return [{ kind: 'torus', position: new Vec3(p.x, .055, p.z), rotation: new Vec3(Math.PI / 2, 0, 0), scale: new Vec3(r, r, .20), unlit: true, color: selected ? '#e8c47f' : '#97b39b', material: 'fabric', alpha: selected ? .85 : .48 }];
    }
    dispose() { this.observer.disconnect(); window.removeEventListener('resize', this.onResize); this.markers.clear(); this.selection = null; this.layer.remove(); }
}
