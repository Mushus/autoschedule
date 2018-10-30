// 一日
const Day = 24 * 60 * 60 * 1000;

// 期間(日)
const term = 30 * Day;

// スケジュールバッチ
function autoschedule() {
    const calender = CalendarApp.getDefaultCalendar();

    const fromDay = new Date();
    const toDay = new Date(+fromDay + term);
    const events = calender.getEvents(fromDay, toDay);

    const sortedSpotEvent = events
        .filter(event => !event.isAllDayEvent())
        .map(event => new Schedule(event))
        .filter(
            schedule =>
                schedule.isEnable() &&
                schedule.getMyStatus() !== CalendarApp.GuestStatus.OWNER
        )
        .sort((a, b) => a.getLastUpdate() - b.getLastUpdate());

    for (let i = 0; i < sortedSpotEvent.length; i++) {
        const target = sortedSpotEvent[i];
        let confrict = false;
        // すでに判定しているスケジュールとみくらべる
        for (let k = 0; k < i; k++) {
            const fixed = sortedSpotEvent[k];
            if (fixed.contains(target)) {
                confrict = true;
                break;
            }
        }
        // 被ってる？
        if (confrict) {
            target.disabled();
        } else {
            target.fixed();
        }
    }
}

class Schedule {
    private event: GoogleAppsScript.Calendar.CalendarEvent;
    private enable: boolean;
    private start: number;
    private end: number;
    private lastUpdate: number;
    private myStatus: GoogleAppsScript.Calendar.GuestStatus;
    constructor(event: GoogleAppsScript.Calendar.CalendarEvent) {
        this.event = event;
        this.start = +event.getStartTime();
        this.end = +event.getEndTime();
        this.lastUpdate = +event.getLastUpdated();
        this.myStatus = event.getMyStatus();
        this.enable = this.myStatus !== CalendarApp.GuestStatus.NO;
    }
    // 含まれているか
    public contains(target: Schedule) {
        return (
            this.enable && this.start < target.end && target.start < this.end
        );
    }

    public getLastUpdate() {
        return this.lastUpdate;
    }

    public isEnable() {
        return this.enable;
    }

    public disabled() {
        this.enable = false;
        this.setStatus(CalendarApp.GuestStatus.NO);
    }

    public fixed() {
        this.enable = true;
        this.setStatus(CalendarApp.GuestStatus.YES);
    }

    public setStatus(status: GoogleAppsScript.Calendar.GuestStatus) {
        if (this.myStatus === status) {
            return;
        }
        this.event.setMyStatus(status);
        this.myStatus = status;
    }
    public getMyStatus() {
        return this.myStatus;
    }
}
