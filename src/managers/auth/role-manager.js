'use strict'

var ObjectId = require("mongodb").ObjectId;
require("mongodb-toolkit");
var MmModels = require('mm-models');
var map = MmModels.map;
var Role = MmModels.auth.Role;
var BaseManager = require('module-toolkit').BaseManager;

module.exports = class RoleManager extends BaseManager {
    constructor(db, user) {
        super(db, user);
        this.collection = this.db.use(map.auth.collection.Role);
    }

    _createIndexes() {
        var dateIndex = {
            name: `ix_${map.auth.collection.Role}__updatedDate`,
            key: {
                _updatedDate: -1
            }
        };

        var codeIndex = {
            name: `ix_${map.auth.collection.Role}_code`,
            key: {
                code: 1
            }
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

    uniqueInArray(array) {
        let unique = [];
        array.filter(function (each) {
            var i = unique.findIndex(u => u.unitId === each.unitId);
            if (i <= -1)
                unique.push(each);
        });
        return unique;
    }

    _validate(role) {
        var errors = {};
        return new Promise((resolve, reject) => {
            var valid = role;
            // 1. begin: Declare promises.
            var getBuyerPromise = this.collection.singleOrDefault({
                "$and": [{
                    _id: {
                        '$ne': new ObjectId(valid._id)
                    }
                }, {
                    code: valid.code
                }]
            });
            valid.permissions = this.uniqueInArray(valid.permissions);
            // 2. begin: Validation.
            Promise.all([getBuyerPromise])
                .then(results => {
                    var _role = results[0];

                    if (!valid.code || valid.code == '')
                        errors["code"] = "Kode harus diisi";
                    else if (_role) {
                        errors["code"] = "Kode sudah ada";
                    }

                    if (!valid.name || valid.name == '')
                        errors["name"] = "Nama Harus diisi";

                    // 2c. begin: check if data has any error, reject if it has.
                    if (Object.getOwnPropertyNames(errors).length > 0) {
                        var ValidationError = require('module-toolkit').ValidationError;
                        reject(new ValidationError('data does not pass validation', errors));
                    }

                    if (!valid.stamp) {
                        valid = new Role(valid);
                    }

                    valid.stamp(this.user.username, "manager");
                    resolve(valid);
                })
                .catch(e => {
                    reject(e);
                })
        });
    }
}