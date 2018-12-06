'use strict';

// external deps 
var ObjectId = require('mongodb').ObjectId;
require('mongodb-toolkit');
var BaseManager = require('module-toolkit').BaseManager;
var BateeqModels = require('bateeq-models');
var map = BateeqModels.map;
var generateCode = require('../../utils/code-generator');
var moment = require('moment');
var moduleId = "opname-balance";

module.exports = class StockOpnameBalanceManager extends BaseManager {
    constructor(db, user) {
        super(db, user);
        this.collection = this.db.use(map.inventory.StockOpnameBalance)
    }

    create(stockOpnameBalance) {
        return new Promise((resolve, reject) => {

            this.collection.insert(stockOpnameBalance)
                .then((result) => {
                    resolve(result);
                })
                .catch((error) => {
                    reject(error);
                });
        });
    }

    update(stockOpnameBalance) {
        return new Promise((resolve, reject) => {

            this.collection.update(stockOpnameBalance)
                .then((result) => {
                    resolve(result);
                })
                .catch((error) => {
                    reject(error);
                });
        });
    }

    getByStorageCode(storeCode, productCode) {
        return new Promise((resolve, reject) => {

            var query = {
                'storage.code': storeCode,
                'product.code': productCode,
                '_deleted': false
            };

            this.collection.singleOrDefault(query)
                .then((result) => {
                    resolve(result);
                })
                .catch((error) => {
                    reject(error);
                });
        });


    }

    getBalanceByStorageCode(storageCode) {
        return new Promise((resolve, reject) => {

            var query = {
                'storage.code' : storageCode
            };

            this.collection.find(query).toArray()
            .then(result => {
                resolve(result);
            })
            .catch(error => {
                reject(error);
            });
        });
    }

    _getQuery(paging) {
        var _default = {
            _deleted: false
        },
            pagingFilter = paging.filter || {},
            keywordFilter = {},
            query = {};

        if (paging.keyword) {
            var regex = new RegExp(paging.keyword, "i");
            var createdAgentFilter = {
                "_createAgent": {
                    "$regex": regex
                }
            };
            var codeFilter = {
                "code": {
                    "$regex": regex
                }
            };
            var storageFilter = {
                "storage.name": {
                    "$regex": regex
                }
            };
            var stockOpnameDocCodeFilter = {
                "stockOpnameDocCodes": {
                    "$regex": regex
                }
            }

            keywordFilter["$or"] = [createdAgentFilter, codeFilter, storageFilter, stockOpnameDocCodeFilter];
        }
        query["$and"] = [_default, keywordFilter, pagingFilter];
        return query;
    }

    read(paging) {
        var _paging = Object.assign({
            page: 1,
            size: 20,
            order: {},
            filter: {},
            select: ["code", "storage.name", "products"]
        }, paging);
        var query = this._getQuery(_paging);

        return this.collection
            .where(query)
            .select(_paging.select)
            .page(_paging.page, _paging.size)
            .order(_paging.order)
            .execute();
    }
}