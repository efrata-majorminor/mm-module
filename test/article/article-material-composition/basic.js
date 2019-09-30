var options = {
    manager: require("../../../src/managers/master/article/article-material-composition-manager"),
    model: require("mm-models").master.article.ArticleMaterialComposition,
    util: require("../../data-util/master/article/article-material-composition-data-util"),
    validator: require("mm-models").validator.master.article.articleMaterialComposition,
    createDuplicate: true,
    keys: ["code"]
};

var basicTest = require("../../basic-test-factory");
basicTest(options);