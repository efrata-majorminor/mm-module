var should = require("should");
var helper = require("../../../helper");
var validate = require("mm-models").validator.inventory.adjustmentDoc;
var AdjustmentManager = require("../../../../src/managers/inventory/adjustment-manager");
var instanceManager = null;


before('#00. connect db', function(done) {
    helper.getDb()
        .then(db => {
            var data = require("../../../data");
            data(db)
                .then(result => {
                    instanceManager = new AdjustmentManager(db, {
                        username: 'unit-test'
                    });
                    testData = result;
                    storageId = testData.storages["UT-FNG"]._id.toString();
                    _storage=testData.storages["UT-FNG"];
                    itemId = testData.finishedGoods["UT-FG1"]._id.toString(); 
                    _item= testData.finishedGoods["UT-FG1"];
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
                e.errors.should.have.property('items');
                done();
            }
            catch (ex) {
                done(e);
            }
        });
});

var createdId;
it("#02. should success when create new data with inQty", function(done) {
    var data={
        storage :_storage,
        storageId :storageId,
        items :[{
            itemId: itemId,
            item:_item,
            availableQuantity:0,
            inQty : 10,
            outQty:0,
            remarks : 'data for unit test'
        }]
    };
     instanceManager.create(data)
    .then(id => {
        id.should.be.Object();
        createdId = id;
        done();
    })
    .catch(e => {
        done(e);
    })
});

// it("#03. should success when create new data with outQty", function(done) {
//     var data={
//         storage :_storage,
//         storageId :storageId,
//         items :[{
//             itemId: itemId,
//             item:_item,
//             availableQuantity:10,
//             inQty : 0,
//             outQty:5,
//             remarks : 'data for unit test'
//         }]
//     };
//      instanceManager.create(data)
//     .then(id => {
//         id.should.be.Object();
//         createdId = id;
//         done();
//     })
//     .catch(e => {
//         done(e);
//     })
// });

var createdData;
it("#03. should success when get created data with id", function(done) {
    instanceManager.getSingleByQuery({
        _id: createdId
    })
    .then(data => {
        validate(data);
        createdData = data;
        done();
    })
    .catch(e => {
        done(e);
    })
});

it("#04. should error when create new data with inQty>0 and outQty>0", function(done) {
    var data={
        storage :_storage,
        storageId :storageId,
        items :[{
            itemId: itemId,
            item:_item,
            availableQuantity:0,
            inQty : 10,
            outQty:10,
            remarks : 'data for unit test'
        }]
    };
     instanceManager.create(data)
    .then((id) => {
            done("Should not be able to create new data with inQty>0 and outQty>0");
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

it("#05. should error when create new data with inQty=0 and outQty=0", function(done) {
    var data={
        storage :_storage,
        storageId :storageId,
        items :[{
            itemId: itemId,
            item:_item,
            availableQuantity:0,
            inQty : 0,
            outQty:0,
            remarks : 'data for unit test'
        }]
    }
     instanceManager.create(data)
    .then((id) => {
            done("Should not be able to create new data with inQty=0 and outQty=0");
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

it("#06. should error when create new data with availableQuantity=0 and outQty>0", function(done) {
    var data={
        storage :_storage,
        storageId :storageId,
        items :[{
            itemId: itemId,
            item:_item,
            availableQuantity:0,
            inQty : 0,
            outQty:10,
            remarks : 'data for unit test'
        }]
    };
     instanceManager.create(data)
    .then((id) => {
            done("Should not be able to create new data with availableQuantity=0 and outQty>0");
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

it("#07. should error when create new data without remarks", function(done) {
    var data={
        storage :_storage,
        storageId :storageId,
        items :[{
            itemId: itemId,
            item:_item,
            availableQuantity:0,
            inQty : 0,
            outQty:10,
            remarks : ''
        }]
    };
     instanceManager.create(data)
    .then((id) => {
            done("Should not be able to create new data without remarks");
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