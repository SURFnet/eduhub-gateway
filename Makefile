package-lock.json: package.json
	npm install

# list only non-dev dependencies
deps.json: package-lock.json
	jq <package-lock.json '.dependencies |with_entries(select(.value | .dev != true))|keys' > $@

.PHONY: test ooapiv5-full.json

# ensure dependencies are up to date before running npm test
test: package-lock.json
	npm test

ooapiv5-full.json:
	(cd ooapi-specification/v5 && npx @redocly/openapi-cli bundle --ext=json spec.yaml --force) > ooapiv5-full.json

ooapiv5.json: ooapiv5-full.json
# allow any json object as response and remove
# 'x-ooapi-extensible-enum' since they clash with the validator and
# validate as plain "string" anyway.
	cat $< | \
	jq '.paths[].get.responses["200"].content["application/json"].schema|={type: "object"}' | \
	jq '.components.schemas[] |= del(.["x-ooapi-extensible-enum"])' \
	>$@
