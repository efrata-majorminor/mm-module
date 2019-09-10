"use strict";
const helper = require('../../helper');
const DesignTrackingStageManager = require('../../../src/managers/manufacture/design-tracking-stage-manager');
const generateCode = require("../../../src/utils/code-generator");
const designTrackingBoard = require("./design-tracking-board-data-util");

class DesignTrackingStageDataUtil {
    getNewData() {
        return designTrackingBoard.getTestData()
            .then((result) => {
                const Model = require('mm-models').manufacture.DesignTrackingBoard;
                let data = new Model();

                let code = generateCode("EFR-DTS");

                data.code = code;
                data.boardId = result._id;
                data.name = `name[${code}]`;
                data.designs = [];

                return Promise.resolve(data);
            });
    }

    getTestData() {
        return helper
            .getManager(DesignTrackingStageManager)
            .then((manager) => {
                return this.getNewData().then((data) => {
                    return manager.create(data)
                        .then((id) => manager.getSingleById(id));
                });
            });
    }
}
module.exports = new DesignTrackingStageDataUtil();
