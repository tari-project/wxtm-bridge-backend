DEV_ARTIFACTS_BUCKET_NAME=artifacts.wxtm-bridge
DEV_REGION=us-east-1
DEV_ARTIFACTS_S3_PREFIX=dev/wxtm-bridge-dev


out/ts: $(shell git ls-files "./src/*.[jt]s" --full-name)
	rm -r -f dist && \
	npm run build && \
	npm run esbuild && \
	touch out/ts

wxtm-bridge-backend.zip: out/ts
	zip $@ -r out/app/*.js node_modules/swagger-ui-dist node_modules/app-root-path

wxtm-bridge-migrations.zip: out/ts
	zip $@ -r out/migrations/*.js dist/src/migrations node_modules/app-root-path


upload-artifact-dev: wxtm-bridge-backend.zip wxtm-bridge-migrations.zip
	for artifact in $^; do \
	  aws s3 cp $$artifact s3://$(DEV_ARTIFACTS_BUCKET_NAME)/$(DEV_ARTIFACTS_S3_PREFIX)/ --region $(DEV_REGION); \
	done
