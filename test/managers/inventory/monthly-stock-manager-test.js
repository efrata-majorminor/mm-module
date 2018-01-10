"use strict";

// dependency
var helper = require('../../helper');
var should = require('should');
let manager;

// hardcoded data
let firstMonth = 5;
let lastMonth = 9;
let firstMonthOfYear = 0;
let lastMonthOfYear = 11;
let localeMonth = 8;
let localeYear = 2017;
let stockDate;

// Unit test
before('#00. connect db', function (done) {
    helper.getDb()
        .then(db => {
            var MonthlyStockManager = require('../../../src/managers/inventory/monthly-stock-manager');
            manager = new MonthlyStockManager(db, {
                username: 'unit-test'
            });
            done();
        })
        .catch(e => {
            done(e);
        })
});

it("#01. should success when get first inventory movement", function (done) {
    manager._getFirstInventoryMovement()
        .then(data => {
            data.should.be.Array();
            done();
        })
        .catch(e => {
            done(e);
        });
});

it("#02. should success when get year and month list of inventory", function (done) {
    manager.getYearMonthList()
        .then(data => {
            data.should.be.Array();
            done();
        })
        .catch(e => {
            done(e);
        });
});

it("#03. should success when get month's name", function (done) {
    let monthIndex = 3;
    try {
        let data = manager.__getMonthName(monthIndex);
        data.id.should.equal(monthIndex);
        data.should.be.Object();
        done();
    }
    catch (e) {
        done(e);
    }
});

it("#04. should success when get year and it's month list", function (done) {
    let firstYear = 2015, lastYear = 2017;
    try {
        let data = manager._getYearMonthsList(firstYear, lastYear, firstMonth, lastMonth);
        data.should.be.Array();
        data[data.length - 1].year.should.equal(firstYear);
        data[0].year.should.equal(lastYear);
        data[data.length - 1].months[0].id.should.equal(firstMonth);
        data[0].months[data[0].months.length - 1].id.should.equal(lastMonth);
        done();
    }
    catch (e) {
        done(e);
    }
});

it("#05. should success when push month based on year with current year === first year and current year === last year", function (done) {
    let currentYear = 2017, firstYear = 2017, lastYear = 2017;
    try {
        let data = manager.__pushMonthBasedOnYear(currentYear, firstYear, lastYear, firstMonth, lastMonth);
        data.should.be.Object();
        data.year.should.equal(currentYear);
        data.year.should.equal(firstYear);
        data.year.should.equal(lastYear);
        data.months[0].id.should.equal(firstMonth);
        data.months[data.months.length - 1].id.should.equal(lastMonth);
        done();
    }
    catch (e) {
        done(e);
    }
});

it("#06. should success when push month based on year with current year === first year and current year !== last year", function (done) {
    let currentYear = 2016, firstYear = 2016, lastYear = 2017;
    try {
        let data = manager.__pushMonthBasedOnYear(currentYear, firstYear, lastYear, firstMonth, lastMonth);
        data.should.be.Object();
        data.year.should.equal(currentYear);
        data.year.should.equal(firstYear);
        data.year.should.not.equal(lastYear);
        data.months[0].id.should.equal(firstMonth);
        data.months[data.months.length - 1].id.should.equal(lastMonthOfYear);
        data.months[data.months.length - 1].id.should.not.equal(lastMonth);
        done();
    }
    catch (e) {
        done(e);
    }
});

it("#07. should success when push month based on year with current year !== first year and current year === last year", function (done) {
    let currentYear = 2017, firstYear = 2016, lastYear = 2017;
    try {
        let data = manager.__pushMonthBasedOnYear(currentYear, firstYear, lastYear, firstMonth, lastMonth);
        data.should.be.Object();
        data.year.should.equal(currentYear);
        data.year.should.not.equal(firstYear);
        data.year.should.equal(lastYear);
        data.months[0].id.should.equal(firstMonthOfYear);
        data.months[0].id.should.not.equal(firstMonth);
        data.months[data.months.length - 1].id.should.equal(lastMonth);
        done();
    }
    catch (e) {
        done(e);
    }
});

