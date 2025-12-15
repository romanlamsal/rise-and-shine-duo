import z from "zod"
import { createTypedEventEmitter } from "./typed-event-emitter.ts"

const events = z.object({
    type: z.literal("status-update"),
    status: z.enum(["awake", "sleeping"]),
})

type Status = z.infer<typeof events>["status"]

const eventEmitter = createTypedEventEmitter(events)
let currentStatus: "awake" | "sleeping" | undefined

export const statusService = {
    get current() {
        return currentStatus
    },
    emitter: eventEmitter,
    setStatus: (nextStatus: Status) => {
        if (currentStatus !== nextStatus) {
            eventEmitter.emit({
                type: "status-update",
                status: nextStatus,
            })
        }
        currentStatus = nextStatus
    },
}
