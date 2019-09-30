var options = {
    manager: require("../../../src/managers/master/article/article-season-manager"),
    model: require("mm-models").master.article.ArticleSeason,
    util: require("../../data-util/master/article/article-season-data-util"),
    validator: require("mm-models").validator.master.article.articleSeason,
    createDuplicate: true,
    keys: ["code"]
};

var basicTest = require("../../basic-test-factory");
basicTest(options);