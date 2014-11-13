EJSpeed
========
A SPEEDY, standalone Javascript templating engine based on EJS (http://embeddedjs.com/), inspired by Rails' ERB (http://ruby-doc.org/stdlib-1.9.3/libdoc/erb/rdoc/ERB.html).

## Fast

* TL/DR - Benchmarks: 
  * 1.0.1 http://jsperf.com/dom-vs-innerhtml-based-templating/773
  * 1.0.0 http://jsperf.com/dom-vs-innerhtml-based-templating/614
* 10x faster than the original EJS
* Ranks with or beats the most popular including Mustache, Handlebars, Dust, and Hogan
* Outperforms most on older versions of IE, including 8 and 7
* Outperforms most on mobile including iOS, Android, and Windows Mobile

## Logical

* Don't learn another syntax. Write vanilla Javascript, or use external libraries like Underscore or Moment.js directly within templates
* ERB-style templating is similar to traditional server-side templating from .NET, Java and even PHP
* Provides useful distinction between precompiled (pre-rendered) and post-compiled (bound / live in the DOM) contexts
* Built-in template caching
* Works great as a "logicless" templating engine - *How you use it is up to you.* 

## Other Features

* Partials support via "Include", including caching of partials
* Ability to set data context within partials
* Supports a variety of template tags, including `<%`, `{{`, and `[%`. Default is `<%`.
* Built-in template loading, or use pre-served elements (see example)
* Standalone - Not dependent on any other libraries

### On the Roadmap

* Implement ASM.js version for improved performance
* Explore possible use of web workers for multi-threading & async
* Make it strict-mode compatible?
* Improve logging and debugging

## Basic setup

*JSON data:*
```javascript
var theWorld = {
    "theWorld": {
        "title": "Hello World",
        "regions": [
            "Asia",
            "Africa",
            "North America",
            "SouthAmerica",
            "Antarctica",
            "Europe",
            "Australia"
        ]
    }
}
```

*template.html:*
```html
<h1><%= Data.title %></h1>
<ul>
  <% for (var i = 0, len = Data.regions.length; i < len; i++) { %>
		<li><%= Data.regions[i] %></li>
	<% } %>
</ul>
```

*stage.html:*
```html
<html>
	<div id="stage"></div>
</html>
```

*default.js:*
```javascript
// Using jQuery
$('#stage').html(new EJSpeed ({url: 'template.html'}).render(theWorld));
```

#### Using pre-served elements: 
Instead of loading templates externally, you can also refer to elements pre-served up in your markup / in the HTML. You can use any element, but the example provided puts it inside a `script` tag.

*instead of template.html:*
```html
<script type="text/ejspeed" id="regionsTemplate">
<h1><%= Data.title %></h1>
<ul>
  <% for (var i = 0, len = Data.regions.length; i < len; i++) { %>
		<li><%= Data.regions[i] %></li>
	<% } %>
</ul>
</script>
```

*default2.js:*
```javascript
// Using jQuery
$('#stage').html(new EJSpeed ({element: 'regionsTemplate'}).render(theWorld));
```


#### Using a string as a template: 
You can also load or create your own templates external to EJSpeed, and then have EJSpeed compile them. In the EJSpeed options, just specify your Javascript string / variable using the "text" parameter. For example:

*default3.js:*
```javascript
var myTemplate = '<h1><%= Data.title %></h1><ul><% for (var i = 0, len = Data.regions.length; i < len; i++) { %><li><%= Data.regions[i] %></li><% } %></ul>';

// Using jQuery
$('#stage').html(new EJSpeed ({text: myTemplate}).render(theWorld));

// or
$('#stage').html(new EJSpeed ({text: '<h1><%= Data.title %></h1>'}).render(theWorld));
```


## Includes & Partials

EJSpeed has full support for including partials. Partials will automatically inherit the data contexts of their parents, or you can explicitly set what data is scoped within the partial.

#### Example:

*partial.html:*
```html
<ul>
	<% for (var i = 0, len = Data.regions.length; i < len; i++) { %>
		<li><%= Data.regions[i] %></li>
	<% } %>
</ul>
```

*template-with-partial.html:*
```html
<!-- partial inheriting parent context -->
<h1><%= Data.title %></h1>
<%= Fn.include('partial.html') %>
```

#### Example of using same partial with different data:

*Additional JSON data:*
```json
{
    "middleEarth": {
        "title": "Hello Middle Earth",
        "regions": [
            "Eregion",
            "Fangorn",
            "Gondor",
            "Isengard",
            "Lothlorien",
            "Mirkwood",
            "Mordor",
            "Moria",
            "Numenor",
            "Rohan"
        ]
    }
}
```

*template-with-partials-and-separate-contexts.html:*
```html
<!-- same partial with different dataset applied -->
<h1>A Tale of Two Worlds</h1>
<h2>Our World</h2>
<%= Fn.include('partial.html',theWorld) %>
<h2>Middle Earth</h2>
<%= Fn.include('partial.html',middleEarth) %>
```


## Full JS syntax support

Full JS syntax support is a big feature of EJSpeed, not only because you have the ability to write more robust templates or do complex string manipulation, but it also means being able to use other libraries such as D3.js, Moment.js, or Underscore.js in a 'prerender' context in client-side applications. 

The best part about EJSpeed is that it does all of this *as fast as, and in some cases faster than, most "logicless" template engines.* 

#### Example (using Underscore.js):

*template-with-underscore.html:*
```html
<h1><%= Data.title %></h1>
<ul>
	<% _.each(Data.regions, function(region) { %>
		<li><%= region %></li>
	<% }) %>
</ul>
```

## Options

#### Disable Caching
In your Javascript code before calling `new EJSpeed()`, add the following config option:
```javascript
EJSpeed.config({cache: false})
```

#### Use a different template tag
In your Javascript code before calling `new EJSpeed()`, add the following config option:
```javascript
EJSpeed.config({cache: false, type: '{{'}) // enable mustache-style tags
```
