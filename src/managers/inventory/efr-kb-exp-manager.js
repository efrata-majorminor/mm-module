'use strict';
//require('js-toolkit').Promise.ext;

// external deps 
var ObjectId = require('mongodb').ObjectId;

// internal deps
require('mongodb-toolkit');
var MmModels = require('mm-models');
var map = MmModels.map;

var BaseManager = require('module-toolkit').BaseManager;
var ExpeditionDoc = MmModels.inventory.ExpeditionDoc;
var TransferOutDoc = MmModels.inventory.TransferOutDoc;
var TransferOutItem = MmModels.inventory.TransferOutItem;
var SPK = MmModels.merchandiser.SPK;
var generateCode = require('../../utils/code-generator');

const moduleId = "MM-KB/EXP";
module.exports = class PusatBarangBaruKirimBarangJadiAksesorisManager extends BaseManager {
    constructor(db, user) {
        super(db, user);
        this.user = user;
        this.SPKDocCollection = this.db.use(map.merchandiser.SPKDoc);
        this.collection = this.db.use(map.inventory.ExpeditionDoc);

        var StorageManager = require('../master/storage-manager');
        this.storageManager = new StorageManager(db, user);

        var TransferOutDocManager = require('./transfer-out-doc-manager');
        this.transferOutDocManager = new TransferOutDocManager(db, user);

        var InventoryManager = require('./inventory-manager');
        this.inventoryManager = new InventoryManager(db, user);

        var SpkManager = require('../merchandiser/efr-pk-manager');
        this.spkManager = new SpkManager(db, user);

        var ModuleManager = require('../master/module-manager');
        this.moduleManager = new ModuleManager(db, user);
    }

    _getQuery(paging) {
        var deletedFilter = {
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
            keywordFilter = {
                '$or': [filterCode]
            };
        }
        query = { '$and': [deletedFilter, paging.filter, keywordFilter] }
        return query;
    }

    readAll(paging) {
        var _paging = Object.assign({}, paging);

        return new Promise((resolve, reject) => {
            var regexModuleId = new RegExp(moduleId, "i");
            var filter = {
                _deleted: false,
                'code': {
                    '$regex': regexModuleId
                }
            };
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
                var $or = {
                    '$or': [filterCode]
                };
                query['$and'].push($or);
            }


            this.collection
                .where(query)
                .execute()
                .then(spkDoc => {
                    resolve(spkDoc);
                })
                .catch(e => {
                    reject(e);
                });
        });
    }

    readPackingListExp() {
        return new Promise((resolve, reject) => {
            this.readAll(0)
                .then(expDocs => {
                    var expDocTemp = expDocs.data;
                    var packingListExp = [];
                    for (var exp of expDocTemp) {
                        for (var spk of exp.spkDocuments) {
                            packingListExp.push(spk.packingList);
                        }
                    }
                    resolve(packingListExp);
                })
                .catch(e => {
                    reject(e);
                });
        })
    }

    readForPackingListReport(filter) {
        return new Promise((resolve, reject) => {
            this.readPackingListExp()
                .then(pkList => {
                    var transaksi = "";
                    if (filter.transaction == 0) {
                        transaksi = "MM-KB/PLB";
                    } else if (filter.transaction == 1) {
                        transaksi = "MM-KB/PLR";
                    }
                    var query;
                    if (filter.storageId == "" || filter.storageId == undefined || filter.storageId == "undefined") {
                        query = {
                            _deleted: false,
                            "_createdDate": {
                                "$gt": new Date(filter.dateFrom),
                                "$lt": new Date(filter.dateTo)
                            },
                            packingList: new RegExp(transaksi, "i")
                        };
                    } else {
                        query = {
                            _deleted: false,
                            "_createdDate": {
                                "$gt": new Date(filter.dateFrom),
                                "$lt": new Date(filter.dateTo)
                            },
                            packingList: new RegExp(transaksi, "i"),
                            "destinationId": ObjectId(filter.storageId),
                        };
                    }
                    this.SPKDocCollection.where(query).select().execute()
                        .then((results) => {
                            var spkDocEnterExp = [];
                            if (results.data.length > 0) {
                                for (var data of results.data) {
                                    var _data = pkList.find((_data) => _data === data.packingList);
                                    if (_data && filter.packingListStatus == 1) {
                                        spkDocEnterExp.push(data);
                                    } else if (!_data && filter.packingListStatus == 0) {
                                        spkDocEnterExp.push(data);
                                    }
                                }
                            }
                            resolve(spkDocEnterExp);
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

    getSingleById(id) {
        return new Promise((resolve, reject) => {
            var query = {
                _id: new ObjectId(id),
                _deleted: false
            };
            this.getSingleByQuery(query)
                .then(expeditionDoc => {
                    resolve(expeditionDoc);
                })
                .catch(e => {
                    reject(e);
                });
        });
    }

    getSingleByIdOrDefault(id) {
        return new Promise((resolve, reject) => {
            var query = {
                _id: new ObjectId(id),
                _deleted: false
            };
            this.getSingleByQueryOrDefault(query)
                .then(expeditionDoc => {
                    resolve(expeditionDoc);
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
                .then(expeditionDoc => {
                    resolve(expeditionDoc);
                })
                .catch(e => {
                    reject(e);
                });
        })
    }

    getSingleByQueryOrDefault(query) {
        return new Promise((resolve, reject) => {
            this.collection
                .singleOrDefault(query)
                .then(expeditionDoc => {
                    resolve(expeditionDoc);
                })
                .catch(e => {
                    reject(e);
                });
        })
    }

    getBySpk(code) {
        var query = { "spkDocuments.code": code };
        return new Promise((resolve, reject) => {
            this.collection
                .where(query)
                .execute()
                .then(expeditionDocs => {
                    resolve(expeditionDocs);
                })
                .catch(e => {
                    reject(e);
                });
        })
    }

    getByPackingList(packingList) {
        var query = { "spkDocuments.packingList": packingList };
        return new Promise((resolve, reject) => {
            this.collection
                .where(query)
                .execute()
                .then(expeditionDocs => {
                    resolve(expeditionDocs);
                })
                .catch(e => {
                    reject(e);
                });
        })
    }

    updateReceivedByPackingList(packingList) {
        return new Promise((resolve, reject) => {
            this.getByPackingList(packingList)
                .then(results => {
                    if (results.data.length > 0) {
                        var expedition = results.data[0];
                        for (var spkDoc of expedition.spkDocuments) {
                            if (spkDoc.packingList == packingList) {
                                spkDoc.isReceived = true;
                            }
                        }
                        expedition._updatedDate = new Date();
                        expedition._updatedBy = this.user.username;
                        this.collection.update(expedition).then(id => {
                            resolve(id);
                        })
                            .catch(e => {
                                reject(e);
                            });
                    } else {
                        resolve();
                    }
                })
                .catch(e => {
                    reject(e);
                });
        });
    }


    create(expeditionDoc) {
        return new Promise((resolve, reject) => {
            //Validate Input Model
            this._validate(expeditionDoc)
                .then(validatedExpeditionDoc => {
                    var expCode = generateCode(moduleId);
                    var getTransferOuts = [];
                    //Create Promise to Create Transfer Out
                    for (var spkDocument of validatedExpeditionDoc.spkDocuments) {
                        //getTransferOuts.push(this.transferOutDocManager.create(validTransferOutDoc));
                        if (spkDocument._id && spkDocument._id != "" && spkDocument._id != undefined) {
                            var f = (spkDoc, outManager) => {
                                return () => {
                                    var validTransferOutDoc = {};
                                    validTransferOutDoc.code = generateCode(moduleId);
                                    validTransferOutDoc.reference = expCode;
                                    validTransferOutDoc.sourceId = spkDoc.sourceId;
                                    validTransferOutDoc.destinationId = spkDoc.destinationId;
                                    validTransferOutDoc.items = [];
                                    for (var item of spkDoc.items) {
                                        var newitem = {};
                                        newitem.itemId = item.itemId;
                                        newitem.quantity = item.sendQuantity;
                                        validTransferOutDoc.items.push(newitem);
                                    }
                                    return outManager.create(validTransferOutDoc)
                                }
                            };
                            getTransferOuts.push(f(spkDocument, this.transferOutDocManager));
                        }
                    }
                    //Create Transfer Out
                    //Promise.all(getTransferOuts)
                    require('js-toolkit').Promise.ext;
                    Promise.chain(getTransferOuts)
                        .then(results => {
                            getTransferOuts = [];
                            //Create Promise Get Transfer Out using ID
                            for (var transferOutResultId of results) {
                                getTransferOuts.push(this.transferOutDocManager.getSingleByIdOrDefault(transferOutResultId));
                            }
                            //Get Transfer Out
                            Promise.all(getTransferOuts)
                                .then(transferOutResults => {
                                    //Create Expedition Model
                                    var validExpeditionDoc = {};
                                    validExpeditionDoc.code = expCode;
                                    validExpeditionDoc.expedition = validatedExpeditionDoc.expedition;
                                    validExpeditionDoc.weight = validatedExpeditionDoc.weight;
                                    validExpeditionDoc.transferOutDocuments = [];
                                    validExpeditionDoc.spkDocuments = [];
                                    for (var spkDoc of validatedExpeditionDoc.spkDocuments) {
                                        spkDoc = new SPK(spkDoc);
                                        spkDoc.stamp(this.user.username, "manager");
                                        validExpeditionDoc.spkDocuments.push(spkDoc);
                                    }
                                    for (var transferOut of transferOutResults) {
                                        validExpeditionDoc.transferOutDocuments.push(transferOut);
                                    }
                                    validExpeditionDoc = new ExpeditionDoc(validExpeditionDoc);
                                    validExpeditionDoc._createdDate = new Date();
                                    validExpeditionDoc.stamp(this.user.username, 'manager');
                                    //Create Promise Expedition 
                                    this.collection.insert(validExpeditionDoc)
                                        .then(resultExpeditionId => {
                                            //Get Expedition Data
                                            this.getSingleByIdOrDefault(resultExpeditionId)
                                                .then(resultExpedition => {
                                                    var getSPKData = [];
                                                    //Create Promise get SPK Data for update
                                                    for (var spkDocument of validExpeditionDoc.spkDocuments) {
                                                        if (spkDocument._id && spkDocument._id != "" && spkDocument._id != undefined) {
                                                            getSPKData.push(this.spkManager.getSingleByIdOrDefault(spkDocument._id));
                                                        }
                                                    }
                                                    //Get SPK Data
                                                    Promise.all(getSPKData)
                                                        .then(resultSPKs => {
                                                            //Create Promise Update SPK Data
                                                            var getUpdateSPKData = [];
                                                            for (var resultSPK of resultSPKs) {
                                                                var spk = validExpeditionDoc.spkDocuments.find(x => x.packingList == resultSPK.packingList);
                                                                if (spk) {
                                                                    resultSPK.items = spk.items;
                                                                }
                                                                resultSPK.isDistributed = true;
                                                                getUpdateSPKData.push(this.spkManager.update(resultSPK));
                                                            }
                                                            //Update SPK Data
                                                            Promise.all(getUpdateSPKData)
                                                                .then(resultUpdateSPKs => {
                                                                    resolve(resultExpeditionId);
                                                                })
                                                                .catch(e => {
                                                                    reject(e);
                                                                });
                                                        })
                                                        .catch(e => {
                                                            reject(e);
                                                        });
                                                })
                                                .catch(e => {
                                                    reject(e);
                                                });
                                        })
                                        .catch(e => {
                                            reject(e);
                                        });
                                })
                                .catch(e => {
                                    reject(e);
                                });
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

    update(expeditionDoc) {
        return new Promise((resolve, reject) => {
            resolve(null);
        });
    }

    delete(expeditionDoc) {
        return new Promise((resolve, reject) => {
            resolve(null);
        });
    }

    getReport(filter) {
        var transaksi = "";
        if (filter.transaction == 0) {
            transaksi = new RegExp("^[A-Z0-9]+\/MM-KB/PLB\/[0-9]{2}\/[0-9]{4}$", "i");
        } else if (filter.transaction == 1) {
            transaksi = new RegExp("^[A-Z0-9]+\/MM-KB/PLR\/[0-9]{2}\/[0-9]{4}$", "i");
        }

        var query = {
            "date": {
                "$gt": filter.dateFrom,
                "$lt": filter.dateTo
            }
        }

        if (filter.storageId != "") {
            query = {
                '$and': [query, {
                    "spkDocuments.destinationId": ObjectId(filter.storageId),
                }]
            }
        }

        return new Promise((resolve, reject) => {
            this.collection.where(query)
                .order({ date: 1 }).execute()
                .then(expeditionDocs => {
                    resolve(expeditionDocs)
                })
                .catch(err => { reject(err) });
        })
    }

    _validate(expeditionDoc) {
        var errors = {};
        return new Promise((resolve, reject) => {
            var valid = expeditionDoc;
            this.moduleManager.getByCode(moduleId)
                .then(module => {
                    var config = module.config;
                    var getPromise = [];
                    var validateSPKisExist = [];

                    var getStock = [];

                    if (!valid.expedition || valid.expedition == '')
                        errors["expedition"] = "expedition is required";

                    if (!valid.spkDocuments || valid.spkDocuments.length == 0) {
                        errors["spkDocuments"] = "spkDocuments is required";
                    }
                    else {
                        var spkDocumentErrors = [];
                        var spkDocumentDestinationId = "";
                        expeditionDoc.weight = 0;
                        for (var spkDocument of valid.spkDocuments) {
                            if (spkDocument._id && spkDocument._id != "" && spkDocument._id != undefined) {
                                expeditionDoc.weight += parseInt(spkDocument.weight || 0);
                                var spkDocumentError = {};
                                if (!spkDocument._id || spkDocument._id == "") {
                                    spkDocumentError["code"] = "packing list harus diisi";
                                    getPromise.push(Promise.resolve(null));
                                }
                                else {
                                    for (var i = valid.spkDocuments.indexOf(spkDocument) + 1; i < valid.spkDocuments.length; i++) {
                                        var otherItem = valid.spkDocuments[i];
                                        if (spkDocument._id == otherItem._id) {
                                            spkDocumentError["code"] = "duplikat packing list";
                                        }
                                    }

                                    getPromise.push(this.spkManager.getSingleByIdOrDefault(spkDocument._id));
                                }

                                validateSPKisExist.push(this.getBySpk(spkDocument.code));

                                if (spkDocumentDestinationId == "")
                                    spkDocumentDestinationId = spkDocument.destinationId;
                                else if (spkDocument.destinationId != spkDocumentDestinationId)
                                    spkDocumentError["code"] = "packing list harus memiliki tujuan yang sama";

                                spkDocumentErrors.push(spkDocumentError);

                                for (var item of spkDocument.items) {
                                    getStock.push(this.inventoryManager.getByStorageIdAndItemIdOrDefault(spkDocument.sourceId, item.itemId));
                                }
                            }
                        }
                        for (var spkDocumentError of spkDocumentErrors) {
                            for (var prop in spkDocumentError) {
                                errors.spkDocuments = spkDocumentErrors;
                                break;
                            }
                            if (errors.spkDocuments)
                                break;
                        }
                    }

                    Promise.all(validateSPKisExist).then(
                        validateSPKisExistResult => {
                            Promise.all([].concat(getPromise, getStock))
                                .then(spkDocuments => {
                                    var index = 0;
                                    var inventory = spkDocuments.filter(x => x._type === 'inventory')
                                    for (var spkDocument of valid.spkDocuments) {
                                        if (spkDocument._id && spkDocument._id != "" && spkDocument._id != undefined) {
                                            var spkDocumentError = spkDocumentErrors[index];

                                            if (spkDocuments[index]) {
                                                spkDocument._createdDate = spkDocuments[index]._createdDate;
                                                var spkspkDocumentError = spkDocumentError;
                                                if (spkDocument) {
                                                    if (!spkDocument.items || spkDocument.items.length == 0) {
                                                        spkspkDocumentError["items"] = "items is required";
                                                    }
                                                    else {
                                                        var itemErrors = [];
                                                        for (var item of spkDocument.items) {
                                                            var itemError = {};
                                                            var quantityStock = inventory.find(x => x.itemId == item.itemId && x.storageId == spkDocument.sourceId);
                                                            if (item.sendQuantity > quantityStock.quantity) {
                                                                itemError["sendQuantity"] = "stok tidak tersedia";
                                                            }
                                                            if (item.quantity == undefined || (item.quantity && item.quantity == '')) {
                                                                itemError["quantity"] = "kuantitas harus diisi";
                                                            }
                                                            else if (parseInt(item.quantity) <= 0) {
                                                                itemError["quantity"] = "kuantitas harus lebih besar dari 0";
                                                            }
                                                            if (item.sendQuantity == undefined || (item.sendQuantity && item.sendQuantity == '')) {
                                                                itemError["sendQuantity"] = "kuantitas pengiriman harus diisi";
                                                            }
                                                            else if (parseInt(item.sendQuantity) <= 0) {
                                                                itemError["sendQuantity"] = "kuantitas pengiriman harus lebih besar dari 0";
                                                            }

                                                            if (item.sendQuantity > item.quantity) {
                                                                itemError["sendQuantity"] = "kuantitas pengiriman tidak boleh lebih besar dari kuantitas packing list";
                                                            }
                                                            if (item.sendQuantity != item.quantity && (!item.remark || item.remark == '')) {
                                                                itemError["remark"] = "catatan harus diisi";
                                                            }

                                                            itemErrors.push(itemError);
                                                        }
                                                        for (var itemError of itemErrors) {
                                                            for (var prop in itemError) {
                                                                spkspkDocumentError.items = itemErrors;
                                                                break;
                                                            }
                                                            if (spkspkDocumentError.items)
                                                                break;
                                                        }
                                                    }

                                                    if ((spkDocument.weight || 0) == 0)
                                                        spkspkDocumentError["weight"] = "berat harus diisi";
                                                }

                                                for (var prop in spkspkDocumentError) {
                                                    spkDocumentError = spkspkDocumentError;
                                                    break;
                                                }

                                                if (validateSPKisExistResult[index].count > 0)
                                                    spkDocumentError.code = "packing list sudah memiliki ekspedisi";

                                                spkDocument = spkDocuments[index];
                                            }
                                            else {
                                                spkDocumentError.code = "packing list tidak ditemukan";
                                            }
                                            index++;
                                        }
                                    }
                                    for (var spkDocumentError of spkDocumentErrors) {
                                        for (var prop in spkDocumentError) {
                                            errors.spkDocuments = spkDocumentErrors;
                                            break;
                                        }
                                    }

                                    for (var prop in errors) {
                                        var ValidationError = require('module-toolkit').ValidationError;
                                        reject(new ValidationError('data does not pass validation', errors));
                                    }

                                    resolve(valid)
                                })
                                .catch(e => {
                                    reject(e);
                                });
                        }
                    )
                })
                .catch(e => {
                    reject(new Error(`Unable to load module:${moduleId}`));
                });
        });
    }

    pdf(id) {
        return new Promise((resolve, reject) => {

            this.getSingleById(id)
                .then(docs => {
                    var getDefinition = require('../../pdf/definitions/efr-kb-exp');
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
};