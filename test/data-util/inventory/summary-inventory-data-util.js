'use strict'
var helper = require("../../helper");
var SummaryInventoryManager = require("../../../src/managers/inventory/summary-inventory-manager");
var productDataUtil = require('../master/product-data-util');
var storageDataUtil = require('../master/storage-data-util');
var uomDataUtil = require('../master/uom-data-util');

var codeGenerator = require('../../../src/utils/code-generator');

var Models = require("mm-models");
var Map = Models.map;
var SummaryInventoryModel = Models.inventory.SummaryInventory;


class SummaryInventoryDataUtil {
    getNewData() {
        return Promise.all([productDataUtil.getRandomTestData(), storageDataUtil.getTestData(), uomDataUtil.getTestData()])
            .then(result => {
                var product = result[0];
                var storage = result[1];
                var uom = result[2];

                var data = {
                    code: codeGenerator(),
                    productId: product._id,
                    storageId: storage._id,
                    uomId: uom._id,
                    quantity: 1000 
                };

                return data;
            })
    }

    getNewTestData() {
        return helper
            .getManager(SummaryInventoryManager)
            .then((manager) => {
                return this.getNewData().then((data) => {
                    return manager.create(data)
                        .then((id) => {
                            return manager.getSingleById(id)
                        });
                });
            });
    }
}
module.exports = new SummaryInventoryDataUtil();
