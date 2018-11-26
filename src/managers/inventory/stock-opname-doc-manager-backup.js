'use strict';

// external deps 
var ObjectId = require('mongodb').ObjectId;
require('mongodb-toolkit');
var BaseManager = require('module-toolkit').BaseManager;
var BateeqModels = require('bateeq-models');
var map = BateeqModels.map;
var generateCode = require('../../utils/code-generator');

var SODoc = BateeqModels.inventory.StockOpnameDoc;
var SODocItem = BateeqModels.inventory.StockOpnameDocItem;
var TransInDoc = BateeqModels.inventory.TransferInDoc;
var TransInItem = BateeqModels.inventory.TransferInItem;
var TransOutDoc = BateeqModels.inventory.TransferOutDoc;
var TransOutItem = BateeqModels.inventory.TransferOutItem;

var StockOpnameBalance = BateeqModels.inventory.StockOpnameBalance;
var OpnameProduct = BateeqModels.inventory.StockOpnameProductRecord;
var BalanceOpnameHistory = BateeqModels.inventory.StockOpnameBalanceHistory;
var moment = require('moment');

var moduleId = "EFR-SO/INT";

module.exports = class StockOpnameDocManager extends BaseManager {
    constructor(db, user) {
        super(db, user);
        this.collection = this.db.use(map.inventory.StockOpnameDoc);
        var StorageManager = require('../master/storage-manager');
        this.storageManager = new StorageManager(db, user);

        var ItemManager = require('../master/item-manager');
        this.itemManager = new ItemManager(db, user);

        var TransInManager = require('./transfer-in-doc-manager');
        this.transInManager = new TransInManager(db, user);

        var TransOutManager = require('./transfer-out-doc-manager');
        this.transOutManager = new TransOutManager(db, user);

        var InventoryManager = require('./inventory-manager');
        this.inventoryManager = new InventoryManager(db, user);

        var StockOpnameBalanceManager = require('./stock-opname-balance-manager');
        this.stockOpnameBalanceManager = new StockOpnameBalanceManager(db, user);

        var StockOpnameBalanceHistoryManager = require('./stock-opname-balance-history-manager');
        this.stockOpnameBalanceHistoryManager = new StockOpnameBalanceHistoryManager(db, user);

        const EventEmitter = require('../../utils/event-messaging');
        this.event = new EventEmitter();
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
            keywordFilter["$or"] = [createdAgentFilter, codeFilter, storageFilter];
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
            select: ["code", "_createdBy", "_createdDate", "storage.name", "isProcessed"]
        }, paging);
        var query = this._getQuery(_paging);
        return this.collection
            .where(query)
            .select(_paging.select)
            .page(_paging.page, _paging.size)
            .order(_paging.order)
            .execute();
    }

    create(valid) {
        return new Promise((resolve, reject) => {
            var dataFile = valid.dataFile ? valid.dataFile : [];
            var errors = {};
            var data = [];
            var dataItem = [];
            var storageData = valid.storageId && ObjectId.isValid(valid.storageId) ? this.storageManager.getSingleByIdOrDefault(new ObjectId(valid.storageId)) : Promise.resolve(null);

            for (var a = 1; a < dataFile.length; a++) {
                data.push({ "code": dataFile[a][0], "name": dataFile[a][1], "qty": dataFile[a][2] });
            }

            if (data.length > 0) {
                var valueArr = data.map(function (item) { return item.code.toString() });
                var itemDuplicateErrors = new Array(valueArr.length);
                valueArr.some(function (item, idx) {
                    var index = valueArr.indexOf(item);
                    var itemError = {
                        "code": valueArr[idx],
                        "error": ""
                    };
                    if (index < idx) {
                        itemError.error = "Barcode sudah ada";
                    }
                    itemDuplicateErrors[idx] = itemError;
                });
                for (var a = 0; a < data.length; a++) {
                    if (itemDuplicateErrors[a]["error"] === "" && itemDuplicateErrors[a]["code"] !== "")
                        dataItem.push(this.itemManager.getSingleByQueryOrDefault({ "code": itemDuplicateErrors[a]["code"] }));
                }
            }

            if (dataItem.length === 0) {
                dataItem.push(Promise.resolve(null));
            }

            var dataItemPromise = Promise.all(dataItem);
            Promise.all([storageData, dataItemPromise])
                .then(results => {
                    var _storage = results[0];
                    var items = results[1];
                    var dataError = [];
                    var newDate = new Date();

                    for (var a = 0; a < data.length; a++) {
                        var Error = "";
                        if (data[a]["code"] === "" || data[a]["name"] === "" || data[a]["qty"] === "")
                            Error = Error + "Lengkapi data";
                        if (data[a]["code"] !== "") {
                            if (itemDuplicateErrors[a]["error"] !== "")
                                Error = Error + itemDuplicateErrors[a]["error"];
                            function searchItem(params) {
                                return params ? params.code === data[a]["code"] : null;
                            }
                            var item = items.find(searchItem);
                            if (!item) {
                                if (Error === "")
                                    Error = Error + "Produk tidak ada di master";
                                else
                                    Error = Error + ", Produk tidak ada di master";
                            }
                        }
                        if (data[a]["qty"] !== "") {
                            if (isNaN(data[a]["qty"])) {
                                if (Error === "")
                                    Error = Error + "Kuantitas harus numerik";
                                else
                                    Error = Error + ", Kuantitas harus numerik";
                            }
                        }
                        if (Error !== "") {
                            dataError.push({
                                "Barcode": data[a]["code"],
                                "Nama Barang": data[a]["name"],
                                "Kuantitas Stock": data[a]["qty"],
                                "Deskripsi Error": `Nomor Row ${(a + 2)}: ${Error}`
                            })
                        }
                    }

                    if (!valid.storageId || valid.storageId.toString() === "")
                        errors["storage"] = "storage harus diisi";
                    else if (!_storage)
                        errors["storage"] = "storage tidak ditemukan";
                    if (data.length === 0)
                        errors["file"] = "data CSV harus dipilih"

                    for (var prop in errors) {
                        var ValidationError = require('module-toolkit').ValidationError;
                        reject(new ValidationError('data does not pass validation', errors));
                    }

                    if (dataError.length === 0) {
                        var itemsData = [];
                        var itemsIndex = 0;
                        var lastItem = 0;
                        var resultOfData = [];

                        for (var a of data) {

                            function searchItem(params) {
                                return params.code === a.code;
                            }

                            var item = items.find(searchItem);
                            var itemSO = new SODocItem({
                                itemId: (new ObjectId(item._id)),
                                item: item,
                                qtySO: Number(a.qty),
                                _createdDate: newDate,
                                _active: true
                            });

                            itemSO.stamp(this.user.username, 'manager');
                            itemsData.push(itemSO);
                            itemsIndex++;
                            lastItem++;

                            if (itemsIndex == 1000 || lastItem == data.length) {

                                var SO = new SODoc({
                                    code: generateCode(moduleId),
                                    storageId: new ObjectId(_storage._id),
                                    storage: _storage,
                                    items: itemsData,
                                    isProcess: false,
                                    _createdDate: newDate,
                                    _active: true
                                });

                                SO.stamp(this.user.username, 'manager');
                                resultOfData.push(SO);
                                itemsData = [];
                                itemsIndex = 0;
                            }
                        }

                        this.collection.insertMany(resultOfData)
                            .then(id => {
                                if (id.ops.length > 0) {
                                    var stockOpnames = []

                                    id.ops.forEach(stockOpname => {
                                        stockOpnames.push(stockOpname);
                                    });

                                    var eventParameter = {
                                        stockOpname: stockOpnames,
                                        stockOpnameBalanceManager: this.stockOpnameBalanceManager,
                                        stockOpnameBalanceHistoryManager: this.stockOpnameBalanceHistoryManager
                                    };

                                    this.event.sendEvent("addSaldo", this.stockOpnameBalance);
                                    this.event.emitEvent(eventParameter);
                                }
                                resolve(id);
                            })
                            .catch(e => {
                                reject(e);
                            });
                    } else {
                        var errorResult = {
                            code: 409,
                            message: "Data item or product not pas validation",
                            errors: dataError
                        };
                        resolve(errorResult);
                    }
                })
                .catch(e => {
                    reject(e);
                });
        });
    }

    stockOpnameBalance(eventParameter) {

        var stockOpname = eventParameter.stockOpname;

        if (stockOpname.length != undefined && stockOpname.length > 0) {

            return new Promise((resolve, reject) => {
                var stockOpnameBalance = {};
                var stockOpnameBalanceManager = eventParameter.stockOpnameBalanceManager;
                var hasOpnameBalance = false;

                stockOpname.forEach((stockOpname) => {

                    stockOpnameBalanceManager.getByStorageCode(stockOpname.storage.code)
                        .then((result) => {

                            // Check if has balance before
                            if (result != null) {

                                stockOpnameBalance = result;
                                stockOpnameBalance._updatedDate = moment(new Date).locale('id')._d;
                                hasOpnameBalance = true;
                            }
                            else {
                                stockOpnameBalance = new StockOpnameBalance({
                                    _createdDate: moment(new Date()).locale('id')._d,
                                    code: generateCode('opname-balance'),
                                    storage: {
                                        code: stockOpname.storage.code,
                                        name: stockOpname.storage.name
                                    }
                                });
                            }

                            // Set stock opname code
                            if (stockOpnameBalance.stockOpnameDocCodes.indexOf(stockOpname.code) == -1) {
                                stockOpnameBalance.stockOpnameDocCodes.push(stockOpname.code);
                            }

                            if (!hasOpnameBalance && stockOpnameBalance.products.length == 0) {

                                if (stockOpname.items.length > 0) {

                                    stockOpname.items.forEach((items) => {

                                        var opnameProduct = new OpnameProduct({
                                            productCode: items.item.code,
                                            productName: items.item.name,
                                            quantityOpname: items.qtySO,
                                        });

                                        stockOpnameBalance.products.push(opnameProduct);
                                    });
                                }
                            }
                            else {
                                stockOpnameBalance.products.forEach((product) => {

                                    stockOpname.items.forEach((items) => {

                                        var indexOfProduct = stockOpnameBalance.products.map((e) => { return e.productCode }).indexOf(items.item.code);

                                        if (indexOfProduct != -1) {

                                            if (items.qtySO > items.qtyBeforeSO) {
                                                product.quantityOpname = items.qtySO - items.qtyBeforeSO;
                                            }

                                            if (items.qtySO < items.qtyBeforeSO) {
                                                product.quantityOpname = items.qtyBeforeSO - items.qtySO;
                                            }
                                        }
                                        else {

                                            var opnameProduct = new OpnameProduct({
                                                productCode: items.item.code,
                                                productName: items.item.name,
                                                quantityOpname: items.qtySO,
                                            });

                                            stockOpnameBalance.products.push(opnameProduct);
                                        }
                                    });
                                });
                            }

                            return Promise.all([stockOpnameBalance])
                                .then((results) => {

                                    var result = results[0];

                                    if (!hasOpnameBalance) {

                                        return stockOpnameBalanceManager.create(result)
                                            .then((id) => {

                                                var stockOpnameBalanceHistoryManager = eventParameter.stockOpnameBalanceHistoryManager;
                                                var balanceOpnameHistory = new BalanceOpnameHistory({
                                                    stockOpnameBalanceCode: stockOpnameBalance.code,
                                                    statusBalance: 'Success',
                                                    remark: 'Create-Balance'
                                                });

                                                return stockOpnameBalanceHistoryManager.create(balanceOpnameHistory)
                                                    .then((history) => {
                                                        resolve(history);
                                                    });
                                            })
                                            .catch((error) => {

                                                var stockOpnameBalanceHistoryManager = eventParameter.stockOpnameBalanceHistoryManager;
                                                var balanceOpnameHistory = new BalanceOpnameHistory({
                                                    stockOpnameBalanceCode: stockOpnameBalance.code,
                                                    statusBalance: 'Failed',
                                                    remark: 'Create-Balance'
                                                });

                                                return stockOpnameBalanceHistoryManager.create(balanceOpnameHistory)
                                                    .then((history) => {
                                                        reject(error);
                                                    });

                                            });
                                    }
                                    else {

                                        return stockOpnameBalanceManager.update(result)
                                            .then((id) => {

                                                var stockOpnameBalanceHistoryManager = eventParameter.stockOpnameBalanceHistoryManager;
                                                var balanceOpnameHistory = new BalanceOpnameHistory({
                                                    stockOpnameBalanceCode: stockOpnameBalance.code,
                                                    statusBalance: 'Success',
                                                    remark: 'Update-Balance'
                                                });

                                                return stockOpnameBalanceHistoryManager.create(balanceOpnameHistory)
                                                    .then((history) => {
                                                        resolve(history);
                                                    });
                                            })
                                            .catch((error) => {

                                                var stockOpnameBalanceHistoryManager = eventParameter.stockOpnameBalanceHistoryManager;
                                                var balanceOpnameHistory = new BalanceOpnameHistory({
                                                    stockOpnameBalanceCode: stockOpnameBalance.code,
                                                    statusBalance: 'Failed',
                                                    remark: 'Update-Balance'
                                                });

                                                return stockOpnameBalanceHistoryManager.create(balanceOpnameHistory)
                                                    .then((history) => {
                                                        reject(error);
                                                    });
                                            });
                                    }
                                })
                                .catch((error) => {
                                    reject(error);
                                });
                        })
                        .catch((error) => {
                            reject(error);
                        });
                });
            });
        }
        else {
            var stockOpname = eventParameter.stockOpname;
            var stockOpnameBalaceManager = eventParameter.stockOpnameBalaceManager;

            return new Promise((resolve, reject) => {

                return stockOpnameBalaceManager.getByStorageCode(stockOpname.storage.code)
                    .then((result) => {
                        var stockOpnameBalance = result;
                        stockOpnameBalance._updatedDate = moment(new Date).locale('id')._d;

                        if (stockOpnameBalance) {

                            stockOpname.items.forEach((item) => {

                                stockOpnameBalance.products.forEach((productOnOpname) => {

                                    if (productOnOpname.productCode == item.item.code) {

                                        if (item.qtySO > item.qtyBeforeSO) {
                                            productOnOpname.quantityOpname = item.qtySO - item.qtyBeforeSO;
                                        }

                                        if (item.qtySO < item.qtyBeforeSO) {
                                            productOnOpname.quantityOpname = item.qtyBeforeSO - item.qtySO;
                                        }
                                    }
                                });

                            });

                            return Promise.all([stockOpnameBalance])
                                .then((result) => {
                                    var stockOpnameBalance = result[0];

                                    stockOpnameBalaceManager.update(stockOpnameBalance)
                                        .then((result) => {

                                            var stockOpnameBalanceHistoryManager = eventParameter.stockOpnameBalanceHistoryManager;
                                            var balanceOpnameHistory = new BalanceOpnameHistory({
                                                stockOpnameBalanceCode: stockOpnameBalance.code,
                                                statusBalance: 'Success',
                                                remark: 'Update-Balance'
                                            });

                                            return stockOpnameBalanceHistoryManager.create(balanceOpnameHistory)
                                                .then((history) => {

                                                    resolve(result);
                                                });
                                        })
                                        .catch((error) => {

                                            var stockOpnameBalanceHistoryManager = eventParameter.stockOpnameBalanceHistoryManager;
                                            var balanceOpnameHistory = new BalanceOpnameHistory({
                                                stockOpnameBalanceCode: stockOpnameBalance.code,
                                                statusBalance: 'Failed',
                                                remark: 'Update-Balance'
                                            });

                                            return stockOpnameBalanceHistoryManager.create(balanceOpnameHistory)
                                                .then((history) => {
                                                    reject(error);
                                                });
                                        });
                                })
                                .catch((error) => {
                                    reject(error);
                                });
                        }
                    })
                    .catch((error) => {
                        reject(error);
                    });
            });

        }
    }

    _validate(StockOpname) {
        return new Promise((resolve, reject) => {
            var errors = {};
            var valid = StockOpname;
            var storageData = valid.storageId && ObjectId.isValid(valid.storageId) ? this.storageManager.getSingleByIdOrDefault(new ObjectId(valid.storageId)) : Promise.resolve(null);
            var dataItems = [];
            for (var a of valid.items) {
                var item = a.itemId && ObjectId.isValid(a.itemId) ? this.itemManager.getSingleByIdOrDefault(new ObjectId(a.itemId)) : Promise.resolve(null);
                dataItems.push(item);
            }
            Promise.all([storageData].concat(dataItems))
                .then(results => {
                    var _storage = results[0];
                    var _dataItems = results.slice(1, results.length);
                    if (!valid.storageId || valid.storageId.toString() === "")
                        errors["storage"] = "storage harus diisi";
                    else if (!_storage)
                        errors["storage"] = "storage tidak ditemukan";

                    var errorItems = [];
                    var idx = 0;
                    for (var a of valid.items) {
                        var itemError = {};
                        function searchItem(params) {
                            return params.code === a.item.code;
                        }
                        var itemData = _dataItems.find(searchItem);
                        if (!a.itemId && a.itemId.toString() === "")
                            itemError["item"] = "item harus diisi";
                        if (!itemData)
                            itemError["item"] = "item tidak ditemukan";

                        if (a.isAdjusted && (a.remark === "" || !a.remark))
                            itemError["remark"] = "catatan harus diisi";

                        errorItems.push(itemError);
                        idx++;
                    }
                    for (var a of errorItems) {
                        if (Object.getOwnPropertyNames(a).length > 0) {
                            errors["items"] = errorItems;
                            break;
                        }
                    }

                    for (var prop in errors) {
                        var ValidationError = require('module-toolkit').ValidationError;
                        reject(new ValidationError('data does not pass validation', errors));
                    }

                    if (_storage) {
                        valid.storageId = new ObjectId(_storage._id);
                        valid.storage = _storage;
                    }

                    var items = [];
                    for (var a of valid.items) {
                        function searchItem(params) {
                            return params.code === a.item.code;
                        }
                        var itemData = _dataItems.find(searchItem);
                        a.itemId = new ObjectId(itemData._id);
                        a.item = itemData;
                        var SOItem = new SODocItem(a);
                        SOItem.stamp(this.user.username, 'manager');
                        items.push(SOItem);
                    }
                    valid.items = items;
                    valid.isProcessed = true;
                    valid = new SODoc(valid);
                    valid.stamp(this.user.username, 'manager');
                    resolve(valid);
                })
                .catch(e => {
                    reject(e);
                });
        });
    }

    _afterUpdate(id) {
        return new Promise((resolve, reject) => {
            this.collection.singleOrDefault({ "_id": new ObjectId(id) })
                .then(result => {
                    var dataIn = [];
                    var dataOut = [];
                    var newDate = new Date();
                    var eventParameter = {
                        stockOpname: result,
                        stockOpnameBalaceManager: this.stockOpnameBalanceManager,
                        stockOpnameBalanceHistoryManager: this.stockOpnameBalanceHistoryManager
                    }

                    this.event.sendEvent('update-balance', this.stockOpnameBalance);
                    this.event.emitEvent(eventParameter);

                    for (var a of result.items) {
                        if (a.isAdjusted) {
                            if (a.qtySO > a.qtyBeforeSO) {
                                var inTransItem = new TransInItem({
                                    itemId: new ObjectId(a.itemId),
                                    item: a.item,
                                    quantity: a.qtySO - a.qtyBeforeSO,
                                    remark: a.remark,
                                    _createdDate: newDate,
                                    _active: true
                                });
                                inTransItem.stamp(this.user.username, 'manager');
                                dataIn.push(inTransItem);
                            }
                            if (a.qtySO < a.qtyBeforeSO) {
                                var outTransItem = new TransOutItem({
                                    itemId: new ObjectId(a.itemId),
                                    item: a.item,
                                    quantity: a.qtyBeforeSO - a.qtySO,
                                    remark: a.remark,
                                    _createdDate: newDate,
                                    _active: true
                                });
                                outTransItem.stamp(this.user.username, 'manager');
                                dataOut.push(outTransItem);
                            }
                        }
                    }

                    if (dataIn.length > 0 || dataOut.length > 0) {
                        var inDoc = new TransInDoc();
                        var outDoc = new TransOutDoc();
                        if (dataIn.length > 0) {
                            inDoc.code = generateCode("EFR-TB/SO");
                            inDoc.source = result.storage;
                            inDoc.sourceId = new ObjectId(result.storageId);
                            inDoc.destination = result.storage;
                            inDoc.destinationId = new ObjectId(result.storageId);
                            inDoc.date = newDate;
                            inDoc.reference = result.code;
                            inDoc._createdDate = newDate;
                            inDoc.items = dataIn;
                            inDoc._active = true;
                            inDoc.stamp(this.user.username, 'manager');
                        }
                        if (dataOut.length > 0) {
                            outDoc.code = generateCode("EFR-KB/SO");
                            outDoc.source = result.storage;
                            outDoc.sourceId = new ObjectId(result.storageId);
                            outDoc.destination = result.storage;
                            outDoc.destinationId = new ObjectId(result.storageId);
                            outDoc.date = newDate;
                            outDoc.reference = result.code;
                            outDoc._createdDate = newDate;
                            outDoc.items = dataOut;
                            outDoc._active = true;
                            outDoc.stamp(this.user.username, 'manager');
                        }
                        if (dataIn.length > 0 && dataOut.length <= 0) {
                            this.transInManager.create(inDoc)
                                .then(idIn => {
                                    resolve(id);
                                })
                                .catch(e => {
                                    reject(e);
                                });
                        } else if (dataIn.length <= 0 && dataOut.length > 0) {
                            this.transOutManager.create(outDoc)
                                .then(idOut => {
                                    resolve(id);
                                })
                                .catch(e => {
                                    reject(e);
                                });
                        } else {
                            this.transInManager.create(inDoc)
                                .then(idIn => {
                                    this.transOutManager.create(outDoc)
                                        .then(idOut => {
                                            resolve(id);
                                        })
                                        .catch(e => {
                                            reject(e);
                                        });
                                })
                                .catch(e => {
                                    reject(e);
                                });
                        }
                    } else {
                        resolve(id);
                    }
                })
                .catch(e => {
                    reject(e);
                });
        });
    }

    getAllItemInInventoryBySOId(id) {
        return new Promise((resolve, reject) => {
            this.collection.singleOrDefault({ "_id": new ObjectId(id) })
                .then(result => {
                    var dataInventory = [];
                    for (var a of result.items) {
                        var query = this.inventoryManager.getByStorageIdAndItemIdOrDefault(result.storageId, a.itemId);
                        dataInventory.push(query);
                    }
                    Promise.all(dataInventory)
                        .then(inventories => {
                            resolve(inventories);
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
};