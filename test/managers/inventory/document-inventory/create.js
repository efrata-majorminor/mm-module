'use strict';
var should = require('should');
var helper = require("../../../helper");
var DocumentInventoryManager = require("../../../../src/managers/inventory/document-inventory-manager");
var DocumentInventoryManager = null;
var DocumentInventoryDataUtil = require("../../../data-util/inventory/document-inventory-data-util");
var validate = require("bateeq-models").validator.inventory.DocumentInventory;

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

it("#01. should success when create new data using status OUT", function (done) {
    DocumentInventoryDataUtil.getNewData()
        .then((data) => {
            data.type = "OUT";
           return DocumentInventoryManager.create(data)})
        .then((id) => {
            id.should.be.Object();
            done();
        })
        .catch((e) => {
            done(e);
        });
});

it("#02. should success when create new data using status ADJ", function (done) {
    DocumentInventoryDataUtil.getNewData()
        .then((data) => {
            data.type = "ADJ";
            return DocumentInventoryManager.create(data)})
        .then((id) => {
            id.should.be.Object();
            done();
        })
        .catch((e) => {
            done(e);
        });
});