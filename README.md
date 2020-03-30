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

### Run local development
```
npm run dev
```

### Build static site
```
npm run build
```

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
