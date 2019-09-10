var options = {
    manager: require("../../../src/managers/master/article/article-collection-manager"),
    model: require("mm-models").master.article.ArticleCollection,
    util: require("../../data-util/master/article/article-collection-data-util"),
    validator: require("mm-models").validator.master.article.articleCollection,
    createDuplicate: true,
    keys: ["code"]
};

var basicTest = require("../../basic-test-factory");
basicTest(options);