# Misualizer

[https://misualizer.tezbridge.com/](https://misualizer.tezbridge.com/)

A tool to visualize all possible behaviors and trace all internal transactions to get the whole picture of different entries in contracts.

**This project is currently in early stage.**

## Dev and build
### Requirements
* Node.js > 12
* Parcel
```
npm install -g parcel-bundler
```

Do not forget to install the all dependencies!
```
npm install
```


### Run local development
```
npm run dev
```
Then access `https://127.0.0.1:1234/index.html` to render the local version.

### Build static site
```
npm run build
```
Due to the limitation of github page, the build output directory is `docs/`.

### Run test
After `npm run dev`, open test page [https://localhost:1234/plugin_tester/index.html](https://localhost:1234/plugin_tester/index.html)

### Build static page
```
npm run build
```
Then the static page will be exported to the `docs` folder.

### Documentation
[https://github.com/catsigma/Misualizer/wiki](https://github.com/catsigma/Misualizer/wiki)

## Components
- [x] Michelson behavior emulator
- [x] Text renderer
- [x] Svg rendere
- [x] Web
- [x] SVG render result optimization
- [x] Plugin for third party websites

## Sponsor
[Tezos Foundation](https://tezos.foundation/)

## License
MIT
