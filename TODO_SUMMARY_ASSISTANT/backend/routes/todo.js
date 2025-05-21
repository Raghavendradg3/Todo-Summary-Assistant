import express from "express"
import { pool } from "../config/db.js"
import { authenticateToken } from "../middleware/auth.js"

const router = express.Router()

// Get all todos for the authenticated user
router.get("/", authenticateToken, async (req, res) => {
  try {
    const [todos] = await pool.query("SELECT * FROM todos WHERE user_id = ? ORDER BY created_at DESC", [req.user.id])

    res.json(todos)
  } catch (error) {
    console.error("Get todos error:", error)
    res.status(500).json({ message: "Server error" })
  }
})

// Create a new todo
router.post("/", authenticateToken, async (req, res) => {
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

    res.status(201).json(newTodo[0])
  } catch (error) {
    console.error("Create todo error:", error)
    res.status(500).json({ message: "Server error" })
  }
})

// Get a specific todo
router.get("/:id", authenticateToken, async (req, res) => {
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

// Update a todo
router.patch("/:id", authenticateToken, async (req, res) => {
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

// Delete a todo
router.delete("/:id", authenticateToken, async (req, res) => {
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

export default router
