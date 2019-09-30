"use strict";
var _getSert = require("../getsert");
var generateCode = require("../../../src/utils/code-generator");
var Role = require("./role-data-util");
var Store = require("./../master/store-manager-data-util");

class AccountDataUtil {
    getSert(input) {
        var ManagerType = require("../../../src/managers/auth/account-manager");
        return _getSert(input, ManagerType, (data) => {
            return {
                username: data.username
            };
        });
    }

    getNewData(pRole, pStore) {
        var getRole;
        var getStore;
        if (pRole)
            getRole = Promise.resolve(pRole);
        else
            getRole = Role.getTestData();

        if (pRole)
            getStore = Promise.resolve(pStore);
        else
            getStore = Store.getTestData();

        return Promise.all([getRole, getStore])
            .then(results => {
                var Model = require("mm-models").auth.Account;
                var data = new Model();

                var code = generateCode();
                var role = results[0];
                var store = results[1];

                data.username = `${code}@unit.test`;
                data.password = "Standar123";
                data.confirmPassword = "Standar123";
                data.isLocked = false;
                data.profile = {
                    firstname: "John",
                    lastname: code,
                    gender: "M",
                    dob: new Date(),
                    email: `unit.test@moonlay.com`
                };
                data.roles = [role];
                data.stores = [store];

                return Promise.resolve(data);
            })
    }

    getNewTestData(role) {
        return this.getNewData(role)
            .then(this.getSert);
    }

    getTestData() {
        return this.getNewData()
            .then((data) => {
                data.username = "dev2";
                data.email = "dev@unit.test";
                data.profile.firstname = "Test";
                data.profile.lastname = "Unit";
                data.profile.email = "dev@unit.test";
                data.profile.gender = "M";
                data.profile.dob = new Date();
                return this.getSert(data);
            });
    }
}
module.exports = new AccountDataUtil();
