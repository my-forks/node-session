/**
 * Imports
 */
var sys = require('sys');
var assert = require('assert');

/**
 * Constants
 */
BASE64_CHARS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';
SESSION_ID_LENGTH = 24;
SESSION_EXPIRATION = 60 * 60;// 1hours
SESSION_CREATION_ATTEMPTS = 10000;

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

/**
 * Session Manager constructor
 * 
 * @param options
 * 
 * <code>
 * new SessionManager{
 * 	storage :{
 * 		type: SessionStorageMemory, //storage type
 * 		...
 * 	},
 * 	expiration: 100//time in seconds
 *  sessionIdLength: 24;//SID size
 * });
 * </code>
 * 
 * @return
 */
function SessionManager(options) {
	options = options || {};
	options.storage = options.storage || {};

	this._expiration = (options.expiration || SESSION_EXPIRATION);
	this._sessionIdLength = options.sessionIdLength || SESSION_ID_LENGTH;

	// Generate storage
	this.setStorage(options.storage.type, options.storage);
}

SessionManager.prototype._getTime = function() {
	return Math.floor((new Date())._getTime() / 1000);
};

SessionManager.prototype.getExpiration = function() {
	return this._expiration;
};

SessionManager.prototype.setStorage = function(type, options) {

	var storage = type;

	if (type == undefined) {
		type = SessionStorageMemory;
	}

	if (typeof (storage) == 'string') {
		// TODO implement
	}

	if (storage instanceof Function) {
		storage = new storage(options);
	}

	if (typeof (storage) == 'object') {
		storage.manager = this;
		this._storage = storage;
		return this;
	}

	throw new Error();
};

SessionManager.prototype.getStorage = function() {
	return this._storage;
};

/**
 * Return a random generated SID
 * 
 * @return string
 */
SessionManager.prototype.generateId = function() {
	var length = this._sessionIdLength;
	var result = '';

	for ( var bits = length; bits > 0; --bits) {
		result += BASE64_CHARS[0x3F & (Math.floor(Math.random() * 0x100000000))];
	}
	return result;
};

/**
 * Return true if Session with sid exists
 * 
 * @param sid
 * @return boolean
 */
SessionManager.prototype.exist = function(sid) {
	return this._storage.exist(sid);
};

/**
 * Return new Session object with new SID
 * 
 * @return Session
 */
SessionManager.prototype.create = function() {
	var currentTime = this._getTime();

	for ( var tryCount = 0; tryCount < SESSION_CREATION_ATTEMPTS; tryCount++) {
		try {
			var sessionNew = new Session( {
				manager : this,
				id : this.generateId(),
				create : true
			});

			sessionNew.save();
			break;
		} catch (e) {
			throw e;
		}
	}

	return sessionNew;
};

/**
 * Return new Session object with
 * 
 * @param sid
 * @return
 */
SessionManager.prototype.open = function(sid) {
	var sessionOpened = new Session( {
		manager : this,
		id : sid
	});
	this._storage.read(sessionOpened);
	return sessionOpened;
};

SessionManager.prototype.destroy = function(session) {
	this._storage.destroy(session);
	return this;
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
	this._create = options.create || false;
	this._manager = options.manager;

	this.id = options.id;
	this._data = options.data || {};

	this.createdAt = options.createdAt;
	this.accessedAt = options.accessedAt || this.createdAt;
	this.expiredAt = options.expiredAt || Number.MAX_VALUE;

	this._accessed = false;
	this._modified = false;
}

Session.prototype._getTime = function() {
	return this._manager._getTime();
};

Session.prototype.getExpiration = function() {
	return this._manager.getExpiration();
};

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
	return this._data;
};

Session.prototype.setData = function(data) {
	this._data = $clone(data || {});
	return this;
};

/**
 * Return true if data[key] is set
 * 
 * @param key
 * @return boolean
 */
Session.prototype.isset = function(key) {
	return this._data[key] != undefined;
};

/**
 * Return the data[key] value or defaultValue if not set
 * 
 * @param key
 * @param defaultValue
 * @return mixed
 */
Session.prototype.get = function(key, defaultValue) {
	var value = this._data[key];
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
		this._data[key] = value;
	} else {
		delete this._data[key];
	}

	this._modified = true;
	return this;
};

/**
 * Unset the data[key]
 * 
 * @param key
 * @return this
 */
Session.prototype.unset = function(key) {
	delete this._data[key];
	this._modified = true;
	return this;
};

/**
 * Read data from storage
 * 
 * @return this
 */
Session.prototype.read = function() {
	this._manager._storage.read(this);
	return this;
};

