"use strict";
var helper = require("./../../../helper");
var BaseManager = require('module-toolkit').BaseManager;
var BateeqModels = require('bateeq-models');
var map = BateeqModels.map;
var store = require("../../master/store-manager-data-util");
var item = require("../../master/item-data-util");
var codeGenerator = require("../../../../src/utils/code-generator");

class MasterDiscountDataUtil {
    getNewData() {
        var getStore = store.getNewData();
        var getItem = item.getNewData();

        return Promise.all([getStore,getItem])
            .then(result => {
                var stores = [];
                var items = [];
                var now = new Date();
                var after = new Date();
                stores.push(result[0]);
                items.push(result[1]);

                var data = {
                    code : `discount/${codeGenerator()}`,
                    discountOne: 10,
                    discountTwo: 14,
                    startDate : now,
                    endDate : after,
                    stores : stores,
                    storeCategory : 'ALL',
                    items : items
                };

                return Promise.resolve(data);
            })
            .catch(e => {
                Promise.reject(e);
            });
    }
}

module.exports = new MasterDiscountDataUtil();