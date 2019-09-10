'use strict';

// external deps 
var ObjectId = require('mongodb').ObjectId;

// internal deps
require('mongodb-toolkit');
var BaseManager = require('module-toolkit').BaseManager;
var MmModels = require('mm-models');
var map = MmModels.map;

var AdjustmentDoc = MmModels.inventory.AdjusmentDoc;
var generateCode = require('../../utils/code-generator');

const moduleId = "MM-ADJ/INT";
module.exports = class AdjustmentStockManager extends BaseManager {
    constructor(db, user) {
        super(db, user);
        this.collection = this.db.use(map.inventory.AdjustmentDoc);
        var StorageManager = require('../master/storage-manager');
        this.storageManager = new StorageManager(db, user);

        var InventoryManager = require('./inventory-manager');
        this.inventoryManager = new InventoryManager(db, user);

        var TransferOutDocManager = require('./transfer-out-doc-manager');
        this.transferOutDocManager = new TransferOutDocManager(db, user);

        var TransferInDocManager = require('./transfer-in-doc-manager');
        this.transferInDocManager = new TransferInDocManager(db, user);

        var ModuleManager = require('../master/module-manager');
        this.moduleManager = new ModuleManager(db, user);

        var FinishedGoodManager = require('../master/finished-goods-manager');
        this.finishedGoodManager = new FinishedGoodManager(db, user);
    }

    _getQuery(paging) {
        var deletedFilter = {
            _deleted: false,
            _active:true
        }, keywordFilter = {};
        var regex1 = new RegExp("", "i");
        var filterAdj={
            'code': {
                '$regex': /MM-ADJ/
            }
        }
        var query = {};
        if (paging.keyword) {
            var regex = new RegExp(paging.keyword, "i");
            var filterCode = {
                'code': {
                    '$regex': regex
                }
            };
            var filterStorage = {
                'storage.name': {
                    '$regex': regex
                }
            };
            keywordFilter = {
                '$or': [filterCode, filterStorage]
            };
        }
        query = { '$and': [deletedFilter, paging.filter, keywordFilter, filterAdj] }
        return query;
    }

    create(adjusmentDoc) {
        return new Promise((resolve, reject) => {
            var itemIn = [];
            var itemOut = [];
            var length=0;
            if(adjusmentDoc.items){
                length = adjusmentDoc.items.length;
            }
            for (var i = 0; i < length; i++) {
                var item = adjusmentDoc.items[i];
                if (item.inQty != 0 && item.outQty == 0) {
                    item.quantity = item.inQty;
                    itemIn.push(item);
                } else if (item.inQty == 0 && item.outQty != 0) {
                    item.quantity = item.outQty;
                    itemOut.push(item);
                }
            }
            this._validate(adjusmentDoc)
                .then(validAdjusmentDoc => {
                    var transferStok = [];
                    validAdjusmentDoc.code = generateCode(moduleId);
                    validAdjusmentDoc._createdDate = new Date();
                    validAdjusmentDoc._active=true;
                    transferStok.push(this.collection.insert(validAdjusmentDoc));

                    var transferOutDoc = {};
                    if (itemOut.length > 0) {
                        transferOutDoc.code = generateCode("MM-KB/ADJ");
                        transferOutDoc.destination = validAdjusmentDoc.storage;
                        transferOutDoc.destinationId = validAdjusmentDoc.storageId;
                        transferOutDoc.items = itemOut;
                        transferOutDoc.reference = validAdjusmentDoc.code;
                        transferOutDoc.source = validAdjusmentDoc.storage;
                        transferOutDoc.sourceId = validAdjusmentDoc.storageId;
                        transferOutDoc._active=true;
                        transferStok.push(this.transferOutDocManager.create(transferOutDoc));
                    }

                    var transferinDoc = {};
                    if (itemIn.length > 0) {
                        transferinDoc.code = generateCode("MM-TB/ADJ");
                        transferinDoc.source = validAdjusmentDoc.storage;
                        transferinDoc.sourceId = validAdjusmentDoc.storageId;
                        transferinDoc.destination = validAdjusmentDoc.storage;
                        transferinDoc.destinationId = validAdjusmentDoc.storageId;
                        transferinDoc.items = itemIn;
                        transferinDoc.reference = validAdjusmentDoc.code;
                        transferinDoc._active=true;
                        transferStok.push(this.transferInDocManager.create(transferinDoc));
                    }

                    Promise.all(transferStok)
                        .then(id => {
                            resolve(id[0]);
                        })
                        .catch(e => {
                            reject(e);
                        })
                })
                .catch(e => {
                    reject(e);
                })
        })
    }

    _validate(adjustmentDoc) {
        var errors = {};
        return new Promise((resolve, reject) => {
            var valid = adjustmentDoc;

            var getItem = [];
            var getInventory=[];
            if (valid.items && valid.items.length > 0) {
                for (var item of valid.items) {
                   // getInventory.push(this.inventoryManager.getByStorageIdAndItemIdOrDefault(valid.sourceId, item.itemId));
                    getItem.push(this.finishedGoodManager.getSingleById(item.itemId));
                }
            }
            else {
                errors["items"] = "items is required";
            }

            if (valid.source) {
                valid.storage = valid.source;
            }
            if (valid.source) {
                valid.storageId = valid.source._id;
            }

            Promise.all([].concat(getItem))
                .then(results => {
                    var index = 0;
                    var inventoryQuantity = 0;
                    var items = results.slice(0, results.length);
                    var itemErrors = [];
                    if (items.length > 0) {
                        for (var item of valid.items) {
                            var itemError = {};
                            
                                item.qtyBeforeAdjustment = item.availableQuantity;
                                item.item = items[index];
                                if (item.inQty != 0 && item.outQty == 0) {
                                    item.qtyAdjustment = item.inQty;
                                    item.type = "IN";
                                    
                                } else if (item.inQty == 0 && item.outQty != 0) {
                                    item.qtyAdjustment = item.outQty;
                                    item.type = "OUT";
                                }
                            
                            index++;
                            if (item.remarks == "" || !item.remarks) {
                                itemError["remarks"] = "remarks harus diisi";
                            } else {
                                item.remark = item.remarks;
                            }
                            if (item.inQty == 0 && item.outQty == 0) {
                                itemError["inQty"] = "setidaknya IN atau OUT terisi dengan QTY";
                                itemError["outQty"] = "setidaknya IN atau OUT terisi dengan QTY";
                            }
                            if(item.inQty > 0 && item.outQty > 0){
                                itemError["code"] = "tidak diperbolehkan melakukan stok masuk dan keluar secara bersamaan";
                            }
                            else if(item.qtyBeforeAdjustment==0 && item.outQty > 0){
                                itemError["code"] = "stok tidak tersedia";
                            }
                            itemErrors.push(itemError);
                        }
                    }
                    for (var itemError of itemErrors) {
                        for (var prop in itemError) {
                            errors.items = itemErrors;
                            break;
                        }
                        if (errors.items)
                            break;
                    }
                    for (var prop in errors) {
                        var ValidationError = require('module-toolkit').ValidationError;
                        reject(new ValidationError('data does not pass validation', errors));
                    }
                    valid = new AdjustmentDoc(valid);
                    valid.stamp(this.user.username, 'manager');
                    resolve(valid);
                }).catch(e => {
                    reject(e);
                });

        });
    }
getReportAdjustment(storageId){
 return new Promise((resolve, reject) => {
            var query={};
            if(storageId && storageId!==""){
                query = {
                storageId: new ObjectId(storageId),
               
                _deleted: false
            };
            }
            else{
                query = {
               
                _deleted: false
            };
            }
            
            this.collection.find(query).toArray()
                .then(inventory => {
                    resolve(inventory);
                })
                .catch(e => {
                    reject(e);
                });
       });
}
};