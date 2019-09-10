"use strict";
const helper = require('../../helper');
const DesignTrackingReasonManager = require('../../../src/managers/master/design-tracking-reason-manager');
const generateCode = require('../../../src/utils/code-generator');

class DesignTrackingReasonDataUtil {
    getNewData() {
        const Model = require('mm-models').master.DesignTrackingReason;
        let data = new Model();

        let code = generateCode("EFR-DTR");

        data.code = code;
        data.reason = `name[${code}]`;

        return Promise.resolve(data);
    }

    getTestData() {
        return helper
            .getManager(DesignTrackingReasonManager)
            .then((manager) => {
                return this.getNewData().then((data) => {
                    return manager.create(data)
                        .then((id) => manager.getSingleById(id));
                });
            });
    }
}

module.exports = new DesignTrackingReasonDataUtil();