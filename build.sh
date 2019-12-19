rm -rf docs
rm -rf .cache

BROWSER_OPT=true \
parcel build \
  src/web/index.html \
  --no-source-maps --out-dir docs

cp src/web/CNAME docs/
cp src/web/.nojekyll docs/