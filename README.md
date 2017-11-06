# CorpCheck CLI
If you want to use CorpCheck for more than just as a web tool to check packages for risks, you can integrate the CLI module into your build and deployment process to actually prohibit the deployment of risky packages. The CLI will use the ruleset you define and stop if it encounters a viral license, an unreleased package or an abandoned package will tons of open issues.

# Install
```
npm install corp-check-cli -g
```
# Usage
## Validate npm package
`corp-check npm <package>`
```
corp-check npm express
```

## Validate project
`corp-check <path-to-local-source>`
```
corp-check .
```

## Options
```
    -V, --version             output the version number
    --force, -f               force validation
    --verbose, -v             list all warnings
    --rule-set <ruleSetJson>  validation rule set, default: ./corp-check-rules.json
    --log-level <logLevel>    winston log level, default: warn
    --prod                    skip devDependencies
    --package-lock            use package-lock.json file
    --yarn-lock               use yarn.lock file
    -h, --help                output usage information
```
