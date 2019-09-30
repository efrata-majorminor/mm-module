'use strict';

    // external deps 
    var ObjectId = require('mongodb').ObjectId;

    // internal deps
    require('mongodb-toolkit');
    var lodash_ = require('lodash'); // _ is already used by underscore.js
    var MmModels = require('mm-models');
    var map = MmModels.map;
    var BaseManager = require('module-toolkit').BaseManager;
    var Storage = MmModels.master.storage
    var dateFormat = require('dateformat');

    module.exports = class StockAvailabilityManager extends BaseManager {

        constructor(db, user) {
            super(db, user);
            this.collection = this.db.use(map.inventory.Inventory);
            this.storageCollection = this.db.use(map.master.Storage);
            this.storeCollection = this.db.use(map.master.Store);
            this.invMovementCollection = this.db.use(map.inventory.InventoryMovement);
        }

        // _validate(storageId) {
        //     var errors = {};
        //     return new Promise((resolve, reject) => {
        //         var id;
        //         storageId != "" ? id = new ObjectId(storageId) : id = storageId;
        //         if (storageId == "") {
        //             errors["codeStorage"] = "Kode storage yang anda cari tidak dapat ditemukan";
        //             resolve(errors.codeStorage);
        //         }
        //         else {
        //             var getStorage = this.storageCollection.find({ _id: id })
        //                 .toArray((err, result) => {
        //                     var _storage = result[0];
        //                     resolve(_storage._id);
        //                 });
        //         }
        //     });
        // }

        getStorageStock(storageId) {
            // return new Promise((resolve, reject) => {
            //     this._validate(storageId)
            //         .then(validStorageId => {
            //             if (typeof validStorageId == "string") {
            //                 resolve(result);
            //             }
            //             else {
            //                 let id = validStorageId
            //                 var find = { "storage._id": id };
            //                 var sort = { quantity: 1 };
            //                 this.collection.find(find).sort(sort)
            //                     .toArray((err, result) => {
            //                         resolve(result);
            //                     });
            //             }
            //         })  
            // });
            return new Promise((resolve, reject) => {
                let id = new ObjectId(storageId);
                var find = { "storage._id": id, _deleted: false };
                var sort = { quantity: 1 };
                this.collection.find(find).sort(sort)
                    .toArray((err, result) => {
                        if (err)
                            reject(err);
                        else
                            resolve(result);
                    })
            });
        }

        getNearestStock(inventoryId) {
            let id = new ObjectId(inventoryId);
            let inventory = new Promise((resolve, reject) => {
                this.collection.find({ _id: id, _deleted: false })
                    .toArray((err, result) => {
                        if (err)
                            reject(err);
                        else
                            resolve(result);
                    });
            });
            let inventoryDb = new Promise((resolve, reject) => {
                inventory.then(result => {
                    this.collection.find({ "item.code": result[0].item.code })
                        .toArray((err, result) => {
                        if (err)
                            reject(err);
                        else
                            resolve(result);
                        })
                })
            });
            let storeDb = new Promise((resolve, reject) => {
                this.storeCollection.find({ _deleted: false })
                    .toArray((err, result) => {
                        if (err)
                            reject(err);
                        else
                            resolve(result);
                    });
            });
            let invMovementDb = new Promise((resolve, reject) => {
                this.invMovementCollection.find({ _deleted: false })
                    .toArray((err, result) => {
                        if (err)
                            reject(err);
                        else
                            resolve(result);
                    });
            });
            return new Promise((resolve, reject) => {
                Promise.all([inventoryDb, storeDb, invMovementDb])
                    .then(result => {
                        let inventoryArray = result[0];
                        let storeArray = result[1];
                        let invMovementArray = result[2];
                        let data = [];
                        for (let inventory of inventoryArray) {
                            let dates = [];
                            for (let store of storeArray) {
                                if (inventory.storage.code === store.storage.code) {
                                    inventory.city = store.city;
                                }
                            }
                            for (let invMovement of invMovementArray) {
                                if (inventory.storage.code === invMovement.storage.code &&
                                    invMovement.type === "IN") {
                                    dates.push(invMovement._createdDate);
                                }
                            }
                            let latestDateFormatted = dateFormat(new Date(Math.max.apply(null, dates)), "mm/dd/yyyy");
                            inventory.latestDate = latestDateFormatted;
                            data.push(inventory);
                        }
                        let thisInventory = lodash_.find(data, { _id: id });
                        let sameCityInventory = lodash_.filter(data, { city: thisInventory.city });
                        lodash_.remove(data, { city: thisInventory.city });
                        sameCityInventory = lodash_.orderBy(sameCityInventory, 'quantity', 'desc');
                        data = lodash_.orderBy(data, 'quantity', 'desc');
                        for (let inventory of data) {
                            sameCityInventory.push(inventory);
                        }
                        lodash_.remove(sameCityInventory, { _id: id });
                        resolve(sameCityInventory);
                    })
                    .catch(e => {
                        reject(e);
                    });
            });

            // MONGODB STYLE, BUT $LOOKUP IS BAD FOR PERFORMANCE

            // var aggregate = [
            //     {$match: {"item.code": itemCode}},
            //     {$lookup: {
            //         from: "stores",
            //         localField: "storage.code",
            //         foreignField: "storage.code",
            //         as: "inventory-stores"
            //         }
            //     },
            //     {$lookup: {
            //         from: "inventory-movements",
            //         localField: "storage.code",
            //         foreignField: "storage.code",
            //         as: "inventory-inventory-movements"
            //         }
            //     },
            //     {$match: {
            //         "inventory-inventory-movements.type" : "IN"
            //     }}
            // ]

            // return new Promise((resolve, reject) => {
            //     this.collection.aggregate(aggregate)
            //         .toArray((err, result) => {
            //             resolve(result);
            //         });
            // });
        }

    }