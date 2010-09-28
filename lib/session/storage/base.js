/**
 * Imports
 */
var sys = require('sys');

/*****************************************************************************************************************************************************
 * StorageBase
 ****************************************************************************************************************************************************/
/**
 * StorageBase constructor
 * 
 * @param adapter
 * @return
 */
function StorageBase(options) {
	options = options || {};
	this._manager = options.manager;
}

/**
 * Must return true if the session SID exist
 * 
 * @param sid
 * @return boolean
 */
StorageBase.prototype.exist = function(sid) {
	throw new ErrorNotImplemented();
};

/**
 * Must create a new session
 * 
 * @param session
 * @return undefined
 */
StorageBase.prototype.create = function(session) {
	throw new ErrorNotImplemented();
};

/**
 * Must update the session
 * 
 * @param session
 * @return undefined
 */
StorageBase.prototype.update = function(session) {
	throw new ErrorNotImplemented();
};

/**
 * Must read the session
 * 
 * @param session
 * @return undefined
 */
StorageBase.prototype.read = function(session) {
	throw new ErrorNotImplemented();
};

/**
 * Must destroy specified session
 * 
 * @param session
 * @return undefined
 */
StorageBase.prototype.destroy = function(session) {
	throw new ErrorNotImplemented();
};

/**
 * Must destroy all sessions
 * 
 * @return undefined
 */
StorageBase.prototype.flush = function() {
	throw new ErrorNotImplemented();
};

/**
 * Must clean all expired sessions
 * 
 * @return undefined
 */
StorageBase.prototype.clean = function() {
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
 * Exports
 */
exports.StorageBase = StorageBase;
exports.ErrorNotImplemented;
exports.ErrorSessionCreate;
exports.ErrorSessionExpired;
exports.ErrorSessionInexistent;