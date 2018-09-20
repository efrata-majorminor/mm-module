require("should");
var MovementInventory = require("../../../data-util/inventory/movement-inventory-data-util");
var helper = require("../../../helper");
var moment = require("moment");
var validate = require("bateeq-models").validator.inventory.movementInventory;

var MovementInventoryManager = require("../../../../src/managers/inventory/movement-inventory-manager");
var MovementinventoryManager = null;

//delete unitest data
// var DLModels = require('dl-models');
// var map = DLModels.map;
// var MachineType = DLModels.master.MachineType;


before('#00. connect db', function (done) {
    helper.getDb()
        .then(db => {
            movementInventoryManager = new MovementInventoryManager(db, {
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
    MovementInventory.getNewData()
        .then((data) => movementInventoryManager.create(data))
        .then((id) => {
            id.should.be.Object();
            createdId = id;
            done();
        })
        .catch((e) => {
            done(e);
        });
});

it(`#02. should success when get created data with id`, function (done) {
    movementInventoryManager.getSingleById(createdId)
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


it("#01.(3) should success when create new data", function (done) {
    MovementInventory.getNewTestData3()
        .then((data) => movementInventoryManager.create(data))
        .then((id) => {
            id.should.be.Object();
            createdId = id;
            done();
        })
        .catch((e) => {
            done(e);
        });
});

it("#01.(4) should success when create new data", function (done) {
    MovementInventory.getNewTestData4()
        .then((data) => movementInventoryManager.create(data))
        .then((id) => {
            id.should.be.Object();
            createdId = id;
            done();
        })
        .catch((e) => {
            done(e);
        });
});

it("#01.(5) should success when create new data", function (done) {
    MovementInventory.getNewTestData5()
        .then((data) => movementInventoryManager.create(data))
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
    movementInventoryManager.getSingleById(createdId)
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
    movementInventoryManager.getMovementReport({
        "filter": {
            "_id": createdId
        },
        "offset": 0,
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

var filter = {};
it('#04. should success when get data for Excel Report', function (done) {
    movementInventoryManager.getXls(resultForExcelTest, filter)
        .then(xlsData => {
            xlsData.should.have.property('data');
            xlsData.should.have.property('options');
            xlsData.should.have.property('name');
            done();
        }).catch(e => {
            done(e);
        });
});

it("#05. should success when destroy all unit test data", function (done) {
    movementInventoryManager.destroy(createdData._id)
        .then((result) => {
            result.should.be.Boolean();
            result.should.equal(true);
            done();
        })
        .catch((e) => {
            done(e);
        });
});
