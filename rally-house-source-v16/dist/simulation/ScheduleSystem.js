export class ScheduleSystem {
    schedules;
    constructor(schedules) {
        this.schedules = schedules;
        for (const list of Object.values(schedules))
            list.sort((a, b) => a.start - b.start);
    }
    update(person, minutes) { const list = this.schedules[person.id] || []; if (!list.length)
        return; let idx = 0; for (let i = 0; i < list.length; i++)
        if (minutes >= list[i].start)
            idx = i; const key = (minutes < list[0].start) ? list.length - 1 : idx; if (person.currentScheduleIndex !== key) {
        person.currentScheduleIndex = key;
        const e = list[key];
        person.setDestination(e.destination, e.activity, e.animation);
    } }
}
//# sourceMappingURL=ScheduleSystem.js.map