var should = require('should');
var helper = require('../../helper');
var validate = require('mm-models').validator.master;
var generateCode = require('../../../src/utils/code-generator');
var manager;

function getData() {
    var Material = require('mm-models').master.Material;
    var Component = require('mm-models').master.Component;
    var material = new Material();

    var code = generateCode('UnitTest');

    material.code = code;
    material.name = `name[${code}]`;
    material.description = `description for ${code}`;
    material.uom = 'pcs';

    var component = new Component({
        item: {
            name: 'new item',
            uom: 'pcs'
        },
        quantity: 1,
        uom: 'pcs'
    });
    var component2 = new Component({
        item: new Material({
            name: 'new material',
            uom: 'pcs'
        }),
        quantity: 1,
        uom: 'pcs'
    });
    material.components.push(component);
    material.components.push(component2);

    return material;
}

before('#00. connect db', function(done) {
    helper.getDb()
        .then(db => {
            var MaterialManager = require('../../../src/managers/master/material-manager');
            manager = new MaterialManager(db, {
                username: 'unit-test'
            });
            done();
        })
        .catch(e => {
            done(e);
        })
});

var createdId;
it('#01. should success when create new data', function(done) {
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
it(`#02. should success when get created data with id`, function(done) {
    manager.getSingleByQuery({
            _id: createdId
        })
        .then(data => {
            validate.material(data);
            createdData = data;
            done();
        })
        .catch(e => {
            done(e);
        });
});


it(`#03. all component material should valid`, function(done) {
    var tasks = [];
    for (var component of createdData.components) {
        var p = new Promise((resolve, reject) => {
            validate.component(component);
            manager.getSingleByQuery({
                    _id: component.item._id
                })
                .then(data => {
                    validate.material(data);
                    resolve(true);
                })
                .catch(e => {
                    reject(e);
                })
        })
        tasks.push(p);
    }
    Promise.all(tasks)
        .then(results => {
            done();
        })
        .catch(e => {
            done(e);
        });
});


it(`#04. should success when update created data`, function(done) {

    createdData.code += '[updated]';
    createdData.name += '[updated]';
    createdData.description += '[updated]';

    manager.update(createdData)
        .then(id => {
            createdId.toString().should.equal(id.toString());
            done();
        })
        .catch(e => {
            done(e);
        });
});
var updatedData;
it(`#05. should success when get updated data with id`, function(done) {
    manager.getSingleByQuery({
            _id: createdId
        })
        .then(data => {
            validate.material(data);
            data.code.should.equal(createdData.code);
            data.name.should.equal(createdData.name);
            data.description.should.equal(createdData.description);
            updatedData = data;
            done();
        })
        .catch(e => {
            done(e);
        })
});

it(`#06. all component material should valid after update`, function(done) {
    var tasks = [];
    for (var component of updatedData.components) {
        var p = new Promise((resolve, reject) => {
            validate.component(component);
            manager.getSingleByQuery({
                    _id: component.item._id
                })
                .then(data => {
                    validate.material(data);
                    resolve(true);
                })
                .catch(e => {
                    reject(e);
                })
        })
        tasks.push(p);
    }
    Promise.all(tasks)
        .then(results => {
            done();
        })
        .catch(e => {
            done(e);
        });
});

it(`#07. should success when delete data`, function(done) {
    manager.delete(createdData)
        .then(id => {
            createdId.toString().should.equal(id.toString());
            done();
        })
        .catch(e => {
            done(e);
        });
});

it(`#08. should _deleted=true`, function(done) {
    manager.getSingleByQuery({
            _id: createdId
        })
        .then(data => {
            validate.material(data);
            data._deleted.should.be.Boolean();
            data._deleted.should.equal(true);
            done();
        })
        .catch(e => {
            done(e);
        })
});


it('#09. should error when create new data with same code', function(done) {
    var data = Object.assign({}, createdData);
    delete data._id;
    manager.create(data)
        .then(id => {
            id.should.be.Object();
            createdId = id;
            done("Should not be able to create data with same code");
        })
        .catch(e => {
            try {
                e.errors.should.have.property('code');
                done();
            }
            catch (e) {
                done(e);
            }
        })
});

it('#10. should error with property code, name, uom', function(done) {
    manager.create({})
        .then(id => {
            done("Should not be error with property code and name");
        })
        .catch(e => {
            try {
                e.errors.should.have.property('code');
                e.errors.should.have.property('name');
                e.errors.should.have.property('uom');
                done();
            }
            catch (ex) {
                done(ex);
            }
        })
});