'use strict'

// external dependencies
require("mongodb-toolkit");
const ObjectId = require("mongodb").ObjectId;
const BaseManager = require("module-toolkit").BaseManager;
const MmModels = require('mm-models');

// internal dependencies
const map = MmModels.map;
const generateCode = require("../../utils/code-generator");
const DesignTrackingReason = MmModels.master.DesignTrackingReason;
const moduleId = "MM-DTR";

module.exports = class DesignTrackingReasonManager extends BaseManager {
    constructor(db, user) {
        super(db, user);
        this.collection = this.db.use(map.master.DesignTrackingReason);
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
            let reasonFilter = {
                "reason": {
                    "$regex": regex
                }
            };
            keywordFilter["$or"] = [reasonFilter];
        }
        query["$and"] = [_default, keywordFilter, pagingFilter];
        return query;
    }

    _beforeInsert(data) {
        data.code = generateCode(moduleId);
        return Promise.resolve(data);
    }

    _validate(designTrackingReason) {
        let errors = {};
        let valid = designTrackingReason;

        if (!valid.reason || valid.reason === "")
            errors['reason'] = 'Reason is required';

        if (Object.getOwnPropertyNames(errors).length > 0) {
            let ValidationError = require('module-toolkit').ValidationError;
            return Promise.reject(new ValidationError('data does not pass validation', errors));
        }

        if (!valid.stamp) {
            valid = new DesignTrackingReason(valid);
        }

        valid.stamp(this.user.username, "manager");
        return Promise.resolve(valid);
    }

    _createIndexes() {
        let dateIndex = {
            name: `ix_${map.master.DesignTrackingReason}__updatedDate`,
            key: {
                _updatedDate: -1
            }
        };

        let deletedIndex = {
            name: `ix_${map.master.DesignTrackingReason}__deleted`,
            key: {
                _deleted: 1
            }
        };

        return this.collection.createIndexes([dateIndex, deletedIndex]);
    }

    read(paging) {
        let _paging = Object.assign({
            select: ["reason"],
            order: { "_createdDate": "asc" }
        }, paging);

        return this._createIndexes()
            .then((createIndexResults) => {
                let query = this._getQuery(_paging);
                return this.collection
                    .where(query)
                    .select(_paging.select)
                    .order(_paging.order)
                    .execute();
            });
    }
};