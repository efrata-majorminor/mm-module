var options = {
    manager: require("../../../src/managers/master/article/article-motif-manager"),
    model: require("mm-models").master.article.ArticleMotif,
    util: require("../../data-util/master/article/article-motif-data-util"),
    validator: require("mm-models").validator.master.article.articleMotif,
    createDuplicate: true,
    keys: ["code"]
};

var basicTest = require("../../basic-test-factory");
basicTest(options);