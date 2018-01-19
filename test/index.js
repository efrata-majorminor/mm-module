function test(name, path) {
    describe(name, function () {
        require(path);
    })
}


describe('#bateeq-module', function (done) {
    this.timeout(2 * 60000);
    //auth
    test('@AUTH/ACCOUNT-MANAGER', './auth/account-manager-test');
    test('@AUTH/ROLE-MANAGER', './auth/role-manager-test');

    //master 
    test('@MANAGER/MASTER/ITEM-MANAGER', './managers/master/item-manager-test');
    test('@MANAGER/MASTER/MATERIAL-MANAGER', './managers/master/material-manager-test');
    test('@MANAGER/MASTER/FINISHED-GOODS-MANAGER', './managers/master/finished-goods-manager-test');
    test('@MANAGER/STORAGE-MANAGER', './managers/storage-manager-test');
    test('@MANAGER/STORE-MANAGER', './managers/store-manager-test');
    test('@MANAGER/SUPPLIER-MANAGER', './managers/supplier-manager-test');
    test('@MANAGER/INVENTORY-MANAGER', './managers/inventory-manager-test');
    test('@MANAGER/MODULE-MANAGER', './managers/module-manager-test');
    test('@MANAGER/BANK-MANAGER', './managers/bank-manager-test');
    test('@MANAGER/CARD-TYPE-MANAGER', './managers/card-type-manager-test');
    test('@MANAGER/PROMO-MANAGER', './managers/promo-manager-test');
    test('@MANAGER/RANGE-DISC-PRODUCT-MANAGER', './managers/range-disc-product-test');
    test('@MANAGER/DESIGN-TRACKING-REASON-MANAGER', './managers/master/design-tracking-reason');

    test('@ARTICLE/ARTICLE-MOTIF', './article/article-motif');
    test('@ARTICLE/ARTICLE-COUNTER', './article/article-counter');
    test('@ARTICLE/ARTICLE-SUB-COUNTER', './article/article-sub-counter');
    test('@ARTICLE/ARTICLE-SEASON', './article/article-season');
    test('@ARTICLE/ARTICLE-COLLECTION', './article/article-collection');
    test('@ARTICLE/ARTICLE-SUB-COLLECTION', './article/article-sub-collection');
    test('@ARTICLE/ARTICLE-MATERIAL', './article/article-material');
    test('@ARTICLE/ARTICLE-MATERIAL-COMPOSITION', './article/article-material-composition');
    test('@ARTICLE/ARTICLE-SUB-MATERIAL-COMPOSITION', './article/article-material-composition');
    test('@ARTICLE/ARTICLE-PROCESS', './article/article-process');
    test('@ARTICLE/ARTICLE-SUB-PROCESS', './article/article-sub-process');
    test('@ARTICLE/ARTICLE-CATEGORY', './article/article-category');

    //transaction
    test('@MANAGER/TRANSFER-IN-DOC-MANAGER', './managers/transfer-in-doc-manager-test');
    test('@MANAGER/TRANSFER-IN-STORE-BUSINESS', './business/store/transfer-in-store-business-test');
    test('@MANAGER/TRANSFER-OUT-DOC-MANAGER', './managers/transfer-out-doc-manager-test');
    test('@MANAGER/TRANSFER-IN-DOC-EXT-MANAGER', './managers/transfer-in-doc-ext-manager-test');
    test('@MANAGER/EFR-TB-BJR-MANAGER', './managers/efr-tb-bjr-manager-test');
    test('@MANAGER/EFR-TB-BRD-MANAGER', './managers/efr-tb-brd-manager-test');
    test('@MANAGER/EFR-TB-BRT-MANAGER', './managers/efr-tb-brt-manager-test');
    test('@MANAGER/SALES-MANAGER', './managers/sales-manager-test');
    test('@MANAGER/SALES-RETURN-MANAGER', './managers/sales-return-manager-test');
    test('@MANAGER/ADJUSTMENT-MANAGER', './managers/inventory/adjustment');
    test('@MANAGER/STOCK-OPNAME-MANAGER', './managers/inventory/stock-opname');

    //inventory
    test('@MANAGERS/INVENTORY/REPORT-MANAGER', './managers/inventory/report-manager');
    test('@MANAGER/MONTHLY-STOCK-MANAGER', './managers/inventory/monthly-stock-manager-test');

    // manufacture
    test('@MANAGERS/MANUFACTURE/DESIGN-TRACKING-BOARD-MANAGER', './managers/manufacture/design-tracking-board');
    test('@MANAGERS/MANUFACTURE/DESIGN-TRACKING-STAGE-MANAGER', './managers/manufacture/design-tracking-stage');
    test('@MANAGERS/MANUFACTURE/DESIGN-TRACKING-DESIGN-MANAGER', './managers/manufacture/design-tracking-design');
    test('@MANAGERS/MANUFACTURE/DESIGN-TRACKING-ACTIVITY-MANAGER', './managers/manufacture/design-tracking-activity');

    //Purchasing 
    test('@PURCHASING/PURCHASE REQUEST', './managers/purchasing/purchase-request');
    test('@PURCHASING/PURCHASE-ORDER', './managers/purchasing/purchase-order');
})