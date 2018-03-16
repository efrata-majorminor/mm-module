var options = {
    manager: require("../../../../src/managers/purchasing/unit-receipt-note-manager"),
    model: require("bateeq-models").purchasing.UnitReceiptNote,
    util: require("../../../data-util/purchasing/unit-receipt-note-data-util"),
    validator: require("bateeq-models").validator.purchasing.unitReceiptNote,
    createDuplicate: false,
    keys: []
};

var basicTest = require("../../../basic-test-factory");
basicTest(options);