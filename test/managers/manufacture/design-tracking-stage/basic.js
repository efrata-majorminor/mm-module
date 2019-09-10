var options = {
    manager: require('../../../../src/managers/manufacture/design-tracking-stage-manager'),
    model: require('mm-models').manufacture.DesignTrackingStage,
    util: require('../../../data-util/manufacture/design-tracking-stage-data-util'),
    validator: require('mm-models').validator.manufacture.designTrackingStage,
    createDuplicate: false,
    keys: []
};

var basicTest = require('../../../basic-test-factory');
basicTest(options);
