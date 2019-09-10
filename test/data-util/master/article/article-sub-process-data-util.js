"use strict";
var _getSert = require("../../getsert");
var generateCode = require("../../../../src/utils/code-generator");

class ArticleSubProcessDataUtil {
    getSert(input) {
        var ManagerType = require("../../../../src/managers/master/article/article-sub-process-manager");
        return _getSert(input, ManagerType, (data) => {
            return {
                code: data.code
            };
        });
    }

    getNewData() {
        var Model = require('mm-models').master.article.ArticleSubProcess;
        var data = new Model();
        var code = generateCode();
        data.code = code;
        data.name = `name[${code}]`;
        data.description = `description[${code}]`; 
        return Promise.resolve(data);
    }

    getTestData() {
        var data = {
            code: "UT/Article-Sub-Process/01",
            name: "data 01",
            description: "description data 01",
            filePath: "filePath data 01"
        };
        return this.getSert(data);
    }
}
module.exports = new ArticleSubProcessDataUtil();