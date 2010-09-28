//TODO: add license
/**
 * Imports
 */
var sys = require('sys');

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

/*****************************************************************************************************************************************************
 * Manager
 * 
 * Usage :
 * 
 * <code>
 * var manager = new Manager{
 * 	storage :{
 * 		type: SessionStorageMemory, //storage type
 * 		...
 * 	},
 * 	expiration: 100//time in seconds
 *  sessionIdLength: 24;//SID size
 * });
 *
 * //Request #1
 * var session = manager.create();
 * //send here session.getId() to the client
 * session.set('foo', 'bar').set('baz', 3);
 * session.save();
 * 
 * //Request #2
 * var sid = ... //Get the sid from cookie, etc
 * var session = manager.open(sid);
 * console.log(session.get('foo'));//will print 'bar'
 * 
 * </code>
 ****************************************************************************************************************************************************/
/**
 * Manager constructor
 * 
 * @param options
 * @return
 */
function Manager(options) {
	options = options || {};
	options.storage = options.storage || {};

	this._expiration = (options.expiration || SESSION_EXPIRATION);
	this._sessionIdLength = options.sessionIdLength || SESSION_ID_LENGTH;

	// Generate storage
	this.setStorage(options.storage.type, options.storage);
}

Manager.prototype._getTime = function() {
	return Math.floor((new Date())._getTime() / 1000);
};

Manager.prototype.getExpiration = function() {
	return this._expiration;
};

/**
 * Set the storage used for all sessions
 * 
 * @param type
 * @param options
 * @return this
 */
Manager.prototype.setStorage = function(type, options) {

	if (type == undefined) {
		type = require('./storage/memory').Storage;
	}

	if (typeof (type) == 'string') {
		type = require('./storage/' + type).Storage;
	}

	if (type instanceof Function) {
		type = new type(options);
	}

	if (typeof (type) == 'object') {
		type._manager = this;
		this._storage = type;
		return this;
	}

	throw new Error();
};

/**
 * Return the manager storage
 * 
 * @return SessionStorage
 */
Manager.prototype.getStorage = function() {
	return this._storage;
};

/**
 * Return a random generated SID
 * 
 * @return string
 */
Manager.prototype.generateId = function() {
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
Manager.prototype.exist = function(sid) {
	return this._storage.exist(sid);
};

/**
 * Return new Session object with new SID
 * 
 * @return Session
 */
Manager.prototype.create = function() {
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
Manager.prototype.open = function(sid) {
	var sessionOpened = new Session( {
		manager : this,
		id : sid
	});
	this._storage.read(sessionOpened);
	return sessionOpened;
};

/**
 * Destroy
 * 
 * @param session
 * @return
 */
Manager.prototype.destroy = function(session) {
	this._storage.destroy(session);
	return this;
};

/**
 * Destroy all sessions
 * 
 * @return
 */
Manager.prototype.flush = function() {
	this._storage.flush();
	return this;
};

/**
 * Destroy all expired sessions
 * 
 * @return this
 */
Manager.prototype.clean = function() {
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

/**
 * Return an integer representing the session lifetime
 * 
 * @return integer
 */
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

/**
 * Set session data (overwrite it)
 * 
 * @param data
 * @return this
 */
Session.prototype.setData = function(data) {
	this._data = $clone(data) || {};
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
	if (typeof (key) == 'object') {
		for ( var property in key) {
			this._data[property] = key[property];
		}
	} else {
		if (value != undefined) {
			this._data[key] = value;
		} else {
			delete this._data[key];
		}
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

/**
 * Destroy me
 * 
 * TODO: check not to destroy twice? and block set/set, etc?
 * 
 * @return
 */
Session.prototype.destroy = function() {
	if (!this._create) {
		this._storage.destroy(this);
	}
	return this;
};

/**
 * Exports
 */
exports.Manager = Manager;
exports.Session = Session;