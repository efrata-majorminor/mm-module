require("should");
var SummaryInventory = require("../../../data-util/inventory/summary-inventory-data-util");
var helper = require("../../../helper");
var validate = require("bateeq-models").validator.inventory.summaryInventory;

var summaryInventoryManager = require("../../../../src/managers/inventory/summary-inventory-manager");
var summaryInventoryManager = null;

//delete unitest data
var BtModels = require('bateeq-models');
var map = BtModels.map;
var MachineType = BtModels.master.MachineType;


before('#00. connect db', function (done) {
    helper.getDb()
        .then(db => {
            SummaryInventory = new summaryInventoryManager(db, {
                username: 'dev'
            });
            done();
        })
        .catch(e => {
            done(e);
        });
});

var createdId;
it("#01. should success when create new data", function (done) {
    SummaryInventory.getNewData()
        .then((data) => summaryInventoryManager.create(data))
        .then((id) => {
            id.should.be.Object();
            createdId = id;
            done();
        })
        .catch((e) => {
            done(e);
        });
});

var createdData;
it(`#02. should success when get created data with id`, function (done) {
    summaryInventoryManager.getSingleById(createdId)
        .then((data) => {
            data.should.instanceof(Object);
            validate(data);
            createdData = data;
            done();
        })
        .catch((e) => {
            done(e);
        });
});


var resultForExcelTest = {};
it("#03. should success when read data", function (done) {
    summaryInventoryManager.read({
        filter: {
            _id: createdId
        },
        "keyword": "TEST"
    })
        .then((documents) => {
            resultForExcelTest = documents;
            documents.should.have.property("data");
            documents.data.should.be.instanceof(Array);
            documents.data.length.should.not.equal(0);
            done();
        })
        .catch((e) => {
            done(e);
        });
});

it('#04. should success when get data for Excel Report', function (done) {
    summaryInventoryManager.getXls(resultForExcelTest)
        .then(xlsData => {
            xlsData.should.have.property('data');
            xlsData.should.have.property('options');
            xlsData.should.have.property('name');
            done();
        }).catch(e => {
            done(e);
        });
});


it("#05. should success when get summary report", function (done) {
    var info = {
        "storageId": createdData.storageId,
        "productId": createdData.productId,
    }
    summaryInventoryManager.getSummaryReport(info)
        .then((result) => {
            done();
        })
        .catch((e) => {
            done(e);
        });
});

it("#06. should success when destroy all unit test data", function (done) {
    summaryInventoryManager.destroy(createdData._id)
        .then((result) => {
            result.should.be.Boolean();
            result.should.equal(true);
            done();
        })
        .catch((e) => {
            done(e);
        });
});
