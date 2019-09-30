var should = require('should');
var helper = require('../helper');
var validate = require('mm-models').validator.merchandiser;
var manager;
var testData;

function getData() {
    var source = testData.storages["UT-BJB"];
    var destination = testData.storages["UT-ST1"];
    var variant = testData.items["UT-AV1"];

    var SpkDoc = require('mm-models').merchandiser.SPK;
    var SpkItem = require('mm-models').merchandiser.SPKItem;
    var spkDoc = new SpkDoc();
    var now = new Date();
    spkDoc.date = now;
    spkDoc.sourceId = source._id;
    spkDoc.destinationId = destination._id;

    spkDoc.reference = `reference[${spkDoc.date}]`;

    spkDoc.items.push(new SpkItem({ itemId: variant._id, quantity: 1, remark: 'SPK.test' }));
    return spkDoc;
}

before('#00. connect db', function (done) {
    helper.getDb()
        .then(db => {
            var data = require("../data");
            data(db)
                .then(result => {
                    var SPKBarangJadiManager = require('../../src/managers/merchandiser/efr-pk-pbj-manager');
                    manager = new SPKBarangJadiManager(db, {
                        username: 'unit-test'
                    });
                    testData = result;
                    done();
                });
        })
        .catch(e => {
            done(e);
        })
});

var createdId;
it('#01. should success when create new data', function (done) {
    var data = getData();
    manager.create(data)
        .then(id => {
            id.should.be.Object();
            createdId = id;
            done();
        })
        .catch(e => {
            done(e);
        })
});

var createdData;
it(`#02. should success when get created data with id`, function (done) {
    manager.getSingleByQuery({ _id: createdId })
        .then(data => {
            validate.SPKDoc(data);
            createdData = data;
            done();
        })
        .catch(e => {
            done(e);
        })
});

it(`#03. should success when password and packingList have value`, function (done) {
    manager.getSingleByQuery({ _id: createdId })
        .then(data => {
            validate.SPKDoc(data);
            if (data.password != "" && data.packingList != "") {
                done();
            }
            else {
                done("password  and packingList have no value");
            }
        })
        .catch(e => {
            done(e);
        })
});


it('#04. should success when save draft new data', function (done) {
    var data = getData();
    manager.createDraft(data)
        .then(id => {
            id.should.be.Object();
            createdId = id;
            done();
        })
        .catch(e => {
            done(e);
        })
});

var createdDataDraft;
it(`#05. should success when get drafted data with id`, function (done) {
    manager.getSingleByQuery({ _id: createdId })
        .then(data => {
            validate.SPKDoc(data);
            createdDataDraft = data;
            done();
        })
        .catch(e => {
            done(e);
        })
});

it(`#06. should success when update created data`, function (done) {

    createdData.reference += '[updated]';
    createdData.remark += '[updated]';
    manager.update(createdData)
        .then(id => {
            done();
        })
        .catch(e => {
            done(e);
        });
});

it(`#07. should success when update drafted data`, function (done) {

    createdDataDraft.reference += 'Draft [updated]';
    createdDataDraft.remark += 'Draft [updated]';
    manager.updateDraft(createdDataDraft)
        .then(id => {
            done();
        })
        .catch(e => {
            done(e);
        });
});


it(`#08. should success when delete data`, function (done) {
    manager.delete(createdData)
        .then(id => {
            done();
        })
        .catch(e => {
            done(e);
        });
});