/**
 * Save or create session into storage
 * 
 * @return this
 */
Session.prototype.save = function() {

	if (this._create) {
		var currentTime = this._getTime();
		this.createdAt = currentTime;
		this.accessedAt = currentTime;
		this.expiredAt = currentTime + this.getExpiration();

		this._manager._storage.create(this);
		this._create = false;
	} else {
		var currentTime = this._getTime();
		this.accessedAt = currentTime;
		this.expiredAt = currentTime + this.getExpiration();

		this._manager._storage.update(this);
	}

	return this;
};

Session.prototype.destroy = function() {
	if (!this._create) {
		this._storage.destroy(this);
	}
};

function ErrorNotImplemented(message) {
	this.name = 'IMPLEMENTATION_ERROR';
	this.message = message || 'Not Implemented';
}
sys.inherits(ErrorNotImplemented, Error);

function ErrorSessionCreate(message) {
	this.name = 'SESSION_CREATION';
	this.message = message || 'Session cannot be created';
}
sys.inherits(ErrorSessionCreate, Error);

function ErrorSessionExpired(message) {
	this.name = 'SESSION_EXPIRED';
	this.message = message || 'Session has expired';
	Error.call(this);
}
sys.inherits(ErrorSessionExpired, Error);

function ErrorSessionInexistent(message) {
	this.name = 'SESSION_INEXISTENT';
	this.message = message || 'Session does not exist';
}
sys.inherits(ErrorSessionInexistent, Error);

/**
 * SessionStorage constructor
 * 
 * @param adapter
 * @return
 */
function SessionStorageAbstract(options) {
	options = options || {};
	this._manager = options.manager;
}

SessionStorageAbstract.prototype.exist = function(sid) {
	throw new ErrorNotImplemented();
};

SessionStorageAbstract.prototype.create = function(session) {
	throw new ErrorNotImplemented();
};

SessionStorageAbstract.prototype.update = function(session) {
	throw new ErrorNotImplemented();
};

SessionStorageAbstract.prototype.read = function(session) {
	throw new ErrorNotImplemented();
};

SessionStorageAbstract.prototype.destroy = function(session) {
	throw new ErrorNotImplemented();
};

SessionStorageAbstract.prototype.flush = function() {
	throw new ErrorNotImplemented();
};

SessionStorageAbstract.prototype.clean = function() {
	throw new ErrorNotImplemented();
};

/**
 * SessionStorageMemory constructor
 * 
 * @param options
 * @return
 */
function SessionStorageMemory(options) {
	options = options || {};
	SessionStorageAbstract.call(this, options);
	this._sessions = {};
}
sys.inherits(SessionStorageMemory, SessionStorageAbstract);

SessionStorageMemory.prototype.exist = function(sid) {
	return (this._sessions[sid] != undefined);
};

SessionStorageMemory.prototype.create = function(session) {
	var sid = session.getId();
	if (this._sessions[sid]) {
		throw new ErrorSessionCreate();
	}
	this._sessions[sid] = {
		data : $clone(session.getData()),
		createdAt : session.createdAt,
		accessedAt : session.accessedAt,
		expiredAt : session.expiredAt
	};
};

SessionStorageMemory.prototype.update = function(session) {
	var sid = session.getId();
	var sessionStore = this._sessions[sid];

	if (!this._sessions[sid]) {
		throw new ErrorSessionInexistent();
	}

	var currentTime = this._manager._getTime();
	if (currentTime > sessionStore.expiredAt) {
		throw new ErrorSessionExpired();
	}

	sessionStore.data = $clone(session.getData());
	sessionStore.accessedAt = session.accessedAt;
	sessionStore.expiredAt = session.expiredAt;
};

SessionStorageMemory.prototype.read = function(session) {
	var sid = session.getId();
	var sessionStore = this._sessions[sid];
	if (!sessionStore) {
		throw new ErrorSessionInexistent();
	}

	var currentTime = this._manager._getTime();
	if (currentTime > sessionStore.expiredAt) {
		throw new ErrorSessionExpired();
	}

	session.setData(sessionStore.data);
	session.createdAt = sessionStore.createdAt;
	session.accessedAt = sessionStore.accessedAt;
	session.expiredAt = sessionStore.expiredAt;
};

SessionStorageMemory.prototype.destroy = function(session) {
	var sid = session.getId();
	if (this._sessions[sid]) {
		delete this._sessions[sid];
		return true;
	}
	return false;
};

SessionStorageMemory.prototype.flush = function() {
	this._sessions = {};
};

SessionStorageMemory.prototype.clean = function() {
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
exports.SessionManager = SessionManager;
exports.Session = Session;
