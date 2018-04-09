var inventoryMap = new Map();
inventoryMap.set("transfer-in-doc-ext", require('./src/managers/inventory/transfer-in-doc-ext-manager'));
inventoryMap.set("transfer-in-doc", require('./src/managers/inventory/transfer-in-doc-manager'));
inventoryMap.set("transfer-out-doc", require('./src/managers/inventory/transfer-out-doc-manager'));
inventoryMap.set("inventory", require('./src/managers/inventory/inventory-manager'));
inventoryMap.set("inventory-movement", require('./src/managers/inventory/inventory-movement-manager'));

inventoryMap.set("efr-kb-rtt", require('./src/managers/inventory/efr-kb-rtt-manager'));
inventoryMap.set("adjustment", require('./src/managers/inventory/adjustment-manager'));
inventoryMap.set("efr-kb-fng", require('./src/managers/inventory/efr-kb-fng-manager'));
inventoryMap.set("efr-kb-rtf", require('./src/managers/inventory/efr-kb-rtf-manager'));
inventoryMap.set("efr-kb-rtp", require('./src/managers/inventory/efr-kb-rtp-manager'));
inventoryMap.set("efr-kb-rtu", require('./src/managers/inventory/efr-kb-rtu-manager'));
inventoryMap.set("efr-kb-rtd", require('./src/managers/inventory/efr-kb-rtd-manager'));
inventoryMap.set("efr-kb-exb", require('./src/managers/inventory/efr-kb-exb-manager'));
inventoryMap.set("efr-kb-exp", require('./src/managers/inventory/efr-kb-exp-manager'));
inventoryMap.set("efr-kb-alt", require('./src/managers/inventory/efr-kb-alt-manager'));
inventoryMap.set("efr-tb-act", require('./src/managers/inventory/efr-tb-act-manager'));
inventoryMap.set("efr-tb-bat", require('./src/managers/inventory/efr-tb-bat-manager'));
inventoryMap.set("efr-tb-bbp", require('./src/managers/inventory/efr-tb-bbp-manager'));
inventoryMap.set("efr-tb-bbt", require('./src/managers/inventory/efr-tb-bbt-manager'));
inventoryMap.set("efr-tb-bjb", require('./src/managers/inventory/efr-tb-bjb-manager'));
inventoryMap.set("efr-tb-bjr", require('./src/managers/inventory/efr-tb-bjr-manager'));
inventoryMap.set("efr-tb-brd", require('./src/managers/inventory/efr-tb-brd-manager'));
inventoryMap.set("efr-tb-brt", require('./src/managers/inventory/efr-tb-brt-manager'));
inventoryMap.set("efr-tb-sab", require('./src/managers/inventory/efr-tb-sab-manager'));
inventoryMap.set("efr-tb-alt", require('./src/managers/inventory/efr-tb-alt-manager'));
inventoryMap.set("efr-hp-fng", require('./src/managers/inventory/efr-hp-fng-manager'));
inventoryMap.set("inv-ro-report", require('./src/managers/inventory/inv-ro-report-manager'));
inventoryMap.set("stock-opname-doc", require('./src/managers/inventory/stock-opname-doc-manager'));
inventoryMap.set("stock-availability", require('./src/managers/inventory/stock-availability-manager'));
inventoryMap.set("report-manager", require('./src/managers/inventory/report-manager'));
inventoryMap.set("monthly-stock", require('./src/managers/inventory/monthly-stock-manager'));
inventoryMap.set("master-discount", require('./src/managers/inventory/master/discount-manager'));

var merchandiserMap = new Map();
merchandiserMap.set("efr-pk", require('./src/managers/merchandiser/efr-pk-manager'));
merchandiserMap.set("efr-pk-pbj", require('./src/managers/merchandiser/efr-pk-pbj-manager'));
merchandiserMap.set("efr-pk-pbr", require('./src/managers/merchandiser/efr-pk-pbr-manager'));
merchandiserMap.set("efr-pk-pba", require('./src/managers/merchandiser/efr-pk-pba-manager'));

