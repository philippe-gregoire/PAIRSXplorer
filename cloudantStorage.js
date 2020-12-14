/**
 * Copyright 2014, 2019 IBM Corp.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 **/

var Cloudant = require('@cloudant/cloudant');
var util = require('util');
var fs = require('fs');

var settings;
var appname;
var flowDb = null;
var currentRevs={};

var libraryCache = {};

// Setup the default pre-populated flows
var defaultFlows=__dirname + "/defaults/flow.json";

function prepopulateFlows(resolve) {
    var key = appname + "/" + "flow";
    flowDb.get(key, function (err, doc) {
        if (err) {
            var promises = [];
            if (fs.existsSync(defaultFlows)) {
                try {
                    var flow = fs.readFileSync(defaultFlows, "utf8");
                    var flows = JSON.parse(flow);
                    util.log("[cloudantStorage] Installing default flow");
                    promises.push(cloudantStorage.saveFlows(flows));
                } catch (err2) {
                    util.log("[cloudantStorage] Failed to save default flow");
                    util.log(err2);
                }
            } else {
                util.log("[cloudantStorage] No default flow found");
            }
            if (fs.existsSync(__dirname + "/defaults/flow_cred.json")) {
                try {
                    var cred = fs.readFileSync(__dirname + "/defaults/flow_cred.json", "utf8");
                    var creds = JSON.parse(cred);
                    util.log("[cloudantStorage] Installing default credentials");
                    promises.push(cloudantStorage.saveCredentials(creds));
                } catch (err2) {
                    util.log("[cloudantStorage] Failed to save default credentials");
                    util.log(err2);
                }
            } else {
                util.log("[cloudantStorage] No default credentials found");
            }
            Promise.all(promises).then(function () {
                resolve();
            });
        } else {
            // Flows already exist - leave them alone
            resolve();
        }
    });
}

function _getDoc(docType,defaultDoc) {
	const key = `${appname}/${docType}`;
	return new Promise(function (resolve, reject) {
		flowDb.get(key, function (err, doc) {
			if (err) {
				if (err.statusCode != 404) {
					reject(err.toString());
				} else {
					resolve(defaultDoc);
				}
			} else {
				currentRevs[docType] = doc._rev;
				resolve(doc[docType]);
			}
		});
	});
}

function _saveDoc(docType,docContents) {
	const key = `${appname}/${docType}`;
	return new Promise(function (resolve, reject) {
		const doc = { _id: key} 
		doc[docType]=docContents;
		
		if (docType in currentRevs) {
			doc._rev = currentRevs[docType];
		}
		flowDb.insert(doc, function (err, db) {
			if (err) {
				reject(err.toString());
			} else {
				currentRevs[docType] = db.rev;
				resolve();
			}
		});
	});
}


