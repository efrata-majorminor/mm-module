const EventEmitter = require('events').EventEmitter;

module.exports = class EventMessaging {
    constructor() {
        this.eventEmitter = new EventEmitter;
        this.eventKey = "";
    }

    sendEvent(eventKey, eventFunction) {
        this.eventKey = eventKey;
        this.eventEmitter.on(this.eventKey, eventFunction);
    }

    emitEvent(eventParameter) {
        this.eventEmitter.emit(this.eventKey, eventParameter);
    }
}