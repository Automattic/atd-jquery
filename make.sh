#!/bin/bash

# Create the textarea extension

cat src/atd.core.js src/jquery.atd.js src/jquery.atd.textarea.js >scripts/jquery.atd.textarea.js
cat src/atd.core.js src/jquery.atd.js >scripts/jquery.atd.js

cp src/csshttprequest.js scripts/csshttprequest.js

# checks for jsmin, if it exists, uses it to minify the combined file
# http://crockford.com/javascript/jsmin

if which jsmin 1>/dev/null 2>/dev/null; then
	mv scripts/jquery.atd.textarea.js scripts/jquery.atd.textarea.js.tmp
	jsmin <scripts/jquery.atd.textarea.js.tmp >scripts/jquery.atd.textarea.js
	rm -f scripts/jquery.atd.textarea.js.tmp

	mv scripts/jquery.atd.js scripts/jquery.atd.js.tmp
	jsmin <scripts/jquery.atd.js.tmp >scripts/jquery.atd.js
	rm -f scripts/jquery.atd.js.tmp

	jsmin <src/csshttprequest.js >scripts/csshttprequest.js
fi
