"use strict";
var _getSert = require("../getsert");
var Unit = require("../master/unit-data-util");
var generateCode = require("../../../src/utils/code-generator");

class RoleDataUtil {
    getSert(input) {
        var ManagerType = require("../../../src/managers/auth/role-manager");
        return _getSert(input, ManagerType, (data) => {
            return {
                code: data.code
            };
        });
    }

    getNewData() {
        return Unit.getTestData()
            .then((unit) => {
                var Model = require("mm-models").auth.Role;
                var data = new Model();

                var code = generateCode();
                data.code = code;
                data.name = `Role[${code}]`;
                data.description = ` data for unit testing.`;
                data.permissions = [{
                    unit: unit,
                    unitId: unit._id,
                    permission: 7
                }];

                return Promise.resolve(data);
            })
    }

    getNewTestData() {
        return this.getNewData()
            .then(this.getSert);
    }

    getTestData() {
        return this.getNewData()
            .then((data) => {

                data.code = "UT-ADM-P";
                data.name = "Admin-UT-P";
                data.description = "Unit test administrator with permissions";

                return this.getSert(data);
            });
    }
}
module.exports = new RoleDataUtil();
