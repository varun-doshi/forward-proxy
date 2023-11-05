const net = require("net");
const app = net.createServer();

const PORT = process.env.PORT || 8080;

app.on("connection", (clientToProxySocket) => {
  console.log("Client connected to Proxy");

  clientToProxySocket.once("data", (data) => {
    console.log(data.toString());
    let isConnectionTLS = data.toString().indexOf("CONNECT") !== -1;

    let serverPort = 80;
    let serverAddr;

    if (isConnectionTLS) {
      serverPort = 443;

      serverAddr = data
        .toString()
        .split("CONNECT")[1]
        .split(" ")[1]
        .split(":")[0];
    } else {
      serverAddr = data.toString().split("Host: ")[1].split("\\n")[0];
    }
    let proxyToServerSocket = net.createConnection(
      {
        host: serverAddr,
        port: serverPort,
      },
      () => {
        console.log("Proxy connected to server");
      }
    );

    if (isConnectionTLS) {
      clientToProxySocket.write("HTTP/1.1 200 OK\\r\\n\\n");
    } else {
      proxyToServerSocket.write(data);
    }

    clientToProxySocket.pipe(proxyToServerSocket);
    proxyToServerSocket.pipe(clientToProxySocket);

    proxyToServerSocket.on("error", (err) => {
      console.log("Proxy to server error");
      console.log(err);
    });

    clientToProxySocket.on("error", (err) => {
      console.log("Client to proxy error");
    });

    app.on("close", () => {
      console.log("Connection closed");
    });
  });
});

app.listen({ host: "0.0.0.0", port: PORT }, () => {
  console.log("Server running on PORT:", PORT);
});
