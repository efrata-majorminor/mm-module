var options = {
    manager: require("../../../../src/managers/inventory/movement-inventory-manager"),
    model: require("bateeq-models").inventory.MovementInventory,
    util: require("../../data-util/inventory/movement-inventory-data-util"),
    validator: require("bateeq-models").validator.inventory.movementInventory,
    createDuplicate: false,
    keys: []
};

var basicTest = require("../../basic-test-factory");
basicTest(options); 