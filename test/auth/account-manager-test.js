var helper = require("../helper");
var AccountManager = require("../../src/managers/auth/account-manager");
var validateAccount = require('mm-models').validator.auth.account;
var instanceManager = null;
var generateCode = require('../../src/utils/code-generator');
require("should");

function getData() {
    var Account = require('mm-models').auth.Account;
    var account = new Account();

    var code = generateCode('UnitTest');

    account.username = `user${code}@unit.test`;
    account.password = "Standar123";
    account.confirmPassword = "Standar123";
    account.profile = {
        firstname: 'unit',
        lastname: 'test',
        gender: 'M',
        dob: new Date(),
        email: `unit.test@moonlay.com`
    };
    return account;
}


before('#00. connect db', function(done) {
    helper.getDb()
        .then(db => {
            instanceManager = new AccountManager(db, {
                username: 'unit-test'
            });
            done();
        })
        .catch(e => {
            done(e);
        })
});

it('#01. should success when read data', function(done) {
    instanceManager.read()
        .then(documents => {
            //process documents
            documents.data.should.be.instanceof(Array);
            done();
        })
        .catch(e => {
            done(e);
        })
});

var createdId;
it('#02. should success when create new data', function(done) {
    var data = getData();
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

var createdData;
it(`#03. should success when get created data with id`, function(done) {
    instanceManager.getSingleByQuery({
            _id: createdId
        })
        .then(data => {
            // validate.product(data);
            data.should.instanceof(Object);
            createdData = data;
            validateAccount(data);
            done();
        })
        .catch(e => {
            done(e);
        })
});


it(`#04. should success when update created data`, function(done) {

    createdData.profile.lastname += '[updated]';
    createdData.password = '';
    createdData.confirmPassword = '';

    instanceManager.update(createdData)
        .then(id => {
            createdId.toString().should.equal(id.toString());
            done();
        })
        .catch(e => {
            done(e);
        });
});

it(`#05. should success when get updated data with id`, function(done) {
    instanceManager.getSingleByQuery({
            _id: createdId
        })
        .then(data => {
            data.profile.firstname.should.equal(createdData.profile.firstname);
            data.profile.lastname.should.equal(createdData.profile.lastname);
            data.password.should.not.equal('');
            validateAccount(data);
            done();
        })
        .catch(e => {
            done(e);
        })
});

it(`#06. should success when delete data`, function(done) {
    instanceManager.delete(createdData)
        .then(id => {
            createdId.toString().should.equal(id.toString());
            done();
        })
        .catch(e => {
            done(e);
        });
});

it(`#07. should _deleted=true`, function(done) {
    instanceManager.getSingleByQuery({
            _id: createdId
        })
        .then(data => {
            // validate.product(data);
            data._deleted.should.be.Boolean();
            data._deleted.should.equal(true);
            validateAccount(data);
            done();
        })
        .catch(e => {
            done(e);
        })
});

it('#08. should error when create new data with same username', function(done) {
    var data = Object.assign({}, createdData);
    delete data._id;
    instanceManager.create(data)
        .then(id => {
            id.should.be.Object();
            createdId = id;
            done("Should not be able to create data with same username");
        })
        .catch(e => {
            e.errors.should.have.property('username');
            done();
        })
});