var options = {
    manager: require("../../../../src/managers/purchasing/unit-payment-quantity-correction-note-manager"),
    model: require("mm-models").purchasing.UnitPaymentCorrectionNote,
    util: require("../../../data-util/purchasing/unit-payment-quantity-correction-note-data-util"),
    validator: require("mm-models").validator.purchasing.unitPaymentCorrectionNote,
    createDuplicate: false,
    keys: []
};

var basicTest = require("../../../basic-test-factory");
basicTest(options);