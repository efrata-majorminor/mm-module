"use strict";

var ObjectId = require("mongodb").ObjectId;
require("mongodb-toolkit");
var generateCode = require("../../utils/code-generator");

var ProductManager = require('../master/product-manager');
var StorageManager = require('../master/storage-manager');
var UomManager = require('../master/uom-manager');
var SummaryInventoryManager = require('./summary-inventory-manager');

var Models = require("bateeq-models");
var Map = Models.map;
var SummaryInventoryModel = Models.inventory.SummaryInventory;
var MovementInventoryModel = Models.inventory.MovementInventory;

var BaseManager = require("module-toolkit").BaseManager;
var i18n = require("dl-i18n");
var moment = require("moment");

module.exports = class MovementInventoryManager extends BaseManager {
    constructor(db, user) {
        super(db, user);
        this.collection = this.db.use(Map.inventory.MovementInventory);

        this.SummaryinventoryManager = new SummaryInventoryManager(db, user);
        this.storageManager = new StorageManager(db, user);
        this.productManager = new ProductManager(db, user);
        this.uomManager = new UomManager(db, user);
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
            var productNameFilter = {
                "productName": {
                    "$regex": regex
                }
            };
            var productCodeFilter = {
                "productCode": {
                    "$regex": regex
                }
            };
            keywordFilter["$or"] = [productNameFilter, productCodeFilter];
        }
        query["$and"] = [_default, keywordFilter, pagingFilter];
        return query;
    }

    _beforeInsert(data) {
        data.code = generateCode();
        
        return Promise.resolve(data);
    }

    _afterInsert(id) {
        return this.getSingleById(id)
            .then((Movementinventory) => {
                var getSum = this.collection.aggregate([{
                    '$match': {
                        storageId: Movementinventory.storageId,
                        productId: Movementinventory.productId,
                        uomId: Movementinventory.uomId 
                    }
                }, {
                    "$group": {
                        _id: null,
                        quantity: {
                            '$sum': '$quantity'
                        }
                    }
                }]).toArray().then(results => results[0]);

                var getSummary = this.SummaryinventoryManager.getSert(Movementinventory.productId, Movementinventory.storageId, Movementinventory.uomId);

                return Promise.all([getSum, getSummary])
                    .then(results => {
                        var sum = results[0];
                        var summary = results[1];
                        summary.quantity = sum.quantity;
                        return this.SummaryinventoryManager.update(summary)
                    })
                    .then(sumId => id)
            });
    }

    _validate(Movementinventory) {
        var errors = {};
        var valid = Movementinventory;

        var getSummaryInventory = this.SummaryinventoryManager.getSert(valid.productId, valid.storageId, valid.uomId)

        var getProduct = valid.productId && ObjectId.isValid(valid.productId) ? this.productManager.getSingleByIdOrDefault(valid.productId) : Promise.resolve(null);
        var getStorage = valid.storageId && ObjectId.isValid(valid.storageId) ? this.storageManager.getSingleByIdOrDefault(valid.storageId) : Promise.resolve(null);
        var getUom = valid.uomId && ObjectId.isValid(valid.uomId) ? this.uomManager.getSingleByIdOrDefault(valid.uomId) : Promise.resolve(null);

        return Promise.all([getSummaryInventory, getProduct, getStorage, getUom])
            .then(results => {
                var _dbSummaryInventory = results[0];
                var _product = results[1];
                var _storage = results[2];
                var _uom = results[3];

                if (_dbSummaryInventory)
                    valid.code = _dbSummaryInventory.code; // prevent code changes.

                if (!valid.referenceNo || valid.referenceNo === '')
                    errors["referenceNo"] = i18n.__("MovementInventory.referenceNo.isRequired:%s is required", i18n.__("MovementInventory.referenceNo._:Reference No"));

                if (!valid.referenceType || valid.referenceType === '')
                    errors["referenceType"] = i18n.__("MovementInventory.referenceType.isRequired:%s is required", i18n.__("MovementInventory.referenceType._:Reference Type"));


                if (!valid.productId || valid.productId === '')
                    errors["productId"] = i18n.__("MovementInventory.productId.isRequired:%s is required", i18n.__("MovementInventory.productId._:Product")); //"Grade harus diisi";   
                else if (!_product)
                    errors["productId"] = i18n.__("MovementInventory.productId: %s not found", i18n.__("MovementInventory.productId._:Product"));

                if (!valid.storageId || valid.storageId === '')
                    errors["storageId"] = i18n.__("MovementInventory.storageId.isRequired:%s is required", i18n.__("MovementInventory.storageId._:Storage")); //"Grade harus diisi";   
                else if (!_product)
                    errors["storageId"] = i18n.__("MovementInventory.storageId: %s not found", i18n.__("MovementInventory.storageId._:Storage"));

                if (!valid.uomId || valid.uomId === '')
                    errors["uomId"] = i18n.__("MovementInventory.uomId.isRequired:%s is required", i18n.__("MovementInventory.uomId._:Uom")); //"Grade harus diisi";   
                else if (!_uom)
                    errors["uomId"] = i18n.__("MovementInventory.uomId: %s not found", i18n.__("MovementInventory.uomId._:Uom"));


                if (Object.getOwnPropertyNames(errors).length > 0) {
                    var ValidationError = require('module-toolkit').ValidationError;
                    return Promise.reject(new ValidationError('data does not pass validation', errors));
                }


                valid.productId = _product._id;
                valid.productName = _product.name;
                valid.productCode = _product.code;

                valid.storageId = _storage._id;
                valid.storageName = _storage.name;
                valid.storageCode = _storage.code;

                valid.uomId = _uom._id;
                valid.uom = _uom.unit;

                if(valid.type == "OUT") {
                    valid.quantity = valid.quantity * -1;
                }

                valid.before = _dbSummaryInventory.quantity;
                valid.after = _dbSummaryInventory.quantity + valid.quantity;

                if (!valid.stamp) {
                    valid = new MovementInventoryModel(valid);
                }

                valid.stamp(this.user.username, "manager");
                return Promise.resolve(valid);


            })
    }

    _createIndexes() {
        var dateIndex = {
            name: `ix_${Map.inventory.MovementInventory}__updatedDate`,
            key: {
                _updatedDate: -1
            }
        }
        var productIndex = {
            name: `ix_${Map.inventory.MovementInventory}__productId`,
            key: {
                productId: 1
            }
        };
        var storageIndex = {
            name: `ix_${Map.inventory.MovementInventory}__storageId`,
            key: {
                storageId: 1
            }
        };
        var uomIndex = {
            name: `ix_${Map.inventory.MovementInventory}__uomId`,
            key: {
                uomId: 1
            }
        };

        return this.collection.createIndexes([dateIndex, productIndex, storageIndex, uomIndex]);
    }

    getMovementReport(info) {
        var _defaultFilter = {
            _deleted: false
        }, 
            query = {},
            order = info.order || {};

        var dateFrom = info.dateFrom ? (new Date(info.dateFrom)) : (new Date(1900, 1, 1));
        var dateTo = info.dateTo ? (new Date(info.dateTo)) : (new Date());

        var filterMovement = {};

        if(info.storageId)
            filterMovement.storageId = new ObjectId(info.storageId);

        if(info.type && info.type != "")
            filterMovement.type = info.type;

        if(info.productId)
            filterMovement.productId = new ObjectId(info.productId);

        filterMovement.date = {
            $gte: dateFrom,
            $lte: dateTo
        }

        query = { '$and': [_defaultFilter, filterMovement] };

        var data = this._createIndexes()
            .then((createIndexResults) => {
                return !info.xls ?
                    this.collection
                        .where(query)
                        .order(order)
                        .execute() :
                    this.collection
                        .where(query)
                        .page(info.page, info.size)
                        .order(order)
                        .execute();
            });
                    
        return Promise.resolve(data);
    }

    getXls(result, filter) {
        var xls = {};
        xls.data = [];
        xls.options = [];
        xls.name = '';

        var index = 0;
        var dateFormat = "DD/MM/YYYY";

        for (var movement of result.data) {
            index++;

            var item = {};
            item["No"] = index;
            item["Storage"] = movement.storageName ? movement.storageName : '';
            item["Tanggal"] = movement.date ? moment(movement.date).format(dateFormat) : '';
            item["Nama Barang"] = movement.productName ? movement.productName : '';
            item["UOM"] = movement.uom ? movement.uom : '';
            item["Before"] = movement.before ? movement.before : 0;
            item["Kuantiti"] = movement.quantity ? movement.quantity : 0;
            item["After"] = movement.after ? movement.after : 0;
            item["Status"] = movement.type ? movement.type : '';
            
            xls.data.push(item);
        }

        xls.options["No"] = "number";
        xls.options["Storage"] = "string";
        xls.options["Tanggal"] = "string";
        xls.options["Nama Barang"] = "string";
        xls.options["UOM"] = "string";
        xls.options["Before"] = "number";
        xls.options["Kuantiti"] = "number";
        xls.options["After"] = "number";        
        xls.options["Status"] = "string";       

        if (filter.dateFrom && filter.dateTo) {
            xls.name = `Inventory Movement ${moment(new Date(filter.dateFrom)).format(dateFormat)} - ${moment(new Date(filter.dateTo)).format(dateFormat)}.xlsx`;
        }
        else {
            xls.name = `Inventory Movement.xlsx`;
        }

        return Promise.resolve(xls);
    }
}
