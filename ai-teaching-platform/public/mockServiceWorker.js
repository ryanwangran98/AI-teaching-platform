/* eslint-disable */
/* tslint:disable */

/**
 * Mock Service Worker (0.47.4).
 * @see https://github.com/mswjs/msw
 * - Please do NOT modify this file.
 * - Please do NOT serve this file on production.
 */

const INTEGRITY_CHECKSUM = '3d6b9f06410d179a7f7404d4bf4c3c70'
const bypassHeaderName = 'x-msw-bypass'

let clients = {}

self.addEventListener('install', function () {
  self.skipWaiting()
})

self.addEventListener('activate', function (event) {
  event.waitUntil(self.clients.claim())
})

self.addEventListener('message', async function (event) {
  const clientId = event.source.id
  const message = event.data

  switch (message.type) {
    case 'KEEPALIVE_REQUEST': {
      sendToClient(clientId, {
        type: 'KEEPALIVE_RESPONSE',
      })
      break
    }

    case 'INTEGRITY_CHECK': {
      sendToClient(clientId, {
        type: 'INTEGRITY_CHECK_RESULT',
        payload: INTEGRITY_CHECKSUM,
      })
      break
    }

    case 'MOCK_ACTIVATE': {
      clients[clientId] = message.payload
      break
    }

    case 'MOCK_DEACTIVATE': {
      delete clients[clientId]
      break
    }
  }
})

self.addEventListener('fetch', function (event) {
  const { clientId, request } = event
  const requestClone = request.clone()
  const getOriginalResponse = () => fetch(requestClone)

  // Bypass navigation requests.
  if (request.mode === 'navigate') {
    return
  }

  // Bypass requests with the bypass header.
  if (request.headers.get(bypassHeaderName)) {
    request.headers.delete(bypassHeaderName)
    return event.respondWith(getOriginalResponse())
  }

  // Get the current client's mock definition.
  const clientMocks = clients[clientId]

  if (!clientMocks) {
    return
  }

  const { worker } = clientMocks

  if (typeof worker.handleRequest !== 'function') {
    return
  }

  event.respondWith(
    worker.handleRequest(requestClone).catch((error) => {
      console.error('[MSW] Failed to mock a request:', error)
      return getOriginalResponse()
    })
  )
})

function sendToClient(clientId, message) {
  self.clients.get(clientId).then((client) => {
    client.postMessage(message)
  })
}