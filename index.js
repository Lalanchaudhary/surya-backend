const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const connectDB = require("./config/database");
const cors = require("cors");
require("dotenv").config();
const cookieParser = require("cookie-parser");

// Firebase Admin SDK
let admin = null;
let firebaseInitialized = false;
try {
  const serviceAccount = require('./config/firebase-service-account.json');
  if (serviceAccount.project_id && serviceAccount.project_id !== 'your-firebase-project-id') {
    admin = require('firebase-admin');
    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
    });
    firebaseInitialized = true;
  }
} catch (error) {
  // Firebase config not found
}

const app = express();
const server = http.createServer(app);

// ✅ Socket.IO initialization
const allowedOrigins = [
  'http://localhost:3000',
  'http://127.0.0.1:3000',
  'https://www.suryacake.in'
];

const io = new Server(server, {
  cors: {
    origin: allowedOrigins,
    credentials: true
  }
});

const corsOptions = {
  origin: function (origin, callback) {
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
};

app.use(cors(corsOptions));
app.use(cookieParser());
app.use(express.json());

// Import routes
const userRoutes = require("./routes/userRoutes");
const paymentRoutes = require("./routes/paymentRoutes");
const cakeRoutes = require("./routes/cakeRoutes");
const adminRoutes = require("./routes/adminRoutes");
const authRoutes = require("./routes/authRoutes");
const deliveryRoutes = require('./routes/deliveryRoutes');
const addons = require('./routes/Addons');
// Routes
app.use("/users", userRoutes);
app.use("/payment", paymentRoutes);
app.use("/cake", cakeRoutes);
app.use("/admin", adminRoutes);
app.use("/auth", authRoutes);
app.use('/delivery', deliveryRoutes);
app.use('/admin', addons);
// Root route
app.get("/", (req, res) => {
  res.send("Welcome to eggless");
});

// Socket.IO logic
const connectedUsers = new Map();
const adminUsers = new Set();

io.on("connection", (socket) => {
  socket.on("admin_connected", (data) => {
    socket.join("admin_room");
    adminUsers.add(socket.id);
    if (data.userId && data.fcmToken) {
      connectedUsers.set(data.userId, {
        socketId: socket.id,
        fcmToken: data.fcmToken,
        role: 'admin'
      });
    }
    socket.emit("admin_connected", { message: "Admin connected successfully" });
  });

  socket.on("user_connect", (data) => {
    socket.join("user_room");
    if (data.userId && data.fcmToken) {
      connectedUsers.set(data.userId, {
        socketId: socket.id,
        fcmToken: data.fcmToken,
        role: 'user'
      });
    }
    socket.emit("user_connected", { message: "User connected successfully" });
  });

  socket.on("join_admin_room", () => {
    socket.join("admin_room");
    adminUsers.add(socket.id);
  });

  socket.on("join_specific_admin_room", (data) => {
    if (data.adminId) {
      socket.join(`admin_${data.adminId}`);
      console.log(`[Socket] Admin ${data.adminId} joined specific room: admin_${data.adminId}`);
    }
  });

  socket.on("leave_admin_room", () => {
    socket.leave("admin_room");
    adminUsers.delete(socket.id);
  });

  socket.on("new_order", (orderData) => {
    io.to("admin_room").emit("new_order", orderData);
    if (firebaseInitialized) {
      adminUsers.forEach(adminSocketId => {
        const adminSocket = io.sockets.sockets.get(adminSocketId);
        if (adminSocket) {
          const adminUserId = Array.from(connectedUsers.entries())
            .find(([userId, userData]) => userData.socketId === adminSocketId)?.[0];
          if (adminUserId) {
            sendFirebaseNotification(adminUserId, {
              title: "🛍️ New Order Received!",
              body: `Order #${orderData.orderId} received for ₹${orderData.totalAmount}`,
              data: {
                type: 'new_order',
                orderId: orderData.orderId,
                orderData: orderData
              }
            });
          }
        }
      });
    }
  });

  socket.on("update_order_status", (data) => {
    io.to("admin_room").emit("order_status_updated", data);
    if (firebaseInitialized && data.userId) {
      sendFirebaseNotification(data.userId, {
        title: "Order Status Updated",
        body: `Order #${data.orderId} status changed to ${data.status}`,
        data: {
          type: 'order_status_update',
          orderId: data.orderId,
          status: data.status,
          orderData: data
        }
      });
    }
  });

  socket.on("assign_order", (data) => {
    io.to("admin_room").emit("order_assigned", data);
    if (firebaseInitialized && data.deliveryBoyId) {
      sendFirebaseNotification(data.deliveryBoyId, {
        title: "Order Assigned",
        body: `Order #${data.orderId} assigned to you`,
        data: {
          type: 'order_assigned',
          orderId: data.orderId,
          deliveryBoyId: data.deliveryBoyId,
          orderData: data
        }
      });
    }
  });

  socket.on("delivery_boy_status", (data) => {
    io.to("admin_room").emit("delivery_boy_status", data);
    if (firebaseInitialized) {
      adminUsers.forEach(adminSocketId => {
        const adminUserId = Array.from(connectedUsers.entries())
          .find(([userId, userData]) => userData.socketId === adminSocketId)?.[0];
        if (adminUserId) {
          sendFirebaseNotification(adminUserId, {
            title: "Delivery Boy Status",
            body: `${data.deliveryBoyName} is now ${data.status}`,
            data: {
              type: 'delivery_boy_status',
              deliveryBoyId: data.deliveryBoyId,
              deliveryBoyName: data.deliveryBoyName,
              status: data.status,
              statusData: data
            }
          });
        }
      });
    }
  });

  socket.on("send_notification", (data) => {
    if (firebaseInitialized && data.userId && data.notification) {
      sendFirebaseNotification(data.userId, data.notification);
    }
  });

  socket.on("disconnect", () => {
    const disconnectedUserId = Array.from(connectedUsers.entries())
      .find(([userId, userData]) => userData.socketId === socket.id)?.[0];
    if (disconnectedUserId) {
      connectedUsers.delete(disconnectedUserId);
    }
    adminUsers.delete(socket.id);
  });
});

// Firebase Notification Function
async function sendFirebaseNotification(userId, notificationData) {
  if (!firebaseInitialized || !admin) {
    console.log('⚠️ Firebase not initialized. Skipping notification.');
    return;
  }

  try {
    const userData = connectedUsers.get(userId);
    if (!userData || !userData.fcmToken) {
      console.log(`No FCM token found for user: ${userId}`);
      return;
    }

    const message = {
      token: userData.fcmToken,
      notification: {
        title: notificationData.title,
        body: notificationData.body
      },
      data: notificationData.data || {},
      android: {
        notification: {
          channelId: 'order-notifications',
          sound: 'default',
          priority: 'high',
          defaultSound: true,
          defaultVibrateTimings: true,
          color: '#00ADB5'
        }
      },
      apns: {
        payload: {
          aps: {
            sound: 'default',
            badge: 1
          }
        }
      }
    };

    const response = await admin.messaging().send(message);
    console.log('✅ Firebase notification sent successfully:', response);
  } catch (error) {
    console.error('❌ Error sending Firebase notification:', error);
  }
}

// Export globals
global.io = io;
global.admin = admin;
global.connectedUsers = connectedUsers;
global.sendFirebaseNotification = sendFirebaseNotification;
global.firebaseInitialized = firebaseInitialized;

// Server listen
const port = process.env.PORT || 3000;
server.listen(port, () => {
  console.log(`🚀 Server is running on port ${port}`);
  console.log(`📱 Socket.IO server ready for connections`);
  if (firebaseInitialized) {
    console.log(`🔥 Firebase notifications enabled`);
  } else {
    console.log(`⚠️ Firebase notifications disabled - configure Firebase to enable`);
  }
});

// DB Connection
connectDB();
