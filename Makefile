package-lock.json: package.json
	npm install

# list only non-dev dependencies
deps.json: package-lock.json
	jq <package-lock.json '.dependencies |with_entries(select(.value | .dev != true))|keys' > $@

.PHONY: test

# ensure dependencies are up to date before running npm test
test: package-lock.json
	npm test
