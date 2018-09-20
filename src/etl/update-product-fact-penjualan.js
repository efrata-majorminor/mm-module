'use strict'

// external deps 
var ObjectId = require("mongodb").ObjectId;
var BaseManager = require('module-toolkit').BaseManager;
var moment = require("moment");

var ItemManager = require('../../src/managers/master/item-manager');

// internal deps 
require('mongodb-toolkit');
const migrationName = "ETL-Update-Produk-Fact-Penjualan";

module.exports = class UpdateProductFactPenjualan {
    constructor(db, user, sql) {
        this.db = db;
        this.sql = sql;
        this.ItemManager = new ItemManager(db, user);
        this.migrationLog = db.collection("migration.log");
    }

    run() {
        var startedDate = new Date();
        return new Promise((resolve, reject) => {
            //get last etl date
            this.lastETLDate().then(lastMigration => {

                this.migrationLog.insert({
                    migration: migrationName,
                    _start: startedDate,
                    _createdDate: startedDate
                });

                //extract
                this.extract(lastMigration._createdDate).then(data => {
                    var exctractDate = new Date();
                    console.log("extract :" + moment(exctractDate).diff(moment(startedDate), "minutes") + " minutes");

                    //transform
                    this.transform(data).then(transformData => {
                        var transformDate = new Date();
                        console.log("transform :" + moment(transformDate).diff(moment(exctractDate), "minutes") + " minutes");

                        //load
                        this.load(transformData).then(result => {
                            var finishedDate = new Date();
                            var spentTime = moment(finishedDate).diff(moment(startedDate), "minutes");
                            console.log("load :" + spentTime + " minutes");

                            var updateLog = {
                                migration: migrationName,
                                _start: startedDate,
                                _createdDate: startedDate,
                                _end: finishedDate,
                                executionTime: spentTime + " minutes",
                                status: "success",
                                summary: {
                                    extract: moment(exctractDate).diff(moment(startedDate), "minutes") + " minutes",
                                    transform: moment(transformDate).diff(moment(exctractDate), "minutes") + " minutes",
                                    load: moment(finishedDate).diff(moment(transformDate), "minutes") + " minutes",
                                    items: `${result.count} items`
                                }
                            };
                            this.migrationLog.updateOne({ _createdDate: startedDate }, updateLog);
                            resolve(result);
                        }).catch((err) => {
                            var finishedDate = new Date();
                            var spentTime = moment(finishedDate).diff(moment(startedDate), "minutes");
                            var updateLog = {
                                migration: migrationName,
                                _start: startedDate,
                                _createdDate: startedDate,
                                _end: finishedDate,
                                executionTime: spentTime + " minutes",
                                status: err
                            };
                            this.migrationLog.updateOne({ _createdDate: startedDate }, updateLog);
                            console.log(err);
                            reject(err);
                        });
                    }).catch((err) => {
                        var finishedDate = new Date();
                        var spentTime = moment(finishedDate).diff(moment(startedDate), "minutes");
                        var updateLog = {
                            migration: migrationName,
                            _start: startedDate,
                            _createdDate: startedDate,
                            _end: finishedDate,
                            executionTime: spentTime + " minutes",
                            status: err
                        };
                        this.migrationLog.updateOne({ _createdDate: startedDate }, updateLog);
                        console.log(err);
                        reject(err);
                    });
                }).catch((err) => {
                    var finishedDate = new Date();
                    var spentTime = moment(finishedDate).diff(moment(startedDate), "minutes");
                    var updateLog = {
                        migration: migrationName,
                        _start: startedDate,
                        _createdDate: startedDate,
                        _end: finishedDate,
                        executionTime: spentTime + " minutes",
                        status: err
                    };
                    this.migrationLog.updateOne({ _createdDate: startedDate }, updateLog);
                    console.log(err);
                    reject(err);
                });
            });
        });
    };

    lastETLDate() {
        return new Promise((resolve, reject) => {
            this.migrationLog.find({ "migration": migrationName, status: "success" }).sort({ "_createdDate": -1 }).limit(1).toArray()
                .then((result) => {
                    resolve(result[0] || { _createdDate: new Date("1970-01-01") });
                }).catch((err) => {
                    reject(err);
                });
        });
    }

    extract(date) {
        var timestamp = date || new Date("1970-01-01");
        return this.ItemManager.collection.find({
            _deleted: false,
            _updatedDate: {
                "$gt": new Date(timestamp)
            }
        }).toArray();
    };

    getDBValidString(str) {
        if (str) {
            if ((typeof str) == "string")
                return str.split("'").join("''")
            else
                return str
        }
        else {
            if ((typeof str) == "number")
                return "0";
            else
                return ""
        }
    }

    transform(data) {
        return new Promise((resolve, reject) => {
            var result = data.map((item) => {
                return {
                    dt_id: `'${this.getDBValidString(item._id.toString())}'`,
                    dt_code: `'${this.getDBValidString(item.code)}'`,
                    dt_ro_number: `'${this.getDBValidString(item.article ? item.article.realizationOrder : null)}'`,
                    //dt_ro_name: `'${this.getDBValidString(item.article ? item.article.realizationOrderName : null)}'`,
                    dt_image_path: `'${this.getDBValidString(item.imagePath ? this.replaceUrl(item.imagePath, item._id.toString()) : null)}'`,
                    //dt_motif_path: `'${this.getDBValidString(item.motifPath ? this.replaceMotif(item.motifPath, item._id.toString()) : null)}'`,
                    dt_counter_name: `'${this.getDBValidString(item.counterDoc ? item.counterDoc.name : null)}'`,
                    dt_subcounter_name: `'${this.getDBValidString(item.styleDoc ? item.styleDoc.name : null)}'`,
                    dt_size_name: `'${this.getDBValidString(item.size ? item.size : null)}'`,
                    dt_process_name: `'${this.getDBValidString(item.processDoc ? item.processDoc.name : null)}'`,
                    dt_material_name: `'${this.getDBValidString(item.materialDoc ? item.materialDoc.name : null)}'`,
                    dt_material_composition_name: `'${this.getDBValidString(item.materialCompositionDoc ? item.materialCompositionDoc.name : null)}'`,
                    dt_color_code: `'${this.getDBValidString(item.colorCode ? item.colorCode : null)}'`,
                    dt_color_name: `'${this.getDBValidString(item.colorDoc ? item.colorDoc.name : null)}'`,
                    //dt_motif_name: `'${this.getDBValidString(item.motifDoc ? item.motifDoc.name : null)}'`,
                    dt_collection_name: `'${this.getDBValidString(item.collectionDoc ? item.collectionDoc.name : null)}'`,
                    dt_season_name: `'${this.getDBValidString(item.seasonDoc ? item.seasonDoc.name : null)}'`,
                    dt_category_name: `'${this.getDBValidString(item.categoryDoc ? item.categoryDoc.name : null)}'`
                }
            });
            resolve([].concat.apply([], result));
        });
    }

    replaceUrl(path, id) {
        var templatePath = "https://bateeq-core-api.azurewebsites.net/v1/master/items/finished-goods/image";
        return path.replace(path, templatePath + "/" + id);
    }

    replaceMotif(path, id) {
        var templatePath = "https://bateeq-core-api.azurewebsites.net/v1/master/items/finished-goods/motif-image";
        return path.replace(path, templatePath + "/" + id);
    }

    insertQuery(sql, query) {
        return new Promise((resolve, reject) => {
            sql.query(query, function (err, result) {
                if (err) {
                    resolve({ "status": "error", "error": err });
                } else {
                    resolve({ "status": "success" });
                }
            })
        })
    }

    load(data) {
        return new Promise((resolve, reject) => {
            this.sql.startConnection()
                .then(() => {
                    var transaction = this.sql.transaction();
                    transaction.begin((err) => {

                        var request = this.sql.transactionRequest(transaction);

                        var command = [];

                        var sqlQuery = '';

                        var count = 0;

                        for (var item of data) {
                            if (item) {
                                count++;
                                var queryString = `INSERT INTO [BTQ_UpdateItem_Temp] ([dt_id], [dt_code], [dt_ro_number], [dt_image_path], [dt_process_name], [dt_material_composition_name], [dt_color_code], [dt_color_name], [dt_collection_name], [dt_season_name], [dt_counter_name], [dt_subcounter_name], [dt_size_name], [dt_material_name], [dt_category_name]) values(${item.dt_id}, ${item.dt_code}, ${item.dt_ro_number}, ${item.dt_image_path}, ${item.dt_process_name}, ${item.dt_material_composition_name}, ${item.dt_color_code}, ${item.dt_color_name}, ${item.dt_collection_name}, ${item.dt_season_name},${item.dt_counter_name}, ${item.dt_subcounter_name}, ${item.dt_size_name}, ${item.dt_material_name}, ${item.dt_category_name})\n`;
                                sqlQuery = sqlQuery.concat(queryString);
                                if (count % 1000 == 0) {
                                    command.push(this.insertQuery(request, sqlQuery));
                                    sqlQuery = "";
                                }
                            }
                        }

                        if (sqlQuery != "") {
                            command.push(this.insertQuery(request, `${sqlQuery}`));
                        }
                        request.multiple = true;

                        // var fs = require("fs");
                        // var path = "C:\\Users\\daniel.nababan.MOONLAY\\Desktop\\sqlQuery.txt";

                        // fs.writeFile(path, allSqlQuery, function (error) {
                        //     if (error) {
                        //         console.log("write error:  " + error.message);
                        //     } else {
                        //         console.log("Successful Write to " + path);
                        //     }
                        // });

                        return Promise.all(command)
                            .then((results) => {
                                if (results.find((o) => o.status == "error")) {
                                    transaction.rollback((err) => {
                                        if (err)
                                            reject(err)
                                        else
                                            reject(results);
                                    });
                                } else {
                                    request.execute("BTQ_Upsert_Product").then((execResult) => {
                                        transaction.commit((err) => {
                                            if (err)
                                                reject(err);
                                            else
                                                resolve({ "results": results, "count": count });
                                        });
                                    }).catch((error) => {
                                        transaction.rollback((err) => {
                                            if (err)
                                                reject(err)
                                            else
                                                reject(error);
                                        });
                                    })
                                }

                            }).catch((error) => {
                                transaction.rollback((err) => {
                                    console.log("rollback");
                                    if (err)
                                        reject(err)
                                    else
                                        reject(error);
                                });
                            });
                    });

                }).catch((err) => {
                    reject(err);
                });
        });
    }
}