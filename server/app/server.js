import express from 'express';
import http from 'http';
import bodyParser from 'body-parser';
import cors from 'cors';
import { readFileSync } from 'fs';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));

function getFullPath(path) {
  return join(__dirname, path);
}

const app = express();
const server = http.createServer(app);
const context = '/rest';
const config = JSON.parse(readFileSync(getFullPath('./config.json'), { encoding: 'utf8' }));

function loadProduct() {
  return JSON.parse(readFileSync(getFullPath(config.products), { encoding: 'utf8' }));
}

let products = loadProduct();
let basket = [];
let orderNumber = 0;

app.use(bodyParser.json());
app.use(cors());

// ----- products -----

app.get(context + '/products', function (_req, res) {
  res.send(products);
});

app.get(context + '/products/:id', function (req, res) {
  res.send(products.find((product) => product.id == req.params.id));
});

// ----- basket -----

app.get(context + '/basket', function (_req, res) {
  res.send(basket);
});

app.post(context + '/basket', function (req, res) {
  basket.push(req.body);
  products = products
    .map((product) => {
      if (product.title.toUpperCase() === req.body.title.toUpperCase()) {
        product.stock--;
      }
      return product;
    })
    .filter((product) => product.stock > 0);

  res.status(201).send(req.body);
});

app.post(context + '/basket/confirm', (req, res) => {
  console.log(
    `Order n°${++orderNumber} : ${basket.reduce((total, item) => total + item.price, 0)}€ ${req.body.name} ${
      req.body.address
    } ${req.body.creditCard}`
  );
  basket = [];
  products = loadProduct();
  res.status(200).send({ orderNumber: orderNumber });
});

// ----- reset -----

app.get('/reset', function (_req, res) {
  basket = [];
  products = loadProduct();
  res.status(200).send('reset ok');
});

server.listen(config.port);

console.log(`Express server listening on http://localhost:${server.address().port}`);
