package-lock.json: package.json
	npm install

# list only non-dev dependencies
deps.json: package-lock.json
	jq <package-lock.json '.dependencies |with_entries(select(.value | .dev != true))|keys' > $@

.PHONY: test ooapiv5-full.json ooapiv4.json

# ensure dependencies are up to date before running npm test
test: package-lock.json
	npm test

ooapiv5-full.json:
	(cd ooapi-specification/v5 && npx @redocly/openapi-cli bundle --ext=json spec.yaml --force) > ooapiv5-full.json

ooapiv5.json: ooapiv5-full.json
	cat $< | sh dev/cleanup-ooapiv5.sh > $@

ooapiv4.json:
	(cd ooapi-specification/v4 && npx @redocly/openapi-cli bundle --ext=json spec.yaml --force) > ooapiv4.json
