# json-schema-web-component
Web Component that Displays a JSON Schema

## beta
:warning: This is in beta.  Please find bugs, submit issues, and provide example JSON Schemas, so we can improve it!


# demo
https://gsa.github.io/json-schema-web-component/

# usage
Copy the [index.js](https://github.com/GSA/json-schema-web-component/blob/master/index.js) file and put it in a script tag and then create an instance of the web component by `<json-schema url='THE URL TO YOUR SCHEMA JSON' />`.
```html
<!DOCTYPE html>
<html style="background: darkblue;">
  <head>
    <title>JSON Schema Web Component Demo</title>
    <script src="./index.js"></script>
  </head>
  <body>
    <div>
      <json-schema url="./example-schema.json" />
    </div>
  </body>
</html>
```

# screenshot
![screenshot](https://raw.githubusercontent.com/GSA/json-schema-web-component/master/Screenshot%202018-11-01%20at%2011.40.36%20PM.png)

# contributing
Please see the file [CONTRIBUTING.md](CONTRIBUTING.md)

# contact
code@gsa.gov
