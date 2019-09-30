"use strict";
var _getSert = require("../../getsert");
var generateCode = require("../../../../src/utils/code-generator");

class ArticleCollectionDataUtil {
    getSert(input) {
        var ManagerType = require("../../../../src/managers/master/article/article-collection-manager");
        return _getSert(input, ManagerType, (data) => {
            return {
                code: data.code
            };
        });
    }

    getNewData() {
        var Model = require('mm-models').master.article.ArticleCollection;
        var data = new Model();
        var code = generateCode();
        data.code = code;
        data.name = `name[${code}]`;
        data.description = `description[${code}]`;
        data.subCollections = [];
        return Promise.resolve(data);
    }

    getTestData() {
        var data = {
            code: "UT/Article-Collection/01",
            name: "data 01",
            description: "description data 01",
            subCollections: []
        };
        return this.getSert(data);
    }
}
module.exports = new ArticleCollectionDataUtil();