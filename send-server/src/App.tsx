import "./index.css"
import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button.tsx"

export function App() {
    const [status, setStatus] = useState<"awake" | "sleeping" | "pending">("pending")

    useEffect(() => {
        const eventSource = new EventSource("/api/status")

        eventSource.addEventListener("status-update", event => {
            if (["awake", "sleeping"].includes(event.data)) {
                setStatus(event.data)
            }
        })

        return () => {
            eventSource.close()
        }
    }, [])

    return (
        <div className="space-y-8 [&>*]:block flex flex-col">
            <div>Status: {status}</div>
            <Button onClick={() => fetch("/api/wake")}>WAKE</Button>
            <Button onClick={() => fetch("/api/sleep")}>SLEEP</Button>
        </div>
    )
}

export default App
