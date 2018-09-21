'use strict';
var should = require('should');
var helper = require("../../../helper");
var DocumentInventoryManager = require("../../../../src/managers/inventory/document-inventory-manager");
var documentInventoryManager = null;
var documentInventoryDataUtil = require("../../../data-util/inventory/document-inventory-data-util");
var validate = require("bateeq-models").validator.inventory.documentInventory;

before('#00. connect db', function (done) {
    helper.getDb()
        .then(db => {
            documentInventoryManager = new DocumentInventoryManager(db, {
                username: 'unit-test'
            });
            done();
        })
        .catch(e => {
            done(e);
        })
});

it("#01. should success when create new data using status OUT", function (done) {
    documentInventoryDataUtil.getNewData()
        .then((data) => {
            data.type = "OUT";
           return documentInventoryManager.create(data)})
        .then((id) => {
            id.should.be.Object();
            done();
        })
        .catch((e) => {
            done(e);
        });
});

it("#02. should success when create new data using status ADJ", function (done) {
    documentInventoryDataUtil.getNewData()
        .then((data) => {
            data.type = "ADJ";
            return documentInventoryManager.create(data)})
        .then((id) => {
            id.should.be.Object();
            done();
        })
        .catch((e) => {
            done(e);
        });
});

it("#03. should success when read data", function (done) {
    documentInventoryManager.read({ "keyword": "test" })
        .then((data) => {
            done();
        })
        .catch((e) => {
            done(e);
        });
});