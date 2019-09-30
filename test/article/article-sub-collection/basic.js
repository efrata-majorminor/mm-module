var options = {
    manager: require("../../../src/managers/master/article/article-sub-collection-manager"),
    model: require("mm-models").master.article.ArticleSubCollection,
    util: require("../../data-util/master/article/article-motif-data-util"),
    validator: require("mm-models").validator.master.article.articleSubCollection,
    createDuplicate: true,
    keys: ["code"]
};

var basicTest = require("../../basic-test-factory");
basicTest(options);