var options = {
    manager: require("../../../../src/managers/purchasing/unit-payment-price-correction-note-manager"),
    model: require("bateeq-models").purchasing.PurchaseCorrection,
    util: require("../../../data-util/purchasing/unit-payment-quantity-correction-note-data-util"),
    validator: require("bateeq-models").validator.purchasing.purchaseCorrectionValidator,
    createDuplicate: false,
    keys: []
};

var basicTest = require("./price-correction-test");
basicTest(options);