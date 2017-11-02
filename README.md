# corp-check-cli
Cli layer for corp-check

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