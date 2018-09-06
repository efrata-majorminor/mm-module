'use strict';
var should = require('should');
var helper = require("../../../helper");
var DocumentInventoryManager = require("../../../../src/managers/inventory/document-inventory-manager");
var DocumentInventoryManager = null;
var DocumentInventoryDataUtil = require("../../../data-util/inventory/document-inventory-data-util");
var validate = require("bateeq-models").validator.inventory.documentInventory;

before('#00. connect db', function (done) {
    helper.getDb()
        .then(db => {
            DocumentInventoryManager = new DocumentInventoryManager(db, {
                username: 'unit-test'
            });
            done();
        })
        .catch(e => {
            done(e);
        })
});

it('#01. should error when create new data without productId, uomId, quantity=0', function (done) {
    DocumentInventoryDataUtil.getNewData()
        .then(data => {

            data.items[0].quantity = 0;
            data.items[0].productId = {};
            data.items[0].uomId = {};

            DocumentInventoryManager.create(data)
                .then(id => {
                    done("should error when create new data without productId, uomId, quantity=0");
                })
                .catch(e => {
                    try {
                        e.errors.should.have.property('items');
                        done();
                    }
                    catch (ex) {
                        done(ex);
                    }
                });
        })
        .catch(e => {
            done(e);
        });
});

it("#02. should success when read data", function (done) {
    DocumentInventoryManager.read({
        "keyword": "TEST"
    })
        .then((documents) => {
            done();
        })
        .catch((e) => {
            done(e);
        });
});