"use strict";
var _getSert = require("../../getsert");
var generateCode = require("../../../../src/utils/code-generator");

class ArticleCounterDataUtil {
    getSert(input) {
        var ManagerType = require("../../../../src/managers/master/article/article-counter-manager");
        return _getSert(input, ManagerType, (data) => {
            return {
                code: data.code
            };
        });
    }

    getNewData() {
        var Model = require('mm-models').master.article.ArticleCounter;
        var data = new Model();
        var code = generateCode();
        data.code = code;
        data.name = `name[${code}]`;
        data.description = `description[${code}]`;
        data.subCounters = [];
        return Promise.resolve(data);
    }

    getTestData() {
        var data = {
            code: "UT/Article-counter/01",
            name: "data 01",
            description: "description data 01",
            subCounters: []
        };
        return this.getSert(data);
    }
}
module.exports = new ArticleCounterDataUtil();