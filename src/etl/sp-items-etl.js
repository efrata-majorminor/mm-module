'use strict'
var DLModels = require('bateeq-models');
var map = DLModels.map;
var ObjectId = require('mongodb').ObjectId;
var sqlConnect = require('./sqlConnect');
var BaseManager = require('module-toolkit').BaseManager;
var MongoClient = require('mongodb').MongoClient,
    test = require('assert');

var ItemManager = require('../../src/managers/master/item-manager');



module.exports = class ItemDataEtl extends BaseManager {
    constructor(db, user) {
        super(db, user);

        this.ItemManager = new ItemManager(db, user);

        this.collection = this.ItemManager.collection;
        // this.adas=1;
    }


    getDataItems() {
        return new Promise((resolve, reject) => {
            sqlConnect.getConnect()
                .then((connect) => {
                    var self = this;
                    var query = "select count(Barcode) as MaxLength from Produk";
                    var request = connect;
                    request.query(query, function (err, ProdukLength) {
                        if (err) {
                            console.log(err);
                            reject(err);
                        }
                        else {
                            var MaxLength = ProdukLength[0].MaxLength;
                            // var testPage=100;
                            var DataRows = MaxLength;

                            // var DataRows=10;

                            var numberOfPage = Math.ceil(MaxLength / DataRows);

                            var process = [];
                            for (var i = 1; i <= numberOfPage; i++) {
                                process.push(self.migrateDataItems(request, i, DataRows))
                            }

                            Promise.all(process).then(results => {

                                resolve(results);

                            }).catch(error => {
                                reject(error);
                            });
                        }
                    });
                });
        });
    }



    getDataMongo(code) {
        return new Promise((resolve, reject) => {
            this.collection.find({ "code": code }).toArray(function (err, item) {
                resolve(item);
            });

        });
    }

    migrateDataItems(request, pageNumber, DataRows) {
        var self = this;
        return new Promise(function (resolve, reject) {

            var query = "exec pagination_item_test " + pageNumber + "," + DataRows + " ";

            request.query(query, function (err, items) {
                var tasks = [];

                for (var item of items) {
                    tasks.push(self.insert(item));
                }

                Promise.all(tasks)
                    .then((task) => {
                        // console.log(task);
                        resolve(task);
                    }).catch(error => {
                        reject(error);
                    });
            });
        });
    }

    insert(item) {
        return new Promise((resolve, reject) => {

            var itemArr=[];

            var _idItems = new ObjectId();
            var _stampItems = new ObjectId();

            var ro = "";
            if ((!item.ro) || (item.ro.trim() == "-")) {
                ro = "";
            } else {
                ro = item.ro.trim();
            };

            var ItemMap =
                {
                    "_id": _idItems,
                    "_stamp": _stampItems,
                    "_type": "finished-goods",
                    "_version": "1.0.0",
                    "_active": true,
                    "_deleted": false,
                    "_createdBy": "router",
                    "_createdDate": new Date(),
                    "_createAgent": "manager",
                    "_updatedBy": "router",
                    "_updatedDate": new Date(),
                    "_updateAgent": "manager",
                    "code": item.Barcode,
                    "name": item.Nm_Product.trim(),
                    "description": "",
                    "uom": "PCS",
                    "components": [],
                    "tags": "",
                    "articleId": {},
                    "article": {
                        "realizationOrder": ro
                    },
                    "size": item.Size.trim(),
                    "domesticCOGS": item.Harga,
                    "domesticWholesale": 0,
                    "domesticRetail": 0,
                    "domesticSale": item.Harga1,
                    "internationalCOGS": 0,
                    "internationalWholesale": 0,
                    "internationalRetail": 0,
                    "internationalSale": 0,

                }

                itemArr.push(ItemMap);
                resolve(this.collection.insertMany(itemArr));

            // this.collection.insert(ItemMap, { ordered: false }).then((result) => {
            //     resolve(result);
            // });


        })
    }
}