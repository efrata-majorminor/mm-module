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
const DesignTrackingActivity = MmModels.manufacture.DesignTrackingActivity;
const moduleId = "MM-DTD";

module.exports = class DesignTrackingActivityManager extends BaseManager {
    constructor(db, user) {
        super(db, user);
        this.collection = this.db.use(map.manufacture.DesignTrackingActivity);
        this.designTrackingStageCollection = this.db.use(map.manufacture.DesignTrackingStage);
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
            let codeFilter = {
                "code": {
                    "$regex": regex
                }
            };
            keywordFilter["$or"] = [codeFilter];
        }
        query["$and"] = [_default, keywordFilter, pagingFilter];
        return query;
    }

    _beforeInsert(data) {
        data.code = generateCode(moduleId);
        return Promise.resolve(data);
    }

    _validate(designTrackingActivity) {
        let errors = {};
        let valid = designTrackingActivity;
        if (valid.type === "TASK") {
            var _dueDate = !valid.field.dueDate || valid.field.dueDate === '' ? undefined : moment(valid.field.dueDate);
        }

        if (!valid.type || valid.type === '' || !["ADD", "NOTES", "TASK", "MOVE"].find(t => t === valid.type))
            errors["type"] = "Type is invalid";
        else if (valid.type == "NOTES") {
            if (!valid.field.notes || valid.field.notes === '')
                errors["notes"] = "Notes is required";
        }
        else if (valid.type == "TASK") {
            if (!valid.field.title || valid.field.title === '')
                errors["title"] = "Title is required";

            if (!valid.field.assignedTo || valid.field.assignedTo === '')
                errors["assignedTo"] = "Assigned to is required";

            if (!valid.field.dueDate || valid.field.dueDate === '')
                errors["dueDate"] = "Due date is required";
            if (_dueDate) {
                if (_dueDate.isBefore(moment())) {
                    errors["dueDate"] = "Due date cannot be before now";
                }
            }
        }

        if (Object.getOwnPropertyNames(errors).length > 0) {
            let ValidationError = require('module-toolkit').ValidationError;
            return Promise.reject(new ValidationError('data does not pass validation', errors));
        }

        if (!valid.stamp) {
            valid = new DesignTrackingActivity(valid);
        }

        valid.stamp(this.user.username, "manager");
        return Promise.resolve(valid);
    }

    _createIndexes() {
        let dateIndex = {
            name: `ix_${map.manufacture.DesignTrackingActivity}__updatedDate`,
            key: {
                _updatedDate: -1
            }
        };

        let deletedIndex = {
            name: `ix_${map.manufacture.DesignTrackingActivity}__deleted`,
            key: {
                _deleted: 1
            }
        };

        return this.collection.createIndexes([dateIndex, deletedIndex]);
    }

    read(paging) {
        let _paging = {
            filter: { designId: new ObjectId(paging._id) },
            select: ["_createdDate", "_createdBy", "code", "type", "field.status", "field.title", "field.notes", "field.assignedTo", "field.dueDate", "field.sourceStageId", "field.targetStageId", "field.attachments"],
            page: paging.page ? paging.page : 1,
            size: paging.size ? paging.size : 20,
            order: paging.order ? paging.order : {}
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
                    .page(_paging.page, _paging.size)
                    .order(_paging.order)
                    .execute()
                    .then((result) => {
                        result.username = this.user.username;

                        let _filter = {
                            filter: { boardId: new ObjectId(paging.boardId) },
                            select: ["name"]
                        };

                        query = this._getQuery(_filter);
                        return this.designTrackingStageCollection
                            .where(query)
                            .select(_filter.select)
                            .execute()
                            .then((res) => {
                                let activity = result.data.map((data) => {
                                    if (data.type == "MOVE") {
                                        for (let stage of res.data) {
                                            if (stage._id.toString() == data.field.sourceStageId) {
                                                data.field.from = stage.name;
                                            }
                                            if (stage._id.toString() == data.field.targetStageId) {
                                                data.field.to = stage.name;
                                            }
                                        }
                                    }
                                    return data;
                                });

                                result.data = activity;

                                return Promise.resolve(result);
                            });
                    })
            });
    }

    update(data) {
        if (data.type == "Update Task Status") {
            let now = new Date();
            let ticks = ((now.getTime() * 10000) + 621355968000000000);

            let updateData = {
                'field.status': data.status,
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

    updateActivityAttachment(data) {
        let now = new Date();
        let ticks = ((now.getTime() * 10000) + 621355968000000000);

        let updateData = {
            'field.attachments': data.attachments,
            '_stamp': ticks.toString(16),
            '_updatedBy': this.user.username,
            '_updatedDate': now,
            '_updateAgent': 'manager'
        };

        return this.collection.findOneAndUpdate({ _id: new ObjectId(data._id) }, { $set: updateData });
    }
};