/**
 * vkThread - javascript plugin to execute javascript function(s) in a thread.
 *
 * https://github.com/vkiryukhin/vkthread
 *
 * @version: 2.5.0
 *
 * @author: Vadim Kiryukhin ( vkiryukhin @ gmail.com )
 *
 * Copyright (c) 2016 Vadim Kiryukhin
 *
 * Licensed under the MIT License.
 *
 */

/* jshint maxlen:false */
/* global Promise */

(function () {
	'use strict';

	/* fragment of JSONfn plugin ( https://github.com/vkiryukhin/jsonfn ) */

	var JSONfn = {
		stringify: function (obj) {
			return JSON.stringify(obj, function (key, value) {
				var fnBody;
				if (value instanceof Function || typeof value === 'function') {
					fnBody = value.toString();

					if (
						fnBody.length < 8 ||
						fnBody.substring(0, 8) !== 'function'
					) {
						//this is ES6 Arrow Function
						return '_NuFrRa_' + fnBody;
					}
					return fnBody;
				}
				if (value instanceof RegExp) {
					return '_PxEgEr_' + value;
				}
				return value;
			});
		},
	};

	/* Create generic worker from minified version of worker.js */

	var workerJs =
		'(function(){var JSONfn={parse:function(str,date2obj){var iso8061=date2obj?/^(d{4})-(d{2})-(d{2})T(d{2}):(d{2}):(d{2}(?:.d*)?)Z$/:false;return JSON.parse(str,function(key,value){var prefix,func,fnArgs,fnBody;if(typeof value!=="string")return value;if(value.length<8)return value;prefix=value.substring(0,8);if(iso8061&&value.match(iso8061))return new Date(value);if(prefix==="function")return eval("("+value+")");if(prefix==="_PxEgEr_")return eval(value.slice(8));if(prefix==="_NuFrRa_"){func=value.slice(8).trim().split("=>");fnArgs=func[0].trim();fnBody=func[1].trim();if(fnArgs.indexOf("(")<0)fnArgs="("+fnArgs+")";if(fnBody.indexOf("{")<0)fnBody="{ return "+fnBody+"}";return eval("("+"function"+fnArgs+fnBody+")")}return value})}};onmessage=function(e){var obj=JSONfn.parse(e.data,true),cntx=obj.context||self;if(obj.importFiles)importScripts.apply(null,obj.importFiles);if(typeof obj.fn==="function")if(typeof Promise!=="undefined")Promise.resolve(obj.fn.apply(cntx,obj.args)).then(function(data){postMessage(data)})["catch"](function(reason){postMessage(reason)});else postMessage(obj.fn.apply(cntx,obj.args));else postMessage(self[obj.fn].apply(cntx,obj.args))};function vkhttp(cfg){var body=cfg.body?JSON.stringify(cfg.body):null,contentType=cfg.contentType||"application/json",method=cfg.method?cfg.method.toUpperCase():"GET",xhr=new XMLHttpRequest,ret;xhr.onload=function(){if(xhr.status>=200&&xhr.status<300)ret=xhr.responseText;else ret="Error: "+xhr.status+xhr.statusText};xhr.onerror=function(data){ret=xhr.status+xhr.statusText};xhr.open(method,cfg.url,false);if(method==="POST")xhr.setRequestHeader("Content-Type",contentType);xhr.send(body);return ret}})();';
	var workerBlob = new Blob([workerJs], { type: 'application/javascript' });

	/* constructor */

	function Vkthread() {
		this.getVersion = function () {
			return '2.5.0';
		};

		// to use standalone worker.js uncomment code below
		/*
          var err;
          try { throw new Error() }
          catch(e){ err = e.stack }
    
          if (err === 'undefined') {
            this.path = '';
          } else {
            this.path = 'http'+ err.split('http')[1].split('vkthread.js').slice(0,-1) + 'worker.js';
          }
    */
	}

	/**
	 *   Execute function in a thread.
	 *
	 *    @return -- promise object;
	 *    @param -- object;
	 *
	 *    @param object has following attributes
	 *
	 *      @fn          - function to execute                (mandatory)
	 *      @args        - array of arguments for @fn          (optional)
	 *      @context     - object which will be 'this' for @fn (optional)
	 *      @importFiles - array of strings                    (optional)
	 *                     each string is a path to a file, which @fn depends on.
	 */

	Vkthread.prototype.exec = function (param) {
		var worker = new Worker(window.URL.createObjectURL(workerBlob)), //embedded worker
			//var worker = new Worker(this.path),  //standalone worker (use for customizing or debug)
			promise;

		if (param.cb && typeof param.cb === 'function') {
			worker.onmessage = function (oEvent) {
				param.cb(oEvent.data);
				worker.terminate();
			};

			worker.onerror = function (error) {
				param.cb(null, error.message);
				worker.terminate();
			};

			worker.postMessage(JSONfn.stringify(param));
		} else {
			if (typeof Promise !== 'undefined') {
				promise = new Promise(function (resolve, reject) {
					worker.onmessage = function (oEvent) {
						resolve(oEvent.data);
						worker.terminate();
					};

					worker.onerror = function (error) {
						reject(error.message);
						worker.terminate();
					};
				});
				worker.postMessage(JSONfn.stringify(param));
				return promise;
			}
		}
	};

	/**
	 *  Execute multiple functions in multiple threads
	 *
	 *  @return -- promise object;
	 *  @args -- array of param objects (see above)
	 *
	 *  example: vkthread.execAll([param1, param2 ])
	 */

	Vkthread.prototype.execAll = function (args) {
		var promises = [];

		for (var ix = 0; ix < args.length; ix++) {
			promises.push(this.exec(args[ix]));
		}

		return Promise.all(promises).then(function (values) {
			return values;
		});
	};

	window.vkthread = new Vkthread();
})();
