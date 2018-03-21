var options = {
    manager: require("../../../../src/managers/purchasing/unit-payment-order-manager"),
    model: require("bateeq-models").purchasing.UnitPaymentOrder,
    util: require("../../../data-util/purchasing/unit-payment-order-data-util"),
    validator: require("bateeq-models").validator.purchasing.unitPaymentOrder,
    createDuplicate: false,
    keys: []
};

var basicTest = require("../../../basic-test-factory");
basicTest(options);