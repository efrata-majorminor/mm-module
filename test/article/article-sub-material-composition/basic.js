var options = {
    manager: require("../../../src/managers/master/article/article-sub-material-composition-manager"),
    model: require("mm-models").master.article.ArticleSubMaterialComposition,
    util: require("../../data-util/master/article/article-sub-material-composition-data-util"),
    validator: require("mm-models").validator.master.article.articleSubMaterialComposition,
    createDuplicate: true,
    keys: ["code"]
};

var basicTest = require("../../basic-test-factory");
basicTest(options);