it("#08. should success when push month based on year with current year !== first year and current year !== last year", function (done) {
    let currentYear = 2016, firstYear = 2015, lastYear = 2017;
    try {
        let data = manager.__pushMonthBasedOnYear(currentYear, firstYear, lastYear, firstMonth, lastMonth);
        data.should.be.Object();
        data.year.should.equal(currentYear);
        data.year.should.not.equal(firstYear);
        data.year.should.not.equal(lastYear);
        data.months[0].id.should.equal(firstMonthOfYear);
        data.months[0].id.should.not.equal(firstMonth);
        data.months[data.months.length - 1].id.should.equal(lastMonthOfYear);
        data.months[data.months.length - 1].id.should.not.equal(lastMonth);
        done();
    }
    catch (e) {
        done(e);
    }
});

it("#09. should success when get first locale date of the month", function (done) {
    try {
        let data = manager.__getLocaleDateOfMonth(localeYear, localeMonth, true);
        data.should.be.Object();
        data.date().should.equal(1);
        data.month().should.equal(localeMonth);
        data.year().should.equal(localeYear);
        done();
    }
    catch (e) {
        done(e);
    }
});

it("#10. should success when get last locale date of the month", function (done) {
    try {
        let data = manager.__getLocaleDateOfMonth(localeYear, localeMonth, false);
        data.should.be.Object();
        data.month().should.equal(localeMonth);
        data.year().should.equal(localeYear);
        done();
    }
    catch (e) {
        done(e);
    }
});

it("#11. should success when get first and last locale date of the month", function (done) {
    try {
        stockDate = manager._setDateOfMonth(localeMonth, localeYear);
        stockDate.should.be.Object();
        done();
    }
    catch (e) {
        done(e);
    }
});

var earliestStocks = [
    {
        _id: { storageCode: 'ST-BJB' },
        storageName: 'Pusat - Finished Goods[UT]',
        quantity: 12967,
        hpp: NaN,
        sale: NaN
    },
    {
        _id: { storageCode: 'UT-FNG' },
        storageName: 'Finishing[UT]',
        quantity: 1225,
        hpp: NaN,
        sale: NaN
    }
];
it("#12. should success when get earliest current stocks of particular month", function (done) {
    manager._getCurrentStocks(stockDate.firstDay)
        .then(data => {
            data.should.be.Array();
            data.forEach(stock => {
                stock._id.should.have.property('storageCode');
                stock._id.storageCode.should.instanceOf(String);
                stock.should.have.property('storageName');
                stock.storageName.should.instanceOf(String);
                stock.should.have.property('quantity');
                stock.quantity.should.be.Number();
                stock.should.have.property('hpp');
                stock.hpp.should.be.Number();
                stock.should.have.property('sale');
                stock.sale.should.be.Number();
            })
            done();
        })
        .catch(e => {
            done(e);
        });
});

var latestStocks = [
    {
        _id: { storageCode: 'UT-ACC' },
        storageName: 'Accessories[UT]',
        quantity: 20,
        hpp: NaN,
        sale: NaN
    },
    {
        _id: { storageCode: 'UT-BJB' },
        storageName: 'Pusat - Finished Goods[UT]',
        quantity: 1315,
        hpp: NaN,
        sale: NaN
    },
    {
        _id: { storageCode: 'ST-BJB' },
        storageName: 'Pusat - Finished Goods[UT]',
        quantity: 12967,
        hpp: NaN,
        sale: NaN
    },
    {
        _id: { storageCode: 'UT-FNG' },
        storageName: 'Finishing[UT]',
        quantity: 1225,
        hpp: NaN,
        sale: NaN
    }
];
it("#13. should success when get latest current stocks of particular month", function (done) {
    manager._getCurrentStocks(stockDate.lastDay)
        .then(data => {
            data.should.be.Array();
            data.forEach(stock => {
                stock._id.should.have.property('storageCode');
                stock._id.storageCode.should.instanceOf(String);
                stock.should.have.property('storageName');
                stock.storageName.should.instanceOf(String);
                stock.should.have.property('quantity');
                stock.quantity.should.be.Number();
                stock.should.have.property('hpp');
                stock.hpp.should.be.Number();
                stock.should.have.property('sale');
                stock.sale.should.be.Number();
            })
            done();
        })
        .catch(e => {
            done(e);
        });
});

