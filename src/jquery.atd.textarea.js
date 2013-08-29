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
