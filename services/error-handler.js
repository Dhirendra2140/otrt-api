var errorHandler = function (callback) {
    this._isFinalized = false;
    this._onFinalizeCallbacks = [];
    this.callback = callback;
};

errorHandler.prototype = {
    constructor: errorHandler,

    check: function (res, value, callback) {
        var self = this;
        return function () {
            if (!self.isFinalized()) {
                if (arguments[0]) {
                    arguments[0].value = value;
                    arguments[0].res = res;

                    self.finalize.apply(self, arguments);
                }
                else {
                    [].shift.call(arguments);
                    callback.apply(null, arguments);
                }
            }
        };
    },
    error: function () {
        if (!this.isFinalized()) {
            this.finalize.apply(this, arguments);
        }
    },
    finalize: function () {
        if (!this.isFinalized()) {
            this._isFinalized = true;
            this._onFinalizeCallbacks.slice().forEach(function (f) {
                f();
            });
            if (arguments[0]) {
                this.errorHandler.call(this, arguments[0], null)
            }
            else {
                [].shift.call(arguments);
                this.successHandler.apply(this, arguments)
            }
        }
    },
    isFinalized: function () {
        return !!this._isFinalized;
    },
    successHandler: function () {
        [].unshift.call(arguments, null);
        this.callback.apply(null, arguments);
    },
    errorHandler: function () {
        this.callback.apply(null, arguments);
    }
};

module.exports = errorHandler;
