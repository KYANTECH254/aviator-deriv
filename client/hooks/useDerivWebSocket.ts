"use client"
import { myPref } from "@/lib/Setting"
import { useEffect, useState } from "react"

export const useDerivWebsocket = ({
    token,
    deriv_id,
    websocketUrl, }: any) => {
    const [messages, setMessages] = useState<any>()
    const [socket, setSocket] = useState<any>()
    const [ws_socket_errors, setWs_SocketErrors] = useState('')

    useEffect(
        function () {
            if (!websocketUrl && (!token || !deriv_id)) {
                setSocket(undefined)
                setMessages(undefined)
                return
            }

            let closedByEffect = false
            let pingInterval: ReturnType<typeof setInterval> | undefined
            const ws = new WebSocket(websocketUrl || `${myPref.wsUrl}${deriv_id}`)

            ws.onopen = function () {
                setWs_SocketErrors('')
                setSocket(ws)

                if (!websocketUrl) {
                    ws.send(
                        JSON.stringify({
                            authorize: token,
                        })
                    )
                }

                ws.send(
                    JSON.stringify({
                        ping: 1,
                    })
                )

                pingInterval = setInterval(function () {
                    if (ws.readyState === WebSocket.OPEN) {
                        ws.send(
                            JSON.stringify({
                                ping: 1,
                            })
                        )
                    }
                }, 15000)
            }

            ws.onmessage = function (event) {
                try {
                    const message = JSON.parse(event.data)
                    setMessages(message)
                } catch {
                    setWs_SocketErrors(`Invalid response from trading server`)
                }
            }

            ws.onclose = function () {
                setSocket(undefined)
                if (!closedByEffect) {
                    setWs_SocketErrors(`Connection timed out!`)
                }
            }

            ws.onerror = function (error) {
                if (!closedByEffect) {
                    setWs_SocketErrors(`Connection timed out!`)
                }
                console.log(error)
            }

            return () => {
                closedByEffect = true
                if (pingInterval) {
                    clearInterval(pingInterval)
                }
                ws.close()
            }
        },
        [token, deriv_id, websocketUrl]
    )

    return {
        messages,
        socket,
        ws_socket_errors
    }
}
