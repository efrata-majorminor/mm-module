var options = {
    manager: require("../../../../src/managers/purchasing/purchase-order-manager"),
    model: require("bateeq-models").purchasing.PurchaseOrder,
    util: require("../../../data-util/purchasing/purchase-order-data-util"),
    validator: require("bateeq-models").validator.purchasing.purchaseOrder,
    createDuplicate: false,
    keys: []
};

var basicTest = require("../../../basic-test-factory");
basicTest(options); 