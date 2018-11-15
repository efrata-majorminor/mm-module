const EventEmitter = require('events').EventEmitter;

module.exports = class EventMessaging {
    constructor() {
        this.eventEmitter = new EventEmitter;
        this.eventKey = "";
    }

    sendEvent(eventKey, eventFunction) {
        console.log("Send Event: " + eventKey);
        this.eventKey = eventKey;
        this.eventEmitter.on(this.eventKey, eventFunction);
    }

    emitEvent(eventParameter) {
        console.log("Emit Event: " + this.eventKey);
        this.eventEmitter.emit(this.eventKey, eventParameter);
    }
}