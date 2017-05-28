
/*

# Aspecty
## version 0.0.7

Aspecty is a CSS reprocessor that adds support for an aspect-ratio property using JS. This plugin allows you to define a desired aspect-ratio for an element, based on its rendered width on the page.

For any element with an aspect ratio defined, event listeners will be added to reprocess the styles on the following events:

- `mouseenter`
- `mouseleave`
- `mousedown`
- `mouseup`
- `focus`
- `blur`

By default, Aspecty will reprocess aspect ratios by watching the following events:

- `load`
- `resize`
- `input`
- `click`

To run Aspecty whenever you want, use the `aspecty.load()` function in JS.

The aspect ratio property can be used in CSS with the property name `--aspect-ratio` and a ratio, expressed as width and height as unitless numbers, separated by a slash `/`:

    --aspect-ratio: width/height;

You can use it in CSS like this:

    div {
      background: lime;
      --aspect-ratio: 16/9;
    }

Aspecty will look through the document for any element matching the selector (in this case `div`) and create a new rule with a `height` value calculated based on each matching element's `offsetWidth` divided by the aspect ratio defined in CSS.

- https://github.com/tomhodgins/cssplus

Author: Tommy Hodgins

License: MIT

*/

// Uses Node, AMD or browser globals to create a module
(function (root, factory) {

  if (typeof define === 'function' && define.amd) {

    // AMD: Register as an anonymous module
    define([], factory)

  } else if (typeof module === 'object' && module.exports) {

    // Node: Does not work with strict CommonJS, but
    // only CommonJS-like environments that support module.exports,
    // like Node
    module.exports = factory()

  } else {

    // Browser globals (root is window)
    root.aspecty = factory()

  }

}(this, function() {

  const aspecty = {}

  aspecty.style = ''

  aspecty.load = () => {

    // Find (or create) style tag to populate
    const style_tag = document.querySelector('[data-aspecty-style]') || (() => {

      const tag = document.createElement('style')
      tag.setAttribute('data-aspecty-style', '')
      document.head.appendChild(tag)
      return tag

    })()

    aspecty.style = ''

    aspecty.findRules()

    // Populate style tag with style
    style_tag.innerHTML = `\n${aspecty.style}\n`

  }

  aspecty.findRules = () => {

    // For each stylesheet
    Array.from(document.styleSheets, sheet => {

      // For each rule
      sheet.cssRules && Array.from(sheet.cssRules, rule => {

        aspecty.process(rule)

      })

    })

  }

  aspecty.process = rule => {

    // If rule is a qualified rule, process it
    if (rule.type === 1) {

      aspecty.style += aspecty.transform(rule)

    }

    // If rule is an at-rule, find all qualified rules inside
    if (rule.type === 4) {

      let css_rules = ''

      // Remember media query text
      let mediaText = rule.media.mediaText

      // If there are qualified rules, find all rules
      rule.cssRules && Array.from(rule.cssRules, mediaRule => {

        css_rules += aspecty.transform(mediaRule)

      })

      // If there is at least one new rule, wrap in at-rule with media text
      if (css_rules.length > 0) {

        aspecty.style += `  @media ${mediaText} {\n${css_rules.replace(/^(.*)$/gmi,'  $1')}\n  }\n`

      }

    }

  }

  aspecty.transform = rule => {

    let selector = rule.selectorText.replace(/(.*)\s{/gi, '$1')
    let ruleText = rule.cssText.replace(/.*\{(.*)\}/gi, '$1')

    // Start a new list of matching rules
    let newRules = ''

    // Create a new attribute to identify matching elements
    let attr = ''

    let elWidth
    let width
    let height
    let specificity

    // For each rule, search for `-aspect-ratio`
    ruleText.replace(/(--aspect-ratio:\s*)(\d\.*\d*\s*\/\s*\d\.*\d*)(\s*\!important)*\s*(?:;|\})/i, (string, property, value, important) => {

      // Extract width, height, and !important from value
      width = parseInt(value.split('/')[0])
      height = parseInt(value.split('/')[1])
      specificity = important || ''

      // For each element matching this selector
      Array.from(document.querySelectorAll(selector), (tag, i) => {

        elWidth = tag.offsetWidth || 0

        // If the ,atching element has a non-zero width
        if (elWidth) {

          // Create an attribute based on the selector
          attr = 'data-' + selector.replace(/[\s\'\"\=\>\[\]\~\^\$\*\:\(\)\#\.\+]/g, '-')

          // Create a new selector for our new CSS rule
          let newSelector = selector + '[' + attr + '="' + i + '"]'

          // If element has no preexisting attribute, add event listeners
          if (!tag.getAttribute(attr)) {

            tag.addEventListener('mouseenter', aspecty.load)
            tag.addEventListener('mouseleave', aspecty.load)
            tag.addEventListener('mousedown', aspecty.load)
            tag.addEventListener('mouseup', aspecty.load)
            tag.addEventListener('focus', aspecty.load)
            tag.addEventListener('blur', aspecty.load)

          }

          // Mark matching element with attribute and number
          tag.setAttribute(attr, i)

          // Height for new rule from offsetWidth, divided by aspect ratio
          let newHeight = elWidth / (width/height)

          // Create new `height` declaration with new value and !important text
          let newRuleText = `height: ${newHeight}px${specificity};`

          // And add our new rule to the rule list
          newRules += `\n/* ${selector} */\n${newSelector} {\n  ${newRuleText}\n}\n`

        }

      })

    })

    return newRules

  }

  // Update every `load`, `resize`, `input`, and `click`
  window.addEventListener('load', aspecty.load)
  window.addEventListener('resize', aspecty.load)
  window.addEventListener('input', aspecty.load)
  window.addEventListener('click', aspecty.load)

  return aspecty

}))