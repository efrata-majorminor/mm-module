"use strict";
var helper = require("./../../helper");
var BaseManager = require('module-toolkit').BaseManager;
var MmModels = require('mm-models');
var map = MmModels.map;
var ItemManager = require("../../../src/managers/master/item-manager");
var FinishGoodManager = require("../../../src/managers/master/finished-goods-manager");
var InventoryManager = require("../../../src/managers/inventory/inventory-manager");

class ReportManagerDataUtil extends BaseManager {

    getExpeditionData(data) {
        return new Promise((resolve, reject) => {
            helper.getDb()
                .then(db => {
                    data(db)
                        .then(result => {
                            resolve();
                        })
                        .catch(e => {
                            reject(e);
                        });
                })
                .catch(e => {
                    reject(e);
                });
        });
    }

    getInventoryData(data) {
        return new Promise((resolve, reject) => {
            helper.getDb()
                .then(db => {
                    this.db = db;
                    this.collection = this.db.use(map.master.Item);
                    data(db)
                        .then(result => {
                            var finishGoodManager = new FinishGoodManager(db, 'unit-test');
                            var itemManager = new ItemManager(db, 'unit-test');
                            var inventoryManager = new InventoryManager(db, 'unit-test');
                            var Inventory = require('mm-models').inventory.Inventory;
                            var storage = result.storages["UT-ST1"];
                            var item = result.items["UT-AV2"];
                            var quantity = 10;
                            var FinishedItem = require('mm-models').master.FinishedGoods;
                            var finishedItem = null;

                            inventoryManager.getByStorageIdAndItemId(storage._id, result._id)
                                .then(inventoryData => {

                                    if (!item.article) {
                                        finishedItem = new FinishedItem(item);
                                        finishedItem.article = {
                                            "realizationOrder": "G78564343"
                                        };
                                    } else {
                                        finishedItem = item;
                                    }

                                    if (inventoryData && inventoryData.item.article) {
                                        resolve(inventoryData);
                                    } else if (inventoryData) {
                                        itemManager.update(finishedItem)
                                            .then(id => {
                                                this.getSingleById(id)
                                                    .then(resultItem => {
                                                        inventoryData.storageId = storage._id;
                                                        inventoryData.storage = storage;
                                                        inventoryData.itemId = resultItem._id;
                                                        inventoryData.item = resultItem;
                                                        inventoryData.quantity = quantity;

                                                        inventoryManager.update(inventoryData)
                                                            .then(id => {
                                                                inventoryManager.getSingleById(id)
                                                                    .then(inventoryData => {
                                                                        resolve(inventoryData);
                                                                    }).catch(e => {
                                                                        reject(e);
                                                                    });
                                                            });
                                                    })
                                                    .catch(e => {
                                                        reject(e);
                                                    });
                                            })
                                            .catch(e => {
                                                reject(e);
                                            });
                                    } else {
                                        itemManager.update(finishedItem)
                                            .then(id => {
                                                this.getSingleById(id)
                                                    .then(resultItem => {
                                                        var inventory = new Inventory();
                                                        inventory.storageId = storage._id;
                                                        inventory.storage = storage;
                                                        inventory.itemId = resultItem._id;
                                                        inventory.item = resultItem;
                                                        inventory.quantity = quantity;

                                                        inventoryManager.create(inventory)
                                                            .then(id => {
                                                                inventoryManager.getSingleById(id)
                                                                    .then(inventoryData => {
                                                                        resolve(inventoryData);
                                                                    }).catch(e => {
                                                                        reject(e);
                                                                    });
                                                            });
                                                    })
                                                    .catch(e => {
                                                        reject(e);
                                                    });
                                            })
                                            .catch(e => {
                                                reject(e);
                                            });
                                    }
                                })
                                .catch(e => {
                                    reject(e);
                                });
                        }).catch(e => {
                            reject(e);
                        });
                }).catch(e => {
                    reject(e);
                });
        });
    }
}
module.exports = new ReportManagerDataUtil();