'use strict';

// external deps 
var ObjectId = require('mongodb').ObjectId;
require('mongodb-toolkit');
var BaseManager = require('module-toolkit').BaseManager;
var MmModels = require('mm-models');
var map = MmModels.map;
var generateCode = require('../../utils/code-generator');
var moment = require('moment');
var moduleId = "opname-balance-history";

module.exports = class StockOpnameBalanceHistoryManager extends BaseManager {
    constructor(db, user) {
        super(db, user);
        this.collection = this.db.use(map.inventory.StockOpnameBalanceHistory)
    }

    create(stockOpnameBalanceHistory) {
        return new Promise((resolve, reject) => {

            this.collection.insert(stockOpnameBalanceHistory)
            .then((result) => {
                resolve(result);
            })
            .catch((error) => {
                reject(error);
            });
        });
    }
}