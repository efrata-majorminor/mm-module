var options = {
    manager: require("../../../../../src/managers/inventory/master/discount-manager"),
    model: require("mm-models").inventory.master.Discount,
    util: require("../../../../data-util/inventory/master/master-discount-data-util"),
    validator: require("mm-models").validator.inventory.master.discount,
    createDuplicate: false,
    keys: []
};

var basicTest = require("./basic-test-discount");
basicTest(options); 