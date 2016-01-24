(function (factory) {
    if (typeof define === 'function' && (define.amd || define.cmd)) {
        define(function () {
            return factory();
        });
    } else if (typeof exports === 'object') {
        module.exports = factory();
    } else {
        window.sentry = factory();
    }
}(function () {
    'use strict'

    // Thanks:
    //     - http://docs.spmjs.io/sai/latest/
    //     - https://github.com/saijs/sai.js/blob/master/doc/index.md

    var sentry = {
        url: '',
        queue: [],
        events: {},
        initialize: function () {
            var element = getCurrentScript();

            this.config({
                url: attr(element, 'data-url'),
                params: attr(element, 'data-params')
            });

            this.__previousSentry = window.sentry;

            this.emit('init');
        },
        noConflict: function () {
            window.sentry = this.__previousSentry;
            return this;
        },
        config: function (obj) {
            var params = '';

            if (!obj) {
                return;
            }

            if (obj.params) {
                if (isString(obj.params)) {
                    params = obj.params;
                } else if (isObject(obj.params)) {
                    params = Json2QueryString(obj.params);
                }
            }

            if (obj.url) {
                this.url = obj.url + (params ? ((obj.url.indexOf('?') === -1 ? '?' : '&') + params) : params);
            }

            this.emit('config', obj);
        },
        log: function (data, errorName) {
            data.t = rand();
            data.errorName = errorName || 'log';
            this.queue.push(data);
            this.emit('log', data);
            this.sendLog();
        },
        sendLog: function () {
            var context, data;

            if (!this.url || this.__sending || !(data = this.queue.shift())) {
                return;
            }

            context = this;
            this.emit('request');
            this.__sending = true;
            send(this.url, data, function () {
                context.__sending = false;
                context.sendLog();
            });
        },
        implement: function (properties) {
            for (var key in properties) {
                this[key] = properties[key];
            }
        },
        on: function (name, callback) {
            var list = this.events[name] || (this.events[name] = []);
            list.push(callback);
            return this;
        },
        off: function (name, callback) {
            var list, index;

            if (!(name || callback)) {
                this.events = {};
                return this;
            }

            if (list = this.events[name]) {
                if (callback) {
                    for (index = list.length - 1; index >= 0; index--) {
                        if (list[index] === callback) {
                            list.splice(index, 1);
                        }
                    }
                } else {
                    delete this.events[name];
                }
            }

            return this;
        },
        emit: function (name, data) {
            var list, index;

            if (list = this.events[name]) {
                list = list.slice();

                for (index = 0; index < list.length; index++) {
                    list[index](data);
                }
            }

            return this;
        }
    };

    // JS Error Monitor

    (function () {
        var obj = {
            cache: {},
            captureGlobalException: function () {
                var context, onerror;

                context = this;
                onerror = window.onerror;

                window.onerror = function (message, file, line, column) {
                    context.error('global', message, file, line, column);
                    onerror && onerror.apply(window, arguments);
                    return false;
                };
            },
            captureException: function (exception) {
                if (!(exception instanceof Error)) {
                    return;
                }

                this.error('catched',
                    exception.message || exception.description,
                    exception.filename || exception.fileName || exception.sourceURL,
                    exception.lineno || exception.lineNumber || exception.line,
                    exception.colno || exception.columnNumber
                );
            },
            error: function (type, message, file, line, column) {
                var key, data;

                data = {
                    type: type,
                    file: file,
                    line: line,
                    column: column,
                    message: message
                };

                key = file + ':' + line + ':' + message;
                if (!this.cache[key]) {
                    this.cache[key] = true;
                    sentry.log(data, 'jserror');
                }
            }
        };

        sentry.on('init', function () {
            obj.captureGlobalException();
        });

        sentry.implement({
            captureException: function (exception) {
                obj.captureException(exception);
            }
        });
    })();

    // helpers

    function Json2QueryString(obj) {
        var arr, key, index, len;

        arr = [];

        for (key in obj) {
            if (obj.hasOwnProperty(key) && key !== 'prototype') {
                if (isArray(obj[key])) {
                    for (index = 0, len = obj[key].length; index > len; index++) {
                        arr.push(key + '=' + encode(obj[key][index]));
                    }
                } else {
                    arr.push(key + '=' + encode(obj[key]));
                }
            }
        }

        return arr.join('&');
    };

    function send(url, data, callback) {
        var img;

        url = url + '&' + Json2QueryString(data);

        if (url.length > 2048) {
            return callback();
        }

        img = new Image(1, 1);
        img.onload = img.onerror = img.onabort = function () {
            callback();
            img.onload = img.onerror = img.onabort = null;
            img = null;
        };

        img.src = url;
    };

    function encode(str) {
        return encodeURIComponent(escapeString(str));
    };

    function escapeString(str) {
        return String(str).replace(/(?:\r\n|\r|\n)/g, '<CR>');
    };

    function getCurrentScript() {
        var scripts = document.getElementsByTagName('script');
        return scripts[scripts.length - 1];
    };

    function attr(element, attribute) {
        return element.getAttribute(attribute) || '';
    };

    function rand() {
        return ('' + Math.random()).slice(-6);
    };

    function isString(str) {
        return Object.prototype.toString.call(str) === '[object String]';
    };

    function isArray(obj) {
        return Object.prototype.toString.call(obj) === '[object Array]';
    };

    function isObject(obj) {
        var type = typeof obj;
        return type === 'function' || type === 'object' && !!obj;
    };

    if (!window.sentry.__initialized) {
        sentry.initialize();
        sentry.__initialized = true;
        return sentry;
    } else {
        return window.sentry;
    }
}));
