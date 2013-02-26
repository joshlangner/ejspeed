(function() {

  	var rsplit = function(string, regex) {
  		
		var result = regex.exec(string),
			retArr = [], 
			first_idx, 
			last_idx, 
			first_bit,
			rsplit_idx = 0;

		while (result != null) {
			first_idx = result.index; 
			last_idx = regex.lastIndex;
			if ((first_idx) != 0) {
				first_bit = string.substring(0,first_idx);
				retArr[rsplit_idx++] = string.substring(0,first_idx);
				string = string.slice(first_idx);
			}		
			retArr[rsplit_idx++] = result[0];
			string = string.slice(result[0].length);
			result = regex.exec(string);
				
		}

		if (! string == '') {
			retArr[rsplit_idx++] = string;
		}
		return retArr;
	}

	var chop =  function(string) {
		return string.substr(0, string.length - 1);
	}

	var extend = function(d, s) {
		for(var n in s) {
			if (s.hasOwnProperty(n))  d[n] = s[n];
		}
	}

	EJSpeed = function(options) {
		options = typeof options == "string" ? {view: options} : options
		this.set_options(options);
		if (options.precompiled) {
			this.template = {};
			this.template.process = options.precompiled;
			EJSpeed.update(this.name, this);
			return;
		}
		if (options.element) {
			if (typeof options.element == 'string') {
				var name = options.element
				options.element = document.getElementById(options.element);
				if (options.element == null) throw name+'does not exist!';
			}
			if (options.element.value) {
				this.text = options.element.value;
			} else {
				this.text = options.element.innerHTML;
			}
			this.name = options.element.id;
		} else if (options.url) {
			options.url = EJSpeed.endExt(options.url, this.extMatch);
			this.name = this.name ? this.name : options.url;
			var url = options.url
			var template = EJSpeed.get(this.name, this.cache);
			if (template) return template;
			if (template == EJSpeed.INVALID_PATH) return null;
			try {
				this.text = EJSpeed.request( url+(this.cache ? '' : '?'+Math.random() ));
			} catch(e){}

			if (this.text == null) {
				throw( {type: 'EJSpeed', message: 'There is no template at '+url}  );
			}
		}
		var template = new EJSpeed.Compiler(this.text, this.type);

		template.compile(options, this.name);
		
		EJSpeed.update(this.name, this);
		this.template = template;
	};

	EJSpeed.prototype = {
		render : function(object, extra_helpers) {
			object = object || {nodata:true};
			this._extra_helpers = extra_helpers;
			helper_fns = new EJSpeed.Helpers(object, extra_helpers || {});
			return this.template.process.call(object, object, helper_fns);
		},
		update : function(element, options) {
			if (typeof element == 'string') {
				element = document.getElementById(element);
			}
			if (options == null) {
				_template = this;
				return function(object) {
					EJSpeed.prototype.update.call(_template, element, object);
				}
			}
			if (typeof options == 'string') {
				params = {};
				params.url = options;
				_template = this;
				params.onComplete = function(request) {
					var object = eval( request.responseText );
					EJSpeed.prototype.update.call(_template, element, object);
				}
				EJSpeed.ajax_request(params);
			} else {
				element.innerHTML = this.render(options);
			}
		},
		out : function() {
			return this.template.out;
		},
		set_options : function(options) {
			this.type = options.type || EJSpeed.type;
			this.cache = options.cache != null ? options.cache : EJSpeed.cache;
			this.text = options.text || null;
			this.name =  options.name || null;
			this.ext = options.ext || EJSpeed.ext;
			this.extMatch = new RegExp(this.ext.replace(/\./, '\.'));
		}
	};

	EJSpeed.endExt = function(path, match) {
		if (!path) return null;
		match.lastIndex = 0;
		return path + (match.test(path) ? '' : this.ext );
	}

	EJSpeed.Scanner = function(source, left, right) {

		extend(this, {
			left_delimiter: left,
			right_delimiter: right,
			double_left: left+'%',
			double_right: '%'+right,
			left_equal: left+'=',
			left_comment: left+'#'
		})

		this.SplitRegexp = new RegExp('('+this.double_left+')|('+this.double_right+')|('+this.left_equal+')|('+this.left_comment+')|('+this.left_delimiter+')|('+this.right_delimiter+'\n)|('+this.right_delimiter+')|(\n)');

		this.source = source;
		this.stag = null;
		this.lines = 0;
	};

	EJSpeed.Scanner.to_text = function(input) {
		if (input == null || input === undefined) {
			return '';
		}
		if (input instanceof Date) {
			return input.toDateString();
		}
		if (input.toString) {
			return input.toString();
		}
		return '';
	};

	EJSpeed.Scanner.prototype = {
		scan: function(block) {
			scanline = this.scanline;
			regex = this.SplitRegexp;
			if (! this.source == '') {
				var source_split = rsplit(this.source, /\n/);
				for (var i = 0, len = source_split.length; i < len; i++) {
					var item = source_split[i];
					this.scanline(item, regex, block);
				}
			}
		},
		scanline: function(line, regex, block) {
			this.lines++;
			var line_split = rsplit(line, regex);
			for (var i = 0, len = line_split.length; i < len; i++) {
				var token = line_split[i];
				if (token != null) {
					try { block(token, this) } 
					catch(e) { throw {type: 'EJSpeed.Scanner', line: this.lines} }
				}
			}
		}
	};

	EJSpeed.Buffer = function(pre_cmd, post_cmd) {
		this.line = [];
		this.script = "";
		this.pre_cmd = pre_cmd;
		this.post_cmd = post_cmd;
		for (var i = 0, len = this.pre_cmd.length; i < len; i++) {
			this.directAssign(pre_cmd[i]);
		}
	};

	EJSpeed.Buffer.prototype = {		
		directAssign: function(cmd) {
			this.line[this.line.length] = cmd;
		},
		cr: function() {
			this.script = this.script + this.line.join('; ');
			this.line = [];
			this.script = this.script + "\n";
		},
		close: function() {
			if (this.line.length > 0) {
				for (var i = 0, len = this.post_cmd.length; i < len; i++) {
					this.directAssign(pre_cmd[i]);
				}
				this.script = this.script + this.line.join('; ');
				line = null;
			}
		}
	};

	EJSpeed.Compiler = function(source, left) {
		this.pre_cmd = ['var ___ViewO = [];'];
		this.post_cmd = [];
		this.source = ' ';	
		if (source != null) {
			if (typeof source == 'string') {
				source = source.replace(/\r\n/g, "\n");
				source = source.replace(/\r/g,   "\n");
				this.source = source;
			} else if (source.innerHTML) {
				this.source = source.innerHTML;
			} 
			if (typeof this.source != 'string') {
				this.source = "";
			}
		}

		left = left || '<%';
		var right = '%>';
		switch(left) {
			case '[%':
				right = '%]';
				break;
			case '{{':
				right = '}}';
			case '<%':
				break;
			default:
				throw left+' is not a supported deliminator';
				break;
		}

		this.scanner = new EJSpeed.Scanner(this.source, left, right);
		this.out = '';
	};

	EJSpeed.Compiler.prototype = {
		compile: function(options, name) {
			options = options || {};
			this.out = '';
			var put_cmd = "___ViewO[___ViewO.length]=";
			var insert_cmd = put_cmd;
			var buff = new EJSpeed.Buffer(this.pre_cmd, this.post_cmd);
			var content = '';
			
			var clean = function(content) {
				content = content.replace(/\\/g, '\\\\');
				content = content.replace(/\n/g, '\\n');
				content = content.replace(/"/g,  '\\"');
				return content;
			};

			this.scanner.scan(function(token, scanner) {
				if (scanner.stag == null) {
					switch(token) {
						case '\n':
							content = content + "\n";
							buff.directAssign(put_cmd + '"' + clean(content) + '";');
							buff.cr();
							content = '';
							break;
						case scanner.left_delimiter:
						case scanner.left_equal:
						case scanner.left_comment:
							scanner.stag = token;
							if (content.length > 0) {
								buff.directAssign(put_cmd + '"' + clean(content) + '";');
							}
							content = '';
							break;
						case scanner.double_left:
							content = content + scanner.left_delimiter;
							break;
						default:
							content = content + token;
							break;
					}
				}
				else {
					switch(token) {
						case scanner.right_delimiter:
							switch(scanner.stag) {
								case scanner.left_delimiter:
									if (content[content.length - 1] == '\n') {
										content = chop(content);
										buff.directAssign(content);
										buff.cr();
									}
									else {
										buff.directAssign(content);
									}
									break;
								case scanner.left_equal:
									buff.directAssign(insert_cmd + "(EJSpeed.Scanner.to_text(" + content + "));");
									break;
							}
							scanner.stag = null;
							content = '';
							break;
						case scanner.double_right:
							content = content + scanner.right_delimiter;
							break;
						default:
							content = content + token;
							break;
					}
				}
			});

			if (content.length > 0) {
				buff.directAssign(put_cmd + '"' + clean(content) + '"');
			}

			buff.close();
			this.out = buff.script + ";";

			var to_be_evaled = 'this.process = function(Data, Fn) { try { var Data = Data||{}, Fn = Fn||{};'+this.out+"; return ___ViewO.join(''); }catch(e){e.lineNumber=null;throw e;}};";

			try { eval(to_be_evaled); } 
			catch(e) {
				if (typeof JSLINT != 'undefined') {
					JSLINT(this.out);
					for (var i = 0, len = JSLINT.errors.length; i < len; i++) {
						var error = JSLINT.errors[i];
						if (error.reason != "Unnecessary semicolon.") {
							error.line++;
							var e = new Error();
							e.lineNumber = error.line;
							e.message = error.reason;
							if (options.view)
								e.fileName = options.view;
							throw e;
						}
					}
				} else {
					throw e;
				}
			}
		}
	};

	EJSpeed.config = function(options) {
		EJSpeed.cache = options.cache != null ? options.cache : EJSpeed.cache;
		EJSpeed.type = options.type != null ? options.type : EJSpeed.type;
		EJSpeed.ext = options.ext != null ? options.ext : EJSpeed.ext;
		
		var templates_directory = EJSpeed.templates_directory || {};
		EJSpeed.templates_directory = templates_directory;
		EJSpeed.get = function(path, cache) {
			if (cache == false) return null;
			if (templates_directory[path]) return templates_directory[path];
			return null;
		};
		
		EJSpeed.update = function(path, template) { 
			if (path == null) return;
			templates_directory[path] = template;
		};
		
		EJSpeed.INVALID_PATH =  -1;
	};

	EJSpeed.config({cache: true, type: '<%', ext: '.html'}); 

	EJSpeed.Helpers = function(data, extras) {
		this._data = data;
		this._extras = extras;
		extend(this, extras);
	};

	EJSpeed.Helpers.prototype = {
		view: function(options, data, helpers) {
			if (!helpers) helpers = this._extras
			if (!data) data = this._data;
			return new EJSpeed(options).render(data, helpers);
		},
		to_text: function(input, null_text) {
			if (input == null || input === undefined) return null_text || '';
			if (input instanceof Date) return input.toDateString();
			if (input.toString) return input.toString().replace(/\n/g, '<br />').replace(/''/g, "'");
			return '';
		},
		include: function(options, data) {
			if (!data) data = this._data;
			return new EJSpeed({url: options}).render(data);
		}
	};

	EJSpeed.newRequest = function() {
	   var factories = [function() { return new ActiveXObject("Msxml2.XMLHTTP"); },function() { return new XMLHttpRequest(); },function() { return new ActiveXObject("Microsoft.XMLHTTP"); }];
		for (var i = 0, len = factories.length; i < len; i++) {
			try {
				var request = factories[i]();
				if (request != null)  return request;
			}
			catch(e) { continue; }
		}
	};

	EJSpeed.request = function(path) {
	   var request = new EJSpeed.newRequest()
	   request.open("GET", path, false);
	   
	   try {request.send(null);}
	   catch(e) {return null;}
	   
	   if ( request.status == 404 || request.status == 2 ||(request.status == 0 && request.responseText == '') ) return null;
	   
	   return request.responseText
	};

	EJSpeed.ajax_request = function(params) {
		params.method = ( params.method ? params.method : 'GET')
		
		var request = new EJSpeed.newRequest();
		request.onreadystatechange = function() {
			if (request.readyState == 4) {
				if (request.status == 200) { params.onComplete(request) } 
				else { params.onComplete(request) }
			}
		}
		request.open(params.method, params.url)
		request.send(null)
	};

})();
