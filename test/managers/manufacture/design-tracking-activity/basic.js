"use strict";

let options = {
    manager: require("../../../../src/managers/manufacture/design-tracking-activity-manager"),
    model: require("mm-models").manufacture.DesignTrackingActivity,
    util: require("../../../data-util/manufacture/design-tracking-activity-data-util"),
    validator: require("mm-models").validator.manufacture.designTrackingActivity,
    createDuplicate: false,
    keys: []
};

let basicTest = require("../../../basic-test-factory");
basicTest(options);
