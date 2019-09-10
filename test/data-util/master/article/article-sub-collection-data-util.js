"use strict";
var _getSert = require("../../getsert");
var generateCode = require("../../../../src/utils/code-generator");

class ArticleSubCollectionDataUtil {
    getSert(input) {
        var ManagerType = require("../../../../src/managers/master/article/article-sub-collection-manager");
        return _getSert(input, ManagerType, (data) => {
            return {
                code: data.code
            };
        });
    }

    getNewData() {
        var Model = require('mm-models').master.article.ArticleSubCollection;
        var data = new Model();
        var code = generateCode();
        data.code = code;
        data.name = `name[${code}]`;
        data.description = `description[${code}]`;
        return Promise.resolve(data);
    }

    getTestData() {
        var data = {
            code: "UT/Article-Sub-Collection/01",
            name: "data 01",
            description: "description data 01"
        };
        return this.getSert(data);
    }
}
module.exports = new ArticleSubCollectionDataUtil();