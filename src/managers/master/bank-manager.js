'use strict';

// external deps 
var ObjectId = require('mongodb').ObjectId;

// internal deps
require('mongodb-toolkit');
var BaseManager = require('module-toolkit').BaseManager;
var MmModels = require('mm-models');
var Bank = MmModels.master.Bank;
var map = MmModels.map;
//var generateCode = require('../../utils/code-generator');

module.exports = class BankManager extends BaseManager {
    constructor(db, user) {
        super(db, user);
        this.collection = this.db.use(map.master.Bank);
    }

    _createIndexes() {
        var dateIndex = {
            name: `ix_${map.master.Bank}__updatedDate`,
            key: {
                _updatedDate: -1
            }
        };

        var codeIndex = {
            name: `ix_${map.master.Bank}_code`,
            key: {
                code: 1
            },
            unique: true
        };

        return this.collection.createIndexes([dateIndex, codeIndex]);
    }

    _getQuery(paging) {

        var basicFilter = {
            _deleted: false
        }, keywordFilter = {};

        var query = {};

        if (paging.keyword) {
            var regex = new RegExp(paging.keyword, "i");
            var filterCode = {
                'code': {
                    '$regex': regex
                }
            };
            var filterName = {
                'name': {
                    '$regex': regex
                }
            };

            keywordFilter = {
                '$or': [filterCode, filterName]
            };
        }
        query = { '$and': [basicFilter, paging.filter, keywordFilter] };
        return query;
    }

    _validate(bank) {
        var errors = {};
        return new Promise((resolve, reject) => {
            var valid = new Bank(bank);
            // 1. begin: Declare promises.
            var getBank = this.collection.singleOrDefault({
                "$and": [{
                    _id: {
                        '$ne': new ObjectId(valid._id)
                    }
                }, {
                    code: valid.code
                }]
            });
            // 1. end: Declare promises.

            // 2. begin: Validation.
            Promise.all([getBank])
                .then(results => {
                    var _bank = results[0];
                    var patternForCode = "[a-zA-Z0-9]";

                    if (!valid.code || valid.code == '') {
                        errors["code"] = "Masukkan Kode";
                    } else if (valid.code.match(patternForCode) == null) {
                        errors["code"] = "Hanya menggunakan alphanumeric";
                    } else if (_bank) {
                        errors["code"] = "Kode sudah ada";
                    }
                    if (!valid.name || valid.name == '')
                        errors["name"] = "Masukkan nama";

                    // 2c. begin: check if data has any error, reject if it has.
                    for (var prop in errors) {
                        var ValidationError = require('module-toolkit').ValidationError;
                        reject(new ValidationError('data does not pass validation', errors));
                    }

                    valid.stamp(this.user.username, 'manager');
                    resolve(valid);
                })
                .catch(e => {
                    reject(e);
                })
        });
    }
};
