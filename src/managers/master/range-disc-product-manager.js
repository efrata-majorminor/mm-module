'use strict';

// external deps 
var ObjectId = require('mongodb').ObjectId;

// internal deps
require('mongodb-toolkit');
var BaseManager = require('module-toolkit').BaseManager;
var MmModels = require('mm-models');
var RangeDiscProduct = MmModels.master.RangeDiscProduct;
var map = MmModels.map;

module.exports = class RangeDiscProductManager extends BaseManager{
    constructor(db, user){
        super(db, user);
        this.collection = this.db.use(map.master.RangeDiscProduct);
    }

    _getQuery(paging) {
        
        // basic filter -> soft delete = false, paging.filter -> in case the search is {}, keywordFilter -> filter by code or name
        var basicFilter = {
            _deleted: false
        }, keywordFilter = {}; // soft delete, hard delete is prohibited for the sake of history

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
            // regex = regular expression used for searching pattern
            // i = ignore case -> refer to mdn

            keywordFilter = {
                '$or': [filterCode, filterName] // OR mongodb
            };
        }
        query = { '$and': [basicFilter, paging.filter, keywordFilter] }; // AND mongodb
        // paging.filter does not mean filter function, but filter attribute
        return query;
    }

    _validate(rangeDiscProduct) {
        var errors = {};
        return new Promise((resolve, reject) => {
            var valid = new RangeDiscProduct(rangeDiscProduct);
            // creating instance of Range Disc Product
            var getRangeDiscProduct = this.collection.singleOrDefault({
                "$and": [{
                    _id: {
                        '$ne': new ObjectId(valid._id)
                    }
                }, {
                    code: valid.code
                }]
            });
            
            // validate range discount product using Promise.all
            Promise.all([getRangeDiscProduct])
                .then(results => {
                    var _rangeDiscProduct = results[0];

                    if (!valid.code || valid.code == '') {
                        errors["code"] = "Masukkan kode";
                    } else if (_rangeDiscProduct) {
                        errors["code"] = "Kode sudah ada";
                    }
                    if (!valid.name || valid.name == '')
                        errors["name"] = "Masukkan nama";
                    if (!valid.discFrom || valid.discFrom == null)
                        errors["discFrom"] = "Masukkan diskon dari";
                    if (!valid.discTo || valid.discTo == null) {
                        errors["discTo"] = "Masukkan diskon sampai";
                    } else if (valid.discTo <= valid.discFrom) {
                        errors["discTo"] = "Diskon sampai harus lebih kecil dari diskon dari";
                    }      

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
}