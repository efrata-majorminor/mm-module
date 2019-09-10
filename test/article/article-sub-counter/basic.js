var options = {
    manager: require("../../../src/managers/master/article/article-sub-counter-manager"),
    model: require("mm-models").master.article.ArticleSubCounter,
    util: require("../../data-util/master/article/article-sub-counter-data-util"),
    validator: require("mm-models").validator.master.article.articleSubCounter,
    createDuplicate: true,
    keys: ["code"]
};

var basicTest = require("../../basic-test-factory");
basicTest(options);