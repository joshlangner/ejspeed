EJSpeed
========
A SPEEDY Javascript templating engine based on EJS (http://embeddedjs.com/), inspired by Rails' ERB (http://ruby-doc.org/stdlib-1.9.3/libdoc/erb/rdoc/ERB.html).

## Fast

* 10x faster than the original EJS
* Ranks with or beats the most popular including Mustache, Handlebars, Dust, and Hogan
* Outperforms most on older versions of IE, including 8 and 7
* Outperforms most on mobile including iOS, Android, and Windows Mobile

## Logical

* Logic. As in full Javascript syntax (if you dare)
* It's recognizable by programmers coming from .NET, Java and even PHP
* Distinguishes between precompiled and post-compiled contexts
* Built-in template caching

## Featured

* Partials support via "Include", including caching of partials

### On the Roadmap

* Add an option to make logicless - losing the capability to execute JS code, but will boost performance 2x-5x or more
* Make it strict-mode compatible
* Add more robust, per-line-per-template logging

## Basic setup

*JSON data:*
```json
{
    "theJSON": {
        "title": "Hello World",
        "continents": [
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
  <% for (var i, len = Data.continents.length; i < len; i++) { %>
		<li><%= Data.continents[i] %></li>
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
$('#stage').html(new EJSpeed ({url: 'template.html'}).render(theJSON));
```


## Includes & Partials

EJSpeed has full support for including partials. Partials will automatically inherit the data contexts of their parents.

#### Example:

*template-with-include.html:*
```html
<h1><%= Data.title %></h1>
<%= Fn.include('partial.html') %>
```

*partial.html:*
```html
<ul>
	<% for (var i, len = Data.continents.length; i < len; i++) { %>
		<li><%= Data.continents[i] %></li>
	<% } %>
</ul>
```

## Full JS syntax support

Full JS syntax support means being able to use other libraries within your precompiled code. Examples might be D3.js, Underscore.js, and more. 

#### Example (using Underscore.js):

*template-with-underscore.html:*
```html
<h1><%= Data.title %></h1>
<ul>
	<% _.each(Data.continents, function(continent) { %>
		<li><%= continent %></li>
	<% }) %>
</ul>
```

## Options

#### Disable Caching
In your Javascript code before calling `new EJSpeed()`, add the following config option:
```javascript
EJSpeed.config({cache: false})
```
