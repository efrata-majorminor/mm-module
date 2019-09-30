var should = require('should');
var helper = require('../helper');
var validate = require('mm-models').validator.master;
var generateCode = require('../../src/utils/code-generator');
var manager;
var storageId = "5872ff7eba34f8002d4538fd";
var inventoryId = "58d0ab908c87e2003670850c";

before('#00. connect db', function (done) {
    helper.getDb()
        .then(db => {
            var StockAvailabilityManager = require('../../src/managers/inventory/stock-availability-manager');
            manager = new StockAvailabilityManager(db, {
                username: 'unit-test'
            });
            done();
        })
        .catch(e => {
            done(e);
        })
});

it('#01. should success when get storage stock', function (done) {
    manager.getStorageStock(storageId)
        .then(inventories => {
            inventories.should.not.equal(null);
            inventories.should.instanceof(Array);
            done();
        })
        .catch(e => {
            done(e);
        })
});

// it('#02. should success when get the nearest stock of store', function(done) {
//     manager.getNearestStock(inventoryId)
//         .then(stocks => {
//             stocks.should.instanceof(Array);
//             done();
//         })
//         .catch(e => {
//             done(e);
//         })
// });