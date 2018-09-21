"use strict";

var ObjectId = require("mongodb").ObjectId;
require("mongodb-toolkit");
var generateCode = require("../../utils/inv-generator");

var ProductManager = require('../master/product-manager');
var StorageManager = require('../master/storage-manager');
var UomManager = require('../master/uom-manager');
var SummaryInventoryManager = require('./summary-inventory-manager');
var MovementInventoryManager = require('./movement-inventory-manager');

var Models = require("bateeq-models");
var Map = Models.map;
var DocumentInventoryModel = Models.inventory.DocumentInventory;

var BaseManager = require("module-toolkit").BaseManager;
var i18n = require("dl-i18n");
var moment = require("moment");

module.exports = class DocumentInventoryManager extends BaseManager {
    constructor(db, user) {
        super(db, user);
        this.collection = this.db.use(Map.inventory.DocumentInventory);

        this.SummaryInventoryManager = new SummaryInventoryManager(db, user);
        this.MovementInventoryManager = new MovementInventoryManager(db, user);

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
                "items.productName": {
                    "$regex": regex
                }
            };
            var productCodeFilter = {
                "items.productCode": {
                    "$regex": regex
                }
            };
            var codeFilter = {
                "code": {
                    "$regex": regex
                }
            };
            var referenceNoFilter = {
                "referenceNo": {
                    "$regex": regex
                }
            };
            var referenceTypeFilter = {
                "referenceType": {
                    "$regex": regex
                }
            };
            var typeFilter = {
                "type": {
                    "$regex": regex
                }
            };
            var storageFilter = {
                "storageName": {
                    "$regex": regex
                }
            };
            keywordFilter["$or"] = [productNameFilter, productCodeFilter, codeFilter, referenceNoFilter, referenceTypeFilter, typeFilter, storageFilter];
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
            .then((DocumentInventory) => {
                var createMovements = DocumentInventory.items.map(item => {
                    var movement = {
                        referenceNo: DocumentInventory.referenceNo,
                        referenceType: DocumentInventory.referenceType,
                        type: DocumentInventory.type,
                        storageId: DocumentInventory.storageId,
                        productId: item.productId,
                        uomId: item.uomId,
                        quantity: item.quantity
                    };
                    return this.MovementInventoryManager.create(movement);
                })

                return Promise.all(createMovements);
            })
            .then(results => id);
    }

    createIn(DocumentInventory)
    {
        DocumentInventory.type = "IN";
        return this.create(DocumentInventory);
    }

    _validate(DocumentInventory) {
        var errors = {};
        var valid = DocumentInventory;

        var getDbDocumentInventory = this.collection.singleOrDefault({
            _id: new ObjectId(valid._id)
        });

        var getDuplicateDocumentInventory = this.collection.singleOrDefault({
            _id: {
                '$ne': new ObjectId(valid._id)
            },
            code: valid.code
        });

        var getStorage = valid.storageId && ObjectId.isValid(valid.storageId) ? this.storageManager.getSingleByIdOrDefault(valid.storageId) : Promise.resolve(null);

        valid.items = valid.items || [];
        var productIds = valid.items.map((item) => item.productId && ObjectId.isValid(item.productId) ? new ObjectId(item.productId) : null);
        var uomIds = valid.items.map((item) => item.uomId && ObjectId.isValid(item.uomId) ? new ObjectId(item.uomId) : null);

        var getProducts = productIds.filter((id) => id !== null).length > 0 ? this.productManager.collection.find({
            _id: {
                "$in": productIds
            }
        }).toArray() : Promise.resolve([]);
        var getUoms = uomIds.filter((id) => id !== null).length > 0 ? this.uomManager.collection.find({
            _id: {
                "$in": uomIds
            }
        }).toArray() : Promise.resolve([]);

        return Promise.all([getDbDocumentInventory, getDuplicateDocumentInventory, getStorage, getProducts, getUoms])
            .then(results => {
                var _dbDocumentInventory = results[0];
                var _duplicateDocumentInventory = results[1];
                var _storage = results[2];
                var _products = results[3];
                var _uoms = results[4];

                if (_dbDocumentInventory)
                    valid.code = _dbDocumentInventory.code; // prevent code changes. 
                if (_duplicateDocumentInventory)
                    errors["code"] = i18n.__("DocumentInventory.code.isExist: %s is exist", i18n.__("DocumentInventory.code._:Code"));


                if (!valid.referenceNo || valid.referenceNo === '')
                    errors["referenceNo"] = i18n.__("DocumentInventory.referenceNo.isRequired:%s is required", i18n.__("DocumentInventory.referenceNo._:Reference No"));

                if (!valid.referenceType || valid.referenceType === '')
                    errors["referenceType"] = i18n.__("DocumentInventory.referenceType.isRequired:%s is required", i18n.__("DocumentInventory.referenceType._:Reference Type"));

                if (!valid.type || valid.type === '' || !["IN", "OUT", "RET-IN", "RET-OUT", "ADJ"].find(r => r === valid.type))
                    errors["type"] = i18n.__("DocumentInventory.type.invalid:%s is invalid", i18n.__("DocumentInventory.type._:Type"));


                if (!valid.storageId || valid.storageId === '')
                    errors["storageId"] = i18n.__("DocumentInventory.storageId.isRequired:%s is required", i18n.__("DocumentInventory.storageId._:Storage")); //"Grade harus diisi";   
                else if (!_storage)
                    errors["storageId"] = i18n.__("DocumentInventory.storageId: %s not found", i18n.__("DocumentInventory.storageId._:Storage"));

                if (valid.items && valid.items.length <= 0) {
                    errors["items"] = i18n.__("DocumentInventory.items.isRequired:%s is required", i18n.__("FabricQualityControl.items._: Items")); //"Harus ada minimal 1 barang";
                }
                else {

                    var itemsErrors = [];
                    valid.items.forEach((item, index) => {
                        var itemsError = {};
                        if (!item.productId || item.productId.toString() === "")
                            itemsError["productId"] = i18n.__("DocumentInventory.items.productId.isRequired:%s is required", i18n.__("DocumentInventory.items.productId._:Product"));
                        else if (!_products.find(product => product._id.toString() === item.productId.toString()))
                            itemsError["productId"] = i18n.__("DocumentInventory.items.productId.isNotExist:%s is not exist", i18n.__("DocumentInventory.items.productId._:Product"));

                        if (!item.uomId || item.uomId.toString() === "")
                            itemsError["uomId"] = i18n.__("DocumentInventory.items.uomId.isRequired:%s is required", i18n.__("DocumentInventory.items.uomId._:UOM"));
                        else if (!_uoms.find(uom => uom._id.toString() === item.uomId.toString()))
                            itemsError["uomId"] = i18n.__("DocumentInventory.items.uomId.isNotExist:%s is not exist", i18n.__("DocumentInventory.items.uomId._:UOM"));

                        if (!itemsError.productId && !itemsError.uomId) {
                            var dup = valid.items.find((test, idx) => item.productId.toString() === test.productId.toString() && item.uomId.toString() === test.uomId.toString() && index != idx);
                            if (dup)
                                itemsError["productId"] = i18n.__("DocumentInventory.items.productId.isDuplicate:%s is duplicate", i18n.__("DocumentInventory.items.productId._:Product"));
                        }

                        if (item.quantity === 0)
                            itemsError["quantity"] = i18n.__("DocumentInventory.items.quantity.isRequired:%s is required", i18n.__("DocumentInventory.items.quantity._:Quantity"));

                        itemsErrors.push(itemsError);

                        for (var itemsError of itemsErrors) {
                            if (Object.getOwnPropertyNames(itemsError).length > 0) {
                                errors.items = itemsErrors;
                                break;
                            }
                        }
                    })
                }


                if (Object.getOwnPropertyNames(errors).length > 0) {
                    var ValidationError = require('module-toolkit').ValidationError;
                    return Promise.reject(new ValidationError('data does not pass validation', errors));
                }

                valid.storageId = _storage._id;
                valid.storageName = _storage.name;
                valid.storageCode = _storage.code;

                for (var item of valid.items) {
                    var product = _products.find(product => product._id.toString() === item.productId.toString());
                    var uom = _uoms.find(uom => uom._id.toString() === item.uomId.toString());

                    item.productId = product._id;
                    item.productCode = product.code;
                    item.productName = product.name;

                    item.uomId = uom._id;
                    item.uom = uom.unit;
                }

                if (!valid.stamp) {
                    valid = new DocumentInventoryModel(valid);
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
        var codeIndex = {
            name: `ix_${Map.inventory.MovementInventory}__code`,
            key: {
                code: 1
            },
            unique: true
        };

        return this.collection.createIndexes([dateIndex, codeIndex]);
    }
}
