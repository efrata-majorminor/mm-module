'use strict';

// external deps 
var ObjectId = require('mongodb').ObjectId;

// internal deps
require('mongodb-toolkit');
var BaseManager = require('module-toolkit').BaseManager;
var BateeqModels = require('bateeq-models');
var map = BateeqModels.map;
var generateCode = require('../../utils/code-generator');

var SPKDoc = BateeqModels.merchandiser.SPK;
var SPKItem = BateeqModels.merchandiser.SPKItem;
var FinishedGoods = BateeqModels.master.FinishedGoods;

var moduleId = "EFR-PK/PBJ";

module.exports = class SPKBarangJadiManager extends BaseManager {
    constructor(db, user) {
        super(db, user);
        this.collection = this.db.use(map.merchandiser.SPKDoc);
        var StorageManager = require('../master/storage-manager');
        this.storageManager = new StorageManager(db, user);

        var ItemManager = require('../master/item-manager');
        this.itemManager = new ItemManager(db, user);

        var InventoryManager = require('../inventory/inventory-manager');
        this.inventoryManager = new InventoryManager(db, user);

        var InventoryManager = require('../inventory/inventory-manager');
        this.inventoryManager = new InventoryManager(db, user);

        var ModuleManager = require('../master/module-manager');
        this.moduleManager = new ModuleManager(db, user);

        var FinishedGoodsManager = require('../master/finished-goods-manager');
        this.finishedGoodsManager = new FinishedGoodsManager(db, user);

        var PkManager = require('./efr-pk-manager');
        this.pkManager = new PkManager(db, user);
    }

    _getQuery(paging) {
        var regexModuleId = new RegExp(moduleId, "i");
        var deletedFilter = {
            _deleted: false,
            'code': {
                '$regex': regexModuleId
            }
        }, keywordFilter = {};

        var query = {};
        if (paging.keyword) {
            var regex = new RegExp(paging.keyword, "i");

            var filterCode = {
                'code': {
                    '$regex': regex
                }
            };
            var filterPackingList = {
                'packingList':
                {
                    '$regex': regex
                }
            };
            var filterReferenceList = {
                'reference':
                {
                    '$regex': regex
                }
            };
            keywordFilter = {
                '$or': [filterCode, filterPackingList, filterReferenceList]
            };
        }
        query = { '$and': [deletedFilter, paging.filter, keywordFilter] }
        return query;
    }

    readNotReceived(paging) {
        var _paging = Object.assign({
            page: 1,
            size: 20,
            order: {},
            filter: {},
            select: []
        }, paging);

        return new Promise((resolve, reject) => {
            var filter = paging.filter;
            var query = _paging.keyword ? {
                '$and': [filter]
            } : filter;

            if (_paging.keyword) {
                var regex = new RegExp(_paging.keyword, "i");
                var filterCode = {
                    'code': {
                        '$regex': regex
                    }
                };
                var filterPackingList = {
                    'packingList': {
                        '$regex': regex
                    }
                };
                var filterReferenceList = {
                    'reference': {
                        '$regex': regex
                    }
                };
                var $or = {
                    '$or': [filterCode, filterPackingList, filterReferenceList]
                };

                query['$and'].push($or);
            }
            this.collection
                .where(query)
                .select(_paging.select)
                .page(_paging.page, _paging.size)
                .order(_paging.order)
                .execute()
                .then(spkDoc => {
                    resolve(spkDoc);
                })
                .catch(e => {
                    reject(e);
                });
        });
    }

    pdf(id) {
        return new Promise((resolve, reject) => {

            this.getSingleById(id)
                .then(docs => {
                    var getDefinition = require('../../pdf/definitions/efr-kb-pbj');
                    var definition = getDefinition(docs);

                    var generatePdf = require('../../pdf/pdf-generator');
                    generatePdf(definition)
                        .then(binary => {
                            resolve(binary);
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

    getById(id) {
        return new Promise((resolve, reject) => {
            if (id === '')
                resolve(null);
            var query = {
                _id: new ObjectId(id),
                _deleted: false
            };
            this.getSingleByQuery(query)
                .then(spkDoc => {
                    resolve(spkDoc);
                })
                .catch(e => {
                    reject(e);
                });
        });
    }

    getByIdOrDefault(id) {
        return new Promise((resolve, reject) => {
            var query = {
                _id: new ObjectId(id),
                _deleted: false
            };
            this.getSingleOrDefaultByQuery(query)
                .then(spkDoc => {
                    resolve(spkDoc);
                })
                .catch(e => {
                    reject(e);
                });
        });
    }

    getSingleByQuery(query) {
        return new Promise((resolve, reject) => {
            this.collection
                .single(query)
                .then(spkDoc => {
                    resolve(spkDoc);
                })
                .catch(e => {
                    reject(e);
                });
        })
    }

    getSingleOrDefaultByQuery(query) {
        return new Promise((resolve, reject) => {
            this.collection
                .singleOrDefault(query)
                .then(spkDoc => {
                    resolve(spkDoc);
                })
                .catch(e => {
                    reject(e);
                });
        })
    }

    create(spkDoc) {
        return new Promise((resolve, reject) => {
            this._validate(spkDoc)
                .then(validSpkDoc => {
                    validSpkDoc.code = generateCode(moduleId);
                    validSpkDoc.packingList = generateCode('EFR-KB/PLB');
                    var date = new Date();
                    var password = (generateCode(("0" + date.getDate()).slice(-2))).split('/').join('');
                    validSpkDoc.password = password;
                    this.collection.insert(validSpkDoc)
                        .then(id => {
                            resolve(id);
                        })
                        .catch(e => {
                            reject(e);
                        })
                })
                .catch(e => {
                    reject(e);
                });
        });
    }

    createDraft(spkDoc) {
        return new Promise((resolve, reject) => {
            spkDoc.isDraft = true;
            this.create(spkDoc)
                .then(id => {
                    resolve(id);
                })
                .catch(e => {
                    reject(e);
                })
        });
    }

    update(spkDoc) {
        return new Promise((resolve, reject) => {
            this._validate(spkDoc)
                .then(validSpkDoc => {
                    this.collection.update(validSpkDoc)
                        .then(id => {
                            resolve(id);
                        })
                        .catch(e => {
                            reject(e);
                        })
                })
                .catch(e => {
                    reject(e);
                })
        });
    }

    updateDraft(spkDoc) {
        return new Promise((resolve, reject) => {
            spkDoc.isDraft = true;
            this.update(spkDoc)
                .then(id => {
                    resolve(id);
                })
                .catch(e => {
                    reject(e);
                })
        });

    }

    updateNotDraft(spkDoc) {
        return new Promise((resolve, reject) => {
            spkDoc.isDraft = false;
            this.update(spkDoc)
                .then(id => {
                    resolve(id);
                })
                .catch(e => {
                    reject(e);
                })
        });

    }

    delete(spkDoc) {
        return new Promise((resolve, reject) => {
            this._validate(spkDoc)
                .then(validSpkDoc => {
                    validSpkDoc._deleted = true;
                    this.collection.update(validSpkDoc)
                        .then(id => {
                            resolve(id);
                        })
                        .catch(e => {
                            reject(e);
                        })
                })
                .catch(e => {
                    reject(e);
                })
        });
    }

    _validate(spkDoc) {
        var errors = {};
        return new Promise((resolve, reject) => {
            var valid = spkDoc;
            this.moduleManager.getByCode("EFR-PK/PLB")
                .then(module => {
                    // 1. begin: Declare promises.
                    var getSPKDoc = this.collection.singleOrDefault({
                        "$and": [{
                            _id: {
                                '$ne': new ObjectId(valid._id)
                            }
                        }, {
                            code: valid.code
                        }]
                    });
                    var config = module.config;
                    if (!valid.sourceId || valid.sourceId == '')
                        errors["sourceId"] = "sourceId is required";
                    else {
                        if (config) {
                            if (config.source) {
                                var isAny = false;
                                if (config.source.type == "selection") {
                                    for (var sourceId of config.source.value) {
                                        if (sourceId.toString() == valid.sourceId.toString()) {
                                            isAny = true;
                                            break;
                                        }
                                    }
                                }
                                else {
                                    if (config.source.value.toString() == valid.sourceId.toString())
                                        isAny = true;
                                }
                                if (!isAny)
                                    errors["sourceId"] = "sourceId is not valid";
                            }
                        }
                    }

                    if (!valid.destinationId || valid.destinationId == '')
                        errors["destinationId"] = "destinationId is required";
                    else {
                        if (config) {
                            if (config.destination) {
                                var isAny = false;
                                if (config.destination.type == "selection") {
                                    for (var destinationId of config.destination.value) {
                                        if (destinationId.toString() == valid.destinationId.toString()) {
                                            isAny = true;
                                            break;
                                        }
                                    }
                                }
                                else {
                                    if (config.destination.value.toString() == valid.destinationId.toString())
                                        isAny = true;
                                }
                                if (!isAny)
                                    errors["destinationId"] = "destinationId is not valid";
                            }
                        }
                    }
                    var getItem = [];

                    if (valid.items && valid.items.length > 0) {
                        for (var item of valid.items) {
                            getItem.push(this.inventoryManager.getByStorageIdAndItemIdOrDefault(valid.sourceId, item.itemId))
                        }
                    }
                    else {
                        errors["items"] = "items is required";
                    }
                    Promise.all([getSPKDoc].concat(getItem))
                        .then(results => {
                            var index = 0;
                            var inventoryQuantity = 0;

                            var dataSpk = results[0];

                            if (valid._id == '') {
                                var getSPKDoc = this.collection.where(valid._id);
                                if (getSPKDoc.isDraft == false) {
                                    errors["isDraft"] = "this doc can not update because status not draft";
                                }
                            }

                            if (valid.date == "mm/dd/yyyy" || valid.date == "" || valid.date == undefined) {
                                errors["date"] = "date is required";
                            }

                            var items = results.slice(1, results.length)
                            // 2a. begin: Validate error on item level.
                            if (items.length > 0) {
                                var itemErrors = [];
                                for (var item of valid.items) {
                                    var itemError = {};
                                    if (items[index] == null) {
                                        inventoryQuantity = 0;
                                    } else {
                                        inventoryQuantity = items[index].quantity;
                                    }
                                    index++;
                                    if (parseInt(item.quantity) <= 0) {
                                        itemError["quantity"] = "quantity must be greater than 0";
                                    }
                                    if (item.quantity > inventoryQuantity) {
                                        itemError["quantity"] = "Tidak bisa simpan jika Quantity Pengiriman > Quantity Stock";
                                    }
                                    item.sendQuantity = parseInt(item.quantity || 0);
                                    itemErrors.push(itemError);
                                }
                                // 2a. end: Validate error on item level.
                                // 2b. add item level errors to parent error, if any.
                                for (var itemError of itemErrors) {
                                    for (var prop in itemError) {
                                        errors.items = itemErrors;
                                        break;
                                    }
                                    if (errors.items)
                                        break;
                                }
                            }

                            // 2c. begin: check if data has any error, reject if it has.
                            for (var prop in errors) {
                                var ValidationError = require('module-toolkit').ValidationError;
                                reject(new ValidationError('data does not pass validation', errors));
                            }

                            valid._createdDate = new Date();
                            valid = new SPKDoc(valid);
                            valid.stamp(this.user.username, 'manager');
                            resolve(valid)
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

    insert(dataFile, sourceId, destinationId, dateForm) {
        return new Promise((resolve, reject) => {
            var notUnique = [];
            if (dataFile != "") {
                for (var i = 1; i < dataFile.length; i++) {
                    notUnique.push({ "PackingList": dataFile[i][0], "Password": dataFile[i][1], "Barcode": dataFile[i][2], "Name": dataFile[i][3], "Size": dataFile[i][4], "Price": dataFile[i][5], "UOM": dataFile[i][6], "QTY": dataFile[i][7], "RO": dataFile[i][8], "HPP": dataFile[i][9] });
                }
            }
            var data = [];
            notUnique.filter(function (item) {
                var i = data.findIndex(x => x.Barcode == item.Barcode);
                if (i <= -1)
                    data.push(item);
            });
            var dataError = [], errorMessage;
            for (var i = 0; i < data.length; i++) {
                errorMessage = "";
                if (data[i]["PackingList"] === "") {
                    errorMessage = errorMessage + "Packing List tidak boleh kosong,";
                }
                if (data[i]["Password"] === "") {
                    errorMessage = errorMessage + "Password tidak boleh kosong,";
                }
                if (data[i]["Barcode"] === "") {
                    errorMessage = errorMessage + "Barcode tidak boleh kosong,";
                }
                if (data[i]["Name"] === "") {
                    errorMessage = errorMessage + "Name tidak boleh kosong,";
                }
                if (data[i]["Size"] === "") {
                    errorMessage = errorMessage + "Size tidak boleh kosong,";
                }
                if (data[i]["Price"] === "") {
                    errorMessage = errorMessage + "Price tidak boleh kosong,";
                }
                if (data[i]["UOM"] === "") {
                    errorMessage = errorMessage + "UOM tidak boleh kosong,";
                }
                if (data[i]["QTY"] === "") {
                    errorMessage = errorMessage + "QTY tidak boleh kosong,";
                } else if (isNaN(data[i]["QTY"])) {
                    errorMessage = errorMessage + "QTY harus numerik,";
                }
                if (data[i]["HPP"] !== "" || data[i]["HPP"] !== " ") {
                    if (isNaN(data[i]["HPP"])) {
                        errorMessage = errorMessage + "HPP harus numerik,";
                    }
                }

                for (var j = 0; j < data.length; j++) {
                    if (i !== j) {
                        if (data[i]["PackingList"] === data[j]["PackingList"]) {
                            if (data[i]["Password"] !== data[j]["Password"]) {
                                errorMessage = errorMessage + "Password berbeda di packing list yang sama,";
                            }
                            if (data[i]["Barcode"] === data[j]["Barcode"]) {
                                errorMessage = errorMessage + "Barcode sudah ada di packing list yang sama,";
                            }
                        }
                    }

                }

                if (errorMessage !== "") {
                    dataError.push({ "PackingList": data[i]["PackingList"], "Password": data[i]["Password"], "Barcode": data[i]["Barcode"], "Name": data[i]["Name"], "Size": data[i]["Size"], "Price": data[i]["Price"], "UOM": data[i]["UOM"], "QTY": data[i]["QTY"], "RO": data[i]["RO"], "HPP": data[i]["HPP"], "Error": errorMessage });
                }
            }
            if (dataError.length === 0) {

                var fg = [];
                for (var i = 0; i < data.length; i++) {
                    fg.push({ "code": data[i]["Barcode"], "name": data[i]["Name"], "uom": data[i]["UOM"], "realizationOrder": data[i]["RO"], "size": data[i]["Size"], "domesticSale": data[i]["Price"], "domesticCOGS": data[i]["HPP"] });
                }

                var flags = [], distinctFg = [];
                for (var i = 0; i < fg.length; i++) {
                    if (flags[fg[i].code]) continue;
                    flags[fg[i].code] = true;
                    distinctFg.push(fg[i]);
                }

                var promises = []
                for (var fg of distinctFg) {
                    var fGoods = new Promise((resolve, reject) => {
                        var item = fg;
                        this.itemManager.getByCode(item.code)
                            .then(resultItem => {
                                if (resultItem) {
                                    resultItem.name = item.name;
                                    resultItem.uom = item.uom;
                                    resultItem.article.realizationOrder = item.realizationOrder;
                                    resultItem.size = item.size;
                                    resultItem.domesticSale = Number(item.domesticSale);
                                    resultItem.domesticCOGS = Number(item.domesticCOGS);
                                    this.finishedGoodsManager.update(resultItem)
                                        .then(id => {
                                            this.itemManager.getSingleById(id)
                                                .then(resultItem => {
                                                    resolve(resultItem);
                                                })
                                                .catch(e => {
                                                    reject(e);
                                                });
                                        })
                                        .catch(e => {
                                            reject(e);
                                        });
                                }
                                else {
                                    var finishGood = new FinishedGoods();
                                    finishGood.code = item.code;
                                    finishGood.name = item.name;
                                    finishGood.uom = item.uom;
                                    finishGood.article.realizationOrder = item.realizationOrder;
                                    finishGood.size = item.size;
                                    finishGood.domesticSale = Number(item.domesticSale);
                                    finishGood.domesticCOGS = Number(item.domesticCOGS);
                                    this.finishedGoodsManager.create(finishGood)
                                        .then(id => {
                                            this.itemManager.getSingleById(id)
                                                .then(resultItem => {
                                                    resolve(resultItem);
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
                    });
                    promises.push(fGoods);
                }

                var getDestination = this.storageManager.getSingleByIdOrDefault(destinationId);
                var getSource = this.storageManager.getSingleByIdOrDefault(sourceId);

                Promise.all([getSource, getDestination].concat(promises))
                    .then(results => {
                        var source = results[0];
                        var destination = results[1];
                        var valid_fg = results.slice(2, results.length);

                        var productMap = {};
                        for (var item of valid_fg)
                            productMap[item.code] = item;

                        var spks = new Map();

                        for (var rowFile of data) {
                            if (!spks.has(rowFile.PackingList))
                                spks.set(rowFile.PackingList, {});

                            var workingSpk = spks.get(rowFile.PackingList);
                            workingSpk.code = generateCode(moduleId);
                            workingSpk.source = source;
                            workingSpk.sourceId = new ObjectId(source._id);
                            workingSpk.destination = destination;
                            workingSpk.destinationId = new ObjectId(destination._id);
                            workingSpk.packingList = rowFile.PackingList;
                            workingSpk.reference = rowFile.PackingList;
                            workingSpk.date = dateForm;
                            workingSpk.password = rowFile.Password;
                            workingSpk.items = workingSpk.items || [];

                            var itemFg = productMap[rowFile.Barcode];

                            workingSpk.items.push({
                                itemId: itemFg._id,
                                item: itemFg,
                                quantity: parseInt(rowFile.QTY),
                                remark: ''
                            });
                        }


                        var promisesSpk = [];
                        for (var spkDocument of spks.values()) {
                            var spkDocs = new Promise((resolve, reject) => {
                                var spkDoc = spkDocument;
                                for (var item of spkDoc.items) {
                                    item.sendQuantity = parseInt(item.quantity || 0);
                                }
                                this.pkManager.getByPL(spkDoc.packingList)
                                    .then(resultItem => {
                                        if (resultItem) {
                                            // resultItem.source = spkDoc.source;
                                            // resultItem.sourceId = new ObjectId(spkDoc.source._id);
                                            // resultItem.destination = spkDoc.destination;
                                            // resultItem.destinationId = new ObjectId(spkDoc.destination._id);
                                            // resultItem.reference = spkDoc.PackingList;
                                            // resultItem.date = spkDoc.dateForm;
                                            // resultItem.password = spkDoc.Password;
                                            // resultItem.items = spkDoc.items;
                                            // this.collection.update(resultItem)
                                            //     .then(resultItem => {
                                            resolve(resultItem);
                                            // })
                                            // .catch(e => {
                                            //     reject(e);
                                            // });
                                        }
                                        else {
                                            var spkResult = new SPKDoc(spkDoc);
                                            spkResult.isDistributed = true;
                                            spkResult.stamp(this.user.username, 'manager');
                                            spkResult._createdDate = new Date();
                                            this.collection.insert(spkResult)
                                                .then(id => {
                                                    this.pkManager.getSingleById(id)
                                                        .then(resultItem => {
                                                            resolve(resultItem);
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
                            });
                            promisesSpk.push(spkDocs);
                        }

                        Promise.all(promisesSpk)
                            .then(resultItem => {
                                resolve(resultItem);
                            })
                            .catch(e => {
                                reject(e);
                            });

                    })
                    .catch(e => {
                        reject(e);
                    });
            } else {
                resolve(dataError);
            }

        });
    }

};