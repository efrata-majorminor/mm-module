"use strict";
const helper = require('../../helper');
const DesignTrackingBoardManager = require('../../../src/managers/manufacture/design-tracking-board-manager');
const generateCode = require('../../../src/utils/code-generator');

class DesignTrackingBoardDataUtil {
    getNewData() {
        const Model = require('mm-models').manufacture.DesignTrackingBoard;
        let data = new Model();

        let code = generateCode("EFR-DTB");

        data.code = code;
        data.name = `name[${code}]`;

        return Promise.resolve(data);
    }

    getTestData() {
        return helper
            .getManager(DesignTrackingBoardManager)
            .then((manager) => {
                return this.getNewData().then((data) => {
                    return manager.create(data)
                        .then((id) => manager.getSingleById(id));
                });
            });
    }
}

module.exports = new DesignTrackingBoardDataUtil();