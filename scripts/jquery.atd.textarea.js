/*
 * atd.core.js - A building block to create a front-end for AtD (from http://github.com/Automattic/atd-core, incorporated here).
 * Author      : Raphael Mudge
 * License     : LGPL
 * Project     : http://open.afterthedeadline.com
 * Discuss     : https://groups.google.com/forum/#!forum/atd-developers
 */

/* EXPORTED_SYMBOLS is set so this file can be a JavaScript Module */
var EXPORTED_SYMBOLS = ['AtDCore'];

function AtDCore() {
	/* these are the categories of errors AtD should ignore */
	this.ignore_types = ['Bias Language', 'Cliches', 'Complex Expression', 'Diacritical Marks', 'Double Negatives', 'Hidden Verbs', 'Jargon Language', 'Passive voice', 'Phrases to Avoid', 'Redundant Expression'];

	/* these are the phrases AtD should ignore */
	this.ignore_strings = {};

	/* Localized strings */
	this.i18n = {};
};

/*
 * Internationalization Functions
 */

AtDCore.prototype.getLang = function(key, defaultk) {
	if (this.i18n[key] == undefined)
		return defaultk;

	return this.i18n[key];
};

AtDCore.prototype.addI18n = function(localizations) {
	this.i18n = localizations;
};

/*
 * Setters
 */

AtDCore.prototype.setIgnoreStrings = function(string) {
	var parent = this;

	this.map(string.split(/,\s*/g), function(string) {
		parent.ignore_strings[string] = 1;
	});
};

AtDCore.prototype.showTypes = function(string) {
	var show_types = string.split(/,\s*/g);
	var types = {};

	/* set some default types that we want to make optional */

		/* grammar checker options */
	types["Double Negatives"]     = 1;
	types["Hidden Verbs"]         = 1;
	types["Passive voice"]        = 1;
	types["Bias Language"]        = 1;

		/* style checker options */
	types["Cliches"]              = 1;
	types["Complex Expression"]   = 1;
	types["Diacritical Marks"]    = 1;
	types["Jargon Language"]      = 1;
	types["Phrases to Avoid"]     = 1;
	types["Redundant Expression"] = 1;

        var ignore_types = [];

        this.map(show_types, function(string) {
                types[string] = undefined;
        });

        this.map(this.ignore_types, function(string) {
                if (types[string] != undefined) 
                        ignore_types.push(string);
        });

        this.ignore_types = ignore_types;
};

/* 
 * Error Parsing Code
 */

AtDCore.prototype.makeError = function(error_s, tokens, type, seps, pre) {        
	var struct = new Object();
	struct.type = type;
	struct.string = error_s;
	struct.tokens = tokens;

	if (new RegExp("\\b" + error_s + "\\b").test(error_s)) {
		struct.regexp = new RegExp("(?!"+error_s+"<)\\b" + error_s.replace(/\s+/g, seps) + "\\b");
	}
	else if (new RegExp(error_s + "\\b").test(error_s)) {
		struct.regexp = new RegExp("(?!"+error_s+"<)" + error_s.replace(/\s+/g, seps) + "\\b");
	}
	else if (new RegExp("\\b" + error_s).test(error_s)) {
		struct.regexp = new RegExp("(?!"+error_s+"<)\\b" + error_s.replace(/\s+/g, seps));
	}
	else {
		struct.regexp = new RegExp("(?!"+error_s+"<)" + error_s.replace(/\s+/g, seps));
	}

	struct.used   = false; /* flag whether we've used this rule or not */

	return struct;
};

AtDCore.prototype.addToErrorStructure = function(errors, list, type, seps) {
	var parent = this;                  

	this.map(list, function(error) {
		var tokens = error["word"].split(/\s+/);
		var pre    = error["pre"];
		var first  = tokens[0];

		if (errors['__' + first] == undefined) {      
			errors['__' + first] = new Object();
			errors['__' + first].pretoks  = {};
			errors['__' + first].defaults = new Array();
		}

		if (pre == "") {               
			errors['__' + first].defaults.push(parent.makeError(error["word"], tokens, type, seps, pre));
		} else {
			if (errors['__' + first].pretoks['__' + pre] == undefined)
				errors['__' + first].pretoks['__' + pre] = new Array();

			errors['__' + first].pretoks['__' + pre].push(parent.makeError(error["word"], tokens, type, seps, pre));
		}
	});
};

AtDCore.prototype.buildErrorStructure = function(spellingList, enrichmentList, grammarList) {
	var seps   = this._getSeparators();
	var errors = {};

	this.addToErrorStructure(errors, spellingList, "hiddenSpellError", seps);            
	this.addToErrorStructure(errors, grammarList, "hiddenGrammarError", seps);
	this.addToErrorStructure(errors, enrichmentList, "hiddenSuggestion", seps);
	return errors;
};

AtDCore.prototype._getSeparators = function() {
	var re = '', i;
	var str = '"s!#$%&()*+,./:;<=>?@[\]^_{|}';

	// Build word separator regexp
	for (i=0; i<str.length; i++)
		re += '\\' + str.charAt(i);

	return "(?:(?:[\xa0" + re  + "])|(?:\\-\\-))+";
};        

