atd-jquery
==========

### After the Deadline API for jQuery (1.3, 1.4.1) - README

[After the Deadline](http://www.afterthedeadline.com) is an [open source](http://open.afterthedeadline.com/) software service that [checks spelling, style, and grammar](http://www.afterthedeadline.com/features.slp).
   This package contains an AtD API and examples for using After the Deadline in your web application.

Automattic no longer supports this library.  We're putting it on Github so that you can feel free to fork it, hack it, and release your own version.

### AtD API

### Quick Start

The API above gives you full control over what AtD does. If you'd like to get going quicker and you have a basic form, then the jQuery style API is what you want. To attach AtD to a textarea:

   <pre>$(textarea).addProofreader({ edit_text_content: 'Edit Text', proofread_content: 'Proofread' );</pre>

   <p>This call will also hook the parent form's submit event to restore the textarea for you.

You can customize the HTML used for the proofread and edit text links. If you want to communicate using a proxy, set AtD.rpc and AtD.api_key to the appropriate values and the proofreader will use that communication method instead.

### Customizing

You may customize the suggestions menu and the error styles in _css/atd.css_.

### Examples

The best way to learn to use the AtD API is to look at the examples and adapt them to your needs.  The two examples included are:

*   [Check writing on a DIV](demo.html)
*   [Check writing in a TextArea](demo2.html)
*   [Check writing in a TextArea (Quick Start)](demo3.html)
*   [Check writing in a TextArea (Quick Start) [French]](demo3.fr.html)

### Localization

To localize the strings in this extension, create an object with the localized strings. Here is an example:

<pre>var my_plugin_strings = {
   menu_title_spelling: "Spelling",
   menu_title_repeated_word: "Repeated  Word",
   menu_title_no_suggestions: "No suggestions",
   menu_option_explain: "Explain...",
   menu_option_ignore_once: "Ignore suggestion",
   menu_option_ignore_all: "Ignore all",
   menu_option_ignore_always: "Ignore always",
   menu_option_edit_selection: "Edit Selection...",
   message_no_errors_found: "No writing errors were found.",
   message_server_error_short: "There was a problem communicating with the After the Deadline service.",
   dialog_replace_selection: "Replace selection with:"
};</pre>

Then make AtD use these strings:

   <pre>AtD.addI18n(my_plugin_strings);</pre>

These string labels are compatible with the [AtD/TinyMCE extension](http://www.afterthedeadline.com/download.slp?platform=TinyMCE).

### Commercial use and running your own server

This library requires a running instance of an AtD server.  Automattic operates an instance that you can use for personal projects as long as you don't send too much traffic.  This library are configured to use this server by default.

For high volume and commercial uses of AtD, you must run your own server.  The code is available on Github: [After the Deadline Server](https://github.com/automattic/atd-server).  See the [After the Deadline Developer's page](http://open.afterthedeadline.com/) for more information, and check out the [AtD Developers Google Group](http://groups.google.com/group/atd-developers) for discussion and community support.  

When you run your own server, replace `service.afterthedeadline.com` with your server's hostname.

### AtD and Encoding

As a final note, make sure your webpage is encoded in UTF-8 format. AJAX requests use the encoding of the parent website and AtD expects UTF-8. This is important as AtD has better support for accented characters and languages beyond English.

## License

Unless otherwise noted, the resources here are dual licensed under [LGPL](http://www.opensource.org/licenses/lgpl-2.1.php) and [MIT](http://www.opensource.org/licenses/mit-license.php) license.  

The files _scripts/csshttprequest.js_ and _server/cssencode.php_ are &copy; 2008-2009 [nb.io](http://nb.io/) and are licensed under the BSD license.

## Contact

We (Automattic) are no longer supporting this library.  This code has always been open source.  We're putting it on Github so that you can feel free to fork it, hack it, and release your own version.

Join the [atd-developers](http://groups.google.com/group/atd-developers) list for community support.

