# Corp-Check CLI
If you want to use Corp-Check for more than just as a web tool to check packages for risks, you can integrate the CLI module into your build and deployment process to actually prohibit the deployment of risky packages. The CLI will use the ruleset you define and stop if it encounters a viral license, an unreleased package or an abandoned package will tons of open issues.

# Install
Install to global using npm:
```sh
npm install -g corp-check-cli
```
Install to project using npm:
```sh
npm install --save-dev corp-check-cli
```
# Usage
## Validate npm package
You can identify risks in published npm packages with the `corp-check npm <package>` CLI command. It will let you know how risky the package it is for your project.
```sh
corp-check npm express
```

## Validate project
You can create a report about your product (using your package.json) with `corp-check <path-to-local-source>`. Also you can use your `package-lock.json` with the `--package-lock` option. Using the `--prod` argument will exclude the `devDependencies` from the validation
```sh
corp-check . --package-lock --prod
```

## Npm script
Define your script for corp-check project validation
```json
{
    "scripts": {
        "corp-check": "corp-check ."
    }
}
```
and you can run with npm
```sh
npm run corp-check
```

## Validation rules
Just create a `corp-check-rules.json` in your project root and you can override the [default evaluation rules](https://raw.githubusercontent.com/jaystack/corp-check-rest/master/default-rules.json). With the `--rule-set <path>` option you can have more custom rules.
```sh
corp-check . --rule-set ./my-rules.json
```
If you want to validate an npm package using your custom rules, you have to enable the `--rule-set` option
```sh
corp-check npm express --rule-set ./my-rules.json
```
You can read more about custom rules [here](https://corp-check.corpjs.com/npm)

## Options
```
    -V, --version             output the version number
    --force, -f               force validation
    --verbose, -v             list all warnings
    --rule-set <ruleSetJson>  validation rule set, default: ./corp-check-rules.json
    --log-level <logLevel>    winston log level, default: warn
    --prod                    skip devDependencies
    --package-lock            use package-lock.json file
    -h, --help                output usage information
```

## Notes
Keen-eyed developers will realize that some of the dependencies of Corp-Check CLI yield warnings. Thankfully, it happens because of version checks, not licensing ones. This clearly show that while our open-source world is far from being ideal, each and every one of us make what we can to establish a transparent and clear ecosystem. To avoid any problems, Corp-Check CLI still passes the check when you use corp-check-cli as a dependency.