AtDCore.prototype.processXML = function(responseXML) {

	/* types of errors to ignore */
	var types = {};

	this.map(this.ignore_types, function(type) {
		types[type] = 1;
	});

	/* save suggestions in the editor object */
	this.suggestions = [];

	/* process through the errors */
	var errors = responseXML.getElementsByTagName('error');

	/* words to mark */
	var grammarErrors    = [];
	var spellingErrors   = [];
	var enrichment       = [];

	for (var i = 0; i < errors.length; i++) {
		if (errors[i].getElementsByTagName('string').item(0).firstChild != null) {
			var errorString      = errors[i].getElementsByTagName('string').item(0).firstChild.data;
			var errorType        = errors[i].getElementsByTagName('type').item(0).firstChild.data;
			var errorDescription = errors[i].getElementsByTagName('description').item(0).firstChild.data;

			var errorContext;

			if (errors[i].getElementsByTagName('precontext').item(0).firstChild != null) 
				errorContext = errors[i].getElementsByTagName('precontext').item(0).firstChild.data;   
			else
				errorContext = "";

			/* create a hashtable with information about the error in the editor object, we will use this later
			   to populate a popup menu with information and suggestions about the error */

			if (this.ignore_strings[errorString] == undefined) {
				var suggestion = {};
				suggestion["description"] = errorDescription;
				suggestion["suggestions"] = [];

				/* used to find suggestions when a highlighted error is clicked on */
				suggestion["matcher"]     = new RegExp('^' + errorString.replace(/\s+/, this._getSeparators()) + '$');

				suggestion["context"]     = errorContext;
				suggestion["string"]      = errorString;
				suggestion["type"]        = errorType;

				this.suggestions.push(suggestion);

				if (errors[i].getElementsByTagName('suggestions').item(0) != undefined) {
					var suggestions = errors[i].getElementsByTagName('suggestions').item(0).getElementsByTagName('option');
					for (var j = 0; j < suggestions.length; j++)
						suggestion["suggestions"].push(suggestions[j].firstChild.data);
				}

				/* setup the more info url */
				if (errors[i].getElementsByTagName('url').item(0) != undefined) {
					var errorUrl = errors[i].getElementsByTagName('url').item(0).firstChild.data;
					suggestion["moreinfo"] = errorUrl + '&theme=tinymce';
				}

				if (types[errorDescription] == undefined) {
					if (errorType == "suggestion")
						enrichment.push({ word: errorString, pre: errorContext });

					if (errorType == "grammar")
						grammarErrors.push({ word: errorString, pre: errorContext });
				}

				if (errorType == "spelling" || errorDescription == "Homophone")
					spellingErrors.push({ word: errorString, pre: errorContext });

				if (errorDescription == 'Cliches')
					suggestion["description"] = 'Clich&eacute;s'; /* done here for backwards compatability with current user settings */

				if (errorDescription == "Spelling")
					suggestion["description"] = this.getLang('menu_title_spelling', 'Spelling');

				if (errorDescription == "Repeated Word")
					suggestion["description"] = this.getLang('menu_title_repeated_word', 'Repeated Word');
				
				if (errorDescription == "Did you mean...")
					suggestion["description"] = this.getLang('menu_title_confused_word', 'Did you mean...');
			} // end if ignore[errorString] == undefined
		} // end if 
	} // end for loop

	var errorStruct;
        var ecount = spellingErrors.length + grammarErrors.length + enrichment.length;

	if (ecount > 0)
		errorStruct = this.buildErrorStructure(spellingErrors, enrichment, grammarErrors);
	else
		errorStruct = undefined;

	/* save some state in this object, for retrieving suggestions later */
	return { errors: errorStruct, count: ecount, suggestions: this.suggestions };
};

