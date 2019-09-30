var options = {
    manager: require("../../../src/managers/master/article/article-category-manager"),
    model: require("mm-models").master.article.ArticleMaterial,
    util: require("../../data-util/master/article/article-category-data-util"),
    validator: require("mm-models").validator.master.article.articleMaterial,
    createDuplicate: true,
    keys: ["code"]
};

var basicTest = require("../../basic-test-factory");
basicTest(options);