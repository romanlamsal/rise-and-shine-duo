import * as os from "node:os"
import { z } from "zod"

declare module "bun" {
    // biome-ignore lint/style/noNamespace: this is an augment.
    namespace udp {
        // biome-ignore lint/correctness/noUnusedVariables: this is still an augment.
        interface Socket<DataBinaryType> {
            setBroadcast: (broadcast: boolean) => void
        }
    }
}

console.log("Starting Receive-Server.")

const $env = z
    .object({
        MAC_ADDR: z.string(),
        UDP_LISTENER_PORT: z.coerce.number().default(9999),
        UDP_BROADCAST_ADDR: z.string(),
        HTTP_PORT: z.coerce.number().default(4242),
    })
    .parse(process.env)

const socket = await Bun.udpSocket({
    port: $env.UDP_LISTENER_PORT,
    socket: {
        data(socket, buf) {
            if (buf.toString() === `LULLABY:${$env.MAC_ADDR}`) {
                console.log("GOING TO SLEEP")

                if (os.platform() !== "win32") {
                    return
                }

                socket.send(`SLEEPING:${$env.MAC_ADDR}`, $env.UDP_LISTENER_PORT, $env.UDP_BROADCAST_ADDR)
                import("./win-sleep.ts").then(({ putPCIntoRuhemodus }) => putPCIntoRuhemodus())
            }
        },
    },
}).then(s => {
    console.log(`Receive-Server: Listening on UDP port ${s.port}.`)
    s.setBroadcast(true)
    return s
})

function startBroadcastInterval() {
    return setInterval(() => {
        socket.send(`AWAKE:${$env.MAC_ADDR}`, $env.UDP_LISTENER_PORT, $env.UDP_BROADCAST_ADDR)
    }, 10_000).toString()
}

if (process.env.STATUS_INTERVAL && !isNaN(parseInt(process.env.STATUS_INTERVAL))) {
    clearInterval(parseInt(process.env.STATUS_INTERVAL))
}

process.env.STATUS_INTERVAL = startBroadcastInterval()
