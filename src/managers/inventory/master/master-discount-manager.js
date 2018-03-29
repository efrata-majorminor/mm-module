"use strict";
const moduleId = "M-DISC";
var ObjectId = require("mongodb").ObjectId;
require("mongodb-toolkit");
var BateeqModels = require("bateeq-models");
var map = BateeqModels.map;
var generateCode = require('../../../utils/code-generator');
var BaseManager = require('module-toolkit').BaseManager;
var Discount = BateeqModels.inventory.master.Discount;

module.exports = class BankManager extends BaseManager {
    constructor(db, user) {
        super(db, user);
        this.collection = this.db.use(map.inventory.master.Discount);
    }

    _createIndexes() {
        var dateIndex = {
            name: `ix_${map.inventory.master.Discount}__updatedDate`,
            key: {
                _updatedDate: -1
            }
        };

        return this.collection.createIndexes([dateIndex]);
    }

    _beforeInsert(discount) {
        discount.code = generateCode(moduleId);
        return Promise.resolve(discount);
    };

    _validate(discount) {
        var valid = discount;

        return new Promise((resolve, reject) => {

            if (!valid.name || valid.name == '') {
                errors["name"] = "Masukkan nama";
            }

            if (!valid.startDate || valid.startDate == '') {
                errors["startDate"] = "Masukkan Mulai Berlaku Diskon";
            }

            if (!valid.endDate || valid.endDate == '') {
                errors["endDate"] = "Masukkan Mulai Berakhir Diskon";
            }

            if (!valid.stamp) {
                valid = new Discount(valid);
            }

            valid.stamp(this.user.username, "manager");
            resolve(valid);
        }).catch(e => {
            reject(e);
        });
    }
};