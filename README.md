![ceramicnetwork](https://circleci.com/gh/ceramicstudio/3id-connect.svg?style=shield)
[![](https://img.shields.io/badge/Chat%20on-Discord-orange.svg?style=flat)](https://discord.gg/6VRZpGP)
[![Twitter](https://img.shields.io/twitter/follow/ceramicnetwork?label=Follow&style=social)](https://twitter.com/ceramicnetwork)

# <a name="intro"></a> 3ID-Connect

![3ID Connect Image](./assets/3id-connect_readme-image.png)

3ID user account management in a iframe. An easy way to access a did provider, specifically [ThreeIdProvider](https://github.com/ceramicstudio/js-3id-did-provider) in the browser. It allows users to authenticate, manage, link and permission their 3ID keys to applications. The library [js-3id-did-provider](https://github.com/ceramicstudio/js-3id-did-provider) handles most operations and the parent window (application) communicates with the iframe service over an RPC layer. 3id-connect with Ceramic support is only available at 3id-connect@next and 3idconnect.org at the moment.

## <a name="use"></a> Use

```
npm install 3id-connect@next
```

Example usage with an ethereum provider and related auth provider.

```js
import { ThreeIdConnect,  EthereumAuthProvider } from '@ceramicstudio/3id-connect'

// create instance of 3id-connect
const threeIdConnect = new ThreeIdConnect()

// assuming ethereum provider available or on window
const addresses = await provider.enable()

const authProvider = new EthereumAuthProvider(provider, addresses[0])
await threeIdConnect.connect(authProvider)

const didProvider = await threeIdConnect.getDidProvider()

// now consume didProvider in ceramic clients, idx, dids libraries, etc
```

## <a name="structure"></a> Structure

- **/src** - Core logic and consumable interfaces for clients and iframe
  - **/threeIdConnect.ts** - Application interface (RPC client) to load iframe and return 3ID provider.
  - **/connectService.ts** - Identity wallet instance and RPC 'server' to handle requests
  - **/didProviderProxy.ts** - DID provider interface that relays request through RPC layer
  - **/authProvider** - 3ID connect (client) consumes an auth provider, auth providers can be implemented to support many different blockchain accounts and authentication methods
    - **/abstractAuthProvider.ts** - Interface used to implement a auth provider
    - **/ethereumAuthProvider.ts** - Ethereum auth provider, to link and authenticate with ethereum accounts
- **/iframe** - all html, css, js, design assets for iframe and flow
- **/public** - build assets deployed for iframe

## <a name="development"></a> Development

Clone and install dependencies


#### Run Iframe Locally

```
$ npm run start
```

The iframe will be served locally on port 30001. The iframe service also requires a Ceramic node, by default it will look for a locally running node. The quickest way to run a node is with the Ceramic CLI. 

```
$ npm install -g @ceramicnetwork/cli
& ceramic daemon
```

You can also run the iframe and connect to a remote testnet Ceramic node. 

```
$ npm run start:testnet
```

And lastly connect the iframe to any Ceramic node. 

```
$ CERAMIC_API=https://yourceramicnode:port npm run start
```


#### Run Demo

The Demo application is served on port 30000, and connects to a locally running iframe, as described above. Demo application is found in the `/example` folder. 

```
$ npm run start:demo
```

You can also pass the same options to the local iframe with similar commands. 

```
$ npm run start:demo:testnet
// or 
$ CERAMIC_API=https://yourceramicnode:port npm run start:demo
```

#### Build

```
$ npm run build
```

## Maintainers
[@zachferland](https://github.com/zachferland)
