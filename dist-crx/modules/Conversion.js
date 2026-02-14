import { __vitePreload } from './index.js';
import { getDefaultExportFromCjs } from './_commonjsHelpers.js';
import { deAlphaChannel } from './ImageProcess.js';
import { writeText, writeHTML } from './Clipboard.js';
import { loadSettings } from './Settings.js';

function extend (destination) {
  for (var i = 1; i < arguments.length; i++) {
    var source = arguments[i];
    for (var key in source) {
      if (source.hasOwnProperty(key)) destination[key] = source[key];
    }
  }
  return destination
}

function repeat (character, count) {
  return Array(count + 1).join(character)
}

function trimLeadingNewlines (string) {
  return string.replace(/^\n*/, '')
}

function trimTrailingNewlines (string) {
  // avoid match-at-end regexp bottleneck, see #370
  var indexEnd = string.length;
  while (indexEnd > 0 && string[indexEnd - 1] === '\n') indexEnd--;
  return string.substring(0, indexEnd)
}

function trimNewlines (string) {
  return trimTrailingNewlines(trimLeadingNewlines(string))
}

var blockElements = [
  'ADDRESS', 'ARTICLE', 'ASIDE', 'AUDIO', 'BLOCKQUOTE', 'BODY', 'CANVAS',
  'CENTER', 'DD', 'DIR', 'DIV', 'DL', 'DT', 'FIELDSET', 'FIGCAPTION', 'FIGURE',
  'FOOTER', 'FORM', 'FRAMESET', 'H1', 'H2', 'H3', 'H4', 'H5', 'H6', 'HEADER',
  'HGROUP', 'HR', 'HTML', 'ISINDEX', 'LI', 'MAIN', 'MENU', 'NAV', 'NOFRAMES',
  'NOSCRIPT', 'OL', 'OUTPUT', 'P', 'PRE', 'SECTION', 'TABLE', 'TBODY', 'TD',
  'TFOOT', 'TH', 'THEAD', 'TR', 'UL'
];

function isBlock (node) {
  return is(node, blockElements)
}

var voidElements = [
  'AREA', 'BASE', 'BR', 'COL', 'COMMAND', 'EMBED', 'HR', 'IMG', 'INPUT',
  'KEYGEN', 'LINK', 'META', 'PARAM', 'SOURCE', 'TRACK', 'WBR'
];

function isVoid (node) {
  return is(node, voidElements)
}

function hasVoid (node) {
  return has(node, voidElements)
}

var meaningfulWhenBlankElements = [
  'A', 'TABLE', 'THEAD', 'TBODY', 'TFOOT', 'TH', 'TD', 'IFRAME', 'SCRIPT',
  'AUDIO', 'VIDEO'
];

function isMeaningfulWhenBlank (node) {
  return is(node, meaningfulWhenBlankElements)
}

function hasMeaningfulWhenBlank (node) {
  return has(node, meaningfulWhenBlankElements)
}

function is (node, tagNames) {
  return tagNames.indexOf(node.nodeName) >= 0
}

function has (node, tagNames) {
  return (
    node.getElementsByTagName &&
    tagNames.some(function (tagName) {
      return node.getElementsByTagName(tagName).length
    })
  )
}

var rules = {};

rules.paragraph = {
  filter: 'p',

  replacement: function (content) {
    return '\n\n' + content + '\n\n'
  }
};

rules.lineBreak = {
  filter: 'br',

  replacement: function (content, node, options) {
    return options.br + '\n'
  }
};

rules.heading = {
  filter: ['h1', 'h2', 'h3', 'h4', 'h5', 'h6'],

  replacement: function (content, node, options) {
    var hLevel = Number(node.nodeName.charAt(1));

    if (options.headingStyle === 'setext' && hLevel < 3) {
      var underline = repeat((hLevel === 1 ? '=' : '-'), content.length);
      return (
        '\n\n' + content + '\n' + underline + '\n\n'
      )
    } else {
      return '\n\n' + repeat('#', hLevel) + ' ' + content + '\n\n'
    }
  }
};

rules.blockquote = {
  filter: 'blockquote',

  replacement: function (content) {
    content = trimNewlines(content).replace(/^/gm, '> ');
    return '\n\n' + content + '\n\n'
  }
};

rules.list = {
  filter: ['ul', 'ol'],

  replacement: function (content, node) {
    var parent = node.parentNode;
    if (parent.nodeName === 'LI' && parent.lastElementChild === node) {
      return '\n' + content
    } else {
      return '\n\n' + content + '\n\n'
    }
  }
};

rules.listItem = {
  filter: 'li',

  replacement: function (content, node, options) {
    var prefix = options.bulletListMarker + '   ';
    var parent = node.parentNode;
    if (parent.nodeName === 'OL') {
      var start = parent.getAttribute('start');
      var index = Array.prototype.indexOf.call(parent.children, node);
      prefix = (start ? Number(start) + index : index + 1) + '.  ';
    }
    var isParagraph = /\n$/.test(content);
    content = trimNewlines(content) + (isParagraph ? '\n' : '');
    content = content.replace(/\n/gm, '\n' + ' '.repeat(prefix.length)); // indent
    return (
      prefix + content + (node.nextSibling ? '\n' : '')
    )
  }
};

rules.indentedCodeBlock = {
  filter: function (node, options) {
    return (
      options.codeBlockStyle === 'indented' &&
      node.nodeName === 'PRE' &&
      node.firstChild &&
      node.firstChild.nodeName === 'CODE'
    )
  },

  replacement: function (content, node, options) {
    return (
      '\n\n    ' +
      node.firstChild.textContent.replace(/\n/g, '\n    ') +
      '\n\n'
    )
  }
};

rules.fencedCodeBlock = {
  filter: function (node, options) {
    return (
      options.codeBlockStyle === 'fenced' &&
      node.nodeName === 'PRE' &&
      node.firstChild &&
      node.firstChild.nodeName === 'CODE'
    )
  },

  replacement: function (content, node, options) {
    var className = node.firstChild.getAttribute('class') || '';
    var language = (className.match(/language-(\S+)/) || [null, ''])[1];
    var code = node.firstChild.textContent;

    var fenceChar = options.fence.charAt(0);
    var fenceSize = 3;
    var fenceInCodeRegex = new RegExp('^' + fenceChar + '{3,}', 'gm');

    var match;
    while ((match = fenceInCodeRegex.exec(code))) {
      if (match[0].length >= fenceSize) {
        fenceSize = match[0].length + 1;
      }
    }

    var fence = repeat(fenceChar, fenceSize);

    return (
      '\n\n' + fence + language + '\n' +
      code.replace(/\n$/, '') +
      '\n' + fence + '\n\n'
    )
  }
};

rules.horizontalRule = {
  filter: 'hr',

  replacement: function (content, node, options) {
    return '\n\n' + options.hr + '\n\n'
  }
};

rules.inlineLink = {
  filter: function (node, options) {
    return (
      options.linkStyle === 'inlined' &&
      node.nodeName === 'A' &&
      node.getAttribute('href')
    )
  },

  replacement: function (content, node) {
    var href = node.getAttribute('href');
    if (href) href = href.replace(/([()])/g, '\\$1');
    var title = cleanAttribute(node.getAttribute('title'));
    if (title) title = ' "' + title.replace(/"/g, '\\"') + '"';
    return '[' + content + '](' + href + title + ')'
  }
};

rules.referenceLink = {
  filter: function (node, options) {
    return (
      options.linkStyle === 'referenced' &&
      node.nodeName === 'A' &&
      node.getAttribute('href')
    )
  },

  replacement: function (content, node, options) {
    var href = node.getAttribute('href');
    var title = cleanAttribute(node.getAttribute('title'));
    if (title) title = ' "' + title + '"';
    var replacement;
    var reference;

    switch (options.linkReferenceStyle) {
      case 'collapsed':
        replacement = '[' + content + '][]';
        reference = '[' + content + ']: ' + href + title;
        break
      case 'shortcut':
        replacement = '[' + content + ']';
        reference = '[' + content + ']: ' + href + title;
        break
      default:
        var id = this.references.length + 1;
        replacement = '[' + content + '][' + id + ']';
        reference = '[' + id + ']: ' + href + title;
    }

    this.references.push(reference);
    return replacement
  },

  references: [],

  append: function (options) {
    var references = '';
    if (this.references.length) {
      references = '\n\n' + this.references.join('\n') + '\n\n';
      this.references = []; // Reset references
    }
    return references
  }
};

rules.emphasis = {
  filter: ['em', 'i'],

  replacement: function (content, node, options) {
    if (!content.trim()) return ''
    return options.emDelimiter + content + options.emDelimiter
  }
};

rules.strong = {
  filter: ['strong', 'b'],

  replacement: function (content, node, options) {
    if (!content.trim()) return ''
    return options.strongDelimiter + content + options.strongDelimiter
  }
};

rules.code = {
  filter: function (node) {
    var hasSiblings = node.previousSibling || node.nextSibling;
    var isCodeBlock = node.parentNode.nodeName === 'PRE' && !hasSiblings;

    return node.nodeName === 'CODE' && !isCodeBlock
  },

  replacement: function (content) {
    if (!content) return ''
    content = content.replace(/\r?\n|\r/g, ' ');

    var extraSpace = /^`|^ .*?[^ ].* $|`$/.test(content) ? ' ' : '';
    var delimiter = '`';
    var matches = content.match(/`+/gm) || [];
    while (matches.indexOf(delimiter) !== -1) delimiter = delimiter + '`';

    return delimiter + extraSpace + content + extraSpace + delimiter
  }
};

rules.image = {
  filter: 'img',

  replacement: function (content, node) {
    var alt = cleanAttribute(node.getAttribute('alt'));
    var src = node.getAttribute('src') || '';
    var title = cleanAttribute(node.getAttribute('title'));
    var titlePart = title ? ' "' + title + '"' : '';
    return src ? '![' + alt + ']' + '(' + src + titlePart + ')' : ''
  }
};

function cleanAttribute (attribute) {
  return attribute ? attribute.replace(/(\n+\s*)+/g, '\n') : ''
}

/**
 * Manages a collection of rules used to convert HTML to Markdown
 */

function Rules (options) {
  this.options = options;
  this._keep = [];
  this._remove = [];

  this.blankRule = {
    replacement: options.blankReplacement
  };

  this.keepReplacement = options.keepReplacement;

  this.defaultRule = {
    replacement: options.defaultReplacement
  };

  this.array = [];
  for (var key in options.rules) this.array.push(options.rules[key]);
}

Rules.prototype = {
  add: function (key, rule) {
    this.array.unshift(rule);
  },

  keep: function (filter) {
    this._keep.unshift({
      filter: filter,
      replacement: this.keepReplacement
    });
  },

  remove: function (filter) {
    this._remove.unshift({
      filter: filter,
      replacement: function () {
        return ''
      }
    });
  },

  forNode: function (node) {
    if (node.isBlank) return this.blankRule
    var rule;

    if ((rule = findRule(this.array, node, this.options))) return rule
    if ((rule = findRule(this._keep, node, this.options))) return rule
    if ((rule = findRule(this._remove, node, this.options))) return rule

    return this.defaultRule
  },

  forEach: function (fn) {
    for (var i = 0; i < this.array.length; i++) fn(this.array[i], i);
  }
};

function findRule (rules, node, options) {
  for (var i = 0; i < rules.length; i++) {
    var rule = rules[i];
    if (filterValue(rule, node, options)) return rule
  }
  return void 0
}

function filterValue (rule, node, options) {
  var filter = rule.filter;
  if (typeof filter === 'string') {
    if (filter === node.nodeName.toLowerCase()) return true
  } else if (Array.isArray(filter)) {
    if (filter.indexOf(node.nodeName.toLowerCase()) > -1) return true
  } else if (typeof filter === 'function') {
    if (filter.call(rule, node, options)) return true
  } else {
    throw new TypeError('`filter` needs to be a string, array, or function')
  }
}

/**
 * The collapseWhitespace function is adapted from collapse-whitespace
 * by Luc Thevenard.
 *
 * The MIT License (MIT)
 *
 * Copyright (c) 2014 Luc Thevenard <lucthevenard@gmail.com>
 *
 * Permission is hereby granted, free of charge, to any person obtaining a copy
 * of this software and associated documentation files (the "Software"), to deal
 * in the Software without restriction, including without limitation the rights
 * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 * copies of the Software, and to permit persons to whom the Software is
 * furnished to do so, subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in
 * all copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
 * THE SOFTWARE.
 */

/**
 * collapseWhitespace(options) removes extraneous whitespace from an the given element.
 *
 * @param {Object} options
 */
function collapseWhitespace (options) {
  var element = options.element;
  var isBlock = options.isBlock;
  var isVoid = options.isVoid;
  var isPre = options.isPre || function (node) {
    return node.nodeName === 'PRE'
  };

  if (!element.firstChild || isPre(element)) return

  var prevText = null;
  var keepLeadingWs = false;

  var prev = null;
  var node = next(prev, element, isPre);

  while (node !== element) {
    if (node.nodeType === 3 || node.nodeType === 4) { // Node.TEXT_NODE or Node.CDATA_SECTION_NODE
      var text = node.data.replace(/[ \r\n\t]+/g, ' ');

      if ((!prevText || / $/.test(prevText.data)) &&
          !keepLeadingWs && text[0] === ' ') {
        text = text.substr(1);
      }

      // `text` might be empty at this point.
      if (!text) {
        node = remove(node);
        continue
      }

      node.data = text;

      prevText = node;
    } else if (node.nodeType === 1) { // Node.ELEMENT_NODE
      if (isBlock(node) || node.nodeName === 'BR') {
        if (prevText) {
          prevText.data = prevText.data.replace(/ $/, '');
        }

        prevText = null;
        keepLeadingWs = false;
      } else if (isVoid(node) || isPre(node)) {
        // Avoid trimming space around non-block, non-BR void elements and inline PRE.
        prevText = null;
        keepLeadingWs = true;
      } else if (prevText) {
        // Drop protection if set previously.
        keepLeadingWs = false;
      }
    } else {
      node = remove(node);
      continue
    }

    var nextNode = next(prev, node, isPre);
    prev = node;
    node = nextNode;
  }

  if (prevText) {
    prevText.data = prevText.data.replace(/ $/, '');
    if (!prevText.data) {
      remove(prevText);
    }
  }
}

/**
 * remove(node) removes the given node from the DOM and returns the
 * next node in the sequence.
 *
 * @param {Node} node
 * @return {Node} node
 */
function remove (node) {
  var next = node.nextSibling || node.parentNode;

  node.parentNode.removeChild(node);

  return next
}

/**
 * next(prev, current, isPre) returns the next node in the sequence, given the
 * current and previous nodes.
 *
 * @param {Node} prev
 * @param {Node} current
 * @param {Function} isPre
 * @return {Node}
 */
function next (prev, current, isPre) {
  if ((prev && prev.parentNode === current) || isPre(current)) {
    return current.nextSibling || current.parentNode
  }

  return current.firstChild || current.nextSibling || current.parentNode
}

/*
 * Set up window for Node.js
 */

var root = (typeof window !== 'undefined' ? window : {});

/*
 * Parsing HTML strings
 */

function canParseHTMLNatively () {
  var Parser = root.DOMParser;
  var canParse = false;

  // Adapted from https://gist.github.com/1129031
  // Firefox/Opera/IE throw errors on unsupported types
  try {
    // WebKit returns null on unsupported types
    if (new Parser().parseFromString('', 'text/html')) {
      canParse = true;
    }
  } catch (e) {}

  return canParse
}

function createHTMLParser () {
  var Parser = function () {};

  {
    if (shouldUseActiveX()) {
      Parser.prototype.parseFromString = function (string) {
        var doc = new window.ActiveXObject('htmlfile');
        doc.designMode = 'on'; // disable on-page scripts
        doc.open();
        doc.write(string);
        doc.close();
        return doc
      };
    } else {
      Parser.prototype.parseFromString = function (string) {
        var doc = document.implementation.createHTMLDocument('');
        doc.open();
        doc.write(string);
        doc.close();
        return doc
      };
    }
  }
  return Parser
}

function shouldUseActiveX () {
  var useActiveX = false;
  try {
    document.implementation.createHTMLDocument('').open();
  } catch (e) {
    if (root.ActiveXObject) useActiveX = true;
  }
  return useActiveX
}

var HTMLParser = canParseHTMLNatively() ? root.DOMParser : createHTMLParser();

function RootNode (input, options) {
  var root;
  if (typeof input === 'string') {
    var doc = htmlParser().parseFromString(
      // DOM parsers arrange elements in the <head> and <body>.
      // Wrapping in a custom element ensures elements are reliably arranged in
      // a single element.
      '<x-turndown id="turndown-root">' + input + '</x-turndown>',
      'text/html'
    );
    root = doc.getElementById('turndown-root');
  } else {
    root = input.cloneNode(true);
  }
  collapseWhitespace({
    element: root,
    isBlock: isBlock,
    isVoid: isVoid,
    isPre: options.preformattedCode ? isPreOrCode : null
  });

  return root
}

var _htmlParser;
function htmlParser () {
  _htmlParser = _htmlParser || new HTMLParser();
  return _htmlParser
}

function isPreOrCode (node) {
  return node.nodeName === 'PRE' || node.nodeName === 'CODE'
}

function Node$1 (node, options) {
  node.isBlock = isBlock(node);
  node.isCode = node.nodeName === 'CODE' || node.parentNode.isCode;
  node.isBlank = isBlank(node);
  node.flankingWhitespace = flankingWhitespace(node, options);
  return node
}

function isBlank (node) {
  return (
    !isVoid(node) &&
    !isMeaningfulWhenBlank(node) &&
    /^\s*$/i.test(node.textContent) &&
    !hasVoid(node) &&
    !hasMeaningfulWhenBlank(node)
  )
}

function flankingWhitespace (node, options) {
  if (node.isBlock || (options.preformattedCode && node.isCode)) {
    return { leading: '', trailing: '' }
  }

  var edges = edgeWhitespace(node.textContent);

  // abandon leading ASCII WS if left-flanked by ASCII WS
  if (edges.leadingAscii && isFlankedByWhitespace('left', node, options)) {
    edges.leading = edges.leadingNonAscii;
  }

  // abandon trailing ASCII WS if right-flanked by ASCII WS
  if (edges.trailingAscii && isFlankedByWhitespace('right', node, options)) {
    edges.trailing = edges.trailingNonAscii;
  }

  return { leading: edges.leading, trailing: edges.trailing }
}

function edgeWhitespace (string) {
  var m = string.match(/^(([ \t\r\n]*)(\s*))(?:(?=\S)[\s\S]*\S)?((\s*?)([ \t\r\n]*))$/);
  return {
    leading: m[1], // whole string for whitespace-only strings
    leadingAscii: m[2],
    leadingNonAscii: m[3],
    trailing: m[4], // empty for whitespace-only strings
    trailingNonAscii: m[5],
    trailingAscii: m[6]
  }
}

function isFlankedByWhitespace (side, node, options) {
  var sibling;
  var regExp;
  var isFlanked;

  if (side === 'left') {
    sibling = node.previousSibling;
    regExp = / $/;
  } else {
    sibling = node.nextSibling;
    regExp = /^ /;
  }

  if (sibling) {
    if (sibling.nodeType === 3) {
      isFlanked = regExp.test(sibling.nodeValue);
    } else if (options.preformattedCode && sibling.nodeName === 'CODE') {
      isFlanked = false;
    } else if (sibling.nodeType === 1 && !isBlock(sibling)) {
      isFlanked = regExp.test(sibling.textContent);
    }
  }
  return isFlanked
}

var reduce = Array.prototype.reduce;
var escapes = [
  [/\\/g, '\\\\'],
  [/\*/g, '\\*'],
  [/^-/g, '\\-'],
  [/^\+ /g, '\\+ '],
  [/^(=+)/g, '\\$1'],
  [/^(#{1,6}) /g, '\\$1 '],
  [/`/g, '\\`'],
  [/^~~~/g, '\\~~~'],
  [/\[/g, '\\['],
  [/\]/g, '\\]'],
  [/^>/g, '\\>'],
  [/_/g, '\\_'],
  [/^(\d+)\. /g, '$1\\. ']
];

function TurndownService (options) {
  if (!(this instanceof TurndownService)) return new TurndownService(options)

  var defaults = {
    rules: rules,
    headingStyle: 'setext',
    hr: '* * *',
    bulletListMarker: '*',
    codeBlockStyle: 'indented',
    fence: '```',
    emDelimiter: '_',
    strongDelimiter: '**',
    linkStyle: 'inlined',
    linkReferenceStyle: 'full',
    br: '  ',
    preformattedCode: false,
    blankReplacement: function (content, node) {
      return node.isBlock ? '\n\n' : ''
    },
    keepReplacement: function (content, node) {
      return node.isBlock ? '\n\n' + node.outerHTML + '\n\n' : node.outerHTML
    },
    defaultReplacement: function (content, node) {
      return node.isBlock ? '\n\n' + content + '\n\n' : content
    }
  };
  this.options = extend({}, defaults, options);
  this.rules = new Rules(this.options);
}

TurndownService.prototype = {
  /**
   * The entry point for converting a string or DOM node to Markdown
   * @public
   * @param {String|HTMLElement} input The string or DOM node to convert
   * @returns A Markdown representation of the input
   * @type String
   */

  turndown: function (input) {
    if (!canConvert(input)) {
      throw new TypeError(
        input + ' is not a string, or an element/document/fragment node.'
      )
    }

    if (input === '') return ''

    var output = process.call(this, new RootNode(input, this.options));
    return postProcess$1.call(this, output)
  },

  /**
   * Add one or more plugins
   * @public
   * @param {Function|Array} plugin The plugin or array of plugins to add
   * @returns The Turndown instance for chaining
   * @type Object
   */

  use: function (plugin) {
    if (Array.isArray(plugin)) {
      for (var i = 0; i < plugin.length; i++) this.use(plugin[i]);
    } else if (typeof plugin === 'function') {
      plugin(this);
    } else {
      throw new TypeError('plugin must be a Function or an Array of Functions')
    }
    return this
  },

  /**
   * Adds a rule
   * @public
   * @param {String} key The unique key of the rule
   * @param {Object} rule The rule
   * @returns The Turndown instance for chaining
   * @type Object
   */

  addRule: function (key, rule) {
    this.rules.add(key, rule);
    return this
  },

  /**
   * Keep a node (as HTML) that matches the filter
   * @public
   * @param {String|Array|Function} filter The unique key of the rule
   * @returns The Turndown instance for chaining
   * @type Object
   */

  keep: function (filter) {
    this.rules.keep(filter);
    return this
  },

  /**
   * Remove a node that matches the filter
   * @public
   * @param {String|Array|Function} filter The unique key of the rule
   * @returns The Turndown instance for chaining
   * @type Object
   */

  remove: function (filter) {
    this.rules.remove(filter);
    return this
  },

  /**
   * Escapes Markdown syntax
   * @public
   * @param {String} string The string to escape
   * @returns A string with Markdown syntax escaped
   * @type String
   */

  escape: function (string) {
    return escapes.reduce(function (accumulator, escape) {
      return accumulator.replace(escape[0], escape[1])
    }, string)
  }
};

/**
 * Reduces a DOM node down to its Markdown string equivalent
 * @private
 * @param {HTMLElement} parentNode The node to convert
 * @returns A Markdown representation of the node
 * @type String
 */

function process (parentNode) {
  var self = this;
  return reduce.call(parentNode.childNodes, function (output, node) {
    node = new Node$1(node, self.options);

    var replacement = '';
    if (node.nodeType === 3) {
      replacement = node.isCode ? node.nodeValue : self.escape(node.nodeValue);
    } else if (node.nodeType === 1) {
      replacement = replacementForNode.call(self, node);
    }

    return join(output, replacement)
  }, '')
}

/**
 * Appends strings as each rule requires and trims the output
 * @private
 * @param {String} output The conversion output
 * @returns A trimmed version of the ouput
 * @type String
 */

function postProcess$1 (output) {
  var self = this;
  this.rules.forEach(function (rule) {
    if (typeof rule.append === 'function') {
      output = join(output, rule.append(self.options));
    }
  });

  return output.replace(/^[\t\r\n]+/, '').replace(/[\t\r\n\s]+$/, '')
}

/**
 * Converts an element node to its Markdown equivalent
 * @private
 * @param {HTMLElement} node The node to convert
 * @returns A Markdown representation of the node
 * @type String
 */

function replacementForNode (node) {
  var rule = this.rules.forNode(node);
  var content = process.call(this, node);
  var whitespace = node.flankingWhitespace;
  if (whitespace.leading || whitespace.trailing) content = content.trim();
  return (
    whitespace.leading +
    rule.replacement(content, node, this.options) +
    whitespace.trailing
  )
}

/**
 * Joins replacement to the current output with appropriate number of new lines
 * @private
 * @param {String} output The current conversion output
 * @param {String} replacement The string to append to the output
 * @returns Joined output
 * @type String
 */

function join (output, replacement) {
  var s1 = trimTrailingNewlines(output);
  var s2 = trimLeadingNewlines(replacement);
  var nls = Math.max(output.length - s1.length, replacement.length - s2.length);
  var separator = '\n\n'.substring(0, nls);

  return s1 + separator + s2
}

/**
 * Determines whether an input can be converted
 * @private
 * @param {String|HTMLElement} input Describe this parameter
 * @returns Describe what it returns
 * @type String|Object|Array|Boolean|Number
 */

function canConvert (input) {
  return (
    input != null && (
      typeof input === 'string' ||
      (input.nodeType && (
        input.nodeType === 1 || input.nodeType === 9 || input.nodeType === 11
      ))
    )
  )
}

/**
 * This is the ParseError class, which is the main error thrown by Temml
 * functions when something has gone wrong. This is used to distinguish internal
 * errors from errors in the expression that the user provided.
 *
 * If possible, a caller should provide a Token or ParseNode with information
 * about where in the source string the problem occurred.
 */
class ParseError {
  constructor(
    message, // The error message
    token // An object providing position information
  ) {
    let error = " " + message;
    let start;

    const loc = token && token.loc;
    if (loc && loc.start <= loc.end) {
      // If we have the input and a position, make the error a bit fancier

      // Get the input
      const input = loc.lexer.input;

      // Prepend some information
      start = loc.start;
      const end = loc.end;
      if (start === input.length) {
        error += " at end of input: ";
      } else {
        error += " at position " + (start + 1) + ": \n";
      }

      // Underline token in question using combining underscores
      const underlined = input.slice(start, end).replace(/[^]/g, "$&\u0332");

      // Extract some context from the input and add it to the error
      let left;
      if (start > 15) {
        left = "…" + input.slice(start - 15, start);
      } else {
        left = input.slice(0, start);
      }
      let right;
      if (end + 15 < input.length) {
        right = input.slice(end, end + 15) + "…";
      } else {
        right = input.slice(end);
      }
      error += left + underlined + right;
    }

    // Some hackery to make ParseError a prototype of Error
    // See http://stackoverflow.com/a/8460753
    const self = new Error(error);
    self.name = "ParseError";
    self.__proto__ = ParseError.prototype;
    self.position = start;
    return self;
  }
}

ParseError.prototype.__proto__ = Error.prototype;

//
/**
 * This file contains a list of utility functions which are useful in other
 * files.
 */

/**
 * Provide a default value if a setting is undefined
 */
const deflt = function(setting, defaultIfUndefined) {
  return setting === undefined ? defaultIfUndefined : setting;
};

// hyphenate and escape adapted from Facebook's React under Apache 2 license

const uppercase = /([A-Z])/g;
const hyphenate = function(str) {
  return str.replace(uppercase, "-$1").toLowerCase();
};

const ESCAPE_LOOKUP = {
  "&": "&amp;",
  ">": "&gt;",
  "<": "&lt;",
  '"': "&quot;",
  "'": "&#x27;"
};

const ESCAPE_REGEX = /[&><"']/g;

/**
 * Escapes text to prevent scripting attacks.
 */
function escape(text) {
  return String(text).replace(ESCAPE_REGEX, (match) => ESCAPE_LOOKUP[match]);
}

/**
 * Sometimes we want to pull out the innermost element of a group. In most
 * cases, this will just be the group itself, but when ordgroups and colors have
 * a single element, we want to pull that out.
 */
const getBaseElem = function(group) {
  if (group.type === "ordgroup") {
    if (group.body.length === 1) {
      return getBaseElem(group.body[0]);
    } else {
      return group;
    }
  } else if (group.type === "color") {
    if (group.body.length === 1) {
      return getBaseElem(group.body[0]);
    } else {
      return group;
    }
  } else if (group.type === "font") {
    return getBaseElem(group.body);
  } else {
    return group;
  }
};

/**
 * TeXbook algorithms often reference "character boxes", which are simply groups
 * with a single character in them. To decide if something is a character box,
 * we find its innermost group, and see if it is a single character.
 */
const isCharacterBox = function(group) {
  const baseElem = getBaseElem(group);

  // These are all the types of groups which hold single characters
  return baseElem.type === "mathord" || baseElem.type === "textord" || baseElem.type === "atom"
};

const assert = function(value) {
  if (!value) {
    throw new Error("Expected non-null, but got " + String(value));
  }
  return value;
};

/**
 * Return the protocol of a URL, or "_relative" if the URL does not specify a
 * protocol (and thus is relative), or `null` if URL has invalid protocol
 * (so should be outright rejected).
 */
const protocolFromUrl = function(url) {
  // Check for possible leading protocol.
  // https://url.spec.whatwg.org/#url-parsing strips leading whitespace
  // (\x00) or C0 control (\x00-\x1F) characters.
  // eslint-disable-next-line no-control-regex
  const protocol = /^[\x00-\x20]*([^\\/#?]*?)(:|&#0*58|&#x0*3a|&colon)/i.exec(url);
  if (!protocol) {
    return "_relative";
  }
  // Reject weird colons
  if (protocol[2] !== ":") {
    return null;
  }
  // Reject invalid characters in scheme according to
  // https://datatracker.ietf.org/doc/html/rfc3986#section-3.1
  if (!/^[a-zA-Z][a-zA-Z0-9+\-.]*$/.test(protocol[1])) {
    return null;
  }
  // Lowercase the protocol
  return protocol[1].toLowerCase();
};

/**
 * Round `n` to 4 decimal places, or to the nearest 1/10,000th em. The TeXbook
 * gives an acceptable rounding error of 100sp (which would be the nearest
 * 1/6551.6em with our ptPerEm = 10):
 * http://www.ctex.org/documents/shredder/src/texbook.pdf#page=69
 */
const round = function(n) {
  return +n.toFixed(4);
};

var utils = {
  deflt,
  escape,
  hyphenate,
  getBaseElem,
  isCharacterBox,
  protocolFromUrl,
  round
};

/**
 * This is a module for storing settings passed into Temml. It correctly handles
 * default settings.
 */


/**
 * The main Settings object
 */
class Settings {
  constructor(options) {
    // allow null options
    options = options || {};
    this.displayMode = utils.deflt(options.displayMode, false);    // boolean
    this.annotate = utils.deflt(options.annotate, false);           // boolean
    this.leqno = utils.deflt(options.leqno, false);                // boolean
    this.throwOnError = utils.deflt(options.throwOnError, false);  // boolean
    this.errorColor = utils.deflt(options.errorColor, "#b22222");  // string
    this.macros = options.macros || {};
    this.wrap = utils.deflt(options.wrap, "tex");                    // "tex" | "="
    this.xml = utils.deflt(options.xml, false);                     // boolean
    this.colorIsTextColor = utils.deflt(options.colorIsTextColor, false);  // booelean
    this.strict = utils.deflt(options.strict, false);    // boolean
    this.trust = utils.deflt(options.trust, false);  // trust context. See html.js.
    this.maxSize = (options.maxSize === undefined
      ? [Infinity, Infinity]
      : Array.isArray(options.maxSize)
      ? options.maxSize
      : [Infinity, Infinity]
    );
    this.maxExpand = Math.max(0, utils.deflt(options.maxExpand, 1000)); // number
  }

  /**
   * Check whether to test potentially dangerous input, and return
   * `true` (trusted) or `false` (untrusted).  The sole argument `context`
   * should be an object with `command` field specifying the relevant LaTeX
   * command (as a string starting with `\`), and any other arguments, etc.
   * If `context` has a `url` field, a `protocol` field will automatically
   * get added by this function (changing the specified object).
   */
  isTrusted(context) {
    if (context.url && !context.protocol) {
      const protocol = utils.protocolFromUrl(context.url);
      if (protocol == null) {
        return false
      }
      context.protocol = protocol;
    }
    const trust = typeof this.trust === "function" ? this.trust(context) : this.trust;
    return Boolean(trust);
  }
}

/**
 * All registered functions.
 * `functions.js` just exports this same dictionary again and makes it public.
 * `Parser.js` requires this dictionary.
 */
const _functions = {};

/**
 * All MathML builders. Should be only used in the `define*` and the `build*ML`
 * functions.
 */
const _mathmlGroupBuilders = {};

function defineFunction({
  type,
  names,
  props,
  handler,
  mathmlBuilder
}) {
  // Set default values of functions
  const data = {
    type,
    numArgs: props.numArgs,
    argTypes: props.argTypes,
    allowedInArgument: !!props.allowedInArgument,
    allowedInText: !!props.allowedInText,
    allowedInMath: props.allowedInMath === undefined ? true : props.allowedInMath,
    numOptionalArgs: props.numOptionalArgs || 0,
    infix: !!props.infix,
    primitive: !!props.primitive,
    handler: handler
  };
  for (let i = 0; i < names.length; ++i) {
    _functions[names[i]] = data;
  }
  if (type) {
    if (mathmlBuilder) {
      _mathmlGroupBuilders[type] = mathmlBuilder;
    }
  }
}

/**
 * Use this to register only the MathML builder for a function(e.g.
 * if the function's ParseNode is generated in Parser.js rather than via a
 * stand-alone handler provided to `defineFunction`).
 */
function defineFunctionBuilders({ type, mathmlBuilder }) {
  defineFunction({
    type,
    names: [],
    props: { numArgs: 0 },
    handler() {
      throw new Error("Should never be called.")
    },
    mathmlBuilder
  });
}

const normalizeArgument = function(arg) {
  return arg.type === "ordgroup" && arg.body.length === 1 ? arg.body[0] : arg
};

// Since the corresponding buildMathML function expects a
// list of elements, we normalize for different kinds of arguments
const ordargument = function(arg) {
  return arg.type === "ordgroup" ? arg.body : [arg]
};

/**
 * This node represents a document fragment, which contains elements, but when
 * placed into the DOM doesn't have any representation itself. It only contains
 * children and doesn't have any DOM node properties.
 */
class DocumentFragment {
  constructor(children) {
    this.children = children;
    this.classes = [];
    this.style = {};
  }

  hasClass(className) {
    return this.classes.includes(className);
  }

  /** Convert the fragment into a node. */
  toNode() {
    const frag = document.createDocumentFragment();

    for (let i = 0; i < this.children.length; i++) {
      frag.appendChild(this.children[i].toNode());
    }

    return frag;
  }

  /** Convert the fragment into HTML markup. */
  toMarkup() {
    let markup = "";

    // Simply concatenate the markup for the children together.
    for (let i = 0; i < this.children.length; i++) {
      markup += this.children[i].toMarkup();
    }

    return markup;
  }

  /**
   * Converts the math node into a string, similar to innerText. Applies to
   * MathDomNode's only.
   */
  toText() {
    // To avoid this, we would subclass documentFragment separately for
    // MathML, but polyfills for subclassing is expensive per PR 1469.
    const toText = (child) => child.toText();
    return this.children.map(toText).join("");
  }
}

/**
 * These objects store the data about the DOM nodes we create, as well as some
 * extra data. They can then be transformed into real DOM nodes with the
 * `toNode` function or HTML markup using `toMarkup`. They are useful for both
 * storing extra properties on the nodes, as well as providing a way to easily
 * work with the DOM.
 *
 * Similar functions for working with MathML nodes exist in mathMLTree.js.
 *
 */

/**
 * Create an HTML className based on a list of classes. In addition to joining
 * with spaces, we also remove empty classes.
 */
const createClass = function(classes) {
  return classes.filter((cls) => cls).join(" ");
};

const initNode = function(classes, style) {
  this.classes = classes || [];
  this.attributes = {};
  this.style = style || {};
};

/**
 * Convert into an HTML node
 */
const toNode = function(tagName) {
  const node = document.createElement(tagName);

  // Apply the class
  node.className = createClass(this.classes);

  // Apply inline styles
  for (const style in this.style) {
    if (Object.prototype.hasOwnProperty.call(this.style, style )) {
      node.style[style] = this.style[style];
    }
  }

  // Apply attributes
  for (const attr in this.attributes) {
    if (Object.prototype.hasOwnProperty.call(this.attributes, attr )) {
      node.setAttribute(attr, this.attributes[attr]);
    }
  }

  // Append the children, also as HTML nodes
  for (let i = 0; i < this.children.length; i++) {
    node.appendChild(this.children[i].toNode());
  }

  return node;
};

/**
 * Convert into an HTML markup string
 */
const toMarkup = function(tagName) {
  let markup = `<${tagName}`;

  // Add the class
  if (this.classes.length) {
    markup += ` class="${utils.escape(createClass(this.classes))}"`;
  }

  let styles = "";

  // Add the styles, after hyphenation
  for (const style in this.style) {
    if (Object.prototype.hasOwnProperty.call(this.style, style )) {
      styles += `${utils.hyphenate(style)}:${this.style[style]};`;
    }
  }

  if (styles) {
    markup += ` style="${styles}"`;
  }

  // Add the attributes
  for (const attr in this.attributes) {
    if (Object.prototype.hasOwnProperty.call(this.attributes, attr )) {
      markup += ` ${attr}="${utils.escape(this.attributes[attr])}"`;
    }
  }

  markup += ">";

  // Add the markup of the children, also as markup
  for (let i = 0; i < this.children.length; i++) {
    markup += this.children[i].toMarkup();
  }

  markup += `</${tagName}>`;

  return markup;
};

/**
 * This node represents a span node, with a className, a list of children, and
 * an inline style.
 *
 */
class Span {
  constructor(classes, children, style) {
    initNode.call(this, classes, style);
    this.children = children || [];
  }

  setAttribute(attribute, value) {
    this.attributes[attribute] = value;
  }

  toNode() {
    return toNode.call(this, "span");
  }

  toMarkup() {
    return toMarkup.call(this, "span");
  }
}

let TextNode$1 = class TextNode {
  constructor(text) {
    this.text = text;
  }
  toNode() {
    return document.createTextNode(this.text);
  }
  toMarkup() {
    return utils.escape(this.text);
  }
};

// Create an <a href="…"> node.
class AnchorNode {
  constructor(href, classes, children) {
    this.href = href;
    this.classes = classes;
    this.children = children || [];
  }

  toNode() {
    const node = document.createElement("a");
    node.setAttribute("href", this.href);
    if (this.classes.length > 0) {
      node.className = createClass(this.classes);
    }
    for (let i = 0; i < this.children.length; i++) {
      node.appendChild(this.children[i].toNode());
    }
    return node
  }

  toMarkup() {
    let markup = `<a href='${utils.escape(this.href)}'`;
    if (this.classes.length > 0) {
      markup += ` class="${utils.escape(createClass(this.classes))}"`;
    }
    markup += ">";
    for (let i = 0; i < this.children.length; i++) {
      markup += this.children[i].toMarkup();
    }
    markup += "</a>";
    return markup
  }
}

/*
 * This node represents an image embed (<img>) element.
 */
class Img {
  constructor(src, alt, style) {
    this.alt = alt;
    this.src = src;
    this.classes = ["mord"];
    this.style = style;
  }

  hasClass(className) {
    return this.classes.includes(className);
  }

  toNode() {
    const node = document.createElement("img");
    node.src = this.src;
    node.alt = this.alt;
    node.className = "mord";

    // Apply inline styles
    for (const style in this.style) {
      if (Object.prototype.hasOwnProperty.call(this.style, style )) {
        node.style[style] = this.style[style];
      }
    }

    return node;
  }

  toMarkup() {
    let markup = `<img src='${this.src}' alt='${this.alt}'`;

    // Add the styles, after hyphenation
    let styles = "";
    for (const style in this.style) {
      if (Object.prototype.hasOwnProperty.call(this.style, style )) {
        styles += `${utils.hyphenate(style)}:${this.style[style]};`;
      }
    }
    if (styles) {
      markup += ` style="${utils.escape(styles)}"`;
    }

    markup += ">";
    return markup;
  }
}

//
/**
 * These objects store data about MathML nodes.
 * The `toNode` and `toMarkup` functions  create namespaced DOM nodes and
 * HTML text markup respectively.
 */


function newDocumentFragment(children) {
  return new DocumentFragment(children);
}

/**
 * This node represents a general purpose MathML node of any type,
 * for example, `"mo"` or `"mspace"`, corresponding to `<mo>` and
 * `<mspace>` tags).
 */
class MathNode {
  constructor(type, children, classes, style) {
    this.type = type;
    this.attributes = {};
    this.children = children || [];
    this.classes = classes || [];
    this.style = style || {};   // Used for <mstyle> elements
    this.label = "";
  }

  /**
   * Sets an attribute on a MathML node. MathML depends on attributes to convey a
   * semantic content, so this is used heavily.
   */
  setAttribute(name, value) {
    this.attributes[name] = value;
  }

  /**
   * Gets an attribute on a MathML node.
   */
  getAttribute(name) {
    return this.attributes[name];
  }

  setLabel(value) {
    this.label = value;
  }

  /**
   * Converts the math node into a MathML-namespaced DOM element.
   */
  toNode() {
    const node = document.createElementNS("http://www.w3.org/1998/Math/MathML", this.type);

    for (const attr in this.attributes) {
      if (Object.prototype.hasOwnProperty.call(this.attributes, attr)) {
        node.setAttribute(attr, this.attributes[attr]);
      }
    }

    if (this.classes.length > 0) {
      node.className = createClass(this.classes);
    }

    // Apply inline styles
    for (const style in this.style) {
      if (Object.prototype.hasOwnProperty.call(this.style, style )) {
        node.style[style] = this.style[style];
      }
    }

    for (let i = 0; i < this.children.length; i++) {
      node.appendChild(this.children[i].toNode());
    }

    return node;
  }

  /**
   * Converts the math node into an HTML markup string.
   */
  toMarkup() {
    let markup = "<" + this.type;

    // Add the attributes
    for (const attr in this.attributes) {
      if (Object.prototype.hasOwnProperty.call(this.attributes, attr)) {
        markup += " " + attr + '="';
        markup += utils.escape(this.attributes[attr]);
        markup += '"';
      }
    }

    if (this.classes.length > 0) {
      markup += ` class="${utils.escape(createClass(this.classes))}"`;
    }

    let styles = "";

    // Add the styles, after hyphenation
    for (const style in this.style) {
      if (Object.prototype.hasOwnProperty.call(this.style, style )) {
        styles += `${utils.hyphenate(style)}:${this.style[style]};`;
      }
    }

    if (styles) {
      markup += ` style="${styles}"`;
    }

    markup += ">";

    for (let i = 0; i < this.children.length; i++) {
      markup += this.children[i].toMarkup();
    }

    markup += "</" + this.type + ">";

    return markup;
  }

  /**
   * Converts the math node into a string, similar to innerText, but escaped.
   */
  toText() {
    return this.children.map((child) => child.toText()).join("");
  }
}

/**
 * This node represents a piece of text.
 */
class TextNode {
  constructor(text) {
    this.text = text;
  }

  /**
   * Converts the text node into a DOM text node.
   */
  toNode() {
    return document.createTextNode(this.text);
  }

  /**
   * Converts the text node into escaped HTML markup
   * (representing the text itself).
   */
  toMarkup() {
    return utils.escape(this.toText());
  }

  /**
   * Converts the text node into a string
   * (representing the text itself).
   */
  toText() {
    return this.text;
  }
}

// Do not make an <mrow> the only child of a <mstyle>.
// An <mstyle> acts as its own implicit <mrow>.
const wrapWithMstyle = expression => {
  let node;
  if (expression.length === 1 && expression[0].type === "mrow") {
    node = expression.pop();
    node.type = "mstyle";
  } else {
    node = new MathNode("mstyle", expression);
  }
  return node
};

var mathMLTree = {
  MathNode,
  TextNode,
  newDocumentFragment
};

/**
 * This file provides support for building horizontal stretchy elements.
 */


// TODO: Remove when Chromium stretches \widetilde & \widehat
const estimatedWidth = node => {
  let width = 0;
  if (node.body && Array.isArray(node.body)) {
    for (const item of node.body) {
      width += estimatedWidth(item);
    }
  } else if (node.body) {
    width += estimatedWidth(node.body);
  } else if (node.type === "supsub") {
    width += estimatedWidth(node.base);
    if (node.sub) { width += 0.7 * estimatedWidth(node.sub); }
    if (node.sup) { width += 0.7 * estimatedWidth(node.sup); }
  } else if (node.type === "mathord" || node.type === "textord") {
    for (const ch of node.text.split('')) {
      const codePoint = ch.codePointAt(0);
      if ((0x60 < codePoint && codePoint < 0x7B) || (0x03B0 < codePoint && codePoint < 0x3CA)) {
        width += 0.56; // lower case latin or greek. Use advance width of letter n
      } else if (0x2F < codePoint && codePoint < 0x3A) {
        width += 0.50; // numerals.
      } else {
        width += 0.92; // advance width of letter M
      }
    }
  } else {
    width += 1.0;
  }
  return width
};

const stretchyCodePoint = {
  widehat: "^",
  widecheck: "ˇ",
  widetilde: "~",
  wideparen: "⏜", // \u23dc
  utilde: "~",
  overleftarrow: "\u2190",
  underleftarrow: "\u2190",
  xleftarrow: "\u2190",
  overrightarrow: "\u2192",
  underrightarrow: "\u2192",
  xrightarrow: "\u2192",
  underbrace: "\u23df",
  overbrace: "\u23de",
  overgroup: "\u23e0",
  overparen: "⏜",
  undergroup: "\u23e1",
  underparen: "\u23dd",
  overleftrightarrow: "\u2194",
  underleftrightarrow: "\u2194",
  xleftrightarrow: "\u2194",
  Overrightarrow: "\u21d2",
  xRightarrow: "\u21d2",
  overleftharpoon: "\u21bc",
  xleftharpoonup: "\u21bc",
  overrightharpoon: "\u21c0",
  xrightharpoonup: "\u21c0",
  xLeftarrow: "\u21d0",
  xLeftrightarrow: "\u21d4",
  xhookleftarrow: "\u21a9",
  xhookrightarrow: "\u21aa",
  xmapsto: "\u21a6",
  xrightharpoondown: "\u21c1",
  xleftharpoondown: "\u21bd",
  xtwoheadleftarrow: "\u219e",
  xtwoheadrightarrow: "\u21a0",
  xlongequal: "=",
  xrightleftarrows: "\u21c4",
  xtofrom: "\u21c4",
  xleftrightharpoons: "\u21cb",
  xrightleftharpoons: "\u21cc",
  yields: "\u2192",
  yieldsLeft: "\u2190",
  mesomerism: "\u2194",
  longrightharpoonup: "\u21c0",
  longleftharpoondown: "\u21bd",
  eqrightharpoonup: "\u21c0",
  eqleftharpoondown: "\u21bd",
  "\\cdrightarrow": "\u2192",
  "\\cdleftarrow": "\u2190",
  "\\cdlongequal": "=",
  yieldsLeftRight: "\u21c4",
  chemequilibrium: "\u21cc"
};

const mathMLnode = function(label) {
  const child = new mathMLTree.TextNode(stretchyCodePoint[label.slice(1)]);
  const node = new mathMLTree.MathNode("mo", [child]);
  node.setAttribute("stretchy", "true");
  return node
};

const crookedWides = ["\\widetilde", "\\widehat", "\\widecheck", "\\utilde"];

// TODO: Remove when Chromium stretches \widetilde & \widehat
const accentNode = (group) => {
  const mo = mathMLnode(group.label);
  if (crookedWides.includes(group.label)) {
    const width = estimatedWidth(group.base);
    if (1 < width && width < 1.6) {
      mo.classes.push("tml-crooked-2");
    } else if (1.6 <= width && width < 2.5) {
      mo.classes.push("tml-crooked-3");
    } else if (2.5 <= width) {
      mo.classes.push("tml-crooked-4");
    }
  }
  return mo
};

var stretchy = {
  mathMLnode,
  accentNode
};

/**
 * This file holds a list of all no-argument functions and single-character
 * symbols (like 'a' or ';').
 *
 * For each of the symbols, there are two properties they can have:
 * - group (required): the ParseNode group type the symbol should have (i.e.
     "textord", "mathord", etc).
 * - replace: the character that this symbol or function should be
 *   replaced with (i.e. "\phi" has a replace value of "\u03d5", the phi
 *   character in the main font).
 *
 * The outermost map in the table indicates what mode the symbols should be
 * accepted in (e.g. "math" or "text").
 */

// Some of these have a "-token" suffix since these are also used as `ParseNode`
// types for raw text tokens, and we want to avoid conflicts with higher-level
// `ParseNode` types. These `ParseNode`s are constructed within `Parser` by
// looking up the `symbols` map.
const ATOMS = {
  bin: 1,
  close: 1,
  inner: 1,
  open: 1,
  punct: 1,
  rel: 1
};
const NON_ATOMS = {
  "accent-token": 1,
  mathord: 1,
  "op-token": 1,
  spacing: 1,
  textord: 1
};

const symbols = {
  math: {},
  text: {}
};

/** `acceptUnicodeChar = true` is only applicable if `replace` is set. */
function defineSymbol(mode, group, replace, name, acceptUnicodeChar) {
  symbols[mode][name] = { group, replace };

  if (acceptUnicodeChar && replace) {
    symbols[mode][replace] = symbols[mode][name];
  }
}

// Some abbreviations for commonly used strings.
// This helps minify the code, and also spotting typos using jshint.

// modes:
const math = "math";
const text = "text";

// groups:
const accent = "accent-token";
const bin = "bin";
const close = "close";
const inner = "inner";
const mathord = "mathord";
const op = "op-token";
const open = "open";
const punct = "punct";
const rel = "rel";
const spacing = "spacing";
const textord = "textord";

// Now comes the symbol table

// Relation Symbols
defineSymbol(math, rel, "\u2261", "\\equiv", true);
defineSymbol(math, rel, "\u227a", "\\prec", true);
defineSymbol(math, rel, "\u227b", "\\succ", true);
defineSymbol(math, rel, "\u223c", "\\sim", true);
defineSymbol(math, rel, "\u27c2", "\\perp", true);
defineSymbol(math, rel, "\u2aaf", "\\preceq", true);
defineSymbol(math, rel, "\u2ab0", "\\succeq", true);
defineSymbol(math, rel, "\u2243", "\\simeq", true);
defineSymbol(math, rel, "\u224c", "\\backcong", true);
defineSymbol(math, rel, "|", "\\mid", true);
defineSymbol(math, rel, "\u226a", "\\ll", true);
defineSymbol(math, rel, "\u226b", "\\gg", true);
defineSymbol(math, rel, "\u224d", "\\asymp", true);
defineSymbol(math, rel, "\u2225", "\\parallel");
defineSymbol(math, rel, "\u2323", "\\smile", true);
defineSymbol(math, rel, "\u2291", "\\sqsubseteq", true);
defineSymbol(math, rel, "\u2292", "\\sqsupseteq", true);
defineSymbol(math, rel, "\u2250", "\\doteq", true);
defineSymbol(math, rel, "\u2322", "\\frown", true);
defineSymbol(math, rel, "\u220b", "\\ni", true);
defineSymbol(math, rel, "\u220c", "\\notni", true);
defineSymbol(math, rel, "\u221d", "\\propto", true);
defineSymbol(math, rel, "\u22a2", "\\vdash", true);
defineSymbol(math, rel, "\u22a3", "\\dashv", true);
defineSymbol(math, rel, "\u220b", "\\owns");
defineSymbol(math, rel, "\u2258", "\\arceq", true);
defineSymbol(math, rel, "\u2259", "\\wedgeq", true);
defineSymbol(math, rel, "\u225a", "\\veeeq", true);
defineSymbol(math, rel, "\u225b", "\\stareq", true);
defineSymbol(math, rel, "\u225d", "\\eqdef", true);
defineSymbol(math, rel, "\u225e", "\\measeq", true);
defineSymbol(math, rel, "\u225f", "\\questeq", true);
defineSymbol(math, rel, "\u2260", "\\ne", true);
defineSymbol(math, rel, "\u2260", "\\neq");
// unicodemath
defineSymbol(math, rel, "\u2a75", "\\eqeq", true);
defineSymbol(math, rel, "\u2a76", "\\eqeqeq", true);
// mathtools.sty
defineSymbol(math, rel, "\u2237", "\\dblcolon", true);
defineSymbol(math, rel, "\u2254", "\\coloneqq", true);
defineSymbol(math, rel, "\u2255", "\\eqqcolon", true);
defineSymbol(math, rel, "\u2239", "\\eqcolon", true);
defineSymbol(math, rel, "\u2A74", "\\Coloneqq", true);

// Punctuation
defineSymbol(math, punct, "\u002e", "\\ldotp");
defineSymbol(math, punct, "\u00b7", "\\cdotp");

// Misc Symbols
defineSymbol(math, textord, "\u0023", "\\#");
defineSymbol(text, textord, "\u0023", "\\#");
defineSymbol(math, textord, "\u0026", "\\&");
defineSymbol(text, textord, "\u0026", "\\&");
defineSymbol(math, textord, "\u2135", "\\aleph", true);
defineSymbol(math, textord, "\u2200", "\\forall", true);
defineSymbol(math, textord, "\u210f", "\\hbar", true);
defineSymbol(math, textord, "\u2203", "\\exists", true);
// ∇ is actually a unary operator, not binary. But this works.
defineSymbol(math, bin, "\u2207", "\\nabla", true);
defineSymbol(math, textord, "\u266d", "\\flat", true);
defineSymbol(math, textord, "\u2113", "\\ell", true);
defineSymbol(math, textord, "\u266e", "\\natural", true);
defineSymbol(math, textord, "Å", "\\Angstrom", true);
defineSymbol(text, textord, "Å", "\\Angstrom", true);
defineSymbol(math, textord, "\u2663", "\\clubsuit", true);
defineSymbol(math, textord, "\u2667", "\\varclubsuit", true);
defineSymbol(math, textord, "\u2118", "\\wp", true);
defineSymbol(math, textord, "\u266f", "\\sharp", true);
defineSymbol(math, textord, "\u2662", "\\diamondsuit", true);
defineSymbol(math, textord, "\u2666", "\\vardiamondsuit", true);
defineSymbol(math, textord, "\u211c", "\\Re", true);
defineSymbol(math, textord, "\u2661", "\\heartsuit", true);
defineSymbol(math, textord, "\u2665", "\\varheartsuit", true);
defineSymbol(math, textord, "\u2111", "\\Im", true);
defineSymbol(math, textord, "\u2660", "\\spadesuit", true);
defineSymbol(math, textord, "\u2664", "\\varspadesuit", true);
defineSymbol(math, textord, "\u2640", "\\female", true);
defineSymbol(math, textord, "\u2642", "\\male", true);
defineSymbol(math, textord, "\u00a7", "\\S", true);
defineSymbol(text, textord, "\u00a7", "\\S");
defineSymbol(math, textord, "\u00b6", "\\P", true);
defineSymbol(text, textord, "\u00b6", "\\P");
defineSymbol(text, textord, "\u263a", "\\smiley", true);
defineSymbol(math, textord, "\u263a", "\\smiley", true);

// Math and Text
defineSymbol(math, textord, "\u2020", "\\dag");
defineSymbol(text, textord, "\u2020", "\\dag");
defineSymbol(text, textord, "\u2020", "\\textdagger");
defineSymbol(math, textord, "\u2021", "\\ddag");
defineSymbol(text, textord, "\u2021", "\\ddag");
defineSymbol(text, textord, "\u2021", "\\textdaggerdbl");

// Large Delimiters
defineSymbol(math, close, "\u23b1", "\\rmoustache", true);
defineSymbol(math, open, "\u23b0", "\\lmoustache", true);
defineSymbol(math, close, "\u27ef", "\\rgroup", true);
defineSymbol(math, open, "\u27ee", "\\lgroup", true);

// Binary Operators
defineSymbol(math, bin, "\u2213", "\\mp", true);
defineSymbol(math, bin, "\u2296", "\\ominus", true);
defineSymbol(math, bin, "\u228e", "\\uplus", true);
defineSymbol(math, bin, "\u2293", "\\sqcap", true);
defineSymbol(math, bin, "\u2217", "\\ast");
defineSymbol(math, bin, "\u2294", "\\sqcup", true);
defineSymbol(math, bin, "\u25ef", "\\bigcirc", true);
defineSymbol(math, bin, "\u2219", "\\bullet", true);
defineSymbol(math, bin, "\u2021", "\\ddagger");
defineSymbol(math, bin, "\u2240", "\\wr", true);
defineSymbol(math, bin, "\u2a3f", "\\amalg");
defineSymbol(math, bin, "\u0026", "\\And"); // from amsmath
defineSymbol(math, bin, "\u2AFD", "\\sslash", true); // from stmaryrd

// Arrow Symbols
defineSymbol(math, rel, "\u27f5", "\\longleftarrow", true);
defineSymbol(math, rel, "\u21d0", "\\Leftarrow", true);
defineSymbol(math, rel, "\u27f8", "\\Longleftarrow", true);
defineSymbol(math, rel, "\u27f6", "\\longrightarrow", true);
defineSymbol(math, rel, "\u21d2", "\\Rightarrow", true);
defineSymbol(math, rel, "\u27f9", "\\Longrightarrow", true);
defineSymbol(math, rel, "\u2194", "\\leftrightarrow", true);
defineSymbol(math, rel, "\u27f7", "\\longleftrightarrow", true);
defineSymbol(math, rel, "\u21d4", "\\Leftrightarrow", true);
defineSymbol(math, rel, "\u27fa", "\\Longleftrightarrow", true);
defineSymbol(math, rel, "\u21a4", "\\mapsfrom", true);
defineSymbol(math, rel, "\u21a6", "\\mapsto", true);
defineSymbol(math, rel, "\u27fc", "\\longmapsto", true);
defineSymbol(math, rel, "\u2197", "\\nearrow", true);
defineSymbol(math, rel, "\u21a9", "\\hookleftarrow", true);
defineSymbol(math, rel, "\u21aa", "\\hookrightarrow", true);
defineSymbol(math, rel, "\u2198", "\\searrow", true);
defineSymbol(math, rel, "\u21bc", "\\leftharpoonup", true);
defineSymbol(math, rel, "\u21c0", "\\rightharpoonup", true);
defineSymbol(math, rel, "\u2199", "\\swarrow", true);
defineSymbol(math, rel, "\u21bd", "\\leftharpoondown", true);
defineSymbol(math, rel, "\u21c1", "\\rightharpoondown", true);
defineSymbol(math, rel, "\u2196", "\\nwarrow", true);
defineSymbol(math, rel, "\u21cc", "\\rightleftharpoons", true);
defineSymbol(math, mathord, "\u21af", "\\lightning", true);
defineSymbol(math, mathord, "\u220E", "\\QED", true);
defineSymbol(math, mathord, "\u2030", "\\permil", true);
defineSymbol(text, textord, "\u2030", "\\permil");
defineSymbol(math, mathord, "\u2609", "\\astrosun", true);
defineSymbol(math, mathord, "\u263c", "\\sun", true);
defineSymbol(math, mathord, "\u263e", "\\leftmoon", true);
defineSymbol(math, mathord, "\u263d", "\\rightmoon", true);
defineSymbol(math, mathord, "\u2295", "\\Earth");

// AMS Negated Binary Relations
defineSymbol(math, rel, "\u226e", "\\nless", true);
// Symbol names preceeded by "@" each have a corresponding macro.
defineSymbol(math, rel, "\u2a87", "\\lneq", true);
defineSymbol(math, rel, "\u2268", "\\lneqq", true);
defineSymbol(math, rel, "\u2268\ufe00", "\\lvertneqq");
defineSymbol(math, rel, "\u22e6", "\\lnsim", true);
defineSymbol(math, rel, "\u2a89", "\\lnapprox", true);
defineSymbol(math, rel, "\u2280", "\\nprec", true);
// unicode-math maps \u22e0 to \npreccurlyeq. We'll use the AMS synonym.
defineSymbol(math, rel, "\u22e0", "\\npreceq", true);
defineSymbol(math, rel, "\u22e8", "\\precnsim", true);
defineSymbol(math, rel, "\u2ab9", "\\precnapprox", true);
defineSymbol(math, rel, "\u2241", "\\nsim", true);
defineSymbol(math, rel, "\u2224", "\\nmid", true);
defineSymbol(math, rel, "\u2224", "\\nshortmid");
defineSymbol(math, rel, "\u22ac", "\\nvdash", true);
defineSymbol(math, rel, "\u22ad", "\\nvDash", true);
defineSymbol(math, rel, "\u22ea", "\\ntriangleleft");
defineSymbol(math, rel, "\u22ec", "\\ntrianglelefteq", true);
defineSymbol(math, rel, "\u2284", "\\nsubset", true);
defineSymbol(math, rel, "\u2285", "\\nsupset", true);
defineSymbol(math, rel, "\u228a", "\\subsetneq", true);
defineSymbol(math, rel, "\u228a\ufe00", "\\varsubsetneq");
defineSymbol(math, rel, "\u2acb", "\\subsetneqq", true);
defineSymbol(math, rel, "\u2acb\ufe00", "\\varsubsetneqq");
defineSymbol(math, rel, "\u226f", "\\ngtr", true);
defineSymbol(math, rel, "\u2a88", "\\gneq", true);
defineSymbol(math, rel, "\u2269", "\\gneqq", true);
defineSymbol(math, rel, "\u2269\ufe00", "\\gvertneqq");
defineSymbol(math, rel, "\u22e7", "\\gnsim", true);
defineSymbol(math, rel, "\u2a8a", "\\gnapprox", true);
defineSymbol(math, rel, "\u2281", "\\nsucc", true);
// unicode-math maps \u22e1 to \nsucccurlyeq. We'll use the AMS synonym.
defineSymbol(math, rel, "\u22e1", "\\nsucceq", true);
defineSymbol(math, rel, "\u22e9", "\\succnsim", true);
defineSymbol(math, rel, "\u2aba", "\\succnapprox", true);
// unicode-math maps \u2246 to \simneqq. We'll use the AMS synonym.
defineSymbol(math, rel, "\u2246", "\\ncong", true);
defineSymbol(math, rel, "\u2226", "\\nparallel", true);
defineSymbol(math, rel, "\u2226", "\\nshortparallel");
defineSymbol(math, rel, "\u22af", "\\nVDash", true);
defineSymbol(math, rel, "\u22eb", "\\ntriangleright");
defineSymbol(math, rel, "\u22ed", "\\ntrianglerighteq", true);
defineSymbol(math, rel, "\u228b", "\\supsetneq", true);
defineSymbol(math, rel, "\u228b", "\\varsupsetneq");
defineSymbol(math, rel, "\u2acc", "\\supsetneqq", true);
defineSymbol(math, rel, "\u2acc\ufe00", "\\varsupsetneqq");
defineSymbol(math, rel, "\u22ae", "\\nVdash", true);
defineSymbol(math, rel, "\u2ab5", "\\precneqq", true);
defineSymbol(math, rel, "\u2ab6", "\\succneqq", true);
defineSymbol(math, bin, "\u22b4", "\\unlhd");
defineSymbol(math, bin, "\u22b5", "\\unrhd");

// AMS Negated Arrows
defineSymbol(math, rel, "\u219a", "\\nleftarrow", true);
defineSymbol(math, rel, "\u219b", "\\nrightarrow", true);
defineSymbol(math, rel, "\u21cd", "\\nLeftarrow", true);
defineSymbol(math, rel, "\u21cf", "\\nRightarrow", true);
defineSymbol(math, rel, "\u21ae", "\\nleftrightarrow", true);
defineSymbol(math, rel, "\u21ce", "\\nLeftrightarrow", true);

// AMS Misc
defineSymbol(math, rel, "\u25b3", "\\vartriangle");
defineSymbol(math, textord, "\u210f", "\\hslash");
defineSymbol(math, textord, "\u25bd", "\\triangledown");
defineSymbol(math, textord, "\u25ca", "\\lozenge");
defineSymbol(math, textord, "\u24c8", "\\circledS");
defineSymbol(math, textord, "\u00ae", "\\circledR", true);
defineSymbol(text, textord, "\u00ae", "\\circledR");
defineSymbol(text, textord, "\u00ae", "\\textregistered");
defineSymbol(math, textord, "\u2221", "\\measuredangle", true);
defineSymbol(math, textord, "\u2204", "\\nexists");
defineSymbol(math, textord, "\u2127", "\\mho");
defineSymbol(math, textord, "\u2132", "\\Finv", true);
defineSymbol(math, textord, "\u2141", "\\Game", true);
defineSymbol(math, textord, "\u2035", "\\backprime");
defineSymbol(math, textord, "\u2036", "\\backdprime");
defineSymbol(math, textord, "\u2037", "\\backtrprime");
defineSymbol(math, textord, "\u25b2", "\\blacktriangle");
defineSymbol(math, textord, "\u25bc", "\\blacktriangledown");
defineSymbol(math, textord, "\u25a0", "\\blacksquare");
defineSymbol(math, textord, "\u29eb", "\\blacklozenge");
defineSymbol(math, textord, "\u2605", "\\bigstar");
defineSymbol(math, textord, "\u2222", "\\sphericalangle", true);
defineSymbol(math, textord, "\u2201", "\\complement", true);
defineSymbol(math, textord, "\u2571", "\\diagup");
defineSymbol(math, textord, "\u2572", "\\diagdown");
defineSymbol(math, textord, "\u25a1", "\\square");
defineSymbol(math, textord, "\u25a1", "\\Box");
defineSymbol(math, textord, "\u25ca", "\\Diamond");
// unicode-math maps U+A5 to \mathyen. We map to AMS function \yen
defineSymbol(math, textord, "\u00a5", "\\yen", true);
defineSymbol(text, textord, "\u00a5", "\\yen", true);
defineSymbol(math, textord, "\u2713", "\\checkmark", true);
defineSymbol(text, textord, "\u2713", "\\checkmark");
defineSymbol(math, textord, "\u2717", "\\ballotx", true);
defineSymbol(text, textord, "\u2717", "\\ballotx");
defineSymbol(text, textord, "\u2022", "\\textbullet");

// AMS Hebrew
defineSymbol(math, textord, "\u2136", "\\beth", true);
defineSymbol(math, textord, "\u2138", "\\daleth", true);
defineSymbol(math, textord, "\u2137", "\\gimel", true);

// AMS Greek
defineSymbol(math, textord, "\u03dd", "\\digamma", true);
defineSymbol(math, textord, "\u03f0", "\\varkappa");

// AMS Delimiters
defineSymbol(math, open, "\u231C", "\\ulcorner", true);
defineSymbol(math, close, "\u231D", "\\urcorner", true);
defineSymbol(math, open, "\u231E", "\\llcorner", true);
defineSymbol(math, close, "\u231F", "\\lrcorner", true);

// AMS Binary Relations
defineSymbol(math, rel, "\u2266", "\\leqq", true);
defineSymbol(math, rel, "\u2a7d", "\\leqslant", true);
defineSymbol(math, rel, "\u2a95", "\\eqslantless", true);
defineSymbol(math, rel, "\u2272", "\\lesssim", true);
defineSymbol(math, rel, "\u2a85", "\\lessapprox", true);
defineSymbol(math, rel, "\u224a", "\\approxeq", true);
defineSymbol(math, bin, "\u22d6", "\\lessdot");
defineSymbol(math, rel, "\u22d8", "\\lll", true);
defineSymbol(math, rel, "\u2276", "\\lessgtr", true);
defineSymbol(math, rel, "\u22da", "\\lesseqgtr", true);
defineSymbol(math, rel, "\u2a8b", "\\lesseqqgtr", true);
defineSymbol(math, rel, "\u2251", "\\doteqdot");
defineSymbol(math, rel, "\u2253", "\\risingdotseq", true);
defineSymbol(math, rel, "\u2252", "\\fallingdotseq", true);
defineSymbol(math, rel, "\u223d", "\\backsim", true);
defineSymbol(math, rel, "\u22cd", "\\backsimeq", true);
defineSymbol(math, rel, "\u2ac5", "\\subseteqq", true);
defineSymbol(math, rel, "\u22d0", "\\Subset", true);
defineSymbol(math, rel, "\u228f", "\\sqsubset", true);
defineSymbol(math, rel, "\u227c", "\\preccurlyeq", true);
defineSymbol(math, rel, "\u22de", "\\curlyeqprec", true);
defineSymbol(math, rel, "\u227e", "\\precsim", true);
defineSymbol(math, rel, "\u2ab7", "\\precapprox", true);
defineSymbol(math, rel, "\u22b2", "\\vartriangleleft");
defineSymbol(math, rel, "\u22b4", "\\trianglelefteq");
defineSymbol(math, rel, "\u22a8", "\\vDash", true);
defineSymbol(math, rel, "\u22ab", "\\VDash", true);
defineSymbol(math, rel, "\u22aa", "\\Vvdash", true);
defineSymbol(math, rel, "\u2323", "\\smallsmile");
defineSymbol(math, rel, "\u2322", "\\smallfrown");
defineSymbol(math, rel, "\u224f", "\\bumpeq", true);
defineSymbol(math, rel, "\u224e", "\\Bumpeq", true);
defineSymbol(math, rel, "\u2267", "\\geqq", true);
defineSymbol(math, rel, "\u2a7e", "\\geqslant", true);
defineSymbol(math, rel, "\u2a96", "\\eqslantgtr", true);
defineSymbol(math, rel, "\u2273", "\\gtrsim", true);
defineSymbol(math, rel, "\u2a86", "\\gtrapprox", true);
defineSymbol(math, bin, "\u22d7", "\\gtrdot");
defineSymbol(math, rel, "\u22d9", "\\ggg", true);
defineSymbol(math, rel, "\u2277", "\\gtrless", true);
defineSymbol(math, rel, "\u22db", "\\gtreqless", true);
defineSymbol(math, rel, "\u2a8c", "\\gtreqqless", true);
defineSymbol(math, rel, "\u2256", "\\eqcirc", true);
defineSymbol(math, rel, "\u2257", "\\circeq", true);
defineSymbol(math, rel, "\u225c", "\\triangleq", true);
defineSymbol(math, rel, "\u223c", "\\thicksim");
defineSymbol(math, rel, "\u2248", "\\thickapprox");
defineSymbol(math, rel, "\u2ac6", "\\supseteqq", true);
defineSymbol(math, rel, "\u22d1", "\\Supset", true);
defineSymbol(math, rel, "\u2290", "\\sqsupset", true);
defineSymbol(math, rel, "\u227d", "\\succcurlyeq", true);
defineSymbol(math, rel, "\u22df", "\\curlyeqsucc", true);
defineSymbol(math, rel, "\u227f", "\\succsim", true);
defineSymbol(math, rel, "\u2ab8", "\\succapprox", true);
defineSymbol(math, rel, "\u22b3", "\\vartriangleright");
defineSymbol(math, rel, "\u22b5", "\\trianglerighteq");
defineSymbol(math, rel, "\u22a9", "\\Vdash", true);
defineSymbol(math, rel, "\u2223", "\\shortmid");
defineSymbol(math, rel, "\u2225", "\\shortparallel");
defineSymbol(math, rel, "\u226c", "\\between", true);
defineSymbol(math, rel, "\u22d4", "\\pitchfork", true);
defineSymbol(math, rel, "\u221d", "\\varpropto");
defineSymbol(math, rel, "\u25c0", "\\blacktriangleleft");
// unicode-math says that \therefore is a mathord atom.
// We kept the amssymb atom type, which is rel.
defineSymbol(math, rel, "\u2234", "\\therefore", true);
defineSymbol(math, rel, "\u220d", "\\backepsilon");
defineSymbol(math, rel, "\u25b6", "\\blacktriangleright");
// unicode-math says that \because is a mathord atom.
// We kept the amssymb atom type, which is rel.
defineSymbol(math, rel, "\u2235", "\\because", true);
defineSymbol(math, rel, "\u22d8", "\\llless");
defineSymbol(math, rel, "\u22d9", "\\gggtr");
defineSymbol(math, bin, "\u22b2", "\\lhd");
defineSymbol(math, bin, "\u22b3", "\\rhd");
defineSymbol(math, rel, "\u2242", "\\eqsim", true);
defineSymbol(math, rel, "\u2251", "\\Doteq", true);
defineSymbol(math, rel, "\u297d", "\\strictif", true);
defineSymbol(math, rel, "\u297c", "\\strictfi", true);

// AMS Binary Operators
defineSymbol(math, bin, "\u2214", "\\dotplus", true);
defineSymbol(math, bin, "\u2216", "\\smallsetminus");
defineSymbol(math, bin, "\u22d2", "\\Cap", true);
defineSymbol(math, bin, "\u22d3", "\\Cup", true);
defineSymbol(math, bin, "\u2a5e", "\\doublebarwedge", true);
defineSymbol(math, bin, "\u229f", "\\boxminus", true);
defineSymbol(math, bin, "\u229e", "\\boxplus", true);
defineSymbol(math, bin, "\u29C4", "\\boxslash", true);
defineSymbol(math, bin, "\u22c7", "\\divideontimes", true);
defineSymbol(math, bin, "\u22c9", "\\ltimes", true);
defineSymbol(math, bin, "\u22ca", "\\rtimes", true);
defineSymbol(math, bin, "\u22cb", "\\leftthreetimes", true);
defineSymbol(math, bin, "\u22cc", "\\rightthreetimes", true);
defineSymbol(math, bin, "\u22cf", "\\curlywedge", true);
defineSymbol(math, bin, "\u22ce", "\\curlyvee", true);
defineSymbol(math, bin, "\u229d", "\\circleddash", true);
defineSymbol(math, bin, "\u229b", "\\circledast", true);
defineSymbol(math, bin, "\u22ba", "\\intercal", true);
defineSymbol(math, bin, "\u22d2", "\\doublecap");
defineSymbol(math, bin, "\u22d3", "\\doublecup");
defineSymbol(math, bin, "\u22a0", "\\boxtimes", true);
defineSymbol(math, bin, "\u22c8", "\\bowtie", true);
defineSymbol(math, bin, "\u22c8", "\\Join");
defineSymbol(math, bin, "\u27d5", "\\leftouterjoin", true);
defineSymbol(math, bin, "\u27d6", "\\rightouterjoin", true);
defineSymbol(math, bin, "\u27d7", "\\fullouterjoin", true);

// stix Binary Operators
defineSymbol(math, bin, "\u2238", "\\dotminus", true);
defineSymbol(math, bin, "\u27D1", "\\wedgedot", true);
defineSymbol(math, bin, "\u27C7", "\\veedot", true);
defineSymbol(math, bin, "\u2A62", "\\doublebarvee", true);
defineSymbol(math, bin, "\u2A63", "\\veedoublebar", true);
defineSymbol(math, bin, "\u2A5F", "\\wedgebar", true);
defineSymbol(math, bin, "\u2A60", "\\wedgedoublebar", true);
defineSymbol(math, bin, "\u2A54", "\\Vee", true);
defineSymbol(math, bin, "\u2A53", "\\Wedge", true);
defineSymbol(math, bin, "\u2A43", "\\barcap", true);
defineSymbol(math, bin, "\u2A42", "\\barcup", true);
defineSymbol(math, bin, "\u2A48", "\\capbarcup", true);
defineSymbol(math, bin, "\u2A40", "\\capdot", true);
defineSymbol(math, bin, "\u2A47", "\\capovercup", true);
defineSymbol(math, bin, "\u2A46", "\\cupovercap", true);
defineSymbol(math, bin, "\u2A4D", "\\closedvarcap", true);
defineSymbol(math, bin, "\u2A4C", "\\closedvarcup", true);
defineSymbol(math, bin, "\u2A2A", "\\minusdot", true);
defineSymbol(math, bin, "\u2A2B", "\\minusfdots", true);
defineSymbol(math, bin, "\u2A2C", "\\minusrdots", true);
defineSymbol(math, bin, "\u22BB", "\\Xor", true);
defineSymbol(math, bin, "\u22BC", "\\Nand", true);
defineSymbol(math, bin, "\u22BD", "\\Nor", true);
defineSymbol(math, bin, "\u22BD", "\\barvee");
defineSymbol(math, bin, "\u2AF4", "\\interleave", true);
defineSymbol(math, bin, "\u29E2", "\\shuffle", true);
defineSymbol(math, bin, "\u2AF6", "\\threedotcolon", true);
defineSymbol(math, bin, "\u2982", "\\typecolon", true);
defineSymbol(math, bin, "\u223E", "\\invlazys", true);
defineSymbol(math, bin, "\u2A4B", "\\twocaps", true);
defineSymbol(math, bin, "\u2A4A", "\\twocups", true);
defineSymbol(math, bin, "\u2A4E", "\\Sqcap", true);
defineSymbol(math, bin, "\u2A4F", "\\Sqcup", true);
defineSymbol(math, bin, "\u2A56", "\\veeonvee", true);
defineSymbol(math, bin, "\u2A55", "\\wedgeonwedge", true);
defineSymbol(math, bin, "\u29D7", "\\blackhourglass", true);
defineSymbol(math, bin, "\u29C6", "\\boxast", true);
defineSymbol(math, bin, "\u29C8", "\\boxbox", true);
defineSymbol(math, bin, "\u29C7", "\\boxcircle", true);
defineSymbol(math, bin, "\u229C", "\\circledequal", true);
defineSymbol(math, bin, "\u29B7", "\\circledparallel", true);
defineSymbol(math, bin, "\u29B6", "\\circledvert", true);
defineSymbol(math, bin, "\u29B5", "\\circlehbar", true);
defineSymbol(math, bin, "\u27E1", "\\concavediamond", true);
defineSymbol(math, bin, "\u27E2", "\\concavediamondtickleft", true);
defineSymbol(math, bin, "\u27E3", "\\concavediamondtickright", true);
defineSymbol(math, bin, "\u22C4", "\\diamond", true);
defineSymbol(math, bin, "\u29D6", "\\hourglass", true);
defineSymbol(math, bin, "\u27E0", "\\lozengeminus", true);
defineSymbol(math, bin, "\u233D", "\\obar", true);
defineSymbol(math, bin, "\u29B8", "\\obslash", true);
defineSymbol(math, bin, "\u2A38", "\\odiv", true);
defineSymbol(math, bin, "\u29C1", "\\ogreaterthan", true);
defineSymbol(math, bin, "\u29C0", "\\olessthan", true);
defineSymbol(math, bin, "\u29B9", "\\operp", true);
defineSymbol(math, bin, "\u2A37", "\\Otimes", true);
defineSymbol(math, bin, "\u2A36", "\\otimeshat", true);
defineSymbol(math, bin, "\u22C6", "\\star", true);
defineSymbol(math, bin, "\u25B3", "\\triangle", true);
defineSymbol(math, bin, "\u2A3A", "\\triangleminus", true);
defineSymbol(math, bin, "\u2A39", "\\triangleplus", true);
defineSymbol(math, bin, "\u2A3B", "\\triangletimes", true);
defineSymbol(math, bin, "\u27E4", "\\whitesquaretickleft", true);
defineSymbol(math, bin, "\u27E5", "\\whitesquaretickright", true);
defineSymbol(math, bin, "\u2A33", "\\smashtimes", true);

// AMS Arrows
// Note: unicode-math maps \u21e2 to their own function \rightdasharrow.
// We'll map it to AMS function \dashrightarrow. It produces the same atom.
defineSymbol(math, rel, "\u21e2", "\\dashrightarrow", true);
// unicode-math maps \u21e0 to \leftdasharrow. We'll use the AMS synonym.
defineSymbol(math, rel, "\u21e0", "\\dashleftarrow", true);
defineSymbol(math, rel, "\u21c7", "\\leftleftarrows", true);
defineSymbol(math, rel, "\u21c6", "\\leftrightarrows", true);
defineSymbol(math, rel, "\u21da", "\\Lleftarrow", true);
defineSymbol(math, rel, "\u219e", "\\twoheadleftarrow", true);
defineSymbol(math, rel, "\u21a2", "\\leftarrowtail", true);
defineSymbol(math, rel, "\u21ab", "\\looparrowleft", true);
defineSymbol(math, rel, "\u21cb", "\\leftrightharpoons", true);
defineSymbol(math, rel, "\u21b6", "\\curvearrowleft", true);
// unicode-math maps \u21ba to \acwopencirclearrow. We'll use the AMS synonym.
defineSymbol(math, rel, "\u21ba", "\\circlearrowleft", true);
defineSymbol(math, rel, "\u21b0", "\\Lsh", true);
defineSymbol(math, rel, "\u21c8", "\\upuparrows", true);
defineSymbol(math, rel, "\u21bf", "\\upharpoonleft", true);
defineSymbol(math, rel, "\u21c3", "\\downharpoonleft", true);
defineSymbol(math, rel, "\u22b6", "\\origof", true);
defineSymbol(math, rel, "\u22b7", "\\imageof", true);
defineSymbol(math, rel, "\u22b8", "\\multimap", true);
defineSymbol(math, rel, "\u21ad", "\\leftrightsquigarrow", true);
defineSymbol(math, rel, "\u21c9", "\\rightrightarrows", true);
defineSymbol(math, rel, "\u21c4", "\\rightleftarrows", true);
defineSymbol(math, rel, "\u21a0", "\\twoheadrightarrow", true);
defineSymbol(math, rel, "\u21a3", "\\rightarrowtail", true);
defineSymbol(math, rel, "\u21ac", "\\looparrowright", true);
defineSymbol(math, rel, "\u21b7", "\\curvearrowright", true);
// unicode-math maps \u21bb to \cwopencirclearrow. We'll use the AMS synonym.
defineSymbol(math, rel, "\u21bb", "\\circlearrowright", true);
defineSymbol(math, rel, "\u21b1", "\\Rsh", true);
defineSymbol(math, rel, "\u21ca", "\\downdownarrows", true);
defineSymbol(math, rel, "\u21be", "\\upharpoonright", true);
defineSymbol(math, rel, "\u21c2", "\\downharpoonright", true);
defineSymbol(math, rel, "\u21dd", "\\rightsquigarrow", true);
defineSymbol(math, rel, "\u21dd", "\\leadsto");
defineSymbol(math, rel, "\u21db", "\\Rrightarrow", true);
defineSymbol(math, rel, "\u21be", "\\restriction");

defineSymbol(math, textord, "\u2018", "`");
defineSymbol(math, textord, "$", "\\$");
defineSymbol(text, textord, "$", "\\$");
defineSymbol(text, textord, "$", "\\textdollar");
defineSymbol(math, textord, "¢", "\\cent");
defineSymbol(text, textord, "¢", "\\cent");
defineSymbol(math, textord, "%", "\\%");
defineSymbol(text, textord, "%", "\\%");
defineSymbol(math, textord, "_", "\\_");
defineSymbol(text, textord, "_", "\\_");
defineSymbol(text, textord, "_", "\\textunderscore");
defineSymbol(text, textord, "\u2423", "\\textvisiblespace", true);
defineSymbol(math, textord, "\u2220", "\\angle", true);
defineSymbol(math, textord, "\u221e", "\\infty", true);
defineSymbol(math, textord, "\u2032", "\\prime");
defineSymbol(math, textord, "\u2033", "\\dprime");
defineSymbol(math, textord, "\u2034", "\\trprime");
defineSymbol(math, textord, "\u2057", "\\qprime");
defineSymbol(math, textord, "\u25b3", "\\triangle");
defineSymbol(text, textord, "\u0391", "\\Alpha", true);
defineSymbol(text, textord, "\u0392", "\\Beta", true);
defineSymbol(text, textord, "\u0393", "\\Gamma", true);
defineSymbol(text, textord, "\u0394", "\\Delta", true);
defineSymbol(text, textord, "\u0395", "\\Epsilon", true);
defineSymbol(text, textord, "\u0396", "\\Zeta", true);
defineSymbol(text, textord, "\u0397", "\\Eta", true);
defineSymbol(text, textord, "\u0398", "\\Theta", true);
defineSymbol(text, textord, "\u0399", "\\Iota", true);
defineSymbol(text, textord, "\u039a", "\\Kappa", true);
defineSymbol(text, textord, "\u039b", "\\Lambda", true);
defineSymbol(text, textord, "\u039c", "\\Mu", true);
defineSymbol(text, textord, "\u039d", "\\Nu", true);
defineSymbol(text, textord, "\u039e", "\\Xi", true);
defineSymbol(text, textord, "\u039f", "\\Omicron", true);
defineSymbol(text, textord, "\u03a0", "\\Pi", true);
defineSymbol(text, textord, "\u03a1", "\\Rho", true);
defineSymbol(text, textord, "\u03a3", "\\Sigma", true);
defineSymbol(text, textord, "\u03a4", "\\Tau", true);
defineSymbol(text, textord, "\u03a5", "\\Upsilon", true);
defineSymbol(text, textord, "\u03a6", "\\Phi", true);
defineSymbol(text, textord, "\u03a7", "\\Chi", true);
defineSymbol(text, textord, "\u03a8", "\\Psi", true);
defineSymbol(text, textord, "\u03a9", "\\Omega", true);
defineSymbol(math, mathord, "\u0391", "\\Alpha", true);
defineSymbol(math, mathord, "\u0392", "\\Beta", true);
defineSymbol(math, mathord, "\u0393", "\\Gamma", true);
defineSymbol(math, mathord, "\u0394", "\\Delta", true);
defineSymbol(math, mathord, "\u0395", "\\Epsilon", true);
defineSymbol(math, mathord, "\u0396", "\\Zeta", true);
defineSymbol(math, mathord, "\u0397", "\\Eta", true);
defineSymbol(math, mathord, "\u0398", "\\Theta", true);
defineSymbol(math, mathord, "\u0399", "\\Iota", true);
defineSymbol(math, mathord, "\u039a", "\\Kappa", true);
defineSymbol(math, mathord, "\u039b", "\\Lambda", true);
defineSymbol(math, mathord, "\u039c", "\\Mu", true);
defineSymbol(math, mathord, "\u039d", "\\Nu", true);
defineSymbol(math, mathord, "\u039e", "\\Xi", true);
defineSymbol(math, mathord, "\u039f", "\\Omicron", true);
defineSymbol(math, mathord, "\u03a0", "\\Pi", true);
defineSymbol(math, mathord, "\u03a1", "\\Rho", true);
defineSymbol(math, mathord, "\u03a3", "\\Sigma", true);
defineSymbol(math, mathord, "\u03a4", "\\Tau", true);
defineSymbol(math, mathord, "\u03a5", "\\Upsilon", true);
defineSymbol(math, mathord, "\u03a6", "\\Phi", true);
defineSymbol(math, mathord, "\u03a7", "\\Chi", true);
defineSymbol(math, mathord, "\u03a8", "\\Psi", true);
defineSymbol(math, mathord, "\u03a9", "\\Omega", true);
defineSymbol(math, open, "\u00ac", "\\neg", true);
defineSymbol(math, open, "\u00ac", "\\lnot");
defineSymbol(math, textord, "\u22a4", "\\top");
defineSymbol(math, textord, "\u22a5", "\\bot");
defineSymbol(math, textord, "\u2205", "\\emptyset");
defineSymbol(math, textord, "\u2300", "\\varnothing");
defineSymbol(math, mathord, "\u03b1", "\\alpha", true);
defineSymbol(math, mathord, "\u03b2", "\\beta", true);
defineSymbol(math, mathord, "\u03b3", "\\gamma", true);
defineSymbol(math, mathord, "\u03b4", "\\delta", true);
defineSymbol(math, mathord, "\u03f5", "\\epsilon", true);
defineSymbol(math, mathord, "\u03b6", "\\zeta", true);
defineSymbol(math, mathord, "\u03b7", "\\eta", true);
defineSymbol(math, mathord, "\u03b8", "\\theta", true);
defineSymbol(math, mathord, "\u03b9", "\\iota", true);
defineSymbol(math, mathord, "\u03ba", "\\kappa", true);
defineSymbol(math, mathord, "\u03bb", "\\lambda", true);
defineSymbol(math, mathord, "\u03bc", "\\mu", true);
defineSymbol(math, mathord, "\u03bd", "\\nu", true);
defineSymbol(math, mathord, "\u03be", "\\xi", true);
defineSymbol(math, mathord, "\u03bf", "\\omicron", true);
defineSymbol(math, mathord, "\u03c0", "\\pi", true);
defineSymbol(math, mathord, "\u03c1", "\\rho", true);
defineSymbol(math, mathord, "\u03c3", "\\sigma", true);
defineSymbol(math, mathord, "\u03c4", "\\tau", true);
defineSymbol(math, mathord, "\u03c5", "\\upsilon", true);
defineSymbol(math, mathord, "\u03d5", "\\phi", true);
defineSymbol(math, mathord, "\u03c7", "\\chi", true);
defineSymbol(math, mathord, "\u03c8", "\\psi", true);
defineSymbol(math, mathord, "\u03c9", "\\omega", true);
defineSymbol(math, mathord, "\u03b5", "\\varepsilon", true);
defineSymbol(math, mathord, "\u03d1", "\\vartheta", true);
defineSymbol(math, mathord, "\u03d6", "\\varpi", true);
defineSymbol(math, mathord, "\u03f1", "\\varrho", true);
defineSymbol(math, mathord, "\u03c2", "\\varsigma", true);
defineSymbol(math, mathord, "\u03c6", "\\varphi", true);
defineSymbol(math, mathord, "\u03d8", "\\Coppa", true);
defineSymbol(math, mathord, "\u03d9", "\\coppa", true);
defineSymbol(math, mathord, "\u03d9", "\\varcoppa", true);
defineSymbol(math, mathord, "\u03de", "\\Koppa", true);
defineSymbol(math, mathord, "\u03df", "\\koppa", true);
defineSymbol(math, mathord, "\u03e0", "\\Sampi", true);
defineSymbol(math, mathord, "\u03e1", "\\sampi", true);
defineSymbol(math, mathord, "\u03da", "\\Stigma", true);
defineSymbol(math, mathord, "\u03db", "\\stigma", true);
defineSymbol(math, mathord, "\u2aeb", "\\Bot");

// unicode-math maps U+F0 to \matheth. We map to AMS function \eth
defineSymbol(math, textord, "\u00f0", "\\eth", true); // ð
defineSymbol(text, textord, "\u00f0", "\u00f0");
// Extended ASCII and non-ASCII Letters
defineSymbol(math, textord, "\u00C5", "\\AA"); // Å
defineSymbol(text, textord, "\u00C5", "\\AA", true);
defineSymbol(math, textord, "\u00C6", "\\AE", true); // Æ
defineSymbol(text, textord, "\u00C6", "\\AE", true);
defineSymbol(math, textord, "\u00D0", "\\DH", true); // Ð
defineSymbol(text, textord, "\u00D0", "\\DH", true);
defineSymbol(math, textord, "\u00DE", "\\TH", true); // Þ
defineSymbol(text, textord, "\u00DE", "\\TH", true);
defineSymbol(math, textord, "\u00DF", "\\ss", true); // ß
defineSymbol(text, textord, "\u00DF", "\\ss", true);
defineSymbol(math, textord, "\u00E5", "\\aa"); // å
defineSymbol(text, textord, "\u00E5", "\\aa", true);
defineSymbol(math, textord, "\u00E6", "\\ae", true); // æ
defineSymbol(text, textord, "\u00E6", "\\ae", true);
defineSymbol(math, textord, "\u00F0", "\\dh"); // ð
defineSymbol(text, textord, "\u00F0", "\\dh", true);
defineSymbol(math, textord, "\u00FE", "\\th", true); // þ
defineSymbol(text, textord, "\u00FE", "\\th", true);
defineSymbol(math, textord, "\u0110", "\\DJ", true); // Đ
defineSymbol(text, textord, "\u0110", "\\DJ", true);
defineSymbol(math, textord, "\u0111", "\\dj", true); // đ
defineSymbol(text, textord, "\u0111", "\\dj", true);
defineSymbol(math, textord, "\u0141", "\\L", true); // Ł
defineSymbol(text, textord, "\u0141", "\\L", true);
defineSymbol(math, textord, "\u0141", "\\l", true); // ł
defineSymbol(text, textord, "\u0141", "\\l", true);
defineSymbol(math, textord, "\u014A", "\\NG", true); // Ŋ
defineSymbol(text, textord, "\u014A", "\\NG", true);
defineSymbol(math, textord, "\u014B", "\\ng", true); // ŋ
defineSymbol(text, textord, "\u014B", "\\ng", true);
defineSymbol(math, textord, "\u0152", "\\OE", true); // Œ
defineSymbol(text, textord, "\u0152", "\\OE", true);
defineSymbol(math, textord, "\u0153", "\\oe", true); // œ
defineSymbol(text, textord, "\u0153", "\\oe", true);

defineSymbol(math, bin, "\u2217", "\u2217", true);
defineSymbol(math, bin, "+", "+");
defineSymbol(math, bin, "\u2217", "*");
defineSymbol(math, bin, "\u2044", "/", true);
defineSymbol(math, bin, "\u2044", "\u2044");
defineSymbol(math, bin, "\u2212", "-", true);
defineSymbol(math, bin, "\u22c5", "\\cdot", true);
defineSymbol(math, bin, "\u2218", "\\circ", true);
defineSymbol(math, bin, "\u00f7", "\\div", true);
defineSymbol(math, bin, "\u00b1", "\\pm", true);
defineSymbol(math, bin, "\u00d7", "\\times", true);
defineSymbol(math, bin, "\u2229", "\\cap", true);
defineSymbol(math, bin, "\u222a", "\\cup", true);
defineSymbol(math, bin, "\u2216", "\\setminus", true);
defineSymbol(math, bin, "\u2227", "\\land");
defineSymbol(math, bin, "\u2228", "\\lor");
defineSymbol(math, bin, "\u2227", "\\wedge", true);
defineSymbol(math, bin, "\u2228", "\\vee", true);
defineSymbol(math, open, "\u27e6", "\\llbracket", true); // stmaryrd/semantic packages
defineSymbol(math, close, "\u27e7", "\\rrbracket", true);
defineSymbol(math, open, "\u27e8", "\\langle", true);
defineSymbol(math, open, "\u27ea", "\\lAngle", true);
defineSymbol(math, open, "\u2989", "\\llangle", true);
defineSymbol(math, open, "|", "\\lvert");
defineSymbol(math, open, "\u2016", "\\lVert", true);
defineSymbol(math, textord, "!", "\\oc"); // cmll package
defineSymbol(math, textord, "?", "\\wn");
defineSymbol(math, textord, "\u2193", "\\shpos");
defineSymbol(math, textord, "\u2195", "\\shift");
defineSymbol(math, textord, "\u2191", "\\shneg");
defineSymbol(math, close, "?", "?");
defineSymbol(math, close, "!", "!");
defineSymbol(math, close, "‼", "‼");
defineSymbol(math, close, "\u27e9", "\\rangle", true);
defineSymbol(math, close, "\u27eb", "\\rAngle", true);
defineSymbol(math, close, "\u298a", "\\rrangle", true);
defineSymbol(math, close, "|", "\\rvert");
defineSymbol(math, close, "\u2016", "\\rVert");
defineSymbol(math, open, "\u2983", "\\lBrace", true); // stmaryrd/semantic packages
defineSymbol(math, close, "\u2984", "\\rBrace", true);
defineSymbol(math, rel, "=", "\\equal", true);
defineSymbol(math, rel, ":", ":");
defineSymbol(math, rel, "\u2248", "\\approx", true);
defineSymbol(math, rel, "\u2245", "\\cong", true);
defineSymbol(math, rel, "\u2265", "\\ge");
defineSymbol(math, rel, "\u2265", "\\geq", true);
defineSymbol(math, rel, "\u2190", "\\gets");
defineSymbol(math, rel, ">", "\\gt", true);
defineSymbol(math, rel, "\u2208", "\\in", true);
defineSymbol(math, rel, "\u2209", "\\notin", true);
defineSymbol(math, rel, "\ue020", "\\@not");
defineSymbol(math, rel, "\u2282", "\\subset", true);
defineSymbol(math, rel, "\u2283", "\\supset", true);
defineSymbol(math, rel, "\u2286", "\\subseteq", true);
defineSymbol(math, rel, "\u2287", "\\supseteq", true);
defineSymbol(math, rel, "\u2288", "\\nsubseteq", true);
defineSymbol(math, rel, "\u2288", "\\nsubseteqq");
defineSymbol(math, rel, "\u2289", "\\nsupseteq", true);
defineSymbol(math, rel, "\u2289", "\\nsupseteqq");
defineSymbol(math, rel, "\u22a8", "\\models");
defineSymbol(math, rel, "\u2190", "\\leftarrow", true);
defineSymbol(math, rel, "\u2264", "\\le");
defineSymbol(math, rel, "\u2264", "\\leq", true);
defineSymbol(math, rel, "<", "\\lt", true);
defineSymbol(math, rel, "\u2192", "\\rightarrow", true);
defineSymbol(math, rel, "\u2192", "\\to");
defineSymbol(math, rel, "\u2271", "\\ngeq", true);
defineSymbol(math, rel, "\u2271", "\\ngeqq");
defineSymbol(math, rel, "\u2271", "\\ngeqslant");
defineSymbol(math, rel, "\u2270", "\\nleq", true);
defineSymbol(math, rel, "\u2270", "\\nleqq");
defineSymbol(math, rel, "\u2270", "\\nleqslant");
defineSymbol(math, rel, "\u2aeb", "\\Perp", true); //cmll package
defineSymbol(math, spacing, "\u00a0", "\\ ");
defineSymbol(math, spacing, "\u00a0", "\\space");
// Ref: LaTeX Source 2e: \DeclareRobustCommand{\nobreakspace}{%
defineSymbol(math, spacing, "\u00a0", "\\nobreakspace");
defineSymbol(text, spacing, "\u00a0", "\\ ");
defineSymbol(text, spacing, "\u00a0", " ");
defineSymbol(text, spacing, "\u00a0", "\\space");
defineSymbol(text, spacing, "\u00a0", "\\nobreakspace");
defineSymbol(math, spacing, null, "\\nobreak");
defineSymbol(math, spacing, null, "\\allowbreak");
defineSymbol(math, punct, ",", ",");
defineSymbol(text, punct, ":", ":");
defineSymbol(math, punct, ";", ";");
defineSymbol(math, bin, "\u22bc", "\\barwedge");
defineSymbol(math, bin, "\u22bb", "\\veebar");
defineSymbol(math, bin, "\u2299", "\\odot", true);
// Firefox turns ⊕ into an emoji. So append \uFE0E. Define Unicode character in macros, not here.
defineSymbol(math, bin, "\u2295\uFE0E", "\\oplus");
defineSymbol(math, bin, "\u2297", "\\otimes", true);
defineSymbol(math, textord, "\u2202", "\\partial", true);
defineSymbol(math, bin, "\u2298", "\\oslash", true);
defineSymbol(math, bin, "\u229a", "\\circledcirc", true);
defineSymbol(math, bin, "\u22a1", "\\boxdot", true);
defineSymbol(math, bin, "\u25b3", "\\bigtriangleup");
defineSymbol(math, bin, "\u25bd", "\\bigtriangledown");
defineSymbol(math, bin, "\u2020", "\\dagger");
defineSymbol(math, bin, "\u22c4", "\\diamond");
defineSymbol(math, bin, "\u25c3", "\\triangleleft");
defineSymbol(math, bin, "\u25b9", "\\triangleright");
defineSymbol(math, open, "{", "\\{");
defineSymbol(text, textord, "{", "\\{");
defineSymbol(text, textord, "{", "\\textbraceleft");
defineSymbol(math, close, "}", "\\}");
defineSymbol(text, textord, "}", "\\}");
defineSymbol(text, textord, "}", "\\textbraceright");
defineSymbol(math, open, "{", "\\lbrace");
defineSymbol(math, close, "}", "\\rbrace");
defineSymbol(math, open, "[", "\\lbrack", true);
defineSymbol(text, textord, "[", "\\lbrack", true);
defineSymbol(math, close, "]", "\\rbrack", true);
defineSymbol(text, textord, "]", "\\rbrack", true);
defineSymbol(math, open, "(", "\\lparen", true);
defineSymbol(math, close, ")", "\\rparen", true);
defineSymbol(math, open, "⦇", "\\llparenthesis", true);
defineSymbol(math, close, "⦈", "\\rrparenthesis", true);
defineSymbol(text, textord, "<", "\\textless", true); // in T1 fontenc
defineSymbol(text, textord, ">", "\\textgreater", true); // in T1 fontenc
defineSymbol(math, open, "\u230a", "\\lfloor", true);
defineSymbol(math, close, "\u230b", "\\rfloor", true);
defineSymbol(math, open, "\u2308", "\\lceil", true);
defineSymbol(math, close, "\u2309", "\\rceil", true);
defineSymbol(math, textord, "\\", "\\backslash");
defineSymbol(math, textord, "|", "|");
defineSymbol(math, textord, "|", "\\vert");
defineSymbol(text, textord, "|", "\\textbar", true); // in T1 fontenc
defineSymbol(math, textord, "\u2016", "\\|");
defineSymbol(math, textord, "\u2016", "\\Vert");
defineSymbol(text, textord, "\u2016", "\\textbardbl");
defineSymbol(text, textord, "~", "\\textasciitilde");
defineSymbol(text, textord, "\\", "\\textbackslash");
defineSymbol(text, textord, "^", "\\textasciicircum");
defineSymbol(math, rel, "\u2191", "\\uparrow", true);
defineSymbol(math, rel, "\u21d1", "\\Uparrow", true);
defineSymbol(math, rel, "\u2193", "\\downarrow", true);
defineSymbol(math, rel, "\u21d3", "\\Downarrow", true);
defineSymbol(math, rel, "\u2195", "\\updownarrow", true);
defineSymbol(math, rel, "\u21d5", "\\Updownarrow", true);
defineSymbol(math, op, "\u2210", "\\coprod");
defineSymbol(math, op, "\u22c1", "\\bigvee");
defineSymbol(math, op, "\u22c0", "\\bigwedge");
defineSymbol(math, op, "\u2a04", "\\biguplus");
defineSymbol(math, op, "\u2a04", "\\bigcupplus");
defineSymbol(math, op, "\u2a03", "\\bigcupdot");
defineSymbol(math, op, "\u2a07", "\\bigdoublevee");
defineSymbol(math, op, "\u2a08", "\\bigdoublewedge");
defineSymbol(math, op, "\u22c2", "\\bigcap");
defineSymbol(math, op, "\u22c3", "\\bigcup");
defineSymbol(math, op, "\u222b", "\\int");
defineSymbol(math, op, "\u222b", "\\intop");
defineSymbol(math, op, "\u222c", "\\iint");
defineSymbol(math, op, "\u222d", "\\iiint");
defineSymbol(math, op, "\u220f", "\\prod");
defineSymbol(math, op, "\u2211", "\\sum");
defineSymbol(math, op, "\u2a02", "\\bigotimes");
defineSymbol(math, op, "\u2a01", "\\bigoplus");
defineSymbol(math, op, "\u2a00", "\\bigodot");
defineSymbol(math, op, "\u2a09", "\\bigtimes");
defineSymbol(math, op, "\u222e", "\\oint");
defineSymbol(math, op, "\u222f", "\\oiint");
defineSymbol(math, op, "\u2230", "\\oiiint");
defineSymbol(math, op, "\u2231", "\\intclockwise");
defineSymbol(math, op, "\u2232", "\\varointclockwise");
defineSymbol(math, op, "\u2a0c", "\\iiiint");
defineSymbol(math, op, "\u2a0d", "\\intbar");
defineSymbol(math, op, "\u2a0e", "\\intBar");
defineSymbol(math, op, "\u2a0f", "\\fint");
defineSymbol(math, op, "\u2a12", "\\rppolint");
defineSymbol(math, op, "\u2a13", "\\scpolint");
defineSymbol(math, op, "\u2a15", "\\pointint");
defineSymbol(math, op, "\u2a16", "\\sqint");
defineSymbol(math, op, "\u2a17", "\\intlarhk");
defineSymbol(math, op, "\u2a18", "\\intx");
defineSymbol(math, op, "\u2a19", "\\intcap");
defineSymbol(math, op, "\u2a1a", "\\intcup");
defineSymbol(math, op, "\u2a05", "\\bigsqcap");
defineSymbol(math, op, "\u2a06", "\\bigsqcup");
defineSymbol(math, op, "\u222b", "\\smallint");
defineSymbol(text, inner, "\u2026", "\\textellipsis");
defineSymbol(math, inner, "\u2026", "\\mathellipsis");
defineSymbol(text, inner, "\u2026", "\\ldots", true);
defineSymbol(math, inner, "\u2026", "\\ldots", true);
defineSymbol(math, inner, "\u22f0", "\\iddots", true);
defineSymbol(math, inner, "\u22ef", "\\@cdots", true);
defineSymbol(math, inner, "\u22f1", "\\ddots", true);
defineSymbol(math, textord, "\u22ee", "\\varvdots"); // \vdots is a macro
defineSymbol(text, textord, "\u22ee", "\\varvdots");
defineSymbol(math, accent, "\u00b4", "\\acute");
defineSymbol(math, accent, "\u0060", "\\grave");
defineSymbol(math, accent, "\u00a8", "\\ddot");
defineSymbol(math, accent, "\u2026", "\\dddot");
defineSymbol(math, accent, "\u2026\u002e", "\\ddddot");
defineSymbol(math, accent, "\u007e", "\\tilde");
defineSymbol(math, accent, "\u203e", "\\bar");
defineSymbol(math, accent, "\u02d8", "\\breve");
defineSymbol(math, accent, "\u02c7", "\\check");
defineSymbol(math, accent, "\u005e", "\\hat");
defineSymbol(math, accent, "\u2192", "\\vec");
defineSymbol(math, accent, "\u02d9", "\\dot");
defineSymbol(math, accent, "\u02da", "\\mathring");
defineSymbol(math, mathord, "\u0131", "\\imath", true);
defineSymbol(math, mathord, "\u0237", "\\jmath", true);
defineSymbol(math, textord, "\u0131", "\u0131");
defineSymbol(math, textord, "\u0237", "\u0237");
defineSymbol(text, textord, "\u0131", "\\i", true);
defineSymbol(text, textord, "\u0237", "\\j", true);
defineSymbol(text, textord, "\u00f8", "\\o", true);
defineSymbol(math, mathord, "\u00f8", "\\o", true);
defineSymbol(text, textord, "\u00d8", "\\O", true);
defineSymbol(math, mathord, "\u00d8", "\\O", true);
defineSymbol(text, accent, "\u02ca", "\\'"); // acute
defineSymbol(text, accent, "\u02cb", "\\`"); // grave
defineSymbol(text, accent, "\u02c6", "\\^"); // circumflex
defineSymbol(text, accent, "\u007e", "\\~"); // tilde
defineSymbol(text, accent, "\u02c9", "\\="); // macron
defineSymbol(text, accent, "\u02d8", "\\u"); // breve
defineSymbol(text, accent, "\u02d9", "\\."); // dot above
defineSymbol(text, accent, "\u00b8", "\\c"); // cedilla
defineSymbol(text, accent, "\u02da", "\\r"); // ring above
defineSymbol(text, accent, "\u02c7", "\\v"); // caron
defineSymbol(text, accent, "\u00a8", '\\"'); // diaeresis
defineSymbol(text, accent, "\u02dd", "\\H"); // double acute
defineSymbol(math, accent, "\u02ca", "\\'"); // acute
defineSymbol(math, accent, "\u02cb", "\\`"); // grave
defineSymbol(math, accent, "\u02c6", "\\^"); // circumflex
defineSymbol(math, accent, "\u007e", "\\~"); // tilde
defineSymbol(math, accent, "\u02c9", "\\="); // macron
defineSymbol(math, accent, "\u02d8", "\\u"); // breve
defineSymbol(math, accent, "\u02d9", "\\."); // dot above
defineSymbol(math, accent, "\u00b8", "\\c"); // cedilla
defineSymbol(math, accent, "\u02da", "\\r"); // ring above
defineSymbol(math, accent, "\u02c7", "\\v"); // caron
defineSymbol(math, accent, "\u00a8", '\\"'); // diaeresis
defineSymbol(math, accent, "\u02dd", "\\H"); // double acute

// These ligatures are detected and created in Parser.js's `formLigatures`.
const ligatures = {
  "--": true,
  "---": true,
  "``": true,
  "''": true
};

defineSymbol(text, textord, "\u2013", "--", true);
defineSymbol(text, textord, "\u2013", "\\textendash");
defineSymbol(text, textord, "\u2014", "---", true);
defineSymbol(text, textord, "\u2014", "\\textemdash");
defineSymbol(text, textord, "\u2018", "`", true);
defineSymbol(text, textord, "\u2018", "\\textquoteleft");
defineSymbol(text, textord, "\u2019", "'", true);
defineSymbol(text, textord, "\u2019", "\\textquoteright");
defineSymbol(text, textord, "\u201c", "``", true);
defineSymbol(text, textord, "\u201c", "\\textquotedblleft");
defineSymbol(text, textord, "\u201d", "''", true);
defineSymbol(text, textord, "\u201d", "\\textquotedblright");
//  \degree from gensymb package
defineSymbol(math, textord, "\u00b0", "\\degree", true);
defineSymbol(text, textord, "\u00b0", "\\degree");
// \textdegree from inputenc package
defineSymbol(text, textord, "\u00b0", "\\textdegree", true);
// TODO: In LaTeX, \pounds can generate a different character in text and math
// mode, but among our fonts, only Main-Regular defines this character "163".
defineSymbol(math, textord, "\u00a3", "\\pounds");
defineSymbol(math, textord, "\u00a3", "\\mathsterling", true);
defineSymbol(text, textord, "\u00a3", "\\pounds");
defineSymbol(text, textord, "\u00a3", "\\textsterling", true);
defineSymbol(math, textord, "\u2720", "\\maltese");
defineSymbol(text, textord, "\u2720", "\\maltese");
defineSymbol(math, textord, "\u20ac", "\\euro", true);
defineSymbol(text, textord, "\u20ac", "\\euro", true);
defineSymbol(text, textord, "\u20ac", "\\texteuro");
defineSymbol(math, textord, "\u00a9", "\\copyright", true);
defineSymbol(text, textord, "\u00a9", "\\textcopyright");
defineSymbol(math, textord, "\u2300", "\\diameter", true);
defineSymbol(text, textord, "\u2300", "\\diameter");

// Italic Greek
defineSymbol(math, textord, "𝛤", "\\varGamma");
defineSymbol(math, textord, "𝛥", "\\varDelta");
defineSymbol(math, textord, "𝛩", "\\varTheta");
defineSymbol(math, textord, "𝛬", "\\varLambda");
defineSymbol(math, textord, "𝛯", "\\varXi");
defineSymbol(math, textord, "𝛱", "\\varPi");
defineSymbol(math, textord, "𝛴", "\\varSigma");
defineSymbol(math, textord, "𝛶", "\\varUpsilon");
defineSymbol(math, textord, "𝛷", "\\varPhi");
defineSymbol(math, textord, "𝛹", "\\varPsi");
defineSymbol(math, textord, "𝛺", "\\varOmega");
defineSymbol(text, textord, "𝛤", "\\varGamma");
defineSymbol(text, textord, "𝛥", "\\varDelta");
defineSymbol(text, textord, "𝛩", "\\varTheta");
defineSymbol(text, textord, "𝛬", "\\varLambda");
defineSymbol(text, textord, "𝛯", "\\varXi");
defineSymbol(text, textord, "𝛱", "\\varPi");
defineSymbol(text, textord, "𝛴", "\\varSigma");
defineSymbol(text, textord, "𝛶", "\\varUpsilon");
defineSymbol(text, textord, "𝛷", "\\varPhi");
defineSymbol(text, textord, "𝛹", "\\varPsi");
defineSymbol(text, textord, "𝛺", "\\varOmega");


// There are lots of symbols which are the same, so we add them in afterwards.
// All of these are textords in math mode
const mathTextSymbols = '0123456789/@."';
for (let i = 0; i < mathTextSymbols.length; i++) {
  const ch = mathTextSymbols.charAt(i);
  defineSymbol(math, textord, ch, ch);
}

// All of these are textords in text mode
const textSymbols = '0123456789!@*()-=+";:?/.,';
for (let i = 0; i < textSymbols.length; i++) {
  const ch = textSymbols.charAt(i);
  defineSymbol(text, textord, ch, ch);
}

// All of these are textords in text mode, and mathords in math mode
const letters = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz";
for (let i = 0; i < letters.length; i++) {
  const ch = letters.charAt(i);
  defineSymbol(math, mathord, ch, ch);
  defineSymbol(text, textord, ch, ch);
}

// Some more letters in Unicode Basic Multilingual Plane.
const narrow = "ÇÐÞçþℂℍℕℙℚℝℤℎℏℊℋℌℐℑℒℓ℘ℛℜℬℰℱℳℭℨ";
for (let i = 0; i < narrow.length; i++) {
  const ch = narrow.charAt(i);
  defineSymbol(math, mathord, ch, ch);
  defineSymbol(text, textord, ch, ch);
}

// The next loop loads wide (surrogate pair) characters.
// We support some letters in the Unicode range U+1D400 to U+1D7FF,
// Mathematical Alphanumeric Symbols.
let wideChar = "";
for (let i = 0; i < letters.length; i++) {
  // The hex numbers in the next line are a surrogate pair.
  // 0xD835 is the high surrogate for all letters in the range we support.
  // 0xDC00 is the low surrogate for bold A.
  wideChar = String.fromCharCode(0xd835, 0xdc00 + i); // A-Z a-z bold
  defineSymbol(math, mathord, wideChar, wideChar);
  defineSymbol(text, textord, wideChar, wideChar);

  wideChar = String.fromCharCode(0xd835, 0xdc34 + i); // A-Z a-z italic
  defineSymbol(math, mathord, wideChar, wideChar);
  defineSymbol(text, textord, wideChar, wideChar);

  wideChar = String.fromCharCode(0xd835, 0xdc68 + i); // A-Z a-z bold italic
  defineSymbol(math, mathord, wideChar, wideChar);
  defineSymbol(text, textord, wideChar, wideChar);

  wideChar = String.fromCharCode(0xd835, 0xdd04 + i); // A-Z a-z Fractur
  defineSymbol(math, mathord, wideChar, wideChar);
  defineSymbol(text, textord, wideChar, wideChar);

  wideChar = String.fromCharCode(0xd835, 0xdda0 + i); // A-Z a-z sans-serif
  defineSymbol(math, mathord, wideChar, wideChar);
  defineSymbol(text, textord, wideChar, wideChar);

  wideChar = String.fromCharCode(0xd835, 0xddd4 + i); // A-Z a-z sans bold
  defineSymbol(math, mathord, wideChar, wideChar);
  defineSymbol(text, textord, wideChar, wideChar);

  wideChar = String.fromCharCode(0xd835, 0xde08 + i); // A-Z a-z sans italic
  defineSymbol(math, mathord, wideChar, wideChar);
  defineSymbol(text, textord, wideChar, wideChar);

  wideChar = String.fromCharCode(0xd835, 0xde70 + i); // A-Z a-z monospace
  defineSymbol(math, mathord, wideChar, wideChar);
  defineSymbol(text, textord, wideChar, wideChar);

  wideChar = String.fromCharCode(0xd835, 0xdd38 + i); // A-Z a-z double struck
  defineSymbol(math, mathord, wideChar, wideChar);
  defineSymbol(text, textord, wideChar, wideChar);

  const ch = letters.charAt(i);
  wideChar = String.fromCharCode(0xd835, 0xdc9c + i); // A-Z a-z calligraphic
  defineSymbol(math, mathord, ch, wideChar);
  defineSymbol(text, textord, ch, wideChar);
}

// Next, some wide character numerals
for (let i = 0; i < 10; i++) {
  wideChar = String.fromCharCode(0xd835, 0xdfce + i); // 0-9 bold
  defineSymbol(math, mathord, wideChar, wideChar);
  defineSymbol(text, textord, wideChar, wideChar);

  wideChar = String.fromCharCode(0xd835, 0xdfe2 + i); // 0-9 sans serif
  defineSymbol(math, mathord, wideChar, wideChar);
  defineSymbol(text, textord, wideChar, wideChar);

  wideChar = String.fromCharCode(0xd835, 0xdfec + i); // 0-9 bold sans
  defineSymbol(math, mathord, wideChar, wideChar);
  defineSymbol(text, textord, wideChar, wideChar);

  wideChar = String.fromCharCode(0xd835, 0xdff6 + i); // 0-9 monospace
  defineSymbol(math, mathord, wideChar, wideChar);
  defineSymbol(text, textord, wideChar, wideChar);
}

/*
 * Neither Firefox nor Chrome support hard line breaks or soft line breaks.
 * (Despite https://www.w3.org/Math/draft-spec/mathml.html#chapter3_presm.lbattrs)
 * So Temml has work-arounds for both hard and soft breaks.
 * The work-arounds sadly do not work simultaneously. Any top-level hard
 * break makes soft line breaks impossible.
 *
 * Hard breaks are simulated by creating a <mtable> and putting each line in its own <mtr>.
 *
 * To create soft line breaks, Temml avoids using the <semantics> and <annotation> tags.
 * Then the top level of a <math> element can be occupied by <mrow> elements, and the browser
 * will break after a <mrow> if the expression extends beyond the container limit.
 *
 * The default is for soft line breaks after each top-level binary or
 * relational operator, per TeXbook p. 173. So we gather the expression into <mrow>s so that
 * each <mrow> ends in a binary or relational operator.
 *
 * An option is for soft line breaks before an "=" sign. That changes the <mrow>s.
 *
 * Soft line breaks will not work in Chromium and Safari, only Firefox.
 *
 * Hopefully browsers will someday do their own linebreaking and we will be able to delete
 * much of this module.
 */

const openDelims = "([{⌊⌈⟨⟮⎰⟦⦃";
const closeDelims = ")]}⌋⌉⟩⟯⎱⟦⦄";

function setLineBreaks(expression, wrapMode, isDisplayMode) {
  const mtrs = [];
  let mrows = [];
  let block = [];
  let numTopLevelEquals = 0;
  let i = 0;
  let level = 0;
  while (i < expression.length) {
    while (expression[i] instanceof DocumentFragment) {
      expression.splice(i, 1, ...expression[i].children); // Expand the fragment.
    }
    const node = expression[i];
    if (node.attributes && node.attributes.linebreak &&
      node.attributes.linebreak === "newline") {
      // A hard line break. Create a <mtr> for the current block.
      if (block.length > 0) {
        mrows.push(new mathMLTree.MathNode("mrow", block));
      }
      mrows.push(node);
      block = [];
      const mtd = new mathMLTree.MathNode("mtd", mrows);
      mtd.style.textAlign = "left";
      mtrs.push(new mathMLTree.MathNode("mtr", [mtd]));
      mrows = [];
      i += 1;
      continue
    }
    block.push(node);
    if (node.type && node.type === "mo" && node.children.length === 1 &&
        !Object.prototype.hasOwnProperty.call(node.attributes, "movablelimits")) {
      const ch = node.children[0].text;
      if (openDelims.indexOf(ch) > -1) {
        level += 1;
      } else if (closeDelims.indexOf(ch) > -1) {
        level -= 1;
      } else if (level === 0 && wrapMode === "=" && ch === "=") {
        numTopLevelEquals += 1;
        if (numTopLevelEquals > 1) {
          block.pop();
          // Start a new block. (Insert a soft linebreak.)
          const element = new mathMLTree.MathNode("mrow", block);
          mrows.push(element);
          block = [node];
        }
      } else if (level === 0 && wrapMode === "tex" && ch !== "∇") {
        // Check if the following node is a \nobreak text node, e.g. "~""
        const next = i < expression.length - 1 ? expression[i + 1] : null;
        let glueIsFreeOfNobreak = true;
        if (
          !(
            next &&
            next.type === "mtext" &&
            next.attributes.linebreak &&
            next.attributes.linebreak === "nobreak"
          )
        ) {
          // We may need to start a new block.
          // First, put any post-operator glue on same line as operator.
          for (let j = i + 1; j < expression.length; j++) {
            const nd = expression[j];
            if (
              nd.type &&
              nd.type === "mspace" &&
              !(nd.attributes.linebreak && nd.attributes.linebreak === "newline")
            ) {
              block.push(nd);
              i += 1;
              if (
                nd.attributes &&
                nd.attributes.linebreak &&
                nd.attributes.linebreak === "nobreak"
              ) {
                glueIsFreeOfNobreak = false;
              }
            } else {
              break;
            }
          }
        }
        if (glueIsFreeOfNobreak) {
          // Start a new block. (Insert a soft linebreak.)
          const element = new mathMLTree.MathNode("mrow", block);
          mrows.push(element);
          block = [];
        }
      }
    }
    i += 1;
  }
  if (block.length > 0) {
    const element = new mathMLTree.MathNode("mrow", block);
    mrows.push(element);
  }
  if (mtrs.length > 0) {
    const mtd = new mathMLTree.MathNode("mtd", mrows);
    mtd.style.textAlign = "left";
    const mtr = new mathMLTree.MathNode("mtr", [mtd]);
    mtrs.push(mtr);
    const mtable = new mathMLTree.MathNode("mtable", mtrs);
    if (!isDisplayMode) {
      mtable.setAttribute("columnalign", "left");
      mtable.setAttribute("rowspacing", "0em");
    }
    return mtable
  }
  return mathMLTree.newDocumentFragment(mrows);
}

/**
 * This file converts a parse tree into a corresponding MathML tree. The main
 * entry point is the `buildMathML` function, which takes a parse tree from the
 * parser.
 */


/**
 * Takes a symbol and converts it into a MathML text node after performing
 * optional replacement from symbols.js.
 */
const makeText = function(text, mode, style) {
  if (
    symbols[mode][text] &&
    symbols[mode][text].replace &&
    text.charCodeAt(0) !== 0xd835 &&
    !(
      Object.prototype.hasOwnProperty.call(ligatures, text) &&
      style &&
      ((style.fontFamily && style.fontFamily.slice(4, 6) === "tt") ||
        (style.font && style.font.slice(4, 6) === "tt"))
    )
  ) {
    text = symbols[mode][text].replace;
  }

  return new mathMLTree.TextNode(text);
};

const copyChar = (newRow, child) => {
  if (newRow.children.length === 0 ||
      newRow.children[newRow.children.length - 1].type !== "mtext") {
    const mtext = new mathMLTree.MathNode(
      "mtext",
      [new mathMLTree.TextNode(child.children[0].text)]
    );
    newRow.children.push(mtext);
  } else {
    newRow.children[newRow.children.length - 1].children[0].text += child.children[0].text;
  }
};

const consolidateText = mrow => {
  // If possible, consolidate adjacent <mtext> elements into a single element.
  if (mrow.type !== "mrow" && mrow.type !== "mstyle") { return mrow }
  if (mrow.children.length === 0) { return mrow } // empty group, e.g., \text{}
  const newRow = new mathMLTree.MathNode("mrow");
  for (let i = 0; i < mrow.children.length; i++) {
    const child = mrow.children[i];
    if (child.type === "mtext" && Object.keys(child.attributes).length === 0) {
      copyChar(newRow, child);
    } else if (child.type === "mrow") {
      // We'll also check the children of an mrow. One level only. No recursion.
      let canConsolidate = true;
      for (let j = 0; j < child.children.length; j++) {
        const grandChild = child.children[j];
        if (grandChild.type !== "mtext" || Object.keys(child.attributes).length !== 0) {
          canConsolidate = false;
          break
        }
      }
      if (canConsolidate) {
        for (let j = 0; j < child.children.length; j++) {
          const grandChild = child.children[j];
          copyChar(newRow, grandChild);
        }
      } else {
        newRow.children.push(child);
      }
    } else {
      newRow.children.push(child);
    }
  }
  for (let i = 0; i < newRow.children.length; i++) {
    if (newRow.children[i].type === "mtext") {
      const mtext = newRow.children[i];
      // Firefox does not render a space at either end of an <mtext> string.
      // To get proper rendering, we replace leading or trailing spaces with no-break spaces.
      if (mtext.children[0].text.charAt(0) === " ") {
        mtext.children[0].text = "\u00a0" + mtext.children[0].text.slice(1);
      }
      const L = mtext.children[0].text.length;
      if (L > 0 && mtext.children[0].text.charAt(L - 1) === " ") {
        mtext.children[0].text = mtext.children[0].text.slice(0, -1) + "\u00a0";
      }
      for (const [key, value] of Object.entries(mrow.attributes)) {
        mtext.attributes[key] = value;
      }
    }
  }
  if (newRow.children.length === 1 && newRow.children[0].type === "mtext") {
    return newRow.children[0]; // A consolidated <mtext>
  } else {
    return newRow
  }
};

/**
 * Wrap the given array of nodes in an <mrow> node if needed, i.e.,
 * unless the array has length 1.  Always returns a single node.
 */
const makeRow = function(body, semisimple = false) {
  if (body.length === 1 && !(body[0] instanceof DocumentFragment)) {
    return body[0];
  } else if (!semisimple) {
    // Suppress spacing on <mo> nodes at both ends of the row.
    if (body[0] instanceof MathNode && body[0].type === "mo" && !body[0].attributes.fence) {
      body[0].attributes.lspace = "0em";
      body[0].attributes.rspace = "0em";
    }
    const end = body.length - 1;
    if (body[end] instanceof MathNode && body[end].type === "mo" && !body[end].attributes.fence) {
      body[end].attributes.lspace = "0em";
      body[end].attributes.rspace = "0em";
    }
  }
  return new mathMLTree.MathNode("mrow", body);
};

/**
 * Check for <mi>.</mi> which is how a dot renders in MathML,
 * or <mo separator="true" lspace="0em" rspace="0em">,</mo>
 * which is how a braced comma {,} renders in MathML
 */
function isNumberPunctuation(group) {
  if (!group) {
    return false
  }
  if (group.type === 'mi' && group.children.length === 1) {
    const child = group.children[0];
    return child instanceof TextNode && child.text === '.'
  } else if (group.type === "mtext" && group.children.length === 1) {
    const child = group.children[0];
    return child instanceof TextNode && child.text === '\u2008' // punctuation space
  } else if (group.type === 'mo' && group.children.length === 1 &&
    group.getAttribute('separator') === 'true' &&
    group.getAttribute('lspace') === '0em' &&
    group.getAttribute('rspace') === '0em') {
    const child = group.children[0];
    return child instanceof TextNode && child.text === ','
  } else {
    return false
  }
}
const isComma = (expression, i) => {
  const node = expression[i];
  const followingNode = expression[i + 1];
  return (node.type === "atom" && node.text === ",") &&
    // Don't consolidate if there is a space after the comma.
    node.loc && followingNode.loc && node.loc.end === followingNode.loc.start
};

const isRel = item => {
  return (item.type === "atom" && item.family === "rel") ||
      (item.type === "mclass" && item.mclass === "mrel")
};

/**
 * Takes a list of nodes, builds them, and returns a list of the generated
 * MathML nodes.  Also do a couple chores along the way:
 * (1) Suppress spacing when an author wraps an operator w/braces, as in {=}.
 * (2) Suppress spacing between two adjacent relations.
 */
const buildExpression = function(expression, style, semisimple = false) {
  if (!semisimple && expression.length === 1) {
    const group = buildGroup$1(expression[0], style);
    if (group instanceof MathNode && group.type === "mo") {
      // When TeX writers want to suppress spacing on an operator,
      // they often put the operator by itself inside braces.
      group.setAttribute("lspace", "0em");
      group.setAttribute("rspace", "0em");
    }
    return [group];
  }

  const groups = [];
  const groupArray = [];
  let lastGroup;
  for (let i = 0; i < expression.length; i++) {
    groupArray.push(buildGroup$1(expression[i], style));
  }

  for (let i = 0; i < groupArray.length; i++) {
    const group = groupArray[i];

    // Suppress spacing between adjacent relations
    if (i < expression.length - 1 && isRel(expression[i]) && isRel(expression[i + 1])) {
      group.setAttribute("rspace", "0em");
    }
    if (i > 0 && isRel(expression[i]) && isRel(expression[i - 1])) {
      group.setAttribute("lspace", "0em");
    }

    // Concatenate numbers
    if (group.type === 'mn' && lastGroup && lastGroup.type === 'mn') {
      // Concatenate <mn>...</mn> followed by <mi>.</mi>
      lastGroup.children.push(...group.children);
      continue
    } else if (isNumberPunctuation(group) && lastGroup && lastGroup.type === 'mn') {
      // Concatenate <mn>...</mn> followed by <mi>.</mi>
      lastGroup.children.push(...group.children);
      continue
    } else if (lastGroup && lastGroup.type === "mn" && i < groupArray.length - 1 &&
      groupArray[i + 1].type === "mn" && isComma(expression, i)) {
      lastGroup.children.push(...group.children);
      continue
    } else if (group.type === 'mn' && isNumberPunctuation(lastGroup)) {
      // Concatenate <mi>.</mi> followed by <mn>...</mn>
      group.children = [...lastGroup.children, ...group.children];
      groups.pop();
    } else if ((group.type === 'msup' || group.type === 'msub') &&
        group.children.length >= 1 && lastGroup &&
        (lastGroup.type === 'mn' || isNumberPunctuation(lastGroup))) {
      // Put preceding <mn>...</mn> or <mi>.</mi> inside base of
      // <msup><mn>...base...</mn>...exponent...</msup> (or <msub>)
      const base = group.children[0];
      if (base instanceof MathNode && base.type === 'mn' && lastGroup) {
        base.children = [...lastGroup.children, ...base.children];
        groups.pop();
      }
    }
    groups.push(group);
    lastGroup = group;
  }
  return groups
};

/**
 * Equivalent to buildExpression, but wraps the elements in an <mrow>
 * if there's more than one.  Returns a single node instead of an array.
 */
const buildExpressionRow = function(expression, style, semisimple = false) {
  return makeRow(buildExpression(expression, style, semisimple), semisimple);
};

/**
 * Takes a group from the parser and calls the appropriate groupBuilders function
 * on it to produce a MathML node.
 */
const buildGroup$1 = function(group, style) {
  if (!group) {
    return new mathMLTree.MathNode("mrow");
  }

  if (_mathmlGroupBuilders[group.type]) {
    // Call the groupBuilders function
    const result = _mathmlGroupBuilders[group.type](group, style);
    return result;
  } else {
    throw new ParseError("Got group of unknown type: '" + group.type + "'");
  }
};

const glue$1 = _ => {
  return new mathMLTree.MathNode("mtd", [], [], { padding: "0", width: "50%" })
};

const labelContainers = ["mrow", "mtd", "mtable", "mtr"];
const getLabel = parent => {
  for (const node of parent.children) {
    if (node.type && labelContainers.includes(node.type)) {
      if (node.classes && node.classes[0] === "tml-label") {
        const label = node.label;
        return label
      } else {
        const label = getLabel(node);
        if (label) { return label }
      }
    } else if (!node.type) {
      const label = getLabel(node);
      if (label) { return label }
    }
  }
};

const taggedExpression = (expression, tag, style, leqno) => {
  tag = buildExpressionRow(tag[0].body, style);
  tag = consolidateText(tag);  // tag is now an <mtext> element
  tag.classes.push("tml-tag"); // to be available for \ref

  const label = getLabel(expression); // from a \label{} function.
  expression = new mathMLTree.MathNode("mtd", [expression]);
  const rowArray = [glue$1(), expression, glue$1()];
  rowArray[leqno ? 0 : 2].children.push(tag);
  const mtr = new mathMLTree.MathNode("mtr", rowArray, ["tml-tageqn"]);
  if (label) { mtr.setAttribute("id", label); }
  const table = new mathMLTree.MathNode("mtable", [mtr]);
  table.style.width = "100%";
  table.setAttribute("displaystyle", "true");
  return table
};

/**
 * Takes a full parse tree and settings and builds a MathML representation of
 * it.
 */
function buildMathML(tree, texExpression, style, settings) {
  // Strip off outer tag wrapper for processing below.
  let tag = null;
  if (tree.length === 1 && tree[0].type === "tag") {
    tag = tree[0].tag;
    tree = tree[0].body;
  }

  const expression = buildExpression(tree, style);

  if (expression.length === 1 && expression[0] instanceof AnchorNode) {
    return expression[0]
  }

  const wrap = (settings.displayMode || settings.annotate) ? "none" : settings.wrap;

  const n1 = expression.length === 0 ? null : expression[0];
  let wrapper = expression.length === 1 && tag === null && (n1 instanceof MathNode)
      ? expression[0]
      : setLineBreaks(expression, wrap, settings.displayMode);

  if (tag) {
    wrapper = taggedExpression(wrapper, tag, style, settings.leqno);
  }

  if (settings.annotate) {
    // Build a TeX annotation of the source
    const annotation = new mathMLTree.MathNode(
      "annotation", [new mathMLTree.TextNode(texExpression)]);
    annotation.setAttribute("encoding", "application/x-tex");
    wrapper = new mathMLTree.MathNode("semantics", [wrapper, annotation]);
  }

  const math = new mathMLTree.MathNode("math", [wrapper]);

  if (settings.xml) {
    math.setAttribute("xmlns", "http://www.w3.org/1998/Math/MathML");
  }
  if (settings.displayMode) {
    math.setAttribute("display", "block");
    math.style.display = "block math"; // necessary in Chromium.
    // Firefox and Safari do not recognize display: "block math".
    // Set a class so that the CSS file can set display: block.
    math.classes = ["tml-display"];
  }
  return math;
}

// Identify letters to which we'll attach a combining accent character
const smalls = "acegıȷmnopqrsuvwxyzαγεηικμνοπρςστυχωϕ𝐚𝐜𝐞𝐠𝐦𝐧𝐨𝐩𝐪𝐫𝐬𝐮𝐯𝐰𝐱𝐲𝐳";

// From the KaTeX font metrics, identify letters whose accents need a italic correction.
const smallNudge = "DHKLUcegorsuvxyzΠΥΨαδηιμνοτυχϵ";
const mediumNudge = "BCEGIMNOPQRSTXZlpqtwΓΘΞΣΦΩβεζθξρςφψϑϕϱ";
const largeNudge = "AFJdfΔΛ";

const mathmlBuilder$a = (group, style) => {
  const accentNode = group.isStretchy
    ? stretchy.accentNode(group)
    : new mathMLTree.MathNode("mo", [makeText(group.label, group.mode)]);
  if (!group.isStretchy) {
    accentNode.setAttribute("stretchy", "false"); // Keep Firefox from stretching \check
  }
  if (group.label !== "\\vec") {
    accentNode.style.mathDepth = "0"; // not scriptstyle
    // Don't use attribute accent="true" because MathML Core eliminates a needed space.
  }
  const tag = group.label === "\\c" ? "munder" : "mover";
  const needsWbkVertShift = needsWebkitVerticalShift.has(group.label);
  if (tag === "mover" && group.mode === "math" && (!group.isStretchy) && group.base.text
      && group.base.text.length === 1) {
    const text = group.base.text;
    const isVec = group.label === "\\vec";
    const vecPostfix = isVec === "\\vec" ? "-vec" : "";
    if (isVec) {
      accentNode.classes.push("tml-vec"); // Firefox sizing of \vec arrow
    }
    const wbkPostfix = isVec ? "-vec" : needsWbkVertShift ? "-acc" : "";
    if (smallNudge.indexOf(text) > -1) {
      accentNode.classes.push(`chr-sml${vecPostfix}`);
      accentNode.classes.push(`wbk-sml${wbkPostfix}`);
    } else if (mediumNudge.indexOf(text) > -1) {
      accentNode.classes.push(`chr-med${vecPostfix}`);
      accentNode.classes.push(`wbk-med${wbkPostfix}`);
    } else if (largeNudge.indexOf(text) > -1) {
      accentNode.classes.push(`chr-lrg${vecPostfix}`);
      accentNode.classes.push(`wbk-lrg${wbkPostfix}`);
    } else if (isVec) {
      accentNode.classes.push(`wbk-vec`);
    } else if (needsWbkVertShift) {
      accentNode.classes.push(`wbk-acc`);
    }
  } else if (needsWbkVertShift) {
    // text-mode accents
    accentNode.classes.push("wbk-acc");
  }
  const node = new mathMLTree.MathNode(tag, [buildGroup$1(group.base, style), accentNode]);
  return node;
};

const nonStretchyAccents = new Set([
  "\\acute",
  "\\check",
  "\\grave",
  "\\ddot",
  "\\dddot",
  "\\ddddot",
  "\\tilde",
  "\\bar",
  "\\breve",
  "\\check",
  "\\hat",
  "\\vec",
  "\\dot",
  "\\mathring"
]);

const needsWebkitVerticalShift = new Set([
  "\\acute",
  "\\bar",
  "\\breve",
  "\\check",
  "\\dot",
  "\\ddot",
  "\\grave",
  "\\hat",
  "\\mathring",
  "\\`", "\\'", "\\^", "\\=", "\\u", "\\.", '\\"', "\\r", "\\H", "\\v"
]);

const combiningChar = {
  "\\`": "\u0300",
  "\\'": "\u0301",
  "\\^": "\u0302",
  "\\~": "\u0303",
  "\\=": "\u0304",
  "\\u": "\u0306",
  "\\.": "\u0307",
  '\\"': "\u0308",
  "\\r": "\u030A",
  "\\H": "\u030B",
  "\\v": "\u030C",
  "\\c": "\u0327"
};

// Accents
defineFunction({
  type: "accent",
  names: [
    "\\acute",
    "\\grave",
    "\\ddot",
    "\\dddot",
    "\\ddddot",
    "\\tilde",
    "\\bar",
    "\\breve",
    "\\check",
    "\\hat",
    "\\vec",
    "\\dot",
    "\\mathring",
    "\\overparen",
    "\\widecheck",
    "\\widehat",
    "\\wideparen",
    "\\widetilde",
    "\\overrightarrow",
    "\\overleftarrow",
    "\\Overrightarrow",
    "\\overleftrightarrow",
    "\\overgroup",
    "\\overleftharpoon",
    "\\overrightharpoon"
  ],
  props: {
    numArgs: 1
  },
  handler: (context, args) => {
    const base = normalizeArgument(args[0]);

    const isStretchy = !nonStretchyAccents.has(context.funcName);

    return {
      type: "accent",
      mode: context.parser.mode,
      label: context.funcName,
      isStretchy,
      base
    };
  },
  mathmlBuilder: mathmlBuilder$a
});

// Text-mode accents
defineFunction({
  type: "accent",
  names: ["\\'", "\\`", "\\^", "\\~", "\\=", "\\c", "\\u", "\\.", '\\"', "\\r", "\\H", "\\v"],
  props: {
    numArgs: 1,
    allowedInText: true,
    allowedInMath: true,
    argTypes: ["primitive"]
  },
  handler: (context, args) => {
    const base = normalizeArgument(args[0]);
    const mode = context.parser.mode;

    if (mode === "math" && context.parser.settings.strict) {
      // LaTeX only writes a warning. It doesn't stop. We'll issue the same warning.
      // eslint-disable-next-line no-console
      console.log(`Temml parse error: Command ${context.funcName} is invalid in math mode.`);
    }

    if (mode === "text" && base.text && base.text.length === 1
        && context.funcName in combiningChar && smalls.indexOf(base.text) > -1) {
      // Return a combining accent character
      return {
        type: "textord",
        mode: "text",
        text: base.text + combiningChar[context.funcName]
      }
    } else if (context.funcName === "\\c" && mode === "text" && base.text
        && base.text.length === 1) {
      // combining cedilla
      return { type: "textord", mode: "text", text: base.text + "\u0327" }
    } else {
      // Build up the accent
      return {
        type: "accent",
        mode,
        label: context.funcName,
        isStretchy: false,
        base
      }
    }
  },
  mathmlBuilder: mathmlBuilder$a
});

defineFunction({
  type: "accentUnder",
  names: [
    "\\underleftarrow",
    "\\underrightarrow",
    "\\underleftrightarrow",
    "\\undergroup",
    "\\underparen",
    "\\utilde"
  ],
  props: {
    numArgs: 1
  },
  handler: ({ parser, funcName }, args) => {
    const base = args[0];
    return {
      type: "accentUnder",
      mode: parser.mode,
      label: funcName,
      base: base
    };
  },
  mathmlBuilder: (group, style) => {
    const accentNode = stretchy.accentNode(group);
    accentNode.style["math-depth"] = 0;
    const node = new mathMLTree.MathNode("munder", [
      buildGroup$1(group.base, style),
      accentNode
    ]);
    return node;
  }
});

/**
 * This file does conversion between units.  In particular, it provides
 * calculateSize to convert other units into CSS units.
 */


const ptPerUnit = {
  // Convert to CSS (Postscipt) points, not TeX points
  // https://en.wikibooks.org/wiki/LaTeX/Lengths and
  // https://tex.stackexchange.com/a/8263
  pt: 800 / 803, // convert TeX point to CSS (Postscript) point
  pc: (12 * 800) / 803, // pica
  dd: ((1238 / 1157) * 800) / 803, // didot
  cc: ((14856 / 1157) * 800) / 803, // cicero (12 didot)
  nd: ((685 / 642) * 800) / 803, // new didot
  nc: ((1370 / 107) * 800) / 803, // new cicero (12 new didot)
  sp: ((1 / 65536) * 800) / 803, // scaled point (TeX's internal smallest unit)
  mm: (25.4 / 72),
  cm: (2.54 / 72),
  in: (1 / 72),
  px: (96 / 72)
};

/**
 * Determine whether the specified unit (either a string defining the unit
 * or a "size" parse node containing a unit field) is valid.
 */
const validUnits = [
  "em",
  "ex",
  "mu",
  "pt",
  "mm",
  "cm",
  "in",
  "px",
  "bp",
  "pc",
  "dd",
  "cc",
  "nd",
  "nc",
  "sp"
];

const validUnit = function(unit) {
  if (typeof unit !== "string") {
    unit = unit.unit;
  }
  return validUnits.indexOf(unit) > -1
};

const emScale = styleLevel => {
  const scriptLevel = Math.max(styleLevel - 1, 0);
  return [1, 0.7, 0.5][scriptLevel]
};

/*
 * Convert a "size" parse node (with numeric "number" and string "unit" fields,
 * as parsed by functions.js argType "size") into a CSS value.
 */
const calculateSize = function(sizeValue, style) {
  let number = sizeValue.number;
  if (style.maxSize[0] < 0 && number > 0) {
    return { number: 0, unit: "em" }
  }
  const unit = sizeValue.unit;
  switch (unit) {
    case "mm":
    case "cm":
    case "in":
    case "px": {
      const numInCssPts = number * ptPerUnit[unit];
      if (numInCssPts > style.maxSize[1]) {
        return { number: style.maxSize[1], unit: "pt" }
      }
      return { number, unit }; // absolute CSS units.
    }
    case "em":
    case "ex": {
      // In TeX, em and ex do not change size in \scriptstyle.
      if (unit === "ex") { number *= 0.431; }
      number = Math.min(number / emScale(style.level), style.maxSize[0]);
      return { number: utils.round(number), unit: "em" };
    }
    case "bp": {
      if (number > style.maxSize[1]) { number = style.maxSize[1]; }
      return { number, unit: "pt" }; // TeX bp is a CSS pt. (1/72 inch).
    }
    case "pt":
    case "pc":
    case "dd":
    case "cc":
    case "nd":
    case "nc":
    case "sp": {
      number = Math.min(number * ptPerUnit[unit], style.maxSize[1]);
      return { number: utils.round(number), unit: "pt" }
    }
    case "mu": {
      number = Math.min(number / 18, style.maxSize[0]);
      return { number: utils.round(number), unit: "em" }
    }
    default:
      throw new ParseError("Invalid unit: '" + unit + "'")
  }
};

// Helper functions

const padding = width => {
  const node = new mathMLTree.MathNode("mspace");
  node.setAttribute("width", width + "em");
  return node
};

const paddedNode = (group, lspace = 0.3, rspace = 0, mustSmash = false) => {
  if (group == null && rspace === 0) { return padding(lspace) }
  const row = group ? [group] : [];
  if (lspace !== 0)   { row.unshift(padding(lspace)); }
  if (rspace > 0) { row.push(padding(rspace)); }
  if (mustSmash) {
    // Used for the bottom arrow in a {CD} environment
    const mpadded = new mathMLTree.MathNode("mpadded", row);
    mpadded.setAttribute("height", "0.1px"); // Don't use 0. WebKit would hide it.
    return mpadded
  } else {
    return new mathMLTree.MathNode("mrow", row)
  }
};

const labelSize = (size, scriptLevel) =>  Number(size) / emScale(scriptLevel);

const munderoverNode = (fName, body, below, style) => {
  const arrowNode = stretchy.mathMLnode(fName);
  // Is this the short part of a mhchem equilibrium arrow?
  const isEq = fName.slice(1, 3) === "eq";
  const minWidth = fName.charAt(1) === "x"
    ? "1.75"  // mathtools extensible arrows are ≥ 1.75em long
    : fName.slice(2, 4) === "cd"
    ? "3.0"  // cd package arrows
    : isEq
    ? "1.0"  // The shorter harpoon of a mhchem equilibrium arrow
    : "2.0"; // other mhchem arrows
  // TODO: When Firefox supports minsize, use the next line.
  //arrowNode.setAttribute("minsize", String(minWidth) + "em")
  arrowNode.setAttribute("lspace", "0");
  arrowNode.setAttribute("rspace", (isEq ? "0.5em" : "0"));

  // <munderover> upper and lower labels are set to scriptlevel by MathML
  // So we have to adjust our label dimensions accordingly.
  const labelStyle = style.withLevel(style.level < 2 ? 2 : 3);
  const minArrowWidth = labelSize(minWidth, labelStyle.level);
  // The dummyNode will be inside a <mover> inside a <mover>
  // So it will be at scriptlevel 3
  const dummyWidth = labelSize(minWidth, 3);
  const emptyLabel = paddedNode(null, minArrowWidth.toFixed(4), 0);
  const dummyNode = paddedNode(null, dummyWidth.toFixed(4), 0);
  // The arrow is a little longer than the label. Set a spacer length.
  const space = labelSize((isEq ? 0 : 0.3), labelStyle.level).toFixed(4);
  let upperNode;
  let lowerNode;

  const gotUpper = (body && body.body &&
    // \hphantom        visible content
    (body.body.body || body.body.length > 0));
  if (gotUpper) {
    let label =  buildGroup$1(body, labelStyle);
    const mustSmash = (fName === "\\\\cdrightarrow" || fName === "\\\\cdleftarrow");
    label = paddedNode(label, space, space, mustSmash);
    // Since Firefox does not support minsize, stack a invisible node
    // on top of the label. Its width will serve as a min-width.
    // TODO: Refactor this after Firefox supports minsize.
    upperNode = new mathMLTree.MathNode("mover", [label, dummyNode]);
  }
  const gotLower = (below && below.body &&
    (below.body.body || below.body.length > 0));
  if (gotLower) {
    let label =  buildGroup$1(below, labelStyle);
    label = paddedNode(label, space, space);
    lowerNode = new mathMLTree.MathNode("munder", [label, dummyNode]);
  }

  let node;
  if (!gotUpper && !gotLower) {
    node = new mathMLTree.MathNode("mover", [arrowNode, emptyLabel]);
  } else if (gotUpper && gotLower) {
    node = new mathMLTree.MathNode("munderover", [arrowNode, lowerNode, upperNode]);
  } else if (gotUpper) {
    node = new mathMLTree.MathNode("mover", [arrowNode, upperNode]);
  } else {
    node = new mathMLTree.MathNode("munder", [arrowNode, lowerNode]);
  }
  if (minWidth === "3.0") { node.style.height = "1em"; } // CD environment
  node.setAttribute("accent", "false"); // Necessary for MS Word
  return node
};

// Stretchy arrows with an optional argument
defineFunction({
  type: "xArrow",
  names: [
    "\\xleftarrow",
    "\\xrightarrow",
    "\\xLeftarrow",
    "\\xRightarrow",
    "\\xleftrightarrow",
    "\\xLeftrightarrow",
    "\\xhookleftarrow",
    "\\xhookrightarrow",
    "\\xmapsto",
    "\\xrightharpoondown",
    "\\xrightharpoonup",
    "\\xleftharpoondown",
    "\\xleftharpoonup",
    "\\xlongequal",
    "\\xtwoheadrightarrow",
    "\\xtwoheadleftarrow",
    "\\xtofrom",              // expfeil
    "\\xleftrightharpoons",   // mathtools
    "\\xrightleftharpoons",   // mathtools
    // The next 7 functions are here only to support mhchem
    "\\yields",
    "\\yieldsLeft",
    "\\mesomerism",
    "\\longrightharpoonup",
    "\\longleftharpoondown",
    "\\yieldsLeftRight",
    "\\chemequilibrium",
    // The next 3 functions are here only to support the {CD} environment.
    "\\\\cdrightarrow",
    "\\\\cdleftarrow",
    "\\\\cdlongequal"
  ],
  props: {
    numArgs: 1,
    numOptionalArgs: 1
  },
  handler({ parser, funcName }, args, optArgs) {
    return {
      type: "xArrow",
      mode: parser.mode,
      name: funcName,
      body: args[0],
      below: optArgs[0]
    };
  },
  mathmlBuilder(group, style) {
    // Build the arrow and its labels.
    const node = munderoverNode(group.name, group.body, group.below, style);
    // Create operator spacing for a relation.
    const row = [node];
    row.unshift(padding(0.2778));
    row.push(padding(0.2778));
    return new mathMLTree.MathNode("mrow", row)
  }
});

const arrowComponent = {
  "\\equilibriumRight": ["\\longrightharpoonup", "\\eqleftharpoondown"],
  "\\equilibriumLeft": ["\\eqrightharpoonup", "\\longleftharpoondown"]
};

// Math fonts do not have a single glyph for these two mhchem functions.
// So we stack a pair of single harpoons.
defineFunction({
  type: "stackedArrow",
  names: [
    "\\equilibriumRight",
    "\\equilibriumLeft"
  ],
  props: {
    numArgs: 1,
    numOptionalArgs: 1
  },
  handler({ parser, funcName }, args, optArgs) {
    const lowerArrowBody = args[0]
      ? {
        type: "hphantom",
        mode: parser.mode,
        body: args[0]
      }
      : null;
    const upperArrowBelow = optArgs[0]
      ? {
        type: "hphantom",
        mode: parser.mode,
        body: optArgs[0]
      }
      : null;
    return {
      type: "stackedArrow",
      mode: parser.mode,
      name: funcName,
      body: args[0],
      upperArrowBelow,
      lowerArrowBody,
      below: optArgs[0]
    };
  },
  mathmlBuilder(group, style) {
    const topLabel = arrowComponent[group.name][0];
    const botLabel = arrowComponent[group.name][1];
    const topArrow = munderoverNode(topLabel, group.body, group.upperArrowBelow, style);
    const botArrow = munderoverNode(botLabel, group.lowerArrowBody, group.below, style);
    let wrapper;

    const raiseNode = new mathMLTree.MathNode("mpadded", [topArrow]);
    raiseNode.setAttribute("voffset", "0.3em");
    raiseNode.setAttribute("height", "+0.3em");
    raiseNode.setAttribute("depth", "-0.3em");
    // One of the arrows is given ~zero width. so the other has the same horzontal alignment.
    if (group.name === "\\equilibriumLeft") {
      const botNode =  new mathMLTree.MathNode("mpadded", [botArrow]);
      botNode.setAttribute("width", "0.5em");
      wrapper = new mathMLTree.MathNode(
        "mpadded",
        [padding(0.2778), botNode, raiseNode, padding(0.2778)]
      );
    } else {
      raiseNode.setAttribute("width", (group.name === "\\equilibriumRight" ? "0.5em" : "0"));
      wrapper = new mathMLTree.MathNode(
        "mpadded",
        [padding(0.2778), raiseNode, botArrow, padding(0.2778)]
      );
    }

    wrapper.setAttribute("voffset", "-0.18em");
    wrapper.setAttribute("height", "-0.18em");
    wrapper.setAttribute("depth", "+0.18em");
    return wrapper
  }
});

/**
 * All registered environments.
 * `environments.js` exports this same dictionary again and makes it public.
 * `Parser.js` requires this dictionary via `environments.js`.
 */
const _environments = {};

function defineEnvironment({ type, names, props, handler, mathmlBuilder }) {
  // Set default values of environments.
  const data = {
    type,
    numArgs: props.numArgs || 0,
    allowedInText: false,
    numOptionalArgs: 0,
    handler
  };
  for (let i = 0; i < names.length; ++i) {
    _environments[names[i]] = data;
  }
  if (mathmlBuilder) {
    _mathmlGroupBuilders[type] = mathmlBuilder;
  }
}

/**
 * Asserts that the node is of the given type and returns it with stricter
 * typing. Throws if the node's type does not match.
 */
function assertNodeType(node, type) {
  if (!node || node.type !== type) {
    throw new Error(
      `Expected node of type ${type}, but got ` +
        (node ? `node of type ${node.type}` : String(node))
    );
  }
  return node;
}

/**
 * Returns the node more strictly typed iff it is of the given type. Otherwise,
 * returns null.
 */
function assertSymbolNodeType(node) {
  const typedNode = checkSymbolNodeType(node);
  if (!typedNode) {
    throw new Error(
      `Expected node of symbol group type, but got ` +
        (node ? `node of type ${node.type}` : String(node))
    );
  }
  return typedNode;
}

/**
 * Returns the node more strictly typed iff it is of the given type. Otherwise,
 * returns null.
 */
function checkSymbolNodeType(node) {
  if (node && (node.type === "atom" ||
      Object.prototype.hasOwnProperty.call(NON_ATOMS, node.type))) {
    return node;
  }
  return null;
}

const cdArrowFunctionName = {
  ">": "\\\\cdrightarrow",
  "<": "\\\\cdleftarrow",
  "=": "\\\\cdlongequal",
  A: "\\uparrow",
  V: "\\downarrow",
  "|": "\\Vert",
  ".": "no arrow"
};

const newCell = () => {
  // Create an empty cell, to be filled below with parse nodes.
  return { type: "styling", body: [], mode: "math", scriptLevel: "display" };
};

const isStartOfArrow = (node) => {
  return node.type === "textord" && node.text === "@";
};

const isLabelEnd = (node, endChar) => {
  return (node.type === "mathord" || node.type === "atom") && node.text === endChar;
};

function cdArrow(arrowChar, labels, parser) {
  // Return a parse tree of an arrow and its labels.
  // This acts in a way similar to a macro expansion.
  const funcName = cdArrowFunctionName[arrowChar];
  switch (funcName) {
    case "\\\\cdrightarrow":
    case "\\\\cdleftarrow":
      return parser.callFunction(funcName, [labels[0]], [labels[1]]);
    case "\\uparrow":
    case "\\downarrow": {
      const leftLabel = parser.callFunction("\\\\cdleft", [labels[0]], []);
      const bareArrow = {
        type: "atom",
        text: funcName,
        mode: "math",
        family: "rel"
      };
      const sizedArrow = parser.callFunction("\\Big", [bareArrow], []);
      const rightLabel = parser.callFunction("\\\\cdright", [labels[1]], []);
      const arrowGroup = {
        type: "ordgroup",
        mode: "math",
        body: [leftLabel, sizedArrow, rightLabel],
        semisimple: true
      };
      return parser.callFunction("\\\\cdparent", [arrowGroup], []);
    }
    case "\\\\cdlongequal":
      return parser.callFunction("\\\\cdlongequal", [], []);
    case "\\Vert": {
      const arrow = { type: "textord", text: "\\Vert", mode: "math" };
      return parser.callFunction("\\Big", [arrow], []);
    }
    default:
      return { type: "textord", text: " ", mode: "math" };
  }
}

function parseCD(parser) {
  // Get the array's parse nodes with \\ temporarily mapped to \cr.
  const parsedRows = [];
  parser.gullet.beginGroup();
  parser.gullet.macros.set("\\cr", "\\\\\\relax");
  parser.gullet.beginGroup();
  while (true) {
    // Get the parse nodes for the next row.
    parsedRows.push(parser.parseExpression(false, "\\\\"));
    parser.gullet.endGroup();
    parser.gullet.beginGroup();
    const next = parser.fetch().text;
    if (next === "&" || next === "\\\\") {
      parser.consume();
    } else if (next === "\\end") {
      if (parsedRows[parsedRows.length - 1].length === 0) {
        parsedRows.pop(); // final row ended in \\
      }
      break;
    } else {
      throw new ParseError("Expected \\\\ or \\cr or \\end", parser.nextToken);
    }
  }

  let row = [];
  const body = [row];

  // Loop thru the parse nodes. Collect them into cells and arrows.
  for (let i = 0; i < parsedRows.length; i++) {
    // Start a new row.
    const rowNodes = parsedRows[i];
    // Create the first cell.
    let cell = newCell();

    for (let j = 0; j < rowNodes.length; j++) {
      if (!isStartOfArrow(rowNodes[j])) {
        // If a parseNode is not an arrow, it goes into a cell.
        cell.body.push(rowNodes[j]);
      } else {
        // Parse node j is an "@", the start of an arrow.
        // Before starting on the arrow, push the cell into `row`.
        row.push(cell);

        // Now collect parseNodes into an arrow.
        // The character after "@" defines the arrow type.
        j += 1;
        const arrowChar = assertSymbolNodeType(rowNodes[j]).text;

        // Create two empty label nodes. We may or may not use them.
        const labels = new Array(2);
        labels[0] = { type: "ordgroup", mode: "math", body: [] };
        labels[1] = { type: "ordgroup", mode: "math", body: [] };

        // Process the arrow.
        if ("=|.".indexOf(arrowChar) > -1) ; else if ("<>AV".indexOf(arrowChar) > -1) {
          // Four arrows, `@>>>`, `@<<<`, `@AAA`, and `@VVV`, each take
          // two optional labels. E.g. the right-point arrow syntax is
          // really:  @>{optional label}>{optional label}>
          // Collect parseNodes into labels.
          for (let labelNum = 0; labelNum < 2; labelNum++) {
            let inLabel = true;
            for (let k = j + 1; k < rowNodes.length; k++) {
              if (isLabelEnd(rowNodes[k], arrowChar)) {
                inLabel = false;
                j = k;
                break;
              }
              if (isStartOfArrow(rowNodes[k])) {
                throw new ParseError(
                  "Missing a " + arrowChar + " character to complete a CD arrow.",
                  rowNodes[k]
                );
              }

              labels[labelNum].body.push(rowNodes[k]);
            }
            if (inLabel) {
              // isLabelEnd never returned a true.
              throw new ParseError(
                "Missing a " + arrowChar + " character to complete a CD arrow.",
                rowNodes[j]
              );
            }
          }
        } else {
          throw new ParseError(`Expected one of "<>AV=|." after @.`);
        }

        // Now join the arrow to its labels.
        const arrow = cdArrow(arrowChar, labels, parser);

        // Wrap the arrow in a styling node
        row.push(arrow);
        // In CD's syntax, cells are implicit. That is, everything that
        // is not an arrow gets collected into a cell. So create an empty
        // cell now. It will collect upcoming parseNodes.
        cell = newCell();
      }
    }
    if (i % 2 === 0) {
      // Even-numbered rows consist of: cell, arrow, cell, arrow, ... cell
      // The last cell is not yet pushed into `row`, so:
      row.push(cell);
    } else {
      // Odd-numbered rows consist of: vert arrow, empty cell, ... vert arrow
      // Remove the empty cell that was placed at the beginning of `row`.
      row.shift();
    }
    row = [];
    body.push(row);
  }
  body.pop();

  // End row group
  parser.gullet.endGroup();
  // End array group defining \\
  parser.gullet.endGroup();

  return {
    type: "array",
    mode: "math",
    body,
    tags: null,
    labels: new Array(body.length + 1).fill(""),
    envClasses: ["jot", "cd"],
    cols: [],
    hLinesBeforeRow: new Array(body.length + 1).fill([])
  };
}

// The functions below are not available for general use.
// They are here only for internal use by the {CD} environment in placing labels
// next to vertical arrows.

// We don't need any such functions for horizontal arrows because we can reuse
// the functionality that already exists for extensible arrows.

defineFunction({
  type: "cdlabel",
  names: ["\\\\cdleft", "\\\\cdright"],
  props: {
    numArgs: 1
  },
  handler({ parser, funcName }, args) {
    return {
      type: "cdlabel",
      mode: parser.mode,
      side: funcName.slice(4),
      label: args[0]
    };
  },
  mathmlBuilder(group, style) {
    if (group.label.body.length === 0) {
      return new mathMLTree.MathNode("mrow", style)  // empty label
    }
    // Abuse an <mtable> to create vertically centered content.
    const mrow = buildGroup$1(group.label, style);
    if (group.side === "left") {
      mrow.classes.push("tml-shift-left");
    }
    const mtd = new mathMLTree.MathNode("mtd", [mrow]);
    mtd.style.padding = "0";
    const mtr = new mathMLTree.MathNode("mtr", [mtd]);
    const mtable = new mathMLTree.MathNode("mtable", [mtr]);
    const label = new mathMLTree.MathNode("mpadded", [mtable]);
    // Set the label width to zero so that the arrow will be centered under the corner cell.
    label.setAttribute("width", "0.1px"); // Don't use 0. WebKit would hide it.
    label.setAttribute("displaystyle", "false");
    label.setAttribute("scriptlevel", "1");
    return label;
  }
});

defineFunction({
  type: "cdlabelparent",
  names: ["\\\\cdparent"],
  props: {
    numArgs: 1
  },
  handler({ parser }, args) {
    return {
      type: "cdlabelparent",
      mode: parser.mode,
      fragment: args[0]
    };
  },
  mathmlBuilder(group, style) {
    return new mathMLTree.MathNode("mrow", [buildGroup$1(group.fragment, style)]);
  }
});

const ordGroup = (body) => {
  return {
    "type": "ordgroup",
    "mode": "math",
    "body": body,
    "semisimple": true
  }
};

const phantom = (body, type) => {
  return {
    "type": type,
    "mode": "math",
    "body": ordGroup(body)
  }
};

/*
 * A helper for \bordermatrix.
 * parseArray() has parsed the tokens as if the environment
 * was \begin{matrix}. That parse tree is this function’s input.
 * Here, we rearrange the parse tree to get one that will
 * result in TeX \bordermatrix.
 * The final result includes a {pmatrix}, which is the bottom
 * half of a <mover> element. The top of the <mover> contains
 * the \bordermatrix headings. The top section also contains the
 * contents of the bottom {pmatrix}. Those elements are hidden via
 * \hphantom, but they ensure that column widths are the same top and
 * bottom.
 *
 * We also create a left {matrix} with a single column that contains
 * elements shifted out of the matrix. The left {matrix} also
 * contains \vphantom copies of the other {pmatrix} elements.
 * As before, this ensures consistent row heights of left and main.
 */

const bordermatrixParseTree = (matrix, delimiters) => {
  const body = matrix.body;
  body[0].shift(); // dispose of top left cell

  // Create an array for the left column
  const leftColumnBody = new Array(body.length - 1).fill().map(() => []);
  for (let i = 1; i < body.length; i++) {
    // The visible part of the cell
    leftColumnBody[i - 1].push(body[i].shift());
    // A vphantom with contents from the pmatrix, to set minimum cell height
    const phantomBody = [];
    for (let j = 0; j < body[i].length; j++) {
      phantomBody.push(body[i][j]);
    }
    leftColumnBody[i - 1].push(phantom(phantomBody, "vphantom"));
  }

  // Create an array for the top row
  const topRowBody = new Array(body.length).fill().map(() => []);
  for (let j = 0; j < body[0].length; j++) {
    topRowBody[0].push(body[0][j]);
  }
  // Copy the rest of the pmatrix, but squashed via \hphantom
  for (let i = 1; i < body.length; i++) {
    for (let j = 0; j < body[0].length; j++) {
      topRowBody[i].push(phantom(body[i][j].body, "hphantom"));
    }
  }

  // Squash the top row of the main {pmatrix}
  for (let j = 0; j < body[0].length; j++) {
    body[0][j] = phantom(body[0][j].body, "hphantom");
  }

  // Now wrap the arrays in the proper parse nodes.

  const leftColumn = {
    type: "array",
    mode: "math",
    body: leftColumnBody,
    cols: [{ type: "align", align: "c" }],
    rowGaps: new Array(leftColumnBody.length - 1).fill(null),
    hLinesBeforeRow: new Array(leftColumnBody.length + 1).fill().map(() => []),
    envClasses: [],
    scriptLevel: "text",
    arraystretch: 1,
    labels: new Array(leftColumnBody.length).fill(""),
    arraycolsep: { "number": 0.04, unit: "em" }
  };

  const topRow = {
    type: "array",
    mode: "math",
    body: topRowBody,
    cols: new Array(topRowBody.length).fill({ type: "align", align: "c" }),
    rowGaps: new Array(topRowBody.length - 1).fill(null),
    hLinesBeforeRow: new Array(topRowBody.length + 1).fill().map(() => []),
    envClasses: [],
    scriptLevel: "text",
    arraystretch: 1,
    labels: new Array(topRowBody.length).fill(""),
    arraycolsep: null
  };

  const topWrapper = {
    type: "styling",
    mode: "math",
    scriptLevel: "text", // Must set this explicitly.
    body: [topRow]       // Default level is "script".
  };

  const container = {
    type: "leftright",
    mode: "math",
    body: [matrix],
    left: delimiters ? delimiters[0] : "(",
    right: delimiters ? delimiters[1] : ")",
    rightColor: undefined
  };

  const base = {
    type: "op",   // The base of a TeX \overset
    mode: "math",
    limits: true,
    alwaysHandleSupSub: true,
    parentIsSupSub: true,
    symbol: false,
    suppressBaseShift: true,
    body: [container]
  };

  const mover = {
    type: "supsub",  // We're using the MathML equivalent
    mode: "math",    // of TeX \overset.
    stack: true,
    base: base,      // That keeps the {pmatrix} aligned with
    sup: topWrapper, // the math centerline.
    sub: null
  };

  return ordGroup([leftColumn, mover])
};

/**
 * Lexing or parsing positional information for error reporting.
 * This object is immutable.
 */
class SourceLocation {
  constructor(lexer, start, end) {
    this.lexer = lexer; // Lexer holding the input string.
    this.start = start; // Start offset, zero-based inclusive.
    this.end = end;     // End offset, zero-based exclusive.
  }

  /**
   * Merges two `SourceLocation`s from location providers, given they are
   * provided in order of appearance.
   * - Returns the first one's location if only the first is provided.
   * - Returns a merged range of the first and the last if both are provided
   *   and their lexers match.
   * - Otherwise, returns null.
   */
  static range(first, second) {
    if (!second) {
      return first && first.loc;
    } else if (!first || !first.loc || !second.loc || first.loc.lexer !== second.loc.lexer) {
      return null;
    } else {
      return new SourceLocation(first.loc.lexer, first.loc.start, second.loc.end);
    }
  }
}

/**
 * Interface required to break circular dependency between Token, Lexer, and
 * ParseError.
 */

/**
 * The resulting token returned from `lex`.
 *
 * It consists of the token text plus some position information.
 * The position information is essentially a range in an input string,
 * but instead of referencing the bare input string, we refer to the lexer.
 * That way it is possible to attach extra metadata to the input string,
 * like for example a file name or similar.
 *
 * The position information is optional, so it is OK to construct synthetic
 * tokens if appropriate. Not providing available position information may
 * lead to degraded error reporting, though.
 */
class Token {
  constructor(
    text, // the text of this token
    loc
  ) {
    this.text = text;
    this.loc = loc;
  }

  /**
   * Given a pair of tokens (this and endToken), compute a `Token` encompassing
   * the whole input range enclosed by these two.
   */
  range(
    endToken, // last token of the range, inclusive
    text // the text of the newly constructed token
  ) {
    return new Token(text, SourceLocation.range(this, endToken));
  }
}

// In TeX, there are actually three sets of dimensions, one for each of
// textstyle, scriptstyle, and scriptscriptstyle.  These are
// provided in the the arrays below, in that order.
//

// Math style is not quite the same thing as script level.
const StyleLevel = {
  DISPLAY: 0,
  TEXT: 1,
  SCRIPT: 2,
  SCRIPTSCRIPT: 3
};

/**
 * All registered global/built-in macros.
 * `macros.js` exports this same dictionary again and makes it public.
 * `Parser.js` requires this dictionary via `macros.js`.
 */
const _macros = {};

// This function might one day accept an additional argument and do more things.
function defineMacro(name, body) {
  _macros[name] = body;
}

/**
 * Predefined macros for Temml.
 * This can be used to define some commands in terms of others.
 */

const macros = _macros;

//////////////////////////////////////////////////////////////////////
// macro tools

defineMacro("\\noexpand", function(context) {
  // The expansion is the token itself; but that token is interpreted
  // as if its meaning were ‘\relax’ if it is a control sequence that
  // would ordinarily be expanded by TeX’s expansion rules.
  const t = context.popToken();
  if (context.isExpandable(t.text)) {
    t.noexpand = true;
    t.treatAsRelax = true;
  }
  return { tokens: [t], numArgs: 0 };
});

defineMacro("\\expandafter", function(context) {
  // TeX first reads the token that comes immediately after \expandafter,
  // without expanding it; let’s call this token t. Then TeX reads the
  // token that comes after t (and possibly more tokens, if that token
  // has an argument), replacing it by its expansion. Finally TeX puts
  // t back in front of that expansion.
  const t = context.popToken();
  context.expandOnce(true); // expand only an expandable token
  return { tokens: [t], numArgs: 0 };
});

// LaTeX's \@firstoftwo{#1}{#2} expands to #1, skipping #2
// TeX source: \long\def\@firstoftwo#1#2{#1}
defineMacro("\\@firstoftwo", function(context) {
  const args = context.consumeArgs(2);
  return { tokens: args[0], numArgs: 0 };
});

// LaTeX's \@secondoftwo{#1}{#2} expands to #2, skipping #1
// TeX source: \long\def\@secondoftwo#1#2{#2}
defineMacro("\\@secondoftwo", function(context) {
  const args = context.consumeArgs(2);
  return { tokens: args[1], numArgs: 0 };
});

// LaTeX's \@ifnextchar{#1}{#2}{#3} looks ahead to the next (unexpanded)
// symbol that isn't a space, consuming any spaces but not consuming the
// first nonspace character.  If that nonspace character matches #1, then
// the macro expands to #2; otherwise, it expands to #3.
defineMacro("\\@ifnextchar", function(context) {
  const args = context.consumeArgs(3); // symbol, if, else
  context.consumeSpaces();
  const nextToken = context.future();
  if (args[0].length === 1 && args[0][0].text === nextToken.text) {
    return { tokens: args[1], numArgs: 0 };
  } else {
    return { tokens: args[2], numArgs: 0 };
  }
});

// LaTeX's \@ifstar{#1}{#2} looks ahead to the next (unexpanded) symbol.
// If it is `*`, then it consumes the symbol, and the macro expands to #1;
// otherwise, the macro expands to #2 (without consuming the symbol).
// TeX source: \def\@ifstar#1{\@ifnextchar *{\@firstoftwo{#1}}}
defineMacro("\\@ifstar", "\\@ifnextchar *{\\@firstoftwo{#1}}");

// LaTeX's \TextOrMath{#1}{#2} expands to #1 in text mode, #2 in math mode
defineMacro("\\TextOrMath", function(context) {
  const args = context.consumeArgs(2);
  if (context.mode === "text") {
    return { tokens: args[0], numArgs: 0 };
  } else {
    return { tokens: args[1], numArgs: 0 };
  }
});

const stringFromArg = arg => {
  // Reverse the order of the arg and return a string.
  let str = "";
  for (let i = arg.length - 1; i > -1; i--) {
    str += arg[i].text;
  }
  return str
};

// Lookup table for parsing numbers in base 8 through 16
const digitToNumber = {
  0: 0,
  1: 1,
  2: 2,
  3: 3,
  4: 4,
  5: 5,
  6: 6,
  7: 7,
  8: 8,
  9: 9,
  a: 10,
  A: 10,
  b: 11,
  B: 11,
  c: 12,
  C: 12,
  d: 13,
  D: 13,
  e: 14,
  E: 14,
  f: 15,
  F: 15
};

const nextCharNumber = context => {
  const numStr = context.future().text;
  if (numStr === "EOF") { return [null, ""] }
  return [digitToNumber[numStr.charAt(0)], numStr]
};

const appendCharNumbers = (number, numStr, base) => {
  for (let i = 1; i < numStr.length; i++) {
    const digit = digitToNumber[numStr.charAt(i)];
    number *= base;
    number += digit;
  }
  return number
};

// TeX \char makes a literal character (catcode 12) using the following forms:
// (see The TeXBook, p. 43)
//   \char123  -- decimal
//   \char'123 -- octal
//   \char"123 -- hex
//   \char`x   -- character that can be written (i.e. isn't active)
//   \char`\x  -- character that cannot be written (e.g. %)
// These all refer to characters from the font, so we turn them into special
// calls to a function \@char dealt with in the Parser.
defineMacro("\\char", function(context) {
  let token = context.popToken();
  let base;
  let number = "";
  if (token.text === "'") {
    base = 8;
    token = context.popToken();
  } else if (token.text === '"') {
    base = 16;
    token = context.popToken();
  } else if (token.text === "`") {
    token = context.popToken();
    if (token.text[0] === "\\") {
      number = token.text.charCodeAt(1);
    } else if (token.text === "EOF") {
      throw new ParseError("\\char` missing argument");
    } else {
      number = token.text.charCodeAt(0);
    }
  } else {
    base = 10;
  }
  if (base) {
    // Parse a number in the given base, starting with first `token`.
    let numStr = token.text;
    number = digitToNumber[numStr.charAt(0)];
    if (number == null || number >= base) {
      throw new ParseError(`Invalid base-${base} digit ${token.text}`);
    }
    number = appendCharNumbers(number, numStr, base);
    let digit;
    [digit, numStr] = nextCharNumber(context);
    while (digit != null && digit < base) {
      number *= base;
      number += digit;
      number = appendCharNumbers(number, numStr, base);
      context.popToken();
      [digit, numStr] = nextCharNumber(context);
    }
  }
  return `\\@char{${number}}`;
});

function recreateArgStr(context) {
  // Recreate the macro's original argument string from the array of parse tokens.
  const tokens = context.consumeArgs(1)[0];
  let str = "";
  let expectedLoc = tokens[tokens.length - 1].loc.start;
  for (let i = tokens.length - 1; i >= 0; i--) {
    const actualLoc = tokens[i].loc.start;
    if (actualLoc > expectedLoc) {
      // context.consumeArgs has eaten a space.
      str += " ";
      expectedLoc = actualLoc;
    }
    str += tokens[i].text;
    expectedLoc += tokens[i].text.length;
  }
  return str
}

// The Latin Modern font renders <mi>√</mi> at the wrong vertical alignment.
// This macro provides a better rendering.
defineMacro("\\surd", '\\sqrt{\\vphantom{|}}');

// See comment for \oplus in symbols.js.
defineMacro("\u2295", "\\oplus");

// Since Temml has no \par, ignore \long.
defineMacro("\\long", "");

//////////////////////////////////////////////////////////////////////
// Grouping
// \let\bgroup={ \let\egroup=}
defineMacro("\\bgroup", "{");
defineMacro("\\egroup", "}");

// Symbols from latex.ltx:
// \def~{\nobreakspace{}}
// \def\lq{`}
// \def\rq{'}
// \def \aa {\r a}
defineMacro("~", "\\nobreakspace");
defineMacro("\\lq", "`");
defineMacro("\\rq", "'");
defineMacro("\\aa", "\\r a");

defineMacro("\\Bbbk", "\\Bbb{k}");

// \mathstrut from the TeXbook, p 360
defineMacro("\\mathstrut", "\\vphantom{(}");

// \underbar from TeXbook p 353
defineMacro("\\underbar", "\\underline{\\text{#1}}");

//////////////////////////////////////////////////////////////////////
// LaTeX_2ε

// \vdots{\vbox{\baselineskip4\p@  \lineskiplimit\z@
// \kern6\p@\hbox{.}\hbox{.}\hbox{.}}}
// We'll call \varvdots, which gets a glyph from symbols.js.
// The zero-width rule gets us an equivalent to the vertical 6pt kern.
defineMacro("\\vdots", "{\\varvdots\\rule{0pt}{15pt}}");
defineMacro("\u22ee", "\\vdots");

// {array} environment gaps
defineMacro("\\arraystretch", "1");     // line spacing factor times 12pt
defineMacro("\\arraycolsep", "6pt");    // half the width separating columns

//////////////////////////////////////////////////////////////////////
// amsmath.sty
// http://mirrors.concertpass.com/tex-archive/macros/latex/required/amsmath/amsmath.pdf

//\newcommand{\substack}[1]{\subarray{c}#1\endsubarray}
defineMacro("\\substack", "\\begin{subarray}{c}#1\\end{subarray}");

// \def\iff{\DOTSB\;\Longleftrightarrow\;}
// \def\implies{\DOTSB\;\Longrightarrow\;}
// \def\impliedby{\DOTSB\;\Longleftarrow\;}
defineMacro("\\iff", "\\DOTSB\\;\\Longleftrightarrow\\;");
defineMacro("\\implies", "\\DOTSB\\;\\Longrightarrow\\;");
defineMacro("\\impliedby", "\\DOTSB\\;\\Longleftarrow\\;");

// AMSMath's automatic \dots, based on \mdots@@ macro.
const dotsByToken = {
  ",": "\\dotsc",
  "\\not": "\\dotsb",
  // \keybin@ checks for the following:
  "+": "\\dotsb",
  "=": "\\dotsb",
  "<": "\\dotsb",
  ">": "\\dotsb",
  "-": "\\dotsb",
  "*": "\\dotsb",
  ":": "\\dotsb",
  // Symbols whose definition starts with \DOTSB:
  "\\DOTSB": "\\dotsb",
  "\\coprod": "\\dotsb",
  "\\bigvee": "\\dotsb",
  "\\bigwedge": "\\dotsb",
  "\\biguplus": "\\dotsb",
  "\\bigcap": "\\dotsb",
  "\\bigcup": "\\dotsb",
  "\\prod": "\\dotsb",
  "\\sum": "\\dotsb",
  "\\bigotimes": "\\dotsb",
  "\\bigoplus": "\\dotsb",
  "\\bigodot": "\\dotsb",
  "\\bigsqcap": "\\dotsb",
  "\\bigsqcup": "\\dotsb",
  "\\bigtimes": "\\dotsb",
  "\\And": "\\dotsb",
  "\\longrightarrow": "\\dotsb",
  "\\Longrightarrow": "\\dotsb",
  "\\longleftarrow": "\\dotsb",
  "\\Longleftarrow": "\\dotsb",
  "\\longleftrightarrow": "\\dotsb",
  "\\Longleftrightarrow": "\\dotsb",
  "\\mapsto": "\\dotsb",
  "\\longmapsto": "\\dotsb",
  "\\hookrightarrow": "\\dotsb",
  "\\doteq": "\\dotsb",
  // Symbols whose definition starts with \mathbin:
  "\\mathbin": "\\dotsb",
  // Symbols whose definition starts with \mathrel:
  "\\mathrel": "\\dotsb",
  "\\relbar": "\\dotsb",
  "\\Relbar": "\\dotsb",
  "\\xrightarrow": "\\dotsb",
  "\\xleftarrow": "\\dotsb",
  // Symbols whose definition starts with \DOTSI:
  "\\DOTSI": "\\dotsi",
  "\\int": "\\dotsi",
  "\\oint": "\\dotsi",
  "\\iint": "\\dotsi",
  "\\iiint": "\\dotsi",
  "\\iiiint": "\\dotsi",
  "\\idotsint": "\\dotsi",
  // Symbols whose definition starts with \DOTSX:
  "\\DOTSX": "\\dotsx"
};

defineMacro("\\dots", function(context) {
  // TODO: If used in text mode, should expand to \textellipsis.
  // However, in Temml, \textellipsis and \ldots behave the same
  // (in text mode), and it's unlikely we'd see any of the math commands
  // that affect the behavior of \dots when in text mode.  So fine for now
  // (until we support \ifmmode ... \else ... \fi).
  let thedots = "\\dotso";
  const next = context.expandAfterFuture().text;
  if (next in dotsByToken) {
    thedots = dotsByToken[next];
  } else if (next.slice(0, 4) === "\\not") {
    thedots = "\\dotsb";
  } else if (next in symbols.math) {
    if (["bin", "rel"].includes(symbols.math[next].group)) {
      thedots = "\\dotsb";
    }
  }
  return thedots;
});

const spaceAfterDots = {
  // \rightdelim@ checks for the following:
  ")": true,
  "]": true,
  "\\rbrack": true,
  "\\}": true,
  "\\rbrace": true,
  "\\rangle": true,
  "\\rceil": true,
  "\\rfloor": true,
  "\\rgroup": true,
  "\\rmoustache": true,
  "\\right": true,
  "\\bigr": true,
  "\\biggr": true,
  "\\Bigr": true,
  "\\Biggr": true,
  // \extra@ also tests for the following:
  $: true,
  // \extrap@ checks for the following:
  ";": true,
  ".": true,
  ",": true
};

defineMacro("\\dotso", function(context) {
  const next = context.future().text;
  if (next in spaceAfterDots) {
    return "\\ldots\\,";
  } else {
    return "\\ldots";
  }
});

defineMacro("\\dotsc", function(context) {
  const next = context.future().text;
  // \dotsc uses \extra@ but not \extrap@, instead specially checking for
  // ';' and '.', but doesn't check for ','.
  if (next in spaceAfterDots && next !== ",") {
    return "\\ldots\\,";
  } else {
    return "\\ldots";
  }
});

defineMacro("\\cdots", function(context) {
  const next = context.future().text;
  if (next in spaceAfterDots) {
    return "\\@cdots\\,";
  } else {
    return "\\@cdots";
  }
});

defineMacro("\\dotsb", "\\cdots");
defineMacro("\\dotsm", "\\cdots");
defineMacro("\\dotsi", "\\!\\cdots");
defineMacro("\\idotsint", "\\dotsi");
// amsmath doesn't actually define \dotsx, but \dots followed by a macro
// starting with \DOTSX implies \dotso, and then \extra@ detects this case
// and forces the added `\,`.
defineMacro("\\dotsx", "\\ldots\\,");

// \let\DOTSI\relax
// \let\DOTSB\relax
// \let\DOTSX\relax
defineMacro("\\DOTSI", "\\relax");
defineMacro("\\DOTSB", "\\relax");
defineMacro("\\DOTSX", "\\relax");

// Spacing, based on amsmath.sty's override of LaTeX defaults
// \DeclareRobustCommand{\tmspace}[3]{%
//   \ifmmode\mskip#1#2\else\kern#1#3\fi\relax}
defineMacro("\\tmspace", "\\TextOrMath{\\kern#1#3}{\\mskip#1#2}\\relax");
// \renewcommand{\,}{\tmspace+\thinmuskip{.1667em}}
// TODO: math mode should use \thinmuskip
defineMacro("\\,", "{\\tmspace+{3mu}{.1667em}}");
// \let\thinspace\,
defineMacro("\\thinspace", "\\,");
// \def\>{\mskip\medmuskip}
// \renewcommand{\:}{\tmspace+\medmuskip{.2222em}}
// TODO: \> and math mode of \: should use \medmuskip = 4mu plus 2mu minus 4mu
defineMacro("\\>", "\\mskip{4mu}");
defineMacro("\\:", "{\\tmspace+{4mu}{.2222em}}");
// \let\medspace\:
defineMacro("\\medspace", "\\:");
// \renewcommand{\;}{\tmspace+\thickmuskip{.2777em}}
// TODO: math mode should use \thickmuskip = 5mu plus 5mu
defineMacro("\\;", "{\\tmspace+{5mu}{.2777em}}");
// \let\thickspace\;
defineMacro("\\thickspace", "\\;");
// \renewcommand{\!}{\tmspace-\thinmuskip{.1667em}}
// TODO: math mode should use \thinmuskip
defineMacro("\\!", "{\\tmspace-{3mu}{.1667em}}");
// \let\negthinspace\!
defineMacro("\\negthinspace", "\\!");
// \newcommand{\negmedspace}{\tmspace-\medmuskip{.2222em}}
// TODO: math mode should use \medmuskip
defineMacro("\\negmedspace", "{\\tmspace-{4mu}{.2222em}}");
// \newcommand{\negthickspace}{\tmspace-\thickmuskip{.2777em}}
// TODO: math mode should use \thickmuskip
defineMacro("\\negthickspace", "{\\tmspace-{5mu}{.277em}}");
// \def\enspace{\kern.5em }
defineMacro("\\enspace", "\\kern.5em ");
// \def\enskip{\hskip.5em\relax}
defineMacro("\\enskip", "\\hskip.5em\\relax");
// \def\quad{\hskip1em\relax}
defineMacro("\\quad", "\\hskip1em\\relax");
// \def\qquad{\hskip2em\relax}
defineMacro("\\qquad", "\\hskip2em\\relax");

defineMacro("\\AA", "\\TextOrMath{\\Angstrom}{\\mathring{A}}\\relax");

// \tag@in@display form of \tag
defineMacro("\\tag", "\\@ifstar\\tag@literal\\tag@paren");
defineMacro("\\tag@paren", "\\tag@literal{({#1})}");
defineMacro("\\tag@literal", (context) => {
  if (context.macros.get("\\df@tag")) {
    throw new ParseError("Multiple \\tag");
  }
  return "\\gdef\\df@tag{\\text{#1}}";
});
defineMacro("\\notag", "\\nonumber");
defineMacro("\\nonumber", "\\gdef\\@eqnsw{0}");

// \renewcommand{\bmod}{\nonscript\mskip-\medmuskip\mkern5mu\mathbin
//   {\operator@font mod}\penalty900
//   \mkern5mu\nonscript\mskip-\medmuskip}
// \newcommand{\pod}[1]{\allowbreak
//   \if@display\mkern18mu\else\mkern8mu\fi(#1)}
// \renewcommand{\pmod}[1]{\pod{{\operator@font mod}\mkern6mu#1}}
// \newcommand{\mod}[1]{\allowbreak\if@display\mkern18mu
//   \else\mkern12mu\fi{\operator@font mod}\,\,#1}
// TODO: math mode should use \medmuskip = 4mu plus 2mu minus 4mu
defineMacro("\\bmod", "\\mathbin{\\text{mod}}");
defineMacro(
  "\\pod",
  "\\allowbreak" + "\\mathchoice{\\mkern18mu}{\\mkern8mu}{\\mkern8mu}{\\mkern8mu}(#1)"
);
defineMacro("\\pmod", "\\pod{{\\rm mod}\\mkern6mu#1}");
defineMacro(
  "\\mod",
  "\\allowbreak" +
    "\\mathchoice{\\mkern18mu}{\\mkern12mu}{\\mkern12mu}{\\mkern12mu}" +
    "{\\rm mod}\\,\\,#1"
);

//////////////////////////////////////////////////////////////////////
// LaTeX source2e

// \expandafter\let\expandafter\@normalcr
//     \csname\expandafter\@gobble\string\\ \endcsname
// \DeclareRobustCommand\newline{\@normalcr\relax}
defineMacro("\\newline", "\\\\\\relax");

// \def\TeX{T\kern-.1667em\lower.5ex\hbox{E}\kern-.125emX\@}
// TODO: Doesn't normally work in math mode because \@ fails.
defineMacro("\\TeX", "\\textrm{T}\\kern-.1667em\\raisebox{-.5ex}{E}\\kern-.125em\\textrm{X}");

defineMacro(
  "\\LaTeX",
    "\\textrm{L}\\kern-.35em\\raisebox{0.2em}{\\scriptstyle A}\\kern-.15em\\TeX"
);

defineMacro(
  "\\Temml",
  // eslint-disable-next-line max-len
  "\\textrm{T}\\kern-0.2em\\lower{0.2em}{\\textrm{E}}\\kern-0.08em{\\textrm{M}\\kern-0.08em\\raise{0.2em}\\textrm{M}\\kern-0.08em\\textrm{L}}"
);

// \DeclareRobustCommand\hspace{\@ifstar\@hspacer\@hspace}
// \def\@hspace#1{\hskip  #1\relax}
// \def\@hspacer#1{\vrule \@width\z@\nobreak
//                 \hskip #1\hskip \z@skip}
defineMacro("\\hspace", "\\@ifstar\\@hspacer\\@hspace");
defineMacro("\\@hspace", "\\hskip #1\\relax");
defineMacro("\\@hspacer", "\\rule{0pt}{0pt}\\hskip #1\\relax");

defineMacro("\\colon", `\\mathpunct{\\char"3a}`);

//////////////////////////////////////////////////////////////////////
// mathtools.sty

defineMacro("\\prescript", "\\pres@cript{_{#1}^{#2}}{}{#3}");

//\providecommand\ordinarycolon{:}
defineMacro("\\ordinarycolon", `\\char"3a`);
// Raise to center on the math axis, as closely as possible.
defineMacro("\\vcentcolon", "\\mathrel{\\raisebox{0.035em}{\\ordinarycolon}}");
// \providecommand*\coloneq{\vcentcolon\mathrel{\mkern-1.2mu}\mathrel{-}}
defineMacro("\\coloneq", '\\mathrel{\\raisebox{0.035em}{\\ordinarycolon}\\char"2212}');
// \providecommand*\Coloneq{\dblcolon\mathrel{\mkern-1.2mu}\mathrel{-}}
defineMacro("\\Coloneq", '\\mathrel{\\char"2237\\char"2212}');
// \providecommand*\Eqqcolon{=\mathrel{\mkern-1.2mu}\dblcolon}
defineMacro("\\Eqqcolon", '\\mathrel{\\char"3d\\char"2237}');
// \providecommand*\Eqcolon{\mathrel{-}\mathrel{\mkern-1.2mu}\dblcolon}
defineMacro("\\Eqcolon", '\\mathrel{\\char"2212\\char"2237}');
// \providecommand*\colonapprox{\vcentcolon\mathrel{\mkern-1.2mu}\approx}
defineMacro("\\colonapprox", '\\mathrel{\\raisebox{0.035em}{\\ordinarycolon}\\char"2248}');
// \providecommand*\Colonapprox{\dblcolon\mathrel{\mkern-1.2mu}\approx}
defineMacro("\\Colonapprox", '\\mathrel{\\char"2237\\char"2248}');
// \providecommand*\colonsim{\vcentcolon\mathrel{\mkern-1.2mu}\sim}
defineMacro("\\colonsim", '\\mathrel{\\raisebox{0.035em}{\\ordinarycolon}\\char"223c}');
// \providecommand*\Colonsim{\dblcolon\mathrel{\mkern-1.2mu}\sim}
defineMacro("\\Colonsim", '\\mathrel{\\raisebox{0.035em}{\\ordinarycolon}\\char"223c}');

//////////////////////////////////////////////////////////////////////
// colonequals.sty

// Alternate names for mathtools's macros:
defineMacro("\\ratio", "\\vcentcolon");
defineMacro("\\coloncolon", "\\dblcolon");
defineMacro("\\colonequals", "\\coloneqq");
defineMacro("\\coloncolonequals", "\\Coloneqq");
defineMacro("\\equalscolon", "\\eqqcolon");
defineMacro("\\equalscoloncolon", "\\Eqqcolon");
defineMacro("\\colonminus", "\\coloneq");
defineMacro("\\coloncolonminus", "\\Coloneq");
defineMacro("\\minuscolon", "\\eqcolon");
defineMacro("\\minuscoloncolon", "\\Eqcolon");
// \colonapprox name is same in mathtools and colonequals.
defineMacro("\\coloncolonapprox", "\\Colonapprox");
// \colonsim name is same in mathtools and colonequals.
defineMacro("\\coloncolonsim", "\\Colonsim");

// Present in newtxmath, pxfonts and txfonts
defineMacro("\\notni", "\\mathrel{\\char`\u220C}");
defineMacro("\\limsup", "\\DOTSB\\operatorname*{lim\\,sup}");
defineMacro("\\liminf", "\\DOTSB\\operatorname*{lim\\,inf}");

//////////////////////////////////////////////////////////////////////
// From amsopn.sty
defineMacro("\\injlim", "\\DOTSB\\operatorname*{inj\\,lim}");
defineMacro("\\projlim", "\\DOTSB\\operatorname*{proj\\,lim}");
defineMacro("\\varlimsup", "\\DOTSB\\operatorname*{\\overline{\\text{lim}}}");
defineMacro("\\varliminf", "\\DOTSB\\operatorname*{\\underline{\\text{lim}}}");
defineMacro("\\varinjlim", "\\DOTSB\\operatorname*{\\underrightarrow{\\text{lim}}}");
defineMacro("\\varprojlim", "\\DOTSB\\operatorname*{\\underleftarrow{\\text{lim}}}");

defineMacro("\\centerdot", "{\\medspace\\rule{0.167em}{0.189em}\\medspace}");

//////////////////////////////////////////////////////////////////////
// statmath.sty
// https://ctan.math.illinois.edu/macros/latex/contrib/statmath/statmath.pdf

defineMacro("\\argmin", "\\DOTSB\\operatorname*{arg\\,min}");
defineMacro("\\argmax", "\\DOTSB\\operatorname*{arg\\,max}");
defineMacro("\\plim", "\\DOTSB\\operatorname*{plim}");

//////////////////////////////////////////////////////////////////////
// MnSymbol.sty

defineMacro("\\leftmodels", "\\mathop{\\reflectbox{$\\models$}}");

//////////////////////////////////////////////////////////////////////
// braket.sty
// http://ctan.math.washington.edu/tex-archive/macros/latex/contrib/braket/braket.pdf

defineMacro("\\bra", "\\mathinner{\\langle{#1}|}");
defineMacro("\\ket", "\\mathinner{|{#1}\\rangle}");
defineMacro("\\braket", "\\mathinner{\\langle{#1}\\rangle}");
defineMacro("\\Bra", "\\left\\langle#1\\right|");
defineMacro("\\Ket", "\\left|#1\\right\\rangle");
// A helper for \Braket and \Set
const replaceVert = (argStr, match) => {
  const ch = match[0] === "|" ? "\\vert" : "\\Vert";
  const replaceStr = `}\\,\\middle${ch}\\,{`;
  return argStr.slice(0, match.index) + replaceStr + argStr.slice(match.index + match[0].length)
};
defineMacro("\\Braket",  function(context) {
  let argStr = recreateArgStr(context);
  const regEx = /\|\||\||\\\|/g;
  let match;
  while ((match = regEx.exec(argStr)) !== null) {
    argStr = replaceVert(argStr, match);
  }
  return "\\left\\langle{" + argStr + "}\\right\\rangle"
});
defineMacro("\\Set",  function(context) {
  let argStr = recreateArgStr(context);
  const match = /\|\||\||\\\|/.exec(argStr);
  if (match) {
    argStr = replaceVert(argStr, match);
  }
  return "\\left\\{\\:{" + argStr + "}\\:\\right\\}"
});
defineMacro("\\set",  function(context) {
  const argStr = recreateArgStr(context);
  return "\\{{" + argStr.replace(/\|/, "}\\mid{") + "}\\}"
});

//////////////////////////////////////////////////////////////////////
// actuarialangle.dtx
defineMacro("\\angln", "{\\angl n}");

//////////////////////////////////////////////////////////////////////
// derivative.sty
defineMacro("\\odv", "\\@ifstar\\odv@next\\odv@numerator");
defineMacro("\\odv@numerator", "\\frac{\\mathrm{d}#1}{\\mathrm{d}#2}");
defineMacro("\\odv@next", "\\frac{\\mathrm{d}}{\\mathrm{d}#2}#1");
defineMacro("\\pdv", "\\@ifstar\\pdv@next\\pdv@numerator");

const pdvHelper = args => {
  const numerator = args[0][0].text;
  const denoms = stringFromArg(args[1]).split(",");
  const power = String(denoms.length);
  const numOp = power === "1" ? "\\partial" : `\\partial^${power}`;
  let denominator = "";
  denoms.map(e => { denominator += "\\partial " + e.trim() +  "\\,";});
  return [numerator, numOp,  denominator.replace(/\\,$/, "")]
};
defineMacro("\\pdv@numerator", function(context) {
  const [numerator, numOp, denominator] = pdvHelper(context.consumeArgs(2));
  return `\\frac{${numOp} ${numerator}}{${denominator}}`
});
defineMacro("\\pdv@next", function(context) {
  const [numerator, numOp, denominator] = pdvHelper(context.consumeArgs(2));
  return `\\frac{${numOp}}{${denominator}} ${numerator}`
});

//////////////////////////////////////////////////////////////////////
// upgreek.dtx
defineMacro("\\upalpha", "\\up@greek{\\alpha}");
defineMacro("\\upbeta", "\\up@greek{\\beta}");
defineMacro("\\upgamma", "\\up@greek{\\gamma}");
defineMacro("\\updelta", "\\up@greek{\\delta}");
defineMacro("\\upepsilon", "\\up@greek{\\epsilon}");
defineMacro("\\upzeta", "\\up@greek{\\zeta}");
defineMacro("\\upeta", "\\up@greek{\\eta}");
defineMacro("\\uptheta", "\\up@greek{\\theta}");
defineMacro("\\upiota", "\\up@greek{\\iota}");
defineMacro("\\upkappa", "\\up@greek{\\kappa}");
defineMacro("\\uplambda", "\\up@greek{\\lambda}");
defineMacro("\\upmu", "\\up@greek{\\mu}");
defineMacro("\\upnu", "\\up@greek{\\nu}");
defineMacro("\\upxi", "\\up@greek{\\xi}");
defineMacro("\\upomicron", "\\up@greek{\\omicron}");
defineMacro("\\uppi", "\\up@greek{\\pi}");
defineMacro("\\upalpha", "\\up@greek{\\alpha}");
defineMacro("\\uprho", "\\up@greek{\\rho}");
defineMacro("\\upsigma", "\\up@greek{\\sigma}");
defineMacro("\\uptau", "\\up@greek{\\tau}");
defineMacro("\\upupsilon", "\\up@greek{\\upsilon}");
defineMacro("\\upphi", "\\up@greek{\\phi}");
defineMacro("\\upchi", "\\up@greek{\\chi}");
defineMacro("\\uppsi", "\\up@greek{\\psi}");
defineMacro("\\upomega", "\\up@greek{\\omega}");

//////////////////////////////////////////////////////////////////////
// cmll package
defineMacro("\\invamp", '\\mathbin{\\char"214b}');
defineMacro("\\parr", '\\mathbin{\\char"214b}');
defineMacro("\\with", '\\mathbin{\\char"26}');
defineMacro("\\multimapinv", '\\mathrel{\\char"27dc}');
defineMacro("\\multimapboth", '\\mathrel{\\char"29df}');
defineMacro("\\scoh", '{\\mkern5mu\\char"2322\\mkern5mu}');
defineMacro("\\sincoh", '{\\mkern5mu\\char"2323\\mkern5mu}');
defineMacro("\\coh", `{\\mkern5mu\\rule{}{0.7em}\\mathrlap{\\smash{\\raise2mu{\\char"2322}}}
{\\smash{\\lower4mu{\\char"2323}}}\\mkern5mu}`);
defineMacro("\\incoh", `{\\mkern5mu\\rule{}{0.7em}\\mathrlap{\\smash{\\raise2mu{\\char"2323}}}
{\\smash{\\lower4mu{\\char"2322}}}\\mkern5mu}`);


//////////////////////////////////////////////////////////////////////
// chemstyle package
defineMacro("\\standardstate", "\\text{\\tiny\\char`⦵}");

﻿/* eslint-disable */
/* -*- Mode: JavaScript; indent-tabs-mode:nil; js-indent-level: 2 -*- */
/* vim: set ts=2 et sw=2 tw=80: */

/*************************************************************
 *
 *  Temml mhchem.js
 *
 *  This file implements a Temml version of mhchem version 3.3.0.
 *  It is adapted from MathJax/extensions/TeX/mhchem.js
 *  It differs from the MathJax version as follows:
 *    1. The interface is changed so that it can be called from Temml, not MathJax.
 *    2. \rlap and \llap are replaced with \mathrlap and \mathllap.
 *    3. The reaction arrow code is simplified. All reaction arrows are rendered
 *       using Temml extensible arrows instead of building non-extensible arrows.
 *    4. The ~bond forms are composed entirely of \rule elements.
 *    5. Two dashes in _getBond are wrapped in braces to suppress spacing. i.e., {-}
 *    6. The electron dot uses \textbullet instead of \bullet.
 *    7. \smash[T] has been removed. (WebKit hides anything inside \smash{…})
 *
 *    This code, as other Temml code, is released under the MIT license.
 * 
 * /*************************************************************
 *
 *  MathJax/extensions/TeX/mhchem.js
 *
 *  Implements the \ce command for handling chemical formulas
 *  from the mhchem LaTeX package.
 *
 *  ---------------------------------------------------------------------
 *
 *  Copyright (c) 2011-2015 The MathJax Consortium
 *  Copyright (c) 2015-2018 Martin Hensel
 *
 *  Licensed under the Apache License, Version 2.0 (the "License");
 *  you may not use this file except in compliance with the License.
 *  You may obtain a copy of the License at
 *
 *      http://www.apache.org/licenses/LICENSE-2.0
 *
 *  Unless required by applicable law or agreed to in writing, software
 *  distributed under the License is distributed on an "AS IS" BASIS,
 *  WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 *  See the License for the specific language governing permissions and
 *  limitations under the License.
 */

//
// Coding Style
//   - use '' for identifiers that can by minified/uglified
//   - use "" for strings that need to stay untouched

// version: "3.3.0" for MathJax and Temml


// Add \ce, \pu, and \tripleDash to the Temml macros.

defineMacro("\\ce", function(context) {
  return chemParse(context.consumeArgs(1)[0], "ce")
});

defineMacro("\\pu", function(context) {
  return chemParse(context.consumeArgs(1)[0], "pu");
});

// Math fonts do not include glyphs for the ~ form of bonds. So we'll send path geometry
// So we'll compose characters built from \rule elements.
defineMacro("\\uniDash", `{\\rule{0.672em}{0.06em}}`);
defineMacro("\\triDash", `{\\rule{0.15em}{0.06em}\\kern2mu\\rule{0.15em}{0.06em}\\kern2mu\\rule{0.15em}{0.06em}}`);
defineMacro("\\tripleDash", `\\kern0.075em\\raise0.25em{\\triDash}\\kern0.075em`);
defineMacro("\\tripleDashOverLine", `\\kern0.075em\\mathrlap{\\raise0.125em{\\uniDash}}\\raise0.34em{\\triDash}\\kern0.075em`);
defineMacro("\\tripleDashOverDoubleLine", `\\kern0.075em\\mathrlap{\\mathrlap{\\raise0.48em{\\triDash}}\\raise0.27em{\\uniDash}}{\\raise0.05em{\\uniDash}}\\kern0.075em`);
defineMacro("\\tripleDashBetweenDoubleLine", `\\kern0.075em\\mathrlap{\\mathrlap{\\raise0.48em{\\uniDash}}\\raise0.27em{\\triDash}}{\\raise0.05em{\\uniDash}}\\kern0.075em`);

  //
  //  This is the main function for handing the \ce and \pu commands.
  //  It takes the argument to \ce or \pu and returns the corresponding TeX string.
  //

  var chemParse = function (tokens, stateMachine) {
    // Recreate the argument string from Temml's array of tokens.
    var str = "";
    var expectedLoc = tokens.length && tokens[tokens.length - 1].loc.start;
    for (var i = tokens.length - 1; i >= 0; i--) {
      if(tokens[i].loc.start > expectedLoc) {
        // context.consumeArgs has eaten a space.
        str += " ";
        expectedLoc = tokens[i].loc.start;
      }
      str += tokens[i].text;
      expectedLoc += tokens[i].text.length;
    }
    // Call the mhchem core parser.
    var tex = texify.go(mhchemParser.go(str, stateMachine));
    return tex;
  };

  //
  // Core parser for mhchem syntax  (recursive)
  //
  /** @type {MhchemParser} */
  var mhchemParser = {
    //
    // Parses mchem \ce syntax
    //
    // Call like
    //   go("H2O");
    //
    go: function (input, stateMachine) {
      if (!input) { return []; }
      if (stateMachine === undefined) { stateMachine = 'ce'; }
      var state = '0';

      //
      // String buffers for parsing:
      //
      // buffer.a == amount
      // buffer.o == element
      // buffer.b == left-side superscript
      // buffer.p == left-side subscript
      // buffer.q == right-side subscript
      // buffer.d == right-side superscript
      //
      // buffer.r == arrow
      // buffer.rdt == arrow, script above, type
      // buffer.rd == arrow, script above, content
      // buffer.rqt == arrow, script below, type
      // buffer.rq == arrow, script below, content
      //
      // buffer.text_
      // buffer.rm
      // etc.
      //
      // buffer.parenthesisLevel == int, starting at 0
      // buffer.sb == bool, space before
      // buffer.beginsWithBond == bool
      //
      // These letters are also used as state names.
      //
      // Other states:
      // 0 == begin of main part (arrow/operator unlikely)
      // 1 == next entity
      // 2 == next entity (arrow/operator unlikely)
      // 3 == next atom
      // c == macro
      //
      /** @type {Buffer} */
      var buffer = {};
      buffer['parenthesisLevel'] = 0;

      input = input.replace(/\n/g, " ");
      input = input.replace(/[\u2212\u2013\u2014\u2010]/g, "-");
      input = input.replace(/[\u2026]/g, "...");

      //
      // Looks through mhchemParser.transitions, to execute a matching action
      // (recursive)
      //
      var lastInput;
      var watchdog = 10;
      /** @type {ParserOutput[]} */
      var output = [];
      while (true) {
        if (lastInput !== input) {
          watchdog = 10;
          lastInput = input;
        } else {
          watchdog--;
        }
        //
        // Find actions in transition table
        //
        var machine = mhchemParser.stateMachines[stateMachine];
        var t = machine.transitions[state] || machine.transitions['*'];
        iterateTransitions:
        for (var i=0; i<t.length; i++) {
          var matches = mhchemParser.patterns.match_(t[i].pattern, input);
          if (matches) {
            //
            // Execute actions
            //
            var task = t[i].task;
            for (var iA=0; iA<task.action_.length; iA++) {
              var o;
              //
              // Find and execute action
              //
              if (machine.actions[task.action_[iA].type_]) {
                o = machine.actions[task.action_[iA].type_](buffer, matches.match_, task.action_[iA].option);
              } else if (mhchemParser.actions[task.action_[iA].type_]) {
                o = mhchemParser.actions[task.action_[iA].type_](buffer, matches.match_, task.action_[iA].option);
              } else {
                throw ["MhchemBugA", "mhchem bug A. Please report. (" + task.action_[iA].type_ + ")"];  // Trying to use non-existing action
              }
              //
              // Add output
              //
              mhchemParser.concatArray(output, o);
            }
            //
            // Set next state,
            // Shorten input,
            // Continue with next character
            //   (= apply only one transition per position)
            //
            state = task.nextState || state;
            if (input.length > 0) {
              if (!task.revisit) {
                input = matches.remainder;
              }
              if (!task.toContinue) {
                break iterateTransitions;
              }
            } else {
              return output;
            }
          }
        }
        //
        // Prevent infinite loop
        //
        if (watchdog <= 0) {
          throw ["MhchemBugU", "mhchem bug U. Please report."];  // Unexpected character
        }
      }
    },
    concatArray: function (a, b) {
      if (b) {
        if (Array.isArray(b)) {
          for (var iB=0; iB<b.length; iB++) {
            a.push(b[iB]);
          }
        } else {
          a.push(b);
        }
      }
    },

    patterns: {
      //
      // Matching patterns
      // either regexps or function that return null or {match_:"a", remainder:"bc"}
      //
      patterns: {
        // property names must not look like integers ("2") for correct property traversal order, later on
        'empty': /^$/,
        'else': /^./,
        'else2': /^./,
        'space': /^\s/,
        'space A': /^\s(?=[A-Z\\$])/,
        'space$': /^\s$/,
        'a-z': /^[a-z]/,
        'x': /^x/,
        'x$': /^x$/,
        'i$': /^i$/,
        'letters': /^(?:[a-zA-Z\u03B1-\u03C9\u0391-\u03A9?@]|(?:\\(?:alpha|beta|gamma|delta|epsilon|zeta|eta|theta|iota|kappa|lambda|mu|nu|xi|omicron|pi|rho|sigma|tau|upsilon|phi|chi|psi|omega|Gamma|Delta|Theta|Lambda|Xi|Pi|Sigma|Upsilon|Phi|Psi|Omega)(?:\s+|\{\}|(?![a-zA-Z]))))+/,
        '\\greek': /^\\(?:alpha|beta|gamma|delta|epsilon|zeta|eta|theta|iota|kappa|lambda|mu|nu|xi|omicron|pi|rho|sigma|tau|upsilon|phi|chi|psi|omega|Gamma|Delta|Theta|Lambda|Xi|Pi|Sigma|Upsilon|Phi|Psi|Omega)(?:\s+|\{\}|(?![a-zA-Z]))/,
        'one lowercase latin letter $': /^(?:([a-z])(?:$|[^a-zA-Z]))$/,
        '$one lowercase latin letter$ $': /^\$(?:([a-z])(?:$|[^a-zA-Z]))\$$/,
        'one lowercase greek letter $': /^(?:\$?[\u03B1-\u03C9]\$?|\$?\\(?:alpha|beta|gamma|delta|epsilon|zeta|eta|theta|iota|kappa|lambda|mu|nu|xi|omicron|pi|rho|sigma|tau|upsilon|phi|chi|psi|omega)\s*\$?)(?:\s+|\{\}|(?![a-zA-Z]))$/,
        'digits': /^[0-9]+/,
        '-9.,9': /^[+\-]?(?:[0-9]+(?:[,.][0-9]+)?|[0-9]*(?:\.[0-9]+))/,
        '-9.,9 no missing 0': /^[+\-]?[0-9]+(?:[.,][0-9]+)?/,
        '(-)(9.,9)(e)(99)': function (input) {
          var m = input.match(/^(\+\-|\+\/\-|\+|\-|\\pm\s?)?([0-9]+(?:[,.][0-9]+)?|[0-9]*(?:\.[0-9]+))?(\((?:[0-9]+(?:[,.][0-9]+)?|[0-9]*(?:\.[0-9]+))\))?(?:([eE]|\s*(\*|x|\\times|\u00D7)\s*10\^)([+\-]?[0-9]+|\{[+\-]?[0-9]+\}))?/);
          if (m && m[0]) {
            return { match_: m.splice(1), remainder: input.substr(m[0].length) };
          }
          return null;
        },
        '(-)(9)^(-9)': function (input) {
          var m = input.match(/^(\+\-|\+\/\-|\+|\-|\\pm\s?)?([0-9]+(?:[,.][0-9]+)?|[0-9]*(?:\.[0-9]+)?)\^([+\-]?[0-9]+|\{[+\-]?[0-9]+\})/);
          if (m && m[0]) {
            return { match_: m.splice(1), remainder: input.substr(m[0].length) };
          }
          return null;
        },
        'state of aggregation $': function (input) {  // ... or crystal system
          var a = mhchemParser.patterns.findObserveGroups(input, "", /^\([a-z]{1,3}(?=[\),])/, ")", "");  // (aq), (aq,$\infty$), (aq, sat)
          if (a  &&  a.remainder.match(/^($|[\s,;\)\]\}])/)) { return a; }  //  AND end of 'phrase'
          var m = input.match(/^(?:\((?:\\ca\s?)?\$[amothc]\$\))/);  // OR crystal system ($o$) (\ca$c$)
          if (m) {
            return { match_: m[0], remainder: input.substr(m[0].length) };
          }
          return null;
        },
        '_{(state of aggregation)}$': /^_\{(\([a-z]{1,3}\))\}/,
        '{[(': /^(?:\\\{|\[|\()/,
        ')]}': /^(?:\)|\]|\\\})/,
        ', ': /^[,;]\s*/,
        ',': /^[,;]/,
        '.': /^[.]/,
        '. ': /^([.\u22C5\u00B7\u2022])\s*/,
        '...': /^\.\.\.(?=$|[^.])/,
        '* ': /^([*])\s*/,
        '^{(...)}': function (input) { return mhchemParser.patterns.findObserveGroups(input, "^{", "", "", "}"); },
        '^($...$)': function (input) { return mhchemParser.patterns.findObserveGroups(input, "^", "$", "$", ""); },
        '^a': /^\^([0-9]+|[^\\_])/,
        '^\\x{}{}': function (input) { return mhchemParser.patterns.findObserveGroups(input, "^", /^\\[a-zA-Z]+\{/, "}", "", "", "{", "}", "", true); },
        '^\\x{}': function (input) { return mhchemParser.patterns.findObserveGroups(input, "^", /^\\[a-zA-Z]+\{/, "}", ""); },
        '^\\x': /^\^(\\[a-zA-Z]+)\s*/,
        '^(-1)': /^\^(-?\d+)/,
        '\'': /^'/,
        '_{(...)}': function (input) { return mhchemParser.patterns.findObserveGroups(input, "_{", "", "", "}"); },
        '_($...$)': function (input) { return mhchemParser.patterns.findObserveGroups(input, "_", "$", "$", ""); },
        '_9': /^_([+\-]?[0-9]+|[^\\])/,
        '_\\x{}{}': function (input) { return mhchemParser.patterns.findObserveGroups(input, "_", /^\\[a-zA-Z]+\{/, "}", "", "", "{", "}", "", true); },
        '_\\x{}': function (input) { return mhchemParser.patterns.findObserveGroups(input, "_", /^\\[a-zA-Z]+\{/, "}", ""); },
        '_\\x': /^_(\\[a-zA-Z]+)\s*/,
        '^_': /^(?:\^(?=_)|\_(?=\^)|[\^_]$)/,
        '{}': /^\{\}/,
        '{...}': function (input) { return mhchemParser.patterns.findObserveGroups(input, "", "{", "}", ""); },
        '{(...)}': function (input) { return mhchemParser.patterns.findObserveGroups(input, "{", "", "", "}"); },
        '$...$': function (input) { return mhchemParser.patterns.findObserveGroups(input, "", "$", "$", ""); },
        '${(...)}$': function (input) { return mhchemParser.patterns.findObserveGroups(input, "${", "", "", "}$"); },
        '$(...)$': function (input) { return mhchemParser.patterns.findObserveGroups(input, "$", "", "", "$"); },
        '=<>': /^[=<>]/,
        '#': /^[#\u2261]/,
        '+': /^\+/,
        '-$': /^-(?=[\s_},;\]/]|$|\([a-z]+\))/,  // -space -, -; -] -/ -$ -state-of-aggregation
        '-9': /^-(?=[0-9])/,
        '- orbital overlap': /^-(?=(?:[spd]|sp)(?:$|[\s,;\)\]\}]))/,
        '-': /^-/,
        'pm-operator': /^(?:\\pm|\$\\pm\$|\+-|\+\/-)/,
        'operator': /^(?:\+|(?:[\-=<>]|<<|>>|\\approx|\$\\approx\$)(?=\s|$|-?[0-9]))/,
        'arrowUpDown': /^(?:v|\(v\)|\^|\(\^\))(?=$|[\s,;\)\]\}])/,
        '\\bond{(...)}': function (input) { return mhchemParser.patterns.findObserveGroups(input, "\\bond{", "", "", "}"); },
        '->': /^(?:<->|<-->|->|<-|<=>>|<<=>|<=>|[\u2192\u27F6\u21CC])/,
        'CMT': /^[CMT](?=\[)/,
        '[(...)]': function (input) { return mhchemParser.patterns.findObserveGroups(input, "[", "", "", "]"); },
        '1st-level escape': /^(&|\\\\|\\hline)\s*/,
        '\\,': /^(?:\\[,\ ;:])/,  // \\x - but output no space before
        '\\x{}{}': function (input) { return mhchemParser.patterns.findObserveGroups(input, "", /^\\[a-zA-Z]+\{/, "}", "", "", "{", "}", "", true); },
        '\\x{}': function (input) { return mhchemParser.patterns.findObserveGroups(input, "", /^\\[a-zA-Z]+\{/, "}", ""); },
        '\\ca': /^\\ca(?:\s+|(?![a-zA-Z]))/,
        '\\x': /^(?:\\[a-zA-Z]+\s*|\\[_&{}%])/,
        'orbital': /^(?:[0-9]{1,2}[spdfgh]|[0-9]{0,2}sp)(?=$|[^a-zA-Z])/,  // only those with numbers in front, because the others will be formatted correctly anyway
        'others': /^[\/~|]/,
        '\\frac{(...)}': function (input) { return mhchemParser.patterns.findObserveGroups(input, "\\frac{", "", "", "}", "{", "", "", "}"); },
        '\\overset{(...)}': function (input) { return mhchemParser.patterns.findObserveGroups(input, "\\overset{", "", "", "}", "{", "", "", "}"); },
        '\\underset{(...)}': function (input) { return mhchemParser.patterns.findObserveGroups(input, "\\underset{", "", "", "}", "{", "", "", "}"); },
        '\\underbrace{(...)}': function (input) { return mhchemParser.patterns.findObserveGroups(input, "\\underbrace{", "", "", "}_", "{", "", "", "}"); },
        '\\color{(...)}0': function (input) { return mhchemParser.patterns.findObserveGroups(input, "\\color{", "", "", "}"); },
        '\\color{(...)}{(...)}1': function (input) { return mhchemParser.patterns.findObserveGroups(input, "\\color{", "", "", "}", "{", "", "", "}"); },
        '\\color(...){(...)}2': function (input) { return mhchemParser.patterns.findObserveGroups(input, "\\color", "\\", "", /^(?=\{)/, "{", "", "", "}"); },
        '\\ce{(...)}': function (input) { return mhchemParser.patterns.findObserveGroups(input, "\\ce{", "", "", "}"); },
        'oxidation$': /^(?:[+-][IVX]+|\\pm\s*0|\$\\pm\$\s*0)$/,
        'd-oxidation$': /^(?:[+-]?\s?[IVX]+|\\pm\s*0|\$\\pm\$\s*0)$/,  // 0 could be oxidation or charge
        'roman numeral': /^[IVX]+/,
        '1/2$': /^[+\-]?(?:[0-9]+|\$[a-z]\$|[a-z])\/[0-9]+(?:\$[a-z]\$|[a-z])?$/,
        'amount': function (input) {
          var match;
          // e.g. 2, 0.5, 1/2, -2, n/2, +;  $a$ could be added later in parsing
          match = input.match(/^(?:(?:(?:\([+\-]?[0-9]+\/[0-9]+\)|[+\-]?(?:[0-9]+|\$[a-z]\$|[a-z])\/[0-9]+|[+\-]?[0-9]+[.,][0-9]+|[+\-]?\.[0-9]+|[+\-]?[0-9]+)(?:[a-z](?=\s*[A-Z]))?)|[+\-]?[a-z](?=\s*[A-Z])|\+(?!\s))/);
          if (match) {
            return { match_: match[0], remainder: input.substr(match[0].length) };
          }
          var a = mhchemParser.patterns.findObserveGroups(input, "", "$", "$", "");
          if (a) {  // e.g. $2n-1$, $-$
            match = a.match_.match(/^\$(?:\(?[+\-]?(?:[0-9]*[a-z]?[+\-])?[0-9]*[a-z](?:[+\-][0-9]*[a-z]?)?\)?|\+|-)\$$/);
            if (match) {
              return { match_: match[0], remainder: input.substr(match[0].length) };
            }
          }
          return null;
        },
        'amount2': function (input) { return this['amount'](input); },
        '(KV letters),': /^(?:[A-Z][a-z]{0,2}|i)(?=,)/,
        'formula$': function (input) {
          if (input.match(/^\([a-z]+\)$/)) { return null; }  // state of aggregation = no formula
          var match = input.match(/^(?:[a-z]|(?:[0-9\ \+\-\,\.\(\)]+[a-z])+[0-9\ \+\-\,\.\(\)]*|(?:[a-z][0-9\ \+\-\,\.\(\)]+)+[a-z]?)$/);
          if (match) {
            return { match_: match[0], remainder: input.substr(match[0].length) };
          }
          return null;
        },
        'uprightEntities': /^(?:pH|pOH|pC|pK|iPr|iBu)(?=$|[^a-zA-Z])/,
        '/': /^\s*(\/)\s*/,
        '//': /^\s*(\/\/)\s*/,
        '*': /^\s*[*.]\s*/
      },
      findObserveGroups: function (input, begExcl, begIncl, endIncl, endExcl, beg2Excl, beg2Incl, end2Incl, end2Excl, combine) {
        /** @type {{(input: string, pattern: string | RegExp): string | string[] | null;}} */
        var _match = function (input, pattern) {
          if (typeof pattern === "string") {
            if (input.indexOf(pattern) !== 0) { return null; }
            return pattern;
          } else {
            var match = input.match(pattern);
            if (!match) { return null; }
            return match[0];
          }
        };
        /** @type {{(input: string, i: number, endChars: string | RegExp): {endMatchBegin: number, endMatchEnd: number} | null;}} */
        var _findObserveGroups = function (input, i, endChars) {
          var braces = 0;
          while (i < input.length) {
            var a = input.charAt(i);
            var match = _match(input.substr(i), endChars);
            if (match !== null  &&  braces === 0) {
              return { endMatchBegin: i, endMatchEnd: i + match.length };
            } else if (a === "{") {
              braces++;
            } else if (a === "}") {
              if (braces === 0) {
                throw ["ExtraCloseMissingOpen", "Extra close brace or missing open brace"];
              } else {
                braces--;
              }
            }
            i++;
          }
          if (braces > 0) {
            return null;
          }
          return null;
        };
        var match = _match(input, begExcl);
        if (match === null) { return null; }
        input = input.substr(match.length);
        match = _match(input, begIncl);
        if (match === null) { return null; }
        var e = _findObserveGroups(input, match.length, endIncl || endExcl);
        if (e === null) { return null; }
        var match1 = input.substring(0, (endIncl ? e.endMatchEnd : e.endMatchBegin));
        if (!(beg2Excl || beg2Incl)) {
          return {
            match_: match1,
            remainder: input.substr(e.endMatchEnd)
          };
        } else {
          var group2 = this.findObserveGroups(input.substr(e.endMatchEnd), beg2Excl, beg2Incl, end2Incl, end2Excl);
          if (group2 === null) { return null; }
          /** @type {string[]} */
          var matchRet = [match1, group2.match_];
          return {
            match_: (combine ? matchRet.join("") : matchRet),
            remainder: group2.remainder
          };
        }
      },

      //
      // Matching function
      // e.g. match("a", input) will look for the regexp called "a" and see if it matches
      // returns null or {match_:"a", remainder:"bc"}
      //
      match_: function (m, input) {
        var pattern = mhchemParser.patterns.patterns[m];
        if (pattern === undefined) {
          throw ["MhchemBugP", "mhchem bug P. Please report. (" + m + ")"];  // Trying to use non-existing pattern
        } else if (typeof pattern === "function") {
          return mhchemParser.patterns.patterns[m](input);  // cannot use cached var pattern here, because some pattern functions need this===mhchemParser
        } else {  // RegExp
          var match = input.match(pattern);
          if (match) {
            var mm;
            if (match[2]) {
              mm = [ match[1], match[2] ];
            } else if (match[1]) {
              mm = match[1];
            } else {
              mm = match[0];
            }
            return { match_: mm, remainder: input.substr(match[0].length) };
          }
          return null;
        }
      }
    },

    //
    // Generic state machine actions
    //
    actions: {
      'a=': function (buffer, m) { buffer.a = (buffer.a || "") + m; },
      'b=': function (buffer, m) { buffer.b = (buffer.b || "") + m; },
      'p=': function (buffer, m) { buffer.p = (buffer.p || "") + m; },
      'o=': function (buffer, m) { buffer.o = (buffer.o || "") + m; },
      'q=': function (buffer, m) { buffer.q = (buffer.q || "") + m; },
      'd=': function (buffer, m) { buffer.d = (buffer.d || "") + m; },
      'rm=': function (buffer, m) { buffer.rm = (buffer.rm || "") + m; },
      'text=': function (buffer, m) { buffer.text_ = (buffer.text_ || "") + m; },
      'insert': function (buffer, m, a) { return { type_: a }; },
      'insert+p1': function (buffer, m, a) { return { type_: a, p1: m }; },
      'insert+p1+p2': function (buffer, m, a) { return { type_: a, p1: m[0], p2: m[1] }; },
      'copy': function (buffer, m) { return m; },
      'rm': function (buffer, m) { return { type_: 'rm', p1: m || ""}; },
      'text': function (buffer, m) { return mhchemParser.go(m, 'text'); },
      '{text}': function (buffer, m) {
        var ret = [ "{" ];
        mhchemParser.concatArray(ret, mhchemParser.go(m, 'text'));
        ret.push("}");
        return ret;
      },
      'tex-math': function (buffer, m) { return mhchemParser.go(m, 'tex-math'); },
      'tex-math tight': function (buffer, m) { return mhchemParser.go(m, 'tex-math tight'); },
      'bond': function (buffer, m, k) { return { type_: 'bond', kind_: k || m }; },
      'color0-output': function (buffer, m) { return { type_: 'color0', color: m[0] }; },
      'ce': function (buffer, m) { return mhchemParser.go(m); },
      '1/2': function (buffer, m) {
        /** @type {ParserOutput[]} */
        var ret = [];
        if (m.match(/^[+\-]/)) {
          ret.push(m.substr(0, 1));
          m = m.substr(1);
        }
        var n = m.match(/^([0-9]+|\$[a-z]\$|[a-z])\/([0-9]+)(\$[a-z]\$|[a-z])?$/);
        n[1] = n[1].replace(/\$/g, "");
        ret.push({ type_: 'frac', p1: n[1], p2: n[2] });
        if (n[3]) {
          n[3] = n[3].replace(/\$/g, "");
          ret.push({ type_: 'tex-math', p1: n[3] });
        }
        return ret;
      },
      '9,9': function (buffer, m) { return mhchemParser.go(m, '9,9'); }
    },
    //
    // createTransitions
    // convert  { 'letter': { 'state': { action_: 'output' } } }  to  { 'state' => [ { pattern: 'letter', task: { action_: [{type_: 'output'}] } } ] }
    // with expansion of 'a|b' to 'a' and 'b' (at 2 places)
    //
    createTransitions: function (o) {
      var pattern, state;
      /** @type {string[]} */
      var stateArray;
      var i;
      //
      // 1. Collect all states
      //
      /** @type {Transitions} */
      var transitions = {};
      for (pattern in o) {
        for (state in o[pattern]) {
          stateArray = state.split("|");
          o[pattern][state].stateArray = stateArray;
          for (i=0; i<stateArray.length; i++) {
            transitions[stateArray[i]] = [];
          }
        }
      }
      //
      // 2. Fill states
      //
      for (pattern in o) {
        for (state in o[pattern]) {
          stateArray = o[pattern][state].stateArray || [];
          for (i=0; i<stateArray.length; i++) {
            //
            // 2a. Normalize actions into array:  'text=' ==> [{type_:'text='}]
            // (Note to myself: Resolving the function here would be problematic. It would need .bind (for *this*) and currying (for *option*).)
            //
            /** @type {any} */
            var p = o[pattern][state];
            if (p.action_) {
              p.action_ = [].concat(p.action_);
              for (var k=0; k<p.action_.length; k++) {
                if (typeof p.action_[k] === "string") {
                  p.action_[k] = { type_: p.action_[k] };
                }
              }
            } else {
              p.action_ = [];
            }
            //
            // 2.b Multi-insert
            //
            var patternArray = pattern.split("|");
            for (var j=0; j<patternArray.length; j++) {
              if (stateArray[i] === '*') {  // insert into all
                for (var t in transitions) {
                  transitions[t].push({ pattern: patternArray[j], task: p });
                }
              } else {
                transitions[stateArray[i]].push({ pattern: patternArray[j], task: p });
              }
            }
          }
        }
      }
      return transitions;
    },
    stateMachines: {}
  };

  //
  // Definition of state machines
  //
  mhchemParser.stateMachines = {
    //
    // \ce state machines
    //
    //#region ce
    'ce': {  // main parser
      transitions: mhchemParser.createTransitions({
        'empty': {
          '*': { action_: 'output' } },
        'else':  {
          '0|1|2': { action_: 'beginsWithBond=false', revisit: true, toContinue: true } },
        'oxidation$': {
          '0': { action_: 'oxidation-output' } },
        'CMT': {
          'r': { action_: 'rdt=', nextState: 'rt' },
          'rd': { action_: 'rqt=', nextState: 'rdt' } },
        'arrowUpDown': {
          '0|1|2|as': { action_: [ 'sb=false', 'output', 'operator' ], nextState: '1' } },
        'uprightEntities': {
          '0|1|2': { action_: [ 'o=', 'output' ], nextState: '1' } },
        'orbital': {
          '0|1|2|3': { action_: 'o=', nextState: 'o' } },
        '->': {
          '0|1|2|3': { action_: 'r=', nextState: 'r' },
          'a|as': { action_: [ 'output', 'r=' ], nextState: 'r' },
          '*': { action_: [ 'output', 'r=' ], nextState: 'r' } },
        '+': {
          'o': { action_: 'd= kv',  nextState: 'd' },
          'd|D': { action_: 'd=', nextState: 'd' },
          'q': { action_: 'd=',  nextState: 'qd' },
          'qd|qD': { action_: 'd=', nextState: 'qd' },
          'dq': { action_: [ 'output', 'd=' ], nextState: 'd' },
          '3': { action_: [ 'sb=false', 'output', 'operator' ], nextState: '0' } },
        'amount': {
          '0|2': { action_: 'a=', nextState: 'a' } },
        'pm-operator': {
          '0|1|2|a|as': { action_: [ 'sb=false', 'output', { type_: 'operator', option: '\\pm' } ], nextState: '0' } },
        'operator': {
          '0|1|2|a|as': { action_: [ 'sb=false', 'output', 'operator' ], nextState: '0' } },
        '-$': {
          'o|q': { action_: [ 'charge or bond', 'output' ],  nextState: 'qd' },
          'd': { action_: 'd=', nextState: 'd' },
          'D': { action_: [ 'output', { type_: 'bond', option: "-" } ], nextState: '3' },
          'q': { action_: 'd=',  nextState: 'qd' },
          'qd': { action_: 'd=', nextState: 'qd' },
          'qD|dq': { action_: [ 'output', { type_: 'bond', option: "-" } ], nextState: '3' } },
        '-9': {
          '3|o': { action_: [ 'output', { type_: 'insert', option: 'hyphen' } ], nextState: '3' } },
        '- orbital overlap': {
          'o': { action_: [ 'output', { type_: 'insert', option: 'hyphen' } ], nextState: '2' },
          'd': { action_: [ 'output', { type_: 'insert', option: 'hyphen' } ], nextState: '2' } },
        '-': {
          '0|1|2': { action_: [ { type_: 'output', option: 1 }, 'beginsWithBond=true', { type_: 'bond', option: "-" } ], nextState: '3' },
          '3': { action_: { type_: 'bond', option: "-" } },
          'a': { action_: [ 'output', { type_: 'insert', option: 'hyphen' } ], nextState: '2' },
          'as': { action_: [ { type_: 'output', option: 2 }, { type_: 'bond', option: "-" } ], nextState: '3' },
          'b': { action_: 'b=' },
          'o': { action_: { type_: '- after o/d', option: false }, nextState: '2' },
          'q': { action_: { type_: '- after o/d', option: false }, nextState: '2' },
          'd|qd|dq': { action_: { type_: '- after o/d', option: true }, nextState: '2' },
          'D|qD|p': { action_: [ 'output', { type_: 'bond', option: "-" } ], nextState: '3' } },
        'amount2': {
          '1|3': { action_: 'a=', nextState: 'a' } },
        'letters': {
          '0|1|2|3|a|as|b|p|bp|o': { action_: 'o=', nextState: 'o' },
          'q|dq': { action_: ['output', 'o='], nextState: 'o' },
          'd|D|qd|qD': { action_: 'o after d', nextState: 'o' } },
        'digits': {
          'o': { action_: 'q=', nextState: 'q' },
          'd|D': { action_: 'q=', nextState: 'dq' },
          'q': { action_: [ 'output', 'o=' ], nextState: 'o' },
          'a': { action_: 'o=', nextState: 'o' } },
        'space A': {
          'b|p|bp': {} },
        'space': {
          'a': { nextState: 'as' },
          '0': { action_: 'sb=false' },
          '1|2': { action_: 'sb=true' },
          'r|rt|rd|rdt|rdq': { action_: 'output', nextState: '0' },
          '*': { action_: [ 'output', 'sb=true' ], nextState: '1'} },
        '1st-level escape': {
          '1|2': { action_: [ 'output', { type_: 'insert+p1', option: '1st-level escape' } ] },
          '*': { action_: [ 'output', { type_: 'insert+p1', option: '1st-level escape' } ], nextState: '0' } },
        '[(...)]': {
          'r|rt': { action_: 'rd=', nextState: 'rd' },
          'rd|rdt': { action_: 'rq=', nextState: 'rdq' } },
        '...': {
          'o|d|D|dq|qd|qD': { action_: [ 'output', { type_: 'bond', option: "..." } ], nextState: '3' },
          '*': { action_: [ { type_: 'output', option: 1 }, { type_: 'insert', option: 'ellipsis' } ], nextState: '1' } },
        '. |* ': {
          '*': { action_: [ 'output', { type_: 'insert', option: 'addition compound' } ], nextState: '1' } },
        'state of aggregation $': {
          '*': { action_: [ 'output', 'state of aggregation' ], nextState: '1' } },
        '{[(': {
          'a|as|o': { action_: [ 'o=', 'output', 'parenthesisLevel++' ], nextState: '2' },
          '0|1|2|3': { action_: [ 'o=', 'output', 'parenthesisLevel++' ], nextState: '2' },
          '*': { action_: [ 'output', 'o=', 'output', 'parenthesisLevel++' ], nextState: '2' } },
        ')]}': {
          '0|1|2|3|b|p|bp|o': { action_: [ 'o=', 'parenthesisLevel--' ], nextState: 'o' },
          'a|as|d|D|q|qd|qD|dq': { action_: [ 'output', 'o=', 'parenthesisLevel--' ], nextState: 'o' } },
        ', ': {
          '*': { action_: [ 'output', 'comma' ], nextState: '0' } },
        '^_': {  // ^ and _ without a sensible argument
          '*': { } },
        '^{(...)}|^($...$)': {
          '0|1|2|as': { action_: 'b=', nextState: 'b' },
          'p': { action_: 'b=', nextState: 'bp' },
          '3|o': { action_: 'd= kv', nextState: 'D' },
          'q': { action_: 'd=', nextState: 'qD' },
          'd|D|qd|qD|dq': { action_: [ 'output', 'd=' ], nextState: 'D' } },
        '^a|^\\x{}{}|^\\x{}|^\\x|\'': {
          '0|1|2|as': { action_: 'b=', nextState: 'b' },
          'p': { action_: 'b=', nextState: 'bp' },
          '3|o': { action_: 'd= kv', nextState: 'd' },
          'q': { action_: 'd=', nextState: 'qd' },
          'd|qd|D|qD': { action_: 'd=' },
          'dq': { action_: [ 'output', 'd=' ], nextState: 'd' } },
        '_{(state of aggregation)}$': {
          'd|D|q|qd|qD|dq': { action_: [ 'output', 'q=' ], nextState: 'q' } },
        '_{(...)}|_($...$)|_9|_\\x{}{}|_\\x{}|_\\x': {
          '0|1|2|as': { action_: 'p=', nextState: 'p' },
          'b': { action_: 'p=', nextState: 'bp' },
          '3|o': { action_: 'q=', nextState: 'q' },
          'd|D': { action_: 'q=', nextState: 'dq' },
          'q|qd|qD|dq': { action_: [ 'output', 'q=' ], nextState: 'q' } },
        '=<>': {
          '0|1|2|3|a|as|o|q|d|D|qd|qD|dq': { action_: [ { type_: 'output', option: 2 }, 'bond' ], nextState: '3' } },
        '#': {
          '0|1|2|3|a|as|o': { action_: [ { type_: 'output', option: 2 }, { type_: 'bond', option: "#" } ], nextState: '3' } },
        '{}': {
          '*': { action_: { type_: 'output', option: 1 },  nextState: '1' } },
        '{...}': {
          '0|1|2|3|a|as|b|p|bp': { action_: 'o=', nextState: 'o' },
          'o|d|D|q|qd|qD|dq': { action_: [ 'output', 'o=' ], nextState: 'o' } },
        '$...$': {
          'a': { action_: 'a=' },  // 2$n$
          '0|1|2|3|as|b|p|bp|o': { action_: 'o=', nextState: 'o' },  // not 'amount'
          'as|o': { action_: 'o=' },
          'q|d|D|qd|qD|dq': { action_: [ 'output', 'o=' ], nextState: 'o' } },
        '\\bond{(...)}': {
          '*': { action_: [ { type_: 'output', option: 2 }, 'bond' ], nextState: "3" } },
        '\\frac{(...)}': {
          '*': { action_: [ { type_: 'output', option: 1 }, 'frac-output' ], nextState: '3' } },
        '\\overset{(...)}': {
          '*': { action_: [ { type_: 'output', option: 2 }, 'overset-output' ], nextState: '3' } },
        '\\underset{(...)}': {
          '*': { action_: [ { type_: 'output', option: 2 }, 'underset-output' ], nextState: '3' } },
        '\\underbrace{(...)}': {
          '*': { action_: [ { type_: 'output', option: 2 }, 'underbrace-output' ], nextState: '3' } },
        '\\color{(...)}{(...)}1|\\color(...){(...)}2': {
          '*': { action_: [ { type_: 'output', option: 2 }, 'color-output' ], nextState: '3' } },
        '\\color{(...)}0': {
          '*': { action_: [ { type_: 'output', option: 2 }, 'color0-output' ] } },
        '\\ce{(...)}': {
          '*': { action_: [ { type_: 'output', option: 2 }, 'ce' ], nextState: '3' } },
        '\\,': {
          '*': { action_: [ { type_: 'output', option: 1 }, 'copy' ], nextState: '1' } },
        '\\x{}{}|\\x{}|\\x': {
          '0|1|2|3|a|as|b|p|bp|o|c0': { action_: [ 'o=', 'output' ], nextState: '3' },
          '*': { action_: ['output', 'o=', 'output' ], nextState: '3' } },
        'others': {
          '*': { action_: [ { type_: 'output', option: 1 }, 'copy' ], nextState: '3' } },
        'else2': {
          'a': { action_: 'a to o', nextState: 'o', revisit: true },
          'as': { action_: [ 'output', 'sb=true' ], nextState: '1', revisit: true },
          'r|rt|rd|rdt|rdq': { action_: [ 'output' ], nextState: '0', revisit: true },
          '*': { action_: [ 'output', 'copy' ], nextState: '3' } }
      }),
      actions: {
        'o after d': function (buffer, m) {
          var ret;
          if ((buffer.d || "").match(/^[0-9]+$/)) {
            var tmp = buffer.d;
            buffer.d = undefined;
            ret = this['output'](buffer);
            buffer.b = tmp;
          } else {
            ret = this['output'](buffer);
          }
          mhchemParser.actions['o='](buffer, m);
          return ret;
        },
        'd= kv': function (buffer, m) {
          buffer.d = m;
          buffer.dType = 'kv';
        },
        'charge or bond': function (buffer, m) {
          if (buffer['beginsWithBond']) {
            /** @type {ParserOutput[]} */
            var ret = [];
            mhchemParser.concatArray(ret, this['output'](buffer));
            mhchemParser.concatArray(ret, mhchemParser.actions['bond'](buffer, m, "-"));
            return ret;
          } else {
            buffer.d = m;
          }
        },
        '- after o/d': function (buffer, m, isAfterD) {
          var c1 = mhchemParser.patterns.match_('orbital', buffer.o || "");
          var c2 = mhchemParser.patterns.match_('one lowercase greek letter $', buffer.o || "");
          var c3 = mhchemParser.patterns.match_('one lowercase latin letter $', buffer.o || "");
          var c4 = mhchemParser.patterns.match_('$one lowercase latin letter$ $', buffer.o || "");
          var hyphenFollows =  m==="-" && ( c1 && c1.remainder===""  ||  c2  ||  c3  ||  c4 );
          if (hyphenFollows && !buffer.a && !buffer.b && !buffer.p && !buffer.d && !buffer.q && !c1 && c3) {
            buffer.o = '$' + buffer.o + '$';
          }
          /** @type {ParserOutput[]} */
          var ret = [];
          if (hyphenFollows) {
            mhchemParser.concatArray(ret, this['output'](buffer));
            ret.push({ type_: 'hyphen' });
          } else {
            c1 = mhchemParser.patterns.match_('digits', buffer.d || "");
            if (isAfterD && c1 && c1.remainder==='') {
              mhchemParser.concatArray(ret, mhchemParser.actions['d='](buffer, m));
              mhchemParser.concatArray(ret, this['output'](buffer));
            } else {
              mhchemParser.concatArray(ret, this['output'](buffer));
              mhchemParser.concatArray(ret, mhchemParser.actions['bond'](buffer, m, "-"));
            }
          }
          return ret;
        },
        'a to o': function (buffer) {
          buffer.o = buffer.a;
          buffer.a = undefined;
        },
        'sb=true': function (buffer) { buffer.sb = true; },
        'sb=false': function (buffer) { buffer.sb = false; },
        'beginsWithBond=true': function (buffer) { buffer['beginsWithBond'] = true; },
        'beginsWithBond=false': function (buffer) { buffer['beginsWithBond'] = false; },
        'parenthesisLevel++': function (buffer) { buffer['parenthesisLevel']++; },
        'parenthesisLevel--': function (buffer) { buffer['parenthesisLevel']--; },
        'state of aggregation': function (buffer, m) {
          return { type_: 'state of aggregation', p1: mhchemParser.go(m, 'o') };
        },
        'comma': function (buffer, m) {
          var a = m.replace(/\s*$/, '');
          var withSpace = (a !== m);
          if (withSpace  &&  buffer['parenthesisLevel'] === 0) {
            return { type_: 'comma enumeration L', p1: a };
          } else {
            return { type_: 'comma enumeration M', p1: a };
          }
        },
        'output': function (buffer, m, entityFollows) {
          // entityFollows:
          //   undefined = if we have nothing else to output, also ignore the just read space (buffer.sb)
          //   1 = an entity follows, never omit the space if there was one just read before (can only apply to state 1)
          //   2 = 1 + the entity can have an amount, so output a\, instead of converting it to o (can only apply to states a|as)
          /** @type {ParserOutput | ParserOutput[]} */
          var ret;
          if (!buffer.r) {
            ret = [];
            if (!buffer.a && !buffer.b && !buffer.p && !buffer.o && !buffer.q && !buffer.d && !entityFollows) {
              //ret = [];
            } else {
              if (buffer.sb) {
                ret.push({ type_: 'entitySkip' });
              }
              if (!buffer.o && !buffer.q && !buffer.d && !buffer.b && !buffer.p && entityFollows!==2) {
                buffer.o = buffer.a;
                buffer.a = undefined;
              } else if (!buffer.o && !buffer.q && !buffer.d && (buffer.b || buffer.p)) {
                buffer.o = buffer.a;
                buffer.d = buffer.b;
                buffer.q = buffer.p;
                buffer.a = buffer.b = buffer.p = undefined;
              } else {
                if (buffer.o && buffer.dType==='kv' && mhchemParser.patterns.match_('d-oxidation$', buffer.d || "")) {
                  buffer.dType = 'oxidation';
                } else if (buffer.o && buffer.dType==='kv' && !buffer.q) {
                  buffer.dType = undefined;
                }
              }
              ret.push({
                type_: 'chemfive',
                a: mhchemParser.go(buffer.a, 'a'),
                b: mhchemParser.go(buffer.b, 'bd'),
                p: mhchemParser.go(buffer.p, 'pq'),
                o: mhchemParser.go(buffer.o, 'o'),
                q: mhchemParser.go(buffer.q, 'pq'),
                d: mhchemParser.go(buffer.d, (buffer.dType === 'oxidation' ? 'oxidation' : 'bd')),
                dType: buffer.dType
              });
            }
          } else {  // r
            /** @type {ParserOutput[]} */
            var rd;
            if (buffer.rdt === 'M') {
              rd = mhchemParser.go(buffer.rd, 'tex-math');
            } else if (buffer.rdt === 'T') {
              rd = [ { type_: 'text', p1: buffer.rd || "" } ];
            } else {
              rd = mhchemParser.go(buffer.rd);
            }
            /** @type {ParserOutput[]} */
            var rq;
            if (buffer.rqt === 'M') {
              rq = mhchemParser.go(buffer.rq, 'tex-math');
            } else if (buffer.rqt === 'T') {
              rq = [ { type_: 'text', p1: buffer.rq || ""} ];
            } else {
              rq = mhchemParser.go(buffer.rq);
            }
            ret = {
              type_: 'arrow',
              r: buffer.r,
              rd: rd,
              rq: rq
            };
          }
          for (var p in buffer) {
            if (p !== 'parenthesisLevel'  &&  p !== 'beginsWithBond') {
              delete buffer[p];
            }
          }
          return ret;
        },
        'oxidation-output': function (buffer, m) {
          var ret = [ "{" ];
          mhchemParser.concatArray(ret, mhchemParser.go(m, 'oxidation'));
          ret.push("}");
          return ret;
        },
        'frac-output': function (buffer, m) {
          return { type_: 'frac-ce', p1: mhchemParser.go(m[0]), p2: mhchemParser.go(m[1]) };
        },
        'overset-output': function (buffer, m) {
          return { type_: 'overset', p1: mhchemParser.go(m[0]), p2: mhchemParser.go(m[1]) };
        },
        'underset-output': function (buffer, m) {
          return { type_: 'underset', p1: mhchemParser.go(m[0]), p2: mhchemParser.go(m[1]) };
        },
        'underbrace-output': function (buffer, m) {
          return { type_: 'underbrace', p1: mhchemParser.go(m[0]), p2: mhchemParser.go(m[1]) };
        },
        'color-output': function (buffer, m) {
          return { type_: 'color', color1: m[0], color2: mhchemParser.go(m[1]) };
        },
        'r=': function (buffer, m) { buffer.r = m; },
        'rdt=': function (buffer, m) { buffer.rdt = m; },
        'rd=': function (buffer, m) { buffer.rd = m; },
        'rqt=': function (buffer, m) { buffer.rqt = m; },
        'rq=': function (buffer, m) { buffer.rq = m; },
        'operator': function (buffer, m, p1) { return { type_: 'operator', kind_: (p1 || m) }; }
      }
    },
    'a': {
      transitions: mhchemParser.createTransitions({
        'empty': {
          '*': {} },
        '1/2$': {
          '0': { action_: '1/2' } },
        'else': {
          '0': { nextState: '1', revisit: true } },
        '$(...)$': {
          '*': { action_: 'tex-math tight', nextState: '1' } },
        ',': {
          '*': { action_: { type_: 'insert', option: 'commaDecimal' } } },
        'else2': {
          '*': { action_: 'copy' } }
      }),
      actions: {}
    },
    'o': {
      transitions: mhchemParser.createTransitions({
        'empty': {
          '*': {} },
        '1/2$': {
          '0': { action_: '1/2' } },
        'else': {
          '0': { nextState: '1', revisit: true } },
        'letters': {
          '*': { action_: 'rm' } },
        '\\ca': {
          '*': { action_: { type_: 'insert', option: 'circa' } } },
        '\\x{}{}|\\x{}|\\x': {
          '*': { action_: 'copy' } },
        '${(...)}$|$(...)$': {
          '*': { action_: 'tex-math' } },
        '{(...)}': {
          '*': { action_: '{text}' } },
        'else2': {
          '*': { action_: 'copy' } }
      }),
      actions: {}
    },
    'text': {
      transitions: mhchemParser.createTransitions({
        'empty': {
          '*': { action_: 'output' } },
        '{...}': {
          '*': { action_: 'text=' } },
        '${(...)}$|$(...)$': {
          '*': { action_: 'tex-math' } },
        '\\greek': {
          '*': { action_: [ 'output', 'rm' ] } },
        '\\,|\\x{}{}|\\x{}|\\x': {
          '*': { action_: [ 'output', 'copy' ] } },
        'else': {
          '*': { action_: 'text=' } }
      }),
      actions: {
        'output': function (buffer) {
          if (buffer.text_) {
            /** @type {ParserOutput} */
            var ret = { type_: 'text', p1: buffer.text_ };
            for (var p in buffer) { delete buffer[p]; }
            return ret;
          }
        }
      }
    },
    'pq': {
      transitions: mhchemParser.createTransitions({
        'empty': {
          '*': {} },
        'state of aggregation $': {
          '*': { action_: 'state of aggregation' } },
        'i$': {
          '0': { nextState: '!f', revisit: true } },
        '(KV letters),': {
          '0': { action_: 'rm', nextState: '0' } },
        'formula$': {
          '0': { nextState: 'f', revisit: true } },
        '1/2$': {
          '0': { action_: '1/2' } },
        'else': {
          '0': { nextState: '!f', revisit: true } },
        '${(...)}$|$(...)$': {
          '*': { action_: 'tex-math' } },
        '{(...)}': {
          '*': { action_: 'text' } },
        'a-z': {
          'f': { action_: 'tex-math' } },
        'letters': {
          '*': { action_: 'rm' } },
        '-9.,9': {
          '*': { action_: '9,9'  } },
        ',': {
          '*': { action_: { type_: 'insert+p1', option: 'comma enumeration S' } } },
        '\\color{(...)}{(...)}1|\\color(...){(...)}2': {
          '*': { action_: 'color-output' } },
        '\\color{(...)}0': {
          '*': { action_: 'color0-output' } },
        '\\ce{(...)}': {
          '*': { action_: 'ce' } },
        '\\,|\\x{}{}|\\x{}|\\x': {
          '*': { action_: 'copy' } },
        'else2': {
          '*': { action_: 'copy' } }
      }),
      actions: {
        'state of aggregation': function (buffer, m) {
          return { type_: 'state of aggregation subscript', p1: mhchemParser.go(m, 'o') };
        },
        'color-output': function (buffer, m) {
          return { type_: 'color', color1: m[0], color2: mhchemParser.go(m[1], 'pq') };
        }
      }
    },
    'bd': {
      transitions: mhchemParser.createTransitions({
        'empty': {
          '*': {} },
        'x$': {
          '0': { nextState: '!f', revisit: true } },
        'formula$': {
          '0': { nextState: 'f', revisit: true } },
        'else': {
          '0': { nextState: '!f', revisit: true } },
        '-9.,9 no missing 0': {
          '*': { action_: '9,9' } },
        '.': {
          '*': { action_: { type_: 'insert', option: 'electron dot' } } },
        'a-z': {
          'f': { action_: 'tex-math' } },
        'x': {
          '*': { action_: { type_: 'insert', option: 'KV x' } } },
        'letters': {
          '*': { action_: 'rm' } },
        '\'': {
          '*': { action_: { type_: 'insert', option: 'prime' } } },
        '${(...)}$|$(...)$': {
          '*': { action_: 'tex-math' } },
        '{(...)}': {
          '*': { action_: 'text' } },
        '\\color{(...)}{(...)}1|\\color(...){(...)}2': {
          '*': { action_: 'color-output' } },
        '\\color{(...)}0': {
          '*': { action_: 'color0-output' } },
        '\\ce{(...)}': {
          '*': { action_: 'ce' } },
        '\\,|\\x{}{}|\\x{}|\\x': {
          '*': { action_: 'copy' } },
        'else2': {
          '*': { action_: 'copy' } }
      }),
      actions: {
        'color-output': function (buffer, m) {
          return { type_: 'color', color1: m[0], color2: mhchemParser.go(m[1], 'bd') };
        }
      }
    },
    'oxidation': {
      transitions: mhchemParser.createTransitions({
        'empty': {
          '*': {} },
        'roman numeral': {
          '*': { action_: 'roman-numeral' } },
        '${(...)}$|$(...)$': {
          '*': { action_: 'tex-math' } },
        'else': {
          '*': { action_: 'copy' } }
      }),
      actions: {
        'roman-numeral': function (buffer, m) { return { type_: 'roman numeral', p1: m || "" }; }
      }
    },
    'tex-math': {
      transitions: mhchemParser.createTransitions({
        'empty': {
          '*': { action_: 'output' } },
        '\\ce{(...)}': {
          '*': { action_: [ 'output', 'ce' ] } },
        '{...}|\\,|\\x{}{}|\\x{}|\\x': {
          '*': { action_: 'o=' } },
        'else': {
          '*': { action_: 'o=' } }
      }),
      actions: {
        'output': function (buffer) {
          if (buffer.o) {
            /** @type {ParserOutput} */
            var ret = { type_: 'tex-math', p1: buffer.o };
            for (var p in buffer) { delete buffer[p]; }
            return ret;
          }
        }
      }
    },
    'tex-math tight': {
      transitions: mhchemParser.createTransitions({
        'empty': {
          '*': { action_: 'output' } },
        '\\ce{(...)}': {
          '*': { action_: [ 'output', 'ce' ] } },
        '{...}|\\,|\\x{}{}|\\x{}|\\x': {
          '*': { action_: 'o=' } },
        '-|+': {
          '*': { action_: 'tight operator' } },
        'else': {
          '*': { action_: 'o=' } }
      }),
      actions: {
        'tight operator': function (buffer, m) { buffer.o = (buffer.o || "") + "{"+m+"}"; },
        'output': function (buffer) {
          if (buffer.o) {
            /** @type {ParserOutput} */
            var ret = { type_: 'tex-math', p1: buffer.o };
            for (var p in buffer) { delete buffer[p]; }
            return ret;
          }
        }
      }
    },
    '9,9': {
      transitions: mhchemParser.createTransitions({
        'empty': {
          '*': {} },
        ',': {
          '*': { action_: 'comma' } },
        'else': {
          '*': { action_: 'copy' } }
      }),
      actions: {
        'comma': function () { return { type_: 'commaDecimal' }; }
      }
    },
    //#endregion
    //
    // \pu state machines
    //
    //#region pu
    'pu': {
      transitions: mhchemParser.createTransitions({
        'empty': {
          '*': { action_: 'output' } },
        'space$': {
          '*': { action_: [ 'output', 'space' ] } },
        '{[(|)]}': {
          '0|a': { action_: 'copy' } },
        '(-)(9)^(-9)': {
          '0': { action_: 'number^', nextState: 'a' } },
        '(-)(9.,9)(e)(99)': {
          '0': { action_: 'enumber', nextState: 'a' } },
        'space': {
          '0|a': {} },
        'pm-operator': {
          '0|a': { action_: { type_: 'operator', option: '\\pm' }, nextState: '0' } },
        'operator': {
          '0|a': { action_: 'copy', nextState: '0' } },
        '//': {
          'd': { action_: 'o=', nextState: '/' } },
        '/': {
          'd': { action_: 'o=', nextState: '/' } },
        '{...}|else': {
          '0|d': { action_: 'd=', nextState: 'd' },
          'a': { action_: [ 'space', 'd=' ], nextState: 'd' },
          '/|q': { action_: 'q=', nextState: 'q' } }
      }),
      actions: {
        'enumber': function (buffer, m) {
          /** @type {ParserOutput[]} */
          var ret = [];
          if (m[0] === "+-"  ||  m[0] === "+/-") {
            ret.push("\\pm ");
          } else if (m[0]) {
            ret.push(m[0]);
          }
          if (m[1]) {
            mhchemParser.concatArray(ret, mhchemParser.go(m[1], 'pu-9,9'));
            if (m[2]) {
              if (m[2].match(/[,.]/)) {
                mhchemParser.concatArray(ret, mhchemParser.go(m[2], 'pu-9,9'));
              } else {
                ret.push(m[2]);
              }
            }
            m[3] = m[4] || m[3];
            if (m[3]) {
              m[3] = m[3].trim();
              if (m[3] === "e"  ||  m[3].substr(0, 1) === "*") {
                ret.push({ type_: 'cdot' });
              } else {
                ret.push({ type_: 'times' });
              }
            }
          }
          if (m[3]) {
            ret.push("10^{"+m[5]+"}");
          }
          return ret;
        },
        'number^': function (buffer, m) {
          /** @type {ParserOutput[]} */
          var ret = [];
          if (m[0] === "+-"  ||  m[0] === "+/-") {
            ret.push("\\pm ");
          } else if (m[0]) {
            ret.push(m[0]);
          }
          mhchemParser.concatArray(ret, mhchemParser.go(m[1], 'pu-9,9'));
          ret.push("^{"+m[2]+"}");
          return ret;
        },
        'operator': function (buffer, m, p1) { return { type_: 'operator', kind_: (p1 || m) }; },
        'space': function () { return { type_: 'pu-space-1' }; },
        'output': function (buffer) {
          /** @type {ParserOutput | ParserOutput[]} */
          var ret;
          var md = mhchemParser.patterns.match_('{(...)}', buffer.d || "");
          if (md  &&  md.remainder === '') { buffer.d = md.match_; }
          var mq = mhchemParser.patterns.match_('{(...)}', buffer.q || "");
          if (mq  &&  mq.remainder === '') { buffer.q = mq.match_; }
          if (buffer.d) {
            buffer.d = buffer.d.replace(/\u00B0C|\^oC|\^{o}C/g, "{}^{\\circ}C");
            buffer.d = buffer.d.replace(/\u00B0F|\^oF|\^{o}F/g, "{}^{\\circ}F");
          }
          if (buffer.q) {  // fraction
            buffer.q = buffer.q.replace(/\u00B0C|\^oC|\^{o}C/g, "{}^{\\circ}C");
            buffer.q = buffer.q.replace(/\u00B0F|\^oF|\^{o}F/g, "{}^{\\circ}F");
            var b5 = {
              d: mhchemParser.go(buffer.d, 'pu'),
              q: mhchemParser.go(buffer.q, 'pu')
            };
            if (buffer.o === '//') {
              ret = { type_: 'pu-frac', p1: b5.d, p2: b5.q };
            } else {
              ret = b5.d;
              if (b5.d.length > 1  ||  b5.q.length > 1) {
                ret.push({ type_: ' / ' });
              } else {
                ret.push({ type_: '/' });
              }
              mhchemParser.concatArray(ret, b5.q);
            }
          } else {  // no fraction
            ret = mhchemParser.go(buffer.d, 'pu-2');
          }
          for (var p in buffer) { delete buffer[p]; }
          return ret;
        }
      }
    },
    'pu-2': {
      transitions: mhchemParser.createTransitions({
        'empty': {
          '*': { action_: 'output' } },
        '*': {
          '*': { action_: [ 'output', 'cdot' ], nextState: '0' } },
        '\\x': {
          '*': { action_: 'rm=' } },
        'space': {
          '*': { action_: [ 'output', 'space' ], nextState: '0' } },
        '^{(...)}|^(-1)': {
          '1': { action_: '^(-1)' } },
        '-9.,9': {
          '0': { action_: 'rm=', nextState: '0' },
          '1': { action_: '^(-1)', nextState: '0' } },
        '{...}|else': {
          '*': { action_: 'rm=', nextState: '1' } }
      }),
      actions: {
        'cdot': function () { return { type_: 'tight cdot' }; },
        '^(-1)': function (buffer, m) { buffer.rm += "^{"+m+"}"; },
        'space': function () { return { type_: 'pu-space-2' }; },
        'output': function (buffer) {
          /** @type {ParserOutput | ParserOutput[]} */
          var ret = [];
          if (buffer.rm) {
            var mrm = mhchemParser.patterns.match_('{(...)}', buffer.rm || "");
            if (mrm  &&  mrm.remainder === '') {
              ret = mhchemParser.go(mrm.match_, 'pu');
            } else {
              ret = { type_: 'rm', p1: buffer.rm };
            }
          }
          for (var p in buffer) { delete buffer[p]; }
          return ret;
        }
      }
    },
    'pu-9,9': {
      transitions: mhchemParser.createTransitions({
        'empty': {
          '0': { action_: 'output-0' },
          'o': { action_: 'output-o' } },
        ',': {
          '0': { action_: [ 'output-0', 'comma' ], nextState: 'o' } },
        '.': {
          '0': { action_: [ 'output-0', 'copy' ], nextState: 'o' } },
        'else': {
          '*': { action_: 'text=' } }
      }),
      actions: {
        'comma': function () { return { type_: 'commaDecimal' }; },
        'output-0': function (buffer) {
          /** @type {ParserOutput[]} */
          var ret = [];
          buffer.text_ = buffer.text_ || "";
          if (buffer.text_.length > 4) {
            var a = buffer.text_.length % 3;
            if (a === 0) { a = 3; }
            for (var i=buffer.text_.length-3; i>0; i-=3) {
              ret.push(buffer.text_.substr(i, 3));
              ret.push({ type_: '1000 separator' });
            }
            ret.push(buffer.text_.substr(0, a));
            ret.reverse();
          } else {
            ret.push(buffer.text_);
          }
          for (var p in buffer) { delete buffer[p]; }
          return ret;
        },
        'output-o': function (buffer) {
          /** @type {ParserOutput[]} */
          var ret = [];
          buffer.text_ = buffer.text_ || "";
          if (buffer.text_.length > 4) {
            var a = buffer.text_.length - 3;
            for (var i=0; i<a; i+=3) {
              ret.push(buffer.text_.substr(i, 3));
              ret.push({ type_: '1000 separator' });
            }
            ret.push(buffer.text_.substr(i));
          } else {
            ret.push(buffer.text_);
          }
          for (var p in buffer) { delete buffer[p]; }
          return ret;
        }
      }
    }
    //#endregion
  };

  //
  // texify: Take MhchemParser output and convert it to TeX
  //
  /** @type {Texify} */
  var texify = {
    go: function (input, isInner) {  // (recursive, max 4 levels)
      if (!input) { return ""; }
      var res = "";
      var cee = false;
      for (var i=0; i < input.length; i++) {
        var inputi = input[i];
        if (typeof inputi === "string") {
          res += inputi;
        } else {
          res += texify._go2(inputi);
          if (inputi.type_ === '1st-level escape') { cee = true; }
        }
      }
      if (!isInner && !cee && res) {
        res = "{" + res + "}";
      }
      return res;
    },
    _goInner: function (input) {
      if (!input) { return input; }
      return texify.go(input, true);
    },
    _go2: function (buf) {
      /** @type {undefined | string} */
      var res;
      switch (buf.type_) {
        case 'chemfive':
          res = "";
          var b5 = {
            a: texify._goInner(buf.a),
            b: texify._goInner(buf.b),
            p: texify._goInner(buf.p),
            o: texify._goInner(buf.o),
            q: texify._goInner(buf.q),
            d: texify._goInner(buf.d)
          };
          //
          // a
          //
          if (b5.a) {
            if (b5.a.match(/^[+\-]/)) { b5.a = "{"+b5.a+"}"; }
            res += b5.a + "\\,";
          }
          //
          // b and p
          //
          if (b5.b || b5.p) {
            res += "{\\vphantom{X}}";
            res += "^{\\hphantom{"+(b5.b||"")+"}}_{\\hphantom{"+(b5.p||"")+"}}";
            res += "{\\vphantom{X}}";
            // In the next two lines, I've removed \smash[t] (ron)
            // TODO: Revert \smash[t] when WebKit properly renders <mpadded> w/height="0"
            //res += "^{\\smash[t]{\\vphantom{2}}\\mathllap{"+(b5.b||"")+"}}";
            res += "^{\\vphantom{2}\\mathllap{"+(b5.b||"")+"}}";
            //res += "_{\\vphantom{2}\\mathllap{\\smash[t]{"+(b5.p||"")+"}}}";
            res += "_{\\vphantom{2}\\mathllap{"+(b5.p||"")+"}}";
          }
          //
          // o
          //
          if (b5.o) {
            if (b5.o.match(/^[+\-]/)) { b5.o = "{"+b5.o+"}"; }
            res += b5.o;
          }
          //
          // q and d
          //
          if (buf.dType === 'kv') {
            if (b5.d || b5.q) {
              res += "{\\vphantom{X}}";
            }
            if (b5.d) {
              res += "^{"+b5.d+"}";
            }
            if (b5.q) {
              // In the next line, I've removed \smash[t] (ron)
              // TODO: Revert \smash[t] when WebKit properly renders <mpadded> w/height="0"
              //res += "_{\\smash[t]{"+b5.q+"}}";
              res += "_{"+b5.q+"}";
            }
          } else if (buf.dType === 'oxidation') {
            if (b5.d) {
              res += "{\\vphantom{X}}";
              res += "^{"+b5.d+"}";
            }
            if (b5.q) {
              // A Firefox bug adds a bogus depth to <mphantom>, so we change \vphantom{X} to {}
              // TODO: Reinstate \vphantom{X} when the Firefox bug is fixed.
//              res += "{\\vphantom{X}}";
              res += "{{}}";
              // In the next line, I've removed \smash[t] (ron)
              // TODO: Revert \smash[t] when WebKit properly renders <mpadded> w/height="0"
              //res += "_{\\smash[t]{"+b5.q+"}}";
              res += "_{"+b5.q+"}";
            }
          } else {
            if (b5.q) {
              // TODO: Reinstate \vphantom{X} when the Firefox bug is fixed.
//              res += "{\\vphantom{X}}";
              res += "{{}}";
              // In the next line, I've removed \smash[t] (ron)
              // TODO: Revert \smash[t] when WebKit properly renders <mpadded> w/height="0"
              //res += "_{\\smash[t]{"+b5.q+"}}";
              res += "_{"+b5.q+"}";
            }
            if (b5.d) {
              // TODO: Reinstate \vphantom{X} when the Firefox bug is fixed.
//              res += "{\\vphantom{X}}";
              res += "{{}}";
              res += "^{"+b5.d+"}";
            }
          }
          break;
        case 'rm':
          res = "\\mathrm{"+buf.p1+"}";
          break;
        case 'text':
          if (buf.p1.match(/[\^_]/)) {
            buf.p1 = buf.p1.replace(" ", "~").replace("-", "\\text{-}");
            res = "\\mathrm{"+buf.p1+"}";
          } else {
            res = "\\text{"+buf.p1+"}";
          }
          break;
        case 'roman numeral':
          res = "\\mathrm{"+buf.p1+"}";
          break;
        case 'state of aggregation':
          res = "\\mskip2mu "+texify._goInner(buf.p1);
          break;
        case 'state of aggregation subscript':
          res = "\\mskip1mu "+texify._goInner(buf.p1);
          break;
        case 'bond':
          res = texify._getBond(buf.kind_);
          if (!res) {
            throw ["MhchemErrorBond", "mhchem Error. Unknown bond type (" + buf.kind_ + ")"];
          }
          break;
        case 'frac':
          var c = "\\frac{" + buf.p1 + "}{" + buf.p2 + "}";
          res = "\\mathchoice{\\textstyle"+c+"}{"+c+"}{"+c+"}{"+c+"}";
          break;
        case 'pu-frac':
          var d = "\\frac{" + texify._goInner(buf.p1) + "}{" + texify._goInner(buf.p2) + "}";
          res = "\\mathchoice{\\textstyle"+d+"}{"+d+"}{"+d+"}{"+d+"}";
          break;
        case 'tex-math':
          res = buf.p1 + " ";
          break;
        case 'frac-ce':
          res = "\\frac{" + texify._goInner(buf.p1) + "}{" + texify._goInner(buf.p2) + "}";
          break;
        case 'overset':
          res = "\\overset{" + texify._goInner(buf.p1) + "}{" + texify._goInner(buf.p2) + "}";
          break;
        case 'underset':
          res = "\\underset{" + texify._goInner(buf.p1) + "}{" + texify._goInner(buf.p2) + "}";
          break;
        case 'underbrace':
          res =  "\\underbrace{" + texify._goInner(buf.p1) + "}_{" + texify._goInner(buf.p2) + "}";
          break;
        case 'color':
          res = "{\\color{" + buf.color1 + "}{" + texify._goInner(buf.color2) + "}}";
          break;
        case 'color0':
          res = "\\color{" + buf.color + "}";
          break;
        case 'arrow':
          var b6 = {
            rd: texify._goInner(buf.rd),
            rq: texify._goInner(buf.rq)
          };
          var arrow = texify._getArrow(buf.r);
          if (b6.rq) { arrow += "[{\\rm " + b6.rq + "}]"; }
          if (b6.rd) {
            arrow += "{\\rm " + b6.rd + "}";
          } else {
            arrow += "{}";
          }
          res = arrow;
          break;
        case 'operator':
          res = texify._getOperator(buf.kind_);
          break;
        case '1st-level escape':
          res = buf.p1+" ";  // &, \\\\, \\hlin
          break;
        case 'space':
          res = " ";
          break;
        case 'entitySkip':
          res = "~";
          break;
        case 'pu-space-1':
          res = "~";
          break;
        case 'pu-space-2':
          res = "\\mkern3mu ";
          break;
        case '1000 separator':
          res = "\\mkern2mu ";
          break;
        case 'commaDecimal':
          res = "{,}";
          break;
          case 'comma enumeration L':
          res = "{"+buf.p1+"}\\mkern6mu ";
          break;
        case 'comma enumeration M':
          res = "{"+buf.p1+"}\\mkern3mu ";
          break;
        case 'comma enumeration S':
          res = "{"+buf.p1+"}\\mkern1mu ";
          break;
        case 'hyphen':
          res = "\\text{-}";
          break;
        case 'addition compound':
          res = "\\,{\\cdot}\\,";
          break;
        case 'electron dot':
          res = "\\mkern1mu \\text{\\textbullet}\\mkern1mu ";
          break;
        case 'KV x':
          res = "{\\times}";
          break;
        case 'prime':
          res = "\\prime ";
          break;
        case 'cdot':
          res = "\\cdot ";
          break;
        case 'tight cdot':
          res = "\\mkern1mu{\\cdot}\\mkern1mu ";
          break;
        case 'times':
          res = "\\times ";
          break;
        case 'circa':
          res = "{\\sim}";
          break;
        case '^':
          res = "uparrow";
          break;
        case 'v':
          res = "downarrow";
          break;
        case 'ellipsis':
          res = "\\ldots ";
          break;
        case '/':
          res = "/";
          break;
        case ' / ':
          res = "\\,/\\,";
          break;
        default:
          assertNever(buf);
          throw ["MhchemBugT", "mhchem bug T. Please report."];  // Missing texify rule or unknown MhchemParser output
      }
      assertString(res);
      return res;
    },
    _getArrow: function (a) {
      switch (a) {
        case "->": return "\\yields";
        case "\u2192": return "\\yields";
        case "\u27F6": return "\\yields";
        case "<-": return "\\yieldsLeft";
        case "<->": return "\\mesomerism";
        case "<-->": return "\\yieldsLeftRight";
        case "<=>": return "\\chemequilibrium";
        case "\u21CC": return "\\chemequilibrium";
        case "<=>>": return "\\equilibriumRight";
        case "<<=>": return "\\equilibriumLeft";
        default:
          assertNever(a);
          throw ["MhchemBugT", "mhchem bug T. Please report."];
      }
    },
    _getBond: function (a) {
      switch (a) {
        case "-": return "{-}";
        case "1": return "{-}";
        case "=": return "{=}";
        case "2": return "{=}";
        case "#": return "{\\equiv}";
        case "3": return "{\\equiv}";
        case "~": return "{\\tripleDash}";
        case "~-": return "{\\tripleDashOverLine}";
        case "~=": return "{\\tripleDashOverDoubleLine}";
        case "~--": return "{\\tripleDashOverDoubleLine}";
        case "-~-": return "{\\tripleDashBetweenDoubleLine}";
        case "...": return "{{\\cdot}{\\cdot}{\\cdot}}";
        case "....": return "{{\\cdot}{\\cdot}{\\cdot}{\\cdot}}";
        case "->": return "{\\rightarrow}";
        case "<-": return "{\\leftarrow}";
        case "<": return "{<}";
        case ">": return "{>}";
        default:
          assertNever(a);
          throw ["MhchemBugT", "mhchem bug T. Please report."];
      }
    },
    _getOperator: function (a) {
      switch (a) {
        case "+": return " {}+{} ";
        case "-": return " {}-{} ";
        case "=": return " {}={} ";
        case "<": return " {}<{} ";
        case ">": return " {}>{} ";
        case "<<": return " {}\\ll{} ";
        case ">>": return " {}\\gg{} ";
        case "\\pm": return " {}\\pm{} ";
        case "\\approx": return " {}\\approx{} ";
        case "$\\approx$": return " {}\\approx{} ";
        case "v": return " \\downarrow{} ";
        case "(v)": return " \\downarrow{} ";
        case "^": return " \\uparrow{} ";
        case "(^)": return " \\uparrow{} ";
        default:
          assertNever(a);
          throw ["MhchemBugT", "mhchem bug T. Please report."];
      }
    }
  };

  //
  // Helpers for code analysis
  // Will show type error at calling position
  //
  /** @param {number} a */
  function assertNever(a) {}
  /** @param {string} a */
  function assertString(a) {}

/* eslint-disable no-undef */

//////////////////////////////////////////////////////////////////////
// texvc.sty

// The texvc package contains macros available in mediawiki pages.
// We omit the functions deprecated at
// https://en.wikipedia.org/wiki/Help:Displaying_a_formula#Deprecated_syntax

// We also omit texvc's \O, which conflicts with \text{\O}

defineMacro("\\darr", "\\downarrow");
defineMacro("\\dArr", "\\Downarrow");
defineMacro("\\Darr", "\\Downarrow");
defineMacro("\\lang", "\\langle");
defineMacro("\\rang", "\\rangle");
defineMacro("\\uarr", "\\uparrow");
defineMacro("\\uArr", "\\Uparrow");
defineMacro("\\Uarr", "\\Uparrow");
defineMacro("\\N", "\\mathbb{N}");
defineMacro("\\R", "\\mathbb{R}");
defineMacro("\\Z", "\\mathbb{Z}");
defineMacro("\\alef", "\\aleph");
defineMacro("\\alefsym", "\\aleph");
defineMacro("\\bull", "\\bullet");
defineMacro("\\clubs", "\\clubsuit");
defineMacro("\\cnums", "\\mathbb{C}");
defineMacro("\\Complex", "\\mathbb{C}");
defineMacro("\\Dagger", "\\ddagger");
defineMacro("\\diamonds", "\\diamondsuit");
defineMacro("\\empty", "\\emptyset");
defineMacro("\\exist", "\\exists");
defineMacro("\\harr", "\\leftrightarrow");
defineMacro("\\hArr", "\\Leftrightarrow");
defineMacro("\\Harr", "\\Leftrightarrow");
defineMacro("\\hearts", "\\heartsuit");
defineMacro("\\image", "\\Im");
defineMacro("\\infin", "\\infty");
defineMacro("\\isin", "\\in");
defineMacro("\\larr", "\\leftarrow");
defineMacro("\\lArr", "\\Leftarrow");
defineMacro("\\Larr", "\\Leftarrow");
defineMacro("\\lrarr", "\\leftrightarrow");
defineMacro("\\lrArr", "\\Leftrightarrow");
defineMacro("\\Lrarr", "\\Leftrightarrow");
defineMacro("\\natnums", "\\mathbb{N}");
defineMacro("\\plusmn", "\\pm");
defineMacro("\\rarr", "\\rightarrow");
defineMacro("\\rArr", "\\Rightarrow");
defineMacro("\\Rarr", "\\Rightarrow");
defineMacro("\\real", "\\Re");
defineMacro("\\reals", "\\mathbb{R}");
defineMacro("\\Reals", "\\mathbb{R}");
defineMacro("\\sdot", "\\cdot");
defineMacro("\\sect", "\\S");
defineMacro("\\spades", "\\spadesuit");
defineMacro("\\sub", "\\subset");
defineMacro("\\sube", "\\subseteq");
defineMacro("\\supe", "\\supseteq");
defineMacro("\\thetasym", "\\vartheta");
defineMacro("\\weierp", "\\wp");

/* eslint-disable no-undef */

/****************************************************
 *
 *  physics.js
 *
 *  Implements the Physics Package for LaTeX input.
 *
 *  ---------------------------------------------------------------------
 *
 *  The original version of this file is licensed as follows:
 *  Copyright (c) 2015-2016 Kolen Cheung <https://github.com/ickc/MathJax-third-party-extensions>.
 *
 *  Licensed under the Apache License, Version 2.0 (the "License");
 *  you may not use this file except in compliance with the License.
 *  You may obtain a copy of the License at
 *
 *      http://www.apache.org/licenses/LICENSE-2.0
 *
 *  Unless required by applicable law or agreed to in writing, software
 *  distributed under the License is distributed on an "AS IS" BASIS,
 *  WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 *  See the License for the specific language governing permissions and
 *  limitations under the License.
 *
 *  ---------------------------------------------------------------------
 *
 *  This file has been revised from the original in the following ways:
 *  1. The interface is changed so that it can be called from Temml, not MathJax.
 *  2. \Re and \Im are not used, to avoid conflict with existing LaTeX letters.
 *
 *  This revision of the file is released under the MIT license.
 *  https://mit-license.org/
 */
defineMacro("\\quantity", "{\\left\\{ #1 \\right\\}}");
defineMacro("\\qty", "{\\left\\{ #1 \\right\\}}");
defineMacro("\\pqty", "{\\left( #1 \\right)}");
defineMacro("\\bqty", "{\\left[ #1 \\right]}");
defineMacro("\\vqty", "{\\left\\vert #1 \\right\\vert}");
defineMacro("\\Bqty", "{\\left\\{ #1 \\right\\}}");
defineMacro("\\absolutevalue", "{\\left\\vert #1 \\right\\vert}");
defineMacro("\\abs", "{\\left\\vert #1 \\right\\vert}");
defineMacro("\\norm", "{\\left\\Vert #1 \\right\\Vert}");
defineMacro("\\evaluated", "{\\left.#1 \\right\\vert}");
defineMacro("\\eval", "{\\left.#1 \\right\\vert}");
defineMacro("\\order", "{\\mathcal{O} \\left( #1 \\right)}");
defineMacro("\\commutator", "{\\left[ #1 , #2 \\right]}");
defineMacro("\\comm", "{\\left[ #1 , #2 \\right]}");
defineMacro("\\anticommutator", "{\\left\\{ #1 , #2 \\right\\}}");
defineMacro("\\acomm", "{\\left\\{ #1 , #2 \\right\\}}");
defineMacro("\\poissonbracket", "{\\left\\{ #1 , #2 \\right\\}}");
defineMacro("\\pb", "{\\left\\{ #1 , #2 \\right\\}}");
defineMacro("\\vectorbold", "{\\boldsymbol{ #1 }}");
defineMacro("\\vb", "{\\boldsymbol{ #1 }}");
defineMacro("\\vectorarrow", "{\\vec{\\boldsymbol{ #1 }}}");
defineMacro("\\va", "{\\vec{\\boldsymbol{ #1 }}}");
defineMacro("\\vectorunit", "{{\\boldsymbol{\\hat{ #1 }}}}");
defineMacro("\\vu", "{{\\boldsymbol{\\hat{ #1 }}}}");
defineMacro("\\dotproduct", "\\mathbin{\\boldsymbol\\cdot}");
defineMacro("\\vdot", "{\\boldsymbol\\cdot}");
defineMacro("\\crossproduct", "\\mathbin{\\boldsymbol\\times}");
defineMacro("\\cross", "\\mathbin{\\boldsymbol\\times}");
defineMacro("\\cp", "\\mathbin{\\boldsymbol\\times}");
defineMacro("\\gradient", "{\\boldsymbol\\nabla}");
defineMacro("\\grad", "{\\boldsymbol\\nabla}");
defineMacro("\\divergence", "{\\grad\\vdot}");
//defineMacro("\\div", "{\\grad\\vdot}"); Not included in Temml. Conflicts w/LaTeX \div
defineMacro("\\curl", "{\\grad\\cross}");
defineMacro("\\laplacian", "\\nabla^2");
defineMacro("\\tr", "{\\operatorname{tr}}");
defineMacro("\\Tr", "{\\operatorname{Tr}}");
defineMacro("\\rank", "{\\operatorname{rank}}");
defineMacro("\\erf", "{\\operatorname{erf}}");
defineMacro("\\Res", "{\\operatorname{Res}}");
defineMacro("\\principalvalue", "{\\mathcal{P}}");
defineMacro("\\pv", "{\\mathcal{P}}");
defineMacro("\\PV", "{\\operatorname{P.V.}}");
// Temml does not use the next two lines. They conflict with LaTeX letters.
//defineMacro("\\Re", "{\\operatorname{Re} \\left\\{ #1 \\right\\}}");
//defineMacro("\\Im", "{\\operatorname{Im} \\left\\{ #1 \\right\\}}");
defineMacro("\\qqtext", "{\\quad\\text{ #1 }\\quad}");
defineMacro("\\qq", "{\\quad\\text{ #1 }\\quad}");
defineMacro("\\qcomma", "{\\text{,}\\quad}");
defineMacro("\\qc", "{\\text{,}\\quad}");
defineMacro("\\qcc", "{\\quad\\text{c.c.}\\quad}");
defineMacro("\\qif", "{\\quad\\text{if}\\quad}");
defineMacro("\\qthen", "{\\quad\\text{then}\\quad}");
defineMacro("\\qelse", "{\\quad\\text{else}\\quad}");
defineMacro("\\qotherwise", "{\\quad\\text{otherwise}\\quad}");
defineMacro("\\qunless", "{\\quad\\text{unless}\\quad}");
defineMacro("\\qgiven", "{\\quad\\text{given}\\quad}");
defineMacro("\\qusing", "{\\quad\\text{using}\\quad}");
defineMacro("\\qassume", "{\\quad\\text{assume}\\quad}");
defineMacro("\\qsince", "{\\quad\\text{since}\\quad}");
defineMacro("\\qlet", "{\\quad\\text{let}\\quad}");
defineMacro("\\qfor", "{\\quad\\text{for}\\quad}");
defineMacro("\\qall", "{\\quad\\text{all}\\quad}");
defineMacro("\\qeven", "{\\quad\\text{even}\\quad}");
defineMacro("\\qodd", "{\\quad\\text{odd}\\quad}");
defineMacro("\\qinteger", "{\\quad\\text{integer}\\quad}");
defineMacro("\\qand", "{\\quad\\text{and}\\quad}");
defineMacro("\\qor", "{\\quad\\text{or}\\quad}");
defineMacro("\\qas", "{\\quad\\text{as}\\quad}");
defineMacro("\\qin", "{\\quad\\text{in}\\quad}");
defineMacro("\\differential", "{\\text{d}}");
defineMacro("\\dd", "{\\text{d}}");
defineMacro("\\derivative", "{\\frac{\\text{d}{ #1 }}{\\text{d}{ #2 }}}");
defineMacro("\\dv", "{\\frac{\\text{d}{ #1 }}{\\text{d}{ #2 }}}");
defineMacro("\\partialderivative", "{\\frac{\\partial{ #1 }}{\\partial{ #2 }}}");
defineMacro("\\variation", "{\\delta}");
defineMacro("\\var", "{\\delta}");
defineMacro("\\functionalderivative", "{\\frac{\\delta{ #1 }}{\\delta{ #2 }}}");
defineMacro("\\fdv", "{\\frac{\\delta{ #1 }}{\\delta{ #2 }}}");
defineMacro("\\innerproduct", "{\\left\\langle {#1} \\mid { #2} \\right\\rangle}");
defineMacro("\\outerproduct",
  "{\\left\\vert { #1 } \\right\\rangle\\left\\langle { #2} \\right\\vert}");
defineMacro("\\dyad",
  "{\\left\\vert { #1 } \\right\\rangle\\left\\langle { #2} \\right\\vert}");
defineMacro("\\ketbra",
  "{\\left\\vert { #1 } \\right\\rangle\\left\\langle { #2} \\right\\vert}");
defineMacro("\\op",
  "{\\left\\vert { #1 } \\right\\rangle\\left\\langle { #2} \\right\\vert}");
defineMacro("\\expectationvalue", "{\\left\\langle {#1 } \\right\\rangle}");
defineMacro("\\expval", "{\\left\\langle {#1 } \\right\\rangle}");
defineMacro("\\ev", "{\\left\\langle {#1 } \\right\\rangle}");
defineMacro("\\matrixelement",
  "{\\left\\langle{ #1 }\\right\\vert{ #2 }\\left\\vert{#3}\\right\\rangle}");
defineMacro("\\matrixel",
  "{\\left\\langle{ #1 }\\right\\vert{ #2 }\\left\\vert{#3}\\right\\rangle}");
defineMacro("\\mel",
  "{\\left\\langle{ #1 }\\right\\vert{ #2 }\\left\\vert{#3}\\right\\rangle}");

// Helper functions
function getHLines(parser) {
  // Return an array. The array length = number of hlines.
  // Each element in the array tells if the line is dashed.
  const hlineInfo = [];
  parser.consumeSpaces();
  let nxt = parser.fetch().text;
  if (nxt === "\\relax") {
    parser.consume();
    parser.consumeSpaces();
    nxt = parser.fetch().text;
  }
  while (nxt === "\\hline" || nxt === "\\hdashline") {
    parser.consume();
    hlineInfo.push(nxt === "\\hdashline");
    parser.consumeSpaces();
    nxt = parser.fetch().text;
  }
  return hlineInfo;
}

const validateAmsEnvironmentContext = context => {
  const settings = context.parser.settings;
  if (!settings.displayMode) {
    throw new ParseError(`{${context.envName}} can be used only in display mode.`);
  }
};

const sizeRegEx$1 = /([-+]?) *(\d+(?:\.\d*)?|\.\d+) *([a-z]{2})/;
const arrayGaps = macros => {
  let arraystretch = macros.get("\\arraystretch");
  if (typeof arraystretch !== "string") {
    arraystretch = stringFromArg(arraystretch.tokens);
  }
  arraystretch = isNaN(arraystretch) ? null : Number(arraystretch);
  let arraycolsepStr = macros.get("\\arraycolsep");
  if (typeof arraycolsepStr !== "string") {
    arraycolsepStr = stringFromArg(arraycolsepStr.tokens);
  }
  const match = sizeRegEx$1.exec(arraycolsepStr);
  const arraycolsep = match
    ? { number: +(match[1] + match[2]), unit: match[3] }
    : null;
  return [arraystretch, arraycolsep]
};

const checkCellForLabels = cell => {
  // Check if the author wrote a \tag{} inside this cell.
  let rowLabel = "";
  for (let i = 0; i < cell.length; i++) {
    if (cell[i].type === "label") {
      if (rowLabel) { throw new ParseError(("Multiple \\labels in one row")) }
      rowLabel = cell[i].string;
    }
  }
  return rowLabel
};

// autoTag (an argument to parseArray) can be one of three values:
// * undefined: Regular (not-top-level) array; no tags on each row
// * true: Automatic equation numbering, overridable by \tag
// * false: Tags allowed on each row, but no automatic numbering
// This function *doesn't* work with the "split" environment name.
function getAutoTag(name) {
  if (name.indexOf("ed") === -1) {
    return name.indexOf("*") === -1;
  }
  // return undefined;
}

/**
 * Parse the body of the environment, with rows delimited by \\ and
 * columns delimited by &, and create a nested list in row-major order
 * with one group per cell.  If given an optional argument scriptLevel
 * ("text", "display", etc.), then each cell is cast into that scriptLevel.
 */
function parseArray(
  parser,
  {
    cols, // [{ type: string , align: l|c|r|null }]
    envClasses, // align(ed|at|edat) | array | cases | cd | small | multline
    autoTag,        // boolean
    singleRow,      // boolean
    emptySingleRow, // boolean
    maxNumCols,     // number
    leqno,          // boolean
    arraystretch,   // number  | null
    arraycolsep     // size value | null
},
  scriptLevel
) {
  const endToken = envClasses && envClasses.includes("bordermatrix") ? "}" : "\\end";
  parser.gullet.beginGroup();
  if (!singleRow) {
    // \cr is equivalent to \\ without the optional size argument (see below)
    // TODO: provide helpful error when \cr is used outside array environment
    parser.gullet.macros.set("\\cr", "\\\\\\relax");
  }

  // Start group for first cell
  parser.gullet.beginGroup();

  let row = [];
  const body = [row];
  const rowGaps = [];
  const labels = [];

  const hLinesBeforeRow = [];

  const tags = (autoTag != null ? [] : undefined);

  // amsmath uses \global\@eqnswtrue and \global\@eqnswfalse to represent
  // whether this row should have an equation number.  Simulate this with
  // a \@eqnsw macro set to 1 or 0.
  function beginRow() {
    if (autoTag) {
      parser.gullet.macros.set("\\@eqnsw", "1", true);
    }
  }
  function endRow() {
    if (tags) {
      if (parser.gullet.macros.get("\\df@tag")) {
        tags.push(parser.subparse([new Token("\\df@tag")]));
        parser.gullet.macros.set("\\df@tag", undefined, true);
      } else {
        tags.push(Boolean(autoTag) &&
            parser.gullet.macros.get("\\@eqnsw") === "1");
      }
    }
  }
  beginRow();

  // Test for \hline at the top of the array.
  hLinesBeforeRow.push(getHLines(parser));

  while (true) {
    // Parse each cell in its own group (namespace)
    let cell = parser.parseExpression(false, singleRow ? "\\end" : "\\\\");
    parser.gullet.endGroup();
    parser.gullet.beginGroup();

    cell = {
      type: "ordgroup",
      mode: parser.mode,
      body: cell,
      semisimple: true
    };
    row.push(cell);
    const next = parser.fetch().text;
    if (next === "&") {
      if (maxNumCols && row.length === maxNumCols) {
        if (envClasses.includes("array")) {
          if (parser.settings.strict) {
            throw new ParseError("Too few columns " + "specified in the {array} column argument.",
              parser.nextToken)
          }
        } else if (maxNumCols === 2) {
          throw new ParseError("The split environment accepts no more than two columns",
            parser.nextToken);
        } else {
          throw new ParseError("The equation environment accepts only one column",
            parser.nextToken)
        }
      }
      parser.consume();
    } else if (next === endToken) {
      endRow();
      // Arrays terminate newlines with `\crcr` which consumes a `\cr` if
      // the last line is empty.  However, AMS environments keep the
      // empty row if it's the only one.
      // NOTE: Currently, `cell` is the last item added into `row`.
      if (row.length === 1 && cell.body.length === 0 && (body.length > 1 || !emptySingleRow)) {
        body.pop();
      }
      labels.push(checkCellForLabels(cell.body));
      if (hLinesBeforeRow.length < body.length + 1) {
        hLinesBeforeRow.push([]);
      }
      break;
    } else if (next === "\\\\") {
      parser.consume();
      let size;
      // \def\Let@{\let\\\math@cr}
      // \def\math@cr{...\math@cr@}
      // \def\math@cr@{\new@ifnextchar[\math@cr@@{\math@cr@@[\z@]}}
      // \def\math@cr@@[#1]{...\math@cr@@@...}
      // \def\math@cr@@@{\cr}
      if (parser.gullet.future().text !== " ") {
        size = parser.parseSizeGroup(true);
      }
      rowGaps.push(size ? size.value : null);
      endRow();

      labels.push(checkCellForLabels(cell.body));

      // check for \hline(s) following the row separator
      hLinesBeforeRow.push(getHLines(parser));

      row = [];
      body.push(row);
      beginRow();
    } else {
      throw new ParseError("Expected & or \\\\ or \\cr or " + endToken, parser.nextToken);
    }
  }

  // End cell group
  parser.gullet.endGroup();
  // End array group defining \cr
  parser.gullet.endGroup();

  return {
    type: "array",
    mode: parser.mode,
    body,
    cols,
    rowGaps,
    hLinesBeforeRow,
    envClasses,
    autoTag,
    scriptLevel,
    tags,
    labels,
    leqno,
    arraystretch,
    arraycolsep
  };
}

// Decides on a scriptLevel for cells in an array according to whether the given
// environment name starts with the letter 'd'.
function dCellStyle(envName) {
  return envName.slice(0, 1) === "d" ? "display" : "text"
}

const alignMap = {
  c: "center ",
  l: "left ",
  r: "right "
};

const glue = group => {
  const glueNode = new mathMLTree.MathNode("mtd", []);
  glueNode.style = { padding: "0", width: "50%" };
  if (group.envClasses.includes("multline")) {
    glueNode.style.width = "7.5%";
  }
  return glueNode
};

const mathmlBuilder$9 = function(group, style) {
  const tbl = [];
  const numRows = group.body.length;
  const hlines = group.hLinesBeforeRow;

  for (let i = 0; i < numRows; i++) {
    const rw = group.body[i];
    const row = [];
    const cellLevel = group.scriptLevel === "text"
      ? StyleLevel.TEXT
      : group.scriptLevel === "script"
      ? StyleLevel.SCRIPT
      : StyleLevel.DISPLAY;

    for (let j = 0; j < rw.length; j++) {
      const mtd = new mathMLTree.MathNode(
        "mtd",
        [buildGroup$1(rw[j], style.withLevel(cellLevel))]
      );

      if (group.envClasses.includes("multline")) {
        const align = i === 0 ? "left" : i === numRows - 1 ? "right" : "center";
        if (align !== "center") {
          mtd.classes.push("tml-" + align);
        }
      }
      row.push(mtd);
    }
    const numColumns = group.body[0].length;
    // Fill out a short row with empty <mtd> elements.
    for (let k = 0; k < numColumns - rw.length; k++) {
      row.push(new mathMLTree.MathNode("mtd", [], [], style));
    }
    if (group.autoTag) {
      const tag = group.tags[i];
      let tagElement;
      if (tag === true) {  // automatic numbering
        tagElement = new mathMLTree.MathNode("mtext", [new Span(["tml-eqn"])]);
      } else if (tag === false) {
        // \nonumber/\notag or starred environment
        tagElement = new mathMLTree.MathNode("mtext", [], []);
      } else {  // manual \tag
        tagElement = buildExpressionRow(tag[0].body, style.withLevel(cellLevel), true);
        tagElement = consolidateText(tagElement);
        tagElement.classes = ["tml-tag"];
      }
      if (tagElement) {
        row.unshift(glue(group));
        row.push(glue(group));
        if (group.leqno) {
          row[0].children.push(tagElement);
        } else {
          row[row.length - 1].children.push(tagElement);
        }
      }
    }
    const mtr = new mathMLTree.MathNode("mtr", row, []);
    const label = group.labels.shift();
    if (label && group.tags && group.tags[i]) {
      mtr.setAttribute("id", label);
      if (Array.isArray(group.tags[i])) { mtr.classes.push("tml-tageqn"); }
    }

    // Write horizontal rules
    if (i === 0 && hlines[0].length > 0) {
      if (hlines[0].length === 2) {
        mtr.children.forEach(cell => { cell.style.borderTop = "0.15em double"; });
      } else {
        mtr.children.forEach(cell => {
          cell.style.borderTop = hlines[0][0] ? "0.06em dashed" : "0.06em solid";
        });
      }
    }
    if (hlines[i + 1].length > 0) {
      if (hlines[i + 1].length === 2) {
        mtr.children.forEach(cell => { cell.style.borderBottom = "0.15em double"; });
      } else {
        mtr.children.forEach(cell => {
          cell.style.borderBottom = hlines[i + 1][0] ? "0.06em dashed" : "0.06em solid";
        });
      }
    }

    // Check for \hphantom \from \bordermatrix
    let mustSquashRow = true;
    for (let j = 0; j < mtr.children.length; j++) {
      const child = mtr.children[j].children[0];
      if (!(child && child.type === "mpadded" && child.attributes.height === "0px")) {
        mustSquashRow = false;
        break
      }
    }
    if (mustSquashRow) {
      // All the cell contents are \hphantom. Squash the cell.
      for (let j = 0; j < mtr.children.length; j++) {
        mtr.children[j].style.display = "block";  // necessary in Firefox only
        mtr.children[j].style.height = "0";       // necessary in Firefox only
        mtr.children[j].style.paddingTop = "0";
        mtr.children[j].style.paddingBottom = "0";
      }
    }

    tbl.push(mtr);
  }

  if (group.arraystretch && group.arraystretch !== 1) {
    // In LaTeX, \arraystretch is a factor applied to a 12pt strut height.
    // It defines a baseline to baseline distance.
    // Here, we do an approximation of that approach.
    const pad = String(1.4 * group.arraystretch - 0.8) + "ex";
    for (let i = 0; i < tbl.length; i++) {
      for (let j = 0; j < tbl[i].children.length; j++) {
        tbl[i].children[j].style.paddingTop = pad;
        tbl[i].children[j].style.paddingBottom = pad;
      }
    }
  }

  let sidePadding;
  let sidePadUnit;
  if (group.envClasses.length > 0) {
    sidePadding = group.envClasses.includes("abut")
      ? "0"
      : group.envClasses.includes("cases")
      ? "0"
      : group.envClasses.includes("small")
      ? "0.1389"
      : group.envClasses.includes("cd")
      ? "0.25"
      : "0.4"; // default side padding
    sidePadUnit = "em";
  }
  if (group.arraycolsep) {
    const arraySidePad = calculateSize(group.arraycolsep, style);
    sidePadding = arraySidePad.number.toFixed(4);
    sidePadUnit = arraySidePad.unit;
  }
  if (sidePadding) {
    const numCols = tbl.length === 0 ? 0 : tbl[0].children.length;

    const sidePad = (j, hand) => {
      if (j === 0 && hand === 0) { return "0" }
      if (j === numCols - 1 && hand === 1) { return "0" }
      if (group.envClasses[0] !== "align") { return sidePadding }
      if (hand === 1) { return "0" }
      if (group.autoTag) {
        return (j % 2) ? "1" : "0"
      } else {
        return (j % 2) ? "0" : "1"
      }
    };

    // Side padding
    for (let i = 0; i < tbl.length; i++) {
      for (let j = 0; j < tbl[i].children.length; j++) {
        tbl[i].children[j].style.paddingLeft = `${sidePad(j, 0)}${sidePadUnit}`;
        tbl[i].children[j].style.paddingRight = `${sidePad(j, 1)}${sidePadUnit}`;
      }
    }
  }
  if (group.envClasses.length === 0) {
    // Set zero padding on side of the matrix
    for (let i = 0; i < tbl.length; i++) {
      tbl[i].children[0].style.paddingLeft = "0em";
      if (tbl[i].children.length === tbl[0].children.length) {
        tbl[i].children[tbl[i].children.length - 1].style.paddingRight = "0em";
      }
    }
  }

  if (group.envClasses.length > 0) {
    // Justification
    const align = group.envClasses.includes("align") || group.envClasses.includes("alignat");
    for (let i = 0; i < tbl.length; i++) {
      const row = tbl[i];
      if (align) {
        for (let j = 0; j < row.children.length; j++) {
          // Chromium does not recognize text-align: left. Use -webkit-
          // TODO: Remove -webkit- when Chromium no longer needs it.
          row.children[j].classes = ["tml-" + (j % 2 ? "left" : "right")];
        }
        if (group.autoTag) {
          const k = group.leqno ? 0 : row.children.length - 1;
          row.children[k].classes = [];  // Default is center.
        }
      }
      if (row.children.length > 1 && group.envClasses.includes("cases")) {
        row.children[1].style.paddingLeft = "1em";
      }

      if (group.envClasses.includes("cases") || group.envClasses.includes("subarray")) {
        for (const cell of row.children) {
          cell.classes.push("tml-left");
        }
      }
    }
  }

  let table = new mathMLTree.MathNode("mtable", tbl);
  if (group.envClasses.length > 0) {
    // Top & bottom padding
    if (group.envClasses.includes("jot")) {
      table.classes.push("tml-jot");
    } else if (group.envClasses.includes("small")) {
      table.classes.push("tml-small");
    }
  }
  if (group.scriptLevel === "display") { table.setAttribute("displaystyle", "true"); }

  if (group.autoTag || group.envClasses.includes("multline")) {
    table.style.width = "100%";
  }

  // Column separator lines and column alignment

  if (group.cols && group.cols.length > 0) {
    const cols = group.cols;
    let prevTypeWasAlign = false;
    let iStart = 0;
    let iEnd = cols.length;

    while (cols[iStart].type === "separator") {
      iStart += 1;
    }
    while (cols[iEnd - 1].type === "separator") {
      iEnd -= 1;
    }

    if (cols[0].type === "separator") {
      const sep = cols[1].type === "separator"
        ? "0.15em double"
        : cols[0].separator === "|"
        ? "0.06em solid "
        : "0.06em dashed ";
      for (const row of table.children) {
        row.children[0].style.borderLeft = sep;
      }
    }
    let iCol = group.autoTag ? 0 : -1;
    for (let i = iStart; i < iEnd; i++) {
      if (cols[i].type === "align") {
        const colAlign = alignMap[cols[i].align];
        iCol += 1;
        for (const row of table.children) {
          if (colAlign.trim() !== "center" && iCol < row.children.length) {
            row.children[iCol].classes = ["tml-" + colAlign.trim()];
          }
        }
        prevTypeWasAlign = true;
      } else if (cols[i].type === "separator") {
        // MathML accepts only single lines between cells.
        // So we read only the first of consecutive separators.
        if (prevTypeWasAlign) {
          const sep = cols[i + 1].type === "separator"
            ? "0.15em double"
            : cols[i].separator === "|"
            ? "0.06em solid"
            : "0.06em dashed";
          for (const row of table.children) {
            if (iCol < row.children.length) {
              row.children[iCol].style.borderRight = sep;
            }
          }
        }
        prevTypeWasAlign = false;
      }
    }
    if (cols[cols.length - 1].type === "separator") {
      const sep = cols[cols.length - 2].type === "separator"
        ? "0.15em double"
        : cols[cols.length - 1].separator === "|"
        ? "0.06em solid"
        : "0.06em dashed";
      for (const row of table.children) {
        row.children[row.children.length - 1].style.borderRight = sep;
        row.children[row.children.length - 1].style.paddingRight = "0.4em";
      }
    }
  }

  if (group.envClasses.includes("small")) {
    // A small array. Wrap in scriptstyle.
    table = new mathMLTree.MathNode("mstyle", [table]);
    table.setAttribute("scriptlevel", "1");
  }

  return table
};

// Convenience function for align, align*, aligned, alignat, alignat*, alignedat, split.
const alignedHandler = function(context, args) {
  if (context.envName.indexOf("ed") === -1) {
    validateAmsEnvironmentContext(context);
  }
  const isSplit = context.envName === "split";
  const cols = [];
  const res = parseArray(
    context.parser,
    {
      cols,
      emptySingleRow: true,
      autoTag: isSplit ? undefined : getAutoTag(context.envName),
      envClasses: ["abut", "jot"], // set row spacing & provisional column spacing
      maxNumCols: context.envName === "split" ? 2 : undefined,
      leqno: context.parser.settings.leqno
    },
    "display"
  );

  // Determining number of columns.
  // 1. If the first argument is given, we use it as a number of columns,
  //    and makes sure that each row doesn't exceed that number.
  // 2. Otherwise, just count number of columns = maximum number
  //    of cells in each row ("aligned" mode -- isAligned will be true).
  //
  // At the same time, prepend empty group {} at beginning of every second
  // cell in each row (starting with second cell) so that operators become
  // binary.  This behavior is implemented in amsmath's \start@aligned.
  let numMaths;
  let numCols = 0;
  const isAlignedAt = context.envName.indexOf("at") > -1;
  if (args[0] && isAlignedAt) {
    // alignat environment takes an argument w/ number of columns
    let arg0 = "";
    for (let i = 0; i < args[0].body.length; i++) {
      const textord = assertNodeType(args[0].body[i], "textord");
      arg0 += textord.text;
    }
    if (isNaN(arg0)) {
      throw new ParseError("The alignat enviroment requires a numeric first argument.")
    }
    numMaths = Number(arg0);
    numCols = numMaths * 2;
  }
  res.body.forEach(function(row) {
    if (isAlignedAt) {
      // Case 1
      const curMaths = row.length / 2;
      if (numMaths < curMaths) {
        throw new ParseError(
          "Too many math in a row: " + `expected ${numMaths}, but got ${curMaths}`,
          row[0]
        );
      }
    } else if (numCols < row.length) {
      // Case 2
      numCols = row.length;
    }
  });

  // Adjusting alignment.
  // In aligned mode, we add one \qquad between columns;
  // otherwise we add nothing.
  for (let i = 0; i < numCols; ++i) {
    let align = "r";
    if (i % 2 === 1) {
      align = "l";
    }
    cols[i] = {
      type: "align",
      align: align
    };
  }
  if (context.envName === "split") ; else if (isAlignedAt) {
    res.envClasses.push("alignat"); // Sets justification
  } else {
    res.envClasses[0] = "align"; // Sets column spacing & justification
  }
  return res;
};

// Arrays are part of LaTeX, defined in lttab.dtx so its documentation
// is part of the source2e.pdf file of LaTeX2e source documentation.
// {darray} is an {array} environment where cells are set in \displaystyle,
// as defined in nccmath.sty.
defineEnvironment({
  type: "array",
  names: ["array", "darray"],
  props: {
    numArgs: 1
  },
  handler(context, args) {
    // Since no types are specified above, the two possibilities are
    // - The argument is wrapped in {} or [], in which case Parser's
    //   parseGroup() returns an "ordgroup" wrapping some symbol node.
    // - The argument is a bare symbol node.
    const symNode = checkSymbolNodeType(args[0]);
    const colalign = symNode ? [args[0]] : assertNodeType(args[0], "ordgroup").body;
    const cols = colalign.map(function(nde) {
      const node = assertSymbolNodeType(nde);
      const ca = node.text;
      if ("lcr".indexOf(ca) !== -1) {
        return {
          type: "align",
          align: ca
        };
      } else if (ca === "|") {
        return {
          type: "separator",
          separator: "|"
        };
      } else if (ca === ":") {
        return {
          type: "separator",
          separator: ":"
        };
      }
      throw new ParseError("Unknown column alignment: " + ca, nde);
    });
    const [arraystretch, arraycolsep] = arrayGaps(context.parser.gullet.macros);
    const res = {
      cols,
      envClasses: ["array"],
      maxNumCols: cols.length,
      arraystretch,
      arraycolsep
    };
    return parseArray(context.parser, res, dCellStyle(context.envName));
  },
  mathmlBuilder: mathmlBuilder$9
});

// The matrix environments of amsmath build on the array environment
// of LaTeX, which is discussed above.
// The mathtools package adds starred versions of the same environments.
// These have an optional argument to choose left|center|right justification.
defineEnvironment({
  type: "array",
  names: [
    "matrix",
    "pmatrix",
    "bmatrix",
    "Bmatrix",
    "vmatrix",
    "Vmatrix",
    "matrix*",
    "pmatrix*",
    "bmatrix*",
    "Bmatrix*",
    "vmatrix*",
    "Vmatrix*"
  ],
  props: {
    numArgs: 0
  },
  handler(context) {
    const delimiters = {
      matrix: null,
      pmatrix: ["(", ")"],
      bmatrix: ["[", "]"],
      Bmatrix: ["\\{", "\\}"],
      vmatrix: ["|", "|"],
      Vmatrix: ["\\Vert", "\\Vert"]
    }[context.envName.replace("*", "")];
    // \hskip -\arraycolsep in amsmath
    let colAlign = "c";
    const payload = {
      envClasses: [],
      cols: []
    };
    if (context.envName.charAt(context.envName.length - 1) === "*") {
      // It's one of the mathtools starred functions.
      // Parse the optional alignment argument.
      const parser = context.parser;
      parser.consumeSpaces();
      if (parser.fetch().text === "[") {
        parser.consume();
        parser.consumeSpaces();
        colAlign = parser.fetch().text;
        if ("lcr".indexOf(colAlign) === -1) {
          throw new ParseError("Expected l or c or r", parser.nextToken);
        }
        parser.consume();
        parser.consumeSpaces();
        parser.expect("]");
        parser.consume();
        payload.cols = [];
      }
    }
    const res = parseArray(context.parser, payload, "text");
    res.cols = res.body.length > 0
      ? new Array(res.body[0].length).fill({ type: "align", align: colAlign })
      : [];
    const [arraystretch, arraycolsep] = arrayGaps(context.parser.gullet.macros);
    res.arraystretch = arraystretch;
    if (arraycolsep && !(arraycolsep === 6 && arraycolsep === "pt")) {
      res.arraycolsep = arraycolsep;
    }
    return delimiters
      ? {
        type: "leftright",
        mode: context.mode,
        body: [res],
        left: delimiters[0],
        right: delimiters[1],
        rightColor: undefined // \right uninfluenced by \color in array
      }
      : res;
  },
  mathmlBuilder: mathmlBuilder$9
});

defineEnvironment({
  type: "array",
  names: ["bordermatrix"],
  props: {
    numArgs: 0
  },
  handler(context) {
    const payload = { cols: [], envClasses: ["bordermatrix"] };
    const res = parseArray(context.parser, payload, "text");
    res.cols = res.body.length > 0
      ? new Array(res.body[0].length).fill({ type: "align", align: "c" })
      : [];
    res.envClasses = [];
    res.arraystretch = 1;
    if (context.envName === "matrix") { return res}
    return bordermatrixParseTree(res, context.delimiters)
  },
  mathmlBuilder: mathmlBuilder$9
});

defineEnvironment({
  type: "array",
  names: ["smallmatrix"],
  props: {
    numArgs: 0
  },
  handler(context) {
    const payload = { type: "small" };
    const res = parseArray(context.parser, payload, "script");
    res.envClasses = ["small"];
    return res;
  },
  mathmlBuilder: mathmlBuilder$9
});

defineEnvironment({
  type: "array",
  names: ["subarray"],
  props: {
    numArgs: 1
  },
  handler(context, args) {
    // Parsing of {subarray} is similar to {array}
    const symNode = checkSymbolNodeType(args[0]);
    const colalign = symNode ? [args[0]] : assertNodeType(args[0], "ordgroup").body;
    const cols = colalign.map(function(nde) {
      const node = assertSymbolNodeType(nde);
      const ca = node.text;
      // {subarray} only recognizes "l" & "c"
      if ("lc".indexOf(ca) !== -1) {
        return {
          type: "align",
          align: ca
        };
      }
      throw new ParseError("Unknown column alignment: " + ca, nde);
    });
    if (cols.length > 1) {
      throw new ParseError("{subarray} can contain only one column");
    }
    let res = {
      cols,
      envClasses: ["small"]
    };
    res = parseArray(context.parser, res, "script");
    if (res.body.length > 0 && res.body[0].length > 1) {
      throw new ParseError("{subarray} can contain only one column");
    }
    return res;
  },
  mathmlBuilder: mathmlBuilder$9
});

// A cases environment (in amsmath.sty) is almost equivalent to
// \def
// \left\{\begin{array}{@{}l@{\quad}l@{}} … \end{array}\right.
// {dcases} is a {cases} environment where cells are set in \displaystyle,
// as defined in mathtools.sty.
// {rcases} is another mathtools environment. It's brace is on the right side.
defineEnvironment({
  type: "array",
  names: ["cases", "dcases", "rcases", "drcases"],
  props: {
    numArgs: 0
  },
  handler(context) {
    const payload = {
      cols: [],
      envClasses: ["cases"]
    };
    const res = parseArray(context.parser, payload, dCellStyle(context.envName));
    return {
      type: "leftright",
      mode: context.mode,
      body: [res],
      left: context.envName.indexOf("r") > -1 ? "." : "\\{",
      right: context.envName.indexOf("r") > -1 ? "\\}" : ".",
      rightColor: undefined
    };
  },
  mathmlBuilder: mathmlBuilder$9
});

// In the align environment, one uses ampersands, &, to specify number of
// columns in each row, and to locate spacing between each column.
// align gets automatic numbering. align* and aligned do not.
// The alignedat environment can be used in math mode.
defineEnvironment({
  type: "array",
  names: ["align", "align*", "aligned", "split"],
  props: {
    numArgs: 0
  },
  handler: alignedHandler,
  mathmlBuilder: mathmlBuilder$9
});

// alignat environment is like an align environment, but one must explicitly
// specify maximum number of columns in each row, and can adjust where spacing occurs.
defineEnvironment({
  type: "array",
  names: ["alignat", "alignat*", "alignedat"],
  props: {
    numArgs: 1
  },
  handler: alignedHandler,
  mathmlBuilder: mathmlBuilder$9
});

// A gathered environment is like an array environment with one centered
// column, but where rows are considered lines so get \jot line spacing
// and contents are set in \displaystyle.
defineEnvironment({
  type: "array",
  names: ["gathered", "gather", "gather*"],
  props: {
    numArgs: 0
  },
  handler(context) {
    if (context.envName !== "gathered") {
      validateAmsEnvironmentContext(context);
    }
    const res = {
      cols: [],
      envClasses: ["abut", "jot"],
      autoTag: getAutoTag(context.envName),
      emptySingleRow: true,
      leqno: context.parser.settings.leqno
    };
    return parseArray(context.parser, res, "display");
  },
  mathmlBuilder: mathmlBuilder$9
});

defineEnvironment({
  type: "array",
  names: ["equation", "equation*"],
  props: {
    numArgs: 0
  },
  handler(context) {
    validateAmsEnvironmentContext(context);
    const res = {
      autoTag: getAutoTag(context.envName),
      emptySingleRow: true,
      singleRow: true,
      maxNumCols: 1,
      envClasses: ["align"],
      leqno: context.parser.settings.leqno
    };
    return parseArray(context.parser, res, "display");
  },
  mathmlBuilder: mathmlBuilder$9
});

defineEnvironment({
  type: "array",
  names: ["multline", "multline*"],
  props: {
    numArgs: 0
  },
  handler(context) {
    validateAmsEnvironmentContext(context);
    const res = {
      autoTag: context.envName === "multline",
      maxNumCols: 1,
      envClasses: ["jot", "multline"],
      leqno: context.parser.settings.leqno
    };
    return parseArray(context.parser, res, "display");
  },
  mathmlBuilder: mathmlBuilder$9
});

defineEnvironment({
  type: "array",
  names: ["CD"],
  props: {
    numArgs: 0
  },
  handler(context) {
    validateAmsEnvironmentContext(context);
    return parseCD(context.parser);
  },
  mathmlBuilder: mathmlBuilder$9
});

// Catch \hline outside array environment
defineFunction({
  type: "text", // Doesn't matter what this is.
  names: ["\\hline", "\\hdashline"],
  props: {
    numArgs: 0,
    allowedInText: true,
    allowedInMath: true
  },
  handler(context, args) {
    throw new ParseError(`${context.funcName} valid only within array environment`);
  }
});

const environments = _environments;

// \bordermatrix  from TeXbook pp 177 & 361
// Optional argument from Herbert Voß, Math mode, p 20
// Ref: https://tug.ctan.org/obsolete/info/math/voss/mathmode/Mathmode.pdf

defineFunction({
  type: "bordermatrix",
  names: ["\\bordermatrix", "\\matrix"],
  props: {
    numArgs: 0,
    numOptionalArgs: 1
  },
  handler: ({ parser, funcName }, args, optArgs) => {
    // Find out if the author has defined custom delimiters
    let delimiters = ["(", ")"];
    if (funcName === "\\bordermatrix" && optArgs[0] && optArgs[0].body) {
      const body = optArgs[0].body;
      if (body.length === 2 && body[0].type === "atom" && body[1].type === "atom") {
        if (body[0].family === "open" && body[1].family === "close") {
          delimiters = [body[0].text, body[1].text];
        }
      }
    }
    // consume the opening brace
    parser.consumeSpaces();
    parser.consume();

    // Pass control to the environment handler in array.js.
    const env = environments["bordermatrix"];
    const context = {
      mode: parser.mode,
      envName: funcName.slice(1),
      delimiters,
      parser
    };
    const result = env.handler(context);
    parser.expect("}", true);
    return result
  }
});

// \@char is an internal function that takes a grouped decimal argument like
// {123} and converts into symbol with code 123.  It is used by the *macro*
// \char defined in macros.js.
defineFunction({
  type: "textord",
  names: ["\\@char"],
  props: {
    numArgs: 1,
    allowedInText: true
  },
  handler({ parser, token }, args) {
    const arg = assertNodeType(args[0], "ordgroup");
    const group = arg.body;
    let number = "";
    for (let i = 0; i < group.length; i++) {
      const node = assertNodeType(group[i], "textord");
      number += node.text;
    }
    const code = parseInt(number);
    if (isNaN(code)) {
      throw new ParseError(`\\@char has non-numeric argument ${number}`, token)
    }
    return {
      type: "textord",
      mode: parser.mode,
      text: String.fromCodePoint(code)
    }
  }
});

// Helpers
const htmlRegEx = /^(#[a-f0-9]{3}|#?[a-f0-9]{6})$/i;
const htmlOrNameRegEx = /^(#[a-f0-9]{3}|#?[a-f0-9]{6}|[a-z]+)$/i;
const RGBregEx = /^ *\d{1,3} *(?:, *\d{1,3} *){2}$/;
const rgbRegEx = /^ *[10](?:\.\d*)? *(?:, *[10](?:\.\d*)? *){2}$/;
const xcolorHtmlRegEx = /^[a-f0-9]{6}$/i;
const toHex = num => {
  let str = num.toString(16);
  if (str.length === 1) { str = "0" + str; }
  return str
};

// Colors from Tables 4.1 and 4.2 of the xcolor package.
// Table 4.1 (lower case) RGB values are taken from chroma and xcolor.dtx.
// Table 4.2 (Capitalizzed) values were sampled, because Chroma contains a unreliable
// conversion from cmyk to RGB. See https://tex.stackexchange.com/a/537274.
const xcolors = JSON.parse(`{
  "Apricot": "#ffb484",
  "Aquamarine": "#08b4bc",
  "Bittersweet": "#c84c14",
  "blue": "#0000FF",
  "Blue": "#303494",
  "BlueGreen": "#08b4bc",
  "BlueViolet": "#503c94",
  "BrickRed": "#b8341c",
  "brown": "#BF8040",
  "Brown": "#802404",
  "BurntOrange": "#f8941c",
  "CadetBlue": "#78749c",
  "CarnationPink": "#f884b4",
  "Cerulean": "#08a4e4",
  "CornflowerBlue": "#40ace4",
  "cyan": "#00FFFF",
  "Cyan": "#08acec",
  "Dandelion": "#ffbc44",
  "darkgray": "#404040",
  "DarkOrchid": "#a8548c",
  "Emerald": "#08ac9c",
  "ForestGreen": "#089c54",
  "Fuchsia": "#90348c",
  "Goldenrod": "#ffdc44",
  "gray": "#808080",
  "Gray": "#98949c",
  "green": "#00FF00",
  "Green": "#08a44c",
  "GreenYellow": "#e0e474",
  "JungleGreen": "#08ac9c",
  "Lavender": "#f89cc4",
  "lightgray": "#c0c0c0",
  "lime": "#BFFF00",
  "LimeGreen": "#90c43c",
  "magenta": "#FF00FF",
  "Magenta": "#f0048c",
  "Mahogany": "#b0341c",
  "Maroon": "#b03434",
  "Melon": "#f89c7c",
  "MidnightBlue": "#086494",
  "Mulberry": "#b03c94",
  "NavyBlue": "#086cbc",
  "olive": "#7F7F00",
  "OliveGreen": "#407c34",
  "orange": "#FF8000",
  "Orange": "#f8843c",
  "OrangeRed": "#f0145c",
  "Orchid": "#b074ac",
  "Peach": "#f8945c",
  "Periwinkle": "#8074bc",
  "PineGreen": "#088c74",
  "pink": "#ff7f7f",
  "Plum": "#98248c",
  "ProcessBlue": "#08b4ec",
  "purple": "#BF0040",
  "Purple": "#a0449c",
  "RawSienna": "#983c04",
  "red": "#ff0000",
  "Red": "#f01c24",
  "RedOrange": "#f86434",
  "RedViolet": "#a0246c",
  "Rhodamine": "#f0549c",
  "Royallue": "#0874bc",
  "RoyalPurple": "#683c9c",
  "RubineRed": "#f0047c",
  "Salmon": "#f8948c",
  "SeaGreen": "#30bc9c",
  "Sepia": "#701404",
  "SkyBlue": "#48c4dc",
  "SpringGreen": "#c8dc64",
  "Tan": "#e09c74",
  "teal": "#007F7F",
  "TealBlue": "#08acb4",
  "Thistle": "#d884b4",
  "Turquoise": "#08b4cc",
  "violet": "#800080",
  "Violet": "#60449c",
  "VioletRed": "#f054a4",
  "WildStrawberry": "#f0246c",
  "yellow": "#FFFF00",
  "Yellow": "#fff404",
  "YellowGreen": "#98cc6c",
  "YellowOrange": "#ffa41c"
}`);

const colorFromSpec = (model, spec) => {
  let color = "";
  if (model === "HTML") {
    if (!htmlRegEx.test(spec)) {
      throw new ParseError("Invalid HTML input.")
    }
    color = spec;
  } else if (model === "RGB") {
    if (!RGBregEx.test(spec)) {
      throw new ParseError("Invalid RGB input.")
    }
    spec.split(",").map(e => { color += toHex(Number(e.trim())); });
  } else {
    if (!rgbRegEx.test(spec)) {
      throw new ParseError("Invalid rbg input.")
    }
    spec.split(",").map(e => {
      const num = Number(e.trim());
      if (num > 1) { throw new ParseError("Color rgb input must be < 1.") }
      color += toHex(Number((num * 255).toFixed(0)));
    });
  }
  if (color.charAt(0) !== "#") { color = "#" + color; }
  return color
};

const validateColor = (color, macros, token) => {
  const macroName = `\\\\color@${color}`; // from \defineColor.
  const match = htmlOrNameRegEx.exec(color);
  if (!match) { throw new ParseError("Invalid color: '" + color + "'", token) }
  // We allow a 6-digit HTML color spec without a leading "#".
  // This follows the xcolor package's HTML color model.
  // Predefined color names are all missed by this RegEx pattern.
  if (xcolorHtmlRegEx.test(color)) {
    return "#" + color
  } else if (color.charAt(0) === "#") {
    return color
  } else if (macros.has(macroName)) {
    color = macros.get(macroName).tokens[0].text;
  } else if (xcolors[color]) {
    color = xcolors[color];
  }
  return color
};

const mathmlBuilder$8 = (group, style) => {
  // In LaTeX, color is not supposed to change the spacing of any node.
  // So instead of wrapping the group in an <mstyle>, we apply
  // the color individually to each node and return a document fragment.
  let expr = buildExpression(group.body, style.withColor(group.color));
  if (expr.length === 0) {
    expr.push(new mathMLTree.MathNode("mrow"));
  }
  expr = expr.map(e => {
    e.style.color = group.color;
    return e
  });
  return mathMLTree.newDocumentFragment(expr)
};

defineFunction({
  type: "color",
  names: ["\\textcolor"],
  props: {
    numArgs: 2,
    numOptionalArgs: 1,
    allowedInText: true,
    argTypes: ["raw", "raw", "original"]
  },
  handler({ parser, token }, args, optArgs) {
    const model = optArgs[0] && assertNodeType(optArgs[0], "raw").string;
    let color = "";
    if (model) {
      const spec = assertNodeType(args[0], "raw").string;
      color = colorFromSpec(model, spec);
    } else {
      color = validateColor(assertNodeType(args[0], "raw").string, parser.gullet.macros, token);
    }
    const body = args[1];
    return {
      type: "color",
      mode: parser.mode,
      color,
      isTextColor: true,
      body: ordargument(body)
    }
  },
  mathmlBuilder: mathmlBuilder$8
});

defineFunction({
  type: "color",
  names: ["\\color"],
  props: {
    numArgs: 1,
    numOptionalArgs: 1,
    allowedInText: true,
    argTypes: ["raw", "raw"]
  },
  handler({ parser, breakOnTokenText, token }, args, optArgs) {
    const model = optArgs[0] && assertNodeType(optArgs[0], "raw").string;
    let color = "";
    if (model) {
      const spec = assertNodeType(args[0], "raw").string;
      color = colorFromSpec(model, spec);
    } else {
      color = validateColor(assertNodeType(args[0], "raw").string, parser.gullet.macros, token);
    }

    // Parse out the implicit body that should be colored.
    const body = parser.parseExpression(true, breakOnTokenText, true);

    return {
      type: "color",
      mode: parser.mode,
      color,
      isTextColor: false,
      body
    }
  },
  mathmlBuilder: mathmlBuilder$8
});

defineFunction({
  type: "color",
  names: ["\\definecolor"],
  props: {
    numArgs: 3,
    allowedInText: true,
    argTypes: ["raw", "raw", "raw"]
  },
  handler({ parser, funcName, token }, args) {
    const name = assertNodeType(args[0], "raw").string;
    if (!/^[A-Za-z]+$/.test(name)) {
      throw new ParseError("Color name must be latin letters.", token)
    }
    const model = assertNodeType(args[1], "raw").string;
    if (!["HTML", "RGB", "rgb"].includes(model)) {
      throw new ParseError("Color model must be HTML, RGB, or rgb.", token)
    }
    const spec = assertNodeType(args[2], "raw").string;
    const color = colorFromSpec(model, spec);
    parser.gullet.macros.set(`\\\\color@${name}`, { tokens: [{ text: color }], numArgs: 0 });
    return { type: "internal", mode: parser.mode }
  }
  // No mathmlBuilder. The point of \definecolor is to set a macro.
});

// Row breaks within tabular environments, and line breaks at top level


// \DeclareRobustCommand\\{...\@xnewline}
defineFunction({
  type: "cr",
  names: ["\\\\"],
  props: {
    numArgs: 0,
    numOptionalArgs: 0,
    allowedInText: true
  },

  handler({ parser }, args, optArgs) {
    const size = parser.gullet.future().text === "[" ? parser.parseSizeGroup(true) : null;
    const newLine = !parser.settings.displayMode;
    return {
      type: "cr",
      mode: parser.mode,
      newLine,
      size: size && assertNodeType(size, "size").value
    }
  },

  // The following builder is called only at the top level,
  // not within tabular/array environments.

  mathmlBuilder(group, style) {
    // MathML 3.0 calls for newline to occur in an <mo> or an <mspace>.
    // Ref: https://www.w3.org/TR/MathML3/chapter3.html#presm.linebreaking
    const node = new mathMLTree.MathNode("mo");
    if (group.newLine) {
      node.setAttribute("linebreak", "newline");
      if (group.size) {
        const size = calculateSize(group.size, style);
        node.setAttribute("height", size.number + size.unit);
      }
    }
    return node
  }
});

const globalMap = {
  "\\global": "\\global",
  "\\long": "\\\\globallong",
  "\\\\globallong": "\\\\globallong",
  "\\def": "\\gdef",
  "\\gdef": "\\gdef",
  "\\edef": "\\xdef",
  "\\xdef": "\\xdef",
  "\\let": "\\\\globallet",
  "\\futurelet": "\\\\globalfuture"
};

const checkControlSequence = (tok) => {
  const name = tok.text;
  if (/^(?:[\\{}$&#^_]|EOF)$/.test(name)) {
    throw new ParseError("Expected a control sequence", tok);
  }
  return name;
};

const getRHS = (parser) => {
  let tok = parser.gullet.popToken();
  if (tok.text === "=") {
    // consume optional equals
    tok = parser.gullet.popToken();
    if (tok.text === " ") {
      // consume one optional space
      tok = parser.gullet.popToken();
    }
  }
  return tok;
};

const letCommand = (parser, name, tok, global) => {
  let macro = parser.gullet.macros.get(tok.text);
  if (macro == null) {
    // don't expand it later even if a macro with the same name is defined
    // e.g., \let\foo=\frac \def\frac{\relax} \frac12
    tok.noexpand = true;
    macro = {
      tokens: [tok],
      numArgs: 0,
      // reproduce the same behavior in expansion
      unexpandable: !parser.gullet.isExpandable(tok.text)
    };
  }
  parser.gullet.macros.set(name, macro, global);
};

// <assignment> -> <non-macro assignment>|<macro assignment>
// <non-macro assignment> -> <simple assignment>|\global<non-macro assignment>
// <macro assignment> -> <definition>|<prefix><macro assignment>
// <prefix> -> \global|\long|\outer
defineFunction({
  type: "internal",
  names: [
    "\\global",
    "\\long",
    "\\\\globallong" // can’t be entered directly
  ],
  props: {
    numArgs: 0,
    allowedInText: true
  },
  handler({ parser, funcName }) {
    parser.consumeSpaces();
    const token = parser.fetch();
    if (globalMap[token.text]) {
      // Temml doesn't have \par, so ignore \long
      if (funcName === "\\global" || funcName === "\\\\globallong") {
        token.text = globalMap[token.text];
      }
      return assertNodeType(parser.parseFunction(), "internal");
    }
    throw new ParseError(`Invalid token after macro prefix`, token);
  }
});

// Basic support for macro definitions: \def, \gdef, \edef, \xdef
// <definition> -> <def><control sequence><definition text>
// <def> -> \def|\gdef|\edef|\xdef
// <definition text> -> <parameter text><left brace><balanced text><right brace>
defineFunction({
  type: "internal",
  names: ["\\def", "\\gdef", "\\edef", "\\xdef"],
  props: {
    numArgs: 0,
    allowedInText: true,
    primitive: true
  },
  handler({ parser, funcName }) {
    let tok = parser.gullet.popToken();
    const name = tok.text;
    if (/^(?:[\\{}$&#^_]|EOF)$/.test(name)) {
      throw new ParseError("Expected a control sequence", tok);
    }

    let numArgs = 0;
    let insert;
    const delimiters = [[]];
    // <parameter text> contains no braces
    while (parser.gullet.future().text !== "{") {
      tok = parser.gullet.popToken();
      if (tok.text === "#") {
        // If the very last character of the <parameter text> is #, so that
        // this # is immediately followed by {, TeX will behave as if the {
        // had been inserted at the right end of both the parameter text
        // and the replacement text.
        if (parser.gullet.future().text === "{") {
          insert = parser.gullet.future();
          delimiters[numArgs].push("{");
          break;
        }

        // A parameter, the first appearance of # must be followed by 1,
        // the next by 2, and so on; up to nine #’s are allowed
        tok = parser.gullet.popToken();
        if (!/^[1-9]$/.test(tok.text)) {
          throw new ParseError(`Invalid argument number "${tok.text}"`);
        }
        if (parseInt(tok.text) !== numArgs + 1) {
          throw new ParseError(`Argument number "${tok.text}" out of order`);
        }
        numArgs++;
        delimiters.push([]);
      } else if (tok.text === "EOF") {
        throw new ParseError("Expected a macro definition");
      } else {
        delimiters[numArgs].push(tok.text);
      }
    }
    // replacement text, enclosed in '{' and '}' and properly nested
    let { tokens } = parser.gullet.consumeArg();
    if (insert) {
      tokens.unshift(insert);
    }

    if (funcName === "\\edef" || funcName === "\\xdef") {
      tokens = parser.gullet.expandTokens(tokens);
      if (tokens.length > parser.gullet.settings.maxExpand) {
        throw new ParseError("Too many expansions in an " + funcName);
      }
      tokens.reverse(); // to fit in with stack order
    }
    // Final arg is the expansion of the macro
    parser.gullet.macros.set(
      name,
      { tokens, numArgs, delimiters },
      funcName === globalMap[funcName]
    );
    return { type: "internal", mode: parser.mode };
  }
});

// <simple assignment> -> <let assignment>
// <let assignment> -> \futurelet<control sequence><token><token>
//     | \let<control sequence><equals><one optional space><token>
// <equals> -> <optional spaces>|<optional spaces>=
defineFunction({
  type: "internal",
  names: [
    "\\let",
    "\\\\globallet" // can’t be entered directly
  ],
  props: {
    numArgs: 0,
    allowedInText: true,
    primitive: true
  },
  handler({ parser, funcName }) {
    const name = checkControlSequence(parser.gullet.popToken());
    parser.gullet.consumeSpaces();
    const tok = getRHS(parser);
    letCommand(parser, name, tok, funcName === "\\\\globallet");
    return { type: "internal", mode: parser.mode };
  }
});

// ref: https://www.tug.org/TUGboat/tb09-3/tb22bechtolsheim.pdf
defineFunction({
  type: "internal",
  names: [
    "\\futurelet",
    "\\\\globalfuture" // can’t be entered directly
  ],
  props: {
    numArgs: 0,
    allowedInText: true,
    primitive: true
  },
  handler({ parser, funcName }) {
    const name = checkControlSequence(parser.gullet.popToken());
    const middle = parser.gullet.popToken();
    const tok = parser.gullet.popToken();
    letCommand(parser, name, tok, funcName === "\\\\globalfuture");
    parser.gullet.pushToken(tok);
    parser.gullet.pushToken(middle);
    return { type: "internal", mode: parser.mode };
  }
});

defineFunction({
  type: "internal",
  names: ["\\newcommand", "\\renewcommand", "\\providecommand"],
  props: {
    numArgs: 0,
    allowedInText: true,
    primitive: true
  },
  handler({ parser, funcName }) {
    let name = "";
    const tok = parser.gullet.popToken();
    if (tok.text === "{") {
      name = checkControlSequence(parser.gullet.popToken());
      parser.gullet.popToken();
    } else {
      name = checkControlSequence(tok);
    }

    const exists = parser.gullet.isDefined(name);
    if (exists && funcName === "\\newcommand") {
      throw new ParseError(
        `\\newcommand{${name}} attempting to redefine ${name}; use \\renewcommand`
      );
    }
    if (!exists && funcName === "\\renewcommand") {
      throw new ParseError(
        `\\renewcommand{${name}} when command ${name} does not yet exist; use \\newcommand`
      );
    }

    let numArgs = 0;
    if (parser.gullet.future().text === "[") {
      let tok = parser.gullet.popToken();
      tok = parser.gullet.popToken();
      if (!/^[0-9]$/.test(tok.text)) {
        throw new ParseError(`Invalid number of arguments: "${tok.text}"`);
      }
      numArgs = parseInt(tok.text);
      tok = parser.gullet.popToken();
      if (tok.text !== "]") {
        throw new ParseError(`Invalid argument "${tok.text}"`);
      }
    }

    // replacement text, enclosed in '{' and '}' and properly nested
    const { tokens } = parser.gullet.consumeArg();

    if (!(funcName === "\\providecommand" && parser.gullet.macros.has(name))) {
      // Ignore \providecommand
      parser.gullet.macros.set(
        name,
        { tokens, numArgs }
      );
    }

    return { type: "internal", mode: parser.mode };

  }
});

// Extra data needed for the delimiter handler down below
const delimiterSizes = {
  "\\bigl": { mclass: "mopen", size: 1 },
  "\\Bigl": { mclass: "mopen", size: 2 },
  "\\biggl": { mclass: "mopen", size: 3 },
  "\\Biggl": { mclass: "mopen", size: 4 },
  "\\bigr": { mclass: "mclose", size: 1 },
  "\\Bigr": { mclass: "mclose", size: 2 },
  "\\biggr": { mclass: "mclose", size: 3 },
  "\\Biggr": { mclass: "mclose", size: 4 },
  "\\bigm": { mclass: "mrel", size: 1 },
  "\\Bigm": { mclass: "mrel", size: 2 },
  "\\biggm": { mclass: "mrel", size: 3 },
  "\\Biggm": { mclass: "mrel", size: 4 },
  "\\big": { mclass: "mord", size: 1 },
  "\\Big": { mclass: "mord", size: 2 },
  "\\bigg": { mclass: "mord", size: 3 },
  "\\Bigg": { mclass: "mord", size: 4 }
};

const delimiters = [
  "(",
  "\\lparen",
  ")",
  "\\rparen",
  "[",
  "\\lbrack",
  "]",
  "\\rbrack",
  "\\{",
  "\\lbrace",
  "\\}",
  "\\rbrace",
  "⦇",
  "\\llparenthesis",
  "⦈",
  "\\rrparenthesis",
  "\\lfloor",
  "\\rfloor",
  "\u230a",
  "\u230b",
  "\\lceil",
  "\\rceil",
  "\u2308",
  "\u2309",
  "<",
  ">",
  "\\langle",
  "\u27e8",
  "\\rangle",
  "\u27e9",
  "\\lAngle",
  "\u27ea",
  "\\rAngle",
  "\u27eb",
  "\\llangle",
  "⦉",
  "\\rrangle",
  "⦊",
  "\\lt",
  "\\gt",
  "\\lvert",
  "\\rvert",
  "\\lVert",
  "\\rVert",
  "\\lgroup",
  "\\rgroup",
  "\u27ee",
  "\u27ef",
  "\\lmoustache",
  "\\rmoustache",
  "\u23b0",
  "\u23b1",
  "\\llbracket",
  "\\rrbracket",
  "\u27e6",
  "\u27e6",
  "\\lBrace",
  "\\rBrace",
  "\u2983",
  "\u2984",
  "/",
  "\\backslash",
  "|",
  "\\vert",
  "\\|",
  "\\Vert",
  "\u2016",
  "\\uparrow",
  "\\Uparrow",
  "\\downarrow",
  "\\Downarrow",
  "\\updownarrow",
  "\\Updownarrow",
  "."
];

// Export isDelimiter for benefit of parser.
const dels = ["}", "\\left", "\\middle", "\\right"];
const isDelimiter = str => str.length > 0 &&
  (delimiters.includes(str) || delimiterSizes[str] || dels.includes(str));

// Metrics of the different sizes. Found by looking at TeX's output of
// $\bigl| // \Bigl| \biggl| \Biggl| \showlists$
// Used to create stacked delimiters of appropriate sizes in makeSizedDelim.
const sizeToMaxHeight = [0, 1.2, 1.8, 2.4, 3.0];

// Delimiter functions
function checkDelimiter(delim, context) {
  if (delim.type === "ordgroup" && delim.body.length === 1) {
    delim = delim.body[0]; // Unwrap the braces
  }
  const symDelim = checkSymbolNodeType(delim);
  if (symDelim && delimiters.includes(symDelim.text)) {
    // If a character is not in the MathML operator dictionary, it will not stretch.
    // Replace such characters w/characters that will stretch.
    if (["<", "\\lt"].includes(symDelim.text)) { symDelim.text = "⟨"; }
    if ([">", "\\gt"].includes(symDelim.text)) { symDelim.text = "⟩"; }
    return symDelim;
  } else if (symDelim) {
    throw new ParseError(`Invalid delimiter '${symDelim.text}' after '${context.funcName}'`, delim);
  } else {
    throw new ParseError(`Invalid delimiter type '${delim.type}'`, delim);
  }
}

//                               /         \
const needExplicitStretch = ["\u002F", "\u005C", "\\backslash", "\\vert", "|"];

defineFunction({
  type: "delimsizing",
  names: [
    "\\bigl",
    "\\Bigl",
    "\\biggl",
    "\\Biggl",
    "\\bigr",
    "\\Bigr",
    "\\biggr",
    "\\Biggr",
    "\\bigm",
    "\\Bigm",
    "\\biggm",
    "\\Biggm",
    "\\big",
    "\\Big",
    "\\bigg",
    "\\Bigg"
  ],
  props: {
    numArgs: 1,
    argTypes: ["primitive"]
  },
  handler: (context, args) => {
    const delim = checkDelimiter(args[0], context);

    const delimNode = {
      type: "delimsizing",
      mode: context.parser.mode,
      size: delimiterSizes[context.funcName].size,
      mclass: delimiterSizes[context.funcName].mclass,
      delim: delim.text
    };
    const nextToken = context.parser.fetch().text;
    if (nextToken !== "^" && nextToken !== "_") {
      return delimNode
    } else {
      // Chromium mis-renders a sized delim if it is the base of a supsub.
      // So wrap it in a ordgroup.
      return {
        type: "ordgroup",
        mode: "math",
        body: [delimNode, { type: "ordgroup", mode: "math", body: [] }]
      }
    }
  },
  mathmlBuilder: (group) => {
    const children = [];

    if (group.delim === ".") { group.delim = ""; }
    children.push(makeText(group.delim, group.mode));

    const node = new mathMLTree.MathNode("mo", children);

    if (group.mclass === "mopen" || group.mclass === "mclose") {
      // Only some of the delimsizing functions act as fences, and they
      // return "mopen" or "mclose" mclass.
      node.setAttribute("fence", "true");
    } else {
      // Explicitly disable fencing if it's not a fence, to override the
      // defaults.
      node.setAttribute("fence", "false");
    }
    if (needExplicitStretch.includes(group.delim) || group.delim.indexOf("arrow") > -1) {
      // We have to explicitly set stretchy to true.
      node.setAttribute("stretchy", "true");
    }
    node.setAttribute("symmetric", "true"); // Needed for tall arrows in Firefox.
    node.setAttribute("minsize", sizeToMaxHeight[group.size] + "em");
    node.setAttribute("maxsize", sizeToMaxHeight[group.size] + "em");
    return node;
  }
});

function assertParsed(group) {
  if (!group.body) {
    throw new Error("Bug: The leftright ParseNode wasn't fully parsed.");
  }
}

defineFunction({
  type: "leftright-right",
  names: ["\\right"],
  props: {
    numArgs: 1,
    argTypes: ["primitive"]
  },
  handler: (context, args) => {
    return {
      type: "leftright-right",
      mode: context.parser.mode,
      delim: checkDelimiter(args[0], context).text
    };
  }
});

defineFunction({
  type: "leftright",
  names: ["\\left"],
  props: {
    numArgs: 1,
    argTypes: ["primitive"]
  },
  handler: (context, args) => {
    const delim = checkDelimiter(args[0], context);

    const parser = context.parser;
    // Parse out the implicit body
    ++parser.leftrightDepth;
    // parseExpression stops before '\\right' or `\\middle`
    let body = parser.parseExpression(false, null, true);
    let nextToken = parser.fetch();
    while (nextToken.text === "\\middle") {
      // `\middle`, from the ε-TeX package, ends one group and starts another group.
      // We had to parse this expression with `breakOnMiddle` enabled in order
      // to get TeX-compliant parsing of \over.
      // But we do not want, at this point, to end on \middle, so continue
      // to parse until we fetch a `\right`.
      parser.consume();
      const middle = parser.fetch().text;
      if (!symbols.math[middle]) {
        throw new ParseError(`Invalid delimiter '${middle}' after '\\middle'`);
      }
      checkDelimiter({ type: "atom", mode: "math", text: middle }, { funcName: "\\middle" });
      body.push({ type: "middle", mode: "math", delim: middle });
      parser.consume();
      body = body.concat(parser.parseExpression(false, null, true));
      nextToken = parser.fetch();
    }
    --parser.leftrightDepth;
    // Check the next token
    parser.expect("\\right", false);
    const right = assertNodeType(parser.parseFunction(), "leftright-right");
    return {
      type: "leftright",
      mode: parser.mode,
      body,
      left: delim.text,
      right: right.delim
    };
  },
  mathmlBuilder: (group, style) => {
    assertParsed(group);
    const inner = buildExpression(group.body, style);

    if (group.left === ".") { group.left = ""; }
    const leftNode = new mathMLTree.MathNode("mo", [makeText(group.left, group.mode)]);
    leftNode.setAttribute("fence", "true");
    leftNode.setAttribute("form", "prefix");
    if (group.left === "/" || group.left === "\u005C" || group.left.indexOf("arrow") > -1) {
      leftNode.setAttribute("stretchy", "true");
    }
    inner.unshift(leftNode);

    if (group.right === ".") { group.right = ""; }
    const rightNode = new mathMLTree.MathNode("mo", [makeText(group.right, group.mode)]);
    rightNode.setAttribute("fence", "true");
    rightNode.setAttribute("form", "postfix");
    if (group.right === "\u2216" || group.right.indexOf("arrow") > -1) {
      rightNode.setAttribute("stretchy", "true");
    }
    if (group.body.length > 0) {
      const lastElement = group.body[group.body.length - 1];
      if (lastElement.type === "color" && !lastElement.isTextColor) {
        // \color is a switch. If the last element is of type "color" then
        // the user set the \color switch and left it on.
        // A \right delimiter turns the switch off, but the delimiter itself gets the color.
        rightNode.setAttribute("mathcolor", lastElement.color);
      }
    }
    inner.push(rightNode);

    return makeRow(inner);
  }
});

defineFunction({
  type: "middle",
  names: ["\\middle"],
  props: {
    numArgs: 1,
    argTypes: ["primitive"]
  },
  handler: (context, args) => {
    const delim = checkDelimiter(args[0], context);
    if (!context.parser.leftrightDepth) {
      throw new ParseError("\\middle without preceding \\left", delim);
    }

    return {
      type: "middle",
      mode: context.parser.mode,
      delim: delim.text
    };
  },
  mathmlBuilder: (group, style) => {
    const textNode = makeText(group.delim, group.mode);
    const middleNode = new mathMLTree.MathNode("mo", [textNode]);
    middleNode.setAttribute("fence", "true");
    if (group.delim.indexOf("arrow") > -1) {
      middleNode.setAttribute("stretchy", "true");
    }
    // The next line is not semantically correct, but
    // Chromium fails to stretch if it is not there.
    middleNode.setAttribute("form", "prefix");
    // MathML gives 5/18em spacing to each <mo> element.
    // \middle should get delimiter spacing instead.
    middleNode.setAttribute("lspace", "0.05em");
    middleNode.setAttribute("rspace", "0.05em");
    return middleNode;
  }
});

const mathmlBuilder$7 = (group, style) => {
  const node = new mathMLTree.MathNode("menclose", [buildGroup$1(group.body, style)]);
  switch (group.label) {
    case "\\overline":
      node.setAttribute("notation", "top"); // for Firefox & WebKit
      node.classes.push("tml-overline");    // for Chromium
      break
    case "\\underline":
      node.setAttribute("notation", "bottom");
      node.classes.push("tml-underline");
      break
    case "\\cancel":
      node.setAttribute("notation", "updiagonalstrike");
      node.children.push(new mathMLTree.MathNode("mrow", [], ["tml-cancel", "upstrike"]));
      break
    case "\\bcancel":
      node.setAttribute("notation", "downdiagonalstrike");
      node.children.push(new mathMLTree.MathNode("mrow", [], ["tml-cancel", "downstrike"]));
      break
    case "\\sout":
      node.setAttribute("notation", "horizontalstrike");
      node.children.push(new mathMLTree.MathNode("mrow", [], ["tml-cancel", "sout"]));
      break
    case "\\xcancel":
      node.setAttribute("notation", "updiagonalstrike downdiagonalstrike");
      node.classes.push("tml-xcancel");
      break
    case "\\longdiv":
      node.setAttribute("notation", "longdiv");
      node.classes.push("longdiv-top");
      node.children.push(new mathMLTree.MathNode("mrow", [], ["longdiv-arc"]));
      break
    case "\\phase":
      node.setAttribute("notation", "phasorangle");
      node.classes.push("phasor-bottom");
      node.children.push(new mathMLTree.MathNode("mrow", [], ["phasor-angle"]));
      break
    case "\\textcircled":
      node.setAttribute("notation", "circle");
      node.classes.push("circle-pad");
      node.children.push(new mathMLTree.MathNode("mrow", [], ["textcircle"]));
      break
    case "\\angl":
      node.setAttribute("notation", "actuarial");
      node.classes.push("actuarial");
      break
    case "\\boxed":
      // \newcommand{\boxed}[1]{\fbox{\m@th$\displaystyle#1$}} from amsmath.sty
      node.setAttribute("notation", "box");
      node.style.padding = "3pt";
      node.style.border = "1px solid";
      node.setAttribute("scriptlevel", "0");
      node.setAttribute("displaystyle", "true");
      break
    case "\\fbox":
      node.setAttribute("notation", "box");
      node.classes.push("tml-fbox");
      break
    case "\\fcolorbox":
    case "\\colorbox": {
      // <menclose> doesn't have a good notation option for \colorbox.
      // So use <mpadded> instead. Set some attributes that come
      // included with <menclose>.
      //const fboxsep = 3; // 3 pt from LaTeX source2e
      //node.setAttribute("height", `+${2 * fboxsep}pt`)
      //node.setAttribute("voffset", `${fboxsep}pt`)
      node.style.padding = "3pt";
      if (group.label === "\\fcolorbox") {
        node.style.border = "0.0667em solid " + String(group.borderColor);
      }
      break
    }
  }
  if (group.backgroundColor) {
    node.setAttribute("mathbackground", group.backgroundColor);
  }
  return node;
};

defineFunction({
  type: "enclose",
  names: ["\\colorbox"],
  props: {
    numArgs: 2,
    numOptionalArgs: 1,
    allowedInText: true,
    argTypes: ["raw", "raw", "text"]
  },
  handler({ parser, funcName }, args, optArgs) {
    const model = optArgs[0] && assertNodeType(optArgs[0], "raw").string;
    let color = "";
    if (model) {
      const spec = assertNodeType(args[0], "raw").string;
      color = colorFromSpec(model, spec);
    } else {
      color = validateColor(assertNodeType(args[0], "raw").string, parser.gullet.macros);
    }
    const body = args[1];
    return {
      type: "enclose",
      mode: parser.mode,
      label: funcName,
      backgroundColor: color,
      body
    };
  },
  mathmlBuilder: mathmlBuilder$7
});

defineFunction({
  type: "enclose",
  names: ["\\fcolorbox"],
  props: {
    numArgs: 3,
    numOptionalArgs: 1,
    allowedInText: true,
    argTypes: ["raw", "raw", "raw", "text"]
  },
  handler({ parser, funcName }, args, optArgs) {
    const model = optArgs[0] && assertNodeType(optArgs[0], "raw").string;
    let borderColor = "";
    let backgroundColor;
    if (model) {
      const borderSpec = assertNodeType(args[0], "raw").string;
      const backgroundSpec = assertNodeType(args[0], "raw").string;
      borderColor = colorFromSpec(model, borderSpec);
      backgroundColor = colorFromSpec(model, backgroundSpec);
    } else {
      borderColor = validateColor(assertNodeType(args[0], "raw").string, parser.gullet.macros);
      backgroundColor = validateColor(assertNodeType(args[1], "raw").string, parser.gullet.macros);
    }
    const body = args[2];
    return {
      type: "enclose",
      mode: parser.mode,
      label: funcName,
      backgroundColor,
      borderColor,
      body
    };
  },
  mathmlBuilder: mathmlBuilder$7
});

defineFunction({
  type: "enclose",
  names: ["\\fbox"],
  props: {
    numArgs: 1,
    argTypes: ["hbox"],
    allowedInText: true
  },
  handler({ parser }, args) {
    return {
      type: "enclose",
      mode: parser.mode,
      label: "\\fbox",
      body: args[0]
    };
  }
});

defineFunction({
  type: "enclose",
  names: ["\\angl", "\\cancel", "\\bcancel", "\\xcancel", "\\sout", "\\overline",
    "\\boxed", "\\longdiv", "\\phase"],
  props: {
    numArgs: 1
  },
  handler({ parser, funcName }, args) {
    const body = args[0];
    return {
      type: "enclose",
      mode: parser.mode,
      label: funcName,
      body
    };
  },
  mathmlBuilder: mathmlBuilder$7
});

defineFunction({
  type: "enclose",
  names: ["\\underline"],
  props: {
    numArgs: 1,
    allowedInText: true
  },
  handler({ parser, funcName }, args) {
    const body = args[0];
    return {
      type: "enclose",
      mode: parser.mode,
      label: funcName,
      body
    };
  },
  mathmlBuilder: mathmlBuilder$7
});


defineFunction({
  type: "enclose",
  names: ["\\textcircled"],
  props: {
    numArgs: 1,
    argTypes: ["text"],
    allowedInArgument: true,
    allowedInText: true
  },
  handler({ parser, funcName }, args) {
    const body = args[0];
    return {
      type: "enclose",
      mode: parser.mode,
      label: funcName,
      body
    };
  },
  mathmlBuilder: mathmlBuilder$7
});

// Environment delimiters. HTML/MathML rendering is defined in the corresponding
// defineEnvironment definitions.
defineFunction({
  type: "environment",
  names: ["\\begin", "\\end"],
  props: {
    numArgs: 1,
    argTypes: ["text"]
  },
  handler({ parser, funcName }, args) {
    const nameGroup = args[0];
    if (nameGroup.type !== "ordgroup") {
      throw new ParseError("Invalid environment name", nameGroup);
    }
    let envName = "";
    for (let i = 0; i < nameGroup.body.length; ++i) {
      envName += assertNodeType(nameGroup.body[i], "textord").text;
    }

    if (funcName === "\\begin") {
      // begin...end is similar to left...right
      if (!Object.prototype.hasOwnProperty.call(environments, envName )) {
        throw new ParseError("No such environment: " + envName, nameGroup);
      }
      // Build the environment object. Arguments and other information will
      // be made available to the begin and end methods using properties.
      const env = environments[envName];
      const { args, optArgs } = parser.parseArguments("\\begin{" + envName + "}", env);
      const context = {
        mode: parser.mode,
        envName,
        parser
      };
      const result = env.handler(context, args, optArgs);
      parser.expect("\\end", false);
      const endNameToken = parser.nextToken;
      const end = assertNodeType(parser.parseFunction(), "environment");
      if (end.name !== envName) {
        throw new ParseError(
          `Mismatch: \\begin{${envName}} matched by \\end{${end.name}}`,
          endNameToken
        );
      }
      return result;
    }

    return {
      type: "environment",
      mode: parser.mode,
      name: envName,
      nameGroup
    };
  }
});

defineFunction({
  type: "envTag",
  names: ["\\env@tag"],
  props: {
    numArgs: 1,
    argTypes: ["math"]
  },
  handler({ parser }, args) {
    return {
      type: "envTag",
      mode: parser.mode,
      body: args[0]
    };
  },
  mathmlBuilder(group, style) {
    return new mathMLTree.MathNode("mrow");
  }
});

defineFunction({
  type: "noTag",
  names: ["\\env@notag"],
  props: {
    numArgs: 0
  },
  handler({ parser }) {
    return {
      type: "noTag",
      mode: parser.mode
    };
  },
  mathmlBuilder(group, style) {
    return new mathMLTree.MathNode("mrow");
  }
});

const isLongVariableName = (group, font) => {
  if (font !== "mathrm" || group.body.type !== "ordgroup" || group.body.body.length === 1) {
    return false
  }
  if (group.body.body[0].type !== "mathord") { return false }
  for (let i = 1; i < group.body.body.length; i++) {
    const parseNodeType = group.body.body[i].type;
    if (!(parseNodeType ===  "mathord" ||
    (parseNodeType ===  "textord" && !isNaN(group.body.body[i].text)))) {
      return false
    }
  }
  return true
};

const mathmlBuilder$6 = (group, style) => {
  const font = group.font;
  const newStyle = style.withFont(font);
  const mathGroup = buildGroup$1(group.body, newStyle);

  if (mathGroup.children.length === 0) { return mathGroup } // empty group, e.g., \mathrm{}
  if (font === "boldsymbol" && ["mo", "mpadded", "mrow"].includes(mathGroup.type)) {
    mathGroup.style.fontWeight = "bold";
    return mathGroup
  }
  // Check if it is possible to consolidate elements into a single <mi> element.
  if (isLongVariableName(group, font)) {
    // This is a \mathrm{…} group. It gets special treatment because symbolsOrd.js
    // wraps <mi> elements with <mpadded>s to work around a Firefox bug.
    const mi = mathGroup.children[0].children[0].children
      ? mathGroup.children[0].children[0]
      : mathGroup.children[0];
    delete mi.attributes.mathvariant;
    for (let i = 1; i < mathGroup.children.length; i++) {
      mi.children[0].text += mathGroup.children[i].children[0].children
        ? mathGroup.children[i].children[0].children[0].text
        : mathGroup.children[i].children[0].text;
    }
    // Wrap in a <mpadded> to prevent the same Firefox bug.
    const mpadded = new mathMLTree.MathNode("mpadded", [mi]);
    mpadded.setAttribute("lspace", "0");
    return mpadded
  }
  let canConsolidate = mathGroup.children[0].type === "mo";
  for (let i = 1; i < mathGroup.children.length; i++) {
    if (mathGroup.children[i].type === "mo" && font === "boldsymbol") {
      mathGroup.children[i].style.fontWeight = "bold";
    }
    if (mathGroup.children[i].type !== "mi") { canConsolidate = false; }
    const localVariant = mathGroup.children[i].attributes &&
      mathGroup.children[i].attributes.mathvariant || "";
    if (localVariant !== "normal") { canConsolidate = false; }
  }
  if (!canConsolidate) { return mathGroup }
  // Consolidate the <mi> elements.
  const mi = mathGroup.children[0];
  for (let i = 1; i < mathGroup.children.length; i++) {
    mi.children.push(mathGroup.children[i].children[0]);
  }
  if (mi.attributes.mathvariant && mi.attributes.mathvariant === "normal") {
    // Workaround for a Firefox bug that renders spurious space around
    // a <mi mathvariant="normal">
    // Ref: https://bugs.webkit.org/show_bug.cgi?id=129097
    // We insert a text node that contains a zero-width space and wrap in an mrow.
    // TODO: Get rid of this <mi> workaround when the Firefox bug is fixed.
    const bogus = new mathMLTree.MathNode("mtext", new mathMLTree.TextNode("\u200b"));
    return new mathMLTree.MathNode("mrow", [bogus, mi])
  }
  return mi
};

const fontAliases = {
  "\\Bbb": "\\mathbb",
  "\\bold": "\\mathbf",
  "\\frak": "\\mathfrak",
  "\\bm": "\\boldsymbol"
};

defineFunction({
  type: "font",
  names: [
    // styles
    "\\mathrm",
    "\\mathit",
    "\\mathbf",
    "\\mathnormal",
    "\\up@greek",
    "\\boldsymbol",

    // families
    "\\mathbb",
    "\\mathcal",
    "\\mathfrak",
    "\\mathscr",
    "\\mathsf",
    "\\mathsfit",
    "\\mathtt",

    // aliases
    "\\Bbb",
    "\\bm",
    "\\bold",
    "\\frak"
  ],
  props: {
    numArgs: 1,
    allowedInArgument: true
  },
  handler: ({ parser, funcName }, args) => {
    const body = normalizeArgument(args[0]);
    let func = funcName;
    if (func in fontAliases) {
      func = fontAliases[func];
    }
    return {
      type: "font",
      mode: parser.mode,
      font: func.slice(1),
      body
    };
  },
  mathmlBuilder: mathmlBuilder$6
});

// Old font changing functions
defineFunction({
  type: "font",
  names: ["\\rm", "\\sf", "\\tt", "\\bf", "\\it", "\\cal"],
  props: {
    numArgs: 0,
    allowedInText: true
  },
  handler: ({ parser, funcName, breakOnTokenText }, args) => {
    const { mode } = parser;
    const body = parser.parseExpression(true, breakOnTokenText, true);
    const fontStyle = `math${funcName.slice(1)}`;

    return {
      type: "font",
      mode: mode,
      font: fontStyle,
      body: {
        type: "ordgroup",
        mode: parser.mode,
        body
      }
    };
  },
  mathmlBuilder: mathmlBuilder$6
});

const stylArray = ["display", "text", "script", "scriptscript"];
const scriptLevel = { auto: -1, display: 0, text: 0, script: 1, scriptscript: 2 };

const mathmlBuilder$5 = (group, style) => {
  // Track the scriptLevel of the numerator and denominator.
  // We may need that info for \mathchoice or for adjusting em dimensions.
  const childOptions = group.scriptLevel === "auto"
    ? style.incrementLevel()
    : group.scriptLevel === "display"
    ? style.withLevel(StyleLevel.TEXT)
    : group.scriptLevel === "text"
    ? style.withLevel(StyleLevel.SCRIPT)
    : style.withLevel(StyleLevel.SCRIPTSCRIPT);

  // Chromium (wrongly) continues to shrink fractions beyond scriptscriptlevel.
  // So we check for levels that Chromium shrinks too small.
  // If necessary, set an explicit fraction depth.
  const numer = buildGroup$1(group.numer, childOptions);
  const denom = buildGroup$1(group.denom, childOptions);
  if (style.level === 3) {
    numer.style.mathDepth = "2";
    numer.setAttribute("scriptlevel", "2");
    denom.style.mathDepth = "2";
    denom.setAttribute("scriptlevel", "2");
  }

  let node = new mathMLTree.MathNode("mfrac", [numer, denom]);

  if (!group.hasBarLine) {
    node.setAttribute("linethickness", "0px");
  } else if (group.barSize) {
    const ruleWidth = calculateSize(group.barSize, style);
    node.setAttribute("linethickness", ruleWidth.number + ruleWidth.unit);
  }

  if (group.leftDelim != null || group.rightDelim != null) {
    const withDelims = [];

    if (group.leftDelim != null) {
      const leftOp = new mathMLTree.MathNode("mo", [
        new mathMLTree.TextNode(group.leftDelim.replace("\\", ""))
      ]);
      leftOp.setAttribute("fence", "true");
      withDelims.push(leftOp);
    }

    withDelims.push(node);

    if (group.rightDelim != null) {
      const rightOp = new mathMLTree.MathNode("mo", [
        new mathMLTree.TextNode(group.rightDelim.replace("\\", ""))
      ]);
      rightOp.setAttribute("fence", "true");
      withDelims.push(rightOp);
    }

    node = makeRow(withDelims);
  }

  if (group.scriptLevel !== "auto") {
    node = new mathMLTree.MathNode("mstyle", [node]);
    node.setAttribute("displaystyle", String(group.scriptLevel === "display"));
    node.setAttribute("scriptlevel", scriptLevel[group.scriptLevel]);
  }

  return node;
};

defineFunction({
  type: "genfrac",
  names: [
    "\\dfrac",
    "\\frac",
    "\\tfrac",
    "\\dbinom",
    "\\binom",
    "\\tbinom",
    "\\\\atopfrac", // can’t be entered directly
    "\\\\bracefrac",
    "\\\\brackfrac" // ditto
  ],
  props: {
    numArgs: 2,
    allowedInArgument: true
  },
  handler: ({ parser, funcName }, args) => {
    const numer = args[0];
    const denom = args[1];
    let hasBarLine = false;
    let leftDelim = null;
    let rightDelim = null;
    let scriptLevel = "auto";

    switch (funcName) {
      case "\\dfrac":
      case "\\frac":
      case "\\tfrac":
        hasBarLine = true;
        break;
      case "\\\\atopfrac":
        hasBarLine = false;
        break;
      case "\\dbinom":
      case "\\binom":
      case "\\tbinom":
        leftDelim = "(";
        rightDelim = ")";
        break;
      case "\\\\bracefrac":
        leftDelim = "\\{";
        rightDelim = "\\}";
        break;
      case "\\\\brackfrac":
        leftDelim = "[";
        rightDelim = "]";
        break;
      default:
        throw new Error("Unrecognized genfrac command");
    }

    switch (funcName) {
      case "\\dfrac":
      case "\\dbinom":
        scriptLevel = "display";
        break;
      case "\\tfrac":
      case "\\tbinom":
        scriptLevel = "text";
        break;
    }

    return {
      type: "genfrac",
      mode: parser.mode,
      continued: false,
      numer,
      denom,
      hasBarLine,
      leftDelim,
      rightDelim,
      scriptLevel,
      barSize: null
    };
  },
  mathmlBuilder: mathmlBuilder$5
});

defineFunction({
  type: "genfrac",
  names: ["\\cfrac"],
  props: {
    numArgs: 2
  },
  handler: ({ parser, funcName }, args) => {
    const numer = args[0];
    const denom = args[1];

    return {
      type: "genfrac",
      mode: parser.mode,
      continued: true,
      numer,
      denom,
      hasBarLine: true,
      leftDelim: null,
      rightDelim: null,
      scriptLevel: "display",
      barSize: null
    };
  }
});

// Infix generalized fractions -- these are not rendered directly, but replaced
// immediately by one of the variants above.
defineFunction({
  type: "infix",
  names: ["\\over", "\\choose", "\\atop", "\\brace", "\\brack"],
  props: {
    numArgs: 0,
    infix: true
  },
  handler({ parser, funcName, token }) {
    let replaceWith;
    switch (funcName) {
      case "\\over":
        replaceWith = "\\frac";
        break;
      case "\\choose":
        replaceWith = "\\binom";
        break;
      case "\\atop":
        replaceWith = "\\\\atopfrac";
        break;
      case "\\brace":
        replaceWith = "\\\\bracefrac";
        break;
      case "\\brack":
        replaceWith = "\\\\brackfrac";
        break;
      default:
        throw new Error("Unrecognized infix genfrac command");
    }
    return {
      type: "infix",
      mode: parser.mode,
      replaceWith,
      token
    };
  }
});

const delimFromValue = function(delimString) {
  let delim = null;
  if (delimString.length > 0) {
    delim = delimString;
    delim = delim === "." ? null : delim;
  }
  return delim;
};

defineFunction({
  type: "genfrac",
  names: ["\\genfrac"],
  props: {
    numArgs: 6,
    allowedInArgument: true,
    argTypes: ["math", "math", "size", "text", "math", "math"]
  },
  handler({ parser }, args) {
    const numer = args[4];
    const denom = args[5];

    // Look into the parse nodes to get the desired delimiters.
    const leftNode = normalizeArgument(args[0]);
    const leftDelim = leftNode.type === "atom" && leftNode.family === "open"
      ? delimFromValue(leftNode.text)
      : null;
    const rightNode = normalizeArgument(args[1]);
    const rightDelim =
      rightNode.type === "atom" && rightNode.family === "close"
        ? delimFromValue(rightNode.text)
        : null;

    const barNode = assertNodeType(args[2], "size");
    let hasBarLine;
    let barSize = null;
    if (barNode.isBlank) {
      // \genfrac acts differently than \above.
      // \genfrac treats an empty size group as a signal to use a
      // standard bar size. \above would see size = 0 and omit the bar.
      hasBarLine = true;
    } else {
      barSize = barNode.value;
      hasBarLine = barSize.number > 0;
    }

    // Find out if we want displaystyle, textstyle, etc.
    let scriptLevel = "auto";
    let styl = args[3];
    if (styl.type === "ordgroup") {
      if (styl.body.length > 0) {
        const textOrd = assertNodeType(styl.body[0], "textord");
        scriptLevel = stylArray[Number(textOrd.text)];
      }
    } else {
      styl = assertNodeType(styl, "textord");
      scriptLevel = stylArray[Number(styl.text)];
    }

    return {
      type: "genfrac",
      mode: parser.mode,
      numer,
      denom,
      continued: false,
      hasBarLine,
      barSize,
      leftDelim,
      rightDelim,
      scriptLevel
    };
  },
  mathmlBuilder: mathmlBuilder$5
});

// \above is an infix fraction that also defines a fraction bar size.
defineFunction({
  type: "infix",
  names: ["\\above"],
  props: {
    numArgs: 1,
    argTypes: ["size"],
    infix: true
  },
  handler({ parser, funcName, token }, args) {
    return {
      type: "infix",
      mode: parser.mode,
      replaceWith: "\\\\abovefrac",
      barSize: assertNodeType(args[0], "size").value,
      token
    };
  }
});

defineFunction({
  type: "genfrac",
  names: ["\\\\abovefrac"],
  props: {
    numArgs: 3,
    argTypes: ["math", "size", "math"]
  },
  handler: ({ parser, funcName }, args) => {
    const numer = args[0];
    const barSize = assert(assertNodeType(args[1], "infix").barSize);
    const denom = args[2];

    const hasBarLine = barSize.number > 0;
    return {
      type: "genfrac",
      mode: parser.mode,
      numer,
      denom,
      continued: false,
      hasBarLine,
      barSize,
      leftDelim: null,
      rightDelim: null,
      scriptLevel: "auto"
    };
  },

  mathmlBuilder: mathmlBuilder$5
});

// \hbox is provided for compatibility with LaTeX functions that act on a box.
// This function by itself doesn't do anything but set scriptlevel to \textstyle
// and prevent a soft line break.

defineFunction({
  type: "hbox",
  names: ["\\hbox"],
  props: {
    numArgs: 1,
    argTypes: ["hbox"],
    allowedInArgument: true,
    allowedInText: false
  },
  handler({ parser }, args) {
    return {
      type: "hbox",
      mode: parser.mode,
      body: ordargument(args[0])
    };
  },
  mathmlBuilder(group, style) {
    const newStyle = style.withLevel(StyleLevel.TEXT);
    const mrow = buildExpressionRow(group.body, newStyle);
    return consolidateText(mrow)
  }
});

const mathmlBuilder$4 = (group, style) => {
  const accentNode = stretchy.mathMLnode(group.label);
  accentNode.style["math-depth"] = 0;
  return new mathMLTree.MathNode(group.isOver ? "mover" : "munder", [
    buildGroup$1(group.base, style),
    accentNode
  ]);
};

// Horizontal stretchy braces
defineFunction({
  type: "horizBrace",
  names: ["\\overbrace", "\\underbrace"],
  props: {
    numArgs: 1
  },
  handler({ parser, funcName }, args) {
    return {
      type: "horizBrace",
      mode: parser.mode,
      label: funcName,
      isOver: /^\\over/.test(funcName),
      base: args[0]
    };
  },
  mathmlBuilder: mathmlBuilder$4
});

defineFunction({
  type: "html",
  names: ["\\class", "\\id", "\\style", "\\data"],
  props: {
    numArgs: 2,
    argTypes: ["raw", "original"],
    allowedInText: true
  },
  handler: ({ parser, funcName, token }, args) => {
    const value = assertNodeType(args[0], "raw").string;
    const body = args[1];

    if (parser.settings.strict) {
      throw new ParseError(`Function "${funcName}" is disabled in strict mode`, token)
    }

    let trustContext;
    const attributes = {};

    switch (funcName) {
      case "\\class":
        attributes.class = value;
        trustContext = {
          command: "\\class",
          class: value
        };
        break;
      case "\\id":
        attributes.id = value;
        trustContext = {
          command: "\\id",
          id: value
        };
        break;
      case "\\style":
        attributes.style = value;
        trustContext = {
          command: "\\style",
          style: value
        };
        break;
      case "\\data": {
        const data = value.split(",");
        for (let i = 0; i < data.length; i++) {
          const keyVal = data[i].split("=");
          if (keyVal.length !== 2) {
            throw new ParseError("Error parsing key-value for \\data");
          }
          attributes["data-" + keyVal[0].trim()] = keyVal[1].trim();
        }

        trustContext = {
          command: "\\data",
          attributes
        };
        break;
      }
      default:
        throw new Error("Unrecognized html command");
    }

    if (!parser.settings.isTrusted(trustContext)) {
      throw new ParseError(`Function "${funcName}" is not trusted`, token)
    }
    return {
      type: "html",
      mode: parser.mode,
      attributes,
      body: ordargument(body)
    };
  },
  mathmlBuilder: (group, style) => {
    const element =  buildExpressionRow(group.body, style);

    const classes = [];
    if (group.attributes.class) {
      classes.push(...group.attributes.class.trim().split(/\s+/));
    }
    element.classes = classes;

    for (const attr in group.attributes) {
      if (attr !== "class" && Object.prototype.hasOwnProperty.call(group.attributes, attr)) {
        element.setAttribute(attr, group.attributes[attr]);
      }
    }

    return element;
  }
});

const sizeData = function(str) {
  if (/^[-+]? *(\d+(\.\d*)?|\.\d+)$/.test(str)) {
    // str is a number with no unit specified.
    // default unit is bp, per graphix package.
    return { number: +str, unit: "bp" }
  } else {
    const match = /([-+]?) *(\d+(?:\.\d*)?|\.\d+) *([a-z]{2})/.exec(str);
    if (!match) {
      throw new ParseError("Invalid size: '" + str + "' in \\includegraphics");
    }
    const data = {
      number: +(match[1] + match[2]), // sign + magnitude, cast to number
      unit: match[3]
    };
    if (!validUnit(data)) {
      throw new ParseError("Invalid unit: '" + data.unit + "' in \\includegraphics.");
    }
    return data
  }
};

defineFunction({
  type: "includegraphics",
  names: ["\\includegraphics"],
  props: {
    numArgs: 1,
    numOptionalArgs: 1,
    argTypes: ["raw", "url"],
    allowedInText: false
  },
  handler: ({ parser, token }, args, optArgs) => {
    let width = { number: 0, unit: "em" };
    let height = { number: 0.9, unit: "em" };  // sorta character sized.
    let totalheight = { number: 0, unit: "em" };
    let alt = "";

    if (optArgs[0]) {
      const attributeStr = assertNodeType(optArgs[0], "raw").string;

      // Parser.js does not parse key/value pairs. We get a string.
      const attributes = attributeStr.split(",");
      for (let i = 0; i < attributes.length; i++) {
        const keyVal = attributes[i].split("=");
        if (keyVal.length === 2) {
          const str = keyVal[1].trim();
          switch (keyVal[0].trim()) {
            case "alt":
              alt = str;
              break
            case "width":
              width = sizeData(str);
              break
            case "height":
              height = sizeData(str);
              break
            case "totalheight":
              totalheight = sizeData(str);
              break
            default:
              throw new ParseError("Invalid key: '" + keyVal[0] + "' in \\includegraphics.")
          }
        }
      }
    }

    const src = assertNodeType(args[0], "url").url;

    if (alt === "") {
      // No alt given. Use the file name. Strip away the path.
      alt = src;
      alt = alt.replace(/^.*[\\/]/, "");
      alt = alt.substring(0, alt.lastIndexOf("."));
    }

    if (
      !parser.settings.isTrusted({
        command: "\\includegraphics",
        url: src
      })
    ) {
      throw new ParseError(`Function "\\includegraphics" is not trusted`, token)
    }

    return {
      type: "includegraphics",
      mode: parser.mode,
      alt: alt,
      width: width,
      height: height,
      totalheight: totalheight,
      src: src
    }
  },
  mathmlBuilder: (group, style) => {
    const height = calculateSize(group.height, style);
    const depth = { number: 0, unit: "em" };

    if (group.totalheight.number > 0) {
      if (group.totalheight.unit === height.unit &&
        group.totalheight.number > height.number) {
        depth.number = group.totalheight.number - height.number;
        depth.unit = height.unit;
      }
    }

    let width = 0;
    if (group.width.number > 0) {
      width = calculateSize(group.width, style);
    }

    const graphicStyle = { height: height.number + depth.number + "em" };
    if (width.number > 0) {
      graphicStyle.width = width.number + width.unit;
    }
    if (depth.number > 0) {
      graphicStyle.verticalAlign = -depth.number + depth.unit;
    }

    const node = new Img(group.src, group.alt, graphicStyle);
    node.height = height;
    node.depth = depth;
    return new mathMLTree.MathNode("mtext", [node])
  }
});

// Horizontal spacing commands


// TODO: \hskip and \mskip should support plus and minus in lengths

defineFunction({
  type: "kern",
  names: ["\\kern", "\\mkern", "\\hskip", "\\mskip"],
  props: {
    numArgs: 1,
    argTypes: ["size"],
    primitive: true,
    allowedInText: true
  },
  handler({ parser, funcName, token }, args) {
    const size = assertNodeType(args[0], "size");
    if (parser.settings.strict) {
      const mathFunction = funcName[1] === "m"; // \mkern, \mskip
      const muUnit = size.value.unit === "mu";
      if (mathFunction) {
        if (!muUnit) {
          throw new ParseError(`LaTeX's ${funcName} supports only mu units, ` +
            `not ${size.value.unit} units`, token)
        }
        if (parser.mode !== "math") {
          throw new ParseError(`LaTeX's ${funcName} works only in math mode`, token)
        }
      } else {
        // !mathFunction
        if (muUnit) {
          throw new ParseError(`LaTeX's ${funcName} doesn't support mu units`, token)
        }
      }
    }
    return {
      type: "kern",
      mode: parser.mode,
      dimension: size.value
    };
  },
  mathmlBuilder(group, style) {
    const dimension = calculateSize(group.dimension, style);
    const ch = dimension.number > 0 && dimension.unit === "em"
      ? spaceCharacter(dimension.number)
      : "";
    if (group.mode === "text" && ch.length > 0) {
      const character = new mathMLTree.TextNode(ch);
      return new mathMLTree.MathNode("mtext", [character]);
    } else {
      if (dimension.number >= 0) {
        const node = new mathMLTree.MathNode("mspace");
        node.setAttribute("width", dimension.number + dimension.unit);
        return node
      } else {
        // Don't use <mspace> or <mpadded> because
        // WebKit recognizes negative left margin only on a <mrow> element
        const node = new mathMLTree.MathNode("mrow");
        node.style.marginLeft = dimension.number + dimension.unit;
        return node
      }
    }
  }
});

const spaceCharacter = function(width) {
  if (width >= 0.05555 && width <= 0.05556) {
    return "\u200a"; // &VeryThinSpace;
  } else if (width >= 0.1666 && width <= 0.1667) {
    return "\u2009"; // &ThinSpace;
  } else if (width >= 0.2222 && width <= 0.2223) {
    return "\u2005"; // &MediumSpace;
  } else if (width >= 0.2777 && width <= 0.2778) {
    return "\u2005\u200a"; // &ThickSpace;
  } else {
    return "";
  }
};

// Limit valid characters to a small set, for safety.
const invalidIdRegEx = /[^A-Za-z_0-9-]/g;

defineFunction({
  type: "label",
  names: ["\\label"],
  props: {
    numArgs: 1,
    argTypes: ["raw"]
  },
  handler({ parser }, args) {
    return {
      type: "label",
      mode: parser.mode,
      string: args[0].string.replace(invalidIdRegEx, "")
    };
  },
  mathmlBuilder(group, style) {
    // Return a no-width, no-ink element with an HTML id.
    const node = new mathMLTree.MathNode("mrow", [], ["tml-label"]);
    if (group.string.length > 0) {
      node.setLabel(group.string);
    }
    return node
  }
});

// Horizontal overlap functions

const textModeLap = ["\\clap", "\\llap", "\\rlap"];

defineFunction({
  type: "lap",
  names: ["\\mathllap", "\\mathrlap", "\\mathclap", "\\clap", "\\llap", "\\rlap"],
  props: {
    numArgs: 1,
    allowedInText: true
  },
  handler: ({ parser, funcName, token }, args) => {
    if (textModeLap.includes(funcName)) {
      if (parser.settings.strict && parser.mode !== "text") {
        throw new ParseError(`{${funcName}} can be used only in text mode.
 Try \\math${funcName.slice(1)}`, token)
      }
      funcName = funcName.slice(1);
    } else {
      funcName = funcName.slice(5);
    }
    const body = args[0];
    return {
      type: "lap",
      mode: parser.mode,
      alignment: funcName,
      body
    }
  },
  mathmlBuilder: (group, style) => {
    // mathllap, mathrlap, mathclap
    let strut;
    if (group.alignment === "llap") {
      // We need an invisible strut with the same depth as the group.
      // We can't just read the depth, so we use \vphantom methods.
      const phantomInner = buildExpression(ordargument(group.body), style);
      const phantom = new mathMLTree.MathNode("mphantom", phantomInner);
      strut = new mathMLTree.MathNode("mpadded", [phantom]);
      strut.setAttribute("width", "0.1px");  // Don't use 0. WebKit would hide it.
    }

    const inner = buildGroup$1(group.body, style);
    let node;
    if (group.alignment === "llap") {
      inner.style.position = "absolute";
      inner.style.right = "0";
      inner.style.bottom = `0`; // If we could have read the ink depth, it would go here.
      node = new mathMLTree.MathNode("mpadded", [strut, inner]);
    } else {
      node = new mathMLTree.MathNode("mpadded", [inner]);
    }

    if (group.alignment === "rlap") {
      if (group.body.body.length > 0 && group.body.body[0].type === "genfrac") {
        // In Firefox, a <mpadded> squashes the 3/18em padding of a child \frac. Put it back.
        node.setAttribute("lspace", "0.16667em");
      }
    } else {
      const offset = group.alignment === "llap" ? "-1" : "-0.5";
      node.setAttribute("lspace", offset + "width");
      if (group.alignment === "llap") {
        node.style.position = "relative";
      } else {
        node.style.display = "flex";
        node.style.justifyContent = "center";
      }
    }
    node.setAttribute("width", "0.1px"); // Don't use 0. WebKit would hide it.
    return node
  }
});

// Switching from text mode back to math mode
defineFunction({
  type: "ordgroup",
  names: ["\\(", "$"],
  props: {
    numArgs: 0,
    allowedInText: true,
    allowedInMath: false
  },
  handler({ funcName, parser }, args) {
    const outerMode = parser.mode;
    parser.switchMode("math");
    const close = funcName === "\\(" ? "\\)" : "$";
    const body = parser.parseExpression(false, close);
    parser.expect(close);
    parser.switchMode(outerMode);
    return {
      type: "ordgroup",
      mode: parser.mode,
      body
    };
  }
});

// Check for extra closing math delimiters
defineFunction({
  type: "text", // Doesn't matter what this is.
  names: ["\\)", "\\]"],
  props: {
    numArgs: 0,
    allowedInText: true,
    allowedInMath: false
  },
  handler(context, token) {
    throw new ParseError(`Mismatched ${context.funcName}`, token);
  }
});

const chooseStyle = (group, style) => {
  switch (style.level) {
    case StyleLevel.DISPLAY:       // 0
      return group.display;
    case StyleLevel.TEXT:          // 1
      return group.text;
    case StyleLevel.SCRIPT:        // 2
      return group.script;
    case StyleLevel.SCRIPTSCRIPT:  // 3
      return group.scriptscript;
    default:
      return group.text;
  }
};

defineFunction({
  type: "mathchoice",
  names: ["\\mathchoice"],
  props: {
    numArgs: 4,
    primitive: true
  },
  handler: ({ parser }, args) => {
    return {
      type: "mathchoice",
      mode: parser.mode,
      display: ordargument(args[0]),
      text: ordargument(args[1]),
      script: ordargument(args[2]),
      scriptscript: ordargument(args[3])
    };
  },
  mathmlBuilder: (group, style) => {
    const body = chooseStyle(group, style);
    return buildExpressionRow(body, style);
  }
});

const textAtomTypes = ["text", "textord", "mathord", "atom"];

function mathmlBuilder$3(group, style) {
  let node;
  const inner = buildExpression(group.body, style);

  if (group.mclass === "minner") {
    node = new mathMLTree.MathNode("mpadded", inner);
  } else if (group.mclass === "mord") {
    if (group.isCharacterBox || inner[0].type === "mathord") {
      node = inner[0];
      node.type = "mi";
      if (node.children.length === 1 && node.children[0].text && node.children[0].text === "∇") {
        node.setAttribute("mathvariant", "normal");
      }
    } else {
      node = new mathMLTree.MathNode("mi", inner);
    }
  } else {
    node = new mathMLTree.MathNode("mrow", inner);
    if (group.mustPromote) {
      node = inner[0];
      node.type = "mo";
      if (group.isCharacterBox && group.body[0].text && /[A-Za-z]/.test(group.body[0].text)) {
        node.setAttribute("mathvariant", "italic");
      }
    } else {
      node = new mathMLTree.MathNode("mrow", inner);
    }

    // Set spacing based on what is the most likely adjacent atom type.
    // See TeXbook p170.
    const doSpacing = style.level < 2; // Operator spacing is zero inside a (sub|super)script.
    if (node.type === "mrow") {
      if (doSpacing ) {
        if (group.mclass === "mbin") {
          // medium space
          node.children.unshift(padding(0.2222));
          node.children.push(padding(0.2222));
        } else if (group.mclass === "mrel") {
          // thickspace
          node.children.unshift(padding(0.2778));
          node.children.push(padding(0.2778));
        } else if (group.mclass === "mpunct") {
          node.children.push(padding(0.1667));
        } else if (group.mclass === "minner") {
          node.children.unshift(padding(0.0556));  // 1 mu is the most likely option
          node.children.push(padding(0.0556));
        }
      }
    } else {
      if (group.mclass === "mbin") {
        // medium space
        node.attributes.lspace = (doSpacing ? "0.2222em" : "0");
        node.attributes.rspace = (doSpacing ? "0.2222em" : "0");
      } else if (group.mclass === "mrel") {
        // thickspace
        node.attributes.lspace = (doSpacing ? "0.2778em" : "0");
        node.attributes.rspace = (doSpacing ? "0.2778em" : "0");
      } else if (group.mclass === "mpunct") {
        node.attributes.lspace = "0em";
        node.attributes.rspace = (doSpacing ? "0.1667em" : "0");
      } else if (group.mclass === "mopen" || group.mclass === "mclose") {
        node.attributes.lspace = "0em";
        node.attributes.rspace = "0em";
      } else if (group.mclass === "minner" && doSpacing) {
        node.attributes.lspace = "0.0556em"; // 1 mu is the most likely option
        node.attributes.width = "+0.1111em";
      }
    }

    if (!(group.mclass === "mopen" || group.mclass === "mclose")) {
      delete node.attributes.stretchy;
      delete node.attributes.form;
    }
  }
  return node;
}

// Math class commands except \mathop
defineFunction({
  type: "mclass",
  names: [
    "\\mathord",
    "\\mathbin",
    "\\mathrel",
    "\\mathopen",
    "\\mathclose",
    "\\mathpunct",
    "\\mathinner"
  ],
  props: {
    numArgs: 1,
    primitive: true
  },
  handler({ parser, funcName }, args) {
    const body = args[0];
    const isCharacterBox = utils.isCharacterBox(body);
    // We should not wrap a <mo> around a <mi> or <mord>. That would be invalid MathML.
    // In that case, we instead promote the text contents of the body to the parent.
    let mustPromote = true;
    const mord = { type: "mathord", text: "", mode: parser.mode };
    const arr = (body.body) ? body.body : [body];
    for (const arg of arr) {
      if (textAtomTypes.includes(arg.type)) {
        if (symbols[parser.mode][arg.text]) {
          mord.text += symbols[parser.mode][arg.text].replace;
        } else if (arg.text) {
          mord.text += arg.text;
        } else if (arg.body) {
          arg.body.map(e => { mord.text += e.text; });
        }
      } else {
        mustPromote = false;
        break
      }
    }
    if (mustPromote && funcName === "\\mathord" && mord.type === "mathord"
                    && mord.text.length > 1) {
      return mord
    } else {
      return {
        type: "mclass",
        mode: parser.mode,
        mclass: "m" + funcName.slice(5),
        body: ordargument(mustPromote ? mord : body),
        isCharacterBox,
        mustPromote
      };
    }
  },
  mathmlBuilder: mathmlBuilder$3
});

const binrelClass = (arg) => {
  // \binrel@ spacing varies with (bin|rel|ord) of the atom in the argument.
  // (by rendering separately and with {}s before and after, and measuring
  // the change in spacing).  We'll do roughly the same by detecting the
  // atom type directly.
  const atom = arg.type === "ordgroup" && arg.body.length && arg.body.length === 1
    ? arg.body[0]
    : arg;
  if (atom.type === "atom" && (atom.family === "bin" || atom.family === "rel")) {
    return "m" + atom.family;
  } else {
    return "mord";
  }
};

// \@binrel{x}{y} renders like y but as mbin/mrel/mord if x is mbin/mrel/mord.
// This is equivalent to \binrel@{x}\binrel@@{y} in AMSTeX.
defineFunction({
  type: "mclass",
  names: ["\\@binrel"],
  props: {
    numArgs: 2
  },
  handler({ parser }, args) {
    return {
      type: "mclass",
      mode: parser.mode,
      mclass: binrelClass(args[0]),
      body: ordargument(args[1]),
      isCharacterBox: utils.isCharacterBox(args[1])
    };
  }
});

// Build a relation or stacked op by placing one symbol on top of another
defineFunction({
  type: "mclass",
  names: ["\\stackrel", "\\overset", "\\underset"],
  props: {
    numArgs: 2
  },
  handler({ parser, funcName }, args) {
    const baseArg = args[1];
    const shiftedArg = args[0];

    let mclass;
    if (funcName !== "\\stackrel") {
      // LaTeX applies \binrel spacing to \overset and \underset.
      mclass = binrelClass(baseArg);
    } else {
      mclass = "mrel";  // for \stackrel
    }

    const baseType = mclass === "mrel" || mclass === "mbin"
      ? "op"
      : "ordgroup";

    const baseOp = {
      type: baseType,
      mode: baseArg.mode,
      limits: true,
      alwaysHandleSupSub: true,
      parentIsSupSub: false,
      symbol: false,
      suppressBaseShift: funcName !== "\\stackrel",
      body: ordargument(baseArg)
    };

    return {
      type: "supsub",
      mode: shiftedArg.mode,
      stack: true,
      base: baseOp,
      sup: funcName === "\\underset" ? null : shiftedArg,
      sub: funcName === "\\underset" ? shiftedArg : null
    };
  },
  mathmlBuilder: mathmlBuilder$3
});

// Helper function
const buildGroup = (el, style, noneNode) => {
  if (!el) { return noneNode }
  const node = buildGroup$1(el, style);
  if (node.type === "mrow" && node.children.length === 0) { return noneNode }
  return node
};

defineFunction({
  type: "multiscript",
  names: ["\\sideset", "\\pres@cript"], // See macros.js for \prescript
  props: {
    numArgs: 3
  },
  handler({ parser, funcName, token }, args) {
    if (args[2].body.length === 0) {
      throw new ParseError(funcName + `cannot parse an empty base.`)
    }
    const base = args[2].body[0];
    if (parser.settings.strict && funcName === "\\sideset" && !base.symbol) {
      throw new ParseError(`The base of \\sideset must be a big operator. Try \\prescript.`)
    }

    if ((args[0].body.length > 0 && args[0].body[0].type !== "supsub") ||
        (args[1].body.length > 0 && args[1].body[0].type !== "supsub")) {
      throw new ParseError("\\sideset can parse only subscripts and " +
                            "superscripts in its first two arguments", token)
    }

    // The prescripts and postscripts come wrapped in a supsub.
    const prescripts = args[0].body.length > 0 ? args[0].body[0] : null;
    const postscripts = args[1].body.length > 0 ? args[1].body[0] : null;

    if (!prescripts && !postscripts) {
      return base
    } else if (!prescripts) {
      // It's not a multi-script. Get a \textstyle supsub.
      return {
        type: "styling",
        mode: parser.mode,
        scriptLevel: "text",
        body: [{
          type: "supsub",
          mode: parser.mode,
          base,
          sup: postscripts.sup,
          sub: postscripts.sub
        }]
      }
    } else {
      return {
        type: "multiscript",
        mode: parser.mode,
        isSideset: funcName === "\\sideset",
        prescripts,
        postscripts,
        base
      }
    }
  },
  mathmlBuilder(group, style) {
    const base =  buildGroup$1(group.base, style);

    const prescriptsNode = new mathMLTree.MathNode("mprescripts");
    const noneNode = new mathMLTree.MathNode("none");
    let children = [];

    const preSub = buildGroup(group.prescripts.sub, style, noneNode);
    const preSup = buildGroup(group.prescripts.sup, style, noneNode);
    if (group.isSideset) {
      // This seems silly, but LaTeX does this. Firefox ignores it, which does not make me sad.
      preSub.setAttribute("style", "text-align: left;");
      preSup.setAttribute("style", "text-align: left;");
    }

    if (group.postscripts) {
      const postSub = buildGroup(group.postscripts.sub, style, noneNode);
      const postSup = buildGroup(group.postscripts.sup, style, noneNode);
      children = [base, postSub, postSup, prescriptsNode, preSub, preSup];
    } else {
      children = [base, prescriptsNode, preSub, preSup];
    }

    return new mathMLTree.MathNode("mmultiscripts", children);
  }
});

defineFunction({
  type: "not",
  names: ["\\not"],
  props: {
    numArgs: 1,
    primitive: true,
    allowedInText: false
  },
  handler({ parser }, args) {
    const isCharacterBox = utils.isCharacterBox(args[0]);
    let body;
    if (isCharacterBox) {
      body = ordargument(args[0]);
      if (body[0].text.charAt(0) === "\\") {
        body[0].text = symbols.math[body[0].text].replace;
      }
      // \u0338 is the Unicode Combining Long Solidus Overlay
      body[0].text = body[0].text.slice(0, 1) + "\u0338" + body[0].text.slice(1);
    } else {
      // When the argument is not a character box, TeX does an awkward, poorly placed overlay.
      // We'll do the same.
      const notNode = { type: "textord", mode: "math", text: "\u0338" };
      const kernNode = { type: "kern", mode: "math", dimension: { number: -0.6, unit: "em" } };
      body = [notNode, kernNode, args[0]];
    }
    return {
      type: "not",
      mode: parser.mode,
      body,
      isCharacterBox
    };
  },
  mathmlBuilder(group, style) {
    if (group.isCharacterBox) {
      const inner = buildExpression(group.body, style, true);
      return inner[0]
    } else {
      return buildExpressionRow(group.body, style)
    }
  }
});

// Limits, symbols

// Some helpers

const ordAtomTypes = ["textord", "mathord", "atom"];

// Most operators have a large successor symbol, but these don't.
const noSuccessor = ["\\smallint"];

// Math operators (e.g. \sin) need a space between these types and themselves:
const ordTypes = ["textord", "mathord", "ordgroup", "close", "leftright", "font"];

// NOTE: Unlike most `builders`s, this one handles not only "op", but also
// "supsub" since some of them (like \int) can affect super/subscripting.

const setSpacing = node => {
  // The user wrote a \mathop{…} function. Change spacing from default to OP spacing.
  // The most likely spacing for an OP is a thin space per TeXbook p170.
  node.attributes.lspace = "0.1667em";
  node.attributes.rspace = "0.1667em";
};

const mathmlBuilder$2 = (group, style) => {
  let node;

  if (group.symbol) {
    // This is a symbol. Just add the symbol.
    node = new MathNode("mo", [makeText(group.name, group.mode)]);
    if (noSuccessor.includes(group.name)) {
      node.setAttribute("largeop", "false");
    } else {
      node.setAttribute("movablelimits", "false");
    }
    if (group.fromMathOp) { setSpacing(node); }
  } else if (group.body) {
    // This is an operator with children. Add them.
    node = new MathNode("mo", buildExpression(group.body, style));
    if (group.fromMathOp) { setSpacing(node); }
  } else {
    // This is a text operator. Add all of the characters from the operator's name.
    node = new MathNode("mi", [new TextNode(group.name.slice(1))]);

    if (!group.parentIsSupSub) {
      // Append an invisible <mo>&ApplyFunction;</mo>.
      // ref: https://www.w3.org/TR/REC-MathML/chap3_2.html#sec3.2.4
      const operator = new MathNode("mo", [makeText("\u2061", "text")]);
      const row = [node, operator];
      // Set spacing
      if (group.needsLeadingSpace) {
        const lead = new MathNode("mspace");
        lead.setAttribute("width", "0.1667em"); // thin space.
        row.unshift(lead);
      }
      if (!group.isFollowedByDelimiter) {
        const trail = new MathNode("mspace");
        trail.setAttribute("width", "0.1667em"); // thin space.
        row.push(trail);
      }
      node = new MathNode("mrow", row);
    }
  }

  return node;
};

const singleCharBigOps = {
  "\u220F": "\\prod",
  "\u2210": "\\coprod",
  "\u2211": "\\sum",
  "\u22c0": "\\bigwedge",
  "\u22c1": "\\bigvee",
  "\u22c2": "\\bigcap",
  "\u22c3": "\\bigcup",
  "\u2a00": "\\bigodot",
  "\u2a01": "\\bigoplus",
  "\u2a02": "\\bigotimes",
  "\u2a04": "\\biguplus",
  "\u2a05": "\\bigsqcap",
  "\u2a06": "\\bigsqcup",
  "\u2a03": "\\bigcupdot",
  "\u2a07": "\\bigdoublevee",
  "\u2a08": "\\bigdoublewedge",
  "\u2a09": "\\bigtimes"
};

defineFunction({
  type: "op",
  names: [
    "\\coprod",
    "\\bigvee",
    "\\bigwedge",
    "\\biguplus",
    "\\bigcupplus",
    "\\bigcupdot",
    "\\bigcap",
    "\\bigcup",
    "\\bigdoublevee",
    "\\bigdoublewedge",
    "\\intop",
    "\\prod",
    "\\sum",
    "\\bigotimes",
    "\\bigoplus",
    "\\bigodot",
    "\\bigsqcap",
    "\\bigsqcup",
    "\\bigtimes",
    "\\smallint",
    "\u220F",
    "\u2210",
    "\u2211",
    "\u22c0",
    "\u22c1",
    "\u22c2",
    "\u22c3",
    "\u2a00",
    "\u2a01",
    "\u2a02",
    "\u2a03",
    "\u2a04",
    "\u2a05",
    "\u2a06",
    "\u2a07",
    "\u2a08",
    "\u2a09"
  ],
  props: {
    numArgs: 0
  },
  handler: ({ parser, funcName }, args) => {
    let fName = funcName;
    if (fName.length === 1) {
      fName = singleCharBigOps[fName];
    }
    return {
      type: "op",
      mode: parser.mode,
      limits: true,
      parentIsSupSub: false,
      symbol: true,
      stack: false, // This is true for \stackrel{}, not here.
      name: fName
    };
  },
  mathmlBuilder: mathmlBuilder$2
});

// Note: calling defineFunction with a type that's already been defined only
// works because the same mathmlBuilder is being used.
defineFunction({
  type: "op",
  names: ["\\mathop"],
  props: {
    numArgs: 1,
    primitive: true
  },
  handler: ({ parser }, args) => {
    const body = args[0];
    // It would be convienient to just wrap a <mo> around the argument.
    // But if the argument is a <mi> or <mord>, that would be invalid MathML.
    // In that case, we instead promote the text contents of the body to the parent.
    const arr = (body.body) ? body.body : [body];
    const isSymbol = arr.length === 1 && ordAtomTypes.includes(arr[0].type);
    return {
      type: "op",
      mode: parser.mode,
      limits: true,
      parentIsSupSub: false,
      symbol: isSymbol,
      fromMathOp: true,
      stack: false,
      name: isSymbol ? arr[0].text : null,
      body: isSymbol ? null : ordargument(body)
    };
  },
  mathmlBuilder: mathmlBuilder$2
});

// There are 2 flags for operators; whether they produce limits in
// displaystyle, and whether they are symbols and should grow in
// displaystyle. These four groups cover the four possible choices.

const singleCharIntegrals = {
  "\u222b": "\\int",
  "\u222c": "\\iint",
  "\u222d": "\\iiint",
  "\u222e": "\\oint",
  "\u222f": "\\oiint",
  "\u2230": "\\oiiint",
  "\u2231": "\\intclockwise",
  "\u2232": "\\varointclockwise",
  "\u2a0c": "\\iiiint",
  "\u2a0d": "\\intbar",
  "\u2a0e": "\\intBar",
  "\u2a0f": "\\fint",
  "\u2a12": "\\rppolint",
  "\u2a13": "\\scpolint",
  "\u2a15": "\\pointint",
  "\u2a16": "\\sqint",
  "\u2a17": "\\intlarhk",
  "\u2a18": "\\intx",
  "\u2a19": "\\intcap",
  "\u2a1a": "\\intcup"
};

// No limits, not symbols
defineFunction({
  type: "op",
  names: [
    "\\arcsin",
    "\\arccos",
    "\\arctan",
    "\\arctg",
    "\\arcctg",
    "\\arg",
    "\\ch",
    "\\cos",
    "\\cosec",
    "\\cosh",
    "\\cot",
    "\\cotg",
    "\\coth",
    "\\csc",
    "\\ctg",
    "\\cth",
    "\\deg",
    "\\dim",
    "\\exp",
    "\\hom",
    "\\ker",
    "\\lg",
    "\\ln",
    "\\log",
    "\\sec",
    "\\sin",
    "\\sinh",
    "\\sh",
    "\\sgn",
    "\\tan",
    "\\tanh",
    "\\tg",
    "\\th"
  ],
  props: {
    numArgs: 0
  },
  handler({ parser, funcName }) {
    const prevAtomType = parser.prevAtomType;
    const next = parser.gullet.future().text;
    return {
      type: "op",
      mode: parser.mode,
      limits: false,
      parentIsSupSub: false,
      symbol: false,
      stack: false,
      isFollowedByDelimiter: isDelimiter(next),
      needsLeadingSpace: prevAtomType.length > 0 && ordTypes.includes(prevAtomType),
      name: funcName
    };
  },
  mathmlBuilder: mathmlBuilder$2
});

// Limits, not symbols
defineFunction({
  type: "op",
  names: ["\\det", "\\gcd", "\\inf", "\\lim", "\\max", "\\min", "\\Pr", "\\sup"],
  props: {
    numArgs: 0
  },
  handler({ parser, funcName }) {
    const prevAtomType = parser.prevAtomType;
    const next = parser.gullet.future().text;
    return {
      type: "op",
      mode: parser.mode,
      limits: true,
      parentIsSupSub: false,
      symbol: false,
      stack: false,
      isFollowedByDelimiter: isDelimiter(next),
      needsLeadingSpace: prevAtomType.length > 0 && ordTypes.includes(prevAtomType),
      name: funcName
    };
  },
  mathmlBuilder: mathmlBuilder$2
});

// No limits, symbols
defineFunction({
  type: "op",
  names: [
    "\\int",
    "\\iint",
    "\\iiint",
    "\\iiiint",
    "\\oint",
    "\\oiint",
    "\\oiiint",
    "\\intclockwise",
    "\\varointclockwise",
    "\\intbar",
    "\\intBar",
    "\\fint",
    "\\rppolint",
    "\\scpolint",
    "\\pointint",
    "\\sqint",
    "\\intlarhk",
    "\\intx",
    "\\intcap",
    "\\intcup",
    "\u222b",
    "\u222c",
    "\u222d",
    "\u222e",
    "\u222f",
    "\u2230",
    "\u2231",
    "\u2232",
    "\u2a0c",
    "\u2a0d",
    "\u2a0e",
    "\u2a0f",
    "\u2a12",
    "\u2a13",
    "\u2a15",
    "\u2a16",
    "\u2a17",
    "\u2a18",
    "\u2a19",
    "\u2a1a"
  ],
  props: {
    numArgs: 0
  },
  handler({ parser, funcName }) {
    let fName = funcName;
    if (fName.length === 1) {
      fName = singleCharIntegrals[fName];
    }
    return {
      type: "op",
      mode: parser.mode,
      limits: false,
      parentIsSupSub: false,
      symbol: true,
      stack: false,
      name: fName
    };
  },
  mathmlBuilder: mathmlBuilder$2
});

// NOTE: Unlike most builders, this one handles not only
// "operatorname", but also  "supsub" since \operatorname* can
// affect super/subscripting.

const mathmlBuilder$1 = (group, style) => {
  let expression = buildExpression(group.body, style.withFont("mathrm"));

  // Is expression a string or has it something like a fraction?
  let isAllString = true; // default
  for (let i = 0; i < expression.length; i++) {
    let node = expression[i];
    if (node instanceof mathMLTree.MathNode) {
      if ((node.type === "mrow" || node.type === "mpadded") && node.children.length === 1 &&
          node.children[0] instanceof mathMLTree.MathNode) {
        node = node.children[0];
      }
      switch (node.type) {
        case "mi":
        case "mn":
        case "ms":
        case "mtext":
          break; // Do nothing yet.
        case "mspace":
          {
            if (node.attributes.width) {
              const width = node.attributes.width.replace("em", "");
              const ch = spaceCharacter(Number(width));
              if (ch === "") {
                isAllString = false;
              } else {
                expression[i] = new mathMLTree.MathNode("mtext", [new mathMLTree.TextNode(ch)]);
              }
            }
          }
          break
        case "mo": {
          const child = node.children[0];
          if (node.children.length === 1 && child instanceof mathMLTree.TextNode) {
            child.text = child.text.replace(/\u2212/, "-").replace(/\u2217/, "*");
          } else {
            isAllString = false;
          }
          break
        }
        default:
          isAllString = false;
      }
    } else {
      isAllString = false;
    }
  }

  if (isAllString) {
    // Write a single TextNode instead of multiple nested tags.
    const word = expression.map((node) => node.toText()).join("");
    expression = [new mathMLTree.TextNode(word)];
  } else if (
    expression.length === 1
    && ["mover", "munder"].includes(expression[0].type) &&
    (expression[0].children[0].type === "mi" || expression[0].children[0].type === "mtext")
  ) {
    expression[0].children[0].type = "mi";
    if (group.parentIsSupSub) {
      return new mathMLTree.MathNode("mrow", expression)
    } else {
      const operator = new mathMLTree.MathNode("mo", [makeText("\u2061", "text")]);
      return mathMLTree.newDocumentFragment([expression[0], operator])
    }
  }

  let wrapper;
  if (isAllString) {
    wrapper = new mathMLTree.MathNode("mi", expression);
    if (expression[0].text.length === 1) {
      wrapper.setAttribute("mathvariant", "normal");
    }
  } else {
    wrapper = new mathMLTree.MathNode("mrow", expression);
  }

  if (!group.parentIsSupSub) {
    // Append an <mo>&ApplyFunction;</mo>.
    // ref: https://www.w3.org/TR/REC-MathML/chap3_2.html#sec3.2.4
    const operator = new mathMLTree.MathNode("mo", [makeText("\u2061", "text")]);
    const fragment = [wrapper, operator];
    if (group.needsLeadingSpace) {
      // LaTeX gives operator spacing, but a <mi> gets ord spacing.
      // So add a leading space.
      const space = new mathMLTree.MathNode("mspace");
      space.setAttribute("width", "0.1667em"); // thin space.
      fragment.unshift(space);
    }
    if (!group.isFollowedByDelimiter) {
      const trail = new mathMLTree.MathNode("mspace");
      trail.setAttribute("width", "0.1667em"); // thin space.
      fragment.push(trail);
    }
    return mathMLTree.newDocumentFragment(fragment)
  }

  return wrapper
};

// \operatorname
// amsopn.dtx: \mathop{#1\kern\z@\operator@font#3}\newmcodes@
defineFunction({
  type: "operatorname",
  names: ["\\operatorname@", "\\operatornamewithlimits"],
  props: {
    numArgs: 1,
    allowedInArgument: true
  },
  handler: ({ parser, funcName }, args) => {
    const body = args[0];
    const prevAtomType = parser.prevAtomType;
    const next = parser.gullet.future().text;
    return {
      type: "operatorname",
      mode: parser.mode,
      body: ordargument(body),
      alwaysHandleSupSub: (funcName === "\\operatornamewithlimits"),
      limits: false,
      parentIsSupSub: false,
      isFollowedByDelimiter: isDelimiter(next),
      needsLeadingSpace: prevAtomType.length > 0 && ordTypes.includes(prevAtomType)
    };
  },
  mathmlBuilder: mathmlBuilder$1
});

defineMacro("\\operatorname",
  "\\@ifstar\\operatornamewithlimits\\operatorname@");

defineFunctionBuilders({
  type: "ordgroup",
  mathmlBuilder(group, style) {
    return buildExpressionRow(group.body, style, group.semisimple);
  }
});

defineFunction({
  type: "phantom",
  names: ["\\phantom"],
  props: {
    numArgs: 1,
    allowedInText: true
  },
  handler: ({ parser }, args) => {
    const body = args[0];
    return {
      type: "phantom",
      mode: parser.mode,
      body: ordargument(body)
    };
  },
  mathmlBuilder: (group, style) => {
    const inner = buildExpression(group.body, style);
    return new mathMLTree.MathNode("mphantom", inner);
  }
});

defineFunction({
  type: "hphantom",
  names: ["\\hphantom"],
  props: {
    numArgs: 1,
    allowedInText: true
  },
  handler: ({ parser }, args) => {
    const body = args[0];
    return {
      type: "hphantom",
      mode: parser.mode,
      body
    };
  },
  mathmlBuilder: (group, style) => {
    const inner = buildExpression(ordargument(group.body), style);
    const phantom = new mathMLTree.MathNode("mphantom", inner);
    const node = new mathMLTree.MathNode("mpadded", [phantom]);
    node.setAttribute("height", "0px");
    node.setAttribute("depth", "0px");
    return node;
  }
});

defineFunction({
  type: "vphantom",
  names: ["\\vphantom"],
  props: {
    numArgs: 1,
    allowedInText: true
  },
  handler: ({ parser }, args) => {
    const body = args[0];
    return {
      type: "vphantom",
      mode: parser.mode,
      body
    };
  },
  mathmlBuilder: (group, style) => {
    const inner = buildExpression(ordargument(group.body), style);
    const phantom = new mathMLTree.MathNode("mphantom", inner);
    const node = new mathMLTree.MathNode("mpadded", [phantom]);
    node.setAttribute("width", "0px");
    return node;
  }
});

// In LaTeX, \pmb is a simulation of bold font.
// The version of \pmb in ambsy.sty works by typesetting three copies of the argument
// with small offsets. We use CSS font-weight:bold.

defineFunction({
  type: "pmb",
  names: ["\\pmb"],
  props: {
    numArgs: 1,
    allowedInText: true
  },
  handler({ parser }, args) {
    return {
      type: "pmb",
      mode: parser.mode,
      body: ordargument(args[0])
    }
  },
  mathmlBuilder(group, style) {
    const inner = buildExpression(group.body, style);
    // Wrap with an <mstyle> element.
    const node = wrapWithMstyle(inner);
    node.setAttribute("style", "font-weight:bold");
    return node
  }
});

// \raise, \lower, and \raisebox

const mathmlBuilder = (group, style) => {
  const newStyle = style.withLevel(StyleLevel.TEXT);
  const node = new mathMLTree.MathNode("mpadded", [buildGroup$1(group.body, newStyle)]);
  const dy = calculateSize(group.dy, style);
  node.setAttribute("voffset", dy.number + dy.unit);
  // Add padding, which acts to increase height in Chromium.
  // TODO: Figure out some way to change height in Firefox w/o breaking Chromium.
  if (dy.number > 0) {
    node.style.padding = dy.number + dy.unit + " 0 0 0";
  } else {
    node.style.padding = "0 0 " + Math.abs(dy.number) + dy.unit + " 0";
  }
  return node
};

defineFunction({
  type: "raise",
  names: ["\\raise", "\\lower"],
  props: {
    numArgs: 2,
    argTypes: ["size", "primitive"],
    primitive: true
  },
  handler({ parser, funcName }, args) {
    const amount = assertNodeType(args[0], "size").value;
    if (funcName === "\\lower") { amount.number *= -1; }
    const body = args[1];
    return {
      type: "raise",
      mode: parser.mode,
      dy: amount,
      body
    };
  },
  mathmlBuilder
});


defineFunction({
  type: "raise",
  names: ["\\raisebox"],
  props: {
    numArgs: 2,
    argTypes: ["size", "hbox"],
    allowedInText: true
  },
  handler({ parser, funcName }, args) {
    const amount = assertNodeType(args[0], "size").value;
    const body = args[1];
    return {
      type: "raise",
      mode: parser.mode,
      dy: amount,
      body
    };
  },
  mathmlBuilder
});

defineFunction({
  type: "ref",
  names: ["\\ref", "\\eqref"],
  props: {
    numArgs: 1,
    argTypes: ["raw"]
  },
  handler({ parser, funcName }, args) {
    return {
      type: "ref",
      mode: parser.mode,
      funcName,
      string: args[0].string.replace(invalidIdRegEx, "")
    };
  },
  mathmlBuilder(group, style) {
    // Create an empty <a> node. Set a class and an href attribute.
    // The post-processor will populate with the target's tag or equation number.
    const classes = group.funcName === "\\ref" ? ["tml-ref"] : ["tml-ref", "tml-eqref"];
    return new AnchorNode("#" + group.string, classes, null)
  }
});

defineFunction({
  type: "reflect",
  names: ["\\reflectbox"],
  props: {
    numArgs: 1,
    argTypes: ["hbox"],
    allowedInText: true
  },
  handler({ parser }, args) {
    return {
      type: "reflect",
      mode: parser.mode,
      body: args[0]
    };
  },
  mathmlBuilder(group, style) {
    const node = buildGroup$1(group.body, style);
    node.style.transform = "scaleX(-1)";
    return node
  }
});

defineFunction({
  type: "internal",
  names: ["\\relax"],
  props: {
    numArgs: 0,
    allowedInText: true,
    allowedInArgument: true
  },
  handler({ parser }) {
    return {
      type: "internal",
      mode: parser.mode
    };
  }
});

defineFunction({
  type: "rule",
  names: ["\\rule"],
  props: {
    numArgs: 2,
    numOptionalArgs: 1,
    allowedInText: true,
    allowedInMath: true,
    argTypes: ["size", "size", "size"]
  },
  handler({ parser }, args, optArgs) {
    const shift = optArgs[0];
    const width = assertNodeType(args[0], "size");
    const height = assertNodeType(args[1], "size");
    return {
      type: "rule",
      mode: parser.mode,
      shift: shift && assertNodeType(shift, "size").value,
      width: width.value,
      height: height.value
    };
  },
  mathmlBuilder(group, style) {
    const width = calculateSize(group.width, style);
    const height = calculateSize(group.height, style);
    const shift = group.shift
      ? calculateSize(group.shift, style)
      : { number: 0, unit: "em" };
    const color = (style.color && style.getColor()) || "black";

    const rule = new mathMLTree.MathNode("mspace");
    if (width.number > 0 && height.number > 0) {
      rule.setAttribute("mathbackground", color);
    }
    rule.setAttribute("width", width.number + width.unit);
    rule.setAttribute("height", height.number + height.unit);
    if (shift.number === 0) { return rule }

    const wrapper = new mathMLTree.MathNode("mpadded", [rule]);
    if (shift.number >= 0) {
      wrapper.setAttribute("height", "+" + shift.number + shift.unit);
    } else {
      wrapper.setAttribute("height", shift.number + shift.unit);
      wrapper.setAttribute("depth", "+" + -shift.number + shift.unit);
    }
    wrapper.setAttribute("voffset", shift.number + shift.unit);
    return wrapper;
  }
});

const numRegEx = /^[0-9]$/;
const unicodeNumSubs = {
  '0': '₀',
  '1': '₁',
  '2': '₂',
  '3': '₃',
  '4': '₄',
  '5': '₅',
  '6': '₆',
  '7': '₇',
  '8': '₈',
  '9': '₉'
};
const unicodeNumSups = {
  '0': '⁰',
  '1': '¹',
  '2': '²',
  '3': '³',
  '4': '⁴',
  '5': '⁵',
  '6': '⁶',
  '7': '⁷',
  '8': '⁸',
  '9': '⁹'
};

defineFunction({
  type: "sfrac",
  names: ["\\sfrac"],
  props: {
    numArgs: 2,
    allowedInText: true,
    allowedInMath: true
  },
  handler({ parser }, args) {
    let numerator = "";
    for (const node of args[0].body) {
      if (node.type !== "textord" || !numRegEx.test(node.text)) {
        throw new ParseError("Numerator must be an integer.", node)
      }
      numerator += node.text;
    }
    let denominator = "";
    for (const node of args[1].body) {
      if (node.type !== "textord" || !numRegEx.test(node.text)) {
        throw new ParseError("Denominator must be an integer.", node)
      }
      denominator += node.text;
    }
    return {
      type: "sfrac",
      mode: parser.mode,
      numerator,
      denominator
    };
  },
  mathmlBuilder(group, style) {
    const numerator = group.numerator.split('').map(c => unicodeNumSups[c]).join('');
    const denominator = group.denominator.split('').map(c => unicodeNumSubs[c]).join('');
    // Use a fraction slash.
    const text = new mathMLTree.TextNode(numerator + "\u2044" + denominator, group.mode, style);
    return new mathMLTree.MathNode("mn", [text], ["special-fraction"])
  }
});

// The size mappings are taken from TeX with \normalsize=10pt.
// We don't have to track script level. MathML does that.
const sizeMap = {
  "\\tiny": 0.5,
  "\\sixptsize": 0.6,
  "\\Tiny": 0.6,
  "\\scriptsize": 0.7,
  "\\footnotesize": 0.8,
  "\\small": 0.9,
  "\\normalsize": 1.0,
  "\\large": 1.2,
  "\\Large": 1.44,
  "\\LARGE": 1.728,
  "\\huge": 2.074,
  "\\Huge": 2.488
};

defineFunction({
  type: "sizing",
  names: [
    "\\tiny",
    "\\sixptsize",
    "\\Tiny",
    "\\scriptsize",
    "\\footnotesize",
    "\\small",
    "\\normalsize",
    "\\large",
    "\\Large",
    "\\LARGE",
    "\\huge",
    "\\Huge"
  ],
  props: {
    numArgs: 0,
    allowedInText: true
  },
  handler: ({ breakOnTokenText, funcName, parser }, args) => {
    if (parser.settings.strict && parser.mode === "math") {
      // eslint-disable-next-line no-console
      console.log(`Temml strict-mode warning: Command ${funcName} is invalid in math mode.`);
    }
    const body = parser.parseExpression(false, breakOnTokenText, true);
    return {
      type: "sizing",
      mode: parser.mode,
      funcName,
      body
    };
  },
  mathmlBuilder: (group, style) => {
    const newStyle = style.withFontSize(sizeMap[group.funcName]);
    const inner = buildExpression(group.body, newStyle);
    // Wrap with an <mstyle> element.
    const node = wrapWithMstyle(inner);
    const factor = (sizeMap[group.funcName] / style.fontSize).toFixed(4);
    node.setAttribute("mathsize", factor + "em");
    return node;
  }
});

// smash, with optional [tb], as in AMS

defineFunction({
  type: "smash",
  names: ["\\smash"],
  props: {
    numArgs: 1,
    numOptionalArgs: 1,
    allowedInText: true
  },
  handler: ({ parser }, args, optArgs) => {
    let smashHeight = false;
    let smashDepth = false;
    const tbArg = optArgs[0] && assertNodeType(optArgs[0], "ordgroup");
    if (tbArg) {
      // Optional [tb] argument is engaged.
      // ref: amsmath: \renewcommand{\smash}[1][tb]{%
      //               def\mb@t{\ht}\def\mb@b{\dp}\def\mb@tb{\ht\z@\z@\dp}%
      let letter = "";
      for (let i = 0; i < tbArg.body.length; ++i) {
        const node = tbArg.body[i];
        // TODO: Write an AssertSymbolNode
        letter = node.text;
        if (letter === "t") {
          smashHeight = true;
        } else if (letter === "b") {
          smashDepth = true;
        } else {
          smashHeight = false;
          smashDepth = false;
          break;
        }
      }
    } else {
      smashHeight = true;
      smashDepth = true;
    }

    const body = args[0];
    return {
      type: "smash",
      mode: parser.mode,
      body,
      smashHeight,
      smashDepth
    };
  },
  mathmlBuilder: (group, style) => {
    const node = new mathMLTree.MathNode("mpadded", [buildGroup$1(group.body, style)]);

    if (group.smashHeight) {
      node.setAttribute("height", "0px");
    }

    if (group.smashDepth) {
      node.setAttribute("depth", "0px");
    }

    return node;
  }
});

// Letters that are x-height w/o a descender.
const xHeights = ['a', 'c', 'e', 'ı', 'm', 'n', 'o', 'r', 's', 'u', 'v', 'w', 'x', 'z', 'α',
  'ε', 'ι', 'κ', 'ν', 'ο', 'π', 'σ', 'τ', 'υ', 'ω', '\\alpha', '\\epsilon', "\\iota",
  '\\kappa', '\\nu', '\\omega', '\\pi', '\\tau', '\\omega'];

defineFunction({
  type: "sqrt",
  names: ["\\sqrt"],
  props: {
    numArgs: 1,
    numOptionalArgs: 1
  },
  handler({ parser }, args, optArgs) {
    const index = optArgs[0];
    const body = args[0];
    // Check if the body consists entirely of an x-height letter.
    // TODO: Remove this check after Chromium is fixed.
    if (body.body && body.body.length === 1 && body.body[0].text &&
          xHeights.includes(body.body[0].text)) {
      // Chromium does not put enough space above an x-height letter.
      // Insert a strut.
      body.body.push({
        "type": "rule",
        "mode": "math",
        "shift": null,
        "width": { "number": 0, "unit": "pt" },
        "height": { "number": 0.5, "unit": "em" }
      });
    }
    return {
      type: "sqrt",
      mode: parser.mode,
      body,
      index
    };
  },
  mathmlBuilder(group, style) {
    const { body, index } = group;
    return index
      ? new mathMLTree.MathNode("mroot", [
        buildGroup$1(body, style),
        buildGroup$1(index, style.incrementLevel())
      ])
    : new mathMLTree.MathNode("msqrt", [buildGroup$1(body, style)]);
  }
});

const styleMap = {
  display: 0,
  text: 1,
  script: 2,
  scriptscript: 3
};

const styleAttributes = {
  display: ["0", "true"],
  text: ["0", "false"],
  script: ["1", "false"],
  scriptscript: ["2", "false"]
};

defineFunction({
  type: "styling",
  names: ["\\displaystyle", "\\textstyle", "\\scriptstyle", "\\scriptscriptstyle"],
  props: {
    numArgs: 0,
    allowedInText: true,
    primitive: true
  },
  handler({ breakOnTokenText, funcName, parser }, args) {
    // parse out the implicit body
    const body = parser.parseExpression(true, breakOnTokenText, true);

    const scriptLevel = funcName.slice(1, funcName.length - 5);
    return {
      type: "styling",
      mode: parser.mode,
      // Figure out what scriptLevel to use by pulling out the scriptLevel from
      // the function name
      scriptLevel,
      body
    };
  },
  mathmlBuilder(group, style) {
    // Figure out what scriptLevel we're changing to.
    const newStyle = style.withLevel(styleMap[group.scriptLevel]);
    // The style argument in the next line does NOT directly set a MathML script level.
    // It just tracks the style level, in case we need to know it for supsub or mathchoice.
    const inner = buildExpression(group.body, newStyle);
    // Wrap with an <mstyle> element.
    const node = wrapWithMstyle(inner);

    const attr = styleAttributes[group.scriptLevel];

    // Here is where we set the MathML script level.
    node.setAttribute("scriptlevel", attr[0]);
    node.setAttribute("displaystyle", attr[1]);

    return node;
  }
});

/**
 * Sometimes, groups perform special rules when they have superscripts or
 * subscripts attached to them. This function lets the `supsub` group know that
 * Sometimes, groups perform special rules when they have superscripts or
 * its inner element should handle the superscripts and subscripts instead of
 * handling them itself.
 */

// Helpers
const symbolRegEx = /^m(over|under|underover)$/;

// From the KaTeX font metrics, identify letters that encroach on a superscript.
const smallPad = "DHKLUcegorsuvxyzΠΥΨαδηιμνοτυχϵ";
const mediumPad = "BCEFGIMNOPQRSTXZlpqtwΓΘΞΣΦΩβεζθξρςφψϑϕϱ";
const largePad = "AJdfΔΛ";

// Super scripts and subscripts, whose precise placement can depend on other
// functions that precede them.
defineFunctionBuilders({
  type: "supsub",
  mathmlBuilder(group, style) {
    // Is the inner group a relevant horizontal brace?
    let isBrace = false;
    let isOver;
    let isSup;
    let appendApplyFunction = false;
    let appendSpace = false;
    let needsLeadingSpace = false;

    if (group.base && group.base.type === "horizBrace") {
      isSup = !!group.sup;
      if (isSup === group.base.isOver) {
        isBrace = true;
        isOver = group.base.isOver;
      }
    }

    if (group.base && !group.stack &&
      (group.base.type === "op" || group.base.type === "operatorname")) {
      group.base.parentIsSupSub = true;
      appendApplyFunction = !group.base.symbol;
      appendSpace = appendApplyFunction && !group.isFollowedByDelimiter;
      needsLeadingSpace = group.base.needsLeadingSpace;
    }

    const children = group.stack && group.base.body.length === 1
      ? [buildGroup$1(group.base.body[0], style)]
      : [buildGroup$1(group.base, style)];

    // Note regarding scriptstyle level.
    // (Sub|super)scripts should not shrink beyond MathML scriptlevel 2 aka \scriptscriptstyle
    // Ref: https://w3c.github.io/mathml-core/#the-displaystyle-and-scriptlevel-attributes
    // (BTW, MathML scriptlevel 2 is equal to Temml level 3.)
    // But Chromium continues to shrink the (sub|super)scripts. So we explicitly set scriptlevel 2.

    const childStyle = style.inSubOrSup();
    if (group.sub) {
      const sub = buildGroup$1(group.sub, childStyle);
      if (style.level === 3) { sub.setAttribute("scriptlevel", "2"); }
      children.push(sub);
    }

    if (group.sup) {
      const sup = buildGroup$1(group.sup, childStyle);
      if (style.level === 3) { sup.setAttribute("scriptlevel", "2"); }
      if (group.base && group.base.text && group.base.text.length === 1) {
        // Make an italic correction on the superscript.
        const text = group.base.text;
        if (smallPad.indexOf(text) > -1) {
          sup.classes.push("tml-sml-pad");
        } else if (mediumPad.indexOf(text) > -1) {
          sup.classes.push("tml-med-pad");
        } else if (largePad.indexOf(text) > -1) {
          sup.classes.push("tml-lrg-pad");
        }
      }
      children.push(sup);
    }

    let nodeType;
    if (isBrace) {
      nodeType = isOver ? "mover" : "munder";
    } else if (!group.sub) {
      const base = group.base;
      if (
        base &&
        base.type === "op" &&
        base.limits &&
        (style.level === StyleLevel.DISPLAY || base.alwaysHandleSupSub)
      ) {
        nodeType = "mover";
      } else if (
        base &&
        base.type === "operatorname" &&
        base.alwaysHandleSupSub &&
        (base.limits || style.level === StyleLevel.DISPLAY)
      ) {
        nodeType = "mover";
      } else {
        nodeType = "msup";
      }
    } else if (!group.sup) {
      const base = group.base;
      if (group.stack) {
        nodeType = "munder";
      } else if (
        base &&
        base.type === "op" &&
        base.limits &&
        (style.level === StyleLevel.DISPLAY || base.alwaysHandleSupSub)
      ) {
        nodeType = "munder";
      } else if (
        base &&
        base.type === "operatorname" &&
        base.alwaysHandleSupSub &&
        (base.limits || style.level === StyleLevel.DISPLAY)
      ) {
        nodeType = "munder";
      } else {
        nodeType = "msub";
      }
    } else {
      const base = group.base;
      if (base && ((base.type === "op" && base.limits) || base.type === "multiscript") &&
        (style.level === StyleLevel.DISPLAY || base.alwaysHandleSupSub)
      ) {
        nodeType = "munderover";
      } else if (
        base &&
        base.type === "operatorname" &&
        base.alwaysHandleSupSub &&
        (style.level === StyleLevel.DISPLAY || base.limits)
      ) {
        nodeType = "munderover";
      } else {
        nodeType = "msubsup";
      }
    }

    let node = new mathMLTree.MathNode(nodeType, children);
    if (appendApplyFunction) {
      // Append an <mo>&ApplyFunction;</mo>.
      // ref: https://www.w3.org/TR/REC-MathML/chap3_2.html#sec3.2.4
      const operator = new mathMLTree.MathNode("mo", [makeText("\u2061", "text")]);
      if (needsLeadingSpace) {
        const space = new mathMLTree.MathNode("mspace");
        space.setAttribute("width", "0.1667em"); // thin space.
        node = mathMLTree.newDocumentFragment([space, node, operator]);
      } else {
        node = mathMLTree.newDocumentFragment([node, operator]);
      }
      if (appendSpace) {
        const space = new mathMLTree.MathNode("mspace");
        space.setAttribute("width", "0.1667em"); // thin space.
        node.children.push(space);
      }
    } else if (symbolRegEx.test(nodeType)) {
      // Wrap in a <mrow>. Otherwise Firefox stretchy parens will not stretch to include limits.
      node = new mathMLTree.MathNode("mrow", [node]);
    }

    return node
  }
});

// Operator ParseNodes created in Parser.js from symbol Groups in src/symbols.js.

const short = ["\\shortmid", "\\nshortmid", "\\shortparallel",
  "\\nshortparallel", "\\smallsetminus"];

const arrows = ["\\Rsh", "\\Lsh", "\\restriction"];

const isArrow = str => {
  if (str.length === 1) {
    const codePoint = str.codePointAt(0);
    return (0x218f < codePoint && codePoint < 0x2200)
  }
  return str.indexOf("arrow") > -1 || str.indexOf("harpoon") > -1 || arrows.includes(str)
};

defineFunctionBuilders({
  type: "atom",
  mathmlBuilder(group, style) {
    const node = new mathMLTree.MathNode("mo", [makeText(group.text, group.mode)]);
    if (group.family === "punct") {
      node.setAttribute("separator", "true");
    } else if (group.family === "open" || group.family === "close") {
      // Delims built here should not stretch vertically.
      // See delimsizing.js for stretchy delims.
      if (group.family === "open") {
        node.setAttribute("form", "prefix");
        // Set an explicit attribute for stretch. Otherwise Firefox may do it wrong.
        node.setAttribute("stretchy", "false");
      } else if (group.family === "close") {
        node.setAttribute("form", "postfix");
        node.setAttribute("stretchy", "false");
      }
    } else if (group.text === "\\mid") {
      // Firefox messes up this spacing if at the end of an <mrow>. See it explicitly.
      node.setAttribute("lspace", "0.22em"); // medium space
      node.setAttribute("rspace", "0.22em");
      node.setAttribute("stretchy", "false");
    } else if (group.family === "rel" && isArrow(group.text)) {
      node.setAttribute("stretchy", "false");
    } else if (short.includes(group.text)) {
      node.setAttribute("mathsize", "70%");
    } else if (group.text === ":") {
      // ":" is not in the MathML operator dictionary. Give it BIN spacing.
      node.attributes.lspace = "0.2222em";
      node.attributes.rspace = "0.2222em";
    } else if (group.needsSpacing) {
      // Fix a MathML bug that occurs when a <mo> is between two <mtext> elements.
      if (group.family === "bin") {
        return new mathMLTree.MathNode("mrow", [padding(0.222), node, padding(0.222)])
      } else {
        // REL spacing
        return new mathMLTree.MathNode("mrow", [padding(0.2778), node, padding(0.2778)])
      }
    }
    return node;
  }
});

/**
 * Maps TeX font commands to "mathvariant" attribute in buildMathML.js
 */
const fontMap = {
  // styles
  mathbf: "bold",
  mathrm: "normal",
  textit: "italic",
  mathit: "italic",
  mathnormal: "italic",

  // families
  mathbb: "double-struck",
  mathcal: "script",
  mathfrak: "fraktur",
  mathscr: "script",
  mathsf: "sans-serif",
  mathtt: "monospace"
};

/**
 * Returns the math variant as a string or null if none is required.
 */
const getVariant = function(group, style) {
  // Handle font specifiers as best we can.
  // Chromium does not support the MathML mathvariant attribute.
  // So we'll use Unicode replacement characters instead.
  // But first, determine the math variant.

  // Deal with the \textit, \textbf, etc., functions.
  if (style.fontFamily === "texttt") {
    return "monospace"
  } else if (style.fontFamily === "textsc") {
    return "normal"; // handled via character substitution in symbolsOrd.js.
  } else if (style.fontFamily === "textsf") {
    if (style.fontShape === "textit" && style.fontWeight === "textbf") {
      return "sans-serif-bold-italic"
    } else if (style.fontShape === "textit") {
      return "sans-serif-italic"
    } else if (style.fontWeight === "textbf") {
      return "sans-serif-bold"
    } else {
      return "sans-serif"
    }
  } else if (style.fontShape === "textit" && style.fontWeight === "textbf") {
    return "bold-italic"
  } else if (style.fontShape === "textit") {
    return "italic"
  } else if (style.fontWeight === "textbf") {
    return "bold"
  }

  // Deal with the \mathit, mathbf, etc, functions.
  const font = style.font;
  if (!font || font === "mathnormal") {
    return null
  }

  const mode = group.mode;
  switch (font) {
    case "mathit":
      return "italic"
    case "mathrm": {
      const codePoint = group.text.codePointAt(0);
      // LaTeX \mathrm returns italic for Greek characters.
      return  (0x03ab < codePoint && codePoint < 0x03cf) ? "italic" : "normal"
    }
    case "greekItalic":
      return "italic"
    case "up@greek":
      return "normal"
    case "boldsymbol":
    case "mathboldsymbol":
      return "bold-italic"
    case "mathbf":
      return "bold"
    case "mathbb":
      return "double-struck"
    case "mathfrak":
      return "fraktur"
    case "mathscr":
    case "mathcal":
      return "script"
    case "mathsf":
      return "sans-serif"
    case "mathsfit":
      return "sans-serif-italic"
    case "mathtt":
      return "monospace"
  }

  let text = group.text;
  if (symbols[mode][text] && symbols[mode][text].replace) {
    text = symbols[mode][text].replace;
  }

  return Object.prototype.hasOwnProperty.call(fontMap, font) ? fontMap[font] : null
};

// Chromium does not support the MathML `mathvariant` attribute.
// Instead, we replace ASCII characters with Unicode characters that
// are defined in the font as bold, italic, double-struck, etc.
// This module identifies those Unicode code points.

// First, a few helpers.
const script = Object.freeze({
  B: 0x20EA, // Offset from ASCII B to Unicode script B
  E: 0x20EB,
  F: 0x20EB,
  H: 0x20C3,
  I: 0x20C7,
  L: 0x20C6,
  M: 0x20E6,
  R: 0x20C9,
  e: 0x20CA,
  g: 0x20A3,
  o: 0x20C5
});

const frak = Object.freeze({
  C: 0x20EA,
  H: 0x20C4,
  I: 0x20C8,
  R: 0x20CA,
  Z: 0x20CE
});

const bbb = Object.freeze({
  C: 0x20BF, // blackboard bold
  H: 0x20C5,
  N: 0x20C7,
  P: 0x20C9,
  Q: 0x20C9,
  R: 0x20CB,
  Z: 0x20CA
});

const bold = Object.freeze({
  "\u03f5": 0x1D2E7, // lunate epsilon
  "\u03d1": 0x1D30C, // vartheta
  "\u03f0": 0x1D2EE, // varkappa
  "\u03c6": 0x1D319, // varphi
  "\u03f1": 0x1D2EF, // varrho
  "\u03d6": 0x1D30B  // varpi
});

const boldItalic = Object.freeze({
  "\u03f5": 0x1D35B, // lunate epsilon
  "\u03d1": 0x1D380, // vartheta
  "\u03f0": 0x1D362, // varkappa
  "\u03c6": 0x1D38D, // varphi
  "\u03f1": 0x1D363, // varrho
  "\u03d6": 0x1D37F  // varpi
});

const boldsf = Object.freeze({
  "\u03f5": 0x1D395, // lunate epsilon
  "\u03d1": 0x1D3BA, // vartheta
  "\u03f0": 0x1D39C, // varkappa
  "\u03c6": 0x1D3C7, // varphi
  "\u03f1": 0x1D39D, // varrho
  "\u03d6": 0x1D3B9  // varpi
});

const bisf = Object.freeze({
  "\u03f5": 0x1D3CF, // lunate epsilon
  "\u03d1": 0x1D3F4, // vartheta
  "\u03f0": 0x1D3D6, // varkappa
  "\u03c6": 0x1D401, // varphi
  "\u03f1": 0x1D3D7, // varrho
  "\u03d6": 0x1D3F3  // varpi
});

// Code point offsets below are derived from https://www.unicode.org/charts/PDF/U1D400.pdf
const offset = Object.freeze({
  upperCaseLatin: { // A-Z
    "normal": ch =>                 { return 0 },
    "bold": ch =>                   { return 0x1D3BF },
    "italic": ch =>                 { return 0x1D3F3 },
    "bold-italic": ch =>            { return 0x1D427 },
    "script": ch =>                 { return script[ch] || 0x1D45B },
    "script-bold": ch =>            { return 0x1D48F },
    "fraktur": ch =>                { return frak[ch] || 0x1D4C3 },
    "fraktur-bold": ch =>           { return 0x1D52B },
    "double-struck": ch =>          { return bbb[ch] || 0x1D4F7 },
    "sans-serif": ch =>             { return 0x1D55F },
    "sans-serif-bold": ch =>        { return 0x1D593 },
    "sans-serif-italic": ch =>      { return 0x1D5C7 },
    "sans-serif-bold-italic": ch => { return 0x1D63C },
    "monospace": ch =>              { return 0x1D62F }
  },
  lowerCaseLatin: { // a-z
    "normal": ch =>                 { return 0 },
    "bold": ch =>                   { return 0x1D3B9 },
    "italic": ch =>                 { return ch === "h" ? 0x20A6 : 0x1D3ED },
    "bold-italic": ch =>            { return 0x1D421 },
    "script": ch =>                 { return script[ch] || 0x1D455 },
    "script-bold": ch =>            { return 0x1D489 },
    "fraktur": ch =>                { return 0x1D4BD },
    "fraktur-bold": ch =>           { return 0x1D525 },
    "double-struck": ch =>          { return 0x1D4F1 },
    "sans-serif": ch =>             { return 0x1D559 },
    "sans-serif-bold": ch =>        { return 0x1D58D },
    "sans-serif-italic": ch =>      { return 0x1D5C1 },
    "sans-serif-bold-italic": ch => { return 0x1D5F5 },
    "monospace": ch =>              { return 0x1D629 }
  },
  upperCaseGreek: { // A-Ω
    "normal": ch =>                 { return 0 },
    "bold": ch =>                   { return 0x1D317 },
    "italic": ch =>                 { return 0x1D351 },
    // \boldsymbol actually returns upright bold for upperCaseGreek
    "bold-italic": ch =>            { return 0x1D317 },
    "script": ch =>                 { return 0 },
    "script-bold": ch =>            { return 0 },
    "fraktur": ch =>                { return 0 },
    "fraktur-bold": ch =>           { return 0 },
    "double-struck": ch =>          { return 0 },
    // Unicode has no code points for regular-weight san-serif Greek. Use bold.
    "sans-serif": ch =>             { return 0x1D3C5 },
    "sans-serif-bold": ch =>        { return 0x1D3C5 },
    "sans-serif-italic": ch =>      { return 0 },
    "sans-serif-bold-italic": ch => { return 0x1D3FF },
    "monospace": ch =>              { return 0 }
  },
  lowerCaseGreek: { // α-ω
    "normal": ch =>                 { return 0 },
    "bold": ch =>                   { return 0x1D311 },
    "italic": ch =>                 { return 0x1D34B },
    "bold-italic": ch =>            { return ch === "\u03d5" ? 0x1D37E : 0x1D385 },
    "script": ch =>                 { return 0 },
    "script-bold": ch =>            { return 0 },
    "fraktur": ch =>                { return 0 },
    "fraktur-bold": ch =>           { return 0 },
    "double-struck": ch =>          { return 0 },
    // Unicode has no code points for regular-weight san-serif Greek. Use bold.
    "sans-serif": ch =>             { return 0x1D3BF },
    "sans-serif-bold": ch =>        { return 0x1D3BF },
    "sans-serif-italic": ch =>      { return 0 },
    "sans-serif-bold-italic": ch => { return 0x1D3F9 },
    "monospace": ch =>              { return 0 }
  },
  varGreek: { // \varGamma, etc
    "normal": ch =>                 { return 0 },
    "bold": ch =>                   { return  bold[ch] || -51 },
    "italic": ch =>                 { return 0 },
    "bold-italic": ch =>            { return boldItalic[ch] || 0x3A },
    "script": ch =>                 { return 0 },
    "script-bold": ch =>            { return 0 },
    "fraktur": ch =>                { return 0 },
    "fraktur-bold": ch =>           { return 0 },
    "double-struck": ch =>          { return 0 },
    "sans-serif": ch =>             { return boldsf[ch] || 0x74 },
    "sans-serif-bold": ch =>        { return boldsf[ch] || 0x74 },
    "sans-serif-italic": ch =>      { return 0 },
    "sans-serif-bold-italic": ch => { return bisf[ch] || 0xAE },
    "monospace": ch =>              { return 0 }
  },
  numeral: { // 0-9
    "normal": ch =>                 { return 0 },
    "bold": ch =>                   { return 0x1D79E },
    "italic": ch =>                 { return 0 },
    "bold-italic": ch =>            { return 0 },
    "script": ch =>                 { return 0 },
    "script-bold": ch =>            { return 0 },
    "fraktur": ch =>                { return 0 },
    "fraktur-bold": ch =>           { return 0 },
    "double-struck": ch =>          { return 0x1D7A8 },
    "sans-serif": ch =>             { return 0x1D7B2 },
    "sans-serif-bold": ch =>        { return 0x1D7BC },
    "sans-serif-italic": ch =>      { return 0 },
    "sans-serif-bold-italic": ch => { return 0 },
    "monospace": ch =>              { return 0x1D7C6 }
  }
});

const variantChar = (ch, variant) => {
  const codePoint = ch.codePointAt(0);
  const block = 0x40 < codePoint && codePoint < 0x5b
    ? "upperCaseLatin"
    : 0x60 < codePoint && codePoint < 0x7b
    ? "lowerCaseLatin"
    : (0x390  < codePoint && codePoint < 0x3AA)
    ? "upperCaseGreek"
    : 0x3B0 < codePoint && codePoint < 0x3CA || ch === "\u03d5"
    ? "lowerCaseGreek"
    : 0x1D6E1 < codePoint && codePoint < 0x1D6FC  || bold[ch]
    ? "varGreek"
    : (0x2F < codePoint && codePoint <  0x3A)
    ? "numeral"
    : "other";
  return block === "other"
    ? ch
    : String.fromCodePoint(codePoint + offset[block][variant](ch))
};

const smallCaps = Object.freeze({
  a: "ᴀ",
  b: "ʙ",
  c: "ᴄ",
  d: "ᴅ",
  e: "ᴇ",
  f: "ꜰ",
  g: "ɢ",
  h: "ʜ",
  i: "ɪ",
  j: "ᴊ",
  k: "ᴋ",
  l: "ʟ",
  m: "ᴍ",
  n: "ɴ",
  o: "ᴏ",
  p: "ᴘ",
  q: "ǫ",
  r: "ʀ",
  s: "s",
  t: "ᴛ",
  u: "ᴜ",
  v: "ᴠ",
  w: "ᴡ",
  x: "x",
  y: "ʏ",
  z: "ᴢ"
});

// "mathord" and "textord" ParseNodes created in Parser.js from symbol Groups in
// src/symbols.js.

const numberRegEx = /^\d(?:[\d,.]*\d)?$/;
const latinRegEx = /[A-Ba-z]/;
const primes = new Set(["\\prime", "\\dprime", "\\trprime", "\\qprime",
  "\\backprime", "\\backdprime", "\\backtrprime"]);

const italicNumber = (text, variant, tag) => {
  const mn = new mathMLTree.MathNode(tag, [text]);
  const wrapper = new mathMLTree.MathNode("mstyle", [mn]);
  wrapper.style["font-style"] = "italic";
  wrapper.style["font-family"] = "Cambria, 'Times New Roman', serif";
  if (variant === "bold-italic") { wrapper.style["font-weight"] = "bold"; }
  return wrapper
};

defineFunctionBuilders({
  type: "mathord",
  mathmlBuilder(group, style) {
    const text = makeText(group.text, group.mode, style);
    const codePoint = text.text.codePointAt(0);
    // Test for upper-case Greek
    const defaultVariant = (0x0390 < codePoint && codePoint < 0x03aa) ? "normal" : "italic";
    const variant = getVariant(group, style) || defaultVariant;
    if (variant === "script") {
      text.text = variantChar(text.text, variant);
      return new mathMLTree.MathNode("mi", [text], [style.font])
    } else if (variant !== "italic") {
      text.text = variantChar(text.text, variant);
    }
    let node = new mathMLTree.MathNode("mi", [text]);
    // TODO: Handle U+1D49C - U+1D4CF per https://www.unicode.org/charts/PDF/U1D400.pdf
    if (variant === "normal") {
      node.setAttribute("mathvariant", "normal");
      if (text.text.length === 1) {
        // A Firefox bug will apply spacing here, but there should be none. Fix it.
        node = new mathMLTree.MathNode("mpadded", [node]);
        node.setAttribute("lspace", "0");
      }
    }
    return node
  }
});

defineFunctionBuilders({
  type: "textord",
  mathmlBuilder(group, style) {
    let ch = group.text;
    const codePoint = ch.codePointAt(0);
    if (style.fontFamily === "textsc") {
      // Convert small latin letters to small caps.
      if (96 < codePoint && codePoint < 123) {
        ch = smallCaps[ch];
      }
    }
    const text = makeText(ch, group.mode, style);
    const variant = getVariant(group, style) || "normal";

    let node;
    if (numberRegEx.test(group.text)) {
      const tag = group.mode === "text" ? "mtext" : "mn";
      if (variant === "italic" || variant === "bold-italic") {
        return italicNumber(text, variant, tag)
      } else {
        if (variant !== "normal") {
          text.text = text.text.split("").map(c => variantChar(c, variant)).join("");
        }
        node = new mathMLTree.MathNode(tag, [text]);
      }
    } else if (group.mode === "text") {
      if (variant !== "normal") {
        text.text = variantChar(text.text, variant);
      }
      node = new mathMLTree.MathNode("mtext", [text]);
    } else if (primes.has(group.text)) {
      node = new mathMLTree.MathNode("mo", [text]);
      // TODO: If/when Chromium uses ssty variant for prime, remove the next line.
      node.classes.push("tml-prime");
    } else {
      const origText = text.text;
      if (variant !== "italic") {
        text.text = variantChar(text.text, variant);
      }
      node = new mathMLTree.MathNode("mi", [text]);
      if (text.text === origText && latinRegEx.test(origText)) {
        node.setAttribute("mathvariant", "italic");
      }
    }
    return node
  }
});

// A map of CSS-based spacing functions to their CSS class.
const cssSpace = {
  "\\nobreak": "nobreak",
  "\\allowbreak": "allowbreak"
};

// A lookup table to determine whether a spacing function/symbol should be
// treated like a regular space character.  If a symbol or command is a key
// in this table, then it should be a regular space character.  Furthermore,
// the associated value may have a `className` specifying an extra CSS class
// to add to the created `span`.
const regularSpace = {
  " ": {},
  "\\ ": {},
  "~": {
    className: "nobreak"
  },
  "\\space": {},
  "\\nobreakspace": {
    className: "nobreak"
  }
};

// ParseNode<"spacing"> created in Parser.js from the "spacing" symbol Groups in
// src/symbols.js.
defineFunctionBuilders({
  type: "spacing",
  mathmlBuilder(group, style) {
    let node;

    if (Object.prototype.hasOwnProperty.call(regularSpace, group.text)) {
      // Firefox does not render a space in a <mtext> </mtext>. So write a no-break space.
      // TODO: If Firefox fixes that bug, uncomment the next line and write ch into the node.
      //const ch = (regularSpace[group.text].className === "nobreak") ? "\u00a0" : " "
      node = new mathMLTree.MathNode("mtext", [new mathMLTree.TextNode("\u00a0")]);
    } else if (Object.prototype.hasOwnProperty.call(cssSpace, group.text)) {
      // MathML 3.0 calls for nobreak to occur in an <mo>, not an <mtext>
      // Ref: https://www.w3.org/Math/draft-spec/mathml.html#chapter3_presm.lbattrs
      node = new mathMLTree.MathNode("mo");
      if (group.text === "\\nobreak") {
        node.setAttribute("linebreak", "nobreak");
      }
    } else {
      throw new ParseError(`Unknown type of space "${group.text}"`)
    }

    return node
  }
});

defineFunctionBuilders({
  type: "tag"
});

// For a \tag, the work usually done in a mathmlBuilder is instead done in buildMathML.js.
// That way, a \tag can be pulled out of the parse tree and wrapped around the outer node.

// Non-mathy text, possibly in a font
const textFontFamilies = {
  "\\text": undefined,
  "\\textrm": "textrm",
  "\\textsf": "textsf",
  "\\texttt": "texttt",
  "\\textnormal": "textrm",
  "\\textsc": "textsc"      // small caps
};

const textFontWeights = {
  "\\textbf": "textbf",
  "\\textmd": "textmd"
};

const textFontShapes = {
  "\\textit": "textit",
  "\\textup": "textup"
};

const styleWithFont = (group, style) => {
  const font = group.font;
  // Checks if the argument is a font family or a font style.
  if (!font) {
    return style;
  } else if (textFontFamilies[font]) {
    return style.withTextFontFamily(textFontFamilies[font]);
  } else if (textFontWeights[font]) {
    return style.withTextFontWeight(textFontWeights[font]);
  } else if (font === "\\emph") {
    return style.fontShape === "textit"
      ? style.withTextFontShape("textup")
      : style.withTextFontShape("textit")
  }
  return style.withTextFontShape(textFontShapes[font])
};

defineFunction({
  type: "text",
  names: [
    // Font families
    "\\text",
    "\\textrm",
    "\\textsf",
    "\\texttt",
    "\\textnormal",
    "\\textsc",
    // Font weights
    "\\textbf",
    "\\textmd",
    // Font Shapes
    "\\textit",
    "\\textup",
    "\\emph"
  ],
  props: {
    numArgs: 1,
    argTypes: ["text"],
    allowedInArgument: true,
    allowedInText: true
  },
  handler({ parser, funcName }, args) {
    const body = args[0];
    return {
      type: "text",
      mode: parser.mode,
      body: ordargument(body),
      font: funcName
    };
  },
  mathmlBuilder(group, style) {
    const newStyle = styleWithFont(group, style);
    const mrow = buildExpressionRow(group.body, newStyle);
    return consolidateText(mrow)
  }
});

// \vcenter:  Vertically center the argument group on the math axis.

defineFunction({
  type: "vcenter",
  names: ["\\vcenter"],
  props: {
    numArgs: 1,
    argTypes: ["original"],
    allowedInText: false
  },
  handler({ parser }, args) {
    return {
      type: "vcenter",
      mode: parser.mode,
      body: args[0]
    };
  },
  mathmlBuilder(group, style) {
    // Use a math table to create vertically centered content.
    const mtd = new mathMLTree.MathNode("mtd", [buildGroup$1(group.body, style)]);
    mtd.style.padding = "0";
    const mtr = new mathMLTree.MathNode("mtr", [mtd]);
    return new mathMLTree.MathNode("mtable", [mtr])
  }
});

defineFunction({
  type: "verb",
  names: ["\\verb"],
  props: {
    numArgs: 0,
    allowedInText: true
  },
  handler(context, args, optArgs) {
    // \verb and \verb* are dealt with directly in Parser.js.
    // If we end up here, it's because of a failure to match the two delimiters
    // in the regex in Lexer.js.  LaTeX raises the following error when \verb is
    // terminated by end of line (or file).
    throw new ParseError("\\verb ended by end of line instead of matching delimiter");
  },
  mathmlBuilder(group, style) {
    const text = new mathMLTree.TextNode(makeVerb(group));
    const node = new mathMLTree.MathNode("mtext", [text]);
    node.setAttribute("mathvariant", "monospace");
    return node;
  }
});

/**
 * Converts verb group into body string.
 *
 * \verb* replaces each space with an open box \u2423
 * \verb replaces each space with a no-break space \xA0
 */
const makeVerb = (group) => group.body.replace(/ /g, group.star ? "\u2423" : "\xA0");

/** Include this to ensure that all functions are defined. */

const functions = _functions;

/**
 * The Lexer class handles tokenizing the input in various ways. Since our
 * parser expects us to be able to backtrack, the lexer allows lexing from any
 * given starting point.
 *
 * Its main exposed function is the `lex` function, which takes a position to
 * lex from and a type of token to lex. It defers to the appropriate `_innerLex`
 * function.
 *
 * The various `_innerLex` functions perform the actual lexing of different
 * kinds.
 */


/* The following tokenRegex
 * - matches typical whitespace (but not NBSP etc.) using its first two groups
 * - does not match any control character \x00-\x1f except whitespace
 * - does not match a bare backslash
 * - matches any ASCII character except those just mentioned
 * - does not match the BMP private use area \uE000-\uF8FF
 * - does not match bare surrogate code units
 * - matches any BMP character except for those just described
 * - matches any valid Unicode surrogate pair
 * - mathches numerals
 * - matches a backslash followed by one or more whitespace characters
 * - matches a backslash followed by one or more letters then whitespace
 * - matches a backslash followed by any BMP character
 * Capturing groups:
 *   [1] regular whitespace
 *   [2] backslash followed by whitespace
 *   [3] anything else, which may include:
 *     [4] left character of \verb*
 *     [5] left character of \verb
 *     [6] backslash followed by word, excluding any trailing whitespace
 * Just because the Lexer matches something doesn't mean it's valid input:
 * If there is no matching function or symbol definition, the Parser will
 * still reject the input.
 */
const spaceRegexString = "[ \r\n\t]";
const controlWordRegexString = "\\\\[a-zA-Z@]+";
const controlSymbolRegexString = "\\\\[^\uD800-\uDFFF]";
const controlWordWhitespaceRegexString = `(${controlWordRegexString})${spaceRegexString}*`;
const controlSpaceRegexString = "\\\\(\n|[ \r\t]+\n?)[ \r\t]*";
const combiningDiacriticalMarkString = "[\u0300-\u036f]";
const combiningDiacriticalMarksEndRegex = new RegExp(`${combiningDiacriticalMarkString}+$`);
const tokenRegexString =
  `(${spaceRegexString}+)|` + // whitespace
  `${controlSpaceRegexString}|` +  // whitespace
  "([!-\\[\\]-\u2027\u202A-\uD7FF\uF900-\uFFFF]" + // single codepoint
  `${combiningDiacriticalMarkString}*` + // ...plus accents
  "|[\uD800-\uDBFF][\uDC00-\uDFFF]" + // surrogate pair
  `${combiningDiacriticalMarkString}*` + // ...plus accents
  "|\\\\verb\\*([^]).*?\\4" + // \verb*
  "|\\\\verb([^*a-zA-Z]).*?\\5" + // \verb unstarred
  `|${controlWordWhitespaceRegexString}` + // \macroName + spaces
  `|${controlSymbolRegexString})`; // \\, \', etc.

/** Main Lexer class */
class Lexer {
  constructor(input, settings) {
    // Separate accents from characters
    this.input = input;
    this.settings = settings;
    this.tokenRegex = new RegExp(tokenRegexString, 'g');
    // Category codes. The lexer only supports comment characters (14) for now.
    // MacroExpander additionally distinguishes active (13).
    this.catcodes = {
      "%": 14, // comment character
      "~": 13  // active character
    };
  }

  setCatcode(char, code) {
    this.catcodes[char] = code;
  }

  /**
   * This function lexes a single token.
   */
  lex() {
    const input = this.input;
    const pos = this.tokenRegex.lastIndex;
    if (pos === input.length) {
      return new Token("EOF", new SourceLocation(this, pos, pos));
    }
    const match = this.tokenRegex.exec(input);
    if (match === null || match.index !== pos) {
      throw new ParseError(
        `Unexpected character: '${input[pos]}'`,
        new Token(input[pos], new SourceLocation(this, pos, pos + 1))
      );
    }
    const text = match[6] || match[3] || (match[2] ? "\\ " : " ");

    if (this.catcodes[text] === 14) {
      // comment character
      const nlIndex = input.indexOf("\n", this.tokenRegex.lastIndex);
      if (nlIndex === -1) {
        this.tokenRegex.lastIndex = input.length; // EOF
        if (this.settings.strict) {
          throw new ParseError("% comment has no terminating newline; LaTeX would " +
              "fail because of commenting the end of math mode")
        }
      } else {
        this.tokenRegex.lastIndex = nlIndex + 1;
      }
      return this.lex();
    }

    return new Token(text, new SourceLocation(this, pos, this.tokenRegex.lastIndex));
  }
}

/**
 * A `Namespace` refers to a space of nameable things like macros or lengths,
 * which can be `set` either globally or local to a nested group, using an
 * undo stack similar to how TeX implements this functionality.
 * Performance-wise, `get` and local `set` take constant time, while global
 * `set` takes time proportional to the depth of group nesting.
 */


class Namespace {
  /**
   * Both arguments are optional.  The first argument is an object of
   * built-in mappings which never change.  The second argument is an object
   * of initial (global-level) mappings, which will constantly change
   * according to any global/top-level `set`s done.
   */
  constructor(builtins = {}, globalMacros = {}) {
    this.current = globalMacros;
    this.builtins = builtins;
    this.undefStack = [];
  }

  /**
   * Start a new nested group, affecting future local `set`s.
   */
  beginGroup() {
    this.undefStack.push({});
  }

  /**
   * End current nested group, restoring values before the group began.
   */
  endGroup() {
    if (this.undefStack.length === 0) {
      throw new ParseError(
        "Unbalanced namespace destruction: attempt " +
          "to pop global namespace; please report this as a bug"
      );
    }
    const undefs = this.undefStack.pop();
    for (const undef in undefs) {
      if (Object.prototype.hasOwnProperty.call(undefs, undef )) {
        if (undefs[undef] === undefined) {
          delete this.current[undef];
        } else {
          this.current[undef] = undefs[undef];
        }
      }
    }
  }

  /**
   * Detect whether `name` has a definition.  Equivalent to
   * `get(name) != null`.
   */
  has(name) {
    return Object.prototype.hasOwnProperty.call(this.current, name ) ||
    Object.prototype.hasOwnProperty.call(this.builtins, name );
  }

  /**
   * Get the current value of a name, or `undefined` if there is no value.
   *
   * Note: Do not use `if (namespace.get(...))` to detect whether a macro
   * is defined, as the definition may be the empty string which evaluates
   * to `false` in JavaScript.  Use `if (namespace.get(...) != null)` or
   * `if (namespace.has(...))`.
   */
  get(name) {
    if (Object.prototype.hasOwnProperty.call(this.current, name )) {
      return this.current[name];
    } else {
      return this.builtins[name];
    }
  }

  /**
   * Set the current value of a name, and optionally set it globally too.
   * Local set() sets the current value and (when appropriate) adds an undo
   * operation to the undo stack.  Global set() may change the undo
   * operation at every level, so takes time linear in their number.
   */
  set(name, value, global = false) {
    if (global) {
      // Global set is equivalent to setting in all groups.  Simulate this
      // by destroying any undos currently scheduled for this name,
      // and adding an undo with the *new* value (in case it later gets
      // locally reset within this environment).
      for (let i = 0; i < this.undefStack.length; i++) {
        delete this.undefStack[i][name];
      }
      if (this.undefStack.length > 0) {
        this.undefStack[this.undefStack.length - 1][name] = value;
      }
    } else {
      // Undo this set at end of this group (possibly to `undefined`),
      // unless an undo is already in place, in which case that older
      // value is the correct one.
      const top = this.undefStack[this.undefStack.length - 1];
      if (top && !Object.prototype.hasOwnProperty.call(top, name )) {
        top[name] = this.current[name];
      }
    }
    this.current[name] = value;
  }
}

/**
 * This file contains the “gullet” where macros are expanded
 * until only non-macro tokens remain.
 */


// List of commands that act like macros but aren't defined as a macro,
// function, or symbol.  Used in `isDefined`.
const implicitCommands = {
  "^": true, // Parser.js
  _: true, // Parser.js
  "\\limits": true, // Parser.js
  "\\nolimits": true // Parser.js
};

class MacroExpander {
  constructor(input, settings, mode) {
    this.settings = settings;
    this.expansionCount = 0;
    this.feed(input);
    // Make new global namespace
    this.macros = new Namespace(macros, settings.macros);
    this.mode = mode;
    this.stack = []; // contains tokens in REVERSE order
  }

  /**
   * Feed a new input string to the same MacroExpander
   * (with existing macros etc.).
   */
  feed(input) {
    this.lexer = new Lexer(input, this.settings);
  }

  /**
   * Switches between "text" and "math" modes.
   */
  switchMode(newMode) {
    this.mode = newMode;
  }

  /**
   * Start a new group nesting within all namespaces.
   */
  beginGroup() {
    this.macros.beginGroup();
  }

  /**
   * End current group nesting within all namespaces.
   */
  endGroup() {
    this.macros.endGroup();
  }

  /**
   * Returns the topmost token on the stack, without expanding it.
   * Similar in behavior to TeX's `\futurelet`.
   */
  future() {
    if (this.stack.length === 0) {
      this.pushToken(this.lexer.lex());
    }
    return this.stack[this.stack.length - 1]
  }

  /**
   * Remove and return the next unexpanded token.
   */
  popToken() {
    this.future(); // ensure non-empty stack
    return this.stack.pop();
  }

  /**
   * Add a given token to the token stack.  In particular, this get be used
   * to put back a token returned from one of the other methods.
   */
  pushToken(token) {
    this.stack.push(token);
  }

  /**
   * Append an array of tokens to the token stack.
   */
  pushTokens(tokens) {
    this.stack.push(...tokens);
  }

  /**
   * Find an macro argument without expanding tokens and append the array of
   * tokens to the token stack. Uses Token as a container for the result.
   */
  scanArgument(isOptional) {
    let start;
    let end;
    let tokens;
    if (isOptional) {
      this.consumeSpaces(); // \@ifnextchar gobbles any space following it
      if (this.future().text !== "[") {
        return null;
      }
      start = this.popToken(); // don't include [ in tokens
      ({ tokens, end } = this.consumeArg(["]"]));
    } else {
      ({ tokens, start, end } = this.consumeArg());
    }

    // indicate the end of an argument
    this.pushToken(new Token("EOF", end.loc));

    this.pushTokens(tokens);
    return start.range(end, "");
  }

  /**
   * Consume all following space tokens, without expansion.
   */
  consumeSpaces() {
    for (;;) {
      const token = this.future();
      if (token.text === " ") {
        this.stack.pop();
      } else {
        break;
      }
    }
  }

  /**
   * Consume an argument from the token stream, and return the resulting array
   * of tokens and start/end token.
   */
  consumeArg(delims) {
    // The argument for a delimited parameter is the shortest (possibly
    // empty) sequence of tokens with properly nested {...} groups that is
    // followed ... by this particular list of non-parameter tokens.
    // The argument for an undelimited parameter is the next nonblank
    // token, unless that token is ‘{’, when the argument will be the
    // entire {...} group that follows.
    const tokens = [];
    const isDelimited = delims && delims.length > 0;
    if (!isDelimited) {
      // Ignore spaces between arguments.  As the TeXbook says:
      // "After you have said ‘\def\row#1#2{...}’, you are allowed to
      //  put spaces between the arguments (e.g., ‘\row x n’), because
      //  TeX doesn’t use single spaces as undelimited arguments."
      this.consumeSpaces();
    }
    const start = this.future();
    let tok;
    let depth = 0;
    let match = 0;
    do {
      tok = this.popToken();
      tokens.push(tok);
      if (tok.text === "{") {
        ++depth;
      } else if (tok.text === "}") {
        --depth;
        if (depth === -1) {
          throw new ParseError("Extra }", tok);
        }
      } else if (tok.text === "EOF") {
        throw new ParseError(
          "Unexpected end of input in a macro argument" +
            ", expected '" +
            (delims && isDelimited ? delims[match] : "}") +
            "'",
          tok
        );
      }
      if (delims && isDelimited) {
        if ((depth === 0 || (depth === 1 && delims[match] === "{")) && tok.text === delims[match]) {
          ++match;
          if (match === delims.length) {
            // don't include delims in tokens
            tokens.splice(-match, match);
            break;
          }
        } else {
          match = 0;
        }
      }
    } while (depth !== 0 || isDelimited);
    // If the argument found ... has the form ‘{<nested tokens>}’,
    // ... the outermost braces enclosing the argument are removed
    if (start.text === "{" && tokens[tokens.length - 1].text === "}") {
      tokens.pop();
      tokens.shift();
    }
    tokens.reverse(); // to fit in with stack order
    return { tokens, start, end: tok };
  }

  /**
   * Consume the specified number of (delimited) arguments from the token
   * stream and return the resulting array of arguments.
   */
  consumeArgs(numArgs, delimiters) {
    if (delimiters) {
      if (delimiters.length !== numArgs + 1) {
        throw new ParseError("The length of delimiters doesn't match the number of args!");
      }
      const delims = delimiters[0];
      for (let i = 0; i < delims.length; i++) {
        const tok = this.popToken();
        if (delims[i] !== tok.text) {
          throw new ParseError("Use of the macro doesn't match its definition", tok);
        }
      }
    }

    const args = [];
    for (let i = 0; i < numArgs; i++) {
      args.push(this.consumeArg(delimiters && delimiters[i + 1]).tokens);
    }
    return args;
  }

  /**
   * Expand the next token only once if possible.
   *
   * If the token is expanded, the resulting tokens will be pushed onto
   * the stack in reverse order, and the number of such tokens will be
   * returned.  This number might be zero or positive.
   *
   * If not, the return value is `false`, and the next token remains at the
   * top of the stack.
   *
   * In either case, the next token will be on the top of the stack,
   * or the stack will be empty (in case of empty expansion
   * and no other tokens).
   *
   * Used to implement `expandAfterFuture` and `expandNextToken`.
   *
   * If expandableOnly, only expandable tokens are expanded and
   * an undefined control sequence results in an error.
   */
  expandOnce(expandableOnly) {
    const topToken = this.popToken();
    const name = topToken.text;
    const expansion = !topToken.noexpand ? this._getExpansion(name) : null;
    if (expansion == null || (expandableOnly && expansion.unexpandable)) {
      if (expandableOnly && expansion == null && name[0] === "\\" && !this.isDefined(name)) {
        throw new ParseError("Undefined control sequence: " + name);
      }
      this.pushToken(topToken);
      return false;
    }
    this.expansionCount++;
    if (this.expansionCount > this.settings.maxExpand) {
      throw new ParseError(
        "Too many expansions: infinite loop or " + "need to increase maxExpand setting"
      );
    }
    let tokens = expansion.tokens;
    const args = this.consumeArgs(expansion.numArgs, expansion.delimiters);
    if (expansion.numArgs) {
      // paste arguments in place of the placeholders
      tokens = tokens.slice(); // make a shallow copy
      for (let i = tokens.length - 1; i >= 0; --i) {
        let tok = tokens[i];
        if (tok.text === "#") {
          if (i === 0) {
            throw new ParseError("Incomplete placeholder at end of macro body", tok);
          }
          tok = tokens[--i]; // next token on stack
          if (tok.text === "#") {
            // ## → #
            tokens.splice(i + 1, 1); // drop first #
          } else if (/^[1-9]$/.test(tok.text)) {
            // replace the placeholder with the indicated argument
            tokens.splice(i, 2, ...args[+tok.text - 1]);
          } else {
            throw new ParseError("Not a valid argument number", tok);
          }
        }
      }
    }
    // Concatenate expansion onto top of stack.
    this.pushTokens(tokens);
    return tokens.length;
  }

  /**
   * Expand the next token only once (if possible), and return the resulting
   * top token on the stack (without removing anything from the stack).
   * Similar in behavior to TeX's `\expandafter\futurelet`.
   * Equivalent to expandOnce() followed by future().
   */
  expandAfterFuture() {
    this.expandOnce();
    return this.future();
  }

  /**
   * Recursively expand first token, then return first non-expandable token.
   */
  expandNextToken() {
    for (;;) {
      if (this.expandOnce() === false) { // fully expanded
        const token = this.stack.pop();
        // The token after \noexpand is interpreted as if its meaning were ‘\relax’
        if (token.treatAsRelax) {
          token.text = "\\relax";
        }
        return token
      }
    }

    // This pathway is impossible.
    throw new Error(); // eslint-disable-line no-unreachable
  }

  /**
   * Fully expand the given macro name and return the resulting list of
   * tokens, or return `undefined` if no such macro is defined.
   */
  expandMacro(name) {
    return this.macros.has(name) ? this.expandTokens([new Token(name)]) : undefined;
  }

  /**
   * Fully expand the given token stream and return the resulting list of
   * tokens.  Note that the input tokens are in reverse order, but the
   * output tokens are in forward order.
   */
  expandTokens(tokens) {
    const output = [];
    const oldStackLength = this.stack.length;
    this.pushTokens(tokens);
    while (this.stack.length > oldStackLength) {
      // Expand only expandable tokens
      if (this.expandOnce(true) === false) {  // fully expanded
        const token = this.stack.pop();
        if (token.treatAsRelax) {
          // the expansion of \noexpand is the token itself
          token.noexpand = false;
          token.treatAsRelax = false;
        }
        output.push(token);
      }
    }
    return output;
  }

  /**
   * Fully expand the given macro name and return the result as a string,
   * or return `undefined` if no such macro is defined.
   */
  expandMacroAsText(name) {
    const tokens = this.expandMacro(name);
    if (tokens) {
      return tokens.map((token) => token.text).join("");
    } else {
      return tokens;
    }
  }

  /**
   * Returns the expanded macro as a reversed array of tokens and a macro
   * argument count.  Or returns `null` if no such macro.
   */
  _getExpansion(name) {
    const definition = this.macros.get(name);
    if (definition == null) {
      // mainly checking for undefined here
      return definition;
    }
    // If a single character has an associated catcode other than 13
    // (active character), then don't expand it.
    if (name.length === 1) {
      const catcode = this.lexer.catcodes[name];
      if (catcode != null && catcode !== 13) {
        return
      }
    }
    const expansion = typeof definition === "function" ? definition(this) : definition;
    if (typeof expansion === "string") {
      let numArgs = 0;
      if (expansion.indexOf("#") !== -1) {
        const stripped = expansion.replace(/##/g, "");
        while (stripped.indexOf("#" + (numArgs + 1)) !== -1) {
          ++numArgs;
        }
      }
      const bodyLexer = new Lexer(expansion, this.settings);
      const tokens = [];
      let tok = bodyLexer.lex();
      while (tok.text !== "EOF") {
        tokens.push(tok);
        tok = bodyLexer.lex();
      }
      tokens.reverse(); // to fit in with stack using push and pop
      const expanded = { tokens, numArgs };
      return expanded;
    }

    return expansion;
  }

  /**
   * Determine whether a command is currently "defined" (has some
   * functionality), meaning that it's a macro (in the current group),
   * a function, a symbol, or one of the special commands listed in
   * `implicitCommands`.
   */
  isDefined(name) {
    return (
      this.macros.has(name) ||
      Object.prototype.hasOwnProperty.call(functions, name ) ||
      Object.prototype.hasOwnProperty.call(symbols.math, name ) ||
      Object.prototype.hasOwnProperty.call(symbols.text, name ) ||
      Object.prototype.hasOwnProperty.call(implicitCommands, name )
    );
  }

  /**
   * Determine whether a command is expandable.
   */
  isExpandable(name) {
    const macro = this.macros.get(name);
    return macro != null
      ? typeof macro === "string" || typeof macro === "function" || !macro.unexpandable
      : Object.prototype.hasOwnProperty.call(functions, name ) && !functions[name].primitive;
  }
}

// Helpers for Parser.js handling of Unicode (sub|super)script characters.

const unicodeSubRegEx = /^[₊₋₌₍₎₀₁₂₃₄₅₆₇₈₉ₐₑₕᵢⱼₖₗₘₙₒₚᵣₛₜᵤᵥₓᵦᵧᵨᵩᵪ]/;

const uSubsAndSups = Object.freeze({
  '₊': '+',
  '₋': '-',
  '₌': '=',
  '₍': '(',
  '₎': ')',
  '₀': '0',
  '₁': '1',
  '₂': '2',
  '₃': '3',
  '₄': '4',
  '₅': '5',
  '₆': '6',
  '₇': '7',
  '₈': '8',
  '₉': '9',
  '\u2090': 'a',
  '\u2091': 'e',
  '\u2095': 'h',
  '\u1D62': 'i',
  '\u2C7C': 'j',
  '\u2096': 'k',
  '\u2097': 'l',
  '\u2098': 'm',
  '\u2099': 'n',
  '\u2092': 'o',
  '\u209A': 'p',
  '\u1D63': 'r',
  '\u209B': 's',
  '\u209C': 't',
  '\u1D64': 'u',
  '\u1D65': 'v',
  '\u2093': 'x',
  '\u1D66': 'β',
  '\u1D67': 'γ',
  '\u1D68': 'ρ',
  '\u1D69': '\u03d5',
  '\u1D6A': 'χ',
  '⁺': '+',
  '⁻': '-',
  '⁼': '=',
  '⁽': '(',
  '⁾': ')',
  '⁰': '0',
  '¹': '1',
  '²': '2',
  '³': '3',
  '⁴': '4',
  '⁵': '5',
  '⁶': '6',
  '⁷': '7',
  '⁸': '8',
  '⁹': '9',
  '\u1D2C': 'A',
  '\u1D2E': 'B',
  '\u1D30': 'D',
  '\u1D31': 'E',
  '\u1D33': 'G',
  '\u1D34': 'H',
  '\u1D35': 'I',
  '\u1D36': 'J',
  '\u1D37': 'K',
  '\u1D38': 'L',
  '\u1D39': 'M',
  '\u1D3A': 'N',
  '\u1D3C': 'O',
  '\u1D3E': 'P',
  '\u1D3F': 'R',
  '\u1D40': 'T',
  '\u1D41': 'U',
  '\u2C7D': 'V',
  '\u1D42': 'W',
  '\u1D43': 'a',
  '\u1D47': 'b',
  '\u1D9C': 'c',
  '\u1D48': 'd',
  '\u1D49': 'e',
  '\u1DA0': 'f',
  '\u1D4D': 'g',
  '\u02B0': 'h',
  '\u2071': 'i',
  '\u02B2': 'j',
  '\u1D4F': 'k',
  '\u02E1': 'l',
  '\u1D50': 'm',
  '\u207F': 'n',
  '\u1D52': 'o',
  '\u1D56': 'p',
  '\u02B3': 'r',
  '\u02E2': 's',
  '\u1D57': 't',
  '\u1D58': 'u',
  '\u1D5B': 'v',
  '\u02B7': 'w',
  '\u02E3': 'x',
  '\u02B8': 'y',
  '\u1DBB': 'z',
  '\u1D5D': 'β',
  '\u1D5E': 'γ',
  '\u1D5F': 'δ',
  '\u1D60': '\u03d5',
  '\u1D61': 'χ',
  '\u1DBF': 'θ'
});

// Used for Unicode input of calligraphic and script letters
const asciiFromScript = Object.freeze({
  "\ud835\udc9c": "A",
  "\u212c": "B",
  "\ud835\udc9e": "C",
  "\ud835\udc9f": "D",
  "\u2130": "E",
  "\u2131": "F",
  "\ud835\udca2": "G",
  "\u210B": "H",
  "\u2110": "I",
  "\ud835\udca5": "J",
  "\ud835\udca6": "K",
  "\u2112": "L",
  "\u2133": "M",
  "\ud835\udca9": "N",
  "\ud835\udcaa": "O",
  "\ud835\udcab": "P",
  "\ud835\udcac": "Q",
  "\u211B": "R",
  "\ud835\udcae": "S",
  "\ud835\udcaf": "T",
  "\ud835\udcb0": "U",
  "\ud835\udcb1": "V",
  "\ud835\udcb2": "W",
  "\ud835\udcb3": "X",
  "\ud835\udcb4": "Y",
  "\ud835\udcb5": "Z"
});

// Mapping of Unicode accent characters to their LaTeX equivalent in text and
// math mode (when they exist).
var unicodeAccents = {
  "\u0301": { text: "\\'", math: "\\acute" },
  "\u0300": { text: "\\`", math: "\\grave" },
  "\u0308": { text: '\\"', math: "\\ddot" },
  "\u0303": { text: "\\~", math: "\\tilde" },
  "\u0304": { text: "\\=", math: "\\bar" },
  "\u0306": { text: "\\u", math: "\\breve" },
  "\u030c": { text: "\\v", math: "\\check" },
  "\u0302": { text: "\\^", math: "\\hat" },
  "\u0307": { text: "\\.", math: "\\dot" },
  "\u030a": { text: "\\r", math: "\\mathring" },
  "\u030b": { text: "\\H" },
  '\u0327': { text: '\\c' }
};

var unicodeSymbols = {
  "á": "á",
  "à": "à",
  "ä": "ä",
  "ǟ": "ǟ",
  "ã": "ã",
  "ā": "ā",
  "ă": "ă",
  "ắ": "ắ",
  "ằ": "ằ",
  "ẵ": "ẵ",
  "ǎ": "ǎ",
  "â": "â",
  "ấ": "ấ",
  "ầ": "ầ",
  "ẫ": "ẫ",
  "ȧ": "ȧ",
  "ǡ": "ǡ",
  "å": "å",
  "ǻ": "ǻ",
  "ḃ": "ḃ",
  "ć": "ć",
  "č": "č",
  "ĉ": "ĉ",
  "ċ": "ċ",
  "ď": "ď",
  "ḋ": "ḋ",
  "é": "é",
  "è": "è",
  "ë": "ë",
  "ẽ": "ẽ",
  "ē": "ē",
  "ḗ": "ḗ",
  "ḕ": "ḕ",
  "ĕ": "ĕ",
  "ě": "ě",
  "ê": "ê",
  "ế": "ế",
  "ề": "ề",
  "ễ": "ễ",
  "ė": "ė",
  "ḟ": "ḟ",
  "ǵ": "ǵ",
  "ḡ": "ḡ",
  "ğ": "ğ",
  "ǧ": "ǧ",
  "ĝ": "ĝ",
  "ġ": "ġ",
  "ḧ": "ḧ",
  "ȟ": "ȟ",
  "ĥ": "ĥ",
  "ḣ": "ḣ",
  "í": "í",
  "ì": "ì",
  "ï": "ï",
  "ḯ": "ḯ",
  "ĩ": "ĩ",
  "ī": "ī",
  "ĭ": "ĭ",
  "ǐ": "ǐ",
  "î": "î",
  "ǰ": "ǰ",
  "ĵ": "ĵ",
  "ḱ": "ḱ",
  "ǩ": "ǩ",
  "ĺ": "ĺ",
  "ľ": "ľ",
  "ḿ": "ḿ",
  "ṁ": "ṁ",
  "ń": "ń",
  "ǹ": "ǹ",
  "ñ": "ñ",
  "ň": "ň",
  "ṅ": "ṅ",
  "ó": "ó",
  "ò": "ò",
  "ö": "ö",
  "ȫ": "ȫ",
  "õ": "õ",
  "ṍ": "ṍ",
  "ṏ": "ṏ",
  "ȭ": "ȭ",
  "ō": "ō",
  "ṓ": "ṓ",
  "ṑ": "ṑ",
  "ŏ": "ŏ",
  "ǒ": "ǒ",
  "ô": "ô",
  "ố": "ố",
  "ồ": "ồ",
  "ỗ": "ỗ",
  "ȯ": "ȯ",
  "ȱ": "ȱ",
  "ő": "ő",
  "ṕ": "ṕ",
  "ṗ": "ṗ",
  "ŕ": "ŕ",
  "ř": "ř",
  "ṙ": "ṙ",
  "ś": "ś",
  "ṥ": "ṥ",
  "š": "š",
  "ṧ": "ṧ",
  "ŝ": "ŝ",
  "ṡ": "ṡ",
  "ẗ": "ẗ",
  "ť": "ť",
  "ṫ": "ṫ",
  "ú": "ú",
  "ù": "ù",
  "ü": "ü",
  "ǘ": "ǘ",
  "ǜ": "ǜ",
  "ǖ": "ǖ",
  "ǚ": "ǚ",
  "ũ": "ũ",
  "ṹ": "ṹ",
  "ū": "ū",
  "ṻ": "ṻ",
  "ŭ": "ŭ",
  "ǔ": "ǔ",
  "û": "û",
  "ů": "ů",
  "ű": "ű",
  "ṽ": "ṽ",
  "ẃ": "ẃ",
  "ẁ": "ẁ",
  "ẅ": "ẅ",
  "ŵ": "ŵ",
  "ẇ": "ẇ",
  "ẘ": "ẘ",
  "ẍ": "ẍ",
  "ẋ": "ẋ",
  "ý": "ý",
  "ỳ": "ỳ",
  "ÿ": "ÿ",
  "ỹ": "ỹ",
  "ȳ": "ȳ",
  "ŷ": "ŷ",
  "ẏ": "ẏ",
  "ẙ": "ẙ",
  "ź": "ź",
  "ž": "ž",
  "ẑ": "ẑ",
  "ż": "ż",
  "Á": "Á",
  "À": "À",
  "Ä": "Ä",
  "Ǟ": "Ǟ",
  "Ã": "Ã",
  "Ā": "Ā",
  "Ă": "Ă",
  "Ắ": "Ắ",
  "Ằ": "Ằ",
  "Ẵ": "Ẵ",
  "Ǎ": "Ǎ",
  "Â": "Â",
  "Ấ": "Ấ",
  "Ầ": "Ầ",
  "Ẫ": "Ẫ",
  "Ȧ": "Ȧ",
  "Ǡ": "Ǡ",
  "Å": "Å",
  "Ǻ": "Ǻ",
  "Ḃ": "Ḃ",
  "Ć": "Ć",
  "Č": "Č",
  "Ĉ": "Ĉ",
  "Ċ": "Ċ",
  "Ď": "Ď",
  "Ḋ": "Ḋ",
  "É": "É",
  "È": "È",
  "Ë": "Ë",
  "Ẽ": "Ẽ",
  "Ē": "Ē",
  "Ḗ": "Ḗ",
  "Ḕ": "Ḕ",
  "Ĕ": "Ĕ",
  "Ě": "Ě",
  "Ê": "Ê",
  "Ế": "Ế",
  "Ề": "Ề",
  "Ễ": "Ễ",
  "Ė": "Ė",
  "Ḟ": "Ḟ",
  "Ǵ": "Ǵ",
  "Ḡ": "Ḡ",
  "Ğ": "Ğ",
  "Ǧ": "Ǧ",
  "Ĝ": "Ĝ",
  "Ġ": "Ġ",
  "Ḧ": "Ḧ",
  "Ȟ": "Ȟ",
  "Ĥ": "Ĥ",
  "Ḣ": "Ḣ",
  "Í": "Í",
  "Ì": "Ì",
  "Ï": "Ï",
  "Ḯ": "Ḯ",
  "Ĩ": "Ĩ",
  "Ī": "Ī",
  "Ĭ": "Ĭ",
  "Ǐ": "Ǐ",
  "Î": "Î",
  "İ": "İ",
  "Ĵ": "Ĵ",
  "Ḱ": "Ḱ",
  "Ǩ": "Ǩ",
  "Ĺ": "Ĺ",
  "Ľ": "Ľ",
  "Ḿ": "Ḿ",
  "Ṁ": "Ṁ",
  "Ń": "Ń",
  "Ǹ": "Ǹ",
  "Ñ": "Ñ",
  "Ň": "Ň",
  "Ṅ": "Ṅ",
  "Ó": "Ó",
  "Ò": "Ò",
  "Ö": "Ö",
  "Ȫ": "Ȫ",
  "Õ": "Õ",
  "Ṍ": "Ṍ",
  "Ṏ": "Ṏ",
  "Ȭ": "Ȭ",
  "Ō": "Ō",
  "Ṓ": "Ṓ",
  "Ṑ": "Ṑ",
  "Ŏ": "Ŏ",
  "Ǒ": "Ǒ",
  "Ô": "Ô",
  "Ố": "Ố",
  "Ồ": "Ồ",
  "Ỗ": "Ỗ",
  "Ȯ": "Ȯ",
  "Ȱ": "Ȱ",
  "Ő": "Ő",
  "Ṕ": "Ṕ",
  "Ṗ": "Ṗ",
  "Ŕ": "Ŕ",
  "Ř": "Ř",
  "Ṙ": "Ṙ",
  "Ś": "Ś",
  "Ṥ": "Ṥ",
  "Š": "Š",
  "Ṧ": "Ṧ",
  "Ŝ": "Ŝ",
  "Ṡ": "Ṡ",
  "Ť": "Ť",
  "Ṫ": "Ṫ",
  "Ú": "Ú",
  "Ù": "Ù",
  "Ü": "Ü",
  "Ǘ": "Ǘ",
  "Ǜ": "Ǜ",
  "Ǖ": "Ǖ",
  "Ǚ": "Ǚ",
  "Ũ": "Ũ",
  "Ṹ": "Ṹ",
  "Ū": "Ū",
  "Ṻ": "Ṻ",
  "Ŭ": "Ŭ",
  "Ǔ": "Ǔ",
  "Û": "Û",
  "Ů": "Ů",
  "Ű": "Ű",
  "Ṽ": "Ṽ",
  "Ẃ": "Ẃ",
  "Ẁ": "Ẁ",
  "Ẅ": "Ẅ",
  "Ŵ": "Ŵ",
  "Ẇ": "Ẇ",
  "Ẍ": "Ẍ",
  "Ẋ": "Ẋ",
  "Ý": "Ý",
  "Ỳ": "Ỳ",
  "Ÿ": "Ÿ",
  "Ỹ": "Ỹ",
  "Ȳ": "Ȳ",
  "Ŷ": "Ŷ",
  "Ẏ": "Ẏ",
  "Ź": "Ź",
  "Ž": "Ž",
  "Ẑ": "Ẑ",
  "Ż": "Ż",
  "ά": "ά",
  "ὰ": "ὰ",
  "ᾱ": "ᾱ",
  "ᾰ": "ᾰ",
  "έ": "έ",
  "ὲ": "ὲ",
  "ή": "ή",
  "ὴ": "ὴ",
  "ί": "ί",
  "ὶ": "ὶ",
  "ϊ": "ϊ",
  "ΐ": "ΐ",
  "ῒ": "ῒ",
  "ῑ": "ῑ",
  "ῐ": "ῐ",
  "ό": "ό",
  "ὸ": "ὸ",
  "ύ": "ύ",
  "ὺ": "ὺ",
  "ϋ": "ϋ",
  "ΰ": "ΰ",
  "ῢ": "ῢ",
  "ῡ": "ῡ",
  "ῠ": "ῠ",
  "ώ": "ώ",
  "ὼ": "ὼ",
  "Ύ": "Ύ",
  "Ὺ": "Ὺ",
  "Ϋ": "Ϋ",
  "Ῡ": "Ῡ",
  "Ῠ": "Ῠ",
  "Ώ": "Ώ",
  "Ὼ": "Ὼ"
};

/* eslint no-constant-condition:0 */

const binLeftCancellers = ["bin", "op", "open", "punct", "rel"];
const sizeRegEx = /([-+]?) *(\d+(?:\.\d*)?|\.\d+) *([a-z]{2})/;
const textRegEx = /^ *\\text/;

/**
 * This file contains the parser used to parse out a TeX expression from the
 * input. Since TeX isn't context-free, standard parsers don't work particularly
 * well.
 *
 * The strategy of this parser is as such:
 *
 * The main functions (the `.parse...` ones) take a position in the current
 * parse string to parse tokens from. The lexer (found in Lexer.js, stored at
 * this.gullet.lexer) also supports pulling out tokens at arbitrary places. When
 * individual tokens are needed at a position, the lexer is called to pull out a
 * token, which is then used.
 *
 * The parser has a property called "mode" indicating the mode that
 * the parser is currently in. Currently it has to be one of "math" or
 * "text", which denotes whether the current environment is a math-y
 * one or a text-y one (e.g. inside \text). Currently, this serves to
 * limit the functions which can be used in text mode.
 *
 * The main functions then return an object which contains the useful data that
 * was parsed at its given point, and a new position at the end of the parsed
 * data. The main functions can call each other and continue the parsing by
 * using the returned position as a new starting point.
 *
 * There are also extra `.handle...` functions, which pull out some reused
 * functionality into self-contained functions.
 *
 * The functions return ParseNodes.
 */

class Parser {
  constructor(input, settings, isPreamble = false) {
    // Start in math mode
    this.mode = "math";
    // Create a new macro expander (gullet) and (indirectly via that) also a
    // new lexer (mouth) for this parser (stomach, in the language of TeX)
    this.gullet = new MacroExpander(input, settings, this.mode);
    // Store the settings for use in parsing
    this.settings = settings;
    // Are we defining a preamble?
    this.isPreamble = isPreamble;
    // Count leftright depth (for \middle errors)
    this.leftrightDepth = 0;
    this.prevAtomType = "";
  }

  /**
   * Checks a result to make sure it has the right type, and throws an
   * appropriate error otherwise.
   */
  expect(text, consume = true) {
    if (this.fetch().text !== text) {
      throw new ParseError(`Expected '${text}', got '${this.fetch().text}'`, this.fetch());
    }
    if (consume) {
      this.consume();
    }
  }

  /**
   * Discards the current lookahead token, considering it consumed.
   */
  consume() {
    this.nextToken = null;
  }

  /**
   * Return the current lookahead token, or if there isn't one (at the
   * beginning, or if the previous lookahead token was consume()d),
   * fetch the next token as the new lookahead token and return it.
   */
  fetch() {
    if (this.nextToken == null) {
      this.nextToken = this.gullet.expandNextToken();
    }
    return this.nextToken;
  }

  /**
   * Switches between "text" and "math" modes.
   */
  switchMode(newMode) {
    this.mode = newMode;
    this.gullet.switchMode(newMode);
  }

  /**
   * Main parsing function, which parses an entire input.
   */
  parse() {
    // Create a group namespace for every $...$, $$...$$, \[...\].)
    // A \def is then valid only within that pair of delimiters.
    this.gullet.beginGroup();

    if (this.settings.colorIsTextColor) {
      // Use old \color behavior (same as LaTeX's \textcolor) if requested.
      // We do this within the group for the math expression, so it doesn't
      // pollute settings.macros.
      this.gullet.macros.set("\\color", "\\textcolor");
    }

    // Try to parse the input
    const parse = this.parseExpression(false);

    // If we succeeded, make sure there's an EOF at the end
    this.expect("EOF");

    if (this.isPreamble) {
      const macros = Object.create(null);
      Object.entries(this.gullet.macros.current).forEach(([key, value]) => {
        macros[key] = value;
      });
      this.gullet.endGroup();
      return macros
    }

    // The only local macro that we want to save is from \tag.
    const tag = this.gullet.macros.get("\\df@tag");

    // End the group namespace for the expression
    this.gullet.endGroup();

    if (tag) { this.gullet.macros.current["\\df@tag"] = tag; }

    return parse;
  }

  static get endOfExpression() {
    return ["}", "\\endgroup", "\\end", "\\right", "\\endtoggle", "&"];
  }

  /**
   * Fully parse a separate sequence of tokens as a separate job.
   * Tokens should be specified in reverse order, as in a MacroDefinition.
   */
  subparse(tokens) {
    // Save the next token from the current job.
    const oldToken = this.nextToken;
    this.consume();

    // Run the new job, terminating it with an excess '}'
    this.gullet.pushToken(new Token("}"));
    this.gullet.pushTokens(tokens);
    const parse = this.parseExpression(false);
    this.expect("}");

    // Restore the next token from the current job.
    this.nextToken = oldToken;

    return parse;
  }

/**
   * Parses an "expression", which is a list of atoms.
   *
   * `breakOnInfix`: Should the parsing stop when we hit infix nodes? This
   *                 happens when functions have higher precedence han infix
   *                 nodes in implicit parses.
   *
   * `breakOnTokenText`: The text of the token that the expression should end
   *                     with, or `null` if something else should end the
   *                     expression.
   *
   * `breakOnMiddle`: \color, \over, and old styling functions work on an implicit group.
   *                  These groups end just before the usual tokens, but they also
   *                  end just before `\middle`.
   */
  parseExpression(breakOnInfix, breakOnTokenText, breakOnMiddle) {
    const body = [];
    this.prevAtomType = "";
    // Keep adding atoms to the body until we can't parse any more atoms (either
    // we reached the end, a }, or a \right)
    while (true) {
      // Ignore spaces in math mode
      if (this.mode === "math") {
        this.consumeSpaces();
      }
      const lex = this.fetch();
      if (Parser.endOfExpression.indexOf(lex.text) !== -1) {
        break;
      }
      if (breakOnTokenText && lex.text === breakOnTokenText) {
        break;
      }
      if (breakOnMiddle && lex.text === "\\middle") {
        break
      }
      if (breakOnInfix && functions[lex.text] && functions[lex.text].infix) {
        break;
      }
      const atom = this.parseAtom(breakOnTokenText);
      if (!atom) {
        break;
      } else if (atom.type === "internal") {
        // Internal nodes do not appear in parse tree
        continue;
      }
      body.push(atom);
      // Keep a record of the atom type, so that op.js can set correct spacing.
      this.prevAtomType = atom.type === "atom" ? atom.family : atom.type;
    }
    if (this.mode === "text") {
      this.formLigatures(body);
    }
    return this.handleInfixNodes(body);
  }

  /**
   * Rewrites infix operators such as \over with corresponding commands such
   * as \frac.
   *
   * There can only be one infix operator per group.  If there's more than one
   * then the expression is ambiguous.  This can be resolved by adding {}.
   */
  handleInfixNodes(body) {
    let overIndex = -1;
    let funcName;

    for (let i = 0; i < body.length; i++) {
      if (body[i].type === "infix") {
        if (overIndex !== -1) {
          throw new ParseError("only one infix operator per group", body[i].token);
        }
        overIndex = i;
        funcName = body[i].replaceWith;
      }
    }

    if (overIndex !== -1 && funcName) {
      let numerNode;
      let denomNode;

      const numerBody = body.slice(0, overIndex);
      const denomBody = body.slice(overIndex + 1);

      if (numerBody.length === 1 && numerBody[0].type === "ordgroup") {
        numerNode = numerBody[0];
      } else {
        numerNode = { type: "ordgroup", mode: this.mode, body: numerBody };
      }

      if (denomBody.length === 1 && denomBody[0].type === "ordgroup") {
        denomNode = denomBody[0];
      } else {
        denomNode = { type: "ordgroup", mode: this.mode, body: denomBody };
      }

      let node;
      if (funcName === "\\\\abovefrac") {
        node = this.callFunction(funcName, [numerNode, body[overIndex], denomNode], []);
      } else {
        node = this.callFunction(funcName, [numerNode, denomNode], []);
      }
      return [node];
    } else {
      return body;
    }
  }

  /**
   * Handle a subscript or superscript with nice errors.
   */
  handleSupSubscript(
    name // For error reporting.
  ) {
    const symbolToken = this.fetch();
    const symbol = symbolToken.text;
    this.consume();
    this.consumeSpaces(); // ignore spaces before sup/subscript argument
    // Skip over allowed internal nodes such as \relax
    let group;
    do {
      group = this.parseGroup(name);
    } while (group.type && group.type === "internal")

    if (!group) {
      throw new ParseError("Expected group after '" + symbol + "'", symbolToken);
    }

    return group;
  }

  /**
   * Converts the textual input of an unsupported command into a text node
   * contained within a color node whose color is determined by errorColor
   */
  formatUnsupportedCmd(text) {
    const textordArray = [];

    for (let i = 0; i < text.length; i++) {
      textordArray.push({ type: "textord", mode: "text", text: text[i] });
    }

    const textNode = {
      type: "text",
      mode: this.mode,
      body: textordArray
    };

    const colorNode = {
      type: "color",
      mode: this.mode,
      color: this.settings.errorColor,
      body: [textNode]
    };

    return colorNode;
  }

  /**
   * Parses a group with optional super/subscripts.
   */
  parseAtom(breakOnTokenText) {
    // The body of an atom is an implicit group, so that things like
    // \left(x\right)^2 work correctly.
    const base = this.parseGroup("atom", breakOnTokenText);

    // Internal nodes (e.g. \relax) cannot support super/subscripts.
    // Instead we will pick up super/subscripts with blank base next round.
    if (base && base.type === "internal") {
      return base
    }

    // In text mode, we don't have superscripts or subscripts
    if (this.mode === "text") {
      return base
    }

    // Note that base may be empty (i.e. null) at this point.

    let superscript;
    let subscript;
    while (true) {
      // Guaranteed in math mode, so eat any spaces first.
      this.consumeSpaces();

      // Lex the first token
      const lex = this.fetch();

      if (lex.text === "\\limits" || lex.text === "\\nolimits") {
        // We got a limit control
        if (base && base.type === "op") {
          const limits = lex.text === "\\limits";
          base.limits = limits;
          base.alwaysHandleSupSub = true;
        } else if (base && base.type === "operatorname") {
          if (base.alwaysHandleSupSub) {
            base.limits = lex.text === "\\limits";
          }
        } else {
          throw new ParseError("Limit controls must follow a math operator", lex);
        }
        this.consume();
      } else if (lex.text === "^") {
        // We got a superscript start
        if (superscript) {
          throw new ParseError("Double superscript", lex);
        }
        superscript = this.handleSupSubscript("superscript");
      } else if (lex.text === "_") {
        // We got a subscript start
        if (subscript) {
          throw new ParseError("Double subscript", lex);
        }
        subscript = this.handleSupSubscript("subscript");
      } else if (lex.text === "'") {
        // We got a prime
        if (superscript) {
          throw new ParseError("Double superscript", lex);
        }
        const prime = { type: "textord", mode: this.mode, text: "\\prime" };

        // Many primes can be grouped together, so we handle this here
        const primes = [prime];
        this.consume();
        // Keep lexing tokens until we get something that's not a prime
        while (this.fetch().text === "'") {
          // For each one, add another prime to the list
          primes.push(prime);
          this.consume();
        }
        // If there's a superscript following the primes, combine that
        // superscript in with the primes.
        if (this.fetch().text === "^") {
          primes.push(this.handleSupSubscript("superscript"));
        }
        // Put everything into an ordgroup as the superscript
        superscript = { type: "ordgroup", mode: this.mode, body: primes };
      } else if (uSubsAndSups[lex.text]) {
        // A Unicode subscript or superscript character.
        // We treat these similarly to the unicode-math package.
        // So we render a string of Unicode (sub|super)scripts the
        // same as a (sub|super)script of regular characters.
        const isSub = unicodeSubRegEx.test(lex.text);
        const subsupTokens = [];
        subsupTokens.push(new Token(uSubsAndSups[lex.text]));
        this.consume();
        // Continue fetching tokens to fill out the group.
        while (true) {
          const token = this.fetch().text;
          if (!(uSubsAndSups[token])) { break }
          if (unicodeSubRegEx.test(token) !== isSub) { break }
          subsupTokens.unshift(new Token(uSubsAndSups[token]));
          this.consume();
        }
        // Now create a (sub|super)script.
        const body = this.subparse(subsupTokens);
        if (isSub) {
          subscript = { type: "ordgroup", mode: "math", body };
        } else {
          superscript = { type: "ordgroup", mode: "math", body };
        }
      } else {
        // If it wasn't ^, _, a Unicode (sub|super)script, or ', stop parsing super/subscripts
        break;
      }
    }

    if (superscript || subscript) {
      if (base && base.type === "multiscript" && !base.postscripts) {
        // base is the result of a \prescript function.
        // Write the sub- & superscripts into the multiscript element.
        base.postscripts = { sup: superscript, sub: subscript };
        return base
      } else {
        // We got either a superscript or subscript, create a supsub
        const isFollowedByDelimiter = (!base || base.type !== "op" && base.type !== "operatorname")
          ? undefined
          : isDelimiter(this.nextToken.text);
        return {
          type: "supsub",
          mode: this.mode,
          base: base,
          sup: superscript,
          sub: subscript,
          isFollowedByDelimiter
        }
      }
    } else {
      // Otherwise return the original body
      return base;
    }
  }

  /**
   * Parses an entire function, including its base and all of its arguments.
   */
  parseFunction(
    breakOnTokenText,
    name // For determining its context
  ) {
    const token = this.fetch();
    const func = token.text;
    const funcData = functions[func];
    if (!funcData) {
      return null;
    }
    this.consume(); // consume command token

    if (name && name !== "atom" && !funcData.allowedInArgument) {
      throw new ParseError(
        "Got function '" + func + "' with no arguments" + (name ? " as " + name : ""),
        token
      );
    } else if (this.mode === "text" && !funcData.allowedInText) {
      throw new ParseError("Can't use function '" + func + "' in text mode", token);
    } else if (this.mode === "math" && funcData.allowedInMath === false) {
      throw new ParseError("Can't use function '" + func + "' in math mode", token);
    }

    const prevAtomType = this.prevAtomType;
    const { args, optArgs } = this.parseArguments(func, funcData);
    this.prevAtomType = prevAtomType;
    return this.callFunction(func, args, optArgs, token, breakOnTokenText);
  }

  /**
   * Call a function handler with a suitable context and arguments.
   */
  callFunction(name, args, optArgs, token, breakOnTokenText) {
    const context = {
      funcName: name,
      parser: this,
      token,
      breakOnTokenText
    };
    const func = functions[name];
    if (func && func.handler) {
      return func.handler(context, args, optArgs);
    } else {
      throw new ParseError(`No function handler for ${name}`);
    }
  }

  /**
   * Parses the arguments of a function or environment
   */
  parseArguments(
    func, // Should look like "\name" or "\begin{name}".
    funcData
  ) {
    const totalArgs = funcData.numArgs + funcData.numOptionalArgs;
    if (totalArgs === 0) {
      return { args: [], optArgs: [] };
    }

    const args = [];
    const optArgs = [];

    for (let i = 0; i < totalArgs; i++) {
      let argType = funcData.argTypes && funcData.argTypes[i];
      const isOptional = i < funcData.numOptionalArgs;

      if (
        (funcData.primitive && argType == null) ||
        // \sqrt expands into primitive if optional argument doesn't exist
        (funcData.type === "sqrt" && i === 1 && optArgs[0] == null)
      ) {
        argType = "primitive";
      }

      const arg = this.parseGroupOfType(`argument to '${func}'`, argType, isOptional);
      if (isOptional) {
        optArgs.push(arg);
      } else if (arg != null) {
        args.push(arg);
      } else {
        // should be unreachable
        throw new ParseError("Null argument, please report this as a bug");
      }
    }

    return { args, optArgs };
  }

  /**
   * Parses a group when the mode is changing.
   */
  parseGroupOfType(name, type, optional) {
    switch (type) {
      case "size":
        return this.parseSizeGroup(optional);
      case "url":
        return this.parseUrlGroup(optional);
      case "math":
      case "text":
        return this.parseArgumentGroup(optional, type);
      case "hbox": {
        // hbox argument type wraps the argument in the equivalent of
        // \hbox, which is like \text but switching to \textstyle size.
        const group = this.parseArgumentGroup(optional, "text");
        return group != null
          ? {
            type: "styling",
            mode: group.mode,
            body: [group],
            scriptLevel: "text" // simulate \textstyle
          }
          : null;
      }
      case "raw": {
        const token = this.parseStringGroup("raw", optional);
        return token != null
          ? {
            type: "raw",
            mode: "text",
            string: token.text
          }
          : null;
      }
      case "primitive": {
        if (optional) {
          throw new ParseError("A primitive argument cannot be optional");
        }
        const group = this.parseGroup(name);
        if (group == null) {
          throw new ParseError("Expected group as " + name, this.fetch());
        }
        return group;
      }
      case "original":
      case null:
      case undefined:
        return this.parseArgumentGroup(optional);
      default:
        throw new ParseError("Unknown group type as " + name, this.fetch());
    }
  }

  /**
   * Discard any space tokens, fetching the next non-space token.
   */
  consumeSpaces() {
    while (true) {
      const ch = this.fetch().text;
      // \ufe0e is the Unicode variation selector to supress emoji. Ignore it.
      if (ch === " " || ch === "\u00a0" || ch === "\ufe0e") {
        this.consume();
      } else {
        break
      }
    }
  }

  /**
   * Parses a group, essentially returning the string formed by the
   * brace-enclosed tokens plus some position information.
   */
  parseStringGroup(
    modeName, // Used to describe the mode in error messages.
    optional
  ) {
    const argToken = this.gullet.scanArgument(optional);
    if (argToken == null) {
      return null;
    }
    let str = "";
    let nextToken;
    while ((nextToken = this.fetch()).text !== "EOF") {
      str += nextToken.text;
      this.consume();
    }
    this.consume(); // consume the end of the argument
    argToken.text = str;
    return argToken;
  }

  /**
   * Parses a regex-delimited group: the largest sequence of tokens
   * whose concatenated strings match `regex`. Returns the string
   * formed by the tokens plus some position information.
   */
  parseRegexGroup(
    regex,
    modeName // Used to describe the mode in error messages.
  ) {
    const firstToken = this.fetch();
    let lastToken = firstToken;
    let str = "";
    let nextToken;
    while ((nextToken = this.fetch()).text !== "EOF" && regex.test(str + nextToken.text)) {
      lastToken = nextToken;
      str += lastToken.text;
      this.consume();
    }
    if (str === "") {
      throw new ParseError("Invalid " + modeName + ": '" + firstToken.text + "'", firstToken);
    }
    return firstToken.range(lastToken, str);
  }

  /**
   * Parses a size specification, consisting of magnitude and unit.
   */
  parseSizeGroup(optional) {
    let res;
    let isBlank = false;
    // don't expand before parseStringGroup
    this.gullet.consumeSpaces();
    if (!optional && this.gullet.future().text !== "{") {
      res = this.parseRegexGroup(/^[-+]? *(?:$|\d+|\d+\.\d*|\.\d*) *[a-z]{0,2} *$/, "size");
    } else {
      res = this.parseStringGroup("size", optional);
    }
    if (!res) {
      return null;
    }
    if (!optional && res.text.length === 0) {
      // Because we've tested for what is !optional, this block won't
      // affect \kern, \hspace, etc. It will capture the mandatory arguments
      // to \genfrac and \above.
      res.text = "0pt"; // Enable \above{}
      isBlank = true; // This is here specifically for \genfrac
    }
    const match = sizeRegEx.exec(res.text);
    if (!match) {
      throw new ParseError("Invalid size: '" + res.text + "'", res);
    }
    const data = {
      number: +(match[1] + match[2]), // sign + magnitude, cast to number
      unit: match[3]
    };
    if (!validUnit(data)) {
      throw new ParseError("Invalid unit: '" + data.unit + "'", res);
    }
    return {
      type: "size",
      mode: this.mode,
      value: data,
      isBlank
    };
  }

  /**
   * Parses an URL, checking escaped letters and allowed protocols,
   * and setting the catcode of % as an active character (as in \hyperref).
   */
  parseUrlGroup(optional) {
    this.gullet.lexer.setCatcode("%", 13); // active character
    this.gullet.lexer.setCatcode("~", 12); // other character
    const res = this.parseStringGroup("url", optional);
    this.gullet.lexer.setCatcode("%", 14); // comment character
    this.gullet.lexer.setCatcode("~", 13); // active character
    if (res == null) {
      return null;
    }
    // hyperref package allows backslashes alone in href, but doesn't
    // generate valid links in such cases; we interpret this as
    // "undefined" behaviour, and keep them as-is. Some browser will
    // replace backslashes with forward slashes.
    let url = res.text.replace(/\\([#$%&~_^{}])/g, "$1");
    url = res.text.replace(/{\u2044}/g, "/");
    return {
      type: "url",
      mode: this.mode,
      url
    };
  }

  /**
   * Parses an argument with the mode specified.
   */
  parseArgumentGroup(optional, mode) {
    const argToken = this.gullet.scanArgument(optional);
    if (argToken == null) {
      return null;
    }
    const outerMode = this.mode;
    if (mode) {
      // Switch to specified mode
      this.switchMode(mode);
    }

    this.gullet.beginGroup();
    const expression = this.parseExpression(false, "EOF");
    // TODO: find an alternative way to denote the end
    this.expect("EOF"); // expect the end of the argument
    this.gullet.endGroup();
    const result = {
      type: "ordgroup",
      mode: this.mode,
      loc: argToken.loc,
      body: expression
    };

    if (mode) {
      // Switch mode back
      this.switchMode(outerMode);
    }
    return result;
  }

  /**
   * Parses an ordinary group, which is either a single nucleus (like "x")
   * or an expression in braces (like "{x+y}") or an implicit group, a group
   * that starts at the current position, and ends right before a higher explicit
   * group ends, or at EOF.
   */
  parseGroup(
    name, // For error reporting.
    breakOnTokenText
  ) {
    const firstToken = this.fetch();
    const text = firstToken.text;

    let result;
    // Try to parse an open brace or \begingroup
    if (text === "{" || text === "\\begingroup" || text === "\\toggle") {
      this.consume();
      const groupEnd = text === "{"
        ? "}"
        : text === "\\begingroup"
        ? "\\endgroup"
        : "\\endtoggle";

      this.gullet.beginGroup();
      // If we get a brace, parse an expression
      const expression = this.parseExpression(false, groupEnd);
      const lastToken = this.fetch();
      this.expect(groupEnd); // Check that we got a matching closing brace
      this.gullet.endGroup();
      result = {
        type: (lastToken.text === "\\endtoggle" ? "toggle" : "ordgroup"),
        mode: this.mode,
        loc: SourceLocation.range(firstToken, lastToken),
        body: expression,
        // A group formed by \begingroup...\endgroup is a semi-simple group
        // which doesn't affect spacing in math mode, i.e., is transparent.
        // https://tex.stackexchange.com/questions/1930/
        semisimple: text === "\\begingroup" || undefined
      };
    } else {
      // If there exists a function with this name, parse the function.
      // Otherwise, just return a nucleus
      result = this.parseFunction(breakOnTokenText, name) || this.parseSymbol();
      if (result == null && text[0] === "\\" &&
          !Object.prototype.hasOwnProperty.call(implicitCommands, text )) {
        result = this.formatUnsupportedCmd(text);
        this.consume();
      }
    }
    return result;
  }

  /**
   * Form ligature-like combinations of characters for text mode.
   * This includes inputs like "--", "---", "``" and "''".
   * The result will simply replace multiple textord nodes with a single
   * character in each value by a single textord node having multiple
   * characters in its value.  The representation is still ASCII source.
   * The group will be modified in place.
   */
  formLigatures(group) {
    let n = group.length - 1;
    for (let i = 0; i < n; ++i) {
      const a = group[i];
      const v = a.text;
      if (v === "-" && group[i + 1].text === "-") {
        if (i + 1 < n && group[i + 2].text === "-") {
          group.splice(i, 3, {
            type: "textord",
            mode: "text",
            loc: SourceLocation.range(a, group[i + 2]),
            text: "---"
          });
          n -= 2;
        } else {
          group.splice(i, 2, {
            type: "textord",
            mode: "text",
            loc: SourceLocation.range(a, group[i + 1]),
            text: "--"
          });
          n -= 1;
        }
      }
      if ((v === "'" || v === "`") && group[i + 1].text === v) {
        group.splice(i, 2, {
          type: "textord",
          mode: "text",
          loc: SourceLocation.range(a, group[i + 1]),
          text: v + v
        });
        n -= 1;
      }
    }
  }

  /**
   * Parse a single symbol out of the string. Here, we handle single character
   * symbols and special functions like \verb.
   */
  parseSymbol() {
    const nucleus = this.fetch();
    let text = nucleus.text;

    if (/^\\verb[^a-zA-Z]/.test(text)) {
      this.consume();
      let arg = text.slice(5);
      const star = arg.charAt(0) === "*";
      if (star) {
        arg = arg.slice(1);
      }
      // Lexer's tokenRegex is constructed to always have matching
      // first/last characters.
      if (arg.length < 2 || arg.charAt(0) !== arg.slice(-1)) {
        throw new ParseError(`\\verb assertion failed --
                    please report what input caused this bug`);
      }
      arg = arg.slice(1, -1); // remove first and last char
      return {
        type: "verb",
        mode: "text",
        body: arg,
        star
      };
    }
    // At this point, we should have a symbol, possibly with accents.
    // First expand any accented base symbol according to unicodeSymbols.
    if (Object.prototype.hasOwnProperty.call(unicodeSymbols, text[0]) &&
      this.mode === "math" && !symbols[this.mode][text[0]]) {
      // This behavior is not strict (XeTeX-compatible) in math mode.
      if (this.settings.strict && this.mode === "math") {
        throw new ParseError(`Accented Unicode text character "${text[0]}" used in ` + `math mode`,
          nucleus
        );
      }
      text = unicodeSymbols[text[0]] + text.slice(1);
    }
    // Strip off any combining characters
    const match = this.mode === "math"
      ? combiningDiacriticalMarksEndRegex.exec(text)
      : null;
    if (match) {
      text = text.substring(0, match.index);
      if (text === "i") {
        text = "\u0131"; // dotless i, in math and text mode
      } else if (text === "j") {
        text = "\u0237"; // dotless j, in math and text mode
      }
    }
    // Recognize base symbol
    let symbol;
    if (symbols[this.mode][text]) {
      let group = symbols[this.mode][text].group;
      if (group === "bin" && binLeftCancellers.includes(this.prevAtomType)) {
        // Change from a binary operator to a unary (prefix) operator
        group = "open";
      }
      const loc = SourceLocation.range(nucleus);
      let s;
      if (Object.prototype.hasOwnProperty.call(ATOMS, group )) {
        const family = group;
        s = {
          type: "atom",
          mode: this.mode,
          family,
          loc,
          text
        };
        if ((family === "rel" || family === "bin") && this.prevAtomType === "text") {
          if (textRegEx.test(loc.lexer.input.slice(loc.end))) {
            s.needsSpacing = true;  // Fix a MathML bug.
          }
        }
      } else {
        if (asciiFromScript[text]) {
          // Unicode 14 disambiguates chancery from roundhand.
          // See https://www.unicode.org/charts/PDF/U1D400.pdf
          this.consume();
          const nextCode = this.fetch().text.charCodeAt(0);
          // mathcal is Temml default. Use mathscript if called for.
          const font = nextCode === 0xfe01 ? "mathscr" : "mathcal";
          if (nextCode === 0xfe00 || nextCode === 0xfe01) { this.consume(); }
          return {
            type: "font",
            mode: "math",
            font,
            body: { type: "mathord", mode: "math", loc, text: asciiFromScript[text] }
          }
        }
        // Default ord character. No disambiguation necessary.
        s = {
          type: group,
          mode: this.mode,
          loc,
          text
        };
      }
      symbol = s;
    } else if (text.charCodeAt(0) >= 0x80 || combiningDiacriticalMarksEndRegex.exec(text)) {
      // no symbol for e.g. ^
      if (this.settings.strict && this.mode === "math") {
        throw new ParseError(`Unicode text character "${text[0]}" used in math mode`, nucleus)
      }
      // All nonmathematical Unicode characters are rendered as if they
      // are in text mode (wrapped in \text) because that's what it
      // takes to render them in LaTeX.
      symbol = {
        type: "textord",
        mode: "text",
        loc: SourceLocation.range(nucleus),
        text
      };
    } else {
      return null; // EOF, ^, _, {, }, etc.
    }
    this.consume();
    // Transform combining characters into accents
    if (match) {
      for (let i = 0; i < match[0].length; i++) {
        const accent = match[0][i];
        if (!unicodeAccents[accent]) {
          throw new ParseError(`Unknown accent ' ${accent}'`, nucleus);
        }
        const command = unicodeAccents[accent][this.mode] ||
                        unicodeAccents[accent].text;
        if (!command) {
          throw new ParseError(`Accent ${accent} unsupported in ${this.mode} mode`, nucleus);
        }
        symbol = {
          type: "accent",
          mode: this.mode,
          loc: SourceLocation.range(nucleus),
          label: command,
          isStretchy: false,
          base: symbol
        };
      }
    }
    return symbol;
  }
}

/**
 * Parses an expression using a Parser, then returns the parsed result.
 */
const parseTree = function(toParse, settings) {
  if (!(typeof toParse === "string" || toParse instanceof String)) {
    throw new TypeError("Temml can only parse string typed expression")
  }
  const parser = new Parser(toParse, settings);
  // Blank out any \df@tag to avoid spurious "Duplicate \tag" errors
  delete parser.gullet.macros.current["\\df@tag"];

  let tree = parser.parse();

  // LaTeX ignores a \tag placed outside an AMS environment.
  if (!(tree.length > 0 &&  tree[0].type && tree[0].type === "array" && tree[0].addEqnNum)) {
    // If the input used \tag, it will set the \df@tag macro to the tag.
    // In this case, we separately parse the tag and wrap the tree.
    if (parser.gullet.macros.get("\\df@tag")) {
      if (!settings.displayMode) {
        throw new ParseError("\\tag works only in display mode")
      }
      parser.gullet.feed("\\df@tag");
      tree = [
        {
          type: "tag",
          mode: "text",
          body: tree,
          tag: parser.parse()
        }
      ];
    }
  }

  return tree
};

/**
 * This file contains information about the style that the mathmlBuilder carries
 * around with it. Data is held in an `Style` object, and when
 * recursing, a new `Style` object can be created with the `.with*` functions.
 */

const subOrSupLevel = [2, 2, 3, 3];

/**
 * This is the main Style class. It contains the current style.level, color, and font.
 *
 * Style objects should not be modified. To create a new Style with
 * different properties, call a `.with*` method.
 */
class Style {
  constructor(data) {
    // Style.level can be 0 | 1 | 2 | 3, which correspond to
    //       displaystyle, textstyle, scriptstyle, and scriptscriptstyle.
    // style.level usually does not directly set MathML's script level. MathML does that itself.
    // However, Chromium does not stop shrinking after scriptscriptstyle, so we do explicitly
    // set a scriptlevel attribute in those conditions.
    // We also use style.level to track math style so that we can get the correct
    // scriptlevel when needed in supsub.js, mathchoice.js, or for dimensions in em.
    this.level = data.level;
    this.color = data.color;  // string | void
    // A font family applies to a group of fonts (i.e. SansSerif), while a font
    // represents a specific font (i.e. SansSerif Bold).
    // See: https://tex.stackexchange.com/questions/22350/difference-between-textrm-and-mathrm
    this.font = data.font || "";                // string
    this.fontFamily = data.fontFamily || "";    // string
    this.fontSize = data.fontSize || 1.0;       // number
    this.fontWeight = data.fontWeight || "";
    this.fontShape = data.fontShape || "";
    this.maxSize = data.maxSize;                // [number, number]
  }

  /**
   * Returns a new style object with the same properties as "this".  Properties
   * from "extension" will be copied to the new style object.
   */
  extend(extension) {
    const data = {
      level: this.level,
      color: this.color,
      font: this.font,
      fontFamily: this.fontFamily,
      fontSize: this.fontSize,
      fontWeight: this.fontWeight,
      fontShape: this.fontShape,
      maxSize: this.maxSize
    };

    for (const key in extension) {
      if (Object.prototype.hasOwnProperty.call(extension, key)) {
        data[key] = extension[key];
      }
    }

    return new Style(data);
  }

  withLevel(n) {
    return this.extend({
      level: n
    });
  }

  incrementLevel() {
    return this.extend({
      level: Math.min(this.level + 1, 3)
    });
  }

  inSubOrSup() {
    return this.extend({
      level: subOrSupLevel[this.level]
    })
  }

  /**
   * Create a new style object with the given color.
   */
  withColor(color) {
    return this.extend({
      color: color
    });
  }

  /**
   * Creates a new style object with the given math font or old text font.
   * @type {[type]}
   */
  withFont(font) {
    return this.extend({
      font
    });
  }

  /**
   * Create a new style objects with the given fontFamily.
   */
  withTextFontFamily(fontFamily) {
    return this.extend({
      fontFamily,
      font: ""
    });
  }

  /**
   * Creates a new style object with the given font size
   */
  withFontSize(num) {
    return this.extend({
      fontSize: num
    });
  }

  /**
   * Creates a new style object with the given font weight
   */
  withTextFontWeight(fontWeight) {
    return this.extend({
      fontWeight,
      font: ""
    });
  }

  /**
   * Creates a new style object with the given font weight
   */
  withTextFontShape(fontShape) {
    return this.extend({
      fontShape,
      font: ""
    });
  }

  /**
   * Gets the CSS color of the current style object
   */
  getColor() {
    return this.color;
  }
}

/* Temml Post Process
 * Populate the text contents of each \ref & \eqref
 *
 * As with other Temml code, this file is released under terms of the MIT license.
 * https://mit-license.org/
 */

const version = "0.11.11";

function postProcess(block) {
  const labelMap = {};
  let i = 0;

  // Get a collection of the parents of each \tag & auto-numbered equation
  const amsEqns = document.getElementsByClassName('tml-eqn');
  for (let parent of amsEqns) {
    // AMS automatically numbered equation.
    // Assign an id.
    i += 1;
    parent.setAttribute("id", "tml-eqn-" + String(i));
    // No need to write a number into the text content of the element.
    // A CSS counter has done that even if this postProcess() function is not used.

    // Find any \label that refers to an AMS automatic eqn number.
    while (true) {
      if (parent.tagName === "mtable") { break }
      const labels = parent.getElementsByClassName("tml-label");
      if (labels.length > 0) {
        const id = parent.attributes.id.value;
        labelMap[id] = String(i);
        break
      } else {
        parent = parent.parentElement;
      }
    }
  }

  // Find \labels associated with \tag
  const taggedEqns = document.getElementsByClassName('tml-tageqn');
  for (const parent of taggedEqns) {
    const labels = parent.getElementsByClassName("tml-label");
    if (labels.length > 0) {
      const tags = parent.getElementsByClassName("tml-tag");
      if (tags.length > 0) {
        const id = parent.attributes.id.value;
        labelMap[id] = tags[0].textContent;
      }
    }
  }

  // Populate \ref & \eqref text content
  const refs = block.getElementsByClassName("tml-ref");
  [...refs].forEach(ref => {
    const attr = ref.getAttribute("href");
    let str = labelMap[attr.slice(1)];
    if (ref.className.indexOf("tml-eqref") === -1) {
      // \ref. Omit parens.
      str = str.replace(/^\(/, "");
      str = str.replace(/\)$/, "");
    } else {
      // \eqref. Include parens
      if (str.charAt(0) !== "(") { str = "(" + str; }
      if (str.slice(-1) !== ")") { str =  str + ")"; }
    }
    const mtext = document.createElementNS("http://www.w3.org/1998/Math/MathML", "mtext");
    mtext.appendChild(document.createTextNode(str));
    const math =  document.createElementNS("http://www.w3.org/1998/Math/MathML", "math");
    math.appendChild(mtext);
    ref.textContent = '';
    ref.appendChild(math);
  });
}

const findEndOfMath = function(delimiter, text, startIndex) {
  // Adapted from
  // https://github.com/Khan/perseus/blob/master/src/perseus-markdown.jsx
  let index = startIndex;
  let braceLevel = 0;

  const delimLength = delimiter.length;

  while (index < text.length) {
    const character = text[index];

    if (braceLevel <= 0 && text.slice(index, index + delimLength) === delimiter) {
      return index;
    } else if (character === "\\") {
      index++;
    } else if (character === "{") {
      braceLevel++;
    } else if (character === "}") {
      braceLevel--;
    }

    index++;
  }

  return -1;
};

const escapeRegex = function(string) {
  return string.replace(/[-/\\^$*+?.()|[\]{}]/g, "\\$&");
};

const amsRegex = /^\\(?:begin|(?:eq)?ref){/;

const splitAtDelimiters = function(text, delimiters) {
  let index;
  const data = [];

  const regexLeft = new RegExp(
    "(" + delimiters.map((x) => escapeRegex(x.left)).join("|") + ")"
  );

  while (true) {
    index = text.search(regexLeft);
    if (index === -1) {
      break;
    }
    if (index > 0) {
      data.push({
        type: "text",
        data: text.slice(0, index)
      });
      text = text.slice(index); // now text starts with delimiter
    }
    // ... so this always succeeds:
    const i = delimiters.findIndex((delim) => text.startsWith(delim.left));
    index = findEndOfMath(delimiters[i].right, text, delimiters[i].left.length);
    if (index === -1) {
      break;
    }
    const rawData = text.slice(0, index + delimiters[i].right.length);
    const math = amsRegex.test(rawData)
      ? rawData
      : text.slice(delimiters[i].left.length, index);
    data.push({
      type: "math",
      data: math,
      rawData,
      display: delimiters[i].display
    });
    text = text.slice(index + delimiters[i].right.length);
  }

  if (text !== "") {
    data.push({
      type: "text",
      data: text
    });
  }

  return data;
};

const defaultDelimiters = [
  { left: "$$", right: "$$", display: true },
  { left: "\\(", right: "\\)", display: false },
  // LaTeX uses $…$, but it ruins the display of normal `$` in text:
  // {left: "$", right: "$", display: false},
  // $ must come after $$

  // Render AMS environments even if outside $$…$$ delimiters.
  { left: "\\begin{equation}", right: "\\end{equation}", display: true },
  { left: "\\begin{equation*}", right: "\\end{equation*}", display: true },
  { left: "\\begin{align}", right: "\\end{align}", display: true },
  { left: "\\begin{align*}", right: "\\end{align*}", display: true },
  { left: "\\begin{alignat}", right: "\\end{alignat}", display: true },
  { left: "\\begin{alignat*}", right: "\\end{alignat*}", display: true },
  { left: "\\begin{gather}", right: "\\end{gather}", display: true },
  { left: "\\begin{gather*}", right: "\\end{gather*}", display: true },
  { left: "\\begin{CD}", right: "\\end{CD}", display: true },
  // Ditto \ref & \eqref
  { left: "\\ref{", right: "}", display: false },
  { left: "\\eqref{", right: "}", display: false },

  { left: "\\[", right: "\\]", display: true }
];

const firstDraftDelimiters = {
  "$": [
         { left: "$$", right: "$$", display: true },
         { left: "$`", right: "`$", display: false },
         { left: "$", right: "$", display: false }
  ],
  "(": [
    { left: "\\[", right: "\\]", display: true },
    { left: "\\(", right: "\\)", display: false }
  ]
};

const amsDelimiters = [
  { left: "\\begin{equation}", right: "\\end{equation}", display: true },
  { left: "\\begin{equation*}", right: "\\end{equation*}", display: true },
  { left: "\\begin{align}", right: "\\end{align}", display: true },
  { left: "\\begin{align*}", right: "\\end{align*}", display: true },
  { left: "\\begin{alignat}", right: "\\end{alignat}", display: true },
  { left: "\\begin{alignat*}", right: "\\end{alignat*}", display: true },
  { left: "\\begin{gather}", right: "\\end{gather}", display: true },
  { left: "\\begin{gather*}", right: "\\end{gather*}", display: true },
  { left: "\\begin{CD}", right: "\\end{CD}", display: true },
  { left: "\\ref{", right: "}", display: false },
  { left: "\\eqref{", right: "}", display: false }
];

const delimitersFromKey = key => {
  if (key === "$" || key === "(") {
    return firstDraftDelimiters[key];
  } else if (key === "$+" || key === "(+") {
    const firstDraft = firstDraftDelimiters[key.slice(0, 1)];
    return firstDraft.concat(amsDelimiters)
  } else if (key === "ams") {
    return amsDelimiters
  } else if (key === "all") {
    return (firstDraftDelimiters["("]).concat(firstDraftDelimiters["$"]).concat(amsDelimiters)
  } else {
    return defaultDelimiters
  }
};

/* Note: optionsCopy is mutated by this method. If it is ever exposed in the
 * API, we should copy it before mutating.
 */
const renderMathInText = function(text, optionsCopy) {
  const data = splitAtDelimiters(text, optionsCopy.delimiters);
  if (data.length === 1 && data[0].type === "text") {
    // There is no formula in the text.
    // Let's return null which means there is no need to replace
    // the current text node with a new one.
    return null;
  }

  const fragment = document.createDocumentFragment();

  for (let i = 0; i < data.length; i++) {
    if (data[i].type === "text") {
      fragment.appendChild(document.createTextNode(data[i].data));
    } else {
      const span = document.createElement("span");
      let math = data[i].data;
      // Override any display mode defined in the settings with that
      // defined by the text itself
      optionsCopy.displayMode = data[i].display;
      try {
        if (optionsCopy.preProcess) {
          math = optionsCopy.preProcess(math);
        }
        // Importing render() from temml.js would be a circular dependency.
        // So call the global version.
        // eslint-disable-next-line no-undef
        temml.render(math, span, optionsCopy);
      } catch (e) {
        if (!(e instanceof ParseError)) {
          throw e;
        }
        optionsCopy.errorCallback(
          "Temml auto-render: Failed to parse `" + data[i].data + "` with ",
          e
        );
        fragment.appendChild(document.createTextNode(data[i].rawData));
        continue;
      }
      fragment.appendChild(span);
    }
  }

  return fragment;
};

const renderElem = function(elem, optionsCopy) {
  for (let i = 0; i < elem.childNodes.length; i++) {
    const childNode = elem.childNodes[i];
    if (childNode.nodeType === 3) {
      // Text node
      const frag = renderMathInText(childNode.textContent, optionsCopy);
      if (frag) {
        i += frag.childNodes.length - 1;
        elem.replaceChild(frag, childNode);
      }
    } else if (childNode.nodeType === 1) {
      // Element node
      const className = " " + childNode.className + " ";
      const shouldRender =
        optionsCopy.ignoredTags.indexOf(childNode.nodeName.toLowerCase()) === -1 &&
        optionsCopy.ignoredClasses.every((x) => className.indexOf(" " + x + " ") === -1);

      if (shouldRender) {
        renderElem(childNode, optionsCopy);
      }
    }
    // Otherwise, it's something else, and ignore it.
  }
};

const renderMathInElement = function(elem, options) {
  if (!elem) {
    throw new Error("No element provided to render");
  }

  const optionsCopy = {};

  // Object.assign(optionsCopy, option)
  for (const option in options) {
    if (Object.prototype.hasOwnProperty.call(options, option)) {
      optionsCopy[option] = options[option];
    }
  }

  if (optionsCopy.fences) {
    optionsCopy.delimiters = delimitersFromKey(optionsCopy.fences);
  } else {
    optionsCopy.delimiters = optionsCopy.delimiters || defaultDelimiters;
  }
  optionsCopy.ignoredTags = optionsCopy.ignoredTags || [
    "script",
    "noscript",
    "style",
    "textarea",
    "pre",
    "code",
    "option"
  ];
  optionsCopy.ignoredClasses = optionsCopy.ignoredClasses || [];
  // eslint-disable-next-line no-console
  optionsCopy.errorCallback = optionsCopy.errorCallback || console.error;

  // Enable sharing of global macros defined via `\gdef` between different
  // math elements within a single call to `renderMathInElement`.
  optionsCopy.macros = optionsCopy.macros || {};

  renderElem(elem, optionsCopy);
  postProcess(elem);
};

/* eslint no-console:0 */
/**
 * This is the main entry point for Temml. Here, we expose functions for
 * rendering expressions either to DOM nodes or to markup strings.
 *
 * We also expose the ParseError class to check if errors thrown from Temml are
 * errors in the expression, or errors in javascript handling.
 */


/**
 * @type {import('./temml').render}
 * Parse and build an expression, and place that expression in the DOM node
 * given.
 */
let render = function(expression, baseNode, options = {}) {
  baseNode.textContent = "";
  const alreadyInMathElement = baseNode.tagName.toLowerCase() === "math";
  if (alreadyInMathElement) { options.wrap = "none"; }
  const math = renderToMathMLTree(expression, options);
  if (alreadyInMathElement) {
    // The <math> element already exists. Populate it.
    baseNode.textContent = "";
    math.children.forEach(e => { baseNode.appendChild(e.toNode()); });
  } else if (math.children.length > 1) {
    baseNode.textContent = "";
    math.children.forEach(e => { baseNode.appendChild(e.toNode()); });
  } else {
    baseNode.appendChild(math.toNode());
  }
};

// Temml's styles don't work properly in quirks mode. Print out an error, and
// disable rendering.
if (typeof document !== "undefined") {
  if (document.compatMode !== "CSS1Compat") {
    typeof console !== "undefined" &&
      console.warn(
        "Warning: Temml doesn't work in quirks mode. Make sure your " +
          "website has a suitable doctype."
      );

    render = function() {
      throw new ParseError("Temml doesn't work in quirks mode.");
    };
  }
}

/**
 * @type {import('./temml').renderToString}
 * Parse and build an expression, and return the markup for that.
 */
const renderToString = function(expression, options) {
  const markup = renderToMathMLTree(expression, options).toMarkup();
  return markup;
};

/**
 * @type {import('./temml').generateParseTree}
 * Parse an expression and return the parse tree.
 */
const generateParseTree = function(expression, options) {
  const settings = new Settings(options);
  return parseTree(expression, settings);
};

/**
 * @type {import('./temml').definePreamble}
 * Take an expression which contains a preamble.
 * Parse it and return the macros.
 */
const definePreamble = function(expression, options) {
  const settings = new Settings(options);
  settings.macros = {};
  if (!(typeof expression === "string" || expression instanceof String)) {
    throw new TypeError("Temml can only parse string typed expression")
  }
  const parser = new Parser(expression, settings, true);
  // Blank out any \df@tag to avoid spurious "Duplicate \tag" errors
  delete parser.gullet.macros.current["\\df@tag"];
  const macros = parser.parse();
  return macros
};

/**
 * If the given error is a Temml ParseError,
 * renders the invalid LaTeX as a span with hover title giving the Temml
 * error message.  Otherwise, simply throws the error.
 */
const renderError = function(error, expression, options) {
  if (options.throwOnError || !(error instanceof ParseError)) {
    throw error;
  }
  const node = new Span(["temml-error"], [new TextNode$1(expression + "\n\n" + error.toString())]);
  node.style.color = options.errorColor;
  node.style.whiteSpace = "pre-line";
  return node;
};

/**
 * @type {import('./temml').renderToMathMLTree}
 * Generates and returns the Temml build tree. This is used for advanced
 * use cases (like rendering to custom output).
 */
const renderToMathMLTree = function(expression, options) {
  const settings = new Settings(options);
  try {
    const tree = parseTree(expression, settings);
    const style = new Style({
      level: settings.displayMode ? StyleLevel.DISPLAY : StyleLevel.TEXT,
      maxSize: settings.maxSize
    });
    return buildMathML(tree, expression, style, settings);
  } catch (error) {
    return renderError(error, expression, settings);
  }
};

/** @type {import('./temml').default} */
var temml$1 = {
  /**
   * Current Temml version
   */
  version: version,
  /**
   * Renders the given LaTeX into MathML, and adds
   * it as a child to the specified DOM node.
   */
  render,
  /**
   * Renders the given LaTeX into MathML string,
   * for sending to the client.
   */
  renderToString,
  /**
   * Finds all the math delimiters in a given element of a running HTML document
   * and converts the contents of each instance into a <math> element.
   */
  renderMathInElement,
  /**
   * Post-process an entire HTML block.
   * Writes AMS auto-numbers and implements \ref{}.
   * Typcally called once, after a loop has rendered many individual spans.
   */
  postProcess,
  /**
   * Temml error, usually during parsing.
   */
  ParseError,
  /**
   * Creates a set of macros with document-wide scope.
   */
  definePreamble,
  /**
   * Parses the given LaTeX into Temml's internal parse tree structure,
   * without rendering to HTML or MathML.
   *
   * NOTE: This method is not currently recommended for public use.
   * The internal tree representation is unstable and is very likely
   * to change. Use at your own risk.
   */
  __parse: generateParseTree,
  /**
   * Renders the given LaTeX into a MathML internal DOM tree
   * representation, without flattening that representation to a string.
   *
   * NOTE: This method is not currently recommended for public use.
   * The internal tree representation is unstable and is very likely
   * to change. Use at your own risk.
   */
  __renderToMathMLTree: renderToMathMLTree,
  /**
   * adds a new symbol to builtin symbols table
   */
  __defineSymbol: defineSymbol,
  /**
   * adds a new macro to builtin macro list
   */
  __defineMacro: defineMacro
};

"use strict";
const coordinate = [0, 0];
const lastElement = [null];
const saveCoordinate = (e) => {
  coordinate[0] = e?.clientX ?? coordinate[0];
  coordinate[1] = e?.clientY ?? coordinate[1];
};
const ext = typeof chrome != "undefined" ? chrome : typeof browser != "undefined" ? browser : self;
const dummy = (unsafe) => {
  return (unsafe?.trim()?.replace?.(/&amp;/g, "&")?.replace?.(/&lt;/g, "<")?.replace?.(/&gt;/g, ">")?.replace?.(/&quot;/g, '"')?.replace?.(/&nbsp;/g, " ")?.replace?.(/&#39;/g, "'") || unsafe)?.trim?.();
};
const weak_dummy = (unsafe) => {
  return (unsafe?.trim()?.replace?.(/&amp;/g, "&")?.replace?.(/&nbsp;/g, " ")?.replace?.(/&quot;/g, '"')?.replace?.(/&#39;/g, "'") || unsafe)?.trim?.();
};
const tryXML = (unsafe) => {
  try {
    if (typeof DOMParser === "undefined") {
      return (dummy(unsafe) || unsafe)?.trim?.();
    }
    const doc = new DOMParser().parseFromString(unsafe?.trim?.(), "text/xml");
    if (doc?.querySelector("parsererror") || !doc) {
      return (dummy(unsafe) || unsafe)?.trim?.();
    }
    ;
    return (weak_dummy(doc?.documentElement?.textContent) || dummy(unsafe) || unsafe)?.trim?.();
  } catch {
    return (dummy(unsafe) || unsafe)?.trim?.();
  }
};
const serialize = (xml) => {
  try {
    if (typeof XMLSerializer === "undefined") {
      return (typeof xml == "string" ? xml : xml?.outerHTML || "")?.trim?.();
    }
    const s = new XMLSerializer();
    return (typeof xml == "string" ? xml : xml?.outerHTML || s.serializeToString(xml))?.trim?.();
  } catch {
    return (typeof xml == "string" ? xml : xml?.outerHTML || "")?.trim?.();
  }
};
const escapeML = (unsafe) => {
  if (/&amp;|&quot;|&#39;|&lt;|&gt;|&nbsp;/.test(unsafe.trim())) {
    if (unsafe?.trim()?.startsWith?.("&lt;") && unsafe?.trim()?.endsWith?.("&gt;")) {
      return (tryXML(unsafe) || dummy(unsafe) || unsafe)?.trim?.();
    }
    if (!(unsafe?.trim()?.startsWith?.("<") && unsafe?.trim()?.endsWith?.(">"))) {
      return (dummy(unsafe) || unsafe)?.trim?.();
    }
  }
  return (weak_dummy(unsafe) || unsafe)?.trim?.();
};
const extractFromAnnotation = (math) => {
  if (!math.matches(".katex math, math.katex")) return "";
  const A = math?.querySelector?.("annotation");
  const C = (A.textContent || "")?.trim?.();
  const Q = (C.replace(/^["'](.+(?=["']$))["']$/, "$1") || (C || ""))?.trim?.();
  return (escapeML(Q) || Q)?.trim?.();
};
const bySelector = (target, selector) => {
  return target.matches(selector) ? target : target.closest(selector) ?? target.querySelector(selector);
};
const getContainerFromTextSelection = (target = document.body) => {
  const sel = globalThis?.getSelection && globalThis?.getSelection?.();
  if (sel && sel.rangeCount > 0 && !sel.isCollapsed) {
    const range = sel.getRangeAt(0);
    const node = range.commonAncestorContainer;
    if (node.nodeType == Node.ELEMENT_NODE || node instanceof HTMLElement) return node;
    if (node.parentElement) return node.parentElement;
  }
  const element = lastElement?.[0] || document.elementFromPoint(...coordinate);
  if (element) return element;
  return target;
};
if (typeof document !== "undefined") {
  try {
    document.addEventListener("pointerup", saveCoordinate, { passive: true });
    document.addEventListener("pointerdown", saveCoordinate, { passive: true });
    document.addEventListener("click", saveCoordinate, { passive: true });
    document.addEventListener("contextmenu", (e) => {
      saveCoordinate(e);
      lastElement[0] = e?.target || lastElement[0];
    }, { passive: true });
  } catch {
  }
}

var bundle_min$2 = {exports: {}};

var bundle_min$1 = bundle_min$2.exports;

var hasRequiredBundle_min;

function requireBundle_min () {
	if (hasRequiredBundle_min) return bundle_min$2.exports;
	hasRequiredBundle_min = 1;
	(function (module, exports$1) {
		!function(e,t){"object"=='object'&&"object"=='object'?module.exports=t():"function"==typeof undefined&&undefined.amd?undefined([],t):"object"=='object'?exports$1.MathMLToLaTeX=t():e.MathMLToLaTeX=t();}(bundle_min$1,(()=>(()=>{var e={4582:(e,t)=>{"use strict";function r(e,t){return void 0===t&&(t=Object),t&&"function"==typeof t.freeze?t.freeze(e):e}var a=r({HTML:"text/html",isHTML:function(e){return e===a.HTML},XML_APPLICATION:"application/xml",XML_TEXT:"text/xml",XML_XHTML_APPLICATION:"application/xhtml+xml",XML_SVG_IMAGE:"image/svg+xml"}),n=r({HTML:"http://www.w3.org/1999/xhtml",isHTML:function(e){return e===n.HTML},SVG:"http://www.w3.org/2000/svg",XML:"http://www.w3.org/XML/1998/namespace",XMLNS:"http://www.w3.org/2000/xmlns/"});t.assign=function(e,t){if(null===e||"object"!=typeof e)throw new TypeError("target is not an object");for(var r in t)Object.prototype.hasOwnProperty.call(t,r)&&(e[r]=t[r]);return e},t.find=function(e,t,r){if(void 0===r&&(r=Array.prototype),e&&"function"==typeof r.find)return r.find.call(e,t);for(var a=0;a<e.length;a++)if(Object.prototype.hasOwnProperty.call(e,a)){var n=e[a];if(t.call(void 0,n,a,e))return n}},t.freeze=r,t.MIME_TYPE=a,t.NAMESPACE=n;},5752:(e,t,r)=>{var a=r(4582),n=r(4722),o=r(6559),i=r(4466),s=n.DOMImplementation,l=a.NAMESPACE,c=i.ParseError,u=i.XMLReader;function h(e){return e.replace(/\r[\n\u0085]/g,"\n").replace(/[\r\u0085\u2028]/g,"\n")}function d(e){this.options=e||{locator:{}};}function m(){this.cdata=!1;}function p(e,t){t.lineNumber=e.lineNumber,t.columnNumber=e.columnNumber;}function f(e){if(e)return "\n@"+(e.systemId||"")+"#[line:"+e.lineNumber+",col:"+e.columnNumber+"]"}function x(e,t,r){return "string"==typeof e?e.substr(t,r):e.length>=t+r||t?new java.lang.String(e,t,r)+"":e}function g(e,t){e.currentElement?e.currentElement.appendChild(t):e.doc.appendChild(t);}d.prototype.parseFromString=function(e,t){var r=this.options,a=new u,n=r.domBuilder||new m,i=r.errorHandler,s=r.locator,c=r.xmlns||{},d=/\/x?html?$/.test(t),p=d?o.HTML_ENTITIES:o.XML_ENTITIES;s&&n.setDocumentLocator(s),a.errorHandler=function(e,t,r){if(!e){if(t instanceof m)return t;e=t;}var a={},n=e instanceof Function;function o(t){var o=e[t];!o&&n&&(o=2==e.length?function(r){e(t,r);}:e),a[t]=o&&function(e){o("[xmldom "+t+"]\t"+e+f(r));}||function(){};}return r=r||{},o("warning"),o("error"),o("fatalError"),a}(i,n,s),a.domBuilder=r.domBuilder||n,d&&(c[""]=l.HTML),c.xml=c.xml||l.XML;var x=r.normalizeLineEndings||h;return e&&"string"==typeof e?a.parse(x(e),c,p):a.errorHandler.error("invalid doc source"),n.doc},m.prototype={startDocument:function(){this.doc=(new s).createDocument(null,null,null),this.locator&&(this.doc.documentURI=this.locator.systemId);},startElement:function(e,t,r,a){var n=this.doc,o=n.createElementNS(e,r||t),i=a.length;g(this,o),this.currentElement=o,this.locator&&p(this.locator,o);for(var s=0;s<i;s++){e=a.getURI(s);var l=a.getValue(s),c=(r=a.getQName(s),n.createAttributeNS(e,r));this.locator&&p(a.getLocator(s),c),c.value=c.nodeValue=l,o.setAttributeNode(c);}},endElement:function(e,t,r){var a=this.currentElement;a.tagName,this.currentElement=a.parentNode;},startPrefixMapping:function(e,t){},endPrefixMapping:function(e){},processingInstruction:function(e,t){var r=this.doc.createProcessingInstruction(e,t);this.locator&&p(this.locator,r),g(this,r);},ignorableWhitespace:function(e,t,r){},characters:function(e,t,r){if(e=x.apply(this,arguments)){if(this.cdata)var a=this.doc.createCDATASection(e);else a=this.doc.createTextNode(e);this.currentElement?this.currentElement.appendChild(a):/^\s*$/.test(e)&&this.doc.appendChild(a),this.locator&&p(this.locator,a);}},skippedEntity:function(e){},endDocument:function(){this.doc.normalize();},setDocumentLocator:function(e){(this.locator=e)&&(e.lineNumber=0);},comment:function(e,t,r){e=x.apply(this,arguments);var a=this.doc.createComment(e);this.locator&&p(this.locator,a),g(this,a);},startCDATA:function(){this.cdata=!0;},endCDATA:function(){this.cdata=!1;},startDTD:function(e,t,r){var a=this.doc.implementation;if(a&&a.createDocumentType){var n=a.createDocumentType(e,t,r);this.locator&&p(this.locator,n),g(this,n),this.doc.doctype=n;}},warning:function(e){console.warn("[xmldom warning]\t"+e,f(this.locator));},error:function(e){console.error("[xmldom error]\t"+e,f(this.locator));},fatalError:function(e){throw new c(e,this.locator)}},"endDTD,startEntity,endEntity,attributeDecl,elementDecl,externalEntityDecl,internalEntityDecl,resolveEntity,getExternalSubset,notationDecl,unparsedEntityDecl".replace(/\w+/g,(function(e){m.prototype[e]=function(){return null};})),t.DOMParser=d;},4722:(e,t,r)=>{var a=r(4582),n=a.find,o=a.NAMESPACE;function i(e){return ""!==e}function s(e,t){return e.hasOwnProperty(t)||(e[t]=!0),e}function l(e){if(!e)return [];var t=function(e){return e?e.split(/[\t\n\f\r ]+/).filter(i):[]}(e);return Object.keys(t.reduce(s,{}))}function c(e,t){for(var r in e)Object.prototype.hasOwnProperty.call(e,r)&&(t[r]=e[r]);}function u(e,t){var r=e.prototype;if(!(r instanceof t)){function a(){}a.prototype=t.prototype,c(r,a=new a),e.prototype=r=a;}r.constructor!=e&&("function"!=typeof e&&console.error("unknown Class:"+e),r.constructor=e);}var h={},d=h.ELEMENT_NODE=1,m=h.ATTRIBUTE_NODE=2,p=h.TEXT_NODE=3,f=h.CDATA_SECTION_NODE=4,x=h.ENTITY_REFERENCE_NODE=5,g=h.ENTITY_NODE=6,w=h.PROCESSING_INSTRUCTION_NODE=7,b=h.COMMENT_NODE=8,v=h.DOCUMENT_NODE=9,C=h.DOCUMENT_TYPE_NODE=10,A=h.DOCUMENT_FRAGMENT_NODE=11,E=h.NOTATION_NODE=12,y={},_={},q=(y.INDEX_SIZE_ERR=(_[1]="Index size error",1),y.DOMSTRING_SIZE_ERR=(_[2]="DOMString size error",2),y.HIERARCHY_REQUEST_ERR=(_[3]="Hierarchy request error",3)),D=(y.WRONG_DOCUMENT_ERR=(_[4]="Wrong document",4),y.INVALID_CHARACTER_ERR=(_[5]="Invalid character",5),y.NO_DATA_ALLOWED_ERR=(_[6]="No data allowed",6),y.NO_MODIFICATION_ALLOWED_ERR=(_[7]="No modification allowed",7),y.NOT_FOUND_ERR=(_[8]="Not found",8)),M=(y.NOT_SUPPORTED_ERR=(_[9]="Not supported",9),y.INUSE_ATTRIBUTE_ERR=(_[10]="Attribute in use",10));function T(e,t){if(t instanceof Error)var r=t;else r=this,Error.call(this,_[e]),this.message=_[e],Error.captureStackTrace&&Error.captureStackTrace(this,T);return r.code=e,t&&(this.message=this.message+": "+t),r}function N(){}function O(e,t){this._node=e,this._refresh=t,L(this);}function L(e){var t=e._node._inc||e._node.ownerDocument._inc;if(e._inc!==t){var r=e._refresh(e._node);if(we(e,"length",r.length),!e.$$length||r.length<e.$$length)for(var a=r.length;a in e;a++)Object.prototype.hasOwnProperty.call(e,a)&&delete e[a];c(r,e),e._inc=t;}}function B(){}function S(e,t){for(var r=e.length;r--;)if(e[r]===t)return r}function F(e,t,r,a){if(a?t[S(t,a)]=r:t[t.length++]=r,e){r.ownerElement=e;var n=e.ownerDocument;n&&(a&&V(n,e,a),function(e,t,r){e&&e._inc++,r.namespaceURI===o.XMLNS&&(t._nsMap[r.prefix?r.localName:""]=r.value);}(n,e,r));}}function P(e,t,r){var a=S(t,r);if(!(a>=0))throw new T(D,new Error(e.tagName+"@"+r));for(var n=t.length-1;a<n;)t[a]=t[++a];if(t.length=n,e){var o=e.ownerDocument;o&&(V(o,e,r),r.ownerElement=null);}}function k(){}function R(){}function I(e){return ("<"==e?"&lt;":">"==e&&"&gt;")||"&"==e&&"&amp;"||'"'==e&&"&quot;"||"&#"+e.charCodeAt()+";"}function j(e,t){if(t(e))return !0;if(e=e.firstChild)do{if(j(e,t))return !0}while(e=e.nextSibling)}function U(){this.ownerDocument=this;}function V(e,t,r,a){e&&e._inc++,r.namespaceURI===o.XMLNS&&delete t._nsMap[r.prefix?r.localName:""];}function G(e,t,r){if(e&&e._inc){e._inc++;var a=t.childNodes;if(r)a[a.length++]=r;else {for(var n=t.firstChild,o=0;n;)a[o++]=n,n=n.nextSibling;a.length=o,delete a[a.length];}}}function $(e,t){var r=t.previousSibling,a=t.nextSibling;return r?r.nextSibling=a:e.firstChild=a,a?a.previousSibling=r:e.lastChild=r,t.parentNode=null,t.previousSibling=null,t.nextSibling=null,G(e.ownerDocument,e),t}function X(e){return e&&e.nodeType===R.DOCUMENT_TYPE_NODE}function H(e){return e&&e.nodeType===R.ELEMENT_NODE}function W(e){return e&&e.nodeType===R.TEXT_NODE}function z(e,t){var r=e.childNodes||[];if(n(r,H)||X(t))return !1;var a=n(r,X);return !(t&&a&&r.indexOf(a)>r.indexOf(t))}function Y(e,t){var r=e.childNodes||[];if(n(r,(function(e){return H(e)&&e!==t})))return !1;var a=n(r,X);return !(t&&a&&r.indexOf(a)>r.indexOf(t))}function J(e,t,r){var a=e.childNodes||[],o=t.childNodes||[];if(t.nodeType===R.DOCUMENT_FRAGMENT_NODE){var i=o.filter(H);if(i.length>1||n(o,W))throw new T(q,"More than one element or text in fragment");if(1===i.length&&!z(e,r))throw new T(q,"Element in fragment can not be inserted before doctype")}if(H(t)&&!z(e,r))throw new T(q,"Only one element can be added and only after doctype");if(X(t)){if(n(a,X))throw new T(q,"Only one doctype is allowed");var s=n(a,H);if(r&&a.indexOf(s)<a.indexOf(r))throw new T(q,"Doctype can only be inserted before an element");if(!r&&s)throw new T(q,"Doctype can not be appended since element is present")}}function Z(e,t,r){var a=e.childNodes||[],o=t.childNodes||[];if(t.nodeType===R.DOCUMENT_FRAGMENT_NODE){var i=o.filter(H);if(i.length>1||n(o,W))throw new T(q,"More than one element or text in fragment");if(1===i.length&&!Y(e,r))throw new T(q,"Element in fragment can not be inserted before doctype")}if(H(t)&&!Y(e,r))throw new T(q,"Only one element can be added and only after doctype");if(X(t)){if(n(a,(function(e){return X(e)&&e!==r})))throw new T(q,"Only one doctype is allowed");var s=n(a,H);if(r&&a.indexOf(s)<a.indexOf(r))throw new T(q,"Doctype can only be inserted before an element")}}function Q(e,t,r,a){((function(e,t,r){if(!function(e){return e&&(e.nodeType===R.DOCUMENT_NODE||e.nodeType===R.DOCUMENT_FRAGMENT_NODE||e.nodeType===R.ELEMENT_NODE)}(e))throw new T(q,"Unexpected parent node type "+e.nodeType);if(r&&r.parentNode!==e)throw new T(D,"child not in parent");if(!function(e){return e&&(H(e)||W(e)||X(e)||e.nodeType===R.DOCUMENT_FRAGMENT_NODE||e.nodeType===R.COMMENT_NODE||e.nodeType===R.PROCESSING_INSTRUCTION_NODE)}(t)||X(t)&&e.nodeType!==R.DOCUMENT_NODE)throw new T(q,"Unexpected node type "+t.nodeType+" for parent node type "+e.nodeType)}))(e,t,r),e.nodeType===R.DOCUMENT_NODE&&(a||J)(e,t,r);var n=t.parentNode;if(n&&n.removeChild(t),t.nodeType===A){var o=t.firstChild;if(null==o)return t;var i=t.lastChild;}else o=i=t;var s=r?r.previousSibling:e.lastChild;o.previousSibling=s,i.nextSibling=r,s?s.nextSibling=o:e.firstChild=o,null==r?e.lastChild=i:r.previousSibling=i;do{o.parentNode=e;}while(o!==i&&(o=o.nextSibling));return G(e.ownerDocument||e,e),t.nodeType==A&&(t.firstChild=t.lastChild=null),t}function K(){this._nsMap={};}function ee(){}function te(){}function re(){}function ae(){}function ne(){}function oe(){}function ie(){}function se(){}function le(){}function ce(){}function ue(){}function he(){}function de(e,t){var r=[],a=9==this.nodeType&&this.documentElement||this,n=a.prefix,o=a.namespaceURI;if(o&&null==n&&null==(n=a.lookupPrefix(o)))var i=[{namespace:o,prefix:null}];return fe(this,r,e,t,i),r.join("")}function me(e,t,r){var a=e.prefix||"",n=e.namespaceURI;if(!n)return !1;if("xml"===a&&n===o.XML||n===o.XMLNS)return !1;for(var i=r.length;i--;){var s=r[i];if(s.prefix===a)return s.namespace!==n}return !0}function pe(e,t,r){e.push(" ",t,'="',r.replace(/[<>&"\t\n\r]/g,I),'"');}function fe(e,t,r,a,n){if(n||(n=[]),a){if(!(e=a(e)))return;if("string"==typeof e)return void t.push(e)}switch(e.nodeType){case d:var i=e.attributes,s=i.length,l=e.firstChild,c=e.tagName,u=c;if(!(r=o.isHTML(e.namespaceURI)||r)&&!e.prefix&&e.namespaceURI){for(var h,g=0;g<i.length;g++)if("xmlns"===i.item(g).name){h=i.item(g).value;break}if(!h)for(var E=n.length-1;E>=0;E--)if(""===(y=n[E]).prefix&&y.namespace===e.namespaceURI){h=y.namespace;break}if(h!==e.namespaceURI)for(E=n.length-1;E>=0;E--){var y;if((y=n[E]).namespace===e.namespaceURI){y.prefix&&(u=y.prefix+":"+c);break}}}t.push("<",u);for(var _=0;_<s;_++)"xmlns"==(q=i.item(_)).prefix?n.push({prefix:q.localName,namespace:q.value}):"xmlns"==q.nodeName&&n.push({prefix:"",namespace:q.value});for(_=0;_<s;_++){var q,D,M;me(q=i.item(_),0,n)&&(pe(t,(D=q.prefix||"")?"xmlns:"+D:"xmlns",M=q.namespaceURI),n.push({prefix:D,namespace:M})),fe(q,t,r,a,n);}if(c===u&&me(e,0,n)&&(pe(t,(D=e.prefix||"")?"xmlns:"+D:"xmlns",M=e.namespaceURI),n.push({prefix:D,namespace:M})),l||r&&!/^(?:meta|link|img|br|hr|input)$/i.test(c)){if(t.push(">"),r&&/^script$/i.test(c))for(;l;)l.data?t.push(l.data):fe(l,t,r,a,n.slice()),l=l.nextSibling;else for(;l;)fe(l,t,r,a,n.slice()),l=l.nextSibling;t.push("</",u,">");}else t.push("/>");return;case v:case A:for(l=e.firstChild;l;)fe(l,t,r,a,n.slice()),l=l.nextSibling;return;case m:return pe(t,e.name,e.value);case p:return t.push(e.data.replace(/[<&>]/g,I));case f:return t.push("<![CDATA[",e.data,"]]>");case b:return t.push("\x3c!--",e.data,"--\x3e");case C:var T=e.publicId,N=e.systemId;if(t.push("<!DOCTYPE ",e.name),T)t.push(" PUBLIC ",T),N&&"."!=N&&t.push(" ",N),t.push(">");else if(N&&"."!=N)t.push(" SYSTEM ",N,">");else {var O=e.internalSubset;O&&t.push(" [",O,"]"),t.push(">");}return;case w:return t.push("<?",e.target," ",e.data,"?>");case x:return t.push("&",e.nodeName,";");default:t.push("??",e.nodeName);}}function xe(e,t,r){var a;switch(t.nodeType){case d:(a=t.cloneNode(!1)).ownerDocument=e;case A:break;case m:r=!0;}if(a||(a=t.cloneNode(!1)),a.ownerDocument=e,a.parentNode=null,r)for(var n=t.firstChild;n;)a.appendChild(xe(e,n,r)),n=n.nextSibling;return a}function ge(e,t,r){var a=new t.constructor;for(var n in t)if(Object.prototype.hasOwnProperty.call(t,n)){var o=t[n];"object"!=typeof o&&o!=a[n]&&(a[n]=o);}switch(t.childNodes&&(a.childNodes=new N),a.ownerDocument=e,a.nodeType){case d:var i=t.attributes,s=a.attributes=new B,l=i.length;s._ownerElement=a;for(var c=0;c<l;c++)a.setAttributeNode(ge(e,i.item(c),!0));break;case m:r=!0;}if(r)for(var u=t.firstChild;u;)a.appendChild(ge(e,u,r)),u=u.nextSibling;return a}function we(e,t,r){e[t]=r;}y.INVALID_STATE_ERR=(_[11]="Invalid state",11),y.SYNTAX_ERR=(_[12]="Syntax error",12),y.INVALID_MODIFICATION_ERR=(_[13]="Invalid modification",13),y.NAMESPACE_ERR=(_[14]="Invalid namespace",14),y.INVALID_ACCESS_ERR=(_[15]="Invalid access",15),T.prototype=Error.prototype,c(y,T),N.prototype={length:0,item:function(e){return e>=0&&e<this.length?this[e]:null},toString:function(e,t){for(var r=[],a=0;a<this.length;a++)fe(this[a],r,e,t);return r.join("")},filter:function(e){return Array.prototype.filter.call(this,e)},indexOf:function(e){return Array.prototype.indexOf.call(this,e)}},O.prototype.item=function(e){return L(this),this[e]||null},u(O,N),B.prototype={length:0,item:N.prototype.item,getNamedItem:function(e){for(var t=this.length;t--;){var r=this[t];if(r.nodeName==e)return r}},setNamedItem:function(e){var t=e.ownerElement;if(t&&t!=this._ownerElement)throw new T(M);var r=this.getNamedItem(e.nodeName);return F(this._ownerElement,this,e,r),r},setNamedItemNS:function(e){var t,r=e.ownerElement;if(r&&r!=this._ownerElement)throw new T(M);return t=this.getNamedItemNS(e.namespaceURI,e.localName),F(this._ownerElement,this,e,t),t},removeNamedItem:function(e){var t=this.getNamedItem(e);return P(this._ownerElement,this,t),t},removeNamedItemNS:function(e,t){var r=this.getNamedItemNS(e,t);return P(this._ownerElement,this,r),r},getNamedItemNS:function(e,t){for(var r=this.length;r--;){var a=this[r];if(a.localName==t&&a.namespaceURI==e)return a}return null}},k.prototype={hasFeature:function(e,t){return !0},createDocument:function(e,t,r){var a=new U;if(a.implementation=this,a.childNodes=new N,a.doctype=r||null,r&&a.appendChild(r),t){var n=a.createElementNS(e,t);a.appendChild(n);}return a},createDocumentType:function(e,t,r){var a=new oe;return a.name=e,a.nodeName=e,a.publicId=t||"",a.systemId=r||"",a}},R.prototype={firstChild:null,lastChild:null,previousSibling:null,nextSibling:null,attributes:null,parentNode:null,childNodes:null,ownerDocument:null,nodeValue:null,namespaceURI:null,prefix:null,localName:null,insertBefore:function(e,t){return Q(this,e,t)},replaceChild:function(e,t){Q(this,e,t,Z),t&&this.removeChild(t);},removeChild:function(e){return $(this,e)},appendChild:function(e){return this.insertBefore(e,null)},hasChildNodes:function(){return null!=this.firstChild},cloneNode:function(e){return ge(this.ownerDocument||this,this,e)},normalize:function(){for(var e=this.firstChild;e;){var t=e.nextSibling;t&&t.nodeType==p&&e.nodeType==p?(this.removeChild(t),e.appendData(t.data)):(e.normalize(),e=t);}},isSupported:function(e,t){return this.ownerDocument.implementation.hasFeature(e,t)},hasAttributes:function(){return this.attributes.length>0},lookupPrefix:function(e){for(var t=this;t;){var r=t._nsMap;if(r)for(var a in r)if(Object.prototype.hasOwnProperty.call(r,a)&&r[a]===e)return a;t=t.nodeType==m?t.ownerDocument:t.parentNode;}return null},lookupNamespaceURI:function(e){for(var t=this;t;){var r=t._nsMap;if(r&&Object.prototype.hasOwnProperty.call(r,e))return r[e];t=t.nodeType==m?t.ownerDocument:t.parentNode;}return null},isDefaultNamespace:function(e){return null==this.lookupPrefix(e)}},c(h,R),c(h,R.prototype),U.prototype={nodeName:"#document",nodeType:v,doctype:null,documentElement:null,_inc:1,insertBefore:function(e,t){if(e.nodeType==A){for(var r=e.firstChild;r;){var a=r.nextSibling;this.insertBefore(r,t),r=a;}return e}return Q(this,e,t),e.ownerDocument=this,null===this.documentElement&&e.nodeType===d&&(this.documentElement=e),e},removeChild:function(e){return this.documentElement==e&&(this.documentElement=null),$(this,e)},replaceChild:function(e,t){Q(this,e,t,Z),e.ownerDocument=this,t&&this.removeChild(t),H(e)&&(this.documentElement=e);},importNode:function(e,t){return xe(this,e,t)},getElementById:function(e){var t=null;return j(this.documentElement,(function(r){if(r.nodeType==d&&r.getAttribute("id")==e)return t=r,!0})),t},getElementsByClassName:function(e){var t=l(e);return new O(this,(function(r){var a=[];return t.length>0&&j(r.documentElement,(function(n){if(n!==r&&n.nodeType===d){var o=n.getAttribute("class");if(o){var i=e===o;if(!i){var s=l(o);i=t.every((c=s,function(e){return c&&-1!==c.indexOf(e)}));}i&&a.push(n);}}var c;})),a}))},createElement:function(e){var t=new K;return t.ownerDocument=this,t.nodeName=e,t.tagName=e,t.localName=e,t.childNodes=new N,(t.attributes=new B)._ownerElement=t,t},createDocumentFragment:function(){var e=new ce;return e.ownerDocument=this,e.childNodes=new N,e},createTextNode:function(e){var t=new re;return t.ownerDocument=this,t.appendData(e),t},createComment:function(e){var t=new ae;return t.ownerDocument=this,t.appendData(e),t},createCDATASection:function(e){var t=new ne;return t.ownerDocument=this,t.appendData(e),t},createProcessingInstruction:function(e,t){var r=new ue;return r.ownerDocument=this,r.tagName=r.nodeName=r.target=e,r.nodeValue=r.data=t,r},createAttribute:function(e){var t=new ee;return t.ownerDocument=this,t.name=e,t.nodeName=e,t.localName=e,t.specified=!0,t},createEntityReference:function(e){var t=new le;return t.ownerDocument=this,t.nodeName=e,t},createElementNS:function(e,t){var r=new K,a=t.split(":"),n=r.attributes=new B;return r.childNodes=new N,r.ownerDocument=this,r.nodeName=t,r.tagName=t,r.namespaceURI=e,2==a.length?(r.prefix=a[0],r.localName=a[1]):r.localName=t,n._ownerElement=r,r},createAttributeNS:function(e,t){var r=new ee,a=t.split(":");return r.ownerDocument=this,r.nodeName=t,r.name=t,r.namespaceURI=e,r.specified=!0,2==a.length?(r.prefix=a[0],r.localName=a[1]):r.localName=t,r}},u(U,R),K.prototype={nodeType:d,hasAttribute:function(e){return null!=this.getAttributeNode(e)},getAttribute:function(e){var t=this.getAttributeNode(e);return t&&t.value||""},getAttributeNode:function(e){return this.attributes.getNamedItem(e)},setAttribute:function(e,t){var r=this.ownerDocument.createAttribute(e);r.value=r.nodeValue=""+t,this.setAttributeNode(r);},removeAttribute:function(e){var t=this.getAttributeNode(e);t&&this.removeAttributeNode(t);},appendChild:function(e){return e.nodeType===A?this.insertBefore(e,null):function(e,t){return t.parentNode&&t.parentNode.removeChild(t),t.parentNode=e,t.previousSibling=e.lastChild,t.nextSibling=null,t.previousSibling?t.previousSibling.nextSibling=t:e.firstChild=t,e.lastChild=t,G(e.ownerDocument,e,t),t}(this,e)},setAttributeNode:function(e){return this.attributes.setNamedItem(e)},setAttributeNodeNS:function(e){return this.attributes.setNamedItemNS(e)},removeAttributeNode:function(e){return this.attributes.removeNamedItem(e.nodeName)},removeAttributeNS:function(e,t){var r=this.getAttributeNodeNS(e,t);r&&this.removeAttributeNode(r);},hasAttributeNS:function(e,t){return null!=this.getAttributeNodeNS(e,t)},getAttributeNS:function(e,t){var r=this.getAttributeNodeNS(e,t);return r&&r.value||""},setAttributeNS:function(e,t,r){var a=this.ownerDocument.createAttributeNS(e,t);a.value=a.nodeValue=""+r,this.setAttributeNode(a);},getAttributeNodeNS:function(e,t){return this.attributes.getNamedItemNS(e,t)},getElementsByTagName:function(e){return new O(this,(function(t){var r=[];return j(t,(function(a){a===t||a.nodeType!=d||"*"!==e&&a.tagName!=e||r.push(a);})),r}))},getElementsByTagNameNS:function(e,t){return new O(this,(function(r){var a=[];return j(r,(function(n){n===r||n.nodeType!==d||"*"!==e&&n.namespaceURI!==e||"*"!==t&&n.localName!=t||a.push(n);})),a}))}},U.prototype.getElementsByTagName=K.prototype.getElementsByTagName,U.prototype.getElementsByTagNameNS=K.prototype.getElementsByTagNameNS,u(K,R),ee.prototype.nodeType=m,u(ee,R),te.prototype={data:"",substringData:function(e,t){return this.data.substring(e,e+t)},appendData:function(e){e=this.data+e,this.nodeValue=this.data=e,this.length=e.length;},insertData:function(e,t){this.replaceData(e,0,t);},appendChild:function(e){throw new Error(_[q])},deleteData:function(e,t){this.replaceData(e,t,"");},replaceData:function(e,t,r){r=this.data.substring(0,e)+r+this.data.substring(e+t),this.nodeValue=this.data=r,this.length=r.length;}},u(te,R),re.prototype={nodeName:"#text",nodeType:p,splitText:function(e){var t=this.data,r=t.substring(e);t=t.substring(0,e),this.data=this.nodeValue=t,this.length=t.length;var a=this.ownerDocument.createTextNode(r);return this.parentNode&&this.parentNode.insertBefore(a,this.nextSibling),a}},u(re,te),ae.prototype={nodeName:"#comment",nodeType:b},u(ae,te),ne.prototype={nodeName:"#cdata-section",nodeType:f},u(ne,te),oe.prototype.nodeType=C,u(oe,R),ie.prototype.nodeType=E,u(ie,R),se.prototype.nodeType=g,u(se,R),le.prototype.nodeType=x,u(le,R),ce.prototype.nodeName="#document-fragment",ce.prototype.nodeType=A,u(ce,R),ue.prototype.nodeType=w,u(ue,R),he.prototype.serializeToString=function(e,t,r){return de.call(e,t,r)},R.prototype.toString=de;try{if(Object.defineProperty){function be(e){switch(e.nodeType){case d:case A:var t=[];for(e=e.firstChild;e;)7!==e.nodeType&&8!==e.nodeType&&t.push(be(e)),e=e.nextSibling;return t.join("");default:return e.nodeValue}}Object.defineProperty(O.prototype,"length",{get:function(){return L(this),this.$$length}}),Object.defineProperty(R.prototype,"textContent",{get:function(){return be(this)},set:function(e){switch(this.nodeType){case d:case A:for(;this.firstChild;)this.removeChild(this.firstChild);(e||String(e))&&this.appendChild(this.ownerDocument.createTextNode(e));break;default:this.data=e,this.value=e,this.nodeValue=e;}}}),we=function(e,t,r){e["$$"+t]=r;};}}catch(ve){}t.DocumentType=oe,t.DOMException=T,t.DOMImplementation=k,t.Element=K,t.Node=R,t.NodeList=N,t.XMLSerializer=he;},6559:(e,t,r)=>{"use strict";var a=r(4582).freeze;t.XML_ENTITIES=a({amp:"&",apos:"'",gt:">",lt:"<",quot:'"'}),t.HTML_ENTITIES=a({Aacute:"Á",aacute:"á",Abreve:"Ă",abreve:"ă",ac:"∾",acd:"∿",acE:"∾̳",Acirc:"Â",acirc:"â",acute:"´",Acy:"А",acy:"а",AElig:"Æ",aelig:"æ",af:"⁡",Afr:"𝔄",afr:"𝔞",Agrave:"À",agrave:"à",alefsym:"ℵ",aleph:"ℵ",Alpha:"Α",alpha:"α",Amacr:"Ā",amacr:"ā",amalg:"⨿",AMP:"&",amp:"&",And:"⩓",and:"∧",andand:"⩕",andd:"⩜",andslope:"⩘",andv:"⩚",ang:"∠",ange:"⦤",angle:"∠",angmsd:"∡",angmsdaa:"⦨",angmsdab:"⦩",angmsdac:"⦪",angmsdad:"⦫",angmsdae:"⦬",angmsdaf:"⦭",angmsdag:"⦮",angmsdah:"⦯",angrt:"∟",angrtvb:"⊾",angrtvbd:"⦝",angsph:"∢",angst:"Å",angzarr:"⍼",Aogon:"Ą",aogon:"ą",Aopf:"𝔸",aopf:"𝕒",ap:"≈",apacir:"⩯",apE:"⩰",ape:"≊",apid:"≋",apos:"'",ApplyFunction:"⁡",approx:"≈",approxeq:"≊",Aring:"Å",aring:"å",Ascr:"𝒜",ascr:"𝒶",Assign:"≔",ast:"*",asymp:"≈",asympeq:"≍",Atilde:"Ã",atilde:"ã",Auml:"Ä",auml:"ä",awconint:"∳",awint:"⨑",backcong:"≌",backepsilon:"϶",backprime:"‵",backsim:"∽",backsimeq:"⋍",Backslash:"∖",Barv:"⫧",barvee:"⊽",Barwed:"⌆",barwed:"⌅",barwedge:"⌅",bbrk:"⎵",bbrktbrk:"⎶",bcong:"≌",Bcy:"Б",bcy:"б",bdquo:"„",becaus:"∵",Because:"∵",because:"∵",bemptyv:"⦰",bepsi:"϶",bernou:"ℬ",Bernoullis:"ℬ",Beta:"Β",beta:"β",beth:"ℶ",between:"≬",Bfr:"𝔅",bfr:"𝔟",bigcap:"⋂",bigcirc:"◯",bigcup:"⋃",bigodot:"⨀",bigoplus:"⨁",bigotimes:"⨂",bigsqcup:"⨆",bigstar:"★",bigtriangledown:"▽",bigtriangleup:"△",biguplus:"⨄",bigvee:"⋁",bigwedge:"⋀",bkarow:"⤍",blacklozenge:"⧫",blacksquare:"▪",blacktriangle:"▴",blacktriangledown:"▾",blacktriangleleft:"◂",blacktriangleright:"▸",blank:"␣",blk12:"▒",blk14:"░",blk34:"▓",block:"█",bne:"=⃥",bnequiv:"≡⃥",bNot:"⫭",bnot:"⌐",Bopf:"𝔹",bopf:"𝕓",bot:"⊥",bottom:"⊥",bowtie:"⋈",boxbox:"⧉",boxDL:"╗",boxDl:"╖",boxdL:"╕",boxdl:"┐",boxDR:"╔",boxDr:"╓",boxdR:"╒",boxdr:"┌",boxH:"═",boxh:"─",boxHD:"╦",boxHd:"╤",boxhD:"╥",boxhd:"┬",boxHU:"╩",boxHu:"╧",boxhU:"╨",boxhu:"┴",boxminus:"⊟",boxplus:"⊞",boxtimes:"⊠",boxUL:"╝",boxUl:"╜",boxuL:"╛",boxul:"┘",boxUR:"╚",boxUr:"╙",boxuR:"╘",boxur:"└",boxV:"║",boxv:"│",boxVH:"╬",boxVh:"╫",boxvH:"╪",boxvh:"┼",boxVL:"╣",boxVl:"╢",boxvL:"╡",boxvl:"┤",boxVR:"╠",boxVr:"╟",boxvR:"╞",boxvr:"├",bprime:"‵",Breve:"˘",breve:"˘",brvbar:"¦",Bscr:"ℬ",bscr:"𝒷",bsemi:"⁏",bsim:"∽",bsime:"⋍",bsol:"\\",bsolb:"⧅",bsolhsub:"⟈",bull:"•",bullet:"•",bump:"≎",bumpE:"⪮",bumpe:"≏",Bumpeq:"≎",bumpeq:"≏",Cacute:"Ć",cacute:"ć",Cap:"⋒",cap:"∩",capand:"⩄",capbrcup:"⩉",capcap:"⩋",capcup:"⩇",capdot:"⩀",CapitalDifferentialD:"ⅅ",caps:"∩︀",caret:"⁁",caron:"ˇ",Cayleys:"ℭ",ccaps:"⩍",Ccaron:"Č",ccaron:"č",Ccedil:"Ç",ccedil:"ç",Ccirc:"Ĉ",ccirc:"ĉ",Cconint:"∰",ccups:"⩌",ccupssm:"⩐",Cdot:"Ċ",cdot:"ċ",cedil:"¸",Cedilla:"¸",cemptyv:"⦲",cent:"¢",CenterDot:"·",centerdot:"·",Cfr:"ℭ",cfr:"𝔠",CHcy:"Ч",chcy:"ч",check:"✓",checkmark:"✓",Chi:"Χ",chi:"χ",cir:"○",circ:"ˆ",circeq:"≗",circlearrowleft:"↺",circlearrowright:"↻",circledast:"⊛",circledcirc:"⊚",circleddash:"⊝",CircleDot:"⊙",circledR:"®",circledS:"Ⓢ",CircleMinus:"⊖",CirclePlus:"⊕",CircleTimes:"⊗",cirE:"⧃",cire:"≗",cirfnint:"⨐",cirmid:"⫯",cirscir:"⧂",ClockwiseContourIntegral:"∲",CloseCurlyDoubleQuote:"”",CloseCurlyQuote:"’",clubs:"♣",clubsuit:"♣",Colon:"∷",colon:":",Colone:"⩴",colone:"≔",coloneq:"≔",comma:",",commat:"@",comp:"∁",compfn:"∘",complement:"∁",complexes:"ℂ",cong:"≅",congdot:"⩭",Congruent:"≡",Conint:"∯",conint:"∮",ContourIntegral:"∮",Copf:"ℂ",copf:"𝕔",coprod:"∐",Coproduct:"∐",COPY:"©",copy:"©",copysr:"℗",CounterClockwiseContourIntegral:"∳",crarr:"↵",Cross:"⨯",cross:"✗",Cscr:"𝒞",cscr:"𝒸",csub:"⫏",csube:"⫑",csup:"⫐",csupe:"⫒",ctdot:"⋯",cudarrl:"⤸",cudarrr:"⤵",cuepr:"⋞",cuesc:"⋟",cularr:"↶",cularrp:"⤽",Cup:"⋓",cup:"∪",cupbrcap:"⩈",CupCap:"≍",cupcap:"⩆",cupcup:"⩊",cupdot:"⊍",cupor:"⩅",cups:"∪︀",curarr:"↷",curarrm:"⤼",curlyeqprec:"⋞",curlyeqsucc:"⋟",curlyvee:"⋎",curlywedge:"⋏",curren:"¤",curvearrowleft:"↶",curvearrowright:"↷",cuvee:"⋎",cuwed:"⋏",cwconint:"∲",cwint:"∱",cylcty:"⌭",Dagger:"‡",dagger:"†",daleth:"ℸ",Darr:"↡",dArr:"⇓",darr:"↓",dash:"‐",Dashv:"⫤",dashv:"⊣",dbkarow:"⤏",dblac:"˝",Dcaron:"Ď",dcaron:"ď",Dcy:"Д",dcy:"д",DD:"ⅅ",dd:"ⅆ",ddagger:"‡",ddarr:"⇊",DDotrahd:"⤑",ddotseq:"⩷",deg:"°",Del:"∇",Delta:"Δ",delta:"δ",demptyv:"⦱",dfisht:"⥿",Dfr:"𝔇",dfr:"𝔡",dHar:"⥥",dharl:"⇃",dharr:"⇂",DiacriticalAcute:"´",DiacriticalDot:"˙",DiacriticalDoubleAcute:"˝",DiacriticalGrave:"`",DiacriticalTilde:"˜",diam:"⋄",Diamond:"⋄",diamond:"⋄",diamondsuit:"♦",diams:"♦",die:"¨",DifferentialD:"ⅆ",digamma:"ϝ",disin:"⋲",div:"÷",divide:"÷",divideontimes:"⋇",divonx:"⋇",DJcy:"Ђ",djcy:"ђ",dlcorn:"⌞",dlcrop:"⌍",dollar:"$",Dopf:"𝔻",dopf:"𝕕",Dot:"¨",dot:"˙",DotDot:"⃜",doteq:"≐",doteqdot:"≑",DotEqual:"≐",dotminus:"∸",dotplus:"∔",dotsquare:"⊡",doublebarwedge:"⌆",DoubleContourIntegral:"∯",DoubleDot:"¨",DoubleDownArrow:"⇓",DoubleLeftArrow:"⇐",DoubleLeftRightArrow:"⇔",DoubleLeftTee:"⫤",DoubleLongLeftArrow:"⟸",DoubleLongLeftRightArrow:"⟺",DoubleLongRightArrow:"⟹",DoubleRightArrow:"⇒",DoubleRightTee:"⊨",DoubleUpArrow:"⇑",DoubleUpDownArrow:"⇕",DoubleVerticalBar:"∥",DownArrow:"↓",Downarrow:"⇓",downarrow:"↓",DownArrowBar:"⤓",DownArrowUpArrow:"⇵",DownBreve:"̑",downdownarrows:"⇊",downharpoonleft:"⇃",downharpoonright:"⇂",DownLeftRightVector:"⥐",DownLeftTeeVector:"⥞",DownLeftVector:"↽",DownLeftVectorBar:"⥖",DownRightTeeVector:"⥟",DownRightVector:"⇁",DownRightVectorBar:"⥗",DownTee:"⊤",DownTeeArrow:"↧",drbkarow:"⤐",drcorn:"⌟",drcrop:"⌌",Dscr:"𝒟",dscr:"𝒹",DScy:"Ѕ",dscy:"ѕ",dsol:"⧶",Dstrok:"Đ",dstrok:"đ",dtdot:"⋱",dtri:"▿",dtrif:"▾",duarr:"⇵",duhar:"⥯",dwangle:"⦦",DZcy:"Џ",dzcy:"џ",dzigrarr:"⟿",Eacute:"É",eacute:"é",easter:"⩮",Ecaron:"Ě",ecaron:"ě",ecir:"≖",Ecirc:"Ê",ecirc:"ê",ecolon:"≕",Ecy:"Э",ecy:"э",eDDot:"⩷",Edot:"Ė",eDot:"≑",edot:"ė",ee:"ⅇ",efDot:"≒",Efr:"𝔈",efr:"𝔢",eg:"⪚",Egrave:"È",egrave:"è",egs:"⪖",egsdot:"⪘",el:"⪙",Element:"∈",elinters:"⏧",ell:"ℓ",els:"⪕",elsdot:"⪗",Emacr:"Ē",emacr:"ē",empty:"∅",emptyset:"∅",EmptySmallSquare:"◻",emptyv:"∅",EmptyVerySmallSquare:"▫",emsp:" ",emsp13:" ",emsp14:" ",ENG:"Ŋ",eng:"ŋ",ensp:" ",Eogon:"Ę",eogon:"ę",Eopf:"𝔼",eopf:"𝕖",epar:"⋕",eparsl:"⧣",eplus:"⩱",epsi:"ε",Epsilon:"Ε",epsilon:"ε",epsiv:"ϵ",eqcirc:"≖",eqcolon:"≕",eqsim:"≂",eqslantgtr:"⪖",eqslantless:"⪕",Equal:"⩵",equals:"=",EqualTilde:"≂",equest:"≟",Equilibrium:"⇌",equiv:"≡",equivDD:"⩸",eqvparsl:"⧥",erarr:"⥱",erDot:"≓",Escr:"ℰ",escr:"ℯ",esdot:"≐",Esim:"⩳",esim:"≂",Eta:"Η",eta:"η",ETH:"Ð",eth:"ð",Euml:"Ë",euml:"ë",euro:"€",excl:"!",exist:"∃",Exists:"∃",expectation:"ℰ",ExponentialE:"ⅇ",exponentiale:"ⅇ",fallingdotseq:"≒",Fcy:"Ф",fcy:"ф",female:"♀",ffilig:"ﬃ",fflig:"ﬀ",ffllig:"ﬄ",Ffr:"𝔉",ffr:"𝔣",filig:"ﬁ",FilledSmallSquare:"◼",FilledVerySmallSquare:"▪",fjlig:"fj",flat:"♭",fllig:"ﬂ",fltns:"▱",fnof:"ƒ",Fopf:"𝔽",fopf:"𝕗",ForAll:"∀",forall:"∀",fork:"⋔",forkv:"⫙",Fouriertrf:"ℱ",fpartint:"⨍",frac12:"½",frac13:"⅓",frac14:"¼",frac15:"⅕",frac16:"⅙",frac18:"⅛",frac23:"⅔",frac25:"⅖",frac34:"¾",frac35:"⅗",frac38:"⅜",frac45:"⅘",frac56:"⅚",frac58:"⅝",frac78:"⅞",frasl:"⁄",frown:"⌢",Fscr:"ℱ",fscr:"𝒻",gacute:"ǵ",Gamma:"Γ",gamma:"γ",Gammad:"Ϝ",gammad:"ϝ",gap:"⪆",Gbreve:"Ğ",gbreve:"ğ",Gcedil:"Ģ",Gcirc:"Ĝ",gcirc:"ĝ",Gcy:"Г",gcy:"г",Gdot:"Ġ",gdot:"ġ",gE:"≧",ge:"≥",gEl:"⪌",gel:"⋛",geq:"≥",geqq:"≧",geqslant:"⩾",ges:"⩾",gescc:"⪩",gesdot:"⪀",gesdoto:"⪂",gesdotol:"⪄",gesl:"⋛︀",gesles:"⪔",Gfr:"𝔊",gfr:"𝔤",Gg:"⋙",gg:"≫",ggg:"⋙",gimel:"ℷ",GJcy:"Ѓ",gjcy:"ѓ",gl:"≷",gla:"⪥",glE:"⪒",glj:"⪤",gnap:"⪊",gnapprox:"⪊",gnE:"≩",gne:"⪈",gneq:"⪈",gneqq:"≩",gnsim:"⋧",Gopf:"𝔾",gopf:"𝕘",grave:"`",GreaterEqual:"≥",GreaterEqualLess:"⋛",GreaterFullEqual:"≧",GreaterGreater:"⪢",GreaterLess:"≷",GreaterSlantEqual:"⩾",GreaterTilde:"≳",Gscr:"𝒢",gscr:"ℊ",gsim:"≳",gsime:"⪎",gsiml:"⪐",Gt:"≫",GT:">",gt:">",gtcc:"⪧",gtcir:"⩺",gtdot:"⋗",gtlPar:"⦕",gtquest:"⩼",gtrapprox:"⪆",gtrarr:"⥸",gtrdot:"⋗",gtreqless:"⋛",gtreqqless:"⪌",gtrless:"≷",gtrsim:"≳",gvertneqq:"≩︀",gvnE:"≩︀",Hacek:"ˇ",hairsp:" ",half:"½",hamilt:"ℋ",HARDcy:"Ъ",hardcy:"ъ",hArr:"⇔",harr:"↔",harrcir:"⥈",harrw:"↭",Hat:"^",hbar:"ℏ",Hcirc:"Ĥ",hcirc:"ĥ",hearts:"♥",heartsuit:"♥",hellip:"…",hercon:"⊹",Hfr:"ℌ",hfr:"𝔥",HilbertSpace:"ℋ",hksearow:"⤥",hkswarow:"⤦",hoarr:"⇿",homtht:"∻",hookleftarrow:"↩",hookrightarrow:"↪",Hopf:"ℍ",hopf:"𝕙",horbar:"―",HorizontalLine:"─",Hscr:"ℋ",hscr:"𝒽",hslash:"ℏ",Hstrok:"Ħ",hstrok:"ħ",HumpDownHump:"≎",HumpEqual:"≏",hybull:"⁃",hyphen:"‐",Iacute:"Í",iacute:"í",ic:"⁣",Icirc:"Î",icirc:"î",Icy:"И",icy:"и",Idot:"İ",IEcy:"Е",iecy:"е",iexcl:"¡",iff:"⇔",Ifr:"ℑ",ifr:"𝔦",Igrave:"Ì",igrave:"ì",ii:"ⅈ",iiiint:"⨌",iiint:"∭",iinfin:"⧜",iiota:"℩",IJlig:"Ĳ",ijlig:"ĳ",Im:"ℑ",Imacr:"Ī",imacr:"ī",image:"ℑ",ImaginaryI:"ⅈ",imagline:"ℐ",imagpart:"ℑ",imath:"ı",imof:"⊷",imped:"Ƶ",Implies:"⇒",in:"∈",incare:"℅",infin:"∞",infintie:"⧝",inodot:"ı",Int:"∬",int:"∫",intcal:"⊺",integers:"ℤ",Integral:"∫",intercal:"⊺",Intersection:"⋂",intlarhk:"⨗",intprod:"⨼",InvisibleComma:"⁣",InvisibleTimes:"⁢",IOcy:"Ё",iocy:"ё",Iogon:"Į",iogon:"į",Iopf:"𝕀",iopf:"𝕚",Iota:"Ι",iota:"ι",iprod:"⨼",iquest:"¿",Iscr:"ℐ",iscr:"𝒾",isin:"∈",isindot:"⋵",isinE:"⋹",isins:"⋴",isinsv:"⋳",isinv:"∈",it:"⁢",Itilde:"Ĩ",itilde:"ĩ",Iukcy:"І",iukcy:"і",Iuml:"Ï",iuml:"ï",Jcirc:"Ĵ",jcirc:"ĵ",Jcy:"Й",jcy:"й",Jfr:"𝔍",jfr:"𝔧",jmath:"ȷ",Jopf:"𝕁",jopf:"𝕛",Jscr:"𝒥",jscr:"𝒿",Jsercy:"Ј",jsercy:"ј",Jukcy:"Є",jukcy:"є",Kappa:"Κ",kappa:"κ",kappav:"ϰ",Kcedil:"Ķ",kcedil:"ķ",Kcy:"К",kcy:"к",Kfr:"𝔎",kfr:"𝔨",kgreen:"ĸ",KHcy:"Х",khcy:"х",KJcy:"Ќ",kjcy:"ќ",Kopf:"𝕂",kopf:"𝕜",Kscr:"𝒦",kscr:"𝓀",lAarr:"⇚",Lacute:"Ĺ",lacute:"ĺ",laemptyv:"⦴",lagran:"ℒ",Lambda:"Λ",lambda:"λ",Lang:"⟪",lang:"⟨",langd:"⦑",langle:"⟨",lap:"⪅",Laplacetrf:"ℒ",laquo:"«",Larr:"↞",lArr:"⇐",larr:"←",larrb:"⇤",larrbfs:"⤟",larrfs:"⤝",larrhk:"↩",larrlp:"↫",larrpl:"⤹",larrsim:"⥳",larrtl:"↢",lat:"⪫",lAtail:"⤛",latail:"⤙",late:"⪭",lates:"⪭︀",lBarr:"⤎",lbarr:"⤌",lbbrk:"❲",lbrace:"{",lbrack:"[",lbrke:"⦋",lbrksld:"⦏",lbrkslu:"⦍",Lcaron:"Ľ",lcaron:"ľ",Lcedil:"Ļ",lcedil:"ļ",lceil:"⌈",lcub:"{",Lcy:"Л",lcy:"л",ldca:"⤶",ldquo:"“",ldquor:"„",ldrdhar:"⥧",ldrushar:"⥋",ldsh:"↲",lE:"≦",le:"≤",LeftAngleBracket:"⟨",LeftArrow:"←",Leftarrow:"⇐",leftarrow:"←",LeftArrowBar:"⇤",LeftArrowRightArrow:"⇆",leftarrowtail:"↢",LeftCeiling:"⌈",LeftDoubleBracket:"⟦",LeftDownTeeVector:"⥡",LeftDownVector:"⇃",LeftDownVectorBar:"⥙",LeftFloor:"⌊",leftharpoondown:"↽",leftharpoonup:"↼",leftleftarrows:"⇇",LeftRightArrow:"↔",Leftrightarrow:"⇔",leftrightarrow:"↔",leftrightarrows:"⇆",leftrightharpoons:"⇋",leftrightsquigarrow:"↭",LeftRightVector:"⥎",LeftTee:"⊣",LeftTeeArrow:"↤",LeftTeeVector:"⥚",leftthreetimes:"⋋",LeftTriangle:"⊲",LeftTriangleBar:"⧏",LeftTriangleEqual:"⊴",LeftUpDownVector:"⥑",LeftUpTeeVector:"⥠",LeftUpVector:"↿",LeftUpVectorBar:"⥘",LeftVector:"↼",LeftVectorBar:"⥒",lEg:"⪋",leg:"⋚",leq:"≤",leqq:"≦",leqslant:"⩽",les:"⩽",lescc:"⪨",lesdot:"⩿",lesdoto:"⪁",lesdotor:"⪃",lesg:"⋚︀",lesges:"⪓",lessapprox:"⪅",lessdot:"⋖",lesseqgtr:"⋚",lesseqqgtr:"⪋",LessEqualGreater:"⋚",LessFullEqual:"≦",LessGreater:"≶",lessgtr:"≶",LessLess:"⪡",lesssim:"≲",LessSlantEqual:"⩽",LessTilde:"≲",lfisht:"⥼",lfloor:"⌊",Lfr:"𝔏",lfr:"𝔩",lg:"≶",lgE:"⪑",lHar:"⥢",lhard:"↽",lharu:"↼",lharul:"⥪",lhblk:"▄",LJcy:"Љ",ljcy:"љ",Ll:"⋘",ll:"≪",llarr:"⇇",llcorner:"⌞",Lleftarrow:"⇚",llhard:"⥫",lltri:"◺",Lmidot:"Ŀ",lmidot:"ŀ",lmoust:"⎰",lmoustache:"⎰",lnap:"⪉",lnapprox:"⪉",lnE:"≨",lne:"⪇",lneq:"⪇",lneqq:"≨",lnsim:"⋦",loang:"⟬",loarr:"⇽",lobrk:"⟦",LongLeftArrow:"⟵",Longleftarrow:"⟸",longleftarrow:"⟵",LongLeftRightArrow:"⟷",Longleftrightarrow:"⟺",longleftrightarrow:"⟷",longmapsto:"⟼",LongRightArrow:"⟶",Longrightarrow:"⟹",longrightarrow:"⟶",looparrowleft:"↫",looparrowright:"↬",lopar:"⦅",Lopf:"𝕃",lopf:"𝕝",loplus:"⨭",lotimes:"⨴",lowast:"∗",lowbar:"_",LowerLeftArrow:"↙",LowerRightArrow:"↘",loz:"◊",lozenge:"◊",lozf:"⧫",lpar:"(",lparlt:"⦓",lrarr:"⇆",lrcorner:"⌟",lrhar:"⇋",lrhard:"⥭",lrm:"‎",lrtri:"⊿",lsaquo:"‹",Lscr:"ℒ",lscr:"𝓁",Lsh:"↰",lsh:"↰",lsim:"≲",lsime:"⪍",lsimg:"⪏",lsqb:"[",lsquo:"‘",lsquor:"‚",Lstrok:"Ł",lstrok:"ł",Lt:"≪",LT:"<",lt:"<",ltcc:"⪦",ltcir:"⩹",ltdot:"⋖",lthree:"⋋",ltimes:"⋉",ltlarr:"⥶",ltquest:"⩻",ltri:"◃",ltrie:"⊴",ltrif:"◂",ltrPar:"⦖",lurdshar:"⥊",luruhar:"⥦",lvertneqq:"≨︀",lvnE:"≨︀",macr:"¯",male:"♂",malt:"✠",maltese:"✠",Map:"⤅",map:"↦",mapsto:"↦",mapstodown:"↧",mapstoleft:"↤",mapstoup:"↥",marker:"▮",mcomma:"⨩",Mcy:"М",mcy:"м",mdash:"—",mDDot:"∺",measuredangle:"∡",MediumSpace:" ",Mellintrf:"ℳ",Mfr:"𝔐",mfr:"𝔪",mho:"℧",micro:"µ",mid:"∣",midast:"*",midcir:"⫰",middot:"·",minus:"−",minusb:"⊟",minusd:"∸",minusdu:"⨪",MinusPlus:"∓",mlcp:"⫛",mldr:"…",mnplus:"∓",models:"⊧",Mopf:"𝕄",mopf:"𝕞",mp:"∓",Mscr:"ℳ",mscr:"𝓂",mstpos:"∾",Mu:"Μ",mu:"μ",multimap:"⊸",mumap:"⊸",nabla:"∇",Nacute:"Ń",nacute:"ń",nang:"∠⃒",nap:"≉",napE:"⩰̸",napid:"≋̸",napos:"ŉ",napprox:"≉",natur:"♮",natural:"♮",naturals:"ℕ",nbsp:" ",nbump:"≎̸",nbumpe:"≏̸",ncap:"⩃",Ncaron:"Ň",ncaron:"ň",Ncedil:"Ņ",ncedil:"ņ",ncong:"≇",ncongdot:"⩭̸",ncup:"⩂",Ncy:"Н",ncy:"н",ndash:"–",ne:"≠",nearhk:"⤤",neArr:"⇗",nearr:"↗",nearrow:"↗",nedot:"≐̸",NegativeMediumSpace:"​",NegativeThickSpace:"​",NegativeThinSpace:"​",NegativeVeryThinSpace:"​",nequiv:"≢",nesear:"⤨",nesim:"≂̸",NestedGreaterGreater:"≫",NestedLessLess:"≪",NewLine:"\n",nexist:"∄",nexists:"∄",Nfr:"𝔑",nfr:"𝔫",ngE:"≧̸",nge:"≱",ngeq:"≱",ngeqq:"≧̸",ngeqslant:"⩾̸",nges:"⩾̸",nGg:"⋙̸",ngsim:"≵",nGt:"≫⃒",ngt:"≯",ngtr:"≯",nGtv:"≫̸",nhArr:"⇎",nharr:"↮",nhpar:"⫲",ni:"∋",nis:"⋼",nisd:"⋺",niv:"∋",NJcy:"Њ",njcy:"њ",nlArr:"⇍",nlarr:"↚",nldr:"‥",nlE:"≦̸",nle:"≰",nLeftarrow:"⇍",nleftarrow:"↚",nLeftrightarrow:"⇎",nleftrightarrow:"↮",nleq:"≰",nleqq:"≦̸",nleqslant:"⩽̸",nles:"⩽̸",nless:"≮",nLl:"⋘̸",nlsim:"≴",nLt:"≪⃒",nlt:"≮",nltri:"⋪",nltrie:"⋬",nLtv:"≪̸",nmid:"∤",NoBreak:"⁠",NonBreakingSpace:" ",Nopf:"ℕ",nopf:"𝕟",Not:"⫬",not:"¬",NotCongruent:"≢",NotCupCap:"≭",NotDoubleVerticalBar:"∦",NotElement:"∉",NotEqual:"≠",NotEqualTilde:"≂̸",NotExists:"∄",NotGreater:"≯",NotGreaterEqual:"≱",NotGreaterFullEqual:"≧̸",NotGreaterGreater:"≫̸",NotGreaterLess:"≹",NotGreaterSlantEqual:"⩾̸",NotGreaterTilde:"≵",NotHumpDownHump:"≎̸",NotHumpEqual:"≏̸",notin:"∉",notindot:"⋵̸",notinE:"⋹̸",notinva:"∉",notinvb:"⋷",notinvc:"⋶",NotLeftTriangle:"⋪",NotLeftTriangleBar:"⧏̸",NotLeftTriangleEqual:"⋬",NotLess:"≮",NotLessEqual:"≰",NotLessGreater:"≸",NotLessLess:"≪̸",NotLessSlantEqual:"⩽̸",NotLessTilde:"≴",NotNestedGreaterGreater:"⪢̸",NotNestedLessLess:"⪡̸",notni:"∌",notniva:"∌",notnivb:"⋾",notnivc:"⋽",NotPrecedes:"⊀",NotPrecedesEqual:"⪯̸",NotPrecedesSlantEqual:"⋠",NotReverseElement:"∌",NotRightTriangle:"⋫",NotRightTriangleBar:"⧐̸",NotRightTriangleEqual:"⋭",NotSquareSubset:"⊏̸",NotSquareSubsetEqual:"⋢",NotSquareSuperset:"⊐̸",NotSquareSupersetEqual:"⋣",NotSubset:"⊂⃒",NotSubsetEqual:"⊈",NotSucceeds:"⊁",NotSucceedsEqual:"⪰̸",NotSucceedsSlantEqual:"⋡",NotSucceedsTilde:"≿̸",NotSuperset:"⊃⃒",NotSupersetEqual:"⊉",NotTilde:"≁",NotTildeEqual:"≄",NotTildeFullEqual:"≇",NotTildeTilde:"≉",NotVerticalBar:"∤",npar:"∦",nparallel:"∦",nparsl:"⫽⃥",npart:"∂̸",npolint:"⨔",npr:"⊀",nprcue:"⋠",npre:"⪯̸",nprec:"⊀",npreceq:"⪯̸",nrArr:"⇏",nrarr:"↛",nrarrc:"⤳̸",nrarrw:"↝̸",nRightarrow:"⇏",nrightarrow:"↛",nrtri:"⋫",nrtrie:"⋭",nsc:"⊁",nsccue:"⋡",nsce:"⪰̸",Nscr:"𝒩",nscr:"𝓃",nshortmid:"∤",nshortparallel:"∦",nsim:"≁",nsime:"≄",nsimeq:"≄",nsmid:"∤",nspar:"∦",nsqsube:"⋢",nsqsupe:"⋣",nsub:"⊄",nsubE:"⫅̸",nsube:"⊈",nsubset:"⊂⃒",nsubseteq:"⊈",nsubseteqq:"⫅̸",nsucc:"⊁",nsucceq:"⪰̸",nsup:"⊅",nsupE:"⫆̸",nsupe:"⊉",nsupset:"⊃⃒",nsupseteq:"⊉",nsupseteqq:"⫆̸",ntgl:"≹",Ntilde:"Ñ",ntilde:"ñ",ntlg:"≸",ntriangleleft:"⋪",ntrianglelefteq:"⋬",ntriangleright:"⋫",ntrianglerighteq:"⋭",Nu:"Ν",nu:"ν",num:"#",numero:"№",numsp:" ",nvap:"≍⃒",nVDash:"⊯",nVdash:"⊮",nvDash:"⊭",nvdash:"⊬",nvge:"≥⃒",nvgt:">⃒",nvHarr:"⤄",nvinfin:"⧞",nvlArr:"⤂",nvle:"≤⃒",nvlt:"<⃒",nvltrie:"⊴⃒",nvrArr:"⤃",nvrtrie:"⊵⃒",nvsim:"∼⃒",nwarhk:"⤣",nwArr:"⇖",nwarr:"↖",nwarrow:"↖",nwnear:"⤧",Oacute:"Ó",oacute:"ó",oast:"⊛",ocir:"⊚",Ocirc:"Ô",ocirc:"ô",Ocy:"О",ocy:"о",odash:"⊝",Odblac:"Ő",odblac:"ő",odiv:"⨸",odot:"⊙",odsold:"⦼",OElig:"Œ",oelig:"œ",ofcir:"⦿",Ofr:"𝔒",ofr:"𝔬",ogon:"˛",Ograve:"Ò",ograve:"ò",ogt:"⧁",ohbar:"⦵",ohm:"Ω",oint:"∮",olarr:"↺",olcir:"⦾",olcross:"⦻",oline:"‾",olt:"⧀",Omacr:"Ō",omacr:"ō",Omega:"Ω",omega:"ω",Omicron:"Ο",omicron:"ο",omid:"⦶",ominus:"⊖",Oopf:"𝕆",oopf:"𝕠",opar:"⦷",OpenCurlyDoubleQuote:"“",OpenCurlyQuote:"‘",operp:"⦹",oplus:"⊕",Or:"⩔",or:"∨",orarr:"↻",ord:"⩝",order:"ℴ",orderof:"ℴ",ordf:"ª",ordm:"º",origof:"⊶",oror:"⩖",orslope:"⩗",orv:"⩛",oS:"Ⓢ",Oscr:"𝒪",oscr:"ℴ",Oslash:"Ø",oslash:"ø",osol:"⊘",Otilde:"Õ",otilde:"õ",Otimes:"⨷",otimes:"⊗",otimesas:"⨶",Ouml:"Ö",ouml:"ö",ovbar:"⌽",OverBar:"‾",OverBrace:"⏞",OverBracket:"⎴",OverParenthesis:"⏜",par:"∥",para:"¶",parallel:"∥",parsim:"⫳",parsl:"⫽",part:"∂",PartialD:"∂",Pcy:"П",pcy:"п",percnt:"%",period:".",permil:"‰",perp:"⊥",pertenk:"‱",Pfr:"𝔓",pfr:"𝔭",Phi:"Φ",phi:"φ",phiv:"ϕ",phmmat:"ℳ",phone:"☎",Pi:"Π",pi:"π",pitchfork:"⋔",piv:"ϖ",planck:"ℏ",planckh:"ℎ",plankv:"ℏ",plus:"+",plusacir:"⨣",plusb:"⊞",pluscir:"⨢",plusdo:"∔",plusdu:"⨥",pluse:"⩲",PlusMinus:"±",plusmn:"±",plussim:"⨦",plustwo:"⨧",pm:"±",Poincareplane:"ℌ",pointint:"⨕",Popf:"ℙ",popf:"𝕡",pound:"£",Pr:"⪻",pr:"≺",prap:"⪷",prcue:"≼",prE:"⪳",pre:"⪯",prec:"≺",precapprox:"⪷",preccurlyeq:"≼",Precedes:"≺",PrecedesEqual:"⪯",PrecedesSlantEqual:"≼",PrecedesTilde:"≾",preceq:"⪯",precnapprox:"⪹",precneqq:"⪵",precnsim:"⋨",precsim:"≾",Prime:"″",prime:"′",primes:"ℙ",prnap:"⪹",prnE:"⪵",prnsim:"⋨",prod:"∏",Product:"∏",profalar:"⌮",profline:"⌒",profsurf:"⌓",prop:"∝",Proportion:"∷",Proportional:"∝",propto:"∝",prsim:"≾",prurel:"⊰",Pscr:"𝒫",pscr:"𝓅",Psi:"Ψ",psi:"ψ",puncsp:" ",Qfr:"𝔔",qfr:"𝔮",qint:"⨌",Qopf:"ℚ",qopf:"𝕢",qprime:"⁗",Qscr:"𝒬",qscr:"𝓆",quaternions:"ℍ",quatint:"⨖",quest:"?",questeq:"≟",QUOT:'"',quot:'"',rAarr:"⇛",race:"∽̱",Racute:"Ŕ",racute:"ŕ",radic:"√",raemptyv:"⦳",Rang:"⟫",rang:"⟩",rangd:"⦒",range:"⦥",rangle:"⟩",raquo:"»",Rarr:"↠",rArr:"⇒",rarr:"→",rarrap:"⥵",rarrb:"⇥",rarrbfs:"⤠",rarrc:"⤳",rarrfs:"⤞",rarrhk:"↪",rarrlp:"↬",rarrpl:"⥅",rarrsim:"⥴",Rarrtl:"⤖",rarrtl:"↣",rarrw:"↝",rAtail:"⤜",ratail:"⤚",ratio:"∶",rationals:"ℚ",RBarr:"⤐",rBarr:"⤏",rbarr:"⤍",rbbrk:"❳",rbrace:"}",rbrack:"]",rbrke:"⦌",rbrksld:"⦎",rbrkslu:"⦐",Rcaron:"Ř",rcaron:"ř",Rcedil:"Ŗ",rcedil:"ŗ",rceil:"⌉",rcub:"}",Rcy:"Р",rcy:"р",rdca:"⤷",rdldhar:"⥩",rdquo:"”",rdquor:"”",rdsh:"↳",Re:"ℜ",real:"ℜ",realine:"ℛ",realpart:"ℜ",reals:"ℝ",rect:"▭",REG:"®",reg:"®",ReverseElement:"∋",ReverseEquilibrium:"⇋",ReverseUpEquilibrium:"⥯",rfisht:"⥽",rfloor:"⌋",Rfr:"ℜ",rfr:"𝔯",rHar:"⥤",rhard:"⇁",rharu:"⇀",rharul:"⥬",Rho:"Ρ",rho:"ρ",rhov:"ϱ",RightAngleBracket:"⟩",RightArrow:"→",Rightarrow:"⇒",rightarrow:"→",RightArrowBar:"⇥",RightArrowLeftArrow:"⇄",rightarrowtail:"↣",RightCeiling:"⌉",RightDoubleBracket:"⟧",RightDownTeeVector:"⥝",RightDownVector:"⇂",RightDownVectorBar:"⥕",RightFloor:"⌋",rightharpoondown:"⇁",rightharpoonup:"⇀",rightleftarrows:"⇄",rightleftharpoons:"⇌",rightrightarrows:"⇉",rightsquigarrow:"↝",RightTee:"⊢",RightTeeArrow:"↦",RightTeeVector:"⥛",rightthreetimes:"⋌",RightTriangle:"⊳",RightTriangleBar:"⧐",RightTriangleEqual:"⊵",RightUpDownVector:"⥏",RightUpTeeVector:"⥜",RightUpVector:"↾",RightUpVectorBar:"⥔",RightVector:"⇀",RightVectorBar:"⥓",ring:"˚",risingdotseq:"≓",rlarr:"⇄",rlhar:"⇌",rlm:"‏",rmoust:"⎱",rmoustache:"⎱",rnmid:"⫮",roang:"⟭",roarr:"⇾",robrk:"⟧",ropar:"⦆",Ropf:"ℝ",ropf:"𝕣",roplus:"⨮",rotimes:"⨵",RoundImplies:"⥰",rpar:")",rpargt:"⦔",rppolint:"⨒",rrarr:"⇉",Rrightarrow:"⇛",rsaquo:"›",Rscr:"ℛ",rscr:"𝓇",Rsh:"↱",rsh:"↱",rsqb:"]",rsquo:"’",rsquor:"’",rthree:"⋌",rtimes:"⋊",rtri:"▹",rtrie:"⊵",rtrif:"▸",rtriltri:"⧎",RuleDelayed:"⧴",ruluhar:"⥨",rx:"℞",Sacute:"Ś",sacute:"ś",sbquo:"‚",Sc:"⪼",sc:"≻",scap:"⪸",Scaron:"Š",scaron:"š",sccue:"≽",scE:"⪴",sce:"⪰",Scedil:"Ş",scedil:"ş",Scirc:"Ŝ",scirc:"ŝ",scnap:"⪺",scnE:"⪶",scnsim:"⋩",scpolint:"⨓",scsim:"≿",Scy:"С",scy:"с",sdot:"⋅",sdotb:"⊡",sdote:"⩦",searhk:"⤥",seArr:"⇘",searr:"↘",searrow:"↘",sect:"§",semi:";",seswar:"⤩",setminus:"∖",setmn:"∖",sext:"✶",Sfr:"𝔖",sfr:"𝔰",sfrown:"⌢",sharp:"♯",SHCHcy:"Щ",shchcy:"щ",SHcy:"Ш",shcy:"ш",ShortDownArrow:"↓",ShortLeftArrow:"←",shortmid:"∣",shortparallel:"∥",ShortRightArrow:"→",ShortUpArrow:"↑",shy:"­",Sigma:"Σ",sigma:"σ",sigmaf:"ς",sigmav:"ς",sim:"∼",simdot:"⩪",sime:"≃",simeq:"≃",simg:"⪞",simgE:"⪠",siml:"⪝",simlE:"⪟",simne:"≆",simplus:"⨤",simrarr:"⥲",slarr:"←",SmallCircle:"∘",smallsetminus:"∖",smashp:"⨳",smeparsl:"⧤",smid:"∣",smile:"⌣",smt:"⪪",smte:"⪬",smtes:"⪬︀",SOFTcy:"Ь",softcy:"ь",sol:"/",solb:"⧄",solbar:"⌿",Sopf:"𝕊",sopf:"𝕤",spades:"♠",spadesuit:"♠",spar:"∥",sqcap:"⊓",sqcaps:"⊓︀",sqcup:"⊔",sqcups:"⊔︀",Sqrt:"√",sqsub:"⊏",sqsube:"⊑",sqsubset:"⊏",sqsubseteq:"⊑",sqsup:"⊐",sqsupe:"⊒",sqsupset:"⊐",sqsupseteq:"⊒",squ:"□",Square:"□",square:"□",SquareIntersection:"⊓",SquareSubset:"⊏",SquareSubsetEqual:"⊑",SquareSuperset:"⊐",SquareSupersetEqual:"⊒",SquareUnion:"⊔",squarf:"▪",squf:"▪",srarr:"→",Sscr:"𝒮",sscr:"𝓈",ssetmn:"∖",ssmile:"⌣",sstarf:"⋆",Star:"⋆",star:"☆",starf:"★",straightepsilon:"ϵ",straightphi:"ϕ",strns:"¯",Sub:"⋐",sub:"⊂",subdot:"⪽",subE:"⫅",sube:"⊆",subedot:"⫃",submult:"⫁",subnE:"⫋",subne:"⊊",subplus:"⪿",subrarr:"⥹",Subset:"⋐",subset:"⊂",subseteq:"⊆",subseteqq:"⫅",SubsetEqual:"⊆",subsetneq:"⊊",subsetneqq:"⫋",subsim:"⫇",subsub:"⫕",subsup:"⫓",succ:"≻",succapprox:"⪸",succcurlyeq:"≽",Succeeds:"≻",SucceedsEqual:"⪰",SucceedsSlantEqual:"≽",SucceedsTilde:"≿",succeq:"⪰",succnapprox:"⪺",succneqq:"⪶",succnsim:"⋩",succsim:"≿",SuchThat:"∋",Sum:"∑",sum:"∑",sung:"♪",Sup:"⋑",sup:"⊃",sup1:"¹",sup2:"²",sup3:"³",supdot:"⪾",supdsub:"⫘",supE:"⫆",supe:"⊇",supedot:"⫄",Superset:"⊃",SupersetEqual:"⊇",suphsol:"⟉",suphsub:"⫗",suplarr:"⥻",supmult:"⫂",supnE:"⫌",supne:"⊋",supplus:"⫀",Supset:"⋑",supset:"⊃",supseteq:"⊇",supseteqq:"⫆",supsetneq:"⊋",supsetneqq:"⫌",supsim:"⫈",supsub:"⫔",supsup:"⫖",swarhk:"⤦",swArr:"⇙",swarr:"↙",swarrow:"↙",swnwar:"⤪",szlig:"ß",Tab:"\t",target:"⌖",Tau:"Τ",tau:"τ",tbrk:"⎴",Tcaron:"Ť",tcaron:"ť",Tcedil:"Ţ",tcedil:"ţ",Tcy:"Т",tcy:"т",tdot:"⃛",telrec:"⌕",Tfr:"𝔗",tfr:"𝔱",there4:"∴",Therefore:"∴",therefore:"∴",Theta:"Θ",theta:"θ",thetasym:"ϑ",thetav:"ϑ",thickapprox:"≈",thicksim:"∼",ThickSpace:"  ",thinsp:" ",ThinSpace:" ",thkap:"≈",thksim:"∼",THORN:"Þ",thorn:"þ",Tilde:"∼",tilde:"˜",TildeEqual:"≃",TildeFullEqual:"≅",TildeTilde:"≈",times:"×",timesb:"⊠",timesbar:"⨱",timesd:"⨰",tint:"∭",toea:"⤨",top:"⊤",topbot:"⌶",topcir:"⫱",Topf:"𝕋",topf:"𝕥",topfork:"⫚",tosa:"⤩",tprime:"‴",TRADE:"™",trade:"™",triangle:"▵",triangledown:"▿",triangleleft:"◃",trianglelefteq:"⊴",triangleq:"≜",triangleright:"▹",trianglerighteq:"⊵",tridot:"◬",trie:"≜",triminus:"⨺",TripleDot:"⃛",triplus:"⨹",trisb:"⧍",tritime:"⨻",trpezium:"⏢",Tscr:"𝒯",tscr:"𝓉",TScy:"Ц",tscy:"ц",TSHcy:"Ћ",tshcy:"ћ",Tstrok:"Ŧ",tstrok:"ŧ",twixt:"≬",twoheadleftarrow:"↞",twoheadrightarrow:"↠",Uacute:"Ú",uacute:"ú",Uarr:"↟",uArr:"⇑",uarr:"↑",Uarrocir:"⥉",Ubrcy:"Ў",ubrcy:"ў",Ubreve:"Ŭ",ubreve:"ŭ",Ucirc:"Û",ucirc:"û",Ucy:"У",ucy:"у",udarr:"⇅",Udblac:"Ű",udblac:"ű",udhar:"⥮",ufisht:"⥾",Ufr:"𝔘",ufr:"𝔲",Ugrave:"Ù",ugrave:"ù",uHar:"⥣",uharl:"↿",uharr:"↾",uhblk:"▀",ulcorn:"⌜",ulcorner:"⌜",ulcrop:"⌏",ultri:"◸",Umacr:"Ū",umacr:"ū",uml:"¨",UnderBar:"_",UnderBrace:"⏟",UnderBracket:"⎵",UnderParenthesis:"⏝",Union:"⋃",UnionPlus:"⊎",Uogon:"Ų",uogon:"ų",Uopf:"𝕌",uopf:"𝕦",UpArrow:"↑",Uparrow:"⇑",uparrow:"↑",UpArrowBar:"⤒",UpArrowDownArrow:"⇅",UpDownArrow:"↕",Updownarrow:"⇕",updownarrow:"↕",UpEquilibrium:"⥮",upharpoonleft:"↿",upharpoonright:"↾",uplus:"⊎",UpperLeftArrow:"↖",UpperRightArrow:"↗",Upsi:"ϒ",upsi:"υ",upsih:"ϒ",Upsilon:"Υ",upsilon:"υ",UpTee:"⊥",UpTeeArrow:"↥",upuparrows:"⇈",urcorn:"⌝",urcorner:"⌝",urcrop:"⌎",Uring:"Ů",uring:"ů",urtri:"◹",Uscr:"𝒰",uscr:"𝓊",utdot:"⋰",Utilde:"Ũ",utilde:"ũ",utri:"▵",utrif:"▴",uuarr:"⇈",Uuml:"Ü",uuml:"ü",uwangle:"⦧",vangrt:"⦜",varepsilon:"ϵ",varkappa:"ϰ",varnothing:"∅",varphi:"ϕ",varpi:"ϖ",varpropto:"∝",vArr:"⇕",varr:"↕",varrho:"ϱ",varsigma:"ς",varsubsetneq:"⊊︀",varsubsetneqq:"⫋︀",varsupsetneq:"⊋︀",varsupsetneqq:"⫌︀",vartheta:"ϑ",vartriangleleft:"⊲",vartriangleright:"⊳",Vbar:"⫫",vBar:"⫨",vBarv:"⫩",Vcy:"В",vcy:"в",VDash:"⊫",Vdash:"⊩",vDash:"⊨",vdash:"⊢",Vdashl:"⫦",Vee:"⋁",vee:"∨",veebar:"⊻",veeeq:"≚",vellip:"⋮",Verbar:"‖",verbar:"|",Vert:"‖",vert:"|",VerticalBar:"∣",VerticalLine:"|",VerticalSeparator:"❘",VerticalTilde:"≀",VeryThinSpace:" ",Vfr:"𝔙",vfr:"𝔳",vltri:"⊲",vnsub:"⊂⃒",vnsup:"⊃⃒",Vopf:"𝕍",vopf:"𝕧",vprop:"∝",vrtri:"⊳",Vscr:"𝒱",vscr:"𝓋",vsubnE:"⫋︀",vsubne:"⊊︀",vsupnE:"⫌︀",vsupne:"⊋︀",Vvdash:"⊪",vzigzag:"⦚",Wcirc:"Ŵ",wcirc:"ŵ",wedbar:"⩟",Wedge:"⋀",wedge:"∧",wedgeq:"≙",weierp:"℘",Wfr:"𝔚",wfr:"𝔴",Wopf:"𝕎",wopf:"𝕨",wp:"℘",wr:"≀",wreath:"≀",Wscr:"𝒲",wscr:"𝓌",xcap:"⋂",xcirc:"◯",xcup:"⋃",xdtri:"▽",Xfr:"𝔛",xfr:"𝔵",xhArr:"⟺",xharr:"⟷",Xi:"Ξ",xi:"ξ",xlArr:"⟸",xlarr:"⟵",xmap:"⟼",xnis:"⋻",xodot:"⨀",Xopf:"𝕏",xopf:"𝕩",xoplus:"⨁",xotime:"⨂",xrArr:"⟹",xrarr:"⟶",Xscr:"𝒳",xscr:"𝓍",xsqcup:"⨆",xuplus:"⨄",xutri:"△",xvee:"⋁",xwedge:"⋀",Yacute:"Ý",yacute:"ý",YAcy:"Я",yacy:"я",Ycirc:"Ŷ",ycirc:"ŷ",Ycy:"Ы",ycy:"ы",yen:"¥",Yfr:"𝔜",yfr:"𝔶",YIcy:"Ї",yicy:"ї",Yopf:"𝕐",yopf:"𝕪",Yscr:"𝒴",yscr:"𝓎",YUcy:"Ю",yucy:"ю",Yuml:"Ÿ",yuml:"ÿ",Zacute:"Ź",zacute:"ź",Zcaron:"Ž",zcaron:"ž",Zcy:"З",zcy:"з",Zdot:"Ż",zdot:"ż",zeetrf:"ℨ",ZeroWidthSpace:"​",Zeta:"Ζ",zeta:"ζ",Zfr:"ℨ",zfr:"𝔷",ZHcy:"Ж",zhcy:"ж",zigrarr:"⇝",Zopf:"ℤ",zopf:"𝕫",Zscr:"𝒵",zscr:"𝓏",zwj:"‍",zwnj:"‌"}),t.entityMap=t.HTML_ENTITIES;},8978:(e,t,r)=>{var a=r(4722);t.DOMImplementation=a.DOMImplementation,t.XMLSerializer=a.XMLSerializer,t.DOMParser=r(5752).DOMParser;},4466:(e,t,r)=>{var a=r(4582).NAMESPACE,n=/[A-Z_a-z\xC0-\xD6\xD8-\xF6\u00F8-\u02FF\u0370-\u037D\u037F-\u1FFF\u200C-\u200D\u2070-\u218F\u2C00-\u2FEF\u3001-\uD7FF\uF900-\uFDCF\uFDF0-\uFFFD]/,o=new RegExp("[\\-\\.0-9"+n.source.slice(1,-1)+"\\u00B7\\u0300-\\u036F\\u203F-\\u2040]"),i=new RegExp("^"+n.source+o.source+"*(?::"+n.source+o.source+"*)?$");function s(e,t){this.message=e,this.locator=t,Error.captureStackTrace&&Error.captureStackTrace(this,s);}function l(){}function c(e,t){return t.lineNumber=e.lineNumber,t.columnNumber=e.columnNumber,t}function u(e,t,r,n,o,i){function s(e,t,a){r.attributeNames.hasOwnProperty(e)&&i.fatalError("Attribute "+e+" redefined"),r.addValue(e,t.replace(/[\t\n\r]/g," ").replace(/&#?\w+;/g,o),a);}for(var l,c=++t,u=0;;){var h=e.charAt(c);switch(h){case "=":if(1===u)l=e.slice(t,c),u=3;else {if(2!==u)throw new Error("attribute equal must after attrName");u=3;}break;case "'":case '"':if(3===u||1===u){if(1===u&&(i.warning('attribute value must after "="'),l=e.slice(t,c)),t=c+1,!((c=e.indexOf(h,t))>0))throw new Error("attribute value no end '"+h+"' match");s(l,d=e.slice(t,c),t-1),u=5;}else {if(4!=u)throw new Error('attribute value must after "="');s(l,d=e.slice(t,c),t),i.warning('attribute "'+l+'" missed start quot('+h+")!!"),t=c+1,u=5;}break;case "/":switch(u){case 0:r.setTagName(e.slice(t,c));case 5:case 6:case 7:u=7,r.closed=!0;case 4:case 1:break;case 2:r.closed=!0;break;default:throw new Error("attribute invalid close char('/')")}break;case "":return i.error("unexpected end of input"),0==u&&r.setTagName(e.slice(t,c)),c;case ">":switch(u){case 0:r.setTagName(e.slice(t,c));case 5:case 6:case 7:break;case 4:case 1:"/"===(d=e.slice(t,c)).slice(-1)&&(r.closed=!0,d=d.slice(0,-1));case 2:2===u&&(d=l),4==u?(i.warning('attribute "'+d+'" missed quot(")!'),s(l,d,t)):(a.isHTML(n[""])&&d.match(/^(?:disabled|checked|selected)$/i)||i.warning('attribute "'+d+'" missed value!! "'+d+'" instead!!'),s(d,d,t));break;case 3:throw new Error("attribute value missed!!")}return c;case "":h=" ";default:if(h<=" ")switch(u){case 0:r.setTagName(e.slice(t,c)),u=6;break;case 1:l=e.slice(t,c),u=2;break;case 4:var d=e.slice(t,c);i.warning('attribute "'+d+'" missed quot(")!!'),s(l,d,t);case 5:u=6;}else switch(u){case 2:r.tagName,a.isHTML(n[""])&&l.match(/^(?:disabled|checked|selected)$/i)||i.warning('attribute "'+l+'" missed value!! "'+l+'" instead2!!'),s(l,l,t),t=c,u=1;break;case 5:i.warning('attribute space is required"'+l+'"!!');case 6:u=1,t=c;break;case 3:u=4,t=c;break;case 7:throw new Error("elements closed character '/' and '>' must be connected to")}}c++;}}function h(e,t,r){for(var n=e.tagName,o=null,i=e.length;i--;){var s=e[i],l=s.qName,c=s.value;if((m=l.indexOf(":"))>0)var u=s.prefix=l.slice(0,m),h=l.slice(m+1),d="xmlns"===u&&h;else h=l,u=null,d="xmlns"===l&&"";s.localName=h,!1!==d&&(null==o&&(o={},p(r,r={})),r[d]=o[d]=c,s.uri=a.XMLNS,t.startPrefixMapping(d,c));}for(i=e.length;i--;)(u=(s=e[i]).prefix)&&("xml"===u&&(s.uri=a.XML),"xmlns"!==u&&(s.uri=r[u||""]));var m;(m=n.indexOf(":"))>0?(u=e.prefix=n.slice(0,m),h=e.localName=n.slice(m+1)):(u=null,h=e.localName=n);var f=e.uri=r[u||""];if(t.startElement(f,h,n,e),!e.closed)return e.currentNSMap=r,e.localNSMap=o,!0;if(t.endElement(f,h,n),o)for(u in o)Object.prototype.hasOwnProperty.call(o,u)&&t.endPrefixMapping(u);}function d(e,t,r,a,n){if(/^(?:script|textarea)$/i.test(r)){var o=e.indexOf("</"+r+">",t),i=e.substring(t+1,o);if(/[&<]/.test(i))return /^script$/i.test(r)?(n.characters(i,0,i.length),o):(i=i.replace(/&#?\w+;/g,a),n.characters(i,0,i.length),o)}return t+1}function m(e,t,r,a){var n=a[r];return null==n&&((n=e.lastIndexOf("</"+r+">"))<t&&(n=e.lastIndexOf("</"+r)),a[r]=n),n<t}function p(e,t){for(var r in e)Object.prototype.hasOwnProperty.call(e,r)&&(t[r]=e[r]);}function f(e,t,r,a){if("-"===e.charAt(t+2))return "-"===e.charAt(t+3)?(n=e.indexOf("--\x3e",t+4))>t?(r.comment(e,t+4,n-t-4),n+3):(a.error("Unclosed comment"),-1):-1;if("CDATA["==e.substr(t+3,6)){var n=e.indexOf("]]>",t+9);return r.startCDATA(),r.characters(e,t+9,n-t-9),r.endCDATA(),n+3}var o=function(e,t){var r,a=[],n=/'[^']+'|"[^"]+"|[^\s<>\/=]+=?|(\/?\s*>|<)/g;for(n.lastIndex=t,n.exec(e);r=n.exec(e);)if(a.push(r),r[1])return a}(e,t),i=o.length;if(i>1&&/!doctype/i.test(o[0][0])){var s=o[1][0],l=!1,c=!1;i>3&&(/^public$/i.test(o[2][0])?(l=o[3][0],c=i>4&&o[4][0]):/^system$/i.test(o[2][0])&&(c=o[3][0]));var u=o[i-1];return r.startDTD(s,l,c),r.endDTD(),u.index+u[0].length}return -1}function x(e,t,r){var a=e.indexOf("?>",t);if(a){var n=e.substring(t,a).match(/^<\?(\S*)\s*([\s\S]*?)\s*$/);return n?(n[0].length,r.processingInstruction(n[1],n[2]),a+2):-1}return -1}function g(){this.attributeNames={};}s.prototype=new Error,s.prototype.name=s.name,l.prototype={parse:function(e,t,r){var n=this.domBuilder;n.startDocument(),p(t,t={}),function(e,t,r,n,o){function i(e){var t=e.slice(1,-1);return Object.hasOwnProperty.call(r,t)?r[t]:"#"===t.charAt(0)?function(e){if(e>65535){var t=55296+((e-=65536)>>10),r=56320+(1023&e);return String.fromCharCode(t,r)}return String.fromCharCode(e)}(parseInt(t.substr(1).replace("x","0x"))):(o.error("entity not found:"+e),e)}function l(t){if(t>y){var r=e.substring(y,t).replace(/&#?\w+;/g,i);C&&p(y),n.characters(r,0,t-y),y=t;}}function p(t,r){for(;t>=b&&(r=v.exec(e));)w=r.index,b=w+r[0].length,C.lineNumber++;C.columnNumber=t-w+1;}for(var w=0,b=0,v=/.*(?:\r\n?|\n)|.*$/g,C=n.locator,A=[{currentNSMap:t}],E={},y=0;;){try{var _=e.indexOf("<",y);if(_<0){if(!e.substr(y).match(/^\s*$/)){var q=n.doc,D=q.createTextNode(e.substr(y));q.appendChild(D),n.currentElement=D;}return}switch(_>y&&l(_),e.charAt(_+1)){case "/":var M=e.indexOf(">",_+3),T=e.substring(_+2,M).replace(/[ \t\n\r]+$/g,""),N=A.pop();M<0?(T=e.substring(_+2).replace(/[\s<].*/,""),o.error("end tag name: "+T+" is not complete:"+N.tagName),M=_+1+T.length):T.match(/\s</)&&(T=T.replace(/[\s<].*/,""),o.error("end tag name: "+T+" maybe not complete"),M=_+1+T.length);var O=N.localNSMap,L=N.tagName==T;if(L||N.tagName&&N.tagName.toLowerCase()==T.toLowerCase()){if(n.endElement(N.uri,N.localName,T),O)for(var B in O)Object.prototype.hasOwnProperty.call(O,B)&&n.endPrefixMapping(B);L||o.fatalError("end tag name: "+T+" is not match the current start tagName:"+N.tagName);}else A.push(N);M++;break;case "?":C&&p(_),M=x(e,_,n);break;case "!":C&&p(_),M=f(e,_,n,o);break;default:C&&p(_);var S=new g,F=A[A.length-1].currentNSMap,P=(M=u(e,_,S,F,i,o),S.length);if(!S.closed&&m(e,M,S.tagName,E)&&(S.closed=!0,r.nbsp||o.warning("unclosed xml attribute")),C&&P){for(var k=c(C,{}),R=0;R<P;R++){var I=S[R];p(I.offset),I.locator=c(C,{});}n.locator=k,h(S,n,F)&&A.push(S),n.locator=C;}else h(S,n,F)&&A.push(S);a.isHTML(S.uri)&&!S.closed?M=d(e,M,S.tagName,i,n):M++;}}catch(e){if(e instanceof s)throw e;o.error("element parse error: "+e),M=-1;}M>y?y=M:l(Math.max(_,y)+1);}}(e,t,r,n,this.errorHandler),n.endDocument();}},g.prototype={setTagName:function(e){if(!i.test(e))throw new Error("invalid tagName:"+e);this.tagName=e;},addValue:function(e,t,r){if(!i.test(e))throw new Error("invalid attribute:"+e);this.attributeNames[e]=this.length,this[this.length++]={qName:e,value:t,offset:r};},length:0,getLocalName:function(e){return this[e].localName},getLocator:function(e){return this[e].locator},getQName:function(e){return this[e].qName},getURI:function(e){return this[e].uri},getValue:function(e){return this[e].value}},t.XMLReader=l,t.ParseError=s;},8917:(e,t,r)=>{"use strict";Object.defineProperty(t,"__esModule",{value:!0}),t.InvalidNumberOfChildrenError=void 0;var a=r(6200);Object.defineProperty(t,"InvalidNumberOfChildrenError",{enumerable:!0,get:function(){return a.InvalidNumberOfChildrenError}});},6200:(e,t)=>{"use strict";Object.defineProperty(t,"__esModule",{value:!0}),t.InvalidNumberOfChildrenError=void 0;class r extends Error{constructor(e,t,r,a="exactly"){super(`${e} tag must have ${a} ${t} children. It's actually ${r}`),this.name="InvalidNumberOfChildrenError";}}t.InvalidNumberOfChildrenError=r;},4279:function(e,t,r){"use strict";var a=this&&this.__createBinding||(Object.create?function(e,t,r,a){void 0===a&&(a=r);var n=Object.getOwnPropertyDescriptor(t,r);n&&!("get"in n?!t.__esModule:n.writable||n.configurable)||(n={enumerable:!0,get:function(){return t[r]}}),Object.defineProperty(e,a,n);}:function(e,t,r,a){void 0===a&&(a=r),e[a]=t[r];}),n=this&&this.__exportStar||function(e,t){for(var r in e)"default"===r||Object.prototype.hasOwnProperty.call(t,r)||a(t,e,r);};Object.defineProperty(t,"__esModule",{value:!0}),n(r(828),t),n(r(5975),t),n(r(799),t),n(r(2424),t);},5975:(e,t)=>{"use strict";Object.defineProperty(t,"__esModule",{value:!0}),t.JoinWithManySeparators=void 0;class r{constructor(e){this._separators=e;}static join(e,t,a=""){const n=t.length>0?t:void 0!==a?[a]:[];return new r(n)._join(e)}_join(e){return e.reduce(((e,t,r,a)=>e+t+(r===a.length-1?"":this._get(r))),"")}_get(e){return this._separators[e]?this._separators[e]:this._separators[this._separators.length-1]}}t.JoinWithManySeparators=r;},799:(e,t,r)=>{"use strict";Object.defineProperty(t,"__esModule",{value:!0}),t.mathMLElementToLaTeXConverter=void 0;const a=r(5443);t.mathMLElementToLaTeXConverter=e=>new a.MathMLElementToLatexConverterAdapter(e).toLatexConverter();},2424:(e,t)=>{"use strict";Object.defineProperty(t,"__esModule",{value:!0}),t.normalizeWhiteSpaces=void 0,t.normalizeWhiteSpaces=e=>e.replace(/\s+/g," ");},7192:(e,t,r)=>{"use strict";Object.defineProperty(t,"__esModule",{value:!0}),t.BracketWrapper=void 0;const a=r(1855);t.BracketWrapper=class{constructor(){this._open="{",this._close="}";}wrap(e){return new a.Wrapper(this._open,this._close).wrap(e)}};},5025:(e,t,r)=>{"use strict";Object.defineProperty(t,"__esModule",{value:!0}),t.GenericWrapper=void 0;const a=r(1855);t.GenericWrapper=class{constructor(e,t){this._open="\\left"+e,this._close="\\right"+t;}wrap(e){return new a.Wrapper(this._open,this._close).wrap(e)}};},828:(e,t,r)=>{"use strict";Object.defineProperty(t,"__esModule",{value:!0}),t.GenericWrapper=t.ParenthesisWrapper=t.BracketWrapper=void 0;var a=r(7192);Object.defineProperty(t,"BracketWrapper",{enumerable:!0,get:function(){return a.BracketWrapper}});var n=r(1168);Object.defineProperty(t,"ParenthesisWrapper",{enumerable:!0,get:function(){return n.ParenthesisWrapper}});var o=r(5025);Object.defineProperty(t,"GenericWrapper",{enumerable:!0,get:function(){return o.GenericWrapper}});},1168:(e,t,r)=>{"use strict";Object.defineProperty(t,"__esModule",{value:!0}),t.ParenthesisWrapper=void 0;const a=r(1855);t.ParenthesisWrapper=class{constructor(){this._open="\\left(",this._close="\\right)";}wrap(e){return new a.Wrapper(this._open,this._close).wrap(e)}wrapIfMoreThanOneChar(e){return e.length<=1?e:this.wrap(e)}};},1855:(e,t)=>{"use strict";Object.defineProperty(t,"__esModule",{value:!0}),t.Wrapper=void 0,t.Wrapper=class{constructor(e,t){this._open=e,this._close=t;}wrap(e){return this._open+e+this._close}};},2697:(e,t)=>{"use strict";Object.defineProperty(t,"__esModule",{value:!0}),t.VoidMathMLElement=void 0,t.VoidMathMLElement=class{constructor(){this.name="void",this.value="",this.children=[],this.attributes={};}};},4760:(e,t,r)=>{"use strict";Object.defineProperty(t,"__esModule",{value:!0}),t.GenericSpacingWrapper=void 0;const a=r(4279);t.GenericSpacingWrapper=class{constructor(e){this._mathmlElement=e;}convert(){return this._mathmlElement.children.map((e=>(0,a.mathMLElementToLaTeXConverter)(e))).map((e=>e.convert())).join(" ")}};},9376:(e,t,r)=>{"use strict";Object.defineProperty(t,"__esModule",{value:!0}),t.GenericUnderOver=void 0;const a=r(799),n=r(8917),o=r(472);t.GenericUnderOver=class{constructor(e){this._mathmlElement=e;}convert(){const{name:e,children:t}=this._mathmlElement,r=t.length;if(2!==r)throw new n.InvalidNumberOfChildrenError(e,2,r);const o=(0,a.mathMLElementToLaTeXConverter)(t[0]).convert(),i=(0,a.mathMLElementToLaTeXConverter)(t[1]).convert();return this._applyCommand(o,i)}_applyCommand(e,t){const r=this._mathmlElement.name.match(/under/)?s.Under:s.Over;return new i(r).apply(e,t)}};class i{constructor(e){this._type=e;}apply(e,t){return o.latexAccents.includes(t)?`${t}{${e}}`:`${this._defaultCommand}{${t}}{${e}}`}get _defaultCommand(){return this._type===s.Under?"\\underset":"\\overset"}}var s;!function(e){e[e.Under=0]="Under",e[e.Over=1]="Over";}(s||(s={}));},6959:(e,t,r)=>{"use strict";Object.defineProperty(t,"__esModule",{value:!0}),t.Void=t.MSpace=t.MRow=t.GenericUnderOver=t.GenericSpacingWrapper=t.MTr=t.MTable=t.MUnderover=t.MText=t.MMultiscripts=t.MSubsup=t.MSub=t.MSup=t.MPhantom=t.MError=t.MEnclose=t.MAction=t.MRoot=t.MFrac=t.MFenced=t.MSqrt=t.MN=t.MO=t.MI=t.Math=void 0;var a=r(393);Object.defineProperty(t,"Math",{enumerable:!0,get:function(){return a.Math}});var n=r(7037);Object.defineProperty(t,"MI",{enumerable:!0,get:function(){return n.MI}});var o=r(3487);Object.defineProperty(t,"MO",{enumerable:!0,get:function(){return o.MO}});var i=r(4464);Object.defineProperty(t,"MN",{enumerable:!0,get:function(){return i.MN}});var s=r(8686);Object.defineProperty(t,"MSqrt",{enumerable:!0,get:function(){return s.MSqrt}});var l=r(9511);Object.defineProperty(t,"MFenced",{enumerable:!0,get:function(){return l.MFenced}});var c=r(6440);Object.defineProperty(t,"MFrac",{enumerable:!0,get:function(){return c.MFrac}});var u=r(6052);Object.defineProperty(t,"MRoot",{enumerable:!0,get:function(){return u.MRoot}});var h=r(1678);Object.defineProperty(t,"MAction",{enumerable:!0,get:function(){return h.MAction}});var d=r(2631);Object.defineProperty(t,"MEnclose",{enumerable:!0,get:function(){return d.MEnclose}});var m=r(1840);Object.defineProperty(t,"MError",{enumerable:!0,get:function(){return m.MError}});var p=r(7443);Object.defineProperty(t,"MPhantom",{enumerable:!0,get:function(){return p.MPhantom}});var f=r(6926);Object.defineProperty(t,"MSup",{enumerable:!0,get:function(){return f.MSup}});var x=r(2564);Object.defineProperty(t,"MSub",{enumerable:!0,get:function(){return x.MSub}});var g=r(1358);Object.defineProperty(t,"MSubsup",{enumerable:!0,get:function(){return g.MSubsup}});var w=r(8303);Object.defineProperty(t,"MMultiscripts",{enumerable:!0,get:function(){return w.MMultiscripts}});var b=r(3951);Object.defineProperty(t,"MText",{enumerable:!0,get:function(){return b.MText}});var v=r(1222);Object.defineProperty(t,"MUnderover",{enumerable:!0,get:function(){return v.MUnderover}});var C=r(2350);Object.defineProperty(t,"MTable",{enumerable:!0,get:function(){return C.MTable}});var A=r(1586);Object.defineProperty(t,"MTr",{enumerable:!0,get:function(){return A.MTr}});var E=r(4760);Object.defineProperty(t,"GenericSpacingWrapper",{enumerable:!0,get:function(){return E.GenericSpacingWrapper}});var y=r(9376);Object.defineProperty(t,"GenericUnderOver",{enumerable:!0,get:function(){return y.GenericUnderOver}});var _=r(6346);Object.defineProperty(t,"MRow",{enumerable:!0,get:function(){return _.MRow}});var q=r(3700);Object.defineProperty(t,"MSpace",{enumerable:!0,get:function(){return q.MSpace}});var D=r(9165);Object.defineProperty(t,"Void",{enumerable:!0,get:function(){return D.Void}});},1678:(e,t,r)=>{"use strict";Object.defineProperty(t,"__esModule",{value:!0}),t.MAction=void 0;const a=r(799);t.MAction=class{constructor(e){this._mathmlElement=e;}convert(){const{children:e}=this._mathmlElement;return this._isToggle()?e.map((e=>(0,a.mathMLElementToLaTeXConverter)(e))).map((e=>e.convert())).join(" \\Longrightarrow "):(0,a.mathMLElementToLaTeXConverter)(e[0]).convert()}_isToggle(){const{actiontype:e}=this._mathmlElement.attributes;return "toggle"===e||!e}};},393:(e,t,r)=>{"use strict";Object.defineProperty(t,"__esModule",{value:!0}),t.Math=void 0;const a=r(799),n=r(2424);t.Math=class{constructor(e){this._mathmlElement=e;}convert(){const e=this._mathmlElement.children.map((e=>(0,a.mathMLElementToLaTeXConverter)(e))).map((e=>e.convert())).join(" ");return (0,n.normalizeWhiteSpaces)(e)}};},2631:(e,t,r)=>{"use strict";Object.defineProperty(t,"__esModule",{value:!0}),t.MEnclose=void 0;const a=r(799);t.MEnclose=class{constructor(e){this._mathmlElement=e;}convert(){const e=this._mathmlElement.children.map((e=>(0,a.mathMLElementToLaTeXConverter)(e))).map((e=>e.convert())).join(" ");return "actuarial"===this._notation?`\\overline{\\left.${e}\\right|}`:"radical"===this._notation?`\\sqrt{${e}}`:["box","roundedbox","circle"].includes(this._notation)?`\\boxed{${e}}`:"left"===this._notation?`\\left|${e}`:"right"===this._notation?`${e}\\right|`:"top"===this._notation?`\\overline{${e}}`:"bottom"===this._notation?`\\underline{${e}}`:"updiagonalstrike"===this._notation?`\\cancel{${e}}`:"downdiagonalstrike"===this._notation?`\\bcancel{${e}}`:"updiagonalarrow"===this._notation?`\\cancelto{}{${e}}`:["verticalstrike","horizontalstrike"].includes(this._notation)?`\\hcancel{${e}}`:"madruwb"===this._notation?`\\underline{${e}\\right|}`:"phasorangle"===this._notation?`{\\angle \\underline{${e}}}`:`\\overline{\\left.\\right)${e}}`}get _notation(){return this._mathmlElement.attributes.notation||"longdiv"}};},1840:(e,t,r)=>{"use strict";Object.defineProperty(t,"__esModule",{value:!0}),t.MError=void 0;const a=r(799);t.MError=class{constructor(e){this._mathmlElement=e;}convert(){return `\\color{red}{${this._mathmlElement.children.map((e=>(0,a.mathMLElementToLaTeXConverter)(e))).map((e=>e.convert())).join(" ")}}`}};},9511:(e,t,r)=>{"use strict";Object.defineProperty(t,"__esModule",{value:!0}),t.MFenced=void 0;const a=r(799),n=r(4279);t.MFenced=class{constructor(e){this._mathmlElement=e,this.open=this._mathmlElement.attributes.open||"",this.close=this._mathmlElement.attributes.close||"";}convert(){const e=this._mathmlElement.children.map((e=>(0,a.mathMLElementToLaTeXConverter)(e))).map((e=>e.convert()));if(this._isThereRelativeOfName(this._mathmlElement.children,"mtable"))return new i(this.open,this.close).apply(e);const t=this._mathmlElement.attributes.separators,r=void 0!==t,n=t?Array.from(t):[],s=r?"":",";return new o(this.open,this.close,n,s).apply(e)}_isThereRelativeOfName(e,t){return e.some((e=>e.name===t||this._isThereRelativeOfName(e.children,t)))}};class o{constructor(e,t,r,a){this.separators=r,this.defaultSeparator=a,this.open=e||"(",this.close=t||")";}apply(e){const t=n.JoinWithManySeparators.join(e,this.separators,this.defaultSeparator);return new n.GenericWrapper(this.open,this.close).wrap(t)}}class i{constructor(e,t){this._genericCommand="matrix",this.separators=new s(e,t);}apply(e){const t=this._command,r=`\\begin{${t}}\n${e.join("")}\n\\end{${t}}`;return t===this._genericCommand?this.separators.wrap(r):r}get _command(){return this.separators.areParentheses()?"pmatrix":this.separators.areSquareBrackets()?"bmatrix":this.separators.areBrackets()?"Bmatrix":this.separators.areDivides()?"vmatrix":this.separators.areParallels()?"Vmatrix":this.separators.areNotEqual()?this._genericCommand:"bmatrix"}}class s{constructor(e,t){this.open=e,this.close=t;}wrap(e){return new n.GenericWrapper(this.open,this.close).wrap(e)}areParentheses(){return this._compare("(",")")}areSquareBrackets(){return this._compare("[","]")}areBrackets(){return this._compare("{","}")}areDivides(){return this._compare("|","|")}areParallels(){return this._compare("||","||")}areNotEqual(){return this.open!==this.close}_compare(e,t){return this.open===e&&this.close===t}}},6440:(e,t,r)=>{"use strict";Object.defineProperty(t,"__esModule",{value:!0}),t.MFrac=void 0;const a=r(8917),n=r(4279);t.MFrac=class{constructor(e){this._mathmlElement=e;}convert(){const{children:e,name:t}=this._mathmlElement,r=e.length;if(2!==r)throw new a.InvalidNumberOfChildrenError(t,2,r);const o=(0,n.mathMLElementToLaTeXConverter)(e[0]).convert(),i=(0,n.mathMLElementToLaTeXConverter)(e[1]).convert();return this._isBevelled()?`${this._wrapIfMoreThanOneChar(o)}/${this._wrapIfMoreThanOneChar(i)}`:`\\frac{${o}}{${i}}`}_wrapIfMoreThanOneChar(e){return (new n.ParenthesisWrapper).wrapIfMoreThanOneChar(e)}_isBevelled(){return !!this._mathmlElement.attributes.bevelled}};},7037:(e,t,r)=>{"use strict";Object.defineProperty(t,"__esModule",{value:!0}),t.MI=void 0;const a=r(4279),n=r(5406),o=r(6122);t.MI=class{constructor(e){this.utf8Converter=new o.HashUTF8ToLtXConverter,this._mathmlElement=e;}convert(){const e=(0,a.normalizeWhiteSpaces)(this._mathmlElement.value);if(" "===e)return i.apply(e);const t=e.trim(),r=i.apply(t),n=this.utf8Converter.convert(r);return n!==r?n:this.wrapInMathVariant(r,this.getMathVariant(this._mathmlElement.attributes))}getMathVariant(e){if(e&&e.mathvariant)return e.mathvariant}wrapInMathVariant(e,t){switch(t){case "bold":return `\\mathbf{${e}}`;case "italic":return `\\mathit{${e}}`;case "bold-italic":return `\\mathbf{\\mathit{${e}}}`;case "double-struck":return `\\mathbb{${e}}`;case "bold-fraktur":return `\\mathbf{\\mathfrak{${e}}}`;case "script":return `\\mathcal{${e}}`;case "bold-script":return `\\mathbf{\\mathcal{${e}}}`;case "fraktur":return `\\mathfrak{${e}}`;case "sans-serif":return `\\mathsf{${e}}`;case "bold-sans-serif":return `\\mathbf{\\mathsf{${e}}}`;case "sans-serif-italic":return `\\mathsf{\\mathit{${e}}}`;case "sans-serif-bold-italic":return `\\mathbf{\\mathsf{\\mathit{${e}}}}`;case "monospace":return `\\mathtt{${e}}`;default:return e}}};class i{constructor(e){this._value=e;}static apply(e){return new i(e)._apply()}_apply(){return this._findByCharacter()||this._findByGlyph()||this._findByNumber()||(new o.HashUTF8ToLtXConverter).convert(this._value)}_findByCharacter(){return n.allMathSymbolsByChar[this._value]}_findByGlyph(){return n.allMathSymbolsByGlyph[this._value]}_findByNumber(){return n.mathNumberByGlyph[this._value]}}},8303:(e,t,r)=>{"use strict";Object.defineProperty(t,"__esModule",{value:!0}),t.MMultiscripts=void 0;const a=r(4279),n=r(8917);t.MMultiscripts=class{constructor(e){this._mathmlElement=e;}convert(){const{name:e,children:t}=this._mathmlElement,r=t.length;if(r<3)throw new n.InvalidNumberOfChildrenError(e,3,r,"at least");const o=(0,a.mathMLElementToLaTeXConverter)(t[0]).convert();return this._prescriptLatex()+this._wrapInParenthesisIfThereIsSpace(o)+this._postscriptLatex()}_prescriptLatex(){const{children:e}=this._mathmlElement;let t,r;if(this._isPrescripts(e[1]))t=e[2],r=e[3];else {if(!this._isPrescripts(e[3]))return "";t=e[4],r=e[5];}return `\\_{${(0,a.mathMLElementToLaTeXConverter)(t).convert()}}^{${(0,a.mathMLElementToLaTeXConverter)(r).convert()}}`}_postscriptLatex(){const{children:e}=this._mathmlElement;if(this._isPrescripts(e[1]))return "";const t=e[1],r=e[2];return `_{${(0,a.mathMLElementToLaTeXConverter)(t).convert()}}^{${(0,a.mathMLElementToLaTeXConverter)(r).convert()}}`}_wrapInParenthesisIfThereIsSpace(e){return e.match(/\s+/g)?(new a.ParenthesisWrapper).wrap(e):e}_isPrescripts(e){return "mprescripts"===(null==e?void 0:e.name)}};},4464:(e,t,r)=>{"use strict";Object.defineProperty(t,"__esModule",{value:!0}),t.MN=void 0;const a=r(4279),n=r(5406);t.MN=class{constructor(e){this._mathmlElement=e;}convert(){const e=(0,a.normalizeWhiteSpaces)(this._mathmlElement.value).trim();return n.mathNumberByGlyph[e]||e}};},3487:(e,t,r)=>{"use strict";Object.defineProperty(t,"__esModule",{value:!0}),t.MO=void 0;const a=r(4279),n=r(5406);t.MO=class{constructor(e){this._mathmlElement=e;}convert(){const e=(0,a.normalizeWhiteSpaces)(this._mathmlElement.value).trim();return o.operate(e)}};class o{constructor(e){this._value=e;}static operate(e){return new o(e)._operate()}_operate(){return this._findByCharacter()||this._findByGlyph()||this._findByNumber()||(new n.HashUTF8ToLtXConverter).convert(this._value)}_findByCharacter(){return n.allMathOperatorsByChar[this._value]}_findByGlyph(){return n.allMathOperatorsByGlyph[this._value]}_findByNumber(){return n.mathNumberByGlyph[this._value]}}},7443:(e,t)=>{"use strict";Object.defineProperty(t,"__esModule",{value:!0}),t.MPhantom=void 0,t.MPhantom=class{constructor(e){this._mathmlElement=e;}convert(){return ""}};},6052:(e,t,r)=>{"use strict";Object.defineProperty(t,"__esModule",{value:!0}),t.MRoot=void 0;const a=r(4279),n=r(8917);t.MRoot=class{constructor(e){this._mathmlElement=e;}convert(){const{name:e,children:t}=this._mathmlElement,r=t.length;if(2!==r)throw new n.InvalidNumberOfChildrenError(e,2,r);const o=(0,a.mathMLElementToLaTeXConverter)(t[0]).convert();return `\\sqrt[${(0,a.mathMLElementToLaTeXConverter)(t[1]).convert()}]{${o}}`}};},6346:(e,t,r)=>{"use strict";Object.defineProperty(t,"__esModule",{value:!0}),t.MRow=void 0;const a=r(4279);t.MRow=class{constructor(e){this._mathmlElement=e;}convert(){return this._isLinearSystemPattern()?this._convertAsLinearSystem():this._mathmlElement.children.map((e=>(0,a.mathMLElementToLaTeXConverter)(e))).map((e=>e.convert())).join(" ")}_isLinearSystemPattern(){const{children:e}=this._mathmlElement;if(3!==e.length)return !1;const t=e[0],r="mo"===t.name&&"{"===t.value.trim(),a="mtable"===e[1].name,n=e[2],o="mo"===n.name&&""===n.value.trim();return r&&a&&o}_convertAsLinearSystem(){return `\\begin{cases} ${this._mathmlElement.children[1].children.map((e=>(0,a.mathMLElementToLaTeXConverter)(e))).map((e=>e.convert())).join(" \\\\ ")} \\end{cases}`}};},3700:(e,t)=>{"use strict";Object.defineProperty(t,"__esModule",{value:!0}),t.MSpace=void 0,t.MSpace=class{constructor(e){this._mathmlElement=e;}convert(){const{linebreak:e}=this._mathmlElement.attributes;return "newline"===e?" \\\\ ":" "}};},8686:(e,t,r)=>{"use strict";Object.defineProperty(t,"__esModule",{value:!0}),t.MSqrt=void 0;const a=r(4279);t.MSqrt=class{constructor(e){this._mathmlElement=e;}convert(){return `\\sqrt{${this._mathmlElement.children.map((e=>(0,a.mathMLElementToLaTeXConverter)(e))).map((e=>e.convert())).join(" ")}}`}};},2564:(e,t,r)=>{"use strict";Object.defineProperty(t,"__esModule",{value:!0}),t.MSub=void 0;const a=r(4279),n=r(8917);t.MSub=class{constructor(e){this._mathmlElement=e;}convert(){const{name:e,children:t}=this._mathmlElement,r=t.length;if(2!==r)throw new n.InvalidNumberOfChildrenError(e,2,r);const a=t[0],o=t[1];return `${this._handleBaseChild(a)}_${this._handleSubscriptChild(o)}`}_handleBaseChild(e){const t=e.children,r=(0,a.mathMLElementToLaTeXConverter)(e).convert();return t.length<=1?r:(new a.ParenthesisWrapper).wrapIfMoreThanOneChar(r)}_handleSubscriptChild(e){const t=(0,a.mathMLElementToLaTeXConverter)(e).convert();return (new a.BracketWrapper).wrap(t)}};},1358:(e,t,r)=>{"use strict";Object.defineProperty(t,"__esModule",{value:!0}),t.MSubsup=void 0;const a=r(4279),n=r(8917);t.MSubsup=class{constructor(e){this._mathmlElement=e;}convert(){const{name:e,children:t}=this._mathmlElement,r=t.length;if(3!==r)throw new n.InvalidNumberOfChildrenError(e,3,r);const a=t[0],o=t[1],i=t[2];return `${this._handleBaseChild(a)}_${this._handleSubscriptChild(o)}^${this._handleSuperscriptChild(i)}`}_handleBaseChild(e){const t=e.children,r=(0,a.mathMLElementToLaTeXConverter)(e).convert();return t.length<=1?r:(new a.ParenthesisWrapper).wrapIfMoreThanOneChar(r)}_handleSubscriptChild(e){const t=(0,a.mathMLElementToLaTeXConverter)(e).convert();return (new a.BracketWrapper).wrap(t)}_handleSuperscriptChild(e){const t=(0,a.mathMLElementToLaTeXConverter)(e).convert();return (new a.BracketWrapper).wrap(t)}};},6926:(e,t,r)=>{"use strict";Object.defineProperty(t,"__esModule",{value:!0}),t.MSup=void 0;const a=r(4279),n=r(8917);t.MSup=class{constructor(e){this._mathmlElement=e;}convert(){const{name:e,children:t}=this._mathmlElement,r=t.length;if(2!==r)throw new n.InvalidNumberOfChildrenError(e,2,r);const a=t[0],o=t[1];return `${this._handleBaseChild(a)}^${this._handleExponentChild(o)}`}_handleBaseChild(e){const t=e.children,r=(0,a.mathMLElementToLaTeXConverter)(e).convert();return t.length<=1?r:(new a.ParenthesisWrapper).wrapIfMoreThanOneChar(r)}_handleExponentChild(e){const t=(0,a.mathMLElementToLaTeXConverter)(e).convert();return (new a.BracketWrapper).wrap(t)}};},2350:(e,t,r)=>{"use strict";Object.defineProperty(t,"__esModule",{value:!0}),t.MTable=void 0;const a=r(4279);t.MTable=class{constructor(e){this._mathmlElement=e,this._addFlagRecursiveIfName(this._mathmlElement.children,"mtable","innerTable");}convert(){const e=this._mathmlElement.children.map((e=>(0,a.mathMLElementToLaTeXConverter)(e))).map((e=>e.convert())).join(" \\\\\n");return this._hasFlag("innerTable")?this._wrap(e):e}_wrap(e){return `\\begin{matrix}${e}\\end{matrix}`}_addFlagRecursiveIfName(e,t,r){e.forEach((e=>{e.name===t&&(e.attributes[r]=r),this._addFlagRecursiveIfName(e.children,t,r);}));}_hasFlag(e){return !!this._mathmlElement.attributes[e]}};},3951:(e,t,r)=>{"use strict";Object.defineProperty(t,"__esModule",{value:!0}),t.MText=void 0;const a=r(7037);t.MText=class{constructor(e){this._mathmlElement=e;}convert(){const{attributes:e,value:t}=this._mathmlElement;return [...t].map((e=>/^[a-zA-Z0-9]$/.test(e)||" "===e?{value:e,isAlphanumeric:!0}:{value:e,isAlphanumeric:!1})).reduce(((e,t)=>{if(t.isAlphanumeric){const r=e[e.length-1];if(r&&r.isAlphanumeric)return r.value+=t.value,e}return [...e,t]}),[]).map((t=>t.isAlphanumeric?new n(e.mathvariant).apply(t.value):new a.MI({name:"mi",attributes:{},children:[],value:t.value}).convert())).join("")}};class n{constructor(e){this._mathvariant=e||"normal";}apply(e){return this._commands.reduce(((t,r,a)=>0===a?`${r}{${e}}`:`${r}{${t}}`),"")}get _commands(){switch(this._mathvariant){case "bold":return ["\\textbf"];case "italic":return ["\\textit"];case "bold-italic":return ["\\textit","\\textbf"];case "double-struck":return ["\\mathbb"];case "monospace":return ["\\mathtt"];case "bold-fraktur":case "fraktur":return ["\\mathfrak"];default:return ["\\text"]}}}},1586:(e,t,r)=>{"use strict";Object.defineProperty(t,"__esModule",{value:!0}),t.MTr=void 0;const a=r(4279);t.MTr=class{constructor(e){this._mathmlElement=e;}convert(){return this._mathmlElement.children.map((e=>(0,a.mathMLElementToLaTeXConverter)(e))).map((e=>e.convert())).join(" & ")}};},1222:(e,t,r)=>{"use strict";Object.defineProperty(t,"__esModule",{value:!0}),t.MUnderover=void 0;const a=r(4279),n=r(8917);t.MUnderover=class{constructor(e){this._mathmlElement=e;}convert(){const{name:e,children:t}=this._mathmlElement,r=t.length;if(3!==r)throw new n.InvalidNumberOfChildrenError(e,3,r);return `${(0,a.mathMLElementToLaTeXConverter)(t[0]).convert()}_{${(0,a.mathMLElementToLaTeXConverter)(t[1]).convert()}}^{${(0,a.mathMLElementToLaTeXConverter)(t[2]).convert()}}`}};},9165:(e,t)=>{"use strict";Object.defineProperty(t,"__esModule",{value:!0}),t.Void=void 0,t.Void=class{constructor(e){this._mathmlElement=e;}convert(){return ""}};},5443:function(e,t,r){"use strict";var a=this&&this.__createBinding||(Object.create?function(e,t,r,a){void 0===a&&(a=r);var n=Object.getOwnPropertyDescriptor(t,r);n&&!("get"in n?!t.__esModule:n.writable||n.configurable)||(n={enumerable:!0,get:function(){return t[r]}}),Object.defineProperty(e,a,n);}:function(e,t,r,a){void 0===a&&(a=r),e[a]=t[r];}),n=this&&this.__setModuleDefault||(Object.create?function(e,t){Object.defineProperty(e,"default",{enumerable:!0,value:t});}:function(e,t){e.default=t;}),o=this&&this.__importStar||function(e){if(e&&e.__esModule)return e;var t={};if(null!=e)for(var r in e)"default"!==r&&Object.prototype.hasOwnProperty.call(e,r)&&a(t,e,r);return n(t,e),t};Object.defineProperty(t,"__esModule",{value:!0}),t.MathMLElementToLatexConverterAdapter=void 0;const i=o(r(6959)),s=r(2697);t.MathMLElementToLatexConverterAdapter=class{constructor(e){this._mathMLElement=null!=e?e:new s.VoidMathMLElement;}toLatexConverter(){const{name:e}=this._mathMLElement;return new(l[e]||i.GenericSpacingWrapper)(this._mathMLElement)}};const l={math:i.Math,mi:i.MI,mo:i.MO,mn:i.MN,msqrt:i.MSqrt,mfenced:i.MFenced,mfrac:i.MFrac,mroot:i.MRoot,maction:i.MAction,menclose:i.MEnclose,merror:i.MError,mphantom:i.MPhantom,msup:i.MSup,msub:i.MSub,msubsup:i.MSubsup,mmultiscripts:i.MMultiscripts,mtext:i.MText,munderover:i.MUnderover,mtable:i.MTable,mtr:i.MTr,mover:i.GenericUnderOver,munder:i.GenericUnderOver,mrow:i.MRow,mspace:i.MSpace,mpadded:i.GenericSpacingWrapper,void:i.Void};},5243:(e,t)=>{"use strict";Object.defineProperty(t,"__esModule",{value:!0}),t.ErrorHandler=void 0,t.ErrorHandler=class{constructor(){this._errors=[],this.errorLocator={};}fixError(e,t){return this._isMissingAttributeValueError(t)?(this._errors.push(t),this._fixMissingAttribute(t,e)):e}isThereAnyErrors(){return this._errors.length>0}cleanErrors(){this._errors=[];}_fixMissingAttribute(e,t){const r=e.split('"')[1];if(r)return t.replace(this._matchMissingValueForAttribute(r),"");for(;this._mathGenericMissingValue().exec(t);)t=t.replace(this._mathGenericMissingValue(),"$1$3");return t}_matchMissingValueForAttribute(e){return new RegExp(`(${e}=(?!("|')))|(${e}(?!("|')))`,"gm")}_mathGenericMissingValue(){return /(\<.* )(\w+=(?!\"|\'))(.*\>)/gm}_isMissingAttributeValueError(e){return !!e.includes("attribute")&&!!e.includes("missed")||e.includes("attribute value missed")}};},9208:function(e,t,r){"use strict";var a=this&&this.__createBinding||(Object.create?function(e,t,r,a){void 0===a&&(a=r);var n=Object.getOwnPropertyDescriptor(t,r);n&&!("get"in n?!t.__esModule:n.writable||n.configurable)||(n={enumerable:!0,get:function(){return t[r]}}),Object.defineProperty(e,a,n);}:function(e,t,r,a){void 0===a&&(a=r),e[a]=t[r];}),n=this&&this.__exportStar||function(e,t){for(var r in e)"default"===r||Object.prototype.hasOwnProperty.call(t,r)||a(t,e,r);};Object.defineProperty(t,"__esModule",{value:!0}),n(r(9548),t),n(r(5243),t),n(r(1101),t);},1101:(e,t)=>{"use strict";Object.defineProperty(t,"__esModule",{value:!0}),t.ElementsToMathMLAdapter=void 0,t.ElementsToMathMLAdapter=class{convert(e){return e.filter((e=>void 0!==e.tagName)).map((e=>this._convertElement(e)))}_convertElement(e){return {name:e.tagName,attributes:this._convertElementAttributes(e.attributes),value:this._hasElementChild(e)?"":e.textContent||"",children:this._hasElementChild(e)?this.convert(Array.from(e.childNodes)):[]}}_convertElementAttributes(e){return Array.from(e).reduce(((e,t)=>Object.assign({[t.nodeName]:t.nodeValue===t.nodeName?"":t.nodeValue},e)),{})}_hasElementChild(e){const t=e.childNodes;return !!t&&0!==t.length&&this._isThereAnyNoTextNode(t)}_isThereAnyNoTextNode(e){return Array.from(e).some((e=>"#text"!==e.nodeName))}};},9548:function(e,t,r){"use strict";var a=this&&this.__importDefault||function(e){return e&&e.__esModule?e:{default:e}};Object.defineProperty(t,"__esModule",{value:!0}),t.XmlToMathMLAdapter=void 0;const n=a(r(8978));t.XmlToMathMLAdapter=class{constructor(e,t){this._xml="",this._elementsConvertor=e,this._errorHandler=t,this._xmlDOM=new n.default.DOMParser({locator:this._errorHandler.errorLocator,errorHandler:this._fixError.bind(this)});}convert(e){return this._xml=this._removeLineBreaks(e),this._xml=this._removeMsWordPrefixes(this._xml),this._elementsConvertor.convert(this._mathMLElements)}_fixError(e){this._xml=this._errorHandler.fixError(this._xml,e);}_removeLineBreaks(e){return e.replace(/\n|\r\n|\r/g,"")}_removeMsWordPrefixes(e){return e.replace(/mml:/g,"")}get _mathMLElements(){let e=this._xmlDOM.parseFromString(this._xml).getElementsByTagName("math");return this._errorHandler.isThereAnyErrors()&&(this._errorHandler.cleanErrors(),e=this._xmlDOM.parseFromString(this._xml).getElementsByTagName("math")),Array.from(e)}};},7941:function(e,t,r){"use strict";var a=this&&this.__createBinding||(Object.create?function(e,t,r,a){void 0===a&&(a=r);var n=Object.getOwnPropertyDescriptor(t,r);n&&!("get"in n?!t.__esModule:n.writable||n.configurable)||(n={enumerable:!0,get:function(){return t[r]}}),Object.defineProperty(e,a,n);}:function(e,t,r,a){void 0===a&&(a=r),e[a]=t[r];}),n=this&&this.__exportStar||function(e,t){for(var r in e)"default"===r||Object.prototype.hasOwnProperty.call(t,r)||a(t,e,r);};Object.defineProperty(t,"__esModule",{value:!0}),n(r(8585),t);},8585:(e,t,r)=>{"use strict";Object.defineProperty(t,"__esModule",{value:!0}),t.makeToMathElementsConverter=void 0;const a=r(9208);t.makeToMathElementsConverter=()=>{const e=new a.ElementsToMathMLAdapter,t=new a.ErrorHandler;return new a.XmlToMathMLAdapter(e,t)};},8672:function(e,t,r){"use strict";var a=this&&this.__createBinding||(Object.create?function(e,t,r,a){void 0===a&&(a=r);var n=Object.getOwnPropertyDescriptor(t,r);n&&!("get"in n?!t.__esModule:n.writable||n.configurable)||(n={enumerable:!0,get:function(){return t[r]}}),Object.defineProperty(e,a,n);}:function(e,t,r,a){void 0===a&&(a=r),e[a]=t[r];}),n=this&&this.__exportStar||function(e,t){for(var r in e)"default"===r||Object.prototype.hasOwnProperty.call(t,r)||a(t,e,r);};Object.defineProperty(t,"__esModule",{value:!0}),n(r(3798),t);},3798:(e,t,r)=>{"use strict";Object.defineProperty(t,"__esModule",{value:!0}),t.MathMLToLaTeX=void 0;const a=r(5443),n=r(7941);t.MathMLToLaTeX=class{static convert(e){return (0,n.makeToMathElementsConverter)().convert(e).map((e=>new a.MathMLElementToLatexConverterAdapter(e).toLatexConverter())).map((e=>e.convert())).join("").trim()}};},2965:(e,t)=>{"use strict";Object.defineProperty(t,"__esModule",{value:!0}),t.allMathOperatorsByChar=void 0,t.allMathOperatorsByChar={_:"\\underline","&#x23E1;":"\\underbrace","&#x23E0;":"\\overbrace","&#x23DF;":"\\underbrace","&#x23DE;":"\\overbrace","&#x23DD;":"\\underbrace","&#x23DC;":"\\overbrace","&#x23B5;":"\\underbrace","&#x23B4;":"\\overbrace","&#x20DC;":"\\square","&#x20DB;":"\\square","&#x2064;":"","&#x2057;":"''''","&#x203E;":"\\bar","&#x2037;":"```","&#x2036;":"``","&#x2035;":"`","&#x2034;":"'''","&#x2033;":"''","&#x201F;":"``","&#x201E;":",,","&#x201B;":"`","&#x201A;":",","&#x302;":"\\hat","&#x2F7;":"\\sim","&#x2DD;":"\\sim","&#x2DC;":"\\sim","&#x2DA;":"\\circ","&#x2D9;":"\\cdot","&#x2D8;":"","&#x2CD;":"\\_","&#x2CB;":"ˋ","&#x2CA;":"ˊ","&#x2C9;":"ˉ","&#x2C7;":"","&#x2C6;":"\\hat","&#xBA;":"o","&#xB9;":"1","&#xB8;":"¸","&#xB4;":"´","&#xB3;":"3","&#xB2;":"2","&#xB0;":"\\circ","&#xAF;":"\\bar","&#xAA;":"a","&#xA8;":"\\cdot\\cdot","~":"\\sim","`":"`","^":"\\hat","--":"--","++":"++","&amp;":"\\&","&#x2061;":"","&#x221C;":"\\sqrt[4]{}","&#x221B;":"\\sqrt[3]{}","&#x221A;":"\\sqrt{}","&#x2146;":"d","&#x2145;":"\\mathbb{D}","?":"?","@":"@","//":"//","!!":"!!","!":"!","&#x266F;":"\\#","&#x266E;":"","&#x266D;":"","&#x2032;":"'","&lt;>":"<>","**":"\\star\\star","&#x2207;":"\\nabla","&#x2202;":"\\partial","&#x2299;":"\\bigodot","&#xAC;":"\\neg","&#x2222;":"\\measuredangle","&#x2221;":"\\measuredangle","&#x2220;":"\\angle","&#xF7;":"\\div","/":"/","&#x2216;":"\\backslash","\\":"\\backslash","%":"\\%","&#x2297;":"\\bigotimes","&#xB7;":"\\cdot","&#x2A3F;":"\\coprod","&#x2A2F;":"\\times","&#x22C5;":"\\cdot","&#x22A1;":"\\boxdot","&#x22A0;":"\\boxtimes","&#x2062;":"","&#x2043;":"-","&#x2022;":"\\cdot","&#xD7;":"\\times",".":".","*":"\\star","&#x222A;":"\\cup","&#x2229;":"\\cap","&#x2210;":"\\coprod","&#x220F;":"\\prod","&#x2240;":"","&#x2AFF;":"","&#x2AFC;":"\\mid\\mid\\mid","&#x2A09;":"\\times","&#x2A08;":"","&#x2A07;":"","&#x2A06;":"\\sqcup","&#x2A05;":"\\sqcap","&#x2A02;":"\\otimes","&#x2A00;":"\\odot","&#x22C2;":"\\cap","&#x22C1;":"\\vee","&#x22C0;":"\\wedge","&#x2A04;":"\\uplus","&#x2A03;":"\\cup","&#x22C3;":"\\cup","&#x2A1C;":"\\underline{\\int}","&#x2A1B;":"\\overline{\\int}","&#x2A1A;":"\\int","&#x2A19;":"\\int","&#x2A18;":"\\int","&#x2A17;":"\\int","&#x2A16;":"\\oint","&#x2A15;":"\\oint","&#x2A14;":"\\int","&#x2A13;":"\\int","&#x2A12;":"\\int","&#x2A11;":"\\int","&#x2A10;":"\\int","&#x2A0F;":"\\bcancel{\\int}","&#x2A0E;":"","&#x2A0D;":"\\hcancel{\\int}","&#x2A0C;":"\\iiiint","&#x2233;":"\\oint","&#x2232;":"\\oint","&#x2231;":"\\int","&#x2230;":"\\oiint","&#x222F;":"\\oiint","&#x222E;":"\\oint","&#x222B;":"\\int","&#x2A01;":"\\oplus","&#x2298;":"\\oslash","&#x2296;":"\\ominus","&#x2295;":"\\oplus","&#x222D;":"\\iiint","&#x222C;":"\\iint","&#x2A0B;":"","&#x2A0A;":"","&#x2211;":"\\sum","&#x229F;":"\\boxminus","&#x229E;":"\\boxplus","&#x2214;":"\\dot{+}","&#x2213;":"+-","&#x2212;":"-","&#xB1;":"\\pm","-":"-","+":"+","&#x2B46;":"\\Rrightarrow","&#x2B45;":"\\Lleftarrow","&#x29F4;":":\\rightarrow","&#x29EF;":"","&#x29DF;":"\\bullet-\\bullet","&#x299F;":"\\angle","&#x299E;":"\\measuredangle","&#x299D;":"\\measuredangle","&#x299C;":"\\perp","&#x299B;":"\\measuredangle","&#x299A;":"","&#x2999;":"\\vdots","&#x297F;":"","&#x297E;":"","&#x297D;":"\\prec","&#x297C;":"\\succ","&#x297B;":"\\underset{\\rightarrow}{\\supset}","&#x297A;":"","&#x2979;":"\\underset{\\rightarrow}{\\subset}","&#x2978;":"\\underset{\\rightarrow}{>}","&#x2977;":"","&#x2976;":"\\underset{\\leftarrow}{<}","&#x2975;":"\\underset{\\approx}{\\rightarrow}","&#x2974;":"\\underset{\\sim}{\\rightarrow}","&#x2973;":"\\underset{\\sim}{\\leftarrow}","&#x2972;":"\\overset{\\sim}{\\rightarrow}","&#x2971;":"\\overset{=}{\\rightarrow}","&#x2970;":"","&#x296F;":"","&#x296E;":"","&#x296D;":"\\overline{\\rightharpoondown}","&#x296C;":"\\underline{\\rightharpoonup}","&#x296B;":"\\overline{\\leftharpoondown}","&#x296A;":"\\underline{\\leftharpoonup}","&#x2969;":"\\rightleftharpoons","&#x2968;":"\\rightleftharpoons","&#x2967;":"\\rightleftharpoons","&#x2966;":"\\rightleftharpoons","&#x2965;":"\\Downarrow","&#x2964;":"\\Rightarrow","&#x2963;":"\\Uparrow","&#x2962;":"\\Leftarrow","&#x2961;":"\\downarrow","&#x2960;":"\\uparrow","&#x295F;":"\\rightarrow","&#x295E;":"\\leftarrow","&#x295D;":"\\downarrow","&#x295C;":"\\uparrow","&#x295B;":"\\rightarrow","&#x295A;":"\\leftarrow","&#x2959;":"\\downarrow","&#x2958;":"\\uparrow","&#x2957;":"\\rightarrow","&#x2956;":"\\leftarrow","&#x2955;":"\\downarrow","&#x2954;":"\\uparrow","&#x2953;":"\\rightarrow","&#x2952;":"\\leftarrow","&#x2951;":"\\updownarrow","&#x2950;":"\\leftrightarrow","&#x294F;":"\\updownarrow","&#x294E;":"\\leftrightarrow","&#x294D;":"\\updownarrow","&#x294C;":"\\updownarrow","&#x294B;":"\\leftrightarrow","&#x294A;":"\\leftrightarrow","&#x2949;":"","&#x2948;":"\\leftrightarrow","&#x2947;":"\\nrightarrow","&#x2946;":"","&#x2945;":"","&#x2944;":"\\rightleftarrows","&#x2943;":"\\leftrightarrows","&#x2942;":"\\rightleftarrows","&#x2941;":"\\circlearrowright","&#x2940;":"\\circlearrowleft","&#x293F;":"\\rightarrow","&#x293E;":"\\leftarrow","&#x293D;":"","&#x293C;":"","&#x293B;":"","&#x293A;":"","&#x2939;":"","&#x2938;":"","&#x2937;":"\\Rsh","&#x2936;":"\\Lsh","&#x2935;":"\\downarrow","&#x2934;":"\\uparrow","&#x2933;":"\\leadsto","&#x2932;":"","&#x2931;":"","&#x2930;":"","&#x292F;":"","&#x292E;":"","&#x292D;":"","&#x292C;":"\\times","&#x292B;":"\\times","&#x292A;":"","&#x2929;":"","&#x2928;":"","&#x2927;":"","&#x2926;":"","&#x2925;":"","&#x2924;":"","&#x2923;":"","&#x2922;":"","&#x2921;":"","&#x2920;":"\\mapsto\\cdot","&#x291F;":"\\cdot\\leftarrow","&#x291E;":"\\rightarrow\\cdot","&#x291D;":"\\leftarrow","&#x291C;":"\\rightarrow","&#x291B;":"\\leftarrow","&#x291A;":"\\rightarrow","&#x2919;":"\\leftarrow","&#x2918;":"\\rightarrow","&#x2917;":"\\rightarrow","&#x2916;":"\\rightarrow","&#x2915;":"\\rightarrow","&#x2914;":"\\rightarrow","&#x2913;":"\\downarrow","&#x2912;":"\\uparrow","&#x2911;":"\\rightarrow","&#x2910;":"\\rightarrow","&#x290F;":"\\rightarrow","&#x290E;":"\\leftarrow","&#x290D;":"\\rightarrow","&#x290C;":"\\leftarrow","&#x290B;":"\\Downarrow","&#x290A;":"\\Uparrow","&#x2909;":"\\uparrow","&#x2908;":"\\downarrow","&#x2907;":"\\Rightarrow","&#x2906;":"\\Leftarrow","&#x2905;":"\\mapsto","&#x2904;":"\\nLeftrightarrow","&#x2903;":"\\nRightarrow","&#x2902;":"\\nLeftarrow","&#x2901;":"\\rightsquigarrow","&#x2900;":"\\rightsquigarrow","&#x27FF;":"\\rightsquigarrow","&#x27FE;":"\\Rightarrow","&#x27FD;":"\\Leftarrow","&#x27FC;":"\\mapsto","&#x27FB;":"\\leftarrow","&#x27FA;":"\\Longleftrightarrow","&#x27F9;":"\\Longrightarrow","&#x27F8;":"\\Longleftarrow","&#x27F7;":"\\leftrightarrow","&#x27F6;":"\\rightarrow","&#x27F5;":"\\leftarrow","&#x27F1;":"\\Downarrow","&#x27F0;":"\\Uparrow","&#x22B8;":"\\rightarrow","&#x21FF;":"\\leftrightarrow","&#x21FE;":"\\rightarrow","&#x21FD;":"\\leftarrow","&#x21FC;":"\\nleftrightarrow","&#x21FB;":"\\nrightarrow","&#x21FA;":"\\nleftarrow","&#x21F9;":"\\nleftrightarrow","&#x21F8;":"\\nrightarrow","&#x21F7;":"\\nleftarrow","&#x21F6;":"\\Rrightarrow","&#x21F5;":"","&#x21F4;":"\\rightarrow","&#x21F3;":"\\Updownarrow","&#x21F2;":"\\searrow","&#x21F1;":"\\nwarrow","&#x21F0;":"\\Leftarrow","&#x21EF;":"\\Uparrow","&#x21EE;":"\\Uparrow","&#x21ED;":"\\Uparrow","&#x21EC;":"\\Uparrow","&#x21EB;":"\\Uparrow","&#x21EA;":"\\Uparrow","&#x21E9;":"\\Downarrow","&#x21E8;":"\\Rightarrow","&#x21E7;":"\\Uparrow","&#x21E6;":"\\Leftarrow","&#x21E5;":"\\rightarrow","&#x21E4;":"\\leftarrow","&#x21E3;":"\\downarrow","&#x21E2;":"\\rightarrow","&#x21E1;":"\\uparrow","&#x21E0;":"\\leftarrow","&#x21DF;":"\\downarrow","&#x21DE;":"\\uparrow","&#x21DD;":"\\rightsquigarrow","&#x21DC;":"\\leftarrow","&#x21DB;":"\\Rrightarrow","&#x21DA;":"\\Lleftarrow","&#x21D9;":"\\swarrow","&#x21D8;":"\\searrow","&#x21D7;":"\\nearrow","&#x21D6;":"\\nwarrow","&#x21D5;":"\\Updownarrow","&#x21D4;":"\\Leftrightarrow","&#x21D3;":"\\Downarrow","&#x21D2;":"\\Rightarrow","&#x21D1;":"\\Uparrow","&#x21D0;":"\\Leftarrow","&#x21CF;":"\\nRightarrow","&#x21CE;":"\\nLeftrightarrow","&#x21CD;":"\\nLeftarrow","&#x21CC;":"\\rightleftharpoons","&#x21CB;":"\\leftrightharpoons","&#x21CA;":"\\downdownarrows","&#x21C9;":"\\rightrightarrows","&#x21C8;":"\\upuparrows","&#x21C7;":"\\leftleftarrows","&#x21C6;":"\\leftrightarrows","&#x21C5;":"","&#x21C4;":"\\rightleftarrows","&#x21C3;":"\\downharpoonleft","&#x21C2;":"\\downharpoonright","&#x21C1;":"\\rightharpoondown","&#x21C0;":"\\rightharpoonup","&#x21BF;":"\\upharpoonleft","&#x21BE;":"\\upharpoonright","&#x21BD;":"\\leftharpoondown","&#x21BC;":"\\leftharpoonup","&#x21BB;":"\\circlearrowright","&#x21BA;":"\\circlearrowleft","&#x21B9;":"\\leftrightarrows","&#x21B8;":"\\overline{\\nwarrow}","&#x21B7;":"\\curvearrowright","&#x21B6;":"\\curvearrowleft","&#x21B5;":"\\swarrow","&#x21B4;":"\\searrow","&#x21B3;":"\\Rsh","&#x21B2;":"\\Lsh","&#x21B1;":"\\Rsh","&#x21B0;":"\\Lsh","&#x21AF;":"\\swarrow","&#x21AE;":"","&#x21AD;":"\\leftrightsquigarrow","&#x21AC;":"\\looparrowright","&#x21AB;":"\\looparrowleft","&#x21AA;":"\\hookrightarrow","&#x21A9;":"\\hookleftarrow","&#x21A8;":"\\underline{\\updownarrow}","&#x21A7;":"\\downarrow","&#x21A6;":"\\rightarrowtail","&#x21A5;":"\\uparrow","&#x21A4;":"\\leftarrowtail","&#x21A3;":"\\rightarrowtail","&#x21A2;":"\\leftarrowtail","&#x21A1;":"\\downarrow","&#x21A0;":"\\twoheadrightarrow","&#x219F;":"\\uparrow","&#x219E;":"\\twoheadleftarrow","&#x219D;":"\\nearrow","&#x219C;":"\\nwarrow","&#x219B;":"","&#x219A;":"","&#x2199;":"\\swarrow","&#x2198;":"\\searrow","&#x2197;":"\\nearrow","&#x2196;":"\\nwarrow","&#x2195;":"\\updownarrow","&#x2194;":"\\leftrightarrow","&#x2193;":"\\downarrow","&#x2192;":"\\rightarrow","&#x2191;":"\\uparrow","&#x2190;":"\\leftarrow","|||":"\\left|||\\right.","||":"\\left||\\right.","|":"\\left|\\right.","&#x2AFE;":"","&#x2AFD;":"//","&#x2AFB;":"///","&#x2AFA;":"","&#x2AF9;":"","&#x2AF8;":"","&#x2AF7;":"","&#x2AF6;":"\\vdots","&#x2AF5;":"","&#x2AF4;":"","&#x2AF3;":"","&#x2AF2;":"\\nparallel","&#x2AF1;":"","&#x2AF0;":"","&#x2AEF;":"","&#x2AEE;":"\\bcancel{\\mid}","&#x2AED;":"","&#x2AEC;":"","&#x2AEB;":"","&#x2AEA;":"","&#x2AE9;":"","&#x2AE8;":"\\underline{\\perp}","&#x2AE7;":"\\overline{\\top}","&#x2AE6;":"","&#x2AE5;":"","&#x2AE4;":"","&#x2AE3;":"","&#x2AE2;":"","&#x2AE1;":"","&#x2AE0;":"\\perp","&#x2ADF;":"\\top","&#x2ADE;":"\\dashv","&#x2ADD;&#x338;":"","&#x2ADD;":"","&#x2ADB;":"\\pitchfork","&#x2ADA;":"","&#x2AD9;":"","&#x2AD8;":"","&#x2AD7;":"","&#x2AD6;":"","&#x2AD5;":"","&#x2AD4;":"","&#x2AD3;":"","&#x2AD2;":"","&#x2AD1;":"","&#x2AD0;":"","&#x2ACF;":"","&#x2ACE;":"","&#x2ACD;":"","&#x2ACC;":"\\underset{\\neq}{\\supset}","&#x2ACB;":"\\underset{\\neq}{\\subset}","&#x2ACA;":"\\underset{\\approx}{\\supset}","&#x2AC9;":"\\underset{\\approx}{\\subset}","&#x2AC8;":"\\underset{\\sim}{\\supset}","&#x2AC7;":"\\underset{\\sim}{\\subset}","&#x2AC6;":"\\supseteqq","&#x2AC5;":"\\subseteqq","&#x2AC4;":"\\dot{\\supseteq}","&#x2AC3;":"\\dot{\\subseteq}","&#x2AC2;":"\\underset{\\times}{\\supset}","&#x2AC1;":"\\underset{\\times}{\\subset}","&#x2AC0;":"\\underset{+}{\\supset}","&#x2ABF;":"\\underset{+}{\\subset}","&#x2ABE;":"","&#x2ABD;":"","&#x2ABC;":"\\gg ","&#x2ABB;":"\\ll","&#x2ABA;":"\\underset{\\cancel{\\approx}}{\\succ}","&#x2AB9;":"\\underset{\\cancel{\\approx}}{\\prec}","&#x2AB8;":"\\underset{\\approx}{\\succ}","&#x2AB7;":"\\underset{\\approx}{\\prec}","&#x2AB6;":"\\underset{\\cancel{=}}{\\succ}","&#x2AB5;":"\\underset{\\cancel{=}}{\\prec}","&#x2AB4;":"\\underset{=}{\\succ}","&#x2AB3;":"\\underset{=}{\\prec}","&#x2AB2;":"","&#x2AB1;":"","&#x2AAE;":"","&#x2AAD;":"\\underline{\\hcancel{>}}","&#x2AAC;":"\\underline{\\hcancel{>}}","&#x2AAB;":"\\hcancel{>}","&#x2AAA;":"\\hcancel{<}","&#x2AA9;":"","&#x2AA8;":"","&#x2AA7;":"\\vartriangleright","&#x2AA6;":"\\vartriangleleft","&#x2AA5;":"><","&#x2AA4;":"><","&#x2AA3;":"\\underline{\\ll}","&#x2AA2;&#x338;":"\\cancel{\\gg}","&#x2AA2;":"\\gg","&#x2AA1;&#x338;":"\\cancel{\\ll}","&#x2AA1;":"\\ll","&#x2AA0;":"\\overset{\\sim}{\\geqq}","&#x2A9F;":"\\overset{\\sim}{\\leqq}","&#x2A9E;":"\\overset{\\sim}{>}","&#x2A9D;":"\\overset{\\sim}{<}","&#x2A9C;":"","&#x2A9B;":"","&#x2A9A;":"\\overset{=}{>}","&#x2A99;":"\\overset{=}{<}","&#x2A98;":"","&#x2A97;":"","&#x2A96;":"","&#x2A95;":"","&#x2A94;":"","&#x2A93;":"","&#x2A92;":"\\underset{=}{\\gtrless}","&#x2A91;":"\\underset{=}{\\lessgtr}","&#x2A90;":"\\underset{<}{\\gtrsim}","&#x2A8F;":"\\underset{>}{\\lesssim}","&#x2A8E;":"\\underset{\\simeq}{>}","&#x2A8D;":"\\underset{\\simeq}{<}","&#x2A8C;":"\\gtreqqless","&#x2A8B;":"\\lesseqqgtr","&#x2A8A;":"\\underset{\\cancel{\\approx}}{>}","&#x2A89;":"\\underset{\\approx}{<}","&#x2A86;":"\\underset{\\approx}{>}","&#x2A85;":"\\underset{\\approx}{<}","&#x2A84;":"","&#x2A83;":"","&#x2A82;":"","&#x2A81;":"","&#x2A80;":"","&#x2A7F;":"","&#x2A7E;&#x338;":"\\bcancel{\\geq}","&#x2A7E;":"\\geq","&#x2A7D;&#x338;":"\\bcancel{\\leq}","&#x2A7D;":"\\leq","&#x2A7C;":"","&#x2A7B;":"","&#x2A7A;":"","&#x2A79;":"","&#x2A78;":"\\overset{\\dots}{\\equiv}","&#x2A77;":"","&#x2A76;":"===","&#x2A75;":"==","&#x2A74;":"::=","&#x2A73;":"","&#x2A72;":"\\underset{=}{+}","&#x2A71;":"\\overset{=}{+}","&#x2A70;":"\\overset{\\approx}{=}","&#x2A6F;":"\\overset{\\wedge}{=}","&#x2A6E;":"\\overset{*}{=}","&#x2A6D;":"\\dot{\\approx}","&#x2A6C;":"","&#x2A6B;":"","&#x2A6A;":"\\dot{\\sim}","&#x2A69;":"","&#x2A68;":"","&#x2A67;":"\\dot{\\equiv}","&#x2A66;":"\\underset{\\cdot}{=}","&#x2A65;":"","&#x2A64;":"","&#x2A63;":"\\underset{=}{\\vee}","&#x2A62;":"\\overset{=}{\\vee}","&#x2A61;":"ul(vv)","&#x2A60;":"\\underset{=}{\\wedge}","&#x2A5F;":"\\underline{\\wedge}","&#x2A5E;":"\\overset{=}{\\wedge}","&#x2A5D;":"\\hcancel{\\vee}","&#x2A5C;":"\\hcancel{\\wedge}","&#x2A5B;":"","&#x2A5A;":"","&#x2A59;":"","&#x2A58;":"\\vee","&#x2A57;":"\\wedge","&#x2A56;":"","&#x2A55;":"","&#x2A54;":"","&#x2A53;":"","&#x2A52;":"\\dot{\\vee}","&#x2A51;":"\\dot{\\wedge}","&#x2A50;":"","&#x2A4F;":"","&#x2A4E;":"","&#x2A4D;":"\\overline{\\cap}","&#x2A4C;":"\\overline{\\cup}","&#x2A4B;":"","&#x2A4A;":"","&#x2A49;":"","&#x2A48;":"","&#x2A47;":"","&#x2A46;":"","&#x2A45;":"","&#x2A44;":"","&#x2A43;":"\\overline{\\cap}","&#x2A42;":"\\overline{\\cup}","&#x2A41;":"","&#x2A40;":"","&#x2A3E;":"","&#x2A3D;":"\\llcorner","&#x2A3C;":"\\lrcorner","&#x2A3B;":"","&#x2A3A;":"","&#x2A39;":"","&#x2A38;":"","&#x2A37;":"","&#x2A36;":"\\hat{\\otimes}","&#x2A35;":"","&#x2A34;":"","&#x2A33;":"","&#x2A32;":"\\underline{\\times}","&#x2A31;":"\\underline{\\times}","&#x2A30;":"\\dot{\\times}","&#x2A2E;":"","&#x2A2D;":"","&#x2A2C;":"","&#x2A2B;":"","&#x2A2A;":"","&#x2A29;":"","&#x2A28;":"","&#x2A27;":"","&#x2A26;":"\\underset{\\sim}{+}","&#x2A25;":"\\underset{\\circ}{+}","&#x2A24;":"\\overset{\\sim}{+}","&#x2A23;":"\\hat{+}","&#x2A22;":"\\dot{+}","&#x2A21;":"\\upharpoonright","&#x2A20;":">>","&#x2A1F;":"","&#x2A1E;":"\\triangleleft","&#x2A1D;":"\\bowtie","&#x29FF;":"","&#x29FE;":"+","&#x29FB;":"\\hcancel{|||}","&#x29FA;":"\\hcancel{||}","&#x29F9;":"\\backslash","&#x29F8;":"/","&#x29F7;":"hcancel{\backslash}","&#x29F6;":"","&#x29F5;":"\\backslash","&#x29F2;":"\\Phi","&#x29F1;":"","&#x29F0;":"","&#x29EE;":"","&#x29ED;":"","&#x29EC;":"","&#x29EB;":"\\lozenge","&#x29EA;":"","&#x29E9;":"","&#x29E8;":"","&#x29E7;":"\\ddagger","&#x29E2;":"\\sqcup\\sqcup","&#x29E1;":"","&#x29E0;":"\\square","&#x29DE;":"","&#x29DD;":"","&#x29DC;":"","&#x29DB;":"\\{\\{","&#x29D9;":"\\{","&#x29D8;":"\\}","&#x29D7;":"","&#x29D6;":"","&#x29D5;":"\\bowtie","&#x29D4;":"\\bowtie","&#x29D3;":"\\bowtie","&#x29D2;":"\\bowtie","&#x29D1;":"\\bowtie","&#x29D0;&#x338;":"| \\not\\triangleright","&#x29D0;":"| \\triangleright","&#x29CF;&#x338;":"\\not\\triangleleft |","&#x29CF;":"\\triangleleft |","&#x29CE;":"","&#x29CD;":"\\triangle","&#x29CC;":"","&#x29CB;":"\\underline{\\triangle}","&#x29CA;":"\\dot{\\triangle}","&#x29C9;":"","&#x29C8;":"\\boxed{\\circ}","&#x29C7;":"\\boxed{\\circ}","&#x29C6;":"\\boxed{\\rightarrow}","&#x29C5;":"\\bcancel{\\square}","&#x29C4;":"\\cancel{\\square}","&#x29C3;":"\\odot","&#x29C2;":"\\odot","&#x29BF;":"\\odot","&#x29BE;":"\\odot","&#x29BD;":"\\varnothing","&#x29BC;":"\\oplus","&#x29BB;":"\\otimes","&#x29BA;":"","&#x29B9;":"\\varnothing","&#x29B8;":"\\varnothing","&#x29B7;":"\\ominus","&#x29B6;":"\\ominus","&#x29B5;":"\\ominus","&#x29B4;":"\\vec{\\varnothing}","&#x29B3;":"\\vec{\\varnothing}","&#x29B2;":"\\dot{\\varnothing}","&#x29B1;":"\\overline{\\varnothing}","&#x29B0;":"\\varnothing","&#x29AF;":"","&#x29AE;":"","&#x29AD;":"","&#x29AC;":"","&#x29AB;":"","&#x29AA;":"","&#x29A9;":"","&#x29A8;":"","&#x29A7;":"","&#x29A6;":"","&#x29A5;":"","&#x29A4;":"","&#x29A3;":"","&#x29A2;":"","&#x29A1;":"\\not\\lor","&#x29A0;":"\\bcancel{>}","&#x2982;":":","&#x2981;":"\\circ","&#x2758;":"|","&#x25B2;":"\\bigtriangleup","&#x22FF;":"\\Epsilon","&#x22FE;":"\\overline{\\ni}","&#x22FD;":"\\overline{\\ni}","&#x22FC;":"\\in","&#x22FB;":"\\in","&#x22FA;":"\\in","&#x22F9;":"\\underline{\\in}","&#x22F8;":"\\underline{\\in}","&#x22F7;":"\\overline{\\in}","&#x22F6;":"\\overline{\\in}","&#x22F5;":"\\dot{\\in}","&#x22F4;":"\\in","&#x22F3;":"\\in","&#x22F2;":"\\in","&#x22F0;":"\\ddots","&#x22E9;":"\\underset{\\sim}{\\succ}","&#x22E8;":"\\underset{\\sim}{\\prec}","&#x22E7;":"\\underset{\\not\\sim}{>}","&#x22E6;":"\\underset{\\not\\sim}{<}","&#x22E5;":"\\not\\sqsupseteq","&#x22E4;":"\\not\\sqsubseteq","&#x22E3;":"\\not\\sqsupseteq","&#x22E2;":"\\not\\sqsubseteq","&#x22E1;":"\\nsucc","&#x22E0;":"\\nprec","&#x22DF;":"\\succ","&#x22DE;":"\\prec","&#x22DD;":"\\overline{>}","&#x22DC;":"\\overline{<}","&#x22DB;":"\\underset{>}{\\leq}","&#x22DA;":"\\underset{<}{\\geq}","&#x22D5;":"\\#","&#x22D3;":"\\cup","&#x22D2;":"\\cap","&#x22D1;":"\\supset","&#x22D0;":"\\subset","&#x22CF;":"\\wedge","&#x22CE;":"\\vee","&#x22CD;":"\\simeq","&#x22C8;":"\\bowtie","&#x22C7;":"\\ast","&#x22C6;":"\\star","&#x22C4;":"\\diamond","&#x22BF;":"\\triangle","&#x22BE;":"\\measuredangle","&#x22BD;":"\\overline{\\lor}","&#x22BC;":"\\overline{\\land}","&#x22BB;":"\\underline{\\lor}","&#x22BA;":"\\top","&#x22B9;":"","&#x22B7;":"\\circ\\multimap","&#x22B6;":"\\circ\\multimap","&#x22B3;":"\\triangleright","&#x22B2;":"\\triangleleft","&#x22B1;":"\\succ","&#x22B0;":"\\prec","&#x22AB;":"|\\models","&#x22AA;":"|\\models","&#x22A7;":"\\models","&#x22A6;":"\\vdash","&#x229D;":"\\ominus","&#x229C;":"\\ominus","&#x229B;":"\\odot","&#x229A;":"\\odot","&#x2294;":"\\sqcup","&#x2293;":"\\sqcap","&#x2292;":"\\sqsupseteq","&#x2291;":"\\sqsubseteq","&#x2290;&#x338;":"\\not\\sqsupset","&#x2290;":"\\sqsupset","&#x228F;&#x338;":"\\not\\sqsubset","&#x228F;":"\\sqsubset","&#x228E;":"\\cup","&#x228D;":"\\cup","&#x228C;":"\\cup","&#x227F;&#x338;":"\\not\\succsim","&#x227F;":"\\succsim","&#x227E;":"\\precsim","&#x2279;":"\\not\\overset{>}{<}","&#x2278;":"\\not\\overset{>}{<}","&#x2277;":"\\overset{>}{<}","&#x2276;":"\\overset{<}{>}","&#x2275;":"\\not\\geg","&#x2274;":"\\not\\leq","&#x2273;":"\\geg","&#x2272;":"\\leq","&#x226C;":"","&#x2267;":"\\geg","&#x2266;&#x338;":"\\not\\leq","&#x2266;":"\\leq","&#x2263;":"\\overset{=}{=} ","&#x225E;":"\\overset{m}{=} ","&#x225D;":"\\overset{def}{=}","&#x2258;":"=","&#x2256;":"=","&#x2255;":"=:","&#x2253;":"\\doteq","&#x2252;":"\\doteq","&#x2251;":"\\doteq","&#x2250;":"\\doteq","&#x224F;&#x338;":"","&#x224F;":"","&#x224E;&#x338;":"","&#x224E;":"","&#x224C;":"\\approx","&#x224B;":"\\approx","&#x224A;":"\\approx","&#x2242;&#x338;":"\\neq","&#x2242;":"=","&#x223F;":"\\sim","&#x223E;":"\\infty","&#x223D;&#x331;":"\\sim","&#x223D;":"\\sim","&#x223B;":"\\sim","&#x223A;":":-:","&#x2239;":"-:","&#x2238;":"\\bot","&#x2237;":"::","&#x2236;":":","&#x2223;":"|","&#x221F;":"\\llcorner","&#x2219;":"\\cdot","&#x2218;":"\\circ","&#x2217;":"*","&#x2215;":"/","&#x220E;":"\\square","&#x220D;":"\\ni","&#x220A;":"\\in","&#x2206;":"\\Delta","&#x2044;":"/","&#x2AB0;&#x338;":"\\nsucceq","&#x2AB0;":"\\succeq","&#x2AAF;&#x338;":"\\npreceq","&#x2AAF;":"\\preceq","&#x2A88;":"\\ngeqslant","&#x2A87;":"\\nleqslant","&#x29F3;":"\\Phi","&#x29E6;":"\\models","&#x29E5;":"\\not\\equiv","&#x29E4;":"\\approx\\neq","&#x29E3;":"\\neq","&#x29C1;":"\\circle","&#x29C0;":"\\circle","&#x25E6;":"\\circle","&#x25D7;":"\\circle","&#x25D6;":"\\circle","&#x25CF;":"\\circle","&#x25CE;":"\\circledcirc","&#x25CD;":"\\circledcirc","&#x25CC;":"\\circledcirc","&#x25C9;":"\\circledcirc","&#x25C8;":"\\diamond","&#x25C7;":"\\diamond","&#x25C6;":"\\diamond","&#x25C5;":"\\triangleleft","&#x25C4;":"\\triangleleft","&#x25C3;":"\\triangleleft","&#x25C2;":"\\triangleleft","&#x25C1;":"\\triangleleft","&#x25C0;":"\\triangleleft","&#x25BF;":"\\triangledown","&#x25BE;":"\\triangledown","&#x25BD;":"\\triangledown","&#x25BC;":"\\triangledown","&#x25B9;":"\\triangleright","&#x25B8;":"\\triangleright","&#x25B7;":"\\triangleright","&#x25B6;":"\\triangleright","&#x25B5;":"\\triangle","&#x25B4;":"\\triangle","&#x25B3;":"\\triangle","&#x25B1;":"\\square","&#x25B0;":"\\square","&#x25AF;":"\\square","&#x25AE;":"\\square","&#x25AD;":"\\square","&#x25AB;":"\\square","&#x25AA;":"\\square","&#x25A1;":"\\square","&#x25A0;":"\\square","&#x22ED;":"\\not\\triangleright","&#x22EC;":"\\not\\triangleleft","&#x22EB;":"\\not\\triangleright","&#x22EA;":"\\not\\triangleleft","&#x22D9;":"\\ggg","&#x22D8;":"\\lll","&#x22D7;":"*>","&#x22D6;":"<*","&#x22D4;":"\\pitchfork","&#x22CC;":"","&#x22CB;":"","&#x22CA;":"\\rtimes","&#x22C9;":"\\ltimes","&#x22B5;":"\\triangleright","&#x22B4;":"","&#x22A5;":"\\bot","&#x2281;":"\\nsucc","&#x2280;":"\\preceq","&#x227D;":"\\succeq","&#x227C;":"\\preceq","&#x227B;":"\\succ","&#x227A;":"\\prec","&#x2271;":"\\geq/","&#x2270;":"\\leq/","&#x226D;":"\\neq","&#x226B;&#x338;":"\\not\\gg","&#x226B;":"\\gg","&#x226A;&#x338;":"\\not\\ll","&#x226A;":"\\ll","&#x2269;":"\\ngeqslant","&#x2268;":"\\nleqslant","&#x2261;":"\\equiv","&#x225F;":"\\doteq","&#x225C;":"\\triangleq","&#x225B;":"\\doteq","&#x225A;":"\\triangleq","&#x2259;":"\\triangleq","&#x2257;":"\\doteq","&#x2254;":":=","&#x224D;":"\\asymp","&#x2247;":"\\ncong","&#x2246;":"\\ncong","&#x2245;":"\\cong","&#x2244;":"\\not\\simeq","&#x2243;":"\\simeq","&#x2241;":"\\not\\sim","&#x2226;":"\\not\\parallel","&#x2225;":"\\parallel","&#x2224;":"\\not|","&#x221D;":"\\propto","==":"==","=":"=",":=":":=","/=":"=","-=":"-=","+=":"+=","*=":"*=","!=":"!=","&#x2260;":"\\neq","&#x2262;":"\\equiv /","&#x2249;":"\\approx /","&#x223C;":"sim","&#x2248;":"\\approx","&#x226E;":"</","&lt;":"<","&#x226F;":">/",">=":">=",">":">","&#x2265;":"\\geq","&#x2264;":"\\leq","&lt;=":"<=","&#x228B;":"\\supsetneq","&#x228A;":"\\subsetneq","&#x2289;":"\\nsupseteq","&#x2288;":"\\nsubseteq","&#x2287;":"\\supseteq","&#x2286;":"\\subseteq","&#x2285;":"\\not\\supset","&#x2284;":"\\not\\subset","&#x2283;&#x20D2;":"\\supset |","&#x2283;":"\\supset","&#x2282;&#x20D2;":"\\subset |","&#x2282;":"\\subset","&#x220C;":"\\not\\in","&#x2209;":"\\notin","&#x2208;":"\\in","&#x2201;":"C","&#x2204;":"\\nexists","&#x2203;":"\\exists","&#x2200;":"\\forall","&#x2227;":"\\land","&amp;&amp;":"\\&\\&","&#x2228;":"\\lor","&#x22AF;":"\\cancel{\\vDash}","&#x22AE;":"\\cancel{\\Vdash}","&#x22AD;":"\\nvDash","&#x22AC;":"\\nvDash","&#x22A9;":"\\Vdash","&#x22A8;":"\\vDash","&#x22A4;":"\\top","&#x22A3;":"\\dashv","&#x22A2;":"\\vdash","&#x220B;":"\\ni","&#x22F1;":"\\ddots","&#x22EF;":"\\hdots","&#x22EE;":"\\vdots","&#x2026;":"\\hdots","&#x3F6;":"\\ni",":":":","...":"\\cdots","..":"..","->":"->","&#x2235;":"\\because","&#x2234;":"\\therefore ","&#x2063;":"",",":",",";":";","&#x29FD;":"\\}","&#x29FC;":"\\{","&#x2998;":"\\]","&#x2997;":"\\[","&#x2996;":"\\ll","&#x2995;":"\\gg","&#x2994;":"\\gg","&#x2993;":"\\ll","&#x2992;":"\\gg","&#x2991;":"\\ll","&#x2990;":"\\]","&#x298F;":"\\]","&#x298E;":"\\]","&#x298D;":"\\[","&#x298C;":"\\[","&#x298B;":"\\]","&#x298A;":"\\triangleright","&#x2989;":"\\triangleleft","&#x2988;":"|\\)","&#x2987;":"\\(|","&#x2986;":"|\\)","&#x2985;":"\\(\\(","&#x2984;":"|\\}","&#x2983;":"\\{|","&#x2980;":"\\||","&#x27EF;":"\\left. \\right]","&#x27EE;":"\\left[ \\right.","&#x27ED;":"\\left. \\right]]","&#x27EC;":"\\left[[ \\right.","&#x27EB;":"\\gg","&#x27EA;":"\\ll","&#x27E9;":"\\rangle","&#x27E8;":"\\langle","&#x27E7;":"\\left. \\right]]","&#x27E6;":"\\left[[ \\right.","&#x2773;":"\\left.\\right)","&#x2772;":"\\left(\\right.","&#x232A;":"\\rangle","&#x2329;":"\\langle","&#x230B;":"\\rfloor","&#x230A;":"\\lfloor","&#x2309;":"\\rceil","&#x2308;":"\\lceil","&#x2016;":"\\parallel","}":"\\left.\\right}","{":"\\left{\\right.","]":"\\left]\\right.","[":"\\left[\\right.",")":"\\left.\\right)","(":"\\left(\\right.","&#x201D;":'"',"&#x201C;":"``","&#x2019;":"'","&#x2018;":"`","%CE%B1":"\\alpha","%CE%B2":"\\beta","%CE%B3":"\\gamma","%CE%93":"\\Gamma","%CE%B4":"\\delta","%CE%94":"\\Delta","%CF%B5":"\\epsilon","%CE%B6":"\\zeta","%CE%B7":"\\eta","%CE%B8":"\\theta","%CE%98":"\\Theta","%CE%B9":"\\iota","%CE%BA":"\\kappa","%CE%BB":"\\lambda","%CE%BC":"\\mu","%CE%BD":"\\nu","%CE%BF":"\\omicron","%CF%80":"\\pi","%CE%A0":"\\Pi","%CF%81":"\\pho","%CF%83":"\\sigma","%CE%A3":"\\Sigma","%CF%84":"\\tau","%CF%85":"\\upsilon","%CE%A5":"\\Upsilon","%CF%95":"\\phi","%CE%A6":"\\Phi","%CF%87":"\\chi","%CF%88":"\\psi","%CE%A8":"\\Psi","%CF%89":"\\omega","%CE%A9":"\\Omega"};},9039:(e,t)=>{"use strict";Object.defineProperty(t,"__esModule",{value:!0}),t.allMathOperatorsByGlyph=void 0,t.allMathOperatorsByGlyph={_:"\\underline","⏡":"\\underbrace","⏠":"\\overbrace","⏟":"\\underbrace","⏞":"\\overbrace","⏝":"\\underbrace","⏜":"\\overbrace","⎵":"\\underbrace","⎴":"\\overbrace","⃜":"\\square","⃛":"\\square","⁤":"","⁗":"''''","‾":"\\overline","‷":"```","‶":"``","‵":"`","‴":"'''","″":"''","‟":"``","„":",,","‛":"`","‚":",","^":"\\hat","˷":"\\sim","˝":"\\sim","˜":"\\sim","˚":"\\circ","˙":"\\cdot","˘":" ",ˍ:"\\_",ˋ:"ˋ",ˊ:"ˊ",ˉ:"ˉ",ˇ:"",ˆ:"\\hat",º:"o","¹":"1","¸":",","´":"´","³":"3","²":"2","°":"\\circ","¯":"\\bar",ª:"a","↛":"\\nrightarrow","¨":"\\cdot\\cdot","~":"\\sim","`":"`","--":"--","++":"++","&":"\\&","∜":"\\sqrt[4]{}","∛":"\\sqrt[3]{}","√":"\\sqrt{}",ⅆ:"d",ⅅ:"\\mathbb{D}","?":"?","@":"@","//":"//","!!":"!!","!":"!","♯":"\\#","♮":"","♭":"","′":"'","<>":"<>","**":"\\star\\star","∇":"\\nabla","∂":"\\partial","⊙":"\\bigodot","¬":"\\neg","∢":"\\measuredangle","∡":"\\measuredangle","∠":"\\angle","÷":"\\div","/":"/","∖":"\\backslash","\\":"\\backslash","%":"\\%","⊗":"\\bigotimes","·":"\\cdot","⨿":"\\coprod","⨯":"\\times","⋅":"\\cdot","⊡":"\\boxdot","⊠":"\\boxtimes","⁢":"","⁃":"-","•":"\\cdot",".":".","*":"\\star","∪":"\\cup","∩":"\\cap","∐":"\\coprod","∏":"\\prod","≀":"","⫿":"","⫼":"\\mid\\mid\\mid","⨉":"\\times","⨈":"","⨇":"","⨆":"\\sqcup","⨅":"\\sqcap","⨂":"\\otimes","⨀":"\\odot","⋂":"\\cap","⋁":"\\vee","⋀":"\\wedge","⨄":"\\uplus","⨃":"\\cup","⋃":"\\cup","⨜":"\\underline{\\int}","⨛":"\\overline{\\int}","⨚":"\\int","⨙":"\\int","⨘":"\\int","⨗":"\\int","⨖":"\\oint","⨕":"\\oint","⨔":"\\int","⨓":"\\int","⨒":"\\int","⨑":"\\int","⨐":"\\int","⨏":"\\bcancel{\\int}","⨎":"","⨍":"\\hcancel{\\int}","⨌":"\\iiiint","∳":"\\oint","∲":"\\oint","∱":"\\int","∰":"\\oiint","∯":"\\oiint","∮":"\\oint","∫":"\\int","⨁":"\\oplus","⊘":"\\oslash","⊖":"\\ominus","⊕":"\\oplus","∭":"\\iiint","∬":"\\iint","⨋":"","⨊":"","∑":"\\sum","⊟":"\\boxminus","⊞":"\\boxplus","∔":"\\dot{+}","∓":"+-","−":"-","±":"\\pm","-":"-","+":"+","⭆":"\\Rrightarrow","⭅":"\\Lleftarrow","⧴":":\\rightarrow","⧯":"","⧟":"\\bullet-\\bullet","⦟":"\\angle","⦞":"\\measuredangle","⦝":"\\measuredangle","⦜":"\\perp","⦛":"\\measuredangle","⦚":"","⦙":"\\vdots","⥿":"","⥾":"","⥽":"\\prec","⥼":"\\succ","⥻":"\\underset{\\rightarrow}{\\supset}","⥺":"","⥹":"\\underset{\\rightarrow}{\\subset}","⥸":"\\underset{\\rightarrow}{>}","⥷":"","⥶":"\\underset{\\leftarrow}{<}","⥵":"\\underset{\\approx}{\\rightarrow}","⥴":"\\underset{\\sim}{\\rightarrow}","⥳":"\\underset{\\sim}{\\leftarrow}","⥲":"\\overset{\\sim}{\\rightarrow}","⥱":"\\overset{=}{\\rightarrow}","⥰":"","⥯":"","⥮":"","⥭":"\\overline{\\rightharpoondown}","⥬":"\\underline{\\rightharpoonup}","⥫":"\\overline{\\leftharpoondown}","⥪":"\\underline{\\leftharpoonup}","⥩":"\\rightleftharpoons","⥨":"\\rightleftharpoons","⥧":"\\rightleftharpoons","⥦":"\\rightleftharpoons","⥥":"\\Downarrow","⥤":"\\Rightarrow","⥣":"\\Uparrow","⥢":"\\Leftarrow","⥡":"\\downarrow","⥠":"\\uparrow","⥟":"\\rightarrow","⥞":"\\leftarrow","⥝":"\\downarrow","⥜":"\\uparrow","⥛":"\\rightarrow","⥚":"\\leftarrow","⥙":"\\downarrow","⥘":"\\uparrow","⥗":"\\rightarrow","⥖":"\\leftarrow","⥕":"\\downarrow","⥔":"\\uparrow","⥓":"\\rightarrow","⥒":"\\leftarrow","⥑":"\\updownarrow","⥐":"\\leftrightarrow","⥏":"\\updownarrow","⥎":"\\leftrightarrow","⥍":"\\updownarrow","⥌":"\\updownarrow","⥋":"\\leftrightarrow","⥊":"\\leftrightarrow","⥉":"","⥈":"\\leftrightarrow","⥇":"\\nrightarrow","⥆":"","⥅":"","⥄":"\\rightleftarrows","⥃":"\\leftrightarrows","⥂":"\\rightleftarrows","⥁":"\\circlearrowright","⥀":"\\circlearrowleft","⤿":"\\rightarrow","⤾":"\\leftarrow","⤽":"\\leftarrow","⤼":"\\rightarrow","⤻":"\\rightarrow","⤺":"\\leftarrow","⤹":"\\downarrow","⤸":"\\downarrow","⤷":"\\Rsh","⤶":"\\Lsh","⤵":"\\downarrow","⤴":"\\uparrow","⤳":"\\rightarrow","⤲":"\\leftarrow","⤱":" ","⤰":" ","⤯":" ","⤮":" ","⤭":" ","⤬":"\\times","⤫":"\\times","⤪":" ","⤩":" ","⤨":" ","⤧":" ","⤦":" ","⤥":" ","⤤":" ","⤣":" ","⤢":" ","⤡":" ","⤠":"\\mapsto\\cdot","⤟":"\\cdot\\leftarrow","⤞":"\\rightarrow\\cdot","⤝":"\\leftarrow","⤜":"\\rightarrow","⤛":"\\leftarrow","⤚":"\\rightarrow","⤙":"\\leftarrow","⤘":"\\rightarrow","⤗":"\\rightarrow","⤖":"\\rightarrow","⤕":"\\rightarrow","⤔":"\\rightarrow","⤓":"\\downarrow","⤒":"\\uparrow","⤑":"\\rightarrow","⤐":"\\rightarrow","⤏":"\\rightarrow","⤎":"\\leftarrow","⤍":"\\rightarrow","⤌":"\\leftarrow","⤋":"\\Downarrow","⤊":"\\Uparrow","⤉":"\\uparrow","⤈":"\\downarrow","⤇":"\\Rightarrow","⤆":"\\Leftarrow","⤅":"\\mapsto","⤄":"\\nLeftrightarrow","⤃":"\\nRightarrow","⤂":"\\nLeftarrow","⤁":"\\rightsquigarrow","⤀":"\\rightsquigarrow","⟿":"\\rightsquigarrow","⟾":"\\Rightarrow","⟽":"\\Leftarrow","⟼":"\\mapsto","⟻":"\\leftarrow","⟺":"\\Longleftrightarrow","⟹":"\\Longrightarrow","⟸":"\\Longleftarrow","⟷":"\\leftrightarrow","⟶":"\\rightarrow","⟵":"\\leftarrow","⟱":"\\Downarrow","⟰":"\\Uparrow","⊸":"\\rightarrow","⇿":"\\leftrightarrow","⇾":"\\rightarrow","⇽":"\\leftarrow","⇼":"\\nleftrightarrow","⇻":"\\nrightarrow","⇺":"\\nleftarrow","⇹":"\\nleftrightarrow","⇸":"\\nrightarrow","⇷":"\\nleftarrow","⇶":"\\Rrightarrow","⇵":"","⇴":"\\rightarrow","⇳":"\\Updownarrow","⇲":"\\searrow","⇱":"\\nwarrow","⇰":"\\Leftarrow","⇯":"\\Uparrow","⇮":"\\Uparrow","⇭":"\\Uparrow","⇬":"\\Uparrow","⇫":"\\Uparrow","⇪":"\\Uparrow","⇩":"\\Downarrow","⇨":"\\Rightarrow","⇧":"\\Uparrow","⇦":"\\Leftarrow","⇥":"\\rightarrow","⇤":"\\leftarrow","⇣":"\\downarrow","⇢":"\\rightarrow","⇡":"\\uparrow","⇠":"\\leftarrow","⇟":"\\downarrow","⇞":"\\uparrow","⇝":"\\rightsquigarrow","⇜":"\\leftarrow","⇛":"\\Rrightarrow","⇚":"\\Lleftarrow","⇙":"\\swarrow","⇘":"\\searrow","⇗":"\\nearrow","⇖":"\\nwarrow","⇕":"\\Updownarrow","⇔":"\\Leftrightarrow","⇓":"\\Downarrow","⇒":"\\Rightarrow","⇑":"\\Uparrow","⇐":"\\Leftarrow","⇏":"\\nRightarrow","⇎":"\\nLeftrightarrow","⇍":"\\nLeftarrow","⇌":"\\rightleftharpoons","⇋":"\\leftrightharpoons","⇊":"\\downdownarrows","⇉":"\\rightrightarrows","⇈":"\\upuparrows","⇇":"\\leftleftarrows","⇆":"\\leftrightarrows","⇅":"","⇄":"\\rightleftarrows","⇃":"\\downharpoonleft","⇂":"\\downharpoonright","⇁":"\\rightharpoondown","⇀":"\\rightharpoonup","↿":"\\upharpoonleft","↾":"\\upharpoonright","↽":"\\leftharpoondown","↼":"\\leftharpoonup","↻":"\\circlearrowright","↺":"\\circlearrowleft","↹":"\\leftrightarrows","↸":"\\overline{\\nwarrow}","↷":"\\curvearrowright","↶":"\\curvearrowleft","↵":"\\swarrow","↴":"\\searrow","↳":"\\Rsh","↲":"\\Lsh","↱":"\\Rsh","↰":"\\Lsh","↯":"\\swarrow","↮":"","↭":"\\leftrightsquigarrow","↬":"\\looparrowright","↫":"\\looparrowleft","↪":"\\hookrightarrow","↩":"\\hookleftarrow","↨":"\\underline{\\updownarrow}","↧":"\\downarrow","↦":"\\rightarrowtail","↥":"\\uparrow","↤":"\\leftarrowtail","↣":"\\rightarrowtail","↢":"\\leftarrowtail","↡":"\\downarrow","↠":"\\twoheadrightarrow","↟":"\\uparrow","↞":"\\twoheadleftarrow","↝":"\\nearrow","↜":"\\nwarrow","↚":"","↙":"\\swarrow","↘":"\\searrow","↗":"\\nearrow","↖":"\\nwarrow","↕":"\\updownarrow","↔":"\\leftrightarrow","↓":"\\downarrow","→":"\\rightarrow","↑":"\\uparrow","←":"\\leftarrow","|||":"\\left|||\\right.","||":"\\left||\\right.","|":"\\mid","⫾":"","⫽":"//","⫻":"///","⫺":"","⫹":"","⫸":"","⫷":"","⫶":"\\vdots","⫵":"","⫴":"","⫳":"","⫲":"\\nparallel","⫱":"","⫰":"","⫯":"","⫮":"\\bcancel{\\mid}","⫭":"","⫬":"","⫫":"","⫪":"","⫩":"","⫨":"\\underline{\\perp}","⫧":"\\overline{\\top}","⫦":"","⫥":"","⫤":"","⫣":"","⫢":"","⫡":"","⫠":"\\perp","⫟":"\\top","⫞":"\\dashv","⫝̸":"","⫝":"","⫛":"\\pitchfork","⫚":"","⫙":"","⫘":"","⫗":"","⫖":"","⫕":"","⫔":"","⫓":"","⫒":"","⫑":"","⫐":"","⫏":"","⫎":"","⫍":"","⫌":"\\underset{\\neq}{\\supset}","⫋":"\\underset{\\neq}{\\subset}","⫊":"\\underset{\\approx}{\\supset}","⫉":"\\underset{\\approx}{\\subset}","⫈":"\\underset{\\sim}{\\supset}","⫇":"\\underset{\\sim}{\\subset}","⫆":"\\supseteqq","⫅":"\\subseteqq","⫄":"\\dot{\\supseteq}","⫃":"\\dot{\\subseteq}","⫂":"\\underset{\\times}{\\supset}","⫁":"\\underset{\\times}{\\subset}","⫀":"\\underset{+}{\\supset}","⪿":"\\underset{+}{\\subset}","⪾":"","⪽":"","⪼":"\\gg ","⪻":"\\ll","⪺":"\\underset{\\cancel{\\approx}}{\\succ}","⪹":"\\underset{\\cancel{\\approx}}{\\prec}","⪸":"\\underset{\\approx}{\\succ}","⪷":"\\underset{\\approx}{\\prec}","⪶":"\\underset{\\cancel{=}}{\\succ}","⪵":"\\underset{\\cancel{=}}{\\prec}","⪴":"\\underset{=}{\\succ}","⪳":"\\underset{=}{\\prec}","⪲":"","⪱":"","⪮":"","⪭":"\\underline{\\hcancel{>}}","⪬":"\\underline{\\hcancel{>}}","⪫":"\\hcancel{>}","⪪":"\\hcancel{<}","⪩":"","⪨":"","⪧":"\\vartriangleright","⪦":"\\vartriangleleft","⪥":"><","⪤":"><","⪣":"\\underline{\\ll}","⪢̸":"\\cancel{\\gg}","⪢":"\\gg","⪡̸":"\\cancel{\\ll}","⪡":"\\ll","⪠":"\\overset{\\sim}{\\geqq}","⪟":"\\overset{\\sim}{\\leqq}","⪞":"\\overset{\\sim}{>}","⪝":"\\overset{\\sim}{<}","⪜":"","⪛":"","⪚":"\\overset{=}{>}","⪙":"\\overset{=}{<}","⪘":"","⪗":"","⪖":"","⪕":"","⪔":"","⪓":"","⪒":"\\underset{=}{\\gtrless}","⪑":"\\underset{=}{\\lessgtr}","⪐":"\\underset{<}{\\gtrsim}","⪏":"\\underset{>}{\\lesssim}","⪎":"\\underset{\\simeq}{>}","⪍":"\\underset{\\simeq}{<}","⪌":"\\gtreqqless","⪋":"\\lesseqqgtr","⪊":"\\underset{\\cancel{\\approx}}{>}","⪉":"\\underset{\\approx}{<}","⪆":"\\underset{\\approx}{>}","⪅":"\\underset{\\approx}{<}","⪄":"","⪃":"","⪂":"","⪁":"","⪀":"","⩿":"","⩾̸":"\\bcancel{\\geq}","⩾":"\\geq","⩽̸":"\\bcancel{\\leq}","⩽":"\\leq","⩼":"","⩻":"","⩺":"","⩹":"","⩸":"\\overset{\\dots}{\\equiv}","⩷":"","⩶":"===","⩵":"==","⩴":"::=","⩳":"","⩲":"\\underset{=}{+}","⩱":"\\overset{=}{+}","⩰":"\\overset{\\approx}{=}","⩯":"\\overset{\\wedge}{=}","⩮":"\\overset{*}{=}","⩭":"\\dot{\\approx}","⩬":"","⩫":"","⩪":"\\dot{\\sim}","⩩":"","⩨":"","⩧":"\\dot{\\equiv}","⩦":"\\underset{\\cdot}{=}","⩥":"","⩤":"","⩣":"\\underset{=}{\\vee}","⩢":"\\overset{=}{\\vee}","⩡":"ul(vv)","⩠":"\\underset{=}{\\wedge}","⩟":"\\underline{\\wedge}","⩞":"\\overset{=}{\\wedge}","⩝":"\\hcancel{\\vee}","⩜":"\\hcancel{\\wedge}","⩛":"","⩚":"","⩙":"","⩘":"\\vee","⩗":"\\wedge","⩖":"","⩕":"","⩔":"","⩓":"","⩒":"\\dot{\\vee}","⩑":"\\dot{\\wedge}","⩐":"","⩏":"","⩎":"","⩍":"\\overline{\\cap}","⩌":"\\overline{\\cup}","⩋":"","⩊":"","⩉":"","⩈":"","⩇":"","⩆":"","⩅":"","⩄":"","⩃":"\\overline{\\cap}","⩂":"\\overline{\\cup}","⩁":"","⩀":"","⨾":"","⨽":"\\llcorner","⨼":"\\lrcorner","⨻":"","⨺":"","⨹":"","⨸":"","⨷":"","⨶":"\\hat{\\otimes}","⨵":"","⨴":"","⨳":"","⨲":"\\underline{\\times}","⨱":"\\underline{\\times}","⨰":"\\dot{\\times}","⨮":"\\bigodot","⨭":"\\bigodot","⨬":"","⨫":"","⨪":"","⨩":"","⨨":"","⨧":"","◻":"\\Box","⨦":"\\underset{\\sim}{+}","⨥":"\\underset{\\circ}{+}","⨤":"\\overset{\\sim}{+}","⨣":"\\hat{+}","⨢":"\\dot{+}","⨡":"\\upharpoonright","⨠":">>","⨟":"","⨞":"\\triangleleft","⨝":"\\bowtie","⧿":"","⧾":"+","⧻":"\\hcancel{|||}","⧺":"\\hcancel{||}","⧹":"\\backslash","⧸":"/","⧷":"hcancel{\backslash}","⧶":"","⧵":"\\backslash","⧲":"\\Phi","⧱":"","⧰":"","⧮":"","⧭":"","⧬":"","⧫":"\\lozenge","⧪":"","⧩":"","⧨":"","⧧":"\\ddagger","⧢":"\\sqcup\\sqcup","⧡":"","⧠":"\\square","⧞":"","⧝":"","⧜":"","⧛":"\\{\\{","⧙":"\\{","⧘":"\\}","⧗":"","⧖":"","⧕":"\\bowtie","⧔":"\\bowtie","⧓":"\\bowtie","⧒":"\\bowtie","⧑":"\\bowtie","⧐̸":"| \\not\\triangleright","⧐":"| \\triangleright","⧏̸":"\\not\\triangleleft |","⧏":"\\triangleleft |","⧎":"","⧍":"\\triangle","⧌":"","⧋":"\\underline{\\triangle}","⧊":"\\dot{\\triangle}","⧉":"","⧈":"\\boxed{\\circ}","⧇":"\\boxed{\\circ}","⧆":"\\boxed{\\rightarrow}","⧅":"\\bcancel{\\square}","⧄":"\\cancel{\\square}","⧃":"\\odot","⧂":"\\odot","⦿":"\\odot","⦾":"\\odot","⦽":"\\varnothing","⦼":"\\oplus","⦻":"\\otimes","⦺":"","⦹":"\\varnothing","⦸":"\\varnothing","⦷":"\\ominus","⦶":"\\ominus","⦵":"\\ominus","⦴":"\\vec{\\varnothing}","⦳":"\\vec{\\varnothing}","⦲":"\\dot{\\varnothing}","⦱":"\\overline{\\varnothing}","⦰":"\\varnothing","⦯":"\\measuredangle","⦮":"\\measuredangle","⦭":"\\measuredangle","⦬":"\\measuredangle","⦫":"\\measuredangle","⦪":"\\measuredangle","⦩":"\\measuredangle","⦨":"\\measuredangle","⦧":"","⦦":"","⦥":"","⦤":"","⦣":"\\ulcorner","⦢":"\\measuredangle","⦡":"\\not\\lor","⦠":"\\bcancel{>}","⦂":":","⦁":"\\cdot","❘":"\\mid","▲":"\\bigtriangleup","⋿":"\\Epsilon","⋾":"\\overline{\\ni}","⋽":"\\overline{\\ni}","⋼":"\\in","⋻":"\\in","⋺":"\\in","⋹":"\\underline{\\in}","⋸":"\\underline{\\in}","⋷":"\\overline{\\in}","⋶":"\\overline{\\in}","⋵":"\\dot{\\in}","⋴":"\\in","⋳":"\\in","⋲":"\\in","⋰":"\\ddots","։":":","⋩":"\\underset{\\sim}{\\succ}","⋨":"\\underset{\\sim}{\\prec}","⋧":"\\underset{\\not\\sim}{>}","⋦":"\\underset{\\not\\sim}{<}","⋥":"\\not\\sqsupseteq","⋤":"\\not\\sqsubseteq","⋣":"\\not\\sqsupseteq","⋢":"\\not\\sqsubseteq","⋡":"\\nsucc","⋠":"\\nprec","⋟":"\\succ","⋞":"\\prec","⋝":"\\overline{>}","⋜":"\\overline{<}","⋛":"\\underset{>}{\\leq}","⋚":"\\underset{<}{\\geq}","⋕":"\\#","⋓":"\\cup","⋒":"\\cap","⋑":"\\supset","⋐":"\\subset","⋏":"\\wedge","⋎":"\\vee","⋍":"\\simeq","⋈":"\\Join","⋇":"\\ast","⋆":"\\star","⋄":"\\diamond","⊿":"\\triangle","⊾":"\\measuredangle","⊽":"\\overline{\\lor}","⊼":"\\overline{\\land}","⊻":"\\underline{\\lor}","⊺":"\\top",土:"\\pm",十:"+","⊹":"","⊷":"\\circ\\multimap","⊶":"\\circ\\multimap","⊳":"\\triangleright","⊲":"\\triangleleft","⊱":"\\succ","⊰":"\\prec","⊫":"|\\models","⊪":"|\\models","⊧":"\\models","⊦":"\\vdash","⊝":"\\ominus","⊜":"\\ominus","⊛":"\\odot","⊚":"\\odot","⊔":"\\sqcup","⊓":"\\sqcap","⊒":"\\sqsupseteq","⊑":"\\sqsubseteq","⊐̸":"\\not\\sqsupset","⊐":"\\sqsupset","⊏̸":"\\not\\sqsubset","⊏":"\\sqsubset","⊎":"\\cup","⊍":"\\cup","⊌":"\\cup","≿̸":"\\not\\succsim","≿":"\\succsim","≾":"\\precsim","≹":"\\not\\overset{>}{<}","≸":"\\not\\overset{>}{<}","≷":"\\overset{>}{<}","≶":"\\overset{<}{>}","≵":"\\not\\geg","≴":"\\not\\leq","≳":"\\geg","≲":"\\leq","≬":"","≧":"\\geg","≦̸":"\\not\\leq","≦":"\\leq","≣":"\\overset{=}{=} ","≞":"\\overset{m}{=} ","≝":"\\overset{def}{=}","≘":"=","≖":"=","≕":"=:","≓":"\\doteq","≒":"\\doteq","≑":"\\doteq","≐":"\\doteq","≏̸":"","≏":"","≎̸":"","≎":"","≌":"\\approx","≋":"\\approx","≊":"\\approx","≂̸":"\\neq","≂":"=","∿":"\\sim","∾":"\\infty","∽̱":"\\sim","∽":"\\sim","∻":"\\sim","∺":":-:","∹":"-:","∸":"\\bot","∷":"::","∶":":","∣":"\\mid","∟":"\\llcorner","∘":"\\circ","∗":"*","∕":"/","∎":"\\square","∍":"\\ni","∊":"\\in","∆":"\\Delta","⁄":"/","⪰̸":"\\nsucceq","⪰":"\\succeq","⪯̸":"\\npreceq","⪯":"\\preceq","⪈":"\\ngeqslant","⪇":"\\nleqslant","⧳":"\\Phi","⧦":"\\models","⧥":"\\not\\equiv","⧤":"\\approx\\neq","⧣":"\\neq","⧁":"\\circle","⧀":"\\circle","◦":"\\circle","◗":"\\circle","◖":"\\circle","●":"\\circle","◎":"\\circledcirc","◍":"\\circledcirc","◌":"\\circledcirc","◉":"\\circledcirc","◈":"\\diamond","◇":"\\diamond","◆":"\\diamond","◅":"\\triangleleft","◄":"\\triangleleft","◃":"\\triangleleft","◂":"\\triangleleft","◁":"\\triangleleft","◀":"\\triangleleft","▿":"\\triangledown","▾":"\\triangledown","▽":"\\triangledown","▼":"\\triangledown","▹":"\\triangleright","▸":"\\triangleright","▷":"\\triangleright","▶":"\\triangleright","▵":"\\triangle","▴":"\\triangle","△":"\\triangle","▱":"\\square","▰":"\\blacksquare","▯":"\\square","▮":"\\blacksquare","▭":"\\square","▫":"\\square","▪":"\\square","□":"\\square","■":"\\blacksquare","⋭":"\\not\\triangleright","⋬":"\\not\\triangleleft","⋫":"\\not\\triangleright","⋪":"\\not\\triangleleft","⋙":"\\ggg","⋘":"\\lll","⋗":"*>","⋖":"<*","⋔":"\\pitchfork","⋌":"","⋋":"\\bowtie","⋊":"\\ltimes","⋉":"\\rtimes","⊵":"\\triangleright","\\triangleleft":"","⊥":"\\bot","⊁":"\\nsucc","⊀":"\\preceq","≽":"\\succeq","≼":"\\preceq","≻":"\\succ","≺":"\\prec","≱":"\\geq/","≰":"\\leq/","≭":"\\neq","≫̸":"\\not\\gg","≫":"\\gg","≪̸":"\\not\\ll","≪":"\\ll","≩":"\\ngeqslant","≨":"\\nleqslant","≡":"\\equiv","≟":"\\doteq","≜":"\\triangleq","≛":"\\doteq","≚":"\\triangleq","≙":"\\triangleq","≗":"\\doteq","≔":":=","≍":"\\asymp","≇":"\\ncong","≆":"\\ncong","≅":"\\cong","≄":"\\not\\simeq","≃":"\\simeq","≁":"\\not\\sim","∦":"\\not\\parallel","∥":"\\parallel","∤":"\\not|","∝":"\\propto","==":"==","=":"=",":=":":=","/=":"=","-=":"-=","+=":"+=","*=":"*=","!=":"!=","≠":"\\neq","≢":"\\equiv /","≉":"\\approx /","∼":"sim","≈":"\\approx","≮":"</","<":"<","≯":">/",">=":">=",">":">","≥":"\\geq","≤":"\\leq","<=":"<=","⊋":"\\supsetneq","⊊":"\\subsetneq","⊉":"\\nsupseteq","⊈":"\\nsubseteq","⊇":"\\supseteq","⊆":"\\subseteq","⊅":"\\not\\supset","⊄":"\\not\\subset","⊃⃒":"\\supset |","⊃":"\\supset","⊂⃒":"\\subset |","⊂":"\\subset","∌":"\\not\\in","∉":"\\notin","∈":"\\in","∁":"C","∄":"\\nexists","∃":"\\exists","∀":"\\forall","∧":"\\land","&&":"\\&\\&","∨":"\\lor","⊯":"\\cancel{\\vDash}","⊮":"\\cancel{\\Vdash}","⊭":"\\nvDash","⊬":"\\nvDash","⊩":"\\Vdash","⊨":"\\vDash","⊤":"\\top","⊣":"\\dashv","⊢":"\\vdash","∋":"\\ni","⋱":"\\ddots","⋯":"\\hdots","⋮":"\\vdots","϶":"\\ni",":":":","...":"\\cdots","..":"..","->":"->","∵":"\\because","∴":"\\therefore ","⁣":"\\llbracket",",":",",";":";","⧽":"\\}","⧼":"\\{","⦘":"\\]","⦗":"\\[","⦖":"\\ll","⦕":"\\gg","⦔":"\\gg","⦓":"\\ll","⦒":"\\gg","⦑":"\\ll","⦐":"\\]","⦏":"\\]","⦎":"\\]","⦍":"\\[","⦌":"\\[","⦋":"\\]","⦊":"\\triangleright","⦉":"\\triangleleft","⦈":"|\\)","⦇":"\\(|","⦆":"|\\)","⦅":"\\(\\(","⦄":"|\\}","⦃":"\\{|","⦀":"\\||","⟯":"\\left. \\right]","⟮":"\\left[ \\right.","⟭":"\\left. \\right]]","⟬":"\\left[[ \\right.","⟫":"\\gg","⟪":"\\ll","⟧":"\\)|","⟦":"\\(|","❳":"\\left.\\right)","❲":"\\left(\\right.","〉":"\\rangle","〈":"\\langle","⌋":"\\rfloor","⌊":"\\lfloor","⌉":"\\rceil","⌈":"\\lceil","‖":"\\parallel","}":"\\left.\\right}","{":"\\left{\\right.","]":"\\left]\\right.","[":"\\left[\\right.",")":"\\left.\\right)","(":"\\left(\\right.","”":'\\"',"“":"\\text{``}","’":"'","‘":"`",α:"\\alpha",β:"\\beta",γ:"\\gamma",Γ:"\\Gamma",δ:"\\delta",Δ:"\\Delta",ϵ:"\\epsilon",ζ:"\\zeta",η:"\\eta",θ:"\\theta",Θ:"\\Theta",ι:"\\iota",κ:"\\kappa",λ:"\\lambda",ν:"\\nu",ο:"\\omicron",π:"\\pi",Π:"\\Pi",ρ:"\\rho",σ:"\\sigma",Σ:"\\Sigma",τ:"\\tau",υ:"\\upsilon",Υ:"\\Upsilon",ϕ:"\\phi",Φ:"\\Phi",χ:"\\chi",ψ:"\\psi",Ψ:"\\Psi",ω:"\\omega",Ω:"\\Omega",Ω:"\\Omega","∅":"\\emptyset","⟲":"\\circlearrowleft","⟳":"\\circlearrowright","×":"\\times","½":"\\dfrac{1}{2}",μ:"\\mu",Ө:"\\theta","✓":"\\checkmark","⟩":"\\rangle","⟨":"\\langle","¼":"\\dfrac{1}{4}","…":"\\ldots",ℏ:"\\hbar",ℜ:"\\mathfrak{R}",Ѳ:"\\theta",Ø:"\\emptyset",ϱ:"\\varrho",ф:"\\phi",ℇ:"\\varepsilon",T:"T","∙":"\\cdot",Ρ:"P","∞":"\\infty",ᐁ:"\\nabla",ƞ:"\\eta","⁺":"^{+}","⁻":"^{-}","⁼":"^{=}","⁽":"^{(}","⁾":"^{)}","〗":"\\)|","〖":"\\langle",";":";","൦":"\\circ","┴":"\\perp","✕":"\\times","⎻":"-","»":"\\gg","⬆":"\\uparrow","⬇":"\\downarrow","⬅":"\\leftarrow","➡":"\\rightarrow","⎼":"-","⎜":"\\mid","⎥":"\\mid",ħ:"\\hbar","⮕":"\\rightarrow","・":"\\cdot","¦":"\\mid","£":"\\pounds","¥":"\\yen","✗":"\\times","✔":"\\checkmark",ⁿ:"^{n}","«":"\\ll",เ:"\\prime","†":"\\dagger","│":"\\mid",$:"\\$","#":"\\#","℃":"\\text{\\textdegree C}","℉":"\\text{\\textdegree F}","█":"\\blacksquare","℧":"\\mho",ⅇ:"\\text{e}",ɼ:"r","‡":"\\ddagger",ἱ:"i",ϒ:"\\Upsilon",𝛿:"\\delta","˳":"\\cdot",ѳ:"\\theta",𝜙:"\\phi",П:"\\prod",о:"o",ђ:"\\hbar",Ʌ:"\\Lambda","।":"\\mid","€":"\\euro",ῡ:"\\bar{u}",φ:"\\varphi",ȼ:"c",𝞮:"\\epsilon",Χ:"\\mathsf{X}",ₙ:"_{n}"};},8249:(e,t)=>{"use strict";Object.defineProperty(t,"__esModule",{value:!0}),t.allMathSymbolsByChar=void 0,t.allMathSymbolsByChar={"&#xA0;":"\\textrm{ }","&#x2203;":"\\exists","&#x2200;":"\\forall","&#x21D4;":"\\iff","&#x21D2;":"=>","&#xAC;":"\\neg","&#x2124;":"\\mathbb{Z}","&#x211D;":"\\mathbb{R}","&#x211A;":"\\mathbb{Q}","&#x2115;":"\\mathbb{N}","&#x2102;":"CC","&#x25A1;":"\\square","&#x22C4;":"\\diamond","&#x25B3;":"\\triangle","&#x2322;":"\\frown","&#x2220;":"\\angle","&#x22F1;":"\\ddots","&#x22EE;":"\\vdots","&#x2235;":"\\because","&#x2234;":"\\therefore","&#x2135;":"\\aleph","&#x2205;":"\\oslash","&#xB1;":"\\pm","&#x2207;":"\\nabla","&#x2202;":"\\partial","&#x222E;":"\\oint","&#x222B;":"\\int","&#x22C3;":"\\cup","&#x222A;":"\\cup","&#x22C2;":"\\cap","&#x2229;":"\\cap","&#x22C1;":"\\vee","&#x2228;":"\\vee","&#x22C0;":"\\wedge","&#x2227;":"\\wedge","&#x220F;":"\\prod","&#x2211;":"\\sum","&#x2299;":"\\bigodot","&#x2297;":"\\bigoplus","&#x2295;":"o+","&#x2218;":"@","&#x22C8;":"\\bowtie","&#x22CA;":"\\rtimes","&#x22C9;":"\\ltimes","&#xF7;":"\\div","&#xD7;":"\\times","\\":"\\backslash","&#x22C6;":"\\star","&#x2217;":"\\star","&#x22C5;":"\\cdot","&#x3A9;":"\\Omega","&#x3C9;":"\\omega","&#x3A8;":"\\Psi","&#x3C8;":"\\psi","&#x3C7;":"\\chi","&#x3C6;":"\\varphi","&#x3A6;":"\\Phi","&#x3D5;":"\\phi","&#x3C5;":"\\upsilon","&#x3C4;":"\\tau","&#x3A3;":"\\Sigma","&#x3C3;":"\\sigma","&#x3C1;":"\\rho","&#x3A0;":"\\Pi","&#x3C0;":"\\pi","&#x39E;":"\\Xi","&#x3BE;":"\\xi","&#x3BD;":"\\nu","&#x3BC;":"\\mu","&#x39B;":"\\Lambda","&#x3BB;":"\\lambda","&#x3BA;":"\\kappa","&#x3B9;":"\\iota","&#x3D1;":"\\vartheta","&#x398;":"\\Theta","&#x3B8;":"\\theta","&#x3B7;":"\\eta","&#x3B6;":"\\zeta","&#x25B;":"\\varepsilon","&#x3B5;":"\\epsilon","&#x394;":"\\Delta","&#x3B4;":"\\delta","&#x393;":"\\Gamma","&#x3B3;":"\\gamma","&#x3B2;":"\\beta","&#x3B1;":"\\alpha","&#x221E;":"\\infty","‬":"\\text{\\textdir TRT}","‎":"\\text{\\textdir LTR}"};},8171:(e,t)=>{"use strict";Object.defineProperty(t,"__esModule",{value:!0}),t.allMathSymbolsByGlyph=void 0,t.allMathSymbolsByGlyph={" ":"\\textrm{ }","∃":"\\exists","∀":"\\forall","⇔":"\\iff","⇒":"\\Rightarrow","¬":"\\neg","□":"\\square","⋄":"\\diamond","△":"\\triangle","⌢":"\\frown","∠":"\\angle","⋱":"\\ddots","⋮":"\\vdots","∵":"\\because","∴":"\\therefore",ℵ:"\\aleph","∅":"\\emptyset","±":"\\pm","∇":"\\nabla","∂":"\\partial","∮":"\\oint","∫":"\\int","⋃":"\\cup","∪":"\\cup","⋂":"\\cap","∩":"\\cap","⋁":"\\vee","∨":"\\vee","⋀":"\\wedge","∧":"\\wedge","∏":"\\prod","∑":"\\sum","⊙":"\\bigodot","⊗":"\\bigoplus","⊕":"o+","∘":"@","⋈":"\\bowtie","⋊":"\\rtimes","⋉":"\\ltimes","÷":"\\div","×":"\\times","\\":"\\backslash","⋆":"\\star","∗":"\\star","⋅":"\\cdot",Ω:"\\Omega",ω:"\\omega",Ψ:"\\Psi",ψ:"\\psi",χ:"\\chi",φ:"\\varphi",Φ:"\\Phi",ϕ:"\\phi",υ:"\\upsilon",τ:"\\tau",Σ:"\\Sigma",σ:"\\sigma",ρ:"\\rho",Π:"\\Pi",π:"\\pi",Ξ:"\\Xi",ξ:"\\xi",ν:"\\nu",μ:"\\mu",Λ:"\\Lambda",λ:"\\lambda",κ:"\\kappa",ι:"\\iota",ϑ:"\\vartheta",Θ:"\\Theta",θ:"\\theta",η:"\\eta",ζ:"\\zeta",ɛ:"\\varepsilon",ε:"\\epsilon",Δ:"\\Delta",δ:"\\delta",Γ:"\\Gamma",γ:"\\gamma",β:"\\beta",α:"\\alpha","∞":"\\infty",ϵ:"\\epsilon",µ:"\\mu","²":"^{2}",ı:"\\imath","∎":"\\blacksquare",ม:"\\mathbf{m}",Ω:"\\Omega","⟲":"\\circlearrowleft","⟳":"\\circlearrowright",त:" ","¥":"\\yen","⁽":"^{(}","⁾":"^{)}",ß:"\\ss",Ћ:"\\hbar","⦵":"\\ominus","⊿":"\\bigtriangleup","↛'":"\\nrightarrow","†":"\\dagger",เ:"\\prime",白:" ","⿱":" ",ℸ:"\\wp",퓰:" ",ⁿ:"^{n}","✔":"\\checkmark","✗":"\\times","½":"\\dfrac{1}{2}",Ө:"\\theta","✓":"\\checkmark","⟩":"\\rangle","⟨":"\\langle","〈":"\\langle","¼":"\\dfrac{1}{4}","…":"\\ldots",ℏ:"\\hbar",ℜ:"\\mathfrak{R}",Ѳ:"\\theta",Ø:"\\emptyset",ϱ:"\\varrho",ф:"\\phi",T:"T","∙":"\\cdot",Ρ:"P",ᐁ:"\\nabla",ƞ:"\\eta",ɣ:"\\gamma",ћ:"\\hbar",Ɛ:"\\varepsilon",ⅅ:"\\_{D}",𝜆:"\\lambda","〗":"\\rangle","〖":"\\langle",";":";",𝑥:"x",𝑦:"y",𝑧:"z",𝑖:"i",𝑗:"j",𝑘:"k",𝑚:"m",𝑒:"e",𝑟:"r",ɳ:"\\eta",𝛽:"\\beta","⍵":"\\omega",℘:"\\wp",𝜋:"\\pi",Є:"\\epsilon",є:"\\epsilon",𝜀:"\\epsilon",п:"\\pi",Ν:"\\nu",ɵ:"\\theta",𝜓:"\\psi",ϴ:"\\theta",ɸ:"\\phi",Ӷ:"\\Gamma",ɭ:"\\ell",ʋ:"\\upsilon",𝛟:"\\varphi","⍬":"\\theta",Ф:"\\Phi",𝜑:"\\varphi",ⅈ:"i",ο:"o",ơ:"o",ƒ:"f","⍴":"\\rho","🇽":"x",𝑝:"p",𝑞:"q",𝑠:"s",𝑡:"t",𝑢:"u",𝑣:"v",𝑤:"w",𝑎:"a",𝑏:"b",𝑐:"c",𝑑:"d",𝑓:"f",𝑔:"g",𝑙:"l",𝑛:"n",𝑜:"o",𝔀:"w",𝚟:"v",ṁ:"m","൦":"\\circ","┴":"\\perp","✕":"\\times","∣":"\\mid",Փ:"\\Phi","⎜":"\\mid",ħ:"\\hbar",ፈ:" ","⦨":"\\llbracket",ế:"\\hat{e}","¢":"\\cent","⤹":"\\downarrow","⤸":"\\downarrow","⤷":"\\Rsh","⤶":"\\Lsh","⤵":"\\downarrow","⤴":"\\uparrow","⤳":"\\rightarrow","|":"\\mid","⎥":"\\mid","♥":"\\heartsuit",О:"0",Υ:"Y",х:"x",𝓏:"z",𝓎:"y",𝓍:"x",р:"p",а:"a","£":"\\pounds",m:"m",𝚵:"\\Xi","⓪":"\\textcircled{0}","①":"\\textcircled{1}","②":"\\textcircled{2}","③":"\\textcircled{3}","④":"\\textcircled{4}","⑤":"\\textcircled{5}","⑥":"\\textcircled{6}","⑦":"\\textcircled{7}","⑧":"\\textcircled{8}","⑨":"\\textcircled{9}","⑩":"\\textcircled{10}","⑪":"\\textcircled{11}","⑫":"\\textcircled{12}","⑬":"\\textcircled{13}","⑭":"\\textcircled{14}","⑮":"\\textcircled{15}","⑯":"\\textcircled{16}","⑰":"\\textcircled{17}","⑱":"\\textcircled{18}","⑲":"\\textcircled{19}","⑳":"\\textcircled{20}","㉑":"\\textcircled{21}","㉒":"\\textcircled{22}","㉓":"\\textcircled{23}","㉔":"\\textcircled{24}","㉕":"\\textcircled{25}","㉖":"\\textcircled{26}","㉗":"\\textcircled{27}","㉘":"\\textcircled{28}","㉙":"\\textcircled{29}","㉚":"\\textcircled{30}","㉛":"\\textcircled{31}","㉜":"\\textcircled{32}","㉝":"\\textcircled{33}","㉞":"\\textcircled{34}","㉟":"\\textcircled{35}","㊱":"\\textcircled{36}","㊲":"\\textcircled{37}","㊳":"\\textcircled{38}","㊴":"\\textcircled{39}","㊵":"\\textcircled{40}","㊶":"\\textcircled{41}","㊷":"\\textcircled{42}","㊸":"\\textcircled{43}","㊹":"\\textcircled{44}","㊺":"\\textcircled{45}","㊻":"\\textcircled{46}","㊼":"\\textcircled{47}","㊽":"\\textcircled{48}","㊾":"\\textcircled{49}","㊿":"\\textcircled{50}","&":"\\&","‖":"\\parallel","%":"\\%","“":"\\text{``}",$:"\\$","#":"\\#","℃":"\\text{\\textdegree C}","℉":"\\text{\\textdegree F}","█":"\\blacksquare","℧":"\\mho","⌋":"\\rfloor","⌊":"\\lfloor","⌉":"\\rceil","⌈":"\\lceil",ℇ:"\\varepsilon",ⅇ:"\\text{e}",ɼ:"r","↛":"\\nrightarrow",ˆ:"\\hat{}","‾":"\\overline","→":"\\rightarrow","‡":"\\ddagger","・":"\\cdot","▱":"\\square","∆":"\\Delta",ἱ:"i","∡":"\\angle",ϒ:"\\Upsilon","↓":"\\downarrow","↑":"\\uparrow","»":"\\gg","⊤":"\\top","⧸":"/",𝛿:"\\delta","˳":"\\cdot","։":":","⦪":"\\measuredangle","⦩":"\\measuredangle","⦫":"\\measuredangle","⦁":"\\cdot",ѳ:"\\theta","⦢":"\\measuredangle","¸":",","⎻":"\\overline","⟦":"\\llbracket",𝜙:"\\phi",П:"\\prod",о:"o","≈":"\\approx","≤":"\\leq",ђ:"\\hbar",Ʌ:"\\Lambda",土:"\\pm","⎼":"-",十:"+","≠":"\\neq","←":"\\leftarrow","।":"\\mid","€":"\\euro","˘":" ",ῡ:"\\bar{u}","∥":"\\parallel","↔":"\\leftrightarrow","√":"\\sqrt{}",ȼ:"c",𝞮:"\\epsilon","·":"\\cdot","⦬":"\\measuredangle","⦮":"\\measuredangle","⦭":"\\measuredangle","«":"\\ll",Χ:"\\mathsf{X}","│":"\\mid","〉":"\\rangle",ₙ:"_{n}","▫":"\\square","●":"\\circle","”":'\\"'};},5406:function(e,t,r){"use strict";var a=this&&this.__createBinding||(Object.create?function(e,t,r,a){void 0===a&&(a=r);var n=Object.getOwnPropertyDescriptor(t,r);n&&!("get"in n?!t.__esModule:n.writable||n.configurable)||(n={enumerable:!0,get:function(){return t[r]}}),Object.defineProperty(e,a,n);}:function(e,t,r,a){void 0===a&&(a=r),e[a]=t[r];}),n=this&&this.__exportStar||function(e,t){for(var r in e)"default"===r||Object.prototype.hasOwnProperty.call(t,r)||a(t,e,r);};Object.defineProperty(t,"__esModule",{value:!0}),n(r(2965),t),n(r(9039),t),n(r(8249),t),n(r(8171),t),n(r(472),t),n(r(4320),t),n(r(6122),t);},472:(e,t)=>{"use strict";Object.defineProperty(t,"__esModule",{value:!0}),t.latexAccents=void 0,t.latexAccents=["\\hat","\\bar","\\underbrace","\\overbrace"];},4320:(e,t)=>{"use strict";Object.defineProperty(t,"__esModule",{value:!0}),t.mathNumberByGlyph=void 0,t.mathNumberByGlyph={"₀":"_{0}","₁":"_{1}","₂":"_{2}","₃":"_{3}","₄":"_{4}","₅":"_{5}","₆":"_{6}","₇":"_{7}","₈":"_{8}","₉":"_{9}","⁰":"^{0}","¹":"^{1}","²":"^{2}","³":"^{3}","⁴":"^{4}","⁵":"^{5}","⁶":"^{6}","⁷":"^{7}","⁸":"^{8}","⁹":"^{9}",ⁿ:"^{n}",ₙ:"_{n}","⓪":"\\textcircled{0}","①":"\\textcircled{1}","②":"\\textcircled{2}","③":"\\textcircled{3}","④":"\\textcircled{4}","⑤":"\\textcircled{5}","⑥":"\\textcircled{6}","⑦":"\\textcircled{7}","⑧":"\\textcircled{8}","⑨":"\\textcircled{9}","⑩":"\\textcircled{10}","⑪":"\\textcircled{11}","⑫":"\\textcircled{12}","⑬":"\\textcircled{13}","⑭":"\\textcircled{14}","⑮":"\\textcircled{15}","⑯":"\\textcircled{16}","⑰":"\\textcircled{17}","⑱":"\\textcircled{18}","⑲":"\\textcircled{19}","⑳":"\\textcircled{20}","㉑":"\\textcircled{21}","㉒":"\\textcircled{22}","㉓":"\\textcircled{23}","㉔":"\\textcircled{24}","㉕":"\\textcircled{25}","㉖":"\\textcircled{26}","㉗":"\\textcircled{27}","㉘":"\\textcircled{28}","㉙":"\\textcircled{29}","㉚":"\\textcircled{30}","㉛":"\\textcircled{31}","㉜":"\\textcircled{32}","㉝":"\\textcircled{33}","㉞":"\\textcircled{34}","㉟":"\\textcircled{35}","㊱":"\\textcircled{36}","㊲":"\\textcircled{37}","㊳":"\\textcircled{38}","㊴":"\\textcircled{39}","㊵":"\\textcircled{40}","㊶":"\\textcircled{41}","㊷":"\\textcircled{42}","㊸":"\\textcircled{43}","㊹":"\\textcircled{44}","㊺":"\\textcircled{45}","㊻":"\\textcircled{46}","㊼":"\\textcircled{47}","㊽":"\\textcircled{48}","㊾":"\\textcircled{49}","㊿":"\\textcircled{50}","½":"\\dfrac{1}{2}","⅓":"\\dfrac{1}{3}","⅔":"\\dfrac{2}{3}","¼":"\\dfrac{1}{4}","¾":"\\dfrac{3}{4}","⅕":"\\dfrac{1}{5}","⅖":"\\dfrac{2}{5}","⅗":"\\dfrac{3}{5}","⅘":"\\dfrac{4}{5}","⅙":"\\dfrac{1}{6}","⅚":"\\dfrac{5}{6}","⅐":"\\dfrac{1}{7}","⅛":"\\dfrac{1}{8}","⅜":"\\dfrac{3}{8}","⅝":"\\dfrac{5}{8}","⅞":"\\dfrac{7}{8}","⅑":"\\dfrac{1}{9}","⅒":"\\dfrac{1}{10}"};},6122:(e,t)=>{"use strict";Object.defineProperty(t,"__esModule",{value:!0}),t.HashUTF8ToLtXConverter=void 0,t.HashUTF8ToLtXConverter=class{convert(e){if(e.match(/[a-z0-9]/i))return e;const t=r[e];if(t){return this.convertAccentCharToLtX(t)||e}return this.convertSpecialCharToLtX(e)||e}convertAccentCharToLtX(e){const{char:t,accent:r}=e,n=a[r];return n?`\\${n}{${t}}`:null}convertSpecialCharToLtX(e){const t=n[e];if(!t)return null;const{letter:r,fontCmd:a}=t;return `\\${a}{${r}}`}};const r={á:{char:"a",accent:"´"},à:{char:"a",accent:"`"},â:{char:"a",accent:"^"},ã:{char:"a",accent:"~"},ä:{char:"a",accent:"¨"},å:{char:"a",accent:"˚"},ą:{char:"a",accent:"˙"},ă:{char:"a",accent:"˘"},ǎ:{char:"a",accent:"ˇ"},ǟ:{char:"a",accent:"ˆ"},ǻ:{char:"a",accent:"˙"},ǡ:{char:"a",accent:"-"},ā:{char:"a",accent:"-"},é:{char:"e",accent:"´"},è:{char:"e",accent:"`"},ê:{char:"e",accent:"^"},ë:{char:"e",accent:"¨"},ę:{char:"e",accent:"˙"},ě:{char:"e",accent:"ˇ"},ȇ:{char:"i",accent:"^"},ё:{char:"e",accent:"¨"},ē:{char:"e",accent:"-"},í:{char:"i",accent:"´"},ì:{char:"i",accent:"`"},î:{char:"i",accent:"^"},ï:{char:"i",accent:"¨"},į:{char:"i",accent:"˙"},ǐ:{char:"i",accent:"ˇ"},ȉ:{char:"i",accent:"`"},ȋ:{char:"i",accent:"¨"},ī:{char:"i",accent:"-"},ó:{char:"o",accent:"´"},ò:{char:"o",accent:"`"},ô:{char:"o",accent:"^"},õ:{char:"o",accent:"~"},ö:{char:"o",accent:"¨"},ő:{char:"o",accent:"˝"},ǒ:{char:"o",accent:"ˇ"},ȍ:{char:"o",accent:"`"},ȏ:{char:"o",accent:"¨"},ȫ:{char:"o",accent:"˘"},ȭ:{char:"o",accent:"˝"},ȯ:{char:"o",accent:"˙"},ō:{char:"o",accent:"-"},ú:{char:"u",accent:"´"},ù:{char:"u",accent:"`"},û:{char:"u",accent:"^"},ü:{char:"u",accent:"¨"},ű:{char:"u",accent:"˝"},ǔ:{char:"u",accent:"ˇ"},ǖ:{char:"u",accent:"¨"},ǘ:{char:"u",accent:"¨"},ǚ:{char:"u",accent:"¨"},ǜ:{char:"u",accent:"¨"},ȕ:{char:"u",accent:"`"},ȗ:{char:"u",accent:"¨"},ū:{char:"u",accent:"-"},ý:{char:"y",accent:"´"},ỳ:{char:"y",accent:"`"},ŷ:{char:"y",accent:"^"},ÿ:{char:"y",accent:"¨"},ȳ:{char:"y",accent:"-"},Á:{char:"A",accent:"´"},À:{char:"A",accent:"`"},Â:{char:"A",accent:"^"},Ã:{char:"A",accent:"~"},Ä:{char:"A",accent:"¨"},Å:{char:"A",accent:"˚"},Å:{char:"A",accent:"˚"},Ȧ:{char:"A",accent:"˙"},Ă:{char:"A",accent:"˘"},Ǎ:{char:"A",accent:"ˇ"},Ǟ:{char:"A",accent:"˝"},Ǻ:{char:"A",accent:"˚"},Ǡ:{char:"A",accent:"-"},Ā:{char:"A",accent:"-"},É:{char:"E",accent:"´"},È:{char:"E",accent:"`"},Ė:{char:"E",accent:"˙"},Ê:{char:"E",accent:"^"},Ë:{char:"E",accent:"¨"},Ě:{char:"E",accent:"ˇ"},Ȅ:{char:"E",accent:"`"},Ȇ:{char:"E",accent:"¨"},Ē:{char:"E",accent:"-"},Í:{char:"I",accent:"´"},Ì:{char:"I",accent:"`"},Î:{char:"I",accent:"^"},Ï:{char:"I",accent:"¨"},Ĭ:{char:"I",accent:"˘"},Ǐ:{char:"I",accent:"ˇ"},Ȉ:{char:"I",accent:"`"},Ȋ:{char:"I",accent:"¨"},Ī:{char:"I",accent:"-"},Ó:{char:"O",accent:"´"},Ò:{char:"O",accent:"`"},Ô:{char:"O",accent:"^"},Õ:{char:"O",accent:"~"},Ö:{char:"O",accent:"¨"},Ő:{char:"O",accent:"˝"},Ǒ:{char:"O",accent:"ˇ"},Ȍ:{char:"O",accent:"`"},Ȏ:{char:"O",accent:"¨"},Ȫ:{char:"O",accent:"˘"},Ȭ:{char:"O",accent:"˝"},Ȯ:{char:"O",accent:"˙"},Ō:{char:"O",accent:"-"},Ú:{char:"U",accent:"´"},Ù:{char:"U",accent:"`"},Û:{char:"U",accent:"^"},Ü:{char:"U",accent:"¨"},Ű:{char:"U",accent:"˝"},Ǔ:{char:"U",accent:"ˇ"},Ǖ:{char:"U",accent:"¨"},Ȕ:{char:"U",accent:"`"},Ȗ:{char:"U",accent:"¨"},Ū:{char:"U",accent:"-"},Ý:{char:"Y",accent:"´"},Ỳ:{char:"Y",accent:"`"},Ŷ:{char:"Y",accent:"^"},Ÿ:{char:"Y",accent:"¨"},Ȳ:{char:"Y",accent:"-"},ñ:{char:"n",accent:"~"},Ñ:{char:"N",accent:"~"},ç:{char:"c",accent:"˙"},Ç:{char:"C",accent:"˙"},ṽ:{char:"v",accent:"~"},Ṽ:{char:"V",accent:"~"},ĵ:{char:"j",accent:"^"},Ĵ:{char:"J",accent:"^"},ź:{char:"z",accent:"´"},Ź:{char:"Z",accent:"´"},Ż:{char:"Z",accent:"^"},ż:{char:"z",accent:"^"},Ž:{char:"Z",accent:"ˇ"},ž:{char:"z",accent:"ˇ"},ẑ:{char:"z",accent:"ˆ"}},a={"´":"acute","`":"grave","^":"hat","~":"tilde","¨":"ddot","˚":"mathring","˘":"breve",ˇ:"check","˝":"H","˙":"dot","-":"bar",ˆ:"hat","˜":"tilde"},n={𝐀:{letter:"A",fontCmd:"mathbf"},𝐁:{letter:"B",fontCmd:"mathbf"},𝐂:{letter:"C",fontCmd:"mathbf"},𝐃:{letter:"D",fontCmd:"mathbf"},𝐄:{letter:"E",fontCmd:"mathbf"},Ε:{letter:"E",fontCmd:"mathbf"},𝐅:{letter:"F",fontCmd:"mathbf"},𝐆:{letter:"G",fontCmd:"mathbf"},𝐇:{letter:"H",fontCmd:"mathbf"},𝐈:{letter:"I",fontCmd:"mathbf"},𝐉:{letter:"J",fontCmd:"mathbf"},𝐊:{letter:"K",fontCmd:"mathbf"},𝐋:{letter:"L",fontCmd:"mathbf"},𝐌:{letter:"M",fontCmd:"mathbf"},𝐍:{letter:"N",fontCmd:"mathbf"},𝐎:{letter:"O",fontCmd:"mathbf"},𝐏:{letter:"P",fontCmd:"mathbf"},𝐐:{letter:"Q",fontCmd:"mathbf"},𝐑:{letter:"R",fontCmd:"mathbf"},𝐒:{letter:"S",fontCmd:"mathbf"},𝐓:{letter:"T",fontCmd:"mathbf"},𝐔:{letter:"U",fontCmd:"mathbf"},𝐕:{letter:"V",fontCmd:"mathbf"},𝐖:{letter:"W",fontCmd:"mathbf"},𝐗:{letter:"X",fontCmd:"mathbf"},𝞆:{letter:"X",fontCmd:"mathbf"},𝐘:{letter:"Y",fontCmd:"mathbf"},𝐙:{letter:"Z",fontCmd:"mathbf"},"𝟎":{letter:"0",fontCmd:"mathbf"},"𝟏":{letter:"1",fontCmd:"mathbf"},"𝟐":{letter:"2",fontCmd:"mathbf"},"𝟑":{letter:"3",fontCmd:"mathbf"},"𝟒":{letter:"4",fontCmd:"mathbf"},"𝟓":{letter:"5",fontCmd:"mathbf"},"𝟔":{letter:"6",fontCmd:"mathbf"},"𝟕":{letter:"7",fontCmd:"mathbf"},"𝟖":{letter:"8",fontCmd:"mathbf"},"𝟗":{letter:"9",fontCmd:"mathbf"},𝐴:{letter:"A",fontCmd:"mathit"},𝐵:{letter:"B",fontCmd:"mathit"},𝐶:{letter:"C",fontCmd:"mathit"},𝐷:{letter:"D",fontCmd:"mathit"},𝐸:{letter:"E",fontCmd:"mathit"},𝐹:{letter:"F",fontCmd:"mathit"},𝐺:{letter:"G",fontCmd:"mathit"},𝐻:{letter:"H",fontCmd:"mathit"},𝐼:{letter:"I",fontCmd:"mathit"},Ι:{letter:"I",fontCmd:"mathit"},𝐽:{letter:"J",fontCmd:"mathit"},𝐾:{letter:"K",fontCmd:"mathit"},𝐿:{letter:"L",fontCmd:"mathit"},𝑀:{letter:"M",fontCmd:"mathit"},𝑁:{letter:"N",fontCmd:"mathit"},𝑂:{letter:"O",fontCmd:"mathit"},𝑃:{letter:"P",fontCmd:"mathit"},𝑄:{letter:"Q",fontCmd:"mathit"},𝑅:{letter:"R",fontCmd:"mathit"},𝑆:{letter:"S",fontCmd:"mathit"},𝑇:{letter:"T",fontCmd:"mathit"},𝑈:{letter:"U",fontCmd:"mathit"},𝑉:{letter:"V",fontCmd:"mathit"},𝑊:{letter:"W",fontCmd:"mathit"},𝑋:{letter:"X",fontCmd:"mathit"},𝑌:{letter:"Y",fontCmd:"mathit"},𝑍:{letter:"Z",fontCmd:"mathit"},𝔸:{letter:"A",fontCmd:"mathbb"},𝔹:{letter:"B",fontCmd:"mathbb"},ℂ:{letter:"C",fontCmd:"mathbb"},𝔻:{letter:"D",fontCmd:"mathbb"},𝔼:{letter:"E",fontCmd:"mathbb"},𝔽:{letter:"F",fontCmd:"mathbb"},𝔾:{letter:"G",fontCmd:"mathbb"},ℍ:{letter:"H",fontCmd:"mathbb"},𝕀:{letter:"I",fontCmd:"mathbb"},𝕁:{letter:"J",fontCmd:"mathbb"},𝕂:{letter:"K",fontCmd:"mathbb"},𝕃:{letter:"L",fontCmd:"mathbb"},𝕄:{letter:"M",fontCmd:"mathbb"},ℕ:{letter:"N",fontCmd:"mathbb"},𝕆:{letter:"O",fontCmd:"mathbb"},ℙ:{letter:"P",fontCmd:"mathbb"},ℚ:{letter:"Q",fontCmd:"mathbb"},ℝ:{letter:"R",fontCmd:"mathbb"},𝕊:{letter:"S",fontCmd:"mathbb"},𝕋:{letter:"T",fontCmd:"mathbb"},𝕌:{letter:"U",fontCmd:"mathbb"},𝕍:{letter:"V",fontCmd:"mathbb"},𝕎:{letter:"W",fontCmd:"mathbb"},𝕏:{letter:"X",fontCmd:"mathbb"},𝕐:{letter:"Y",fontCmd:"mathbb"},ℤ:{letter:"Z",fontCmd:"mathbb"},"𝟘":{letter:"0",fontCmd:"mathbb"},"𝟙":{letter:"1",fontCmd:"mathbb"},"𝟚":{letter:"2",fontCmd:"mathbb"},"𝟛":{letter:"3",fontCmd:"mathbb"},"𝟜":{letter:"4",fontCmd:"mathbb"},"𝟝":{letter:"5",fontCmd:"mathbb"},"𝟞":{letter:"6",fontCmd:"mathbb"},"𝟟":{letter:"7",fontCmd:"mathbb"},"𝟠":{letter:"8",fontCmd:"mathbb"},"𝟡":{letter:"9",fontCmd:"mathbb"},𝒜:{letter:"A",fontCmd:"mathcal"},𝓐:{letter:"A",fontCmd:"mathcal"},ℬ:{letter:"B",fontCmd:"mathcal"},𝒞:{letter:"C",fontCmd:"mathcal"},𝒟:{letter:"D",fontCmd:"mathcal"},𝓓:{letter:"D",fontCmd:"mathcal"},ℰ:{letter:"E",fontCmd:"mathcal"},ℱ:{letter:"F",fontCmd:"mathcal"},𝓕:{letter:"F",fontCmd:"mathcal"},𝒢:{letter:"G",fontCmd:"mathcal"},ℋ:{letter:"H",fontCmd:"mathcal"},ℐ:{letter:"I",fontCmd:"mathcal"},𝒥:{letter:"J",fontCmd:"mathcal"},𝒦:{letter:"K",fontCmd:"mathcal"},ℒ:{letter:"L",fontCmd:"mathcal"},𝓛:{letter:"L",fontCmd:"mathcal"},ℳ:{letter:"M",fontCmd:"mathcal"},𝒩:{letter:"N",fontCmd:"mathcal"},𝒪:{letter:"O",fontCmd:"mathcal"},𝓞:{letter:"O",fontCmd:"mathcal"},𝒫:{letter:"P",fontCmd:"mathcal"},𝒬:{letter:"Q",fontCmd:"mathcal"},ℛ:{letter:"R",fontCmd:"mathcal"},𝕽:{letter:"R",fontCmd:"mathcal"},"℟":{letter:"R",fontCmd:"mathcal"},𝒮:{letter:"S",fontCmd:"mathcal"},𝒯:{letter:"T",fontCmd:"mathcal"},𝒰:{letter:"U",fontCmd:"mathcal"},𝒱:{letter:"V",fontCmd:"mathcal"},𝒲:{letter:"W",fontCmd:"mathcal"},𝒳:{letter:"X",fontCmd:"mathcal"},𝒴:{letter:"Y",fontCmd:"mathcal"},𝒵:{letter:"Z",fontCmd:"mathcal"},𝔄:{letter:"A",fontCmd:"mathfrak"},𝔅:{letter:"B",fontCmd:"mathfrak"},ℭ:{letter:"C",fontCmd:"mathfrak"},𝔇:{letter:"D",fontCmd:"mathfrak"},𝔈:{letter:"E",fontCmd:"mathfrak"},𝔉:{letter:"F",fontCmd:"mathfrak"},𝔊:{letter:"G",fontCmd:"mathfrak"},ℌ:{letter:"H",fontCmd:"mathfrak"},ℑ:{letter:"I",fontCmd:"mathfrak"},𝔍:{letter:"J",fontCmd:"mathfrak"},𝔎:{letter:"K",fontCmd:"mathfrak"},𝔏:{letter:"L",fontCmd:"mathfrak"},𝔐:{letter:"M",fontCmd:"mathfrak"},𝔑:{letter:"N",fontCmd:"mathfrak"},𝔒:{letter:"O",fontCmd:"mathfrak"},𝔓:{letter:"P",fontCmd:"mathfrak"},𝔔:{letter:"Q",fontCmd:"mathfrak"},ℜ:{letter:"R",fontCmd:"mathfrak"},𝔖:{letter:"S",fontCmd:"mathfrak"},𝔗:{letter:"T",fontCmd:"mathfrak"},𝔘:{letter:"U",fontCmd:"mathfrak"},𝔙:{letter:"V",fontCmd:"mathfrak"},𝔚:{letter:"W",fontCmd:"mathfrak"},𝔛:{letter:"X",fontCmd:"mathfrak"},𝔜:{letter:"Y",fontCmd:"mathfrak"},ℨ:{letter:"Z",fontCmd:"mathfrak"},𝖠:{letter:"A",fontCmd:"mathsf"},Α:{letter:"A",fontCmd:"mathsf"},𝖡:{letter:"B",fontCmd:"mathsf"},Β:{letter:"B",fontCmd:"mathsf"},𝖢:{letter:"C",fontCmd:"mathsf"},𝖣:{letter:"D",fontCmd:"mathsf"},𝖤:{letter:"E",fontCmd:"mathsf"},𝖥:{letter:"F",fontCmd:"mathsf"},𝖦:{letter:"G",fontCmd:"mathsf"},𝖧:{letter:"H",fontCmd:"mathsf"},𝖨:{letter:"I",fontCmd:"mathsf"},𝖩:{letter:"J",fontCmd:"mathsf"},ȷ:{letter:"J",fontCmd:"mathsf"},𝖪:{letter:"K",fontCmd:"mathsf"},Κ:{letter:"K",fontCmd:"mathsf"},𝖫:{letter:"L",fontCmd:"mathsf"},𝖬:{letter:"M",fontCmd:"mathsf"},𝖭:{letter:"N",fontCmd:"mathsf"},𝖮:{letter:"O",fontCmd:"mathsf"},𝖯:{letter:"P",fontCmd:"mathsf"},𝖰:{letter:"Q",fontCmd:"mathsf"},𝖱:{letter:"R",fontCmd:"mathsf"},𝖲:{letter:"S",fontCmd:"mathsf"},𝖳:{letter:"T",fontCmd:"mathsf"},𝖴:{letter:"U",fontCmd:"mathsf"},𝖵:{letter:"V",fontCmd:"mathsf"},𝖶:{letter:"W",fontCmd:"mathsf"},𝖷:{letter:"X",fontCmd:"mathsf"},Χ:{letter:"X",fontCmd:"mathsf"},𝖸:{letter:"Y",fontCmd:"mathsf"},𝖹:{letter:"Z",fontCmd:"mathsf"},𝚨:{letter:"A",fontCmd:"mathtt"},𝚩:{letter:"B",fontCmd:"mathtt"},𝚪:{letter:"\\Gamma",fontCmd:"mathtt"},𝚫:{letter:"\\Delta",fontCmd:"mathtt"},𝚬:{letter:"E",fontCmd:"mathtt"},𝚭:{letter:"F",fontCmd:"mathtt"},𝚮:{letter:"G",fontCmd:"mathtt"},𝚯:{letter:"\\Theta",fontCmd:"mathtt"},𝚰:{letter:"I",fontCmd:"mathtt"},𝚱:{letter:"J",fontCmd:"mathtt"},𝚲:{letter:"\\Lambda",fontCmd:"mathtt"},𝚳:{letter:"L",fontCmd:"mathtt"},𝚴:{letter:"M",fontCmd:"mathtt"},𝚵:{letter:"\\Pi",fontCmd:"mathtt"},𝚶:{letter:"O",fontCmd:"mathtt"},𝚷:{letter:"\\Pi",fontCmd:"mathtt"},𝚸:{letter:"Q",fontCmd:"mathtt"},𝚹:{letter:"R",fontCmd:"mathtt"},𝚺:{letter:"S",fontCmd:"mathtt"},𝚻:{letter:"T",fontCmd:"mathtt"},𝚼:{letter:"U",fontCmd:"mathtt"},𝚽:{letter:"\\Phi",fontCmd:"mathtt"},𝚾:{letter:"W",fontCmd:"mathtt"},𝚿:{letter:"\\Psi",fontCmd:"mathtt"},𝛀:{letter:"\\Omega",fontCmd:"mathtt"}};}},t={};function r(a){var n=t[a];if(void 0!==n)return n.exports;var o=t[a]={exports:{}};return e[a].call(o.exports,o,o.exports,r),o.exports}var a={};return (()=>{"use strict";var e=a;Object.defineProperty(e,"__esModule",{value:!0}),e.MathMLToLaTeX=void 0;var t=r(8672);Object.defineProperty(e,"MathMLToLaTeX",{enumerable:!0,get:function(){return t.MathMLToLaTeX}});})(),a})()));
		
	} (bundle_min$2, bundle_min$2.exports));
	return bundle_min$2.exports;
}

var bundle_minExports = requireBundle_min();
const bundle_min = /*@__PURE__*/getDefaultExportFromCjs(bundle_minExports);

"use strict";
const translateContent = async (content, targetLang) => {
  if (!content?.trim() || targetLang === "auto") return content;
  const langNames = {
    auto: "",
    en: "English",
    ru: "Russian"
  };
  try {
    const response = await chrome.runtime.sendMessage({
      type: "gpt:translate",
      input: content,
      targetLanguage: langNames[targetLang] || "English"
    });
    return response?.data || content;
  } catch (e) {
    console.warn("Translation failed:", e);
    return content;
  }
};
const shouldTranslate = async () => {
  try {
    const settings = await loadSettings();
    return {
      translate: settings?.ai?.translateResults || false,
      lang: settings?.ai?.responseLanguage || "auto"
    };
  } catch {
    return { translate: false, lang: "auto" };
  }
};
const applyTranslation = async (content) => {
  const { translate, lang } = await shouldTranslate();
  if (translate && lang !== "auto") {
    return translateContent(content, lang);
  }
  return content;
};
const turndownService = new TurndownService();
let markedParserPromise = null;
const getMarkedParser = async () => {
  if (markedParserPromise) return markedParserPromise;
  markedParserPromise = (async () => {
    const [{ marked }, { default: markedKatex }] = await Promise.all([
      __vitePreload(() => import('./marked.esm.js'),true              ?[]:void 0,import.meta.url),
      __vitePreload(() => import('./index17.js').then(n => n.index),true              ?[]:void 0,import.meta.url)
    ]);
    marked?.use?.(
      markedKatex?.({
        throwOnError: false,
        nonStandard: true
      })
    );
    return async (input) => {
      return await marked.parse(input);
    };
  })();
  return markedParserPromise;
};
const convertToHtml = async (input) => {
  const original = escapeML(input);
  if (input?.trim()?.startsWith?.("<") && input?.trim()?.endsWith?.(">")) {
    return input;
  }
  try {
    const parse = await getMarkedParser();
    input = escapeML(await parse(input) || "") || input;
  } catch (e) {
    input = "";
    console.warn(e);
  }
  input ||= original;
  return input?.normalize?.()?.trim?.() || input?.trim?.() || input;
};
const convertToMarkdown = (input) => {
  const original = escapeML(input);
  try {
    input = turndownService.turndown(input);
  } catch (e) {
    input = "";
    console.warn(e);
  }
  input ||= original;
  return input?.normalize?.()?.trim?.() || input?.trim?.() || input;
};
const copyAsMarkdown = async (target, options) => {
  const container = getContainerFromTextSelection(target);
  let markdown = convertToMarkdown(container?.innerHTML || container?.outerHTML || "");
  let text = markdown?.trim?.()?.normalize?.()?.trim?.() || markdown?.trim?.() || markdown;
  if (options?.translate !== false) {
    text = await applyTranslation(text);
  }
  if (text) await writeText(text);
  return text;
};
const copyAsHTML = async (target, options) => {
  const container = getContainerFromTextSelection(target);
  let sourceText = container?.innerText || "";
  if (options?.translate !== false) {
    sourceText = await applyTranslation(sourceText);
  }
  const html = await convertToHtml(sourceText) || await convertToHtml(container?.innerHTML || container?.outerHTML || "");
  const text = html?.trim?.()?.normalize?.()?.trim?.() || html?.trim?.() || html;
  if (text) await writeHTML(text, sourceText || text);
  return text;
};
const $wrap$ = (katex) => {
  if (katex?.startsWith?.("$") && katex?.endsWith?.("$")) {
    return katex;
  }
  return "$" + katex + "$";
};
const copyAsTeX = async (target, _options) => {
  const math = bySelector(target, "math");
  const mjax = bySelector(target, "[data-mathml]");
  const orig = bySelector(target, "[data-original]");
  const expr = bySelector(target, "[data-expr]");
  const img = bySelector(target, ".mwe-math-fallback-image-inline[alt], .mwe-math-fallback-image-display[alt]");
  const forRecognition = bySelector(target, "img:is([src],[srcset]), picture:has(img)");
  let LaTeX = img?.getAttribute("alt") || getSelection()?.toString?.() || "";
  try {
    if (!LaTeX) {
      const ml = expr?.getAttribute("data-expr") || "";
      LaTeX = (ml ? escapeML(ml) : LaTeX) || LaTeX;
    }
    if (!LaTeX) {
      const ml = orig?.getAttribute("data-original") || "";
      LaTeX = (ml ? escapeML(ml) : LaTeX) || LaTeX;
    }
    if (!LaTeX) {
      const ml = mjax?.getAttribute("data-mathml") || "";
      LaTeX = (ml ? escapeML(ml) : LaTeX) || LaTeX;
    }
    if (!LaTeX) {
      const st = math?.innerHTML || math?.outerHTML || "";
      if (!st && math) {
        const str = serialize(math);
        LaTeX = escapeML(str || st || LaTeX);
      }
      if (st) {
        LaTeX = escapeML(st || LaTeX);
      }
      ;
      LaTeX = extractFromAnnotation(math) || LaTeX;
    }
    ;
  } catch (e) {
    console.warn(e);
  }
  const original = LaTeX?.trim?.();
  try {
    LaTeX = bundle_minExports.MathMLToLaTeX.convert(LaTeX);
  } catch (e) {
    LaTeX = "";
    console.warn(e);
  }
  LaTeX ||= original?.trim?.();
  if (!LaTeX && forRecognition) {
    const baseOrigin = globalThis?.location?.origin;
    const img2 = new URL(forRecognition?.currentSrc || forRecognition?.src || forRecognition?.getAttribute?.("src"), baseOrigin)?.href;
    const dataUrl = img2 ? await deAlphaChannel(img2) : null;
    if (dataUrl) {
      const res = await chrome.runtime.sendMessage({
        type: "gpt:recognize",
        input: [{
          role: "user",
          content: [{ type: "input_image", image_url: dataUrl, detail: "auto" }]
        }]
      });
      LaTeX = res?.data?.output?.at?.(-1)?.content?.[0]?.text || LaTeX;
    }
  }
  const resultText = $wrap$(LaTeX?.trim?.()?.normalize?.()?.trim?.() || LaTeX?.trim?.());
  if (resultText) await writeText(resultText);
  return resultText?.trim?.();
};
function stripMathDelimiters(input) {
  const s = String(input).trim();
  const re = /^\s*(?:\$\$([\s\S]*?)\$\$|\$([\s\S]*?)\$|\\\[([\s\S]*?)\\\]|\\\(([\s\S]*?)\\\)|\\begin\{([^\}]+)\}([\s\S]*?)\\end\{\5\})\s*$/;
  const m = s.match(re);
  if (!m) return s;
  return (m[1] ?? m[2] ?? m[3] ?? m[4] ?? m[6] ?? "").trim();
}
const copyAsMathML = async (target, _options) => {
  const math = bySelector(target, "math");
  const mjax = bySelector(target, "[data-mathml]");
  const orig = bySelector(target, "[data-original]");
  const expr = bySelector(target, "[data-expr]");
  const img = bySelector(target, ".mwe-math-fallback-image-inline[alt], .mwe-math-fallback-image-display[alt]");
  let mathML = (img?.getAttribute?.("alt") || "" || "")?.trim?.();
  try {
    if (!mathML) {
      const st = (math?.innerHTML || math?.outerHTML || "")?.trim?.();
      if (!st && math) {
        const str = serialize(math);
        mathML = escapeML(str || st || mathML)?.trim?.();
      }
      if (st) {
        mathML = escapeML(st || mathML)?.trim?.();
      }
      ;
    }
    if (!mathML) {
      const ml = mjax?.getAttribute("data-mathml") || "";
      mathML = (ml ? escapeML(ml) : mathML) || mathML;
    }
    if (!mathML) {
      const ml = expr?.getAttribute("data-expr") || "";
      mathML = (ml ? escapeML(ml) : mathML) || mathML;
    }
    if (!mathML) {
      const ml = orig?.getAttribute("data-original") || "";
      mathML = (ml ? escapeML(ml) : mathML) || mathML;
    }
  } catch (e) {
    console.warn(e);
  }
  const original = mathML?.trim?.();
  if (!mathML) {
    mathML ||= (await copyAsTeX(target))?.trim?.() || original;
  }
  if (!(mathML?.trim()?.startsWith?.("<") && mathML?.trim()?.endsWith?.(">"))) {
    try {
      mathML = escapeML(temml$1.renderToString(stripMathDelimiters(mathML), {
        throwOnError: true,
        strict: false,
        trust: true,
        xml: true
      }) || "")?.trim?.() || mathML;
    } catch (e) {
      mathML = "";
      console.warn(e);
    }
  }
  mathML ||= original?.trim?.();
  const text = mathML?.trim?.()?.normalize?.()?.trim?.() || mathML?.trim?.() || mathML;
  if (text) await writeText(text);
  return text;
};

export { copyAsHTML, copyAsMarkdown, copyAsMathML, copyAsTeX };
//# sourceMappingURL=Conversion.js.map
