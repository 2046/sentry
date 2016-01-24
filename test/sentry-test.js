(function () {
    'use strict'

    function equals() {
        var args = arguments;
        expect(args[0]).to.equal(args[1]);
    };

    describe('Sentry', function () {
        it('正常加载', function () {
            equals(sentry.__initialized, true);
        });

        it('AMD加载', function (done) {
            $.getScript('../lib/requirejs/require.js', function () {
                require(['../src/sentry'], function (instance) {
                    equals(instance, sentry);
                    done();
                });
            });
        });

        it('CMD加载', function (done) {
            $.getScript('../lib/seajs/sea.js', function () {
                seajs.use('../src/sentry', function (instance) {
                    equals(instance, sentry);
                    done();
                });
            });
        });


        it('single', function (done) {
            var old = sentry;

            window.define = null;

            $.getScript('../src/sentry.js', function () {
                equals(sentry, old);
                done();
            });
        });


        it('noConflict', function () {
            var instance, old;

            old = sentry;
            instance = sentry.noConflict();

            equals(sentry, 'sentry');
            equals(instance, old);
            sentry = old;
        });


        it('parseCurrentScriptData', function () {
            equals(sentry.url, 'http://localhost:3000/sentry.png?a=1&b=2&c=3');
        });


        it('config', function () {
            sentry.config({
                url: 'about:blank',
                params: {
                    c: 3,
                    b: 2,
                    a: 1
                }
            });

            equals(sentry.url, 'about:blank?c=3&b=2&a=1');
        });

        it('on', function () {
            var id = 1;
            sentry.on('test', function () {
                id++;
            });

            sentry.emit('test');
            equals(id, 2);
        });

        it('off', function () {
            var id = 1;
            sentry.on('test2', function () {
                id++;
            });

            sentry.emit('test2');
            equals(id, 2);

            sentry.off('test2');
            sentry.emit('test2');
            equals(id, 2);
        });

        it('emit', function () {
            var id = 1;
            sentry.on('test3', function () {
                id++;
            });

            sentry.emit('test3');
            equals(id, 2);
        });

        it('Event:config', function () {
            sentry.on('config', function (data) {
                equals(data.url, 'about:blank');
                equals(data.params.a, 1);
            });

            sentry.config({
                url: 'about:blank',
                params: {
                    a: 1
                }
            });
        });

        it('Event:log', function () {
            function callback(data) {
                equals(data.errorName, 'testError');
            }

            sentry.on('log', callback);
            sentry.log({
                log: 'log1'
            }, 'testError');
            sentry.off('log', callback);
        });

        it('Event:request', function () {
            var id = 1;

            sentry.on('request', function () {
                equals(id, 1);
            });
            sentry.log({}, 'testRequest');
        });

        it('log', function () {
            function callback(data) {
                equals(data.errorName, 'testError2');
            }

            sentry.on('log', callback);

            sentry.log({
                log: 'log2'
            }, 'testError2');
            sentry.off('log', callback);
        });

        it('global exception', function (done) {
            function callback(data) {
                equals(data.errorName, 'jserror');
                equals(data.type, 'global');
                expect(data.message.indexOf('test')).to.not.equal(-1);
                sentry.off('log', callback);
            }

            sentry.on('log', callback);

            setTimeout(function () {
                done();
                test = 1;
            }, 0);
        });

        it('capture exception', function () {
            function callback(data) {
                equals(data.errorName, 'jserror');
                equals(data.type, 'catched');
                expect(data.message.indexOf('test2')).to.not.equal(-1);
                sentry.off('log', callback);
            }

            sentry.on('log', callback);

            try {
                test2 = 1;
            } catch (ex) {
                sentry.captureException(ex);
            }
        });

        it('capture crossdomain exception', function () {
        });

        it('capture compression exception', function () {

        });
    });
})();
