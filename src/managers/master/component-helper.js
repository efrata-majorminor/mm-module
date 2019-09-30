'use strict';

var Item = require('mm-models').master.Item;
var Material = require('mm-models').master.Material;
var FinishedGoods = require('mm-models').master.FinishedGoods;

var Component = require('mm-models').master.Component;

var ObjectId = require('mongodb').ObjectId;
var Hashids = require("hashids");

// var ItemManager = require('./item-manager');
module.exports = class ComponentHelper {
    constructor(itemManager) {
        // this.db = db;
        this.itemManager = itemManager;
    }
    generateCode() {
        var salt = new ObjectId().toString();

        var hashids = new Hashids(salt, 8, "ABCDEFGHIJKLMNOPQRSTUVWXYZ1234567890");
        var code = `${hashids.encode(new Date().getTime())}`;

        return code;

    }
    validate(components) {
        var result = {
            components: []
        };
        var errors = {};

        return new Promise((resolve, reject) => {
            var componentErrors = [];
            for (var component of components) {
                var componentError = {};
                if (!component.itemId && (!component.item || !component.item.name || component.item.name == "")) {
                    componentError["item"] = "item is required";
                }
                if (component && component.quantity < 1) {
                    componentError["quantity"] = "quantity should be greater or equal 1";
                }
                if (component && component.quantity < 1) {
                    componentError["quantity"] = "quantity should be greater or equal 1";
                }
                if (component && component.uom < 1) {
                    componentError["uom"] = "uom is required";
                }
                componentErrors.push(componentError);
            }

            for (var componentError of componentErrors) {
                for (var prop in componentError) {
                    errors.components = componentErrors;
                    reject(errors);
                }
            }

            var getItems = [];
            for (var component of components) {
                var id;
                try {
                    id = new ObjectId(component.itemId);
                }
                catch (e) {
                    id = new ObjectId();
                }
                getItems.push(this.itemManager.getSingleByIdOrDefault(id));
            }

            Promise.all(getItems)
                .then(items => {
                    var index = 0;
                    for (var item of items) {
                        var component = components[index++];
                        if (item) {
                            component.itemId = item._id;
                            component.item = item;
                        }
                        else {
                            var newItem;
                            switch (component.item._type) {
                                case 'material':
                                    newItem = new Material(component.item);
                                    break;
                                case 'finished-goods':
                                    newItem = new FinishedGoods(component.item);
                                    break;
                                default:
                                    newItem = new Item(component.item);
                            }
                            newItem.code = this.generateCode();
                            newItem.uom = 'pcs';
                            component.itemId = null;
                            component.item = newItem;
                        }
                    }
                    result.components = components.map(component => {
                        var _component = new Component(component);
                        return _component;
                    })
                    resolve(result);
                })
                .catch(e => {
                    errors.components = e;
                    reject(errors);
                });
        })
    }
}