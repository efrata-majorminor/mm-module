const options = {
    manager: require('../../../../src/managers/master/design-tracking-reason-manager'),
    model: require('mm-models').master.DesignTrackingReason,
    util: require('../../../data-util/master/design-tracking-reason-data-util'),
    validator: require('mm-models').validator.master.designTrackingReason,
    createDuplicate: false,
    keys: []
};

const basicTest = require('../../../basic-test-factory');
basicTest(options);
