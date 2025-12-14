import { z } from "zod"

console.log("Starting Receive-Server.")

const $env = z
    .object({
        MAC_ADDR: z.string(),
        UDP_BROADCAST_PORT: z.coerce.number().default(9999),
        UDP_BROADCAST_ADDR: z.string(),
        HTTP_PORT: z.coerce.number().default(4242),
    })
    .parse(process.env)

const socket = await Bun.udpSocket({
    socket: {
        data(socket, buf) {
            if (buf.toString() === `LULLABY:${$env.MAC_ADDR}`) {
                console.log("GOING TO SLEEP")
                socket.send(`SLEEPING:${$env.MAC_ADDR}`, $env.UDP_BROADCAST_PORT, $env.UDP_BROADCAST_ADDR)
            }
        },
    },
})

function startBroadcastInterval() {
    return setInterval(() => {
        socket.send(`AWAKE:${$env.MAC_ADDR}`, $env.UDP_BROADCAST_PORT, $env.UDP_BROADCAST_ADDR)
    }, 10_000).toString()
}

if (process.env.STATUS_INTERVAL && !isNaN(parseInt(process.env.STATUS_INTERVAL))) {
    clearInterval(parseInt(process.env.STATUS_INTERVAL))
}

process.env.STATUS_INTERVAL = startBroadcastInterval()
