'use strict'

// external dependencies
require("mongodb-toolkit");
const ObjectId = require("mongodb").ObjectId;
const BaseManager = require("module-toolkit").BaseManager;
const MmModels = require('mm-models');

// internal dependencies
const map = MmModels.map;
const generateCode = require("../../utils/code-generator");
const DesignTrackingStage = MmModels.manufacture.DesignTrackingStage;
const moduleId = "MM-DTS";

module.exports = class DesignTrackingStageManager extends BaseManager {
    constructor(db, user) {
        super(db, user);
        this.collection = this.db.use(map.manufacture.DesignTrackingStage);
        this.designTrackingDesignCollection = this.db.use(map.manufacture.DesignTrackingDesign);
    }

    _getQuery(paging) {
        let _default = {
            _deleted: false
        },
            pagingFilter = paging.filter || {},
            keywordFilter = {},
            query = {};

        if (paging.keyword) {
            let regex = new RegExp(paging.keyword, "i");
            let nameFilter = {
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

    _validate(designTrackingStage) {
        let errors = {};
        let valid = designTrackingStage;

        if (!valid.name || valid.name == "")
            errors['name'] = 'Name is required';

        if (Object.getOwnPropertyNames(errors).length > 0) {
            let ValidationError = require('module-toolkit').ValidationError;
            return Promise.reject(new ValidationError('data does not pass validation', errors));
        }

        if (!valid.stamp) {
            valid = new DesignTrackingStage(valid);
        }

        valid.stamp(this.user.username, "manager");
        return Promise.resolve(valid);
    }

    _createIndexes() {
        let dateIndex = {
            name: `ix_${map.manufacture.DesignTrackingDesign}__updatedDate`,
            key: {
                _updatedDate: -1
            }
        };

        let boardIdIndex = {
            name: `ix_${map.manufacture.DesignTrackingDesign}_boardId`,
            key: {
                boardId: -1
            }
        };

        let deletedIndex = {
            name: `ix_${map.manufacture.DesignTrackingDesign}__deleted`,
            key: {
                _deleted: 1
            }
        };

        return this.collection.createIndexes([dateIndex, deletedIndex, boardIdIndex]);
    }

    read(paging) {
        let _paging = {
            filter: { boardId: new ObjectId(paging._id) },
            select: ["code", "name", "designs"],
            order: { "_createdDate": "asc" }
        };

        if (paging.filter && Object.getOwnPropertyNames(paging.filter).length > 0) {
            _paging.filter = paging.filter;
        }

        return this._createIndexes()
            .then((createIndexResults) => {
                let query = this._getQuery(_paging);
                return this.collection
                    .where(query)
                    .select(_paging.select)
                    .order(_paging.order)
                    .execute()
                    .then((result) => {
                        let promises = result.data.map((data) => {
                            let designs = data.designs;

                            data.designs = designs.map((design) => {
                                design = ObjectId.isValid(design) ? new ObjectId(design) : null;
                                return design;
                            });

                            let _filter = {
                                filter: { _id: { "$in": data.designs } },
                                select: ["code", "name", "closeDate", "articleSeason.name", "articleCategory.name"]
                            };

                            query = this._getQuery(_filter);

                            return this.designTrackingDesignCollection
                                .where(query)
                                .select(_filter.select)
                                .execute()
                                .then((res) => {
                                    res.data.sort(function (a, b) {
                                        return designs.indexOf(a._id.toString()) - designs.indexOf(b._id.toString());
                                    });

                                    data.designs = res.data;
                                    return data;
                                })
                        });

                        return Promise.all(promises)
                            .then((res) => {
                                result.data = res;
                                return Promise.resolve(result);
                            })
                    });
            });
    }

    update(data) {
        if (data.type == "Activity") {
            let now = new Date();
            let ticks = ((now.getTime() * 10000) + 621355968000000000);

            let updateData = {
                'designs': data.designs,
                '_stamp': ticks.toString(16),
                '_updatedBy': this.user.username,
                '_updatedDate': now,
                '_updateAgent': 'manager'
            };

            return this.collection.findOneAndUpdate({ _id: new ObjectId(data._id) }, { $set: updateData });
        }
        else {
            return this._pre(data)
                .then((validData) => {
                    return this._beforeUpdate(validData);
                })
                .then((processedData) => {
                    return this.collection.update(processedData);
                })
                .then((id) => {
                    return this._afterUpdate(id);
                });
        }
    }
};