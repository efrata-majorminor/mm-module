'use strict'
var helper = require("../../helper");
var DocumentInventoryManager = require("../../../../src/managers/inventory/document-inventory-manager");
var productDataUtil = require('../master/product-data-util');
var storageDataUtil = require('../master/storage-data-util');
var uomDataUtil = require('../master/uom-data-util');

var codeGenerator = require('../../../src/utils/code-generator');

var Models = require("bateeq-models");
var Map = Models.map;
var MovementInventoryModel = Models.inventory.MovementInventory;


class DocumentInventoryDataUtil {
    getNewData() {
        return Promise.all([productDataUtil.getTestData(), productDataUtil.getTestData2(), storageDataUtil.getTestData(), uomDataUtil.getTestData()])
            .then(result => {
                var product = result[0];
                var product2 = result[1];
                var storage = result[2];
                var uom = result[3];

                var code = codeGenerator()
                var data = {
                    code: code,
                    referenceNo: `RFNO-${code}`,
                    referenceType: 'unit-test-doc',
                    type: "IN",
                    date: new Date(),
                    storageId: storage._id,
                    items: [{
                        productId: product._id,
                        quantity: 1000,
                        uomId: uom._id
                    }, {
                        productId: product2._id,
                        quantity: 1000,
                        uomId: uom._id
                    }]
                };

                return data;
            })
    }

    getNewTestData() {
        return helper
            .getManager(DocumentInventoryManager)
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
module.exports = new DocumentInventoryDataUtil();
