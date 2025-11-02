const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const cors = require("cors");
import { v4 as uuidv4 } from 'uuid';

const app = express();
app.use(cors());
app.use(express.json());

// In-memory data structures(demo) đổi thành MongoDB sau
const channels = {}; // Channel management
const users = {}; // User management

//REST: tạo channel mới
app.post("/channels", (req, res) => {
  const { name } = req.body;
  const channelId = uuidV4();
  channels[channelId] = { id: channelId, name, messages: [] };
  res.status(201).json(channels[channelId]);
});

app.get("/channels", (req, res) => {
  res.json(Object.values(channels));
});
