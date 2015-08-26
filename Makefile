SRC = index.js lib/*.js

default:
	@echo "No default task"

include node_modules/make-lint/index.mk
