import express from "express"
import cors from "cors"
import dotenv from "dotenv"
import mysql from "mysql2/promise"
import bcrypt from "bcrypt"
import jwt from "jsonwebtoken"

dotenv.config()

const app = express()
const PORT = process.env.PORT || 5000

// Middleware
app.use(cors({
  origin: process.env.CORS_ORIGIN || 'http://localhost:5173',
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}))
app.use(express.json())

// Database connection
const pool = mysql.createPool({
  host: process.env.DB_HOST || "localhost",
  user: process.env.DB_USER || "root",
  password: process.env.DB_PASSWORD || "",
  database: process.env.DB_NAME || "todo_app",
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
})

// Test database connection
const testDbConnection = async () => {
  try {
    const connection = await pool.getConnection();
    console.log('✅ Database connection successful');
    connection.release();
  } catch (error) {
    console.error('❌ Database connection failed:', error.message);
    process.exit(1);
  }
};

// Call the test connection function
testDbConnection();

// API Documentation endpoint
app.get("/api", (req, res) => {
  res.json({
    message: "Todo API Documentation",
    version: "1.0.0",
    endpoints: {
      auth: {
        register: "POST /api/auth/register - Register a new user",
        login: "POST /api/auth/login - Login user",
      },
      users: {
        me: "GET /api/users/me - Get current user info (requires auth)",
      },
      todos: {
        list: "GET /api/todos - Get all todos (requires auth)",
        create: "POST /api/todos - Create new todo (requires auth)",
        getOne: "GET /api/todos/:id - Get specific todo (requires auth)",
        update: "PATCH /api/todos/:id - Update specific todo (requires auth)",
        delete: "DELETE /api/todos/:id - Delete specific todo (requires auth)",
      },
    },
  })
})

// Request logging middleware
app.use((req, res, next) => {
  console.log(`📨 ${new Date().toISOString()} - ${req.method} ${req.path}`);
  next();
});

// Authentication middleware
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers["authorization"]
  const token = authHeader && authHeader.split(" ")[1]

  if (!token) {
    return res.status(401).json({ message: "Authentication required" })
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || "your_jwt_secret")
    req.user = decoded
    next()
  } catch (error) {
    return res.status(403).json({ message: "Invalid or expired token" })
  }
}

// Routes
// Auth routes
app.post("/api/auth/register", async (req, res) => {
  console.log('📝 Registration attempt for user:', req.body.username);
  const { username, email, password } = req.body

  if (!username || !email || !password) {
    return res.status(400).json({ message: "All fields are required" })
  }

  try {
    // Check if user already exists
    const [existingUsers] = await pool.query("SELECT * FROM users WHERE username = ? OR email = ?", [username, email])

    if (existingUsers.length > 0) {
      console.log('❌ Registration failed: User already exists');
      return res.status(409).json({ message: "Username or email already exists" })
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10)

    // Create user
    const [result] = await pool.query("INSERT INTO users (username, email, password) VALUES (?, ?, ?)", [
      username,
      email,
      hashedPassword,
    ])

    console.log('✅ User registered successfully:', username);
    res.status(201).json({
      message: "User registered successfully",
      userId: result.insertId,
    })
  } catch (error) {
    console.error("❌ Registration error:", error)
    res.status(500).json({ message: "Server error" })
  }
})

app.post("/api/auth/login", async (req, res) => {
  console.log('🔐 Login attempt for user:', req.body.username);
  const { username, password } = req.body

  if (!username || !password) {
    return res.status(400).json({ message: "Username and password are required" })
  }

  try {
    // Find user
    const [users] = await pool.query("SELECT * FROM users WHERE username = ?", [username])

    if (users.length === 0) {
      console.log('❌ Login failed: User not found');
      return res.status(401).json({ message: "Invalid credentials" })
    }

    const user = users[0]

    // Check password
    const isPasswordValid = await bcrypt.compare(password, user.password)

    if (!isPasswordValid) {
      console.log('❌ Login failed: Invalid password');
      return res.status(401).json({ message: "Invalid credentials" })
    }

    // Generate JWT
    const token = jwt.sign({ id: user.id, username: user.username }, process.env.JWT_SECRET || "your_jwt_secret", {
      expiresIn: "24h",
    })

    // Remove password from user object
    const { password: _, ...userWithoutPassword } = user

    console.log('✅ User logged in successfully:', username);
    res.json({
      message: "Login successful",
      token,
      user: userWithoutPassword,
    })
  } catch (error) {
    console.error("❌ Login error:", error)
    res.status(500).json({ message: "Server error" })
  }
})

