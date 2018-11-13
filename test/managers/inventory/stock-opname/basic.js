var should = require("should");
var helper = require("../../../helper");
var validate = require("bateeq-models").validator.inventory.adjustmentDoc;
var StockManager = require("../../../../src/managers/inventory/stock-opname-doc-manager");
var instanceManager = null;

before('#00. connect db', function(done) {
    helper.getDb()
        .then(db => {
            var data = require("../../../data");
            data(db)
                .then(result => {
                    instanceManager = new StockManager(db, {
                        username: 'unit-test'
                    });
                    testData = result;
                    storageId = testData.storages["UT-FNG"]._id.toString();
                    _storage=testData.storages["UT-FNG"];
                    itemId1 = testData.finishedGoods["UT-FG1"]._id.toString(); 
                    _item1= testData.finishedGoods["UT-FG1"];
                    itemId2 = testData.finishedGoods["UT-FG2"]._id.toString(); 
                    _item2= testData.finishedGoods["UT-FG2"];
                    done();
                });
        })
        .catch(e => {
            done(e);
        })
});

it("#01. should error when create new data with empty data", function(done){
    instanceManager.create({})
        .then((id) => {
            done("Should not be able to create data with empty data");
        })
        .catch((e) => {
            try {
                e.errors.should.have.property('storage');
                e.errors.should.have.property('file');
                done();
            }
            catch (ex) {
                done(e);
            }
        });
});

it("#02. should error when create new data with wrong upload data", function(done){
    var data = {
        storageId : storageId,
        dataFile :[
            [],
            [`${_item1.code}`, `${_item1.name}`, "10"],
            [`${_item1.code}`, "", "10"],
            [`${_item1.code}`, "", "n"]
        ]
    }
    instanceManager.create(data)
        .then((id) => {
            id.errors.should.be.Array();
            done();
        })
        .catch((e) => {
            try {
                done(e);
            }
            catch (ex) {
                done(e);
            }
        });
});

it("#03. should success when create new upload data", function(done){
    var data = {
        storageId : storageId,
        dataFile :[
            [],
            [`${_item1.code}`, `${_item1.name}`, "10"],
            [`${_item2.code}`, `${_item2.name}`, "10"]
        ]
    }
    instanceManager.create(data)
        .then((id) => {
            id.ops.should.be.Array();
            stockOpnameId = id.ops[0]._id;
            done();
        })
        .catch((e) => {
            try {
                done(e);
            }
            catch (ex) {
                done(e);
            }
        });
});

it("#04. should success when get data upload", function(done){
    instanceManager.getSingleById(stockOpnameId)
        .then((SO) => {
            SO.should.be.Object();
            stockOpname = SO;
            done();
        })
        .catch((e) => {
            try {
                done(e);
            }
            catch (ex) {
                done(e);
            }
        });
});

it("#05. should success when delete data uploaded", function(done){
    instanceManager.getSingleById(stockOpnameId)
        .then((SO) => {
            instanceManager.delete(SO)
                .then(id => {
                    instanceManager.getSingleByQuery({"_id" : stockOpnameId})
                        .then(result => {
                            result._deleted.should.equal(true);
                            done();
                        })
                        .catch((e) => {
                            try {
                                done(e);
                            }
                            catch (ex) {
                                done(e);
                            }
                        });
                })
                .catch((e) => {
                    try {
                        done(e);
                    }
                    catch (ex) {
                        done(e);
                    }
                });
        })
        .catch((e) => {
            try {
                done(e);
            }
            catch (ex) {
                done(e);
            }
        });
});

it("#06. should success when create new upload data", function(done){
    var data = {
        storageId : storageId,
        dataFile :[
            [],
            [`${_item1.code}`, `${_item1.name}`, "10"],
            [`${_item2.code}`, `${_item2.name}`, "10"]
        ]
    }
    instanceManager.create(data)
        .then((id) => {
            id.should.be.Object();
            stockOpnameId1 = id.ops[0]._id;
            done();
        })
        .catch((e) => {
            try {
                done(e);
            }
            catch (ex) {
                done(e);
            }
        });
});

it("#07. should success when get data upload", function(done){
    instanceManager.getSingleById(stockOpnameId1)
        .then((SO) => {
            SO.should.be.Object();
            stockOpname1 = SO;
            done();
        })
        .catch((e) => {
            try {
                done(e);
            }
            catch (ex) {
                done(e);
            }
        });
});

it("#08. should error when update data with wrong storage", function(done){
    stockOpname1.storageId = "storageId";
    instanceManager.update(stockOpname1)
        .then((id) => {
            done("should error when update data with wrong storage");
        })
        .catch((e) => {
            try {
                e.errors.should.have.property('storage');
                done();
            }
            catch (ex) {
                done(e);
            }
        });
});

it("#09. should error when update data with isAdjust true and no remark", function(done){
    stockOpname1.storageId = stockOpname1.storage._id;
    var items = [];
    for(var a of stockOpname1.items){
        a.isAdjusted = true;
        a.remark = "";
        items.push(a);
    }
    stockOpname1.items = items;
    instanceManager.update(stockOpname1)
        .then((id) => {
            done("should error when update data with isAdjust true and no remark");
        })
        .catch((e) => {
            try {
                e.errors.should.have.property('items');
                done();
            }
            catch (ex) {
                done(e);
            }
        });
});

it("#10. should success update data", function(done){
    stockOpname1.storageId = stockOpname1.storage._id;
    var items = [];
    for(var a of stockOpname1.items){
        a.isAdjusted = true;
        a.remark = "Ada Tambahan";
        items.push(a);
    }
    stockOpname1.items = items;
    instanceManager.update(stockOpname1)
        .then((id) => {
            id.should.be.Object();
            done();
        })
        .catch((e) => {
            try {
                done(e);
            }
            catch (ex) {
                done(e);
            }
        });
});