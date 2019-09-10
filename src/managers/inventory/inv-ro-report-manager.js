'use strict'

var ObjectId = require('mongodb').ObjectId;
var BaseManager = require('module-toolkit').BaseManager;
var MmModels = require('mm-models');
var map = MmModels.map;

module.exports = class InventoryROReportManager extends BaseManager {

    constructor(db, user) {
        super(db, user);
        this.collection = this.db.use(map.inventory.Inventory);
    }

    getROItem(codeRO) {
        var aggregate = [
            {
                $match: { 
                    $and: [{"_deleted": false}, {'item.article.realizationOrder':codeRO}]
                }
            },
            {
                $group:
                {
                    _id: '$storage.name',
                    items: { $push: { 'itemcode': '$item.code', 'storagename': '$storage.name', 'quantity': '$quantity', 'item': '$item.size' } }
                }
            },
            {
                $sort: { "item": 1 }
            }
        ]

        return new Promise((resolve, reject) => {
            this.collection.aggregate(aggregate)
                            .toArray((err, result) =>{
                                resolve(result);
                            });
        });
    }
}