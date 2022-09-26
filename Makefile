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
# allow any json object as response and remove
# 'x-ooapi-extensible-enum' since they clash with the validator and
# validate as plain "string" anyway.
	cat $< | \
	jq '.paths[].get.responses["200"].content["application/json"].schema|={type: "object"}' | \
	jq '.components.schemas[] |= del(.["x-ooapi-extensible-enum"])' | \
# Our validation library does not understand the "explode=false"
# encoding for array values in parameters. This rewrites the spec so
# that we directly match the comma-separated parameter string using a
# regular expression for the "sort" and "expand" parameters.
#
# In other words, instead of matching an array of enums "xxx","yyy",
# we match "^((xxx|yyy)(,(xxx|yyy))*)?$"
	jq '(.paths[].get.parameters[]? | select(.name=="sort" or .name=="expand") | .schema) |= {type:"string", pattern:("^((" + (.items.enum | join("|")) + ")(,(" + (.items.enum | join("|")) + "))*)?$$")}' \
	>$@

ooapiv4.json:
	(cd ooapi-specification/v4 && npx @redocly/openapi-cli bundle --ext=json spec.yaml --force) > ooapiv4.json
