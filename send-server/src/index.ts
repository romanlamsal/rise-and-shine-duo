import { serve } from "bun"
import z from "zod"
import { statusService } from "@/lib/status-service.ts"
import index from "./index.html"

const $env = z
    .object({
        MAC_ADDR: z.string(),
        UDP_LISTENER_PORT: z.coerce.number().default(9999),
        UDP_BROADCAST_ADDR: z.string(),
        HTTP_PORT: z.coerce.number().default(4242),
    })
    .parse(process.env)

declare module "bun" {
    // biome-ignore lint/style/noNamespace: this is an augment.
    namespace udp {
        // biome-ignore lint/correctness/noUnusedVariables: this is still an augment.
        interface Socket<DataBinaryType> {
            setBroadcast: (broadcast: boolean) => void
        }
    }
}

let deadmanSignalTimeout: Timer | undefined
const socket = Bun.udpSocket({
    port: $env.UDP_LISTENER_PORT,
    socket: {
        data(_socket, data) {
            const [type, macAddress] = data.toString().split(":")

            if (macAddress !== $env.MAC_ADDR) {
                return
            }

            if (type !== "AWAKE" && type !== "SLEEPING") {
                return
            }

            statusService.setStatus(type.toLowerCase() as Lowercase<typeof type>)

            if (deadmanSignalTimeout) {
                clearTimeout(deadmanSignalTimeout)
            }

            deadmanSignalTimeout = setTimeout(() => {
                console.log("No ping from server after 12s, assuming receiver is sleeping.")
                statusService.setStatus("sleeping")
            }, 12_000)
        },
    },
}).then(s => {
    s.setBroadcast(true)

    setTimeout(() => {
        if (!statusService.current) {
            console.log("No ping from server after 12s, assuming receiver is sleeping.")
            statusService.setStatus("sleeping")
        }
    }, 12_000)

    return s
})

const server = serve({
    port: process.env.PORT,
    routes: {
        // Serve index.html for all unmatched routes.
        "/api/status": {
            async GET(req) {
                const stream = new ReadableStream({
                    start(controller) {
                        const sendStatus = (status: string) => {
                            controller.enqueue(`event: status-update\ndata: ${status}\n\n`)
                        }

                        const heartbeatInterval = setInterval(() => {
                            controller.enqueue(": heartbeat\n\n")
                        }, 5_000)

                        req.signal.addEventListener("abort", () => {
                            clearInterval(heartbeatInterval)
                        })

                        statusService.emitter.on(
                            "status-update",
                            ({ status }) => {
                                sendStatus(status)
                            },
                            req.signal,
                        )

                        if (statusService.current) {
                            sendStatus(statusService.current)
                        }
                    },
                })

                return new Response(stream, {
                    headers: {
                        "Content-Type": "text/event-stream",
                        "Cache-Control": "no-cache",
                        "X-Accell-Buffering": "no",
                        Connection: "keep-alive",
                    },
                })
            },
        },

        "/api/sleep": {
            async GET() {
                socket.then(udpSocket => {
                    udpSocket.send(`LULLABY:${$env.MAC_ADDR}`, $env.UDP_LISTENER_PORT, $env.UDP_BROADCAST_ADDR)
                })
                return new Response("ok")
            },
        },

        "/api/wake": {
            async GET() {
                socket.then(udpSocket => {
                    const buffer = Buffer.concat([
                        Buffer.alloc(6, 0xff),
                        ...new Array(16).fill(Buffer.from($env.MAC_ADDR.replaceAll(":", ""), "hex")),
                    ])

                    udpSocket.send(buffer, $env.UDP_LISTENER_PORT, $env.UDP_BROADCAST_ADDR)
                })
                return new Response("ok")
            },
        },

        "/*": index,
    },

    development: process.env.NODE_ENV !== "production" && {
        // Enable browser hot reloading in development
        hmr: true,

        // Echo console logs from the browser to the server
        console: true,
    },
})

console.log(`🚀 Server running at ${server.url}`)
