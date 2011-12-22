# express-endpoint

A tool to create and document api endpoints in a declaritive way.

## Install

    npm install express-endpoint

or

    git clone http://github.com/dokipen/express-endpoint.git
    cd express-endpoint
    npm link

## Demo

http://express-endpoint.herokuapp.com/

## Human contact

rcorsaro@gmail.com

## Warning

This is liable to change in significant ways. I just started working on it.
I'll remove this warning when I feel things are stable.

## Features

  * Flexible, pluggable parameter validation and munging.
  * Free HTML documentation of endpoints.

### TODO

  * Error codes
  * Ack Accept header, respond appropriately
  * Ack request methods
  * Automatically handle jsonp
  * Authentication

## Endpoint

Endpoints can be defined using the module function. It takes a single options
parameter that is an object containing the following properties.

  * path         - The endpoint path as used by the express router. See
                   http://expressjs.com/guide.html#routing for details.
                   (required)
  * aliases      - An array of path aliases for the endpoint.
  * description  - A human readable description of the endpoint. (required)
  * example      - An example URL for the endpoint.
  * parameters   - The set of parameters the endpoint accepts. See below
                   for details.
  * rules        - A set of custom rules to suppliment or override the
                   default rules. Default rules are defined below.
  * handler      - The function(req, res, next) that actually handles the
                   request. See
                   http://expressjs.com/guide.html#creating-a server
                   (required)
                   The validated/sanitized parameters are passed as
                   req.endpont_params
  * app          - The express app object. (required)
  * doc_on_error - If specified, we will display the endpoint documentation
                   and en error message on a validation error.
  * doc_view     - The name of the doc template.
  * doc_path     - A path to the documenation for this endpoint.

## Catalog

Catalog is used to render the documentation for all endpoints. It is called
via the module property function catalog(opts). It takes a single options
parameter that is an object containting the following properties.

  * path         - The catalog path as used by the express router. See
                   http://expressjs.com/guide.html#routing for details.
                   (default: /docs)
  * app          - The express app object. (required)
  * doc_view     - The name of the doc template.

## Parameter Rules

Parameters are defined as an object with the following parameters.

  * name         - The name of the parameter.
  * rules        - An array of rules for the parameter.
  * description  - A detailed description of the parameter.

Rules are specified as strings, with a single optional parameter. The rule
name must match an existing default rule or a custom rule that you defined.
If the rule takes a parameter, it should be appended to the end of the rule
between parenthesis. To define a default rule, the rules would be as follows:

['default(mydefaultvalue)']

For rules that don't take parameters, the parenthesis can be omitted.

['once']

Rules are executed in the order specified. Default rules are described below.

## Rule Definitions

express-endpoint validates and sanitizes parameters via rules.

express-endpoint comes with a set of rules, and custom rules are easily added.
To add rules, set the 'rules' endpoint options. The default rules can still be
used as long as you don't use the same rule name with your rules. Using the
same name as a default rule will override that rule with your implementation.

 * default(v) - Sets the parameter to _v_ if it's not specified. This should
                usually be called first.
 * required   - Ensures the parameter is specified at least once.
 * max(n)     - Ensures the parameter is not specified more then _n_ times.
 * once       - Ensures the parameter is not specified more then one time.
 * url        - Ensures all specified values are valid URLs, and parses them
                using urlparse.js (http://github.com/dokipen/urlparse.js).
 * number     - converts all specified values to numbers, ensuring they are
                valid numbers
 * regex(r)   - Ensures all specified values match the given regex _r_.
 * boolean    - Converts ('1', '', or 'true' is true).
 * callback   - Ensures that the given value is a valid javascript function
                name safe for use with JSONP, and that only one value is
                given.
 * timestamp  - Ensures that the give value is a valid epoch timestamp in
                miliseconds or seconds, and converts to a javascript Date.
                Due to accepting ms or s, dates before 1971 are not accepted
                in seconds. If you are using non-current dates you should
                probably roll your own.

A rule is defined as a function(parameter_name, string_argument) that returns
a validator/sanitizer function(array_of_parameter_values). It should throw an
Error for invalid values, or return a sanitized array of values for valid
values.

Here is an example of defining a custom rule to make sure a value is greater
than or equal to 18. It assumes that the parameter has already been processed
by the 'number' rule.

    { path: '/my/endpoint'
    .. [snip] ..
    , rules:
      { gte18: function(name, arg) {
          return function(vals) {
            return vals.map(function(val) {
              if (val < 18) {
                throw new Error('['+val+'] is less then 18')
              }
            })
          }
        }
      }
    }

You can also look at lib/rules.js for more examples.

## Customizing Catalog/Documentation

TODO

## Ruminations

I choose express since I wanted to use it's router and jade integration. It
could be made to use some other router an rely solely on connect in the future,
but until the need arises, this is how it will stay.

I choose jade because it seems to be the most popular templating engine for
node.js. I wanted something that most people would be able to write in so they
could easily override the doc templates.

It's not simple middleware, but it could be. Since I'm using express' router,
app is passed to endpoint() and endpoint.catalog() where it registers itself
with the router.

