import { EventEmitter } from 'events'
import ThreeIDResolver from '@ceramicnetwork/3id-did-resolver'
import Ceramic from '@ceramicnetwork/http-client'
import { Wallet as EthereumWallet } from '@ethersproject/wallet'
// These cause Webpack loading to fail at runtime
// import { Network } from '@glif/filecoin-address'
// import { LocalManagedProvider } from '@glif/local-managed-provider'
import { EOSIOProvider } from '@smontero/eosio-local-provider'
import {
  signTx,
  Tx,
  SignMeta,
  createWalletFromMnemonic,
  Wallet as CosmosWallet,
  StdTx,
} from '@tendermint/sig'
import { generateMnemonic } from 'bip39'
import { DID } from 'dids'
import ecc from 'eosjs-ecc'
import { fromString, toString } from 'uint8arrays'
import { AccountID } from "caip"

import {
  CosmosAuthProvider,
  EosioAuthProvider,
  EthereumAuthProvider,
  // FilecoinAuthProvider,
  ThreeIdConnect,
  AuthProvider,
} from '../../src'

// const FILECOIN_PRIVATE_KEY =
//   '7b2254797065223a22736563703235366b31222c22507269766174654b6579223a2257587362654d5176487a366f5668344b637262633045642b31362b3150766a6a554f3753514931355031343d227d'

class CosmosProvider {
  wallet: CosmosWallet

  constructor(wallet: CosmosWallet) {
    this.wallet = wallet
  }

  sign(msg: Tx, metadata: SignMeta): Promise<StdTx> {
    return Promise.resolve(signTx(msg, metadata, this.wallet))
  }
}

class EthereumProvider extends EventEmitter {
  wallet: EthereumWallet

  constructor(wallet: EthereumWallet) {
    super()
    this.wallet = wallet
  }

  send(
    request: { method: string; params: Array<any> },
    callback: (err: Error | null | undefined, res?: any) => void
  ) {
    if (request.method === 'eth_chainId') {
      callback(null, { result: '1' })
    } else if (request.method === 'personal_sign') {
      let message = request.params[0] as string
      if (message.startsWith('0x')) {
        message = toString(fromString(message.slice(2), 'base16'), 'utf8')
      }
      callback(null, { result: this.wallet.signMessage(message) })
    } else {
      callback(new Error(`Unsupported method: ${request.method}`))
    }
  }
}

class EthereumMigrationMockAuthProvider implements AuthProvider {
  async accountId() {
    return new AccountID({
      address: '0x5314846209d781caad6258b0de7c13acb99ef692',
      chainId: `eip155:1`,
    });
  }

  async authenticate(message: string): Promise<string> {
    if (message === 'Add this account as a Ceramic authentication method') {
      return '0xe80f049f93bd9ad99b24ba7cea21271eea92e493bf01e0633821c29760f69381'
    } else if (message === 'This app wants to view and update your 3Box profile.') {
      return '0xda87c0f5ff9d1237f0cf7eeb0d6507e8144038d56ccac1c7479df7bf95f20015'
    } else {
      throw new Error('Mock message signature not supported')
    }
  }

  async createLink(did: string): Promise<LinkProof> {
    throw new Error('CreateLink not required in migration')
  }
}

const ceramic = new Ceramic('http://localhost:7777')
window.ceramic = ceramic

const threeIdConnect = new ThreeIdConnect('iframe.html')
window.threeIdConnect = threeIdConnect

function createCosmosAuthProvider(mnemonic?: string): Promise<CosmosAuthProvider> {
  const wallet = createWalletFromMnemonic(mnemonic ?? generateMnemonic())
  const provider = new CosmosProvider(wallet)
  return Promise.resolve(new CosmosAuthProvider(provider, wallet.address, 'cosmoshub-3'))
}

async function createEosioAuthProvider(seed?: string): Promise<EosioAuthProvider> {
  const privateKey = seed ? ecc.seedPrivate(seed) : await ecc.unsafeRandomKey()
  const publicKey = ecc.privateToPublic(privateKey)
  const keys = { [publicKey]: privateKey }
  const account = 'eostestaccount'
  const provider = new EOSIOProvider({
    chainId: '2a02a0053e5a8cf73a56ba0fda11e4d92e0238a4a2aa74fccf46d5a910746840',
    account,
    keys,
  })
  // const provider = new EOSIOProvider({
  //   chainId: '2a02a0053e5a8cf73a56ba0fda11e4d92e0238a4a2aa74fccf46d5a910746840',
  //   account: 'idx3idctest1',
  //   keys: {
  //     EOS7f7hdusWKXY1cymDLvUL3m6rTLKmdyPi4e6kquSnmfVxxEwVcC:
  //       '5JRzDcbMqvTJxjHeP8vZqZbU9PwvaaTsoQhoVTAs3xBVSZaPB9U',
  //   },
  // })
  return new EosioAuthProvider(provider, 'idx3idctest1')
}

function createEthereumAuthProvider(mnemonic?: string): Promise<EthereumAuthProvider> {
  const wallet = mnemonic ? EthereumWallet.fromMnemonic(mnemonic) : EthereumWallet.createRandom()
  const provider = new EthereumProvider(wallet)
  return Promise.resolve(new EthereumAuthProvider(provider, wallet.address))
}

// async function createFilecoinAuthProvider(
//   privateKey = FILECOIN_PRIVATE_KEY
// ): Promise<FilecoinAuthProvider> {
//   const provider = new LocalManagedProvider(privateKey, Network.MAIN)
//   const addresses = await provider.getAccounts()
//   return new FilecoinAuthProvider(provider, addresses[0])
// }

const providerFactories = {
  cosmos: createCosmosAuthProvider,
  eosio: createEosioAuthProvider,
  ethereum: createEthereumAuthProvider,
  ethereumMockMigration: () => new EthereumMigrationMockAuthProvider(),
  // filecoin: createFilecoinAuthProvider,
}
type Providers = typeof providerFactories

async function createAuthProvider<T extends keyof Providers>(
  type: T,
  seed?: string
): Promise<ReturnType<Providers[T]>> {
  const createProvider = providerFactories[type]
  return await createProvider(seed)
}
window.createAuthProvider = createAuthProvider

function createDID(provider): DID {
  return new DID({ provider, resolver: ThreeIDResolver.getResolver(ceramic) })
}
window.createDID = createDID

async function authenticateDID(authProvider): Promise<DID> {
  await threeIdConnect.connect(authProvider)
  const did = createDID(threeIdConnect.getDidProvider())
  await did.authenticate()
  return did
}
window.authenticateDID = authenticateDID

async function connect() {
  const authProvider = await createAuthProvider('ethereumMockMigration')
  const [accountId, did] = await Promise.all([
    authProvider.accountId(),
    authenticateDID(authProvider),
  ])
  console.log('DID:', { [did.id]: [accountId.toString()] })
}
document.getElementById('connect').addEventListener('click', connect)
