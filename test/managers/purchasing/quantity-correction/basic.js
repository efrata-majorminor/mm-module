var options = {
    manager: require("../../../../src/managers/purchasing/unit-payment-quantity-correction-note-manager"),
    model: require("bateeq-models").purchasing.PurchaseCorrection,
    util: require("../../../data-util/purchasing/purchase-quantity-correction-data-util"),
    validator: require("bateeq-models").validator.purchasing.purchaseCorrectionValidator,
    createDuplicate: false,
    keys: []
};

var basicTest = require("../../../basic-test-factory");
basicTest(options);