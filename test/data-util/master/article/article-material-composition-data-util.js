"use strict";
var _getSert = require("../../getsert");
var generateCode = require("../../../../src/utils/code-generator");

class ArticleMaterialCompositionDataUtil {
    getSert(input) {
        var ManagerType = require("../../../../src/managers/master/article/article-material-composition-manager");
        return _getSert(input, ManagerType, (data) => {
            return {
                code: data.code
            };
        });
    }

    getNewData() {
        var Model = require('mm-models').master.article.ArticleMaterialComposition;
        var data = new Model();
        var code = generateCode();
        data.code = code;
        data.name = `name[${code}]`;
        data.description = `description[${code}]`;
        data.subMaterialCompositions = [];
        return Promise.resolve(data);
    }

    getTestData() {
        var data = {
            code: "UT/Article-Material-Composition/01",
            name: "data 01",
            description: "description data 01",
            subMaterialCompositions: []
        };
        return this.getSert(data);
    }
}
module.exports = new ArticleMaterialCompositionDataUtil();