// User routes
app.get("/api/users/me", authenticateToken, async (req, res) => {
  console.log('👤 Fetching user profile:', req.user.username);
  try {
    const [users] = await pool.query("SELECT id, username, email, created_at FROM users WHERE id = ?", [req.user.id])

    if (users.length === 0) {
      console.log('❌ User not found:', req.user.id);
      return res.status(404).json({ message: "User not found" })
    }

    console.log('✅ User profile fetched successfully');
    res.json(users[0])
  } catch (error) {
    console.error("❌ Get user error:", error)
    res.status(500).json({ message: "Server error" })
  }
})

// Todo routes
app.get("/api/todos", authenticateToken, async (req, res) => {
  console.log('📋 Fetching todos for user:', req.user.username);
  try {
    const [todos] = await pool.query("SELECT * FROM todos WHERE user_id = ? ORDER BY created_at DESC", [req.user.id])

    console.log(`✅ Found ${todos.length} todos`);
    res.json(todos)
  } catch (error) {
    console.error("❌ Get todos error:", error)
    res.status(500).json({ message: "Server error" })
  }
})

app.post("/api/todos", authenticateToken, async (req, res) => {
  console.log('📝 Creating new todo for user:', req.user.username);
  const { title, completed } = req.body

  if (!title) {
    return res.status(400).json({ message: "Title is required" })
  }

  try {
    const [result] = await pool.query("INSERT INTO todos (title, completed, user_id) VALUES (?, ?, ?)", [
      title,
      completed || false,
      req.user.id,
    ])

    const [newTodo] = await pool.query("SELECT * FROM todos WHERE id = ?", [result.insertId])

    console.log('✅ Todo created successfully:', title);
    res.status(201).json(newTodo[0])
  } catch (error) {
    console.error("❌ Create todo error:", error)
    res.status(500).json({ message: "Server error" })
  }
})

app.get("/api/todos/:id", authenticateToken, async (req, res) => {
  try {
    const [todos] = await pool.query("SELECT * FROM todos WHERE id = ? AND user_id = ?", [req.params.id, req.user.id])

    if (todos.length === 0) {
      return res.status(404).json({ message: "Todo not found" })
    }

    res.json(todos[0])
  } catch (error) {
    console.error("Get todo error:", error)
    res.status(500).json({ message: "Server error" })
  }
})

app.patch("/api/todos/:id", authenticateToken, async (req, res) => {
  const { title, completed } = req.body

  try {
    // Check if todo exists and belongs to user
    const [todos] = await pool.query("SELECT * FROM todos WHERE id = ? AND user_id = ?", [req.params.id, req.user.id])

    if (todos.length === 0) {
      return res.status(404).json({ message: "Todo not found" })
    }

    // Update fields that are provided
    const updates = {}
    if (title !== undefined) updates.title = title
    if (completed !== undefined) updates.completed = completed

    if (Object.keys(updates).length === 0) {
      return res.status(400).json({ message: "No fields to update" })
    }

    // Build query dynamically
    const setClause = Object.entries(updates)
      .map(([key, _]) => `${key} = ?`)
      .join(", ")
    const values = [...Object.values(updates), req.params.id, req.user.id]

    await pool.query(`UPDATE todos SET ${setClause} WHERE id = ? AND user_id = ?`, values)

    // Get updated todo
    const [updatedTodos] = await pool.query("SELECT * FROM todos WHERE id = ?", [req.params.id])

    res.json(updatedTodos[0])
  } catch (error) {
    console.error("Update todo error:", error)
    res.status(500).json({ message: "Server error" })
  }
})

app.delete("/api/todos/:id", authenticateToken, async (req, res) => {
  try {
    // Check if todo exists and belongs to user
    const [todos] = await pool.query("SELECT * FROM todos WHERE id = ? AND user_id = ?", [req.params.id, req.user.id])

    if (todos.length === 0) {
      return res.status(404).json({ message: "Todo not found" })
    }

    await pool.query("DELETE FROM todos WHERE id = ? AND user_id = ?", [req.params.id, req.user.id])

    res.json({ message: "Todo deleted successfully" })
  } catch (error) {
    console.error("Delete todo error:", error)
    res.status(500).json({ message: "Server error" })
  }
})

// Start server
app.listen(PORT, () => {
  console.log(`
🚀 Server is running on port ${PORT}
📚 API Documentation available at http://localhost:${PORT}/api
🔌 Database connection initialized
  `)
})

export default app
