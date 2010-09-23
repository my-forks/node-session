/**
 * Imports
 */
var sys = require('sys');
var sys = require('assert');

/**
 * Constants
 */
BASE64_CHARS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';

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

function $stringRandom(length, charset) {
	charset = charset || BASE64_CHARS;
	var result = '';

	for ( var bits = length; bits > 0; --bits) {
		result += charset[0x3F & (Math.floor(Math.random() * 0x100000000))];
	}
	return result;
}

/**
 * Session Manager constructor
 * 
 * @param options
 * @return
 */
function SessionManager(options) {
	options = options || {};
	options.storage = options.storage || {};
	options.storage.type = options.storage.type || SessionStorageMemory;

	this.lifetime = options.lifetime || 1000 * 60 * 60;
	this._storage = new SessionStorage(options.storage.type, options.storage);
	this._time = options.time;

}

SessionManager.prototype._getTime = function() {
	return this._time || (new Date()).getTime();
};

SessionManager.prototype.has = function(sid) {
	return this._storage.has(sid);
};

SessionManager.prototype.create = function() {
	var sid = $stringRandom(24, BASE64_CHARS);

	var currentTime = this._getTime();
	var sessionNew = new Session( {
		id : sid,
		data : {},
		createdAt : currentTime,
		accessedAt : currentTime,
		expiredAt : currentTime + this.lifetime
	});
	if (!this._storage.create(sessionNew)) {
		throw new Error();
	}
	return sessionNew;
};

SessionManager.prototype.update = function(session) {
	var currentTime = this._getTime();
	session.accessedAt = currentTime;
	session.expiredAt = currentTime + this.lifetime;

	if (!this._storage.update(session)) {
		throw new Error();
	}
	return this;
};

SessionManager.prototype.read = function(sid) {
	var session = new Session( {
		manager : this,
		id : sid
	});

	if (this._storage.read(session)) {
		return session;
	} else {
		throw new Error();
	}
};

SessionManager.prototype.destroy = function(session) {
	this._storage.destroy(session);
	return this;
};

SessionManager.prototype.touch = function(session) {
	if (!this._storage.touch(session, this.lifetime)) {
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
	this.createdAt = options.createdAt || (new Date()).getTime();
	this.accessedAt = options.accessedAt || this.createdAt;
	this.expiredAt = options.expiredAt;
}

/**
 * Return the SID
 * 
 * @return the id
 */
Session.prototype.getId = function() {
	return this.id;
};

/**
 * Return the session data
 * 
 * @return an object {}
 */
Session.prototype.getData = function() {
	return this.data;
};

/**
 * Return true if data[key] is set
 * 
 * @param key
 * @return boolean
 */
Session.prototype.isset = function(key) {
	return this.data[key] != undefined;
};

/**
 * Return the data[key] value or defaultValue if not set
 * 
 * @param key
 * @param defaultValue
 * @return mixed
 */
Session.prototype.get = function(key, defaultValue) {
	var value = this.data[key];
	return value == undefined ? defaultValue : value;
};

/**
 * Set the data[key] to value
 * 
 * @param key
 * @param value
 * @return this
 */
Session.prototype.set = function(key, value) {
	if (value != undefined) {
		this.data[key] = value;
	} else {
		delete this.data[key];
	}
	return this;
};

/**
 * Unset the data[key]
 * 
 * @param key
 * @return this
 */
Session.prototype.unset = function(key) {
	this.set(key, undefined);
	return this;
};

Session.prototype.save = function() {
	this.manager.update(this);
};

Session.prototype.destroy = function() {
	this.manager.destroy(this);
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

SessionStorage.prototype.create = function(session) {
	return this.adapter.create(session);
};

SessionStorage.prototype.update = function(session) {
	return this.adapter.update(session);
};

SessionStorage.prototype.read = function(session) {
	return this.adapter.read(session);
};

SessionStorage.prototype.destroy = function(session) {
	return this.adapter.destroy(session);
};

/*
 * SessionStorage.prototype.touch = function(sid, extraLifetime) { return this.adapter.touch(sid, extraLifetime) == true; };
 */

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

SessionStorageMemory.prototype.create = function(session) {
	var sid = session.getId();
	var sessionStore = this._sessions[sid];
	if (!sessionStore) {
		// var currentTime = (new Date()).getTime();

		sessionStore = {
			data : $clone(session.getData()),
			createdAt : session.createdAt,
			accessedAt : session.accessedAt,
			expiredAt : session.expiredAt
		};
		return true;
	}
	return false;
};

SessionStorageMemory.prototype.update = function(session) {
	var sid = session.getId();
	var sessionStore = this._sessions[sid];

	if (sessionStore) {
		var currentTime = (new Date()).getTime();

		if (currentTime < sessionStore.expiredAt) {

			sessionStore.data = $clone(session.data);
			sessionStore.accessedAt = session.accessedAt;
			sessionStore.expiredAt = session.expiredAt;

			return true;
		}
	}
	return false;
};

SessionStorageMemory.prototype.read = function(session) {
	var sid = session.getId();
	var sessionStore = this._sessions[sid];
	if (sessionStore) {
		session.data = $clone(sessionStore.data);
		session.createdAt = sessionStore.createdAt;
		session.accessedAt = sessionStore.accessedAt;
		session.expiredAt = sessionStore.expiredAt;
		return true;
	}
	return false;
};

SessionStorageMemory.prototype.destroy = function(session) {
	var sid = session.getId();
	var sessionStore = this._sessions[sid];
	if (sessionStore) {
		delete sessionStore;
		return true;
	}
	return false;
};

/*
 * SessionStorageMemory.prototype.touch = function(sid, extraLifetime) { return this.update(sid, undefined, extraLifetime); };
 */

SessionStorageMemory.prototype.flush = function() {
	this._sessions = {};
};

SessionStorageMemory.prototype.clean = function() {
	var currentTime = (new Date()).getTime();
	for (sid in this._sessions) {
		if (currentTime >= this._session[sid].expiredAt) {
			delete this._session[sid];
		}
	}
};

/**
 * Exports
 */
exports.SessionManager = SessionManager;
exports.Session = Session;