var cloudantStorage = {
    init: function (_settings) {
        settings = _settings.cloudantService || {};
        if (!settings) {
            var err = Promise.reject("cloudantStorage settings not found");
            err.catch(err => {});
            return err;
        }
        // This is resulting in Access Denined errors when using IAM
        //var couchDb = Cloudant({ vcapInstanceName: settings.name, vcapServices: JSON.parse(process.env.VCAP_SERVICES) });
        var couchDb = Cloudant(settings.url);

        appname = settings.prefix || require('os').hostname();
        var dbname = settings.db || "nodered";
		dbname=dbname.toLowerCase();

        // Use the flowFile as default
        if(settings.flowFile) {
            defaultFlows=__dirname + "/" + settings.flowFile;
            util.log(`Using file from settings.flowFile=${settings.flowFile}, full path: ${defaultFlows}`)
        }

        return new Promise(function (resolve, reject) {
            couchDb.db.get(dbname, function (err, body) {
                if (err) {
                    couchDb.db.create(dbname, function (err, body) {
                        if (err) {
                            reject("Failed to create database: " + err);
                        } else {
                            flowDb = couchDb.use(dbname);
                            flowDb.insert({
                                views: {
                                    flow_entries_by_app_and_type: {
                                        map: function (doc) {
                                            var p = doc._id.split("/");
                                            if (p.length > 2 && p[2] == "flow") {
                                                var meta = { path: p.slice(3).join("/") };
                                                emit([p[0], p[2]], meta);
                                            }
                                        }
                                    },
                                    lib_entries_by_app_and_type: {
                                        map: function (doc) {
                                            var p = doc._id.split("/");
                                            if (p.length > 2) {
                                                if (p[2] != "flow") {
                                                    var pathParts = p.slice(3, -1);
                                                    for (var i = 0; i < pathParts.length; i++) {
                                                        emit([p[0], p[2], pathParts.slice(0, i).join("/")], { dir: pathParts.slice(i, i + 1)[0] });
                                                    }
                                                    var meta = {};
                                                    for (var key in doc.meta) {
                                                        meta[key] = doc.meta[key];
                                                    }
                                                    meta.fn = p.slice(-1)[0];
                                                    emit([p[0], p[2], pathParts.join("/")], meta);
                                                }
                                            }
                                        }
                                    }
                                }
                            }, "_design/library", function (err, b) {
                                if (err) {
                                    reject("Failed to create view: " + err);
                                } else {
                                    prepopulateFlows(resolve);
                                }
                            });
                        }
                    });
                } else {
                    flowDb = couchDb.use(dbname);
                    prepopulateFlows(resolve);
                }
            });
        });
    },
	getDoc: _getDoc,
	setDoc: _setDoc,
    getFlows: function () {
		return _getDoc('flow',[]);
    },

    saveFlows: function (flows) {
		return _saveDoc('flow',flows);
    },

    getCredentials: function () {
		return _getDoc('credentials',{});
    },

    saveCredentials: function (credentials) {
		return _saveDoc('credentials',credentials);
    },

    getSettings: function () {
		return _getDoc('settings',{})
    },

    saveSettings: function (settings) {
		return _saveDoc('settings',settings);
    },
    getAllFlows: function () {
        var key = [appname, "flow"];
        return new Promise(function (resolve, reject) {
            flowDb.view('library', 'flow_entries_by_app_and_type', { key: key }, function (e, data) {
                if (e) {
                    reject(e.toString());
                } else {
                    var result = {};
                    for (var i = 0; i < data.rows.length; i++) {
                        var doc = data.rows[i];
                        var path = doc.value.path;
                        var parts = path.split("/");
                        var ref = result;
                        for (var j = 0; j < parts.length - 1; j++) {
                            ref['d'] = ref['d'] || {};
                            ref['d'][parts[j]] = ref['d'][parts[j]] || {};
                            ref = ref['d'][parts[j]];
                        }
                        ref['f'] = ref['f'] || [];
                        ref['f'].push(parts.slice(-1)[0]);
                    }
                    resolve(result);
                }
            });
        });
    },

    getFlow: function (fn) {
        if (fn.substr(0) != "/") {
            fn = "/" + fn;
        }
        var key = appname + "/lib/flow" + fn;
        return new Promise(function (resolve, reject) {
            flowDb.get(key, function (err, data) {
                if (err) {
                    reject(err);
                } else {
                    resolve(data.data);
                }
            });
        });
    },

    saveFlow: function (fn, data) {
        if (fn.substr(0) != "/") {
            fn = "/" + fn;
        }
        var key = appname + "/lib/flow" + fn;
        return new Promise(function (resolve, reject) {
            var doc = { _id: key, data: data };
            flowDb.get(key, function (err, d) {
                if (d) {
                    doc._rev = d._rev;
                }
                flowDb.insert(doc, function (err, d) {
                    if (err) {
                        reject(err);
                    } else {
                        resolve();
                    }
                });
            });

        });
    },

    getLibraryEntry: function (type, path) {
        if (path != "" && path.substr(0, 1) != "/") {
            var key = appname + "/lib/" + type + "/" + path;
        } else {
            var key = appname + "/lib/" + type + path;
        }

        if (libraryCache[key]) {
            return Promise.resolve(libraryCache[key]);
        }

        return new Promise(function (resolve, reject) {
            flowDb.get(key, function (err, doc) {
                if (err) {
                    if (path.substr(-1, 1) == "/") {
                        path = path.substr(0, path.length - 1);
                    }
                    var qkey = [appname, type, path];
                    flowDb.view('library', 'lib_entries_by_app_and_type', { key: qkey }, function (e, data) {
                        if (e) {
                            reject(e);
                        } else {
                            var dirs = [];
                            var files = [];
                            for (var i = 0; i < data.rows.length; i++) {
                                var row = data.rows[i];
                                var value = row.value;

                                if (value.dir) {
                                    if (dirs.indexOf(value.dir) == -1) {
                                        dirs.push(value.dir);
                                    }
                                } else {
                                    files.push(value);
                                }
                            }
                            libraryCache[key] = dirs.concat(files);
                            resolve(libraryCache[key]);
                        }
                    });
                } else {
                    libraryCache[key] = doc.body;
                    resolve(doc.body);
                }
            });
        });
    },
    saveLibraryEntry: function (type, path, meta, body) {

        var p = path.split("/");    // strip multiple slash
        p = p.filter(Boolean);
        path = p.slice(0, p.length).join("/")

        if (path != "" && path.substr(0, 1) != "/") {
            path = "/" + path;
        }
        var key = appname + "/lib/" + type + path;
        return new Promise(function (resolve, reject) {
            var doc = { _id: key, meta: meta, body: body };
            flowDb.get(key, function (err, d) {
                if (d) {
                    doc._rev = d._rev;
                }
                flowDb.insert(doc, function (err, d) {
                    if (err) {
                        reject(err);
                    } else {
                        var p = path.split("/");
                        for (var i = 0; i < p.length; i++) {
                            delete libraryCache[appname + "/lib/" + type + (p.slice(0, i).join("/"))]
                        }
                        libraryCache[key] = body;
                        resolve();
                    }
                });
            });

        });
    }
};

module.exports = cloudantStorage;
