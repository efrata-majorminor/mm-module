'use strict'

var ObjectId = require("mongodb").ObjectId;
require("mongodb-toolkit");
var MmModels = require('mm-models');
var map = MmModels.map;
var Account = MmModels.auth.Account;
var BaseManager = require('module-toolkit').BaseManager;
var sha1 = require("sha1");
const moment = require('moment');

module.exports = class AccountManager extends BaseManager {
    constructor(db, user) {
        super(db, user);
        this.collection = this.db.use(map.auth.collection.Account);
    }

    _createIndexes() {
        var dateIndex = {
            name: `ix_${map.auth.collection.Account}__updatedDate`,
            key: {
                _updatedDate: -1
            }
        };

        var usernameIndex = {
            name: `ix_${map.auth.collection.Account}_username`,
            key: {
                username: 1
            },
            unique: true
        };

        return this.collection.createIndexes([dateIndex, usernameIndex]);
    }

    _beforeInsert(data) {
        data.password = sha1(data.password);
        return Promise.resolve(data);
    }

    _beforeUpdate(data) {
        if (data.password !== "")
            data.password = sha1(data.password);
        else
            delete data.password;
        return Promise.resolve(data);
    }

    authenticate(username, password) {
        return new Promise((resolve, reject) => {
            if (username === '')
                resolve(null);
            var query = {
                username: username,
                password: sha1(password),
                _deleted: false
            };
            this.getSingleByQuery(query)
                .then(account => {
                    delete account.password;
                    resolve(account);
                })
                .catch(e => {
                    reject(e);
                });
        });
    }

    _getQuery(paging) {
        var basicFilter = {
            _deleted: false
        }, keywordFilter = {};

        var query = {};

        if (paging.keyword) {
            var regex = new RegExp(paging.keyword, "i");

            var filterUsername = {
                'username': {
                    '$regex': regex
                }
            };
            var filterFirstName = {
                'profile.firstname': {
                    '$regex': regex
                }
            };
            var filterLastName = {
                'profile.lastname': {
                    '$regex': regex
                }
            };

            keywordFilter = {
                '$or': [filterUsername, filterFirstName, filterLastName]
            };
        }
        query = { '$and': [basicFilter, paging.filter, keywordFilter] };
        return query;
    }

    validateEmail(email) {
        let pattern = /^(([^<>()[\]\\.,;:\s@\"]+(\.[^<>()[\]\\.,;:\s@\"]+)*)|(\".+\"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
        return pattern.test(email);
    }

    uniqueInArray(array) {
        let unique = [];
        array.filter(function (each) {
            var i = unique.findIndex(u => u._id === each._id);
            if (i <= -1)
                unique.push(each);
        });
        return unique;
    }

    _validate(account) {
        var errors = {};
        return new Promise((resolve, reject) => {
            var valid = account;
            // 1. begin: Declare promises.
            var getAccountPromise = this.collection.singleOrDefault({
                "$and": [{
                    _id: {
                        '$ne': new ObjectId(valid._id)
                    }
                }, {
                    username: valid.username
                }]
            });

            let emailFormat = this.validateEmail(valid.profile.email);
            valid.roles = this.uniqueInArray(valid.roles);
            valid.stores = this.uniqueInArray(valid.stores);

            // 2. begin: Validation.
            Promise.all([getAccountPromise])
                .then(results => {
                    var _module = results[0];

                    if (!valid.username || valid.username == '')
                        errors["username"] = "Username harus diisi";
                    else if (_module) {
                        errors["username"] = "Username sudah ada";
                    }

                    if (!valid._id && (!valid.password || valid.password == ''))
                        errors["password"] = "Password harus diisi";
                    else if (valid.confirmPassword !== valid.password)
                        errors["confirmPassword"] = "Input tidak sesuai dengan password yang telah diisi";

                    if (!valid.profile)
                        errors["profile"] = "Profile harus diisi";
                    else {
                        var profileError = {};

                        if (!valid.profile.firstname || valid.profile.firstname == '')
                            profileError["firstname"] = "First name harus diisi";

                        if (!valid.profile.email || valid.profile.email == '')
                            profileError["email"] = "Email harus diisi";
                        else if (!emailFormat)
                            profileError["email"] = "Format email tidak tepat";

                        let _dob = !valid.profile.dob || valid.profile.dob == '' ? null : moment(valid.profile.dob);

                        if (!valid.profile.dob || valid.profile.dob == '')
                            profileError["dob"] = "Birth Date harus diisi";
                        else if (_dob !== null) {
                            if (_dob.isAfter(moment())) {
                                profileError["dob"] = "Birth Date tidak boleh melebihi hari ini";
                            }
                        }

                        if (!valid.profile.gender || valid.profile.gender == '')
                            profileError["gender"] = "Gender harus diisi";

                        if (Object.getOwnPropertyNames(profileError).length > 0)
                            errors["profile"] = profileError;
                    }

                    // 2c. begin: check if data has any error, reject if it has.
                    if (Object.getOwnPropertyNames(errors).length > 0) {
                        var ValidationError = require('module-toolkit').ValidationError;
                        reject(new ValidationError('data does not pass validation', errors));
                    }

                    if (!valid.stamp) {
                        valid = new Account(valid);
                    }

                    valid.stamp(this.user.username, "manager");
                    resolve(valid);
                })
                .catch(e => {
                    reject(e);
                });
        });
    }
};