module.exports = {
    auth: {
        AccountManager: require("./src/managers/auth/account-manager"),
        RoleManager: require("./src/managers/auth/role-manager")
    },
    inventory: {
        master : {
            DiscountManager : inventoryMap.get("master-discount")
        },
        TransferInDocManager: inventoryMap.get("transfer-in-doc"),
        TransferOutDocManager: inventoryMap.get("transfer-out-doc"),
        InventoryManager: inventoryMap.get("inventory"),
        InventoryMovementManager: inventoryMap.get("inventory-movement"),
        FinishedGoodsManager: inventoryMap.get("efr-hp-fng"),
        ExpeditionsManager: inventoryMap.get("efr-kb-exp"),
        AlterationOutManager: inventoryMap.get("efr-kb-alt"),
        AlterationInManager: inventoryMap.get("efr-tb-alt"),
        TokoTransferStokManager: inventoryMap.get("efr-kb-rtt"),
        AdjustmentStockManager: inventoryMap.get("adjustment"),
        FinishingKirimBarangBaruManager: inventoryMap.get("efr-kb-fng"),
        PusatReturTokoKirimBarangReturManager: inventoryMap.get("efr-kb-rtf"),
        TokoKirimBarangReturnManager: inventoryMap.get("efr-kb-rtp"),
        ReturnKeUnitManager: inventoryMap.get("efr-kb-rtu"),
        FinishingKirimBarangReturSelesaiPerbaikanManager: inventoryMap.get("efr-kb-rtd"),
        FinishingTerimaAksesorisManager: inventoryMap.get("efr-tb-acc"),
        TokoTerimaAksesorisManager: inventoryMap.get("efr-tb-bat"),
        TokoTerimaBarangBaruManager: inventoryMap.get("efr-tb-bbt"),
        PusatTerimaBarangBaruManager: inventoryMap.get("efr-tb-bbp"),
        PusatBarangBaruTerimaBarangBaruManager: inventoryMap.get("efr-tb-bjb"),
        FinishingTerimaBarangReturManager: inventoryMap.get("efr-tb-bjr"),
        PusatReturTokoTerimaBarangReturSelesaiPerbaikanManager: inventoryMap.get("efr-tb-brd"),
        PusatReturTokoTerimaBarangReturManager: inventoryMap.get("efr-tb-brt"),
        FinishingTerimaKomponenManager: inventoryMap.get("efr-tb-sab"),
        TransferInDocExtManager: inventoryMap.get("transfer-in-doc-ext"),
        StockOpnameDocManager: inventoryMap.get("stock-opname-doc"),
        StockAvailabilityManager: inventoryMap.get("stock-availability"),
        ReportManager: inventoryMap.get("report-manager"),
        MonthlyStockManager: inventoryMap.get("monthly-stock"),
        map: inventoryMap
    },
    merchandiser: {
        SPKManager: require('./src/managers/merchandiser/efr-pk-manager'),
        SPKBarangJadiManager: require('./src/managers/merchandiser/efr-pk-pbj-manager'),
        SPKBarangEmbalaseManager: require('./src/managers/merchandiser/efr-pk-pba-manager'),
        SPKBarangJadiReturManager: require('./src/managers/merchandiser/efr-pk-pbr-manager'),
        map: merchandiserMap
    },
    master: {
        ModuleManager: require('./src/managers/master/module-manager'),
        UnitManager: require('./src/managers/master/unit-manager'),
        BankManager: require('./src/managers/master/bank-manager'),
        CardTypeManager: require('./src/managers/master/card-type-manager'),
        StoreManager: require('./src/managers/master/store-manager'),
        ItemManager: require('./src/managers/master/item-manager'),
        SupplierManager: require('./src/managers/master/supplier-manager'),
        StorageManager: require('./src/managers/master/storage-manager'),
        FinishedGoodsManager: require('./src/managers/master/finished-goods-manager'),
        MaterialManager: require('./src/managers/master/material-manager'),
        RangeDiscProductManager: require('./src/managers/master/range-disc-product-manager'),

        article: {
            ArticleMotifManager: require('./src/managers/master/article/article-motif-manager'),
            ArticleColorManager: require('./src/managers/master/article/article-color-manager'),
            ArticleCounterManager: require('./src/managers/master/article/article-counter-manager'),
            ArticleSubCounterManager: require('./src/managers/master/article/article-sub-counter-manager'),
            ArticleSeasonManager: require('./src/managers/master/article/article-season-manager'),
            ArticleMaterialManager: require('./src/managers/master/article/article-material-manager'),
            ArticleMaterialCompositionManager: require('./src/managers/master/article/article-material-composition-manager'),
            ArticleSubMaterialCompositionManager: require('./src/managers/master/article/article-sub-material-composition-manager'),
            ArticleCollectionManager: require('./src/managers/master/article/article-collection-manager'),
            ArticleSubCollectionManager: require('./src/managers/master/article/article-sub-collection-manager'),
            ArticleProcessManager: require('./src/managers/master/article/article-process-manager'),
            ArticleSubProcessManager: require('./src/managers/master/article/article-sub-process-manager'),
            ArticleCategoryManager: require('./src/managers/master/article/article-category-manager'),
            ArticleTypeManager: require('./src/managers/master/article/article-type-manager')
        },
        ExpeditionServiceManager: require('./src/managers/master/expedition-service-manager'),
        DesignTrackingReasonManager: require('./src/managers/master/design-tracking-reason-manager'),
        BudgetManager: require('./src/managers/master/budget-manager'),
        CategoryManager: require('./src/managers/master/category-manager'),
        CurrencyManager: require('./src/managers/master/currency-manager'),
        ProductManager: require('./src/managers/master/product-manager'),
        UomManager: require('./src/managers/master/uom-manager'),
        VatManager: require('./src/managers/master/vat-manager'),
        DivisionManager: require('./src/managers/master/division-manager')
    },
    sales: {
        SalesManager: require('./src/managers/sales/sales-manager'),
        SalesReturnManager: require('./src/managers/sales/sales-return-manager'),
        PromoManager: require('./src/managers/sales/promo-manager'),
        SalesReportManager: require('./src/managers/sales/report-manager')
    },

    etl: {
        itemsMigration: require('./src/etl/items-etl'),
        itemsSpMigration: require('./src/etl/sp-items-etl'),
        items: require('./src/etl/items-migration-etl'),
        storesMigration: require('./src/etl/stores-migration-etl'),
        storagesMigration: require('./src/etl/storages-migration-etl'),
        salesMigration: require('./src/etl/sales-etl'),
        salesSpMigration: require('./src/etl/sp-sales-etl'),
        factPenjualan: require('./src/etl/fact-penjualan'),
        factPenjualanSummary: require('./src/etl/fact-penjualan-summary'),
        dimBranch: require('./src/etl/dim-branch'),
        dimTime: require('./src/etl/dim-time'),
        updateProductFactPenjualan: require('./src/etl/update-product-fact-penjualan')
    },

    manufacture: {
        DesignTrackingBoardManager: require('./src/managers/manufacture/design-tracking-board-manager'),
        DesignTrackingStageManager: require('./src/managers/manufacture/design-tracking-stage-manager'),
        DesignTrackingDesignManager: require('./src/managers/manufacture/design-tracking-design-manager'),
        DesignTrackingActivityManager: require('./src/managers/manufacture/design-tracking-activity-manager')
    },

    purchasing: {
        PurchasingRequestManager: require('./src/managers/purchasing/purchase-request-manager'),
        PurchasingOrderManager: require('./src/managers/purchasing/purchase-order-manager'),
        PurchasingOrderExternalManager: require('./src/managers/purchasing/purchase-order-external-manager'),
        DeliveryOrderManager: require('./src/managers/purchasing/delivery-order-manager'),
        UnitReceiptNoteManager: require('./src/managers/purchasing/unit-receipt-note-manager'),
        UnitPaymentOrderManager: require('./src/managers/purchasing/unit-payment-order-manager')
    }

}