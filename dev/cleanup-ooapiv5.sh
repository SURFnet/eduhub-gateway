# Allow any json object as response and remove
# 'x-ooapi-extensible-enum' since they clash with the validator and
# validate as plain "string" anyway.
jq '.paths[].get.responses["200"].content["application/json"].schema|={type: "object"}' |
jq '.components.schemas[] |= del(.["x-ooapi-extensible-enum"])' |
# Our validation library does not understand the "explode=false"
# encoding for array values in parameters. This rewrites the spec so
# that we directly match the comma-separated parameter string using a
# regular expression for the "sort" and "expand" parameters.
#
# In other words, instead of matching an array of enums "xxx","yyy",
# we match "^((xxx|yyy)(,(xxx|yyy))*)?$"
jq '
(
  .paths[].get.parameters[]?
  | select(.name=="sort" or .name=="expand")
  | .schema
) |= {
  type: "string",
  pattern: ("^((" + (.items.enum | join("|")) + ")(,(" + (.items.enum | join("|")) + "))*)?$")
}'
