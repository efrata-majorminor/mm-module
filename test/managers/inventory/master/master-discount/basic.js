var options = {
    manager: require("../../../../../src/managers/inventory/master/discount-manager"),
    model: require("bateeq-models").inventory.master.Discount,
    util: require("../../../../data-util/inventory/master/master-discount-data-util"),
    validator: require("bateeq-models").validator.inventory.master.discount,
    createDuplicate: false,
    keys: []
};

var basicTest = require("../../../../basic-test-factory");
basicTest(options); 