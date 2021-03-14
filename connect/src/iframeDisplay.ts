import { RPCClient, RPCMethodTypes } from 'rpc-utils'
import type { RPCRequest, RPCResponse } from 'rpc-utils'
import { serveCrossOrigin } from '@ceramicnetwork/rpc-postmessage'
import { createClient } from '@ceramicnetwork/rpc-transport'
import { PostMessageTransport, PostMessageTarget } from '@ceramicnetwork/transport-postmessage'
import type { Subscription } from 'rxjs'

const HIDE_IFRAME_STYLE = 'position: fixed; width:0; height:0; border:0; border:none !important'
const DISPLAY_IFRAME_STYLE = 'border:none border:0; z-index: 500; position: fixed; max-width: 100%;'
const IFRAME_TOP = `top: 10px; right: 10px`
const IFRAME_BOTTOM = `bottom: 0px; left: 0px;`

// @ts-ignore
const hide = (iframe: HTMLIFrameElement) => () => (iframe.style = HIDE_IFRAME_STYLE)
const display = (iframe: HTMLIFrameElement) => (
  mobile = false,
  height = '245px',
  width = '440px'
) => {
  // @ts-ignore
  iframe.style = `${DISPLAY_IFRAME_STYLE} width: ${width}; height: ${height}; ${
    mobile ? IFRAME_BOTTOM : IFRAME_TOP
  }`
}

type DisplayMethods = {
  hide: RPCMethodTypes
  display: {
    params: {
      mobile?: boolean
      height?: string
      width?: string
    }
  }
}
type Request = RPCRequest<DisplayMethods, keyof DisplayMethods>
type Response = RPCResponse<DisplayMethods, keyof DisplayMethods>
export class DisplayClientRPC {
  client: RPCClient<DisplayMethods>

  constructor(target: PostMessageTarget) {
    target = target || window.parent
    const transport = new PostMessageTransport<Response, Request>(window, target, {
      postMessageArguments: [window.origin],
    })
    this.client = createClient<DisplayMethods>(transport)
  }

  async hide(): Promise<void> {
    await this.client.request('hide')
  }

  async display(mobile?: boolean, height?: string, width?: string): Promise<void> {
    await this.client.request('display', { mobile, height, width })
  }
}

export const DisplayServerRPC = (iframe: HTMLIFrameElement): Subscription => {
  const callDisplay = display(iframe)

  return serveCrossOrigin<DisplayMethods>(window, {
    ownOrigin: window.origin,
    methods: {
      hide: hide(iframe),
      display: (_event, { mobile, height, width }) => {
        callDisplay(mobile, height, width)
      },
    },
  })
}

export const createIframe = (iframeUrl: string): HTMLIFrameElement => {
  const iframe = document.createElement('iframe')
  iframe.name = 'threeid-connect'
  iframe.className = 'threeid-connect'
  iframe.src = iframeUrl
  // @ts-ignore
  iframe.style = HIDE_IFRAME_STYLE
  // @ts-ignore
  iframe.allowTransparency = true
  // @ts-ignore
  iframe.frameBorder = 0
  return iframe
}