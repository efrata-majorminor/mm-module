"use strict";

let options = {
    manager: require("../../../../src/managers/manufacture/design-tracking-design-manager"),
    model: require("mm-models").manufacture.DesignTrackingDesign,
    util: require("../../../data-util/manufacture/design-tracking-design-data-util"),
    validator: require("mm-models").validator.manufacture.designTrackingDesign,
    createDuplicate: false,
    keys: []
};

let basicTest = require("../../../basic-test-factory");
basicTest(options);