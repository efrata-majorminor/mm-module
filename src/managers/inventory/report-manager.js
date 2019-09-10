'use strict';

var ObjectId = require('mongodb').ObjectId;
var MmModels = require('mm-models');
var InventoryManager = require('./inventory-manager');
var ExpeditionManager = null;
var map = MmModels.map;

var SalesManager = require('../sales/sales-manager');


module.exports = class ReportManager extends InventoryManager {
    constructor(db, user) {
        super(db, user);
        this.expeditionDocCollection = this.db.use(map.inventory.ExpeditionDoc);
        this.salesCollection = this.db.use(map.sales.SalesDoc);
    }

    getReportItemsByRealizationOrder(realizationOrder) {
        return new Promise((resolve, reject) => {
            var items = this._getItemsFromInventoryByRealizationOrder(realizationOrder);
            var latestDate = this._getLatestdateFromExpeditionByRealizationOrder(realizationOrder);
            var sales = this._getItemsSalesFromSalesDocByRealizationOrder(realizationOrder);

            Promise.all([items, latestDate, sales]).then(results => {
                var dataItems = results[0].map((dataItem) => {
                    var item = {};
                    var storeName = dataItem._id.storage;
                    var itemSize = dataItem._id.size;
                    var quantityOnInventory = dataItem.quantity;
                    var quantityOnSales = 0;

                    item['storageName'] = storeName;

                    if (results[1]) {
                        var today = new Date();
                        item['age'] = this._getDifferenceDate(results[1], today);
                    }

                    if (results[2]) {
                        for (var sales of results[2]) {
                            if (sales._id.storage === storeName && sales._id.size === itemSize) {
                                quantityOnSales = sales.quantity;
                            }
                        }
                    }

                    var itemDetail = {
                        'size': itemSize,
                        'quantityOnInventory': quantityOnInventory,
                        'quantityOnSales': quantityOnSales
                    }

                    item['itemDetail'] = itemDetail;

                    return item;
                });
                resolve([].concat.apply([], dataItems));
            }).catch((error) => {
                reject(error);
            });
        });
    }

    _getDifferenceDate(dateFrom, dateTo) {
        var _MS_PER_DAY = 1000 * 60 * 60 * 24;

        var utc1 = Date.UTC(dateFrom.getFullYear(), dateFrom.getMonth(), dateFrom.getDate());
        var utc2 = Date.UTC(dateTo.getFullYear(), dateTo.getMonth(), dateTo.getDate());

        return Math.abs(Math.floor((utc2 - utc1) / _MS_PER_DAY));
    }

    _getLatestdateFromExpeditionByRealizationOrder(realizationOrder) {
        return new Promise((resolve, reject) => {
            this.expeditionDocCollection
                .find({ 'spkDocuments.items.item.article.realizationOrder': realizationOrder })
                .sort({ "_createdDate": 1 })
                .limit(1)
                .toArray()
                .then((expeditionDates) => {
                    if (expeditionDates[0]) {
                        resolve(expeditionDates[0]._createdDate);
                    } else {
                        resolve(new Date());
                    }
                }).catch((error) => {
                    reject(error);
                })
        });
    }

    //Group by store location
    _getItemsSalesFromSalesDocByRealizationOrder(realizationOrder) {
        var aggregate = [
            { $unwind: '$items' },
            {
                $match: {
                    $and: [{ "_deleted": false }, { 'items.item.article.realizationOrder': realizationOrder }]
                }
            },
            {
                $group:
                {
                    _id: { storage: '$store.storage.name', size: '$items.item.size' },
                    quantity: { $sum: '$items.quantity' }
                }
            },
            {
                $sort: { '_id.size': 1 }
            }
        ];

        return new Promise((resolve, reject) => {
            this.salesCollection.aggregate(aggregate)
                .toArray((err, result) => {
                    resolve(result);
                });
        });
    }

    //Group by store location
    _getItemsFromInventoryByRealizationOrder(realizationOrder) {
        var aggregate = [
            {
                $match: {
                    $and: [{ "_deleted": false }, { 'item.article.realizationOrder': realizationOrder }]
                }
            },
            {
                $group:
                {
                    _id: { storage: '$storage.name', size: '$item.size' },
                    quantity: { $sum: '$quantity' }
                }
            },
            {

                $sort: { "_id.size": 1 }
            }
        ];

        return new Promise((resolve, reject) => {
            this.collection.aggregate(aggregate)
                .toArray((err, result) => {
                    resolve(result);
                });
        });
    }
}