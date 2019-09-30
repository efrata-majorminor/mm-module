'use strict';

// external deps 
var ObjectId = require('mongodb').ObjectId;

// internal deps
require('mongodb-toolkit');
var MmModels = require('mm-models');
var map = MmModels.map;
var ArticleSubMaterialComposition = MmModels.master.article.ArticleSubMaterialComposition;
var BaseManager = require('module-toolkit').BaseManager;

module.exports = class ArticleSubMaterialCompositionManager extends BaseManager {
    constructor(db, user) {
        super(db, user);
        this.collection = this.db.use(map.master.article.ArticleSubMaterialComposition);
    }

    _getQuery(paging) {
        var _default = {
            _deleted: false,
            _active: true
        },
            pagingFilter = paging.filter || {},
            keywordFilter = {},
            query = {};

        if (paging.keyword) {
            var regex = new RegExp(paging.keyword, "i");
            var codeFilter = {
                'code': {
                    '$regex': regex
                }
            };
            var nameFilter = {
                'name': {
                    '$regex': regex
                }
            };
            keywordFilter['$or'] = [codeFilter, nameFilter];
        }
        query["$and"] = [_default, keywordFilter, pagingFilter];
        return query;
    }

    _validate(articleSubMaterialComposition) {
        var errors = {};
        return new Promise((resolve, reject) => {
            var valid = articleSubMaterialComposition;
            //1.begin: Declare promises.
            var getArticleSubMaterialComposition = this.collection.singleOrDefault({
                "$and": [{
                    _id: {
                        '$ne': new ObjectId(valid._id)
                    }
                }, {
                    code: valid.code
                }]
            });
            //1. end:Declare promises.

            //2.begin: Validation 
            Promise.all([getArticleSubMaterialComposition])
                .then(results => {
                    var _articleSubMaterialComposition = results[0];

                    if (!valid.code || valid.code == '')
                        errors["code"] = "code is required";
                    else if (_articleSubMaterialComposition) {
                        errors["code"] = "code already exists";
                    }

                    if (!valid.name || valid.name == '')
                        errors["name"] = "name is required";

                    // 2a. begin: check if data has any error, reject if it has.
                    for (var prop in errors) {
                        var ValidationError = require('module-toolkit').ValidationError;
                        reject(new ValidationError('data does not pass validation', errors));
                    }
                    valid = new ArticleSubMaterialComposition(articleSubMaterialComposition);
                    valid._active = true;
                    valid.stamp(this.user.username, 'manager');
                    resolve(valid);
                })
                .catch(e => {
                    reject(e);
                })
        });
    }

    _createIndexes() {
        var dateIndex = {
            name: `ix_${map.master.article.ArticleSubMaterialComposition}__updatedDate`,
            key: {
                _updatedDate: -1
            }
        };

        var codeIndex = {
            name: `ix_${map.master.article.ArticleSubMaterialComposition}_code`,
            key: {
                code: 1
            },
            unique: true
        };

        return this.collection.createIndexes([dateIndex, codeIndex]);
    }
};