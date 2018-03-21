var options = {
    manager: require("../../../../src/managers/purchasing/delivery-order-manager"),
    model: require("bateeq-models").purchasing.DeliveryOrder,
    util: require("../../../data-util/purchasing/delivery-order-data-util"),
    validator: require("bateeq-models").validator.purchasing.deliveryOrder,
    createDuplicate: false,
    keys: []
};

var basicTest = require("../../../basic-test-factory");
basicTest(options);