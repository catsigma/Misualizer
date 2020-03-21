flow
cp -r test/contracts dist/
BROWSER_OPT=true \
parcel \
  src/web/index.html \
  src/web/plugin.js \
  src/web/plugin_tester/index.html \
  --target browser --https