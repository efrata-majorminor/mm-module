'use strict'

// external dependencies
require("mongodb-toolkit");
const moment = require("moment");
const ObjectId = require("mongodb").ObjectId;
const BaseManager = require("module-toolkit").BaseManager;
const MmModels = require('mm-models');

// internal dependencies
const map = MmModels.map;
const generateCode = require("../../utils/code-generator");
const DesignTrackingDesign = MmModels.manufacture.DesignTrackingDesign;
const DesignerManager = require('../auth/account-manager');
const ArticleCategoryManager = require("../master/article/article-category-manager");
const ArticleCounterManager = require("../master/article/article-counter-manager");
const ArticleSeasonManager = require("../master/article/article-season-manager");
const ArticleMaterialCompositionManager = require("../master/article/article-material-composition-manager");
const ArticleSubCounterManager = require("../master/article/article-sub-counter-manager");
const ArticleMaterialManager = require("../master/article/article-material-manager");
const DesignTrackingStageManager = require('./design-tracking-stage-manager');
const DesignTrackingActivityManager = require('./design-tracking-activity-manager');
const moduleId = "MM-DTD";

module.exports = class DesignTrackingDesignManager extends BaseManager {
    constructor(db, user) {
        super(db, user);
        this.collection = this.db.use(map.manufacture.DesignTrackingDesign);
        this.designerManager = new DesignerManager(db, user);
        this.articleCategoryManager = new ArticleCategoryManager(db, user);
        this.articleCounterManager = new ArticleCounterManager(db, user);
        this.articleSeasonManager = new ArticleSeasonManager(db, user);
        this.articleMaterialCompositionManager = new ArticleMaterialCompositionManager(db, user);
        this.articleSubCounterManager = new ArticleSubCounterManager(db, user);
        this.articleMaterialManager = new ArticleMaterialManager(db, user);
        this.designTrackingStageManager = new DesignTrackingStageManager(db, user);
        this.designTrackingActivityManager = new DesignTrackingActivityManager(db, user);
    }

    _getQuery(paging) {
        var _default = {
            _deleted: false
        },
            pagingFilter = paging.filter || {},
            keywordFilter = {},
            query = {};

        if (paging.keyword) {
            var regex = new RegExp(paging.keyword, "i");
            var nameFilter = {
                "name": {
                    "$regex": regex
                }
            };
            keywordFilter["$or"] = [nameFilter];
        }
        query["$and"] = [_default, keywordFilter, pagingFilter];
        return query;
    }

    _beforeInsert(data) {
        data.code = generateCode(moduleId);
        return Promise.resolve(data);
    }

    _afterInsert(id) {
        return this.designTrackingStageManager.getSingleById(this.stageId, ["designs"])
            .then((result) => {
                result.designs.push(id.toString());
                result.type = "Activity";

                return this.designTrackingStageManager.update(result)
                    .then(() => {
                        let activityData = {
                            designId: id,
                            type: "ADD"
                        };

                        return this.designTrackingActivityManager.create(activityData)
                            .then(() => {
                                return Promise.resolve(id);
                            })
                    });
            });
    }

    _validate(designTrackingDesign) {
        let errors = {};
        let valid = designTrackingDesign;

        let getDesigner = valid.designer && ObjectId.isValid(valid.designer._id) ? this.designerManager.getSingleByIdOrDefault(valid.designer._id) : Promise.resolve(null);
        let getArticleCategory = valid.articleCategory && ObjectId.isValid(valid.articleCategory._id) ? this.articleCategoryManager.getSingleByIdOrDefault(valid.articleCategory._id) : Promise.resolve(null);
        let getArticleCounter = valid.articleCounter && ObjectId.isValid(valid.articleCounter._id) ? this.articleCounterManager.getSingleByIdOrDefault(valid.articleCounter._id) : Promise.resolve(null);
        let getArticleSeason = valid.articleSeason && ObjectId.isValid(valid.articleSeason._id) ? this.articleSeasonManager.getSingleByIdOrDefault(valid.articleSeason._id) : Promise.resolve(null);
        let getArticleMaterialComposition = valid.articleMaterialComposition && ObjectId.isValid(valid.articleMaterialComposition._id) ? this.articleMaterialCompositionManager.getSingleByIdOrDefault(valid.articleMaterialComposition._id) : Promise.resolve(null);
        let getArticleSubCounter = valid.articleSubCounter && ObjectId.isValid(valid.articleSubCounter._id) ? this.articleSubCounterManager.getSingleByIdOrDefault(valid.articleSubCounter._id) : Promise.resolve(null);
        let getArticleMaterial = valid.articleMaterial && ObjectId.isValid(valid.articleMaterial._id) ? this.articleMaterialManager.getSingleByIdOrDefault(valid.articleMaterial._id) : Promise.resolve(null);

        return Promise.all([getDesigner, getArticleCategory, getArticleCounter, getArticleSeason, getArticleMaterialComposition, getArticleSubCounter, getArticleMaterial])
            .then(results => {
                let _designer = results[0]
                let _articleCategory = results[1];
                let _articleCounter = results[2];
                let _articleSeason = results[3];
                let _articleMaterialComposition = results[4];
                let _articleSubCounter = results[5];
                let _articleMaterial = results[6];
                let _closeDate = !valid.closeDate || valid.closeDate === '' ? undefined : moment(valid.closeDate).startOf('day');

                if (!valid.name || valid.name == "")
                    errors['name'] = 'Name is required';

                if (!valid.designer)
                    errors['designer'] = 'Designer is required';
                else if (!_designer)
                    errors['designer'] = 'Designer is not found';

                if (!valid.articleCategory)
                    errors['articleCategory'] = 'Article category is required';
                else if (!_articleCategory)
                    errors['articleCategory'] = 'Article category is not found';

                if (!valid.articleCounter)
                    errors['articleCounter'] = 'Article counter is required';
                else if (!_articleCounter)
                    errors['articleCounter'] = 'Article counter is not found';

                if (!valid.articleSeason)
                    errors['articleSeason'] = 'Article season is required';
                else if (!_articleSeason)
                    errors['articleSeason'] = 'Article season is not found';

                if (!valid.articleMaterialComposition)
                    errors['articleMaterialComposition'] = 'Article material composition is required';
                else if (!_articleMaterialComposition)
                    errors['articleMaterialComposition'] = 'Article material composition is not found';

                if (!valid.articleSubCounter)
                    errors['articleSubCounter'] = 'Article sub counter is required';
                else if (!_articleSubCounter)
                    errors['articleSubCounter'] = 'Article sub counter is not found';

                if (!valid.articleMaterial)
                    errors['articleMaterial'] = 'Article material is required';
                else if (!_articleMaterial)
                    errors['articleMaterial'] = 'Article material is not found';

                if (!valid.closeDate || valid.closeDate == "")
                    errors["closeDate"] = "Close date is required";
                if (_closeDate) {
                    if (_closeDate.isBefore(moment().startOf('day'))) {
                        errors["closeDate"] = "Close date cannot be before today";
                    }
                }

                if (Object.getOwnPropertyNames(errors).length > 0) {
                    let ValidationError = require('module-toolkit').ValidationError;
                    return Promise.reject(new ValidationError('data does not pass validation', errors));
                }

                valid.designerId = new ObjectId(valid.designer._id);
                valid.articleCategoryId = new ObjectId(valid.articleCategory._id);
                valid.articleCounterId = new ObjectId(valid.articleCounter._id);
                valid.articleSeasonId = new ObjectId(valid.articleSeason._id);
                valid.articleMaterialCompositionId = new ObjectId(valid.articleMaterialComposition._id);
                valid.articleSubCounterId = new ObjectId(valid.articleSubCounter._id);
                valid.articleMaterialId = new ObjectId(valid.articleMaterial._id);
                this.stageId = valid.stageId;

                if (!valid.stamp) {
                    valid = new DesignTrackingDesign(valid);
                }

                valid.stamp(this.user.username, "manager");
                return Promise.resolve(valid);
            })
    }

    _createIndexes() {
        let dateIndex = {
            name: `ix_${map.manufacture.DesignTrackingDesign}__updatedDate`,
            key: {
                _updatedDate: -1
            }
        };

        let deletedIndex = {
            name: `ix_${map.manufacture.DesignTrackingDesign}__deleted`,
            key: {
                _deleted: 1
            }
        };

        return this.collection.createIndexes([dateIndex, deletedIndex]);
    }
};