var options = {
    manager: require("../../../../src/managers/inventory/summary-inventory-manager"),
    model: require("bateeq-models").inventory.SummaryInventory,
    util: require("../../../data-util/inventory/summary-inventory-data-util"),
    validator: require("bateeq-models").validator.inventory.summaryInventory,
    createDuplicate: false,
    keys: []
};

var basicTest = require("../../../basic-test-factory");
basicTest(options); 