// Import of net module
const net = require("net");
const server = net.createServer();

server.on("connection", (clientToProxySocket) => {
  clientToProxySocket.once("data", (data) => {
    let isTLSConnection = data.toString().indexOf("CONNECT") !== -1;

    let serverPort = 80;
    let serverAddress;

    if (isTLSConnection) {
      serverPort = 443;
      serverAddress = data
        .toString()
        .split("CONNECT")[1]
        .split(" ")[1]
        .split(":")[0];
    } else {
      serverAddress = data.toString().split("Host: ")[1].split("\r\n")[0];
    }

    // Creating a connection from proxy to destination server
    let proxyToServerSocket = net.createConnection({
      host: serverAddress,
      port: serverPort,
    });

    if (isTLSConnection) {
      clientToProxySocket.write("HTTP/1.1 200 OK\r\n\r\n");
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
      console.log(err);
    });
  });
});

server.on("error", (err) => {
  console.log("Some internal server error occurred");
  console.log(err);
});

server.on("close", () => {
  console.log("Client disconnected");
});

server.listen(
  {
    host: "0.0.0.0",
    port: 6090,
  },
  () => {
    console.log("Server listening on 0.0.0.0:6090");
  }
);
