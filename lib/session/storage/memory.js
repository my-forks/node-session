/**
 * Imports
 */
var sys = require('sys');
var base = require('./base');

/**
 * Utils
 */
function $clone(obj) {
	if (obj == null || typeof (obj) != 'object')
		return obj;

	var temp = {}; // changed

	for ( var key in obj) {
		temp[key] = $clone(obj[key]);
	}
	return temp;
}

/*****************************************************************************************************************************************************
 * Storage
 ****************************************************************************************************************************************************/
/**
 * Storage constructor
 * 
 * @param options
 * @return
 */
function Storage(options) {
	options = options || {};
	base.Storage.call(this, options);
	this._sessions = {};
}
sys.inherits(Storage, base.Storage);

Storage.prototype.exist = function(sid) {
	return (this._sessions[sid] != undefined);
};

Storage.prototype.create = function(session) {
	var sid = session.getId();
	if (this._sessions[sid]) {
		throw new base.ErrorCreate();
	}
	this._sessions[sid] = {
		data : $clone(session.getData()),
		createdAt : session.createdAt,
		accessedAt : session.accessedAt,
		expiredAt : session.expiredAt
	};
};

Storage.prototype.update = function(session) {
	var sid = session.getId();
	var sessionStore = this._sessions[sid];

	if (!this._sessions[sid]) {
		throw new ErrorInexistent();
	}

	var currentTime = this._manager._getTime();
	if (currentTime > sessionStore.expiredAt) {
		throw new base.ErrorExpired();
	}

	sessionStore.data = $clone(session.getData());
	sessionStore.accessedAt = session.accessedAt;
	sessionStore.expiredAt = session.expiredAt;
};

Storage.prototype.read = function(session) {
	var sid = session.getId();
	var sessionStore = this._sessions[sid];
	if (!sessionStore) {
		throw new base.ErrorInexistent();
	}

	var currentTime = this._manager._getTime();
	if (currentTime > sessionStore.expiredAt) {
		throw new base.ErrorExpired();
	}

	session.setData(sessionStore.data);
	session.createdAt = sessionStore.createdAt;
	session.accessedAt = sessionStore.accessedAt;
	session.expiredAt = sessionStore.expiredAt;
};

Storage.prototype.destroy = function(session) {
	var sid = session.getId();
	if (this._sessions[sid]) {
		delete this._sessions[sid];
		return true;
	}
	return false;
};

Storage.prototype.flush = function() {
	this._sessions = {};
};

Storage.prototype.clean = function() {
	var currentTime = this._manager._getTime();
	for (sid in this._sessions) {
		if (currentTime >= this._sessions[sid].expiredAt) {
			delete this._sessions[sid];
		}
	}
};

/**
 * Exports
 */
exports.Storage = Storage;