AtDCore.prototype.findSuggestion = function(element) {
        var text = element.innerHTML;
        var context = ( this.getAttrib(element, 'pre') + "" ).replace(/[\\,!\\?\\."\s]/g, '');
        if (this.getAttrib(element, 'pre') == undefined)
        {
           alert(element.innerHTML);
        }

	var errorDescription = undefined;
	var len = this.suggestions.length;
   
	for (var i = 0; i < len; i++) {
		var key = this.suggestions[i]["string"];
   
		if ((context == "" || context == this.suggestions[i]["context"]) && this.suggestions[i]["matcher"].test(text)) {
			errorDescription = this.suggestions[i];
			break;
		}
	}
	return errorDescription;
};

/*
 * TokenIterator class
 */

function TokenIterator(tokens) {
	this.tokens = tokens;
	this.index  = 0;
	this.count  = 0;
	this.last   = 0;
};

TokenIterator.prototype.next = function() {
	var current = this.tokens[this.index];
	this.count = this.last;
	this.last += current.length + 1;
	this.index++;

	/* strip single quotes from token, AtD does this when presenting errors */
	if (current != "") {
		if (current[0] == "'")
			current = current.substring(1, current.length);

		if (current[current.length - 1] == "'") 
			current = current.substring(0, current.length - 1);
	}

	return current;
};

TokenIterator.prototype.hasNext = function() {
	return this.index < this.tokens.length;
};

TokenIterator.prototype.hasNextN = function(n) {
	return (this.index + n) < this.tokens.length;            
};

TokenIterator.prototype.skip = function(m, n) {
	this.index += m;
	this.last += n;

	if (this.index < this.tokens.length)
		this.count = this.last - this.tokens[this.index].length;
};

TokenIterator.prototype.getCount = function() {
	return this.count;
};

TokenIterator.prototype.peek = function(n) {
	var peepers = new Array();
	var end = this.index + n;
	for (var x = this.index; x < end; x++)
		peepers.push(this.tokens[x]);
	return peepers;
};

/* 
 *  code to manage highlighting of errors
 */
AtDCore.prototype.markMyWords = function(container_nodes, errors) {           
	var seps  = new RegExp(this._getSeparators());
	var nl = new Array();
	var ecount = 0; /* track number of highlighted errors */
	var parent = this;

	/* Collect all text nodes */
	/* Our goal--ignore nodes that are already wrapped */
   
	this._walk(container_nodes, function(n) {
		if (n.nodeType == 3 && !parent.isMarkedNode(n))
			nl.push(n);
	});
 
	/* walk through the relevant nodes */  
   
	var iterator;
      
	this.map(nl, function(n) {
		var v;

		if (n.nodeType == 3) {
			v = n.nodeValue; /* we don't want to mangle the HTML so use the actual encoded string */
			var tokens = n.nodeValue.split(seps); /* split on the unencoded string so we get access to quotes as " */
			var previous = "";

			var doReplaces = [];

			iterator = new TokenIterator(tokens);

			while (iterator.hasNext()) {
				var token = iterator.next();
				var current  = errors['__' + token];

				var defaults;

				if (current != undefined && current.pretoks != undefined) {
					defaults = current.defaults;
					current = current.pretoks['__' + previous];

					var done = false;
					var prev, curr;

					prev = v.substr(0, iterator.getCount());
					curr = v.substr(prev.length, v.length);

					var checkErrors = function(error) {
						if (error != undefined && !error.used && foundStrings['__' + error.string] == undefined && error.regexp.test(curr)) {
							var oldlen = curr.length;

							foundStrings['__' + error.string] = 1;
							doReplaces.push([error.regexp, '<span class="'+error.type+'" pre="'+previous+'">$&</span>']);

							error.used = true;
							done = true;
						}
					};

					var foundStrings = {};

					if (current != undefined) {
						previous = previous + ' ';
						parent.map(current, checkErrors);
					}

					if (!done) {
						previous = '';
						parent.map(defaults, checkErrors);
					}
				}

				previous = token;
			} // end while

			/* do the actual replacements on this span */
			if (doReplaces.length > 0) {
				newNode = n;

				for (var x = 0; x < doReplaces.length; x++) {
					var regexp = doReplaces[x][0], result = doReplaces[x][1];

					/* it's assumed that this function is only being called on text nodes (nodeType == 3), the iterating is necessary
					   because eventually the whole thing gets wrapped in an mceItemHidden span and from there it's necessary to
					   handle each node individually. */
					var bringTheHurt = function(node) {
						if (node.nodeType == 3) {
							ecount++;

							/* sometimes IE likes to ignore the space between two spans, solution is to insert a placeholder span with
							   a non-breaking space.  The markup removal code substitutes this span for a space later */
							if (parent.isIE() && node.nodeValue.length > 0 && node.nodeValue.substr(0, 1) == ' ')
								return parent.create('<span class="mceItemHidden">&nbsp;</span>' + node.nodeValue.substr(1, node.nodeValue.length - 1).replace(regexp, result), false);
							else
								return parent.create(node.nodeValue.replace(regexp, result), false);
						} 
						else {
							var contents = parent.contents(node);

							for (var y = 0; y < contents.length; y++) {
								if (contents[y].nodeType == 3 && regexp.test(contents[y].nodeValue)) {
									var nnode;

									if (parent.isIE() && contents[y].nodeValue.length > 0 && contents[y].nodeValue.substr(0, 1) == ' ')
										nnode = parent.create('<span class="mceItemHidden">&nbsp;</span>' + contents[y].nodeValue.substr(1, contents[y].nodeValue.length - 1).replace(regexp, result), true);
									else
										nnode = parent.create(contents[y].nodeValue.replace(regexp, result), true);

									parent.replaceWith(contents[y], nnode);
									parent.removeParent(nnode);

									ecount++;

									return node; /* we did a replacement so we can call it quits, errors only get used once */
								}
							}

							return node;
						}
					};

					newNode = bringTheHurt(newNode);
				}

				parent.replaceWith(n, newNode);
			}
		} 
	}); 

	return ecount;
};

AtDCore.prototype._walk = function(elements, f) {
	var i;
	for (i = 0; i < elements.length; i++) {
		f.call(f, elements[i]);
		this._walk(this.contents(elements[i]), f);
	}
};  

AtDCore.prototype.removeWords = function(node, w) {   
	var count = 0;
	var parent = this;

	this.map(this.findSpans(node).reverse(), function(n) {
		if (n && (parent.isMarkedNode(n) || parent.hasClass(n, 'mceItemHidden') || parent.isEmptySpan(n)) ) {
			if (n.innerHTML == '&nbsp;') {
				var nnode = document.createTextNode(' '); /* hax0r */
				parent.replaceWith(n, nnode);
			}
			else if (!w || n.innerHTML == w) {
				parent.removeParent(n);
				count++;
			}
		}
	});

	return count;
};

AtDCore.prototype.isEmptySpan = function(node) {
	return (this.getAttrib(node, 'class') == "" && this.getAttrib(node, 'style') == "" && this.getAttrib(node, 'id') == "" && !this.hasClass(node, 'Apple-style-span') && this.getAttrib(node, 'mce_name') == "");
};

AtDCore.prototype.isMarkedNode = function(node) {
	return (this.hasClass(node, 'hiddenGrammarError') || this.hasClass(node, 'hiddenSpellError') || this.hasClass(node, 'hiddenSuggestion'));
};

/*
 * Context Menu Helpers
 */
AtDCore.prototype.applySuggestion = function(element, suggestion) {
	if (suggestion == '(omit)') {
		this.remove(element);
	}
	else {
		var node = this.create(suggestion);
		this.replaceWith(element, node);
		this.removeParent(node);
	}
};

/* 
 * Check for an error
 */
AtDCore.prototype.hasErrorMessage = function(xmlr) {
	return (xmlr != undefined && xmlr.getElementsByTagName('message').item(0) != null);
};

AtDCore.prototype.getErrorMessage = function(xmlr) {
	return xmlr.getElementsByTagName('message').item(0);
};

/* this should always be an error, alas... not practical */
AtDCore.prototype.isIE = function() {
	return navigator.appName == 'Microsoft Internet Explorer';
};
/*
 * jquery.atd.js - jQuery powered writing check with After the Deadline
 * atd.core.js - A building block to create a front-end for AtD (from http://github.com/Automattic/atd-core, incorporated here).
 * Author      : Raphael Mudge
 * License     : LGPL or MIT License (take your pick)
 * Project     : http://open.afterthedeadline.com
 * Discuss     : https://groups.google.com/forum/#!forum/atd-developers
 *
 * Derived from: 
 *
 * jquery.spellchecker.js - a simple jQuery Spell Checker
 * Copyright (c) 2008 Richard Willis
 * MIT license  : http://www.opensource.org/licenses/mit-license.php
 * Project      : http://jquery-spellchecker.googlecode.com
 * Contact      : willis.rh@gmail.com
 */

var AtD = 
{
	rpc : '', /* see the proxy.php that came with the AtD/TinyMCE plugin */
	rpc_css : 'http://www.polishmywriting.com/atd-jquery/server/proxycss.php?data=', /* you may use this, but be nice! */
	rpc_css_lang : 'en',
	api_key : '',
	i18n : {},
	listener : {}
};

AtD.getLang = function(key, defaultk) {
	if (AtD.i18n[key] == undefined)
		return defaultk;

	return AtD.i18n[key];
};

AtD.addI18n = function(localizations) {
	AtD.i18n = localizations;
	AtD.core.addI18n(localizations);
};

AtD.setIgnoreStrings = function(string) {
	AtD.core.setIgnoreStrings(string);
};

AtD.showTypes = function(string) {
	AtD.core.showTypes(string);
};

AtD.checkCrossAJAX = function(container_id, callback_f) {
	/* checks if a global var for click stats exists and increments it if it does... */
	if (typeof AtD_proofread_click_count != "undefined")  
		AtD_proofread_click_count++; 

	AtD.callback_f = callback_f; /* remember the callback for later */
	AtD.remove(container_id);
	var container = jQuery('#' + container_id);

	var html = container.html();
	text     = jQuery.trim(container.html());
	text     = encodeURIComponent( text.replace( /\%/g, '%25' ) ); /* % not being escaped here creates problems, I don't know why. */

	/* do some sanity checks based on the browser */
	if ((text.length > 2000 && navigator.appName == 'Microsoft Internet Explorer') || text.length > 7800) {
		if (callback_f != undefined && callback_f.error != undefined)
			callback_f.error("Maximum text length for this browser exceeded");

		return;
	}

	/* do some cross-domain AJAX action with CSSHttpRequest */
	CSSHttpRequest.get(AtD.rpc_css + text + "&lang=" + AtD.rpc_css_lang + "&nocache=" + (new Date().getTime()), function(response) {
		/* do some magic to convert the response into an XML document */
		var xml;
		if (navigator.appName == 'Microsoft Internet Explorer') {
			xml = new ActiveXObject("Microsoft.XMLDOM");
			xml.async = false;
			xml.loadXML(response);
		} 
		else {
			xml = (new DOMParser()).parseFromString(response, 'text/xml');
		}

		/* check for and display error messages from the server */
		if (AtD.core.hasErrorMessage(xml)) {
			if (AtD.callback_f != undefined && AtD.callback_f.error != undefined)
				AtD.callback_f.error(AtD.core.getErrorMessage(xml));

			return;
		} 

		/* highlight the errors */

		AtD.container = container_id;
		var count = AtD.processXML(container_id, xml);

		if (AtD.callback_f != undefined && AtD.callback_f.ready != undefined)
			AtD.callback_f.ready(count);

		if (count == 0 && AtD.callback_f != undefined && AtD.callback_f.success != undefined)
			AtD.callback_f.success(count);

		AtD.counter = count;
		AtD.count   = count;
	});
};

/* check a div for any incorrectly spelled words */
AtD.check = function(container_id, callback_f) {
	/* checks if a global var for click stats exists and increments it if it does... */
	if (typeof AtD_proofread_click_count != "undefined")
		AtD_proofread_click_count++; 

	AtD.callback_f = callback_f; /* remember the callback for later */

	AtD.remove(container_id);	
		
	var container = jQuery('#' + container_id);

	var html = container.html();
	text     = jQuery.trim(container.html());
	text     = encodeURIComponent( text ); /* re-escaping % is not necessary here. don't do it */

	jQuery.ajax({
		type : "POST",
		url : AtD.rpc + '/checkDocument',
		data : 'key=' + AtD.api_key + '&data=' + text,
		format : 'raw', 
		dataType : (jQuery.browser.msie) ? "text" : "xml",

		error : function(XHR, status, error) {
			if (AtD.callback_f != undefined && AtD.callback_f.error != undefined)
 				AtD.callback_f.error(status + ": " + error);
		},
	
		success : function(data) {
			/* apparently IE likes to return XML as plain text-- work around from:
			   http://docs.jquery.com/Specifying_the_Data_Type_for_AJAX_Requests */

			var xml;
			if (typeof data == "string") {
				xml = new ActiveXObject("Microsoft.XMLDOM");
				xml.async = false;
				xml.loadXML(data);
			} 
			else {
				xml = data;
			}

			if (AtD.core.hasErrorMessage(xml)) {
				if (AtD.callback_f != undefined && AtD.callback_f.error != undefined)
					AtD.callback_f.error(AtD.core.getErrorMessage(xml));

				return;
			}

			/* on with the task of processing and highlighting errors */

			AtD.container = container_id;
			var count = AtD.processXML(container_id, xml);

			if (AtD.callback_f != undefined && AtD.callback_f.ready != undefined)
				AtD.callback_f.ready(count);

			if (count == 0 && AtD.callback_f != undefined && AtD.callback_f.success != undefined)
				AtD.callback_f.success(count);

			AtD.counter = count;
			AtD.count   = count;
		}
	});
};
	
AtD.remove = function(container_id) {
	AtD._removeWords(container_id, null);
};

AtD.clickListener = function(event) {
	if (AtD.core.isMarkedNode(event.target))
		AtD.suggest(event.target);
};

AtD.processXML = function(container_id, responseXML) {

	var results = AtD.core.processXML(responseXML);
   
	if (results.count > 0)
		results.count = AtD.core.markMyWords(jQuery('#' + container_id).contents(), results.errors);

	jQuery('#' + container_id).unbind('click', AtD.clickListener);
	jQuery('#' + container_id).click(AtD.clickListener);

	return results.count;
};

AtD.useSuggestion = function(word) {
	this.core.applySuggestion(AtD.errorElement, word);

	AtD.counter --;
	if (AtD.counter == 0 && AtD.callback_f != undefined && AtD.callback_f.success != undefined)
		AtD.callback_f.success(AtD.count);
};

AtD.editSelection = function() {
	var parent = AtD.errorElement.parent();

	if (AtD.callback_f != undefined && AtD.callback_f.editSelection != undefined)
		AtD.callback_f.editSelection(AtD.errorElement);

	if (AtD.errorElement.parent() != parent) {
		AtD.counter --;
		if (AtD.counter == 0 && AtD.callback_f != undefined && AtD.callback_f.success != undefined)
			AtD.callback_f.success(AtD.count);
	}
};

AtD.ignoreSuggestion = function() {
	AtD.core.removeParent(AtD.errorElement); 

	AtD.counter --;
	if (AtD.counter == 0 && AtD.callback_f != undefined && AtD.callback_f.success != undefined)
		AtD.callback_f.success(AtD.count);
};

AtD.ignoreAll = function(container_id) {
	var target = AtD.errorElement.text();
	var removed = AtD._removeWords(container_id, target);

	AtD.counter -= removed;

	if (AtD.counter == 0 && AtD.callback_f != undefined && AtD.callback_f.success != undefined)
		AtD.callback_f.success(AtD.count);

	if (AtD.callback_f != undefined && AtD.callback_f.ignore != undefined) {
		AtD.callback_f.ignore(target);
		AtD.core.setIgnoreStrings(target);
	}
};

AtD.explainError = function() {
	if (AtD.callback_f != undefined && AtD.callback_f.explain != undefined)
		AtD.callback_f.explain(AtD.explainURL);
};

AtD.suggest = function(element) {
	/* construct the menu if it doesn't already exist */

	if (jQuery('#suggestmenu').length == 0) {
		var suggest = jQuery('<div id="suggestmenu"></div>');
		suggest.prependTo('body');
	}
	else {
		var suggest = jQuery('#suggestmenu');
		suggest.hide();
	}

	/* find the correct suggestions object */          

	errorDescription = AtD.core.findSuggestion(element);

	/* build up the menu y0 */

	AtD.errorElement = jQuery(element);

	suggest.empty();

	if (errorDescription == undefined) {
		suggest.append('<strong>' + AtD.getLang('menu_title_no_suggestions', 'No suggestions') + '</strong>');
	}
	else if (errorDescription["suggestions"].length == 0) {
		suggest.append('<strong>' + errorDescription['description'] + '</strong>');
	}
	else {
		suggest.append('<strong>' + errorDescription['description'] + '</strong>');

		for (var i = 0; i < errorDescription["suggestions"].length; i++) {
			(function(sugg) {
				suggest.append('<a href="javascript:AtD.useSuggestion(\'' + sugg.replace(/'/, '\\\'') + '\')">' + sugg + '</a>');
			})(errorDescription["suggestions"][i]);
		}
	}

	/* do the explain menu if configured */

	if (AtD.callback_f != undefined && AtD.callback_f.explain != undefined && errorDescription['moreinfo'] != undefined) {
		suggest.append('<a href="javascript:AtD.explainError()" class="spell_sep_top">' + AtD.getLang('menu_option_explain', 'Explain...') + '</a>');
		AtD.explainURL = errorDescription['moreinfo'];
	}

	/* do the ignore option */

	suggest.append('<a href="javascript:AtD.ignoreSuggestion()" class="spell_sep_top">' + AtD.getLang('menu_option_ignore_once', 'Ignore suggestion') + '</a>');

	/* add the edit in place and ignore always option */

	if (AtD.callback_f != undefined && AtD.callback_f.editSelection != undefined) {
		if (AtD.callback_f != undefined && AtD.callback_f.ignore != undefined)
			suggest.append('<a href="javascript:AtD.ignoreAll(\'' + AtD.container + '\')">' + AtD.getLang('menu_option_ignore_always', 'Ignore always') + '</a>');
		else
			suggest.append('<a href="javascript:AtD.ignoreAll(\'' + AtD.container + '\')">' + AtD.getLang('menu_option_ignore_all', 'Ignore all') + '</a>');
 
		suggest.append('<a href="javascript:AtD.editSelection(\'' + AtD.container + '\')" class="spell_sep_bottom spell_sep_top">' + AtD.getLang('menu_option_edit_selection', 'Edit Selection...') + '</a>');
	}
	else {
		if (AtD.callback_f != undefined && AtD.callback_f.ignore != undefined)
			suggest.append('<a href="javascript:AtD.ignoreAll(\'' + AtD.container + '\')" class="spell_sep_bottom">' + AtD.getLang('menu_option_ignore_always', 'Ignore always') + '</a>');
		else
			suggest.append('<a href="javascript:AtD.ignoreAll(\'' + AtD.container + '\')" class="spell_sep_bottom">' + AtD.getLang('menu_option_ignore_all', 'Ignore all') + '</a>');
	}

	/* show the menu */

	var pos = jQuery(element).offset();
	var width = jQuery(element).width();
	jQuery(suggest).css({ left: (pos.left + width) + 'px', top: pos.top + 'px' });

	jQuery(suggest).fadeIn(200);

	/* bind events to make the menu disappear when the user clicks outside of it */

	AtD.suggestShow = true;

	setTimeout(function() {
		jQuery("body").bind("click", function() {
			if (!AtD.suggestShow)
				jQuery('#suggestmenu').fadeOut(200);      
		});
	}, 1);

	setTimeout(function() {
		AtD.suggestShow = false;
	}, 2); 
};

AtD._removeWords = function(container_id, w) {
	return this.core.removeWords(jQuery('#' + container_id), w);
};

/*
 * Set prototypes used by AtD Core UI 
 */
AtD.initCoreModule = function() {
	var core = new AtDCore();

	core.hasClass = function(node, className) {
		return jQuery(node).hasClass(className);
	};

	core.map = jQuery.map;

	core.contents = function(node) {
		return jQuery(node).contents();
	};

	core.replaceWith = function(old_node, new_node) {
		return jQuery(old_node).replaceWith(new_node);
	};

	core.findSpans = function(parent) {
        	return jQuery.makeArray(parent.find('span'));
	};

	core.create = function(node_html, isTextNode) {
		return jQuery('<span class="mceItemHidden">' + node_html + '</span>');
	};

	core.remove = function(node) {
		return jQuery(node).remove();
	};

	core.removeParent = function(node) {
		/* unwrap exists in jQuery 1.4+ only. Thankfully because replaceWith as-used here won't work in 1.4 */
		if (jQuery(node).unwrap)
			return jQuery(node).contents().unwrap();
		else
			return jQuery(node).replaceWith(jQuery(node).html());
	};

	core.getAttrib = function(node, name) {
		return jQuery(node).attr(name);
	};

	return core;
};

AtD.core = AtD.initCoreModule();
/*
 * jquery.atd.textarea.js - jQuery powered writing check for textarea elements with After the Deadline
 * Author      : Raphael Mudge
 * License     : LGPL or MIT License (take your pick)
 * Project     : http://open.afterthedeadline.com
 * Discuss     : https://groups.google.com/forum/#!forum/atd-developers
 */

/* a variable to store textareas in */
AtD.textareas = {};

/* convienence method to restore the text area from the preview div */
AtD.restoreTextArea = function(id) {
	var options = AtD.textareas[id];

	/* check if we're in the proofreading mode, if not... then retunr */
	if (options == undefined || options['before'] == options['link'].html())
		return;

	/* clear the error HTML out of the preview div */
	AtD.remove(id);

	/* clear the AtD synchronization field */
	jQuery('#AtD_sync_').remove();
  
	/* swap the preview div for the textarea, notice how I have to restore the appropriate class/id/style attributes */

	var content;

	if (navigator.appName == 'Microsoft Internet Explorer')
		content = jQuery('#' + id).html().replace(/<BR.*?class.*?atd_remove_me.*?>/gi, "\n");
	else
		content = jQuery('#' + id).html();

	jQuery('#' + id).replaceWith( options['node'] );
	jQuery('#' + id).val( content.replace(/\&lt\;/g, '<').replace(/\&gt\;/, '>').replace(/\&amp;/g, '&') );
	jQuery('#' + id).height( options['height'] );

	/* change the link text back to its original label */
	options['link'].html( options['before'] );
};
 
AtD.checkTextAreaCrossAJAX = function(id, linkId, after) {
	AtD._checkTextArea(id, AtD.checkCrossAJAX, linkId, after);
}

AtD.checkTextArea = function(id, linkId, after) {   
	if (AtD.api_key == undefined || AtD.rpc == undefined)
		alert("You need to set AtD.api_key and AtD.rpc to use AtD.checkTextArea()"); /* this message is for developers, no l10n needed */
	else
		AtD._checkTextArea(id, AtD.check, linkId, after);
}

/* where the magic happens, checks the spelling or restores the form */
AtD._checkTextArea = function(id, commChannel, linkId, after) {
	var container = jQuery('#' + id);

	/* store options based on the unique ID of the textarea */
	if (AtD.textareas[id] == undefined) {
		var properties = {};
		var saveProperty = function(key, node) {
			if (node.css(key) != "")
				properties[key] = node.css(key);
		}

		var saveme = ['background-color', 'color', 'font-size', 'font-family', 'border-top-width', 'border-bottom-width', 'border-left-width', 'border-right-width', 'border-top-style', 'border-bottom-style', 'border-left-style', 'border-right-style', 'border-top-color', 'border-bottom-color', 'border-left-color', 'border-right-color', 'text-align', 'margin-top', 'margin-bottom', 'margin-left', 'margin-right', 'width', 'line-height', 'letter-spacing', 'left', 'right', 'top', 'bottom', 'position', 'padding-left', 'padding-right', 'padding-top', 'padding-bottom' ];

		for (var x = 0, node = container; x < saveme.length; x++) {
			saveProperty(saveme[x], node);
		}

		AtD.textareas[id] = { 
			'node': container, 
			'height': container.height(), 
			'link': jQuery('#' + linkId), 
			'before': jQuery('#' + linkId).html(), 
			'after': after,
			'style': properties
		};
	}

	var options = AtD.textareas[id];

	/* If the text of the link says edit comment, then restore the textarea so the user can edit the text */
	if (options['link'].html() != options['before']) {
		AtD.restoreTextArea(id);
	}          
	else {
		/* set the spell check link to a link that lets the user edit the text */
		options['link'].html( options['after'] );
          
		/* disable the spell check link while an asynchronous call is in progress. if a user tries to make a request while one is in progress
		   they will lose their text. Not cool! */
		var disableClick = function() { return false; };
		options['link'] .click(disableClick);
 
		/* replace the textarea with a preview div, notice how the div has to have the same id/class/style attributes as the textarea */
       
		var div;

		var hidden = jQuery('<input type="hidden" />');
		hidden.attr('id', 'AtD_sync_');
		hidden.val(container.val());
		var name = container.attr('name');

		if (navigator.appName == 'Microsoft Internet Explorer') {
			container.replaceWith( '<div id="' + id + '">' + container.val().replace(/\&/g, '&amp;').replace(/[\n\r\f]/gm, '<BR class="atd_remove_me">') + '</div>' );
			div = jQuery('#' + id);
			div.attr('style', options['node'].attr('style') );
			div.attr('class', options['node'].attr('class') );
			div.css( { 'overflow' : 'auto' } );
			options['style']['font-size'] = undefined;
			options['style']['font-family'] = undefined;
		} 
		else {
			container.replaceWith( '<div id="' + id + '">' + container.val().replace(/\&/g, '&amp;') + '</div>' );
			div = jQuery('#' + id);
			div.attr('style', options['node'].attr('style') );
			div.attr('class', options['node'].attr('class') );
			div.css( { 'overflow' : 'auto', 'white-space' : 'pre-wrap' } );
			div.attr('contenteditable', 'true'); 
			div.attr('spellcheck', false); /* ours is better */
			div.css({ 'outline' : 'none' }); 
		}


		/* block the enter key in proofreading mode */
		div.keypress(function (event) {
			return event.keyCode != 13;
		});

		/* setup the hidden attribute that will keep in sync with the contents of the textarea */
		hidden.attr('name', name);
		div.after(hidden);

		var inProgress = false;

		var syncContents = function() {
			if (inProgress)
				return;

			inProgress = true;

			setTimeout(function() {
				var content;
				if (navigator.appName == 'Microsoft Internet Explorer')
					content = div.html().replace(/<BR.*?class.*?atd_remove_me.*?>/gi, "\n");
				else
					content = div.html();

				/* strip the AtD markup */
				var temp = jQuery('<div></div>');
				temp.html(content); 
				AtD.core.removeWords(temp);

				hidden.val(temp.html().replace(/\&lt\;/g, '<').replace(/\&gt\;/, '>').replace(/\&amp;/g, '&'));
				inProgress = false;
			}, 1500);
		};

		div.keypress(syncContents);
		div.mousemove(syncContents);
		div.mouseout(syncContents);

		/* update some more CSS properties (the ones that time forgot) */
		div.css( options['style'] );
		div.height( options['height'] );

		/* check the writing in the textarea */
		commChannel(id, {
			ready: function(errorCount) {
				/* this function is called when the AtD async service request has finished.
				   this is a good time to allow the user to click the spell check/edit text link again. */
				options['link'].unbind('click', disableClick);
			},
  
			explain: function(url) {
				var left = (screen.width / 2) - (480 / 2);
				var top = (screen.height / 2) - (380 / 2);
				window.open( url, '', 'width=480,height=380,toolbar=0,status=0,resizable=0,location=0,menuBar=0,left=' + left + ',top=' + top).focus();
			},

			success: function(errorCount) {
				if (errorCount == 0)
					alert( AtD.getLang('message_no_errors_found', "No writing errors were found") );

				/* once all errors are resolved, this function is called, it's an opportune time
				   to restore the textarea */
				AtD.restoreTextArea( id );
			},

			error: function(reason) {
				options['link'].unbind('click', disableClick);
	
				if (reason == undefined)
					alert( AtD.getLang('message_server_error_short', "There was an error communicating with the spell checking service.") );
				else
					alert( AtD.getLang('message_server_error_short', "There was an error communicating with the spell checking service.") + "\n\n" + reason );

				/* restore the text area since there won't be any highlighted spelling errors */
				AtD.restoreTextArea( id );
			},

			editSelection : function(element) {
				var text = prompt( AtD.getLang('dialog_replace_selection', "Replace selection with:"), element.text() );
				if (text != null) {
					jQuery(element).html( text );
					AtD.core.removeParent(element);
				}
			}
		});
	}
}

jQuery.fn.addProofreader = function(options) {
	this.id = 0;

	var parent = this;
	var opts = jQuery.extend({}, jQuery.fn.addProofreader.defaults, options);

	return this.each(function() {
		$this = jQuery(this);

		if ($this.css('display') == 'none')
			return;

		if ($this.attr('id').length == 0) {
			$this.attr('id', 'AtD_' + parent.id++);
		}

		var id = $this.attr('id');
		var node = jQuery('<span></span>');
		node.attr('id', 'AtD_' + parent.id++);
		node.html(opts.proofread_content);
		node.click(function(event) { 
			if (AtD.current_id != undefined && AtD.current_id != id) {
				AtD.restoreTextArea(AtD.current_id);
			}

			if (AtD.api_key != "" && AtD.rpc != "") {
				AtD.checkTextArea(id, node.attr('id'), opts.edit_text_content);
 			}
			else {
				AtD.checkTextAreaCrossAJAX(id, node.attr('id'), opts.edit_text_content); 
			}

			AtD.current_id = id;
		});
		$this.wrap('<div></div>');

		/* attach a submit listener to the parent form */
		$this.parents('form').submit(function(event) {
			AtD.restoreTextArea(id);
		});

		$this.before(node);
	});
};

jQuery.fn.addProofreader.defaults = {
	edit_text_content: '<span class="AtD_edit_button"></span>',
	proofread_content: '<span class="AtD_proofread_button"></span>'
};
