var options = {
    manager: require("../../../../src/managers/purchasing/purchase-order-external-manager"),
    model: require("bateeq-models").purchasing.PurchaseOrderExternal,
    util: require("../../../data-util/purchasing/purchase-order-external-data-util"),
    validator: require("bateeq-models").validator.purchasing.purchaseOrderExternal,
    createDuplicate: false,
    keys: []
};

var basicTest = require("../../../basic-test-factory");
basicTest(options);