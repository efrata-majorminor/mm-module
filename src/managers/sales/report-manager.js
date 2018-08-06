'use strict';

// external deps 
const moment = require("moment");
var ObjectId = require('mongodb').ObjectId;

var BaseManager = require('module-toolkit').BaseManager;
var BateeqModels = require('bateeq-models');
var Sales = BateeqModels.sales.Sales;

var map = BateeqModels.map;

module.exports = class ReportManager extends BaseManager {
    constructor(db, user) {
        super(db, user);
        this.collection = this.db.use(map.sales.SalesDoc);
    }

    dailyStoreSales(dateFrom, dateTo, skip, limit) {
        var aggregate = [
            {
                "$match": {
                    date: {
                        $gte: new Date(moment(dateFrom).startOf("day")),
                        $lte: new Date(moment(dateTo).endOf("day"))
                    },
                    'isVoid': false
                }
            }, {
                "$project": {
                    _id: 0, items: {
                        $filter: {
                            input: "$items",
                            as: "item",
                            cond: { $and: [{ $not: ["$$item.isReturn"] }, true] }
                        }
                    }, store: 1
                }
            }, {
                "$unwind": "$items"
            }, {
                "$lookup":
                {
                    from: "migration-excluded-items",
                    localField: "items.item.code",
                    foreignField: "code",
                    as: "embalase"
                }
            },
            {
                "$match": {
                    "embalase": { $eq: [] }
                }
            },
            {
                "$group": {
                    _id: { "code": "$store.code" },
                    store: { "$first": "$store" },
                    quantity: { "$sum": "$items.quantity" },
                    items: { "$push": "$items" }
                }
            }, {
                "$sort": {
                    "quantity": -1
                }
            }, { "$skip": parseInt(skip || 0) }, { "$limit": parseInt(limit || 0) }
        ]

        return this.collection.aggregate(aggregate);
    }

    dailyStoreSalesQuery(dateFrom, dateTo) {
        var aggregate =
            [
                {
                    "$match": {
                        date: {
                            $gte: new Date(moment(dateFrom).startOf("day")),
                            $lte: new Date(moment(dateTo).endOf("day"))
                        },
                        'isVoid': false
                    }
                }, {
                    "$project": {
                        _id: 0, items: {
                            $filter: {
                                input: "$items",
                                as: "item",
                                cond: { $and: [{ $not: ["$$item.isReturn"] }, true] }
                            }
                        }, store: 1
                    }
                }, {
                    "$unwind": "$items"
                }, {
                    "$lookup":
                    {
                        from: "migration-excluded-items",
                        localField: "items.item.code",
                        foreignField: "code",
                        as: "embalase"
                    }
                },
                {
                    "$match": {
                        "embalase": { $eq: [] }
                    }
                },
                {
                    "$group": {
                        _id: { "code": "$store.code" }
                    }
                }, {
                    "$sort": {
                        "quantity": -1
                    }
                },
                { $group: { _id: null, total: { $sum: 1 } } }
            ];
        return this.collection.aggregate(aggregate);
    }

    productsReport(dateFrom, dateTo, skip, limit) {
        var aggregate =
            [
                {
                    "$match": {
                        date: {
                            $gte: new Date(moment(dateFrom).startOf("day")),
                            $lte: new Date(moment(dateTo).endOf("day"))
                        },
                        'isVoid': false
                    }
                }, {
                    "$project": {
                        _id: 0, items: {
                            $filter: {
                                input: "$items",
                                as: "item",
                                cond: {
                                    $and: [
                                        { $not: ["$$item.isReturn"] }
                                    ]
                                }
                            }
                        }, store: 1
                    }
                }, {
                    "$unwind": "$items"
                },
                {
                    "$lookup":
                    {
                        from: "items",
                        localField: "items.item._id",
                        foreignField: "_id",
                        as: "masterItem"
                    }
                }, {
                    "$lookup":
                    {
                        from: "migration-excluded-items",
                        localField: "items.item.code",
                        foreignField: "code",
                        as: "embalase"
                    }
                },
                {
                    "$match": {
                        "embalase": { $eq: [] }
                    }
                }
                , {
                    "$group": {
                        _id: { "code": "$masterItem._id" },
                        quantity: { "$sum": "$items.quantity" },
                        masterItem: { "$first": "$masterItem" },
                        stores: {
                            "$push": {
                                store: "$store",
                                quantity: "$items.quantity"
                            }
                        }
                    }
                }, {
                    "$sort": {
                        "quantity": -1
                    }
                }, { "$skip": parseInt(skip || 0) }, { "$limit": parseInt(limit || 0) }
            ];
        return this.collection.aggregate(aggregate);
    }

    productsReportQuery(dateFrom, dateTo) {
        var aggregate =
            [
                {
                    "$match": {
                        date: {
                            $gte: new Date(moment(dateFrom).startOf("day")),
                            $lte: new Date(moment(dateTo).endOf("day"))
                        },
                        'isVoid': false
                    }
                }, {
                    "$project": {
                        _id: 0, items: {
                            $filter: {
                                input: "$items",
                                as: "item",
                                cond: {
                                    $and: [
                                        { $not: ["$$item.isReturn"] }
                                    ]
                                }
                            }
                        }, store: 1
                    }
                }, {
                    "$unwind": "$items"
                },
                {
                    "$lookup":
                    {
                        from: "items",
                        localField: "items.item._id",
                        foreignField: "_id",
                        as: "masterItem"
                    }
                }, {
                    "$lookup":
                    {
                        from: "migration-excluded-items",
                        localField: "items.item.code",
                        foreignField: "code",
                        as: "embalase"
                    }
                },
                {
                    "$match": {
                        "embalase": { $eq: [] }
                    }
                }
                , {
                    "$group": {
                        _id: { "code": "$masterItem._id" },
                        quantity: { "$sum": "$items.quantity" },
                        masterItem: { "$first": "$masterItem" },
                        stores: {
                            "$push": {
                                store: "$store",
                                quantity: "$items.quantity"
                            }
                        }
                    }
                }, {
                    "$sort": {
                        "quantity": -1
                    }
                },
                { $group: { _id: null, total: { $sum: 1 } } }
            ];
        return this.collection.aggregate(aggregate);
    }

    productsReportByProductID(dateFrom, dateTo, productId) {
        var aggregate =
            [
                {
                    "$match": {
                        date: {
                            $gte: new Date(moment(dateFrom).startOf("day")),
                            $lte: new Date(moment(dateTo).endOf("day"))
                        },
                        'isVoid': false
                    }
                }, {
                    "$project": {
                        _id: 0, items: {
                            $filter: {
                                input: "$items",
                                as: "item",
                                cond: {
                                    $and: [
                                        { $not: ["$$item.isReturn"] },
                                        { $eq: ["$$item.item._id", ObjectId(productId)] }
                                    ]
                                }
                            }
                        }, store: 1
                    }
                }, {
                    "$unwind": "$items"
                },
                {
                    "$lookup":
                    {
                        from: "items",
                        localField: "items.item._id",
                        foreignField: "_id",
                        as: "masterItem"
                    }
                }
                , {
                    "$group": {
                        _id: { "code": "$store._id" },
                        quantity: { "$sum": "$items.quantity" },
                        store: { "$first": "$store" },
                        masterItem: { "$first": "$masterItem" },
                        stores: {
                            "$push": {
                                store: "$store",
                                quantity: "$items.quantity"
                            }
                        }
                    }
                }, {
                    "$sort": {
                        "quantity": -1
                    }
                }
            ];
        return this.collection.aggregate(aggregate);
    }

}
