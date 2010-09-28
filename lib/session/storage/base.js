/**
 * Imports
 */
var sys = require('sys');

/*****************************************************************************************************************************************************
 * Storage
 ****************************************************************************************************************************************************/
/**
 * Storage constructor
 * 
 * @param adapter
 * @return
 */
function Storage(options) {
	options = options || {};
	this._manager = options.manager;
}

/**
 * Must return true if the session SID exist
 * 
 * @param sid
 * @return boolean
 */
Storage.prototype.exist = function(sid) {
	throw new ErrorNotImplemented();
};

/**
 * Must create a new session
 * 
 * @param session
 * @return undefined
 */
Storage.prototype.create = function(session) {
	throw new ErrorNotImplemented();
};

/**
 * Must update the session
 * 
 * @param session
 * @return undefined
 */
Storage.prototype.update = function(session) {
	throw new ErrorNotImplemented();
};

/**
 * Must read the session
 * 
 * @param session
 * @return undefined
 */
Storage.prototype.read = function(session) {
	throw new ErrorNotImplemented();
};

/**
 * Must destroy specified session
 * 
 * @param session
 * @return undefined
 */
Storage.prototype.destroy = function(session) {
	throw new ErrorNotImplemented();
};

/**
 * Must destroy all sessions
 * 
 * @return undefined
 */
Storage.prototype.flush = function() {
	throw new ErrorNotImplemented();
};

/**
 * Must clean all expired sessions
 * 
 * @return undefined
 */
Storage.prototype.clean = function() {
	throw new ErrorNotImplemented();
};

/*****************************************************************************************************************************************************
 * Errors
 ****************************************************************************************************************************************************/
function ErrorNotImplemented(message) {
	this.name = 'IMPLEMENTATION_ERROR';
	this.message = message || 'Not Implemented';
}
sys.inherits(ErrorNotImplemented, Error);

function ErrorCreate(message) {
	this.name = 'SESSION_CREATION';
	this.message = message || 'Session cannot be created';
}
sys.inherits(ErrorCreate, Error);

function ErrorExpired(message) {
	this.name = 'SESSION_EXPIRED';
	this.message = message || 'Session has expired';
	Error.call(this);
}
sys.inherits(ErrorExpired, Error);

function ErrorInexistent(message) {
	this.name = 'SESSION_INEXISTENT';
	this.message = message || 'Session does not exist';
}
sys.inherits(ErrorInexistent, Error);

/**
 * Exports
 */
exports.Storage = Storage;
exports.ErrorNotImplemented;
exports.ErrorCreate;
exports.ErrorExpired;
exports.ErrorInexistent;