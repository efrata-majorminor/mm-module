var options = {
    manager: require("../../../../src/managers/purchasing/purchase-request-manager"),
    model: require("mm-models").purchasing.PurchaseRequest,
    util: require("../../../data-util/purchasing/purchase-request-data-util"),
    validator: require("mm-models").validator.purchasing.purchaseRequest,
    createDuplicate: false,
    keys: []
};

var basicTest = require("../../../basic-test-factory");
basicTest(options); 