"use strict";
var _getSert = require("../../getsert");
var generateCode = require("../../../../src/utils/code-generator");

class ArticleProcessDataUtil {
    getSert(input) {
        var ManagerType = require("../../../../src/managers/master/article/article-process-manager");
        return _getSert(input, ManagerType, (data) => {
            return {
                code: data.code
            };
        });
    }

    getNewData() {
        var Model = require('mm-models').master.article.ArticleProcess;
        var data = new Model();
        var code = generateCode();
        data.code = code;
        data.name = `name[${code}]`;
        data.description = `description[${code}]`;
        data.subProcess = [];
        return Promise.resolve(data);
    }

    getTestData() {
        var data = {
            code: "UT/Article-Process/01",
            name: "data 01",
            description: "description data 01",
            subProcess: []
        };
        return this.getSert(data);
    }
}
module.exports = new ArticleProcessDataUtil();