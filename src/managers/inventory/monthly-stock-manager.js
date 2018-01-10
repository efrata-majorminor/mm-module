'use strict'

// Mongodb dependency
const ObjectId = require('mongodb').ObjectId;
require('mongodb-toolkit');
// Internal dependency
const BateeqModels = require('bateeq-models');
const map = BateeqModels.map;
// External dependency
const BaseManager = require('module-toolkit').BaseManager;
const moment = require('moment');

module.exports = class MonthlyStockManager extends BaseManager {
    constructor(db, user) {
        super(db, user);
        this.collection = this.db.use(map.inventory.InventoryMovement);
    }

    // GET START AND END YEAR BASED ON INVENTORY MOVEMENT
    _getFirstInventoryMovement() {
        return this.collection.find().sort({ date: 1 }).limit(1).toArray();
    }

    _getYearMonthsList(firstYear, lastYear, firstMonth, lastMonth) {
        let yearMonths = [];
        for (let i = firstYear; i <= lastYear; i++) {
            let each = this.__pushMonthBasedOnYear(i, firstYear, lastYear, firstMonth, lastMonth);
            yearMonths.push(each);
        }
        yearMonths.sort(function (a, b) { return b.year - a.year });
        return yearMonths;
    }

    __pushMonthBasedOnYear(currentYear, firstYear, lastYear, firstMonth, lastMonth) {
        let currentYearList = { year: currentYear, months: [] };
        if (currentYear === firstYear) {
            if (currentYear === lastYear) {
                for (let j = firstMonth; j <= lastMonth; j++) {
                    let currentMonth = this.__getMonthName(j);
                    currentYearList.months.push(currentMonth);
                }
            }
            else {
                for (let j = firstMonth; j <= 11; j++) {
                    let currentMonth = this.__getMonthName(j);
                    currentYearList.months.push(currentMonth);
                }
            }
        }
        else {
            if (currentYear === lastYear) {
                for (let j = 0; j <= lastMonth; j++) {
                    let currentMonth = this.__getMonthName(j);
                    currentYearList.months.push(currentMonth);
                }
            }
            else {
                for (let j = 0; j <= 11; j++) {
                    let currentMonth = this.__getMonthName(j);
                    currentYearList.months.push(currentMonth);
                }
            }

        }
        return currentYearList;
    }

    __getMonthName(monthNumber) {
        switch (monthNumber) {
            case 0:
                return { id: 0, name: "Januari" };
            case 1:
                return { id: 1, name: "Februari" };
            case 2:
                return { id: 2, name: "Maret" };
            case 3:
                return { id: 3, name: "April" };
            case 4:
                return { id: 4, name: "Mei" };
            case 5:
                return { id: 5, name: "Juni" };
            case 6:
                return { id: 6, name: "Juli" };
            case 7:
                return { id: 7, name: "Agustus" };
            case 8:
                return { id: 8, name: "September" };
            case 9:
                return { id: 9, name: "Oktober" };
            case 10:
                return { id: 10, name: "November" };
            case 11:
                return { id: 11, name: "Desember" };
        }
    }

    getYearMonthList() {
        let firstIM = this._getFirstInventoryMovement();
        let now = moment();
        return new Promise((resolve, reject) => {
            firstIM
                .then(results => {
                    let firstYear = results[0].date.getFullYear();
                    let firstMonth = results[0].date.getMonth();
                    let lastYear = parseInt(now.format('YYYY'));
                    let lastMonth = parseInt(now.format('MM')) - 1;
                    let yearMonthList = this._getYearMonthsList(firstYear, lastYear, firstMonth, lastMonth);
                    resolve(yearMonthList);
                })
        })
    }
    //

    // GET LOCALE TIME IN JAKARTA
    __getLocaleDateOfMonth(year, month, isStartOf) {
        let locale = isStartOf ? moment().month(month).year(year).startOf('month') : moment().month(month).year(year).endOf('month');
        return locale;
    }

    _setDateOfMonth(month, year) {
        let firstDay = this.__getLocaleDateOfMonth(year, month, true).format();
        let lastDay = this.__getLocaleDateOfMonth(year, month, false).format();
        return {
            firstDay: new Date(firstDay),
            lastDay: new Date(lastDay)
        }
    }
    //

    // GET INVENTORY ON PARTICULAR MONTH -> INVENTORY WITH MOVEMENT (END OF THE MONTH AND BEFORE EARLY OF THE MONTH)
    _getCurrentStocks(day) {
        let currentStocks = [
            { $match: { date: { $lte: day } } },
            { $sort: { date: -1 } },
            {
                $group: {
                    _id: { storageCode: "$storage.code", itemCode: "$item.code" },
                    storageName: { $first: "$storage.name" },
                    quantity: { $first: "$after" },
                    hpp: { $first: { $cond: { if: { $ne: ["$item.domesticCOGS", 0] }, then: "$item.domesticCOGS", else: "$item.internationalCOGS" } } },
                    sale: { $first: { $cond: { if: { $ne: ["$item.domesticSale", 0] }, then: "$item.domesticSale", else: "$item.internationalSale" } } }
                }
            },
            {
                $project: {
                    _id: 1,
                    storageName: "$storageName",
                    quantity: "$quantity",
                    hpp: { $multiply: ["$quantity", "$hpp"] },
                    sale: { $multiply: ["$quantity", "$sale"] }
                }
            },
            {
                $group: {
                    _id: { storageCode: "$_id.storageCode" },
                    storageName: { $first: "$storageName" },
                    quantity: { $sum: "$quantity" },
                    hpp: { $sum: "$hpp" },
                    sale: { $sum: "$sale" }
                }
            }
        ]
        let query = this.collection.aggregate(currentStocks).toArray();
        return query;
    }

    _combineStocks(earliest, latest) {
        let allStocks = [];
        console.log(earliest);
        console.log(latest);
        latest.forEach(ls => {
            let stock = {
                code: ls._id.storageCode,
                name: ls.storageName,
                latestQuantity: ls.quantity,
                latestHPP: ls.hpp,
                latestSale: ls.sale
            };
            let found = earliest.find(es => { return es._id.storageCode === ls._id.storageCode });
            if (found) {
                stock.earliestQuantity = found.quantity;
                stock.earliestHPP = found.hpp;
                stock.earliestSale = found.sale;
            }
            else {
                stock.earliestQuantity = 0;
                stock.earliestHPP = 0;
                stock.earliestSale = 0;
            }
            allStocks.push(stock);
        })
        return allStocks;
    }

    getOverallStock(month, year) {
        let date = this._setDateOfMonth(month, year);
        let earliestStocksQuery = this._getCurrentStocks(date.firstDay);
        let latestStocksQuery = this._getCurrentStocks(date.lastDay);
        return new Promise((resolve, reject) => {
            return Promise.all([earliestStocksQuery, latestStocksQuery])
                .then(results => {
                    let earliestStocks = results[0];
                    let latestStocks = results[1];
                    let finalStocks = this._combineStocks(earliestStocks, latestStocks);
                    resolve(finalStocks);
                })
        })
    }
    //

    // GET LATEST ITEM WITH PARTICULAR MONTH AND STORAGE CODE
    _getCurrentItems(code, day) {
        let currentItems = [
            {
                $match: {
                    date: { $lte: day },
                    "storage.code": code
                }
            },
            { $sort: { date: -1 } },
            {
                $group: {
                    _id: { itemCode: "$item.code" },
                    itemName: { $first: "$item.name" },
                    quantity: { $first: "$after" },
                    hpp: { $first: { $cond: { if: { $ne: ["$item.domesticCOGS", 0] }, then: "$item.domesticCOGS", else: "$item.internationalCOGS" } } },
                    sale: { $first: { $cond: { if: { $ne: ["$item.domesticSale", 0] }, then: "$item.domesticSale", else: "$item.internationalSale" } } }
                }
            },
            {
                $project: {
                    itemCode: "$_id.itemCode",
                    itemName: "$itemName",
                    quantity: "$quantity",
                    totalHPP: { $multiply: ["$quantity", "$hpp"] },
                    totalSale: { $multiply: ["$quantity", "$sale"] }
                }
            },
            { $match: { quantity: { $ne: 0 } } }
        ]
        let query = this.collection.aggregate(currentItems).toArray();
        return query;
    }

    getStockInStorage(storageCode, month, year) {
        let date = this._setDateOfMonth(month, year);
        let latestItemsQuery = this._getCurrentItems(storageCode, date.lastDay);
        return new Promise((resolve, reject) => {
            return latestItemsQuery
                .then(latestItems => {
                    resolve(latestItems);
                })
        })
    }
    //
}