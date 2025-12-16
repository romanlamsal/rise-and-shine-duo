# Rise and Shine Duo

This project is a remote power management tool designed to wake up and put to sleep a computer on the same local network. It consists of two main components: a `send-server` and a `receive-server`.

## How it works

The `send-server` provides a web interface with buttons to "Wake" and "Sleep" a remote machine. When the "Wake" button is pressed, it sends a Wake-on-LAN "magic packet" containing a pre-configured MAC address. When the "Sleep" button is pressed, it sends a "LULLABY" command via a UDP broadcast. The web interface also displays the current status of the remote machine ("Awake" or "Sleeping").

The `receive-server` runs on the remote machine. It continuously broadcasts an "AWAKE" signal to the network. When it receives a "LULLABY" command from the `send-server`, it will attempt to put the computer to sleep. Currently, the sleep functionality is only implemented for Windows.

## Components

### Send Server

-   A web server that provides a user interface to control the remote machine.
-   The entry point for the `send-server` is `send-server/src/index.ts`.
-   Sends Wake-on-LAN packets and "LULLABY" commands.
-   Listens for "AWAKE" and "SLEEPING` status updates from the `receive-server`.
-   Built with Bun, React, and TypeScript.
-   Includes an API tester to test the API endpoints.

### Receive Server

-   A lightweight server that runs on the remote machine.
-   The entry point for the `receive-server` is `receive-server/index.ts`.
-   Listens for "LULLABY" commands to initiate sleep mode.
-   Broadcasts the machine's "AWAKE" status.
-   Built with Bun and TypeScript.


## Installation

The easiest way to get started is to use `bunx giget` to fetch either the `send-server` or `receive-server` directly.

```bash
# For the send-server
bunx giget gh:romanlamsal/rise-and-shine-duo/send-server my-send-server

# For the receive-server
bunx giget gh:romanlamsal/rise-and-shine-duo/receive-server my-receive-server
```

## Setup

1.  **Configure Environment Variables:** Both servers require environment variables to be set. These include the `MAC_ADDR` of the remote machine, `UDP_LISTENER_PORT`, `UDP_BROADCAST_ADDR`, and `HTTP_PORT`.
2.  **Run the Receive Server:** Start the `receive-server` on the machine you want to control.
3.  **Run the Send Server:** Start the `send-server`. You can then access the web interface in your browser to control the remote machine.
