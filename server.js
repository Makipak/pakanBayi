// Custom server untuk hosting di cPanel (Passenger/Setup Node.js App).
// Passenger menjalankan file ini langsung dan expect app listen di process.env.PORT.
const { createServer } = require("http");
const next = require("next");

const port = parseInt(process.env.PORT || "3000", 10);
const dev = process.env.NODE_ENV !== "production";
const app = next({ dev });
const handle = app.getRequestHandler();

app.prepare().then(() => {
  createServer((req, res) => {
    handle(req, res);
  }).listen(port, () => {
    console.log(`> Server ready on port ${port}`);
  });
});
