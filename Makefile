DEV_ARTIFACTS_BUCKET_NAME=artifacts.wxtm-bridge
DEV_REGION=us-east-1
DEV_ARTIFACTS_S3_PREFIX=dev/wxtm-bridge

PROD_ARTIFACTS_BUCKET_NAME=artifacts.wxtm-bridge-prod
PROD_REGION=eu-central-1
PROD_ARTIFACTS_S3_PREFIX=prod/wxtm-bridge


out/ts: $(shell git ls-files "./src/*.[jt]s" --full-name)
	rm -r -f dist && \
	rm -r -f out && \
	rm -f wxtm-bridge-backend.zip wxtm-bridge-migrations.zip wxtm-bridge-subgraph.zip wxtm-bridge-timeout.zip wxtm-bridge-notifications.zip && \
	npm run build && \
	npm run esbuild && \
	touch out/ts

wxtm-bridge-backend.zip: out/ts
	zip $@ -r out/app/*.js node_modules/swagger-ui-dist node_modules/app-root-path

wxtm-bridge-migrations.zip: out/ts
	zip $@ -r out/migrations/*.js dist/migrations node_modules/app-root-path

wxtm-bridge-subgraph.zip: out/ts
	zip $@ -r out/subgraph/*.js node_modules/app-root-path

wxtm-bridge-timeout.zip: out/ts
	zip $@ -r out/timeout/*.js node_modules/app-root-path

wxtm-bridge-notifications.zip: out/ts
	zip $@ -r out/notifications/*.js node_modules/app-root-path

upload-artifact-dev: wxtm-bridge-backend.zip wxtm-bridge-migrations.zip wxtm-bridge-subgraph.zip wxtm-bridge-timeout.zip wxtm-bridge-notifications.zip
	for artifact in $^; do \
	  aws s3 cp $$artifact s3://$(DEV_ARTIFACTS_BUCKET_NAME)/$(DEV_ARTIFACTS_S3_PREFIX)/ --region $(DEV_REGION); \
	done

upload-artifact-prod: wxtm-bridge-backend.zip wxtm-bridge-migrations.zip wxtm-bridge-subgraph.zip wxtm-bridge-timeout.zip wxtm-bridge-notifications.zip
	for artifact in $^; do \
	  aws s3 cp $$artifact s3://$(PROD_ARTIFACTS_BUCKET_NAME)/$(PROD_ARTIFACTS_S3_PREFIX)/ --region $(PROD_REGION); \
	done
