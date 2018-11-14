const EventEmitter = require('events').EventEmitter;

module.exports = class EventMessaging {
    constructor() {
        this.eventEmitter = new EventEmitter;
        this.eventFunctionParameter = [];
        this.eventKey = "";
    }

    sendEvent(eventKey, eventFunction, parameterFunction) {
        console.log("Send Event: " + eventKey);
        this.eventFunctionParameter = parameterFunction;
        this.eventKey = eventKey;
        this.eventEmitter.on(this.eventKey, eventFunction);
    }

    emitEvent() {
        console.log("Emit Event: " + this.eventKey);
        this.eventEmitter.emit(this.eventKey);
    }

    passParameter() {
        return this.eventFunctionParameter;
    }
}