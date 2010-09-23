/**
 * Imports
 */
var sys = require('sys');
var sys = require('assert');

/**
 * Utils
 */
function $extend(destination, source) {
	for ( var property in source) {
		destination[property] = source[property];
	}
	return destination;
}

function $clone(obj) {
	if (obj == null || typeof (obj) != 'object')
		return obj;

	var temp = {}; // changed

	for ( var key in obj) {
		temp[key] = $clone(obj[key]);
	}
	return temp;
}
/*
 * function $clone(obj) { return $extend( {}, obj); }
 */

/**
 * Constants
 */
BASE64_CHARS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';

/**
 * Session Manager constructor
 * 
 * @param options
 * @return
 */
function SessionManager(options) {
	options = options || {};
	this.lifetime = options.lifetime || 1000 * 60 * 60;
	this._storage = new SessionStorageMemory();// new SessionStorage('SessionStorageMemory', {});
}

SessionManager.prototype.has = function(sid) {
	return this._storage.has(sid);
};

SessionManager.prototype.create = function() {
	var sid = this._sid();
	var sessionNew = new Session( {
		id : sid,
		manager : this
	});
	if (!this._storage.create(sessionNew.getId(), sessionNew.getData(), this.lifetime)) {
		throw new Error();
	}
	return sessionNew;
};

SessionManager.prototype._sid = function() {
	var result = '';

	for ( var bits = 24; bits > 0; --bits) {
		result += BASE64_CHARS[0x3F & (Math.floor(Math.random() * 0x100000000))];
	}
	return result;
};

SessionManager.prototype.update = function(sidOrSession, data) {
	var sid;
	if ((typeof sidOrSession) == 'object') {
		sid = sidOrSession.getId();
		data = sidOrSession.getData();
	} else {
		sid = sidOrSession;
	}
	if (!this._storage.update(sid, data, this.lifetime)) {
		throw new Error();
	}
	return this;
};

SessionManager.prototype.read = function(sid) {
	var data = this._storage.read(sid, this.lifetime);

	if (data != undefined) {
		data.id = sid;
		data.manager = this;
		var session = new Session(data);
		return session;
	} else {
		throw new Error();
	}
};

SessionManager.prototype.destroy = function(sidOrSession) {
	var sid = (typeof (sidOrSession) == 'object') ? sidOrSession.getId() : sidOrSession;
	this._storage.destroy(sid);
	return this;
};

SessionManager.prototype.touch = function(sid) {
	if (!this._storage.touch(sid, this.lifetime)) {
		throw new Error();
	}
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

	this.manager = options.manager;
	this.createdAt = options.createdAt;
	this.accessedAt = options.accessedAt;
	this.expiredAt = options.expiredAt;
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

Session.prototype.save = function() {
	this.manager.update(this.getId(), this.getData());
};

Session.prototype.destroy = function() {
	this.manager.destroy(this.getId());
};

/*
 * Session.prototype.getExpiredAt = function() { return this.expiredAt; };
 * 
 * Session.prototype.setExpiredAt = function(expiredAt) { if (typeof (expiredAt) == 'string') { expiredAt = new Date(expiredAt); } if (expiredAt
 * instanceof Date) { expiredAt = expiredAt.getTime(); } this.expiredAt = expiredAt; return this; };
 * 
 * Session.prototype.isExpired = function() { var currentTime = (new Date()).getTime(); return this.expiredAt < currentTime; };
 */

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

SessionStorage.prototype.create = function(sid, data, extraLifetime) {
	return this.adapter.create(sid, data, extraLifetime) == true;
};

SessionStorage.prototype.update = function(sid, data, extraLifetime) {
	return this.adapter.update(sid, data, extraLifetime) == true;
};

SessionStorage.prototype.read = function(sid) {
	return this.adapter.read(sid);
};

SessionStorage.prototype.destroy = function(sid) {
	return this.adapter.destroy(sid) == true;
};

SessionStorage.prototype.touch = function(sid, extraLifetime) {
	return this.adapter.touch(sid, extraLifetime) == true;
};

SessionStorage.prototype.flush = function() {
	return this.adapter.flush();
};

SessionStorage.prototype.clean = function() {
	return this.adapter.clean();
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
}

SessionStorageMemory.prototype.has = function(sid) {
	return (this._sessions[sid] != undefined);
};

SessionStorageMemory.prototype.create = function(sid, data, extraLifetime) {
	if (!this._sessions[sid]) {
		var currentTime = (new Date()).getTime();

		this._sessions[sid] = {
			data : $clone(data),
			createdAt : currentTime,
			accessedAt : currentTime,
			expiredAt : currentTime + (extraLifetime || 0)
		};
		return true;
	}
	return false;
};

SessionStorageMemory.prototype.update = function(sid, data, extraLifetime) {
	var session = this._sessions[sid];

	if (session) {
		var currentTime = (new Date()).getTime();

		if (currentTime < session.expiredAt) {
			if (data != undefined) {
				session.data = $clone(data);
			}
			session.accessedAt = currentTime;
			session.expiredAt = currentTime + (extraLifetime || 0);
			return true;
		}
	}
	return false;
};

SessionStorageMemory.prototype.read = function(sid, extraLifetime) {
	this.update(sid, undefined, extraLifetime);
	return $clone(this._sessions[sid]);
};

SessionStorageMemory.prototype.destroy = function(sid) {
	if (this._sessions[sid]) {
		delete this._sessions[sid];
		return true;
	}
	return false;
};

SessionStorageMemory.prototype.touch = function(sid, extraLifetime) {
	return this.update(sid, undefined, extraLifetime);
};

SessionStorageMemory.prototype.flush = function() {
	this._sessions = {};
};

SessionStorageMemory.prototype.clean = function() {
	var currentTime = (new Date()).getTime();
	for (sid in this._sessions) {
		if (currentTime >= this._session[sid].expiredAt) {
			this.destroy(sid);
		}
	}
};

/**
 * Exports
 */
exports.SessionManager = SessionManager;
exports.Session = Session;
