// 一日
const Day = 24 * 60 * 60 * 1000;

// 期間(日)
const term = 30 * Day;

// 最終更新日のプロパティ名
const LastUpdateKey = "last_update";

// スケジュールバッチ
function autoschedule() {
    const calender = CalendarApp.getDefaultCalendar();

    const fromDay = new Date();
    const toDay = new Date(+fromDay + term);
    const events = calender.getEvents(fromDay, toDay);

    const sortedSpotEvent = events.
        filter((event) => !event.isAllDayEvent()).
        map((event) => new Schedule(event)).
        filter(schedule => schedule.getMyStatus() !== CalendarApp.GuestStatus.OWNER).
        sort((a, b) => a.getLastUpdate() - b.getLastUpdate());

    for (let i = 0; i < sortedSpotEvent.length; i++) {
        let confrict = false;
        let target = sortedSpotEvent[i];
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
    private enable: Boolean;
    private start: number;
    private end: number;
    private lastUpdate: number;
    private myStatus: GoogleAppsScript.Calendar.GuestStatus;
    constructor(event: GoogleAppsScript.Calendar.CalendarEvent, enable = true) {
        this.enable = enable;
        this.event = event;
        this.start = +event.getStartTime();
        this.end = +event.getEndTime();
        this.lastUpdate = +event.getLastUpdated();
        this.myStatus = event.getMyStatus();
    }
    // 含まれているか
    contains(target: Schedule) {
        return this.enable && this.start < target.end && target.start < this.end;
    }

    getLastUpdate() {
        return this.lastUpdate;
    }

    disabled() {
        this.enable = false;
        this.setStatus(CalendarApp.GuestStatus.NO);
    }

    fixed() {
        this.enable = true;
        this.setStatus(CalendarApp.GuestStatus.YES);
    }

    setStatus(status: GoogleAppsScript.Calendar.GuestStatus) {
        if (this.myStatus === status) {
            return;
        }
        this.event.setMyStatus(status);
        this.myStatus = status;
    }
    getMyStatus() {
        return this.myStatus;
    }
}