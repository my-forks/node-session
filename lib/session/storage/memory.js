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
 * StorageMemory
 ****************************************************************************************************************************************************/
/**
 * StorageMemory constructor
 * 
 * @param options
 * @return
 */
function StorageMemory(options) {
	options = options || {};
	base.StorageBase.call(this, options);
	this._sessions = {};
}
sys.inherits(StorageMemory, base.StorageBase);

StorageMemory.prototype.exist = function(sid) {
	return (this._sessions[sid] != undefined);
};

StorageMemory.prototype.create = function(session) {
	var sid = session.getId();
	if (this._sessions[sid]) {
		throw new base.ErrorSessionCreate();
	}
	this._sessions[sid] = {
		data : $clone(session.getData()),
		createdAt : session.createdAt,
		accessedAt : session.accessedAt,
		expiredAt : session.expiredAt
	};
};

StorageMemory.prototype.update = function(session) {
	var sid = session.getId();
	var sessionStore = this._sessions[sid];

	if (!this._sessions[sid]) {
		throw new ErrorSessionInexistent();
	}

	var currentTime = this._manager._getTime();
	if (currentTime > sessionStore.expiredAt) {
		throw new base.ErrorSessionExpired();
	}

	sessionStore.data = $clone(session.getData());
	sessionStore.accessedAt = session.accessedAt;
	sessionStore.expiredAt = session.expiredAt;
};

StorageMemory.prototype.read = function(session) {
	var sid = session.getId();
	var sessionStore = this._sessions[sid];
	if (!sessionStore) {
		throw new base.ErrorSessionInexistent();
	}

	var currentTime = this._manager._getTime();
	if (currentTime > sessionStore.expiredAt) {
		throw new base.ErrorSessionExpired();
	}

	session.setData(sessionStore.data);
	session.createdAt = sessionStore.createdAt;
	session.accessedAt = sessionStore.accessedAt;
	session.expiredAt = sessionStore.expiredAt;
};

StorageMemory.prototype.destroy = function(session) {
	var sid = session.getId();
	if (this._sessions[sid]) {
		delete this._sessions[sid];
		return true;
	}
	return false;
};

StorageMemory.prototype.flush = function() {
	this._sessions = {};
};

StorageMemory.prototype.clean = function() {
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
exports.StorageMemory = StorageMemory;