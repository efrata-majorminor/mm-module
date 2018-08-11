var options = {
    manager: require("../../../../src/managers/inventory/document-inventory-manager"),
    model: require("bateeq-models").inventory.DocumentInventory,
    util: require("../../data-util/inventory/document-inventory-data-util"),
    validator: require("bateeq-models").validator.inventory.documentInventory,
    createDuplicate: false,
    keys: []
};

var basicTest = require("../../basic-test-factory");
basicTest(options); 