it("#14. should success when get combine earliest and latest stock of particular month with similar early and latest stocks", function (done) {
    try {
        let data = manager._combineStocks(earliestStocks, latestStocks);
        data.should.be.Array();
        data.forEach(stock => {
            stock.should.have.property('code');
            stock.code.should.instanceOf(String);
            stock.should.have.property('name');
            stock.name.should.instanceOf(String);
            stock.should.have.property('earliestQuantity');
            stock.earliestQuantity.should.be.Number();
            stock.should.have.property('earliestHPP');
            stock.earliestHPP.should.be.Number();
            stock.should.have.property('earliestSale');
            stock.earliestSale.should.be.Number();
            stock.should.have.property('latestQuantity');
            stock.latestQuantity.should.be.Number();
            stock.should.have.property('latestHPP');
            stock.latestHPP.should.be.Number();
            stock.should.have.property('latestSale');
            stock.latestSale.should.be.Number();
        })
        done();
    }
    catch (e) {
        done(e);
    }
});

it("#15. should success when get overall stock particular month", function (done) {
    manager.getOverallStock(localeMonth, localeYear)
        .then(data => {
            data.should.be.Array();
            data.forEach(stock => {
                stock.should.have.property('code');
                stock.code.should.instanceOf(String);
                stock.should.have.property('name');
                stock.name.should.instanceOf(String);
                stock.should.have.property('earliestQuantity');
                stock.earliestQuantity.should.be.Number();
                stock.should.have.property('earliestHPP');
                stock.earliestHPP.should.be.Number();
                stock.should.have.property('earliestSale');
                stock.earliestSale.should.be.Number();
                stock.should.have.property('latestQuantity');
                stock.latestQuantity.should.be.Number();
                stock.should.have.property('latestHPP');
                stock.latestHPP.should.be.Number();
                stock.should.have.property('latestSale');
                stock.latestSale.should.be.Number();
            })
            done();
        })
        .catch(e => {
            done(e);
        });
});

it("#16. should success when get latest current items of particular month", function (done) {
    manager._getCurrentItems('UT-BJB', stockDate.lastDay)
        .then(data => {
            data.should.be.Array();
            data.forEach(item => {
                item.should.have.property('itemCode');
                item.itemCode.should.instanceOf(String);
                item.should.have.property('itemName');
                item.itemName.should.instanceOf(String);
                item.should.have.property('quantity');
                item.quantity.should.be.Number();
                item.should.have.property('totalHPP');
                item.totalHPP.should.be.Number();
                item.should.have.property('totalSale');
                item.totalSale.should.be.Number();
            })
            done();
        })
        .catch(e => {
            done(e);
        });
});

it("#17. should success when get all items on particular month based on storage", function (done) {
    manager.getStockInStorage('UT-BJB', localeMonth, localeYear)
        .then(data => {
            data.should.be.Array();
            data.forEach(item => {
                item.should.have.property('itemCode');
                item.itemCode.should.instanceOf(String);
                item.should.have.property('itemName');
                item.itemName.should.instanceOf(String);
                item.should.have.property('quantity');
                item.quantity.should.be.Number();
                item.should.have.property('totalHPP');
                item.totalHPP.should.be.Number();
                item.should.have.property('totalSale');
                item.totalSale.should.be.Number();
            })
            done();
        })
        .catch(e => {
            done(e);
        });
});