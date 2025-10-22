import express from 'express';
import { PrismaClient } from '@prisma/client';

const app = express();
app.use(express.json());

const prisma = new PrismaClient();
// postgres에 저장되어 있는 데이터 = 우리가 쓸 수 없음
// prisma client가 Progres 에서 가져 온 데이터를 우리가 사용 할 수 있게 변환 해 줌 = ORM 과정

// users GET all
app.get('/users', async (req, res) => {
  const users = await prisma.user.findMany();
  // 객체 형태의 user 데이터

  res.send(users);
});

// users GET ID
app.get('/users/:id', async (req, res) => {
  // 다이나믹 URL = :id
  // 고정되지 않은 id같은 값을 URL로 써야 할 경우 쓰는 방식
  const id = req.params.id;
  const user = await prisma.user.findUnique({
    where: { id },
    // shortEnd 문법 -> id:id = id 만 써도 됨
  });

  if (user) {
    res.send(user);
  } else {
    res.status(404).send({ message: 'Cannot find given id' });
  }
});

// users POST
app.post('/users', async (req, res) => {
  const data = req.body;
  const user = await prisma.user.create({
    data,
  });

  res.status(201).send(user);
});

// users PATCH
app.patch('/users/:id', async (req, res) => {
  const { id } = req.params;
  const data = req.body;
  const user = await prisma.user.update({
    where: { id },
    data,
  });

  if (user) {
    res.send(user);
  } else {
    res.status(404).send({ message: 'Cannot find given id' });
  }
});

// users DELETE
app.delete('/users/:id', async (req, res) => {
  const id = req.params.id;
  const user = await prisma.user.delete({
    where: { id },
  });

  if (user) {
    res.send(user);
  } else {
    res.status(404).send({ message: 'Cannot find given id' });
  }
});

// ==== Product API Zone ====

// product GET all
app.get('/products', async (req, res) => {
  const count = Number(req.query.count) || 10;
  console.log(count);
  const product = await prisma.product.findMany({
    take: count,
  });

  //   const product = await prisma.product.findMany();

  res.send(product);
});

app.get('/products/:id', async (req, res) => {
  const id = req.params.id;
  const product = await prisma.product.findUnique({
    where: { id },
  });

  if (product) {
    res.send(product);
  } else {
    res.status(404).send({ message: 'cannot find' });
  }
});

// product POST
app.post('/products', async (req, res) => {
  const data = req.body;
  const product = await prisma.product.create({
    data,
  });

  if (product) {
    res.send(product);
  } else {
    res.status(404).send({ message: 'Cannot find given id' });
  }
});

// product PATCH
app.patch('/products/:id', async (req, res) => {
  const id = req.params.id;
  const data = req.body;
  const product = await prisma.product.update({
    where: { id },
    data,
  });

  if (product) {
    res.send(product);
  } else {
    res.status(404).send({ message: 'cannot find' });
  }
});

// product DELETE
app.delete('/products/:id', async (req, res) => {
  const id = req.params.id;
  const product = await prisma.product.delete({
    where: { id },
  });

  if (product) {
    res.send(product);
  } else {
    res.status(404).send({ message: 'cannot find' });
  }
});

app.listen(process.env.PORT || 3000, () => console.log('Server Started'));
