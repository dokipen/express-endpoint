# express-endpoint

A tool to create and document api endpoints in a declaritive way.

## Install

    npm install express-endpoint

or 
   
    git clone http://github.com/dokipen/express-endpoint.git
    cd express-endpoint
    npm link

## Human contact

    rcorsaro@gmail.com

## Warning

    This is liable to change in significant ways. I just started working on it. I'll remove this warning when I feel things are stable.

## Features

  * Flexible, pluggable parameter validation and munging.
  * Free HTML documenation of endpoints.

## Howto

Have a look at examples/test.js

The gist of it is, there are two function available:

  * endpoint(opts) - Define and endpoint
  * endpoint.catalog(opts) - Create a view of the endpoint catalog (all created endpoints)
  
TODO: document all options for both calls, for now look at the example and index.js
  
## Ruminations

I choose express since I wanted to use it's router and jade integration. It could be made to use some other router an rely solely on connect in the future, but until the need arises, this is how it will stay.

I choose jade because it seems to be the most popular templating engine for node.js. I wanted something that most people would be able to write in so they could easily override the doc templates.

It's not simple middleware, but it could be. Since I'm using express' router, app is passed to endpoint() and endpoint.catalog() where it registers itself with the router.

