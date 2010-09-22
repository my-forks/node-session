/**
 * Imports
 */
var sys = require('sys');
var sys = require('assert');

/**
 * Session Manager constructor
 * 
 * @param options
 * @return
 */
function SessionManager(options) {
	options = options || {};
	this._expiration = option.expiration || 1000 * 60 * 60;
	this._storage = new SessionStorage('SessionStorageMemory', {});
}

SessionManager.prototype.has = function(sid) {
	return this._storage.has(sid);
};

SessionManager.prototype.create = function() {
	var sid = 'toto';
	var sessionNew = new Session( {
		id : sid,
		manager : this
	});
	this._storage.create(sessionNew.getId(), sessionNew.getData());

	return sessionNew;
};

SessionManager.prototype.update = function(sid) {// TODO change this parameter
	this._storage.update(sid, this._sessions[sid]);
	this.touch(sid);
	return this;
};

SessionManager.prototype.read = function(sid) {
	var session = this._storage.read(sid);
	this.touch(sid);
	return session;
};

SessionManager.prototype.destroy = function(sid) {
	this._storage.destroy(sid);
	return this;
};

SessionManager.prototype.touch = function(sid, expiration) {
	expiration = expiration || this._expiration;
	this._storage.touch(sid, expiration);
};

SessionManager.prototype.flush = function() {
	this._storage.flush();
	return this;
};

SessionManager.prototype.clean = function() {
	this._storage.clean();
	return this;
};

/**
 * Session constructor
 * 
 * @param options
 * @return
 */
function Session(options) {
	options = options || {};
	this.id = options.id;
	this.data = options.data || {};
	this.expiredAt = options.expiredAt;
	if (this.expiredAt == undefined) {
		this.expiredAt = (new Date()).getTime() + 1000 * 60;
	}
}

Session.prototype.getId = function() {
	return this.id;
};

Session.prototype.getData = function() {
	return this.data;
};

Session.prototype.isset = function(key) {
	return this.data[key] != undefined;
};

Session.prototype.get = function(key, defaultValue) {
	var value = this.data[key];
	return value == undefined ? defaultValue : value;
};

Session.prototype.set = function(key, value) {
	if (value != undefined) {
		this.data[key] = value;
	} else {
		delete this.data[key];
	}
	return this;
};

Session.prototype.unset = function(key) {
	this.set(key, undefined);
	return this;
};

Session.prototype.getExpiredAt = function() {
	return this.expiredAt;
};

Session.prototype.setExpiredAt = function(expiredAt) {
	if (typeof (expiredAt) == 'string') {
		expiredAt = new Date(expiredAt);
	}
	if (expiredAt instanceof Date) {
		expiredAt = expiredAt.getTime();
	}
	this.expiredAt = expiredAt;
	return this;
};

Session.prototype.isExpired = function() {
	var currentTime = (new Date()).getTime();
	return this.expiredAt < currentTime;
};

/**
 * SessionStorage constructor
 * 
 * @param adapter
 * @return
 */
function SessionStorage(adapter, options) {
	options = options || {};
	this.debug = options.debug || false;
	this.adapter = new adapter(options);
}

SessionStorage.prototype.has = function(sid) {
	return this.adapter.has(sid) == true;
};

SessionStorage.prototype.create = function(sid, data, lifetime) {
	if (this.debug) {
		assert.equal(this.adapter.has(sid), false);
	}
	this.adapter.create(sid, data, lifetime);
};

SessionStorage.prototype.update = function(sid, data, lifetime) {
	if (this.debug) {
		assert.equal(!this.adapter.has(sid), false);
	}
	this.adapter.write(sid, data);
};

SessionStorage.prototype.read = function(sid) {
	return this.adapter.read(sid);
};

SessionStorage.prototype.destroy = function(sid) {
	this.adapter.destroy(sid);
};

SessionStorage.prototype.touch = function(sid, lifetime) {
	if (this.debug) {
		assert.equal(!this.adapter.has(sid), false);
	}

	this.adapter.touch(sid, lifetime);
};

SessionStorage.prototype.flush = function() {
	this.adapter.flush();
};

SessionStorage.prototype.clean = function() {
	this.adapter.clean();
};

/**
 * SessionStorageMemory constructor
 * 
 * @param options
 * @return
 */
function SessionStorageMemory(options) {
	options = options || {};
	this._sessions = {};
	this._expirations = {};
}

SessionStorageMemory.prototype.has = function(sid) {
	return this._sessions[sid] != undefined;
};

SessionStorageMemory.prototype.create = function(sid, data, lifetime) {
	this._sessions[sid] = data;
	this._expirations[sid] += lifetime;
};

SessionStorageMemory.prototype.update = function(sid, data) {
	return this._sessions[sid] = data;
};

SessionStorageMemory.prototype.read = function(sid) {
	return this._sessions[sid];
};

SessionStorageMemory.prototype.destroy = function(sid) {
	delete this._sessions[sid];
	delete this._expirations[sid];
};

SessionStorageMemory.prototype.touch = function(sid, expiration) {
	if (this._expirations[sid]) {
		this._expirations[sid] += (new Date()).getTime() + expiration;
	}
};

SessionStorageMemory.prototype.flush = function() {
	this._sessions = {};
	this._expirations = {};
};

SessionStorageMemory.prototype.clean = function() {

};

/**
 * Exports
 */
exports.SessionManager = SessionManager;
exports.Session = Session;
