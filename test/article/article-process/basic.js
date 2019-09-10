var options = {
    manager: require("../../../src/managers/master/article/article-process-manager"),
    model: require("mm-models").master.article.ArticleProcess,
    util: require("../../data-util/master/article/article-process-data-util"),
    validator: require("mm-models").validator.master.article.articleProcess,
    createDuplicate: true,
    keys: ["code"]
};

var basicTest = require("../../basic-test-factory");
basicTest(options);