'use strict'
var helper = require('../../helper');
var PurchaseOrderManager = require('../../../src/managers/purchasing/purchase-order-manager');
var codeGenerator = require('../../../src/utils/code-generator');
var unit = require('../master/unit-data-util');
var vat = require('../master/vat-data-util');
var category = require('../master/category-data-util');
var PurchaseRequest = require('./purchase-request-data-util');
var product = require('../master/product-data-util');
var MmModels = require('mm-models');
var Currency = MmModels.master.Currency;
var Buyer = MmModels.master.Buyer;
var Supplier = MmModels.master.Supplier;

class PurchaseOrderDataUtil {
    getNewData(pr) { 
        return helper
            .getManager(PurchaseOrderManager)
            .then(manager => {
                var getPr = pr ? Promise.resolve(pr) : PurchaseRequest.getPostedData();

                return Promise.all([getPr])
                    .then(results => {
                        var purchaseRequest = results[0];

                        var poItems = purchaseRequest.items.map(prItem => {
                            return {
                                productId:prItem.productId,
                                product: prItem.product,
                                defaultQuantity: prItem.quantity,
                                defaultUom: prItem.uom
                            };
                        });

                        var data = {
                            no: `UT/PO/${codeGenerator()}`,
                            refNo: purchaseRequest.no,
                            iso: 'FM-6.00-06-005',
                            realizationOrderId: {},
                            realizationOrder: {},
                            purchaseRequestId: purchaseRequest._id,
                            purchaseRequest: purchaseRequest,
                            buyerId: {},
                            buyer: new Buyer(),
                            purchaseOrderExternalId: {},
                            purchaseOrderExternal: {},
                            sourcePurchaseOrderId: null,
                            sourcePurchaseOrder: null,
                            supplierId: {},
                            supplier: new Supplier(),
                            unitId: purchaseRequest.unit._id,
                            unit: purchaseRequest.unit,
                            categoryId: purchaseRequest.category._id,
                            category: purchaseRequest.category,

                            vat: purchaseRequest.vat,
                            useVat: false,
                            vatRate: 0,
                            useIncomeTax: false,
                            date: new Date(),
                            expectedDeliveryDate: new Date(),
                            actualDeliveryDate: new Date(),
                            isPosted: false,
                            isClosed: false,
                            remark: 'Unit Test PO Internal',

                            items: poItems
                        };
                        return Promise.resolve(data);
                    });
            });
    }

    getNewTestData() {
        return helper
            .getManager(PurchaseOrderManager)
            .then((manager) => {
                return this.getNewData().then((data) => {
                    return manager.create(data)
                        .then((id) => manager.getSingleById(id));
                });
            });
    }
}

module.exports = new PurchaseOrderDataUtil();