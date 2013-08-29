### 3 May 10

*   fixed content-type of proxycss.php to allow cross-domain AJAX to work in other browsers

### 24 Mar 10

*   Updated to latest AtD/Core module:

        *   Added L10n string _menu_title_confused_word_ to localize "Did you mean..."
    *   Fixed two cases of parent variable polution (two for loops not declaring their vars)
    *   Fixed bug preventing subsequent occurences of one error (w/ the same context) from highlighting
    *   Error highlighter now uses beginning of word boundary to accurately find error location in text
    *   Fixed bug preventing misspelled words in single quotes from being highlighted
*   Updated addProofreader to ignore spellcheck attribute. Use `$(textarea[spellcheck!=false]).addProofreader();` to get the old behavior
*   Updated proxycss.php to support a lang=[de,en,es,fr,pt] parameter to specify language
*   Fixed proxycss reporting wrong content-length to AtD server (and thereby causing a hand) for strings with multi-byte chars

### 15 Feb 10

*   Fixed compatability issues with jQuery 1.4.1. This extension still works with 1.3

*   Thanks [Gautam](http://gaut.am) for reporting this issue and contributing a patch for ignore suggestion*   Fixed a highlighting issue
*   Fixed an I18n issue with AtD Core strings
*   Bug fix to AtD Core, was ignoring all show types settings

### 14 Jan 10

*   Made the AtD.setIgnoreTypes and AtD.showTypes calls tolerate whitespaces after commas
*   Added localization support to the extension.
*   Fixed a bug with spaces getting eaten in IE (occasionally)
*   Fixed a bug where (omit) suggestions didn't remove the highlighted phrase
*   Added a make.sh to combine multiple scripts into one and to run jsmin if it's in the path
*   Added jQuery('selector').addProofreader() function to transparently handle the details of adding AtD to a textarea.
*   AtD.checkTextArea now does a better job mimicing the replaced text editor
*   Fixed a bug applying suggestions with a ' quote in them.
*   Textarea extension now sets contentEditable="true" in proofreading DIV on non-IE browsers. This means some users can edit their text while the errors are displayed.
*   Textarea extension now keeps a hidden input buffer (with the form name of the original textarea) in sync with the contents of the proofreading div
*   Added a workaround to a bug with CSS communication method escaping the ' character (it's in the CSS proxy file, it replaces \' with ')
*   Added a hack to prevent encoding of <, > -> &lt;, &gt; when switching from proofreading mode.

### 11 Dec 09

*   Fixed an error highlighting issue
*   Plugin now checks if a global constant, AtD_proofread_click_count exists. If it does--it increments it with each use.

### 12 Nov 09

*   Updated editSelection ability to keep phrase highlighted if no change was made
*   Fixed a character escaping issue with AtD.check()
*   Plugin is now smarter about reporting an accurate error count (important for showing no errors found message at the right times)
*   Added "Diacritical Marks" error type to default ignore list. This is a new AtD style checking option to help restore missing accents to English words   borrowed from other languages.
*   Added a _scripts/jquery.atd.textarea.js_ with an API to hook AtD into a TextArea--saves you the work.

## 3 Nov 09

The purpose of this release is to fix bugs and make this plugin support the full set of features in After the Deadline.

*   Added _editSelection_, _explain_, _ignore_, and _ready_ callbacks to `AtD.check()` and `AtD.checkCrossAJAX`.
*   Added `AtD.setIgnoreStrings` and `AtD.showTypes`
*   Text sent to AtD proxy is now escaped properly.
*   Added proxy.php from the TinyMCE plugin to the AtD/jQuery distribution. Point `AtD.rpc` to _proxy.php?url=_ if you want to use the <code>check()<code> function
*   Fixed a bug that allowed two errors in the same span to step on eachother.

## 27 Oct 09

initial release
